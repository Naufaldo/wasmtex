import { type ProjectItem, saveProject } from '../projects/project-store'

export interface PaperMemo {
  objective: string
  methodology: string
  findings: string
  notes: string
}

export interface ResearchPaper {
  id: string
  title: string
  authors: string
  year: string
  venue: string
  doi: string
  abstract: string
  tags: string[]
  bibtex: string
  memo: PaperMemo
  pdfBlob?: Blob
  projectId?: string | undefined
}

const DB_NAME = 'wasmtex_research_library'
const DB_VERSION = 1
const STORE_NAME = 'papers'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const DEFAULT_PAPERS: ResearchPaper[] = [
  {
    id: 'vaswani2017attention',
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, et al.',
    year: '2017',
    venue: 'NeurIPS 2017',
    doi: '10.48550/arXiv.1706.03762',
    abstract:
      'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture eschewing recurrence and entirely relying on an attention mechanism to draw global dependencies between input and output.',
    tags: ['Deep Learning', 'NLP', 'Transformer', 'Attention'],
    bibtex: `@article{vaswani2017attention,
  author = {Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\\L}ukasz and Polosukhin, Illia},
  title = {Attention Is All You Need},
  journal = {Advances in Neural Information Processing Systems},
  volume = {30},
  year = {2017}
}`,
    memo: {
      objective: 'Menggantikan RNN/CNN secara total dengan mekanisme Self-Attention untuk tugas sequence-to-sequence.',
      methodology: 'Arsitektur encoder-decoder berbasis Multi-Head Attention, Positional Encoding, dan layer feed-forward.',
      findings: 'Mencapai skor BLEU 28.4 pada WMT 2014 English-to-German, melampaui ensemble model terbaik sebelumnya dengan waktu training jauh lebih cepat.',
      notes: 'Pondasi utama LLM modern (GPT, BERT, Gemini). Cocok dijadikan sitasi utama di bab pendahuluan/background.',
    },
  },
  {
    id: 'he2016deep',
    title: 'Deep Residual Learning for Image Recognition',
    authors: 'Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun',
    year: '2016',
    venue: 'CVPR 2016 (Best Paper)',
    doi: '10.1109/CVPR.2016.90',
    abstract:
      'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs.',
    tags: ['Computer Vision', 'ResNet', 'Deep Learning'],
    bibtex: `@inproceedings{he2016deep,
  author = {He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},
  title = {Deep Residual Learning for Image Recognition},
  booktitle = {Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR)},
  pages = {770--778},
  year = {2016}
}`,
    memo: {
      objective: 'Mengatasi degradation problem pada deep neural network saat layer ditambah semakin dalam.',
      methodology: 'Shortcut / skip connection identity mapping: H(x) = F(x) + x.',
      findings: 'ResNet dengan 152 layer berhasil memenangkan kompetisi ILSVRC 2015 dengan error top-5 hanya 3.57%.',
      notes: 'Standar de facto untuk backbone feature extraction di image processing dan visual inspection.',
    },
  },
]

export async function getAllPapers(): Promise<ResearchPaper[]> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => {
        const results = req.result as ResearchPaper[]
        if (!results || results.length === 0) {
          // Initialize default papers
          saveDefaultPapers(db).then(() => resolve(DEFAULT_PAPERS))
        } else {
          resolve(results)
        }
      }
      req.onerror = () => resolve(DEFAULT_PAPERS)
    })
  } catch {
    return DEFAULT_PAPERS
  }
}

async function saveDefaultPapers(db: IDBDatabase): Promise<void> {
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  for (const paper of DEFAULT_PAPERS) {
    store.put(paper)
  }
}

export async function savePaper(paper: ResearchPaper): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(paper)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function deletePaper(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function addPaperToProjectBibtex(
  paper: ResearchPaper,
  targetProject: ProjectItem
): Promise<{ success: boolean; message: string; key: string }> {
  const currentBib = targetProject.files['refs.bib'] || ''

  const keyMatch = paper.bibtex.match(/@\w+\s*\{\s*([^,\s]+)/)
  const citationKey = keyMatch ? keyMatch[1] : paper.id

  if (currentBib.includes(`{${citationKey},`) || currentBib.includes(`{${citationKey} `)) {
    return {
      success: true,
      message: `Sitasi "${citationKey}" sudah ada di refs.bib pada proyek "${targetProject.title}".`,
      key: citationKey!,
    }
  }

  const separator = currentBib.trim().length > 0 ? '\n\n' : ''
  targetProject.files['refs.bib'] = currentBib + separator + paper.bibtex.trim() + '\n'
  targetProject.lastModified = Date.now()
  await saveProject(targetProject)

  return {
    success: true,
    message: `Berhasil menambahkan sitasi [cite:${citationKey}] ke refs.bib pada proyek "${targetProject.title}"!`,
    key: citationKey!,
  }
}
