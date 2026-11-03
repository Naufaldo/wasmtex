export interface TextComment {
  id: string
  file: string
  line: number
  selectedText: string
  commentText: string
  author: string
  timestamp: number
  resolved: boolean
}

const STORAGE_KEY = 'wasmtex_project_comments'

export function getComments(): TextComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveComments(comments: TextComment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments))
  } catch {
    // Ignore quota errors
  }
}

export interface CommentsPanelOptions {
  getActiveFile: () => string
  getActiveSelection: () => { text: string; line: number } | null
  onJumpToLine: (file: string, line: number) => void
  onBadgeUpdate?: (count: number) => void
}

export class CommentsPanel {
  private container: HTMLElement | null = null
  private options: CommentsPanelOptions
  private comments: TextComment[] = []
  private isOpen = false

  constructor(options: CommentsPanelOptions) {
    this.options = options
    this.comments = getComments()
    this.updateBadge()
  }

  toggle(): void {
    if (this.isOpen) {
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
        <span class="drawer-title">💬 Document Comments</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="add-comment-btn" class="lib-btn lib-btn-primary">+ New Comment</button>
          <button class="modal-close-btn" id="drawer-close">&times;</button>
        </div>
      </div>
      <div class="drawer-filter">
        <button id="tab-comments-active" class="drawer-filter-btn active">Active</button>
        <button id="tab-comments-resolved" class="drawer-filter-btn">Resolved</button>
      </div>
      <div class="drawer-content" id="comments-list"></div>
    `

    document.body.appendChild(panel)
    this.container = panel
    this.isOpen = true

    panel.querySelector('#drawer-close')?.addEventListener('click', () => this.close())

    panel.querySelector('#add-comment-btn')?.addEventListener('click', () => {
      this.promptNewComment()
    })

    panel.querySelector('#tab-comments-active')?.addEventListener('click', (e) => {
      panel.querySelectorAll('.drawer-filter-btn').forEach((b) => b.classList.remove('active'))
      ;(e.target as HTMLElement).classList.add('active')
      this.renderList(false)
    })

    panel.querySelector('#tab-comments-resolved')?.addEventListener('click', (e) => {
      panel.querySelectorAll('.drawer-filter-btn').forEach((b) => b.classList.remove('active'))
      ;(e.target as HTMLElement).classList.add('active')
      this.renderList(true)
    })

    this.renderList(false)
  }

  close(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
      this.isOpen = false
    }
  }

  private updateBadge(): void {
    const activeCount = this.comments.filter((c) => !c.resolved).length
    this.options.onBadgeUpdate?.(activeCount)
  }

  private promptNewComment(): void {
    const file = this.options.getActiveFile()
    const sel = this.options.getActiveSelection() || { text: 'General comment', line: 1 }

    const text = prompt(`Komentar untuk "${sel.text.slice(0, 30)}..." (Baris ${sel.line}):`)
    if (!text) return

    const newComment: TextComment = {
      id: `comm_${Date.now()}`,
      file,
      line: sel.line,
      selectedText: sel.text,
      commentText: text,
      author: 'Reviewer',
      timestamp: Date.now(),
      resolved: false,
    }

    this.comments.unshift(newComment)
    saveComments(this.comments)
    this.updateBadge()
    this.renderList(false)
  }

  private renderList(showResolved: boolean): void {
    if (!this.container) return
    const listEl = this.container.querySelector('#comments-list')
    if (!listEl) return

    const filtered = this.comments.filter((c) => c.resolved === showResolved)

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="lib-empty">Tidak ada komentar ${showResolved ? 'terselesaikan' : 'aktif'}.</div>`
      return
    }

    listEl.innerHTML = filtered
      .map(
        (c) => `
        <div class="comment-card ${c.resolved ? 'resolved' : ''}" data-id="${c.id}">
          <div class="comment-card-header">
            <span class="comment-author">👤 ${escapeHtml(c.author)}</span>
            <span class="comment-time">${formatRelativeTime(c.timestamp)}</span>
          </div>
          <div class="comment-anchor" title="Click to view in editor">
            📍 <em>"${escapeHtml(c.selectedText)}"</em> (line ${c.line})
          </div>
          <div class="comment-body">${escapeHtml(c.commentText)}</div>
          <div class="comment-actions">
            ${
              c.resolved
                ? `<button class="lib-btn lib-btn-sm lib-btn-outline btn-reopen" data-id="${c.id}">Reopen</button>`
                : `<button class="lib-btn lib-btn-sm lib-btn-success btn-resolve" data-id="${c.id}">✓ Resolve</button>`
            }
            <button class="lib-btn lib-btn-sm lib-btn-danger btn-delete" data-id="${c.id}">Delete</button>
          </div>
        </div>
      `,
      )
      .join('')

    listEl.querySelectorAll('.comment-anchor').forEach((el) => {
      el.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.comment-card')
        const id = card?.getAttribute('data-id')
        const item = this.comments.find((c) => c.id === id)
        if (item) {
          this.options.onJumpToLine(item.file, item.line)
        }
      })
    })

    listEl.querySelectorAll('.btn-resolve').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id')
        const target = this.comments.find((c) => c.id === id)
        if (target) {
          target.resolved = true
          saveComments(this.comments)
          this.updateBadge()
          this.renderList(showResolved)
        }
      })
    })

    listEl.querySelectorAll('.btn-reopen').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id')
        const target = this.comments.find((c) => c.id === id)
        if (target) {
          target.resolved = false
          saveComments(this.comments)
          this.updateBadge()
          this.renderList(showResolved)
        }
      })
    })

    listEl.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id')
        this.comments = this.comments.filter((c) => c.id !== id)
        saveComments(this.comments)
        this.updateBadge()
        this.renderList(showResolved)
      })
    })
  }
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
