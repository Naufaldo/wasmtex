export interface ProjectItem {
  id: string
  title: string
  owner: string
  lastModified: number
  files: Record<string, string>
  tags: string[]
  archived?: boolean
  trashed?: boolean
}

const DB_NAME = 'wasmtex_projects_db'
const STORE_NAME = 'projects'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj_delta_robot',
    title: 'CEP-An Optimized 3-Way Independent Complementary Filter Design for High-Precision Closed-Loop Control in 3-DOF Delta Robots',
    owner: 'Kevin Putranda',
    lastModified: Date.now() - 3600000 * 4,
    tags: ['Ade', 'Dingin Lestari', 'Robotics'],
    files: {
      'main.tex': `\\documentclass[10pt,twocolumn]{article}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{cite}

\\title{An Optimized 3-Way Independent Complementary Filter Design for High-Precision Closed-Loop Control in 3-DOF Delta Robots}
\\author{Kevin Putranda, et al.}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
High-speed Delta parallel robots require precise kinematic feedback with minimum computational latency. This paper introduces an optimized 3-way independent complementary filter fusing high-rate accelerometer and angular rate signals.
\\end{abstract}

\\section{Introduction}
Parallel kinematic manipulators, particularly Delta robots, are widely used in modern automated pick-and-place operations \\cite{he2016deep}. Low latency sensor fusion is paramount.

\\section{System Architecture}
The system models a 3-DOF articulated geometry with dynamic kinematic compensation:
\\begin{equation}
  \\theta_k = \\alpha (\\theta_{k-1} + \\omega_k \\Delta t) + (1 - \\alpha) \\theta_{\\text{acc}}
\\end{equation}

\\section{Conclusion}
Experimental results validate superior stability and trajectory tracking under dynamic load conditions.

\\bibliographystyle{plain}
\\bibliography{refs}
\\end{document}`,
      'refs.bib': `@inproceedings{he2016deep,
  author = {He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},
  title = {Deep Residual Learning for Image Recognition},
  booktitle = {CVPR},
  year = {2016}
}`,
    },
  },
  {
    id: 'proj_dac_ndir',
    title: 'Benchtop DAC Biochar Adsorption Kinetics & Drift Analysis',
    owner: 'You',
    lastModified: Date.now() - 3600000 * 24 * 2,
    tags: ['DAC', 'Biochar'],
    files: {
      'main.tex': `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{cite}

\\title{Benchtop Direct Air Capture: Biochar Adsorption Kinetics}
\\author{Research Team}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Direct Air Capture (DAC) using functionalized biochar exhibits promising CO2 sorption capacity. We examine transient kinetics and sensor drift compensation.
\\end{abstract}

\\section{Introduction}
Mitigating atmospheric greenhouse gases demands scalable negative emission technologies \\cite{vaswani2017attention}.

\\section{Kinetics Modeling}
The dynamic adsorption capacity $q_t$ is described by the pseudo-second-order model:
\\begin{equation}
  \\frac{dq}{dt} = k_2 (q_e - q_t)^2
\\end{equation}

\\bibliographystyle{plain}
\\bibliography{refs}
\\end{document}`,
      'refs.bib': `@article{vaswani2017attention,
  author = {Vaswani, Ashish, et al.},
  title = {Attention Is All You Need},
  journal = {NeurIPS},
  year = {2017}
}`,
    },
  },
]

export async function getAllProjects(): Promise<ProjectItem[]> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => {
        const list = (req.result as ProjectItem[]) || []
        if (list.length === 0) {
          saveDefaults(db).then(() => resolve(DEFAULT_PROJECTS))
        } else {
          list.sort((a, b) => b.lastModified - a.lastModified)
          resolve(list)
        }
      }
      req.onerror = () => resolve(DEFAULT_PROJECTS)
    })
  } catch {
    return DEFAULT_PROJECTS
  }
}

async function saveDefaults(db: IDBDatabase): Promise<void> {
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  for (const p of DEFAULT_PROJECTS) {
    store.put(p)
  }
}

export async function getProject(id: string): Promise<ProjectItem | null> {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => resolve((req.result as ProjectItem) || null)
    req.onerror = () => resolve(null)
  })
}

export async function saveProject(project: ProjectItem): Promise<void> {
  const db = await openDB()
  project.lastModified = Date.now()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(project)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function deleteProject(id: string, permanent = false): Promise<void> {
  const db = await openDB()
  if (permanent) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }
  const proj = await getProject(id)
  if (proj) {
    proj.trashed = true
    await saveProject(proj)
  }
}

export async function restoreProject(id: string): Promise<void> {
  const proj = await getProject(id)
  if (proj) {
    proj.trashed = false
    await saveProject(proj)
  }
}
