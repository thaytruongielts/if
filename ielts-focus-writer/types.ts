export enum Stage {
  Initial = 'Initial',
  Outline = 'Outline',
  Introduction = 'Introduction',
  Body1 = 'Body1',
  Body2 = 'Body2',
  Conclusion = 'Conclusion',
  Review = 'Review',
  Finished = 'Finished'
}

export interface EssayData {
  outline: string;
  introduction: string;
  body1: string;
  body2: string;
  conclusion: string;
}

export interface StageConfig {
  id: Stage;
  label: string;
  durationSeconds: number;
  description: string;
  color: string;
}

export interface GeminiFeedback {
  bandScore: string;
  strengths: string[];
  weaknesses: string[];
  improvedVersion: string;
  suggestedOutline: string;
}
