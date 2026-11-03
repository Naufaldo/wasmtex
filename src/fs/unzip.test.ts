import { describe, expect, it } from 'vitest'
import { unzipLatexProject } from './unzip'
import { deflateRawSync } from 'node:zlib'

function createTestZip(
  entries: { path: string; content: string | Uint8Array; method?: number }[]
): Uint8Array {
  const parts: Uint8Array[] = []
  const cdParts: Uint8Array[] = []
  let offset = 0
  const encoder = new TextEncoder()

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path)
    const rawData =
      typeof entry.content === 'string'
        ? encoder.encode(entry.content)
        : entry.content
    const method = entry.method ?? 8 // 8 = deflate
    const compressed = method === 8 ? new Uint8Array(deflateRawSync(Buffer.from(rawData))) : rawData

    // Local header: 30 bytes
    const lh = new Uint8Array(30)
    const lhView = new DataView(lh.buffer)
    lhView.setUint32(0, 0x04034b50, true)
    lhView.setUint16(4, 20, true)
    lhView.setUint16(6, 0, true)
    lhView.setUint16(8, method, true)
    lhView.setUint32(18, compressed.length, true)
    lhView.setUint32(22, rawData.length, true)
    lhView.setUint16(26, nameBytes.length, true)
    lhView.setUint16(28, 0, true)

    parts.push(lh, nameBytes, compressed)

    // Central directory entry: 46 bytes
    const cd = new Uint8Array(46)
    const cdView = new DataView(cd.buffer)
    cdView.setUint32(0, 0x02014b50, true)
    cdView.setUint16(4, 20, true)
    cdView.setUint16(6, 20, true)
    cdView.setUint16(8, 0, true)
    cdView.setUint16(10, method, true)
    cdView.setUint32(20, compressed.length, true)
    cdView.setUint32(24, rawData.length, true)
    cdView.setUint16(28, nameBytes.length, true)
    cdView.setUint16(30, 0, true)
    cdView.setUint16(32, 0, true)
    cdView.setUint32(42, offset, true)

    cdParts.push(cd, nameBytes)
    offset += lh.length + nameBytes.length + compressed.length
  }

  // End of Central Directory: 22 bytes
  let cdLen = 0
  for (const part of cdParts) cdLen += part.length
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  eocdView.setUint32(0, 0x06054b50, true)
  eocdView.setUint16(8, entries.length, true)
  eocdView.setUint16(10, entries.length, true)
  eocdView.setUint32(12, cdLen, true)
  eocdView.setUint32(16, offset, true)

  const totalLen = offset + cdLen + eocd.length
  const result = new Uint8Array(totalLen)
  let pos = 0
  for (const p of parts) {
    result.set(p, pos)
    pos += p.length
  }
  for (const p of cdParts) {
    result.set(p, pos)
    pos += p.length
  }
  result.set(eocd, pos)
  return result
}

describe('unzipLatexProject', () => {
  it('extracts uncompressed and deflate files and strips root folders', async () => {
    const zipData = createTestZip([
      {
        path: 'my-project/main.tex',
        content: '\\documentclass{article}\n\\title{Quantum Mechanics}\n\\begin{document}Content\\end{document}',
      },
      {
        path: 'my-project/chapters/intro.tex',
        content: '\\section{Intro}\nIntro text',
      },
      {
        path: 'my-project/refs.bib',
        content: '@article{einstein, author={Einstein}}',
      },
      {
        path: 'my-project/__MACOSX/._main.tex',
        content: 'junk',
      },
    ])

    const res = await unzipLatexProject(zipData, 'my-project.zip')
    expect(res.suggestedTitle).toBe('Quantum Mechanics')
    expect(res.mainFile).toBe('main.tex')
    expect(Object.keys(res.files).sort()).toEqual([
      'chapters/intro.tex',
      'main.tex',
      'refs.bib',
    ])
    expect(res.files['main.tex']).toContain('Quantum Mechanics')
    expect(res.files['chapters/intro.tex']).toContain('\\section{Intro}')
  })

  it('handles stored (method 0) files', async () => {
    const zipData = createTestZip([
      {
        path: 'paper.tex',
        content: '\\documentclass{book}\n\\begin{document}Book\\end{document}',
        method: 0,
      },
    ])

    const res = await unzipLatexProject(zipData, 'book.zip')
    expect(res.mainFile).toBe('paper.tex')
    expect(res.files['paper.tex']).toContain('\\documentclass{book}')
  })
})
