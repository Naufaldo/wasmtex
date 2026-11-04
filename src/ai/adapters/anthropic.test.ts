import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnthropicAdapter } from './anthropic'

describe('AnthropicAdapter', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('chatComplete formats request and parses response', async () => {
    const mockResponse = {
      content: [{ type: 'text', text: 'Anthropic response with LaTeX math: $\\int_0^1 x dx$' }],
      usage: {
        input_tokens: 42,
        output_tokens: 18,
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response)

    const adapter = new AnthropicAdapter({
      provider: 'anthropic',
      endpoint: 'https://api.anthropic.com',
      apiKey: 'sk-ant-test',
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: 'System LaTeX prompt',
    })

    const res = await adapter.chatComplete([{ role: 'user', content: 'Integrate x' }])
    expect(res.message.content).toContain('Anthropic response with LaTeX math')
    expect(res.usage).toEqual({ inputTokens: 42, outputTokens: 18 })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-test',
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('chatComplete translates tool_use to tool_calls', async () => {
    const mockResponse = {
      content: [
        {
          type: 'tool_use',
          id: 'toolu_01A',
          name: 'read_file',
          input: { path: 'abstract.tex' },
        },
      ],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response)

    const adapter = new AnthropicAdapter({
      provider: 'anthropic',
      endpoint: 'https://api.anthropic.com',
      apiKey: 'sk-ant-test',
      model: 'claude-3-5-sonnet-20241022',
    })

    const res = await adapter.chatComplete(
      [{ role: 'user', content: 'Inspect abstract' }],
      [{ name: 'read_file', description: 'Read a file', parameters: { type: 'object' } }],
    )

    expect(res.message.tool_calls).toHaveLength(1)
    expect(res.message.tool_calls?.[0]?.id).toBe('toolu_01A')
    expect(res.message.tool_calls?.[0]?.function.name).toBe('read_file')
    expect(res.message.tool_calls?.[0]?.function.arguments).toBe('{"path":"abstract.tex"}')
  })

  it('chat streams delta tokens from SSE stream', async () => {
    const sseChunks = [
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":" Claude"}}\n\n',
    ]

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of sseChunks) {
          controller.enqueue(new TextEncoder().encode(chunk))
        }
        controller.close()
      },
    })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    } as unknown as Response)

    const adapter = new AnthropicAdapter({
      provider: 'anthropic',
      endpoint: 'https://api.anthropic.com',
      model: 'claude-3-5-sonnet-20241022',
    })

    const tokens: string[] = []
    for await (const t of adapter.chat([{ role: 'user', content: 'Hi' }])) {
      tokens.push(t)
    }

    expect(tokens.join('')).toBe('Hello Claude')
  })
})
