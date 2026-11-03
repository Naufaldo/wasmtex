import type { WasmTexOptions } from './component-types'
import { configureMonacoWorkers } from './editor/workers'
import { warmup } from './engine/warmup'
import { defaultFileContent } from './fs/default-file-content'
import type { SectionDef } from './lsp/types'
import { mergeDiagnostics, type PanelDiagnostic, resolveAddFile } from './main-helpers'
import type { AppStatus, WarmupCache } from './types'
import { configurePdfjsWorker } from './viewer/pdf-viewer'
import { WasmTex } from './wasmtex'
import { VisualEditor } from './editor/visual-editor'
import { LibraryView } from './library/library-view'
import { SearchDialog } from './features/search-dialog'
import { VersionHistoryDialog } from './features/version-history'
import { CommentsPanel } from './features/comments-panel'
import { ReviewManager } from './features/review-manager'
import { DashboardView } from './projects/dashboard-view'
import { HomeView } from './ui/home-view'
import { getLang, t, toggleLang, type Lang } from './ui/i18n'
import { getCurrentUser } from './auth/auth-store'
import { type ProjectItem, getProject, saveProject } from './projects/project-store'
import { unzipLatexProject } from './fs/unzip'
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
let activeProjectId = 'default'
let editorRef: WasmTex | null = null
let visualEditorRef: VisualEditor | null = null
let lastCompileErrors: PanelDiagnostic[] = []
// Static (LSP/lint) diagnostics, kept so a compile re-renders the union instead of
// clobbering them out of the panel.
let lastDiagnostics: PanelDiagnostic[] = []

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
    fileTreeContainer.innerHTML = '<div class="file-item" style="color: var(--text-muted); font-style: italic;">No files</div>'
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
      del.addEventListener('click', (event) => {
        event.stopPropagation()

        if (!confirm(`Hapus file "${filePath}"?`)) return

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

function renderDiagnostics(
  diagnostics: Array<{ file?: string; line: number; message: string; severity: string }>,
): void {
  if (errorLogList) errorLogList.innerHTML = ''

  const errors = diagnostics.filter((entry) => entry.severity === 'error')
  const warnings = diagnostics.filter((entry) => entry.severity === 'warning')

  const pill = document.getElementById('btn-toggle-diagnostics')
  if (pill) {
    if (errors.length > 0) {
      pill.textContent = `❌ ${errors.length} Error${errors.length > 1 ? 's' : ''}`
      pill.style.background = '#dc2626'
    } else if (warnings.length > 0) {
      pill.textContent = `⚠️ ${warnings.length} Warning${warnings.length > 1 ? 's' : ''}`
      pill.style.background = '#d97706'
    } else {
      pill.textContent = '✓ 0 Diagnostics'
      pill.style.background = 'rgba(255, 255, 255, 0.15)'
    }
  }

  if (diagnostics.length === 0) {
    if (errorLogList) {
      const empty = document.createElement('div')
      empty.className = 'log-entry'
      empty.textContent = 'No diagnostics reported'
      errorLogList.appendChild(empty)
    }
    return
  }

  for (const entry of diagnostics) {
    const item = document.createElement('div')
    item.className = `log-entry ${entry.severity}`
    item.textContent = `${entry.file ? `${entry.file}:` : ''}${entry.line} ${entry.message}`

    if (entry.file) {
      item.classList.add('clickable')
      item.title = 'Click to jump to line'
      item.addEventListener('click', () => {
        if (editorRef) editorRef.revealLine(entry.line, entry.file)
      })
    }

    errorLogList?.appendChild(item)
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
    renderDiagnostics(mergeDiagnostics(lastCompileErrors, lastDiagnostics))
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
    renderDiagnostics(mergeDiagnostics(lastCompileErrors, lastDiagnostics))

    if (result.errors.length === 0) {
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
    onInsertBibtex: (bibtex) => {
      const existing = (editor.getFile('refs.bib') as string) || ''
      const updated = existing.trim() ? `${existing.trim()}\n\n${bibtex}\n` : `${bibtex}\n`
      editor.setFile('refs.bib', updated)
      editor.openFile('refs.bib')
      renderFileList(editor.listFiles())
      persistActiveProject()
      alert('Entri BibTeX berhasil disisipkan ke refs.bib!')
    },
  })
  libraryView.init()

  // Navigation Tabs: Editor vs Library
  const navTabEditor = document.getElementById('nav-tab-editor')!
  const navTabLibrary = document.getElementById('nav-tab-library')!
  const viewEditor = document.getElementById('view-editor')!
  const viewLibrary = document.getElementById('view-library')!

  navTabEditor.addEventListener('click', () => {
    navTabEditor.classList.add('active')
    navTabLibrary.classList.remove('active')
    viewEditor.classList.add('active')
    viewLibrary.classList.remove('active')
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
  downloadPdfBtn?.addEventListener('click', () => {
    if (!latestPdfBytes) {
      alert('PDF belum siap. Klik Recompile terlebih dahulu.')
      return
    }
    const blob = new Blob([latestPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const docTitle = (document.getElementById('doc-title-input') as HTMLInputElement)?.value || 'manuscript'
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
  document.getElementById('btn-review')?.addEventListener('click', () => reviewManager.togglePanel())

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

  // Diagnostics Drawer Toggle
  const diagDrawer = document.getElementById('diagnostics-drawer')
  document.getElementById('btn-toggle-diagnostics')?.addEventListener('click', () => {
    diagDrawer?.classList.toggle('open')
  })
  document.getElementById('diagnostics-drawer-close')?.addEventListener('click', () => {
    diagDrawer?.classList.remove('open')
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
    if (backBtn) backBtn.innerHTML = `<span class="back-arrow">&larr;</span> ${t('Proyek', 'Projects', lang)}`

    const tabEditor = document.getElementById('nav-tab-editor')
    if (tabEditor) tabEditor.textContent = t('✍️ Editor', '✍️ Editor', lang)

    const tabLibrary = document.getElementById('nav-tab-library')
    if (tabLibrary) tabLibrary.textContent = t('📚 Pustaka Riset', '📚 Research Library', lang)

    const btnReview = document.getElementById('btn-review')
    if (btnReview) {
      const badge = document.getElementById('badge-review')
      btnReview.innerHTML = `<span class="icon-svg">📝</span> ${t('Review', 'Review', lang)} <span id="badge-review" class="topbar-badge" style="${badge?.style.cssText || 'display:none;'}">${badge?.textContent || '0'}</span>`
    }

    const btnHistory = document.getElementById('btn-history')
    if (btnHistory) btnHistory.innerHTML = `<span class="icon-svg">🕒</span> ${t('Riwayat', 'History', lang)}`

    const btnRecompile = document.getElementById('recompile-btn')
    if (btnRecompile) btnRecompile.textContent = `▶ ${t('Kompilasi Ulang', 'Recompile', lang)}`

    const btnDownloadPdf = document.getElementById('download-pdf-btn')
    if (btnDownloadPdf) btnDownloadPdf.textContent = `⬇ ${t('PDF', 'PDF', lang)}`

    const sidebarFilesLabel = document.querySelector('.sidebar-files-label')
    if (sidebarFilesLabel) sidebarFilesLabel.textContent = t('BERKAS', 'FILES', lang)

    const outlineHeader = document.querySelector('.outline-header')
    if (outlineHeader) outlineHeader.textContent = t('OUTLINE', 'OUTLINE', lang)

    const drawerTitle = document.querySelector('.drawer-title')
    if (drawerTitle) drawerTitle.textContent = t('Diagnostik & Log Kompiler', 'Diagnostics & Compiler Output', lang)
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
      } catch (err: any) {
        alert(`Gagal mengekstrak ZIP: ${err?.message || err}`)
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

  document.getElementById('add-folder-btn')?.addEventListener('click', () => {
    const folder = prompt('Nama folder baru (contoh: "chapters", "sections", "figures"):')
    if (folder) {
      const clean = folder.replace(/^\/+|\/+$/g, '')
      if (clean) {
        editor.setFile(`${clean}/placeholder.tex`, '% Folder placeholder\n')
        renderFileList(editor.listFiles())
        persistActiveProject()
      }
    }
  })

  addFileButton.addEventListener('click', () => {
    const decision = resolveAddFile(
      prompt('Path file baru (contoh: "notes.tex" atau "chapters/section1.tex"):'),
      (p) => editor.getFile(p) !== null,
    )
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
