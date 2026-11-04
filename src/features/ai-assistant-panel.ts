import {
  type AgentContext,
  type AgentStep,
  AIService,
  type CompactionStats,
  CURATED_COMMUNITY_SKILLS,
  compactChatHistory,
  deleteSkill,
  extractTextFromPdf,
  fetchSkillFromUrl,
  loadAllSkills,
  loadProjectMemory,
  type ModelAdapterOptions,
  type ModelProvider,
  type ProposedFix,
  type Skill,
  type ToolCall,
  updateProjectMemory,
  upsertSkill,
} from '../ai'
import type { WasmTex } from '../wasmtex'
import { tacticalAlert, tacticalConfirm } from '../ui/tactical-dialog'
import { t } from '../ui/i18n'

export interface AiAssistantPanelOptions {
  getEditor: () => WasmTex | null
  getCompilerErrors: () => Array<{ message: string; file?: string | undefined; line?: number | undefined; code?: string | undefined }>
  getProjectId?: (() => string) | undefined
  onRecompile: () => void
  onInsertText: (text: string) => void
  onReplaceSelection: (text: string) => void
}

const AI_CONFIG_KEY = 'wasmtex_ai_config'

export interface StoredAiConfig {
  provider: ModelProvider
  endpoint: string
  apiKey: string
  model: string
  locale: 'en' | 'id'
}

const PROVIDER_PRESETS: Record<ModelProvider, { endpoint: string; defaultModel: string }> = {
  '9router': { endpoint: 'https://9router.com/v1', defaultModel: 'gpt-4o' },
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
  },
  openai: { endpoint: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  anthropic: { endpoint: 'https://api.anthropic.com', defaultModel: 'claude-3-5-sonnet-20241022' },
  ollama: { endpoint: 'http://localhost:11434', defaultModel: 'llama3.1' },
  custom: { endpoint: '', defaultModel: '' },
}

const DEFAULT_CONFIG: StoredAiConfig = {
  provider: 'ollama',
  endpoint: 'http://localhost:11434',
  apiKey: '',
  model: 'llama3.1',
  locale: 'id',
}

export function loadAiConfig(): StoredAiConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<StoredAiConfig>) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveAiConfig(cfg: StoredAiConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg))
  } catch {
    // ignore quota
  }
}

export class AiAssistantPanel {
  private container: HTMLElement | null = null
  private options: AiAssistantPanelOptions
  private config: StoredAiConfig
  private aiService: AIService | null = null
  private isOpen = false
  private activeTab: 'chat' | 'errors' | 'writing' | 'research' | 'memory' | 'settings' = 'chat'
  private chatHistory: Array<{
    role: 'user' | 'assistant'
    text: string
    steps?: AgentStep[]
    compactionStats?: CompactionStats
  }> = []
  private pendingApprovalResolver: ((approved: boolean) => void) | null = null
  private isProcessing = false

  constructor(options: AiAssistantPanelOptions) {
    this.options = options
    this.config = loadAiConfig()
    this.initAiService()
  }

  private getProjectId(): string {
    return this.options.getProjectId?.() ?? 'default'
  }

  private initAiService(): void {
    const editor = this.options.getEditor()
    if (!editor) return

    const fs = editor.getVirtualFileSystem()

    const modelOpts: ModelAdapterOptions = {
      provider: this.config.provider,
      endpoint: this.config.endpoint,
      model: this.config.model,
    }
    if (this.config.apiKey) modelOpts.apiKey = this.config.apiKey

    this.aiService = new AIService({
      model: modelOpts,
      fs,
      projectId: this.getProjectId(),
      locale: this.config.locale,
      onApprovalNeeded: (call) => this.requestApproval(call),
    })
  }

  private requestApproval(call: ToolCall): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingApprovalResolver = resolve
      this.renderApprovalPrompt(call)
    })
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
    this.isOpen = true
    if (!this.aiService) this.initAiService()

    const el = document.createElement('div')
    el.className = 'ai-assistant-drawer'
    el.id = 'ai-assistant-drawer'
    el.innerHTML = this.renderShell()
    document.body.appendChild(el)
    this.container = el

    this.bindEvents()
    this.renderTabContent()
    document.getElementById('view-workspace')?.classList.add('has-side-drawer')
    setTimeout(() => window.dispatchEvent(new Event('resize')), 250)
  }

  close(): void {
    this.isOpen = false
    if (this.container) {
      this.container.remove()
      this.container = null
    }
    document.getElementById('view-workspace')?.classList.remove('has-side-drawer')
    setTimeout(() => window.dispatchEvent(new Event('resize')), 250)
    if (this.pendingApprovalResolver) {
      this.pendingApprovalResolver(false)
      this.pendingApprovalResolver = null
    }
  }

  private renderShell(): string {
    return `
      <div class="ai-drawer-header">
        <div class="ai-header-title">
          <span class="ai-badge-icon">✨</span>
          <span class="ai-title-text">[ AI RESEARCH AGENT ]</span>
        </div>
        <button class="modal-close-btn" id="ai-drawer-close">&times;</button>
      </div>

      <div class="ai-nav-tabs">
        <button class="ai-nav-tab ${this.activeTab === 'chat' ? 'active' : ''}" data-tab="chat">💬 Chat</button>
        <button class="ai-nav-tab ${this.activeTab === 'errors' ? 'active' : ''}" data-tab="errors">🛠️ Errors</button>
        <button class="ai-nav-tab ${this.activeTab === 'writing' ? 'active' : ''}" data-tab="writing">✍️ Writing</button>
        <button class="ai-nav-tab ${this.activeTab === 'research' ? 'active' : ''}" data-tab="research">📚 Paper</button>
        <button class="ai-nav-tab ${this.activeTab === 'memory' ? 'active' : ''}" data-tab="memory">🧠 Skills</button>
        <button class="ai-nav-tab ${this.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">⚙️ Config</button>
      </div>

      <div class="ai-tab-body" id="ai-tab-body"></div>
    `
  }

  private bindEvents(): void {
    if (!this.container) return
    const closeBtn = this.container.querySelector('#ai-drawer-close')
    closeBtn?.addEventListener('click', () => this.close())

    const tabs = this.container.querySelectorAll('.ai-nav-tab')
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement
        const tabKey = target.dataset.tab as typeof this.activeTab
        if (tabKey) {
          this.activeTab = tabKey
          tabs.forEach((t) => {
            t.classList.remove('active')
          })
          target.classList.add('active')
          this.renderTabContent()
        }
      })
    })
  }

  private renderTabContent(): void {
    const body = this.container?.querySelector('#ai-tab-body')
    if (!body) return

    switch (this.activeTab) {
      case 'chat':
        this.renderChatTab(body)
        break
      case 'errors':
        this.renderErrorsTab(body)
        break
      case 'writing':
        this.renderWritingTab(body)
        break
      case 'research':
        this.renderResearchTab(body)
        break
      case 'memory':
        this.renderMemoryTab(body)
        break
      case 'settings':
        this.renderSettingsTab(body)
        break
    }
  }

  private renderChatTab(container: Element): void {
    container.innerHTML = `
      <div class="ai-chat-container">
        <div class="ai-chat-messages" id="ai-chat-messages">
          ${
            this.chatHistory.length === 0
              ? `<div class="ai-empty-prompt">
                  <strong>Bagaimana saya bisa membantu riset & LaTeX Anda hari ini?</strong>
                  <p>Anda bisa bertanya, meminta analisis error, menambahkan referensi, atau mengedit dokumen dengan instruksi multi-step.</p>
                  <div class="ai-quick-chips">
                    <button class="ai-chip" data-prompt="Jelaskan struktur dokumen ini dan rekomendasikan bagian yang kurang.">🔍 Analisis Dokumen</button>
                    <button class="ai-chip" data-prompt="Periksa apakah ada referensi atau sitasi yang belum terdefinisi.">📑 Cek Sitasi</button>
                    <button class="ai-chip" data-prompt="Bantu poles kalimat pada teks yang sedang saya pilih agar lebih akademik.">✨ Poles Kalimat</button>
                  </div>
                </div>`
              : this.chatHistory
                  .map(
                    (m) => `
                <div class="ai-message ai-${m.role}">
                  <div class="ai-msg-sender">${m.role === 'user' ? '👤 Anda' : '🤖 AI Agent'}</div>
                  <div class="ai-msg-body">${this.escapeHtml(m.text)}</div>
                  ${
                    m.steps && m.steps.length > 0
                      ? `<div class="ai-steps-meta">Tool calls: ${m.steps
                          .map((s) => s.toolCalls.map((tc) => tc.tool).join(', '))
                          .join(' → ')}</div>`
                      : ''
                  }
                  ${
                    m.compactionStats && m.compactionStats.savedTokens > 0
                      ? `<div class="ai-compaction-badge">⚡ Hemat ${m.compactionStats.savedTokens} token (${m.compactionStats.savedPercentage}%) via kompresi konteks</div>`
                      : ''
                  }
                </div>
              `,
                  )
                  .join('')
          }
          <div id="ai-approval-slot"></div>
        </div>

        <div class="ai-chat-input-bar">
          <textarea id="ai-chat-input" class="ai-chat-input" placeholder="Ketik perintah atau pertanyaan LaTeX..." rows="2" ${this.isProcessing ? 'disabled' : ''}></textarea>
          <button id="ai-chat-send" class="ai-btn ai-btn-primary" ${this.isProcessing ? 'disabled' : ''}>
            ${this.isProcessing ? '⏳' : 'Kirim'}
          </button>
        </div>
      </div>
    `

    const sendBtn = container.querySelector('#ai-chat-send')
    const input = container.querySelector('#ai-chat-input') as HTMLTextAreaElement

    const send = () => {
      const q = input?.value.trim()
      if (!q || this.isProcessing) return
      input.value = ''
      this.handleUserChat(q)
    }

    sendBtn?.addEventListener('click', send)
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        send()
      }
    })

    container.querySelectorAll('.ai-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const p = chip.getAttribute('data-prompt')
        if (p) this.handleUserChat(p)
      })
    })

    const msgList = container.querySelector('#ai-chat-messages')
    if (msgList) msgList.scrollTop = msgList.scrollHeight
  }

  private async handleUserChat(prompt: string): Promise<void> {
    if (!this.aiService) this.initAiService()
    if (!this.aiService) return

    this.chatHistory.push({ role: 'user', text: prompt })
    this.isProcessing = true
    this.renderTabContent()

    const editor = this.options.getEditor()
    const activeFile = editor?.getActiveFile()
    const selection = editor?.getMonacoEditor().getSelection()
    const selText = selection
      ? editor?.getMonacoEditor().getModel()?.getValueInRange(selection)
      : undefined

    const context: AgentContext = {
      priorMessages: this.chatHistory.map((h) => ({ role: h.role, content: h.text })),
    }
    if (activeFile) context.activeFile = activeFile
    if (selText) context.selectedText = selText

    try {
      const res = await this.aiService.chat(prompt, context)
      const assistantMsg: (typeof this.chatHistory)[number] = {
        role: 'assistant',
        text: res.response,
        steps: res.steps,
      }
      if (res.compactionStats) assistantMsg.compactionStats = res.compactionStats
      this.chatHistory.push(assistantMsg)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      this.chatHistory.push({
        role: 'assistant',
        text: `Error: ${errMsg}`,
      })
    } finally {
      this.isProcessing = false
      this.renderTabContent()
    }
  }

  private renderApprovalPrompt(call: ToolCall): void {
    const slot = this.container?.querySelector('#ai-approval-slot')
    if (!slot) return

    slot.innerHTML = `
      <div class="ai-approval-card">
        <div class="ai-approval-title">⚠️ Konfirmasi Modifikasi Proyek</div>
        <div class="ai-approval-detail">AI Agent meminta untuk mengeksekusi aksi: <code>${this.escapeHtml(call.function.name)}</code></div>
        <pre class="ai-approval-args">${this.escapeHtml(call.function.arguments)}</pre>
        <div class="ai-approval-actions">
          <button id="ai-approve-btn" class="ai-btn ai-btn-success">✓ Izinkan (Approve)</button>
          <button id="ai-reject-btn" class="ai-btn ai-btn-danger">✕ Tolak (Reject)</button>
        </div>
      </div>
    `

    slot.querySelector('#ai-approve-btn')?.addEventListener('click', () => {
      slot.innerHTML = ''
      this.pendingApprovalResolver?.(true)
      this.pendingApprovalResolver = null
    })

    slot.querySelector('#ai-reject-btn')?.addEventListener('click', () => {
      slot.innerHTML = ''
      this.pendingApprovalResolver?.(false)
      this.pendingApprovalResolver = null
    })
  }

  private renderErrorsTab(container: Element): void {
    const errors = this.options.getCompilerErrors()
    container.innerHTML = `
      <div class="ai-errors-container">
        <div class="ai-section-desc">
          <strong>Diagnosis Error Kompilasi & LSP</strong>
          <p>Terdeteksi <b>${errors.length}</b> error atau peringatan pada sesi ini.</p>
        </div>

        <button id="ai-diagnose-btn" class="ai-btn ai-btn-primary" style="width: 100%; margin-bottom: 12px;" ${errors.length === 0 ? 'disabled' : ''}>
          🔍 Analisis Masalah & Usulkan Solusi
        </button>

        <div id="ai-diagnosis-result">
          ${
            errors.length === 0
              ? '<div class="ai-clean-banner">✓ Tidak ada error kompilasi yang terdeteksi. Dokumen bersih!</div>'
              : `<div class="ai-error-list-preview">
                  ${errors
                    .slice(0, 5)
                    .map(
                      (e) => `
                    <div class="ai-err-item">
                      <span class="ai-err-file">${e.file ?? 'main.tex'}:${e.line ?? 0}</span>
                      <span class="ai-err-msg">${this.escapeHtml(e.message)}</span>
                    </div>
                  `,
                    )
                    .join('')}
                </div>`
          }
        </div>
      </div>
    `

    container.querySelector('#ai-diagnose-btn')?.addEventListener('click', async () => {
      const resSlot = container.querySelector('#ai-diagnosis-result')
      if (!resSlot || !this.aiService) return

      resSlot.innerHTML =
        '<div class="ai-loading-pill">⏳ Memeriksa berkas dan menganalisis log TeX...</div>'
      try {
        const diag = await this.aiService.diagnoseErrors(errors)
        resSlot.innerHTML = `
          <div class="ai-diag-card">
            <div class="ai-diag-summary"><b>Ringkasan:</b> ${this.escapeHtml(diag.summary)}</div>
            <div class="ai-diag-cause"><b>Penyebab Utama:</b> ${this.escapeHtml(diag.rootCause)}</div>
            ${
              diag.fixes.length > 0
                ? `<div class="ai-fixes-list">
                    <strong>Solusi yang Disarankan:</strong>
                    ${diag.fixes
                      .map(
                        (f, i) => `
                      <div class="ai-fix-item">
                        <div class="ai-fix-header">Berkas: <code>${this.escapeHtml(f.file)}</code> ${f.line ? `(Baris ${f.line})` : ''}</div>
                        <div class="ai-fix-expl">${this.escapeHtml(f.explanation)}</div>
                        <pre class="ai-fix-diff"><code>- ${this.escapeHtml(f.oldSnippet)}\n+ ${this.escapeHtml(f.newSnippet)}</code></pre>
                        <button class="ai-btn ai-btn-sm ai-apply-fix" data-fix-idx="${i}">Terapkan Solusi</button>
                      </div>
                    `,
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>
        `

        resSlot.querySelectorAll('.ai-apply-fix').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget as HTMLButtonElement
            const idx = Number(targetBtn.dataset.fixIdx ?? -1)
            const fix = diag.fixes[idx]
            if (fix) {
              this.applyDiagnosisFix(fix, targetBtn)
            }
          })
        })
      } catch (err: unknown) {
        resSlot.innerHTML = `<div class="ai-error-banner">Gagal menganalisis: ${this.escapeHtml(String(err))}</div>`
      }
    })
  }

  private applyDiagnosisFix(fix: ProposedFix, btn: HTMLButtonElement): void {
    const editor = this.options.getEditor()
    if (!editor) return
    const fs = editor.getVirtualFileSystem()
    const cur = fs.readFile(fix.file)
    if (cur === null) return

    const text = typeof cur === 'string' ? cur : new TextDecoder().decode(cur)
    if (text.includes(fix.oldSnippet)) {
      fs.writeFile(fix.file, text.replace(fix.oldSnippet, fix.newSnippet))
    } else {
      fs.writeFile(fix.file, `${text}\n${fix.newSnippet}`)
    }
    this.options.onRecompile()
    btn.textContent = '✓ Diterapkan'
    btn.disabled = true
  }

  private renderWritingTab(container: Element): void {
    container.innerHTML = `
      <div class="ai-writing-container">
        <div class="ai-tool-group">
          <label class="ai-label">📐 Buat Persamaan Matematika (LaTeX Math)</label>
          <input type="text" id="ai-eq-prompt" class="ai-field" placeholder="Contoh: integral gaussian dari min tak hingga ke tak hingga..." />
          <button id="ai-eq-btn" class="ai-btn ai-btn-secondary" style="margin-top: 4px;">Generate Persamaan</button>
          <div id="ai-eq-result"></div>
        </div>

        <div class="ai-tool-group" style="margin-top: 16px;">
          <label class="ai-label">📊 Buat Tabel LaTeX (Booktabs)</label>
          <input type="text" id="ai-table-prompt" class="ai-field" placeholder="Contoh: perbandingan akurasi 3 model (BERT, RoBERTa, WasmTex)..." />
          <button id="ai-table-btn" class="ai-btn ai-btn-secondary" style="margin-top: 4px;">Generate Tabel</button>
          <div id="ai-table-result"></div>
        </div>

        <div class="ai-tool-group" style="margin-top: 16px;">
          <label class="ai-label">✨ Poles Teks Terpilih (Academic Tone)</label>
          <div class="ai-row">
            <select id="ai-tone-select" class="ai-field" style="width: auto;">
              <option value="academic">Academic / Formal</option>
              <option value="concise">Concise & Dense</option>
              <option value="standard">Standard English</option>
            </select>
            <button id="ai-polish-btn" class="ai-btn ai-btn-secondary">Poles Seleksi</button>
          </div>
          <div id="ai-polish-result"></div>
        </div>
      </div>
    `

    // Equation
    container.querySelector('#ai-eq-btn')?.addEventListener('click', async () => {
      const p = (container.querySelector('#ai-eq-prompt') as HTMLInputElement)?.value
      const resSlot = container.querySelector('#ai-eq-result')
      if (!p || !resSlot || !this.aiService) return
      resSlot.innerHTML = '⏳ Menghasilkan formula...'
      try {
        const eq = await this.aiService.generateEquation(p)
        resSlot.innerHTML = `
          <pre class="ai-code-preview"><code>${this.escapeHtml(eq)}</code></pre>
          <button class="ai-btn ai-btn-sm ai-btn-primary" id="ai-insert-eq">Sisipkan ke Editor</button>
        `
        resSlot.querySelector('#ai-insert-eq')?.addEventListener('click', () => {
          this.options.onInsertText(`\n${eq}\n`)
        })
      } catch (e) {
        resSlot.innerHTML = `<span class="ai-err-msg">${this.escapeHtml(String(e))}</span>`
      }
    })

    // Table
    container.querySelector('#ai-table-btn')?.addEventListener('click', async () => {
      const p = (container.querySelector('#ai-table-prompt') as HTMLInputElement)?.value
      const resSlot = container.querySelector('#ai-table-result')
      if (!p || !resSlot || !this.aiService) return
      resSlot.innerHTML = '⏳ Menyusun struktur tabel...'
      try {
        const tbl = await this.aiService.generateTable(p, true)
        resSlot.innerHTML = `
          <pre class="ai-code-preview"><code>${this.escapeHtml(tbl)}</code></pre>
          <button class="ai-btn ai-btn-sm ai-btn-primary" id="ai-insert-tbl">Sisipkan ke Editor</button>
        `
        resSlot.querySelector('#ai-insert-tbl')?.addEventListener('click', () => {
          this.options.onInsertText(`\n${tbl}\n`)
        })
      } catch (e) {
        resSlot.innerHTML = `<span class="ai-err-msg">${this.escapeHtml(String(e))}</span>`
      }
    })

    // Polish
    container.querySelector('#ai-polish-btn')?.addEventListener('click', async () => {
      const tone = (container.querySelector('#ai-tone-select') as HTMLSelectElement)?.value as
        | 'academic'
        | 'concise'
        | 'standard'
      const resSlot = container.querySelector('#ai-polish-result')
      const editor = this.options.getEditor()
      if (!resSlot || !this.aiService || !editor) return

      const sel = editor.getMonacoEditor().getSelection()
      const text = sel ? editor.getMonacoEditor().getModel()?.getValueInRange(sel) : ''
      if (!text) {
        resSlot.innerHTML = '<span class="ai-err-msg">Pilih teks di editor terlebih dahulu.</span>'
        return
      }

      resSlot.innerHTML = '⏳ Memoles gaya penulisan...'
      try {
        const polished = await this.aiService.polishGrammar(text, tone)
        resSlot.innerHTML = `
          <pre class="ai-code-preview"><code>${this.escapeHtml(polished)}</code></pre>
          <button class="ai-btn ai-btn-sm ai-btn-primary" id="ai-replace-sel">Ganti Teks Terpilih</button>
        `
        resSlot.querySelector('#ai-replace-sel')?.addEventListener('click', () => {
          this.options.onReplaceSelection(polished)
        })
      } catch (e) {
        resSlot.innerHTML = `<span class="ai-err-msg">${this.escapeHtml(String(e))}</span>`
      }
    })
  }

  private renderResearchTab(container: Element): void {
    container.innerHTML = `
      <div class="ai-research-container">
        <div class="ai-section-desc">
          <strong>Asisten Pembaca Jurnal & Paper</strong>
          <p>Unggah PDF penelitian atau tempel teks paper untuk ringkasan cepat, ekstraksi BibTeX, atau komparasi dengan naskah Anda.</p>
        </div>

        <div class="ai-field-block">
          <label class="ai-label">Unggah Berkas PDF Paper</label>
          <input type="file" id="ai-pdf-upload" accept=".pdf" class="ai-file-input" />
        </div>

        <div class="ai-field-block" style="margin-top: 10px;">
          <label class="ai-label">Atau Tempel Teks Paper / Abstrak</label>
          <textarea id="ai-paper-text" class="ai-field" rows="4" placeholder="Tempel abstrak atau teks penelitian di sini..."></textarea>
        </div>

        <div class="ai-row" style="margin-top: 12px; gap: 6px;">
          <button id="ai-summarize-btn" class="ai-btn ai-btn-secondary" style="flex: 1;">📑 Ringkas Paper</button>
          <button id="ai-bibtex-btn" class="ai-btn ai-btn-secondary" style="flex: 1;">🏷️ Ekstrak BibTeX</button>
        </div>

        <div id="ai-research-result" style="margin-top: 14px;"></div>
      </div>
    `

    const fileInput = container.querySelector('#ai-pdf-upload') as HTMLInputElement
    const textArea = container.querySelector('#ai-paper-text') as HTMLTextAreaElement
    const resultSlot = container.querySelector('#ai-research-result')

    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0]
      if (!file || !resultSlot) return
      resultSlot.innerHTML = '⏳ Mengekstrak teks dari PDF...'
      try {
        const ab = await file.arrayBuffer()
        const text = await extractTextFromPdf(ab)
        textArea.value = text.slice(0, 8000)
        resultSlot.innerHTML = `✓ Berhasil mengekstrak ${text.length} karakter dari PDF.`
      } catch (e) {
        resultSlot.innerHTML = `<span class="ai-err-msg">Gagal mengekstrak PDF: ${this.escapeHtml(String(e))}</span>`
      }
    })

    container.querySelector('#ai-summarize-btn')?.addEventListener('click', async () => {
      const text = textArea?.value.trim()
      if (!text || !resultSlot || !this.aiService) return
      resultSlot.innerHTML = '⏳ Membuat ringkasan terstruktur...'
      try {
        const sum = await this.aiService.summarizePaper(text, this.config.locale)
        resultSlot.innerHTML = `
          <div class="ai-summary-card">
            <h4>${this.escapeHtml(sum.title)}</h4>
            <div class="ai-summary-meta">Penulis: ${this.escapeHtml(sum.authors.join(', ') || 'N/A')}</div>
            <p><b>Abstrak:</b> ${this.escapeHtml(sum.abstract)}</p>
            ${
              sum.objectives.length > 0
                ? `<div><b>Tujuan:</b><ul>${sum.objectives.map((o) => `<li>${this.escapeHtml(o)}</li>`).join('')}</ul></div>`
                : ''
            }
            ${
              sum.findings.length > 0
                ? `<div><b>Temuan Utama:</b><ul>${sum.findings.map((f) => `<li>${this.escapeHtml(f)}</li>`).join('')}</ul></div>`
                : ''
            }
            ${
              sum.bibtex
                ? `<pre class="ai-code-preview"><code>${this.escapeHtml(sum.bibtex)}</code></pre>
                   <button class="ai-btn ai-btn-sm ai-btn-primary" id="ai-save-bib">Simpan ke refs.bib</button>`
                : ''
            }
          </div>
        `
        resultSlot.querySelector('#ai-save-bib')?.addEventListener('click', () => {
          this.appendBibtex(sum.bibtex)
        })
      } catch (e) {
        resultSlot.innerHTML = `<span class="ai-err-msg">${this.escapeHtml(String(e))}</span>`
      }
    })

    container.querySelector('#ai-bibtex-btn')?.addEventListener('click', async () => {
      const text = textArea?.value.trim()
      if (!text || !resultSlot || !this.aiService) return
      resultSlot.innerHTML = '⏳ Mengenerate entri BibTeX...'
      try {
        const bib = await this.aiService.extractBibtex(text)
        resultSlot.innerHTML = `
          <pre class="ai-code-preview"><code>${this.escapeHtml(bib)}</code></pre>
          <button class="ai-btn ai-btn-sm ai-btn-primary" id="ai-save-bib">Simpan ke refs.bib</button>
        `
        resultSlot.querySelector('#ai-save-bib')?.addEventListener('click', () => {
          this.appendBibtex(bib)
        })
      } catch (e) {
        resultSlot.innerHTML = `<span class="ai-err-msg">${this.escapeHtml(String(e))}</span>`
      }
    })
  }

  private appendBibtex(bibtex: string): void {
    const editor = this.options.getEditor()
    if (!editor) return
    const fs = editor.getVirtualFileSystem()
    const cur = fs.readFile('refs.bib')
    const existing =
      cur !== null ? (typeof cur === 'string' ? cur : new TextDecoder().decode(cur)) : ''
    fs.writeFile('refs.bib', `${existing.trim()}\n\n${bibtex}\n`)
    tacticalAlert({
      title: 'BibTeX',
      specTag: t('AI // BIBTEX', 'AI // BIBTEX', this.config.locale),
      message: t('Entri berhasil ditambahkan ke refs.bib!', 'Entry successfully appended to refs.bib!', this.config.locale),
      type: 'success',
    })
  }

  private renderSkillsList(skills: Skill[]): string {
    return skills
      .map(
        (s) => `
        <div class="ai-skill-card">
          <div class="ai-row" style="justify-content: space-between; align-items: flex-start;">
            <strong style="font-family: var(--font-mono); font-size: 11.5px;">${this.escapeHtml(s.name)}</strong>
            <button class="ai-btn ai-btn-danger ai-btn-sm ai-del-skill" data-id="${s.id}">Hapus</button>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin: 2px 0 4px;">${this.escapeHtml(s.description)}</div>
          ${s.trigger ? `<div style="font-size: 10px; font-family: var(--font-mono); color: #ff6600;">Trigger: ${this.escapeHtml(s.trigger)}</div>` : ''}
          <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 11px;">
            ${s.rules.map((r) => `<li>${this.escapeHtml(r)}</li>`).join('')}
          </ul>
        </div>
      `,
      )
      .join('')
  }

  private renderMemoryTab(container: Element): void {
    const projId = this.getProjectId()
    const memory = loadProjectMemory(projId)
    const skills = loadAllSkills()

    container.innerHTML = `
      <div class="ai-memory-container">
        <div class="ai-memory-section">
          <div class="ai-section-desc">
            <strong>Konteks & Memori Proyek (${this.escapeHtml(projId)})</strong>
            <p>Catatan fokus, tujuan naskah, dan aturan notasi proyek ini yang diingat otomatis oleh AI.</p>
          </div>

          <div class="ai-field-block">
            <label class="ai-label">Tujuan / Ringkasan Naskah</label>
            <textarea id="ai-mem-summary" class="ai-field" rows="2" placeholder="Contoh: Paper riset tentang adsorpsi biochar pada DAC...">${this.escapeHtml(memory.summary)}</textarea>
          </div>

          <div class="ai-field-block" style="margin-top: 8px;">
            <label class="ai-label">Fokus / Bagian Aktif</label>
            <input type="text" id="ai-mem-topic" class="ai-field" value="${this.escapeHtml(memory.activeTopic ?? '')}" placeholder="Contoh: Metodologi & Kalibrasi Sensor" />
          </div>

          <div class="ai-field-block" style="margin-top: 8px;">
            <label class="ai-label">Konvensi Notasi / Simbol Terdaftar</label>
            <div class="ai-tags-box" id="ai-mem-tags">
              ${(memory.notationDecisions || [])
                .map((dec) => `<span class="ai-tag-chip">${this.escapeHtml(dec)}</span>`)
                .join('')}
            </div>
            <div class="ai-row" style="margin-top: 6px;">
              <input type="text" id="ai-new-notation" class="ai-field" placeholder="Tambah notasi (misal: q_e = kapasitas)..." />
              <button id="ai-add-notation-btn" class="ai-btn ai-btn-sm ai-btn-secondary">+Notasi</button>
            </div>
          </div>

          <button id="ai-save-proj-mem" class="ai-btn ai-btn-primary" style="width: 100%; margin-top: 10px;">
            💾 Simpan Memori Proyek
          </button>
        </div>

        <div class="ai-memory-section" style="margin-top: 16px;">
          <div class="ai-section-desc">
            <strong>Kompaksi Konteks & Hemat Token</strong>
            <p>Kompak riwayat sesi untuk menghemat token masukan tanpa menghilangkan ringkasan keputusan penting.</p>
          </div>
          <div class="ai-row" style="justify-content: space-between; align-items: center;">
            <span style="font-size: 11.5px; font-family: var(--font-mono);">Riwayat: <b>${this.chatHistory.length}</b> pesan</span>
            <button id="ai-compact-btn" class="ai-btn ai-btn-sm ai-btn-secondary" ${this.chatHistory.length <= 4 ? 'disabled' : ''}>
              ⚡ Kompak Riwayat Sekarang
            </button>
          </div>
          <div id="ai-compaction-feedback" style="margin-top: 6px;"></div>
        </div>

        <div class="ai-memory-section" style="margin-top: 16px;">
          <div class="ai-row" style="justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 13px;">Pustaka Skill Pembelajaran (${skills.length})</strong>
            <button id="ai-toggle-new-skill" class="ai-btn ai-btn-sm ai-btn-primary">+ Skill Baru</button>
          </div>

          <div id="ai-new-skill-form" style="display: none; background: var(--bg-secondary); padding: 10px; border-radius: 4px; margin-bottom: 10px;">
            <div class="ai-field-block">
              <label class="ai-label">Nama Skill</label>
              <input type="text" id="ai-new-skill-name" class="ai-field" placeholder="misal: ieee-double-column" />
            </div>
            <div class="ai-field-block" style="margin-top: 6px;">
              <label class="ai-label">Deskripsi</label>
              <input type="text" id="ai-new-skill-desc" class="ai-field" placeholder="misal: Format dan aturan naskah IEEE" />
            </div>
            <div class="ai-field-block" style="margin-top: 6px;">
              <label class="ai-label">Pemicu / Keywords (pisahkan koma)</label>
              <input type="text" id="ai-new-skill-trigger" class="ai-field" placeholder="ieee, journal, double column" />
            </div>
            <div class="ai-field-block" style="margin-top: 6px;">
              <label class="ai-label">Aturan-aturan (1 baris per aturan)</label>
              <textarea id="ai-new-skill-rules" class="ai-field" rows="3" placeholder="Gunakan IEEEkeywords untuk kata kunci&#10;Gunakan table* untuk tabel lebar"></textarea>
            </div>
            <div class="ai-row" style="margin-top: 8px;">
              <button id="ai-submit-skill" class="ai-btn ai-btn-success ai-btn-sm">Simpan Skill</button>
              <button id="ai-cancel-skill" class="ai-btn ai-btn-secondary ai-btn-sm">Batal</button>
            </div>
          </div>

          <div class="ai-skills-list">
            ${this.renderSkillsList(skills)}
          </div>
        </div>

        <!-- Community Skills Hub (blader/humanizer & K-Dense) -->
        <div class="ai-memory-section" style="margin-top: 16px;">
          <div class="ai-section-desc">
            <strong>Hub Skill Komunitas & Preset Populer</strong>
            <p>Pasang paket keahlian ilmiah kurasi (K-Dense-AI scientific skills & blader/humanizer):</p>
          </div>

          <div class="ai-community-skills-grid">
            ${CURATED_COMMUNITY_SKILLS.map(
              (cs) => `
              <div class="ai-curated-card">
                <div class="ai-row" style="justify-content: space-between; align-items: center;">
                  <strong style="font-family: var(--font-mono); font-size: 11px;">${this.escapeHtml(cs.name)}</strong>
                  <button class="ai-btn ai-btn-primary ai-btn-sm ai-install-curated" data-curated-id="${cs.id}">
                    ${skills.some((s) => s.name === cs.name) ? '✓ Terpasang' : '⬇ Pasang'}
                  </button>
                </div>
                <div style="font-size: 10.5px; color: var(--text-muted); margin: 3px 0;">${this.escapeHtml(cs.description)}</div>
                <div style="font-size: 10px; font-family: var(--font-mono); color: #3b82f6;">Source: ${this.escapeHtml(cs.source)}</div>
              </div>
            `,
            ).join('')}
          </div>

          <div style="margin-top: 12px; border-top: 1px dashed var(--border-color); padding-top: 10px;">
            <label class="ai-label">Pasang dari URL Repository GitHub / SKILL.md</label>
            <div class="ai-row">
              <input type="text" id="ai-import-skill-url" class="ai-field" placeholder="https://github.com/blader/humanizer atau link raw..." />
              <button id="ai-import-url-btn" class="ai-btn ai-btn-secondary ai-btn-sm" style="white-space: nowrap;">Unduh & Pasang</button>
            </div>
            <div id="ai-import-url-status" style="margin-top: 4px;"></div>
          </div>
        </div>
      </div>
    `

    this.bindMemoryTabEvents(container, projId)
  }

  private bindCuratedSkillEvents(container: Element): void {
    container.querySelectorAll('.ai-install-curated').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-curated-id')
        const preset = CURATED_COMMUNITY_SKILLS.find((c) => c.id === id)
        if (preset) {
          upsertSkill({
            name: preset.name,
            description: preset.description,
            trigger: preset.trigger,
            rules: preset.rules,
          })
          this.renderMemoryTab(container)
        }
      })
    })

    const importBtn = container.querySelector('#ai-import-url-btn')
    const importInput = container.querySelector('#ai-import-skill-url') as HTMLInputElement
    const statusSlot = container.querySelector('#ai-import-url-status')

    importBtn?.addEventListener('click', async () => {
      const url = importInput?.value.trim()
      if (!url || !statusSlot) return
      statusSlot.innerHTML = '⏳ Mengunduh dan mem-parsing berkas skill...'
      try {
        const fetched = await fetchSkillFromUrl(url)
        upsertSkill(fetched)
        statusSlot.innerHTML = `<span style="color: #10B981; font-size: 11px; font-weight: 700;">✓ Berhasil memasang skill '${this.escapeHtml(fetched.name)}'!</span>`
        setTimeout(() => this.renderMemoryTab(container), 800)
      } catch (err: unknown) {
        statusSlot.innerHTML = `<span class="ai-err-msg">Gagal mengunduh: ${this.escapeHtml(String(err))}</span>`
      }
    })
  }

  private bindMemoryTabEvents(container: Element, projId: string): void {
    const memory = loadProjectMemory(projId)
    this.bindCuratedSkillEvents(container)

    container.querySelector('#ai-add-notation-btn')?.addEventListener('click', () => {
      const input = container.querySelector('#ai-new-notation') as HTMLInputElement
      const val = input?.value.trim()
      if (val) {
        input.value = ''
        const nots = [...(memory.notationDecisions || []), val]
        updateProjectMemory(projId, { notationDecisions: nots })
        this.renderMemoryTab(container)
      }
    })

    container.querySelector('#ai-save-proj-mem')?.addEventListener('click', async () => {
      const summary = (
        container.querySelector('#ai-mem-summary') as HTMLTextAreaElement
      ).value.trim()
      const activeTopic = (
        container.querySelector('#ai-mem-topic') as HTMLInputElement
      ).value.trim()
      updateProjectMemory(projId, { summary, activeTopic })
      await tacticalAlert({
        title: t('Memori Disimpan', 'Memory Saved', this.config.locale),
        specTag: t('AI // MEMORI PROYEK', 'AI // PROJECT MEMORY', this.config.locale),
        message: t('Memori proyek berhasil diperbarui!', 'Project memory updated successfully!', this.config.locale),
        type: 'success',
      })
    })

    container.querySelector('#ai-compact-btn')?.addEventListener('click', () => {
      const messages = this.chatHistory.map((h) => ({ role: h.role, content: h.text }))
      const { messages: compacted, stats } = compactChatHistory(messages, 1500, 3)
      this.chatHistory = compacted.map((m) => ({
        role: m.role as 'user' | 'assistant',
        text: m.content,
      }))
      const feedback = container.querySelector('#ai-compaction-feedback')
      if (feedback) {
        feedback.innerHTML = `<span style="color: #10B981; font-size: 11px; font-weight: 700;">✓ Berhasil dikompak! Menghemat ${stats.savedTokens} token (${stats.savedPercentage}%).</span>`
      }
    })

    const newSkillForm = container.querySelector('#ai-new-skill-form') as HTMLElement
    container.querySelector('#ai-toggle-new-skill')?.addEventListener('click', () => {
      if (newSkillForm)
        newSkillForm.style.display = newSkillForm.style.display === 'none' ? 'block' : 'none'
    })
    container.querySelector('#ai-cancel-skill')?.addEventListener('click', () => {
      if (newSkillForm) newSkillForm.style.display = 'none'
    })

    container.querySelector('#ai-submit-skill')?.addEventListener('click', async () => {
      const name = (container.querySelector('#ai-new-skill-name') as HTMLInputElement).value.trim()
      const description = (
        container.querySelector('#ai-new-skill-desc') as HTMLInputElement
      ).value.trim()
      const trigger = (
        container.querySelector('#ai-new-skill-trigger') as HTMLInputElement
      ).value.trim()
      const rulesRaw = (container.querySelector('#ai-new-skill-rules') as HTMLTextAreaElement).value
      const rules = rulesRaw
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)

      if (name && rules.length > 0) {
        upsertSkill({ name, description, trigger, rules })
        this.renderMemoryTab(container)
      } else {
        await tacticalAlert({
          title: t('Validasi Skill', 'Skill Validation', this.config.locale),
          message: t('Nama skill dan minimal satu aturan wajib diisi.', 'Skill name and at least one rule are required.', this.config.locale),
          type: 'warning',
        })
      }
    })

    container.querySelectorAll('.ai-del-skill').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id')
        if (id) {
          const confirmed = await tacticalConfirm({
            title: t('Hapus Skill', 'Delete Skill', this.config.locale),
            specTag: t('AI // PUSTAKA SKILL', 'AI // SKILLS LIBRARY', this.config.locale),
            message: t('Hapus skill ini dari pustaka pembelajaran AI?', 'Delete this skill from AI learned skills?', this.config.locale),
            confirmText: t('YA, HAPUS', 'YES, DELETE', this.config.locale),
            danger: true,
          })
          if (confirmed) {
            deleteSkill(id)
            this.renderMemoryTab(container)
          }
        }
      })
    })
  }

  private renderSettingsTab(container: Element): void {
    container.innerHTML = `
      <div class="ai-settings-container">
        <div class="ai-field-block">
          <label class="ai-label">Penyedia Model (Provider / Gateway)</label>
          <select id="ai-cfg-provider" class="ai-field">
            <option value="9router" ${this.config.provider === '9router' ? 'selected' : ''}>9router Gateway (Multi-model / Custom)</option>
            <option value="openrouter" ${this.config.provider === 'openrouter' ? 'selected' : ''}>OpenRouter (Unified API)</option>
            <option value="openai" ${this.config.provider === 'openai' ? 'selected' : ''}>OpenAI (Direct API)</option>
            <option value="anthropic" ${this.config.provider === 'anthropic' ? 'selected' : ''}>Anthropic (Claude API)</option>
            <option value="ollama" ${this.config.provider === 'ollama' ? 'selected' : ''}>Ollama (Local / Self-hosted)</option>
            <option value="custom" ${this.config.provider === 'custom' ? 'selected' : ''}>Custom Gateway / Proxy</option>
          </select>
        </div>

        <div class="ai-field-block" style="margin-top: 10px;">
          <label class="ai-label">Endpoint URL</label>
          <input type="text" id="ai-cfg-endpoint" class="ai-field" value="${this.escapeHtml(this.config.endpoint)}" placeholder="https://9router.com/v1 atau http://localhost:11434" />
        </div>

        <div class="ai-field-block" style="margin-top: 10px;">
          <label class="ai-label">API Key (Wajib untuk 9router, OpenAI, Anthropic, dll)</label>
          <input type="password" id="ai-cfg-key" class="ai-field" value="${this.escapeHtml(this.config.apiKey ?? '')}" placeholder="sk-..." />
        </div>

        <div class="ai-field-block" style="margin-top: 10px;">
          <label class="ai-label">Nama Model</label>
          <input type="text" id="ai-cfg-model" class="ai-field" value="${this.escapeHtml(this.config.model)}" placeholder="gpt-4o, claude-3-5-sonnet-20241022, llama3.1, dll" />
        </div>

        <div class="ai-field-block" style="margin-top: 10px;">
          <label class="ai-label">Bahasa Respons Default</label>
          <select id="ai-cfg-locale" class="ai-field">
            <option value="id" ${this.config.locale === 'id' ? 'selected' : ''}>Bahasa Indonesia</option>
            <option value="en" ${this.config.locale === 'en' ? 'selected' : ''}>English</option>
          </select>
        </div>

        <button id="ai-cfg-save" class="ai-btn ai-btn-primary" style="margin-top: 16px; width: 100%;">
          Simpan Pengaturan
        </button>
        <div id="ai-cfg-status" style="margin-top: 8px;"></div>
      </div>
    `

    const providerSelect = container.querySelector('#ai-cfg-provider') as HTMLSelectElement
    providerSelect?.addEventListener('change', () => {
      const val = providerSelect.value as ModelProvider
      const preset = PROVIDER_PRESETS[val]
      if (!preset) return
      const endpointInput = container.querySelector('#ai-cfg-endpoint') as HTMLInputElement
      const modelInput = container.querySelector('#ai-cfg-model') as HTMLInputElement
      if (endpointInput && preset.endpoint) endpointInput.value = preset.endpoint
      if (
        modelInput &&
        preset.defaultModel &&
        (!modelInput.value ||
          modelInput.value.includes('llama') ||
          modelInput.value.includes('gpt'))
      ) {
        modelInput.value = preset.defaultModel
      }
    })

    container.querySelector('#ai-cfg-save')?.addEventListener('click', () => {
      const p = (container.querySelector('#ai-cfg-provider') as HTMLSelectElement)
        .value as ModelProvider
      const endpoint = (
        container.querySelector('#ai-cfg-endpoint') as HTMLInputElement
      ).value.trim()
      const apiKey = (container.querySelector('#ai-cfg-key') as HTMLInputElement).value.trim()
      const model = (container.querySelector('#ai-cfg-model') as HTMLInputElement).value.trim()
      const locale = (container.querySelector('#ai-cfg-locale') as HTMLSelectElement).value as
        | 'id'
        | 'en'

      this.config = { provider: p, endpoint, apiKey, model, locale }
      saveAiConfig(this.config)

      const modelOpts: ModelAdapterOptions = {
        provider: p,
        endpoint,
        model,
      }
      if (apiKey) modelOpts.apiKey = apiKey

      if (this.aiService) {
        this.aiService.updateModel(modelOpts)
      } else {
        this.initAiService()
      }

      const statusEl = container.querySelector('#ai-cfg-status')
      if (statusEl)
        statusEl.innerHTML =
          '<span style="color: #10B981; font-size: 12px; font-weight: 700;">✓ Pengaturan AI berhasil disimpan!</span>'
    })
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
