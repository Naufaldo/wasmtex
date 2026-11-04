/**
 * Pure helpers for the demo app (`main.ts`). Extracted so the decision logic is
 * unit-testable without a DOM / `prompt()` — `main.ts` itself queries the DOM at
 * module load and cannot be imported in a test.
 */

/** Diagnostic shape the demo's panel renders. */
export interface PanelDiagnostic {
  file?: string | undefined
  line: number
  message: string
  severity: 'error' | 'warning' | 'info' | string
  code?: string | undefined
  details?: string | undefined
}

export interface OverleafLogSummary {
  total: number
  errors: number
  warnings: number
  info: number
}

export function summarizeLogEntries(entries: PanelDiagnostic[]): OverleafLogSummary {
  let errors = 0
  let warnings = 0
  let info = 0
  for (const e of entries) {
    if (e.severity === 'error') errors++
    else if (e.severity === 'warning') warnings++
    else info++
  }
  return {
    total: entries.length,
    errors,
    warnings,
    info,
  }
}

export function filterLogEntries(
  entries: PanelDiagnostic[],
  filter: 'all' | 'error' | 'warning' | 'info',
): PanelDiagnostic[] {
  if (filter === 'all') return entries
  return entries.filter((e) => e.severity === filter)
}

function matchBoxLine(line: string, file?: string): PanelDiagnostic | null {
  const overfull = line.match(/Overfull \\hbox \(([^)]+)\) in paragraph at lines (\d+)--(\d+)/i)
  if (overfull?.[1] && overfull[2]) {
    const startLine = Number(overfull[2])
    return {
      file,
      line: startLine,
      message: `Overfull \\hbox (${overfull[1]}) in paragraph at lines ${overfull[2]}--${overfull[3]}`,
      details: line,
      severity: 'info',
    }
  }

  const underfull = line.match(/Underfull \\hbox \(([^)]+)\) in paragraph at lines (\d+)--(\d+)/i)
  if (underfull?.[1] && underfull[2]) {
    const startLine = Number(underfull[2])
    return {
      file,
      line: startLine,
      message: `Underfull \\hbox (${underfull[1]}) in paragraph at lines ${underfull[2]}--${underfull[3]}`,
      details: line,
      severity: 'info',
    }
  }

  return null
}

function matchWarningNotice(line: string, file?: string): PanelDiagnostic | null {
  const multiLabel = line.match(/LaTeX Warning:\s*Label [`']([^']+)' multiply defined/i)
  if (multiLabel?.[1]) {
    return {
      file,
      line: 0,
      message: `Multiply defined labels: ${multiLabel[1]}`,
      details: line,
      severity: 'warning',
    }
  }

  const emptyPage = line.match(/Warning--empty page in\s*(.+)/i)
  if (emptyPage?.[1]) {
    return {
      file: file?.endsWith('.bbl') ? file : 'refs.bib',
      line: 0,
      message: `Empty page in ${emptyPage[1].trim()}`,
      details: line,
      severity: 'warning',
    }
  }

  const floatSpec = line.match(/float specifier changed to [`']?([^']+)['.]?/i)
  if (floatSpec?.[1]) {
    return {
      file,
      line: 0,
      message: `Float specifier changed to '${floatSpec[1]}'`,
      details: line,
      severity: 'info',
    }
  }

  return null
}

function matchGeneralWarning(line: string, file?: string): PanelDiagnostic | null {
  const latexWarn = line.match(/LaTeX Warning:\s*(.+?)(?: on input line (\d+)\.?)?$/i)
  if (latexWarn?.[1] && !line.includes('multiply defined') && !line.includes('float specifier')) {
    const lineNum = latexWarn[2] ? Number(latexWarn[2]) : 0
    return {
      file,
      line: lineNum,
      message: latexWarn[1].trim(),
      details: line,
      severity: 'warning',
    }
  }

  const pkgWarn = line.match(/Package\s+(\S+)\s+Warning:\s*(.+?)(?: on input line (\d+)\.?)?$/i)
  if (pkgWarn?.[1] && pkgWarn[2]) {
    const lineNum = pkgWarn[3] ? Number(pkgWarn[3]) : 0
    return {
      file,
      line: lineNum,
      message: `Package ${pkgWarn[1]} Warning: ${pkgWarn[2].trim()}`,
      details: line,
      severity: 'warning',
    }
  }

  return null
}

export function parseOverleafLogEntries(log: string): PanelDiagnostic[] {
  if (!log) return []
  const entries: PanelDiagnostic[] = []
  const lines = log.split('\n')
  let currentFile: string | undefined

  for (const line of lines) {
    const fileMatch = line.match(/\((\.?\/[^\s()]+\.(?:tex|aux|cls|sty|bbl))/i)
    if (fileMatch?.[1]) {
      currentFile = fileMatch[1].replace(/^\.\//, '')
    }

    const boxEntry = matchBoxLine(line, currentFile)
    if (boxEntry) {
      entries.push(boxEntry)
      continue
    }

    const noticeEntry = matchWarningNotice(line, currentFile)
    if (noticeEntry) {
      entries.push(noticeEntry)
      continue
    }

    const warnEntry = matchGeneralWarning(line, currentFile)
    if (warnEntry) {
      entries.push(warnEntry)
    }
  }

  return entries
}

/**
 * The set the diagnostics panel shows: compile errors AND static (LSP/lint)
 * diagnostics together. Both the `compile` and `diagnostics` event handlers must
 * render this union — otherwise a compile clobbers the LSP entries (and the count).
 */
export function mergeDiagnostics(
  compileErrors: PanelDiagnostic[],
  lspDiagnostics: PanelDiagnostic[],
  logDiagnostics: PanelDiagnostic[] = [],
): PanelDiagnostic[] {
  const seen = new Set<string>()
  const merged: PanelDiagnostic[] = []

  const add = (d: PanelDiagnostic) => {
    const key = `${d.severity}|${d.file ?? ''}|${d.line}|${d.message}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(d)
    }
  }

  for (const e of compileErrors) add(e)
  for (const l of lspDiagnostics) add(l)
  for (const g of logDiagnostics) add(g)

  return merged
}

/** What the add-file action should do, decided without `prompt()`/DOM. */
export type AddFileDecision =
  | { action: 'cancel' }
  | { action: 'open'; path: string }
  | { action: 'create'; path: string }

/**
 * Decide the add-file flow: cancel on empty input, OPEN (never overwrite) when the
 * file already exists, else CREATE. The existence guard prevents silently replacing
 * a live file with a blank skeleton (data loss).
 */
export function resolveAddFile(
  path: string | null | undefined,
  fileExists: (p: string) => boolean,
): AddFileDecision {
  const trimmed = path?.trim()
  if (!trimmed) return { action: 'cancel' }
  if (fileExists(trimmed)) return { action: 'open', path: trimmed }
  return { action: 'create', path: trimmed }
}
