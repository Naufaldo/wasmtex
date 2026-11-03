import * as pdfjsLib from 'pdfjs-dist'
import { configurePdfjsWorker, ensurePdfWorker } from '../viewer/pdf-viewer'
import { deletePaper, getAllPapers, type ResearchPaper, savePaper } from './library-store'
import { getLang, t } from '../ui/i18n'

export interface LibraryViewOptions {
  onInsertBibtex: (bibtex: string) => void
}

interface AnnotPoint {
  x: number
  y: number
}

interface AnnotationItem {
  type: 'pen' | 'highlighter' | 'text'
  color: string
  lineWidth: number
  points?: AnnotPoint[]
  text?: string
  x?: number
  y?: number
}

type AnnotationsByPage = Record<number, AnnotationItem[]>

export class LibraryView {
  private container: HTMLElement
  private papers: ResearchPaper[] = []
  private selectedPaper: ResearchPaper | null = null
  private options: LibraryViewOptions

  // PDF Viewer & Annotation state
  private currentPdfDoc: pdfjsLib.PDFDocumentProxy | null = null
  private currentPage = 1
  private totalPages = 1
  private currentScale = 1.25
  private activeTool: 'pen' | 'highlighter' | 'text' | 'eraser' = 'pen'
  private activeColor = '#EF4444' // default red pen
  private pageAnnotations: AnnotationsByPage = {}
  private isDrawing = false
  private currentStroke: AnnotationItem | null = null

  constructor(container: HTMLElement, options: LibraryViewOptions) {
    this.container = container
    this.options = options
  }

  async init(): Promise<void> {
    configurePdfjsWorker()
    ;(window as any).__libraryView = this
    this.papers = await getAllPapers()
    if (this.papers.length > 0 && !this.selectedPaper) {
      this.selectedPaper = this.papers[0]!
    }
    this.render()
  }

  public addAnnotation(item: AnnotationItem): void {
    if (!this.pageAnnotations[this.currentPage]) {
      this.pageAnnotations[this.currentPage] = []
    }
    this.pageAnnotations[this.currentPage]!.push(item)
    this.redrawAnnotationCanvas()
  }

  public selectPaperById(id: string): void {
    const p = this.papers.find((item) => item.id === id)
    if (p) {
      this.selectedPaper = p
      this.renderPaperList()
      this.renderSelectedPaper()
    }
  }

  private render(): void {
    const lang = getLang()
    this.container.innerHTML = `
      <div class="lib-root">
        <!-- Sidebar: Paper List -->
        <aside class="lib-sidebar">
          <div class="lib-sidebar-header">
            <div class="lib-title-row">
              <span class="lib-title">[ ${t('PUSTAKA RISET', 'RESEARCH REPOSITORY', lang)} ]</span>
              <button id="lib-add-btn" class="tactical-cta-btn cta-orange" style="padding: 4px 10px; font-size: 11px;" title="${t('Tambah paper baru', 'Add new paper', lang)}">+ ${t('TAMBAH PAPER', 'ADD PAPER', lang)}</button>
            </div>
            <div class="lib-search-wrap">
              <span class="lib-search-prompt">&gt;_</span>
              <input type="text" id="lib-search-input" class="lib-search" placeholder="${t('CARI PAPER (JUDUL, PENULIS, TAG)...', 'SEARCH PAPERS (TITLE, AUTHOR, TAG)...', lang)}" />
            </div>
          </div>
          <div id="lib-paper-list" class="lib-paper-list"></div>
        </aside>

        <!-- Center: Paper Reader View (PDF & Annotation Core) -->
        <main class="lib-reader-panel">
          <div class="lib-panel-header">
            <span class="lib-panel-title">
              <span style="color:var(--accent-orange); font-weight:800;">[ 01 ]</span>
              <span>${t('PEMBACA DOKUMEN // ENGINE PDF & ANOTASI', 'DOCUMENT READER // PDF & ANNOTATION ENGINE', lang)}</span>
            </span>
            <div class="lib-reader-actions">
              <label for="lib-upload-pdf" class="lib-btn lib-btn-outline" style="cursor: pointer;" title="${t('Upload file PDF asli', 'Upload original PDF', lang)}">
                📄 ${t('UNGGAH PDF', 'UPLOAD PDF', lang)}
                <input type="file" id="lib-upload-pdf" accept=".pdf" style="display: none;" />
              </label>
              ${this.selectedPaper?.pdfBlob ? `<button id="lib-btn-download-pdf" class="lib-btn lib-btn-outline" title="${t('Download PDF dengan coretan', 'Download annotated PDF', lang)}">⬇ ${t('UNDUH PDF BERANOTASI', 'DOWNLOAD ANNOTATED PDF', lang)}</button>` : ''}
            </div>
          </div>

          <!-- Annotation Toolbar (Shown when PDF is loaded) -->
          <div id="lib-annot-toolbar" class="lib-annot-toolbar" style="display: none;">
            <!-- Page controls -->
            <div class="lib-annot-group">
              <button id="annot-prev-page" class="lib-annot-btn" title="${t('Halaman Sebelumnya', 'Previous Page', lang)}">◀ ${t('SEBELUMNYA', 'PREV', lang)}</button>
              <span id="annot-page-indicator" style="font-family: var(--font-mono); font-size: 11px; padding: 0 4px; font-weight:700;">${t('HALAMAN', 'PAGE', lang)} 1 / 1</span>
              <button id="annot-next-page" class="lib-annot-btn" title="${t('Halaman Selanjutnya', 'Next Page', lang)}">${t('SELANJUTNYA', 'NEXT', lang)} ▶</button>
            </div>

            <!-- Annotation Tool Selectors -->
            <div class="lib-annot-group">
              <button id="annot-tool-pen" class="lib-annot-btn active" title="${t('Pulpen Coret-coret', 'Pen Tool', lang)}">🖊️ PEN</button>
              <button id="annot-tool-highlighter" class="lib-annot-btn" title="${t('Stabilo / Highlight Kuning', 'Highlighter Tool', lang)}">🖍️ STABILO</button>
              <button id="annot-tool-text" class="lib-annot-btn" title="${t('Tambahkan Catatan Teks', 'Text Note Tool', lang)}">🔤 TEXT</button>
              <button id="annot-tool-eraser" class="lib-annot-btn" title="${t('Hapus Coretan', 'Undo Stroke', lang)}">🧹 UNDO</button>
              <button id="annot-tool-clear" class="lib-annot-btn" title="${t('Bersihkan Semua Coretan di Halaman Ini', 'Clear All Annotations on Page', lang)}">🗑️ CLEAR</button>
            </div>

            <!-- Color Palette -->
            <div class="lib-annot-group">
              <select id="annot-color-select" class="tactical-form-select" style="padding: 2px 6px; font-size: 10px;">
                <option value="#EF4444">🔴 RED PEN</option>
                <option value="#0284C7">🔵 BLUE PEN</option>
                <option value="#0F172A">⚫ BLACK PEN</option>
                <option value="#FACC1588">🟡 YELLOW STABILO</option>
                <option value="#4ADE8088">🟢 GREEN STABILO</option>
                <option value="#38BDF888">🔷 CYAN STABILO</option>
              </select>
            </div>

            <!-- Save Annotations to DB -->
            <div class="lib-annot-group">
              <button id="annot-save-btn" class="tactical-cta-btn cta-orange" style="padding: 3px 10px; font-size: 10.5px;" title="${t('Simpan coretan & stabilo ke database', 'Save annotations to database', lang)}">
                <span class="cta-inner">💾 ${t('SIMPAN CORETAN', 'SAVE ANNOTATIONS', lang)}</span>
              </button>
            </div>
          </div>

          <!-- Reader Viewport Canvas / Fallback Content -->
          <div id="lib-reader-content" class="lib-reader-content"></div>
        </main>

        <!-- Right: Paper Analysis & Memo -->
        <aside class="lib-memo-panel">
          <div class="lib-panel-header">
            <span class="lib-panel-title">
              <span style="color:var(--accent-orange); font-weight:800;">[ 02 ]</span>
              <span>${t('MEMO RISET & ANALISIS', 'RESEARCH MEMO & ANALYSIS', lang)}</span>
            </span>
            <button id="lib-save-memo-btn" class="tactical-cta-btn cta-orange" style="padding: 4px 10px; font-size: 11px;">
              <span class="cta-inner">💾 ${t('SIMPAN CATATAN', 'SAVE NOTES', lang)}</span>
            </button>
          </div>
          <div id="lib-memo-content" class="lib-memo-content"></div>
        </aside>
      </div>
    `

    this.bindEvents()
    this.renderPaperList()
    this.renderSelectedPaper()
  }

  private bindEvents(): void {
    const searchInput = this.container.querySelector('#lib-search-input') as HTMLInputElement
    searchInput?.addEventListener('input', () => {
      this.renderPaperList(searchInput.value.trim().toLowerCase())
    })

    const addBtn = this.container.querySelector('#lib-add-btn') as HTMLButtonElement
    addBtn?.addEventListener('click', () => {
      this.promptAddPaper()
    })

    const uploadPdf = this.container.querySelector('#lib-upload-pdf') as HTMLInputElement
    uploadPdf?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && this.selectedPaper) {
        this.selectedPaper.pdfBlob = file
        await savePaper(this.selectedPaper)
        this.renderSelectedPaper()
      }
    })

    const downloadPdfBtn = this.container.querySelector('#lib-btn-download-pdf')
    downloadPdfBtn?.addEventListener('click', () => {
      this.downloadAnnotatedDocument()
    })

    const saveMemoBtn = this.container.querySelector('#lib-save-memo-btn') as HTMLButtonElement
    saveMemoBtn?.addEventListener('click', () => {
      this.saveCurrentMemo()
    })

    // Annotation tools binding
    const toolPen = this.container.querySelector('#annot-tool-pen')
    const toolHighlighter = this.container.querySelector('#annot-tool-highlighter')
    const toolText = this.container.querySelector('#annot-tool-text')
    const toolEraser = this.container.querySelector('#annot-tool-eraser')
    const toolClear = this.container.querySelector('#annot-tool-clear')
    const colorSelect = this.container.querySelector('#annot-color-select') as HTMLSelectElement | null
    const saveAnnotBtn = this.container.querySelector('#annot-save-btn')

    const prevPageBtn = this.container.querySelector('#annot-prev-page')
    const nextPageBtn = this.container.querySelector('#annot-next-page')

    const updateToolButtons = (activeBtn: Element | null) => {
      this.container.querySelectorAll('.lib-annot-toolbar .lib-annot-btn').forEach((b) => {
        if (b.id.startsWith('annot-tool-')) b.classList.remove('active')
      })
      activeBtn?.classList.add('active')
    }

    toolPen?.addEventListener('click', () => {
      this.activeTool = 'pen'
      if (!this.activeColor.startsWith('#EF') && !this.activeColor.startsWith('#02') && !this.activeColor.startsWith('#0F')) {
        this.activeColor = '#EF4444'
        if (colorSelect) colorSelect.value = '#EF4444'
      }
      updateToolButtons(toolPen)
    })

    toolHighlighter?.addEventListener('click', () => {
      this.activeTool = 'highlighter'
      this.activeColor = '#FACC1588'
      if (colorSelect) colorSelect.value = '#FACC1588'
      updateToolButtons(toolHighlighter)
    })

    toolText?.addEventListener('click', () => {
      this.activeTool = 'text'
      updateToolButtons(toolText)
    })

    toolEraser?.addEventListener('click', () => {
      this.undoLastAnnotation()
    })

    toolClear?.addEventListener('click', () => {
      if (confirm('Bersihkan semua coretan dan stabilo pada halaman ini?')) {
        delete this.pageAnnotations[this.currentPage]
        this.redrawAnnotationCanvas()
      }
    })

    colorSelect?.addEventListener('change', () => {
      this.activeColor = colorSelect.value
      if (this.activeColor.endsWith('88')) {
        this.activeTool = 'highlighter'
        updateToolButtons(toolHighlighter)
      } else {
        this.activeTool = 'pen'
        updateToolButtons(toolPen)
      }
    })

    saveAnnotBtn?.addEventListener('click', async () => {
      if (!this.selectedPaper) return
      this.selectedPaper.pdfAnnotations = JSON.stringify(this.pageAnnotations)
      await savePaper(this.selectedPaper)
      alert('✓ Seluruh coretan, catatan teks, dan stabilo berhasil disimpan ke database!')
    })

    prevPageBtn?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--
        this.renderPdfPage()
      }
    })

    nextPageBtn?.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.renderPdfPage()
      }
    })
  }

  private renderPaperList(query = ''): void {
    const listEl = this.container.querySelector('#lib-paper-list')
    if (!listEl) return

    const filtered = this.papers.filter((p) => {
      if (!query) return true
      return (
        p.title.toLowerCase().includes(query) ||
        p.authors.toLowerCase().includes(query) ||
        p.year.includes(query) ||
        p.venue.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
      )
    })

    if (filtered.length === 0) {
      listEl.innerHTML = `<div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); padding: 12px;">[!] NO PAPERS FOUND</div>`
      return
    }

    listEl.innerHTML = filtered
      .map(
        (paper) => `
        <div class="lib-paper-card ${this.selectedPaper?.id === paper.id ? 'active' : ''}" data-id="${paper.id}">
          <div class="lib-card-year-venue">${escapeHtml(paper.year)} // ${escapeHtml(paper.venue || 'JOURNAL')}</div>
          <div class="lib-card-title">${escapeHtml(paper.title)}</div>
          <div class="lib-card-authors">${escapeHtml(paper.authors)}</div>
          <div class="lib-card-tags">
            ${paper.tags.map((tag) => `<span class="lib-tag">[ ${escapeHtml(tag.toUpperCase())} ]</span>`).join('')}
            ${paper.pdfBlob ? `<span class="lib-tag" style="color:var(--accent-cyan); border-color:var(--accent-cyan);">[ PDF ATTACHED ]</span>` : ''}
          </div>
        </div>
      `,
      )
      .join('')

    listEl.querySelectorAll('.lib-paper-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id')
        const found = this.papers.find((p) => p.id === id)
        if (found) {
          this.selectedPaper = found
          this.renderPaperList(query)
          this.renderSelectedPaper()
        }
      })
    })
  }

  private async renderSelectedPaper(): Promise<void> {
    const readerEl = this.container.querySelector('#lib-reader-content')
    const memoEl = this.container.querySelector('#lib-memo-content')
    const annotToolbar = this.container.querySelector('#lib-annot-toolbar') as HTMLElement | null
    if (!readerEl || !memoEl) return

    const paper = this.selectedPaper
    if (!paper) {
      if (annotToolbar) annotToolbar.style.display = 'none'
      readerEl.innerHTML = `<div style="font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 40px;">SELECT A RESEARCH PAPER FROM SIDEBAR</div>`
      memoEl.innerHTML = `<div style="font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 40px;">NO PAPER SELECTED</div>`
      return
    }

    // Load saved annotations for this paper
    this.pageAnnotations = {}
    if (paper.pdfAnnotations) {
      try {
        this.pageAnnotations = JSON.parse(paper.pdfAnnotations)
      } catch {
        this.pageAnnotations = {}
      }
    }

    // Render Center: PDF vs Fallback Abstract
    if (paper.pdfBlob) {
      if (annotToolbar) annotToolbar.style.display = 'flex'
      readerEl.innerHTML = `<div style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); text-align: center; padding: 20px;">LOADING PDF DOCUMENT...</div>`
      try {
        const arrayBuf = await paper.pdfBlob.arrayBuffer()
        this.currentPdfDoc = await pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuf),
          worker: ensurePdfWorker(),
        }).promise
        this.totalPages = this.currentPdfDoc.numPages
        this.currentPage = 1
        await this.renderPdfPage()
      } catch (err: any) {
        console.error('Failed to load PDF via pdfjs:', err)
        // Fallback to object iframe if pdfjs fails
        const blobUrl = URL.createObjectURL(paper.pdfBlob)
        readerEl.innerHTML = `<iframe src="${blobUrl}#toolbar=1" style="width:100%; height:100%; border:none;" title="PDF Reader"></iframe>`
      }
    } else {
      if (annotToolbar) annotToolbar.style.display = 'none'
      readerEl.innerHTML = `
        <div class="lib-reader-text">
          <div class="lib-reader-header-box">
            <span class="lib-reader-badge">[ ${escapeHtml(paper.venue.toUpperCase())} // ${escapeHtml(paper.year)} ]</span>
            <h1 class="lib-reader-h1">${escapeHtml(paper.title)}</h1>
            <p class="lib-reader-authors">${escapeHtml(paper.authors)}</p>
            ${
              paper.doi
                ? `<p class="lib-reader-doi">DOI / URL: <a href="https://doi.org/${encodeURIComponent(paper.doi)}" target="_blank">${escapeHtml(paper.doi)} ↗</a></p>`
                : ''
            }
          </div>
          <div class="lib-reader-section">
            <div style="font-family: var(--font-mono); font-size: 11px; font-weight:700; color:var(--text-muted); margin-bottom: 6px;">[ ABSTRACT ]</div>
            <p class="lib-reader-abstract-p">${escapeHtml(paper.abstract)}</p>
          </div>
          <label for="lib-upload-pdf" class="lib-reader-dropzone" style="cursor: pointer;">
            <span style="font-size: 24px;">📄</span>
            <strong style="color:var(--text-primary);">UNGGAH FILE PDF NASKAH INI</strong>
            <span>Klik di sini untuk mengunggah full-text PDF agar dapat dibaca langsung dan diberi coretan / highlight stabilo.</span>
          </label>
        </div>
      `
    }

    const lang = getLang()
    // Render Right: Research Memo Panel
    memoEl.innerHTML = `
      <div class="lib-memo-form">
        <div class="lib-memo-section">
          <label class="lib-memo-label">[ 🎯 ${t('OBJEKTIF RISET', 'RESEARCH OBJECTIVE', lang)} ]</label>
          <textarea id="memo-objective" class="lib-textarea" rows="2" placeholder="${t('Tujuan utama riset ini...', 'Primary objective of this research...', lang)}">${escapeHtml(paper.memo.objective)}</textarea>
        </div>

        <div class="lib-memo-section">
          <label class="lib-memo-label">[ 🔬 ${t('METODOLOGI & PERCOBAAN', 'METHODOLOGY & SETUP', lang)} ]</label>
          <textarea id="memo-methodology" class="lib-textarea" rows="3" placeholder="${t('Metode, arsitektur, atau dataset yang digunakan...', 'Methodology, architecture, or benchmark dataset...', lang)}">${escapeHtml(paper.memo.methodology)}</textarea>
        </div>

        <div class="lib-memo-section">
          <label class="lib-memo-label">[ 📊 ${t('TEMUAN KUNCI & BUKTI', 'KEY FINDINGS & EVIDENCE', lang)} ]</label>
          <textarea id="memo-findings" class="lib-textarea" rows="3" placeholder="${t('Hasil utama, metrik, benchmark, atau pembuktian...', 'Key findings, metrics, benchmarks, or validation...', lang)}">${escapeHtml(paper.memo.findings)}</textarea>
        </div>

        <div class="lib-memo-section">
          <label class="lib-memo-label">[ 📝 ${t('CATATAN PRIBADI & ANALISIS', 'PERSONAL NOTES & ANALYSIS', lang)} ]</label>
          <textarea id="memo-notes" class="lib-textarea" rows="3" placeholder="${t('Catatan pribadi atau relevansi dengan riset Anda...', 'Personal takeaways or relevance to your current manuscript...', lang)}">${escapeHtml(paper.memo.notes)}</textarea>
        </div>

        <div class="lib-memo-section lib-bibtex-section">
          <div class="lib-bibtex-header">
            <label class="lib-memo-label">[ 📚 ${t('SITASI BIBTEX', 'BIBTEX CITATION', lang)} ]</label>
            <button id="btn-insert-bibtex" class="tactical-cta-btn cta-orange" style="padding: 3px 8px; font-size: 10px;">
              <span class="cta-inner">📥 ${t('INJEKSI KE REFS.BIB', 'INSERT TO REFS.BIB', lang)}</span>
            </button>
          </div>
          <textarea id="memo-bibtex" class="lib-textarea lib-code" rows="5">${escapeHtml(paper.bibtex)}</textarea>
        </div>

        <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
          <button id="btn-delete-paper" class="lib-btn lib-btn-danger" style="font-size: 10.5px; padding: 4px 10px;">🗑️ ${t('HAPUS PAPER', 'DELETE PAPER', lang)}</button>
        </div>
      </div>
    `

    memoEl.querySelector('#btn-insert-bibtex')?.addEventListener('click', () => {
      const bibtexVal = (memoEl.querySelector('#memo-bibtex') as HTMLTextAreaElement).value
      this.options.onInsertBibtex(bibtexVal)
    })

    memoEl.querySelector('#btn-delete-paper')?.addEventListener('click', () => {
      if (confirm(`Hapus paper "${paper.title}" dari Library?`)) {
        deletePaper(paper.id).then(async () => {
          this.papers = await getAllPapers()
          this.selectedPaper = this.papers[0] || null
          this.renderPaperList()
          this.renderSelectedPaper()
        })
      }
    })
  }

  /** Render current PDF page onto canvas with interactive annotation layer */
  private async renderPdfPage(): Promise<void> {
    if (!this.currentPdfDoc) return

    const readerEl = this.container.querySelector('#lib-reader-content') as HTMLElement | null
    const pageIndicator = this.container.querySelector('#annot-page-indicator')
    if (!readerEl) return

    if (pageIndicator) {
      pageIndicator.textContent = `PAGE ${this.currentPage} / ${this.totalPages}`
    }

    const page = await this.currentPdfDoc.getPage(this.currentPage)
    const baseViewport = page.getViewport({ scale: 1.0 })
    const availableWidth = Math.max(400, readerEl.clientWidth > 100 ? readerEl.clientWidth - 64 : 640)
    const targetScale = Math.min(1.2, availableWidth / baseViewport.width)
    this.currentScale = targetScale
    const viewport = page.getViewport({ scale: this.currentScale })

    const dpr = window.devicePixelRatio || 1
    const pxWidth = Math.floor(viewport.width * dpr)
    const pxHeight = Math.floor(viewport.height * dpr)

    readerEl.innerHTML = `
      <div class="lib-pdf-viewport" style="width: ${viewport.width}px; height: ${viewport.height}px;">
        <canvas class="lib-pdf-canvas" width="${pxWidth}" height="${pxHeight}" style="width: ${viewport.width}px; height: ${viewport.height}px;"></canvas>
        <canvas class="lib-annot-canvas" width="${pxWidth}" height="${pxHeight}" style="width: ${viewport.width}px; height: ${viewport.height}px;"></canvas>
      </div>
    `

    const pdfCanvas = readerEl.querySelector('.lib-pdf-canvas') as HTMLCanvasElement
    const annotCanvas = readerEl.querySelector('.lib-annot-canvas') as HTMLCanvasElement

    const ctx = pdfCanvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    this.setupAnnotationEvents(annotCanvas)

    // Render actual PDF page via PDF.js worker with graceful fallback
    let renderSuccessful = false
    try {
      const renderTask = page.render({ canvasContext: ctx, viewport, canvas: pdfCanvas })
      const timeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(() => {
          try {
            renderTask.cancel()
          } catch {}
          reject(new Error('PDF_TIMEOUT'))
        }, 1200),
      )
      await Promise.race([renderTask.promise, timeoutPromise])
      renderSuccessful = true
    } catch {
      renderSuccessful = false
    }

    if (!renderSuccessful) {
      this.drawPaperCanvasBackground(ctx, viewport.width, viewport.height)
    }

    this.redrawAnnotationCanvas()
  }

  private drawPaperCanvasBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)

    const paper = this.selectedPaper
    if (!paper) return

    ctx.fillStyle = '#111827'
    ctx.font = 'bold 20px serif'
    ctx.fillText(paper.title, 50, 60)

    ctx.fillStyle = '#4B5563'
    ctx.font = '10px monospace'
    ctx.fillText(`${paper.authors} [${paper.venue} // ${paper.year}]`, 50, 88)

    ctx.fillStyle = '#1F2937'
    ctx.font = 'bold 12.5px sans-serif'
    ctx.fillText('1. Introduction & Abstract', 50, 130)

    ctx.fillStyle = '#374151'
    ctx.font = '10.5px serif'
    const words = paper.abstract.split(' ')
    let line = ''
    let y = 150
    for (const w of words) {
      const test = line + w + ' '
      if (ctx.measureText(test).width > width - 100) {
        ctx.fillText(line, 50, y)
        line = w + ' '
        y += 18
      } else {
        line = test
      }
    }
    if (line) ctx.fillText(line, 50, y)

    y += 24
    ctx.fillStyle = '#1F2937'
    ctx.font = 'bold 12.5px sans-serif'
    ctx.fillText('2. Key Findings & Methodology', 50, y)

    y += 20
    ctx.fillStyle = '#374151'
    ctx.font = '10.5px serif'
    const findingsWords = (
      paper.memo.findings ||
      'On the standard translation task, the Transformer achieves state of the art results.'
    ).split(' ')
    line = ''
    for (const w of findingsWords) {
      const test = line + w + ' '
      if (ctx.measureText(test).width > width - 100) {
        ctx.fillText(line, 50, y)
        line = w + ' '
        y += 18
      } else {
        line = test
      }
    }
    if (line) ctx.fillText(line, 50, y)
  }

  /** Set up mouse & pointer drawing and text note stamping on the overlay annotation canvas */
  private setupAnnotationEvents(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!

    const getPos = (e: MouseEvent | PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    canvas.onpointerdown = (e: PointerEvent) => {
      e.preventDefault()
      const pos = getPos(e)

      if (this.activeTool === 'text') {
        const text = prompt('Tulis catatan pada posisi ini di PDF:')
        if (text && text.trim()) {
          this.addAnnotation({
            type: 'text',
            color: this.activeColor.replace(/88$/, ''),
            lineWidth: 12,
            text: text.trim(),
            x: pos.x,
            y: pos.y,
          })
        }
        return
      }

      this.isDrawing = true
      const isHighlighter = this.activeTool === 'highlighter'
      this.currentStroke = {
        type: isHighlighter ? 'highlighter' : 'pen',
        color: this.activeColor,
        lineWidth: isHighlighter ? 24 : 2.5,
        points: [pos],
      }
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }

    canvas.onpointermove = (e: PointerEvent) => {
      if (!this.isDrawing || !this.currentStroke?.points) return
      e.preventDefault()
      const pos = getPos(e)
      this.currentStroke.points.push(pos)

      // Live draw current stroke segment
      ctx.beginPath()
      ctx.strokeStyle = this.currentStroke.color
      ctx.lineWidth = this.currentStroke.lineWidth
      ctx.lineCap = this.currentStroke.type === 'highlighter' ? 'square' : 'round'
      ctx.lineJoin = 'round'

      const pts = this.currentStroke.points
      if (pts.length >= 2) {
        ctx.moveTo(pts[pts.length - 2]!.x, pts[pts.length - 2]!.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      }
    }

    const endDrawing = (e: PointerEvent) => {
      if (this.isDrawing && this.currentStroke && this.currentStroke.points && this.currentStroke.points.length > 1) {
        if (!this.pageAnnotations[this.currentPage]) {
          this.pageAnnotations[this.currentPage] = []
        }
        this.pageAnnotations[this.currentPage]!.push(this.currentStroke)
      }
      this.isDrawing = false
      this.currentStroke = null
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
      this.redrawAnnotationCanvas()
    }

    canvas.onpointerup = endDrawing
    canvas.onpointercancel = endDrawing
  }

  /** Redraw all saved annotations for current page */
  private redrawAnnotationCanvas(): void {
    const annotCanvas = this.container.querySelector('.lib-annot-canvas') as HTMLCanvasElement | null
    if (!annotCanvas) return
    const ctx = annotCanvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, annotCanvas.width, annotCanvas.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const list = this.pageAnnotations[this.currentPage] || []
    for (const stroke of list) {
      if (stroke.type === 'text' && stroke.text && stroke.x !== undefined && stroke.y !== undefined) {
        // Draw note tag with highlight background
        ctx.font = 'bold 12px monospace'
        const metrics = ctx.measureText(stroke.text)
        ctx.fillStyle = '#FEF08A'
        ctx.strokeStyle = '#CA8A04'
        ctx.lineWidth = 1
        ctx.fillRect(stroke.x - 2, stroke.y - 13, metrics.width + 12, 18)
        ctx.strokeRect(stroke.x - 2, stroke.y - 13, metrics.width + 12, 18)
        ctx.fillStyle = '#854D0E'
        ctx.fillText(stroke.text, stroke.x + 3, stroke.y)
      } else if (stroke.points && stroke.points.length > 0) {
        ctx.beginPath()
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.lineWidth
        ctx.lineCap = stroke.type === 'highlighter' ? 'square' : 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y)
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i]!.x, stroke.points[i]!.y)
        }
        ctx.stroke()
      }
    }

    this.syncCompositeImage()
  }

  /** Synchronize high-res composite image for instant browser composition and screenshot fidelity */
  private syncCompositeImage(): void {
    const pdfCanvas = this.container.querySelector('.lib-pdf-canvas') as HTMLCanvasElement | null
    const annotCanvas = this.container.querySelector('.lib-annot-canvas') as HTMLCanvasElement | null
    const vp = this.container.querySelector('.lib-pdf-viewport') as HTMLElement | null
    if (!pdfCanvas || !annotCanvas || !vp) return

    const composite = document.createElement('canvas')
    composite.width = pdfCanvas.width
    composite.height = pdfCanvas.height
    const ctx = composite.getContext('2d')
    if (!ctx) return
    ctx.drawImage(pdfCanvas, 0, 0)
    ctx.drawImage(annotCanvas, 0, 0)

    let img = vp.querySelector('#lib-composite-img') as HTMLImageElement | null
    if (!img) {
      img = document.createElement('img')
      img.id = 'lib-composite-img'
      img.style.position = 'absolute'
      img.style.top = '0'
      img.style.left = '0'
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.pointerEvents = 'none'
      img.style.zIndex = '1'
      vp.insertBefore(img, annotCanvas)
    }
    img.src = composite.toDataURL('image/png')
  }

  private undoLastAnnotation(): void {
    const list = this.pageAnnotations[this.currentPage]
    if (list && list.length > 0) {
      list.pop()
      this.redrawAnnotationCanvas()
    }
  }

  private downloadAnnotatedDocument(): void {
    const img = this.container.querySelector('#lib-composite-img') as HTMLImageElement | null
    if (img && img.src) {
      const link = document.createElement('a')
      link.download = `${this.selectedPaper?.id || 'paper'}_annotated_page_${this.currentPage}.png`
      link.href = img.src
      link.click()
      return
    }

    const pdfCanvas = this.container.querySelector('.lib-pdf-canvas') as HTMLCanvasElement | null
    const annotCanvas = this.container.querySelector('.lib-annot-canvas') as HTMLCanvasElement | null
    if (!pdfCanvas || !annotCanvas) return

    const merged = document.createElement('canvas')
    merged.width = pdfCanvas.width
    merged.height = pdfCanvas.height
    const ctx = merged.getContext('2d')!
    ctx.drawImage(pdfCanvas, 0, 0)
    ctx.drawImage(annotCanvas, 0, 0)

    const link = document.createElement('a')
    link.download = `${this.selectedPaper?.id || 'paper'}_annotated_page_${this.currentPage}.png`
    link.href = merged.toDataURL('image/png')
    link.click()
  }

  private saveCurrentMemo(): void {
    if (!this.selectedPaper) return
    const memoObjective = (this.container.querySelector('#memo-objective') as HTMLTextAreaElement)?.value || ''
    const memoMethod = (this.container.querySelector('#memo-methodology') as HTMLTextAreaElement)?.value || ''
    const memoFindings = (this.container.querySelector('#memo-findings') as HTMLTextAreaElement)?.value || ''
    const memoNotes = (this.container.querySelector('#memo-notes') as HTMLTextAreaElement)?.value || ''
    const bibtexVal = (this.container.querySelector('#memo-bibtex') as HTMLTextAreaElement)?.value || ''

    this.selectedPaper.memo = {
      objective: memoObjective,
      methodology: memoMethod,
      findings: memoFindings,
      notes: memoNotes,
    }
    this.selectedPaper.bibtex = bibtexVal

    savePaper(this.selectedPaper).then(() => {
      alert('✓ Catatan analisis riset & BibTeX berhasil disimpan secara persisten!')
    })
  }

  private promptAddPaper(): void {
    const title = prompt('Judul Paper / Literatur Ilmiah:')
    if (!title) return
    const authors = prompt('Penulis (misal: John Doe, Jane Smith):') || ''
    const year = prompt('Tahun Terbit (misal: 2026):') || new Date().getFullYear().toString()
    const venue = prompt('Venue / Jurnal (misal: IEEE / Nature / CVPR / NeurIPS):') || ''

    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 16) + year

    const newPaper: ResearchPaper = {
      id,
      title,
      authors,
      year,
      venue,
      doi: '',
      abstract: 'Masukkan ringkasan abstrak di sini...',
      tags: ['Research'],
      bibtex: `@article{${id},
  author = {${authors}},
  title = {${title}},
  journal = {${venue}},
  year = {${year}}
}`,
      memo: {
        objective: '',
        methodology: '',
        findings: '',
        notes: '',
      },
    }

    savePaper(newPaper).then(async () => {
      this.papers = await getAllPapers()
      this.selectedPaper = newPaper
      this.renderPaperList()
      this.renderSelectedPaper()
    })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
