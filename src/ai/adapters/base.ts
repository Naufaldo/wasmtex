import type {
  ChatMessage,
  ChatResponse,
  ModelAdapter,
  ModelAdapterOptions,
  ToolDefinition,
} from '../types'

export abstract class BaseAdapter implements ModelAdapter {
  protected options: ModelAdapterOptions

  constructor(options: ModelAdapterOptions) {
    this.options = options
  }

  abstract chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown>

  abstract chatComplete(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    signal?: AbortSignal,
  ): Promise<ChatResponse>

  supportsToolUse(): boolean {
    return true
  }

  protected resolveUrl(path: string): string {
    const base = this.options.endpoint.replace(/\/+$/, '')
    if (base.endsWith(path)) return base
    return `${base}${path}`
  }

  private extractSseData(line: string): string | null {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return null
    const payload = trimmed.slice(5).trim()
    return payload === '[DONE]' ? null : payload
  }

  protected async *parseSseStream(response: Response): AsyncGenerator<string, void, unknown> {
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
          const payload = this.extractSseData(line)
          if (payload) yield payload
        }
      }
      const leftover = this.extractSseData(buffer)
      if (leftover) yield leftover
    } finally {
      reader.releaseLock()
    }
  }
}
