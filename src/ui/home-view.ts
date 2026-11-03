import {
  authenticate,
  registerAccount,
  type UserSession,
} from '../auth/auth-store'
import { getLang, t, toggleLang, type Lang } from './i18n'
import { OVERLEAF_ICONS } from './logo'

export interface HomeViewOptions {
  onLoginSuccess: (session: UserSession) => void
  onToggleTheme: () => void
  isDarkMode: () => boolean
  onToggleLang?: () => void
}

export class HomeView {
  private container: HTMLElement
  private options: HomeViewOptions
  private activeTourTab: 'workspace' | 'dashboard' | 'library' = 'workspace'
  private authTab: 'login' | 'register' = 'login'

  constructor(container: HTMLElement, options: HomeViewOptions) {
    this.container = container
    this.options = options
  }

  init(): void {
    this.render()
    this.bindEvents()
  }

  private render(): void {
    const isDark = this.options.isDarkMode()
    const lang = getLang()

    this.container.innerHTML = `
      <div class="cortex-home-root">
        <!-- Top Confidential Ribbon -->
        <div class="tactical-top-strip">
          <div class="top-strip-left">
            <span class="strip-bracket">[</span>
            <span class="strip-text">${t(
              'KLASIFIKASI: SHOWCASE PUBLIK // SPESIFIKASI WASMTEX-V2',
              'CLASSIFICATION: PUBLIC SHOWCASE // SPEC WASMTEX-V2',
              lang
            )}</span>
            <span class="strip-bracket">]</span>
          </div>
          <div class="top-strip-right">
            <span class="status-indicator-dot">●</span>
            <span class="strip-text">${t(
              'ENGINE: WEBASSEMBLY // KOMPILASI ZERO-SERVER // TEX LIVE 2025-2026',
              'ENGINE: WEBASSEMBLY // ZERO-SERVER COMPILATION // TEX LIVE 2025-2026',
              lang
            )}</span>
          </div>
        </div>

        <!-- High-Contrast Navigation Header -->
        <header class="tactical-navbar home-nav">
          <div class="tactical-nav-left">
            <div class="tactical-brand-wrap">
              <span class="tactical-brand-logo">CorTeX</span>
              <span class="tactical-brand-reg">®</span>
              <span class="tactical-brand-spec">/ ${t('STUDIO LATEX WEBASSEMBLY & RISET ILMIAH', 'WEBASSEMBLY LATEX STUDIO & RESEARCH SUITE', lang)}</span>
            </div>
          </div>

          <nav class="tactical-nav-center home-nav-links">
            <a href="#home-features" class="tactical-nav-btn">${t('[ FITUR UTAMA ]', '[ KEY FEATURES ]', lang)}</a>
            <a href="#home-showcase" class="tactical-nav-btn">${t('[ SCREENSHOT & TUR ]', '[ SCREENSHOTS & TOUR ]', lang)}</a>
            <a href="#home-login-sec" class="tactical-nav-btn">${t('[ AKSES MASUK ]', '[ ACCESS LOGIN ]', lang)}</a>
          </nav>

          <div class="tactical-nav-right">
            <button id="home-lang-toggle" class="tactical-icon-toggle" title="${t('Ganti Bahasa (ID / EN)', 'Switch Language (ID / EN)', lang)}">
              🌐 <span class="toggle-mode-label">${lang.toUpperCase()}</span>
            </button>
            <button id="home-theme-toggle" class="tactical-icon-toggle" title="Toggle Light / Dark Mode">
              ${isDark ? OVERLEAF_ICONS.themeSun : OVERLEAF_ICONS.themeMoon}
              <span class="toggle-mode-label">${isDark ? 'LIGHT' : 'DARK'}</span>
            </button>
            <a href="#home-login-sec" class="tactical-login-btn" style="text-decoration:none;">
              ${t('[ 👤 MASUK / LOGIN ]', '[ 👤 SIGN IN / LOGIN ]', lang)}
            </a>
          </div>
        </header>

        <!-- Main Home Scroll Container -->
        <div class="home-scroll-body">
          <!-- Hero Section -->
          <section class="home-hero-section">
            <div class="home-hero-glow"></div>
            <div class="home-hero-content">
              <div class="unit-classification-tag">
                ${t(
                  'SPESIFIKASI: SDK LATEX & STUDIO RISET BERPERFORMA TINGGI DI BROWSER',
                  'SPECIFICATION: IN-BROWSER HIGH-PERFORMANCE LATEX SDK & RESEARCH STUDIO',
                  lang
                )}
              </div>
              <h1 class="home-hero-title">
                ${t('Kompilasi Dokumen LaTeX Standar Jurnal', 'International Journal LaTeX Compilation', lang)}<br />
                <span class="hero-highlight">${t('100% di Browser Client', '100% In Client Browser', lang)}</span> ${t('Tanpa Ketergantungan Server', 'Without Server Dependencies', lang)}
              </h1>
              <p class="home-hero-desc">
                ${t(
                  'CorTeX WasmTex mengintegrasikan engine TeX Live 2025/2026 bertenaga WebAssembly langsung di peramban Anda. Nikmati penulisan naskah saintifik dengan Visual KaTeX Editor, Monaco Code Editor dengan syntax highlighting, SyncTeX 2-arah interaktif, Research Library dengan auto-sync BibTeX, serta <strong>sistem Multi-Akun terisolasi</strong> yang menjamin dokumen setiap pengguna aman mandiri.',
                  'CorTeX WasmTex embeds the WebAssembly-powered TeX Live 2025/2026 engine directly in your client browser. Experience scientific authoring with Visual KaTeX Equation editor, Monaco Code Editor with syntax highlighting, interactive 2-way SyncTeX, Research Library with automated BibTeX sync, and isolated Multi-Account workspace ensuring private projects for each user.',
                  lang
                )}
              </p>

              <!-- Main Hero Action Button -->
              <div class="home-hero-actions">
                <a href="#home-login-sec" class="tactical-cta-btn cta-orange" style="padding: 10px 24px;">
                  <span class="bracket-corner tl"></span>
                  <span class="bracket-corner tr"></span>
                  <span class="bracket-corner bl"></span>
                  <span class="bracket-corner br"></span>
                  <span class="cta-inner" style="font-size: 13px;">🚀 ${t('MASUK KE DASHBOARD & PROYEK', 'ACCESS DASHBOARD & PROJECTS', lang)}</span>
                </a>
              </div>

              <!-- Metric & Capability Badges -->
              <div class="home-badge-row">
                <div class="home-badge-pill">
                  <span class="badge-dot">●</span>
                  <strong>ZERO SERVER COMPILATION</strong>: ${t('Privasi total dokumen Anda', '100% client-side privacy', lang)}
                </div>
                <div class="home-badge-pill">
                  <span class="badge-dot cyan">●</span>
                  <strong>TEX LIVE 2025 &amp; 2026</strong>: ${t('Engine PDFTeX & XeTeX', 'PDFTeX & XeTeX Engine', lang)}
                </div>
                <div class="home-badge-pill">
                  <span class="badge-dot orange">●</span>
                  <strong>MULTI-AKUN MANDIRI</strong>: ${t('Proyek terisolasi per pengguna', 'Private projects per account', lang)}
                </div>
                <div class="home-badge-pill">
                  <span class="badge-dot">●</span>
                  <strong>OFFLINE-FIRST</strong>: IndexedDB &amp; Cloudflare R2
                </div>
              </div>
            </div>
          </section>

          <!-- Interactive UI Showcase / Screenshots Tour -->
          <section id="home-showcase" class="home-showcase-section">
            <div class="section-header-wrap">
              <div class="section-tag">[ INTERACTIVE SHOWCASE // TAMPILAN SISTEM ]</div>
              <h2 class="section-title">Contoh Screenshot &amp; Lingkungan Kerja CorTeX</h2>
              <p class="section-subtitle">
                Jelajahi antarmuka studio penulisan naskah, dashboard taktis, pustaka riset, dan konsol IAM sebelum Anda masuk.
              </p>
            </div>

            <!-- Tab Switcher -->
            <div class="showcase-nav-tabs">
              <button class="showcase-tab-btn ${this.activeTourTab === 'workspace' ? 'active' : ''}" data-tab="workspace">
                ${t('✍️ WORKSPACE 3-PANEL (EDITOR & PDF)', '✍️ 3-PANE WORKSPACE (EDITOR & PDF)', lang)}
              </button>
              <button class="showcase-tab-btn ${this.activeTourTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
                ${t('📊 DASHBOARD PROYEK TAKTIS', '📊 TACTICAL PROJECTS DASHBOARD', lang)}
              </button>
              <button class="showcase-tab-btn ${this.activeTourTab === 'library' ? 'active' : ''}" data-tab="library">
                ${t('📚 RESEARCH LIBRARY & BIBTEX', '📚 RESEARCH LIBRARY & BIBTEX', lang)}
              </button>
            </div>

            <!-- Showcase Screen Frame -->
            <div class="showcase-monitor-frame">
              <div class="monitor-header">
                <div class="monitor-dots">
                  <span class="dot red"></span>
                  <span class="dot yellow"></span>
                  <span class="dot green"></span>
                </div>
                <div class="monitor-url" id="showcase-monitor-title">
                  cortex://studio/workspace/editor [LATEX-WASM ACTIVE]
                </div>
                <div class="monitor-badge">LIVE SIMULATION</div>
              </div>

              <!-- Dynamic Screen Mockup Content -->
              <div class="monitor-screen-viewport" id="showcase-viewport">
                ${this.renderShowcaseTab(this.activeTourTab, lang)}
              </div>
            </div>
          </section>

          <!-- Features Grid Section -->
          <section id="home-features" class="home-features-section">
            <div class="section-header-wrap">
              <div class="section-tag">${t('[ FITUR UTAMA // ARCHITECTURE & CAPABILITIES ]', '[ CORE CAPABILITIES // TECHNICAL ARCHITECTURE ]', lang)}</div>
              <h2 class="section-title">${t('Enam Pilar Utama CorTeX WasmTex Studio', 'Six Core Pillars of CorTeX WasmTex Studio', lang)}</h2>
              <p class="section-subtitle">
                ${t(
                  'Didesain khusus untuk peneliti, akademisi, dan mahasiswa yang memerlukan kecepatan tinggi, reliabilitas tanpa instalasi rumit, dan keamanan data.',
                  'Engineered for researchers, academics, and students demanding high speed, zero-install reliability, and strict data privacy.',
                  lang
                )}
              </p>
            </div>

            <div class="features-grid">
              <!-- Feature 1 -->
              <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3 class="feature-name">${t('WebAssembly Headless TeX Engine', 'WebAssembly Headless TeX Engine', lang)}</h3>
                <p class="feature-desc">
                  ${t(
                    'pdfTeX dan XeTeX dikompilasi langsung ke WebAssembly 64MB memory heap. Proses kompilasi berlangsung lokal di dalam browser Anda, menghasilkan waktu kompilasi sub-detik tanpa risiko server mati.',
                    'pdfTeX and XeTeX compiled directly into a 64MB WebAssembly memory heap. Compilation runs locally within your browser threads, achieving sub-second turnaround with zero server downtime.',
                    lang
                  )}
                </p>
                <div class="feature-chip">[ ZERO SERVER DELAY ]</div>
              </div>

              <!-- Feature 2 -->
              <div class="feature-card">
                <div class="feature-icon">📝</div>
                <h3 class="feature-name">${t('Alur Kerja 3-Mode (Visual, Code & Split)', 'Triple-Mode Workflow (Visual, Code & Split)', lang)}</h3>
                <p class="feature-desc">
                  ${t(
                    'Mode Visual WYSIWYG untuk melihat formula KaTeX terformat secara instan, Monaco Editor kelas dunia untuk pengkodean LaTeX presisi, serta Split-View untuk kenyamanan maksimal.',
                    'Visual WYSIWYG mode to inspect rendered KaTeX formulas instantly, world-class Monaco Editor for exact LaTeX coding, and Split-View for maximum productivity.',
                    lang
                  )}
                </p>
                <div class="feature-chip">[ MONACO + KATEX HYBRID ]</div>
              </div>

              <!-- Feature 3 -->
              <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <h3 class="feature-name">${t('SyncTeX 2-Arah & Viewer PDF.js', 'Bidirectional SyncTeX & PDF.js Viewer', lang)}</h3>
                <p class="feature-desc">
                  ${t(
                    'Navigasi instan antara kode sumber LaTeX dan hasil PDF yang telah dikompilasi. Klik baris editor untuk melompat ke halaman PDF, atau klik di PDF untuk melompat ke baris kode.',
                    'Instant jump navigation between LaTeX source code and compiled PDF pages. Click any editor line to jump to PDF, or click PDF to jump back to LaTeX source code.',
                    lang
                  )}
                </p>
                <div class="feature-chip">[ BIDIRECTIONAL SYNCTEX ]</div>
              </div>

              <!-- Feature 4 -->
              <div class="feature-card">
                <div class="feature-icon">📚</div>
                <h3 class="feature-name">${t('Research Library & Auto-Sync BibTeX', 'Research Library & Auto-Sync BibTeX', lang)}</h3>
                <p class="feature-desc">
                  ${t(
                    'Katalog literatur saintifik terstruktur dengan memo analisis (Objektif, Metodologi, Temuan). Dilengkapi tombol 1-klik untuk menyinkronkan sitasi BibTeX langsung ke file naskah proyek.',
                    'Structured scientific literature repository with research memos (Objective, Methodology, Findings). Includes 1-click BibTeX sync directly into your active project.',
                    lang
                  )}
                </p>
                <div class="feature-chip">[ 1-CLICK BIBTEX SYNC ]</div>
              </div>

              <!-- Feature 5 -->
              <div class="feature-card highlighted-card">
                <div class="feature-icon">🛡️</div>
                <h3 class="feature-name">${t('Multi-Akun Mandiri Anti-Bentrok', 'Multi-Account Private Workspace', lang)}</h3>
                <p class="feature-desc">
                  ${t(
                    'Setiap akun memiliki partisi penyimpanan proyek dan naskah tersendiri pada IndexedDB. Dokumen Anda dijamin aman, terisolasi, dan tidak akan pernah tertimpa atau bentrok dengan akun lain.',
                    'Every user account owns an isolated project partition inside local IndexedDB. Your documents are strictly sandboxed and will never collide or overwrite other accounts.',
                    lang
                  )}
                </p>
                <div class="feature-chip highlight-chip">[ MULTI-ACCOUNT ISOLATION ]</div>
              </div>

              <!-- Feature 6 -->
              <div class="feature-card">
                <div class="feature-icon">☁️</div>
                <h3 class="feature-name">${t('Offline-First IndexedDB & Cloudflare R2', 'Offline-First IndexedDB & Cloudflare R2', lang)}</h3>
                <p class="feature-desc">
                  ${t(
                    'Penyimpanan lokal IndexedDB memungkinkan Anda menulis dokumen saat offline. Tersedia fitur impor/ekspor ZIP utuh serta sinkronisasi snapshot proyek ke Cloudflare R2 bucket.',
                    'Local browser IndexedDB allows full manuscript authoring while offline. Supports ZIP project import/export as well as seamless Cloudflare R2 snapshot backups.',
                    lang
                  )}
                </p>
                <div class="feature-chip">[ PERSISTENT STORAGE ]</div>
              </div>
            </div>
          </section>

          <!-- Mandatory Authentication Section (Login & Registration) -->
          <section id="home-login-sec" class="home-login-section">
            <div class="login-wrapper-grid">
              <!-- Left Column: Explanation -->
              <div class="login-pitch-col">
                <div class="unit-classification-tag">${t('AUTENTIKASI & MULTI-AKUN MANDIRI', 'AUTHENTICATION & MULTI-ACCOUNT', lang)}</div>
                <h2 class="login-pitch-title">${t('Masuk ke Dashboard CorTeX Studio', 'Sign In to CorTeX Studio Dashboard', lang)}</h2>
                <p class="login-pitch-desc">
                  ${t(
                    'CorTeX menerapkan sistem multi-akun lokal. Setiap akun memiliki ruang kerja dokumen dan katalog sitasi riset masing-masing yang terisolasi secara penuh.',
                    'CorTeX utilizes an isolated multi-account system. Each user account possesses its own dedicated document workspace and research citation repository.',
                    lang
                  )}
                </p>

                <div class="multi-acc-benefits-box" style="border: 1.5px solid var(--border-color); background: var(--bg-secondary); padding: 18px; display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
                  <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <span style="font-size: 18px;">🔒</span>
                    <div>
                      <strong>${t('Isolasi Penuh Antar Akun', 'Complete Multi-Account Isolation', lang)}</strong>
                      <div style="color: var(--text-secondary); font-size: 12px; margin-top: 2px;">
                        ${t('Dokumen yang Anda buat disimpan dengan ID akun Anda, sehingga tidak akan dapat dilihat atau ditimpa oleh akun lain di perangkat yang sama.', 'Documents are partitioned by account ID, preventing accidental overwrites or cross-contamination.', lang)}
                      </div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <span style="font-size: 18px;">⚡</span>
                    <div>
                      <strong>${t('Privasi 100% di Browser Client', '100% Client-Side Privacy', lang)}</strong>
                      <div style="color: var(--text-secondary); font-size: 12px; margin-top: 2px;">
                        ${t('Semua proses kompilasi dan penyimpanan berjalan di dalam browser Anda tanpa mengirimkan draft naskah ke server luar.', 'All compilation cycles and project files reside securely inside your local browser storage.', lang)}
                      </div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <span style="font-size: 18px;">✍️</span>
                    <div>
                      <strong>${t('Bebas Buat Akun & Ganti Kredensial', 'Create Accounts & Update Credentials', lang)}</strong>
                      <div style="color: var(--text-secondary); font-size: 12px; margin-top: 2px;">
                        ${t('Anda dapat membuat akun baru kapan saja, serta mengubah username dan password secara mandiri di menu profil.', 'Register new accounts on demand, and freely update your username and password via account settings.', lang)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column: Authentication Card (Login or Register) -->
              <div class="login-form-col">
                <div class="tactical-login-card">
                  <div class="card-bracket tl"></div>
                  <div class="card-bracket tr"></div>
                  <div class="card-bracket bl"></div>
                  <div class="card-bracket br"></div>

                  <!-- Tab Switcher: Login vs Register -->
                  <div class="auth-tab-row" style="display: flex; border-bottom: 1.5px solid var(--border-color); margin-bottom: 20px;">
                    <button id="tab-auth-login" class="tactical-nav-btn ${this.authTab === 'login' ? 'active' : ''}" style="flex: 1; border-radius: 0; padding: 10px; font-weight: 700;">
                      ${t('[ 🔑 MASUK / SIGN IN ]', '[ 🔑 SIGN IN ]', lang)}
                    </button>
                    <button id="tab-auth-register" class="tactical-nav-btn ${this.authTab === 'register' ? 'active' : ''}" style="flex: 1; border-radius: 0; padding: 10px; font-weight: 700;">
                      ${t('[ 📝 DAFTAR AKUN / REGISTER ]', '[ 📝 CREATE ACCOUNT ]', lang)}
                    </button>
                  </div>

                  <div id="home-auth-error" class="login-alert-banner" style="display:none;"></div>

                  ${
                    this.authTab === 'login'
                      ? `
                  <!-- Login Form -->
                  <form id="form-home-login" class="home-auth-form">
                    <div class="form-group">
                      <label for="input-login-username" class="form-field-label">USERNAME / OPERATOR ID</label>
                      <input 
                        type="text" 
                        id="input-login-username" 
                        class="tactical-form-input" 
                        placeholder="e.g. admin, researcher, atau username Anda" 
                        required 
                        autocomplete="username"
                        autofocus
                      />
                    </div>

                    <div class="form-group">
                      <label for="input-login-password" class="form-field-label">PASSWORD / KATA SANDI</label>
                      <input 
                        type="password" 
                        id="input-login-password" 
                        class="tactical-form-input" 
                        placeholder="••••••••••••" 
                        required 
                        autocomplete="current-password"
                      />
                    </div>

                    <button type="submit" class="tactical-cta-btn cta-orange submit-btn" style="padding: 10px 16px; margin-top: 6px;">
                      <span class="bracket-corner tl"></span>
                      <span class="bracket-corner tr"></span>
                      <span class="bracket-corner bl"></span>
                      <span class="bracket-corner br"></span>
                      <span class="cta-inner">🔓 ${t('MASUK KE DASHBOARD & PROYEK', 'SIGN IN TO DASHBOARD', lang)}</span>
                    </button>
                  </form>
                  `
                      : `
                  <!-- Register Form -->
                  <form id="form-home-register" class="home-auth-form">
                    <div class="form-group">
                      <label for="input-reg-username" class="form-field-label">${t('USERNAME BARU (MIN 3 KARAKTER)', 'NEW USERNAME (MIN 3 CHARS)', lang)}</label>
                      <input 
                        type="text" 
                        id="input-reg-username" 
                        class="tactical-form-input" 
                        placeholder="e.g. peneliti_utama" 
                        required 
                        autocomplete="username"
                        autofocus
                      />
                    </div>

                    <div class="form-group">
                      <label for="input-reg-name" class="form-field-label">${t('NAMA LENGKAP / TAMPILAN', 'FULL / DISPLAY NAME', lang)}</label>
                      <input 
                        type="text" 
                        id="input-reg-name" 
                        class="tactical-form-input" 
                        placeholder="e.g. Dr. Budi Santoso" 
                        required 
                      />
                    </div>

                    <div class="form-group">
                      <label for="input-reg-password" class="form-field-label">${t('PASSWORD / KATA SANDI (MIN 6 KARAKTER)', 'PASSWORD (MIN 6 CHARS)', lang)}</label>
                      <input 
                        type="password" 
                        id="input-reg-password" 
                        class="tactical-form-input" 
                        placeholder="••••••••••••" 
                        required 
                        autocomplete="new-password"
                      />
                    </div>

                    <button type="submit" class="tactical-cta-btn cta-orange submit-btn" style="padding: 10px 16px; margin-top: 6px;">
                      <span class="bracket-corner tl"></span>
                      <span class="bracket-corner tr"></span>
                      <span class="bracket-corner bl"></span>
                      <span class="bracket-corner br"></span>
                      <span class="cta-inner">✨ ${t('BUAT AKUN & MASUK KE DASHBOARD', 'CREATE ACCOUNT & ACCESS DASHBOARD', lang)}</span>
                    </button>
                  </form>
                  `
                  }

                  <div class="card-footer-notes" style="margin-top: 20px;">
                    <span>✓ ${t('Ruang Kerja Mandiri', 'Isolated Workspace', lang)}</span>
                    <span>✓ ${t('Penyimpanan IndexedDB Lokal', 'Local IndexedDB Storage', lang)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Tactical Footer -->
          <footer class="tactical-footer">
            <div class="footer-left">
              <span class="tactical-brand-logo">CorTeX</span>
              <span class="tactical-brand-spec">/ SPEC WASMTEX-V2 RESEARCH ECOSYSTEM</span>
            </div>
            <div class="footer-right">
              <span>TEX LIVE 2025/2026 WASM ENGINE</span> // 
              <span>CLIENT-SIDE ISOLATED ENVIRONMENT</span> // 
              <span>ZERO TRACKING</span>
            </div>
          </footer>
        </div>
      </div>
    `
  }

  private renderShowcaseTab(tab: 'workspace' | 'dashboard' | 'library', lang: Lang): string {
    if (tab === 'workspace') {
      return `
        <div class="mockup-workspace-view">
          <!-- Left Mini Sidebar -->
          <div class="mockup-sidebar">
            <div class="mockup-sidebar-header">${t('BERKAS', 'FILES', lang)}</div>
            <div class="mockup-file-tree">
              <div class="mockup-file-item active">📄 main.tex</div>
              <div class="mockup-file-item">📄 introduction.tex</div>
              <div class="mockup-file-item">📄 methods.tex</div>
              <div class="mockup-file-item">📁 figures/</div>
              <div class="mockup-file-item">📚 refs.bib</div>
            </div>
            <div class="mockup-outline-header">OUTLINE</div>
            <div class="mockup-outline-list">
              <div>1. Introduction</div>
              <div>2. System Architecture</div>
              <div>3. WebAssembly Performance</div>
              <div>4. Experimental Results</div>
            </div>
          </div>

          <!-- Middle Code + Visual Area -->
          <div class="mockup-editor-area">
            <div class="mockup-editor-tabs">
              <span class="mock-tab active">main.tex</span>
              <span class="mock-mode-pill">Visual KaTeX + Monaco</span>
            </div>
            <div class="mockup-code-lines">
              <div class="code-line"><span class="tex-cmd">\\documentclass</span>[10pt,journal]{IEEEtran}</div>
              <div class="code-line"><span class="tex-cmd">\\usepackage</span>{amsmath,amssymb}</div>
              <div class="code-line"><span class="tex-cmd">\\usepackage</span>{tikz}</div>
              <div class="code-line"><span class="tex-cmd">\\title</span>{High-Speed In-Browser LaTeX Studio}</div>
              <div class="code-line"><span class="tex-cmd">\\begin</span>{document}</div>
              <div class="code-line"><span class="tex-cmd">\\maketitle</span></div>
              <div class="code-line"><span class="tex-cmd">\\begin</span>{equation}</div>
              <div class="code-line indent">\\mathcal{L}_{\\text{WASM}} = \\sum_{i=1}^{N} \\| \\hat{y}_i - y_i \\|^2 + \\lambda \\Omega(\\theta)</div>
              <div class="code-line"><span class="tex-cmd">\\end</span>{equation}</div>
            </div>
            <div class="mockup-visual-block">
              <span class="katex-tag">[ KATEX VISUAL RENDER ]</span>
              <div class="katex-formula-preview">$$\\mathcal{L}_{\\text{WASM}} = \\sum_{i=1}^{N} \\| \\hat{y}_i - y_i \\|^2 + \\lambda \\Omega(\\theta)$$</div>
            </div>
          </div>

          <!-- Right PDF Preview Area -->
          <div class="mockup-pdf-area">
            <div class="mockup-pdf-toolbar">
              <span>PDF PREVIEW (Page 1/4)</span>
              <span class="pdf-status-pill">✓ COMPILED IN 112ms</span>
            </div>
            <div class="mockup-pdf-sheet">
              <div class="pdf-paper-header">
                <div class="pdf-title">High-Speed In-Browser LaTeX Studio</div>
                <div class="pdf-authors">Dr. Aris Thorne, CorTeX Research Group</div>
                <div class="pdf-abstract">
                  <strong>Abstract</strong>—This paper presents an embeddable WebAssembly-native LaTeX compiler executing TeX Live 2025/2026 binaries directly within client browser threads with sub-second turnaround and bidirectional SyncTeX mapping...
                </div>
                <div class="pdf-columns-preview">
                  <div class="pdf-col">
                    <strong>I. INTRODUCTION</strong><br/>
                    Modern cloud LaTeX platforms suffer from severe network round-trip overhead and server scaling constraints...
                  </div>
                  <div class="pdf-col">
                    <strong>II. SYSTEM ARCHITECTURE</strong><br/>
                    By embedding headless WASM workers directly in the DOM runtime, compiling latency drops below 142ms...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    }

    if (tab === 'dashboard') {
      return `
        <div class="mockup-dashboard-view">
          <div class="mockup-dash-header">
            <div class="dash-h-left">
              <span class="dash-h-brand">CorTeX</span> / ${t('PROYEK PENELITIAN AKTIF', 'ACTIVE RESEARCH PROJECTS', lang)}
            </div>
            <div class="dash-h-stats">
              <span class="stat-pill">${t('TOTAL PROYEK: 4', 'TOTAL PROJECTS: 4', lang)}</span>
              <span class="stat-pill orange">${t('TERISOLASI: USER AKUN ANDA', 'ISOLATED: YOUR ACCOUNT', lang)}</span>
            </div>
          </div>

          <div class="mockup-proj-grid">
            <div class="mockup-proj-card">
              <div class="card-h">
                <span class="proj-badge">[ IEEE JOURNAL ]</span>
                <span class="time-ago">${t('Baru saja', 'Just now', lang)}</span>
              </div>
              <div class="proj-name">Paper_Dual_NDIR_Spectroscopy_2026</div>
              <div class="proj-owner">${t('Pemilik', 'Owner', lang)}: <strong>user</strong> (${t('Terisolasi', 'Isolated', lang)})</div>
              <div class="proj-tags">
                <span class="t-badge">Sensors</span>
                <span class="t-badge">TeX Live 2026</span>
              </div>
            </div>

            <div class="mockup-proj-card">
              <div class="card-h">
                <span class="proj-badge">[ PRESENTASI ]</span>
                <span class="time-ago">${t('1 jam lalu', '1 hour ago', lang)}</span>
              </div>
              <div class="proj-name">Beamer_Conference_Slides_2026</div>
              <div class="proj-owner">${t('Pemilik', 'Owner', lang)}: <strong>user</strong> (${t('Terisolasi', 'Isolated', lang)})</div>
              <div class="proj-tags">
                <span class="t-badge">Beamer</span>
                <span class="t-badge">Slides</span>
              </div>
            </div>

            <div class="mockup-proj-card">
              <div class="card-h">
                <span class="proj-badge">[ ELSEVIER ]</span>
                <span class="time-ago">${t('1 hari lalu', '1 day ago', lang)}</span>
              </div>
              <div class="proj-name">Benchtop_DAC_Adsorption_Screening</div>
              <div class="proj-owner">${t('Pemilik', 'Owner', lang)}: <strong>user</strong> (${t('Terisolasi', 'Isolated', lang)})</div>
              <div class="proj-tags">
                <span class="t-badge">Chemical Eng</span>
                <span class="t-badge">R2 Cloud Backup</span>
              </div>
            </div>
          </div>
        </div>
      `
    }

    // Library tab
    return `
      <div class="mockup-library-view">
        <div class="mock-lib-sidebar">
          <div class="lib-side-title">${t('DAFTAR PAPER RISET', 'RESEARCH PAPERS REPOSITORY', lang)}</div>
          <div class="lib-paper-item active">
            <div class="lp-title">Attention Is All You Need</div>
            <div class="lp-venue">NeurIPS (2017)</div>
          </div>
          <div class="lib-paper-item">
            <div class="lp-title">Deep Residual Learning for Image Recognition</div>
            <div class="lp-venue">CVPR (2016)</div>
          </div>
          <div class="lib-paper-item">
            <div class="lp-title">LoRA: Low-Rank Adaptation of Large Models</div>
            <div class="lp-venue">ICLR (2022)</div>
          </div>
        </div>

        <div class="mock-lib-content">
          <div class="lib-paper-header-view">
            <div class="lph-title">Attention Is All You Need</div>
            <div class="lph-authors">Ashish Vaswani, Noam Shazeer, Niki Parmar, et al. (2017)</div>
            <div class="lph-doi">DOI: 10.48550/arXiv.1706.03762</div>
          </div>

          <div class="mock-memo-grid">
            <div class="memo-box">
              <div class="memo-lbl">${t('OBJEKTIF UTAMA', 'PRIMARY OBJECTIVE', lang)}</div>
              <div class="memo-txt">${t('Menggantikan RNN/CNN secara total dengan mekanisme Multi-Head Self-Attention untuk sequence-to-sequence.', 'Replace recurrent/convolutional models entirely with multi-head self-attention mechanisms.', lang)}</div>
            </div>
            <div class="memo-box">
              <div class="memo-lbl">${t('TEMUAN KUNCI', 'KEY FINDINGS', lang)}</div>
              <div class="memo-txt">${t('Mencapai skor BLEU 28.4 pada WMT 2014 En-De dengan waktu pelatihan komputasi jauh lebih hemat.', 'Attains 28.4 BLEU on WMT 2014 En-De with drastically superior training computational efficiency.', lang)}</div>
            </div>
          </div>

          <div class="bibtex-sync-bar">
            <div class="bib-code">@article{vaswani2017attention, title={Attention Is All You Need}, year={2017}...}</div>
            <button class="btn-sync-demo">✓ ${t('SINKRONKAN KE PROYEK BIBTEX', 'SYNC TO PROJECT BIBTEX', lang)}</button>
          </div>
        </div>
      </div>
    `
  }

  private bindEvents(): void {
    // Language toggle
    const langBtn = this.container.querySelector('#home-lang-toggle')
    langBtn?.addEventListener('click', () => {
      toggleLang()
      this.render()
      this.bindEvents()
      this.options.onToggleLang?.()
    })

    // Theme toggle
    const themeBtn = this.container.querySelector('#home-theme-toggle')
    themeBtn?.addEventListener('click', () => {
      this.options.onToggleTheme()
      this.render()
      this.bindEvents()
    })

    // Showcase tab switcher
    const tabButtons = this.container.querySelectorAll('.showcase-tab-btn')
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement
        const tab = target.getAttribute('data-tab') as 'workspace' | 'dashboard' | 'library'
        if (tab && tab !== this.activeTourTab) {
          this.activeTourTab = tab
          const viewport = this.container.querySelector('#showcase-viewport')
          const titleEl = this.container.querySelector('#showcase-monitor-title')
          if (viewport) {
            viewport.innerHTML = this.renderShowcaseTab(tab, getLang())
          }
          if (titleEl) {
            titleEl.textContent = `cortex://studio/${tab} [LATEX-WASM ACTIVE]`
          }
          tabButtons.forEach((b) => b.classList.remove('active'))
          target.classList.add('active')
        }
      })
    })

    // Auth Mode tabs (Login vs Register)
    const tabLogin = this.container.querySelector('#tab-auth-login')
    const tabRegister = this.container.querySelector('#tab-auth-register')

    tabLogin?.addEventListener('click', () => {
      if (this.authTab !== 'login') {
        this.authTab = 'login'
        this.render()
        this.bindEvents()
      }
    })

    tabRegister?.addEventListener('click', () => {
      if (this.authTab !== 'register') {
        this.authTab = 'register'
        this.render()
        this.bindEvents()
      }
    })

    // Login Form
    const loginForm = this.container.querySelector('#form-home-login') as HTMLFormElement | null
    const errorBanner = this.container.querySelector('#home-auth-error') as HTMLElement | null

    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault()
      const usernameInput = (this.container.querySelector('#input-login-username') as HTMLInputElement)?.value.trim()
      const passwordInput = (this.container.querySelector('#input-login-password') as HTMLInputElement)?.value
      const curLang = getLang()

      if (!usernameInput || !passwordInput) {
        if (errorBanner) {
          errorBanner.textContent = t('Harap isi Username dan Password.', 'Please enter Username and Password.', curLang)
          errorBanner.style.display = 'block'
        }
        return
      }

      const res = authenticate(usernameInput, passwordInput)
      if (res.success && res.session) {
        if (errorBanner) errorBanner.style.display = 'none'
        this.options.onLoginSuccess(res.session)
      } else {
        if (errorBanner) {
          errorBanner.textContent = res.error || t('Autentikasi gagal. Periksa kembali username dan password.', 'Authentication failed. Check credentials.', curLang)
          errorBanner.style.display = 'block'
        }
      }
    })

    // Register Form
    const registerForm = this.container.querySelector('#form-home-register') as HTMLFormElement | null
    registerForm?.addEventListener('submit', (e) => {
      e.preventDefault()
      const usernameInput = (this.container.querySelector('#input-reg-username') as HTMLInputElement)?.value.trim()
      const nameInput = (this.container.querySelector('#input-reg-name') as HTMLInputElement)?.value.trim()
      const passwordInput = (this.container.querySelector('#input-reg-password') as HTMLInputElement)?.value
      const curLang = getLang()

      if (!usernameInput || !passwordInput) {
        if (errorBanner) {
          errorBanner.textContent = t('Harap isi data pendaftaran dengan lengkap.', 'Please complete all registration fields.', curLang)
          errorBanner.style.display = 'block'
        }
        return
      }

      const res = registerAccount(usernameInput, passwordInput, nameInput)
      if (res.success && res.session) {
        if (errorBanner) errorBanner.style.display = 'none'
        this.options.onLoginSuccess(res.session)
      } else {
        if (errorBanner) {
          errorBanner.textContent = res.error || t('Pendaftaran gagal. Coba gunakan username lain.', 'Registration failed. Try another username.', curLang)
          errorBanner.style.display = 'block'
        }
      }
    })
  }
}
