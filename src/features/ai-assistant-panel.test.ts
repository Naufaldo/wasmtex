import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiAssistantPanel, loadAiConfig, saveAiConfig } from './ai-assistant-panel'

const mockStorage = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, val: string) => mockStorage.set(key, String(val)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  length: 0,
  key: () => null,
} as unknown as Storage

interface MockElement {
  id: string
  className: string
  innerHTML: string
  dataset: Record<string, string>
  querySelector: (sel: string) => MockElement | null
  querySelectorAll: (sel: string) => MockElement[]
  addEventListener: (event: string, handler: (e: unknown) => void) => void
  remove: () => void
}

let mockBodyChildren: MockElement[] = []

globalThis.document = {
  body: {
    appendChild: (el: MockElement) => mockBodyChildren.push(el),
  },
  getElementById: (id: string) => mockBodyChildren.find((el) => el.id === id) ?? null,
  createElement: () => {
    const el: MockElement = {
      id: '',
      className: '',
      innerHTML: '',
      dataset: {},
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      remove: () => {
        const idx = mockBodyChildren.indexOf(el)
        if (idx !== -1) mockBodyChildren.splice(idx, 1)
      },
    }
    return el as unknown as HTMLElement
  },
} as unknown as Document

describe('AiAssistantPanel', () => {
  beforeEach(() => {
    mockStorage.clear()
    mockBodyChildren = []
  })

  it('loads default config and saves updated config', () => {
    const initial = loadAiConfig()
    expect(initial.provider).toBe('ollama')
    expect(initial.endpoint).toContain('localhost')

    saveAiConfig({
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-4o',
      locale: 'en',
    })

    const updated = loadAiConfig()
    expect(updated.provider).toBe('openai')
    expect(updated.apiKey).toBe('sk-test')
    expect(updated.locale).toBe('en')
  })

  it('opens and closes drawer lifecycle', () => {
    const onInsertText = vi.fn()
    const onReplaceSelection = vi.fn()
    const onRecompile = vi.fn()

    const panel = new AiAssistantPanel({
      getEditor: () => null,
      getCompilerErrors: () => [],
      onInsertText,
      onReplaceSelection,
      onRecompile,
    })

    panel.open()
    expect(document.getElementById('ai-assistant-drawer')).not.toBeNull()

    panel.close()
    expect(document.getElementById('ai-assistant-drawer')).toBeNull()
  })
})
