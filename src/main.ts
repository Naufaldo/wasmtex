import { getCurrentUser } from './auth/auth-store'
import type { WasmTexOptions } from './component-types'
import { VisualEditor } from './editor/visual-editor'
import { configureMonacoWorkers } from './editor/workers'
import { warmup } from './engine/warmup'
import { AiAssistantPanel } from './features/ai-assistant-panel'
import { ArxivExportModal } from './features/arxiv-exporter'
import { CommentsPanel } from './features/comments-panel'
import { ReviewManager } from './features/review-manager'
import { SearchDialog } from './features/search-dialog'
import { TikzScratchpadModal } from './features/tikz-scratchpad'
import { VersionHistoryDialog } from './features/version-history'
import { defaultFileContent } from './fs/default-file-content'
import { unzipLatexProject } from './fs/unzip'
import { WasmTexCompiler } from './headless'
import { LibraryView } from './library/library-view'
import type { SectionDef } from './lsp/types'
import {
  filterLogEntries,
  mergeDiagnostics,
  type OverleafLogSummary,
  type PanelDiagnostic,
  parseOverleafLogEntries,
  resolveAddFile,
  summarizeLogEntries,
} from './main-helpers'
import { DashboardView } from './projects/dashboard-view'
import { getProject, type ProjectItem, saveProject } from './projects/project-store'
import type { AppStatus, WarmupCache } from './types'
import { HomeView } from './ui/home-view'
import { getLang, type Lang, t, toggleLang } from './ui/i18n'
import { tacticalAlert, tacticalConfirm, tacticalPrompt } from './ui/tactical-dialog'
import { configurePdfjsWorker } from './viewer/pdf-viewer'
import { WasmTex } from './wasmtex'
import './styles.css'

// Start warmup immediately — fetches TeX Live files in parallel while
// Monaco and the rest of the UI loads. Skipped when the built-in persistent
// cache (`?cache=1`) is active, since the durable cache seeds the engine and a
// network warmup on every load would defeat the "near-zero fetches" goal.
const persistentCacheRequested = new URLSearchParams(window.location.search).get('cache') === '1'
const warmupPromise: Promise<WarmupCache> | null = persistentCacheRequested
  ? null
  : warmup({ texliveUrl: `${window.location.origin}/texlive/2025/` })
const WARMUP_TIMEOUT_MS = 8_000

// Configure workers for the demo app — must happen before WasmTex is created
// so that the bundler (Vite) resolves the worker files from node_modules.
configureMonacoWorkers()
configurePdfjsWorker()

const editorContainer = document.getElementById('editor-container')!
const previewContainer = document.getElementById('preview-container')!
const fileTreeContainer = document.getElementById('file-tree-list') as HTMLDivElement
const outlineContainer = document.getElementById('outline-list') as HTMLDivElement
const errorLogList = document.getElementById('error-log-list') as HTMLDivElement
const addFileButton = document.getElementById('add-file-btn') as HTMLButtonElement
const texliveVersionSelect = document.getElementById('texlive-version') as HTMLSelectElement
const statusElement = document.getElementById('status') as HTMLSpanElement
const statusDetailElement = document.getElementById('status-detail') as HTMLSpanElement
const activeProjectId = 'default'
let editorRef: WasmTex | null = null
let visualEditorRef: VisualEditor | null = null
let lastCompileErrors: PanelDiagnostic[] = []
// Static (LSP/lint) diagnostics, kept so a compile re-renders the union instead of
// clobbering them out of the panel.
let lastDiagnostics: PanelDiagnostic[] = []
let lastLogDiagnostics: PanelDiagnostic[] = []
let allCurrentDiagnostics: PanelDiagnostic[] = []
let lastRawLog = ''
let currentLogFilter: 'all' | 'error' | 'warning' | 'info' = 'all'
let isViewingRawLog = false

const DEFAULT_TEXLIVE = '2025' as const
const DEFAULT_PROJECT = 'default' as const
type DemoTexliveVersion = '2025' | '2026'
type DemoProject = 'default' | 'sample'

const SAMPLE_FILES = ['main.tex', 'introduction.tex', 'refs.bib']

const FILE_EXTENSIONS_THAT_ARE_BINARY = /\.(png|jpg|jpeg|gif|pdf)$/i

interface DemoConfig {
  texliveVersion: DemoTexliveVersion
  project: DemoProject
  persistentCache: boolean
  incremental: boolean
}

function readDemoConfig(): DemoConfig {
  const urlParams = new URLSearchParams(window.location.search)
  const tlParam = urlParams.get('tl')
  const texliveVersion = tlParam === '2025' || tlParam === '2026' ? tlParam : DEFAULT_TEXLIVE
  const projParam = urlParams.get('proj')
  const project = projParam === 'sample' ? 'sample' : DEFAULT_PROJECT
  const persistentCache = urlParams.get('cache') === '1'
  // `?incremental=1` opts the demo into the incremental fast path (#99), for the e2e.
  const incremental = urlParams.get('incremental') === '1'

  return { texliveVersion, project, persistentCache, incremental }
}

function setDemoParam(key: string, value: string | null): void {
  const url = new URL(window.location.href)

  if (value) {
    url.searchParams.set(key, value)
  } else {
    url.searchParams.delete(key)
  }

  if (url.toString() !== window.location.href) window.location.href = url.toString()
}

const sectionIndentByLevel: Record<SectionDef['level'], number> = {
  part: 0,
  chapter: 1,
  section: 2,
  subsection: 3,
  subsubsection: 4,
  paragraph: 5,
}

let activeFile = 'main.tex'

function loadSampleProject(): Promise<Record<string, string | Uint8Array>> {
  const timestamp = Date.now()
  const files: Record<string, string | Uint8Array> = {}

  const loaders = SAMPLE_FILES.map(async (name) => {
    const resp = await fetch(`${import.meta.env.BASE_URL}sample/${name}?t=${timestamp}`)

    if (!resp.ok) return

    const isBinary = FILE_EXTENSIONS_THAT_ARE_BINARY.test(name)

    files[name] = isBinary ? new Uint8Array(await resp.arrayBuffer()) : await resp.text()
  })

  return Promise.all(loaders).then(() => files)
}

function persistActiveProject(): void {
  if (!activeProjectId || !editorRef) return
  getProject(activeProjectId).then((existing) => {
    const filesMap: Record<string, string> = {}
    for (const f of editorRef!.listFiles()) {
      const c = editorRef!.getFile(f)
      if (typeof c === 'string') filesMap[f] = c
    }
    const curUser = getCurrentUser()
    const title =
      (document.getElementById('doc-title-input') as HTMLInputElement)?.value ||
      existing?.title ||
      'Untitled Manuscript'
    const proj: ProjectItem = {
      id: activeProjectId,
      title,
      owner: existing?.owner || curUser?.name || curUser?.username || 'You',
      ownerId: existing?.ownerId || curUser?.userId || 'usr_admin',
      lastModified: Date.now(),
      tags: existing?.tags || [],
      files: filesMap,
    }
    if (existing?.archived !== undefined) proj.archived = existing.archived
    if (existing?.trashed !== undefined) proj.trashed = existing.trashed
    saveProject(proj, curUser)
  })
}

function renderFileList(files: string[]): void {
  const normalized = [...new Set(files)].sort((a, b) => a.localeCompare(b))

  if (normalized.length === 0) {
    fileTreeContainer.innerHTML =
      '<div class="file-item" style="color: var(--text-muted); font-style: italic;">No files</div>'
    return
  }

  if (!normalized.includes(activeFile)) {
    if (normalized.includes('main.tex')) activeFile = 'main.tex'
    else activeFile = normalized[0]!
  }

  fileTreeContainer.innerHTML = ''
  const renderedFolders = new Set<string>()

  for (const filePath of normalized) {
    if (filePath.includes('/')) {
      const parts = filePath.split('/')
      const folderPath = parts.slice(0, -1).join('/')
      if (!renderedFolders.has(folderPath)) {
        renderedFolders.add(folderPath)
        const folderHeader = document.createElement('div')
        folderHeader.className = 'folder-tree-header'
        folderHeader.style.cssText =
          'padding: 5px 10px; font-weight: 700; font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; font-family: var(--font-mono);'
        folderHeader.textContent = `📁 ${folderPath}/`
        fileTreeContainer.appendChild(folderHeader)
      }
    }

    const item = document.createElement('div')
    item.className = `file-item${filePath === activeFile ? ' active' : ''}`
    const isSub = filePath.includes('/')
    const fileName = isSub ? filePath.split('/').pop()! : filePath
    if (isSub) {
      item.style.paddingLeft = '22px'
    }

    const icon = filePath.endsWith('.bib') ? '📚 ' : filePath.endsWith('.tex') ? '📄 ' : '📎 '
    item.textContent = `${icon}${fileName}`
    item.title = filePath

    item.addEventListener('click', () => {
      activeFile = filePath
      if (!editorRef) return

      editorRef.openFile(filePath)
      renderFileList(editorRef.listFiles())
      if (filePath.endsWith('.tex') && visualEditorRef) {
        const content = editorRef.getFile(filePath)
        if (typeof content === 'string') {
          visualEditorRef.setLatex(content)
        }
      }
    })

    if (filePath !== 'main.tex') {
      const del = document.createElement('button')

      del.className = 'delete-btn'
      del.textContent = '✕'
      del.title = `Delete ${filePath}`
      del.addEventListener('click', async (event) => {
        event.stopPropagation()

        const confirmed = await tacticalConfirm({
          title: t('Hapus Berkas', 'Delete File', getLang()),
          specTag: t('VFS // HAPUS BERKAS', 'VFS // DELETE FILE', getLang()),
          message: t(
            `Yakin ingin menghapus berkas "${filePath}"? Tindakan ini tidak dapat dibatalkan.`,
            `Are you sure you want to delete file "${filePath}"? This cannot be undone.`,
            getLang(),
          ),
          confirmText: t('YA, HAPUS', 'YES, DELETE', getLang()),
          danger: true,
        })
        if (!confirmed) return

        if (editorRef) {
          editorRef.deleteFile(filePath)
          renderFileList(editorRef.listFiles())
          persistActiveProject()
        }
      })

      item.appendChild(del)
    }

    fileTreeContainer.appendChild(item)
  }
}

function renderOutline(sections: SectionDef[]): void {
  outlineContainer.innerHTML = ''

  if (sections.length === 0) {
    const empty = document.createElement('div')

    empty.className = 'outline-empty'
    empty.textContent = 'No sections found'
    outlineContainer.appendChild(empty)
    return
  }

  const list = document.createElement('div')
  list.className = 'outline-list'

  for (const section of sections) {
    const item = document.createElement('div')
    item.className = 'outline-item'
    item.style.paddingLeft = `${sectionIndentByLevel[section.level] * 12 + 4}px`
    item.textContent = section.title
    item.title = `${section.title} (line ${section.location.line})`
    item.addEventListener('click', () => {
      activeFile = section.location.file
      if (!editorRef) return

      editorRef.revealLine(section.location.line, section.location.file)
      renderFileList(editorRef.listFiles())
    })

    list.appendChild(item)
  }

  outlineContainer.appendChild(list)
}

function updateLogBadges(summary: OverleafLogSummary): void {
  const logBadge = document.getElementById('log-badge-pill')
  if (logBadge) {
    if (summary.errors > 0) {
      logBadge.textContent = String(summary.errors)
      logBadge.className = 'overleaf-badge-pill badge-error'
      logBadge.style.display = 'inline-block'
    } else if (summary.warnings > 0) {
      logBadge.textContent = String(summary.warnings)
      logBadge.className = 'overleaf-badge-pill badge-warning'
      logBadge.style.display = 'inline-block'
    } else if (summary.info > 0) {
      logBadge.textContent = String(summary.info)
      logBadge.className = 'overleaf-badge-pill badge-info'
      logBadge.style.display = 'inline-block'
    } else {
      logBadge.style.display = 'none'
    }
  }

  const footerBadge = document.getElementById('footer-diagnostics-badge')
  if (footerBadge) {
    if (summary.errors > 0) {
      footerBadge.textContent = `❌ ${summary.errors} Error${summary.errors > 1 ? 's' : ''}`
      footerBadge.style.background = '#dc2626'
    } else if (summary.warnings > 0) {
      footerBadge.textContent = `⚠️ ${summary.warnings} Warning${summary.warnings > 1 ? 's' : ''}`
      footerBadge.style.background = '#d97706'
    } else {
      footerBadge.textContent = '✓ 0 Diagnostics'
      footerBadge.style.background = 'rgba(255, 255, 255, 0.15)'
    }
  }
}

function updateLogHeadersAndTabs(summary: OverleafLogSummary): void {
  const logTitle = document.getElementById('overleaf-log-title')
  if (logTitle) {
    logTitle.textContent = `${summary.total} Logs: ${summary.errors} errors, ${summary.warnings} warnings, ${summary.info} info`
  }

  const tabAll = document.getElementById('tab-log-all')
  const tabErr = document.getElementById('tab-log-error')
  const tabWarn = document.getElementById('tab-log-warning')
  const tabInfo = document.getElementById('tab-log-info')
  if (tabAll) tabAll.textContent = `All Logs (${summary.total})`
  if (tabErr) tabErr.textContent = `Errors (${summary.errors})`
  if (tabWarn) tabWarn.textContent = `Warnings (${summary.warnings})`
  if (tabInfo) tabInfo.textContent = `Info (${summary.info})`

  const rawLogPre = document.getElementById('raw-log-output') as HTMLPreElement | null
  if (rawLogPre) {
    rawLogPre.textContent = lastRawLog || '(No raw log available)'
  }
}

function createLogItemElement(entry: PanelDiagnostic): HTMLElement {
  const item = document.createElement('div')
  item.className = 'overleaf-log-item'

  const pill = document.createElement('span')
  const sev =
    entry.severity === 'error' || entry.severity === 'warning' || entry.severity === 'info'
      ? entry.severity
      : 'info'
  pill.className = `overleaf-log-pill pill-${sev}`
  if (entry.line > 0) {
    pill.textContent = `line ${entry.line}`
  } else if (entry.file) {
    pill.textContent = entry.file
  } else {
    pill.textContent = entry.severity.toUpperCase()
  }
  item.appendChild(pill)

  const textWrap = document.createElement('div')
  textWrap.className = 'overleaf-log-text-wrap'

  const headline = document.createElement('div')
  headline.className = 'overleaf-log-headline'
  headline.textContent = entry.message
  textWrap.appendChild(headline)

  if (entry.details && entry.details !== entry.message) {
    const details = document.createElement('div')
    details.className = 'overleaf-log-details'
    details.textContent = entry.details
    textWrap.appendChild(details)
  }

  item.appendChild(textWrap)

  if (entry.line > 0 || entry.file) {
    item.title = 'Click to jump to line in editor'
    item.addEventListener('click', () => {
      if (editorRef) {
        editorRef.revealLine(entry.line > 0 ? entry.line : 1, entry.file)
      }
    })
  }

  return item
}

function renderDiagnostics(diagnostics: PanelDiagnostic[]): void {
  allCurrentDiagnostics = diagnostics
  const summary = summarizeLogEntries(allCurrentDiagnostics)

  updateLogBadges(summary)
  updateLogHeadersAndTabs(summary)

  if (!errorLogList) return
  errorLogList.innerHTML = ''

  const filtered = filterLogEntries(allCurrentDiagnostics, currentLogFilter)
  if (filtered.length === 0) {
    const empty = document.createElement('div')
    empty.style.padding = '24px'
    empty.style.textAlign = 'center'
    empty.style.color = 'var(--text-muted)'
    empty.style.fontSize = '12px'
    empty.textContent = `No ${currentLogFilter === 'all' ? '' : currentLogFilter} logs reported`
    errorLogList.appendChild(empty)
    return
  }

  for (const entry of filtered) {
    errorLogList.appendChild(createLogItemElement(entry))
  }
}

function renderStatus(status: AppStatus, message?: string): void {
  const labels: Record<AppStatus, string> = {
    unloaded: 'Initializing...',
    loading: 'Loading engine...',
    ready: 'Ready',
    compiling: 'Compiling...',
    error: 'Error',
    rendering: 'Rendering PDF...',
  }

  statusElement.textContent = labels[status]
  statusDetailElement.textContent = message ?? ''
}

async function getWarmupCache(): Promise<WarmupCache | undefined> {
  if (!warmupPromise) return undefined
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      warmupPromise,
      new Promise<undefined>((resolve) => {
        timeoutId = setTimeout(() => resolve(undefined), WARMUP_TIMEOUT_MS)
      }),
    ])
  } catch (err) {
    console.warn('[main] Warmup failed; continuing without preloaded TeX Live files.', err)
    return undefined
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

async function start() {
  const config = readDemoConfig()

  let files: Record<string, string | Uint8Array> | undefined

  if (config.project === 'sample') {
    console.log('[main] Loading "Paper Sample" project...')
    files = await loadSampleProject()
  }

  const warmupCache = await getWarmupCache()

  const opts: WasmTexOptions = {
    texliveVersion: config.texliveVersion,
    persistentCache: config.persistentCache,
    incremental: config.incremental,
    texliveUrl: `${window.location.origin}/texlive/${config.texliveVersion}/`,
  }
  if (warmupCache) opts.warmupCache = warmupCache
  if (files) {
    opts.files = files
  }

  const editor = new WasmTex(editorContainer, previewContainer, opts)
  editorRef = editor
  editor.on('filesUpdate', ({ files }) => {
    renderFileList(files)
  })

  editor.on('outlineUpdate', ({ sections }) => {
    renderOutline(sections)
  })

  editor.on('diagnostics', ({ diagnostics }) => {
    lastDiagnostics = diagnostics
    renderDiagnostics(mergeDiagnostics(lastCompileErrors, lastDiagnostics, lastLogDiagnostics))
  })

  editor.on('status', ({ status, message, incremental }) => {
    renderStatus(status, message)
    const globals = globalThis as Record<string, unknown>
    globals.__lastStatus = { status, message, incremental: !!incremental }
    // E2E (#99): count incremental fast paints vs full-reconcile 'ready's.
    if (status === 'ready') {
      if (incremental) globals.__incrementalPaints = Number(globals.__incrementalPaints ?? 0) + 1
      else globals.__fullReadys = Number(globals.__fullReadys ?? 0) + 1
    }
  })

  editor.on('compile', ({ result }) => {
    const globals = globalThis as Record<string, unknown>
    globals.__compileCount = Number(globals.__compileCount ?? 0) + 1
    globals.__lastCompile = result
    const history = Array.isArray(globals.__compileHistory) ? globals.__compileHistory : []
    history.push(result)
    globals.__compileHistory = history

    lastCompileErrors = result.errors
    lastRawLog = result.log ?? ''
    lastLogDiagnostics = parseOverleafLogEntries(lastRawLog)

    const merged = mergeDiagnostics(lastCompileErrors, lastDiagnostics, lastLogDiagnostics)
    renderDiagnostics(merged)

    // Reset Recompile button state
    const recompileBtn = document.getElementById('recompile-btn')
    if (recompileBtn) {
      recompileBtn.innerHTML =
        '<span class="recompile-play-icon">▶</span><span class="recompile-label">Recompile</span>'
    }

    if (result.errors.length > 0) {
      const diagDrawer = document.getElementById('diagnostics-drawer')
      diagDrawer?.classList.add('open')
    } else {
      console.log('[main] compile success')
    }
  })

  await editor.init()
  renderFileList(editor.listFiles())
  renderOutline([])
  renderDiagnostics([])

  // Initialize Visual Editor
  const visualEditorContainer = document.getElementById('visual-editor-container')!
  const visualEditor = new VisualEditor(visualEditorContainer, {
    onContentChange: (latex) => {
      editor.setFile(activeFile, latex)
      const monaco = editor.getMonacoEditor()
      if (monaco) {
        const model = monaco.getModel()
        if (model && model.getValue() !== latex) {
          model.setValue(latex)
        }
      }
      editor.compile()
    },
    onLineClick: (line) => {
      editor.revealLine(line)
      editor.getViewer()?.forwardSearch(activeFile, line)
    },
  })
  visualEditorRef = visualEditor

  // SyncTeX PDF click -> jump and highlight in Visual WYSIWYG Editor
  editor.on('inverseSearch', ({ line, file }) => {
    if (!file || file === activeFile || file.endsWith(activeFile) || activeFile.endsWith(file)) {
      visualEditor.revealLine(line)
    }
  })

  const syncToVisualEditor = () => {
    if (activeFile.endsWith('.tex')) {
      const content = editor.getFile(activeFile)
      if (typeof content === 'string') {
        visualEditor.setLatex(content)
      }
    }
  }

  // Initial sync
  syncToVisualEditor()

  const monaco = editor.getMonacoEditor()
  monaco?.onDidChangeModelContent(() => {
    const val = monaco.getValue()
    if (activeFile.endsWith('.tex')) {
      visualEditor.setLatex(val)
    }
  })

  // Initialize Research Library
  const libraryContainer = document.getElementById('library-container')!
  const libraryView = new LibraryView(libraryContainer, {
    onInsertBibtex: async (bibtex) => {
      const existing = (editor.getFile('refs.bib') as string) || ''
      const updated = existing.trim() ? `${existing.trim()}\n\n${bibtex}\n` : `${bibtex}\n`
      editor.setFile('refs.bib', updated)
      editor.openFile('refs.bib')
      renderFileList(editor.listFiles())
      persistActiveProject()
      await tacticalAlert({
        title: 'BibTeX',
        specTag: t('BIBTEX // INTEGRASI', 'BIBTEX // INTEGRATION', getLang()),
        message: t(
          'Entri BibTeX berhasil disisipkan ke refs.bib!',
          'BibTeX citation appended to refs.bib!',
          getLang(),
        ),
        type: 'success',
      })
    },
  })
  libraryView.init()

  // Navigation Tabs: Editor vs Library
  const navTabEditor = document.getElementById('nav-tab-editor')!
  const navTabLibrary = document.getElementById('nav-tab-library')!
  const viewEditor = document.getElementById('view-editor')!
  const viewLibrary = document.getElementById('view-library')!

  navTabEditor.addEventListener('click', () => {
    if (viewLibrary.classList.contains('active')) {
      navTabEditor.classList.add('active')
      navTabLibrary.classList.remove('active')
      viewEditor.classList.add('active')
      viewLibrary.classList.remove('active')
    } else {
      // Toggle file tree sidebar panel
      const sidePanel = document.getElementById('file-tree-panel')
      if (sidePanel) {
        const isClosed = sidePanel.style.display === 'none'
        sidePanel.style.display = isClosed ? 'flex' : 'none'
      }
    }
  })

  navTabLibrary.addEventListener('click', () => {
    navTabLibrary.classList.add('active')
    navTabEditor.classList.remove('active')
    viewLibrary.classList.add('active')
    viewEditor.classList.remove('active')
  })

  // Mode Toggles (Visual vs Code vs Split)
  const editorWrapper = document.getElementById('editor-wrapper')!
  const btnModeVisual = document.getElementById('btn-mode-visual')!
  const btnModeCode = document.getElementById('btn-mode-code')!
  const btnModeSplit = document.getElementById('btn-mode-split')!

  btnModeVisual.addEventListener('click', () => {
    editorWrapper.className = 'editor-wrapper mode-visual'
    btnModeVisual.classList.add('active')
    btnModeCode.classList.remove('active')
    btnModeSplit.classList.remove('active')
    syncToVisualEditor()
  })

  btnModeCode.addEventListener('click', () => {
    editorWrapper.className = 'editor-wrapper mode-code'
    btnModeCode.classList.add('active')
    btnModeVisual.classList.remove('active')
    btnModeSplit.classList.remove('active')
    monaco?.layout()
  })

  btnModeSplit.addEventListener('click', () => {
    editorWrapper.className = 'editor-wrapper mode-split'
    btnModeSplit.classList.add('active')
    btnModeVisual.classList.remove('active')
    btnModeCode.classList.remove('active')
    syncToVisualEditor()
    monaco?.layout()
  })

  // Recompile Button
  const recompileBtn = document.getElementById('recompile-btn')
  recompileBtn?.addEventListener('click', () => {
    recompileBtn.innerHTML =
      '<span class="recompile-play-icon">⏳</span><span class="recompile-label">Recompiling...</span>'
    editor.compile()
  })

  // Download PDF Button
  let latestPdfBytes: Uint8Array | null = null
  editor.on('compile', ({ result }) => {
    if (result.pdf) {
      latestPdfBytes = result.pdf
    }
  })

  const downloadPdfBtn = document.getElementById('download-pdf-btn')
  downloadPdfBtn?.addEventListener('click', async () => {
    if (!latestPdfBytes) {
      await tacticalAlert({
        title: t('PDF Belum Siap', 'PDF Not Ready', getLang()),
        specTag: t('KOMPILER // STATUS', 'COMPILER // STATUS', getLang()),
        message: t(
          'PDF belum siap. Klik Recompile terlebih dahulu.',
          'PDF is not ready yet. Please click Recompile first.',
          getLang(),
        ),
        type: 'warning',
      })
      return
    }
    const blob = new Blob([latestPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const docTitle =
      (document.getElementById('doc-title-input') as HTMLInputElement)?.value || 'manuscript'
    a.download = `${docTitle.trim().replace(/[^a-z0-9_-]/gi, '_')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  })

  // 1. Search Dialog
  const searchDialog = new SearchDialog({
    getFiles: () => editor.listFiles(),
    getFileContent: (file) => editor.getFile(file),
    setFileContent: (file, content) => editor.setFile(file, content),
    onOpenFile: (file, line) => {
      activeFile = file
      editor.openFile(file)
      renderFileList(editor.listFiles())
      if (line) editor.revealLine(line, file)
      if (file.endsWith('.tex')) {
        const c = editor.getFile(file)
        if (typeof c === 'string') visualEditor.setLatex(c)
      }
    },
    onRecompile: () => editor.compile(),
  })
  document.getElementById('btn-search')?.addEventListener('click', () => searchDialog.open())

  // Global Ctrl+Shift+F shortcut for Search
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
      e.preventDefault()
      searchDialog.open()
    }
  })

  // 2. Version History Dialog
  const versionDialog = new VersionHistoryDialog({
    getCurrentFiles: () => {
      const map: Record<string, string> = {}
      for (const f of editor.listFiles()) {
        const content = editor.getFile(f)
        if (typeof content === 'string') map[f] = content
      }
      return map
    },
    onRestore: (files) => {
      for (const [f, c] of Object.entries(files)) {
        editor.setFile(f, c)
      }
      renderFileList(editor.listFiles())
      if (files['main.tex']) {
        visualEditor.setLatex(files['main.tex'])
        editor.openFile('main.tex')
      }
      editor.compile()
    },
  })
  document.getElementById('btn-history')?.addEventListener('click', () => versionDialog.open())

  // 3. Comments Panel
  const badgeComments = document.getElementById('badge-comments') as HTMLElement
  const commentsPanel = new CommentsPanel({
    getActiveFile: () => activeFile,
    getActiveSelection: () => {
      const monaco = editor.getMonacoEditor()
      if (monaco) {
        const sel = monaco.getSelection()
        const text = sel ? monaco.getModel()?.getValueInRange(sel) : ''
        return {
          text: text?.trim() || activeFile,
          line: sel ? sel.startLineNumber : 1,
        }
      }
      return { text: activeFile, line: 1 }
    },
    onJumpToLine: (file, line) => {
      activeFile = file
      editor.openFile(file)
      renderFileList(editor.listFiles())
      editor.revealLine(line, file)
    },
    onBadgeUpdate: (count) => {
      if (badgeComments) {
        badgeComments.textContent = String(count)
        badgeComments.style.display = count > 0 ? 'inline-block' : 'none'
      }
    },
  })
  document.getElementById('btn-comments')?.addEventListener('click', () => commentsPanel.toggle())

  // 4. Review Manager
  const badgeReview = document.getElementById('badge-review') as HTMLElement
  const reviewManager = new ReviewManager({
    getActiveFile: () => activeFile,
    getFileContent: (file) => editor.getFile(file),
    setFileContent: (file, content) => {
      editor.setFile(file, content)
      if (file === activeFile) {
        editor.openFile(file)
        if (file.endsWith('.tex')) visualEditor.setLatex(content)
      }
    },
    onRecompile: () => editor.compile(),
    onBadgeUpdate: (count) => {
      if (badgeReview) {
        badgeReview.textContent = String(count)
        badgeReview.style.display = count > 0 ? 'inline-block' : 'none'
      }
    },
  })
  document
    .getElementById('btn-review')
    ?.addEventListener('click', () => reviewManager.togglePanel())

  // 5. ArXiv / Camera-Ready Package Exporter
  const arxivModal = new ArxivExportModal({
    getFiles: () => {
      const map: Record<string, string | Uint8Array> = {}
      for (const f of editor.listFiles()) {
        const c = editor.getFile(f)
        if (c !== null) map[f] = c
      }
      return map
    },
    getMainFile: () => activeFile || 'main.tex',
    getLastPdf: () => latestPdfBytes,
  })
  document.getElementById('btn-arxiv-export')?.addEventListener('click', () => arxivModal.open())

  // 6. Isolated TikZ / Figure Scratchpad
  let figureCompiler: WasmTexCompiler | null = null
  const tikzModal = new TikzScratchpadModal({
    compileFigure: async (fullLatex: string) => {
      if (!figureCompiler) {
        figureCompiler = new WasmTexCompiler({
          mainFile: 'figure.tex',
          texliveUrl: `${window.location.origin}/texlive/${config.texliveVersion}/`,
        })
        await figureCompiler.init()
      }
      figureCompiler.setFile('figure.tex', fullLatex)
      const res = await figureCompiler.compile()
      return res.pdf ?? null
    },
    onInsertToDocument: (snippet: string) => {
      const monaco = editor.getMonacoEditor()
      const selection = monaco?.getSelection()
      if (monaco && selection) {
        monaco.executeEdits('tikz-insert', [
          {
            range: selection,
            text: `\n\n${snippet}\n\n`,
            forceMoveMarkers: true,
          },
        ])
      } else {
        const currentContent = (editor.getFile(activeFile) as string) || ''
        editor.setFile(activeFile, `${currentContent}\n\n${snippet}\n\n`)
      }
      if (activeFile.endsWith('.tex')) {
        const c = editor.getFile(activeFile)
        if (typeof c === 'string') visualEditor.setLatex(c)
      }
      editor.compile()
    },
    onSaveAsFile: (filename: string, content: string) => {
      editor.setFile(filename, content)
      renderFileList(editor.listFiles())
      persistActiveProject()
    },
  })
  document.getElementById('btn-tikz-scratchpad')?.addEventListener('click', () => tikzModal.open())

  // 7. AI Research & LaTeX Assistant Panel
  const aiAssistantPanel = new AiAssistantPanel({
    getEditor: () => editor,
    getCompilerErrors: () => lastCompileErrors,
    getProjectId: () => activeProjectId,
    onRecompile: () => editor.compile(),
    onInsertText: (text: string) => {
      const monaco = editor.getMonacoEditor()
      if (monaco) {
        const selection = monaco.getSelection()
        if (selection) {
          monaco.executeEdits('ai-assistant', [
            {
              range: selection,
              text,
              forceMoveMarkers: true,
            },
          ])
        } else {
          const currentContent = (editor.getFile(activeFile) as string) || ''
          editor.setFile(activeFile, `${currentContent}\n\n${text}\n\n`)
        }
      }
      if (activeFile.endsWith('.tex')) {
        const c = editor.getFile(activeFile)
        if (typeof c === 'string') visualEditor.setLatex(c)
      }
      editor.compile()
    },
    onReplaceSelection: (text: string) => {
      const monaco = editor.getMonacoEditor()
      if (monaco) {
        const selection = monaco.getSelection()
        if (selection) {
          monaco.executeEdits('ai-assistant', [
            {
              range: selection,
              text,
              forceMoveMarkers: true,
            },
          ])
        }
      }
      if (activeFile.endsWith('.tex')) {
        const c = editor.getFile(activeFile)
        if (typeof c === 'string') visualEditor.setLatex(c)
      }
      editor.compile()
    },
  })
  document
    .getElementById('btn-ai-assistant')
    ?.addEventListener('click', () => aiAssistantPanel.toggle())

  // Theme Management (Light / Dark mode toggle)
  let isDark = localStorage.getItem('wasmtex_theme') === 'dark'
  const applyTheme = (dark: boolean) => {
    isDark = dark
    localStorage.setItem('wasmtex_theme', dark ? 'dark' : 'light')
    const app = document.getElementById('app')
    if (app) {
      app.className = dark ? 'app-root theme-dark' : 'app-root theme-light'
    }
    const themeIcon = document.getElementById('theme-icon')
    if (themeIcon) themeIcon.textContent = dark ? '☀️' : '🌙'
    const monacoGlobal = (globalThis as Record<string, unknown>).monaco as
      | { editor?: { setTheme?: (t: string) => void } }
      | undefined
    monacoGlobal?.editor?.setTheme?.(dark ? 'vs-dark' : 'vs')
  }
  applyTheme(isDark)

  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    applyTheme(!isDark)
  })

  // Overleaf Diagnostics Drawer Toggle & Controls
  const diagDrawer = document.getElementById('diagnostics-drawer')
  document.getElementById('btn-toggle-diagnostics')?.addEventListener('click', () => {
    diagDrawer?.classList.toggle('open')
  })
  document.getElementById('diagnostics-drawer-close')?.addEventListener('click', () => {
    diagDrawer?.classList.remove('open')
  })

  // Overleaf Filter Tabs (All Logs, Errors, Warnings, Info)
  const logTabs = document.querySelectorAll('#overleaf-log-tabs .overleaf-log-tab')
  logTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      logTabs.forEach((t) => {
        t.classList.remove('active')
      })
      tab.classList.add('active')
      const target = tab.getAttribute('data-log-tab') as 'all' | 'error' | 'warning' | 'info'
      currentLogFilter = target || 'all'

      if (isViewingRawLog) {
        isViewingRawLog = false
        const rawLogPre = document.getElementById('raw-log-output')
        const rawLogBtn = document.getElementById('btn-toggle-raw-log')
        if (errorLogList) errorLogList.style.display = 'flex'
        if (rawLogPre) rawLogPre.style.display = 'none'
        if (rawLogBtn) rawLogBtn.textContent = 'View raw logs'
      }

      renderDiagnostics(allCurrentDiagnostics)
    })
  })

  // View Raw Logs / Parsed Logs Toggle Button
  const rawLogBtn = document.getElementById('btn-toggle-raw-log')
  rawLogBtn?.addEventListener('click', () => {
    isViewingRawLog = !isViewingRawLog
    const rawLogPre = document.getElementById('raw-log-output')
    if (isViewingRawLog) {
      if (errorLogList) errorLogList.style.display = 'none'
      if (rawLogPre) rawLogPre.style.display = 'block'
      rawLogBtn.textContent = 'View parsed logs'
    } else {
      if (errorLogList) errorLogList.style.display = 'flex'
      if (rawLogPre) rawLogPre.style.display = 'none'
      rawLogBtn.textContent = 'View raw logs'
    }
  })

  // Views & Page Navigation (Home / Dashboard / Workspace)
  const viewHome = document.getElementById('view-home')!
  const viewDashboard = document.getElementById('view-dashboard')!
  const viewWorkspace = document.getElementById('view-workspace')!

  let dashboardView: DashboardView

  const showHome = () => {
    viewHome.classList.add('active')
    viewDashboard.classList.remove('active')
    viewWorkspace.classList.remove('active')
    homeView.init()
  }

  const showDashboard = () => {
    const user = getCurrentUser()
    if (!user) {
      showHome()
      return
    }
    viewHome.classList.remove('active')
    viewDashboard.classList.add('active')
    viewWorkspace.classList.remove('active')
    dashboardView.init()
  }

  const showWorkspace = (proj: ProjectItem) => {
    const user = getCurrentUser()
    if (!user) {
      showHome()
      return
    }
    viewHome.classList.remove('active')
    viewDashboard.classList.remove('active')
    viewWorkspace.classList.add('active')

    const docTitleInput = document.getElementById('doc-title-input') as HTMLInputElement
    if (docTitleInput) docTitleInput.value = proj.title

    for (const [name, text] of Object.entries(proj.files)) {
      editor.setFile(name, text)
    }
    activeFile = 'main.tex'
    editor.openFile('main.tex')
    renderFileList(editor.listFiles())
    if (proj.files['main.tex']) {
      visualEditor.setLatex(proj.files['main.tex'])
    }
    editor.compile()
  }

  // Language Management (ID & EN i18n)
  const applyLang = (lang: Lang) => {
    const langIcon = document.getElementById('lang-icon')
    if (langIcon) langIcon.textContent = `🌐 ${lang.toUpperCase()}`

    const backBtn = document.getElementById('btn-back-dashboard')
    if (backBtn)
      backBtn.innerHTML = `<span class="back-arrow">◀</span> [ ${t('DASHBOARD', 'DASHBOARD', lang)} ]`

    const tabEditor = document.getElementById('nav-tab-editor')
    if (tabEditor) {
      tabEditor.title = t(
        'Editor & Berkas Proyek (File Tree)',
        'Editor & Project Files (File Tree)',
        lang,
      )
    }

    const tabLibrary = document.getElementById('nav-tab-library')
    if (tabLibrary) {
      tabLibrary.title = t(
        'Pustaka Riset / Research Library',
        'Research Library (Papers & BibTeX)',
        lang,
      )
    }

    const btnReview = document.getElementById('btn-review')
    if (btnReview) {
      btnReview.title = t(
        'Lacak Perubahan & Review (Track Changes)',
        'Track Changes & Review',
        lang,
      )
    }

    const btnComments = document.getElementById('btn-comments')
    if (btnComments) {
      btnComments.title = t('Komentar Dokumen / Comments', 'Document Comments', lang)
    }

    const btnHistory = document.getElementById('btn-history')
    if (btnHistory) {
      btnHistory.title = t('Riwayat Versi / Version History', 'Project Version History', lang)
    }

    const btnAi = document.getElementById('btn-ai-assistant')
    if (btnAi) {
      btnAi.title = t('Asisten Riset & LaTeX AI', 'AI Research & LaTeX Assistant', lang)
    }

    const btnRecompile = document.getElementById('recompile-btn')
    if (btnRecompile) {
      btnRecompile.innerHTML = `
        <span class="bracket-corner tl"></span>
        <span class="bracket-corner tr"></span>
        <span class="bracket-corner bl"></span>
        <span class="bracket-corner br"></span>
        <span class="cta-inner">▶ ${t('RECOMPILE PDF', 'RECOMPILE PDF', lang)} [F5]</span>
      `
    }

    const btnDownloadPdf = document.getElementById('download-pdf-btn')
    if (btnDownloadPdf) btnDownloadPdf.textContent = `⬇ ${t('UNDUH PDF', 'DOWNLOAD PDF', lang)}`

    const btnTikz = document.getElementById('btn-tikz-scratchpad')
    if (btnTikz) {
      btnTikz.title = t(
        'Editor Diagram TikZ / Figure Scratchpad',
        'TikZ / Figure Scratchpad (Quick Diagram Editor)',
        lang,
      )
    }

    const btnArxiv = document.getElementById('btn-arxiv-export')
    if (btnArxiv) {
      btnArxiv.textContent = `📦 ${t('ARXIV', 'ARXIV', lang)}`
      btnArxiv.title = t(
        'Ekspor Paket arXiv / Camera-Ready (.zip)',
        'Export arXiv / Camera-Ready Package (.zip)',
        lang,
      )
    }

    const btnSearch = document.getElementById('btn-search')
    if (btnSearch)
      btnSearch.title = t('Cari di Proyek (Ctrl+Shift+F)', 'Search in Project (Ctrl+Shift+F)', lang)

    const sidebarFilesLabel = document.querySelector('.sidebar-files-label')
    if (sidebarFilesLabel)
      sidebarFilesLabel.textContent = `[ ${t('BERKAS PROYEK', 'PROJECT FILES', lang)} ]`

    const outlineHeader = document.querySelector('.outline-header')
    if (outlineHeader)
      outlineHeader.textContent = `[ ${t('STRUKTUR DOKUMEN // OUTLINE', 'DOCUMENT OUTLINE', lang)} ]`

    const drawerTitle = document.querySelector('.drawer-title')
    if (drawerTitle)
      drawerTitle.textContent = t(
        'Diagnostik & Log Kompiler',
        'Diagnostics & Compiler Output',
        lang,
      )
  }

  document.getElementById('btn-lang-toggle')?.addEventListener('click', () => {
    const nextLang = toggleLang()
    applyLang(nextLang)
  })

  applyLang(getLang())

  const homeContainer = document.getElementById('home-container')!
  const homeView = new HomeView(homeContainer, {
    onLoginSuccess: (_session) => {
      showDashboard()
    },
    onToggleTheme: () => applyTheme(!isDark),
    isDarkMode: () => isDark,
    onToggleLang: () => applyLang(getLang()),
  })

  const dashboardContainer = document.getElementById('dashboard-container')!
  dashboardView = new DashboardView(dashboardContainer, {
    onOpenProject: showWorkspace,
    onToggleTheme: () => applyTheme(!isDark),
    isDarkMode: () => isDark,
    onLogout: () => showHome(),
    onToggleLang: () => applyLang(getLang()),
  })

  // Mandatory Login Gate Check
  const activeUser = getCurrentUser()
  if (activeUser) {
    showDashboard()
  } else {
    showHome()
  }

  document.getElementById('btn-back-dashboard')?.addEventListener('click', showDashboard)

  // Document Title update
  const docTitleInput = document.getElementById('doc-title-input') as HTMLInputElement
  docTitleInput?.addEventListener('change', () => {
    persistActiveProject()
  })

  // Sidebar File upload & Folder creation (supports single files and .zip archives)
  const uploadInput = document.getElementById('upload-file-input') as HTMLInputElement
  uploadInput?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const buf = await file.arrayBuffer()
        const unzipped = await unzipLatexProject(buf, file.name)
        for (const [filePath, content] of Object.entries(unzipped.files)) {
          editor.setFile(filePath, content)
        }
        if (unzipped.mainFile && editor.listFiles().includes(unzipped.mainFile)) {
          activeFile = unzipped.mainFile
          editor.openFile(unzipped.mainFile)
        }
      } catch (err: unknown) {
        await tacticalAlert({
          title: t('Gagal Ekstrak ZIP', 'ZIP Extraction Failed', getLang()),
          specTag: t('BERKAS // ZIP', 'FILES // ZIP', getLang()),
          message: `${err instanceof Error ? err.message : String(err)}`,
          type: 'error',
        })
      }
    } else if (FILE_EXTENSIONS_THAT_ARE_BINARY.test(file.name)) {
      const buf = new Uint8Array(await file.arrayBuffer())
      editor.setFile(file.name, buf)
    } else {
      const text = await file.text()
      editor.setFile(file.name, text)
    }
    renderFileList(editor.listFiles())
    persistActiveProject()
  })

  document.getElementById('add-folder-btn')?.addEventListener('click', async () => {
    const folder = await tacticalPrompt({
      title: t('Folder Baru', 'New Folder', getLang()),
      specTag: t('BERKAS // DIREKTORI BARU', 'FILES // NEW DIRECTORY', getLang()),
      message: t(
        'Nama folder baru (contoh: "chapters", "sections", "figures"):',
        'New folder name (e.g. "chapters", "sections", "figures"):',
        getLang(),
      ),
      placeholder: 'chapters',
    })
    if (folder) {
      const clean = folder.replace(/^\/+|\/+$/g, '')
      if (clean) {
        editor.setFile(`${clean}/placeholder.tex`, '% Folder placeholder\n')
        renderFileList(editor.listFiles())
        persistActiveProject()
      }
    }
  })

  addFileButton.addEventListener('click', async () => {
    const filePath = await tacticalPrompt({
      title: t('Berkas Baru', 'New File', getLang()),
      specTag: t('BERKAS // BUAT BERKAS', 'FILES // CREATE FILE', getLang()),
      message: t(
        'Path berkas baru (contoh: "notes.tex" atau "chapters/section1.tex"):',
        'New file path (e.g. "notes.tex" or "chapters/section1.tex"):',
        getLang(),
      ),
      placeholder: 'chapters/intro.tex',
    })
    const decision = resolveAddFile(filePath, (p) => editor.getFile(p) !== null)
    if (decision.action === 'cancel') return
    // Only create writes content; opening an existing file must not overwrite it.
    if (decision.action === 'create') {
      editor.setFile(decision.path, defaultFileContent(decision.path))
    }
    activeFile = decision.path
    editor.openFile(decision.path)
    renderFileList(editor.listFiles())
    persistActiveProject()
  })

  // E2E backward compat: expose globals
  ;(globalThis as Record<string, unknown>).__engine = (
    editor as unknown as { engine: unknown }
  ).engine
  ;(globalThis as Record<string, unknown>).__pdfViewer = editor.getViewer()
  ;(globalThis as Record<string, unknown>).__editor = editor.getMonacoEditor()
  ;(globalThis as Record<string, unknown>).__wasmTex = editor
}

function bindDemoSelectors(): void {
  const config = readDemoConfig()
  const projectSelect = document.getElementById('project-select') as HTMLSelectElement | null

  if (projectSelect) {
    projectSelect.value = config.project

    projectSelect.addEventListener('change', () => {
      setDemoParam('proj', projectSelect.value === DEFAULT_PROJECT ? null : projectSelect.value)
    })
  }

  if (texliveVersionSelect) {
    texliveVersionSelect.value = config.texliveVersion

    texliveVersionSelect.addEventListener('change', () => {
      const selected = texliveVersionSelect.value as DemoTexliveVersion
      setDemoParam('tl', selected)
    })
  }
}

bindDemoSelectors()

start().catch((err) => {
  console.error(err)
})
