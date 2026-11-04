import { t } from '../ui/i18n'
import { tacticalAlert } from '../ui/tactical-dialog'

export interface DesktopMenuOptions {
  onNewFile: () => void
  onNewFolder: () => void
  onUploadZip: (file: File) => void
  onDownloadPdf: () => void
  onExportArxiv: () => void
  onVersionHistory: () => void
  onBackDashboard: () => void
  onSearch: () => void
  onReview: () => void
  onComments: () => void
  onToggleSidebar: () => void
  onTogglePreview: () => void
  onToggleLogs: () => void
  onSetEditorMode: (mode: 'visual' | 'code' | 'split') => void
  onOpenLibrary: () => void
  onToggleTheme: () => void
  onTikzScratchpad: () => void
  onAiAssistant: () => void
  onInsertSnippet: (snippet: string) => void
  onToggleLang: () => void
}

export class DesktopMenuBar {
  private options: DesktopMenuOptions
  private activeDropdown: HTMLElement | null = null

  constructor(options: DesktopMenuOptions) {
    this.options = options
    this.initDropdowns()
    this.initSplitters()
    this.initKeyboardShortcuts()
  }

  private initDropdowns(): void {
    const triggers = document.querySelectorAll<HTMLButtonElement>('.menu-trigger-btn')

    triggers.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const parent = btn.closest('.menu-item-dropdown') as HTMLElement | null
        const content = parent?.querySelector('.menu-dropdown-content') as HTMLElement | null

        if (this.activeDropdown && this.activeDropdown !== content) {
          this.activeDropdown.classList.remove('open')
        }

        if (content) {
          content.classList.toggle('open')
          this.activeDropdown = content.classList.contains('open') ? content : null
        }
      })
    })

    // Click outside closes any open dropdown
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.menu-item-dropdown')) {
        this.closeAllDropdowns()
      }
    })

    // File Menu Actions
    document.getElementById('menu-file-new')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onNewFile()
    })

    document.getElementById('menu-file-folder')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onNewFolder()
    })

    const uploadInput = document.getElementById('menu-upload-input') as HTMLInputElement | null
    uploadInput?.addEventListener('change', () => {
      const f = uploadInput.files?.[0]
      if (f) {
        this.closeAllDropdowns()
        this.options.onUploadZip(f)
      }
    })

    document.getElementById('menu-file-download-pdf')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onDownloadPdf()
    })

    document.getElementById('menu-file-arxiv')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onExportArxiv()
    })

    document.getElementById('menu-file-history')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onVersionHistory()
    })

    document.getElementById('menu-file-exit')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onBackDashboard()
    })

    // Edit Menu Actions
    document.getElementById('menu-edit-search')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onSearch()
    })

    document.getElementById('menu-edit-review')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onReview()
    })

    document.getElementById('menu-edit-comments')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onComments()
    })

    // View Menu Actions
    document.getElementById('menu-view-sidebar')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onToggleSidebar()
    })

    document.getElementById('menu-view-preview')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onTogglePreview()
    })

    document.getElementById('menu-view-logs')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onToggleLogs()
    })

    document.getElementById('menu-view-visual')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onSetEditorMode('visual')
    })

    document.getElementById('menu-view-code')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onSetEditorMode('code')
    })

    document.getElementById('menu-view-split')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onSetEditorMode('split')
    })

    document.getElementById('menu-view-library')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onOpenLibrary()
    })

    document.getElementById('menu-view-theme')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onToggleTheme()
    })

    // Insert Menu Actions
    document.getElementById('menu-insert-tikz')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onTikzScratchpad()
    })

    document.getElementById('menu-insert-ai')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onAiAssistant()
    })

    document.getElementById('menu-insert-eq')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onInsertSnippet('\n\\begin{equation}\n  E = mc^2\n\\end{equation}\n')
    })

    document.getElementById('menu-insert-table')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onInsertSnippet(
        '\n\\begin{table}[htbp]\n  \\centering\n  \\caption{Tabel Baru}\n  \\begin{tabular}{lcc}\n    \\toprule\n    Parameter & Nilai & Satuan \\\\\n    \\midrule\n    Sampel 1 & 10.5 & mg/L \\\\\n    \\bottomrule\n  \\end{tabular}\n\\end{table}\n'
      )
    })

    document.getElementById('menu-insert-fig')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onInsertSnippet(
        '\n\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.8\\linewidth]{figures/plot.png}\n  \\caption{Deskripsi gambar}\n  \\label{fig:diagram}\n\\end{figure}\n'
      )
    })

    // Help Menu Actions
    document.getElementById('menu-help-lang')?.addEventListener('click', () => {
      this.closeAllDropdowns()
      this.options.onToggleLang()
    })

    document.getElementById('menu-help-about')?.addEventListener('click', async () => {
      this.closeAllDropdowns()
      await tacticalAlert({
        title: t('Tentang WasmTex Studio', 'About WasmTex Studio'),
        specTag: 'WASMTEX // CORTEX STUDIO',
        message: t(
          'WasmTex Studio — Editor LaTeX Web Taktikal Berbasis WebAssembly.\nMenyediakan mesin pdfTeX, XeTeX, dan LuaHBTeX WASM in-browser dengan pratinjau PDF instan, visual writing Word-style, serta pustaka riset akademik.',
          'WasmTex Studio — Tactical In-Browser LaTeX Studio powered by WebAssembly.\nFeatures offline-first pdfTeX, XeTeX, and LuaHBTeX engines with real-time PDF rendering, Word-style visual editing, and academic literature library.'
        ),
        type: 'info',
      })
    })

    // Header Fast Toggle Buttons
    document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
      this.options.onToggleSidebar()
    })

    document.getElementById('btn-toggle-preview')?.addEventListener('click', () => {
      this.options.onTogglePreview()
    })

    document.getElementById('btn-collapse-sidebar-inner')?.addEventListener('click', () => {
      this.options.onToggleSidebar()
    })
  }

  private closeAllDropdowns(): void {
    document.querySelectorAll('.menu-dropdown-content.open').forEach((el) => {
      el.classList.remove('open')
    })
    this.activeDropdown = null
  }

  /**
   * Resizable Splitter Logic (Bisa digeser)
   * Allows dragging divider-sidebar and divider-preview to resize panels.
   */
  private initSplitters(): void {
    const sidebarDivider = document.getElementById('divider-sidebar')
    const previewDivider = document.getElementById('divider-preview')
    const sidebar = document.getElementById('file-tree-panel')
    const editorWrapper = document.getElementById('editor-wrapper')
    const previewPanel = document.getElementById('preview-panel')

    // 1. Sidebar Splitter
    if (sidebarDivider && sidebar) {
      let isDragging = false
      let startX = 0
      let startW = 0

      const onPointerDown = (e: PointerEvent) => {
        isDragging = true
        startX = e.clientX
        startW = sidebar.getBoundingClientRect().width
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
        sidebarDivider.setPointerCapture(e.pointerId)
      }

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return
        const dx = e.clientX - startX
        const newW = Math.min(Math.max(startW + dx, 160), 480)
        sidebar.style.width = `${newW}px`
      }

      const onPointerUp = (e: PointerEvent) => {
        if (!isDragging) return
        isDragging = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        try {
          sidebarDivider.releasePointerCapture(e.pointerId)
        } catch {}
        window.dispatchEvent(new Event('resize'))
      }

      sidebarDivider.addEventListener('pointerdown', onPointerDown)
      sidebarDivider.addEventListener('pointermove', onPointerMove)
      sidebarDivider.addEventListener('pointerup', onPointerUp)
    }

    // 2. Preview Splitter
    if (previewDivider && editorWrapper && previewPanel) {
      let isDragging = false
      let startX = 0
      let startEditorW = 0
      let startPreviewW = 0

      const onPointerDown = (e: PointerEvent) => {
        isDragging = true
        startX = e.clientX
        startEditorW = editorWrapper.getBoundingClientRect().width
        startPreviewW = previewPanel.getBoundingClientRect().width
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
        previewDivider.setPointerCapture(e.pointerId)
      }

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return
        const dx = e.clientX - startX
        const totalW = startEditorW + startPreviewW
        const newEditorW = Math.min(Math.max(startEditorW + dx, 240), totalW - 240)
        const newPreviewW = totalW - newEditorW

        editorWrapper.style.flex = `0 0 ${newEditorW}px`
        previewPanel.style.flex = `0 0 ${newPreviewW}px`
      }

      const onPointerUp = (e: PointerEvent) => {
        if (!isDragging) return
        isDragging = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        try {
          previewDivider.releasePointerCapture(e.pointerId)
        } catch {}
        window.dispatchEvent(new Event('resize'))
      }

      previewDivider.addEventListener('pointerdown', onPointerDown)
      previewDivider.addEventListener('pointermove', onPointerMove)
      previewDivider.addEventListener('pointerup', onPointerUp)
    }
  }

  private initKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      // Escape closes any open menu dropdown
      if (e.key === 'Escape') {
        this.closeAllDropdowns()
      }
    })
  }
}
