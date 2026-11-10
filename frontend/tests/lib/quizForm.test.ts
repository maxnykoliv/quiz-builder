import { describe, expect, it } from 'vitest';
import {
  createEmptyQuestion,
  defaultQuizFormValues,
  quizFormSchema,
  toCreateQuizPayload,
} from '@/lib/quizForm';
import type { QuestionFormValues, QuizFormValues } from '@/lib/quizForm';

const question = (overrides: Partial<QuestionFormValues>): QuestionFormValues => ({
  ...createEmptyQuestion(),
  text: 'Question?',
  ...overrides,
});

const errorPaths = (values: QuizFormValues) => {
  const result = quizFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
};

describe('quizFormSchema', () => {
  it('rejects the empty default form with errors for title, question text and answer', () => {
    expect(errorPaths(defaultQuizFormValues)).toEqual([
      'title',
      'questions.0.text',
      'questions.0.booleanAnswer',
    ]);
  });

  it('accepts a valid BOOLEAN question', () => {
    expect(
      errorPaths({ title: 'Quiz', questions: [question({ booleanAnswer: 'false' })] }),
    ).toEqual([]);
  });

  it('requires an answer for INPUT questions', () => {
    expect(
      errorPaths({ title: 'Quiz', questions: [question({ type: 'INPUT', textAnswer: '  ' })] }),
    ).toEqual(['questions.0.textAnswer']);
  });

  it('requires option text and at least one correct option for CHECKBOX questions', () => {
    const paths = errorPaths({
      title: 'Quiz',
      questions: [
        question({
          type: 'CHECKBOX',
          options: [
            { text: 'A', isCorrect: false },
            { text: '', isCorrect: false },
          ],
        }),
      ],
    });
    expect(paths).toEqual(['questions.0.options.1.text', 'questions.0.options']);
  });

  it('ignores answer fields that do not belong to the selected type', () => {
    expect(
      errorPaths({
        title: 'Quiz',
        questions: [question({ type: 'INPUT', booleanAnswer: null, textAnswer: 'Yes' })],
      }),
    ).toEqual([]);
  });
});

describe('toCreateQuizPayload', () => {
  it('maps form values to the API payload, trimming text and keeping only relevant fields', () => {
    const payload = toCreateQuizPayload({
      title: '  My quiz ',
      questions: [
        question({ text: ' Is it? ', booleanAnswer: 'false', textAnswer: 'leftover' }),
        question({ type: 'INPUT', textAnswer: ' Paris ', booleanAnswer: 'true' }),
        question({
          type: 'CHECKBOX',
          options: [
            { text: ' A ', isCorrect: true },
            { text: 'B', isCorrect: false },
          ],
        }),
      ],
    });

    expect(payload).toEqual({
      title: 'My quiz',
      questions: [
        { type: 'BOOLEAN', text: 'Is it?', correctAnswer: false },
        { type: 'INPUT', text: 'Question?', correctAnswer: 'Paris' },
        {
          type: 'CHECKBOX',
          text: 'Question?',
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false },
          ],
        },
      ],
    });
  });

  it('maps a "true" boolean answer to true', () => {
    const payload = toCreateQuizPayload({
      title: 'Q',
      questions: [question({ booleanAnswer: 'true' })],
    });
    expect(payload.questions[0]).toMatchObject({ correctAnswer: true });
  });
});
