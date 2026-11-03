import { describe, expect, it, vi } from 'vitest'
import { VisualEditor } from './visual-editor'

// biome-ignore lint/suspicious/noExplicitAny: test DOM mock
function createMockElement(tag: string): any {
  // biome-ignore lint/suspicious/noExplicitAny: test DOM mock
  const children: any[] = []
  const attrs = new Map<string, string>()
  const classList = new Set<string>()
  const listeners = new Map<string, Function[]>()

  // biome-ignore lint/suspicious/noExplicitAny: test DOM mock
  const el: any = {
    tagName: tag.toUpperCase(),
    children,
    childNodes: children,
    innerHTML: '',
    textContent: '',
    scrollIntoView: vi.fn(),
    setAttribute: (k: string, v: string) => attrs.set(k, String(v)),
    getAttribute: (k: string) => attrs.get(k) ?? null,
    hasAttribute: (k: string) => attrs.has(k),
    classList: {
      add: (c: string) => classList.add(c),
      remove: (c: string) => classList.delete(c),
      contains: (c: string) => classList.has(c),
    },
    addEventListener: (evt: string, fn: Function) => {
      if (!listeners.has(evt)) listeners.set(evt, [])
      listeners.get(evt)!.push(fn)
    },
    querySelector: (sel: string) => {
      if (sel === '#ve-editable-body') return el
      return null
    },
    querySelectorAll: (_sel: string) => {
      return []
    },
    closest: (_sel: string) => null,
  }
  return el
}

describe('VisualEditor WYSIWYG SyncTeX & Line Mapping', () => {
  it('instantiates VisualEditor without error', () => {
    const mockContainer = createMockElement('div')
    const editor = new VisualEditor(mockContainer, {
      onContentChange: vi.fn(),
    })
    expect(editor).toBeDefined()
  })

  it('exposes revealLine method for PDF inverse search sync', () => {
    const mockContainer = createMockElement('div')
    const editor = new VisualEditor(mockContainer, {
      onContentChange: vi.fn(),
    })
    expect(typeof editor.revealLine).toBe('function')
    editor.revealLine(42)
  })
})
