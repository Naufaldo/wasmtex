import katex from 'katex'

export interface VisualEditorOptions {
  onContentChange: (latex: string) => void
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
        <!-- Visual Editor Toolbar -->
        <div class="ve-toolbar">
          <div class="ve-btn-group">
            <button class="ve-tool-btn" data-command="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
            <button class="ve-tool-btn" data-command="italic" title="Italic (Ctrl+I)"><em>I</em></button>
          </div>
          <div class="ve-btn-group">
            <button class="ve-tool-btn" data-tag="h1" title="Section (H1)">§ H1</button>
            <button class="ve-tool-btn" data-tag="h2" title="Subsection (H2)">§ H2</button>
            <button class="ve-tool-btn" data-tag="h3" title="Subsubsection (H3)">§ H3</button>
          </div>
          <div class="ve-btn-group">
            <button class="ve-tool-btn" data-command="insertUnorderedList" title="Bullet List">• List</button>
            <button class="ve-tool-btn" data-command="insertOrderedList" title="Numbered List">1. List</button>
          </div>
          <div class="ve-btn-group">
            <button class="ve-tool-btn" id="ve-btn-math" title="Insert Math Block">∑ Equation</button>
            <button class="ve-tool-btn" id="ve-btn-cite" title="Insert Citation">🏷️ Cite</button>
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

    toolbar?.querySelectorAll<HTMLButtonElement>('.ve-tool-btn[data-command]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-command')!
        document.execCommand(cmd, false)
        editable.focus()
        this.triggerChange()
      })
    })

    toolbar?.querySelectorAll<HTMLButtonElement>('.ve-tool-btn[data-tag]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag')!
        document.execCommand('formatBlock', false, tag)
        editable.focus()
        this.triggerChange()
      })
    })

    toolbar?.querySelector('#ve-btn-math')?.addEventListener('click', () => {
      const eq = prompt('Masukkan rumus LaTeX matematika:', 'E = mc^2')
      if (eq) {
        const trimmed = eq.trim()
        this.insertHtmlAtCursor(`
          <div class="ve-math-container" contenteditable="false" data-latex="${escapeAttr(trimmed)}">
            <div class="ve-math-rendered">${renderMath(trimmed, true)}</div>
            <div class="ve-math-side-preview">
              <div class="ve-math-side-top">
                <span class="ve-math-badge">[ EQUATION ]</span>
                <button type="button" class="ve-math-edit-btn" title="Edit LaTeX Equation">✎ Edit</button>
              </div>
              <div class="ve-math-raw-code">$$${escapeHtml(trimmed)}$$</div>
            </div>
          </div>
          <p><br></p>
        `)
        this.triggerChange()
      }
    })

    // Click handler for editing math equations or inline math
    editable.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const editBtn = target.closest('.ve-math-edit-btn')
      const mathContainer = target.closest('.ve-math-container') as HTMLElement | null

      if ((editBtn || target.closest('.ve-math-side-preview')) && mathContainer) {
        e.stopPropagation()
        const currentLatex = mathContainer.getAttribute('data-latex') || ''
        const updated = prompt('Edit rumus LaTeX matematika:', currentLatex)
        if (updated !== null && updated.trim()) {
          const trimmed = updated.trim()
          mathContainer.setAttribute('data-latex', trimmed)
          const renderedEl = mathContainer.querySelector('.ve-math-rendered')
          const rawEl = mathContainer.querySelector('.ve-math-raw-code')
          if (renderedEl) renderedEl.innerHTML = renderMath(trimmed, true)
          if (rawEl) rawEl.textContent = `$$${trimmed}$$`
          this.triggerChange()
        }
        return
      }

      const inlineMath = target.closest('.ve-inline-math') as HTMLElement | null
      if (inlineMath) {
        e.stopPropagation()
        const currentMath = inlineMath.getAttribute('data-math') || ''
        const updated = prompt('Edit rumus inline LaTeX:', currentMath)
        if (updated !== null && updated.trim()) {
          const trimmed = updated.trim()
          inlineMath.setAttribute('data-math', trimmed)
          inlineMath.setAttribute('title', `LaTeX: $${trimmed}$`)
          inlineMath.innerHTML = renderMath(trimmed, false)
          this.triggerChange()
        }
      }
    })

    toolbar?.querySelector('#ve-btn-cite')?.addEventListener('click', () => {
      const key = prompt('Citation Key (misal: vaswani2017attention):')
      if (key) {
        this.insertHtmlAtCursor(`
          <span class="ve-cite-pill" contenteditable="false" data-cite="${escapeAttr(key)}">[cite:${escapeHtml(key)}]</span>&nbsp;
        `)
        this.triggerChange()
      }
    })

    editable.addEventListener('input', () => {
      if (this.isUpdatingFromCode) return
      this.triggerChange()
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
      const { preamble, body, postamble } = splitLatex(latex)
      this.preamble = preamble
      this.postamble = postamble

      const editable = this.container.querySelector('#ve-editable-body') as HTMLElement
      if (!editable) return

      editable.innerHTML = parseLatexToHtml(body)
    } finally {
      this.isUpdatingFromCode = false
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

function splitLatex(latex: string): { preamble: string; body: string; postamble: string } {
  const docStart = latex.indexOf('\\begin{document}')
  if (docStart === -1) {
    return { preamble: '', body: latex, postamble: '' }
  }

  const preamble = latex.slice(0, docStart).trim()
  const remainder = latex.slice(docStart + '\\begin{document}'.length)
  const docEnd = remainder.indexOf('\\end{document}')

  if (docEnd === -1) {
    return { preamble, body: remainder.trim(), postamble: '\\end{document}' }
  }

  const body = remainder.slice(0, docEnd).trim()
  const postamble = remainder.slice(docEnd).trim()

  return { preamble, body, postamble }
}

function parseLatexToHtml(body: string): string {
  if (!body.trim()) {
    return '<p><br></p>'
  }

  const lines = body.split('\n')
  const htmlParts: string[] = []
  let inList: 'itemize' | 'enumerate' | null = null
  let inAbstract = false
  let abstractContent = ''

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!
    const line = rawLine.trim()

    // Abstract
    if (line.includes('\\begin{abstract}')) {
      inAbstract = true
      abstractContent = ''
      continue
    }
    if (inAbstract) {
      if (line.includes('\\end{abstract}')) {
        inAbstract = false
        htmlParts.push(`
          <div class="ve-abstract-card">
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
      htmlParts.push(`<li>${formatInlineLatex(itemContent)}</li>`)
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
      const rawEq = eqLines
        .join('\n')
        .replace(/\\begin\{(?:equation\*?|align\*?|gather\*?|multline)\}|\\end\{(?:equation\*?|align\*?|gather\*?|multline)\}|\\\[|\\\]|\$\$/g, '')
        .trim()
      htmlParts.push(`
        <div class="ve-math-container" contenteditable="false" data-latex="${escapeAttr(rawEq)}">
          <div class="ve-math-rendered">${renderMath(rawEq, true)}</div>
          <div class="ve-math-side-preview">
            <div class="ve-math-side-top">
              <span class="ve-math-badge">[ EQUATION ]</span>
              <button type="button" class="ve-math-edit-btn" title="Edit LaTeX Equation">✎ Edit</button>
            </div>
            <div class="ve-math-raw-code">$$${escapeHtml(rawEq)}$$</div>
          </div>
        </div>
      `)
      continue
    }

    // Headings
    const secMatch = line.match(/^\\section\*?\{([^}]+)\}/)
    if (secMatch) {
      htmlParts.push(`<h1>${escapeHtml(secMatch[1]!)}</h1>`)
      continue
    }
    const subsecMatch = line.match(/^\\subsection\*?\{([^}]+)\}/)
    if (subsecMatch) {
      htmlParts.push(`<h2>${escapeHtml(subsecMatch[1]!)}</h2>`)
      continue
    }
    const subsubsecMatch = line.match(/^\\subsubsection\*?\{([^}]+)\}/)
    if (subsubsecMatch) {
      htmlParts.push(`<h3>${escapeHtml(subsubsecMatch[1]!)}</h3>`)
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
    htmlParts.push(`<p>${formatInlineLatex(line)}</p>`)
  }

  return htmlParts.join('\n')
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

  // Citation \cite{...}
  s = s.replace(/\\cite\{([^}]+)\}/g, (_m, key) => {
    return `<span class="ve-cite-pill" contenteditable="false" data-cite="${escapeAttr(key)}">[cite:${escapeHtml(key)}]</span>`
  })

  // Reference \ref{...}
  s = s.replace(/\\ref\{([^}]+)\}/g, (_m, key) => {
    return `<span class="ve-ref-pill" contenteditable="false" data-ref="${escapeAttr(key)}">[ref:${escapeHtml(key)}]</span>`
  })

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
        const math = el.getAttribute('data-latex') || el.innerText
        parts.push(`\\begin{equation}\n  ${math.trim()}\n\\end{equation}`)
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

function serializeInline(el: HTMLElement): string {
  let result = ''

  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent || ''
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const elem = child as HTMLElement
      const tag = elem.tagName.toLowerCase()

      if (elem.classList.contains('ve-cite-pill')) {
        const key = elem.getAttribute('data-cite') || ''
        result += `\\cite{${key}}`
      } else if (elem.classList.contains('ve-ref-pill')) {
        const key = elem.getAttribute('data-ref') || ''
        result += `\\ref{${key}}`
      } else if (elem.classList.contains('ve-inline-math')) {
        const math = elem.getAttribute('data-math') || elem.innerText.replace(/\$/g, '')
        result += `$${math}$`
      } else if (tag === 'strong' || tag === 'b') {
        result += `\\textbf{${serializeInline(elem)}}`
      } else if (tag === 'em' || tag === 'i') {
        result += `\\textit{${serializeInline(elem)}}`
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
