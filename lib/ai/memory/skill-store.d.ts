import { ProjectMemory, Skill } from '../types.js';
export declare const DEFAULT_BUILTIN_SKILLS: Skill[];
export declare function loadAllSkills(): Skill[];
export declare function saveAllSkills(skills: Skill[]): void;
export declare function upsertSkill(skill: Omit<Skill, 'id' | 'updatedAt'> & {
    id?: string;
}): Skill;
export declare function deleteSkill(id: string): boolean;
export declare function loadProjectMemory(projectId: string): ProjectMemory;
export declare function saveProjectMemory(memory: ProjectMemory): void;
export declare function updateProjectMemory(projectId: string, update: Partial<Omit<ProjectMemory, 'projectId' | 'updatedAt'>>): ProjectMemory;
