import type { Skill } from '../types'

export interface CuratedSkillPreset {
  id: string
  name: string
  source: string
  repoUrl: string
  description: string
  trigger: string
  rules: string[]
}

export const CURATED_COMMUNITY_SKILLS: CuratedSkillPreset[] = [
  {
    id: 'skill_humanizer',
    name: 'humanizer',
    source: 'blader/humanizer',
    repoUrl: 'https://github.com/blader/humanizer',
    description:
      'Hapus tanda-tanda penulisan khas AI generatif agar tulisan akademik terdengar alami dan ditulis manusia',
    trigger: 'humanize, polish, rewrite, ai-writing, alami, natural, human',
    rules: [
      'Hapus pola "Not X but Y" (contoh klise: "It is not just a tool, but a paradigm shift").',
      'Hapus penutup satu kalimat retoris ("Let that sink in", "Think about it").',
      'Hindari kata pengantar panggung ("Here is the thing", "Honestly?", "At its core").',
      'Hapus kata klise AI yang overused: delve, tapestry, beacon, testament, pivotal, crucially, in conclusion.',
      'Hindari berdebat dengan sanggahan bayangan ("I am not saying X, but...").',
      'Gunakan kata kerja aktif yang lugas dan hilangkan repetisi berlebihan.',
    ],
  },
  {
    id: 'skill_scientific_writer',
    name: 'scientific-paper-writer',
    source: 'K-Dense-AI/scientific-agent-skills',
    repoUrl: 'https://github.com/K-Dense-AI/scientific-agent-skills',
    description:
      'Standar penulisan manuskrip ilmiah berbasis bukti, metodologi kuantitatif, dan sintaks LaTeX ketat',
    trigger: 'manuscript, paper, journal, abstract, methodology, results, discussion',
    rules: [
      'Alur bab: Latar Belakang & Konteks → Kesenjangan (Gap) → Aksi Metodologi → Konsekuensi/Hasil.',
      'Kuantitatif presisi: wajib sebutkan ukuran sampel (n), confidence interval (95% CI), dan nilai p eksak daripada sekadar kata "signifikan".',
      'Integritas bukti: bedakan dengan tegas antara fakta terbukti literatur dan hipotesis usulan penulis.',
      'Gunakan non-breaking space (~) sebelum sitasi (contoh: \\cite{ref1}).',
      'Sertakan nomor persamaan \\eqref{} untuk semua persamaan yang dirujuk di paragraf pembahasan.',
    ],
  },
  {
    id: 'skill_scientific_figures',
    name: 'scientific-figure-standards',
    source: 'K-Dense-AI/scientific-agent-skills',
    repoUrl: 'https://github.com/K-Dense-AI/scientific-agent-skills',
    description:
      'Pedoman pembuatan gambar dan grafik ilmiah standar jurnal (dimensi kolom, palet ramah buta warna, unit sumbu)',
    trigger: 'figure, plot, grafik, tikz, gambar, diagram, visualisasi',
    rules: [
      'Dimensi kolom: sesuaikan lebar single-column (84-88 mm / 0.48\\textwidth) atau double-column (174-180 mm / \\textwidth).',
      'Gunakan palet warna ramah buta warna (Viridis, ColorBrewer Okabe-Ito), jangan hanya mengandalkan kontras merah-hijau.',
      'Sertakan unit satuan fisik pada setiap label sumbu dalam kurung siku: Kuantitas [satuan] atau Kuantitas / satuan.',
      'Ukuran font label minimal 7pt pada skala cetak final agar tetap terbaca jelas.',
      'Caption harus berdiri sendiri (self-contained) menjelaskan singkatan dan arti simbol.',
    ],
  },
  {
    id: 'skill_data_analysis',
    name: 'data-analysis-visualization',
    source: 'K-Dense-AI/scientific-agent-skills',
    repoUrl: 'https://github.com/K-Dense-AI/scientific-agent-skills',
    description:
      'Analisis statistik, regresi model, dan pelaporan metrik akurasi ilmiah (R², RMSE, AIC)',
    trigger: 'data, statistik, regresi, fitting, rmse, r2, residual, korelasi',
    rules: [
      'Laporkan selalu metrik goodness-of-fit: R^2, Adjusted R^2, RMSE, atau AIC/BIC saat fitting model.',
      'Uji asumsi residual (normalitas, homoskedastisitas) sebelum menarik kesimpulan regresi linier.',
      'Gunakan format tabel LaTeX booktabs untuk menyajikan ringkasan parameter estimasi.',
      'Sertakan nilai ketidakpastian (standard error atau standar deviasi) untuk setiap nilai rata-rata yang dilaporkan.',
    ],
  },
]

export function normalizeGitHubRawUrl(inputUrl: string): string {
  let url = inputUrl.trim()
  if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
    // e.g. https://github.com/blader/humanizer/blob/main/README.md -> https://raw.githubusercontent.com/blader/humanizer/main/README.md
    if (url.includes('/blob/')) {
      url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
    } else {
      // repo root e.g. https://github.com/blader/humanizer -> try SKILL.md or README.md
      url = url.replace('github.com', 'raw.githubusercontent.com').replace(/\/+$/, '')
      url = `${url}/main/SKILL.md`
    }
  }
  return url
}

interface ParsedFrontmatter {
  body: string
  name?: string | undefined
  description?: string | undefined
  trigger?: string | undefined
}

function parseFrontmatter(content: string): ParsedFrontmatter {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fmMatch?.[1]) return { body: content }
  const body = content.slice(fmMatch[0].length)
  const fm = fmMatch[1]
  const name = fm.match(/^name:\s*(.+)$/m)?.[1]?.trim()
  const description = fm.match(/^description:\s*(.+)$/m)?.[1]?.trim()
  const trigger = fm.match(/^trigger:\s*(.+)$/m)?.[1]?.trim()
  return { body, name, description, trigger }
}

function extractBulletRules(body: string): string[] {
  const rules: string[] = []
  const lines = body.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    const match = trimmed.match(/^[-*]\s+(.+)$/) || trimmed.match(/^\d+\.\s+(.+)$/)
    if (match?.[1]) {
      const clean = match[1].replace(/[*`_]/g, '').trim()
      if (clean.length > 5 && !clean.toLowerCase().startsWith('license')) {
        rules.push(clean)
      }
    }
  }
  return rules
}

function extractParagraphRules(body: string): string[] {
  const paras = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10 && !p.startsWith('#'))
  return paras.slice(0, 5).map((p) => p.replace(/\n+/g, ' '))
}

export function parseSkillMarkdown(
  content: string,
  defaultName = 'custom-skill',
): Omit<Skill, 'id' | 'updatedAt'> {
  const fm = parseFrontmatter(content)
  const name = fm.name || defaultName
  let description = fm.description || 'Custom imported skill'

  if (description === 'Custom imported skill') {
    const headMatch = fm.body.match(/^#+\s*(.+)$/m)
    if (headMatch?.[1]) description = headMatch[1].trim()
  }

  let rules = extractBulletRules(fm.body)
  if (rules.length === 0) {
    rules = extractParagraphRules(fm.body)
  }

  const cleanName =
    name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'custom-skill'

  return {
    name: cleanName,
    description,
    rules: rules.slice(0, 15),
    trigger: fm.trigger || undefined,
  }
}

function validateUrlSafe(urlStr: string): string {
  const trimmed = urlStr.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error('Hanya protokol HTTP dan HTTPS yang diizinkan')
  }
  const parsed = new URL(trimmed)
  const host = parsed.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host === '169.254.169.254' ||
    host.endsWith('.internal') ||
    host.endsWith('.local')
  ) {
    throw new Error(`Akses ke host privat '${host}' tidak diizinkan demi keamanan`)
  }
  return trimmed
}

export async function fetchSkillFromUrl(
  inputUrl: string,
): Promise<Omit<Skill, 'id' | 'updatedAt'>> {
  const validated = validateUrlSafe(inputUrl)
  let targetUrl = normalizeGitHubRawUrl(validated)
  validateUrlSafe(targetUrl)
  let res = await fetch(targetUrl)

  // If SKILL.md 404'd on repo root, try README.md
  if (!res.ok && targetUrl.endsWith('/SKILL.md')) {
    targetUrl = targetUrl.replace('/SKILL.md', '/README.md')
    res = await fetch(targetUrl)
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch skill from ${inputUrl} (${res.status}: ${res.statusText})`)
  }

  const text = await res.text()
  const pathParts = inputUrl.split('/')
  const fallbackName = pathParts[pathParts.length - 1]?.replace(/\.md$/i, '') || 'imported-skill'
  return parseSkillMarkdown(text, fallbackName)
}
