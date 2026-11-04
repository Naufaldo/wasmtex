import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VirtualFS } from '../fs/virtual-fs'
import { AIService } from './ai-service'

describe('AIService', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('runs chat and fixErrors using configured model', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Fix: add \\usepackage{amsmath} to the preamble.',
          },
        },
      ],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response)

    const fs = new VirtualFS({ empty: true })
    fs.writeFile('main.tex', '\\begin{equation}\nx=1\n\\end{equation}')

    const ai = new AIService({
      model: {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4o',
      },
      fs,
    })

    const fixResult = await ai.fixErrors([
      { message: 'Undefined control sequence \\align', file: 'main.tex', line: 1 },
    ])
    expect(fixResult).toContain('Fix: add \\usepackage{amsmath}')
  })

  it('runs rewriteSelection, continueWriting, and explainLatex', async () => {
    const responses = ['Rewritten formula', 'Continuation paragraph', 'Explanation of TikZ matrix']
    let callIdx = 0

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      const content = responses[callIdx++] ?? 'Default'
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { role: 'assistant', content } }],
        }),
      } as unknown as Response
    })

    const fs = new VirtualFS({ empty: true })
    const ai = new AIService({
      model: {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4o',
      },
      fs,
    })

    const rewritten = await ai.rewriteSelection('bad text', 'make it formal')
    expect(rewritten).toBe('Rewritten formula')

    const continued = await ai.continueWriting('\\section{Introduction}\nHere we discuss')
    expect(continued).toBe('Continuation paragraph')

    const explained = await ai.explainLatex('\\matrix{a & b \\\\ c & d}')
    expect(explained).toBe('Explanation of TikZ matrix')
  })

  it('updates model configuration at runtime', async () => {
    const fs = new VirtualFS({ empty: true })
    const ai = new AIService({
      model: {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4o',
      },
      fs,
    })

    ai.updateModel({
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
      model: 'mistral',
    })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: { role: 'assistant', content: 'Answer from Ollama' },
      }),
    } as unknown as Response)

    const res = await ai.chat('Test prompt')
    expect(res.response).toBe('Answer from Ollama')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.anything(),
    )
  })
})
