import { describe, expect, it } from 'vitest'
import {
  stripLatexComments,
  auditArxivProject,
  buildArxivPackage,
} from './arxiv-exporter'
import { unzipLatexProject } from '../fs/unzip'

describe('stripLatexComments', () => {
  it('strips full line comments', () => {
    const input = '% this is a comment\nHello world\n% another comment'
    const output = stripLatexComments(input)
    expect(output).toBe('\nHello world\n')
  })

  it('strips inline comments while preserving code', () => {
    const input = 'x = 10; % set x to 10\ny = 20;'
    const output = stripLatexComments(input)
    expect(output).toBe('x = 10;\ny = 20;')
  })

  it('preserves escaped percentage signs', () => {
    const input = 'Accuracy is 99\\% on test set. % internal note'
    const output = stripLatexComments(input)
    expect(output).toBe('Accuracy is 99\\% on test set.')
  })

  it('preserves magic compiler directives', () => {
    const input = '% !TEX root = main.tex\n% !WASMTEX engine = pdflatex\nBody'
    const output = stripLatexComments(input)
    expect(output).toContain('% !TEX root = main.tex')
    expect(output).toContain('% !WASMTEX engine = pdflatex')
  })
})

describe('auditArxivProject', () => {
  it('detects main file, missing .bbl, and missing figures', () => {
    const files = {
      'main.tex': `
        \\documentclass{article}
        \\begin{document}
        \\includegraphics{figures/flowchart.png}
        \\includegraphics{figures/missing.pdf}
        \\input{chapter1}
        \\end{document}
      `,
      'figures/flowchart.png': new Uint8Array([1, 2, 3]),
      'chapter1.tex': 'Chapter 1 content',
      'main.aux': 'aux content',
      'main.log': 'log content',
    }

    const audit = auditArxivProject(files)
    expect(audit.mainFile).toBe('main.tex')
    expect(audit.hasBbl).toBe(false)
    expect(audit.figuresReferenced).toContain('figures/flowchart.png')
    expect(audit.figuresReferenced).toContain('figures/missing.pdf')
    expect(audit.figuresMissing).toEqual(['figures/missing.pdf'])
    expect(audit.subfilesMissing).toEqual([])
    expect(audit.excludedFiles).toContain('main.aux')
    expect(audit.excludedFiles).toContain('main.log')
  })

  it('flags readyForArxiv true when all requirements are satisfied', () => {
    const files = {
      'main.tex': `
        \\documentclass{article}
        \\begin{document}
        \\includegraphics{figures/chart.png}
        \\end{document}
      `,
      'main.bbl': '\\begin{thebibliography}{1}\\bibitem{a} Ref\\end{thebibliography}',
      'figures/chart.png': new Uint8Array([1]),
    }

    const audit = auditArxivProject(files)
    expect(audit.hasBbl).toBe(true)
    expect(audit.figuresMissing.length).toBe(0)
    expect(audit.readyForArxiv).toBe(true)
    expect(audit.warnings.length).toBe(0)
  })
})

describe('buildArxivPackage', () => {
  it('creates clean zip excluding junk files and stripping comments', async () => {
    const files = {
      'main.tex': '\\documentclass{article}\n% Author note\n\\begin{document}Body\\end{document}',
      'main.bbl': 'bbl content',
      'main.aux': 'junk aux',
      'main.log': 'junk log',
      'main.synctex.gz': 'junk synctex',
      'data.csv': 'a,b,c',
    }

    const zipData = await buildArxivPackage({
      files,
      mainFile: 'main.tex',
      stripComments: true,
      includeBbl: true,
    })

    const unzipped = await unzipLatexProject(zipData, 'arxiv.zip')
    expect(unzipped.files['main.tex']).toBeDefined()
    expect(unzipped.files['main.tex']).not.toContain('% Author note')
    expect(unzipped.files['main.bbl']).toBe('bbl content')
    expect(unzipped.files['data.csv']).toBe('a,b,c')
    // Junk files excluded
    expect(unzipped.files['main.aux']).toBeUndefined()
    expect(unzipped.files['main.log']).toBeUndefined()
    expect(unzipped.files['main.synctex.gz']).toBeUndefined()
  })

  it('can include compiled PDF in the bundle', async () => {
    const dummyPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // %PDF
    const files = {
      'main.tex': '\\documentclass{article}\\begin{document}Hi\\end{document}',
    }

    const zipData = await buildArxivPackage({
      files,
      mainFile: 'main.tex',
      includePdf: true,
      lastPdfBytes: dummyPdf,
    })

    const unzipped = await unzipLatexProject(zipData, 'arxiv.zip')
    expect(unzipped.files['main_compiled.pdf']).toBeDefined()
  })
})
