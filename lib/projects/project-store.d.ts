export interface ProjectItem {
    id: string;
    title: string;
    owner: string;
    lastModified: number;
    files: Record<string, string>;
    tags: string[];
    archived?: boolean;
    trashed?: boolean;
}
export declare const DEFAULT_PROJECTS: ProjectItem[];
export declare function getAllProjects(): Promise<ProjectItem[]>;
export declare function getProject(id: string): Promise<ProjectItem | null>;
export declare function saveProject(project: ProjectItem): Promise<void>;
export declare function deleteProject(id: string, permanent?: boolean): Promise<void>;
export declare function restoreProject(id: string): Promise<void>;
