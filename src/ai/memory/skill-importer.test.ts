import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CURATED_COMMUNITY_SKILLS,
  fetchSkillFromUrl,
  normalizeGitHubRawUrl,
  parseSkillMarkdown,
} from './skill-importer'

describe('skill-importer', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('normalizes GitHub URLs to raw content URLs', () => {
    const repoUrl = 'https://github.com/blader/humanizer'
    expect(normalizeGitHubRawUrl(repoUrl)).toBe(
      'https://raw.githubusercontent.com/blader/humanizer/main/SKILL.md',
    )

    const blobUrl =
      'https://github.com/K-Dense-AI/scientific-agent-skills/blob/main/skills/cellprofiler/SKILL.md'
    expect(normalizeGitHubRawUrl(blobUrl)).toBe(
      'https://raw.githubusercontent.com/K-Dense-AI/scientific-agent-skills/main/skills/cellprofiler/SKILL.md',
    )
  })

  it('parses markdown with YAML frontmatter', () => {
    const raw = `---
name: humanizer
description: Strip AI writing tells
trigger: humanize, rewrite
---
# Humanizer
- Never use "Not X but Y"
- Remove "Let that sink in"
- Prefer active voice
`
    const parsed = parseSkillMarkdown(raw)
    expect(parsed.name).toBe('humanizer')
    expect(parsed.description).toBe('Strip AI writing tells')
    expect(parsed.trigger).toBe('humanize, rewrite')
    expect(parsed.rules).toHaveLength(3)
    expect(parsed.rules[0]).toBe('Never use "Not X but Y"')
  })

  it('parses raw markdown without frontmatter using headings and bullets', () => {
    const raw = `# Scientific LaTeX Workflow
A guide for authoring reproducible papers.

1. Ensure all equations are numbered with eqref.
2. Use booktabs for clean academic tables.
3. Check DOI availability for all entries.
`
    const parsed = parseSkillMarkdown(raw, 'scientific-workflow')
    expect(parsed.name).toBe('scientific-workflow')
    expect(parsed.description).toBe('Scientific LaTeX Workflow')
    expect(parsed.rules).toHaveLength(3)
    expect(parsed.rules[1]).toContain('booktabs')
  })

  it('includes curated skills for humanizer and scientific-agent-skills', () => {
    expect(CURATED_COMMUNITY_SKILLS.some((s) => s.name === 'humanizer')).toBe(true)
    expect(CURATED_COMMUNITY_SKILLS.some((s) => s.name === 'scientific-paper-writer')).toBe(true)
    expect(CURATED_COMMUNITY_SKILLS.some((s) => s.name === 'scientific-figure-standards')).toBe(
      true,
    )
  })

  it('fetches skill from URL and falls back to README if SKILL.md is missing', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith('SKILL.md')) {
        return { ok: false, status: 404, statusText: 'Not Found' } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () => `# Humanizer Guide\n- Rule 1: direct prose\n- Rule 2: active verbs`,
      } as Response
    })

    const skill = await fetchSkillFromUrl('https://github.com/blader/humanizer')
    expect(skill.name).toBe('humanizer')
    expect(skill.rules).toHaveLength(2)
  })
})
