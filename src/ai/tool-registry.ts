import type { VirtualFS } from '../fs/virtual-fs'
import type { WasmTexCompiler } from '../headless'
import type { LatexLanguageService } from '../lsp-service'
import {
  loadAllSkills,
  loadProjectMemory,
  updateProjectMemory,
  upsertSkill,
} from './memory/skill-store'
import type { ToolDefinition } from './types'

export interface ToolRegistryOptions {
  fs: VirtualFS
  lsp?: LatexLanguageService | null | undefined
  compiler?: WasmTexCompiler | null | undefined
  mainFile?: string | undefined
  projectId?: string | undefined
}

function sanitizePath(raw: string): string {
  const clean = raw.replace(/\\/g, '/').replace(/^\/+/, '').trim()
  if (!clean) {
    throw new Error('Path cannot be empty')
  }
  if (clean.includes('\0')) {
    throw new Error('Null bytes in path are forbidden')
  }
  const segments = clean.split('/')
  if (segments.some((s) => s === '..')) {
    throw new Error(`Directory traversal with '..' is forbidden: '${raw}'`)
  }
  return clean
}

export class ToolRegistry {
  private fs: VirtualFS
  private lsp: LatexLanguageService | null
  private compiler: WasmTexCompiler | null
  private mainFile: string
  private projectId: string

  constructor(options: ToolRegistryOptions) {
    this.fs = options.fs
    this.lsp = options.lsp ?? null
    this.compiler = options.compiler ?? null
    this.mainFile = options.mainFile ?? 'main.tex'
    this.projectId = options.projectId ?? 'default'
  }

  getTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [
      {
        name: 'read_file',
        description: 'Read the text content of a file in the project virtual filesystem.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Relative path of the file to read' },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_files',
        description: 'List all files currently in the project.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'write_file',
        description: 'Write or overwrite a file in the project. Requires user approval.',
        requiresApproval: true,
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Relative path of the file' },
            content: { type: 'string', description: 'Full text content of the file' },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'delete_file',
        description: 'Delete a file from the project. Requires user approval.',
        requiresApproval: true,
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Relative path of the file to delete' },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_project',
        description: 'Search for text or regex across all project files.',
        parameters: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Text or regex pattern to search for' },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'learn_skill',
        description:
          'Save or update a learned procedural skill (imperative rules and triggers) for future sessions.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Short hyphenated skill name' },
            description: { type: 'string', description: 'What this skill does' },
            rules: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of specific, imperative LaTeX or writing rules',
            },
            trigger: { type: 'string', description: 'Keywords that activate this skill' },
          },
          required: ['name', 'description', 'rules'],
        },
      },
      {
        name: 'get_skills',
        description: 'List all learned skills and procedural rules available.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_project_memory',
        description:
          'Get stored goal, focus, and standing notation/style decisions for this project.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'update_project_memory',
        description:
          'Update project summary, active focus topic, or add standing notation conventions.',
        parameters: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Concise summary of project goal' },
            activeTopic: { type: 'string', description: 'Current active section/topic focus' },
            notationDecisions: {
              type: 'array',
              items: { type: 'string' },
              description: 'New notation, math symbol, or formatting rules to remember',
            },
          },
        },
      },
    ]

    if (this.compiler) {
      tools.push({
        name: 'compile',
        description: 'Compile the LaTeX project and return compile status and errors.',
        parameters: {
          type: 'object',
          properties: {},
        },
      })
    }

    if (this.lsp) {
      tools.push(
        {
          name: 'get_diagnostics',
          description: 'Get active LSP syntax and reference diagnostics/errors for the project.',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_outline',
          description: 'Get document section outline structure (sections, subsections).',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path to inspect (defaults to main document)',
              },
            },
          },
        },
      )
    }

    return tools
  }

  private buildRegex(pattern: string): RegExp {
    const safeLiteral = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Safety against catastrophic backtracking / ReDoS
    if (pattern.length > 150) {
      return new RegExp(safeLiteral, 'gi')
    }
    if (/([+*?]|\{\d+,?\d*\})\s*([+*?]|\{\d+,?\d*\})/.test(pattern)) {
      return new RegExp(safeLiteral, 'gi')
    }
    try {
      return new RegExp(pattern, 'gi')
    } catch {
      return new RegExp(safeLiteral, 'gi')
    }
  }

  private matchFileLines(
    file: string,
    raw: string | Uint8Array,
    reg: RegExp,
    matches: Array<{ file: string; line: number; text: string }>,
  ): void {
    const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw)
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      if (reg.test(line)) {
        matches.push({ file, line: i + 1, text: line.trim() })
        if (matches.length >= 50) return
      }
    }
  }

  private searchProject(pattern: string): string {
    const files = this.fs.listFiles()
    const matches: Array<{ file: string; line: number; text: string }> = []
    const reg = this.buildRegex(pattern)

    for (const file of files) {
      const raw = this.fs.readFile(file)
      if (raw !== null) {
        this.matchFileLines(file, raw, reg, matches)
        if (matches.length >= 50) break
      }
    }

    if (matches.length === 0) return `No matches found for '${pattern}'.`
    return JSON.stringify(matches, null, 2)
  }

  private getHandlers(): Record<
    string,
    (args: Record<string, unknown>) => Promise<string> | string
  > {
    return {
      read_file: (args) => {
        let path: string
        try {
          path = sanitizePath(String(args.path ?? ''))
        } catch (err) {
          return `Error: ${(err as Error).message}`
        }
        const content = this.fs.readFile(path)
        if (content === null) return `Error: File '${path}' not found.`
        return typeof content === 'string' ? content : new TextDecoder().decode(content)
      },
      list_files: () => JSON.stringify(this.fs.listFiles()),
      write_file: (args) => {
        let path: string
        try {
          path = sanitizePath(String(args.path ?? ''))
        } catch (err) {
          return `Error: ${(err as Error).message}`
        }
        const content = String(args.content ?? '')
        if (content.length > 5 * 1024 * 1024) {
          return `Error: Content exceeds maximum allowed size of 5 MB (${content.length} bytes).`
        }
        this.fs.writeFile(path, content)
        this.lsp?.updateFile(path, content)
        return `File '${path}' written successfully (${content.length} chars).`
      },
      delete_file: (args) => {
        let path: string
        try {
          path = sanitizePath(String(args.path ?? ''))
        } catch (err) {
          return `Error: ${(err as Error).message}`
        }
        if (path === this.mainFile) {
          return `Error: Cannot delete the project main document '${path}'.`
        }
        const deleted = this.fs.deleteFile(path)
        if (!deleted) return `Error: File '${path}' could not be deleted or does not exist.`
        this.lsp?.removeFile(path)
        return `File '${path}' deleted successfully.`
      },
      search_project: (args) => this.searchProject(String(args.pattern ?? '')),
      compile: async () => {
        if (!this.compiler) return 'Error: Compiler is not available in this session.'
        const res = await this.compiler.compile()
        return JSON.stringify(
          {
            success: res.success,
            compileTime: res.compileTime,
            errors: res.errors.map((e) => ({
              message: e.message,
              file: e.file,
              line: e.line,
            })),
            logSnippet: res.log.slice(-1500),
          },
          null,
          2,
        )
      },
      get_diagnostics: () => {
        if (!this.lsp) return 'Error: Language service is not available.'
        return JSON.stringify(
          this.lsp.getDiagnostics().map((d) => ({
            message: d.message,
            severity: d.severity,
            code: d.code,
            file: d.file,
            line: d.line,
          })),
          null,
          2,
        )
      },
      get_outline: (args) => {
        if (!this.lsp) return 'Error: Language service is not available.'
        const path = String(args.path ?? this.mainFile)
        return JSON.stringify(this.lsp.getOutline(path), null, 2)
      },
      learn_skill: (args) => {
        const name = String(args.name ?? '')
        const description = String(args.description ?? '')
        const rules = Array.isArray(args.rules) ? args.rules.map(String) : []
        const trigger = args.trigger ? String(args.trigger) : undefined
        if (!name || rules.length === 0)
          return 'Error: Skill name and at least one rule are required.'
        const saved = upsertSkill({ name, description, rules, trigger })
        return `Skill '${saved.name}' learned and saved successfully with ${saved.rules.length} rules.`
      },
      get_skills: () => {
        const skills = loadAllSkills()
        return JSON.stringify(
          skills.map((s) => ({
            name: s.name,
            description: s.description,
            rules: s.rules,
            trigger: s.trigger,
          })),
          null,
          2,
        )
      },
      get_project_memory: () => {
        const mem = loadProjectMemory(this.projectId)
        return JSON.stringify(mem, null, 2)
      },
      update_project_memory: (args) => {
        const memUpdates: Parameters<typeof updateProjectMemory>[1] = {}
        if (args.summary) memUpdates.summary = String(args.summary)
        if (args.activeTopic) memUpdates.activeTopic = String(args.activeTopic)
        if (Array.isArray(args.notationDecisions)) {
          memUpdates.notationDecisions = args.notationDecisions.map(String)
        }

        const updated = updateProjectMemory(this.projectId, memUpdates)
        return `Project memory updated for '${updated.projectId}'.`
      },
    }
  }

  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const handler = this.getHandlers()[name]
    if (!handler) return `Error: Unknown tool '${name}'.`
    return await handler(args)
  }
}
