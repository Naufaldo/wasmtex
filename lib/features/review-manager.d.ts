export interface TextSuggestion {
    id: string;
    file: string;
    originalText: string;
    suggestedText: string;
    author: string;
    timestamp: number;
    status: 'pending' | 'accepted' | 'rejected';
}
export declare function getSuggestions(): TextSuggestion[];
export declare function saveSuggestions(suggestions: TextSuggestion[]): void;
export interface ReviewManagerOptions {
    getActiveFile: () => string;
    getFileContent: (file: string) => string | Uint8Array | null;
    setFileContent: (file: string, content: string) => void;
    onRecompile: () => void;
    onBadgeUpdate?: (count: number) => void;
}
export declare class ReviewManager {
    private container;
    private options;
    private suggestions;
    private isReviewModeEnabled;
    constructor(options: ReviewManagerOptions);
    isReviewMode(): boolean;
    setReviewMode(enabled: boolean): void;
    togglePanel(): void;
    open(): void;
    close(): void;
    private updateBadge;
    private promptNewSuggestion;
    private renderList;
    private accept;
    private reject;
}
