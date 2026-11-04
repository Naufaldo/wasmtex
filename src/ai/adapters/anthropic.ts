import type { ChatMessage, ChatResponse, ToolCall, ToolDefinition } from '../types'
import { BaseAdapter } from './base'

interface AnthropicTextContent {
  type: 'text'
  text: string
}

interface AnthropicToolUseContent {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

interface AnthropicToolResultContent {
  type: 'tool_result'
  tool_use_id: string
  content: string
}

type AnthropicContentItem =
  | AnthropicTextContent
  | AnthropicToolUseContent
  | AnthropicToolResultContent

interface AnthropicMessagePayload {
  role: 'user' | 'assistant'
  content: string | AnthropicContentItem[]
}

interface AnthropicResponse {
  content?: Array<
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  >
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

interface AnthropicStreamDelta {
  type: string
  delta?: {
    type?: string
    text?: string
  }
}

export class AnthropicAdapter extends BaseAdapter {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    }
    if (this.options.apiKey) {
      headers['x-api-key'] = this.options.apiKey
    }
    return headers
  }

  private formatTools(tools?: ToolDefinition[]): Record<string, unknown>[] | undefined {
    if (!tools || tools.length === 0) return undefined
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }))
  }

  private convertToolCalls(calls: ToolCall[]): AnthropicToolUseContent[] {
    return calls.map((c) => {
      let input: Record<string, unknown> = {}
      try {
        input = JSON.parse(c.function.arguments) as Record<string, unknown>
      } catch {
        // fallback empty
      }
      return {
        type: 'tool_use' as const,
        id: c.id,
        name: c.function.name,
        input,
      }
    })
  }

  private prepareMessages(messages: ChatMessage[]): {
    system?: string
    messages: AnthropicMessagePayload[]
  } {
    let system = this.options.systemPrompt
    const list: AnthropicMessagePayload[] = []

    for (const m of messages) {
      if (m.role === 'system') {
        system = m.content
        continue
      }
      if (m.role === 'tool') {
        list.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: m.tool_call_id ?? '',
              content: m.content,
            },
          ],
        })
        continue
      }
      if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
        const toolUses = this.convertToolCalls(m.tool_calls)
        const content: AnthropicContentItem[] = []
        if (m.content) content.push({ type: 'text', text: m.content })
        content.push(...toolUses)
        list.push({ role: 'assistant', content })
        continue
      }
      list.push({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })
    }

    const res: { system?: string; messages: AnthropicMessagePayload[] } = { messages: list }
    if (system) res.system = system
    return res
  }

  private buildRequestBody(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    stream = false,
  ): Record<string, unknown> {
    const { system, messages: anthropicMsgs } = this.prepareMessages(messages)
    const body: Record<string, unknown> = {
      model: this.options.model,
      messages: anthropicMsgs,
      max_tokens: this.options.maxTokens ?? 4096,
      stream,
    }
    if (system) body.system = system
    if (this.options.temperature !== undefined) body.temperature = this.options.temperature
    const formattedTools = this.formatTools(tools)
    if (formattedTools) body.tools = formattedTools
    return body
  }

  async *chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown> {
    const url = this.resolveUrl('/v1/messages')
    const body = this.buildRequestBody(messages, tools, true)
    const init: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    }
    if (signal) init.signal = signal

    const response = await fetch(url, init)
    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(
        `Anthropic chat error (${response.status}): ${errText || response.statusText}`,
      )
    }

    for await (const rawPayload of this.parseSseStream(response)) {
      try {
        const parsed = JSON.parse(rawPayload) as AnthropicStreamDelta
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          yield parsed.delta.text
        }
      } catch {
        // Skip malformed SSE lines
      }
    }
  }

  private parseResponseContent(content?: AnthropicResponse['content']): {
    text: string
    toolCalls?: ToolCall[]
  } {
    let text = ''
    const toolCalls: ToolCall[] = []

    for (const item of content ?? []) {
      if (item.type === 'text') {
        text += item.text
      } else if (item.type === 'tool_use') {
        toolCalls.push({
          id: item.id,
          type: 'function',
          function: {
            name: item.name,
            arguments: JSON.stringify(item.input),
          },
        })
      }
    }

    const res: { text: string; toolCalls?: ToolCall[] } = { text }
    if (toolCalls.length > 0) res.toolCalls = toolCalls
    return res
  }

  async chatComplete(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    signal?: AbortSignal,
  ): Promise<ChatResponse> {
    const url = this.resolveUrl('/v1/messages')
    const body = this.buildRequestBody(messages, tools, false)
    const init: RequestInit = {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    }
    if (signal) init.signal = signal

    const response = await fetch(url, init)
    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(
        `Anthropic chat error (${response.status}): ${errText || response.statusText}`,
      )
    }

    const data = (await response.json()) as AnthropicResponse
    const { text, toolCalls } = this.parseResponseContent(data.content)

    const resultMessage: ChatMessage = {
      role: 'assistant',
      content: text,
    }
    if (toolCalls) resultMessage.tool_calls = toolCalls

    const chatResp: ChatResponse = {
      message: resultMessage,
    }
    if (data.usage) {
      chatResp.usage = {
        inputTokens: data.usage.input_tokens ?? 0,
        outputTokens: data.usage.output_tokens ?? 0,
      }
    }
    return chatResp
  }
}
