import type { ChatMessage, ProjectMemory, Skill } from '../types'

export interface CompactionStats {
  originalTokens: number
  compactedTokens: number
  savedTokens: number
  savedPercentage: number
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

export function estimateMessagesTokens(messages: ChatMessage[]): number {
  let count = 0
  for (const m of messages) {
    count += estimateTokenCount(m.content) + 4
    if (m.tool_calls) {
      for (const tc of m.tool_calls) {
        count +=
          estimateTokenCount(tc.function.name) + estimateTokenCount(tc.function.arguments) + 6
      }
    }
  }
  return count
}

function scoreSkill(s: Skill, normalized: string): number {
  let score = 0
  if (normalized.includes(s.name.toLowerCase())) score += 10
  if (s.trigger) {
    const triggers = s.trigger.split(',').map((t: string) => t.trim().toLowerCase())
    for (const t of triggers) {
      if (t && normalized.includes(t)) score += 5
    }
  }
  const words = s.description.toLowerCase().split(/\s+/)
  for (const w of words) {
    if (w.length > 3 && normalized.includes(w)) score += 1
  }
  return score
}

export function selectRelevantSkills(
  skills: Skill[],
  queryOrContext: string,
  maxBudgetTokens = 500,
): Skill[] {
  if (skills.length === 0) return []
  const normalized = queryOrContext.toLowerCase()
  const scored = skills
    .map((s) => ({ skill: s, score: scoreSkill(s, normalized) }))
    .sort((a, b) => b.score - a.score)

  const selected: Skill[] = []
  let budget = maxBudgetTokens

  for (const item of scored) {
    if (item.score === 0 && selected.length >= 2) break
    const cost = estimateTokenCount(`${item.skill.name}: ${item.skill.rules.join('; ')}`)
    if (budget - cost < 0 && selected.length > 0) break
    selected.push(item.skill)
    budget -= cost
  }

  return selected
}

export function formatSkillsPrompt(skills: Skill[]): string {
  if (skills.length === 0) return ''
  const lines = skills.map((s) => `- [${s.name}]: ${s.rules.join(' ')}`)
  return `### Learned Procedural Skills:\n${lines.join('\n')}`
}

export function formatProjectMemoryPrompt(memory: ProjectMemory): string {
  const parts: string[] = []
  if (memory.summary) parts.push(`- Goal/Summary: ${memory.summary}`)
  if (memory.activeTopic) parts.push(`- Active Focus: ${memory.activeTopic}`)
  if (memory.notationDecisions && memory.notationDecisions.length > 0) {
    parts.push(`- Standing Conventions: ${memory.notationDecisions.join('; ')}`)
  }
  if (parts.length === 0) return ''
  return `### Project Memory & Decisions:\n${parts.join('\n')}`
}

function summarizeOldMessage(m: ChatMessage): string {
  if (m.role === 'tool') {
    return `[Tool result: ${m.content.slice(0, 80).replace(/\n/g, ' ')}...]`
  }
  if (m.role === 'user') {
    return `User requested: "${m.content.slice(0, 100).replace(/\n/g, ' ')}"`
  }
  return `Assistant resolved: "${m.content.slice(0, 100).replace(/\n/g, ' ')}"`
}

export function compactChatHistory(
  messages: ChatMessage[],
  maxBudgetTokens = 3000,
  recentKeepCount = 4,
): { messages: ChatMessage[]; stats: CompactionStats } {
  const originalTokens = estimateMessagesTokens(messages)
  if (originalTokens <= maxBudgetTokens || messages.length <= recentKeepCount + 1) {
    return {
      messages,
      stats: {
        originalTokens,
        compactedTokens: originalTokens,
        savedTokens: 0,
        savedPercentage: 0,
      },
    }
  }

  const systemMessages = messages.filter((m) => m.role === 'system')
  const nonSystem = messages.filter((m) => m.role !== 'system')

  const splitIdx = Math.max(0, nonSystem.length - recentKeepCount)
  const olderMessages = nonSystem.slice(0, splitIdx)
  const recentMessages = nonSystem.slice(splitIdx)

  const summaryLines: string[] = []
  for (const m of olderMessages) {
    summaryLines.push(`• ${summarizeOldMessage(m)}`)
  }

  const summaryContent = `[Summary of earlier conversation turns (${olderMessages.length} messages compacted):\n${summaryLines.join('\n')}]`

  const compacted: ChatMessage[] = [
    ...systemMessages,
    { role: 'system', content: summaryContent },
    ...recentMessages,
  ]

  const compactedTokens = estimateMessagesTokens(compacted)
  const savedTokens = Math.max(0, originalTokens - compactedTokens)
  const savedPercentage = Math.round((savedTokens / originalTokens) * 100)

  return {
    messages: compacted,
    stats: {
      originalTokens,
      compactedTokens,
      savedTokens,
      savedPercentage,
    },
  }
}
