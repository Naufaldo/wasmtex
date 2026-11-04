/**
 * Zero-dependency client-side ZIP archive generator.
 * Uses native Web Streams CompressionStream('deflate-raw') with Store (method 0) fallback.
 */
export declare function computeCrc32(buf: Uint8Array): number;
export interface ZipEntryInput {
    path: string;
    content: string | Uint8Array;
}
export declare function createZipArchive(entries: Record<string, string | Uint8Array> | ZipEntryInput[]): Promise<Uint8Array>;
