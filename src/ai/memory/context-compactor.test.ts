import { describe, expect, it } from 'vitest'
import type { ChatMessage, Skill } from '../types'
import {
  compactChatHistory,
  estimateTokenCount,
  formatProjectMemoryPrompt,
  formatSkillsPrompt,
  selectRelevantSkills,
} from './context-compactor'

describe('context-compactor', () => {
  it('estimates tokens accurately by character heuristics', () => {
    expect(estimateTokenCount('test')).toBe(1)
    expect(estimateTokenCount('a'.repeat(400))).toBe(100)
  })

  it('selects relevant skills based on triggers and context', () => {
    const skills: Skill[] = [
      {
        id: 's1',
        name: 'booktabs-tables',
        description: 'Table guidelines',
        rules: ['Rule 1'],
        trigger: 'table, tabular, tabel',
        updatedAt: 1,
      },
      {
        id: 's2',
        name: 'equations',
        description: 'Math rules',
        rules: ['Rule 2'],
        trigger: 'math, equation, align',
        updatedAt: 1,
      },
      {
        id: 's3',
        name: 'quantum-physics',
        description: 'Bra-ket notation',
        rules: ['Rule 3'],
        trigger: 'hamiltonian, wave',
        updatedAt: 1,
      },
    ]

    const selected = selectRelevantSkills(skills, 'Tolong buatkan tabel perbandingan akurasi')
    expect(selected.some((s) => s.name === 'booktabs-tables')).toBe(true)
    expect(selected[0]?.name).toBe('booktabs-tables')
  })

  it('formats skills and project memory prompts cleanly', () => {
    const formatted = formatSkillsPrompt([
      {
        id: 's1',
        name: 'booktabs-tables',
        description: 'desc',
        rules: ['Use toprule', 'No vertical lines'],
        updatedAt: 1,
      },
    ])
    expect(formatted).toContain('### Learned Procedural Skills:')
    expect(formatted).toContain('- [booktabs-tables]: Use toprule No vertical lines')

    const memFormatted = formatProjectMemoryPrompt({
      projectId: 'p1',
      summary: 'Biochar study',
      notationDecisions: ['q_e for capacity'],
      activeTopic: 'Results',
      updatedAt: 1,
    })
    expect(memFormatted).toContain('### Project Memory & Decisions:')
    expect(memFormatted).toContain('Goal/Summary: Biochar study')
    expect(memFormatted).toContain('Standing Conventions: q_e for capacity')
  })

  it('compacts large chat history when exceeding budget', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'Base system prompt' },
      { role: 'user', content: 'Turn 1 question '.repeat(80) },
      { role: 'assistant', content: 'Turn 1 answer '.repeat(80) },
      { role: 'user', content: 'Turn 2 question '.repeat(80) },
      { role: 'assistant', content: 'Turn 2 answer '.repeat(80) },
      { role: 'user', content: 'Turn 3 question '.repeat(80) },
      { role: 'assistant', content: 'Turn 3 answer '.repeat(80) },
      { role: 'user', content: 'Recent question' },
      { role: 'assistant', content: 'Recent answer' },
    ]

    const { messages: compacted, stats } = compactChatHistory(messages, 500, 2)

    expect(stats.savedTokens).toBeGreaterThan(0)
    expect(stats.savedPercentage).toBeGreaterThan(0)
    expect(compacted.some((m) => m.content.includes('Summary of earlier conversation turns'))).toBe(
      true,
    )
    expect(compacted[compacted.length - 1]?.content).toBe('Recent answer')
  })
})
