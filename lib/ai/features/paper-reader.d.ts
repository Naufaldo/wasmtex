import { ModelAdapter } from '../types.js';
export interface PaperSummary {
    title: string;
    authors: string[];
    abstract: string;
    objectives: string[];
    methodology: string;
    findings: string[];
    conclusions: string[];
    keywords: string[];
    bibtex: string;
}
export declare function extractTextFromPdf(data: Uint8Array | ArrayBuffer): Promise<string>;
export declare function summarizePaper(paperText: string, model: ModelAdapter, locale?: 'en' | 'id'): Promise<PaperSummary>;
export declare function extractBibtex(paperText: string, model: ModelAdapter): Promise<string>;
export declare function compareWithDraft(referencePaperText: string, draftText: string, model: ModelAdapter, locale?: 'en' | 'id'): Promise<string>;
