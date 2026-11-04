import { t } from '../ui/i18n'
import { tacticalPrompt, tacticalAlert } from '../ui/tactical-dialog'

export interface TextSuggestion {
  id: string
  file: string
  originalText: string
  suggestedText: string
  author: string
  timestamp: number
  status: 'pending' | 'accepted' | 'rejected'
}

const STORAGE_KEY = 'wasmtex_project_suggestions'

export function getSuggestions(): TextSuggestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSuggestions(suggestions: TextSuggestion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions))
  } catch {
    // Ignore quota errors
  }
}

export interface ReviewManagerOptions {
  getActiveFile: () => string
  getFileContent: (file: string) => string | Uint8Array | null
  setFileContent: (file: string, content: string) => void
  onRecompile: () => void
  onBadgeUpdate?: (count: number) => void
}

export class ReviewManager {
  private container: HTMLElement | null = null
  private options: ReviewManagerOptions
  private suggestions: TextSuggestion[] = []
  private isReviewModeEnabled = false

  constructor(options: ReviewManagerOptions) {
    this.options = options
    this.suggestions = getSuggestions()
    this.updateBadge()
  }

  isReviewMode(): boolean {
    return this.isReviewModeEnabled
  }

  setReviewMode(enabled: boolean): void {
    this.isReviewModeEnabled = enabled
  }

  togglePanel(): void {
    if (this.container) {
      this.close()
    } else {
      this.open()
    }
  }

  open(): void {
    if (this.container) this.container.remove()

    const panel = document.createElement('div')
    panel.className = 'comments-drawer'
    panel.innerHTML = `
      <div class="drawer-header">
        <div class="header-title-block">
          <span class="modal-spec-tag">[ ${t('LACAK PERUBAHAN & TINJAUAN // TRACK CHANGES', 'TRACK CHANGES & EDIT REVIEW')} ]</span>
          <span class="drawer-title">📝 ${t('Lacak Perubahan & Revisi', 'Track Changes & Review')}</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="add-suggestion-btn" class="tactical-cta-btn cta-blue" style="padding: 5px 12px; font-size: 11px;">
            <span class="cta-inner">+ ${t('AJUKAN REVISI', 'PROPOSE EDIT')}</span>
          </button>
          <button class="modal-close-btn" id="review-close" title="${t('Tutup', 'Close')}">&times;</button>
        </div>
      </div>
      <div class="drawer-filter">
        <button id="tab-suggestions-pending" class="drawer-filter-btn active">${t('Tertunda', 'Pending')}</button>
        <button id="tab-suggestions-history" class="drawer-filter-btn">${t('Riwayat', 'History')}</button>
      </div>
      <div class="drawer-content" id="suggestions-list"></div>
    `

    document.body.appendChild(panel)
    this.container = panel
    document.getElementById('view-workspace')?.classList.add('has-side-drawer')
    setTimeout(() => window.dispatchEvent(new Event('resize')), 250)

    panel.querySelector('#review-close')?.addEventListener('click', () => this.close())

    panel.querySelector('#add-suggestion-btn')?.addEventListener('click', () => {
      this.promptNewSuggestion()
    })

    panel.querySelector('#tab-suggestions-pending')?.addEventListener('click', (e) => {
      panel.querySelectorAll('.drawer-filter-btn').forEach((b) => b.classList.remove('active'))
      ;(e.target as HTMLElement).classList.add('active')
      this.renderList('pending')
    })

    panel.querySelector('#tab-suggestions-history')?.addEventListener('click', (e) => {
      panel.querySelectorAll('.drawer-filter-btn').forEach((b) => b.classList.remove('active'))
      ;(e.target as HTMLElement).classList.add('active')
      this.renderList('history')
    })

    this.renderList('pending')
  }

  close(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
      document.getElementById('view-workspace')?.classList.remove('has-side-drawer')
      setTimeout(() => window.dispatchEvent(new Event('resize')), 250)
    }
  }

  private updateBadge(): void {
    const pendingCount = this.suggestions.filter((s) => s.status === 'pending').length
    this.options.onBadgeUpdate?.(pendingCount)
  }

  private async promptNewSuggestion(): Promise<void> {
    const file = this.options.getActiveFile()
    const orig = await tacticalPrompt({
      title: t('Teks Asli', 'Original Text'),
      specTag: t('REVISI // TEKS ASLI', 'REVISION // ORIGINAL TEXT'),
      message: t('Teks asli yang ingin diganti dalam dokumen:', 'Original text to replace in the document:'),
      placeholder: 'e.g. In conclusion, we show...',
      multiline: true,
    })
    if (!orig) return
    const repl = await tacticalPrompt({
      title: t('Usulan Revisi', 'Proposed Revision'),
      specTag: t('REVISI // USULAN BARU', 'REVISION // PROPOSED TEXT'),
      message: t('Usulan teks pengganti (revisi akademik):', 'Proposed replacement text (academic revision):'),
      placeholder: 'e.g. Crucially, empirical evidence demonstrates...',
      multiline: true,
    })
    if (repl === null) return

    const newSug: TextSuggestion = {
      id: `sug_${Date.now()}`,
      file,
      originalText: orig,
      suggestedText: repl,
      author: 'Reviewer',
      timestamp: Date.now(),
      status: 'pending',
    }

    this.suggestions.unshift(newSug)
    saveSuggestions(this.suggestions)
    this.updateBadge()
    this.renderList('pending')
  }

  private renderList(filter: 'pending' | 'history'): void {
    if (!this.container) return
    const listEl = this.container.querySelector('#suggestions-list')
    if (!listEl) return

    const filtered = this.suggestions.filter((s) =>
      filter === 'pending' ? s.status === 'pending' : s.status !== 'pending',
    )

    if (filtered.length === 0) {
      const stateText = filter === 'pending' ? t('tertunda', 'pending') : t('riwayat', 'history')
      listEl.innerHTML = `<div class="lib-empty">${t(
        `Tidak ada usulan revisi ${stateText}.`,
        `No ${stateText} suggestions.`
      )}</div>`
      return
    }

    listEl.innerHTML = filtered
      .map(
        (s) => `
        <div class="comment-card ${s.status}" data-id="${s.id}">
          <div class="comment-card-header">
            <span class="comment-author">👤 ${escapeHtml(s.author)}</span>
            <span class="suggestion-status-badge ${s.status}">${s.status.toUpperCase()}</span>
          </div>
          <div class="suggestion-diff-box">
            <div class="suggestion-del"><del>- ${escapeHtml(s.originalText)}</del></div>
            <div class="suggestion-ins"><ins>+ ${escapeHtml(s.suggestedText)}</ins></div>
          </div>
          ${
            s.status === 'pending'
              ? `
            <div class="comment-actions">
              <button class="tactical-btn-action btn-accept" style="font-size: 10px; padding: 3px 8px; color: #22c55e;" data-id="${s.id}">✓ ${t('Terima', 'Accept')}</button>
              <button class="tactical-btn-action btn-reject" style="font-size: 10px; padding: 3px 8px; color: #ef4444;" data-id="${s.id}">✗ ${t('Tolak', 'Reject')}</button>
            </div>
          `
              : ''
          }
        </div>
      `,
      )
      .join('')

    listEl.querySelectorAll('.btn-accept').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id')
        this.accept(id!)
      })
    })

    listEl.querySelectorAll('.btn-reject').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id')
        this.reject(id!)
      })
    })
  }

  private async accept(id: string): Promise<void> {
    const sug = this.suggestions.find((s) => s.id === id)
    if (!sug) return

    const content = this.options.getFileContent(sug.file)
    if (typeof content !== 'string') {
      await tacticalAlert({
        title: t('Berkas Tidak Valid', 'Invalid File'),
        message: t(`Berkas ${sug.file} bukan teks yang valid.`, `File ${sug.file} is not a valid text file.`),
        type: 'error',
      })
      return
    }

    if (!content.includes(sug.originalText)) {
      await tacticalAlert({
        title: t('Teks Tidak Ditemukan', 'Text Not Found'),
        message: t(`Teks asli "${sug.originalText}" tidak ditemukan di berkas ${sug.file}. Kemungkinan sudah diubah.`, `Original text "${sug.originalText}" not found in ${sug.file}. It may have been edited.`),
        type: 'warning',
      })
      return
    }

    const updated = content.replace(sug.originalText, sug.suggestedText)
    this.options.setFileContent(sug.file, updated)
    sug.status = 'accepted'
    saveSuggestions(this.suggestions)
    this.updateBadge()
    this.renderList('pending')
    this.options.onRecompile()
    await tacticalAlert({
      title: t('Revisi Diterapkan', 'Revision Applied'),
      specTag: t('REVISI // SELESAI', 'REVISION // COMPLETED'),
      message: t('Revisi berhasil diterima dan diterapkan ke naskah!', 'Revision accepted and applied to manuscript!'),
      type: 'success',
    })
  }

  private reject(id: string): void {
    const sug = this.suggestions.find((s) => s.id === id)
    if (!sug) return

    sug.status = 'rejected'
    saveSuggestions(this.suggestions)
    this.updateBadge()
    this.renderList('pending')
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
