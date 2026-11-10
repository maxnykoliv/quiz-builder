export const QUESTION_TYPES = ['BOOLEAN', 'INPUT', 'CHECKBOX'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  BOOLEAN: 'True / False',
  INPUT: 'Short answer',
  CHECKBOX: 'Multiple choice',
};

export type QuizSummary = {
  id: number;
  title: string;
  questionCount: number;
  createdAt: string;
};

export type CheckboxOption = {
  id: number;
  text: string;
  isCorrect: boolean;
};

export type Question =
  | { id: number; type: 'BOOLEAN'; text: string; correctAnswer: boolean }
  | { id: number; type: 'INPUT'; text: string; correctAnswer: string }
  | { id: number; type: 'CHECKBOX'; text: string; options: CheckboxOption[] };

export type Quiz = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
};

export type CreateQuestionPayload =
  | { type: 'BOOLEAN'; text: string; correctAnswer: boolean }
  | { type: 'INPUT'; text: string; correctAnswer: string }
  | { type: 'CHECKBOX'; text: string; options: { text: string; isCorrect: boolean }[] };

export type CreateQuizPayload = {
  title: string;
  questions: CreateQuestionPayload[];
};
