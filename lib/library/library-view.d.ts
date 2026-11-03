export interface LibraryViewOptions {
    onInsertBibtex: (bibtex: string) => void;
}
export declare class LibraryView {
    private container;
    private papers;
    private selectedPaper;
    private options;
    constructor(container: HTMLElement, options: LibraryViewOptions);
    init(): Promise<void>;
    private render;
    private bindEvents;
    private renderPaperList;
    private renderSelectedPaper;
    private saveCurrentMemo;
    private promptAddPaper;
}
