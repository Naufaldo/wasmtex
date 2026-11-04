import { describe, expect, it, vi } from 'vitest'
import type { ModelAdapter } from '../types'
import { diagnoseErrors } from './error-diagnosis'

describe('error-diagnosis', () => {
  it('diagnoses missing package and proposes fix', async () => {
    const mockModel: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content: JSON.stringify({
            summary: 'Undefined control sequence \\mathbb',
            rootCause: 'The command \\mathbb requires the amssymb package which is not loaded.',
            fixes: [
              {
                file: 'main.tex',
                line: 2,
                explanation: 'Add amssymb package to preamble',
                oldSnippet: '\\documentclass{article}',
                newSnippet: '\\documentclass{article}\n\\usepackage{amssymb}',
              },
            ],
          }),
        },
      }),
      supportsToolUse: () => true,
    }

    const diagnosis = await diagnoseErrors(
      {
        errors: [
          {
            message: 'Undefined control sequence \\mathbb',
            file: 'main.tex',
            line: 5,
            code: 'tex-error',
          },
        ],
        relevantFiles: {
          'main.tex': '\\documentclass{article}\n\\begin{document}\n$\\mathbb{R}$\n\\end{document}',
        },
      },
      mockModel,
      'en',
    )

    expect(diagnosis.summary).toContain('Undefined control sequence')
    expect(diagnosis.rootCause).toContain('amssymb')
    expect(diagnosis.fixes).toHaveLength(1)
    expect(diagnosis.fixes[0]?.newSnippet).toContain('\\usepackage{amssymb}')
  })
})
