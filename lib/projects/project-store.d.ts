import { UserSession } from '../auth/auth-store.js';
export interface ProjectItem {
    id: string;
    title: string;
    owner: string;
    ownerId?: string | undefined;
    lastModified: number;
    files: Record<string, string>;
    tags: string[];
    archived?: boolean | undefined;
    trashed?: boolean | undefined;
}
export declare const DEFAULT_PROJECTS: ProjectItem[];
export declare function getAllProjects(currentUser?: UserSession | null, showAll?: boolean): Promise<ProjectItem[]>;
export declare function getProject(id: string): Promise<ProjectItem | null>;
export declare function saveProject(project: ProjectItem, currentUser?: UserSession | null): Promise<void>;
export declare function deleteProject(id: string, permanent?: boolean, currentUser?: UserSession | null): Promise<void>;
export declare function restoreProject(id: string, currentUser?: UserSession | null): Promise<void>;
