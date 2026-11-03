export interface TextComment {
    id: string;
    file: string;
    line: number;
    selectedText: string;
    commentText: string;
    author: string;
    timestamp: number;
    resolved: boolean;
}
export declare function getComments(): TextComment[];
export declare function saveComments(comments: TextComment[]): void;
export interface CommentsPanelOptions {
    getActiveFile: () => string;
    getActiveSelection: () => {
        text: string;
        line: number;
    } | null;
    onJumpToLine: (file: string, line: number) => void;
    onBadgeUpdate?: (count: number) => void;
}
export declare class CommentsPanel {
    private container;
    private options;
    private comments;
    private isOpen;
    constructor(options: CommentsPanelOptions);
    toggle(): void;
    open(): void;
    close(): void;
    private updateBadge;
    private promptNewComment;
    private renderList;
}
