/**
 * Strips comments from LaTeX code while keeping line numbers intact.
 * Preserves escaped `\%` and magic comments like `% !TEX` or `% !WASMTEX`.
 */
export declare function stripLatexComments(content: string): string;
export interface ArxivAuditResult {
    mainFile: string;
    hasBbl: boolean;
    bblFile: string | null;
    figuresReferenced: string[];
    figuresMissing: string[];
    subfilesReferenced: string[];
    subfilesMissing: string[];
    excludedFiles: string[];
    includedFiles: string[];
    readyForArxiv: boolean;
    warnings: string[];
}
export interface ArxivBundleOptions {
    files: Record<string, string | Uint8Array>;
    mainFile?: string;
    lastPdfBytes?: Uint8Array | null;
    includeBbl?: boolean;
    stripComments?: boolean;
    includePdf?: boolean;
}
/**
 * Audits a LaTeX project for arXiv and camera-ready submission compliance.
 */
export declare function auditArxivProject(files: Record<string, string | Uint8Array>, preferredMain?: string): ArxivAuditResult;
/**
 * Builds the camera-ready zip archive ready for arXiv submission.
 */
export declare function buildArxivPackage(options: ArxivBundleOptions): Promise<Uint8Array>;
/**
 * UI Modal Dialog for ArXiv Package Exporter.
 */
export declare class ArxivExportModal {
    private modal;
    private getFiles;
    private getMainFile;
    private getLastPdf;
    constructor(options: {
        getFiles: () => Record<string, string | Uint8Array>;
        getMainFile: () => string;
        getLastPdf: () => Uint8Array | null;
    });
    open(): void;
    close(): void;
}
