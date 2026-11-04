import { t } from '../ui/i18n'

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
        <div class="header-title-block">
          <span class="modal-spec-tag">[ ${t('DISKUSI & KOMENTAR // COMMENTS', 'DOCUMENT COMMENTS // REVIEW')} ]</span>
          <span class="drawer-title">💬 ${t('Komentar Dokumen', 'Document Comments')}</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="add-comment-btn" class="tactical-cta-btn cta-blue" style="padding: 5px 12px; font-size: 11px;">
            <span class="cta-inner">+ ${t('KOMENTAR BARU', 'NEW COMMENT')}</span>
          </button>
          <button class="modal-close-btn" id="drawer-close" title="${t('Tutup', 'Close')}">&times;</button>
        </div>
      </div>
      <div class="drawer-filter">
        <button id="tab-comments-active" class="drawer-filter-btn active">${t('Aktif', 'Active')}</button>
        <button id="tab-comments-resolved" class="drawer-filter-btn">${t('Selesai', 'Resolved')}</button>
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

    const promptMsg = t(
      `Komentar untuk "${sel.text.slice(0, 30)}..." (Baris ${sel.line}):`,
      `Comment on "${sel.text.slice(0, 30)}..." (Line ${sel.line}):`
    )
    const text = prompt(promptMsg)
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
      const stateText = showResolved ? t('terselesaikan', 'resolved') : t('aktif', 'active')
      listEl.innerHTML = `<div class="lib-empty">${t(
        `Tidak ada komentar ${stateText}.`,
        `No ${stateText} comments.`
      )}</div>`
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
                ? `<button class="tactical-btn-action btn-reopen" style="font-size: 10px; padding: 3px 8px;" data-id="${c.id}">${t('Buka Lagi', 'Reopen')}</button>`
                : `<button class="tactical-btn-action btn-resolve" style="font-size: 10px; padding: 3px 8px; color: #22c55e;" data-id="${c.id}">✓ ${t('Selesai', 'Resolve')}</button>`
            }
            <button class="tactical-btn-action btn-delete" style="font-size: 10px; padding: 3px 8px; color: #ef4444;" data-id="${c.id}">${t('Hapus', 'Delete')}</button>
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
