# AI Integration Plan

Rencana implementasi layer AI untuk WasmTex — membantu penulisan LaTeX,
membaca jurnal/research, mendiagnosis error, dan agentic workflow.
AI adalah **consumer** dari API WasmTex yang sudah ada (LSP, compiler, syntax);
WasmTex sendiri tidak bergantung pada AI layer.

## Prinsip Desain

1. **Model-agnostic** — user bawa endpoint sendiri (OpenAI-compatible, Anthropic,
   Ollama local, dll). WasmTex tidak bundle atau host model.
2. **SDK extension, bukan core** — AI module adalah entry point terpisah
   (`wasmtex/ai`) yang mengimpor `wasmtex/lsp` dan `wasmtex/headless`.
   Tidak ada AI dependency di compile path.
3. **Privacy-first** — dokumen dikirim ke model hanya atas aksi eksplisit user.
   Tidak ada telemetry atau background sending.
4. **Agentic-capable** — AI bisa merencanakan multi-step action (edit → compile →
   check error → re-edit) lewat tool-use protocol, tapi setiap edit butuh
   approval user sebelum apply.

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    Host Application                      │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  WasmTex UI   │  │  AI Panel    │  │  Chat Panel  │  │
│  │  (Monaco +    │  │  (inline     │  │  (sidebar    │  │
│  │   PDF viewer) │  │   suggest)   │  │   assistant) │  │
│  └───────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│          │                 │                 │           │
│  ┌───────┴─────────────────┴─────────────────┴───────┐  │
│  │              AIService  (wasmtex/ai)               │  │
│  │  ┌─────────────┐ ┌────────────┐ ┌──────────────┐  │  │
│  │  │ToolRegistry │ │ AgentLoop  │ │ ModelAdapter │  │  │
│  │  │(latex tools) │ │(plan/exec) │ │(endpoint)    │  │  │
│  │  └──────┬──────┘ └─────┬──────┘ └──────┬───────┘  │  │
│  └─────────┼──────────────┼────────────────┼──────────┘  │
│            │              │                │             │
│  ┌─────────┴──────────────┴────────┐  ┌────┴──────────┐  │
│  │  WasmTex SDK                    │  │  LLM Endpoint │  │
│  │  • LatexLanguageService (LSP)   │  │  (user-owned) │  │
│  │  • WasmTexCompiler (headless)   │  │               │  │
│  │  • LatexSyntaxService (syntax)  │  └───────────────┘  │
│  │  • VirtualFS                    │                     │
│  │  • ProjectIndex                 │                     │
│  └─────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Model Adapter Layer

### `ModelAdapter` — abstraksi koneksi ke LLM

```ts
// src/ai/model-adapter.ts
export interface ModelAdapterOptions {
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom'
  endpoint: string                    // e.g. "http://localhost:11434/v1"
  apiKey?: string                     // untuk cloud provider
  model: string                      // e.g. "gpt-4o", "claude-sonnet-4-20250514", "llama3"
  maxTokens?: number
  temperature?: number
  systemPrompt?: string              // override default LaTeX system prompt
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface ToolCall {
  id: string
  function: { name: string; arguments: string }
}

export interface ModelAdapter {
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): AsyncGenerator<string>
  chatComplete(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ChatResponse>
  supportsToolUse(): boolean
  abort(): void
}
```

**Implementasi:**
- `OpenAIAdapter` — OpenAI & compatible endpoints (Groq, Together, vLLM, LM Studio)
- `AnthropicAdapter` — Claude API (Messages API format)
- `OllamaAdapter` — Ollama local REST (`/api/chat`)
- `CustomAdapter` — user suplai `fetch`-based handler sendiri

Semua adapter normalize ke satu `ChatMessage[]` format internal.
Streaming via `AsyncGenerator<string>` supaya UI bisa render token-by-token.

**Tidak ada dependency baru** — semua HTTP via `fetch()`. Adapter code ≈300 LOC total.

---

## 2. Tool Registry — LaTeX-aware AI Tools

AI model berinteraksi dengan WasmTex lewat **tool-use** (function calling).
Tools dibuat dari API WasmTex yang sudah ada.

### Tool Definitions

| Tool | Source API | Deskripsi |
|------|-----------|-----------|
| `read_file` | `VirtualFS.readFile` | Baca file dari project |
| `write_file` | `VirtualFS.writeFile` | Tulis/update file (butuh approval) |
| `list_files` | `VirtualFS.listFiles` | List semua file di project |
| `compile` | `WasmTexCompiler.compile` | Compile dan return errors + PDF status |
| `get_diagnostics` | `LatexLanguageService.getDiagnostics` | Ambil semua LSP diagnostic |
| `get_outline` | `LatexLanguageService.getOutline` | Document structure (sections) |
| `get_completions` | `LatexLanguageService.getCompletions` | Completion suggestions di posisi |
| `get_symbols` | `ProjectIndex` | Labels, citations, commands di project |
| `search_project` | Custom grep over VirtualFS | Cari text/regex di semua file |
| `get_compile_log` | `CompileResult.log` | Raw TeX log dari compile terakhir |
| `get_bib_entries` | `BibParser` | Parse dan return bibliography entries |
| `insert_at_cursor` | Editor API | Insert text di posisi cursor (approval) |
| `replace_range` | Editor API | Replace range di file (approval) |

### Tool Registry

```ts
// src/ai/tool-registry.ts
export interface ToolDefinition {
  name: string
  description: string
  parameters: JSONSchema       // OpenAI function-calling schema
  requiresApproval: boolean    // true = user harus approve sebelum execute
}

export class ToolRegistry {
  constructor(
    private lsp: LatexLanguageService,
    private compiler: WasmTexCompiler | null,
    private fs: VirtualFS,
  ) {}

  getTools(): ToolDefinition[]
  execute(name: string, args: Record<string, unknown>): Promise<string>
}
```

Tools yang **modify** project (`write_file`, `insert_at_cursor`, `replace_range`)
di-flag `requiresApproval: true`. Host UI menampilkan diff preview sebelum apply.

---

## 3. Agent Loop — Multi-step Reasoning

### `AgentLoop` — orchestrator untuk agentic workflow

```ts
// src/ai/agent-loop.ts
export interface AgentLoopOptions {
  adapter: ModelAdapter
  tools: ToolRegistry
  maxSteps: number              // default 10, hard cap 25
  onToolCall?: (call: ToolCall, result: string) => void
  onApprovalNeeded?: (call: ToolCall) => Promise<boolean>
  onChunk?: (text: string) => void  // streaming output
}

export class AgentLoop {
  async run(userMessage: string, context?: AgentContext): Promise<AgentResult>
  abort(): void
}

export interface AgentContext {
  activeFile?: string
  cursorPosition?: { line: number; column: number }
  selectedText?: string
  recentDiagnostics?: Diagnostic[]
  recentCompileResult?: { success: boolean; errors: TexError[] }
}

export interface AgentResult {
  response: string
  toolCalls: { tool: string; args: unknown; result: string }[]
  tokensUsed: { input: number; output: number }
}
```

**Flow:**
1. User kirim pesan + context (file aktif, cursor, selection, errors)
2. System prompt berisi instruksi LaTeX expert + daftar tools
3. Model memutuskan: jawab langsung ATAU panggil tool(s)
4. Jika tool call → execute → kirim result balik ke model → loop
5. Jika tool butuh approval → pause, tampilkan diff, tunggu user
6. Loop berhenti saat model jawab tanpa tool call, atau `maxSteps` tercapai

### System Prompt (default)

```
You are a LaTeX writing assistant embedded in WasmTex, a browser-based LaTeX editor.
You have access to the user's project files, compiler, and language service.

Capabilities:
- Write and edit LaTeX documents
- Fix compilation errors by reading the log and diagnostics
- Help structure papers (sections, bibliography, figures, tables)
- Explain LaTeX concepts and suggest packages
- Read and summarize research papers (when user provides content)

Rules:
- Always read the relevant file before editing it
- After making edits, compile to verify they work
- Explain what you changed and why
- Never delete user content without explicit request
- Preserve the user's writing style and language
```

---

## 4. Fitur AI — Use Cases

### 4.1 Writing Assistant (inline)

**Trigger:** User ketik di editor, atau select text + right-click "AI"

| Action | Behavior |
|--------|----------|
| **Continue writing** | AI baca context sebelum cursor, generate lanjutan |
| **Rewrite selection** | AI rewrite selected text (lebih jelas, formal, concise) |
| **Fix grammar** | AI perbaiki grammar/spelling di selection |
| **Add citation** | AI suggest `\cite{}` berdasarkan context dan `.bib` entries |
| **Generate table** | AI generate `tabular` dari deskripsi natural language |
| **Generate equation** | AI generate LaTeX math dari deskripsi |
| **Explain selection** | AI jelaskan apa yang dilakukan LaTeX code yang di-select |

**Implementasi:** Inline suggestion panel (ghost text atau floating diff).
Host integrator bisa wire ini ke Monaco's inline completion provider.

### 4.2 Error Diagnosis & Auto-fix

**Trigger:** Compile gagal, atau diagnostic muncul

**Flow:**
1. AI otomatis receive `CompileResult.errors` + `log` excerpt
2. AI baca file yang error, analisis penyebab
3. AI propose fix (diff preview)
4. User approve → apply → re-compile → verify

**Contoh skenario:**
- Missing package → AI suggest `\usepackage{...}` (overlap dgn existing
  `diagnostic-repair-package.ts`, tapi AI bisa handle kasus yang lebih complex)
- Undefined reference → AI cek typo di `\label` vs `\ref`
- Environment mismatch → AI fix `\begin{...}` / `\end{...}` pairs
- Font not found → AI suggest alternatif font yang tersedia
- BibTeX error → AI fix `.bib` entry syntax

**Integrasi dengan LSP existing:**
AI **bukan** pengganti `diagnostic-repair.ts` — keduanya complementary.
LSP repair adalah deterministic dan instant. AI repair untuk kasus yang
butuh reasoning (e.g. "error di line 45 tapi root cause di line 12").

### 4.3 Research Paper Reader

**Trigger:** User upload/paste PDF atau teks paper

**Capabilities:**
| Action | Behavior |
|--------|----------|
| **Summarize paper** | AI buat ringkasan structured (objective, method, result, conclusion) |
| **Extract key findings** | Bullet point findings utama |
| **Compare with draft** | AI bandingkan methodology/result dengan draft user |
| **Suggest citations** | AI identifikasi claim di draft yang butuh citation dari paper |
| **Extract BibTeX** | AI generate `@article{...}` entry dari paper metadata |
| **Literature review** | AI bantu tulis related work section berdasarkan papers yang dibaca |

**Input format:**
- Plain text paste ke chat
- PDF upload → text extraction (client-side, `pdf.js` sudah jadi peer dep)
- URL → fetch + extract (host responsibility)

**Tidak perlu dependency baru** — `pdfjs-dist` sudah jadi peer dependency
WasmTex untuk PDF viewer. Text extraction dari PDF reuse infrastructure itu.

### 4.4 Agentic Workflow

**Trigger:** User beri instruksi complex di chat

**Contoh:**
> "Tambahkan section Methodology setelah Introduction. Isi dengan subsection
> Data Collection dan Analysis. Buat table kosong di Data Collection.
> Compile dan pastikan tidak ada error."

**Agent akan:**
1. `read_file("main.tex")` — baca current state
2. `write_file("main.tex", ...)` — tambah section (approval needed)
3. `compile()` — verifikasi
4. `get_diagnostics()` — cek error
5. Jika ada error → `read_file` + fix + re-compile
6. Report hasil ke user

**Contoh lain:**
> "Baca paper.pdf ini, extract semua referensi yang relevan ke topik saya,
> buat entries di references.bib, dan update Related Work section."

---

## 5. Entry Point & Public API

### Package export: `wasmtex/ai`

```ts
// src/ai/index.ts (entry: wasmtex/ai)
export { AIService, AIServiceOptions } from './ai-service'
export { ModelAdapter, OpenAIAdapter, AnthropicAdapter, OllamaAdapter } from './model-adapter'
export { AgentLoop, AgentContext, AgentResult } from './agent-loop'
export { ToolRegistry, ToolDefinition } from './tool-registry'
export type { ChatMessage, ChatResponse, ToolCall } from './types'
```

### `AIService` — high-level facade

```ts
// src/ai/ai-service.ts
export interface AIServiceOptions {
  model: ModelAdapterOptions
  lsp?: LatexLanguageService        // optional, untuk diagnostics/completions
  compiler?: WasmTexCompiler        // optional, untuk compile
  fs: VirtualFS                     // required, project files
  maxAgentSteps?: number
  locale?: string                   // 'id' | 'en' | ... untuk system prompt
}

export class AIService {
  constructor(options: AIServiceOptions)

  // Chat (stateful conversation)
  chat(message: string, context?: AgentContext): AsyncGenerator<AgentEvent>
  clearHistory(): void

  // One-shot actions (stateless)
  fixErrors(errors: TexError[], log: string): Promise<ProposedEdit[]>
  rewriteSelection(text: string, instruction: string): Promise<string>
  continueWriting(contextBefore: string, hint?: string): Promise<string>
  summarizePaper(text: string): Promise<PaperSummary>
  generateBibtex(paperText: string): Promise<string>
  explainLatex(code: string): Promise<string>

  // Configuration
  updateModel(options: ModelAdapterOptions): void
  dispose(): void
}

export interface ProposedEdit {
  file: string
  range: { startLine: number; endLine: number }
  oldText: string
  newText: string
  explanation: string
}

export interface PaperSummary {
  title: string
  authors: string[]
  abstract: string
  objectives: string[]
  methodology: string
  results: string[]
  conclusions: string[]
  keywords: string[]
}

export type AgentEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; tool: string; args: unknown }
  | { type: 'tool_result'; tool: string; result: string }
  | { type: 'approval_needed'; edit: ProposedEdit }
  | { type: 'done'; result: AgentResult }
  | { type: 'error'; error: string }
```

---

## 6. File Structure

```
src/ai/
├── index.ts                 # barrel export (wasmtex/ai entry)
├── ai-service.ts            # AIService facade
├── agent-loop.ts            # multi-step agent orchestrator
├── tool-registry.ts         # tool definitions + execution bridge
├── types.ts                 # shared AI types
├── system-prompts.ts        # default system prompts per locale
├── adapters/
│   ├── openai.ts            # OpenAI / compatible adapter
│   ├── anthropic.ts         # Anthropic Messages API adapter
│   ├── ollama.ts            # Ollama local adapter
│   └── base.ts              # abstract adapter + shared fetch logic
├── tools/
│   ├── file-tools.ts        # read/write/list/search project files
│   ├── compile-tools.ts     # compile, get log, get diagnostics
│   ├── lsp-tools.ts         # completions, outline, symbols, hover
│   ├── bib-tools.ts         # bibliography parsing and generation
│   └── edit-tools.ts        # cursor insert, range replace (approval)
├── features/
│   ├── error-diagnosis.ts   # compile error → fix proposals
│   ├── writing-assist.ts    # continue, rewrite, grammar
│   ├── paper-reader.ts      # summarize, extract, compare
│   └── citation-assist.ts   # suggest citations, generate bibtex
└── __tests__/
    ├── agent-loop.test.ts
    ├── tool-registry.test.ts
    ├── openai-adapter.test.ts
    └── error-diagnosis.test.ts
```

---

## 7. package.json Changes

```jsonc
{
  "exports": {
    // ... existing entries ...
    "./ai": {
      "types": "./lib/ai/index.d.ts",
      "import": "./lib/ai/index.js"
    }
  }
}
```

**Zero new dependencies.** Semua HTTP via native `fetch()`. PDF text extraction
reuse `pdfjs-dist` yang sudah jadi optional peer dependency.

---

## 8. Phasing

### Phase 1 — Foundation (minggu 1-2)
- [ ] `ModelAdapter` + `OpenAIAdapter` (covers 90% endpoints)
- [ ] `ToolRegistry` dengan file/compile/diagnostic tools
- [ ] `AgentLoop` basic (tool-use loop + approval gate)
- [ ] `AIService` facade dengan `chat()` dan `fixErrors()`
- [ ] Unit tests dengan mock adapter

### Phase 2 — Writing Features (minggu 3)
- [ ] `continueWriting()`, `rewriteSelection()`, `explainLatex()`
- [ ] `AnthropicAdapter`, `OllamaAdapter`
- [ ] System prompt tuning per locale (EN, ID)
- [ ] Streaming response support

### Phase 3 — Research Features (minggu 4)
- [ ] `summarizePaper()`, `generateBibtex()`
- [ ] PDF text extraction via pdfjs-dist
- [ ] Citation suggestion dari `.bib` + paper context
- [ ] Literature review assist

### Phase 4 — Agentic Polish (minggu 5)
- [ ] Complex multi-step workflows
- [ ] Error diagnosis + auto-fix loop
- [ ] Agent context enrichment (cursor, selection, recent compile)
- [ ] UI integration examples (Monaco inline, sidebar chat)

---

## 9. Batasan & Non-goals

- **WasmTex tidak host model** — user bawa sendiri.
- **Tidak ada API key management** — host application bertanggung jawab.
- **Tidak ada training/fine-tuning** — generic LLM dengan good prompting.
- **Tidak menggantikan LSP** — AI complementary, LSP tetap source of truth
  untuk deterministic analysis.
- **Tidak ada internet search** — AI hanya bisa baca file di project.
  Host bisa extend tools untuk search capability.
- **Offline-capable** — jika user pakai Ollama local, semua tetap jalan
  tanpa internet (kecuali TeX Live package fetch).

---

## 10. Security

- API key disimpan di memory saja, tidak di VirtualFS atau IndexedDB.
- File content dikirim ke model hanya saat user trigger action.
- Tool execution di-sandbox — AI tidak bisa akses filesystem host.
- `write_file` dan `replace_range` selalu butuh user approval.
- Model response di-sanitize sebelum apply ke editor (no script injection).
- Rate limiting di adapter layer (configurable).

---

## 11. Contoh Integrasi Host

```ts
import { WasmTex } from 'wasmtex'
import { AIService } from 'wasmtex/ai'

const editor = new WasmTex('#editor', '#preview')
await editor.init()

const ai = new AIService({
  model: {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1',
    apiKey: USER_API_KEY,
    model: 'gpt-4o',
  },
  lsp: editor.getLanguageService(),
  compiler: editor.getCompiler(),
  fs: editor.getVirtualFileSystem(),
})

// Chat mode
for await (const event of ai.chat('Fix all errors in my document')) {
  if (event.type === 'text') renderToChat(event.content)
  if (event.type === 'approval_needed') {
    const ok = await showDiffDialog(event.edit)
    // AgentLoop pauses until approval
  }
}

// One-shot
const fixes = await ai.fixErrors(compileResult.errors, compileResult.log)
for (const fix of fixes) showDiffPreview(fix)
```
