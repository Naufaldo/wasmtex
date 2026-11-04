import { ChatMessage, ChatResponse, ToolDefinition } from '../types.js';
import { BaseAdapter } from './base.js';
export declare class AnthropicAdapter extends BaseAdapter {
    private getHeaders;
    private formatTools;
    private convertToolCalls;
    private prepareMessages;
    private buildRequestBody;
    chat(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): AsyncGenerator<string, void, unknown>;
    private parseResponseContent;
    chatComplete(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): Promise<ChatResponse>;
}
