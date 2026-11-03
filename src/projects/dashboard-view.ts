import { OVERLEAF_ICONS } from '../ui/logo'
import {
  changePassword,
  changeUsername,
  createUser,
  deleteUser,
  getAllUsers,
  getCurrentUser,
  logoutUser,
  updateUserProfile,
  type UserRole,
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
  restoreProject,
  saveProject,
} from './project-store'
import { backupProjectToR2, checkR2StorageAvailable } from './r2-storage'

export interface DashboardViewOptions {
  onOpenProject: (project: ProjectItem) => void
  onToggleTheme: () => void
  isDarkMode: () => boolean
  onLogout?: () => void
}

export class DashboardView {
  private container: HTMLElement
  private options: DashboardViewOptions
  private projects: ProjectItem[] = []
  private papers: ResearchPaper[] = []
  private selectedLibraryProject = 'all'
  private currentFilter: 'all' | 'all_iam' | 'library' | 'archived' | 'trash' | string = 'all'

  constructor(container: HTMLElement, options: DashboardViewOptions) {
    this.container = container
    this.options = options
  }

  async init(): Promise<void> {
    const currentUser = getCurrentUser()
    this.projects = await getAllProjects(currentUser, this.currentFilter === 'all_iam')
    this.papers = await getAllPapers()
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
              [ PROYEK SAYA (${activeCount}) ]
            </button>
            ${
              currentUser?.role === 'admin'
                ? `
            <button class="tactical-nav-btn ${this.currentFilter === 'all_iam' ? 'active' : ''}" data-filter="all_iam" title="Tampilkan seluruh proyek lintas user dalam sistem IAM">
              [ 🌐 SEMUA PROYEK (IAM) ]
            </button>`
                : ''
            }
            <button class="tactical-nav-btn ${this.currentFilter === 'library' ? 'active' : ''}" data-filter="library">
              [ 📚 RESEARCH LIBRARY (${this.papers.length}) ]
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
                <button id="dash-account-settings-btn" class="tactical-user-tag-btn" title="Kelola Profil & Akun (@${escapeHtml(currentUser.username)})">
                  <span class="user-bracket">&lt;</span>
                  <span class="user-text">OPERATOR // ${escapeHtml(currentUser.username.toUpperCase())} [${escapeHtml(currentUser.role.toUpperCase())}]</span>
                  <span class="user-bracket">&gt;</span>
                </button>
                ${
                  currentUser.role === 'admin'
                    ? `<button id="dash-iam-mgmt-btn" class="tactical-btn-action iam-pill-btn" style="font-size:10px; padding:3px 8px; margin-left:4px; border-color:#FF4D2D; color:#FF4D2D; font-weight:700;" title="Konsol IAM & Manajemen Pengguna">🛡️ IAM CONSOLE</button>`
                    : ''
                }
                <button id="dash-logout-btn" class="tactical-btn-action" style="font-size:10.5px; padding:3px 8px; margin-left:4px;" title="Keluar / Logout">LOGOUT</button>
              </div>
            `
                : ''
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
                  PURPOSE: BROWSER-NATIVE SCIENTIFIC PUBLISHING &amp; LATEX WORKSPACE
                </div>
                <h1 class="hero-headline-serif">
                  Scaling Academic<span class="headline-reg">®</span> Research &amp; LaTeX Intelligence
                </h1>
                <p class="hero-description-mono">
                  Pusat kerja terpadu untuk penulisan naskah LaTeX, kompilasi WebAssembly sub-detik, sinkronisasi AST, dan manajemen referensi sitasi riset tanpa instalasi lokal.
                </p>

                <div class="hero-action-row">
                  ${
                    currentUser?.role !== 'viewer'
                      ? `
                  <button id="dash-new-project-btn" class="tactical-cta-btn cta-orange" title="Mulai buat dokumen LaTeX baru dari template awal">
                    <span class="bracket-corner tl"></span>
                    <span class="bracket-corner tr"></span>
                    <span class="bracket-corner bl"></span>
                    <span class="bracket-corner br"></span>
                    <span class="cta-inner">+ NEW MANUSCRIPT</span>
                  </button>

                  <label for="dash-import-file-input" class="tactical-cta-btn cta-secondary" title="Impor file .tex tunggal atau .zip proyek (otomatis diekstrak)">
                    <span class="bracket-corner tl"></span>
                    <span class="bracket-corner tr"></span>
                    <span class="bracket-corner bl"></span>
                    <span class="bracket-corner br"></span>
                    <span class="cta-inner">⬆ IMPORT LATEX / ZIP</span>
                    <input type="file" id="dash-import-file-input" accept=".tex,.bib,.txt,.zip" style="display:none;" />
                  </label>
                  `
                      : `
                  <div class="viewer-notice-box" style="padding:8px 12px; background:var(--bg-secondary); border:1px solid var(--border-color); font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">
                    👁️ MODE BACA (VIEWER): AKUN HANYA-BACA, KOMPILASI &amp; REVIEW AKTIF
                  </div>
                  `
                  }

                  <button id="dash-goto-library-btn" class="tactical-cta-btn cta-secondary" title="Kelola katalog referensi literatur dan sitasi BibTeX">
                    <span class="bracket-corner tl"></span>
                    <span class="bracket-corner tr"></span>
                    <span class="bracket-corner bl"></span>
                    <span class="bracket-corner br"></span>
                    <span class="cta-inner">📚 RESEARCH LIBRARY</span>
                  </button>
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
              : `
          <!-- Project Archive & Management Section -->
          <section class="tactical-archive-section">
            <div class="archive-section-header">
              <div class="archive-title-wrap">
                <span class="archive-index">[ 01 ]</span>
                <div>
                  <div class="archive-heading">MANUSCRIPT &amp; RESEARCH ARCHIVE</div>
                  <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                    Daftar dokumen naskah ilmiah Anda. Klik baris dokumen untuk membuka dan mengedit langsung di editor workspace.
                  </div>
                </div>
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
        <dialog id="tactical-account-dialog" class="tactical-login-modal">
          <div class="tactical-modal-frame" style="max-width: 520px; width: 92vw;">
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

        <!-- Admin IAM Console Dialog -->
        <dialog id="tactical-iam-dialog" class="tactical-login-modal">
          <div class="tactical-modal-frame" style="max-width: 760px; width: 95vw;">
            <span class="bracket-corner tl"></span>
            <span class="bracket-corner tr"></span>
            <span class="bracket-corner bl"></span>
            <span class="bracket-corner br"></span>
            <div class="tactical-modal-header">
              <span class="modal-spec-tag">[ ENTERPRISE IAM &amp; MANAJEMEN PENGGUNA // MULTI-TENANT RBAC ]</span>
              <button type="button" class="modal-close-x" id="modal-iam-close" title="Tutup">✕</button>
            </div>
            <div class="tactical-modal-body">
              <div id="iam-feedback-msg" class="msg-box" style="display:none; padding:8px 12px; margin-bottom:12px; font-family:var(--font-mono); font-size:11px;"></div>

              <div class="iam-dialog-table-wrap" style="border:1px solid var(--border-color); padding:10px; background:var(--bg-primary); margin-bottom:14px; max-height:220px; overflow-y:auto;">
                <div class="sub-sec-title" style="font-family:var(--font-mono); font-size:11px; font-weight:700; margin-bottom:6px;">[ DAFTAR PENGGUNA TERDAFTAR ]</div>
                <table class="iam-users-table" style="width:100%; font-size:11px; border-collapse:collapse;">
                  <thead>
                    <tr style="border-bottom:1px solid var(--border-color); text-align:left; font-family:var(--font-mono);">
                      <th style="padding:4px 6px;">USERNAME</th>
                      <th style="padding:4px 6px;">NAMA TAMPILAN</th>
                      <th style="padding:4px 6px;">ROLE</th>
                      <th style="padding:4px 6px;">ID</th>
                      <th style="padding:4px 6px; text-align:right;">AKSI</th>
                    </tr>
                  </thead>
                  <tbody id="iam-users-tbody"></tbody>
                </table>
              </div>

              <!-- Form Add User -->
              <div class="form-sub-section" style="border:1px solid var(--border-color); padding:12px; background:var(--bg-primary);">
                <div class="sub-sec-title" style="font-family:var(--font-mono); font-size:11px; font-weight:700; margin-bottom:8px;">[ + TAMBAH AKUN PENGGUNA BARU ]</div>
                <form id="form-create-user" style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div class="form-field-group">
                    <label for="new-user-username" class="form-field-label">USERNAME</label>
                    <input type="text" id="new-user-username" class="tactical-form-input" placeholder="e.g. researcher2" required />
                  </div>
                  <div class="form-field-group">
                    <label for="new-user-name" class="form-field-label">NAMA LENGKAP</label>
                    <input type="text" id="new-user-name" class="tactical-form-input" placeholder="e.g. Prof. Budi" required />
                  </div>
                  <div class="form-field-group">
                    <label for="new-user-password" class="form-field-label">PASSWORD (MIN 6)</label>
                    <input type="password" id="new-user-password" class="tactical-form-input" placeholder="••••••••" required />
                  </div>
                  <div class="form-field-group">
                    <label for="new-user-role" class="form-field-label">HAK AKSES / ROLE</label>
                    <select id="new-user-role" class="tactical-form-input">
                      <option value="researcher">Researcher (Proyek Mandiri)</option>
                      <option value="admin">Admin (Akses Penuh IAM)</option>
                      <option value="viewer">Viewer (Read-Only Reviewer)</option>
                    </select>
                  </div>
                  <div style="grid-column: 1 / -1; margin-top:4px;">
                    <button type="submit" class="tactical-cta-btn cta-orange" style="width: 100%; padding: 8px 14px;">
                      <span class="cta-inner">+ DAFTARKAN AKUN BARU KE SISTEM IAM</span>
                    </button>
                  </div>
                </form>
              </div>

              <div class="iam-note-box" style="margin-top:12px; padding:8px 12px; background:var(--bg-secondary); border:1px solid var(--border-color); font-family:var(--font-mono); font-size:10.5px; color:var(--text-secondary); display:flex; align-items:center; gap:8px;">
                <span>🛡️</span>
                <span><strong>JAMINAN ANTI-BENTROK:</strong> Setiap user memiliki <code>ownerId</code> unik di IndexedDB. Proyek antar pengguna dijamin terisolasi dan tidak akan saling menimpa.</span>
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
    } else {
      this.renderTags()
      this.renderProjectRows()
    }
  }

  private bindEvents(): void {
    const newBtn = this.container.querySelector('#dash-new-project-btn')
    newBtn?.addEventListener('click', () => this.promptNewProject())

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

    // IAM Management dialog bindings (Admin only)
    const iamDialog = this.container.querySelector('#tactical-iam-dialog') as HTMLDialogElement | null
    const iamBtn = this.container.querySelector('#dash-iam-mgmt-btn')
    const iamCloseBtn = this.container.querySelector('#modal-iam-close')
    const formCreateUser = this.container.querySelector('#form-create-user') as HTMLFormElement | null
    const iamMsg = this.container.querySelector('#iam-feedback-msg') as HTMLElement | null

    const renderIamUsersList = () => {
      const tbody = this.container.querySelector('#iam-users-tbody')
      if (!tbody) return
      const users = getAllUsers()
      const curUser = getCurrentUser()

      tbody.innerHTML = users
        .map(
          (u) => `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding:6px 6px;"><strong>${escapeHtml(u.username)}</strong></td>
          <td style="padding:6px 6px;">${escapeHtml(u.name)}</td>
          <td style="padding:6px 6px;"><span class="role-badge ${u.role}">${escapeHtml(u.role.toUpperCase())}</span></td>
          <td style="padding:6px 6px;"><code style="font-size:10px;">${escapeHtml(u.id)}</code></td>
          <td style="padding:6px 6px; text-align:right;">
            <div style="display:inline-flex; gap:4px; align-items:center;">
              <select class="iam-role-select" data-id="${u.id}" style="padding:2px 4px; font-size:10px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border-color);">
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="researcher" ${u.role === 'researcher' ? 'selected' : ''}>Researcher</option>
                <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>Viewer</option>
              </select>
              <button class="tactical-btn-action btn-iam-reset-pass" data-id="${u.id}" style="font-size:10px; padding:2px 6px;" title="Reset password pengguna">RESET PASS</button>
              ${
                u.id !== curUser?.userId && u.id !== 'usr_admin'
                  ? `<button class="tactical-btn-action btn-iam-del-user" data-id="${u.id}" style="font-size:10px; padding:2px 6px; color:#EF4444; border-color:#EF4444;" title="Hapus pengguna">✕</button>`
                  : ''
              }
            </div>
          </td>
        </tr>
      `
        )
        .join('')

      tbody.querySelectorAll('.iam-role-select').forEach((sel) => {
        sel.addEventListener('change', (e) => {
          const target = e.currentTarget as HTMLSelectElement
          const targetUserId = target.getAttribute('data-id')
          const newRole = target.value as UserRole
          if (targetUserId) {
            updateUserProfile(targetUserId, { role: newRole })
            if (iamMsg) {
              iamMsg.style.display = 'block'
              iamMsg.style.color = '#22C55E'
              iamMsg.textContent = `✓ Role pengguna berhasil diubah ke ${newRole.toUpperCase()}.`
            }
            renderIamUsersList()
          }
        })
      })

      tbody.querySelectorAll('.btn-iam-reset-pass').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLElement
          const targetUserId = target.getAttribute('data-id')
          if (!targetUserId) return
          const newPass = prompt('Masukkan password baru untuk pengguna ini (minimal 6 karakter):')
          if (newPass) {
            const res = changePassword(targetUserId, null, newPass, true)
            if (res.success) {
              alert('✓ Password pengguna berhasil direset!')
            } else {
              alert(res.error || 'Gagal mereset password.')
            }
          }
        })
      })

      tbody.querySelectorAll('.btn-iam-del-user').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLElement
          const targetUserId = target.getAttribute('data-id')
          if (!targetUserId) return
          if (confirm('Yakin ingin menghapus akun pengguna ini dari sistem IAM?')) {
            const res = deleteUser(targetUserId, curUser?.userId)
            if (res.success) {
              if (iamMsg) {
                iamMsg.style.display = 'block'
                iamMsg.style.color = '#22C55E'
                iamMsg.textContent = '✓ Akun pengguna berhasil dihapus dari IAM.'
              }
              renderIamUsersList()
            } else {
              alert(res.error || 'Gagal menghapus user.')
            }
          }
        })
      })
    }

    iamBtn?.addEventListener('click', () => {
      renderIamUsersList()
      if (iamMsg) iamMsg.style.display = 'none'
      iamDialog?.showModal()
    })

    iamCloseBtn?.addEventListener('click', () => {
      iamDialog?.close()
    })

    formCreateUser?.addEventListener('submit', (e) => {
      e.preventDefault()
      const userInput = (this.container.querySelector('#new-user-username') as HTMLInputElement)?.value
      const passInput = (this.container.querySelector('#new-user-password') as HTMLInputElement)?.value
      const nameInput = (this.container.querySelector('#new-user-name') as HTMLInputElement)?.value
      const roleInput = (this.container.querySelector('#new-user-role') as HTMLSelectElement)?.value as UserRole

      const res = createUser(userInput, passInput, nameInput, roleInput)
      if (iamMsg) {
        iamMsg.style.display = 'block'
        if (res.success) {
          iamMsg.style.color = '#22C55E'
          iamMsg.textContent = `✓ Pengguna "${userInput}" berhasil didaftarkan sebagai ${roleInput.toUpperCase()}. Proyek terisolasi siap digunakan.`
          formCreateUser.reset()
          renderIamUsersList()
        } else {
          iamMsg.style.color = '#EF4444'
          iamMsg.textContent = res.error || 'Gagal membuat pengguna baru.'
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
      this.projects = await getAllProjects(curUser, this.currentFilter === 'all_iam')
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
      this.projects = await getAllProjects(curUser, this.currentFilter === 'all_iam')
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
