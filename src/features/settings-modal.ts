/**
 * WasmTex Studio Settings & Preferences Modal (Overleaf-style)
 * Supports Editor, Spelling & Language, Compiler, Reference, and Appearance
 * (including Auto / Native OS dark/light detection).
 */

import { getLang, t } from '../ui/i18n'

export type ThemeMode = 'auto' | 'dark' | 'light'
export type KeybindingMode = 'standard' | 'vim' | 'emacs'
export type CompilerEngine = 'xelatex' | 'pdflatex' | 'lualatex'
export type BibliographyEngine = 'bibtex' | 'biber'
export type CitationStyle = 'cite' | 'citep' | 'autocite'
export type SpellcheckLang =
  | 'off'
  | 'en_US'
  | 'en_GB'
  | 'id_ID'
  | 'de_DE'
  | 'fr_FR'
  | 'es_ES'

export interface AppSettings {
  // Editor
  fontSize: number
  keybinding: KeybindingMode
  tabSize: number
  wordWrap: boolean
  autoCloseBrackets: boolean

  // Spelling and Language
  spellcheck: boolean
  spellcheckLang: SpellcheckLang

  // Compiler
  compilerEngine: CompilerEngine
  texliveVersion: '2025' | '2026'
  autoCompile: boolean

  // Reference
  bibEngine: BibliographyEngine
  citationFormat: CitationStyle

  // Appearance
  theme: ThemeMode
  density: 'compact' | 'comfortable'
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 14,
  keybinding: 'standard',
  tabSize: 2,
  wordWrap: true,
  autoCloseBrackets: true,
  spellcheck: true,
  spellcheckLang: 'en_US',
  compilerEngine: 'xelatex',
  texliveVersion: '2025',
  autoCompile: false,
  bibEngine: 'bibtex',
  citationFormat: 'cite',
  theme: 'auto',
  density: 'compact',
}

const SETTINGS_KEY = 'wasmtex_app_settings'

export function loadSettings(): AppSettings {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS }
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (err) {
    console.warn('[Settings] Failed to save settings to localStorage:', err)
  }
}

/**
 * Resolves the effective theme ('dark' | 'light') based on user choice.
 * If 'auto', inspects window.matchMedia('(prefers-color-scheme: dark)').
 */
export function resolveEffectiveTheme(theme: ThemeMode): 'dark' | 'light' {
  if (theme === 'dark') return 'dark'
  if (theme === 'light') return 'light'
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

export type SettingsTab = 'editor' | 'spelling' | 'compiler' | 'reference' | 'appearance'

export interface SettingsModalOptions {
  onApplySettings: (settings: AppSettings) => void
}

export class SettingsModal {
  private container: HTMLElement | null = null
  private settings: AppSettings
  private activeTab: SettingsTab = 'editor'
  private options: SettingsModalOptions

  constructor(options: SettingsModalOptions) {
    this.options = options
    this.settings = loadSettings()
  }

  public getSettings(): AppSettings {
    return { ...this.settings }
  }

  public open(initialTab: SettingsTab = 'editor'): void {
    if (this.container) this.close()
    this.settings = loadSettings()
    this.activeTab = initialTab

    const modal = document.createElement('div')
    modal.className = 'settings-modal-backdrop'
    modal.id = 'settings-modal-backdrop'

    modal.innerHTML = `
      <div class="settings-modal-card" role="dialog" aria-modal="true">
        <div class="settings-modal-header">
          <div class="settings-modal-title">
            <span class="settings-icon">⚙️</span>
            <span>${t('PENGATURAN // SETTINGS', 'SETTINGS // PREFERENCES', getLang())}</span>
          </div>
          <button class="settings-close-btn" id="settings-close-x" aria-label="Close">&times;</button>
        </div>

        <div class="settings-modal-layout">
          <!-- Navigation Sidebar -->
          <nav class="settings-nav-sidebar">
            <button class="settings-nav-item ${this.activeTab === 'editor' ? 'active' : ''}" data-tab="editor">
              <span class="nav-icon">📝</span>
              <span class="nav-label">Editor</span>
            </button>
            <button class="settings-nav-item ${this.activeTab === 'spelling' ? 'active' : ''}" data-tab="spelling">
              <span class="nav-icon">🌐</span>
              <span class="nav-label">${t('Ejaan & Bahasa', 'Spelling & Language', getLang())}</span>
            </button>
            <button class="settings-nav-item ${this.activeTab === 'compiler' ? 'active' : ''}" data-tab="compiler">
              <span class="nav-icon">⚡</span>
              <span class="nav-label">Compiler</span>
            </button>
            <button class="settings-nav-item ${this.activeTab === 'reference' ? 'active' : ''}" data-tab="reference">
              <span class="nav-icon">📚</span>
              <span class="nav-label">${t('Referensi & Sitasi', 'Reference & Citation', getLang())}</span>
            </button>
            <button class="settings-nav-item ${this.activeTab === 'appearance' ? 'active' : ''}" data-tab="appearance">
              <span class="nav-icon">🎨</span>
              <span class="nav-label">${t('Tampilan / Tema', 'Appearance / Theme', getLang())}</span>
            </button>
          </nav>

          <!-- Tab Content Body -->
          <div class="settings-tab-content" id="settings-tab-body">
            ${this.renderTabBody(this.activeTab)}
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="settings-modal-footer">
          <button class="settings-btn-reset" id="settings-btn-reset">
            ↺ ${t('Reset Standar', 'Reset Defaults', getLang())}
          </button>
          <div class="settings-footer-right">
            <button class="settings-btn-cancel" id="settings-btn-cancel">
              ${t('Batal', 'Cancel', getLang())}
            </button>
            <button class="settings-btn-save" id="settings-btn-save">
              ✓ ${t('Simpan Pengaturan', 'Save Preferences', getLang())}
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)
    this.container = modal

    this.bindEvents()
  }

  public close(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }

  private bindEvents(): void {
    if (!this.container) return

    // Close buttons
    this.container.querySelector('#settings-close-x')?.addEventListener('click', () => this.close())
    this.container.querySelector('#settings-btn-cancel')?.addEventListener('click', () => this.close())

    // Click outside backdrop
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close()
      }
    })

    // Navigation item switches
    const navItems = this.container.querySelectorAll('.settings-nav-item')
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        navItems.forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        const tab = btn.getAttribute('data-tab') as SettingsTab
        this.activeTab = tab
        const body = this.container?.querySelector('#settings-tab-body')
        if (body) {
          body.innerHTML = this.renderTabBody(tab)
          this.bindFormInputs()
        }
      })
    })

    // Save button
    this.container.querySelector('#settings-btn-save')?.addEventListener('click', () => {
      saveSettings(this.settings)
      this.options.onApplySettings(this.settings)
      this.close()
    })

    // Reset button
    this.container.querySelector('#settings-btn-reset')?.addEventListener('click', () => {
      this.settings = { ...DEFAULT_SETTINGS }
      const body = this.container?.querySelector('#settings-tab-body')
      if (body) {
        body.innerHTML = this.renderTabBody(this.activeTab)
        this.bindFormInputs()
      }
    })

    this.bindFormInputs()
  }

  private bindFormInputs(): void {
    if (!this.container) return

    // Editor Font Size
    const fontSizeSelect = this.container.querySelector('#setting-font-size') as HTMLSelectElement | null
    fontSizeSelect?.addEventListener('change', () => {
      this.settings.fontSize = Number(fontSizeSelect.value)
    })

    // Editor Keybinding
    const keybindingSelect = this.container.querySelector('#setting-keybinding') as HTMLSelectElement | null
    keybindingSelect?.addEventListener('change', () => {
      this.settings.keybinding = keybindingSelect.value as KeybindingMode
    })

    // Editor Tab Size
    const tabSizeSelect = this.container.querySelector('#setting-tab-size') as HTMLSelectElement | null
    tabSizeSelect?.addEventListener('change', () => {
      this.settings.tabSize = Number(tabSizeSelect.value)
    })

    // Word Wrap
    const wordWrapCheck = this.container.querySelector('#setting-word-wrap') as HTMLInputElement | null
    wordWrapCheck?.addEventListener('change', () => {
      this.settings.wordWrap = wordWrapCheck.checked
    })

    // Auto-Close Brackets
    const autoCloseCheck = this.container.querySelector('#setting-auto-brackets') as HTMLInputElement | null
    autoCloseCheck?.addEventListener('change', () => {
      this.settings.autoCloseBrackets = autoCloseCheck.checked
    })

    // Spellcheck Toggle
    const spellcheckCheck = this.container.querySelector('#setting-spellcheck') as HTMLInputElement | null
    spellcheckCheck?.addEventListener('change', () => {
      this.settings.spellcheck = spellcheckCheck.checked
    })

    // Spellcheck Language
    const spellLangSelect = this.container.querySelector('#setting-spellcheck-lang') as HTMLSelectElement | null
    spellLangSelect?.addEventListener('change', () => {
      this.settings.spellcheckLang = spellLangSelect.value as SpellcheckLang
    })

    // Compiler Engine
    const compilerEngineSelect = this.container.querySelector('#setting-compiler-engine') as HTMLSelectElement | null
    compilerEngineSelect?.addEventListener('change', () => {
      this.settings.compilerEngine = compilerEngineSelect.value as CompilerEngine
    })

    // TeX Live Version
    const texliveSelect = this.container.querySelector('#setting-texlive-version') as HTMLSelectElement | null
    texliveSelect?.addEventListener('change', () => {
      this.settings.texliveVersion = texliveSelect.value as '2025' | '2026'
    })

    // Auto Compile
    const autoCompileCheck = this.container.querySelector('#setting-auto-compile') as HTMLInputElement | null
    autoCompileCheck?.addEventListener('change', () => {
      this.settings.autoCompile = autoCompileCheck.checked
    })

    // Reference Engine
    const bibEngineSelect = this.container.querySelector('#setting-bib-engine') as HTMLSelectElement | null
    bibEngineSelect?.addEventListener('change', () => {
      this.settings.bibEngine = bibEngineSelect.value as BibliographyEngine
    })

    // Citation Format
    const citeFormatSelect = this.container.querySelector('#setting-citation-format') as HTMLSelectElement | null
    citeFormatSelect?.addEventListener('change', () => {
      this.settings.citationFormat = citeFormatSelect.value as CitationStyle
    })

    // Theme Mode
    const themeSelect = this.container.querySelector('#setting-theme-mode') as HTMLSelectElement | null
    themeSelect?.addEventListener('change', () => {
      this.settings.theme = themeSelect.value as ThemeMode
      // Live preview theme change immediately!
      const effective = resolveEffectiveTheme(this.settings.theme)
      const app = document.getElementById('app')
      if (app) {
        app.className = effective === 'dark' ? 'app-root theme-dark' : 'app-root theme-light'
      }
    })

    // Density
    const densitySelect = this.container.querySelector('#setting-density') as HTMLSelectElement | null
    densitySelect?.addEventListener('change', () => {
      this.settings.density = densitySelect.value as 'compact' | 'comfortable'
    })
  }

  private renderTabBody(tab: SettingsTab): string {
    const lang = getLang()
    switch (tab) {
      case 'editor':
        return `
          <div class="settings-section">
            <h3 class="settings-section-title">${t('Konfigurasi Editor Kode', 'Code Editor Configuration', lang)}</h3>
            <p class="settings-section-desc">${t('Atur ukuran font, spasi tab, dan preferensi penyuntingan naskah LaTeX.', 'Configure font sizing, tab spacing, and LaTeX editing behavior.', lang)}</p>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-font-size" class="settings-label">${t('Ukuran Font Editor', 'Editor Font Size', lang)}</label>
                <span class="settings-subdesc">${t('Ukuran teks pada editor kode Monaco & Visual WYSIWYG.', 'Font size inside Monaco code editor & Visual WYSIWYG.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-font-size" class="settings-select">
                  <option value="12" ${this.settings.fontSize === 12 ? 'selected' : ''}>12 px</option>
                  <option value="13" ${this.settings.fontSize === 13 ? 'selected' : ''}>13 px</option>
                  <option value="14" ${this.settings.fontSize === 14 ? 'selected' : ''}>14 px (${t('Standar', 'Default', lang)})</option>
                  <option value="15" ${this.settings.fontSize === 15 ? 'selected' : ''}>15 px</option>
                  <option value="16" ${this.settings.fontSize === 16 ? 'selected' : ''}>16 px</option>
                  <option value="18" ${this.settings.fontSize === 18 ? 'selected' : ''}>18 px</option>
                </select>
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-keybinding" class="settings-label">${t('Navigasi & Keybinding', 'Keybinding Mode', lang)}</label>
                <span class="settings-subdesc">${t('Pilihan shortcut keyboard navigasi editor.', 'Keyboard shortcuts navigation mode.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-keybinding" class="settings-select">
                  <option value="standard" ${this.settings.keybinding === 'standard' ? 'selected' : ''}>Standard (VSCode / Modern)</option>
                  <option value="vim" ${this.settings.keybinding === 'vim' ? 'selected' : ''}>Vim Navigation</option>
                  <option value="emacs" ${this.settings.keybinding === 'emacs' ? 'selected' : ''}>Emacs Mode</option>
                </select>
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-tab-size" class="settings-label">${t('Ukuran Tab Spasi', 'Tab Size', lang)}</label>
                <span class="settings-subdesc">${t('Jumlah spasi untuk indentasi blok LaTeX.', 'Number of spaces per indentation block.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-tab-size" class="settings-select">
                  <option value="2" ${this.settings.tabSize === 2 ? 'selected' : ''}>2 spaces</option>
                  <option value="4" ${this.settings.tabSize === 4 ? 'selected' : ''}>4 spaces</option>
                </select>
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-word-wrap" class="settings-label">${t('Pelipatan Baris (Word Wrap)', 'Word Wrap', lang)}</label>
                <span class="settings-subdesc">${t('Lipat teks panjang secara otomatis agar tidak keluar layar horizontal.', 'Soft wrap long paragraphs to prevent horizontal scrolling.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <input type="checkbox" id="setting-word-wrap" class="settings-checkbox" ${this.settings.wordWrap ? 'checked' : ''} />
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-auto-brackets" class="settings-label">${t('Otomatis Kurung & Sintaks', 'Auto-Close Brackets & Quotes', lang)}</label>
                <span class="settings-subdesc">${t('Otomatis menyisipkan kurung tutup { }, [ ], dan simbol kutip.', 'Automatically insert closing brackets and quote pairs.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <input type="checkbox" id="setting-auto-brackets" class="settings-checkbox" ${this.settings.autoCloseBrackets ? 'checked' : ''} />
              </div>
            </div>
          </div>
        `

      case 'spelling':
        return `
          <div class="settings-section">
            <h3 class="settings-section-title">${t('Pemeriksaan Ejaan & Bahasa', 'Spelling & Language Dictionary', lang)}</h3>
            <p class="settings-section-desc">${t('Atur kamus ejaan otomatis untuk naskah akademik dan publikasi.', 'Configure automated spellchecking and dictionary for academic manuscripts.', lang)}</p>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-spellcheck" class="settings-label">${t('Pemeriksaan Ejaan Aktif', 'Spell Check Enabled', lang)}</label>
                <span class="settings-subdesc">${t('Garis bawahi kata yang salah eja di naskah.', 'Underline misspelled words during writing.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <input type="checkbox" id="setting-spellcheck" class="settings-checkbox" ${this.settings.spellcheck ? 'checked' : ''} />
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-spellcheck-lang" class="settings-label">${t('Bahasa Kamus Utama', 'Primary Dictionary Language', lang)}</label>
                <span class="settings-subdesc">${t('Pilih kamus bahasa yang digunakan untuk memeriksa teks.', 'Language dictionary applied for vocabulary checking.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-spellcheck-lang" class="settings-select">
                  <option value="en_US" ${this.settings.spellcheckLang === 'en_US' ? 'selected' : ''}>English (United States)</option>
                  <option value="en_GB" ${this.settings.spellcheckLang === 'en_GB' ? 'selected' : ''}>English (United Kingdom)</option>
                  <option value="id_ID" ${this.settings.spellcheckLang === 'id_ID' ? 'selected' : ''}>Bahasa Indonesia</option>
                  <option value="de_DE" ${this.settings.spellcheckLang === 'de_DE' ? 'selected' : ''}>Deutsch (German)</option>
                  <option value="fr_FR" ${this.settings.spellcheckLang === 'fr_FR' ? 'selected' : ''}>Français (French)</option>
                  <option value="es_ES" ${this.settings.spellcheckLang === 'es_ES' ? 'selected' : ''}>Español (Spanish)</option>
                  <option value="off" ${this.settings.spellcheckLang === 'off' ? 'selected' : ''}>${t('Nonaktif / None', 'Disabled / None', lang)}</option>
                </select>
              </div>
            </div>
          </div>
        `

      case 'compiler':
        return `
          <div class="settings-section">
            <h3 class="settings-section-title">${t('Mesin Kompiler LaTeX', 'LaTeX Engine & Compilation', lang)}</h3>
            <p class="settings-section-desc">${t('Tentukan mesin biner WebAssembly TeX Live dan mode kompilasi.', 'Select WebAssembly TeX Live engine binary and compilation behavior.', lang)}</p>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-compiler-engine" class="settings-label">${t('Mesin Kompilasi Bawaan', 'Default TeX Engine', lang)}</label>
                <span class="settings-subdesc">${t('XeLaTeX direkomendasikan untuk dukungan font modern & karakter Unicode UTF-8.', 'XeLaTeX recommended for native UTF-8 fonts and modern packages.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-compiler-engine" class="settings-select">
                  <option value="xelatex" ${this.settings.compilerEngine === 'xelatex' ? 'selected' : ''}>XeLaTeX (${t('Disarankan', 'Recommended', lang)})</option>
                  <option value="pdflatex" ${this.settings.compilerEngine === 'pdflatex' ? 'selected' : ''}>pdfLaTeX (Classic)</option>
                  <option value="lualatex" ${this.settings.compilerEngine === 'lualatex' ? 'selected' : ''}>LuaLaTeX (Experimental)</option>
                </select>
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-texlive-version" class="settings-label">TeX Live Release</label>
                <span class="settings-subdesc">${t('Versi arsip paket CTAN TeX Live.', 'Target CTAN TeX Live package distribution.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-texlive-version" class="settings-select">
                  <option value="2025" ${this.settings.texliveVersion === '2025' ? 'selected' : ''}>TeX Live 2025 (LTS)</option>
                  <option value="2026" ${this.settings.texliveVersion === '2026' ? 'selected' : ''}>TeX Live 2026 (Rolling)</option>
                </select>
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-auto-compile" class="settings-label">${t('Kompilasi Otomatis (Auto-compile)', 'Auto-Compile on Edit', lang)}</label>
                <span class="settings-subdesc">${t('Otomatis mengompilasi PDF beberapa detik setelah selesai mengetik.', 'Trigger automatic background recompile after typing stops.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <input type="checkbox" id="setting-auto-compile" class="settings-checkbox" ${this.settings.autoCompile ? 'checked' : ''} />
              </div>
            </div>
          </div>
        `

      case 'reference':
        return `
          <div class="settings-section">
            <h3 class="settings-section-title">${t('Referensi Bibliografi & Sitasi', 'Bibliography & Citation Management', lang)}</h3>
            <p class="settings-section-desc">${t('Atur pemroses bibliografi (.bib) dan sintaks penyisipan sitasi.', 'Configure bibliography processing (.bib) and citation macro injection.', lang)}</p>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-bib-engine" class="settings-label">${t('Mesin Bibliografi', 'Bibliography Engine', lang)}</label>
                <span class="settings-subdesc">${t('Pemroses file .bib dan indeks referensi.', 'Processor for .bib databases and reference indexing.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-bib-engine" class="settings-select">
                  <option value="bibtex" ${this.settings.bibEngine === 'bibtex' ? 'selected' : ''}>BibTeX (Classic Standard)</option>
                  <option value="biber" ${this.settings.bibEngine === 'biber' ? 'selected' : ''}>Biber / BibLaTeX</option>
                </select>
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-citation-format" class="settings-label">${t('Format Makro Sitasi', 'Citation Macro Style', lang)}</label>
                <span class="settings-subdesc">${t('Sintaks otomatis yang disisipkan saat memilih referensi dari pustaka.', 'Default command generated when inserting from research library.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-citation-format" class="settings-select">
                  <option value="cite" ${this.settings.citationFormat === 'cite' ? 'selected' : ''}>\\cite{key} (Standard)</option>
                  <option value="citep" ${this.settings.citationFormat === 'citep' ? 'selected' : ''}>\\citep{key} (Natbib Parenthetical)</option>
                  <option value="autocite" ${this.settings.citationFormat === 'autocite' ? 'selected' : ''}>\\autocite{key} (BibLaTeX)</option>
                </select>
              </div>
            </div>
          </div>
        `

      case 'appearance':
        return `
          <div class="settings-section">
            <h3 class="settings-section-title">${t('Tampilan & Tema Visual', 'Appearance & Visual Theme', lang)}</h3>
            <p class="settings-section-desc">${t('Sesuaikan tema antarmuka dan preferensi warna WasmTex Studio.', 'Customize interface theme colors and visual presentation.', lang)}</p>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-theme-mode" class="settings-label">${t('Mode Tema (Theme)', 'Color Theme', lang)}</label>
                <span class="settings-subdesc">${t('Pilih tema gelap, terang, atau ikuti preferensi sistem komputer/browser secara otomatis.', 'Choose dark, light, or sync automatically with your browser/OS system theme.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-theme-mode" class="settings-select">
                  <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>🖥️ ${t('Auto (Ikuti Browser / Komputer)', 'Auto (Match OS / Browser)', lang)}</option>
                  <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>🌙 ${t('Mode Gelap (Dark)', 'Dark Mode', lang)}</option>
                  <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>☀️ ${t('Mode Terang (Light)', 'Light Mode', lang)}</option>
                </select>
              </div>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <label for="setting-density" class="settings-label">${t('Kepadatan Tata Letak (Density)', 'Interface Density', lang)}</label>
                <span class="settings-subdesc">${t('Pilihan padding kompak untuk layar kerja teknis.', 'Padding density across navigation bars and toolbars.', lang)}</span>
              </div>
              <div class="settings-row-control">
                <select id="setting-density" class="settings-select">
                  <option value="compact" ${this.settings.density === 'compact' ? 'selected' : ''}>${t('Kompak (Compact Tactical)', 'Compact Tactical', lang)}</option>
                  <option value="comfortable" ${this.settings.density === 'comfortable' ? 'selected' : ''}>${t('Longgar (Comfortable)', 'Comfortable', lang)}</option>
                </select>
              </div>
            </div>
          </div>
        `
    }
  }
}
