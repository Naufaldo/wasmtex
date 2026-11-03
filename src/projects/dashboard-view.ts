import { OVERLEAF_ICONS } from '../ui/logo'
import { getLang, t, toggleLang, type Lang } from '../ui/i18n'
import {
  changePassword,
  changeUsername,
  getCurrentUser,
  logoutUser,
} from '../auth/auth-store'
import { unzipLatexProject } from '../fs/unzip'
import {
  addPaperToProjectBibtex,
  deletePaper,
  getAllPapers,
  type ResearchPaper,
  savePaper,
} from '../library/library-store'
import {
  deleteProject,
  getAllProjects,
  type ProjectItem,
  saveProject,
} from './project-store'
import { backupProjectToR2, checkR2StorageAvailable } from './r2-storage'
import { TEMPLATES } from '../fs/templates'

export interface DashboardViewOptions {
  onOpenProject: (project: ProjectItem) => void
  onToggleTheme: () => void
  isDarkMode: () => boolean
  onLogout?: () => void
  onToggleLang?: () => void
}

export class DashboardView {
  private container: HTMLElement
  private options: DashboardViewOptions
  private projects: ProjectItem[] = []
  private papers: ResearchPaper[] = []
  private selectedLibraryProject = 'all'
  private currentFilter: 'all' | 'templates' | 'library' | 'archived' | 'trash' | string = 'all'
  private templateCategoryFilter = 'all'
  private templateSearchQuery = ''

  constructor(container: HTMLElement, options: DashboardViewOptions) {
    this.container = container
    this.options = options
  }

  async init(): Promise<void> {
    const currentUser = getCurrentUser()
    this.projects = await getAllProjects(currentUser)
    this.papers = await getAllPapers()
    this.render()
  }

  private render(): void {
    const isDark = this.options.isDarkMode()
    const currentUser = getCurrentUser()
    const lang = getLang()
    const activeProjects = this.projects.filter((p) => !p.trashed && !p.archived)
    const activeCount = activeProjects.length

    const journalCount = activeProjects.filter((p) => {
      const lt = p.tags?.map((t) => t.toLowerCase()) || []
      const tl = p.title.toLowerCase()
      return (
        lt.some((t) => ['journal', 'ieee', 'elsevier', 'nature', 'sensors', 'paper'].includes(t)) ||
        tl.includes('journal') ||
        tl.includes('ieee') ||
        tl.includes('elsevier') ||
        tl.includes('nature') ||
        tl.includes('paper')
      )
    }).length

    const slidesCount = activeProjects.filter((p) => {
      const lt = p.tags?.map((t) => t.toLowerCase()) || []
      const tl = p.title.toLowerCase()
      return (
        lt.some((t) => ['presentation', 'beamer', 'slides'].includes(t)) ||
        tl.includes('beamer') ||
        tl.includes('presentation') ||
        tl.includes('slides')
      )
    }).length

    const thesisCount = activeProjects.filter((p) => {
      const lt = p.tags?.map((t) => t.toLowerCase()) || []
      const tl = p.title.toLowerCase()
      return (
        lt.some((t) => ['thesis', 'dissertation', 'report', 'book'].includes(t)) ||
        tl.includes('thesis') ||
        tl.includes('report') ||
        tl.includes('dissertation')
      )
    }).length

    const tutorialCount = activeProjects.filter((p) => {
      const lt = p.tags?.map((t) => t.toLowerCase()) || []
      const tl = p.title.toLowerCase()
      return (
        lt.some((t) => ['tutorial', 'starter', 'wasmtex'].includes(t)) ||
        tl.includes('tutorial') ||
        tl.includes('starter')
      )
    }).length

    this.container.innerHTML = `
      <div class="tactical-dash-root">
        <!-- Top Confidential Classification Bar -->
        <div class="tactical-top-strip">
          <div class="top-strip-left">
            <span class="strip-bracket">[</span>
            <span class="strip-text">${t(
              'KLASIFIKASI: TERBUKA // CORTEX RESEARCH STUDIO // SPEC WASMTEX-V2',
              'CLASSIFICATION: OPEN // CORTEX RESEARCH STUDIO // SPEC WASMTEX-V2',
              lang
            )}</span>
            <span class="strip-bracket">]</span>
          </div>
          <div class="top-strip-right">
            <span class="status-indicator-dot">●</span>
            <span class="strip-text">${t(
              'ONLINE // WEBASSEMBLY ENGINE // TEX LIVE 2025-2026 // UTC+07',
              'ONLINE // WEBASSEMBLY ENGINE // TEX LIVE 2025-2026 // UTC+07',
              lang
            )}</span>
          </div>
        </div>

        <!-- High-Contrast Eye-Friendly Tactical Navbar -->
        <header class="tactical-navbar">
          <div class="tactical-nav-left">
            <div class="tactical-brand-wrap">
              <span class="tactical-brand-logo">CorTeX</span>
              <span class="tactical-brand-reg">®</span>
              <span class="tactical-brand-spec">/ ${t('STUDIO RISET LATEX & WASMTEX CORE', 'LATEX RESEARCH STUDIO & WASMTEX CORE', lang)}</span>
            </div>
          </div>

          <nav class="tactical-nav-center">
            <button class="tactical-nav-btn ${this.currentFilter === 'all' || this.currentFilter.startsWith('folder:') || this.currentFilter.startsWith('tag:') ? 'active' : ''}" data-filter="all">
              [ 📁 ${t('PROYEK SAYA', 'MY PROJECTS', lang)} (${activeCount}) ]
            </button>
            <button class="tactical-nav-btn ${this.currentFilter === 'templates' ? 'active' : ''}" data-filter="templates">
              [ 🎨 ${t('TEMPLATE DOKUMEN', 'TEMPLATES', lang)} (${TEMPLATES.length}) ]
            </button>
            <button class="tactical-nav-btn ${this.currentFilter === 'library' ? 'active' : ''}" data-filter="library">
              [ 📚 ${t('PUSTAKA RISET', 'RESEARCH LIBRARY', lang)} (${this.papers.length}) ]
            </button>
          </nav>

          <div class="tactical-nav-right">
            <button id="dash-lang-toggle" class="tactical-icon-toggle" title="${t('Ganti Bahasa (ID / EN)', 'Switch Language (ID / EN)', lang)}">
              🌐 <span class="toggle-mode-label">${lang.toUpperCase()}</span>
            </button>
            <button id="dash-r2-sync" class="tactical-icon-toggle" title="${t('Cadangkan ke Cloudflare R2 Bucket', 'Backup to Cloudflare R2 Bucket', lang)}">
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
                <button id="dash-account-settings-btn" class="tactical-user-tag-btn" title="${t('Kelola Profil & Akun', 'Manage Profile & Account', lang)} (@${escapeHtml(currentUser.username)})">
                  <span class="user-bracket">&lt;</span>
                  <span class="user-text">OPERATOR // ${escapeHtml(currentUser.username.toUpperCase())}</span>
                  <span class="user-bracket">&gt;</span>
                </button>
                <button id="dash-logout-btn" class="tactical-btn-action" style="font-size:10.5px; padding:3px 8px; margin-left:4px;" title="${t('Keluar / Logout', 'Logout', lang)}">${t('LOGOUT', 'LOGOUT', lang)}</button>
              </div>
            `
                : ''
            }
          </div>
        </header>

        <!-- Main Scrollable Dashboard Content -->
        <div class="tactical-scroll-content">
          ${
            this.currentFilter === 'library'
              ? `
          <!-- Research Library Section on Dashboard -->
          <section class="tactical-archive-section">
            <div class="archive-section-header">
              <div class="archive-title-wrap">
                <span class="archive-index">[ 02 ]</span>
                <div>
                  <div class="archive-heading">RESEARCH LIBRARY &amp; LITERATURE REPOSITORY</div>
                  <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                    Katalog literatur ilmiah &amp; sitasi BibTeX. Klik "ADD TO BIBTEX" untuk menyisipkan referensi langsung ke naskah Anda.
                  </div>
                </div>
              </div>
              <div class="archive-actions-wrap" style="display:flex; align-items:center; gap:10px;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family: var(--font-mono); font-size:11px; color:var(--text-muted); font-weight:700;">FILTER PROJECT:</span>
                  <select id="dash-lib-project-select" class="tactical-form-select">
                    <option value="all">ALL PROJECTS (${this.papers.length})</option>
                    ${this.projects
                      .filter((p) => !p.trashed)
                      .map(
                        (p) =>
                          `<option value="${p.id}" ${this.selectedLibraryProject === p.id ? 'selected' : ''}>${escapeHtml(p.title)}</option>`,
                      )
                      .join('')}
                  </select>
                </div>
                <button id="dash-lib-add-paper-btn" class="tactical-cta-btn cta-orange" style="padding:6px 14px;">
                  <span class="cta-inner">+ ADD RESEARCH PAPER</span>
                </button>
              </div>
            </div>

            <!-- Search Bar -->
            <div style="padding: 12px 24px; border-bottom: 1.5px solid var(--border-color); display:flex; gap:10px;">
              <div class="archive-search-container" style="flex:1;">
                <span class="search-terminal-prompt">&gt;_</span>
                <input type="text" id="dash-lib-search-input" class="tactical-search-input" placeholder="SEARCH PAPERS (TITLE, AUTHORS, VENUE, DOI, TAGS)..." />
              </div>
            </div>

            <!-- Library Table Frame -->
            <div class="tactical-table-frame">
              <table class="tactical-table">
                <thead>
                  <tr>
                    <th style="width: 40%;">PAPER TITLE / VENUE</th>
                    <th style="width: 22%;">AUTHORS &amp; DOI</th>
                    <th style="width: 16%;">LINKED PROJECT</th>
                    <th style="width: 22%; text-align: right;">ACTIONS</th>
                  </tr>
                </thead>
                <tbody id="dash-lib-table-body"></tbody>
              </table>
            </div>
          </section>
          `
              : this.currentFilter === 'templates'
              ? `
          <!-- Dedicated Starter Templates Gallery Section -->
          <section class="tactical-templates-section" style="padding-top: 28px;">
            <div class="archive-section-header">
              <div class="archive-title-wrap">
                <span class="archive-index">[ 🎨 ]</span>
                <div>
                  <div class="archive-heading">${t('KATALOG TEMPLATE NASKAH ILMIAH', 'SCIENTIFIC MANUSCRIPT TEMPLATES', lang)}</div>
                  <div style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                    ${t(
                      'Pilih template standar produksi untuk presentasi (Beamer), jurnal internasional (IEEE/Elsevier/Nature/ACM), tesis/disertasi, laporan teknis industri, atau CV akademik.',
                      'Select verified production-ready starter templates: Conference Slides (Beamer), IEEE / Elsevier / Nature / ACM Journals, Thesis, Technical Reports, or Academic CV.',
                      lang
                    )}
                  </div>
                </div>
              </div>
              <div class="archive-search-container" style="min-width: 280px;">
                <span class="search-terminal-prompt">&gt;_</span>
                <input type="text" id="dash-tpl-search-input" class="tactical-search-input" placeholder="${t('CARI TEMPLATE (NAMA, TAG, KATEGORI)...', 'SEARCH TEMPLATES (TITLE, TAG, CATEGORY)...', lang)}" value="${escapeHtml(this.templateSearchQuery)}" />
                <button id="dash-tpl-search-clear" class="search-clear-btn" style="${this.templateSearchQuery ? 'display:block;' : 'display:none;'}" title="Clear search">✕</button>
              </div>
            </div>

            <!-- Template Categories Navigation Bar -->
            <div class="tactical-tags-bar" style="margin-top: 8px;">
              <span class="tags-bar-label">📑 ${t('KATEGORI TEMPLATE:', 'TEMPLATE CATEGORIES:', lang)}</span>
              <button class="tactical-tag-chip ${this.templateCategoryFilter === 'all' ? 'active' : ''}" data-tpl-cat="all">[ ${t('SEMUA', 'ALL', lang)} (${TEMPLATES.length}) ]</button>
              <button class="tactical-tag-chip ${this.templateCategoryFilter === 'Journal' ? 'active' : ''}" data-tpl-cat="Journal">[ 📄 ${t('JURNAL & ARTIKEL', 'JOURNALS', lang)} ]</button>
              <button class="tactical-tag-chip ${this.templateCategoryFilter === 'Presentation' ? 'active' : ''}" data-tpl-cat="Presentation">[ 📊 ${t('PRESENTASI & SLIDES', 'PRESENTATIONS', lang)} ]</button>
              <button class="tactical-tag-chip ${this.templateCategoryFilter === 'Thesis' ? 'active' : ''}" data-tpl-cat="Thesis">[ 🎓 ${t('TESIS & DISERTASI', 'THESIS', lang)} ]</button>
              <button class="tactical-tag-chip ${this.templateCategoryFilter === 'Report' ? 'active' : ''}" data-tpl-cat="Report">[ 📋 ${t('LAPORAN & LAB', 'REPORTS', lang)} ]</button>
              <button class="tactical-tag-chip ${this.templateCategoryFilter === 'Resume' ? 'active' : ''}" data-tpl-cat="Resume">[ 👤 ${t('CV & RESUME', 'CV / RESUME', lang)} ]</button>
              <button class="tactical-tag-chip ${this.templateCategoryFilter === 'Academic' ? 'active' : ''}" data-tpl-cat="Academic">[ 💡 ${t('AKADEMIK & TUGAS', 'ACADEMIC & PSET', lang)} ]</button>
            </div>

            <div class="templates-grid" id="dash-templates-grid">
              ${this.renderTemplateCards(lang)}
            </div>
          </section>
          `
              : `
          <!-- Compact Action Toolbar for My Projects -->
          <div class="dash-action-toolbar" style="padding: 18px 36px 14px 36px; background: var(--bg-primary); border-bottom: 1.5px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              ${
                currentUser?.role !== 'viewer'
                  ? `
              <button id="dash-new-project-btn" class="tactical-cta-btn cta-orange" style="padding: 10px 20px;" title="${t('Buat naskah baru dari awal', 'Create new manuscript from scratch', lang)}">
                <span class="bracket-corner tl"></span>
                <span class="bracket-corner tr"></span>
                <span class="bracket-corner bl"></span>
                <span class="bracket-corner br"></span>
                <span class="cta-inner">+ ${t('BUAT NASKAH BARU', 'NEW MANUSCRIPT', lang)}</span>
              </button>

              <label for="dash-import-file-input" class="tactical-cta-btn cta-secondary" style="padding: 10px 18px;" title="${t('Impor file .tex atau .zip proyek', 'Import .tex or .zip project', lang)}">
                <span class="bracket-corner tl"></span>
                <span class="bracket-corner tr"></span>
                <span class="bracket-corner bl"></span>
                <span class="bracket-corner br"></span>
                <span class="cta-inner">⬆ ${t('IMPOR LATEX / ZIP', 'IMPORT LATEX / ZIP', lang)}</span>
                <input type="file" id="dash-import-file-input" accept=".tex,.bib,.txt,.zip" style="display:none;" />
              </label>
              `
                  : ''
              }

              <button id="dash-goto-templates-btn" class="tactical-cta-btn cta-secondary" style="padding: 10px 18px;" title="${t('Pilih dari 12 template naskah akademik siap-pakai', 'Choose from 12 ready-to-use academic templates', lang)}">
                <span class="bracket-corner tl"></span>
                <span class="bracket-corner tr"></span>
                <span class="bracket-corner bl"></span>
                <span class="bracket-corner br"></span>
                <span class="cta-inner">🎨 ${t('PILIH TEMPLATE', 'CHOOSE TEMPLATE', lang)} (${TEMPLATES.length})</span>
              </button>
            </div>

            <!-- Telemetry Indicator Pills -->
            <div style="display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 11px;">
              <span class="tactical-badge" style="color: var(--accent-orange); font-weight: 700;">● ${activeCount} ${t('PROYEK SAYA', 'MY PROJECTS', lang)}</span>
              <span class="tactical-badge">[ WASM 64M HEAP ]</span>
              <span class="tactical-badge">[ TEX LIVE 2025/2026 ]</span>
            </div>
          </div>

          <!-- Project Archive & Management Section -->
          <section class="tactical-archive-section">
            <div class="archive-section-header">
              <div class="archive-title-wrap">
                <span class="archive-index">[ 📁 ]</span>
                <div>
                  <div class="archive-heading">${t('MANAJER DOKUMEN & FOLDER PROYEK', 'DOCUMENT MANAGER & PROJECT FOLDERS', lang)}</div>
                  <div style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                    ${t(
                      'Pilih folder atau filter tag di bawah untuk mencari naskah dengan cepat. Klik baris dokumen untuk membuka langsung di workspace.',
                      'Select category folder or filter by tags to locate documents. Click any row to open in workspace.',
                      lang
                    )}
                  </div>
                </div>
              </div>
              <div class="archive-search-container">
                <span class="search-terminal-prompt">&gt;_</span>
                <input type="text" id="dash-search-input" class="tactical-search-input" placeholder="${t('CARI PROYEK (JUDUL, PEMILIK, TAG)...', 'SEARCH PROJECTS (TITLE, OWNER, TAG)...', lang)}" />
                <span class="search-key-badge">CTRL+K</span>
                <button id="dash-search-clear" class="search-clear-btn" style="display:none;" title="Clear search">✕</button>
              </div>
            </div>

            <!-- Folder Category Navigation Bar -->
            <div class="folder-categories-grid">
              <button class="folder-category-card ${this.currentFilter === 'all' ? 'active' : ''}" data-folder="all">
                <div class="folder-card-top">
                  <span class="folder-glyph">📁</span>
                  <span class="folder-badge">[ ALL ]</span>
                </div>
                <div class="folder-title">${t('Semua Dokumen', 'All Documents', lang)}</div>
                <div class="folder-subtitle">${activeCount} ${t('Naskah Tersimpan', 'Saved Manuscripts', lang)}</div>
              </button>

              <button class="folder-category-card ${this.currentFilter === 'folder:journal' ? 'active' : ''}" data-folder="journal">
                <div class="folder-card-top">
                  <span class="folder-glyph">📄</span>
                  <span class="folder-badge">[ JOURNALS ]</span>
                </div>
                <div class="folder-title">${t('Jurnal & Artikel', 'Journals & Papers', lang)}</div>
                <div class="folder-subtitle">${journalCount} ${t('Naskah IEEE/Elsevier', 'IEEE/Elsevier Papers', lang)}</div>
              </button>

              <button class="folder-category-card ${this.currentFilter === 'folder:slides' ? 'active' : ''}" data-folder="slides">
                <div class="folder-card-top">
                  <span class="folder-glyph">📊</span>
                  <span class="folder-badge">[ SLIDES ]</span>
                </div>
                <div class="folder-title">${t('Presentasi Slide', 'Presentations & Slides', lang)}</div>
                <div class="folder-subtitle">${slidesCount} ${t('Slide Beamer', 'Beamer Decks', lang)}</div>
              </button>

              <button class="folder-category-card ${this.currentFilter === 'folder:thesis' ? 'active' : ''}" data-folder="thesis">
                <div class="folder-card-top">
                  <span class="folder-glyph">🎓</span>
                  <span class="folder-badge">[ THESIS ]</span>
                </div>
                <div class="folder-title">${t('Tesis & Laporan', 'Thesis & Reports', lang)}</div>
                <div class="folder-subtitle">${thesisCount} ${t('Dokumen Akademik', 'Academic Documents', lang)}</div>
              </button>

              <button class="folder-category-card ${this.currentFilter === 'folder:tutorial' ? 'active' : ''}" data-folder="tutorial">
                <div class="folder-card-top">
                  <span class="folder-glyph">💡</span>
                  <span class="folder-badge">[ GUIDES ]</span>
                </div>
                <div class="folder-title">${t('Tutorial & Panduan', 'Tutorials & Guides', lang)}</div>
                <div class="folder-subtitle">${tutorialCount} ${t('Panduan WasmTex', 'WasmTex Guides', lang)}</div>
              </button>
            </div>

            <!-- Tags Filter Chips -->
            <div class="tactical-tags-bar">
              <span class="tags-bar-label">🏷️ ${t('FILTER TAGS / KATA KUNCI:', 'FILTER BY TAGS:', lang)}</span>
              <button class="tactical-tag-chip ${this.currentFilter === 'all' ? 'active' : ''}" data-tag="all">[ ${t('SEMUA TAG', 'ALL TAGS', lang)} ]</button>
              <div id="dash-tags-list" class="tags-chips-container"></div>
            </div>

            <!-- Brutalist Table Card -->
            <div class="tactical-table-frame">
              <table class="tactical-table">
                <thead>
                  <tr>
                    <th style="width: 50%;">DOCUMENT TITLE / CLASSIFICATION</th>
                    <th style="width: 18%;">AUTHOR / OPERATOR</th>
                    <th style="width: 18%;">TIMESTAMP</th>
                    <th style="width: 14%; text-align: right;">ACTION</th>
                  </tr>
                </thead>
                <tbody id="dash-table-body"></tbody>
              </table>
            </div>
          </section>
          `
          }
        </div>

        <!-- Bottom Confidential Footer Ribbon -->
        <footer class="tactical-bottom-strip">
          <div class="bottom-strip-content">
            CORTEX ACADEMIC STUDIO // WASMTEX SPEC 2025.1 // LOCAL WASM COMPILER // ALL ENGINE SYSTEMS OPERATIONAL
          </div>
        </footer>

        <!-- Account Settings & Credential Management Dialog -->
        <dialog id="tactical-account-dialog" class="tactical-login-modal modal-account">
          <div class="tactical-modal-frame">
            <span class="bracket-corner tl"></span>
            <span class="bracket-corner tr"></span>
            <span class="bracket-corner bl"></span>
            <span class="bracket-corner br"></span>
            <div class="tactical-modal-header">
              <span class="modal-spec-tag">[ KREDENSIAL &amp; PROFIL AKUN // IAM IDENTITY ]</span>
              <button type="button" class="modal-close-x" id="modal-account-close" title="Tutup">✕</button>
            </div>
            <div class="tactical-modal-body">
              <div class="acc-meta-card" style="padding:10px 14px; background:var(--bg-secondary); border:1px solid var(--border-color); margin-bottom:14px; font-family:var(--font-mono); font-size:11px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>USER ID: <code id="acc-info-id">...</code></span>
                  <span>ROLE: <span id="acc-info-role" class="role-badge">...</span></span>
                </div>
                <div style="color:var(--text-secondary); font-size:10px;">PROYEK ANDA TERISOLASI SECARA PENUH PADA SANDBOX PENGGUNA INI</div>
              </div>

              <!-- Section 1: Change Username -->
              <div class="form-sub-section" style="border:1px solid var(--border-color); padding:12px; margin-bottom:14px; background:var(--bg-primary);">
                <div class="sub-sec-title" style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--text-primary); margin-bottom:8px;">[ 1. UBAH USERNAME / OPERATOR ID ]</div>
                <div id="acc-user-msg" class="msg-box" style="display:none; padding:6px 10px; margin-bottom:8px; font-size:11px; font-family:var(--font-mono);"></div>
                <form id="form-change-username">
                  <div class="form-field-group">
                    <label for="acc-input-new-user" class="form-field-label">USERNAME BARU</label>
                    <input type="text" id="acc-input-new-user" class="tactical-form-input" required />
                  </div>
                  <button type="submit" class="tactical-cta-btn cta-secondary" style="padding: 7px 14px; width: 100%; margin-top:6px;">
                    <span class="cta-inner">SIMPAN USERNAME BARU</span>
                  </button>
                </form>
              </div>

              <!-- Section 2: Change Password -->
              <div class="form-sub-section" style="border:1px solid var(--border-color); padding:12px; background:var(--bg-primary);">
                <div class="sub-sec-title" style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--text-primary); margin-bottom:8px;">[ 2. UBAH PASSWORD (KATA SANDI) ]</div>
                <div id="acc-pass-msg" class="msg-box" style="display:none; padding:6px 10px; margin-bottom:8px; font-size:11px; font-family:var(--font-mono);"></div>
                <form id="form-change-password">
                  <div class="form-field-group">
                    <label for="acc-input-old-pass" class="form-field-label">PASSWORD SAAT INI</label>
                    <input type="password" id="acc-input-old-pass" class="tactical-form-input" required />
                  </div>
                  <div class="form-field-group">
                    <label for="acc-input-new-pass" class="form-field-label">PASSWORD BARU (MIN 6 KARAKTER)</label>
                    <input type="password" id="acc-input-new-pass" class="tactical-form-input" required />
                  </div>
                  <div class="form-field-group">
                    <label for="acc-input-confirm-pass" class="form-field-label">KONFIRMASI PASSWORD BARU</label>
                    <input type="password" id="acc-input-confirm-pass" class="tactical-form-input" required />
                  </div>
                  <button type="submit" class="tactical-cta-btn cta-orange" style="padding: 7px 14px; width: 100%; margin-top:6px;">
                    <span class="cta-inner">GANTI PASSWORD</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </dialog>

        <!-- Add Paper Modal Dialog -->
        <dialog id="tactical-paper-dialog" class="tactical-login-modal">
          <div class="tactical-modal-frame" style="max-width: 520px;">
            <span class="bracket-corner tl"></span>
            <span class="bracket-corner tr"></span>
            <span class="bracket-corner bl"></span>
            <span class="bracket-corner br"></span>
            <div class="tactical-modal-header">
              <span class="modal-spec-tag">[ NEW LITERATURE ENTRY // RESEARCH REPOSITORY ]</span>
              <button type="button" class="modal-close-x" id="modal-paper-close" title="Tutup">✕</button>
            </div>
            <form id="tactical-paper-form" class="tactical-modal-body">
              <div class="form-field-group">
                <label for="paper-input-title" class="form-field-label">PAPER TITLE</label>
                <input type="text" id="paper-input-title" class="tactical-form-input" placeholder="e.g. Attention Is All You Need" required autofocus />
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div class="form-field-group">
                  <label for="paper-input-authors" class="form-field-label">AUTHORS</label>
                  <input type="text" id="paper-input-authors" class="tactical-form-input" placeholder="e.g. Vaswani et al." required />
                </div>
                <div class="form-field-group">
                  <label for="paper-input-year" class="form-field-label">YEAR / VENUE</label>
                  <input type="text" id="paper-input-year" class="tactical-form-input" placeholder="e.g. 2026 · NeurIPS" required />
                </div>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div class="form-field-group">
                  <label for="paper-input-doi" class="form-field-label">DOI / ARXIV LINK (OPTIONAL)</label>
                  <input type="text" id="paper-input-doi" class="tactical-form-input" placeholder="e.g. 10.48550/arXiv..." />
                </div>
                <div class="form-field-group">
                  <label for="paper-input-project" class="form-field-label">LINK TO PROJECT</label>
                  <select id="paper-input-project" class="tactical-form-select">
                    <option value="">[ GLOBAL / ALL PROJECTS ]</option>
                    ${this.projects
                      .filter((p) => !p.trashed)
                      .map((p) => `<option value="${p.id}">${escapeHtml(p.title)}</option>`)
                      .join('')}
                  </select>
                </div>
              </div>
              <div class="form-field-group">
                <label for="paper-input-bibtex" class="form-field-label">BIBTEX CITATION</label>
                <textarea id="paper-input-bibtex" class="tactical-form-textarea" rows="4" placeholder="@article{...}" required></textarea>
              </div>
              <div class="form-actions-row">
                <button type="submit" class="tactical-cta-btn cta-orange" style="padding: 9px 18px;">
                  <span class="cta-inner">[ ▶ SAVE TO LIBRARY ]</span>
                </button>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    `

    this.bindEvents()
    if (this.currentFilter === 'library') {
      this.renderLibraryRows()
    } else if (this.currentFilter === 'templates') {
      this.bindTemplateButtons()
    } else {
      this.renderTags()
      this.renderProjectRows()
    }
  }

  private renderTemplateCards(lang: Lang): string {
    let list = TEMPLATES
    if (this.templateCategoryFilter !== 'all') {
      list = list.filter((t) => t.category.toLowerCase() === this.templateCategoryFilter.toLowerCase())
    }
    if (this.templateSearchQuery) {
      const q = this.templateSearchQuery.toLowerCase()
      list = list.filter((t) => {
        return (
          t.title.toLowerCase().includes(q) ||
          t.titleId.toLowerCase().includes(q) ||
          t.titleEn.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      })
    }

    if (list.length === 0) {
      return `
        <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: var(--bg-primary); border: 1.5px solid var(--border-color);">
          <div style="font-family: var(--font-mono); font-size: 20px; color: var(--accent-orange); margin-bottom: 8px;">[!]</div>
          <div style="font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--text-primary);">${t('TIDAK ADA TEMPLATE YANG SESUAI DENGAN PENCARIAN', 'NO TEMPLATES MATCH CURRENT SEARCH', lang)}</div>
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-top: 4px;">${t('Coba gunakan kata kunci lain atau pilih kategori Semua.', 'Try searching another keyword or select All category.', lang)}</div>
        </div>
      `
    }

    return list
      .map(
        (tpl) => `
        <div class="template-card">
          <div class="template-card-header">
            <span class="template-badge">${escapeHtml(tpl.badge)}</span>
            <span class="template-cat">${escapeHtml(tpl.category.toUpperCase())}</span>
          </div>
          <div class="template-title">${escapeHtml(lang === 'en' ? tpl.titleEn : tpl.titleId)}</div>
          <div class="template-desc">${escapeHtml(lang === 'en' ? tpl.descriptionEn : tpl.descriptionId)}</div>
          <div class="template-tags">
            ${tpl.tags.map((tag) => `<span class="t-badge">[ ${escapeHtml(tag)} ]</span>`).join(' ')}
          </div>
          <div class="template-card-footer">
            <button class="tactical-cta-btn cta-orange btn-use-template" data-template-id="${tpl.id}" style="width:100%; padding: 8px 14px;" title="${t('Gunakan template ini untuk membuat dokumen baru', 'Create new document with this template', lang)}">
              <span class="bracket-corner tl"></span>
              <span class="bracket-corner tr"></span>
              <span class="bracket-corner bl"></span>
              <span class="bracket-corner br"></span>
              <span class="cta-inner">+ ${t('GUNAKAN TEMPLATE', 'USE TEMPLATE', lang)}</span>
            </button>
          </div>
        </div>
      `,
      )
      .join('')
  }

  private bindTemplateButtons(): void {
    this.container.querySelectorAll('.btn-use-template').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const tplId = btn.getAttribute('data-template-id')
        const tpl = TEMPLATES.find((t) => t.id === tplId)
        if (!tpl) return

        const curUser = getCurrentUser()
        if (curUser?.role === 'viewer') {
          alert(
            t(
              'Mode Baca: Akun Viewer tidak memiliki izin membuat dokumen baru.',
              'Read-Only Mode: Viewer accounts cannot create new documents.',
              getLang(),
            ),
          )
          return
        }

        const defaultTitle = getLang() === 'en' ? tpl.titleEn : tpl.titleId
        const inputTitle = prompt(
          t('Beri judul untuk manuskrip baru ini:', 'Enter a title for this new manuscript:', getLang()),
          defaultTitle,
        )
        if (inputTitle === null) return
        const finalTitle = inputTitle.trim() || defaultTitle

        const authorName = curUser?.username || curUser?.name || 'Operator'
        const newProj: ProjectItem = {
          id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: finalTitle,
          owner: authorName,
          ownerId: curUser?.userId || 'usr_admin',
          lastModified: Date.now(),
          tags: [...tpl.tags],
          files: { ...tpl.files },
        }

        await saveProject(newProj, curUser)
        this.projects = await getAllProjects(curUser)
        this.options.onOpenProject(newProj)
      })
    })
  }

  private bindEvents(): void {
    const newBtn = this.container.querySelector('#dash-new-project-btn')
    newBtn?.addEventListener('click', () => this.promptNewProject())

    this.bindTemplateButtons()

    const gotoTplBtn = this.container.querySelector('#dash-goto-templates-btn')
    gotoTplBtn?.addEventListener('click', () => {
      this.currentFilter = 'templates'
      this.render()
    })

    this.container.querySelectorAll('[data-tpl-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.templateCategoryFilter = btn.getAttribute('data-tpl-cat') || 'all'
        const grid = this.container.querySelector('#dash-templates-grid')
        if (grid) {
          grid.innerHTML = this.renderTemplateCards(getLang())
          this.bindTemplateButtons()
        }
        this.container.querySelectorAll('[data-tpl-cat]').forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
      })
    })

    const tplSearchInput = this.container.querySelector('#dash-tpl-search-input') as HTMLInputElement | null
    const tplSearchClear = this.container.querySelector('#dash-tpl-search-clear') as HTMLButtonElement | null

    tplSearchInput?.addEventListener('input', () => {
      this.templateSearchQuery = tplSearchInput.value.trim()
      if (tplSearchClear) {
        tplSearchClear.style.display = this.templateSearchQuery ? 'block' : 'none'
      }
      const grid = this.container.querySelector('#dash-templates-grid')
      if (grid) {
        grid.innerHTML = this.renderTemplateCards(getLang())
        this.bindTemplateButtons()
      }
    })

    tplSearchClear?.addEventListener('click', () => {
      if (tplSearchInput) {
        tplSearchInput.value = ''
        this.templateSearchQuery = ''
        tplSearchClear.style.display = 'none'
        const grid = this.container.querySelector('#dash-templates-grid')
        if (grid) {
          grid.innerHTML = this.renderTemplateCards(getLang())
          this.bindTemplateButtons()
        }
        tplSearchInput.focus()
      }
    })

    const gotoLibBtn = this.container.querySelector('#dash-goto-library-btn')
    gotoLibBtn?.addEventListener('click', () => {
      this.currentFilter = 'library'
      this.render()
    })

    // Research Library bindings on Dashboard
    const libProjectSelect = this.container.querySelector('#dash-lib-project-select') as HTMLSelectElement | null
    libProjectSelect?.addEventListener('change', () => {
      this.selectedLibraryProject = libProjectSelect.value
      this.renderLibraryRows()
    })

    const libSearchInput = this.container.querySelector('#dash-lib-search-input') as HTMLInputElement | null
    libSearchInput?.addEventListener('input', () => {
      this.renderLibraryRows(libSearchInput.value.trim().toLowerCase())
    })

    const paperDialog = this.container.querySelector('#tactical-paper-dialog') as HTMLDialogElement | null
    const addPaperBtn = this.container.querySelector('#dash-lib-add-paper-btn')
    const paperClose = this.container.querySelector('#modal-paper-close')
    const paperForm = this.container.querySelector('#tactical-paper-form')

    addPaperBtn?.addEventListener('click', () => {
      paperDialog?.showModal()
    })

    paperClose?.addEventListener('click', () => {
      paperDialog?.close()
    })

    paperForm?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const title = (this.container.querySelector('#paper-input-title') as HTMLInputElement)?.value.trim()
      const authors = (this.container.querySelector('#paper-input-authors') as HTMLInputElement)?.value.trim()
      const yearVenue = (this.container.querySelector('#paper-input-year') as HTMLInputElement)?.value.trim()
      const doi = (this.container.querySelector('#paper-input-doi') as HTMLInputElement)?.value.trim() || ''
      const targetProjId = (this.container.querySelector('#paper-input-project') as HTMLSelectElement)?.value || undefined
      const bibtex = (this.container.querySelector('#paper-input-bibtex') as HTMLTextAreaElement)?.value.trim()

      if (title && authors && bibtex) {
        const id = `paper_${Date.now()}`
        const newPaper: ResearchPaper = {
          id,
          title,
          authors,
          year: yearVenue.split('·')[0]?.trim() || '2026',
          venue: yearVenue.split('·')[1]?.trim() || 'Journal / Conference',
          doi,
          abstract: '',
          tags: ['Research', 'Literature'],
          bibtex,
          projectId: targetProjId,
          memo: {
            objective: '',
            methodology: '',
            findings: '',
            notes: '',
          },
        }

        await savePaper(newPaper)
        this.papers = await getAllPapers()
        paperDialog?.close()
        this.render()
        alert(`✓ Literatur "${title}" berhasil disimpan ke Research Library!`)
      }
    })

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

    const langToggle = this.container.querySelector('#dash-lang-toggle')
    langToggle?.addEventListener('click', () => {
      toggleLang()
      this.render()
      this.options.onToggleLang?.()
    })

    // Logout button handler
    const logoutBtn = this.container.querySelector('#dash-logout-btn')
    logoutBtn?.addEventListener('click', () => {
      if (confirm('Keluar dari sesi operator dan kembali ke halaman utama?')) {
        logoutUser()
        if (this.options.onLogout) {
          this.options.onLogout()
        } else {
          window.location.reload()
        }
      }
    })

    // Account settings dialog bindings
    const accountDialog = this.container.querySelector('#tactical-account-dialog') as HTMLDialogElement | null
    const accountSettingsBtn = this.container.querySelector('#dash-account-settings-btn')
    const accountCloseBtn = this.container.querySelector('#modal-account-close')
    const formUsername = this.container.querySelector('#form-change-username') as HTMLFormElement | null
    const formPassword = this.container.querySelector('#form-change-password') as HTMLFormElement | null
    const accUserMsg = this.container.querySelector('#acc-user-msg') as HTMLElement | null
    const accPassMsg = this.container.querySelector('#acc-pass-msg') as HTMLElement | null

    accountSettingsBtn?.addEventListener('click', () => {
      const curUser = getCurrentUser()
      if (!curUser) return
      const idEl = this.container.querySelector('#acc-info-id')
      const roleEl = this.container.querySelector('#acc-info-role')
      const userInput = this.container.querySelector('#acc-input-new-user') as HTMLInputElement | null
      if (idEl) idEl.textContent = curUser.userId
      if (roleEl) {
        roleEl.textContent = curUser.role.toUpperCase()
        roleEl.className = `role-badge ${curUser.role}`
      }
      if (userInput) userInput.value = curUser.username
      if (accUserMsg) accUserMsg.style.display = 'none'
      if (accPassMsg) accPassMsg.style.display = 'none'
      accountDialog?.showModal()
    })

    accountCloseBtn?.addEventListener('click', () => {
      accountDialog?.close()
    })

    formUsername?.addEventListener('submit', (e) => {
      e.preventDefault()
      const curUser = getCurrentUser()
      if (!curUser) return
      const newUsername = (this.container.querySelector('#acc-input-new-user') as HTMLInputElement)?.value.trim()
      const res = changeUsername(curUser.userId, newUsername)
      if (accUserMsg) {
        accUserMsg.style.display = 'block'
        if (res.success) {
          accUserMsg.style.color = '#22C55E'
          accUserMsg.textContent = `✓ Username berhasil diubah menjadi "${newUsername}".`
          setTimeout(() => {
            this.init()
          }, 800)
        } else {
          accUserMsg.style.color = '#EF4444'
          accUserMsg.textContent = res.error || 'Gagal mengubah username.'
        }
      }
    })

    formPassword?.addEventListener('submit', (e) => {
      e.preventDefault()
      const curUser = getCurrentUser()
      if (!curUser) return
      const oldPass = (this.container.querySelector('#acc-input-old-pass') as HTMLInputElement)?.value
      const newPass = (this.container.querySelector('#acc-input-new-pass') as HTMLInputElement)?.value
      const confirmPass = (this.container.querySelector('#acc-input-confirm-pass') as HTMLInputElement)?.value

      if (newPass !== confirmPass) {
        if (accPassMsg) {
          accPassMsg.style.display = 'block'
          accPassMsg.style.color = '#EF4444'
          accPassMsg.textContent = 'Konfirmasi password baru tidak cocok.'
        }
        return
      }

      const res = changePassword(curUser.userId, oldPass, newPass)
      if (accPassMsg) {
        accPassMsg.style.display = 'block'
        if (res.success) {
          accPassMsg.style.color = '#22C55E'
          accPassMsg.textContent = '✓ Password berhasil diperbarui!'
          formPassword.reset()
        } else {
          accPassMsg.style.color = '#EF4444'
          accPassMsg.textContent = res.error || 'Gagal mengubah password.'
        }
      }
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

    this.container.querySelectorAll('.folder-category-card').forEach((card) => {
      card.addEventListener('click', () => {
        const folder = card.getAttribute('data-folder') || 'all'
        this.currentFilter = folder === 'all' ? 'all' : `folder:${folder}`
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

      const curUser = getCurrentUser()
      newProj.owner = curUser?.username || authorName
      newProj.ownerId = curUser?.userId || 'usr_admin'

      await saveProject(newProj, curUser)
      this.projects = await getAllProjects(curUser)
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
    const lang = getLang()

    let list = this.projects.filter((p) => {
      if (p.trashed || p.archived) return false
      if (this.currentFilter === 'folder:journal') {
        const lowerTags = p.tags?.map((t) => t.toLowerCase()) || []
        const titleLower = p.title.toLowerCase()
        return (
          lowerTags.some((t) => ['journal', 'ieee', 'elsevier', 'nature', 'sensors', 'paper'].includes(t)) ||
          titleLower.includes('journal') ||
          titleLower.includes('ieee') ||
          titleLower.includes('elsevier') ||
          titleLower.includes('nature') ||
          titleLower.includes('paper')
        )
      }
      if (this.currentFilter === 'folder:slides') {
        const lowerTags = p.tags?.map((t) => t.toLowerCase()) || []
        const titleLower = p.title.toLowerCase()
        return (
          lowerTags.some((t) => ['presentation', 'beamer', 'slides'].includes(t)) ||
          titleLower.includes('beamer') ||
          titleLower.includes('presentation') ||
          titleLower.includes('slides')
        )
      }
      if (this.currentFilter === 'folder:thesis') {
        const lowerTags = p.tags?.map((t) => t.toLowerCase()) || []
        const titleLower = p.title.toLowerCase()
        return (
          lowerTags.some((t) => ['thesis', 'dissertation', 'report', 'book'].includes(t)) ||
          titleLower.includes('thesis') ||
          titleLower.includes('report') ||
          titleLower.includes('dissertation')
        )
      }
      if (this.currentFilter === 'folder:tutorial') {
        const lowerTags = p.tags?.map((t) => t.toLowerCase()) || []
        const titleLower = p.title.toLowerCase()
        return (
          lowerTags.some((t) => ['tutorial', 'starter', 'wasmtex'].includes(t)) ||
          titleLower.includes('tutorial') ||
          titleLower.includes('starter')
        )
      }
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
              <button class="tactical-btn-action btn-delete" data-id="${proj.id}" title="${t('Hapus naskah', 'Delete manuscript', lang)}">✕</button>
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

    tbody.querySelectorAll('.tactical-btn-open').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = btn.getAttribute('data-id')!
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
          const curUser = getCurrentUser()
          await saveProject(found, curUser)
          this.projects = await getAllProjects(curUser)
          this.renderTags()
          this.renderProjectRows(searchQuery)
        }
      })
    })

    tbody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = (btn as HTMLElement).getAttribute('data-id')!
        const found = this.projects.find((p) => p.id === id)
        const docTitle = found?.title || 'manuskrip'
        if (confirm(t(`Hapus manuskrip "${docTitle}" secara permanen?`, `Permanently delete manuscript "${docTitle}"?`, lang))) {
          const curUser = getCurrentUser()
          deleteProject(id, true, curUser).then(async () => {
            this.projects = await getAllProjects(curUser)
            this.render()
          })
        }
      })
    })
  }

  private renderLibraryRows(searchQuery = ''): void {
    const tbody = this.container.querySelector('#dash-lib-table-body')
    if (!tbody) return

    let list = this.papers.filter((paper) => {
      if (this.selectedLibraryProject !== 'all') {
        return paper.projectId === this.selectedLibraryProject || !paper.projectId
      }
      return true
    })

    if (searchQuery) {
      list = list.filter((paper) => {
        return (
          paper.title.toLowerCase().includes(searchQuery) ||
          paper.authors.toLowerCase().includes(searchQuery) ||
          paper.venue.toLowerCase().includes(searchQuery) ||
          paper.year.includes(searchQuery) ||
          paper.doi.toLowerCase().includes(searchQuery) ||
          paper.tags.some((t) => t.toLowerCase().includes(searchQuery))
        )
      })
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="tactical-empty-cell">
            <div class="empty-state-box">
              <span class="empty-icon">[!]</span>
              <span class="empty-title">TIDAK ADA LITERATUR YANG COCOK</span>
              <span class="empty-sub">KLIK "+ ADD RESEARCH PAPER" UNTUK MENAMBAH PAPER ATAU DOI BARU</span>
            </div>
          </td>
        </tr>
      `
      return
    }

    tbody.innerHTML = list
      .map((paper) => {
        const linkedProj = this.projects.find((p) => p.id === paper.projectId)
        const projBadge = linkedProj
          ? `<span class="tactical-badge" style="color:var(--accent-orange); border-color:var(--accent-orange);">[ 📄 ${escapeHtml(linkedProj.title)} ]</span>`
          : `<span class="tactical-badge" style="color:var(--text-muted);">[ 🌐 GLOBAL ]</span>`

        return `
        <tr class="tactical-row" data-id="${paper.id}">
          <td class="col-title">
            <div class="title-cell-wrap">
              <span class="doc-file-glyph">📚</span>
              <div class="title-details">
                <span class="proj-title-link" style="font-weight:700;">${escapeHtml(paper.title)}</span>
                <div class="proj-tags-list" style="margin-top:2px;">
                  <span style="font-family:var(--font-mono); font-size:10.5px; color:var(--text-secondary);">${escapeHtml(paper.venue)} (${escapeHtml(paper.year)})</span>
                  ${paper.tags.map((t) => `<span class="tactical-badge">[ ${escapeHtml(t.toUpperCase())} ]</span>`).join(' ')}
                </div>
              </div>
            </div>
          </td>
          <td class="col-owner">
            <div style="font-family:var(--font-mono); font-size:11px; line-height:1.35;">
              <div>${escapeHtml(paper.authors)}</div>
              ${paper.doi ? `<div style="font-size:10px; color:var(--accent-cyan); margin-top:2px;"><a href="https://doi.org/${encodeURIComponent(paper.doi)}" target="_blank" style="color:inherit; text-decoration:none;">DOI: ${escapeHtml(paper.doi)} ↗</a></div>` : ''}
            </div>
          </td>
          <td class="col-time">
            <div style="display:flex; align-items:center; gap:4px;">
              ${projBadge}
              <button class="tactical-tag-chip btn-assign-proj" data-id="${paper.id}" title="Hubungkan ke proyek...">🔗</button>
            </div>
          </td>
          <td class="col-action" style="text-align: right;">
            <div class="row-actions-group" style="justify-content: flex-end;">
              <button class="tactical-btn-action btn-add-bibtex" data-id="${paper.id}" title="Tambahkan sitasi ke refs.bib proyek">📥 ADD TO BIBTEX</button>
              <button class="tactical-btn-action btn-copy-bibtex" data-id="${paper.id}" title="Salin kode BibTeX">📋 COPY</button>
              <button class="tactical-btn-action btn-del-paper" data-id="${paper.id}" style="color:var(--accent-orange);" title="Hapus paper">✕</button>
            </div>
          </td>
        </tr>
      `
      })
      .join('')

    // Bind row actions
    tbody.querySelectorAll('.btn-add-bibtex').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = btn.getAttribute('data-id')
        const paper = this.papers.find((p) => p.id === id)
        if (!paper) return

        let targetProj: ProjectItem | undefined
        if (this.selectedLibraryProject !== 'all') {
          targetProj = this.projects.find((p) => p.id === this.selectedLibraryProject && !p.trashed)
        } else if (paper.projectId) {
          targetProj = this.projects.find((p) => p.id === paper.projectId && !p.trashed)
        }

        if (!targetProj) {
          const activeProjects = this.projects.filter((p) => !p.trashed)
          if (activeProjects.length === 0) {
            alert('Tidak ada proyek aktif. Silakan buat proyek baru terlebih dahulu.')
            return
          }
          const promptText =
            'Pilih nomor proyek tujuan untuk menambahkan BibTeX:\n' +
            activeProjects.map((p, idx) => `${idx + 1}. ${p.title}`).join('\n')
          const ans = prompt(promptText, '1')
          if (!ans) return
          const selectedIdx = parseInt(ans.trim(), 10) - 1
          targetProj = activeProjects[selectedIdx]
        }

        if (!targetProj) {
          alert('Pilihan proyek tidak valid.')
          return
        }

        const res = await addPaperToProjectBibtex(paper, targetProj)
        alert(res.message)
      })
    })

    tbody.querySelectorAll('.btn-copy-bibtex').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = btn.getAttribute('data-id')
        const paper = this.papers.find((p) => p.id === id)
        if (paper) {
          navigator.clipboard
            ?.writeText(paper.bibtex)
            .then(() => alert(`✓ BibTeX [${paper.id}] berhasil disalin ke clipboard!`))
            .catch(() => prompt('Salin kode BibTeX:', paper.bibtex))
        }
      })
    })

    tbody.querySelectorAll('.btn-assign-proj').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = btn.getAttribute('data-id')
        const paper = this.papers.find((p) => p.id === id)
        if (!paper) return

        const activeProjects = this.projects.filter((p) => !p.trashed)
        const promptText =
          'Hubungkan literatur ini ke proyek mana?\n0. [ Global / Semua Proyek ]\n' +
          activeProjects.map((p, idx) => `${idx + 1}. ${p.title}`).join('\n')
        const ans = prompt(promptText, '0')
        if (ans === null) return
        const idx = parseInt(ans.trim(), 10)
        if (idx === 0) {
          delete paper.projectId
        } else if (activeProjects[idx - 1]) {
          paper.projectId = activeProjects[idx - 1]!.id
        } else {
          alert('Pilihan tidak valid.')
          return
        }

        await savePaper(paper)
        this.papers = await getAllPapers()
        this.renderLibraryRows()
      })
    })

    tbody.querySelectorAll('.btn-del-paper').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = btn.getAttribute('data-id')
        const paper = this.papers.find((p) => p.id === id)
        if (paper && confirm(`Hapus "${paper.title}" dari Research Library?`)) {
          await deletePaper(paper.id)
          this.papers = await getAllPapers()
          this.render()
        }
      })
    })
  }

  private promptNewProject(): void {
    const title = prompt('Judul Manuskrip Baru (LaTeX Document):')
    if (!title) return

    const tagInput = prompt('Tag / Kategori (opsional, kosongkan jika tidak ada, pisahkan koma):', '')
    const tags = tagInput ? tagInput.split(',').map((t) => t.trim()).filter(Boolean) : []

    const curUser = getCurrentUser()
    const authorName = curUser?.username || curUser?.name || 'Operator'
    const id = `proj_${Date.now()}`
    const newProj: ProjectItem = {
      id,
      title,
      owner: authorName,
      ownerId: curUser?.userId || 'usr_admin',
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

    saveProject(newProj, curUser).then(async () => {
      this.projects = await getAllProjects(curUser)
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
