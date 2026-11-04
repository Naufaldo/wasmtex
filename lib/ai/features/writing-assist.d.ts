import { ModelAdapter } from '../types.js';
export declare function generateEquation(description: string, model: ModelAdapter): Promise<string>;
export declare function generateTable(description: string, model: ModelAdapter, useBooktabs?: boolean): Promise<string>;
export declare function polishGrammar(latexSnippet: string, model: ModelAdapter, targetTone?: 'academic' | 'concise' | 'standard'): Promise<string>;
export declare function generateTikz(diagramDescription: string, model: ModelAdapter): Promise<string>;
