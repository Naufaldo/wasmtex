import { ModelAdapter } from '../types.js';
export interface ErrorDiagnosisInput {
    errors: Array<{
        message: string;
        file?: string;
        line?: number;
        code?: string;
    }>;
    logExcerpt?: string;
    relevantFiles?: Record<string, string>;
}
export interface ProposedFix {
    file: string;
    line?: number;
    explanation: string;
    oldSnippet: string;
    newSnippet: string;
}
export interface DiagnosisResult {
    summary: string;
    rootCause: string;
    fixes: ProposedFix[];
}
export declare function diagnoseErrors(input: ErrorDiagnosisInput, model: ModelAdapter, locale?: 'en' | 'id'): Promise<DiagnosisResult>;
