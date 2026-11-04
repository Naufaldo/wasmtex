import { ChatMessage, ProjectMemory, Skill } from '../types.js';
export interface CompactionStats {
    originalTokens: number;
    compactedTokens: number;
    savedTokens: number;
    savedPercentage: number;
}
export declare function estimateTokenCount(text: string): number;
export declare function estimateMessagesTokens(messages: ChatMessage[]): number;
export declare function selectRelevantSkills(skills: Skill[], queryOrContext: string, maxBudgetTokens?: number): Skill[];
export declare function formatSkillsPrompt(skills: Skill[]): string;
export declare function formatProjectMemoryPrompt(memory: ProjectMemory): string;
export declare function compactChatHistory(messages: ChatMessage[], maxBudgetTokens?: number, recentKeepCount?: number): {
    messages: ChatMessage[];
    stats: CompactionStats;
};
