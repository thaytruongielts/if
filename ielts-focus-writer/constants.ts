import { Stage, StageConfig } from './types';

// Duration in seconds (5 mins = 300, 10 mins = 600)
// For testing purposes, you might shorten these.
export const STAGE_CONFIGS: Record<Stage, StageConfig> = {
  [Stage.Initial]: {
    id: Stage.Initial,
    label: 'Start',
    durationSeconds: 0,
    description: 'Generate a prompt to begin',
    color: 'bg-gray-500'
  },
  [Stage.Outline]: {
    id: Stage.Outline,
    label: 'Outline',
    durationSeconds: 300, // 5 mins
    description: 'Plan your main ideas and structure (5m)',
    color: 'bg-blue-500'
  },
  [Stage.Introduction]: {
    id: Stage.Introduction,
    label: 'Introduction',
    durationSeconds: 300, // 5 mins
    description: 'Paraphrase the prompt and state your thesis (5m)',
    color: 'bg-indigo-500'
  },
  [Stage.Body1]: {
    id: Stage.Body1,
    label: 'Body Paragraph 1',
    durationSeconds: 600, // 10 mins
    description: 'Write your first main idea with supporting details (10m)',
    color: 'bg-purple-500'
  },
  [Stage.Body2]: {
    id: Stage.Body2,
    label: 'Body Paragraph 2',
    durationSeconds: 600, // 10 mins
    description: 'Write your second main idea with supporting details (10m)',
    color: 'bg-pink-500'
  },
  [Stage.Conclusion]: {
    id: Stage.Conclusion,
    label: 'Conclusion',
    durationSeconds: 300, // 5 mins
    description: 'Summarize your main points and restate opinion (5m)',
    color: 'bg-red-500'
  },
  [Stage.Review]: {
    id: Stage.Review,
    label: 'Review & Edit',
    durationSeconds: 300, // 5 mins
    description: 'Check for grammar, spelling, and cohesion errors (5m)',
    color: 'bg-green-500'
  },
  [Stage.Finished]: {
    id: Stage.Finished,
    label: 'Complete',
    durationSeconds: 0,
    description: 'Send your work and get AI feedback',
    color: 'bg-emerald-600'
  }
};

export const STAGE_ORDER = [
  Stage.Outline,
  Stage.Introduction,
  Stage.Body1,
  Stage.Body2,
  Stage.Conclusion,
  Stage.Review,
];

export const RECIPIENT_EMAIL = 'datewithdestiny79@gmail.com';
