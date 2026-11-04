import { describe, expect, it } from 'vitest'
import {
  TIKZ_TEMPLATES,
  buildStandaloneDoc,
  formatFigureBlock,
} from './tikz-scratchpad'

describe('Tikz Scratchpad', () => {
  it('provides required curated templates with valid TikZ environments', () => {
    expect(TIKZ_TEMPLATES.length).toBeGreaterThanOrEqual(5)
    for (const t of TIKZ_TEMPLATES) {
      expect(t.id).toBeDefined()
      expect(t.name).toBeDefined()
      expect(t.code).toContain('\\begin{tikzpicture}')
      expect(t.code).toContain('\\end{tikzpicture}')
    }
  })

  it('builds a standalone LaTeX document wrapping snippet', () => {
    const snippet = '\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}'
    const doc = buildStandaloneDoc(snippet)
    expect(doc).toContain('\\documentclass[tikz,border=6pt]{standalone}')
    expect(doc).toContain('\\usepackage{tikz}')
    expect(doc).toContain('\\usepackage{pgfplots}')
    expect(doc).toContain('\\begin{document}')
    expect(doc).toContain(snippet)
    expect(doc).toContain('\\end{document}')
  })

  it('formats figure block for inserting into main document', () => {
    const snippet = '\\begin{tikzpicture}\n\\draw (0,0) circle (1);\n\\end{tikzpicture}'
    const figure = formatFigureBlock(snippet, 'Grafik Sensivitas', 'fig:sensivitas')
    expect(figure).toContain('\\begin{figure}[htbp]')
    expect(figure).toContain('\\centering')
    expect(figure).toContain('\\caption{Grafik Sensivitas}')
    expect(figure).toContain('\\label{fig:sensivitas}')
    expect(figure).toContain('\\end{figure}')
    expect(figure).toContain('\\draw (0,0) circle (1);')
  })
})
