import katex from 'katex'

export interface VisualEditorOptions {
  onContentChange: (latex: string) => void
  onLineClick?: (line: number) => void
}

function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
    })
  } catch {
    return escapeHtml(latex)
  }
}

export class VisualEditor {
  private container: HTMLElement
  private options: VisualEditorOptions
  private preamble = ''
  private postamble = '\\end{document}'
  private isUpdatingFromCode = false
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

  constructor(container: HTMLElement, options: VisualEditorOptions) {
    this.container = container
    this.options = options
    this.initLayout()
  }

  private initLayout(): void {
    this.container.innerHTML = `
      <div class="ve-root">
        <!-- Word-Style Formatting Ribbon / Toolbar -->
        <div class="ve-toolbar">
          <!-- Undo / Redo -->
          <div class="ve-btn-group">
            <button class="ve-tool-btn" data-command="undo" title="Undo (Ctrl+Z)">↺</button>
            <button class="ve-tool-btn" data-command="redo" title="Redo (Ctrl+Y)">↻</button>
          </div>

          <!-- Section Level / Style Dropdown -->
          <div class="ve-btn-group">
            <select id="ve-style-select" class="ve-tool-select" title="Paragraph Style / Section Level">
              <option value="p">Paragraph (Normal)</option>
              <option value="h1">Heading 1 (Section)</option>
              <option value="h2">Heading 2 (Subsection)</option>
              <option value="h3">Heading 3 (Subsubsection)</option>
            </select>
          </div>

          <!-- Basic Font Formatting -->
          <div class="ve-btn-group">
            <button class="ve-tool-btn" data-command="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
            <button class="ve-tool-btn" data-command="italic" title="Italic (Ctrl+I)"><em>I</em></button>
            <button class="ve-tool-btn" data-command="underline" title="Underline (Ctrl+U)"><u>U</u></button>
            <button class="ve-tool-btn" data-command="strikeThrough" title="Strikethrough"><s>S</s></button>
          </div>

          <!-- Text Alignment -->
          <div class="ve-btn-group">
            <button class="ve-tool-btn" data-command="justifyLeft" title="Align Left">⇤</button>
            <button class="ve-tool-btn" data-command="justifyCenter" title="Center">⇥⇤</button>
            <button class="ve-tool-btn" data-command="justifyRight" title="Align Right">⇥</button>
          </div>

          <!-- Lists & Abstract -->
          <div class="ve-btn-group">
            <button class="ve-tool-btn" data-command="insertUnorderedList" title="Bullet List">• List</button>
            <button class="ve-tool-btn" data-command="insertOrderedList" title="Numbered List">1. List</button>
            <button class="ve-tool-btn" id="ve-btn-abstract" title="Insert Abstract Box">📄 Abstract</button>
          </div>

          <!-- Insert Objects (Direct Typing, Zero Popups) -->
          <div class="ve-btn-group">
            <button class="ve-tool-btn" id="ve-btn-math" title="Insert Word-style Equation Box">∑ Equation</button>
            <button class="ve-tool-btn" id="ve-btn-cite" title="Insert Inline Citation Tag">🏷️ Cite</button>
            <button class="ve-tool-btn" id="ve-btn-ref" title="Insert Cross-Reference">🔗 Ref</button>
            <button class="ve-tool-btn" id="ve-btn-table" title="Insert 3x3 Table">📊 Table</button>
            <button class="ve-tool-btn" id="ve-btn-figure" title="Insert Figure Box">🖼️ Figure</button>
            <button class="ve-tool-btn" id="ve-btn-link" title="Insert Link">🌐 Link</button>
            
            <div class="ve-symbol-dropdown-wrap">
              <button class="ve-tool-btn" id="ve-btn-symbol" title="Insert Special Symbol">Ω Symbol ▾</button>
              <div id="ve-symbol-menu" class="ve-symbol-menu" style="display:none;">
                <span class="ve-sym-item" data-sym="α">α</span>
                <span class="ve-sym-item" data-sym="β">β</span>
                <span class="ve-sym-item" data-sym="γ">γ</span>
                <span class="ve-sym-item" data-sym="δ">δ</span>
                <span class="ve-sym-item" data-sym="θ">θ</span>
                <span class="ve-sym-item" data-sym="λ">λ</span>
                <span class="ve-sym-item" data-sym="μ">μ</span>
                <span class="ve-sym-item" data-sym="π">π</span>
                <span class="ve-sym-item" data-sym="σ">σ</span>
                <span class="ve-sym-item" data-sym="ω">ω</span>
                <span class="ve-sym-item" data-sym="∑">∑</span>
                <span class="ve-sym-item" data-sym="∫">∫</span>
                <span class="ve-sym-item" data-sym="√">√</span>
                <span class="ve-sym-item" data-sym="±">±</span>
                <span class="ve-sym-item" data-sym="≤">≤</span>
                <span class="ve-sym-item" data-sym="≥">≥</span>
                <span class="ve-sym-item" data-sym="≠">≠</span>
                <span class="ve-sym-item" data-sym="≈">≈</span>
                <span class="ve-sym-item" data-sym="∞">∞</span>
                <span class="ve-sym-item" data-sym="→">→</span>
                <span class="ve-sym-item" data-sym="⇒">⇒</span>
                <span class="ve-sym-item" data-sym="∈">∈</span>
                <span class="ve-sym-item" data-sym="∀">∀</span>
                <span class="ve-sym-item" data-sym="∃">∃</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Visual Editor Canvas (Paper Page) -->
        <div class="ve-canvas-scroll">
          <div class="ve-paper" id="ve-editable-body" contenteditable="true" spellcheck="false">
            <p>Loading document...</p>
          </div>
        </div>
      </div>
    `

    this.bindEvents()
  }

  private bindEvents(): void {
    const toolbar = this.container.querySelector('.ve-toolbar')
    const editable = this.container.querySelector('#ve-editable-body') as HTMLElement

    // Standard formatting commands (bold, italic, underline, strike, lists, undo, redo, align)
    toolbar?.querySelectorAll<HTMLButtonElement>('.ve-tool-btn[data-command]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        const cmd = btn.getAttribute('data-command')!
        document.execCommand(cmd, false)
        editable.focus()
        this.triggerChange()
      })
    })

    // Section Level dropdown (Heading 1, 2, 3, Paragraph)
    const styleSelect = toolbar?.querySelector('#ve-style-select') as HTMLSelectElement | null
    styleSelect?.addEventListener('change', () => {
      const tag = styleSelect.value
      document.execCommand('formatBlock', false, tag)
      editable.focus()
      this.triggerChange()
    })

    // Insert Abstract Box
    toolbar?.querySelector('#ve-btn-abstract')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.insertHtmlAtCursor(`
        <div class="ve-abstract-card">
          <div class="ve-abstract-title">Abstract</div>
          <div class="ve-abstract-text"><p>Tuliskan ringkasan abstrak manuskrip Anda di sini...</p></div>
        </div>
        <p><br></p>
      `)
      this.triggerChange()
    })

    // Insert Equation Box (Direct inline typing, NO popup)
    toolbar?.querySelector('#ve-btn-math')?.addEventListener('click', (e) => {
      e.preventDefault()
      const defaultEq = 'E = mc^2'
      this.insertHtmlAtCursor(`
        <div class="ve-math-container" contenteditable="false" data-latex="${escapeAttr(defaultEq)}">
          <div class="ve-math-top-bar">
            <span class="ve-math-badge">∑ EQUATION</span>
            <input type="text" class="ve-math-inline-input" value="${escapeAttr(defaultEq)}" placeholder="Ketik rumus LaTeX di sini (contoh: \\int_0^1 x^2 dx)..." />
            <span class="ve-math-eq-num">(Eq)</span>
            <button type="button" class="ve-math-del-btn" title="Hapus persamaan">✕</button>
          </div>
          <div class="ve-math-rendered">${renderMath(defaultEq, true)}</div>
        </div>
        <p><br></p>
      `)
      this.triggerChange()
    })

    // Insert Citation Tag (Direct inline typing, NO popup)
    toolbar?.querySelector('#ve-btn-cite')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.insertHtmlAtCursor(`
        <span class="ve-cite-pill" contenteditable="false">[cite: <span class="ve-cite-key" contenteditable="true" spellcheck="false" title="Ketik citation key">cite_key</span>]</span>&nbsp;
      `)
      this.triggerChange()
    })

    // Insert Cross-Reference Tag (Direct inline typing, NO popup)
    toolbar?.querySelector('#ve-btn-ref')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.insertHtmlAtCursor(`
        <span class="ve-ref-pill" contenteditable="false">[ref: <span class="ve-ref-key" contenteditable="true" spellcheck="false" title="Ketik reference key">eq:1</span>]</span>&nbsp;
      `)
      this.triggerChange()
    })

    // Insert Table (3x3 Word-style editable table, NO popup)
    toolbar?.querySelector('#ve-btn-table')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.insertHtmlAtCursor(`
        <div class="ve-table-wrap" contenteditable="false">
          <table class="ve-table" contenteditable="true">
            <thead>
              <tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr>
            </thead>
            <tbody>
              <tr><td>Item A</td><td>Data 1</td><td>10.5</td></tr>
              <tr><td>Item B</td><td>Data 2</td><td>20.8</td></tr>
            </tbody>
          </table>
        </div>
        <p><br></p>
      `)
      this.triggerChange()
    })

    // Insert Figure Box (Word-style figure with placeholder and editable caption)
    toolbar?.querySelector('#ve-btn-figure')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.insertHtmlAtCursor(`
        <div class="ve-figure-card" contenteditable="false">
          <div class="ve-figure-graphic">[ 🖼️ FIGURE / GRAPHIC PLACEHOLDER ]</div>
          <div class="ve-figure-caption">
            <strong>Figure:</strong> <span class="ve-figure-caption-text" contenteditable="true">Deskripsi gambar atau diagram Anda di sini</span>
          </div>
        </div>
        <p><br></p>
      `)
      this.triggerChange()
    })

    // Insert Hyperlink (Direct inline editable link)
    toolbar?.querySelector('#ve-btn-link')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.insertHtmlAtCursor(`
        <a href="https://example.com" class="ve-link" target="_blank" contenteditable="true">https://example.com</a>&nbsp;
      `)
      this.triggerChange()
    })

    // Special Symbols Dropdown Menu
    const symBtn = toolbar?.querySelector('#ve-btn-symbol') as HTMLElement | null
    const symMenu = toolbar?.querySelector('#ve-symbol-menu') as HTMLElement | null

    symBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (symMenu) {
        symMenu.style.display = symMenu.style.display === 'none' ? 'grid' : 'none'
      }
    })

    if (typeof document !== 'undefined') {
      document.addEventListener('click', () => {
        if (symMenu) symMenu.style.display = 'none'
      })
    }

    symMenu?.querySelectorAll('.ve-sym-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const sym = item.getAttribute('data-sym')
        if (sym) {
          this.insertHtmlAtCursor(sym)
          this.triggerChange()
        }
        if (symMenu) symMenu.style.display = 'none'
      })
    })

    // Real-time input listener inside canvas (delegated for inputs, editable pills, and normal text)
    editable.addEventListener('input', (e) => {
      const target = e.target as HTMLElement

      // Math equation inline input typing
      if (target.classList.contains('ve-math-inline-input')) {
        const input = target as HTMLInputElement
        const container = input.closest('.ve-math-container') as HTMLElement | null
        if (container) {
          const val = input.value
          container.setAttribute('data-latex', val)
          const rendered = container.querySelector('.ve-math-rendered')
          if (rendered) {
            rendered.innerHTML = renderMath(val, true)
          }
        }
        this.triggerChange()
        return
      }

      // Citation key typing
      if (target.classList.contains('ve-cite-key')) {
        const pill = target.closest('.ve-cite-pill') as HTMLElement | null
        if (pill) {
          pill.setAttribute('data-cite', target.textContent?.trim() || '')
        }
        this.triggerChange()
        return
      }

      // Reference key typing
      if (target.classList.contains('ve-ref-key')) {
        const pill = target.closest('.ve-ref-pill') as HTMLElement | null
        if (pill) {
          pill.setAttribute('data-ref', target.textContent?.trim() || '')
        }
        this.triggerChange()
        return
      }

      // Standard text change
      if (this.isUpdatingFromCode) return
      this.triggerChange()
    })

    // Click delegation for equation delete button and bidirectional sync
    editable.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('ve-math-del-btn')) {
        e.stopPropagation()
        const container = target.closest('.ve-math-container')
        container?.remove()
        this.triggerChange()
        return
      }

      // Bidirectional click from Visual Editor -> jump Code & PDF
      const blockWithLine = target.closest<HTMLElement>('[data-line]')
      if (blockWithLine) {
        const line = parseInt(blockWithLine.getAttribute('data-line') || '0', 10)
        if (line > 0) {
          this.options.onLineClick?.(line)
        }
      }
    })
  }

  private triggerChange(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      const latex = this.serializeToLatex()
      this.options.onContentChange(latex)
    }, 450)
  }

  private insertHtmlAtCursor(html: string): void {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const el = document.createElement('div')
    el.innerHTML = html
    const frag = document.createDocumentFragment()
    let lastNode: ChildNode | null = null
    while (el.firstChild) {
      lastNode = frag.appendChild(el.firstChild)
    }
    range.insertNode(frag)
    if (lastNode) {
      range.setStartAfter(lastNode)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  /** Load and parse LaTeX into Visual Editor DOM */
  setLatex(latex: string): void {
    this.isUpdatingFromCode = true
    try {
      const { preamble, body, postamble, bodyStartLine } = splitLatex(latex)
      this.preamble = preamble
      this.postamble = postamble

      const editable = this.container.querySelector('#ve-editable-body') as HTMLElement
      if (!editable) return

      editable.innerHTML = parseLatexToHtml(body, bodyStartLine)
    } finally {
      this.isUpdatingFromCode = false
    }
  }

  /** Jump and visually highlight the corresponding section/paragraph in Visual WYSIWYG editor */
  revealLine(targetLine: number): void {
    const editable = this.container.querySelector('#ve-editable-body') as HTMLElement | null
    if (!editable) return

    const elements = Array.from(editable.querySelectorAll<HTMLElement>('[data-line]'))
    if (elements.length === 0) return

    let bestMatch: HTMLElement | null = null
    let minDistance = Infinity

    for (const el of elements) {
      const startLine = parseInt(el.getAttribute('data-line') || '0', 10)
      const endLineAttr = el.getAttribute('data-end-line')
      const endLine = endLineAttr ? parseInt(endLineAttr, 10) : startLine

      if (targetLine >= startLine && targetLine <= endLine) {
        bestMatch = el
        break
      }

      const dist = Math.abs(startLine - targetLine)
      if (dist < minDistance) {
        minDistance = dist
        bestMatch = el
      }
    }

    if (!bestMatch) {
      bestMatch = elements[0] || null
    }

    if (bestMatch) {
      editable.querySelectorAll('.ve-synctex-highlight').forEach((el) => {
        el.classList.remove('ve-synctex-highlight')
      })

      bestMatch.classList.add('ve-synctex-highlight')
      bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })

      setTimeout(() => {
        bestMatch?.classList.remove('ve-synctex-highlight')
      }, 3500)
    }
  }

  /** Serialize Visual Editor DOM back into full LaTeX document */
  private serializeToLatex(): string {
    const editable = this.container.querySelector('#ve-editable-body') as HTMLElement
    if (!editable) return ''

    const bodyLatex = serializeHtmlToLatex(editable)
    return `${this.preamble}\n\\begin{document}\n\n${bodyLatex}\n\n${this.postamble}`
  }
}

function splitLatex(latex: string): { preamble: string; body: string; postamble: string; bodyStartLine: number } {
  const docStart = latex.indexOf('\\begin{document}')
  if (docStart === -1) {
    return { preamble: '', body: latex, postamble: '', bodyStartLine: 1 }
  }

  const rawPreamble = latex.slice(0, docStart)
  const preambleLines = rawPreamble.split('\n').length
  const bodyStartLine = preambleLines + 1

  const preamble = rawPreamble.trim()
  const remainder = latex.slice(docStart + '\\begin{document}'.length)
  const docEnd = remainder.indexOf('\\end{document}')

  if (docEnd === -1) {
    return { preamble, body: remainder.trim(), postamble: '\\end{document}', bodyStartLine }
  }

  const body = remainder.slice(0, docEnd).trim()
  const postamble = remainder.slice(docEnd).trim()

  return { preamble, body, postamble, bodyStartLine }
}

function parseLatexToHtml(body: string, bodyStartLine = 1): string {
  if (!body.trim()) {
    return '<p data-line="1"><br></p>'
  }

  const lines = body.split('\n')
  const htmlParts: string[] = []
  let inList: 'itemize' | 'enumerate' | null = null
  let inAbstract = false
  let abstractStartLine = bodyStartLine
  let abstractContent = ''

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!
    const line = rawLine.trim()
    const currentLine = bodyStartLine + i

    // Abstract
    if (line.includes('\\begin{abstract}')) {
      inAbstract = true
      abstractStartLine = currentLine
      abstractContent = ''
      continue
    }
    if (inAbstract) {
      if (line.includes('\\end{abstract}')) {
        inAbstract = false
        htmlParts.push(`
          <div class="ve-abstract-card" data-line="${abstractStartLine}" data-end-line="${currentLine}">
            <div class="ve-abstract-title">Abstract</div>
            <div class="ve-abstract-text">${formatInlineLatex(abstractContent)}</div>
          </div>
        `)
      } else {
        abstractContent += (abstractContent ? ' ' : '') + line
      }
      continue
    }

    // Lists
    if (line.startsWith('\\begin{itemize}')) {
      inList = 'itemize'
      htmlParts.push('<ul>')
      continue
    }
    if (line.startsWith('\\end{itemize}')) {
      inList = null
      htmlParts.push('</ul>')
      continue
    }
    if (line.startsWith('\\begin{enumerate}')) {
      inList = 'enumerate'
      htmlParts.push('<ol>')
      continue
    }
    if (line.startsWith('\\end{enumerate}')) {
      inList = null
      htmlParts.push('</ol>')
      continue
    }

    if (inList && line.startsWith('\\item')) {
      const itemContent = line.replace(/^\\item\s*/, '')
      htmlParts.push(`<li data-line="${currentLine}">${formatInlineLatex(itemContent)}</li>`)
      continue
    }

    // Equations & Math blocks
    const isMathStart =
      line.startsWith('\\begin{equation}') ||
      line.startsWith('\\begin{equation*}') ||
      line.startsWith('\\begin{align}') ||
      line.startsWith('\\begin{align*}') ||
      line.startsWith('\\begin{gather}') ||
      line.startsWith('\\begin{gather*}') ||
      line.startsWith('\\begin{multline}') ||
      line.startsWith('\\[') ||
      line.startsWith('$$')

    if (isMathStart) {
      const eqStartLine = currentLine
      let eqLines = [line]
      while (i + 1 < lines.length) {
        i++
        eqLines.push(lines[i]!)
        if (
          lines[i]!.includes('\\end{equation}') ||
          lines[i]!.includes('\\end{equation*}') ||
          lines[i]!.includes('\\end{align}') ||
          lines[i]!.includes('\\end{align*}') ||
          lines[i]!.includes('\\end{gather}') ||
          lines[i]!.includes('\\end{gather*}') ||
          lines[i]!.includes('\\end{multline}') ||
          lines[i]!.includes('\\]') ||
          lines[i]!.includes('$$')
        ) {
          break
        }
      }
      const eqEndLine = bodyStartLine + i
      const rawEq = eqLines
        .join('\n')
        .replace(/\\begin\{(?:equation\*?|align\*?|gather\*?|multline)\}|\\end\{(?:equation\*?|align\*?|gather\*?|multline)\}|\\\[|\\\]|\$\$/g, '')
        .trim()
      htmlParts.push(`
        <div class="ve-math-container" data-line="${eqStartLine}" data-end-line="${eqEndLine}" contenteditable="false" data-latex="${escapeAttr(rawEq)}">
          <div class="ve-math-top-bar">
            <span class="ve-math-badge">∑ EQUATION</span>
            <input type="text" class="ve-math-inline-input" value="${escapeAttr(rawEq)}" placeholder="Ketik rumus LaTeX di sini..." />
            <span class="ve-math-eq-num">(Eq)</span>
            <button type="button" class="ve-math-del-btn" title="Hapus persamaan">✕</button>
          </div>
          <div class="ve-math-rendered">${renderMath(rawEq, true)}</div>
        </div>
      `)
      continue
    }

    // Tables
    if (line.includes('\\begin{tabular}')) {
      const tblStartLine = currentLine
      const tableLines = [line]
      while (i + 1 < lines.length) {
        i++
        tableLines.push(lines[i]!)
        if (lines[i]!.includes('\\end{tabular}')) break
      }
      const tblEndLine = bodyStartLine + i
      htmlParts.push(parseTabularToHtml(tableLines.join('\n'), tblStartLine, tblEndLine))
      continue
    }

    // Figures
    if (line.includes('\\begin{figure}')) {
      const figStartLine = currentLine
      const figLines = [line]
      while (i + 1 < lines.length) {
        i++
        figLines.push(lines[i]!)
        if (lines[i]!.includes('\\end{figure}')) break
      }
      const figEndLine = bodyStartLine + i
      const figBlock = figLines.join('\n')
      const capMatch = figBlock.match(/\\caption\{([^}]+)\}/)
      const caption = capMatch ? capMatch[1] : 'Figure description'
      htmlParts.push(`
        <div class="ve-figure-card" data-line="${figStartLine}" data-end-line="${figEndLine}" contenteditable="false">
          <div class="ve-figure-graphic">[ 🖼️ FIGURE / GRAPHIC PLACEHOLDER ]</div>
          <div class="ve-figure-caption">
            <strong>Figure:</strong> <span class="ve-figure-caption-text" contenteditable="true">${escapeHtml(caption!)}</span>
          </div>
        </div>
      `)
      continue
    }

    // Blank line or comments
    if (!line || line.startsWith('%')) {
      continue
    }

    // Page breaks
    if (line.startsWith('\\newpage') || line.startsWith('\\clearpage')) {
      htmlParts.push(`<div class="ve-page-break" data-line="${currentLine}" contenteditable="false">─── PAGE BREAK ───</div>`)
      continue
    }

    // Table of contents
    if (line.startsWith('\\tableofcontents')) {
      htmlParts.push(`<div class="ve-toc-box" data-line="${currentLine}" contenteditable="false">📖 Table of Contents (Disusun otomatis saat kompilasi PDF)</div>`)
      continue
    }

    // Theorem environments
    if (
      line.startsWith('\\begin{theorem}') ||
      line.startsWith('\\begin{lemma}') ||
      line.startsWith('\\begin{proposition}') ||
      line.startsWith('\\begin{example}')
    ) {
      const thmStartLine = currentLine
      const type = line.match(/\\begin\{([^}]+)\}/)?.[1] || 'Theorem'
      const thmLines: string[] = []
      while (i + 1 < lines.length) {
        i++
        if (lines[i]!.includes(`\\end{${type}}`)) break
        thmLines.push(lines[i]!)
      }
      const thmEndLine = bodyStartLine + i
      htmlParts.push(`
        <div class="ve-theorem-box" data-line="${thmStartLine}" data-end-line="${thmEndLine}" contenteditable="true" data-type="${type}">
          <span class="ve-theorem-title" contenteditable="false">${type}:</span>
          ${formatInlineLatex(thmLines.join(' '))}
        </div>
      `)
      continue
    }

    // Headings
    const secMatch = line.match(/^\\section\*?\{([^}]+)\}/)
    if (secMatch) {
      htmlParts.push(`<h1 data-line="${currentLine}">${escapeHtml(secMatch[1]!)}</h1>`)
      continue
    }
    const subsecMatch = line.match(/^\\subsection\*?\{([^}]+)\}/)
    if (subsecMatch) {
      htmlParts.push(`<h2 data-line="${currentLine}">${escapeHtml(subsecMatch[1]!)}</h2>`)
      continue
    }
    const subsubsecMatch = line.match(/^\\subsubsection\*?\{([^}]+)\}/)
    if (subsubsecMatch) {
      htmlParts.push(`<h3 data-line="${currentLine}">${escapeHtml(subsubsecMatch[1]!)}</h3>`)
      continue
    }

    // Title / author in body
    if (line.startsWith('\\maketitle')) {
      continue
    }

    // Blank line
    if (!line) {
      continue
    }

    // Paragraph
    htmlParts.push(`<p data-line="${currentLine}">${formatInlineLatex(line)}</p>`)
  }

  return htmlParts.join('\n')
}

function parseTabularToHtml(tabularBlock: string, startLine = 1, endLine = 1): string {
  const rows = tabularBlock
    .replace(/\\begin\{tabular\}\{[^}]+\}/, '')
    .replace(/\\end\{tabular\}/, '')
    .replace(/\\hline/g, '')
    .split('\\\\')
    .map((r) => r.trim())
    .filter((r) => r.length > 0)

  if (rows.length === 0) {
    return `<div class="ve-table-wrap" data-line="${startLine}" data-end-line="${endLine}" contenteditable="false"><table class="ve-table" contenteditable="true"><tbody><tr><td>Data</td></tr></tbody></table></div>`
  }

  const htmlRows: string[] = []
  rows.forEach((row, idx) => {
    const cells = row.split('&').map((c) => c.trim())
    const tag = idx === 0 ? 'th' : 'td'
    const cellHtml = cells.map((c) => `<${tag}>${formatInlineLatex(c)}</${tag}>`).join('')
    htmlRows.push(`<tr>${cellHtml}</tr>`)
  })

  return `
    <div class="ve-table-wrap" data-line="${startLine}" data-end-line="${endLine}" contenteditable="false">
      <table class="ve-table" contenteditable="true">
        <tbody>
          ${htmlRows.join('\n')}
        </tbody>
      </table>
    </div>
  `
}

function formatInlineLatex(text: string): string {
  // Protect inline math from HTML escaping so symbols like < and > remain intact
  const mathTokens: string[] = []
  let s = text.replace(/\$([^$]+)\$/g, (_m, math) => {
    const idx = mathTokens.length
    mathTokens.push(math)
    return `%%MATH_TOKEN_${idx}%%`
  })

  s = escapeHtml(s)

  // Bold
  s = s.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
  // Italic
  s = s.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
  s = s.replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>')
  // Underline
  s = s.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>')

  // Hyperlinks
  s = s.replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '<a href="$1" class="ve-link" target="_blank" contenteditable="true">$2</a>')

  // Citation \cite{...} (Direct inline typing, NO popup)
  s = s.replace(/\\cite\{([^}]+)\}/g, (_m, key) => {
    return `<span class="ve-cite-pill" contenteditable="false" data-cite="${escapeAttr(key)}">[cite: <span class="ve-cite-key" contenteditable="true" spellcheck="false" title="Ketik citation key">${escapeHtml(key)}</span>]</span>`
  })

  // Reference \ref{...} (Direct inline typing, NO popup)
  s = s.replace(/\\ref\{([^}]+)\}/g, (_m, key) => {
    return `<span class="ve-ref-pill" contenteditable="false" data-ref="${escapeAttr(key)}">[ref: <span class="ve-ref-key" contenteditable="true" spellcheck="false" title="Ketik reference key">${escapeHtml(key)}</span>]</span>`
  })
  s = s.replace(/\\eqref\{([^}]+)\}/g, (_m, key) => {
    return `<span class="ve-ref-pill" contenteditable="false" data-ref="${escapeAttr(key)}">[eq: <span class="ve-ref-key" contenteditable="true" spellcheck="false" title="Ketik reference key">${escapeHtml(key)}</span>]</span>`
  })

  // Labels & Includes
  s = s.replace(/\\label\{([^}]+)\}/g, '<span class="ve-label-badge" contenteditable="false">[label: $1]</span>')
  s = s.replace(/\\input\{([^}]+)\}/g, '<div class="ve-toc-box" contenteditable="false">📄 Include file: $1</div>')

  // Restore and render inline math via KaTeX
  s = s.replace(/%%MATH_TOKEN_(\d+)%%/g, (_m, idxStr) => {
    const math = mathTokens[parseInt(idxStr, 10)] || ''
    return `<span class="ve-inline-math" contenteditable="false" data-math="${escapeAttr(math)}" title="LaTeX: $${escapeAttr(math)}$">${renderMath(math, false)}</span>`
  })

  return s
}

function serializeHtmlToLatex(root: HTMLElement): string {
  const parts: string[] = []

  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()

      if (tag === 'h1') {
        parts.push(`\\section{${serializeInline(el)}}`)
      } else if (tag === 'h2') {
        parts.push(`\\subsection{${serializeInline(el)}}`)
      } else if (tag === 'h3') {
        parts.push(`\\subsubsection{${serializeInline(el)}}`)
      } else if (el.classList.contains('ve-abstract-card')) {
        const text = el.querySelector('.ve-abstract-text')
        parts.push(`\\begin{abstract}\n${text ? serializeInline(text as HTMLElement) : ''}\n\\end{abstract}`)
      } else if (el.classList.contains('ve-math-container') || el.classList.contains('ve-math-block')) {
        const input = el.querySelector('.ve-math-inline-input') as HTMLInputElement | null
        const math = input ? input.value : (el.getAttribute('data-latex') || '')
        parts.push(`\\begin{equation}\n  ${math.trim()}\n\\end{equation}`)
      } else if (el.classList.contains('ve-table-wrap') || tag === 'table') {
        const table = (tag === 'table' ? el : el.querySelector('table')) as HTMLTableElement | null
        if (table) {
          parts.push(serializeTableToLatex(table))
        }
      } else if (el.classList.contains('ve-figure-card')) {
        const cap = el.querySelector('.ve-figure-caption-text')?.textContent?.trim() || 'Figure'
        parts.push(`\\begin{figure}[htbp]\n  \\centering\n  \\caption{${cap}}\n\\end{figure}`)
      } else if (el.classList.contains('ve-theorem-box')) {
        const type = el.getAttribute('data-type') || 'theorem'
        const titleEl = el.querySelector('.ve-theorem-title')
        const content = Array.from(el.childNodes)
          .filter((n) => n !== titleEl)
          .map((n) => (n.nodeType === Node.TEXT_NODE ? n.textContent : serializeInline(n as HTMLElement)))
          .join('')
          .trim()
        parts.push(`\\begin{${type}}\n${content}\n\\end{${type}}`)
      } else if (el.classList.contains('ve-page-break')) {
        parts.push('\\newpage')
      } else if (el.classList.contains('ve-toc-box')) {
        const text = el.textContent || ''
        if (text.includes('Include file:')) {
          const file = text.replace(/.*Include file:\s*/, '').trim()
          parts.push(`\\input{${file}}`)
        } else {
          parts.push('\\tableofcontents')
        }
      } else if (tag === 'ul') {
        const items: string[] = []
        el.querySelectorAll('li').forEach((li) => {
          items.push(`  \\item ${serializeInline(li)}`)
        })
        parts.push(`\\begin{itemize}\n${items.join('\n')}\n\\end{itemize}`)
      } else if (tag === 'ol') {
        const items: string[] = []
        el.querySelectorAll('li').forEach((li) => {
          items.push(`  \\item ${serializeInline(li)}`)
        })
        parts.push(`\\begin{enumerate}\n${items.join('\n')}\n\\end{enumerate}`)
      } else if (tag === 'p') {
        const content = serializeInline(el).trim()
        if (content) {
          parts.push(content)
        }
      } else {
        const content = serializeInline(el).trim()
        if (content) {
          parts.push(content)
        }
      }
    }
  })

  return parts.join('\n\n')
}

function serializeTableToLatex(table: HTMLTableElement): string {
  const trs = Array.from(table.querySelectorAll('tr'))
  if (trs.length === 0) return ''

  let maxCols = 1
  trs.forEach((tr) => {
    const cellCount = tr.querySelectorAll('th, td').length
    if (cellCount > maxCols) maxCols = cellCount
  })

  const colAlign = '|' + 'c|'.repeat(maxCols)
  const rowsLatex: string[] = []

  trs.forEach((tr) => {
    const cells = Array.from(tr.querySelectorAll('th, td')).map((c) => serializeInline(c as HTMLElement).trim())
    rowsLatex.push('    ' + cells.join(' & ') + ' \\\\ \\hline')
  })

  return `\\begin{table}[htbp]
  \\centering
  \\begin{tabular}{${colAlign}}
    \\hline
${rowsLatex.join('\n')}
  \\end{tabular}
\\end{table}`
}

function serializeInline(el: HTMLElement): string {
  let result = ''

  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent || ''
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const elem = child as HTMLElement
      const tag = elem.tagName.toLowerCase()

      if (elem.classList.contains('ve-cite-pill')) {
        const key = elem.querySelector('.ve-cite-key')?.textContent?.trim() || elem.getAttribute('data-cite') || ''
        result += `\\cite{${key}}`
      } else if (elem.classList.contains('ve-ref-pill')) {
        const key = elem.querySelector('.ve-ref-key')?.textContent?.trim() || elem.getAttribute('data-ref') || ''
        result += `\\ref{${key}}`
      } else if (elem.classList.contains('ve-inline-math')) {
        const math = elem.getAttribute('data-math') || elem.innerText.replace(/\$/g, '')
        result += `$${math}$`
      } else if (tag === 'strong' || tag === 'b') {
        result += `\\textbf{${serializeInline(elem)}}`
      } else if (tag === 'em' || tag === 'i') {
        result += `\\textit{${serializeInline(elem)}}`
      } else if (tag === 'u') {
        result += `\\underline{${serializeInline(elem)}}`
      } else if (tag === 's' || tag === 'strike') {
        result += serializeInline(elem)
      } else if (tag === 'a' && elem.classList.contains('ve-link')) {
        const href = elem.getAttribute('href') || ''
        result += `\\href{${href}}{${serializeInline(elem)}}`
      } else if (elem.classList.contains('ve-label-badge')) {
        const lbl = elem.textContent?.replace(/^\[label:\s*|\]$/g, '').trim() || ''
        result += `\\label{${lbl}}`
      } else {
        result += serializeInline(elem)
      }
    }
  })

  return result
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;')
}
