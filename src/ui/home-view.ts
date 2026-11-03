import {
  authenticate,
  DEFAULT_ACCOUNTS,
  type UserSession,
} from '../auth/auth-store'
import { OVERLEAF_ICONS } from './logo'

export interface HomeViewOptions {
  onLoginSuccess: (session: UserSession) => void
  onToggleTheme: () => void
  isDarkMode: () => boolean
}

export class HomeView {
  private container: HTMLElement
  private options: HomeViewOptions
  private activeTourTab: 'workspace' | 'dashboard' | 'library' | 'iam' = 'workspace'

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

    this.container.innerHTML = `
      <div class="cortex-home-root">
        <!-- Top Confidential Ribbon -->
        <div class="tactical-top-strip">
          <div class="top-strip-left">
            <span class="strip-bracket">[</span>
            <span class="strip-text">CLASSIFICATION: PUBLIC SHOWCASE // SPEC WASMTEX-V2</span>
            <span class="strip-bracket">]</span>
          </div>
          <div class="top-strip-right">
            <span class="status-indicator-dot">●</span>
            <span class="strip-text">ENGINE: WEBASSEMBLY // ZERO-SERVER COMPILATION // TEX LIVE 2025-2026</span>
          </div>
        </div>

        <!-- High-Contrast Navigation Header -->
        <header class="tactical-navbar home-nav">
          <div class="tactical-nav-left">
            <div class="tactical-brand-wrap">
              <span class="tactical-brand-logo">CorTeX</span>
              <span class="tactical-brand-reg">®</span>
              <span class="tactical-brand-spec">/ WEBASSEMBLY LATEX STUDIO &amp; RESEARCH SUITE</span>
            </div>
          </div>

          <nav class="tactical-nav-center home-nav-links">
            <a href="#home-features" class="tactical-nav-btn">[ FITUR UTAMA ]</a>
            <a href="#home-showcase" class="tactical-nav-btn">[ SCREENSHOT &amp; TUR ]</a>
            <a href="#home-iam" class="tactical-nav-btn">[ SISTEM IAM ]</a>
            <a href="#home-login-sec" class="tactical-nav-btn">[ AKSES MASUK ]</a>
          </nav>

          <div class="tactical-nav-right">
            <button id="home-theme-toggle" class="tactical-icon-toggle" title="Toggle Light / Dark Mode">
              ${isDark ? OVERLEAF_ICONS.themeSun : OVERLEAF_ICONS.themeMoon}
              <span class="toggle-mode-label">${isDark ? 'LIGHT' : 'DARK'}</span>
            </button>
            <a href="#home-login-sec" class="tactical-login-btn" style="text-decoration:none;">
              [ 👤 MASUK / LOGIN ]
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
                SPECIFICATION: IN-BROWSER HIGH-PERFORMANCE LATEX SDK &amp; RESEARCH STUDIO
              </div>
              <h1 class="home-hero-title">
                Kompilasi LaTeX Standar Jurnal<br />
                <span class="hero-highlight">100% di Browser</span> Tanpa Server Backend
              </h1>
              <p class="home-hero-desc">
                CorTeX WasmTex mengintegrasikan engine TeX Live 2025/2026 bertenaga WebAssembly langsung di peramban Anda. 
                Nikmati penulisan naskah saintifik dengan Visual KaTeX Editor, Monaco Code Editor dengan syntax highlighting, 
                SyncTeX 2-arah interaktif, Research Library dengan auto-sync BibTeX, serta <strong>sistem IAM Multi-Akun terisolasi</strong> yang menjamin proyek tidak saling bentrok.
              </p>

              <!-- Quick Demo CTA Bar -->
              <div class="home-hero-actions">
                <a href="#home-login-sec" class="tactical-cta-btn cta-orange">
                  <span class="bracket-corner tl"></span>
                  <span class="bracket-corner tr"></span>
                  <span class="bracket-corner bl"></span>
                  <span class="bracket-corner br"></span>
                  <span class="cta-inner">🚀 MASUK KE DASHBOARD</span>
                </a>

                <button class="tactical-cta-btn cta-secondary btn-quick-demo" data-user="admin" title="Login instan dengan akun Master Admin">
                  <span class="bracket-corner tl"></span>
                  <span class="bracket-corner tr"></span>
                  <span class="bracket-corner bl"></span>
                  <span class="bracket-corner br"></span>
                  <span class="cta-inner">⚡ DEMO: ADMIN</span>
                </button>

                <button class="tactical-cta-btn cta-secondary btn-quick-demo" data-user="researcher" title="Login instan dengan akun Peneliti">
                  <span class="bracket-corner tl"></span>
                  <span class="bracket-corner tr"></span>
                  <span class="bracket-corner bl"></span>
                  <span class="bracket-corner br"></span>
                  <span class="cta-inner">⚡ DEMO: RESEARCHER</span>
                </button>
              </div>

              <!-- Metric & Capability Badges -->
              <div class="home-badge-row">
                <div class="home-badge-pill">
                  <span class="badge-dot">●</span>
                  <strong>ZERO SERVER COMPILATION</strong>: Privasi total dokumen
                </div>
                <div class="home-badge-pill">
                  <span class="badge-dot cyan">●</span>
                  <strong>TEX LIVE 2025 &amp; 2026</strong>: PDFTeX &amp; XeTeX Engine
                </div>
                <div class="home-badge-pill">
                  <span class="badge-dot orange">●</span>
                  <strong>IAM ISOLATION</strong>: Multi-user mandiri anti-bentrok
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
                ✍️ WORKSPACE 3-PANEL (EDITOR &amp; PDF)
              </button>
              <button class="showcase-tab-btn ${this.activeTourTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
                📊 DASHBOARD PROYEK TAKTIS
              </button>
              <button class="showcase-tab-btn ${this.activeTourTab === 'library' ? 'active' : ''}" data-tab="library">
                📚 RESEARCH LIBRARY &amp; BIBTEX
              </button>
              <button class="showcase-tab-btn ${this.activeTourTab === 'iam' ? 'active' : ''}" data-tab="iam">
                🛡️ ENTERPRISE IAM &amp; MULTI-AKUN
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
                ${this.renderShowcaseTab(this.activeTourTab)}
              </div>
            </div>
          </section>

          <!-- Features Grid Section -->
          <section id="home-features" class="home-features-section">
            <div class="section-header-wrap">
              <div class="section-tag">[ ARCHITECTURE &amp; CAPABILITIES // FITUR UTAMA ]</div>
              <h2 class="section-title">Enam Pilar Utama CorTeX WasmTex Studio</h2>
              <p class="section-subtitle">
                Didesain khusus untuk peneliti, dosen, dan mahasiswa yang memerlukan kecepatan tinggi, reliabilitas tanpa instalasi rumit, dan keamanan data.
              </p>
            </div>

            <div class="features-grid">
              <!-- Feature 1 -->
              <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3 class="feature-name">WebAssembly Headless TeX Engine</h3>
                <p class="feature-desc">
                  pdfTeX dan XeTeX dikompilasi langsung ke WebAssembly 64MB memory heap. Proses kompilasi berlangsung lokal di dalam browser Anda, menghasilkan waktu kompilasi sub-detik tanpa risiko server mati.
                </p>
                <div class="feature-chip">[ ZERO SERVER DELAY ]</div>
              </div>

              <!-- Feature 2 -->
              <div class="feature-card">
                <div class="feature-icon">📝</div>
                <h3 class="feature-name">Triple-Mode Editing (Visual, Code &amp; Split)</h3>
                <p class="feature-desc">
                  Mode Visual WYSIWYG untuk melihat formula KaTeX terformat secara instan, Monaco Editor kelas dunia untuk pengkodean LaTeX presisi, serta Split-View untuk kenyamanan maksimal.
                </p>
                <div class="feature-chip">[ MONACO + KATEX HYBRID ]</div>
              </div>

              <!-- Feature 3 -->
              <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <h3 class="feature-name">SyncTeX 2-Arah &amp; Live PDF.js Viewer</h3>
                <p class="feature-desc">
                  Navigasi instan antara kode sumber LaTeX dan hasil PDF yang telah dikompilasi. Klik baris editor untuk melompat ke halaman PDF, atau klik di PDF untuk melompat ke baris kode.
                </p>
                <div class="feature-chip">[ BIDIRECTIONAL SYNCTEX ]</div>
              </div>

              <!-- Feature 4 -->
              <div class="feature-card">
                <div class="feature-icon">📚</div>
                <h3 class="feature-name">Research Library &amp; Auto-Sync BibTeX</h3>
                <p class="feature-desc">
                  Katalog literatur saintifik terstruktur dengan memo analisis (Objektif, Metodologi, Temuan). Dilengkapi tombol 1-klik untuk menyinkronkan sitasi BibTeX langsung ke file naskah proyek.
                </p>
                <div class="feature-chip">[ 1-CLICK BIBTEX SYNC ]</div>
              </div>

              <!-- Feature 5 -->
              <div class="feature-card highlighted-card">
                <div class="feature-icon">🛡️</div>
                <h3 class="feature-name">Sistem Multi-Akun &amp; IAM Anti-Bentrok</h3>
                <p class="feature-desc">
                  Data proyek dan pustaka diisolasi secara ketat per akun dengan ID unik. Dilengkapi peran Admin, Researcher, dan Viewer. Setiap akun dapat mengganti Username dan Password secara mandiri tanpa bentrok.
                </p>
                <div class="feature-chip highlight-chip">[ MULTI-TENANT ISOLATION ]</div>
              </div>

              <!-- Feature 6 -->
              <div class="feature-card">
                <div class="feature-icon">☁️</div>
                <h3 class="feature-name">Offline-First IndexedDB &amp; Cloudflare R2</h3>
                <p class="feature-desc">
                  Penyimpanan lokal IndexedDB memungkinkan Anda menulis dokumen saat offline. Tersedia fitur impor/ekspor ZIP utuh serta sinkronisasi snapshot proyek ke Cloudflare R2 bucket.
                </p>
                <div class="feature-chip">[ PERSISTENT STORAGE ]</div>
              </div>
            </div>
          </section>

          <!-- IAM Architecture Explanation Section -->
          <section id="home-iam" class="home-iam-section">
            <div class="iam-banner-box">
              <div class="iam-banner-left">
                <div class="unit-classification-tag">SECURITY MATRIX // RBAC &amp; IAM</div>
                <h2 class="iam-title">Arsitektur IAM &amp; Isolasi Data Tanpa Bentrok</h2>
                <p class="iam-desc">
                  CorTeX menerapkan prinsip Least Privilege dan Multi-Tenant Workspace Sandbox. Setiap dokumen LaTeX yang Anda buat disimpan dengan atribut kepemilikan <code>ownerId</code> spesifik pada IndexedDB browser:
                </p>
                <ul class="iam-list">
                  <li><strong>Isolasi Proyek Total:</strong> Akun peneliti (researcher) hanya dapat melihat dan memodifikasi proyek miliknya sendiri. Proyek pengguna lain tidak akan tertimpa atau terhapus.</li>
                  <li><strong>Sandbox Tutorial Bawaan:</strong> Setiap akun mendapatkan salinan proyek tutorial awal secara terpisah saat pertama login, mencegah modifikasi bersama yang merusak data.</li>
                  <li><strong>Manajemen Kredensial Fleksibel:</strong> Setiap user berhak memperbarui username dan mengganti kata sandi secara mandiri di menu pengaturan akun.</li>
                  <li><strong>Konsol Kontrol Admin:</strong> Pengguna dengan peran <code>admin</code> memiliki wewenang mengelola pengguna lain, mengubah role, mereset password, dan mengaudit proyek sistem.</li>
                </ul>
              </div>

              <div class="iam-banner-right">
                <div class="iam-table-card">
                  <div class="iam-table-header">[ ROLE PERMISSIONS MATRIX ]</div>
                  <table class="iam-matrix-table">
                    <thead>
                      <tr>
                        <th>Role</th>
                        <th>Buat Proyek</th>
                        <th>Edit Milik Sendiri</th>
                        <th>Ganti Profil</th>
                        <th>Kelola IAM</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span class="role-badge admin">ADMIN</span></td>
                        <td>✓ Ya</td>
                        <td>✓ Ya (Semua)</td>
                        <td>✓ Ya</td>
                        <td>✓ Ya</td>
                      </tr>
                      <tr>
                        <td><span class="role-badge researcher">RESEARCHER</span></td>
                        <td>✓ Ya</td>
                        <td>✓ Ya (Milik Sendiri)</td>
                        <td>✓ Ya</td>
                        <td>✕ Tidak</td>
                      </tr>
                      <tr>
                        <td><span class="role-badge viewer">VIEWER</span></td>
                        <td>✕ Tidak</td>
                        <td>✕ Read-only</td>
                        <td>✓ Ya</td>
                        <td>✕ Tidak</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <!-- Mandatory Login Section -->
          <section id="home-login-sec" class="home-login-section">
            <div class="login-wrapper-grid">
              <!-- Left Login Pitch Column -->
              <div class="login-pitch-col">
                <div class="unit-classification-tag">AUTHENTICATION GATE // ACCESS MANDATORY</div>
                <h2 class="login-pitch-title">Masuk ke Dashboard CorTeX Studio</h2>
                <p class="login-pitch-desc">
                  Untuk menjaga integritas dan isolasi proyek naskah Anda, autentikasi diperlukan sebelum memasuki dashboard atau editor workspace.
                </p>

                <!-- Default Accounts Guide Box -->
                <div class="default-accounts-box">
                  <div class="def-box-title">[ AKUN DEFAULT BAWAAN SISTEM ]</div>
                  <p class="def-box-hint">Gunakan salah satu akun siap-pakai di bawah ini untuk pengujian instan:</p>
                  
                  <div class="account-card-row">
                    <div class="acc-mini-card">
                      <div class="acc-top">
                        <span class="role-badge admin">ADMIN</span>
                        <strong>admin</strong>
                      </div>
                      <div class="acc-pass">Pass: <code>cortex2026</code></div>
                      <div class="acc-desc">Akses penuh IAM &amp; kelola semua akun/proyek.</div>
                      <button class="btn-quick-fill" data-user="admin" data-pass="cortex2026">Gunakan Akun Ini ➔</button>
                    </div>

                    <div class="acc-mini-card">
                      <div class="acc-top">
                        <span class="role-badge researcher">RESEARCHER</span>
                        <strong>researcher</strong>
                      </div>
                      <div class="acc-pass">Pass: <code>cortex2026</code></div>
                      <div class="acc-desc">Pusat riset mandiri &amp; proyek terisolasi.</div>
                      <button class="btn-quick-fill" data-user="researcher" data-pass="cortex2026">Gunakan Akun Ini ➔</button>
                    </div>

                    <div class="acc-mini-card">
                      <div class="acc-top">
                        <span class="role-badge viewer">VIEWER</span>
                        <strong>guest</strong>
                      </div>
                      <div class="acc-pass">Pass: <code>cortex2026</code></div>
                      <div class="acc-desc">Mode baca, review naskah &amp; tes kompilasi.</div>
                      <button class="btn-quick-fill" data-user="guest" data-pass="cortex2026">Gunakan Akun Ini ➔</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Login Form Card -->
              <div class="login-form-col">
                <div class="tactical-login-card">
                  <div class="card-bracket tl"></div>
                  <div class="card-bracket tr"></div>
                  <div class="card-bracket bl"></div>
                  <div class="card-bracket br"></div>

                  <div class="card-top-tag">
                    <span>SECURITY CLEARANCE GATEWAY</span>
                    <span class="status-indicator-dot">●</span>
                  </div>

                  <h3 class="card-title">AUTENTIKASI OPERATOR</h3>
                  <p class="card-subtitle">Masukkan Username dan Password untuk mengakses workspace Anda.</p>

                  <div id="home-login-error" class="login-alert-banner" style="display:none;"></div>

                  <form id="home-login-form" class="home-auth-form">
                    <div class="form-group">
                      <label for="home-input-username" class="form-field-label">USERNAME / OPERATOR ID</label>
                      <input 
                        type="text" 
                        id="home-input-username" 
                        class="tactical-form-input" 
                        placeholder="e.g. admin atau researcher" 
                        value="admin"
                        required 
                        autocomplete="username"
                      />
                    </div>

                    <div class="form-group">
                      <label for="home-input-password" class="form-field-label">PASSWORD / SECURITY KEY</label>
                      <input 
                        type="password" 
                        id="home-input-password" 
                        class="tactical-form-input" 
                        placeholder="••••••••••••" 
                        value="cortex2026"
                        required 
                        autocomplete="current-password"
                      />
                    </div>

                    <button type="submit" id="btn-submit-home-login" class="tactical-cta-btn cta-orange submit-btn">
                      <span class="bracket-corner tl"></span>
                      <span class="bracket-corner tr"></span>
                      <span class="bracket-corner bl"></span>
                      <span class="bracket-corner br"></span>
                      <span class="cta-inner">🔓 MASUK KE DASHBOARD &amp; PROYEK</span>
                    </button>
                  </form>

                  <div class="card-footer-notes">
                    <span>✓ Proteksi Multi-Akun Aktif</span>
                    <span>✓ Isolasi Sandboxed IndexedDB</span>
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

  private renderShowcaseTab(tab: 'workspace' | 'dashboard' | 'library' | 'iam'): string {
    if (tab === 'workspace') {
      return `
        <div class="mockup-workspace-view">
          <!-- Left Mini Sidebar -->
          <div class="mockup-sidebar">
            <div class="mockup-sidebar-header">FILES</div>
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
              <span class="dash-h-brand">CorTeX</span> / PROYEK PENELITIAN AKTIF
            </div>
            <div class="dash-h-stats">
              <span class="stat-pill">TOTAL PROYEK: 4</span>
              <span class="stat-pill orange">TERISOLASI: USER RESEARCHER</span>
            </div>
          </div>

          <div class="mockup-proj-grid">
            <div class="mockup-proj-card">
              <div class="card-h">
                <span class="proj-badge">[ IEEE JOURNAL ]</span>
                <span class="time-ago">Baru saja</span>
              </div>
              <div class="proj-name">Paper_Dual_NDIR_Spectroscopy_2026</div>
              <div class="proj-owner">Pemilik: <strong>researcher</strong> (Terisolasi)</div>
              <div class="proj-tags">
                <span class="t-badge">Sensors</span>
                <span class="t-badge">TeX Live 2026</span>
              </div>
            </div>

            <div class="mockup-proj-card">
              <div class="card-h">
                <span class="proj-badge">[ TUTORIAL ]</span>
                <span class="time-ago">2 jam lalu</span>
              </div>
              <div class="proj-name">Tutorial — Getting Started with LaTeX &amp; WasmTex</div>
              <div class="proj-owner">Pemilik: <strong>researcher</strong> (Sandbox Mandiri)</div>
              <div class="proj-tags">
                <span class="t-badge">Starter</span>
                <span class="t-badge">WasmTex</span>
              </div>
            </div>

            <div class="mockup-proj-card">
              <div class="card-h">
                <span class="proj-badge">[ ELSEVIER ]</span>
                <span class="time-ago">1 hari lalu</span>
              </div>
              <div class="proj-name">Benchtop_DAC_Adsorption_Screening</div>
              <div class="proj-owner">Pemilik: <strong>researcher</strong> (Terisolasi)</div>
              <div class="proj-tags">
                <span class="t-badge">Chemical Eng</span>
                <span class="t-badge">R2 Cloud Backup</span>
              </div>
            </div>
          </div>
        </div>
      `
    }

    if (tab === 'library') {
      return `
        <div class="mockup-library-view">
          <div class="mock-lib-sidebar">
            <div class="lib-side-title">DAFTAR PAPER RISET</div>
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
                <div class="memo-lbl">OBJEKTIF UTAMA</div>
                <div class="memo-txt">Menggantikan RNN/CNN secara total dengan mekanisme Multi-Head Self-Attention untuk tugas sequence-to-sequence.</div>
              </div>
              <div class="memo-box">
                <div class="memo-lbl">TEMUAN KUNCI</div>
                <div class="memo-txt">Mencapai skor BLEU 28.4 pada WMT 2014 En-De dengan efisiensi komputasi pelatihan jauh lebih tinggi.</div>
              </div>
            </div>

            <div class="bibtex-sync-bar">
              <div class="bib-code">@article{vaswani2017attention, title={Attention Is All You Need}, year={2017}...}</div>
              <button class="btn-sync-demo">✓ SINKRONKAN KE PROYEK BIBTEX</button>
            </div>
          </div>
        </div>
      `
    }

    // IAM tab
    return `
      <div class="mockup-iam-view">
        <div class="iam-mock-header">
          <div class="iam-h-title">🛡️ KONSOL IDENTITY &amp; ACCESS MANAGEMENT (IAM)</div>
          <div class="iam-h-policy">STATUS: 3 AKUN TERDAFTAR // ISOLASI MULTI-TENANT AKTIF</div>
        </div>

        <div class="mock-iam-table-wrap">
          <table class="mock-iam-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Nama Tampilan</th>
                <th>Role Akses</th>
                <th>Izin Proyek</th>
                <th>Status Sandbox</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>admin</strong></td>
                <td>System Administrator</td>
                <td><span class="role-badge admin">ADMIN</span></td>
                <td>Kelola Semua Proyek &amp; IAM</td>
                <td><span class="status-active">● Master Node</span></td>
              </tr>
              <tr>
                <td><strong>researcher</strong></td>
                <td>Lead Researcher</td>
                <td><span class="role-badge researcher">RESEARCHER</span></td>
                <td>Proyek Mandiri (Terisolasi)</td>
                <td><span class="status-active">● Sandbox Terkunci</span></td>
              </tr>
              <tr>
                <td><strong>guest</strong></td>
                <td>Guest Reviewer</td>
                <td><span class="role-badge viewer">VIEWER</span></td>
                <td>Kompilasi &amp; Baca Saja</td>
                <td><span class="status-active">● Read-Only</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="iam-guarantee-box">
          <span class="guarantee-icon">🔒</span>
          <div>
            <strong>JAMINAN ANTI-BENTROK:</strong> Setiap perubahan proyek, file .tex, atau pustaka oleh <code>researcher</code> 
            disimpan dengan partisi unik <code>ownerId</code> pada IndexedDB, sehingga akun lain tidak akan pernah mengalami konflik data.
          </div>
        </div>
      </div>
    `
  }

  private bindEvents(): void {
    // Theme toggle
    const themeBtn = this.container.querySelector('#home-theme-toggle')
    themeBtn?.addEventListener('click', () => {
      this.options.onToggleTheme()
      this.render()
    })

    // Showcase tab switcher
    const tabButtons = this.container.querySelectorAll('.showcase-tab-btn')
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement
        const tab = target.getAttribute('data-tab') as 'workspace' | 'dashboard' | 'library' | 'iam'
        if (tab && tab !== this.activeTourTab) {
          this.activeTourTab = tab
          const viewport = this.container.querySelector('#showcase-viewport')
          const titleEl = this.container.querySelector('#showcase-monitor-title')
          if (viewport) {
            viewport.innerHTML = this.renderShowcaseTab(tab)
          }
          if (titleEl) {
            titleEl.textContent = `cortex://studio/${tab} [LATEX-WASM ACTIVE]`
          }
          tabButtons.forEach((b) => b.classList.remove('active'))
          target.classList.add('active')
        }
      })
    })

    // Quick demo buttons in hero
    const quickDemoBtns = this.container.querySelectorAll('.btn-quick-demo')
    quickDemoBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement
        const username = target.getAttribute('data-user') || 'admin'
        const account = DEFAULT_ACCOUNTS.find((a) => a.username === username)
        if (account) {
          const auth = authenticate(account.username, account.password)
          if (auth.success && auth.session) {
            this.options.onLoginSuccess(auth.session)
          }
        }
      })
    })

    // Quick fill buttons in login section
    const quickFillBtns = this.container.querySelectorAll('.btn-quick-fill')
    quickFillBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement
        const user = target.getAttribute('data-user') || ''
        const pass = target.getAttribute('data-pass') || ''
        const userInput = this.container.querySelector('#home-input-username') as HTMLInputElement
        const passInput = this.container.querySelector('#home-input-password') as HTMLInputElement
        if (userInput && passInput) {
          userInput.value = user
          passInput.value = pass
          userInput.focus()
        }
      })
    })

    // Login form submission
    const loginForm = this.container.querySelector('#home-login-form') as HTMLFormElement
    const errorBanner = this.container.querySelector('#home-login-error') as HTMLElement

    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault()
      const usernameInput = (this.container.querySelector('#home-input-username') as HTMLInputElement)?.value.trim()
      const passwordInput = (this.container.querySelector('#home-input-password') as HTMLInputElement)?.value

      if (!usernameInput || !passwordInput) {
        if (errorBanner) {
          errorBanner.textContent = 'Harap isi Username dan Password.'
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
          errorBanner.textContent = res.error || 'Autentikasi gagal. Periksa kembali username dan password.'
          errorBanner.style.display = 'block'
        }
      }
    })
  }
}
