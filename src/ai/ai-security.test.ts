import { describe, expect, it } from 'vitest'
import { ToolRegistry } from './tool-registry'
import { VirtualFS } from '../fs/virtual-fs'
import { fetchSkillFromUrl, parseSkillMarkdown } from './memory/skill-importer'

describe('AI Security & Vulnerability Audits', () => {
  const fs = new VirtualFS()
  const registry = new ToolRegistry({ fs, mainFile: 'main.tex' })

  describe('Path Traversal Mitigations', () => {
    it('blocks directory traversal attempts in read_file', async () => {
      const res = await registry.execute('read_file', { path: '../../etc/passwd' })
      expect(res).toContain('Error: Directory traversal with \'..\' is forbidden')
    })

    it('blocks windows-style backslash traversal in read_file', async () => {
      const res = await registry.execute('read_file', { path: '..\\..\\secret.env' })
      expect(res).toContain('Error: Directory traversal with \'..\' is forbidden')
    })

    it('blocks null byte injection in read_file', async () => {
      const res = await registry.execute('read_file', { path: 'main.tex\0.png' })
      expect(res).toContain('Error: Null bytes in path are forbidden')
    })

    it('blocks directory traversal attempts in write_file', async () => {
      const res = await registry.execute('write_file', {
        path: '../../../root.sh',
        content: 'malicious',
      })
      expect(res).toContain('Error: Directory traversal with \'..\' is forbidden')
    })

    it('blocks empty path execution', async () => {
      const res = await registry.execute('read_file', { path: '   ' })
      expect(res).toContain('Error: Path cannot be empty')
    })

    it('protects main root document from deletion', async () => {
      const res = await registry.execute('delete_file', { path: 'main.tex' })
      expect(res).toContain('Error: Cannot delete the project main document \'main.tex\'')
      expect(fs.readFile('main.tex')).not.toBeNull()
    })

    it('enforces maximum file write size limit (5 MB) to prevent memory DoS', async () => {
      const hugeContent = 'x'.repeat(5 * 1024 * 1024 + 10)
      const res = await registry.execute('write_file', {
        path: 'huge.tex',
        content: hugeContent,
      })
      expect(res).toContain('Error: Content exceeds maximum allowed size of 5 MB')
    })
  })

  describe('ReDoS (Catastrophic Backtracking) Protections', () => {
    it('neutralizes nested quantifier regex patterns in search_project without hanging', async () => {
      // Classic ReDoS pattern: (a+)+$
      const start = Date.now()
      const res = await registry.execute('search_project', { pattern: '(a+)+$' })
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(1000)
      expect(res).toBeDefined()
    })

    it('falls back to literal search for overly long pattern strings', async () => {
      const longPattern = 'a'.repeat(200)
      const res = await registry.execute('search_project', { pattern: longPattern })
      expect(res).toContain(`No matches found for '${longPattern}'`)
    })
  })

  describe('SSRF Protections in Skill Importer', () => {
    it('blocks loopback / localhost SSRF requests', async () => {
      await expect(fetchSkillFromUrl('http://localhost:8080/exploit')).rejects.toThrow(
        /Akses ke host privat 'localhost' tidak diizinkan/
      )
      await expect(fetchSkillFromUrl('http://127.0.0.1:3000/SKILL.md')).rejects.toThrow(
        /Akses ke host privat '127.0.0.1' tidak diizinkan/
      )
    })

    it('blocks cloud metadata endpoint SSRF (169.254.169.254)', async () => {
      await expect(
        fetchSkillFromUrl('http://169.254.169.254/latest/meta-data/')
      ).rejects.toThrow(/Akses ke host privat '169.254.169.254' tidak diizinkan/)
    })

    it('blocks non-HTTP protocols (javascript:, file:, data:)', async () => {
      await expect(fetchSkillFromUrl('javascript:alert(1)')).rejects.toThrow(
        /Hanya protokol HTTP dan HTTPS yang diizinkan/
      )
      await expect(fetchSkillFromUrl('file:///etc/passwd')).rejects.toThrow(
        /Hanya protokol HTTP dan HTTPS yang diizinkan/
      )
    })

    it('sanitizes dangerous characters in skill names into safe slugs', () => {
      const md = `---
name: "<script>alert('xss')</script> / dangerous name!@#"
description: "Test skill"
---
- rule 1
`
      const parsed = parseSkillMarkdown(md, 'default')
      expect(parsed.name).not.toContain('<script>')
      expect(parsed.name).not.toContain('<')
      expect(parsed.name).not.toContain('>')
      expect(parsed.name).not.toContain('/')
      expect(parsed.name).toMatch(/^[a-z0-9_-]+$/)
    })
  })
})
