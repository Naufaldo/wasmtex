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
  pdfAnnotations?: string | undefined
  projectId?: string | undefined
}

const DB_NAME = 'wasmtex_research_library'
const DB_VERSION = 1
const STORE_NAME = 'papers'

const SAMPLE_PDF_B64 =
  'JVBERi0xLjcKJYGBgYEKCjcgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL0xlbmd0aCAxMDM2Cj4+CnN0cmVhbQp4nJVWy44jRRC891f0GWmHeuSjSkJIY3dbHLgg+QcQ7CLQIrQI8f1EZlbbHtMesEZT6na9MiMiI/vLdDhP6SW1Ob1k++f5z1+mr7/7+Pnvj3/9+tOPHw5/fP75g6beqCVtfS5pPn+aCs3n7ydswF+eOc1qv/8+fUNZSUlYVoxdTrKWRF0rxixHOZbE+FUZ7ytWsdC38/m36fzVtJ6nH6YvEU5FJJUx0F00XalIKyxtzvuBSL8EUqVJtxGXiuBdVbKs0svRrz/hbcGcrcv6auFoGXNdDliXOGGmyGKjz7xizwE7C+YYJ77aG1awWGhYgTMII5ItSJ0PlqbiXOqMm0qqpaaaq/Kyl7hTUGxoezyUlFIDgk3mXPfT50i/5uLIGw8I7ySkLPXKSRFnpCAFm882txeQxVJ8uBdGV05kGOncX3g/GGyyYJiAMCgXwuULQliNB8MJ7LBmNSGsUm3NCGfFzF3I2Ik0sPJocnJe7MxizJqQ8Bzrqt2iCXJjBffOTjUO/MnvNc7GylUF4xHz4ybj7jko7GyuJqPHUKTuUMiQgwsk+RtBliahg6fVPYXsY4DiSSPcxZO/vo/wRbBH48wLWCY9dTgt/ZNawgPeoIKvMIvfvmzil3wL9XNANOKUW8rvaIJ7DSCMv6hQTwsw8GAUdeUzDGBMK/pvDkMrXs0UQFnqPnfUPtbjads/lBGw7liUpe93uj/g/sWhOplmHVg7Q6Gok5Tn9YFUetPctD2GRTVgMW6DeRqJdgPEhR5a8WIJpYDdzW4CiJO9j19NA++z7TZlSan6DRJloXanGhCurRrFGsCaMoImjRKMEwA2YHu9KvA5gLgVEim1vgOQ5KGbkWoNNp3pLO7yLl0rKVOMOYeFw86+XKVvYTtoXmo3fnO8KaDkrpQ9LfLEs4huhed+P5QZ++0tPGiAaK5U0thPBtH2G9zf5puTBQMuu2D9RyfI6Mdc0OT4USfgOjpB8U5wQOhIg8RDpQjfwrFOwFZ05aKNvBUYLa65YirQ+qQpttZ6ziDqMacp+gMF4ptYlRamS6fEE1khqGNpPC9emQupB70MHTzikbw/HMzaLgqwhPTNnrdlcbE/591dCjMShYi4Wlk9rkJHYubypB907ZWol/4QGWqjXXTrZG7hcvUyj6Tc5IM+Z9goXdaYWVTvsPFkbkiI/hi6R07oeHJdz44CI/PifTNWFlf+5T6TUk03eZuw3uXuOVyKppZ77/y4jyKHkMy+JOTSHtr/k0QU4R3lHObhUPj5w4Hf2EtA54W93O6+MZ7FjWcZ4Cyb8WzwPQeOaLKsROgxOBxNxPvnsOnwvkr2QVjbWx+78a5NB8O9KlypxhdbVv98H32SvTU0TwMfgPYNfOdf/wDjjaiYCmVuZHN0cmVhbQplbmRvYmoKCjggMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL1R5cGUgL09ialN0bQovTiA2Ci9GaXJzdCAzNAovTGVuZ3RoIDQ4NAo+PgpzdHJlYW0KeJzVVE1r3EAMvftX6NgegjWa77Is7JdbKKEhKbS09ODYw+KyeIrtLem/r8beJCTeEOitGGFLem9GmqexAAQCpUCCdaBASwINAo0AA0IoB4tFln/+8ytAflXuQ5/lH5u6h++MRbiGH1m+icd2AJEtl9kjdlMO5SHus4kEIoHvEVddrI9V6GBR7IoC0SKiUWwGkbb83rB5NmKfc+T4m82qk3HMSkS54lwxmbETJ+VHrD7xd/xmrEmY7YRVbvIf9k177aY16LV6/DLLL2O9LYcAb7bvCMkIgVJIQUTf3vJxdKEc4v/b3Fh/E9sXO3yic5I3idyFNAOjyvl16OOxq1j2hCsiZ9LHh3D4HYamKi/W8VBfWPSOi7XO88CNvEeAt4qMI20cT+Gz3EhOJ+dQe2fOkTUq4wntnGy1JS2lYd4s55RG4VCc4znDe1nh7JmCtCNlDEn5UrGC+9SkhNXzYq1zzvPxGjkne+ulUp78PEUWnfDe6zN9sNLcIBmjTjkWLP/66fZnqEYhkru7G97fDEnhKZBil6FuynW847uN/BhBYD2lG75q2zikOz/e9nZgrZNnT3+AJwOR5M7ym+PtMLopKLJ8XfZhHIRnZ8OVtFWsm3YP+ZemXbV9cx/4x2VfWfEvwSY+ZwplbmRzdHJlYW0KZW5kb2JqCgo5IDAgb2JqCjw8Ci9TaXplIDEwCi9Sb290IDIgMCBSCi9JbmZvIDMgMCBSCi9GaWx0ZXIgL0ZsYXRlRGVjb2RlCi9UeXBlIC9YUmVmCi9MZW5ndGggNDIKL1cgWyAxIDIgMiBdCi9JbmRleCBbIDAgMTAgXQo+PgpzdHJlYW0KeJwVxLERACAMA7F3CFxKpmQ+NgxYhYDuoMDJhRsu3RQblOe3Ljxr0QN9CmVuZHN0cmVhbQplbmRvYmoKCnN0YXJ0eHJlZgoxNzEyCiUlRU9G'

function getSamplePdfBlob(): Blob {
  const bin = atob(SAMPLE_PDF_B64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: 'application/pdf' })
}

const DEFAULT_ANNOTATIONS = JSON.stringify({
  1: [
    {
      type: 'highlighter',
      color: '#FACC1588',
      lineWidth: 24,
      points: [
        { x: 48, y: 55 },
        { x: 420, y: 55 },
      ],
    },
    {
      type: 'pen',
      color: '#EF4444',
      lineWidth: 2.5,
      points: [
        { x: 48, y: 92 },
        { x: 480, y: 92 },
      ],
    },
    {
      type: 'text',
      color: '#FEF08A',
      lineWidth: 12,
      text: 'NOTE: Self-Attention eliminates RNN recurrence!',
      x: 50,
      y: 112,
    },
  ],
})

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
    pdfBlob: getSamplePdfBlob(),
    pdfAnnotations: DEFAULT_ANNOTATIONS,
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
          for (const p of results) {
            if (!p.pdfBlob && p.id === 'vaswani2017attention') {
              p.pdfBlob = getSamplePdfBlob()
              if (!p.pdfAnnotations) p.pdfAnnotations = DEFAULT_ANNOTATIONS
            }
          }
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
