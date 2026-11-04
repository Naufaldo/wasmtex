import { CompactionStats } from './memory/context-compactor.js';
import { ToolRegistry } from './tool-registry.js';
import { ChatMessage, ModelAdapter, ProjectMemory, Skill, TokenUsage, ToolCall } from './types.js';
export interface AgentContext {
    activeFile?: string | undefined;
    cursorPosition?: {
        line: number;
        column: number;
    } | undefined;
    selectedText?: string | undefined;
    skills?: Skill[] | undefined;
    projectMemory?: ProjectMemory | undefined;
    priorMessages?: ChatMessage[] | undefined;
}
export interface AgentStep {
    step: number;
    toolCalls: Array<{
        tool: string;
        args: Record<string, unknown>;
        result: string;
        approved?: boolean;
    }>;
}
export interface AgentResult {
    response: string;
    steps: AgentStep[];
    tokensUsed?: TokenUsage;
    compactionStats?: CompactionStats | undefined;
}
export interface AgentLoopOptions {
    adapter: ModelAdapter;
    tools: ToolRegistry;
    maxSteps?: number;
    onToolCall?: (call: ToolCall, result: string) => void;
    onApprovalNeeded?: (call: ToolCall) => Promise<boolean>;
}
export declare class AgentLoop {
    private adapter;
    private tools;
    private maxSteps;
    private onToolCall;
    private onApprovalNeeded;
    constructor(options: AgentLoopOptions);
    private parseArguments;
    private extractEditorContextLines;
    private buildSystemParts;
    private buildInitialMessages;
    private handleSingleTool;
    private processToolCalls;
    private buildResult;
    run(userPrompt: string, context?: AgentContext, signal?: AbortSignal): Promise<AgentResult>;
}
