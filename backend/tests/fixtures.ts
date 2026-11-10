import type { CreateQuizInput } from '../src/validation/quiz.schema';

export const buildQuizPayload = (overrides: Partial<CreateQuizInput> = {}): CreateQuizInput => ({
  title: 'JavaScript Basics',
  questions: [
    { type: 'BOOLEAN', text: 'JavaScript is single-threaded.', correctAnswer: true },
    { type: 'INPUT', text: 'Keyword for a constant?', correctAnswer: 'const' },
    {
      type: 'CHECKBOX',
      text: 'Which are primitives?',
      options: [
        { text: 'string', isCorrect: true },
        { text: 'object', isCorrect: false },
        { text: 'number', isCorrect: true },
      ],
    },
  ],
  ...overrides,
});
