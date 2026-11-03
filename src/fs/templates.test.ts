import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './templates'

describe('Starter Templates Catalog', () => {
  it('contains at least 6 core academic templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(6)
  })

  it('includes presentation, IEEE, Elsevier, Thesis, Nature, and Report templates', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(ids).toContain('tpl_beamer')
    expect(ids).toContain('tpl_ieee')
    expect(ids).toContain('tpl_elsevier')
    expect(ids).toContain('tpl_thesis')
    expect(ids).toContain('tpl_nature')
    expect(ids).toContain('tpl_report')
  })

  it('ensures each template has a main.tex file with document environment', () => {
    for (const tpl of TEMPLATES) {
      expect(tpl.files['main.tex']).toBeDefined()
      expect(tpl.files['main.tex']).toContain('\\begin{document}')
      expect(tpl.files['main.tex']).toContain('\\end{document}')
      expect(tpl.titleId).toBeTruthy()
      expect(tpl.titleEn).toBeTruthy()
      expect(tpl.descriptionId).toBeTruthy()
      expect(tpl.descriptionEn).toBeTruthy()
    }
  })
})
