import { vi } from 'vitest';
import type { Quiz, QuizSummary } from '@/types/quiz';

export const mockRouter = {
  pathname: '/',
  query: {} as Record<string, string>,
  isReady: true,
  push: vi.fn().mockResolvedValue(true),
};

export const quizSummaries: QuizSummary[] = [
  { id: 2, title: 'Web Basics', questionCount: 1, createdAt: '2026-11-10T10:00:00.000Z' },
  {
    id: 1,
    title: 'JavaScript Fundamentals',
    questionCount: 3,
    createdAt: '2026-11-09T10:00:00.000Z',
  },
];

export const sampleQuiz: Quiz = {
  id: 1,
  title: 'JavaScript Fundamentals',
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
  questions: [
    { id: 10, type: 'BOOLEAN', text: 'JS is statically typed', correctAnswer: false },
    { id: 11, type: 'INPUT', text: 'Constant keyword?', correctAnswer: 'const' },
    {
      id: 12,
      type: 'CHECKBOX',
      text: 'Primitive types?',
      options: [
        { id: 100, text: 'string', isCorrect: true },
        { id: 101, text: 'object', isCorrect: false },
        { id: 102, text: 'symbol', isCorrect: true },
      ],
    },
  ],
};
