import type { VirtualFS } from '../fs/virtual-fs'
import type { WasmTexCompiler } from '../headless'
import type { LatexLanguageService } from '../lsp-service'
import { AnthropicAdapter } from './adapters/anthropic'
import { OllamaAdapter } from './adapters/ollama'
import { OpenAiAdapter } from './adapters/openai'
import type { AgentContext, AgentResult } from './agent-loop'
import { AgentLoop } from './agent-loop'
import type { DiagnosisResult } from './features/error-diagnosis'
import { diagnoseErrors } from './features/error-diagnosis'
import type { PaperSummary } from './features/paper-reader'
import { compareWithDraft, extractBibtex, summarizePaper } from './features/paper-reader'
import {
  generateEquation,
  generateTable,
  generateTikz,
  polishGrammar,
} from './features/writing-assist'
import { loadAllSkills, loadProjectMemory } from './memory/skill-store'
import { getDefaultSystemPrompt } from './system-prompts'
import type { ToolRegistryOptions } from './tool-registry'
import { ToolRegistry } from './tool-registry'
import type { ChatMessage, ModelAdapter, ModelAdapterOptions, ToolCall } from './types'

export interface AIServiceOptions {
  model: ModelAdapterOptions
  fs: VirtualFS
  lsp?: LatexLanguageService | null
  compiler?: WasmTexCompiler | null
  mainFile?: string
  projectId?: string
  maxAgentSteps?: number
  onApprovalNeeded?: (call: ToolCall) => Promise<boolean>
  onToolCall?: (call: ToolCall, result: string) => void
  locale?: 'en' | 'id'
}

export function createModelAdapter(options: ModelAdapterOptions): ModelAdapter {
  const systemPrompt = options.systemPrompt ?? getDefaultSystemPrompt()
  const opts: ModelAdapterOptions = { ...options, systemPrompt }

  if (options.provider === 'ollama') {
    return new OllamaAdapter(opts)
  }
  if (options.provider === 'anthropic') {
    return new AnthropicAdapter(opts)
  }
  return new OpenAiAdapter(opts)
}

export class AIService {
  private adapter: ModelAdapter
  private tools: ToolRegistry
  private loop: AgentLoop
  private options: AIServiceOptions

  constructor(options: AIServiceOptions) {
    this.options = options
    this.adapter = createModelAdapter(options.model)
    const registryOpts: ToolRegistryOptions = { fs: options.fs }
    if (options.lsp) registryOpts.lsp = options.lsp
    if (options.compiler) registryOpts.compiler = options.compiler
    if (options.mainFile) registryOpts.mainFile = options.mainFile
    if (options.projectId) registryOpts.projectId = options.projectId
    this.tools = new ToolRegistry(registryOpts)
    this.loop = this.createAgentLoop()
  }

  private createAgentLoop(): AgentLoop {
    const loopOpts: ConstructorParameters<typeof AgentLoop>[0] = {
      adapter: this.adapter,
      tools: this.tools,
    }
    if (this.options.maxAgentSteps !== undefined) {
      loopOpts.maxSteps = this.options.maxAgentSteps
    }
    if (this.options.onApprovalNeeded) {
      loopOpts.onApprovalNeeded = this.options.onApprovalNeeded
    }
    if (this.options.onToolCall) {
      loopOpts.onToolCall = this.options.onToolCall
    }
    return new AgentLoop(loopOpts)
  }

  updateModel(options: ModelAdapterOptions): void {
    this.options.model = options
    this.adapter = createModelAdapter(options)
    this.loop = this.createAgentLoop()
  }

  getToolRegistry(): ToolRegistry {
    return this.tools
  }

  async chat(
    userPrompt: string,
    context?: AgentContext,
    signal?: AbortSignal,
  ): Promise<AgentResult> {
    const ctx: AgentContext = { ...context }
    if (!ctx.skills) ctx.skills = loadAllSkills()
    if (!ctx.projectMemory) {
      ctx.projectMemory = loadProjectMemory(this.options.projectId ?? 'default')
    }
    return this.loop.run(userPrompt, ctx, signal)
  }

  async *chatStream(
    userPrompt: string,
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown> {
    const messages: ChatMessage[] = [{ role: 'user', content: userPrompt }]
    yield* this.adapter.chat(messages, undefined, signal)
  }

  async fixErrors(
    errors: Array<{ message: string; file?: string; line?: number }>,
    logSnippet?: string,
  ): Promise<string> {
    const errText = errors
      .map((e) => `- ${e.file ?? 'unknown'}:${e.line ?? 0}: ${e.message}`)
      .join('\n')
    const logPart = logSnippet ? `\n\nLog tail:\n\`\`\`\n${logSnippet.slice(-1000)}\n\`\`\`` : ''
    const prompt = `Please analyze and fix the following LaTeX compilation error(s):\n${errText}${logPart}\nCheck the relevant file and explain or propose the exact fix.`
    const result = await this.loop.run(prompt)
    return result.response
  }

  async rewriteSelection(
    text: string,
    instruction = 'Improve clarity, conciseness, and academic tone',
  ): Promise<string> {
    const prompt = `Rewrite the following LaTeX snippet according to this instruction: "${instruction}". Output only the rewritten LaTeX code without extra conversational filler.\n\n\`\`\`latex\n${text}\n\`\`\``
    const res = await this.adapter.chatComplete([{ role: 'user', content: prompt }])
    return res.message.content.trim()
  }

  async continueWriting(contextBefore: string): Promise<string> {
    const prompt = `Continue writing this LaTeX document smoothly based on the preceding text. Output only the continuation text without preamble.\n\nContext before cursor:\n\`\`\`latex\n${contextBefore.slice(-1500)}\n\`\`\``
    const res = await this.adapter.chatComplete([{ role: 'user', content: prompt }])
    return res.message.content.trim()
  }

  async explainLatex(code: string): Promise<string> {
    const prompt = `Explain clearly and concisely what this LaTeX code does:\n\n\`\`\`latex\n${code}\n\`\`\``
    const res = await this.adapter.chatComplete([{ role: 'user', content: prompt }])
    return res.message.content.trim()
  }

  async generateEquation(description: string): Promise<string> {
    return generateEquation(description, this.adapter)
  }

  async generateTable(description: string, useBooktabs = true): Promise<string> {
    return generateTable(description, this.adapter, useBooktabs)
  }

  async polishGrammar(
    latexSnippet: string,
    targetTone: 'academic' | 'concise' | 'standard' = 'academic',
  ): Promise<string> {
    return polishGrammar(latexSnippet, this.adapter, targetTone)
  }

  async generateTikz(description: string): Promise<string> {
    return generateTikz(description, this.adapter)
  }

  async summarizePaper(paperText: string, locale?: 'en' | 'id'): Promise<PaperSummary> {
    return summarizePaper(paperText, this.adapter, locale ?? this.options.locale ?? 'en')
  }

  async extractBibtex(paperText: string): Promise<string> {
    return extractBibtex(paperText, this.adapter)
  }

  async compareWithDraft(
    referencePaperText: string,
    draftText: string,
    locale?: 'en' | 'id',
  ): Promise<string> {
    return compareWithDraft(
      referencePaperText,
      draftText,
      this.adapter,
      locale ?? this.options.locale ?? 'en',
    )
  }

  async diagnoseErrors(
    errors: Array<{ message: string; file?: string; line?: number; code?: string }>,
    logExcerpt?: string,
  ): Promise<DiagnosisResult> {
    const relevantFiles: Record<string, string> = {}
    for (const f of this.options.fs.listFiles()) {
      if (f.endsWith('.tex') || f.endsWith('.bib') || f.endsWith('.sty')) {
        const raw = this.options.fs.readFile(f)
        if (raw !== null) {
          relevantFiles[f] = typeof raw === 'string' ? raw : new TextDecoder().decode(raw)
        }
      }
    }

    const diagInput: Parameters<typeof diagnoseErrors>[0] = {
      errors,
      relevantFiles,
    }
    if (logExcerpt) diagInput.logExcerpt = logExcerpt

    return diagnoseErrors(diagInput, this.adapter, this.options.locale ?? 'en')
  }
}
