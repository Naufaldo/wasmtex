/**
 * Zero-dependency client-side ZIP archive extractor.
 * Uses native browser/Web DecompressionStream('deflate-raw') API.
 */

export interface UnzippedFile {
  path: string
  content: string
  isBinary: boolean
}

export interface UnzipResult {
  files: Record<string, string>
  mainFile: string
  suggestedTitle: string
}

/**
 * Strips leading junk, __MACOSX artifacts, and normalizes directory separators.
 */
function normalizePath(raw: string): string {
  return raw.replace(/\\/g, '/').replace(/^\.?\//, '').trim()
}

/**
 * Checks if a file path is a standard text-based LaTeX or project file.
 */
function isLikelyTextFile(path: string, bytes: Uint8Array): boolean {
  const lower = path.toLowerCase()
  const textExtensions = [
    '.tex',
    '.bib',
    '.sty',
    '.cls',
    '.bst',
    '.txt',
    '.md',
    '.bbl',
    '.aux',
    '.toc',
    '.csv',
    '.tsv',
    '.json',
    '.yaml',
    '.yml',
    '.xml',
    '.html',
    '.css',
    '.cfg',
    '.def',
    '.dtx',
    '.ins',
    '.log',
    '.out',
  ]

  for (const ext of textExtensions) {
    if (lower.endsWith(ext)) return true
  }

  // Probe first 512 bytes for null bytes
  const probeLen = Math.min(bytes.length, 512)
  for (let i = 0; i < probeLen; i++) {
    if (bytes[i] === 0) return false
  }
  return true
}

/**
 * Converts a binary Uint8Array into a base64 Data URL.
 */
function uint8ArrayToDataUrl(path: string, bytes: Uint8Array): string {
  const lower = path.toLowerCase()
  let mime = 'application/octet-stream'
  if (lower.endsWith('.png')) mime = 'image/png'
  else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg'
  else if (lower.endsWith('.gif')) mime = 'image/gif'
  else if (lower.endsWith('.svg')) mime = 'image/svg+xml'
  else if (lower.endsWith('.pdf')) mime = 'application/pdf'

  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  const base64 = btoa(binary)
  return `data:${mime};base64,${base64}`
}

/**
 * Extracts all files from a ZIP archive buffer.
 */
export async function unzipLatexProject(
  buffer: ArrayBuffer | Uint8Array,
  archiveName?: string
): Promise<UnzipResult> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  // 1. Locate End of Central Directory (EOCD) by scanning backwards from EOF
  let eocdOffset = -1
  const maxSearch = Math.max(0, bytes.length - 65557)
  for (let i = bytes.length - 22; i >= maxSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Format arsip tidak valid: EOCD signature ZIP tidak ditemukan.')
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true)
  const cdOffset = view.getUint32(eocdOffset + 16, true)

  const rawExtracted: { path: string; bytes: Uint8Array }[] = []
  let cur = cdOffset
  const textDecoder = new TextDecoder('utf-8')

  for (let e = 0; e < totalEntries; e++) {
    if (cur + 46 > bytes.length) break
    if (view.getUint32(cur, true) !== 0x02014b50) break

    const method = view.getUint16(cur + 10, true)
    const compSize = view.getUint32(cur + 20, true)
    const nameLen = view.getUint16(cur + 28, true)
    const extraLen = view.getUint16(cur + 30, true)
    const commentLen = view.getUint16(cur + 32, true)
    const localHeaderOffset = view.getUint32(cur + 42, true)

    const nameBytes = bytes.subarray(cur + 46, cur + 46 + nameLen)
    const rawPath = textDecoder.decode(nameBytes)
    const cleanPath = normalizePath(rawPath)

    cur += 46 + nameLen + extraLen + commentLen

    // Skip directory entries, OS metadata (__MACOSX, .DS_Store)
    if (
      cleanPath.endsWith('/') ||
      cleanPath.startsWith('__MACOSX/') ||
      cleanPath.includes('/__MACOSX/') ||
      cleanPath.endsWith('.DS_Store') ||
      cleanPath.endsWith('Thumbs.db')
    ) {
      continue
    }

    if (localHeaderOffset + 30 > bytes.length) continue
    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
      throw new Error(`Local header signature corrupt pada ${cleanPath}`)
    }

    const localNameLen = view.getUint16(localHeaderOffset + 26, true)
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen

    if (dataStart + compSize > bytes.length) {
      throw new Error(`Data offset out of bounds pada file ${cleanPath}`)
    }

    const compBytes = bytes.subarray(dataStart, dataStart + compSize)
    let fileBytes: Uint8Array

    if (method === 0) {
      // Stored (uncompressed)
      fileBytes = compBytes.slice()
    } else if (method === 8) {
      // Deflate
      if (typeof DecompressionStream === 'undefined') {
        throw new Error('Browser/Runtime tidak mendukung DecompressionStream.')
      }
      const ds = new DecompressionStream('deflate-raw')
      const writer = ds.writable.getWriter()
      writer.write(compBytes as unknown as BufferSource)
      writer.close()

      const reader = ds.readable.getReader()
      const chunks: Uint8Array[] = []
      let totalLength = 0
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
          totalLength += value.length
        }
      }

      fileBytes = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        fileBytes.set(chunk, offset)
        offset += chunk.length
      }
    } else {
      console.warn(`Metode kompresi ${method} tidak didukung pada ${cleanPath}, diabaikan.`)
      continue
    }

    rawExtracted.push({ path: cleanPath, bytes: fileBytes })
  }

  if (rawExtracted.length === 0) {
    throw new Error('Arsip ZIP kosong atau tidak berisi file yang valid.')
  }

  // Detect common root folder (e.g., if all files are inside 'my-paper/...')
  let strippedExtracted = rawExtracted
  const firstSlashIndex = rawExtracted[0]!.path.indexOf('/')
  if (firstSlashIndex > 0) {
    const commonPrefix = rawExtracted[0]!.path.substring(0, firstSlashIndex + 1)
    const allSharePrefix = rawExtracted.every((item) => item.path.startsWith(commonPrefix))
    if (allSharePrefix) {
      strippedExtracted = rawExtracted.map((item) => ({
        path: item.path.substring(commonPrefix.length),
        bytes: item.bytes,
      }))
    }
  }

  // Convert files into string records (UTF-8 text or data URL)
  const files: Record<string, string> = {}
  let mainFile = ''
  let fallbackTex = ''

  for (const item of strippedExtracted) {
    if (!item.path) continue
    const isText = isLikelyTextFile(item.path, item.bytes)
    let content: string
    if (isText) {
      content = textDecoder.decode(item.bytes)
    } else {
      content = uint8ArrayToDataUrl(item.path, item.bytes)
    }

    files[item.path] = content

    if (item.path.toLowerCase() === 'main.tex') {
      mainFile = item.path
    } else if (item.path.toLowerCase().endsWith('.tex')) {
      if (!fallbackTex) fallbackTex = item.path
      // If it has documentclass, it's a strong candidate for main
      if (content.includes('\\documentclass') && !mainFile) {
        mainFile = item.path
      }
    }
  }

  if (!mainFile) {
    mainFile = fallbackTex || Object.keys(files)[0] || 'main.tex'
  }

  // Determine suggested title from main file \title{...} or archive name
  let suggestedTitle = ''
  const mainContent = mainFile ? files[mainFile] : undefined
  if (mainContent) {
    const titleMatch = mainContent.match(/\\title(?:\[[^\]]*\])?\{([^}]+)\}/)
    if (titleMatch?.[1]) {
      suggestedTitle = titleMatch[1].replace(/\\\\/g, ' ').replace(/[{}]/g, '').trim()
    }
  }

  if (!suggestedTitle && archiveName) {
    suggestedTitle = archiveName.replace(/\.zip$/i, '').replace(/[_-]/g, ' ').trim()
  }

  if (!suggestedTitle) {
    suggestedTitle = 'Imported LaTeX Project'
  }

  return {
    files,
    mainFile,
    suggestedTitle,
  }
}
