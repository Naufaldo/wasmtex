import { t } from '../ui/i18n'

export interface SearchMatch {
  file: string
  line: number
  text: string
  index: number
}

export interface SearchDialogOptions {
  getFiles: () => string[]
  getFileContent: (file: string) => string | Uint8Array | null
  setFileContent: (file: string, content: string) => void
  onOpenFile: (file: string, line?: number) => void
  onRecompile?: () => void
}

export class SearchDialog {
  private overlay: HTMLElement | null = null
  private options: SearchDialogOptions

  constructor(options: SearchDialogOptions) {
    this.options = options
  }

  open(): void {
    if (this.overlay) {
      this.overlay.remove()
    }

    const overlay = document.createElement('div')
    overlay.className = 'feature-modal-overlay'
    overlay.innerHTML = `
      <div class="search-modal tactical-modal-frame">
        <div class="modal-header">
          <div class="header-title-block">
            <span class="modal-spec-tag">[ ${t('PENCARIAN PROYEK // SEARCH & REPLACE', 'PROJECT SEARCH & REPLACE // GREP')} ]</span>
            <h2 class="modal-title">🔍 ${t('Cari & Ganti Kode', 'Project Search & Replace')}</h2>
          </div>
          <button class="modal-close-btn" id="search-modal-close" title="${t('Tutup', 'Close')}">&times;</button>
        </div>
        <div class="modal-body">
          <div class="search-inputs">
            <input type="text" id="search-query" class="search-field" placeholder="${t('Cari di seluruh berkas (Regex didukung)...', 'Search across all files (Regex supported)...')}" autofocus />
            <input type="text" id="replace-query" class="search-field" placeholder="${t('Ganti dengan...', 'Replace with...')}" />
            <div class="search-options">
              <label class="search-opt-label"><input type="checkbox" id="search-match-case" /> ${t('Cocokkan Huruf Besar/Kecil', 'Match Case')}</label>
              <label class="search-opt-label"><input type="checkbox" id="search-regex" /> ${t('Gunakan Regex', 'Use Regex')}</label>
              <button id="search-replace-btn" class="tactical-cta-btn cta-orange" style="margin-left: auto; padding: 6px 14px;">
                <span class="cta-inner">${t('GANTI SEMUA', 'REPLACE ALL')}</span>
              </button>
            </div>
          </div>
          <div class="search-results-summary" id="search-summary">${t('Ketik untuk mulai mencari...', 'Type to search...')}</div>
          <div class="search-results-list" id="search-results"></div>
        </div>
      </div>
    `

    document.body.appendChild(overlay)
    this.overlay = overlay

    const closeBtn = overlay.querySelector('#search-modal-close')
    closeBtn?.addEventListener('click', () => this.close())
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close()
    })

    const searchInput = overlay.querySelector('#search-query') as HTMLInputElement
    const replaceInput = overlay.querySelector('#replace-query') as HTMLInputElement
    const matchCaseBox = overlay.querySelector('#search-match-case') as HTMLInputElement
    const regexBox = overlay.querySelector('#search-regex') as HTMLInputElement
    const replaceBtn = overlay.querySelector('#search-replace-btn') as HTMLButtonElement

    const doSearch = () => {
      const q = searchInput.value
      if (!q) {
        (overlay.querySelector('#search-summary') as HTMLElement).textContent = t(
          'Ketik untuk mulai mencari...',
          'Type to search...'
        )
        ;(overlay.querySelector('#search-results') as HTMLElement).innerHTML = ''
        return
      }

      const matches = this.findMatches(q, matchCaseBox.checked, regexBox.checked)
      this.renderResults(matches)
    }

    searchInput.addEventListener('input', doSearch)
    matchCaseBox.addEventListener('change', doSearch)
    regexBox.addEventListener('change', doSearch)

    replaceBtn.addEventListener('click', () => {
      const q = searchInput.value
      const replacement = replaceInput.value
      if (!q) return
      this.replaceAll(q, replacement, matchCaseBox.checked, regexBox.checked)
      doSearch()
    })

    // Keyboard shortcut Escape
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close()
        window.removeEventListener('keydown', onKey)
      }
    }
    window.addEventListener('keydown', onKey)
  }

  close(): void {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }
  }

  private findMatches(query: string, matchCase: boolean, isRegex: boolean): SearchMatch[] {
    const matches: SearchMatch[] = []
    const files = this.options.getFiles()

    let regex: RegExp
    try {
      regex = new RegExp(isRegex ? query : escapeRegExp(query), matchCase ? 'g' : 'gi')
    } catch {
      return []
    }

    for (const file of files) {
      const content = this.options.getFileContent(file)
      if (typeof content !== 'string') continue

      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i]!
        regex.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = regex.exec(lineText)) !== null) {
          matches.push({
            file,
            line: i + 1,
            text: lineText,
            index: m.index,
          })
          if (!regex.global) break
        }
      }
    }

    return matches
  }

  private renderResults(matches: SearchMatch[]): void {
    if (!this.overlay) return
    const summary = this.overlay.querySelector('#search-summary') as HTMLElement
    const list = this.overlay.querySelector('#search-results') as HTMLElement

    const fileCount = new Set(matches.map((m) => m.file)).size
    summary.textContent = t(
      `Ditemukan ${matches.length} kecocokan pada ${fileCount} berkas`,
      `Found ${matches.length} match${matches.length === 1 ? '' : 'es'} in ${fileCount} file(s)`
    )

    if (matches.length === 0) {
      list.innerHTML = `<div class="lib-empty">${t('Tidak ada hasil yang ditemukan', 'No results found')}</div>`
      return
    }

    list.innerHTML = matches
      .map(
        (m) => `
        <div class="search-result-item" data-file="${escapeHtml(m.file)}" data-line="${m.line}">
          <div class="search-result-header">
            <span class="search-result-file">📄 ${escapeHtml(m.file)}</span>
            <span class="search-result-line">${t('Baris', 'Line')} ${m.line}</span>
          </div>
          <div class="search-result-snippet">${escapeHtml(m.text.trim())}</div>
        </div>
      `,
      )
      .join('')

    list.querySelectorAll('.search-result-item').forEach((item) => {
      item.addEventListener('click', () => {
        const file = item.getAttribute('data-file')!
        const line = Number(item.getAttribute('data-line')!)
        this.options.onOpenFile(file, line)
        this.close()
      })
    })
  }

  private replaceAll(query: string, replacement: string, matchCase: boolean, isRegex: boolean): void {
    const files = this.options.getFiles()
    let regex: RegExp
    try {
      regex = new RegExp(isRegex ? query : escapeRegExp(query), matchCase ? 'g' : 'gi')
    } catch {
      return
    }

    let modifiedCount = 0
    for (const file of files) {
      const content = this.options.getFileContent(file)
      if (typeof content !== 'string') continue

      if (regex.test(content)) {
        const updated = content.replace(regex, replacement)
        this.options.setFileContent(file, updated)
        modifiedCount++
      }
    }

    alert(
      t(
        `Berhasil mengganti teks di ${modifiedCount} berkas.`,
        `Replaced matches in ${modifiedCount} file(s).`
      )
    )
    this.options.onRecompile?.()
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
