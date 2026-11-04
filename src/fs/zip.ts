/**
 * Zero-dependency client-side ZIP archive generator.
 * Uses native Web Streams CompressionStream('deflate-raw') with Store (method 0) fallback.
 */

const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  CRC_TABLE[n] = c
}

export function computeCrc32(buf: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i] ?? 0
    const entry = CRC_TABLE[(crc ^ byte) & 0xff] ?? 0
    crc = entry ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

async function deflateBytes(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null
  try {
    const cs = new CompressionStream('deflate-raw')
    const writer = cs.writable.getWriter()
    await writer.write(data as unknown as BufferSource)
    await writer.close()
    const reader = cs.readable.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        total += value.length
      }
    }
    const out = new Uint8Array(total)
    let pos = 0
    for (const chunk of chunks) {
      out.set(chunk, pos)
      pos += chunk.length
    }
    return out
  } catch {
    return null
  }
}

export interface ZipEntryInput {
  path: string
  content: string | Uint8Array
}

export async function createZipArchive(
  entries: Record<string, string | Uint8Array> | ZipEntryInput[]
): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const list: ZipEntryInput[] = Array.isArray(entries)
    ? entries
    : Object.entries(entries).map(([path, content]) => ({ path, content }))

  const localParts: Uint8Array[] = []
  const cdParts: Uint8Array[] = []
  let offset = 0

  for (const item of list) {
    const cleanPath = item.path.replace(/\\/g, '/').replace(/^\.?\//, '')
    const nameBytes = encoder.encode(cleanPath)
    const rawData =
      typeof item.content === 'string'
        ? encoder.encode(item.content)
        : item.content
    const crc = computeCrc32(rawData)

    const deflated = await deflateBytes(rawData)
    const useDeflate = deflated !== null && deflated.length < rawData.length
    const compressed = useDeflate && deflated ? deflated : rawData
    const method = useDeflate ? 8 : 0

    // Local Header (30 bytes)
    const lh = new Uint8Array(30)
    const lhView = new DataView(lh.buffer)
    lhView.setUint32(0, 0x04034b50, true) // signature
    lhView.setUint16(4, 20, true)         // version needed
    lhView.setUint16(6, 0x0800, true)     // UTF-8 filename flag
    lhView.setUint16(8, method, true)     // compression method
    lhView.setUint16(10, 0, true)         // mod time
    lhView.setUint16(12, 0, true)         // mod date
    lhView.setUint32(14, crc, true)       // crc-32
    lhView.setUint32(18, compressed.length, true) // compressed size
    lhView.setUint32(22, rawData.length, true)    // uncompressed size
    lhView.setUint16(26, nameBytes.length, true)  // filename length
    lhView.setUint16(28, 0, true)                 // extra length

    localParts.push(lh, nameBytes, compressed)

    // Central Directory Entry (46 bytes)
    const cd = new Uint8Array(46)
    const cdView = new DataView(cd.buffer)
    cdView.setUint32(0, 0x02014b50, true) // signature
    cdView.setUint16(4, 20, true)         // version made by
    cdView.setUint16(6, 20, true)         // version needed
    cdView.setUint16(8, 0x0800, true)     // UTF-8 filename flag
    cdView.setUint16(10, method, true)    // compression method
    cdView.setUint16(12, 0, true)         // mod time
    cdView.setUint16(14, 0, true)         // mod date
    cdView.setUint32(16, crc, true)       // crc-32
    cdView.setUint32(20, compressed.length, true) // compressed size
    cdView.setUint32(24, rawData.length, true)    // uncompressed size
    cdView.setUint16(28, nameBytes.length, true)  // filename length
    cdView.setUint16(30, 0, true)                 // extra field len
    cdView.setUint16(32, 0, true)                 // file comment len
    cdView.setUint16(34, 0, true)                 // disk number start
    cdView.setUint16(36, 0, true)                 // internal attrs
    cdView.setUint32(38, 0, true)                 // external attrs
    cdView.setUint32(42, offset, true)            // local header offset

    cdParts.push(cd, nameBytes)
    offset += lh.length + nameBytes.length + compressed.length
  }

  // End of Central Directory (22 bytes)
  let cdLen = 0
  for (const part of cdParts) cdLen += part.length
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  eocdView.setUint32(0, 0x06054b50, true)
  eocdView.setUint16(4, 0, true)          // disk number
  eocdView.setUint16(6, 0, true)          // disk with start of CD
  eocdView.setUint16(8, list.length, true)// entries on this disk
  eocdView.setUint16(10, list.length, true) // total entries
  eocdView.setUint32(12, cdLen, true)     // CD size
  eocdView.setUint32(16, offset, true)    // CD offset
  eocdView.setUint16(20, 0, true)         // comment len

  const totalLen = offset + cdLen + eocd.length
  const result = new Uint8Array(totalLen)
  let pos = 0
  for (const part of localParts) {
    result.set(part, pos)
    pos += part.length
  }
  for (const part of cdParts) {
    result.set(part, pos)
    pos += part.length
  }
  result.set(eocd, pos)

  return result
}
