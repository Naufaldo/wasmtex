/**
 * Zero-dependency client-side ZIP archive extractor.
 * Uses native browser/Web DecompressionStream('deflate-raw') API.
 */
export interface UnzippedFile {
    path: string;
    content: string;
    isBinary: boolean;
}
export interface UnzipResult {
    files: Record<string, string>;
    mainFile: string;
    suggestedTitle: string;
}
/**
 * Extracts all files from a ZIP archive buffer.
 */
export declare function unzipLatexProject(buffer: ArrayBuffer | Uint8Array, archiveName?: string): Promise<UnzipResult>;
