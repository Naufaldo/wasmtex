export type Role = 'system' | 'user' | 'assistant' | 'tool';
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
export interface ChatMessage {
    role: Role;
    content: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    requiresApproval?: boolean;
}
export type ModelProvider = 'openai' | 'anthropic' | 'ollama' | '9router' | 'openrouter' | 'custom';
export interface Skill {
    id: string;
    name: string;
    description: string;
    rules: string[];
    trigger?: string | undefined;
    updatedAt: number;
}
export interface ProjectMemory {
    projectId: string;
    summary: string;
    notationDecisions: string[];
    activeTopic?: string | undefined;
    updatedAt: number;
}
export interface ModelAdapterOptions {
    provider: ModelProvider;
    endpoint: string;
    apiKey?: string | undefined;
    model: string;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    systemPrompt?: string | undefined;
}
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
}
export interface ChatResponse {
    message: ChatMessage;
    usage?: TokenUsage;
}
export interface ModelAdapter {
    chat(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): AsyncGenerator<string, void, unknown>;
    chatComplete(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): Promise<ChatResponse>;
    supportsToolUse(): boolean;
}
