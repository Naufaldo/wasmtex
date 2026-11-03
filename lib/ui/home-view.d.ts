import { UserSession } from '../auth/auth-store.js';
export interface HomeViewOptions {
    onLoginSuccess: (session: UserSession) => void;
    onToggleTheme: () => void;
    isDarkMode: () => boolean;
}
export declare class HomeView {
    private container;
    private options;
    private activeTourTab;
    constructor(container: HTMLElement, options: HomeViewOptions);
    init(): void;
    private render;
    private renderShowcaseTab;
    private bindEvents;
}
