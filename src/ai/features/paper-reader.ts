import type { ModelAdapter } from '../types'

export interface PaperSummary {
  title: string
  authors: string[]
  abstract: string
  objectives: string[]
  methodology: string
  findings: string[]
  conclusions: string[]
  keywords: string[]
  bibtex: string
}

export async function extractTextFromPdf(data: Uint8Array | ArrayBuffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const loadingTask = pdfjsLib.getDocument({
    data: bytes,
    isEvalSupported: false,
    useSystemFonts: true,
  })

  const pdfDoc = await loadingTask.promise
  const pageTexts: string[] = []

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()
    const text = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length > 0) {
      pageTexts.push(`--- Page ${pageNum} ---\n${text}`)
    }
  }

  return pageTexts.join('\n\n')
}

export async function summarizePaper(
  paperText: string,
  model: ModelAdapter,
  locale: 'en' | 'id' = 'en',
): Promise<PaperSummary> {
  const langNote =
    locale === 'id'
      ? 'Tulis ringkasan (objectives, methodology, findings, conclusions) dalam Bahasa Indonesia.'
      : 'Write the summary in English.'

  const prompt = `You are an expert scientific researcher. Analyze the following research paper text and return a JSON object with this exact shape:
{
  "title": "Paper Title",
  "authors": ["Author 1", "Author 2"],
  "abstract": "Concise abstract summary",
  "objectives": ["Primary goal 1", "Goal 2"],
  "methodology": "Brief methodology overview",
  "findings": ["Key finding 1", "Key finding 2"],
  "conclusions": ["Main conclusion 1"],
  "keywords": ["Keyword1", "Keyword2"],
  "bibtex": "@article{...}"
}
${langNote}
Return ONLY valid raw JSON without markdown code fences or conversational text.

Paper text:
${paperText.slice(0, 15000)}`

  const res = await model.chatComplete([{ role: 'user', content: prompt }])
  const cleanJson = res.message.content
    .replace(/^```(json)?/m, '')
    .replace(/```$/m, '')
    .trim()

  try {
    const parsed = JSON.parse(cleanJson) as PaperSummary
    return {
      title: parsed.title || 'Untitled Paper',
      authors: Array.isArray(parsed.authors) ? parsed.authors : [],
      abstract: parsed.abstract || '',
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
      methodology: parsed.methodology || '',
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      conclusions: Array.isArray(parsed.conclusions) ? parsed.conclusions : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      bibtex: parsed.bibtex || '',
    }
  } catch {
    return {
      title: 'Extracted Research Summary',
      authors: [],
      abstract: res.message.content,
      objectives: [],
      methodology: '',
      findings: [],
      conclusions: [],
      keywords: [],
      bibtex: '',
    }
  }
}

export async function extractBibtex(paperText: string, model: ModelAdapter): Promise<string> {
  const prompt = `Extract metadata from this research paper and generate a complete, valid BibTeX entry (@article, @inproceedings, or @book). Output ONLY the BibTeX entry:\n\n${paperText.slice(0, 4000)}`
  const res = await model.chatComplete([{ role: 'user', content: prompt }])
  return res.message.content
    .replace(/^```(bibtex|latex)?/m, '')
    .replace(/```$/m, '')
    .trim()
}

export async function compareWithDraft(
  referencePaperText: string,
  draftText: string,
  model: ModelAdapter,
  locale: 'en' | 'id' = 'en',
): Promise<string> {
  const langNote = locale === 'id' ? 'Jawab dalam Bahasa Indonesia.' : 'Answer in English.'
  const prompt = `Compare the following reference research paper with my active manuscript draft.
Highlight:
1. Key differences in methodology, scope, or experimental design.
2. Distinctive findings and contributions of my draft compared to the reference.
3. Relevant citations or points to address in my Related Work or Discussion.
${langNote}

--- REFERENCE PAPER EXCERPT ---
${referencePaperText.slice(0, 8000)}

--- MY DRAFT EXCERPT ---
${draftText.slice(0, 8000)}`

  const res = await model.chatComplete([{ role: 'user', content: prompt }])
  return res.message.content.trim()
}
