import { describe, expect, it } from 'vitest'
import { createZipArchive, computeCrc32 } from './zip'
import { unzipLatexProject } from './unzip'

describe('createZipArchive', () => {
  it('computes expected CRC-32 for known strings', () => {
    const encoder = new TextEncoder()
    expect(computeCrc32(encoder.encode('123456789'))).toBe(0xcbf43926)
    expect(computeCrc32(encoder.encode(''))).toBe(0)
  })

  it('generates a valid zip archive extractable by unzipLatexProject', async () => {
    const files = {
      'main.tex': '\\documentclass{article}\\title{Paper}\\begin{document}Hello world\\end{document}',
      'refs.bib': '@article{key, title={Test}}',
      'figures/plot.txt': 'x,y\n1,2\n3,4',
    }

    const zipBuffer = await createZipArchive(files)
    expect(zipBuffer.length).toBeGreaterThan(0)
    // Check ZIP magic header
    expect(zipBuffer[0]).toBe(0x50) // 'P'
    expect(zipBuffer[1]).toBe(0x4b) // 'K'
    expect(zipBuffer[2]).toBe(0x03)
    expect(zipBuffer[3]).toBe(0x04)

    // Unzip and verify contents
    const unzipped = await unzipLatexProject(zipBuffer, 'test.zip')
    expect(unzipped.files['main.tex']).toBe(files['main.tex'])
    expect(unzipped.files['refs.bib']).toBe(files['refs.bib'])
    expect(unzipped.files['figures/plot.txt']).toBe(files['figures/plot.txt'])
    expect(unzipped.suggestedTitle).toBe('Paper')
  })

  it('handles binary data in zip archive', async () => {
    const binary = new Uint8Array([0, 1, 2, 255, 254, 128, 64])
    const files = {
      'image.png': binary,
      'main.tex': '\\documentclass{article}\\begin{document}Hi\\end{document}',
    }

    const zipBuffer = await createZipArchive(files)
    const unzipped = await unzipLatexProject(zipBuffer, 'test.zip')
    expect(unzipped.files['main.tex']).toBe(files['main.tex'])
    expect(unzipped.files['image.png']).toBeDefined()
  })
})
