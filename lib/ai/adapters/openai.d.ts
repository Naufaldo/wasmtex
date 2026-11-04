import { ChatMessage, ChatResponse, ToolDefinition } from '../types.js';
import { BaseAdapter } from './base.js';
export declare class OpenAiAdapter extends BaseAdapter {
    private getHeaders;
    private prepareMessages;
    private formatTools;
    chat(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): AsyncGenerator<string, void, unknown>;
    chatComplete(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): Promise<ChatResponse>;
}
