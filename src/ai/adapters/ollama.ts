import type { ChatMessage, ChatResponse, ToolCall, ToolDefinition } from '../types'
import { BaseAdapter } from './base'

interface OllamaMessage {
  role: string
  content: string
  tool_calls?: Array<{
    id?: string
    function: {
      name: string
      arguments: Record<string, unknown> | string
    }
  }>
}

interface OllamaResponse {
  message?: OllamaMessage
  done?: boolean
  prompt_eval_count?: number
  eval_count?: number
}

export class OllamaAdapter extends BaseAdapter {
  private prepareMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    const list: Array<{ role: string; content: string }> = []
    if (this.options.systemPrompt && !messages.some((m) => m.role === 'system')) {
      list.push({ role: 'system', content: this.options.systemPrompt })
    }
    for (const m of messages) {
      list.push({ role: m.role, content: m.content })
    }
    return list
  }

  private normalizeToolCalls(calls?: OllamaMessage['tool_calls']): ToolCall[] | undefined {
    if (!calls || calls.length === 0) return undefined
    return calls.map((c, i) => ({
      id: c.id ?? `call_${Date.now()}_${i}`,
      type: 'function' as const,
      function: {
        name: c.function.name,
        arguments:
          typeof c.function.arguments === 'string'
            ? c.function.arguments
            : JSON.stringify(c.function.arguments),
      },
    }))
  }

  private parseNdjsonLine(line: string): string | null {
    const trimmed = line.trim()
    if (!trimmed) return null
    try {
      const data = JSON.parse(trimmed) as OllamaResponse
      return data.message?.content ?? null
    } catch {
      return null
    }
  }

  private async *parseNdjsonStream(response: Response): AsyncGenerator<string, void, unknown> {
    if (!response.body) return
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const content = this.parseNdjsonLine(line)
          if (content) yield content
        }
      }
      const leftover = this.parseNdjsonLine(buffer)
      if (leftover) yield leftover
    } finally {
      reader.releaseLock()
    }
  }

  async *chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown> {
    const url = this.resolveUrl('/api/chat')
    const body: Record<string, unknown> = {
      model: this.options.model,
      messages: this.prepareMessages(messages),
      stream: true,
    }
    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))
    }

    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
    if (signal) init.signal = signal

    const response = await fetch(url, init)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Ollama chat error (${response.status}): ${errText || response.statusText}`)
    }

    yield* this.parseNdjsonStream(response)
  }

  async chatComplete(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    signal?: AbortSignal,
  ): Promise<ChatResponse> {
    const url = this.resolveUrl('/api/chat')
    const body: Record<string, unknown> = {
      model: this.options.model,
      messages: this.prepareMessages(messages),
      stream: false,
    }
    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))
    }

    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
    if (signal) init.signal = signal

    const response = await fetch(url, init)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Ollama chat error (${response.status}): ${errText || response.statusText}`)
    }

    const data = (await response.json()) as OllamaResponse
    const toolCalls = this.normalizeToolCalls(data.message?.tool_calls)

    const resultMessage: ChatMessage = {
      role: (data.message?.role as ChatMessage['role']) ?? 'assistant',
      content: data.message?.content ?? '',
    }
    if (toolCalls) {
      resultMessage.tool_calls = toolCalls
    }

    const chatResp: ChatResponse = {
      message: resultMessage,
    }
    if (data.prompt_eval_count !== undefined || data.eval_count !== undefined) {
      chatResp.usage = {
        inputTokens: data.prompt_eval_count ?? 0,
        outputTokens: data.eval_count ?? 0,
      }
    }
    return chatResp
  }
}
