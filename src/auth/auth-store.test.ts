import { beforeEach, describe, expect, it } from 'vitest'
import {
  authenticate,
  canCreateProject,
  canDeleteProject,
  canEditProject,
  canManageIAM,
  changePassword,
  changeUsername,
  createUser,
  deleteUser,
  getAllUsers,
  getCurrentUser,
  initAccounts,
  logoutUser,
  type UserSession,
} from './auth-store'

// In-memory mock for Node test environment
const mockStorage = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, val: string) => mockStorage.set(key, String(val)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  length: 0,
  key: () => null,
} as unknown as Storage

describe('Auth Store & IAM Multi-Account System', () => {
  beforeEach(() => {
    localStorage.clear()
    initAccounts()
  })

  it('initializes default accounts with admin, researcher, and guest', () => {
    const users = getAllUsers()
    expect(users.length).toBe(3)
    expect(users.map((u) => u.username)).toEqual(['admin', 'researcher', 'guest'])
  })

  it('authenticates valid credentials and creates active session', () => {
    const res = authenticate('admin', 'cortex2026')
    expect(res.success).toBe(true)
    expect(res.session).toBeDefined()
    expect(res.session?.username).toBe('admin')
    expect(res.session?.role).toBe('admin')

    const current = getCurrentUser()
    expect(current?.userId).toBe('usr_admin')
  })

  it('rejects invalid password or non-existent username', () => {
    const badPass = authenticate('admin', 'wrongpass')
    expect(badPass.success).toBe(false)
    expect(badPass.error).toContain('Password salah')

    const badUser = authenticate('nonexistent', 'cortex2026')
    expect(badUser.success).toBe(false)
    expect(badUser.error).toContain('Akun tidak ditemukan')
  })

  it('allows user to change username without collision', () => {
    authenticate('researcher', 'cortex2026')
    const updateRes = changeUsername('usr_researcher', 'dr_aris')
    expect(updateRes.success).toBe(true)

    const updatedUser = getAllUsers().find((u) => u.id === 'usr_researcher')
    expect(updatedUser?.username).toBe('dr_aris')

    const current = getCurrentUser()
    expect(current?.username).toBe('dr_aris')

    // Disallow collision
    const colRes = changeUsername('usr_admin', 'dr_aris')
    expect(colRes.success).toBe(false)
    expect(colRes.error).toContain('sudah digunakan')
  })

  it('allows user to change password after verifying old password', () => {
    const auth = authenticate('guest', 'cortex2026')
    expect(auth.success).toBe(true)

    // Fail if old password is wrong
    const failRes = changePassword('usr_guest', 'wrong', 'newsecret123')
    expect(failRes.success).toBe(false)
    expect(failRes.error).toContain('Password lama tidak cocok')

    // Fail if new password too short
    const shortRes = changePassword('usr_guest', 'cortex2026', '123')
    expect(shortRes.success).toBe(false)
    expect(shortRes.error).toContain('minimal harus 6 karakter')

    // Success
    const successRes = changePassword('usr_guest', 'cortex2026', 'newsecret123')
    expect(successRes.success).toBe(true)

    // Verify login with new password
    logoutUser()
    const newAuth = authenticate('guest', 'newsecret123')
    expect(newAuth.success).toBe(true)
  })

  it('supports creating new accounts in IAM system', () => {
    const createRes = createUser('scientist1', 'lab2026', 'Dr. Sarah Connor', 'researcher')
    expect(createRes.success).toBe(true)
    expect(createRes.user?.username).toBe('scientist1')
    expect(createRes.user?.role).toBe('researcher')

    // Disallow duplicate username
    const dupRes = createUser('scientist1', 'lab2026', 'Duplicate', 'researcher')
    expect(dupRes.success).toBe(false)
    expect(dupRes.error).toContain('sudah digunakan')
  })

  it('prevents deleting master admin or last admin', () => {
    const delAdminRes = deleteUser('usr_admin')
    expect(delAdminRes.success).toBe(false)
    expect(delAdminRes.error).toContain('tidak dapat dihapus')

    // Deleting researcher is allowed
    const delResearcherRes = deleteUser('usr_researcher')
    expect(delResearcherRes.success).toBe(true)
    expect(getAllUsers().some((u) => u.id === 'usr_researcher')).toBe(false)
  })

  it('enforces RBAC permissions correctly', () => {
    const adminSession: UserSession = {
      userId: 'usr_admin',
      username: 'admin',
      name: 'Admin',
      role: 'admin',
      loggedInAt: Date.now(),
    }
    const researcherSession: UserSession = {
      userId: 'usr_res_1',
      username: 'res1',
      name: 'Res 1',
      role: 'researcher',
      loggedInAt: Date.now(),
    }
    const viewerSession: UserSession = {
      userId: 'usr_guest',
      username: 'guest',
      name: 'Guest',
      role: 'viewer',
      loggedInAt: Date.now(),
    }

    // Project creation
    expect(canCreateProject(adminSession)).toBe(true)
    expect(canCreateProject(researcherSession)).toBe(true)
    expect(canCreateProject(viewerSession)).toBe(false)

    // Project edit isolation
    expect(canEditProject(researcherSession, 'usr_res_1')).toBe(true)
    expect(canEditProject(researcherSession, 'usr_other')).toBe(false)
    expect(canEditProject(adminSession, 'usr_other')).toBe(true) // Admin can edit any
    expect(canEditProject(viewerSession, 'usr_guest')).toBe(false) // Viewer cannot edit

    // Project delete isolation
    expect(canDeleteProject(researcherSession, 'usr_res_1')).toBe(true)
    expect(canDeleteProject(researcherSession, 'usr_other')).toBe(false)
    expect(canDeleteProject(adminSession, 'usr_other')).toBe(true)

    // IAM management
    expect(canManageIAM(adminSession)).toBe(true)
    expect(canManageIAM(researcherSession)).toBe(false)
    expect(canManageIAM(viewerSession)).toBe(false)
  })
})
