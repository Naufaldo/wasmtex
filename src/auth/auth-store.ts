export interface UserSession {
  email: string
  name: string
  token?: string
  loggedInAt: number
}

const AUTH_STORAGE_KEY = 'cortex_user_session'

export function getCurrentUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserSession
  } catch {
    return null
  }
}

export function loginUser(email: string, name?: string): UserSession {
  const session: UserSession = {
    email,
    name: name || email.split('@')[0] || 'Operator',
    loggedInAt: Date.now(),
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function logoutUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
