export interface SearchMatch {
    file: string;
    line: number;
    text: string;
    index: number;
}
export interface SearchDialogOptions {
    getFiles: () => string[];
    getFileContent: (file: string) => string | Uint8Array | null;
    setFileContent: (file: string, content: string) => void;
    onOpenFile: (file: string, line?: number) => void;
    onRecompile?: () => void;
}
export declare class SearchDialog {
    private overlay;
    private options;
    constructor(options: SearchDialogOptions);
    open(): void;
    close(): void;
    private findMatches;
    private renderResults;
    private replaceAll;
}
