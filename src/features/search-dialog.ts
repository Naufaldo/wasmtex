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
      <div class="search-modal">
        <div class="modal-header">
          <span class="modal-title">🔍 Project Search & Replace</span>
          <button class="modal-close-btn" id="search-modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="search-inputs">
            <input type="text" id="search-query" class="search-field" placeholder="Search across all files (Regex supported)..." autofocus />
            <input type="text" id="replace-query" class="search-field" placeholder="Replace with..." />
            <div class="search-options">
              <label><input type="checkbox" id="search-match-case" /> Match Case</label>
              <label><input type="checkbox" id="search-regex" /> Use Regex</label>
              <button id="search-replace-btn" class="lib-btn lib-btn-primary" style="margin-left: auto;">Replace All</button>
            </div>
          </div>
          <div class="search-results-summary" id="search-summary">Type to search...</div>
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
        (overlay.querySelector('#search-summary') as HTMLElement).textContent = 'Type to search...'
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

    summary.textContent = `Found ${matches.length} match${matches.length === 1 ? '' : 'es'} in ${new Set(matches.map((m) => m.file)).size} file(s)`

    if (matches.length === 0) {
      list.innerHTML = '<div class="lib-empty">No results found</div>'
      return
    }

    list.innerHTML = matches
      .map(
        (m) => `
        <div class="search-result-item" data-file="${escapeHtml(m.file)}" data-line="${m.line}">
          <div class="search-result-header">
            <span class="search-result-file">📄 ${escapeHtml(m.file)}</span>
            <span class="search-result-line">Line ${m.line}</span>
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

    alert(`Replaced matches in ${modifiedCount} file(s).`)
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
