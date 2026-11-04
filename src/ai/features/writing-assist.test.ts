import { describe, expect, it, vi } from 'vitest'
import type { ModelAdapter } from '../types'
import { generateEquation, generateTable, generateTikz, polishGrammar } from './writing-assist'

describe('writing-assist', () => {
  it('generateEquation converts natural language to LaTeX math', async () => {
    const mockModel: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content:
            '```latex\n\\begin{equation}\n\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J}\n\\end{equation}\n```',
        },
      }),
      supportsToolUse: () => true,
    }

    const eq = await generateEquation('Maxwell ampere law', mockModel)
    expect(eq).toBe(
      '\\begin{equation}\n\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J}\n\\end{equation}',
    )
  })

  it('generateTable builds table with booktabs conventions', async () => {
    const mockModel: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content:
            '\\begin{table}[h]\n\\toprule\nMethod & Accuracy \\\\\n\\midrule\nModel A & 94.2\\% \\\\\n\\bottomrule\n\\end{table}',
        },
      }),
      supportsToolUse: () => true,
    }

    const table = await generateTable('Comparison of Model A accuracy', mockModel, true)
    expect(table).toContain('\\toprule')
    expect(table).toContain('\\midrule')
  })

  it('polishGrammar preserves LaTeX tags and improves tone', async () => {
    const mockModel: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content:
            'As demonstrated in \\cite{smith2020}, empirical outcomes validate Hypothesis 1 ($p < 0.05$).',
        },
      }),
      supportsToolUse: () => true,
    }

    const polished = await polishGrammar(
      'Like smith2020 said, results show hypothesis 1 is good ($p < 0.05$).',
      mockModel,
      'academic',
    )
    expect(polished).toContain('\\cite{smith2020}')
    expect(polished).toContain('$p < 0.05$')
  })

  it('generateTikz creates standalone tikzpicture environment', async () => {
    const mockModel: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content: '\\begin{tikzpicture}\n\\draw[->] (0,0) -- (2,2);\n\\end{tikzpicture}',
        },
      }),
      supportsToolUse: () => true,
    }

    const tikz = await generateTikz('An arrow from origin to (2,2)', mockModel)
    expect(tikz).toBe('\\begin{tikzpicture}\n\\draw[->] (0,0) -- (2,2);\n\\end{tikzpicture}')
  })
})
