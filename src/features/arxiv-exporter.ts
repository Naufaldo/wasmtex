import { createZipArchive } from '../fs/zip'
import { t } from '../ui/i18n'

const JUNK_EXTENSIONS = new Set([
  '.aux',
  '.log',
  '.synctex',
  '.synctex.gz',
  '.fls',
  '.fdb_latexmk',
  '.out',
  '.toc',
  '.lof',
  '.lot',
  '.nav',
  '.snm',
  '.vrb',
  '.idx',
  '.ilg',
  '.ind',
])

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.pdf', '.eps', '.webp']

/**
 * Strips comments from LaTeX code while keeping line numbers intact.
 * Preserves escaped `\%` and magic comments like `% !TEX` or `% !WASMTEX`.
 */
export function stripLatexComments(content: string): string {
  const lines = content.split('\n')
  return lines
    .map((line) => {
      // Preserve magic comments
      if (/^\s*%\s*!/.test(line)) return line

      // Find unescaped %
      let inComment = false
      let commentIndex = -1
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '%') {
          // Check if escaped
          let backslashes = 0
          for (let j = i - 1; j >= 0 && line[j] === '\\'; j--) {
            backslashes++
          }
          if (backslashes % 2 === 0) {
            inComment = true
            commentIndex = i
            break
          }
        }
      }

      if (inComment && commentIndex >= 0) {
        return line.slice(0, commentIndex).trimEnd()
      }
      return line
    })
    .join('\n')
}

export interface ArxivAuditResult {
  mainFile: string
  hasBbl: boolean
  bblFile: string | null
  figuresReferenced: string[]
  figuresMissing: string[]
  subfilesReferenced: string[]
  subfilesMissing: string[]
  excludedFiles: string[]
  includedFiles: string[]
  readyForArxiv: boolean
  warnings: string[]
}

export interface ArxivBundleOptions {
  files: Record<string, string | Uint8Array>
  mainFile?: string
  lastPdfBytes?: Uint8Array | null
  includeBbl?: boolean
  stripComments?: boolean
  includePdf?: boolean
}

/**
 * Audits a LaTeX project for arXiv and camera-ready submission compliance.
 */
export function auditArxivProject(
  files: Record<string, string | Uint8Array>,
  preferredMain?: string
): ArxivAuditResult {
  const fileNames = Object.keys(files)

  // 1. Detect main .tex file
  let mainFile = preferredMain && files[preferredMain] ? preferredMain : ''
  if (!mainFile) {
    if (files['main.tex']) {
      mainFile = 'main.tex'
    } else {
      for (const name of fileNames) {
        if (name.endsWith('.tex')) {
          const content = files[name]
          if (typeof content === 'string' && /\\begin\s*\{document\}/.test(content)) {
            mainFile = name
            break
          }
        }
      }
    }
  }
  if (!mainFile) {
    mainFile = fileNames.find((f) => f.endsWith('.tex')) ?? 'main.tex'
  }

  const mainBase = mainFile.replace(/\.tex$/i, '')
  const bblFile = `${mainBase}.bbl`
  const hasBbl = !!files[bblFile]

  // 2. Scan all .tex files for \includegraphics and \input / \include
  const figuresReferenced = new Set<string>()
  const subfilesReferenced = new Set<string>()

  const graphicRegex = /\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g
  const inputRegex = /\\(?:input|include)\{([^}]+)\}/g

  for (const [name, content] of Object.entries(files)) {
    if (typeof content !== 'string' || !name.endsWith('.tex')) continue

    let match: RegExpExecArray | null
    while ((match = graphicRegex.exec(content)) !== null) {
      const figPath = match[1]?.trim()
      if (figPath) figuresReferenced.add(figPath)
    }

    while ((match = inputRegex.exec(content)) !== null) {
      const subPath = match[1]?.trim()
      if (subPath) subfilesReferenced.add(subPath)
    }
  }

  // Check missing figures
  const figuresMissing: string[] = []
  for (const fig of figuresReferenced) {
    const cleanFig = fig.replace(/\\/g, '/').replace(/^\.?\//, '')
    const existsDirect = !!files[cleanFig]
    let existsWithExt = false
    if (!existsDirect) {
      for (const ext of IMAGE_EXTS) {
        if (files[`${cleanFig}${ext}`]) {
          existsWithExt = true
          break
        }
      }
    }
    if (!existsDirect && !existsWithExt) {
      figuresMissing.push(fig)
    }
  }

  // Check missing subfiles
  const subfilesMissing: string[] = []
  for (const sub of subfilesReferenced) {
    const cleanSub = sub.replace(/\\/g, '/').replace(/^\.?\//, '')
    const exists = !!files[cleanSub] || !!files[`${cleanSub}.tex`]
    if (!exists) {
      subfilesMissing.push(sub)
    }
  }

  // Check excluded junk files
  const excludedFiles: string[] = []
  const includedFiles: string[] = []

  for (const name of fileNames) {
    const isJunk = Array.from(JUNK_EXTENSIONS).some((ext) => name.toLowerCase().endsWith(ext))
    if (isJunk) {
      excludedFiles.push(name)
    } else {
      includedFiles.push(name)
    }
  }

  const warnings: string[] = []
  if (!hasBbl) {
    warnings.push(
      `File ${bblFile} tidak ditemukan. arXiv mewajibkan file .bbl agar daftar pustaka tampil.`
    )
  }
  if (figuresMissing.length > 0) {
    warnings.push(`Terdapat ${figuresMissing.length} gambar yang dirujuk tetapi berkasnya tidak ada.`)
  }
  if (subfilesMissing.length > 0) {
    warnings.push(`Terdapat ${subfilesMissing.length} sub-berkas input/include yang tidak ditemukan.`)
  }

  const readyForArxiv = hasBbl && figuresMissing.length === 0 && subfilesMissing.length === 0

  return {
    mainFile,
    hasBbl,
    bblFile: hasBbl ? bblFile : null,
    figuresReferenced: Array.from(figuresReferenced),
    figuresMissing,
    subfilesReferenced: Array.from(subfilesReferenced),
    subfilesMissing,
    excludedFiles,
    includedFiles,
    readyForArxiv,
    warnings,
  }
}

/**
 * Builds the camera-ready zip archive ready for arXiv submission.
 */
export async function buildArxivPackage(options: ArxivBundleOptions): Promise<Uint8Array> {
  const audit = auditArxivProject(options.files, options.mainFile)
  const bundleFiles: Record<string, string | Uint8Array> = {}

  for (const [name, content] of Object.entries(options.files)) {
    // Skip junk extensions
    const isJunk = Array.from(JUNK_EXTENSIONS).some((ext) => name.toLowerCase().endsWith(ext))
    if (isJunk) continue

    // Handle .bbl
    if (name.endsWith('.bbl') && options.includeBbl === false) continue

    // Process .tex files
    if (name.endsWith('.tex') && typeof content === 'string') {
      const processed = options.stripComments ? stripLatexComments(content) : content
      bundleFiles[name] = processed
    } else {
      bundleFiles[name] = content
    }
  }

  // Include PDF preview if requested and available
  if (options.includePdf && options.lastPdfBytes) {
    const pdfName = `${audit.mainFile.replace(/\.tex$/i, '')}_compiled.pdf`
    bundleFiles[pdfName] = options.lastPdfBytes
  }

  return createZipArchive(bundleFiles)
}

/**
 * UI Modal Dialog for ArXiv Package Exporter.
 */
export class ArxivExportModal {
  private modal: HTMLElement | null = null
  private getFiles: () => Record<string, string | Uint8Array>
  private getMainFile: () => string
  private getLastPdf: () => Uint8Array | null

  constructor(options: {
    getFiles: () => Record<string, string | Uint8Array>
    getMainFile: () => string
    getLastPdf: () => Uint8Array | null
  }) {
    this.getFiles = options.getFiles
    this.getMainFile = options.getMainFile
    this.getLastPdf = options.getLastPdf
  }

  open(): void {
    this.close()
    const files = this.getFiles()
    const mainFile = this.getMainFile()
    const lastPdf = this.getLastPdf()
    const audit = auditArxivProject(files, mainFile)

    const modal = document.createElement('div')
    modal.className = 'arxiv-modal-overlay'
    modal.id = 'arxiv-export-modal'

    const bblStatusBadge = audit.hasBbl
      ? `<span class="audit-chip chip-ok">✓ ${audit.bblFile} ${t('SIAP', 'READY')}</span>`
      : `<span class="audit-chip chip-warn">⚠ ${t('.bbl BELUM ADA (Kompilasi BibTeX dulu)', '.bbl MISSING (Run BibTeX first)')}</span>`

    const figStatusBadge =
      audit.figuresMissing.length === 0
        ? `<span class="audit-chip chip-ok">✓ ${audit.figuresReferenced.length} ${t('GAMBAR LENGKAP', 'FIGURES VERIFIED')}</span>`
        : `<span class="audit-chip chip-err">✕ ${audit.figuresMissing.length} ${t('GAMBAR HILANG', 'FIGURES MISSING')}</span>`

    const missingFigsList =
      audit.figuresMissing.length > 0
        ? `<div class="audit-warning-box"><strong>${t('Gambar tidak ditemukan:', 'Figures not found:')}</strong> ${audit.figuresMissing.join(', ')}</div>`
        : ''

    modal.innerHTML = `
      <div class="arxiv-modal-box tactical-modal-frame">
        <div class="arxiv-modal-header modal-header">
          <div class="header-title-block">
            <span class="modal-spec-tag">[ ${t('EKSPOR PUBLIKASI // ARXIV & CAMERA-READY', 'PUBLICATION EXPORT // ARXIV & CAMERA-READY')} ]</span>
            <h2 class="header-title modal-title">📦 ${t('Ekspor Paket Publikasi Ilmiah', 'Export Scientific Publication Package')}</h2>
          </div>
          <button class="modal-close-btn" id="arxiv-close-btn" title="${t('Tutup', 'Close')}">&times;</button>
        </div>

        <div class="arxiv-modal-body modal-body">
          <div class="audit-section">
            <h4 class="section-label">[ ${t('AUDIT KELAYAKAN SUBMISI // PRE-FLIGHT CHECK', 'SUBMISSION COMPLIANCE AUDIT // PRE-FLIGHT CHECK')} ]</h4>
            <div class="audit-grid">
              <div class="audit-card">
                <span class="card-title">${t('Berkas Utama', 'Main Document')}</span>
                <span class="card-value font-mono">${audit.mainFile}</span>
                <span class="audit-chip chip-ok">✓ ${t('DETEKSI OK', 'DETECTED')}</span>
              </div>
              <div class="audit-card">
                <span class="card-title">${t('Daftar Pustaka (.bbl)', 'Bibliography (.bbl)')}</span>
                <span class="card-value font-mono">${audit.bblFile ?? t('Tidak ada', 'None')}</span>
                ${bblStatusBadge}
              </div>
              <div class="audit-card">
                <span class="card-title">${t('Aset Gambar', 'Figure Assets')}</span>
                <span class="card-value font-mono">${audit.figuresReferenced.length} ${t('Rujukan', 'Referenced')}</span>
                ${figStatusBadge}
              </div>
            </div>
            ${missingFigsList}
          </div>

          <div class="options-section">
            <h4 class="section-label">[ ${t('OPSI PEMBUATAN PAKET', 'PACKAGE BUILD OPTIONS')} ]</h4>
            <label class="arxiv-option-row">
              <input type="checkbox" id="opt-include-bbl" ${audit.hasBbl ? 'checked' : 'disabled'} />
              <div class="option-info">
                <span class="option-title">${t('Sertakan file .bbl (Mandatori untuk arXiv & IEEE)', 'Include .bbl file (Mandatory for arXiv & IEEE)')}</span>
                <span class="option-desc">${t('arXiv tidak menjalankan BibTeX; file .bbl hasil kompilasi mutlak disertakan.', 'arXiv does not run BibTeX; pre-compiled .bbl file is strictly required.')}</span>
              </div>
            </label>

            <label class="arxiv-option-row">
              <input type="checkbox" id="opt-strip-comments" checked />
              <div class="option-info">
                <span class="option-title">${t('Bersihkan komentar draf LaTeX (%)', 'Strip LaTeX draft comments (%)')}</span>
                <span class="option-desc">${t('Menghapus catatan internal penulis dan komentar revisi dari naskah publikasi.', 'Removes internal author notes and revision comments from manuscript source.')}</span>
              </div>
            </label>

            <label class="arxiv-option-row">
              <input type="checkbox" id="opt-include-pdf" ${lastPdf ? 'checked' : 'disabled'} />
              <div class="option-info">
                <span class="option-title">${t('Sertakan PDF Terkompilasi Sebagai Referensi', 'Include Compiled PDF Reference')}</span>
                <span class="option-desc">${lastPdf ? t('Menyertakan salinan PDF terbaru ke dalam arsip zip.', 'Packs the latest compiled PDF into the zip archive.') : t('PDF belum siap (lakukan Recompile dulu).', 'PDF not ready (click Recompile first).')}</span>
              </div>
            </label>
          </div>

          <div class="summary-section">
            <span class="summary-text">
              ${t('Total Berkas Bersih:', 'Total Clean Files:')} <strong>${audit.includedFiles.length} ${t('berkas', 'files')}</strong> | ${t('Berkas sampah dieliminasi:', 'Clutter files stripped:')} <strong>${audit.excludedFiles.length} (.aux, .log, etc)</strong>
            </span>
          </div>
        </div>

        <div class="arxiv-modal-footer">
          <button class="tactical-btn-action" id="arxiv-cancel-btn">${t('BATAL', 'CANCEL')}</button>
          <button class="tactical-cta-btn cta-orange" id="arxiv-download-btn">
            <span class="cta-inner">${t('⬇ UNDUH PAKET ARXIV (.ZIP)', '⬇ DOWNLOAD ARXIV PACKAGE (.ZIP)')}</span>
          </button>
        </div>
      </div>
    `

    document.body.appendChild(modal)
    this.modal = modal

    modal.querySelector('#arxiv-close-btn')?.addEventListener('click', () => this.close())
    modal.querySelector('#arxiv-cancel-btn')?.addEventListener('click', () => this.close())

    const downloadBtn = modal.querySelector('#arxiv-download-btn') as HTMLButtonElement
    downloadBtn?.addEventListener('click', async () => {
      downloadBtn.disabled = true
      downloadBtn.textContent = '⏳ MENGOMPRES PAKET...'

      try {
        const includeBbl = (modal.querySelector('#opt-include-bbl') as HTMLInputElement)?.checked
        const stripComments = (modal.querySelector('#opt-strip-comments') as HTMLInputElement)?.checked
        const includePdf = (modal.querySelector('#opt-include-pdf') as HTMLInputElement)?.checked

        const zipData = await buildArxivPackage({
          files: this.getFiles(),
          mainFile: this.getMainFile(),
          lastPdfBytes: this.getLastPdf(),
          includeBbl,
          stripComments,
          includePdf,
        })

        const blob = new Blob([zipData.buffer as ArrayBuffer], { type: 'application/zip' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const cleanName = audit.mainFile.replace(/\.tex$/i, '')
        a.download = `${cleanName}-arxiv-package.zip`
        a.click()
        URL.revokeObjectURL(url)
        this.close()
      } catch (err) {
        alert(`Gagal membuat paket: ${String(err)}`)
        downloadBtn.disabled = false
        downloadBtn.textContent = '⬇ UNDUH PAKET ARXIV (.ZIP)'
      }
    })
  }

  close(): void {
    if (this.modal) {
      this.modal.remove()
      this.modal = null
    }
  }
}
