import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  resolveEffectiveTheme,
  saveSettings,
  SettingsModal,
  type ThemeMode,
} from './settings-modal'

describe('SettingsModal and preferences management', () => {
  let mockStore: Record<string, string> = {}

  beforeEach(() => {
    mockStore = {}
    const mockLocalStorage = {
      getItem: (k: string) => mockStore[k] ?? null,
      setItem: (k: string, v: string) => {
        mockStore[k] = v
      },
      removeItem: (k: string) => {
        delete mockStore[k]
      },
      clear: () => {
        mockStore = {}
      },
    }
    vi.stubGlobal('localStorage', mockLocalStorage)
    vi.restoreAllMocks()
  })

  it('loads default settings when localStorage is empty', () => {
    const s = loadSettings()
    expect(s.fontSize).toBe(14)
    expect(s.theme).toBe('auto')
    expect(s.compilerEngine).toBe('xelatex')
    expect(s.spellcheckLang).toBe('en_US')
    expect(s.bibEngine).toBe('bibtex')
  })

  it('persists and reloads updated settings', () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      fontSize: 16,
      theme: 'dark' as ThemeMode,
      compilerEngine: 'pdflatex' as const,
      spellcheckLang: 'id_ID' as const,
    }
    saveSettings(custom)

    const reloaded = loadSettings()
    expect(reloaded.fontSize).toBe(16)
    expect(reloaded.theme).toBe('dark')
    expect(reloaded.compilerEngine).toBe('pdflatex')
    expect(reloaded.spellcheckLang).toBe('id_ID')
  })

  it('resolves effective theme accurately for dark, light, and auto', () => {
    expect(resolveEffectiveTheme('dark')).toBe('dark')
    expect(resolveEffectiveTheme('light')).toBe('light')

    // Mock matchMedia for system auto mode
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    vi.stubGlobal('matchMedia', matchMediaMock)

    expect(resolveEffectiveTheme('auto')).toBe('dark')
  })

  it('instantiates SettingsModal and retrieves current settings', () => {
    const onApply = vi.fn()
    const modal = new SettingsModal({ onApplySettings: onApply })
    const current = modal.getSettings()
    expect(current.fontSize).toBe(14)
    expect(typeof modal.open).toBe('function')
    expect(typeof modal.close).toBe('function')
  })
})
