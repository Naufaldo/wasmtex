import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './templates'

describe('Starter Templates Catalog', () => {
  it('contains at least 20 academic & community templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(20)
  })

  it('includes presentation, IEEE, Elsevier, Thesis, Nature, Report, and community templates', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(ids).toContain('tpl_beamer')
    expect(ids).toContain('tpl_ieee')
    expect(ids).toContain('tpl_elsevier')
    expect(ids).toContain('tpl_thesis')
    expect(ids).toContain('tpl_nature')
    expect(ids).toContain('tpl_report')
    expect(ids).toContain('tpl_arxiv')
    expect(ids).toContain('tpl_lncs')
    expect(ids).toContain('tpl_neurips_ml')
    expect(ids).toContain('tpl_phd_dissertation')
    expect(ids).toContain('tpl_modern_cv')
    expect(ids).toContain('tpl_grant_proposal')
    expect(ids).toContain('tpl_sop_industrial')
    expect(ids).toContain('tpl_academic_book')
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
