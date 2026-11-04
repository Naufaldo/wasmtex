export interface ProjectTemplate {
    id: string;
    title: string;
    titleId: string;
    titleEn: string;
    descriptionId: string;
    descriptionEn: string;
    category: 'Presentation' | 'Journal' | 'Thesis' | 'Report' | 'Academic' | 'Resume';
    badge: string;
    tags: string[];
    files: Record<string, string>;
}
export declare const TEMPLATES: ProjectTemplate[];
