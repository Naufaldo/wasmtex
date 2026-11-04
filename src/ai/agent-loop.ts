import {
  type CompactionStats,
  compactChatHistory,
  formatProjectMemoryPrompt,
  formatSkillsPrompt,
  selectRelevantSkills,
} from './memory/context-compactor'
import type { ToolRegistry } from './tool-registry'
import type {
  ChatMessage,
  ModelAdapter,
  ProjectMemory,
  Skill,
  TokenUsage,
  ToolCall,
  ToolDefinition,
} from './types'

export interface AgentContext {
  activeFile?: string | undefined
  cursorPosition?: { line: number; column: number } | undefined
  selectedText?: string | undefined
  skills?: Skill[] | undefined
  projectMemory?: ProjectMemory | undefined
  priorMessages?: ChatMessage[] | undefined
}

export interface AgentStep {
  step: number
  toolCalls: Array<{
    tool: string
    args: Record<string, unknown>
    result: string
    approved?: boolean
  }>
}

export interface AgentResult {
  response: string
  steps: AgentStep[]
  tokensUsed?: TokenUsage
  compactionStats?: CompactionStats | undefined
}

export interface AgentLoopOptions {
  adapter: ModelAdapter
  tools: ToolRegistry
  maxSteps?: number
  onToolCall?: (call: ToolCall, result: string) => void
  onApprovalNeeded?: (call: ToolCall) => Promise<boolean>
}

export class AgentLoop {
  private adapter: ModelAdapter
  private tools: ToolRegistry
  private maxSteps: number
  private onToolCall: ((call: ToolCall, result: string) => void) | undefined
  private onApprovalNeeded: ((call: ToolCall) => Promise<boolean>) | undefined

  constructor(options: AgentLoopOptions) {
    this.adapter = options.adapter
    this.tools = options.tools
    this.maxSteps = Math.min(Math.max(options.maxSteps ?? 10, 1), 25)
    this.onToolCall = options.onToolCall
    this.onApprovalNeeded = options.onApprovalNeeded
  }

  private parseArguments(raw: string): Record<string, unknown> {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }

  private extractEditorContextLines(context?: AgentContext): string[] {
    if (!context) return []
    const parts: string[] = []
    if (context.activeFile) parts.push(`Active file: ${context.activeFile}`)
    if (context.cursorPosition) {
      parts.push(
        `Cursor at line ${context.cursorPosition.line}, col ${context.cursorPosition.column}`,
      )
    }
    if (context.selectedText) {
      parts.push(`Selected text:\n\`\`\`latex\n${context.selectedText}\n\`\`\``)
    }
    return parts
  }

  private buildSystemParts(userPrompt: string, context?: AgentContext): string[] {
    const systemParts: string[] = []

    if (context?.projectMemory) {
      const memText = formatProjectMemoryPrompt(context.projectMemory)
      if (memText) systemParts.push(memText)
    }

    if (context?.skills && context.skills.length > 0) {
      const relevant = selectRelevantSkills(
        context.skills,
        `${userPrompt} ${context.selectedText ?? ''} ${context.activeFile ?? ''}`,
      )
      const skillsText = formatSkillsPrompt(relevant)
      if (skillsText) systemParts.push(skillsText)
    }

    const editorParts = this.extractEditorContextLines(context)
    if (editorParts.length > 0) {
      systemParts.push(`Current editor context:\n${editorParts.join('\n')}`)
    }

    return systemParts
  }

  private buildInitialMessages(
    userPrompt: string,
    context?: AgentContext,
  ): { messages: ChatMessage[]; stats?: CompactionStats } {
    const systemParts = this.buildSystemParts(userPrompt, context)
    const uncompacted: ChatMessage[] = []

    if (systemParts.length > 0) {
      uncompacted.push({
        role: 'system',
        content: systemParts.join('\n\n'),
      })
    }
    if (context?.priorMessages && context.priorMessages.length > 0) {
      uncompacted.push(...context.priorMessages)
    }
    uncompacted.push({ role: 'user', content: userPrompt })

    return compactChatHistory(uncompacted)
  }

  private async handleSingleTool(
    call: ToolCall,
    toolMap: Map<string, ToolDefinition>,
  ): Promise<{ result: string; approved?: boolean }> {
    const def = toolMap.get(call.function.name)
    const args = this.parseArguments(call.function.arguments)

    if (def?.requiresApproval && this.onApprovalNeeded) {
      const approved = await this.onApprovalNeeded(call)
      if (!approved) {
        return {
          result: `User rejected execution of tool '${call.function.name}'.`,
          approved: false,
        }
      }
    }

    const result = await this.tools.execute(call.function.name, args)
    return { result, approved: true }
  }

  private async processToolCalls(
    calls: ToolCall[],
    toolMap: Map<string, ToolDefinition>,
    messages: ChatMessage[],
  ): Promise<AgentStep['toolCalls']> {
    const recorded: AgentStep['toolCalls'] = []
    for (const call of calls) {
      const { result, approved } = await this.handleSingleTool(call, toolMap)
      this.onToolCall?.(call, result)
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: result,
      })
      const stepEntry: AgentStep['toolCalls'][number] = {
        tool: call.function.name,
        args: this.parseArguments(call.function.arguments),
        result,
      }
      if (approved !== undefined) stepEntry.approved = approved
      recorded.push(stepEntry)
    }
    return recorded
  }

  private buildResult(
    response: string,
    steps: AgentStep[],
    inputTokens: number,
    outputTokens: number,
  ): AgentResult {
    const res: AgentResult = { response, steps }
    if (inputTokens > 0 || outputTokens > 0) {
      res.tokensUsed = { inputTokens, outputTokens }
    }
    return res
  }

  async run(
    userPrompt: string,
    context?: AgentContext,
    signal?: AbortSignal,
  ): Promise<AgentResult> {
    const { messages, stats } = this.buildInitialMessages(userPrompt, context)
    const toolDefs = this.tools.getTools()
    const toolMap = new Map<string, ToolDefinition>(toolDefs.map((t) => [t.name, t]))
    const steps: AgentStep[] = []
    let inputTokens = 0
    let outputTokens = 0

    for (let step = 1; step <= this.maxSteps; step++) {
      const resp = await this.adapter.chatComplete(messages, toolDefs, signal)
      if (resp.usage) {
        inputTokens += resp.usage.inputTokens
        outputTokens += resp.usage.outputTokens
      }

      const calls = resp.message.tool_calls
      if (!calls || calls.length === 0) {
        const res = this.buildResult(resp.message.content, steps, inputTokens, outputTokens)
        if (stats && stats.savedTokens > 0) res.compactionStats = stats
        return res
      }

      messages.push(resp.message)
      const recorded = await this.processToolCalls(calls, toolMap, messages)
      steps.push({ step, toolCalls: recorded })
    }

    const res = this.buildResult(
      'Agent reached maximum step limit without concluding.',
      steps,
      inputTokens,
      outputTokens,
    )
    if (stats && stats.savedTokens > 0) res.compactionStats = stats
    return res
  }
}
