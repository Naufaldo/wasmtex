import { describe, expect, it, vi } from 'vitest'
import { VirtualFS } from '../fs/virtual-fs'
import type { WasmTexCompiler } from '../headless'
import type { LatexLanguageService } from '../lsp-service'
import { ToolRegistry } from './tool-registry'

describe('ToolRegistry', () => {
  it('registers basic file tools when compiler and lsp are null', () => {
    const fs = new VirtualFS({ empty: true })
    const registry = new ToolRegistry({ fs })
    const tools = registry.getTools()
    const names = tools.map((t) => t.name)

    expect(names).toContain('read_file')
    expect(names).toContain('write_file')
    expect(names).toContain('list_files')
    expect(names).toContain('delete_file')
    expect(names).toContain('search_project')
    expect(names).not.toContain('compile')
    expect(names).not.toContain('get_diagnostics')
  })

  it('executes read_file, write_file, list_files, and delete_file', async () => {
    const fs = new VirtualFS({ empty: true })
    const registry = new ToolRegistry({ fs })

    // Write file
    const writeRes = await registry.execute('write_file', {
      path: 'intro.tex',
      content: '\\section{Introduction}\nWelcome to WasmTex AI.',
    })
    expect(writeRes).toContain('written successfully')
    expect(fs.readFile('intro.tex')).toBe('\\section{Introduction}\nWelcome to WasmTex AI.')

    // List files
    const listRes = await registry.execute('list_files', {})
    expect(JSON.parse(listRes)).toContain('intro.tex')

    // Read file
    const readRes = await registry.execute('read_file', { path: 'intro.tex' })
    expect(readRes).toContain('\\section{Introduction}')

    // Read non-existent file
    const notFound = await registry.execute('read_file', { path: 'ghost.tex' })
    expect(notFound).toContain("Error: File 'ghost.tex' not found.")

    // Delete file
    const delRes = await registry.execute('delete_file', { path: 'intro.tex' })
    expect(delRes).toContain('deleted successfully')
    expect(fs.readFile('intro.tex')).toBeNull()
  })

  it('searches project files with pattern', async () => {
    const fs = new VirtualFS({ empty: true })
    fs.writeFile(
      'main.tex',
      '\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}',
    )
    fs.writeFile('extra.tex', 'Some other notes with Hello keyword.')

    const registry = new ToolRegistry({ fs })
    const res = await registry.execute('search_project', { pattern: 'Hello' })
    const matches = JSON.parse(res) as Array<{ file: string; line: number; text: string }>

    expect(matches).toHaveLength(2)
    expect(matches[0]?.file).toBe('extra.tex')
    expect(matches[1]?.file).toBe('main.tex')
  })

  it('executes compile tool when compiler is provided', async () => {
    const fs = new VirtualFS({ empty: true })
    const mockCompiler = {
      compile: vi.fn().mockResolvedValue({
        success: true,
        compileTime: 120,
        errors: [],
        log: 'Output written on main.pdf (1 page).',
      }),
    } as unknown as WasmTexCompiler

    const registry = new ToolRegistry({ fs, compiler: mockCompiler })
    const tools = registry.getTools()
    expect(tools.map((t) => t.name)).toContain('compile')

    const res = await registry.execute('compile', {})
    const parsed = JSON.parse(res)
    expect(parsed.success).toBe(true)
    expect(mockCompiler.compile).toHaveBeenCalledTimes(1)
  })

  it('executes lsp tools when lsp is provided', async () => {
    const fs = new VirtualFS({ empty: true })
    const mockLsp = {
      getDiagnostics: vi.fn().mockReturnValue([
        {
          message: 'Undefined control sequence',
          severity: 1,
          code: 'tex-error',
          file: 'main.tex',
          line: 5,
        },
      ]),
      getOutline: vi.fn().mockReturnValue([{ title: 'Intro', level: 1, line: 2 }]),
      updateFile: vi.fn(),
      removeFile: vi.fn(),
    } as unknown as LatexLanguageService

    const registry = new ToolRegistry({ fs, lsp: mockLsp })
    const diagRes = await registry.execute('get_diagnostics', {})
    const diags = JSON.parse(diagRes)
    expect(diags).toHaveLength(1)
    expect(diags[0].message).toBe('Undefined control sequence')

    const outlineRes = await registry.execute('get_outline', { path: 'main.tex' })
    const outline = JSON.parse(outlineRes)
    expect(outline).toHaveLength(1)
    expect(outline[0].title).toBe('Intro')
  })
})
