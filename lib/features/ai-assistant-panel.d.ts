import { ModelProvider } from '../ai/index.js';
import { WasmTex } from '../wasmtex.js';
export interface AiAssistantPanelOptions {
    getEditor: () => WasmTex | null;
    getCompilerErrors: () => Array<{
        message: string;
        file?: string;
        line?: number;
        code?: string;
    }>;
    getProjectId?: () => string;
    onRecompile: () => void;
    onInsertText: (text: string) => void;
    onReplaceSelection: (text: string) => void;
}
export interface StoredAiConfig {
    provider: ModelProvider;
    endpoint: string;
    apiKey: string;
    model: string;
    locale: 'en' | 'id';
}
export declare function loadAiConfig(): StoredAiConfig;
export declare function saveAiConfig(cfg: StoredAiConfig): void;
export declare class AiAssistantPanel {
    private container;
    private options;
    private config;
    private aiService;
    private isOpen;
    private activeTab;
    private chatHistory;
    private pendingApprovalResolver;
    private isProcessing;
    constructor(options: AiAssistantPanelOptions);
    private getProjectId;
    private initAiService;
    private requestApproval;
    toggle(): void;
    open(): void;
    close(): void;
    private renderShell;
    private bindEvents;
    private renderTabContent;
    private renderChatTab;
    private handleUserChat;
    private renderApprovalPrompt;
    private renderErrorsTab;
    private applyDiagnosisFix;
    private renderWritingTab;
    private renderResearchTab;
    private appendBibtex;
    private renderSkillsList;
    private renderMemoryTab;
    private bindCuratedSkillEvents;
    private bindMemoryTabEvents;
    private renderSettingsTab;
    private escapeHtml;
}
