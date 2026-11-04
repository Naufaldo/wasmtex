import { describe, expect, it } from 'vitest'
import {
  filterLogEntries,
  mergeDiagnostics,
  parseOverleafLogEntries,
  type PanelDiagnostic,
  resolveAddFile,
  summarizeLogEntries,
} from './main-helpers'

const diag = (message: string, severity = 'error'): PanelDiagnostic => ({
  line: 1,
  message,
  severity,
})

describe('parseOverleafLogEntries', () => {
  it('parses warnings, multiply defined labels, empty page bib, and overfull hbox', () => {
    const sampleLog = `
(./elsarticle-rev.tex
LaTeX Warning: Label 'subsec1' multiply defined.
Warning--empty page in bib3, bib7, bib17
Float specifier changed to '!htbp'
Overfull \\hbox (28.4pt too wide) in paragraph at lines 339--340
)
`
    const entries = parseOverleafLogEntries(sampleLog)
    expect(entries.length).toBe(4)
    expect(entries.some((e) => e.message.includes('Multiply defined labels: subsec1'))).toBe(true)
    expect(entries.some((e) => e.message.includes('Empty page in bib3, bib7, bib17'))).toBe(true)
    expect(entries.some((e) => e.message.includes('Overfull \\hbox'))).toBe(true)
    expect(entries.some((e) => e.message.includes('Float specifier changed'))).toBe(true)
  })

  it('summarizes and filters logs accurately', () => {
    const list: PanelDiagnostic[] = [
      { line: 10, message: 'syntax err', severity: 'error' },
      { line: 20, message: 'label warn', severity: 'warning' },
      { line: 30, message: 'label warn 2', severity: 'warning' },
      { line: 40, message: 'overfull hbox', severity: 'info' },
    ]

    const summary = summarizeLogEntries(list)
    expect(summary).toEqual({
      total: 4,
      errors: 1,
      warnings: 2,
      info: 1,
    })

    expect(filterLogEntries(list, 'all')).toHaveLength(4)
    expect(filterLogEntries(list, 'error')).toHaveLength(1)
    expect(filterLogEntries(list, 'warning')).toHaveLength(2)
    expect(filterLogEntries(list, 'info')).toHaveLength(1)
  })
})

describe('mergeDiagnostics', () => {
  it('shows compile errors and static diagnostics together', () => {
    const compileErr = diag('compile boom')
    const lint = diag('unused-bib-entry', 'warning')
    const merged = mergeDiagnostics([compileErr], [lint])
    expect(merged).toContain(compileErr)
    expect(merged).toContain(lint)
    expect(merged).toHaveLength(2)
  })

  it('keeps both sets even when one is empty', () => {
    expect(mergeDiagnostics([], [diag('x')])).toHaveLength(1)
    expect(mergeDiagnostics([diag('y')], [])).toHaveLength(1)
  })
})

describe('resolveAddFile', () => {
  const exists = (p: string) => p === 'main.tex'

  it('cancels on empty/whitespace/null input', () => {
    expect(resolveAddFile(null, exists)).toEqual({ action: 'cancel' })
    expect(resolveAddFile('', exists)).toEqual({ action: 'cancel' })
    expect(resolveAddFile('   ', exists)).toEqual({ action: 'cancel' })
  })

  it('opens (does NOT overwrite) an existing file', () => {
    expect(resolveAddFile('main.tex', exists)).toEqual({ action: 'open', path: 'main.tex' })
  })

  it('creates a new file when the name is free', () => {
    expect(resolveAddFile('new.tex', exists)).toEqual({ action: 'create', path: 'new.tex' })
  })

  it('trims the path before deciding', () => {
    expect(resolveAddFile('  main.tex  ', exists)).toEqual({ action: 'open', path: 'main.tex' })
  })
})
