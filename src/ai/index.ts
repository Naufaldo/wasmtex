export { AnthropicAdapter } from './adapters/anthropic'
export { BaseAdapter } from './adapters/base'
export { OllamaAdapter } from './adapters/ollama'
export { OpenAiAdapter } from './adapters/openai'
export {
  type AgentContext,
  AgentLoop,
  type AgentLoopOptions,
  type AgentResult,
  type AgentStep,
} from './agent-loop'
export {
  AIService,
  type AIServiceOptions,
  createModelAdapter,
} from './ai-service'
export {
  type DiagnosisResult,
  diagnoseErrors,
  type ErrorDiagnosisInput,
  type ProposedFix,
} from './features/error-diagnosis'
export {
  compareWithDraft,
  extractBibtex,
  extractTextFromPdf,
  type PaperSummary,
  summarizePaper,
} from './features/paper-reader'
export {
  generateEquation,
  generateTable,
  generateTikz,
  polishGrammar,
} from './features/writing-assist'
export { getDefaultSystemPrompt } from './system-prompts'
export {
  ToolRegistry,
  type ToolRegistryOptions,
} from './tool-registry'

export {
  loadAllSkills,
  saveAllSkills,
  upsertSkill,
  deleteSkill,
  loadProjectMemory,
  saveProjectMemory,
  updateProjectMemory,
  DEFAULT_BUILTIN_SKILLS,
} from './memory/skill-store'

export {
  selectRelevantSkills,
  formatSkillsPrompt,
  formatProjectMemoryPrompt,
  compactChatHistory,
  estimateTokenCount,
  estimateMessagesTokens,
  type CompactionStats,
} from './memory/context-compactor'

export {
  CURATED_COMMUNITY_SKILLS,
  type CuratedSkillPreset,
  fetchSkillFromUrl,
  normalizeGitHubRawUrl,
  parseSkillMarkdown,
} from './memory/skill-importer'

export type {
  ChatMessage,
  ChatResponse,
  ModelAdapter,
  ModelAdapterOptions,
  ModelProvider,
  ProjectMemory,
  Role,
  Skill,
  TokenUsage,
  ToolCall,
  ToolDefinition,
} from './types'
