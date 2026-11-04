import { describe, expect, it, vi } from 'vitest'
import type { ModelAdapter } from '../types'
import { compareWithDraft, extractBibtex, extractTextFromPdf, summarizePaper } from './paper-reader'

vi.mock('pdfjs-dist', () => ({
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: (pageNum: number) =>
        Promise.resolve({
          getTextContent: () =>
            Promise.resolve({
              items: [{ str: `Page ${pageNum} text content` }],
            }),
        }),
    }),
  }),
}))

describe('paper-reader', () => {
  it('extractTextFromPdf extracts and formats page text', async () => {
    const sampleBytes = new Uint8Array([1, 2, 3])
    const extracted = await extractTextFromPdf(sampleBytes)
    expect(extracted).toContain('--- Page 1 ---')
    expect(extracted).toContain('Page 1 text content')
    expect(extracted).toContain('--- Page 2 ---')
  })

  it('summarizePaper parses structured JSON from model', async () => {
    const mockModel: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content: JSON.stringify({
            title: 'High-Performance Embeddable LaTeX Engines',
            authors: ['Jane Doe', 'John Smith'],
            abstract: 'We present a WebAssembly-based LaTeX distribution.',
            objectives: ['Embed LaTeX in browsers', 'Sub-second incremental re-typesetting'],
            methodology: 'Compiling TeX Live Web2C to Wasm with Asyncify memory snapshots.',
            findings: ['Fast paint in under 50ms', 'Zero native server requirements'],
            conclusions: ['Wasm-based compilation is production ready.'],
            keywords: ['WebAssembly', 'LaTeX', 'Browser'],
            bibtex: '@article{doe2025wasmtex,\n  title={High-Performance...}\n}',
          }),
        },
      }),
      supportsToolUse: () => true,
    }

    const summary = await summarizePaper('Raw paper content...', mockModel, 'en')
    expect(summary.title).toBe('High-Performance Embeddable LaTeX Engines')
    expect(summary.authors).toHaveLength(2)
    expect(summary.objectives).toHaveLength(2)
    expect(summary.bibtex).toContain('@article{doe2025wasmtex')
  })

  it('extractBibtex returns sanitized bibtex string', async () => {
    const mockModel: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content: '```bibtex\n@article{knuth1984tex,\n  author = {Donald Knuth}\n}\n```',
        },
      }),
      supportsToolUse: () => true,
    }

    const bib = await extractBibtex('TeX book by Donald Knuth...', mockModel)
    expect(bib).toBe('@article{knuth1984tex,\n  author = {Donald Knuth}\n}')
  })

  it('compareWithDraft sends comparison prompt', async () => {
    const mockModel: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content: 'Your draft improves upon the reference by avoiding server-side render.',
        },
      }),
      supportsToolUse: () => true,
    }

    const diff = await compareWithDraft('Ref paper text', 'Draft manuscript text', mockModel, 'en')
    expect(diff).toContain('Your draft improves upon the reference')
  })
})
