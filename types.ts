export enum PromptType {
  TEXT = 'TEXT',
  EMOJI = 'EMOJI',
  IMAGE = 'IMAGE',
}

export interface StoryIdea {
  title: string;
  summary: string;
  researchPlan?: string;
}