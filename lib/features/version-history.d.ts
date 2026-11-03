export interface ProjectVersion {
    id: string;
    timestamp: number;
    label: string;
    isNamed: boolean;
    files: Record<string, string>;
    fileCount: number;
}
export declare function saveVersion(label: string, filesMap: Record<string, string>, isNamed?: boolean): Promise<ProjectVersion>;
export declare function getVersions(): Promise<ProjectVersion[]>;
export declare function deleteVersion(id: string): Promise<void>;
export interface VersionHistoryDialogOptions {
    getCurrentFiles: () => Record<string, string>;
    onRestore: (files: Record<string, string>) => void;
}
export declare class VersionHistoryDialog {
    private overlay;
    private options;
    private versions;
    private selectedVersion;
    constructor(options: VersionHistoryDialogOptions);
    open(): Promise<void>;
    close(): void;
    private renderList;
    private renderPreview;
}
