import type { ChatMessage, ChatResponse, ToolCall, ToolDefinition } from '../types'
import { BaseAdapter } from './base'

interface OpenAiMessagePayload {
  role: string
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

interface OpenAiChoice {
  message?: {
    role: string
    content: string | null
    tool_calls?: ToolCall[]
  }
  delta?: {
    role?: string
    content?: string | null
  }
}

interface OpenAiChatCompletionResponse {
  choices?: OpenAiChoice[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
  }
}

export class OpenAiAdapter extends BaseAdapter {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.options.apiKey) {
      headers.Authorization = `Bearer ${this.options.apiKey}`
    }
    return headers
  }

  private prepareMessages(messages: ChatMessage[]): OpenAiMessagePayload[] {
    const list: OpenAiMessagePayload[] = []
    if (this.options.systemPrompt && !messages.some((m) => m.role === 'system')) {
      list.push({ role: 'system', content: this.options.systemPrompt })
    }
    for (const m of messages) {
      const item: OpenAiMessagePayload = {
        role: m.role,
        content: m.content,
      }
      if (m.tool_calls) item.tool_calls = m.tool_calls
      if (m.tool_call_id) item.tool_call_id = m.tool_call_id
      list.push(item)
    }
    return list
  }

  private formatTools(tools?: ToolDefinition[]): Record<string, unknown>[] | undefined {
    if (!tools || tools.length === 0) return undefined
    return tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))
  }

  async *chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown> {
    const url = this.resolveUrl('/chat/completions')
    const body: Record<string, unknown> = {
      model: this.options.model,
      messages: this.prepareMessages(messages),
      stream: true,
    }
    if (this.options.temperature !== undefined) body.temperature = this.options.temperature
    if (this.options.maxTokens !== undefined) body.max_tokens = this.options.maxTokens
    const formattedTools = this.formatTools(tools)
    if (formattedTools) body.tools = formattedTools

    const init: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    }
    if (signal) init.signal = signal

    const response = await fetch(url, init)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`OpenAI chat error (${response.status}): ${errText || response.statusText}`)
    }

    for await (const rawPayload of this.parseSseStream(response)) {
      try {
        const parsed = JSON.parse(rawPayload) as OpenAiChatCompletionResponse
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) {
          yield delta
        }
      } catch {
        // Skip malformed JSON lines in SSE stream
      }
    }
  }

  async chatComplete(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    signal?: AbortSignal,
  ): Promise<ChatResponse> {
    const url = this.resolveUrl('/chat/completions')
    const body: Record<string, unknown> = {
      model: this.options.model,
      messages: this.prepareMessages(messages),
      stream: false,
    }
    if (this.options.temperature !== undefined) body.temperature = this.options.temperature
    if (this.options.maxTokens !== undefined) body.max_tokens = this.options.maxTokens
    const formattedTools = this.formatTools(tools)
    if (formattedTools) body.tools = formattedTools

    const init: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    }
    if (signal) init.signal = signal

    const response = await fetch(url, init)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`OpenAI chat error (${response.status}): ${errText || response.statusText}`)
    }

    const data = (await response.json()) as OpenAiChatCompletionResponse
    const choice = data.choices?.[0]
    const msg = choice?.message

    const resultMessage: ChatMessage = {
      role: (msg?.role as ChatMessage['role']) ?? 'assistant',
      content: msg?.content ?? '',
    }
    if (msg?.tool_calls && msg.tool_calls.length > 0) {
      resultMessage.tool_calls = msg.tool_calls
    }

    const chatResp: ChatResponse = {
      message: resultMessage,
    }

    if (data.usage) {
      chatResp.usage = {
        inputTokens: data.usage.prompt_tokens ?? 0,
        outputTokens: data.usage.completion_tokens ?? 0,
      }
    }

    return chatResp
  }
}
