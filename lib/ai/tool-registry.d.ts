import { VirtualFS } from '../fs/virtual-fs.js';
import { WasmTexCompiler } from '../headless.js';
import { LatexLanguageService } from '../lsp-service.js';
import { ToolDefinition } from './types.js';
export interface ToolRegistryOptions {
    fs: VirtualFS;
    lsp?: LatexLanguageService | null | undefined;
    compiler?: WasmTexCompiler | null | undefined;
    mainFile?: string | undefined;
    projectId?: string | undefined;
}
export declare class ToolRegistry {
    private fs;
    private lsp;
    private compiler;
    private mainFile;
    private projectId;
    constructor(options: ToolRegistryOptions);
    getTools(): ToolDefinition[];
    private buildRegex;
    private matchFileLines;
    private searchProject;
    private getHandlers;
    execute(name: string, args: Record<string, unknown>): Promise<string>;
}
