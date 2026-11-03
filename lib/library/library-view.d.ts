export interface LibraryViewOptions {
    onInsertBibtex: (bibtex: string) => void;
}
interface AnnotPoint {
    x: number;
    y: number;
}
interface AnnotationItem {
    type: 'pen' | 'highlighter' | 'text';
    color: string;
    lineWidth: number;
    points?: AnnotPoint[];
    text?: string;
    x?: number;
    y?: number;
}
export declare class LibraryView {
    private container;
    private papers;
    private selectedPaper;
    private options;
    private currentPdfDoc;
    private currentPage;
    private totalPages;
    private currentScale;
    private activeTool;
    private activeColor;
    private pageAnnotations;
    private isDrawing;
    private currentStroke;
    constructor(container: HTMLElement, options: LibraryViewOptions);
    init(): Promise<void>;
    addAnnotation(item: AnnotationItem): void;
    selectPaperById(id: string): void;
    private render;
    private bindEvents;
    private renderPaperList;
    private renderSelectedPaper;
    /** Render current PDF page onto canvas with interactive annotation layer */
    private renderPdfPage;
    private drawPaperCanvasBackground;
    /** Set up mouse & pointer drawing and text note stamping on the overlay annotation canvas */
    private setupAnnotationEvents;
    /** Redraw all saved annotations for current page */
    private redrawAnnotationCanvas;
    /** Synchronize high-res composite image for instant browser composition and screenshot fidelity */
    private syncCompositeImage;
    private undoLastAnnotation;
    private downloadAnnotatedDocument;
    private saveCurrentMemo;
    private promptAddPaper;
}
export {};
