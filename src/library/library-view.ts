import { deletePaper, getAllPapers, type ResearchPaper, savePaper } from './library-store'

export interface LibraryViewOptions {
  onInsertBibtex: (bibtex: string) => void
}

export class LibraryView {
  private container: HTMLElement
  private papers: ResearchPaper[] = []
  private selectedPaper: ResearchPaper | null = null
  private options: LibraryViewOptions

  constructor(container: HTMLElement, options: LibraryViewOptions) {
    this.container = container
    this.options = options
  }

  async init(): Promise<void> {
    this.papers = await getAllPapers()
    if (this.papers.length > 0) {
      this.selectedPaper = this.papers[0]!
    }
    this.render()
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="lib-root">
        <!-- Sidebar: Paper List -->
        <aside class="lib-sidebar">
          <div class="lib-sidebar-header">
            <div class="lib-title-row">
              <span class="lib-title">Research Library</span>
              <button id="lib-add-btn" class="lib-btn lib-btn-primary" title="Add new paper">+ Add Paper</button>
            </div>
            <input type="text" id="lib-search-input" class="lib-search" placeholder="Search title, author, tag..." />
          </div>
          <div id="lib-paper-list" class="lib-paper-list"></div>
        </aside>

        <!-- Center: Paper Reader View -->
        <main class="lib-reader-panel">
          <div class="lib-panel-header">
            <span class="lib-panel-title">Document Reader</span>
            <div class="lib-reader-actions">
              <label for="lib-upload-pdf" class="lib-btn lib-btn-outline" style="cursor: pointer;">
                📄 Upload PDF
                <input type="file" id="lib-upload-pdf" accept=".pdf" style="display: none;" />
              </label>
            </div>
          </div>
          <div id="lib-reader-content" class="lib-reader-content"></div>
        </main>

        <!-- Right: Paper Analysis & Memo -->
        <aside class="lib-memo-panel">
          <div class="lib-panel-header">
            <span class="lib-panel-title">Paper Analysis & Memo</span>
            <button id="lib-save-memo-btn" class="lib-btn lib-btn-primary">Save Notes</button>
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
    uploadPdf?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && this.selectedPaper) {
        this.selectedPaper.pdfBlob = file
        savePaper(this.selectedPaper).then(() => {
          this.renderSelectedPaper()
        })
      }
    })

    const saveMemoBtn = this.container.querySelector('#lib-save-memo-btn') as HTMLButtonElement
    saveMemoBtn?.addEventListener('click', () => {
      this.saveCurrentMemo()
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
        p.tags.some((t) => t.toLowerCase().includes(query))
      )
    })

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="lib-empty">No papers found.</div>`
      return
    }

    listEl.innerHTML = filtered
      .map(
        (paper) => `
        <div class="lib-paper-card ${this.selectedPaper?.id === paper.id ? 'active' : ''}" data-id="${paper.id}">
          <div class="lib-card-year-venue">${escapeHtml(paper.year)} · ${escapeHtml(paper.venue || 'Journal')}</div>
          <div class="lib-card-title">${escapeHtml(paper.title)}</div>
          <div class="lib-card-authors">${escapeHtml(paper.authors)}</div>
          <div class="lib-card-tags">
            ${paper.tags.map((tag) => `<span class="lib-tag">${escapeHtml(tag)}</span>`).join('')}
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

  private renderSelectedPaper(): void {
    const readerEl = this.container.querySelector('#lib-reader-content')
    const memoEl = this.container.querySelector('#lib-memo-content')
    if (!readerEl || !memoEl) return

    const paper = this.selectedPaper
    if (!paper) {
      readerEl.innerHTML = `<div class="lib-empty-state">Select a paper to read and analyze</div>`
      memoEl.innerHTML = `<div class="lib-empty-state">No paper selected</div>`
      return
    }

    // Render Reader
    if (paper.pdfBlob) {
      const blobUrl = URL.createObjectURL(paper.pdfBlob)
      readerEl.innerHTML = `
        <iframe src="${blobUrl}#toolbar=1" class="lib-pdf-iframe" title="PDF Document"></iframe>
      `
    } else {
      readerEl.innerHTML = `
        <div class="lib-reader-text">
          <div class="lib-reader-header-box">
            <span class="lib-reader-badge">${escapeHtml(paper.venue)} (${escapeHtml(paper.year)})</span>
            <h1 class="lib-reader-h1">${escapeHtml(paper.title)}</h1>
            <p class="lib-reader-authors">${escapeHtml(paper.authors)}</p>
            ${paper.doi ? `<p class="lib-reader-doi">DOI: <a href="https://doi.org/${encodeURIComponent(paper.doi)}" target="_blank">${escapeHtml(paper.doi)}</a></p>` : ''}
          </div>
          <div class="lib-reader-section">
            <h3>Abstract</h3>
            <p class="lib-reader-abstract-p">${escapeHtml(paper.abstract)}</p>
          </div>
          <div class="lib-reader-notice">
            💡 Untuk membaca full-text PDF asli, klik tombol <strong>"📄 Upload PDF"</strong> di toolbar atas.
          </div>
        </div>
      `
    }

    // Render Memo
    memoEl.innerHTML = `
      <div class="lib-memo-form">
        <div class="lib-memo-section">
          <label class="lib-memo-label">🎯 Research Objective</label>
          <textarea id="memo-objective" class="lib-textarea" rows="2" placeholder="Tujuan utama riset ini...">${escapeHtml(paper.memo.objective)}</textarea>
        </div>

        <div class="lib-memo-section">
          <label class="lib-memo-label">🔬 Methodology & Setup</label>
          <textarea id="memo-methodology" class="lib-textarea" rows="2" placeholder="Metode atau arsitektur yang digunakan...">${escapeHtml(paper.memo.methodology)}</textarea>
        </div>

        <div class="lib-memo-section">
          <label class="lib-memo-label">📊 Key Findings & Evidence</label>
          <textarea id="memo-findings" class="lib-textarea" rows="3" placeholder="Hasil utama, metrik, atau pembuktian...">${escapeHtml(paper.memo.findings)}</textarea>
        </div>

        <div class="lib-memo-section">
          <label class="lib-memo-label">📝 Personal Notes & Analysis</label>
          <textarea id="memo-notes" class="lib-textarea" rows="3" placeholder="Catatan pribadi atau relevansi dengan riset Anda...">${escapeHtml(paper.memo.notes)}</textarea>
        </div>

        <div class="lib-memo-section lib-bibtex-section">
          <div class="lib-bibtex-header">
            <label class="lib-memo-label">📚 BibTeX Citation</label>
            <button id="btn-insert-bibtex" class="lib-btn lib-btn-sm lib-btn-success">📥 Insert to refs.bib</button>
          </div>
          <textarea id="memo-bibtex" class="lib-textarea lib-code" rows="6">${escapeHtml(paper.bibtex)}</textarea>
        </div>

        <div class="lib-memo-footer">
          <button id="btn-delete-paper" class="lib-btn lib-btn-danger">🗑️ Delete Paper</button>
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
      alert('Catatan & BibTeX berhasil disimpan!')
    })
  }

  private promptAddPaper(): void {
    const title = prompt('Judul Paper:')
    if (!title) return
    const authors = prompt('Penulis (misal: John Doe, Jane Smith):') || ''
    const year = prompt('Tahun Terbit (misal: 2024):') || new Date().getFullYear().toString()
    const venue = prompt('Venue/Jurnal (misal: IEEE / Elsevier / arXiv):') || ''

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
      tags: ['New'],
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
