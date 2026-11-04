import { ChatMessage, ChatResponse, ToolDefinition } from '../types.js';
import { BaseAdapter } from './base.js';
export declare class OllamaAdapter extends BaseAdapter {
    private prepareMessages;
    private normalizeToolCalls;
    private parseNdjsonLine;
    private parseNdjsonStream;
    chat(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): AsyncGenerator<string, void, unknown>;
    chatComplete(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): Promise<ChatResponse>;
}
