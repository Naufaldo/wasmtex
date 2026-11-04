import { t } from '../ui/i18n'

export interface TikzTemplate {
  id: string
  name: string
  description: string
  code: string
  extraPreamble?: string
}

export const TIKZ_TEMPLATES: TikzTemplate[] = [
  {
    id: 'flowchart',
    name: 'Diagram Alir (Flowchart)',
    description: 'Proses berurutan dengan start/stop, aksi, keputusan diamond, dan loop percabangan',
    code: `\\begin{tikzpicture}[
  node distance=1.5cm,
  startstop/.style={rectangle, rounded corners=6pt, minimum width=2.8cm, minimum height=0.9cm, text centered, draw=black, fill=blue!10, thick},
  process/.style={rectangle, minimum width=2.8cm, minimum height=0.9cm, text centered, draw=black, fill=orange!10, thick},
  decision/.style={diamond, aspect=2, text centered, draw=black, fill=green!10, thick},
  arrow/.style={thick,->,>=stealth}
]
  \\node (start) [startstop] {Mulai};
  \\node (pro1) [process, below of=start] {Akuisisi Sinyal / Data};
  \\node (dec1) [decision, below of=pro1, yshift=-0.4cm] {Validasi Toleransi?};
  \\node (pro2) [process, below of=dec1, yshift=-0.4cm] {Proses Komputasi Model};
  \\node (stop) [startstop, below of=pro2] {Selesai / Publikasi};

  \\draw [arrow] (start) -- (pro1);
  \\draw [arrow] (pro1) -- (dec1);
  \\draw [arrow] (dec1) -- node[anchor=east, font=\\small] {Ya} (pro2);
  \\draw [arrow] (dec1.east) -- ++(1.4,0) |- node[anchor=south, font=\\small] {Ulangi} (pro1.east);
  \\draw [arrow] (pro2) -- (stop);
\\end{tikzpicture}`,
  },
  {
    id: 'neural-net',
    name: 'Arsitektur Deep Learning (ANN)',
    description: 'Multi-layer perceptron dengan lapisan Input, Hidden, dan Output beserta koneksi bobot',
    code: `\\begin{tikzpicture}[
  node distance=0.8cm,
  neuron/.style={circle, draw=black, thick, minimum size=0.85cm, fill=blue!15, font=\\small},
  layer label/.style={font=\\small\\bfseries}
]
  % Input Layer
  \\foreach \\i in {1,2,3,4}
    \\node[neuron, fill=green!20] (I-\\i) at (0, -\\i*1.1) {$x_\\i$};
  \\node[layer label, above=0.3cm of I-1] {Lapisan Input};

  % Hidden Layer
  \\foreach \\j in {1,2,3,4,5}
    \\node[neuron, fill=orange!20] (H-\\j) at (2.6, -\\j*0.88 + 0.1) {$h_\\j$};
  \\node[layer label, above=0.3cm of H-1] {Lapisan Tersembunyi};

  % Output Layer
  \\foreach \\k in {1,2}
    \\node[neuron, fill=red!20] (O-\\k) at (5.2, -\\k*1.5 - 0.5) {$\\hat{y}_\\k$};
  \\node[layer label, above=0.3cm of O-1] {Lapisan Output};

  % Connections
  \\foreach \\i in {1,2,3,4}
    \\foreach \\j in {1,2,3,4,5}
      \\draw[->, >=stealth, gray!50] (I-\\i) -- (H-\\j);

  \\foreach \\j in {1,2,3,4,5}
    \\foreach \\k in {1,2}
      \\draw[->, >=stealth, gray!60] (H-\\j) -- (O-\\k);
\\end{tikzpicture}`,
  },
  {
    id: 'pgfplots-2d',
    name: 'Plot Grafik Fungsi 2D (PGFPlots)',
    description: 'Grafik kartesius presisi tinggi dengan kurva sinus/kosinus, sumbu berlabel, dan legenda',
    code: `\\begin{tikzpicture}
  \\begin{axis}[
    width=8.5cm, height=5.5cm,
    axis lines=middle,
    grid=both,
    xlabel={$x$},
    ylabel={$f(x)$},
    domain=-3.14:3.14,
    samples=100,
    legend pos=north west,
    legend style={font=\\small},
    thick
  ]
    \\addplot[blue, smooth] {sin(deg(x))};
    \\addlegendentry{$\\sin(x)$}
    \\addplot[red, dashed, smooth] {cos(deg(x))};
    \\addlegendentry{$\\cos(x)$}
  \\end{axis}
\\end{tikzpicture}`,
  },
  {
    id: 'control-system',
    name: 'Diagram Blok Sistem Kontrol (DSP)',
    description: 'Loop umpan balik dengan junction penjumlahan, kontroler, plant, dan sensor',
    code: `\\begin{tikzpicture}[
  auto, node distance=1.8cm, >=stealth,
  block/.style={rectangle, draw, fill=blue!10, text width=2.4cm, text centered, minimum height=1.1cm, thick, font=\\small},
  sum/.style={draw, circle, minimum size=0.6cm, inner sep=0pt, thick},
  input/.style={coordinate},
  output/.style={coordinate}
]
  \\node [input] (input) {};
  \\node [sum, right=1.0cm of input] (sum) {+};
  \\node [block, right=1.3cm of sum] (controller) {Kontroler\\\\$K(s)$};
  \\node [block, right=1.3cm of controller] (plant) {Plant\\\\$G(s)$};
  \\node [output, right=1.2cm of plant] (output) {};
  \\node [block, below=1.1cm of controller] (sensor) {Sensor\\\\$H(s)$};

  \\draw [->, thick] (input) -- node {$R(s)$} (sum);
  \\draw [->, thick] (sum) -- node {$E(s)$} (controller);
  \\draw [->, thick] (controller) -- node {$U(s)$} (plant);
  \\draw [->, thick] (plant) -- node [name=y] {$Y(s)$}(output);
  \\draw [->, thick] (y) |- (sensor);
  \\draw [->, thick] (sensor) -| node[pos=0.95, left, font=\\small] {$-$} (sum);
\\end{tikzpicture}`,
  },
  {
    id: 'automata',
    name: 'Diagram Keadaan / Otomata (FSM)',
    description: 'Finite State Machine dengan status awal, lingkaran ganda penerima, dan transisi',
    code: `\\begin{tikzpicture}[->, >=stealth, node distance=2.6cm, auto, thick, main node/.style={circle, draw, minimum size=1cm, font=\\sffamily\\bfseries}]
  \\node[main node, initial, initial text=Mulai] (1) {$q_0$};
  \\node[main node] (2) [right of=1] {$q_1$};
  \\node[main node, accepting] (3) [right of=2] {$q_2$};

  \\path[every node/.style={font=\\sffamily\\small}]
    (1) edge [loop above] node {0} (1)
        edge node {1} (2)
    (2) edge [bend left] node {0} (3)
        edge [bend left] node {1} (1)
    (3) edge [loop above] node {0, 1} (3);
\\end{tikzpicture}`,
  },
]

export function buildStandaloneDoc(tikzSnippet: string, extraPreamble = ''): string {
  return [
    '\\documentclass[tikz,border=6pt]{standalone}',
    '\\usepackage{tikz}',
    '\\usepackage{pgfplots}',
    '\\pgfplotsset{compat=1.18}',
    '\\usetikzlibrary{arrows.meta,positioning,calc,shapes.geometric,patterns,automata,backgrounds,fit,shadows}',
    extraPreamble.trim(),
    '\\begin{document}',
    tikzSnippet.trim(),
    '\\end{document}',
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatFigureBlock(
  tikzSnippet: string,
  caption = 'Diagram Ilmiah',
  label = 'fig:diagram'
): string {
  const indented = tikzSnippet
    .trim()
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')
  return [
    '\\begin{figure}[htbp]',
    '  \\centering',
    indented,
    `  \\caption{${caption}}`,
    `  \\label{${label}}`,
    '\\end{figure}',
  ].join('\n')
}

export interface TikzScratchpadOptions {
  compileFigure: (fullLatex: string) => Promise<Uint8Array | null>
  onInsertToDocument: (snippet: string) => void
  onSaveAsFile: (filename: string, content: string) => void
}

export class TikzScratchpadModal {
  private modal: HTMLElement | null = null
  private options: TikzScratchpadOptions
  private activeCode: string = TIKZ_TEMPLATES[0]?.code ?? ''
  private lastRenderedPdf: Uint8Array | null = null
  private isCompiling = false

  constructor(options: TikzScratchpadOptions) {
    this.options = options
  }

  open(): void {
    this.close()

    const modal = document.createElement('div')
    modal.className = 'arxiv-modal-overlay'
    modal.id = 'tikz-scratchpad-modal'

    const templateOptions = TIKZ_TEMPLATES.map(
      (t) => `<option value="${t.id}">${t.name}</option>`
    ).join('')

    modal.innerHTML = `
      <div class="arxiv-modal-box tikz-modal-box tactical-modal-frame">
        <div class="arxiv-modal-header modal-header">
          <div class="header-title-block">
            <span class="modal-spec-tag">[ ${t('EDITOR DIAGRAM // TIKZ & FIGURE SCRATCHPAD', 'DIAGRAM EDITOR // TIKZ & FIGURE SCRATCHPAD')} ]</span>
            <h2 class="header-title modal-title">📐 ${t('Editor Diagram TikZ Terisolasi', 'Isolated TikZ & Figure Scratchpad')}</h2>
          </div>
          <button class="modal-close-btn" id="tikz-close-btn" title="${t('Tutup', 'Close')}">&times;</button>
        </div>

        <div class="tikz-modal-toolbar">
          <div class="tikz-preset-group">
            <label class="tikz-preset-label">${t('Preset Template:', 'Template Preset:')}</label>
            <select id="tikz-preset-select" class="tactical-select">
              ${templateOptions}
            </select>
          </div>
          <button id="tikz-compile-btn" class="tactical-cta-btn cta-orange">
            <span class="cta-inner">⚡ ${t('RENDER GAMBAR', 'RENDER FIGURE')}</span>
          </button>
        </div>

        <div class="tikz-modal-content">
          <!-- Left: Code Editor -->
          <div class="tikz-code-column">
            <div class="column-header">
              <span class="column-title">[ ${t('KODE TIKZ // STANDALONE', 'TIKZ CODE // STANDALONE')} ]</span>
              <span class="column-hint">${t('Dukungan Tab, multiline', 'Tab key & multiline support')}</span>
            </div>
            <textarea id="tikz-code-input" class="tikz-textarea" spellcheck="false">${this.activeCode}</textarea>
          </div>

          <!-- Right: Visual Preview -->
          <div class="tikz-preview-column">
            <div class="column-header">
              <span class="column-title">[ ${t('PRATINJAU VEKTOR', 'VECTOR PREVIEW')} ]</span>
              <span id="tikz-render-status" class="render-status">${t('Siap render', 'Ready to render')}</span>
            </div>
            <div id="tikz-preview-canvas-box" class="tikz-preview-box">
              <div class="tikz-empty-state">
                <span class="empty-icon">📐</span>
                <p>${t(
                  'Klik tombol <strong>⚡ RENDER GAMBAR</strong> untuk mengompilasi diagram dalam mode terisolasi.',
                  'Click <strong>⚡ RENDER FIGURE</strong> to compile this diagram in an isolated environment.'
                )}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="tikz-modal-footer">
          <div class="footer-left-actions">
            <button class="tactical-btn-action" id="tikz-save-file-btn" title="${t('Simpan sebagai file baru di folder figures/', 'Save as a new file under figures/')}">
              💾 ${t('SIMPAN BERKAS .TEX', 'SAVE .TEX FILE')}
            </button>
            <button class="tactical-btn-action" id="tikz-download-pdf-btn" disabled title="${t('Unduh diagram tunggal sebagai file PDF', 'Download single diagram as PDF')}">
              ⬇ ${t('UNDUH PDF', 'DOWNLOAD PDF')}
            </button>
          </div>
          <div class="footer-right-actions">
            <button class="tactical-btn-action" id="tikz-cancel-btn">${t('BATAL', 'CANCEL')}</button>
            <button class="tactical-cta-btn cta-blue" id="tikz-insert-btn">
              <span class="cta-inner">📥 ${t('SISIPKAN KE NASKAH UTAMA', 'INSERT INTO DOCUMENT')}</span>
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)
    this.modal = modal

    const textarea = modal.querySelector('#tikz-code-input') as HTMLTextAreaElement
    const presetSelect = modal.querySelector('#tikz-preset-select') as HTMLSelectElement
    const compileBtn = modal.querySelector('#tikz-compile-btn') as HTMLButtonElement
    const statusLabel = modal.querySelector('#tikz-render-status') as HTMLElement
    const canvasBox = modal.querySelector('#tikz-preview-canvas-box') as HTMLElement
    const downloadPdfBtn = modal.querySelector('#tikz-download-pdf-btn') as HTMLButtonElement
    const saveFileBtn = modal.querySelector('#tikz-save-file-btn') as HTMLButtonElement
    const insertBtn = modal.querySelector('#tikz-insert-btn') as HTMLButtonElement

    // Tab key inside textarea
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end)
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }
    })

    // Preset selection change
    presetSelect.addEventListener('change', () => {
      const selected = TIKZ_TEMPLATES.find((t) => t.id === presetSelect.value)
      if (selected) {
        textarea.value = selected.code
        this.activeCode = selected.code
      }
    })

    // Compile action
    const triggerCompile = async () => {
      if (this.isCompiling) return
      this.isCompiling = true
      compileBtn.disabled = true
      compileBtn.textContent = t('⏳ MENGOMPILASI...', '⏳ COMPILING...')
      statusLabel.textContent = t('Sedang render...', 'Rendering...')
      statusLabel.className = 'render-status running'

      try {
        const fullDoc = buildStandaloneDoc(textarea.value)
        const pdfBytes = await this.options.compileFigure(fullDoc)

        if (!pdfBytes) {
          throw new Error(
            t(
              'Hasil kompilasi PDF kosong. Periksa sintaks TikZ.',
              'Empty PDF compile result. Check TikZ syntax.'
            )
          )
        }

        this.lastRenderedPdf = pdfBytes
        downloadPdfBtn.disabled = false

        // Render PDF page to Canvas
        const pdfjsLib = await import('pdfjs-dist')
        const pdfDoc = await pdfjsLib.getDocument({
          data: pdfBytes,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.624/cmaps/',
          cMapPacked: true,
        }).promise

        const page = await pdfDoc.getPage(1)
        const viewport = page.getViewport({ scale: 1.5 })

        canvasBox.innerHTML = ''
        const canvas = document.createElement('canvas')
        canvas.className = 'tikz-canvas-output'
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.maxWidth = '100%'
        canvas.style.maxHeight = '100%'
        canvas.style.objectFit = 'contain'
        canvasBox.appendChild(canvas)

        const ctx = canvas.getContext('2d')
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
        }

        statusLabel.textContent = `✓ ${t('Sukses', 'Success')}`
        statusLabel.className = 'render-status ok'
      } catch (err: any) {
        console.error('Tikz compile error:', err)
        statusLabel.textContent = `✕ ${t('Gagal', 'Failed')}`
        statusLabel.className = 'render-status err'
        canvasBox.innerHTML = `
          <div class="tikz-error-box">
            <strong>${t('Kompilasi Gagal:', 'Compilation Failed:')}</strong>
            <pre>${escapeHtml(String(err?.message || err))}</pre>
          </div>
        `
      } finally {
        this.isCompiling = false
        compileBtn.disabled = false
        compileBtn.innerHTML = `<span class="cta-inner">⚡ ${t('RENDER GAMBAR', 'RENDER FIGURE')}</span>`
      }
    }

    compileBtn.addEventListener('click', triggerCompile)

    // Close buttons
    modal.querySelector('#tikz-close-btn')?.addEventListener('click', () => this.close())
    modal.querySelector('#tikz-cancel-btn')?.addEventListener('click', () => this.close())

    // Download PDF
    downloadPdfBtn.addEventListener('click', () => {
      if (!this.lastRenderedPdf) return
      const blob = new Blob([this.lastRenderedPdf.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tikz_figure.pdf'
      a.click()
      URL.revokeObjectURL(url)
    })

    // Save as .tex file
    saveFileBtn.addEventListener('click', () => {
      const promptMsg = t(
        'Masukkan nama berkas diagram (contoh: figures/diagram_alur.tex):',
        'Enter diagram file path (e.g. figures/flowchart.tex):'
      )
      const name = prompt(promptMsg, 'figures/fig_scratchpad.tex')
      if (name) {
        this.options.onSaveAsFile(name.trim(), textarea.value)
        alert(
          t(
            `Berkas ${name.trim()} berhasil disimpan ke proyek.`,
            `File ${name.trim()} successfully saved to project.`
          )
        )
      }
    })

    // Insert to main document
    insertBtn.addEventListener('click', () => {
      const captionPrompt = t('Masukkan caption gambar:', 'Enter figure caption:')
      const defaultCaption = t('Diagram Hasil Komputasi', 'Computational Results Diagram')
      const caption = prompt(captionPrompt, defaultCaption) || defaultCaption

      const labelPrompt = t('Masukkan label rujukan (misal fig:hasil):', 'Enter reference label (e.g. fig:results):')
      const label = prompt(labelPrompt, 'fig:diagram') || 'fig:diagram'

      const block = formatFigureBlock(textarea.value, caption, label)
      this.options.onInsertToDocument(block)
      this.close()
    })
  }

  close(): void {
    if (this.modal) {
      this.modal.remove()
      this.modal = null
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
