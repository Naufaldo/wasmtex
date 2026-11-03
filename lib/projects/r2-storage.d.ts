import { ProjectItem } from './project-store.js';
export interface R2SyncStatus {
    available: boolean;
    message?: string;
}
/** Check if the Cloudflare Worker R2 endpoint is active and bound */
export declare function checkR2StorageAvailable(): Promise<R2SyncStatus>;
/** Upload a project JSON package to the private R2 bucket */
export declare function backupProjectToR2(project: ProjectItem): Promise<boolean>;
/** Retrieve a project from R2 */
export declare function fetchProjectFromR2(projectId: string): Promise<ProjectItem | null>;
