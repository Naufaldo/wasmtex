export type UserRole = 'admin' | 'researcher' | 'viewer'

export interface UserAccount {
  id: string
  username: string
  name: string
  password: string
  role: UserRole
  createdAt: number
  updatedAt: number
}

export interface UserSession {
  userId: string
  username: string
  name: string
  role: UserRole
  token?: string | undefined
  loggedInAt: number
  email?: string | undefined
}

const AUTH_STORAGE_KEY = 'cortex_user_session'
const ACCOUNTS_STORAGE_KEY = 'cortex_iam_accounts'

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    name: 'System Administrator',
    password: 'cortex2026',
    role: 'admin',
    createdAt: 1704067200000,
    updatedAt: 1704067200000,
  },
  {
    id: 'usr_researcher',
    username: 'researcher',
    name: 'Lead Researcher',
    password: 'cortex2026',
    role: 'researcher',
    createdAt: 1704067200000,
    updatedAt: 1704067200000,
  },
  {
    id: 'usr_guest',
    username: 'guest',
    name: 'Guest Reviewer',
    password: 'cortex2026',
    role: 'viewer',
    createdAt: 1704067200000,
    updatedAt: 1704067200000,
  },
]

export function initAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS))
      return DEFAULT_ACCOUNTS
    }
    const accounts = JSON.parse(raw) as UserAccount[]
    if (!Array.isArray(accounts) || accounts.length === 0) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS))
      return DEFAULT_ACCOUNTS
    }
    return accounts
  } catch {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS))
    return DEFAULT_ACCOUNTS
  }
}

export function getAllUsers(): UserAccount[] {
  return initAccounts()
}

export function getUserById(id: string): UserAccount | null {
  const users = getAllUsers()
  return users.find((u) => u.id === id) || null
}

export function getUserByUsername(username: string): UserAccount | null {
  const users = getAllUsers()
  const lower = username.trim().toLowerCase()
  return users.find((u) => u.username.toLowerCase() === lower) || null
}

export function authenticate(
  username: string,
  pass: string
): { success: boolean; session?: UserSession; error?: string } {
  const cleanUsername = username.trim()
  if (!cleanUsername) {
    return { success: false, error: 'Username atau Operator ID wajib diisi.' }
  }
  if (!pass) {
    return { success: false, error: 'Password wajib diisi.' }
  }

  const user = getUserByUsername(cleanUsername)
  if (!user) {
    return { success: false, error: 'Akun tidak ditemukan. Periksa kembali username Anda.' }
  }

  if (user.password !== pass) {
    return { success: false, error: 'Password salah. Silakan coba kembali.' }
  }

  const session = loginUser(user)
  return { success: true, session }
}

export function getCurrentUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as UserSession
    if (!session || !session.userId || !session.username) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export function loginUser(
  userOrIdentifier: UserAccount | UserSession | string,
  name?: string
): UserSession {
  let session: UserSession

  if (typeof userOrIdentifier === 'string') {
    const existing = getUserByUsername(userOrIdentifier)
    if (existing) {
      session = {
        userId: existing.id,
        username: existing.username,
        name: existing.name,
        role: existing.role,
        loggedInAt: Date.now(),
        email: existing.username.includes('@') ? existing.username : undefined,
      }
    } else {
      const clean = userOrIdentifier.trim()
      session = {
        userId: `usr_custom_${Date.now()}`,
        username: clean.toLowerCase().replace(/\s+/g, '_'),
        name: name || clean,
        role: 'researcher',
        loggedInAt: Date.now(),
        email: clean.includes('@') ? clean : undefined,
      }
    }
  } else if ('userId' in userOrIdentifier) {
    session = {
      ...userOrIdentifier,
      loggedInAt: Date.now(),
    }
  } else {
    session = {
      userId: userOrIdentifier.id,
      username: userOrIdentifier.username,
      name: userOrIdentifier.name,
      role: userOrIdentifier.role,
      loggedInAt: Date.now(),
    }
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function logoutUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function changeUsername(
  userId: string,
  newUsername: string
): { success: boolean; error?: string } {
  const clean = newUsername.trim()
  if (clean.length < 3) {
    return { success: false, error: 'Username minimal harus memiliki 3 karakter.' }
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(clean)) {
    return { success: false, error: 'Username hanya boleh mengandung huruf, angka, garis bawah, titik, dan strip.' }
  }

  const users = getAllUsers()
  const collision = users.find(
    (u) => u.id !== userId && u.username.toLowerCase() === clean.toLowerCase()
  )
  if (collision) {
    return { success: false, error: `Username "${clean}" sudah digunakan akun lain.` }
  }

  const userIdx = users.findIndex((u) => u.id === userId)
  if (userIdx === -1) {
    return { success: false, error: 'Akun user tidak ditemukan.' }
  }

  users[userIdx]!.username = clean
  users[userIdx]!.updatedAt = Date.now()
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users))

  const curSession = getCurrentUser()
  if (curSession && curSession.userId === userId) {
    curSession.username = clean
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(curSession))
  }

  return { success: true }
}

export function changePassword(
  userId: string,
  oldPass: string | null,
  newPass: string,
  isAdminBypass = false
): { success: boolean; error?: string } {
  if (!newPass || newPass.length < 6) {
    return { success: false, error: 'Password baru minimal harus 6 karakter.' }
  }

  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) {
    return { success: false, error: 'Akun user tidak ditemukan.' }
  }

  if (!isAdminBypass) {
    if (!oldPass || user.password !== oldPass) {
      return { success: false, error: 'Password lama tidak cocok.' }
    }
  }

  user.password = newPass
  user.updatedAt = Date.now()
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users))

  return { success: true }
}

export function updateUserProfile(
  userId: string,
  updates: { name?: string; role?: UserRole }
): { success: boolean; error?: string } {
  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) {
    return { success: false, error: 'Akun user tidak ditemukan.' }
  }

  if (updates.name && updates.name.trim()) {
    user.name = updates.name.trim()
  }
  if (updates.role) {
    user.role = updates.role
  }
  user.updatedAt = Date.now()
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users))

  const curSession = getCurrentUser()
  if (curSession && curSession.userId === userId) {
    if (updates.name) curSession.name = user.name
    if (updates.role) curSession.role = user.role
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(curSession))
  }

  return { success: true }
}

export function createUser(
  username: string,
  pass: string,
  name: string,
  role: UserRole
): { success: boolean; user?: UserAccount; error?: string } {
  const cleanUsername = username.trim()
  if (cleanUsername.length < 3) {
    return { success: false, error: 'Username minimal harus memiliki 3 karakter.' }
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
    return { success: false, error: 'Username hanya boleh karakter alfanumerik, titik, strip, dan garis bawah.' }
  }
  if (!pass || pass.length < 6) {
    return { success: false, error: 'Password minimal harus 6 karakter.' }
  }

  const users = getAllUsers()
  if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return { success: false, error: `Username "${cleanUsername}" sudah digunakan.` }
  }

  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    username: cleanUsername,
    name: name.trim() || cleanUsername,
    password: pass,
    role,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  users.push(newUser)
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users))
  return { success: true, user: newUser }
}

export function deleteUser(
  targetUserId: string,
  currentUserId?: string
): { success: boolean; error?: string } {
  if (targetUserId === 'usr_admin') {
    return { success: false, error: 'Akun Master Admin bawaan tidak dapat dihapus.' }
  }
  if (currentUserId && targetUserId === currentUserId) {
    return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.' }
  }

  const users = getAllUsers()
  const targetUser = users.find((u) => u.id === targetUserId)
  if (!targetUser) {
    return { success: false, error: 'Akun user tidak ditemukan.' }
  }

  if (targetUser.role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length
    if (adminCount <= 1) {
      return { success: false, error: 'Tidak dapat menghapus admin terakhir pada sistem IAM.' }
    }
  }

  const filtered = users.filter((u) => u.id !== targetUserId)
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered))
  return { success: true }
}

export function canCreateProject(session: UserSession | null): boolean {
  if (!session) return false
  return session.role === 'admin' || session.role === 'researcher'
}

export function canEditProject(
  session: UserSession | null,
  projectOwnerId?: string
): boolean {
  if (!session) return false
  if (session.role === 'admin') return true
  if (session.role === 'viewer') return false
  return projectOwnerId === session.userId
}

export function canDeleteProject(
  session: UserSession | null,
  projectOwnerId?: string
): boolean {
  if (!session) return false
  if (session.role === 'admin') return true
  if (session.role === 'viewer') return false
  return projectOwnerId === session.userId
}

export function canManageIAM(session: UserSession | null): boolean {
  return session?.role === 'admin'
}
