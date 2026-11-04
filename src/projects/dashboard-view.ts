import { changePassword, changeUsername, getCurrentUser, logoutUser } from '../auth/auth-store'
import { TEMPLATES } from '../fs/templates'
import { unzipLatexProject } from '../fs/unzip'
import { createZipArchive } from '../fs/zip'
import {
  addPaperToProjectBibtex,
  deletePaper,
  getAllPapers,
  type ResearchPaper,
  savePaper,
} from '../library/library-store'
import { getLang, type Lang, t, toggleLang } from '../ui/i18n'
import { OVERLEAF_ICONS } from '../ui/logo'
import { tacticalAlert, tacticalConfirm, tacticalPrompt } from '../ui/tactical-dialog'
import { deleteProject, getAllProjects, type ProjectItem, saveProject } from './project-store'
import { backupProjectToR2, checkR2StorageAvailable } from './r2-storage'

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
              lang,
            )}</span>
            <span class="strip-bracket">]</span>
          </div>
          <div class="top-strip-right">
            <span class="status-indicator-dot">●</span>
            <span class="strip-text">${t(
              'ONLINE // WEBASSEMBLY ENGINE // TEX LIVE 2025-2026 // UTC+07',
              'ONLINE // WEBASSEMBLY ENGINE // TEX LIVE 2025-2026 // UTC+07',
              lang,
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
                      lang,
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

            <!-- Online Community Template Downloader / Importer -->
            <div class="dash-online-template-box" style="margin-top: 12px; margin-bottom: 8px; padding: 10px 16px; background: var(--bg-primary); border: 1.5px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; color: var(--accent-orange);">🌐 ${t('UNDUH DARI URL / GITHUB:', 'DOWNLOAD / IMPORT ONLINE:', lang)}</span>
                <span style="font-family: var(--font-mono); font-size: 10.5px; color: var(--text-muted);">${t('(GitHub, Overleaf, link raw .tex / .zip)', '(GitHub repo, Overleaf, raw .tex / .zip)', lang)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px; justify-content: flex-end;">
                <input type="text" id="dash-online-tpl-url" class="tactical-search-input" style="flex: 1; max-width: 440px; padding: 6px 10px; font-size: 11.5px;" placeholder="${t('Ketik URL repositori GitHub atau file .zip/.tex...', 'Enter GitHub repo, raw .tex, or .zip URL...', lang)}" />
                <button id="dash-online-tpl-open-btn" class="tactical-cta-btn cta-orange" style="padding: 6px 12px; font-size: 11px; white-space: nowrap;">
                  <span class="cta-inner">+ ${t('BUKA DI STUDIO', 'OPEN IN STUDIO', lang)}</span>
                </button>
                <button id="dash-online-tpl-zip-btn" class="tactical-cta-btn cta-secondary" style="padding: 6px 12px; font-size: 11px; white-space: nowrap;">
                  <span class="cta-inner">⬇ ${t('UNDUH ZIP', 'DOWNLOAD ZIP', lang)}</span>
                </button>
              </div>
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
                      lang,
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
              <span class="modal-spec-tag">[ ${t('KREDENSIAL & PROFIL AKUN // IAM IDENTITY', 'ACCOUNT CREDENTIALS & PROFILE // IAM IDENTITY', lang)} ]</span>
              <button type="button" class="modal-close-x" id="modal-account-close" title="${t('Tutup', 'Close', lang)}">✕</button>
            </div>
            <div class="tactical-modal-body">
              <div class="acc-meta-card" style="padding:10px 14px; background:var(--bg-secondary); border:1px solid var(--border-color); margin-bottom:14px; font-family:var(--font-mono); font-size:11px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>USER ID: <code id="acc-info-id">...</code></span>
                  <span>ROLE: <span id="acc-info-role" class="role-badge">...</span></span>
                </div>
                <div style="color:var(--text-secondary); font-size:10px;">${t('PROYEK ANDA TERISOLASI SECARA PENUH PADA SANDBOX PENGGUNA INI', 'YOUR PROJECTS ARE FULLY ISOLATED WITHIN THIS USER SANDBOX', lang)}</div>
              </div>

              <!-- Section 1: Change Username -->
              <div class="form-sub-section" style="border:1px solid var(--border-color); padding:12px; margin-bottom:14px; background:var(--bg-primary);">
                <div class="sub-sec-title" style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--text-primary); margin-bottom:8px;">[ 1. ${t('UBAH USERNAME / OPERATOR ID', 'CHANGE USERNAME / OPERATOR ID', lang)} ]</div>
                <div id="acc-user-msg" class="msg-box" style="display:none; padding:6px 10px; margin-bottom:8px; font-size:11px; font-family:var(--font-mono);"></div>
                <form id="form-change-username">
                  <div class="form-field-group">
                    <label for="acc-input-new-user" class="form-field-label">${t('USERNAME BARU', 'NEW USERNAME', lang)}</label>
                    <input type="text" id="acc-input-new-user" class="tactical-form-input" required />
                  </div>
                  <button type="submit" class="tactical-cta-btn cta-secondary" style="padding: 7px 14px; width: 100%; margin-top:6px;">
                    <span class="cta-inner">${t('SIMPAN USERNAME BARU', 'SAVE NEW USERNAME', lang)}</span>
                  </button>
                </form>
              </div>

              <!-- Section 2: Change Password -->
              <div class="form-sub-section" style="border:1px solid var(--border-color); padding:12px; background:var(--bg-primary);">
                <div class="sub-sec-title" style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:var(--text-primary); margin-bottom:8px;">[ 2. ${t('UBAH PASSWORD (KATA SANDI)', 'CHANGE PASSWORD', lang)} ]</div>
                <div id="acc-pass-msg" class="msg-box" style="display:none; padding:6px 10px; margin-bottom:8px; font-size:11px; font-family:var(--font-mono);"></div>
                <form id="form-change-password">
                  <div class="form-field-group">
                    <label for="acc-input-old-pass" class="form-field-label">${t('PASSWORD SAAT INI', 'CURRENT PASSWORD', lang)}</label>
                    <input type="password" id="acc-input-old-pass" class="tactical-form-input" required />
                  </div>
                  <div class="form-field-group">
                    <label for="acc-input-new-pass" class="form-field-label">${t('PASSWORD BARU (MIN 6 KARAKTER)', 'NEW PASSWORD (MIN 6 CHARS)', lang)}</label>
                    <input type="password" id="acc-input-new-pass" class="tactical-form-input" required />
                  </div>
                  <div class="form-field-group">
                    <label for="acc-input-confirm-pass" class="form-field-label">${t('KONFIRMASI PASSWORD BARU', 'CONFIRM NEW PASSWORD', lang)}</label>
                    <input type="password" id="acc-input-confirm-pass" class="tactical-form-input" required />
                  </div>
                  <button type="submit" class="tactical-cta-btn cta-orange" style="padding: 7px 14px; width: 100%; margin-top:6px;">
                    <span class="cta-inner">${t('GANTI PASSWORD', 'CHANGE PASSWORD', lang)}</span>
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
              <span class="modal-spec-tag">[ ${t('MASUKKAN LITERATUR BARU // RESEARCH REPOSITORY', 'NEW LITERATURE ENTRY // RESEARCH REPOSITORY', lang)} ]</span>
              <button type="button" class="modal-close-x" id="modal-paper-close" title="${t('Tutup', 'Close', lang)}">✕</button>
            </div>
            <form id="tactical-paper-form" class="tactical-modal-body">
              <div class="form-field-group">
                <label for="paper-input-title" class="form-field-label">${t('JUDUL MAKALAH / PAPER', 'PAPER TITLE', lang)}</label>
                <input type="text" id="paper-input-title" class="tactical-form-input" placeholder="e.g. Attention Is All You Need" required autofocus />
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div class="form-field-group">
                  <label for="paper-input-authors" class="form-field-label">${t('PENULIS', 'AUTHORS', lang)}</label>
                  <input type="text" id="paper-input-authors" class="tactical-form-input" placeholder="e.g. Vaswani et al." required />
                </div>
                <div class="form-field-group">
                  <label for="paper-input-year" class="form-field-label">${t('TAHUN / VENUE', 'YEAR / VENUE', lang)}</label>
                  <input type="text" id="paper-input-year" class="tactical-form-input" placeholder="e.g. 2026 · NeurIPS" required />
                </div>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div class="form-field-group">
                  <label for="paper-input-doi" class="form-field-label">${t('LINK DOI / ARXIV (OPSIONAL)', 'DOI / ARXIV LINK (OPTIONAL)', lang)}</label>
                  <input type="text" id="paper-input-doi" class="tactical-form-input" placeholder="e.g. 10.48550/arXiv..." />
                </div>
                <div class="form-field-group">
                  <label for="paper-input-project" class="form-field-label">${t('HUBUNGKAN KE PROYEK', 'LINK TO PROJECT', lang)}</label>
                  <select id="paper-input-project" class="tactical-form-select">
                    <option value="">[ ${t('GLOBAL / SEMUA PROYEK', 'GLOBAL / ALL PROJECTS', lang)} ]</option>
                    ${this.projects
                      .filter((p) => !p.trashed)
                      .map((p) => `<option value="${p.id}">${escapeHtml(p.title)}</option>`)
                      .join('')}
                  </select>
                </div>
              </div>
              <div class="form-field-group">
                <label for="paper-input-bibtex" class="form-field-label">${t('SITASI BIBTEX', 'BIBTEX CITATION', lang)}</label>
                <textarea id="paper-input-bibtex" class="tactical-form-textarea" rows="4" placeholder="@article{...}" required></textarea>
              </div>
              <div class="form-actions-row">
                <button type="submit" class="tactical-cta-btn cta-orange" style="padding: 9px 18px;">
                  <span class="cta-inner">[ ▶ ${t('SIMPAN KE PUSTAKA', 'SAVE TO LIBRARY', lang)} ]</span>
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
      list = list.filter(
        (t) => t.category.toLowerCase() === this.templateCategoryFilter.toLowerCase(),
      )
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
          <div class="template-card-footer" style="display: flex; gap: 8px;">
            <button class="tactical-cta-btn cta-orange btn-use-template" data-template-id="${tpl.id}" style="flex: 1; padding: 8px 10px;" title="${t('Gunakan template ini untuk membuat dokumen baru', 'Create new document with this template', lang)}">
              <span class="bracket-corner tl"></span>
              <span class="bracket-corner tr"></span>
              <span class="bracket-corner bl"></span>
              <span class="bracket-corner br"></span>
              <span class="cta-inner">+ ${t('GUNAKAN', 'USE', lang)}</span>
            </button>
            <button class="tactical-cta-btn cta-secondary btn-download-template-zip" data-template-id="${tpl.id}" style="padding: 8px 12px; font-weight: 700;" title="${t('Unduh paket template lengkap sebagai file .ZIP', 'Download complete template package as .ZIP file', lang)}">
              <span class="cta-inner">⬇ ZIP</span>
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
          await tacticalAlert({
            title: t('Akses Dibatasi', 'Access Restricted', getLang()),
            message: t(
              'Mode Baca: Akun Viewer tidak memiliki izin membuat dokumen baru.',
              'Read-Only Mode: Viewer accounts cannot create new documents.',
              getLang(),
            ),
            type: 'warning',
          })
          return
        }

        const defaultTitle = getLang() === 'en' ? tpl.titleEn : tpl.titleId
        const inputTitle = await tacticalPrompt({
          title: t('Judul Manuskrip Baru', 'New Manuscript Title', getLang()),
          specTag: t('TEMPLATE // PEMBUATAN NASKAH', 'TEMPLATE // NEW MANUSCRIPT', getLang()),
          message: t(
            'Beri judul untuk manuskrip baru ini:',
            'Enter a title for this new manuscript:',
            getLang(),
          ),
          defaultValue: defaultTitle,
          placeholder: 'e.g. IEEE Transactions Manuscript',
        })
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

    this.bindTemplateZipButtons()
    this.bindOnlineTemplateDownloader()
  }

  private bindTemplateZipButtons(): void {
    this.container.querySelectorAll('.btn-download-template-zip').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const tplId = btn.getAttribute('data-template-id')
        const tpl = TEMPLATES.find((t) => t.id === tplId)
        if (!tpl) return

        const origHtml = btn.innerHTML
        btn.innerHTML = '<span class="cta-inner">⏳ ...</span>'
        try {
          const zipBytes = await createZipArchive(tpl.files)
          const blob = new Blob([zipBytes as unknown as BlobPart], { type: 'application/zip' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${tpl.id}.zip`
          a.click()
          URL.revokeObjectURL(url)
        } catch (err: unknown) {
          await tacticalAlert({
            title: t('Gagal Mengunduh ZIP', 'ZIP Download Failed', getLang()),
            specTag: t('TEMPLATE // DOWNLOAD', 'TEMPLATE // DOWNLOAD', getLang()),
            message: `${String(err)}`,
            type: 'error',
          })
        } finally {
          btn.innerHTML = origHtml
        }
      })
    })
  }

  private async fetchOnlineProjectFromUrl(
    rawUrl: string,
  ): Promise<{ files: Record<string, string>; title: string }> {
    let url = rawUrl.trim()
    if (!url) throw new Error('URL cannot be empty')

    if (
      url.includes('github.com') &&
      !url.includes('/archive/') &&
      !url.includes('raw.githubusercontent.com') &&
      !url.endsWith('.tex') &&
      !url.endsWith('.zip')
    ) {
      const clean = url.replace(/\/+$/, '')
      url = `${clean}/archive/refs/heads/main.zip`
    }

    let resp = await fetch(url)
    if (!resp.ok && url.includes('/main.zip')) {
      url = url.replace('/main.zip', '/master.zip')
      resp = await fetch(url)
    }

    if (!resp.ok) {
      throw new Error(`Failed to fetch online template (${resp.status}: ${resp.statusText})`)
    }

    const buf = new Uint8Array(await resp.arrayBuffer())

    if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b) {
      const unzipped = await unzipLatexProject(buf)
      return {
        files: unzipped.files,
        title: unzipped.suggestedTitle || 'Imported Template',
      }
    }

    const text = new TextDecoder().decode(buf)
    const urlParts = rawUrl.split('/')
    const title = urlParts[urlParts.length - 1]?.replace(/\.tex$/i, '') || 'Online LaTeX Document'
    return {
      files: { 'main.tex': text },
      title,
    }
  }

  private bindOnlineTemplateDownloader(): void {
    const urlInput = this.container.querySelector('#dash-online-tpl-url') as HTMLInputElement | null
    const openBtn = this.container.querySelector(
      '#dash-online-tpl-open-btn',
    ) as HTMLButtonElement | null
    const zipBtn = this.container.querySelector(
      '#dash-online-tpl-zip-btn',
    ) as HTMLButtonElement | null

    openBtn?.addEventListener('click', async () => {
      const url = urlInput?.value.trim()
      if (!url) {
        await tacticalAlert({
          title: t('URL Diperlukan', 'URL Required', getLang()),
          specTag: t('TEMPLATE // INPUT URL', 'TEMPLATE // INPUT URL', getLang()),
          message: t('Silakan masukkan URL template GitHub atau link file terlebih dahulu.', 'Please enter GitHub template URL or file link first.', getLang()),
          type: 'warning',
        })
        return
      }

      openBtn.disabled = true
      openBtn.innerHTML = '<span class="cta-inner">⏳ MENGUNDUH...</span>'
      try {
        const result = await this.fetchOnlineProjectFromUrl(url)
        const curUser = getCurrentUser()
        const newProj: ProjectItem = {
          id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: result.title,
          owner: curUser?.name || curUser?.username || 'Researcher',
          ownerId: curUser?.userId || 'usr_admin',
          lastModified: Date.now(),
          tags: ['Online-Import', 'Template'],
          files: result.files,
        }
        await saveProject(newProj, curUser)
        this.projects = await getAllProjects(curUser)
        this.options.onOpenProject(newProj)
      } catch (err: unknown) {
        await tacticalAlert({
          title: t('Gagal Impor Template', 'Template Import Failed', getLang()),
          specTag: t('TEMPLATE // IMPORT ERROR', 'TEMPLATE // IMPORT ERROR', getLang()),
          message: `${String(err)}`,
          type: 'error',
        })
      } finally {
        openBtn.disabled = false
        openBtn.innerHTML = `<span class="cta-inner">+ ${t('BUKA DI STUDIO', 'OPEN IN STUDIO', getLang())}</span>`
      }
    })

    zipBtn?.addEventListener('click', async () => {
      const url = urlInput?.value.trim()
      if (!url) {
        await tacticalAlert({
          title: t('URL Diperlukan', 'URL Required', getLang()),
          specTag: t('TEMPLATE // INPUT URL', 'TEMPLATE // INPUT URL', getLang()),
          message: t('Silakan masukkan URL template GitHub atau link file terlebih dahulu.', 'Please enter GitHub template URL or file link first.', getLang()),
          type: 'warning',
        })
        return
      }

      zipBtn.disabled = true
      zipBtn.innerHTML = '<span class="cta-inner">⏳ MENGUNDUH...</span>'
      try {
        const result = await this.fetchOnlineProjectFromUrl(url)
        const zipBytes = await createZipArchive(result.files)
        const blob = new Blob([zipBytes as unknown as BlobPart], { type: 'application/zip' })
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `${result.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'template'}.zip`
        a.click()
        URL.revokeObjectURL(blobUrl)
      } catch (err: unknown) {
        await tacticalAlert({
          title: t('Gagal Unduh ZIP', 'ZIP Download Failed', getLang()),
          specTag: t('TEMPLATE // ZIP ERROR', 'TEMPLATE // ZIP ERROR', getLang()),
          message: `${String(err)}`,
          type: 'error',
        })
      } finally {
        zipBtn.disabled = false
        zipBtn.innerHTML = `<span class="cta-inner">⬇ ${t('UNDUH ZIP', 'DOWNLOAD ZIP', getLang())}</span>`
      }
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
        this.container
          .querySelectorAll('[data-tpl-cat]')
          .forEach((b) => {
            b.classList.remove('active')
          })
        btn.classList.add('active')
      })
    })

    const tplSearchInput = this.container.querySelector(
      '#dash-tpl-search-input',
    ) as HTMLInputElement | null
    const tplSearchClear = this.container.querySelector(
      '#dash-tpl-search-clear',
    ) as HTMLButtonElement | null

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
    const libProjectSelect = this.container.querySelector(
      '#dash-lib-project-select',
    ) as HTMLSelectElement | null
    libProjectSelect?.addEventListener('change', () => {
      this.selectedLibraryProject = libProjectSelect.value
      this.renderLibraryRows()
    })

    const libSearchInput = this.container.querySelector(
      '#dash-lib-search-input',
    ) as HTMLInputElement | null
    libSearchInput?.addEventListener('input', () => {
      this.renderLibraryRows(libSearchInput.value.trim().toLowerCase())
    })

    const paperDialog = this.container.querySelector(
      '#tactical-paper-dialog',
    ) as HTMLDialogElement | null
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
      const title = (
        this.container.querySelector('#paper-input-title') as HTMLInputElement
      )?.value.trim()
      const authors = (
        this.container.querySelector('#paper-input-authors') as HTMLInputElement
      )?.value.trim()
      const yearVenue = (
        this.container.querySelector('#paper-input-year') as HTMLInputElement
      )?.value.trim()
      const doi =
        (this.container.querySelector('#paper-input-doi') as HTMLInputElement)?.value.trim() || ''
      const targetProjId =
        (this.container.querySelector('#paper-input-project') as HTMLSelectElement)?.value ||
        undefined
      const bibtex = (
        this.container.querySelector('#paper-input-bibtex') as HTMLTextAreaElement
      )?.value.trim()

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
        await tacticalAlert({
          title: t('Pustaka Disimpan', 'Library Saved', getLang()),
          specTag: t(
            'RESEARCH LIBRARY // PAPER ENTRY',
            'RESEARCH LIBRARY // PAPER ENTRY',
            getLang(),
          ),
          message: t(
            `Literatur "${title}" berhasil disimpan ke Research Library!`,
            `Paper "${title}" successfully saved to Research Library!`,
            getLang(),
          ),
          type: 'success',
        })
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
    logoutBtn?.addEventListener('click', async () => {
      const confirmed = await tacticalConfirm({
        title: t('Keluar dari Akun', 'Confirm Sign Out', getLang()),
        specTag: t('IAM // OPERATOR SESSION', 'IAM // OPERATOR SESSION', getLang()),
        message: t(
          'Keluar dari sesi operator dan kembali ke halaman utama?',
          'Sign out of operator session and return to homepage?',
          getLang(),
        ),
        confirmText: t('YA, KELUAR', 'YES, SIGN OUT', getLang()),
        danger: true,
      })
      if (confirmed) {
        logoutUser()
        if (this.options.onLogout) {
          this.options.onLogout()
        } else {
          window.location.reload()
        }
      }
    })

    // Account settings dialog bindings
    const accountDialog = this.container.querySelector(
      '#tactical-account-dialog',
    ) as HTMLDialogElement | null
    const accountSettingsBtn = this.container.querySelector('#dash-account-settings-btn')
    const accountCloseBtn = this.container.querySelector('#modal-account-close')
    const formUsername = this.container.querySelector(
      '#form-change-username',
    ) as HTMLFormElement | null
    const formPassword = this.container.querySelector(
      '#form-change-password',
    ) as HTMLFormElement | null
    const accUserMsg = this.container.querySelector('#acc-user-msg') as HTMLElement | null
    const accPassMsg = this.container.querySelector('#acc-pass-msg') as HTMLElement | null

    accountSettingsBtn?.addEventListener('click', () => {
      const curUser = getCurrentUser()
      if (!curUser) return
      const idEl = this.container.querySelector('#acc-info-id')
      const roleEl = this.container.querySelector('#acc-info-role')
      const userInput = this.container.querySelector(
        '#acc-input-new-user',
      ) as HTMLInputElement | null
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
      const newUsername = (
        this.container.querySelector('#acc-input-new-user') as HTMLInputElement
      )?.value.trim()
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
      const oldPass = (this.container.querySelector('#acc-input-old-pass') as HTMLInputElement)
        ?.value
      const newPass = (this.container.querySelector('#acc-input-new-pass') as HTMLInputElement)
        ?.value
      const confirmPass = (
        this.container.querySelector('#acc-input-confirm-pass') as HTMLInputElement
      )?.value

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
        await tacticalAlert({
          title: t('R2 Belum Terhubung', 'R2 Storage Not Connected', getLang()),
          specTag: t('STORAGE // CLOUDFLARE R2', 'STORAGE // CLOUDFLARE R2', getLang()),
          message: t(
            'Cloudflare R2 Bucket belum terhubung di runtime saat ini.\n\nUntuk mengaktifkan penyimpanan dokumen pribadi di R2:\n1. Buat bucket: npx wrangler r2 bucket create wasmtex-documents\n2. Binding MY_BUCKET sudah disiapkan di wrangler.jsonc\n3. Deploy: npm run deploy',
            'Cloudflare R2 Bucket is not connected in the current runtime.\n\nTo enable private document storage on R2:\n1. Create bucket: npx wrangler r2 bucket create wasmtex-documents\n2. Binding MY_BUCKET is ready in wrangler.jsonc\n3. Deploy: npm run deploy',
            getLang(),
          ),
          type: 'warning',
        })
        return
      }

      let successCount = 0
      for (const p of this.projects) {
        const ok = await backupProjectToR2(p)
        if (ok) successCount++
      }
      await tacticalAlert({
        title: t('Sinkronisasi Berhasil', 'Sync Successful', getLang()),
        specTag: t('STORAGE // CLOUDFLARE R2', 'STORAGE // CLOUDFLARE R2', getLang()),
        message: t(
          `Berhasil sinkronisasi ${successCount} dokumen ke Cloudflare R2 Bucket!`,
          `Successfully synchronized ${successCount} document(s) to Cloudflare R2 Bucket!`,
          getLang(),
        ),
        type: 'success',
      })
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
          await tacticalAlert({
            title: t('Gagal Ekstrak ZIP', 'ZIP Extraction Failed', getLang()),
            specTag: t('ARSIP // ZIP PARSER', 'ARCHIVE // ZIP PARSER', getLang()),
            message: `${err?.message || err}`,
            type: 'error',
          })
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
          lowerTags.some((t) =>
            ['journal', 'ieee', 'elsevier', 'nature', 'sensors', 'paper'].includes(t),
          ) ||
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
        if (
          (e.target as HTMLElement).closest('.tactical-btn-action') ||
          (e.target as HTMLElement).closest('.btn-add-tag')
        )
          return
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
        const input = await tacticalPrompt({
          title: t('Edit Tag Proyek', 'Edit Project Tags', lang),
          specTag: t('METADATA // TAGS', 'METADATA // TAGS', lang),
          message: t(
            `Kelola tag kata kunci untuk "${found.title}" (pisahkan koma):`,
            `Manage tags for "${found.title}" (comma-separated):`,
            lang,
          ),
          defaultValue: found.tags?.join(', ') || '',
          placeholder: 'LaTeX, Journal, Draft',
        })
        if (input !== null) {
          found.tags = input
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
          const curUser = getCurrentUser()
          await saveProject(found, curUser)
          this.projects = await getAllProjects(curUser)
          this.renderTags()
          this.renderProjectRows(searchQuery)
        }
      })
    })

    tbody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = (btn as HTMLElement).getAttribute('data-id')!
        const found = this.projects.find((p) => p.id === id)
        const docTitle = found?.title || 'manuskrip'
        const confirmed = await tacticalConfirm({
          title: t('Hapus Manuskrip', 'Delete Manuscript', lang),
          specTag: t('PROYEK // HAPUS PERMANEN', 'PROJECT // PERMANENT DELETE', lang),
          message: t(
            `Hapus manuskrip "${docTitle}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
            `Permanently delete manuscript "${docTitle}"? This action cannot be undone.`,
            lang,
          ),
          confirmText: t('YA, HAPUS', 'YES, DELETE', lang),
          danger: true,
        })
        if (confirmed) {
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
    const lang = getLang()
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
            await tacticalAlert({
              title: t('Tidak Ada Proyek', 'No Active Projects', lang),
              specTag: t('BIBTEX // TARGET PROJECT', 'BIBTEX // TARGET PROJECT', lang),
              message: t(
                'Tidak ada proyek aktif. Silakan buat proyek baru terlebih dahulu.',
                'No active projects. Please create a new project first.',
                lang,
              ),
              type: 'warning',
            })
            return
          }
          const promptText =
            t(
              'Pilih nomor proyek tujuan untuk menambahkan BibTeX:\n',
              'Select target project number to append BibTeX:\n',
              lang,
            ) + activeProjects.map((p, idx) => `${idx + 1}. ${p.title}`).join('\n')
          const ans = await tacticalPrompt({
            title: t('Pilih Proyek Tujuan', 'Select Target Project', lang),
            specTag: t('BIBTEX // TARGET PROJECT', 'BIBTEX // TARGET PROJECT', lang),
            message: promptText,
            defaultValue: '1',
          })
          if (!ans) return
          const selectedIdx = parseInt(ans.trim(), 10) - 1
          targetProj = activeProjects[selectedIdx]
        }

        if (!targetProj) {
          await tacticalAlert({
            title: t('Pilihan Tidak Valid', 'Invalid Selection', lang),
            message: t('Pilihan proyek tidak valid.', 'Invalid project selection.', lang),
            type: 'error',
          })
          return
        }

        const res = await addPaperToProjectBibtex(paper, targetProj)
        await tacticalAlert({
          title: t('Sitasi Ditambahkan', 'Citation Added', lang),
          specTag: t('BIBTEX // INSERTION', 'BIBTEX // INSERTION', lang),
          message: res.message,
          type: 'success',
        })
      })
    })

    tbody.querySelectorAll('.btn-copy-bibtex').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = btn.getAttribute('data-id')
        const paper = this.papers.find((p) => p.id === id)
        if (paper) {
          if (navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(paper.bibtex)
              await tacticalAlert({
                title: t('BibTeX Disalin', 'BibTeX Copied', lang),
                message: `✓ BibTeX [${paper.id}] ${t('berhasil disalin ke clipboard!', 'copied to clipboard!', lang)}`,
                type: 'success',
              })
              return
            } catch {}
          }
          await tacticalPrompt({
            title: 'BibTeX',
            specTag: 'BIBTEX // CODE',
            message: t('Salin kode BibTeX berikut:', 'Copy the following BibTeX code:', lang),
            defaultValue: paper.bibtex,
            multiline: true,
          })
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
          t(
            'Hubungkan literatur ini ke proyek mana?\n0. [ Global / Semua Proyek ]\n',
            'Link this paper to which project?\n0. [ Global / All Projects ]\n',
            lang,
          ) + activeProjects.map((p, idx) => `${idx + 1}. ${p.title}`).join('\n')
        const ans = await tacticalPrompt({
          title: t('Hubungkan Paper ke Proyek', 'Link Paper to Project', lang),
          specTag: t('RESEARCH LIBRARY // LINKAGE', 'RESEARCH LIBRARY // LINKAGE', lang),
          message: promptText,
          defaultValue: '0',
        })
        if (ans === null) return
        const idx = parseInt(ans.trim(), 10)
        if (idx === 0) {
          delete paper.projectId
        } else if (activeProjects[idx - 1]) {
          paper.projectId = activeProjects[idx - 1]!.id
        } else {
          await tacticalAlert({
            title: t('Pilihan Tidak Valid', 'Invalid Selection', lang),
            message: t('Pilihan tidak valid.', 'Invalid selection.', lang),
            type: 'error',
          })
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
        if (!paper) return
        const confirmed = await tacticalConfirm({
          title: t('Hapus Literatur', 'Delete Paper', lang),
          specTag: t('RESEARCH LIBRARY // DELETE', 'RESEARCH LIBRARY // DELETE', lang),
          message: t(
            `Hapus "${paper.title}" dari Research Library?`,
            `Delete "${paper.title}" from Research Library?`,
            lang,
          ),
          confirmText: t('YA, HAPUS', 'YES, DELETE', lang),
          danger: true,
        })
        if (confirmed) {
          await deletePaper(paper.id)
          this.papers = await getAllPapers()
          this.render()
        }
      })
    })
  }

  private async promptNewProject(): Promise<void> {
    const title = await tacticalPrompt({
      title: t('Judul Manuskrip Baru', 'New Manuscript Title', getLang()),
      specTag: t('PROYEK BARU // NEW PROJECT', 'NEW PROJECT // MANUSCRIPT', getLang()),
      message: t(
        'Masukkan judul untuk manuskrip LaTeX baru:',
        'Enter title for the new LaTeX manuscript:',
        getLang(),
      ),
      placeholder: 'e.g. Comparative Study on Machine Learning',
      defaultValue: t('Manuskrip Baru', 'New Manuscript', getLang()),
    })
    if (!title) return

    const tagInput = await tacticalPrompt({
      title: t('Tag & Kategori Proyek', 'Project Tags & Categories', getLang()),
      specTag: t('METADATA // TAGS', 'METADATA // TAGS', getLang()),
      message: t(
        'Tag / Kategori (opsional, kosongkan jika tidak ada, pisahkan koma):',
        'Tags / Categories (optional, comma-separated):',
        getLang(),
      ),
      defaultValue: 'Draft, Research',
      placeholder: 'Journal, Thesis, IEEE',
    })
    const tags = tagInput
      ? tagInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []

    const curUser = getCurrentUser()
    const authorName = curUser?.username || curUser?.name || 'Operator'
    const id = `proj_${Date.now()}`
    const newProj: ProjectItem = {
      id,
      title: title.trim(),
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
