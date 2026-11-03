import type { UserSession } from '../auth/auth-store'

export interface ProjectItem {
  id: string
  title: string
  owner: string
  ownerId?: string | undefined
  lastModified: number
  files: Record<string, string>
  tags: string[]
  archived?: boolean | undefined
  trashed?: boolean | undefined
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

import {
  DEFAULT_ALGEBRA,
  DEFAULT_ANALYSIS,
  DEFAULT_LINALG,
  DEFAULT_REFS_BIB,
  DEFAULT_TEX,
} from '../fs/default-project'

const RESET_FLAG = 'wasmtex_clean_engine_default_v4'

export const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj_tutorial',
    title: 'Tutorial — Getting Started with LaTeX & WasmTex',
    owner: 'Engine',
    lastModified: Date.now(),
    tags: ['Tutorial'],
    files: {
      'main.tex': DEFAULT_TEX,
      'algebra.tex': DEFAULT_ALGEBRA,
      'analysis.tex': DEFAULT_ANALYSIS,
      'linalg.tex': DEFAULT_LINALG,
      'refs.bib': DEFAULT_REFS_BIB,
    },
  },
]

export async function getAllProjects(
  currentUser?: UserSession | null
): Promise<ProjectItem[]> {
  try {
    const db = await openDB()
    const needsReset = localStorage.getItem(RESET_FLAG) !== 'true'
    if (needsReset) {
      localStorage.setItem(RESET_FLAG, 'true')
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const clearReq = store.clear()
        clearReq.onsuccess = () => {
          for (const p of DEFAULT_PROJECTS) {
            store.put(p)
          }
          resolve()
        }
        clearReq.onerror = () => resolve()
      })
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = async () => {
        let list = (req.result as ProjectItem[]) || []
        if (list.length === 0) {
          await saveDefaults(db)
          list = [...DEFAULT_PROJECTS]
        }

        // Multi-Account Isolation: each user account strictly sees their own projects
        if (currentUser) {
          const userOwned = list.filter(
            (p) =>
              p.ownerId === currentUser.userId ||
              (!p.ownerId && p.owner.toLowerCase() === currentUser.username.toLowerCase())
          )

          // If this user has no personal projects yet, seed their isolated tutorial project
          if (userOwned.length === 0) {
            const personalTutorial: ProjectItem = {
              id: `proj_tutorial_${currentUser.userId}`,
              title: 'Tutorial — Getting Started with LaTeX & WasmTex',
              owner: currentUser.name || currentUser.username,
              ownerId: currentUser.userId,
              lastModified: Date.now(),
              tags: ['Tutorial'],
              files: {
                'main.tex': DEFAULT_TEX,
                'algebra.tex': DEFAULT_ALGEBRA,
                'analysis.tex': DEFAULT_ANALYSIS,
                'linalg.tex': DEFAULT_LINALG,
                'refs.bib': DEFAULT_REFS_BIB,
              },
            }
            await saveProject(personalTutorial)
            userOwned.push(personalTutorial)
          }

          userOwned.sort((a, b) => b.lastModified - a.lastModified)
          resolve(userOwned)
          return
        }

        list.sort((a, b) => b.lastModified - a.lastModified)
        resolve(list)
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

export async function saveProject(
  project: ProjectItem,
  currentUser?: UserSession | null
): Promise<void> {
  if (currentUser) {
    if (!project.ownerId) {
      project.ownerId = currentUser.userId
      project.owner = currentUser.name || currentUser.username
    } else if (project.ownerId !== currentUser.userId && currentUser.role !== 'admin') {
      throw new Error('Akses ditolak: Anda tidak memiliki hak akses mengubah proyek milik user lain.')
    }
  }

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

export async function deleteProject(
  id: string,
  permanent = false,
  currentUser?: UserSession | null
): Promise<void> {
  const proj = await getProject(id)
  if (currentUser && proj) {
    if (proj.ownerId && proj.ownerId !== currentUser.userId && currentUser.role !== 'admin') {
      throw new Error('Akses ditolak: Anda tidak dapat menghapus proyek pengguna lain.')
    }
  }

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

  if (proj) {
    proj.trashed = true
    await saveProject(proj, currentUser)
  }
}

export async function restoreProject(
  id: string,
  currentUser?: UserSession | null
): Promise<void> {
  const proj = await getProject(id)
  if (proj) {
    proj.trashed = false
    await saveProject(proj, currentUser)
  }
}
