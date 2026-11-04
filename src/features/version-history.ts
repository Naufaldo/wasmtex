import { t } from '../ui/i18n'
import { tacticalPrompt, tacticalConfirm, tacticalAlert } from '../ui/tactical-dialog'

export interface ProjectVersion {
  id: string
  timestamp: number
  label: string
  isNamed: boolean
  files: Record<string, string>
  fileCount: number
}

const DB_NAME = 'wasmtex_version_history'
const STORE_NAME = 'versions'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveVersion(
  label: string,
  filesMap: Record<string, string>,
  isNamed = true,
): Promise<ProjectVersion> {
  const db = await openDB()
  const version: ProjectVersion = {
    id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    label,
    isNamed,
    files: filesMap,
    fileCount: Object.keys(filesMap).length,
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(version)
    req.onsuccess = () => resolve(version)
    req.onerror = () => reject(req.error)
  })
}

export async function getVersions(): Promise<ProjectVersion[]> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => {
        const list = (req.result as ProjectVersion[]) || []
        list.sort((a, b) => b.timestamp - a.timestamp)
        resolve(list)
      }
      req.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function deleteVersion(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export interface VersionHistoryDialogOptions {
  getCurrentFiles: () => Record<string, string>
  onRestore: (files: Record<string, string>) => void
}

export class VersionHistoryDialog {
  private overlay: HTMLElement | null = null
  private options: VersionHistoryDialogOptions
  private versions: ProjectVersion[] = []
  private selectedVersion: ProjectVersion | null = null

  constructor(options: VersionHistoryDialogOptions) {
    this.options = options
  }

  async open(): Promise<void> {
    if (this.overlay) this.overlay.remove()

    this.versions = await getVersions()
    if (this.versions.length > 0) {
      this.selectedVersion = this.versions[0]!
    }

    const overlay = document.createElement('div')
    overlay.className = 'feature-modal-overlay'
    overlay.innerHTML = `
      <div class="version-modal tactical-modal-frame">
        <div class="modal-header">
          <div class="header-title-block">
            <span class="modal-spec-tag">[ ${t('RIWAYAT VERSI // VERSION SNAPSHOTS', 'PROJECT VERSION HISTORY // SNAPSHOTS')} ]</span>
            <h2 class="modal-title">🕒 ${t('Riwayat Versi Proyek', 'Project Version History')}</h2>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button id="ver-snapshot-btn" class="tactical-cta-btn cta-blue" style="padding: 6px 14px;">
              <span class="cta-inner">📸 ${t('LABELI VERSI SAAT INI', 'LABEL CURRENT VERSION')}</span>
            </button>
            <button class="modal-close-btn" id="ver-modal-close" title="${t('Tutup', 'Close')}">&times;</button>
          </div>
        </div>
        <div class="version-modal-body">
          <aside class="version-sidebar">
            <div id="version-list" class="version-list"></div>
          </aside>
          <main class="version-preview-panel">
            <div class="version-preview-header">
              <span id="ver-detail-title" class="ver-detail-title">${t('Detail Versi', 'Version Details')}</span>
              <button id="ver-restore-btn" class="tactical-cta-btn cta-orange" style="display: none; padding: 6px 14px;">
                <span class="cta-inner">↺ ${t('KEMBALIKAN KE VERSI INI', 'RESTORE THIS VERSION')}</span>
              </button>
            </div>
            <div id="version-preview-content" class="version-preview-content"></div>
          </main>
        </div>
      </div>
    `

    document.body.appendChild(overlay)
    this.overlay = overlay

    overlay.querySelector('#ver-modal-close')?.addEventListener('click', () => this.close())
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close()
    })

    overlay.querySelector('#ver-snapshot-btn')?.addEventListener('click', async () => {
      const label = await tacticalPrompt({
        title: t('Labeli Versi Baru', 'Label Current Version'),
        specTag: t('HISTORI // SNAPSHOT BARU', 'HISTORY // NEW SNAPSHOT'),
        message: t(
          'Nama/label versi baru (contoh: "Draft Revisi Bab 2", "Pre-submission"):',
          'New version label (e.g. "Draft Revision Ch 2", "Pre-submission"):'
        ),
        defaultValue: t('Snapshot Manual', 'Manual Snapshot'),
      })
      if (label) {
        const currentFiles = this.options.getCurrentFiles()
        await saveVersion(label, currentFiles, true)
        this.versions = await getVersions()
        this.selectedVersion = this.versions[0] || null
        this.renderList()
        this.renderPreview()
      }
    })

    overlay.querySelector('#ver-restore-btn')?.addEventListener('click', async () => {
      if (!this.selectedVersion) return
      const confirmed = await tacticalConfirm({
        title: t('Kembalikan Versi', 'Restore Version'),
        specTag: t('HISTORI // RESTORE DOKUMEN', 'HISTORY // RESTORE DOCUMENT'),
        message: t(
          `Yakin ingin me-restore proyek ke versi "${this.selectedVersion.label}"? Perubahan saat ini yang belum dilabeli akan ditimpa.`,
          `Are you sure you want to restore to version "${this.selectedVersion.label}"? Unsaved changes will be overwritten.`
        ),
        confirmText: t('YA, RESTORE', 'YES, RESTORE'),
        danger: true,
      })
      if (confirmed) {
        this.options.onRestore(this.selectedVersion.files)
        this.close()
        await tacticalAlert({
          title: t('Versi Dipulihkan', 'Version Restored'),
          specTag: t('HISTORI // RESTORE SELESAI', 'HISTORY // RESTORE COMPLETED'),
          message: t(
            `Proyek berhasil dikembalikan ke versi "${this.selectedVersion.label}".`,
            `Project restored to version "${this.selectedVersion.label}".`
          ),
          type: 'success',
        })
      }
    })

    this.renderList()
    this.renderPreview()
  }

  close(): void {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }
  }

  private renderList(): void {
    if (!this.overlay) return
    const listEl = this.overlay.querySelector('#version-list')
    if (!listEl) return

    if (this.versions.length === 0) {
      listEl.innerHTML = `<div class="lib-empty">${t(
        'Belum ada versi yang disimpan. Klik "Label Current Version" untuk menyimpan snapshot.',
        'No versions saved yet. Click "Label Current Version" to save a snapshot.'
      )}</div>`
      return
    }

    listEl.innerHTML = this.versions
      .map(
        (v) => `
        <div class="version-card ${this.selectedVersion?.id === v.id ? 'active' : ''}" data-id="${v.id}">
          <div class="version-card-label">${escapeHtml(v.label)}</div>
          <div class="version-card-time">${formatDate(v.timestamp)} · ${v.fileCount} file(s)</div>
        </div>
      `,
      )
      .join('')

    listEl.querySelectorAll('.version-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id')
        const found = this.versions.find((v) => v.id === id)
        if (found) {
          this.selectedVersion = found
          this.renderList()
          this.renderPreview()
        }
      })
    })
  }

  private renderPreview(): void {
    if (!this.overlay) return
    const titleEl = this.overlay.querySelector('#ver-detail-title') as HTMLElement
    const restoreBtn = this.overlay.querySelector('#ver-restore-btn') as HTMLElement
    const contentEl = this.overlay.querySelector('#version-preview-content') as HTMLElement

    if (!this.selectedVersion) {
      titleEl.textContent = t('Detail Versi', 'Version Details')
      restoreBtn.style.display = 'none'
      contentEl.innerHTML = `<div class="lib-empty">${t('Pilih versi dari daftar di sebelah kiri', 'Select a version from the left panel')}</div>`
      return
    }

    const v = this.selectedVersion
    titleEl.textContent = `${v.label} (${formatDate(v.timestamp)})`
    restoreBtn.style.display = 'inline-flex'

    const fileEntries = Object.entries(v.files)
    contentEl.innerHTML = `
      <div class="version-files-summary">
        ${fileEntries
          .map(([filename, text]) => {
            const previewLines = text.split('\n').slice(0, 10).join('\n')
            return `
              <div class="version-file-block">
                <div class="version-file-name">📄 ${escapeHtml(filename)} (${text.length} chars)</div>
                <pre class="version-file-code"><code>${escapeHtml(previewLines)}...</code></pre>
              </div>
            `
          })
          .join('')}
      </div>
    `
  }
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
