import { Skill } from '../types.js';
export interface CuratedSkillPreset {
    id: string;
    name: string;
    source: string;
    repoUrl: string;
    description: string;
    trigger: string;
    rules: string[];
}
export declare const CURATED_COMMUNITY_SKILLS: CuratedSkillPreset[];
export declare function normalizeGitHubRawUrl(inputUrl: string): string;
export declare function parseSkillMarkdown(content: string, defaultName?: string): Omit<Skill, 'id' | 'updatedAt'>;
export declare function fetchSkillFromUrl(inputUrl: string): Promise<Omit<Skill, 'id' | 'updatedAt'>>;
