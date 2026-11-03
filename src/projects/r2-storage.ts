import type { ProjectItem } from './project-store'

export interface R2SyncStatus {
  available: boolean
  message?: string
}

/** Check if the Cloudflare Worker R2 endpoint is active and bound */
export async function checkR2StorageAvailable(): Promise<R2SyncStatus> {
  try {
    const res = await fetch('/api/storage', { method: 'GET' })
    if (res.status === 503) {
      return { available: false, message: 'R2 bucket belum dikonfigurasi di Cloudflare Worker' }
    }
    return { available: res.ok }
  } catch {
    return { available: false, message: 'Local/Dev server' }
  }
}

/** Upload a project JSON package to the private R2 bucket */
export async function backupProjectToR2(project: ProjectItem): Promise<boolean> {
  try {
    const key = `projects/${project.id}.json`
    const res = await fetch(`/api/storage/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    })
    return res.ok
  } catch (err) {
    console.error('[R2 Storage] Failed to backup project:', err)
    return false
  }
}

/** Retrieve a project from R2 */
export async function fetchProjectFromR2(projectId: string): Promise<ProjectItem | null> {
  try {
    const key = `projects/${projectId}.json`
    const res = await fetch(`/api/storage/${key}`)
    if (!res.ok) return null
    return (await res.json()) as ProjectItem
  } catch {
    return null
  }
}
