import { VirtualFS } from '../fs/virtual-fs.js';
import { WasmTexCompiler } from '../headless.js';
import { LatexLanguageService } from '../lsp-service.js';
import { AgentContext, AgentResult } from './agent-loop.js';
import { DiagnosisResult } from './features/error-diagnosis.js';
import { PaperSummary } from './features/paper-reader.js';
import { ToolRegistry } from './tool-registry.js';
import { ModelAdapter, ModelAdapterOptions, ToolCall } from './types.js';
export interface AIServiceOptions {
    model: ModelAdapterOptions;
    fs: VirtualFS;
    lsp?: LatexLanguageService | null;
    compiler?: WasmTexCompiler | null;
    mainFile?: string;
    projectId?: string;
    maxAgentSteps?: number;
    onApprovalNeeded?: (call: ToolCall) => Promise<boolean>;
    onToolCall?: (call: ToolCall, result: string) => void;
    locale?: 'en' | 'id';
}
export declare function createModelAdapter(options: ModelAdapterOptions): ModelAdapter;
export declare class AIService {
    private adapter;
    private tools;
    private loop;
    private options;
    constructor(options: AIServiceOptions);
    private createAgentLoop;
    updateModel(options: ModelAdapterOptions): void;
    getToolRegistry(): ToolRegistry;
    chat(userPrompt: string, context?: AgentContext, signal?: AbortSignal): Promise<AgentResult>;
    chatStream(userPrompt: string, signal?: AbortSignal): AsyncGenerator<string, void, unknown>;
    fixErrors(errors: Array<{
        message: string;
        file?: string;
        line?: number;
    }>, logSnippet?: string): Promise<string>;
    rewriteSelection(text: string, instruction?: string): Promise<string>;
    continueWriting(contextBefore: string): Promise<string>;
    explainLatex(code: string): Promise<string>;
    generateEquation(description: string): Promise<string>;
    generateTable(description: string, useBooktabs?: boolean): Promise<string>;
    polishGrammar(latexSnippet: string, targetTone?: 'academic' | 'concise' | 'standard'): Promise<string>;
    generateTikz(description: string): Promise<string>;
    summarizePaper(paperText: string, locale?: 'en' | 'id'): Promise<PaperSummary>;
    extractBibtex(paperText: string): Promise<string>;
    compareWithDraft(referencePaperText: string, draftText: string, locale?: 'en' | 'id'): Promise<string>;
    diagnoseErrors(errors: Array<{
        message: string;
        file?: string;
        line?: number;
        code?: string;
    }>, logExcerpt?: string): Promise<DiagnosisResult>;
}
