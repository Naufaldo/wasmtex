export interface PaperMemo {
    objective: string;
    methodology: string;
    findings: string;
    notes: string;
}
export interface ResearchPaper {
    id: string;
    title: string;
    authors: string;
    year: string;
    venue: string;
    doi: string;
    abstract: string;
    tags: string[];
    bibtex: string;
    memo: PaperMemo;
    pdfBlob?: Blob;
}
export declare function getAllPapers(): Promise<ResearchPaper[]>;
export declare function savePaper(paper: ResearchPaper): Promise<void>;
export declare function deletePaper(id: string): Promise<void>;
