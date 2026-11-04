import type { ProjectMemory, Skill } from '../types'

const SKILLS_KEY = 'wasmtex_ai_skills'
const PROJECT_MEMORY_PREFIX = 'wasmtex_ai_proj_mem_'

export const DEFAULT_BUILTIN_SKILLS: Skill[] = [
  {
    id: 'skill_booktabs',
    name: 'booktabs-tables',
    description: 'Pedoman penyusunan tabel akademik profesional dengan package booktabs',
    rules: [
      'Gunakan \\toprule, \\midrule, dan \\bottomrule.',
      'Hindari penggunaan garis vertikal (|) pada tabular.',
      'Sertakan selalu \\caption{} dan \\label{tab:...} di dalam lingkungan table.',
      'Letakkan caption di atas tabel untuk standar jurnal internasional.',
    ],
    trigger: 'table, tabular, booktabs, kolom, baris, tabel',
    updatedAt: Date.now(),
  },
  {
    id: 'skill_equations',
    name: 'ams-math-equations',
    description: 'Standar penulisan persamaan matematika dan notasi simbol',
    rules: [
      'Gunakan \\eqref{eq:...} untuk merujuk nomor persamaan agar otomatis bertanda kurung.',
      'Gunakan lingkungan align bukan eqnarray untuk persamaan multi-baris.',
      'Beri tanda baca (titik/koma) di akhir baris persamaan jika merupakan penutup klausa kalimat.',
      'Gunakan \\mathbf{} untuk vektor/matriks dan \\mathrm{} untuk unit satuan (misal: \\,\\mathrm{m/s}).',
    ],
    trigger: 'equation, align, rumus, math, integral, diferensial, persamaan',
    updatedAt: Date.now(),
  },
  {
    id: 'skill_citations',
    name: 'academic-citations',
    description: 'Aturan penulisan sitasi dan bibliografi',
    rules: [
      'Gunakan non-breaking space (~) sebelum \\cite, contoh: "seperti dijelaskan oleh Knuth~\\cite{knuth1984}".',
      'Pastikan setiap klausa klaim empiris didukung oleh sitasi kunci.',
      'Gunakan \\citet{} atau \\citep{} jika menggunakan paket natbib.',
    ],
    trigger: 'cite, bibtex, referensi, sitasi, pustaka, rujukan',
    updatedAt: Date.now(),
  },
]

export function loadAllSkills(): Skill[] {
  try {
    const raw = localStorage.getItem(SKILLS_KEY)
    if (!raw) return [...DEFAULT_BUILTIN_SKILLS]
    const parsed = JSON.parse(raw) as Skill[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_BUILTIN_SKILLS]
    return parsed
  } catch {
    return [...DEFAULT_BUILTIN_SKILLS]
  }
}

export function saveAllSkills(skills: Skill[]): void {
  try {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(skills))
  } catch {
    // ignore quota error
  }
}

export function upsertSkill(skill: Omit<Skill, 'id' | 'updatedAt'> & { id?: string }): Skill {
  const all = loadAllSkills()
  const now = Date.now()
  const id = skill.id || `skill_${now}_${Math.random().toString(36).slice(2, 6)}`
  const existingIdx = all.findIndex(
    (s) => s.id === id || s.name.toLowerCase() === skill.name.toLowerCase(),
  )

  const entry: Skill = {
    id,
    name: skill.name.trim().toLowerCase().replace(/\s+/g, '-'),
    description: skill.description.trim(),
    rules: skill.rules.filter((r: string) => r.trim().length > 0),
    updatedAt: now,
  }
  if (skill.trigger) entry.trigger = skill.trigger.trim()

  if (existingIdx !== -1) {
    all[existingIdx] = entry
  } else {
    all.push(entry)
  }
  saveAllSkills(all)
  return entry
}

export function deleteSkill(id: string): boolean {
  const all = loadAllSkills()
  const filtered = all.filter((s) => s.id !== id)
  if (filtered.length === all.length) return false
  saveAllSkills(filtered)
  return true
}

export function loadProjectMemory(projectId: string): ProjectMemory {
  const key = `${PROJECT_MEMORY_PREFIX}${projectId}`
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return {
        projectId,
        summary: '',
        notationDecisions: [],
        updatedAt: Date.now(),
      }
    }
    return JSON.parse(raw) as ProjectMemory
  } catch {
    return {
      projectId,
      summary: '',
      notationDecisions: [],
      updatedAt: Date.now(),
    }
  }
}

export function saveProjectMemory(memory: ProjectMemory): void {
  const key = `${PROJECT_MEMORY_PREFIX}${memory.projectId}`
  try {
    localStorage.setItem(key, JSON.stringify({ ...memory, updatedAt: Date.now() }))
  } catch {
    // ignore quota error
  }
}

export function updateProjectMemory(
  projectId: string,
  update: Partial<Omit<ProjectMemory, 'projectId' | 'updatedAt'>>,
): ProjectMemory {
  const cur = loadProjectMemory(projectId)
  const updated: ProjectMemory = {
    projectId,
    summary: update.summary !== undefined ? update.summary : cur.summary,
    notationDecisions:
      update.notationDecisions !== undefined
        ? [...new Set([...cur.notationDecisions, ...update.notationDecisions])]
        : cur.notationDecisions,
    updatedAt: Date.now(),
  }
  if (update.activeTopic !== undefined) updated.activeTopic = update.activeTopic
  saveProjectMemory(updated)
  return updated
}
