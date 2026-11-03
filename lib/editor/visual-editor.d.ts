export interface VisualEditorOptions {
    onContentChange: (latex: string) => void;
}
export declare class VisualEditor {
    private container;
    private options;
    private preamble;
    private postamble;
    private isUpdatingFromCode;
    private debounceTimer;
    constructor(container: HTMLElement, options: VisualEditorOptions);
    private initLayout;
    private bindEvents;
    private triggerChange;
    private insertHtmlAtCursor;
    /** Load and parse LaTeX into Visual Editor DOM */
    setLatex(latex: string): void;
    /** Serialize Visual Editor DOM back into full LaTeX document */
    private serializeToLatex;
}
