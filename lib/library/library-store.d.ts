import { ProjectItem } from '../projects/project-store.js';
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
    projectId?: string | undefined;
}
export declare function getAllPapers(): Promise<ResearchPaper[]>;
export declare function savePaper(paper: ResearchPaper): Promise<void>;
export declare function deletePaper(id: string): Promise<void>;
export declare function addPaperToProjectBibtex(paper: ResearchPaper, targetProject: ProjectItem): Promise<{
    success: boolean;
    message: string;
    key: string;
}>;
