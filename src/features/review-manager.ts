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
        <span class="drawer-title">📝 Track Changes & Review</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="add-suggestion-btn" class="lib-btn lib-btn-primary">+ Propose Edit</button>
          <button class="modal-close-btn" id="review-close">&times;</button>
        </div>
      </div>
      <div class="drawer-filter">
        <button id="tab-suggestions-pending" class="drawer-filter-btn active">Pending</button>
        <button id="tab-suggestions-history" class="drawer-filter-btn">History</button>
      </div>
      <div class="drawer-content" id="suggestions-list"></div>
    `

    document.body.appendChild(panel)
    this.container = panel

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
    }
  }

  private updateBadge(): void {
    const pendingCount = this.suggestions.filter((s) => s.status === 'pending').length
    this.options.onBadgeUpdate?.(pendingCount)
  }

  private promptNewSuggestion(): void {
    const file = this.options.getActiveFile()
    const orig = prompt('Teks asli yang ingin diganti:')
    if (!orig) return
    const repl = prompt('Usulan teks pengganti (revisi):')
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
      listEl.innerHTML = `<div class="lib-empty">Tidak ada usulan revisi ${filter === 'pending' ? 'tertunda' : 'sebelumnya'}.</div>`
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
              <button class="lib-btn lib-btn-sm lib-btn-success btn-accept" data-id="${s.id}">✓ Accept</button>
              <button class="lib-btn lib-btn-sm lib-btn-danger btn-reject" data-id="${s.id}">✗ Reject</button>
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

  private accept(id: string): void {
    const sug = this.suggestions.find((s) => s.id === id)
    if (!sug) return

    const content = this.options.getFileContent(sug.file)
    if (typeof content !== 'string') {
      alert(`File ${sug.file} bukan teks yang valid.`)
      return
    }

    if (!content.includes(sug.originalText)) {
      alert(`Teks asli "${sug.originalText}" tidak ditemukan di file ${sug.file}. Kemungkinan sudah diubah.`)
      return
    }

    const updated = content.replace(sug.originalText, sug.suggestedText)
    this.options.setFileContent(sug.file, updated)
    sug.status = 'accepted'
    saveSuggestions(this.suggestions)
    this.updateBadge()
    this.renderList('pending')
    this.options.onRecompile()
    alert('Revisi berhasil diterima dan diterapkan ke naskah!')
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
