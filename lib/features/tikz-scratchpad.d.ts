export interface TikzTemplate {
    id: string;
    name: string;
    description: string;
    code: string;
    extraPreamble?: string;
}
export declare const TIKZ_TEMPLATES: TikzTemplate[];
export declare function buildStandaloneDoc(tikzSnippet: string, extraPreamble?: string): string;
export declare function formatFigureBlock(tikzSnippet: string, caption?: string, label?: string): string;
export interface TikzScratchpadOptions {
    compileFigure: (fullLatex: string) => Promise<Uint8Array | null>;
    onInsertToDocument: (snippet: string) => void;
    onSaveAsFile: (filename: string, content: string) => void;
}
export declare class TikzScratchpadModal {
    private modal;
    private options;
    private activeCode;
    private lastRenderedPdf;
    private isCompiling;
    constructor(options: TikzScratchpadOptions);
    open(): void;
    close(): void;
}
