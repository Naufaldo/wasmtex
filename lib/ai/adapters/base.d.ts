import { ChatMessage, ChatResponse, ModelAdapter, ModelAdapterOptions, ToolDefinition } from '../types.js';
export declare abstract class BaseAdapter implements ModelAdapter {
    protected options: ModelAdapterOptions;
    constructor(options: ModelAdapterOptions);
    abstract chat(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): AsyncGenerator<string, void, unknown>;
    abstract chatComplete(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): Promise<ChatResponse>;
    supportsToolUse(): boolean;
    protected resolveUrl(path: string): string;
    private extractSseData;
    protected parseSseStream(response: Response): AsyncGenerator<string, void, unknown>;
}
