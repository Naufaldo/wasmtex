import type { ModelAdapter } from '../types'

export async function generateEquation(description: string, model: ModelAdapter): Promise<string> {
  const prompt = `Convert the following mathematical description into clean, standard LaTeX equation code (e.g. \\begin{equation} ... \\end{equation} or inline $...$). Output ONLY the LaTeX math code without explanation:\n\n${description}`
  const res = await model.chatComplete([{ role: 'user', content: prompt }])
  return res.message.content
    .replace(/^```(latex|tex)?/m, '')
    .replace(/```$/m, '')
    .trim()
}

export async function generateTable(
  description: string,
  model: ModelAdapter,
  useBooktabs = true,
): Promise<string> {
  const style = useBooktabs
    ? 'Use \\usepackage{booktabs} conventions (\\toprule, \\midrule, \\bottomrule, avoid vertical lines).'
    : 'Use standard tabular lines (\\hline).'
  const prompt = `Generate a LaTeX table environment from this description: "${description}".
${style}
Include caption, label, and appropriate column alignments.
Output ONLY the LaTeX table code without markdown fences or pleasantries.`

  const res = await model.chatComplete([{ role: 'user', content: prompt }])
  return res.message.content
    .replace(/^```(latex|tex)?/m, '')
    .replace(/```$/m, '')
    .trim()
}

export async function polishGrammar(
  latexSnippet: string,
  model: ModelAdapter,
  targetTone: 'academic' | 'concise' | 'standard' = 'academic',
): Promise<string> {
  const toneDesc = {
    academic: 'formal peer-reviewed scientific journal publication tone',
    concise: 'dense, punchy, compact writing without redundant adverbs',
    standard: 'natural, clear, grammatically flawless tone',
  }[targetTone]

  const prompt = `Polish the following LaTeX prose for a ${toneDesc}.
CRITICAL: Preserve all LaTeX markup, citations (\\cite{...}), equations ($...$, \\begin{equation}), cross-references (\\ref{...}), and environment tags untouched. Only improve the text. Output ONLY the polished LaTeX snippet:\n\n${latexSnippet}`

  const res = await model.chatComplete([{ role: 'user', content: prompt }])
  return res.message.content
    .replace(/^```(latex|tex)?/m, '')
    .replace(/```$/m, '')
    .trim()
}

export async function generateTikz(
  diagramDescription: string,
  model: ModelAdapter,
): Promise<string> {
  const prompt = `Create a self-contained TikZ picture environment (\\begin{tikzpicture} ... \\end{tikzpicture}) for the following diagram description:
"${diagramDescription}"
Ensure all needed libraries are standard (arrows.meta, positioning, calc).
Output ONLY the LaTeX TikZ code without conversational text.`

  const res = await model.chatComplete([{ role: 'user', content: prompt }])
  return res.message.content
    .replace(/^```(latex|tex)?/m, '')
    .replace(/```$/m, '')
    .trim()
}
