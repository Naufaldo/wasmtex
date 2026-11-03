import { OVERLEAF_ICONS } from '../ui/logo'
import { getCurrentUser, loginUser, logoutUser } from '../auth/auth-store'
import { unzipLatexProject } from '../fs/unzip'
import {
  deleteProject,
  getAllProjects,
  type ProjectItem,
  restoreProject,
  saveProject,
} from './project-store'
import { backupProjectToR2, checkR2StorageAvailable } from './r2-storage'

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
    const currentUser = getCurrentUser()
    const activeCount = this.projects.filter((p) => !p.trashed && !p.archived).length
    const archivedCount = this.projects.filter((p) => p.archived && !p.trashed).length
    const trashCount = this.projects.filter((p) => p.trashed).length

    this.container.innerHTML = `
      <div class="tactical-dash-root">
        <!-- Top Confidential Classification Bar -->
        <div class="tactical-top-strip">
          <div class="top-strip-left">
            <span class="strip-bracket">[</span>
            <span class="strip-text">CLASSIFICATION: OPEN // CORTEX RESEARCH STUDIO // SPEC WASMTEX-V2</span>
            <span class="strip-bracket">]</span>
          </div>
          <div class="top-strip-right">
            <span class="status-indicator-dot">●</span>
            <span class="strip-text">ONLINE // WEBASSEMBLY ENGINE // TEX LIVE 2025 // UTC+07</span>
          </div>
        </div>

        <!-- High-Contrast Eye-Friendly Tactical Navbar -->
        <header class="tactical-navbar">
          <div class="tactical-nav-left">
            <div class="tactical-brand-wrap">
              <span class="tactical-brand-logo">CorTeX</span>
              <span class="tactical-brand-reg">®</span>
              <span class="tactical-brand-spec">/ LATEX RESEARCH STUDIO &amp; WASMTEX CORE</span>
            </div>
          </div>

          <nav class="tactical-nav-center">
            <button class="tactical-nav-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
              [ ALL PROJECTS (${activeCount}) ]
            </button>
            <button class="tactical-nav-btn ${this.currentFilter === 'archived' ? 'active' : ''}" data-filter="archived">
              [ ARCHIVED (${archivedCount}) ]
            </button>
            <button class="tactical-nav-btn ${this.currentFilter === 'trash' ? 'active' : ''}" data-filter="trash">
              [ TRASH (${trashCount}) ]
            </button>
          </nav>

          <div class="tactical-nav-right">
            <button id="dash-r2-sync" class="tactical-icon-toggle" title="Backup ke Cloudflare R2 Bucket">
              ☁ <span class="toggle-mode-label">R2 CLOUD</span>
            </button>
            <button id="dash-theme-toggle" class="tactical-icon-toggle" title="Toggle Light / Dark Mode">
              ${isDark ? OVERLEAF_ICONS.themeSun : OVERLEAF_ICONS.themeMoon}
              <span class="toggle-mode-label">${isDark ? 'LIGHT' : 'DARK'}</span>
            </button>
            ${
              currentUser
                ? `
              <div class="tactical-user-wrap">
                <span class="tactical-user-tag">
                  <span class="user-bracket">&lt;</span>
                  <span class="user-text">OPERATOR // ${escapeHtml(currentUser.name.toUpperCase())}</span>
                  <span class="user-bracket">&gt;</span>
                </span>
                <button id="dash-logout-btn" class="tactical-btn-action" style="font-size:10.5px; padding:3px 8px; margin-left:4px;" title="Keluar / Logout">LOGOUT</button>
              </div>
            `
                : `
              <button id="dash-login-btn" class="tactical-login-btn" title="Login ke CorTeX Studio">
                [ 👤 LOGIN ]
              </button>
            `
            }
          </div>
        </header>

        <!-- Main Scrollable Dashboard Content -->
        <div class="tactical-scroll-content">
          <!-- Split Screen Hero Section (Compact & Eye-Friendly) -->
          <section class="tactical-hero-section">
            <!-- Left Pitch Column -->
            <div class="tactical-hero-left">
              <div>
                <div class="unit-classification-tag">
                  ACADEMIC RESEARCH LAB / WASMTEX COMPILER CORE
                </div>
                <h1 class="hero-headline-serif">
                  Scaling Academic<span class="headline-reg">®</span> Research &amp; LaTeX Intelligence
                </h1>
                <p class="hero-description-mono">
                  Next-generation browser-native LaTeX compilation core powered by WebAssembly. Sub-second incremental compilation, visual-code AST synchronization, and zero-install client runtime.
                </p>

                <div class="hero-action-row">
                  <button id="dash-new-project-btn" class="tactical-cta-btn cta-orange">
                    <span class="bracket-corner tl"></span>
                    <span class="bracket-corner tr"></span>
                    <span class="bracket-corner bl"></span>
                    <span class="bracket-corner br"></span>
                    <span class="cta-inner">+ NEW MANUSCRIPT</span>
                  </button>

                  <label for="dash-import-file-input" class="tactical-cta-btn cta-secondary" title="Upload .tex or .zip">
                    <span class="bracket-corner tl"></span>
                    <span class="bracket-corner tr"></span>
                    <span class="bracket-corner bl"></span>
                    <span class="bracket-corner br"></span>
                    <span class="cta-inner">⬆ IMPORT LATEX</span>
                    <input type="file" id="dash-import-file-input" accept=".tex,.bib,.txt,.zip" style="display:none;" />
                  </label>
                </div>
              </div>

              <!-- Metric Card: 99.8% Box (Compact) -->
              <div class="hero-metric-card">
                <div class="metric-num-box">99.8%</div>
                <div class="metric-text-box">
                  <div class="metric-title">ACCURACY IN AST-LATEX SYNCHRONIZATION</div>
                  <div class="metric-subtitle">SUB-SECOND WASM ENGINE COMPILATION &amp; REAL-TIME PREVIEW</div>
                </div>
              </div>
            </div>

            <!-- Right Telemetry & Radar Column -->
            <div class="tactical-hero-right">
              <div class="tactical-radar-instrument">
                <span class="bracket-corner tl"></span>
                <span class="bracket-corner tr"></span>
                <span class="bracket-corner bl"></span>
                <span class="bracket-corner br"></span>

                <!-- Left & Right Vertical Side Bands -->
                <div class="radar-side-tab tab-left">
                  TEX LIVE 2025 — 2026
                </div>
                <div class="radar-side-tab tab-right">
                  WASM CORE ENGINE: 64MB HEAP
                </div>

                <!-- Instrument Top Bar -->
                <div class="radar-hud-header">
                  <div class="hud-box-log">
                    <div class="hud-log-title">[ SYSTEM LOG ]</div>
                    <div class="hud-log-content">
                      &gt; WASM_INIT: READY (HEAP 64M)<br/>
                      &gt; AST_SYNC: NOMINAL<br/>
                      &gt; TEXMF_DIST: 2025 CACHED
                    </div>
                  </div>
                  <div class="hud-box-freq">
                    <div class="freq-label">LATENCY BUDGET</div>
                    <div class="freq-value">&lt; 142 MS</div>
                  </div>
                </div>

                <!-- Center Concentric Radar Visual -->
                <div class="radar-visual-viewport">
                  <svg class="radar-svg" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Outer Orange Ring -->
                    <circle cx="170" cy="170" r="145" stroke="#FF4D2D" stroke-width="1.5" stroke-dasharray="3 4" class="radar-circle-outer" />
                    <!-- Mid Contrast Ring -->
                    <circle cx="170" cy="180" r="110" stroke="currentColor" stroke-width="1.5" class="radar-circle-mid" />
                    <!-- Inner Cyan Ring -->
                    <circle cx="170" cy="190" r="70" stroke="#38BDF8" stroke-width="1.8" stroke-dasharray="4 3" class="radar-circle-cyan" />
                    <!-- Center Ring -->
                    <circle cx="170" cy="200" r="30" stroke="currentColor" stroke-width="1.2" />
                    <circle cx="170" cy="200" r="4" fill="#FF4D2D" />

                    <!-- Reticle Lines -->
                    <line x1="170" y1="25" x2="170" y2="315" stroke="currentColor" stroke-width="0.8" stroke-opacity="0.35" stroke-dasharray="2 3" />
                    <line x1="25" y1="200" x2="315" y2="200" stroke="currentColor" stroke-width="0.8" stroke-opacity="0.35" stroke-dasharray="2 3" />
                    
                    <!-- Plus Center -->
                    <path d="M162 200H178M170 192V208" stroke="#FF4D2D" stroke-width="1.5" />
                    
                    <text x="35" y="44" class="radar-coord-text">FORMAT: PDFLATEX</text>
                    <text x="35" y="58" class="radar-coord-text">ENGINE: WASM-V2</text>
                    <text x="225" y="44" class="radar-coord-text">SYNC: ACTIVE</text>
                    <text x="225" y="58" class="radar-coord-text">AST: ~0-LATENCY</text>
                  </svg>
                </div>

                <!-- Instrument Bottom Bar -->
                <div class="radar-hud-footer">
                  <div class="hud-mode-code">MODE: CORTEX-PRO // WASMTEX-V2</div>
                  <div class="hud-security-badge">[ AES-512 SECURE ]</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Project Archive & Management Section -->
          <section class="tactical-archive-section">
            <div class="archive-section-header">
              <div class="archive-title-wrap">
                <span class="archive-index">[ 01 ]</span>
                <span class="archive-heading">MANUSCRIPT &amp; RESEARCH ARCHIVE</span>
              </div>
              <div class="archive-search-container">
                <span class="search-terminal-prompt">&gt;_</span>
                <input type="text" id="dash-search-input" class="tactical-search-input" placeholder="SEARCH PROJECTS (TITLE, OWNER, TAG)..." />
                <span class="search-key-badge">CTRL+K</span>
                <button id="dash-search-clear" class="search-clear-btn" style="display:none;" title="Clear search">✕</button>
              </div>
            </div>

            <!-- Tags Filter Chips -->
            <div class="tactical-tags-bar">
              <span class="tags-bar-label">FILTERS:</span>
              <button class="tactical-tag-chip ${this.currentFilter === 'all' ? 'active' : ''}" data-tag="all">[ ALL ]</button>
              <div id="dash-tags-list" class="tags-chips-container"></div>
            </div>

            <!-- Brutalist Table Card -->
            <div class="tactical-table-frame">
              <table class="tactical-table">
                <thead>
                  <tr>
                    <th style="width: 52%;">DOCUMENT TITLE / CLASSIFICATION</th>
                    <th style="width: 18%;">AUTHOR / OPERATOR</th>
                    <th style="width: 18%;">TIMESTAMP</th>
                    <th style="width: 12%; text-align: right;">ACTION</th>
                  </tr>
                </thead>
                <tbody id="dash-table-body"></tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- Bottom Confidential Footer Ribbon -->
        <footer class="tactical-bottom-strip">
          <div class="bottom-strip-content">
            CORTEX ACADEMIC STUDIO // WASMTEX SPEC 2025.1 // LOCAL WASM COMPILER // ALL ENGINE SYSTEMS OPERATIONAL
          </div>
        </footer>

        <!-- Simple Login Modal Dialog -->
        <dialog id="tactical-login-dialog" class="tactical-login-modal">
          <div class="tactical-modal-frame">
            <span class="bracket-corner tl"></span>
            <span class="bracket-corner tr"></span>
            <span class="bracket-corner bl"></span>
            <span class="bracket-corner br"></span>
            <div class="tactical-modal-header">
              <span class="modal-spec-tag">[ IDENTITY AUTHENTICATION // CORTEX CORE ]</span>
              <button type="button" class="modal-close-x" id="modal-login-close" title="Tutup">✕</button>
            </div>
            <form id="tactical-login-form" class="tactical-modal-body">
              <div class="form-field-group">
                <label for="login-operator-id" class="form-field-label">OPERATOR ID / EMAIL</label>
                <input type="text" id="login-operator-id" class="tactical-form-input" placeholder="e.g. researcher@cortex.ai atau Nama Operator" required autofocus />
              </div>
              <div class="form-field-group">
                <label for="login-passphrase" class="form-field-label">SECURITY PASSPHRASE / ACCESS KEY</label>
                <input type="password" id="login-passphrase" class="tactical-form-input" placeholder="••••••••••••" required />
              </div>
              <div class="form-actions-row">
                <button type="submit" class="tactical-cta-btn cta-orange" style="padding: 9px 18px;">
                  <span class="cta-inner">[ ▶ AUTHENTICATE ]</span>
                </button>
                <button type="button" id="btn-guest-login" class="tactical-cta-btn cta-secondary" style="padding: 9px 14px;">
                  <span class="cta-inner">[ GUEST ACCESS ]</span>
                </button>
              </div>
            </form>
          </div>
        </dialog>
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
    const searchClear = this.container.querySelector('#dash-search-clear') as HTMLButtonElement

    searchInput?.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase()
      if (searchClear) {
        searchClear.style.display = q ? 'block' : 'none'
      }
      this.renderProjectRows(q)
    })

    searchClear?.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = ''
        searchClear.style.display = 'none'
        this.renderProjectRows('')
        searchInput.focus()
      }
    })

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInput?.focus()
      }
    })

    const themeToggle = this.container.querySelector('#dash-theme-toggle')
    themeToggle?.addEventListener('click', () => {
      this.options.onToggleTheme()
      this.render()
    })

    // Simple Authentication dialog bindings
    const loginDialog = this.container.querySelector('#tactical-login-dialog') as HTMLDialogElement | null
    const loginBtn = this.container.querySelector('#dash-login-btn')
    const loginClose = this.container.querySelector('#modal-login-close')
    const loginForm = this.container.querySelector('#tactical-login-form')
    const guestBtn = this.container.querySelector('#btn-guest-login')
    const logoutBtn = this.container.querySelector('#dash-logout-btn')

    loginBtn?.addEventListener('click', () => {
      loginDialog?.showModal()
    })

    loginClose?.addEventListener('click', () => {
      loginDialog?.close()
    })

    logoutBtn?.addEventListener('click', () => {
      if (confirm('Keluar dari sesi operator saat ini?')) {
        logoutUser()
        this.render()
      }
    })

    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault()
      const input = (this.container.querySelector('#login-operator-id') as HTMLInputElement)?.value.trim()
      if (input) {
        loginUser(input)
        loginDialog?.close()
        this.render()
      }
    })

    guestBtn?.addEventListener('click', () => {
      loginUser('operator@cortex.ai', 'Operator')
      loginDialog?.close()
      this.render()
    })

    const r2Btn = this.container.querySelector('#dash-r2-sync')
    r2Btn?.addEventListener('click', async () => {
      const status = await checkR2StorageAvailable()
      if (!status.available) {
        alert(
          'Cloudflare R2 Bucket belum terhubung di runtime saat ini.\n\n' +
            'Untuk mengaktifkan penyimpanan dokumen pribadi di R2:\n' +
            '1. Buat bucket: npx wrangler r2 bucket create wasmtex-documents\n' +
            '2. Binding MY_BUCKET sudah disiapkan di wrangler.jsonc\n' +
            '3. Deploy: npm run deploy',
        )
        return
      }

      let successCount = 0
      for (const p of this.projects) {
        const ok = await backupProjectToR2(p)
        if (ok) successCount++
      }
      alert(`Berhasil sinkronisasi ${successCount} dokumen ke Cloudflare R2 Bucket!`)
    })

    this.container.querySelectorAll('.tactical-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentFilter = btn.getAttribute('data-filter') || 'all'
        this.render()
      })
    })

    // Import file handler (.tex, .bib, or auto-unzip .zip)
    const importInput = this.container.querySelector('#dash-import-file-input') as HTMLInputElement
    importInput?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const authorName = getCurrentUser()?.name || 'Operator'
      const id = `proj_${Date.now()}`
      let newProj: ProjectItem

      if (file.name.toLowerCase().endsWith('.zip')) {
        try {
          const buf = await file.arrayBuffer()
          const unzipped = await unzipLatexProject(buf, file.name)
          newProj = {
            id,
            title: unzipped.suggestedTitle,
            owner: authorName,
            lastModified: Date.now(),
            tags: ['Imported', 'ZIP'],
            files: unzipped.files,
          }
        } catch (err: any) {
          alert(`Gagal mengekstrak arsip ZIP: ${err?.message || err}`)
          return
        }
      } else {
        const text = await file.text()
        const title = file.name.replace(/\.[^/.]+$/, '')
        newProj = {
          id,
          title: title || 'Imported Document',
          owner: authorName,
          lastModified: Date.now(),
          tags: ['Imported', 'LaTeX'],
          files: {
            'main.tex': text,
            'refs.bib': '',
          },
        }
      }

      await saveProject(newProj)
      this.projects = await getAllProjects()
      this.options.onOpenProject(newProj)
    })
  }

  private renderTags(): void {
    const listEl = this.container.querySelector('#dash-tags-list')
    if (!listEl) return

    const allTags = new Set<string>()
    this.projects.forEach((p) => p.tags?.forEach((t) => allTags.add(t)))

    if (allTags.size === 0) {
      listEl.innerHTML = `<span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); padding: 4px 6px;">[ NO TAGS ]</span>`
      return
    }

    listEl.innerHTML = Array.from(allTags)
      .map(
        (tag) => `
        <button class="tactical-tag-chip ${this.currentFilter === `tag:${tag}` ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
          [ ${escapeHtml(tag.toUpperCase())} ]
        </button>
      `,
      )
      .join('')

    this.container.querySelectorAll('.tactical-tag-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag')!
        this.currentFilter = tag === 'all' ? 'all' : `tag:${tag}`
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
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="tactical-empty-cell">
            <div class="empty-state-box">
              <span class="empty-icon">[!]</span>
              <span class="empty-title">NO MANUSCRIPTS MATCH CURRENT CRITERIA</span>
              <span class="empty-sub">CLICK "+ NEW MANUSCRIPT" OR "IMPORT LATEX" TO BEGIN CALIBRATION</span>
            </div>
          </td>
        </tr>
      `
      return
    }

    tbody.innerHTML = list
      .map(
        (proj) => `
        <tr class="tactical-row" data-id="${proj.id}">
          <td class="col-title">
            <div class="title-cell-wrap">
              <span class="doc-file-glyph">§</span>
              <div class="title-details">
                <span class="proj-title-link" data-id="${proj.id}">${escapeHtml(proj.title)}</span>
                <div class="proj-tags-list">
                  ${proj.tags?.map((t) => `<span class="tactical-badge">[ ${escapeHtml(t.toUpperCase())} ]</span>`).join(' ') || ''}
                  <button class="tactical-tag-chip btn-add-tag" data-id="${proj.id}" style="padding: 1px 6px; font-size: 10px;" title="Tambah atau ubah tag">+ TAG</button>
                </div>
              </div>
            </div>
          </td>
          <td class="col-owner"><span class="mono-data">${escapeHtml(proj.owner.toUpperCase())}</span></td>
          <td class="col-time"><span class="mono-data">${formatTimeAgo(proj.lastModified)}</span></td>
          <td class="col-actions" style="text-align: right;">
            <div class="action-buttons-wrap">
              <button class="tactical-btn-open" data-id="${proj.id}" title="Open Document">
                OPEN ↗
              </button>
              ${
                proj.trashed
                  ? `<button class="tactical-btn-action btn-restore" data-id="${proj.id}" title="Restore Document">↺</button>`
                  : `<button class="tactical-btn-action btn-delete" data-id="${proj.id}" title="Move to Trash">✕</button>`
              }
            </div>
          </td>
        </tr>
      `,
      )
      .join('')

    tbody.querySelectorAll('.tactical-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.tactical-btn-action') || (e.target as HTMLElement).closest('.btn-add-tag')) return
        const id = row.getAttribute('data-id')!
        const found = this.projects.find((p) => p.id === id)
        if (found) {
          this.options.onOpenProject(found)
        }
      })
    })

    tbody.querySelectorAll('.btn-add-tag').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = (btn as HTMLElement).getAttribute('data-id')!
        const found = this.projects.find((p) => p.id === id)
        if (!found) return
        const input = prompt(`Tag untuk "${found.title}" (pisahkan koma):`, found.tags?.join(', ') || '')
        if (input !== null) {
          found.tags = input.split(',').map((t) => t.trim()).filter(Boolean)
          await saveProject(found)
          this.projects = await getAllProjects()
          this.renderTags()
          this.renderProjectRows(searchQuery)
        }
      })
    })

    tbody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = (btn as HTMLElement).getAttribute('data-id')!
        if (confirm('Pindahkan manuskrip ini ke Trash?')) {
          deleteProject(id).then(async () => {
            this.projects = await getAllProjects()
            this.renderTags()
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
          this.renderTags()
          this.renderProjectRows(searchQuery)
        })
      })
    })
  }

  private promptNewProject(): void {
    const title = prompt('Judul Manuskrip Baru (LaTeX Document):')
    if (!title) return

    const tagInput = prompt('Tag / Kategori (opsional, kosongkan jika tidak ada, pisahkan koma):', '')
    const tags = tagInput ? tagInput.split(',').map((t) => t.trim()).filter(Boolean) : []

    const authorName = getCurrentUser()?.name || 'Operator'
    const id = `proj_${Date.now()}`
    const newProj: ProjectItem = {
      id,
      title,
      owner: authorName,
      lastModified: Date.now(),
      tags,
      files: {
        'main.tex': `\\documentclass[11pt]{article}
\\usepackage{amsmath,amssymb}

\\title{${title}}
\\author{${authorName}}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}
Start writing your manuscript here.

\\end{document}`,
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
