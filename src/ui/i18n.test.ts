import { beforeEach, describe, expect, it } from 'vitest'
import { getLang, setLang, t, toggleLang } from './i18n'

const mockStorage = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, val: string) => mockStorage.set(key, String(val)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  length: 0,
  key: () => null,
} as unknown as Storage

describe('i18n Internationalization (ID & EN)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to Indonesian (id)', () => {
    expect(getLang()).toBe('id')
    expect(t('Halo', 'Hello')).toBe('Halo')
  })

  it('switches to English when setLang or toggleLang is called', () => {
    setLang('en')
    expect(getLang()).toBe('en')
    expect(t('Halo', 'Hello')).toBe('Hello')

    toggleLang()
    expect(getLang()).toBe('id')
    expect(t('Halo', 'Hello')).toBe('Halo')

    toggleLang()
    expect(getLang()).toBe('en')
    expect(t('Halo', 'Hello')).toBe('Hello')
  })
})
