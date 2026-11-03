import { ProjectItem } from './project-store.js';
export interface DashboardViewOptions {
    onOpenProject: (project: ProjectItem) => void;
    onToggleTheme: () => void;
    isDarkMode: () => boolean;
}
export declare class DashboardView {
    private container;
    private options;
    private projects;
    private papers;
    private selectedLibraryProject;
    private currentFilter;
    constructor(container: HTMLElement, options: DashboardViewOptions);
    init(): Promise<void>;
    private render;
    private bindEvents;
    private renderTags;
    private renderProjectRows;
    private renderLibraryRows;
    private promptNewProject;
}
