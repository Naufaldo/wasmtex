import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OllamaAdapter } from './ollama'
import { OpenAiAdapter } from './openai'

describe('OpenAiAdapter', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('chatComplete returns parsed message and usage', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Hello LaTeX user!',
          },
        },
      ],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 8,
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response)

    const adapter = new OpenAiAdapter({
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1',
      apiKey: 'sk-test-key',
      model: 'gpt-4o',
    })

    const res = await adapter.chatComplete([{ role: 'user', content: 'Hi' }])
    expect(res.message.content).toBe('Hello LaTeX user!')
    expect(res.message.role).toBe('assistant')
    expect(res.usage).toEqual({ inputTokens: 12, outputTokens: 8 })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test-key',
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('chatComplete parses tool_calls', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'read_file',
                  arguments: '{"path":"main.tex"}',
                },
              },
            ],
          },
        },
      ],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response)

    const adapter = new OpenAiAdapter({
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    })

    const res = await adapter.chatComplete(
      [{ role: 'user', content: 'Read main.tex' }],
      [
        {
          name: 'read_file',
          description: 'Read file',
          parameters: { type: 'object' },
        },
      ],
    )

    expect(res.message.tool_calls).toHaveLength(1)
    expect(res.message.tool_calls?.[0]?.function.name).toBe('read_file')
    expect(res.message.tool_calls?.[0]?.function.arguments).toBe('{"path":"main.tex"}')
  })

  it('chat streams text tokens from SSE stream', async () => {
    const sseChunks = [
      'data: {"choices":[{"delta":{"content":"\\\\"}}]}\\n\\n',
      'data: {"choices":[{"delta":{"content":"begin"}}]}\\n\\n',
      'data: {"choices":[{"delta":{"content":"{document}"}}]}\\n\\n',
      'data: [DONE]\\n\\n',
    ]

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of sseChunks) {
          controller.enqueue(new TextEncoder().encode(chunk.replace(/\\n/g, '\n')))
        }
        controller.close()
      },
    })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    } as unknown as Response)

    const adapter = new OpenAiAdapter({
      provider: 'openai',
      endpoint: 'http://localhost:11434/v1',
      model: 'llama3',
    })

    const tokens: string[] = []
    for await (const token of adapter.chat([{ role: 'user', content: 'start' }])) {
      tokens.push(token)
    }

    expect(tokens.join('')).toBe('\\begin{document}')
  })

  it('throws on HTTP error status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid API key',
    } as unknown as Response)

    const adapter = new OpenAiAdapter({
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    })

    await expect(adapter.chatComplete([{ role: 'user', content: 'test' }])).rejects.toThrow(
      'OpenAI chat error (401): Invalid API key',
    )
  })
})

describe('OllamaAdapter', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('chatComplete normalizes object arguments in tool_calls', async () => {
    const mockResponse = {
      message: {
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            function: {
              name: 'compile',
              arguments: { engine: 'pdflatex' },
            },
          },
        ],
      },
      prompt_eval_count: 5,
      eval_count: 15,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response)

    const adapter = new OllamaAdapter({
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
      model: 'llama3.1',
    })

    const res = await adapter.chatComplete([{ role: 'user', content: 'compile doc' }])
    expect(res.message.tool_calls).toHaveLength(1)
    expect(res.message.tool_calls?.[0]?.function.name).toBe('compile')
    expect(res.message.tool_calls?.[0]?.function.arguments).toBe('{"engine":"pdflatex"}')
    expect(res.usage).toEqual({ inputTokens: 5, outputTokens: 15 })
  })
})
