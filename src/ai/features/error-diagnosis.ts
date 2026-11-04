import type { ModelAdapter } from '../types'

export interface ErrorDiagnosisInput {
  errors: Array<{ message: string; file?: string | undefined; line?: number | undefined; code?: string | undefined }>
  logExcerpt?: string | undefined
  relevantFiles?: Record<string, string> | undefined
}

export interface ProposedFix {
  file: string
  line?: number | undefined
  explanation: string
  oldSnippet: string
  newSnippet: string
}

export interface DiagnosisResult {
  summary: string
  rootCause: string
  fixes: ProposedFix[]
}

export async function diagnoseErrors(
  input: ErrorDiagnosisInput,
  model: ModelAdapter,
  locale: 'en' | 'id' = 'en',
): Promise<DiagnosisResult> {
  const langNote =
    locale === 'id'
      ? 'Jelaskan summary dan rootCause dalam Bahasa Indonesia.'
      : 'Explain summary and rootCause in English.'

  const errorList = input.errors
    .map((e) => `- [${e.code ?? 'error'}] ${e.file ?? 'unknown'}:${e.line ?? 0}: ${e.message}`)
    .join('\n')

  const filesContext = input.relevantFiles
    ? Object.entries(input.relevantFiles)
        .map(([f, c]) => `--- File: ${f} ---\n${c.slice(0, 3000)}`)
        .join('\n\n')
    : ''

  const logContext = input.logExcerpt
    ? `\n--- Log snippet ---\n${input.logExcerpt.slice(-1500)}`
    : ''

  const prompt = `You are an expert TeX/LaTeX debugger. Analyze the following compilation errors and project source context. Return a JSON object with this exact structure:
{
  "summary": "Brief description of the problem",
  "rootCause": "Explanation of why this error occurred",
  "fixes": [
    {
      "file": "main.tex",
      "line": 15,
      "explanation": "Add missing package or close environment",
      "oldSnippet": "\\\\badcommand{...}",
      "newSnippet": "\\\\correctcommand{...}"
    }
  ]
}
${langNote}
Output ONLY raw JSON without markdown code fences or conversational pleasantries.

Error list:
${errorList}
${logContext}

Project Files:
${filesContext}`

  const res = await model.chatComplete([{ role: 'user', content: prompt }])
  const clean = res.message.content
    .replace(/^```(json)?/m, '')
    .replace(/```$/m, '')
    .trim()

  try {
    const parsed = JSON.parse(clean) as DiagnosisResult
    return {
      summary: parsed.summary || 'Compilation errors detected',
      rootCause: parsed.rootCause || '',
      fixes: Array.isArray(parsed.fixes) ? parsed.fixes : [],
    }
  } catch {
    return {
      summary: 'Compilation error analysis',
      rootCause: res.message.content,
      fixes: [],
    }
  }
}
