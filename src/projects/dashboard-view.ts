import { APP_LOGO_SVG, OVERLEAF_ICONS } from '../ui/logo'
import {
  deleteProject,
  getAllProjects,
  type ProjectItem,
  restoreProject,
  saveProject,
} from './project-store'

export interface DashboardViewOptions {
  onOpenProject: (project: ProjectItem) => void
  onToggleTheme: () => void
  isDarkMode: () => boolean
}

export class DashboardView {
  private container: HTMLElement
  private options: DashboardViewOptions
  private projects: ProjectItem[] = []
  private currentFilter: 'all' | 'archived' | 'trash' | string = 'all'

  constructor(container: HTMLElement, options: DashboardViewOptions) {
    this.container = container
    this.options = options
  }

  async init(): Promise<void> {
    this.projects = await getAllProjects()
    this.render()
  }

  private render(): void {
    const isDark = this.options.isDarkMode()
    this.container.innerHTML = `
      <div class="dash-root">
        <!-- Dashboard Left Sidebar -->
        <aside class="dash-sidebar">
          <div class="dash-brand-box">
            ${APP_LOGO_SVG}
            <span class="dash-brand-text">CorTeX</span>
          </div>

          <div class="dash-new-btn-box">
            <button id="dash-new-project-btn" class="dash-new-btn">
              <span style="font-size: 18px; font-weight: bold; margin-right: 6px;">+</span> New Project
            </button>
          </div>

          <nav class="dash-nav">
            <a href="#" class="dash-nav-item ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
              <span class="dash-nav-icon">📁</span> All Projects
            </a>
            <a href="#" class="dash-nav-item ${this.currentFilter === 'archived' ? 'active' : ''}" data-filter="archived">
              <span class="dash-nav-icon">📦</span> Archived Projects
            </a>
            <a href="#" class="dash-nav-item ${this.currentFilter === 'trash' ? 'active' : ''}" data-filter="trash">
              <span class="dash-nav-icon">🗑️</span> Trash
            </a>
          </nav>

          <div class="dash-tags-section">
            <div class="dash-tags-header">TAGS / FOLDERS</div>
            <div id="dash-tags-list" class="dash-tags-list"></div>
          </div>
        </aside>

        <!-- Dashboard Main Panel -->
        <main class="dash-main">
          <!-- Topbar -->
          <header class="dash-topbar">
            <div class="dash-search-box">
              <span class="dash-search-icon">${OVERLEAF_ICONS.search}</span>
              <input type="text" id="dash-search-input" class="dash-search-input" placeholder="Search projects by title, owner, or tag..." />
            </div>

            <div class="dash-top-actions">
              <button id="dash-theme-toggle" class="dash-icon-btn" title="Toggle Light/Dark Theme">
                ${isDark ? OVERLEAF_ICONS.themeSun : OVERLEAF_ICONS.themeMoon}
              </button>
              <div class="dash-user-pill">
                <span class="dash-user-avatar">👤</span>
                <span class="dash-user-name">Personal Workspace</span>
              </div>
            </div>
          </header>

          <!-- Projects Table Header & List -->
          <div class="dash-content">
            <div class="dash-table-card">
              <table class="dash-table">
                <thead>
                  <tr>
                    <th style="width: 50%;">Title</th>
                    <th style="width: 20%;">Owner</th>
                    <th style="width: 18%;">Last modified</th>
                    <th style="width: 12%; text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="dash-table-body"></tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    `

    this.bindEvents()
    this.renderTags()
    this.renderProjectRows()
  }

  private bindEvents(): void {
    const newBtn = this.container.querySelector('#dash-new-project-btn')
    newBtn?.addEventListener('click', () => this.promptNewProject())

    const searchInput = this.container.querySelector('#dash-search-input') as HTMLInputElement
    searchInput?.addEventListener('input', () => {
      this.renderProjectRows(searchInput.value.trim().toLowerCase())
    })

    const themeToggle = this.container.querySelector('#dash-theme-toggle')
    themeToggle?.addEventListener('click', () => {
      this.options.onToggleTheme()
      this.render()
    })

    this.container.querySelectorAll('.dash-nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        this.currentFilter = item.getAttribute('data-filter') || 'all'
        this.render()
      })
    })
  }

  private renderTags(): void {
    const listEl = this.container.querySelector('#dash-tags-list')
    if (!listEl) return

    const allTags = new Set<string>()
    this.projects.forEach((p) => p.tags?.forEach((t) => allTags.add(t)))

    listEl.innerHTML = Array.from(allTags)
      .map(
        (tag) => `
        <a href="#" class="dash-tag-item ${this.currentFilter === `tag:${tag}` ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
          <span class="dash-tag-bullet">🏷️</span> ${escapeHtml(tag)}
        </a>
      `,
      )
      .join('')

    listEl.querySelectorAll('.dash-tag-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        const tag = item.getAttribute('data-tag')!
        this.currentFilter = `tag:${tag}`
        this.render()
      })
    })
  }

  private renderProjectRows(searchQuery = ''): void {
    const tbody = this.container.querySelector('#dash-table-body')
    if (!tbody) return

    let list = this.projects.filter((p) => {
      if (this.currentFilter === 'trash') return p.trashed === true
      if (p.trashed) return false
      if (this.currentFilter === 'archived') return p.archived === true
      if (p.archived) return false
      if (this.currentFilter.startsWith('tag:')) {
        const tag = this.currentFilter.replace('tag:', '')
        return p.tags?.includes(tag)
      }
      return true
    })

    if (searchQuery) {
      list = list.filter((p) => {
        return (
          p.title.toLowerCase().includes(searchQuery) ||
          p.owner.toLowerCase().includes(searchQuery) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchQuery))
        )
      })
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="dash-empty-td">Tidak ada proyek yang ditemukan.</td></tr>`
      return
    }

    tbody.innerHTML = list
      .map(
        (proj) => `
        <tr class="dash-row" data-id="${proj.id}">
          <td class="dash-col-title">
            <div class="dash-title-wrap">
              <span class="dash-file-icon">📄</span>
              <div class="dash-title-text-group">
                <span class="dash-project-link" data-id="${proj.id}">${escapeHtml(proj.title)}</span>
                <div class="dash-row-tags">
                  ${proj.tags?.map((t) => `<span class="dash-pill-tag">${escapeHtml(t)}</span>`).join('') || ''}
                </div>
              </div>
            </div>
          </td>
          <td class="dash-col-owner">${escapeHtml(proj.owner)}</td>
          <td class="dash-col-time">${formatTimeAgo(proj.lastModified)}</td>
          <td class="dash-col-actions" style="text-align: right;">
            ${
              proj.trashed
                ? `<button class="dash-action-btn btn-restore" data-id="${proj.id}" title="Restore">↺</button>`
                : `<button class="dash-action-btn btn-delete" data-id="${proj.id}" title="Delete">🗑️</button>`
            }
          </td>
        </tr>
      `,
      )
      .join('')

    tbody.querySelectorAll('.dash-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.dash-action-btn')) return
        const id = row.getAttribute('data-id')!
        const found = this.projects.find((p) => p.id === id)
        if (found) {
          this.options.onOpenProject(found)
        }
      })
    })

    tbody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = (btn as HTMLElement).getAttribute('data-id')!
        if (confirm('Pindahkan proyek ini ke Trash?')) {
          deleteProject(id).then(async () => {
            this.projects = await getAllProjects()
            this.renderProjectRows(searchQuery)
          })
        }
      })
    })

    tbody.querySelectorAll('.btn-restore').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = (btn as HTMLElement).getAttribute('data-id')!
        restoreProject(id).then(async () => {
          this.projects = await getAllProjects()
          this.renderProjectRows(searchQuery)
        })
      })
    })
  }

  private promptNewProject(): void {
    const title = prompt('Judul Proyek Baru (LaTeX Manuscript):')
    if (!title) return

    const tagInput = prompt('Tag / Kategori (misal: "Journal", "Thesis", "Ade"):', 'General')
    const tags = tagInput ? tagInput.split(',').map((t) => t.trim()).filter(Boolean) : ['General']

    const id = `proj_${Date.now()}`
    const newProj: ProjectItem = {
      id,
      title,
      owner: 'You',
      lastModified: Date.now(),
      tags,
      files: {
        'main.tex': `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{cite}

\\title{${title}}
\\author{Author Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Your abstract goes here.
\\end{abstract}

\\section{Introduction}
Start writing your manuscript here.

\\bibliographystyle{plain}
\\bibliography{refs}
\\end{document}`,
        'refs.bib': '',
      },
    }

    saveProject(newProj).then(async () => {
      this.projects = await getAllProjects()
      this.options.onOpenProject(newProj)
    })
  }
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString('id-ID')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
