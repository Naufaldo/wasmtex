import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_BUILTIN_SKILLS,
  deleteSkill,
  loadAllSkills,
  loadProjectMemory,
  updateProjectMemory,
  upsertSkill,
} from './skill-store'

const mockStorage = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, val: string) => mockStorage.set(key, String(val)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  length: 0,
  key: () => null,
} as unknown as Storage

describe('skill-store', () => {
  beforeEach(() => {
    mockStorage.clear()
  })

  it('loads builtin skills by default', () => {
    const skills = loadAllSkills()
    expect(skills.length).toBeGreaterThanOrEqual(DEFAULT_BUILTIN_SKILLS.length)
    expect(skills.some((s) => s.name === 'booktabs-tables')).toBe(true)
  })

  it('upserts and deletes skills', () => {
    const newSkill = upsertSkill({
      name: 'Custom TikZ Flowchart',
      description: 'Rules for industrial PLC flowcharts',
      rules: ['Always use rounded corners', 'Arrows must be >= 1.5pt'],
      trigger: 'flowchart, plc, ladder',
    })

    expect(newSkill.id).toBeDefined()
    expect(newSkill.name).toBe('custom-tikz-flowchart')

    const reloaded = loadAllSkills()
    expect(reloaded.some((s) => s.name === 'custom-tikz-flowchart')).toBe(true)

    const deleted = deleteSkill(newSkill.id)
    expect(deleted).toBe(true)
    const afterDelete = loadAllSkills()
    expect(afterDelete.some((s) => s.id === newSkill.id)).toBe(false)
  })

  it('manages project memory lifecycle', () => {
    const initial = loadProjectMemory('proj_test')
    expect(initial.projectId).toBe('proj_test')
    expect(initial.summary).toBe('')

    updateProjectMemory('proj_test', {
      summary: 'Penelitian adsorpsi CO2 menggunakan biochar termodifikasi',
      notationDecisions: ['q_e = kapasitas kesetimbangan', 'C_0 = konsentrasi awal'],
      activeTopic: 'Metodologi',
    })

    const updated = loadProjectMemory('proj_test')
    expect(updated.summary).toContain('biochar')
    expect(updated.notationDecisions).toHaveLength(2)
    expect(updated.activeTopic).toBe('Metodologi')
  })
})
