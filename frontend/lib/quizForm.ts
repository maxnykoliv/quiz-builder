import { z } from 'zod';
import { QUESTION_TYPES } from '@/types/quiz';
import type { CreateQuestionPayload, CreateQuizPayload } from '@/types/quiz';

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

const questionFormSchema = z
  .object({
    type: z.enum(QUESTION_TYPES),
    text: z.string().trim().min(1, 'Question text is required').max(500),
    booleanAnswer: z.enum(['true', 'false']).nullable(),
    textAnswer: z.string().max(200),
    options: z.array(z.object({ text: z.string().max(200), isCorrect: z.boolean() })),
  })
  .superRefine((question, ctx) => {
    switch (question.type) {
      case 'BOOLEAN':
        if (!question.booleanAnswer) {
          ctx.addIssue({
            code: 'custom',
            path: ['booleanAnswer'],
            message: 'Select the correct answer',
          });
        }
        break;
      case 'INPUT':
        if (!question.textAnswer.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['textAnswer'],
            message: 'Correct answer is required',
          });
        }
        break;
      case 'CHECKBOX':
        question.options.forEach((option, index) => {
          if (!option.text.trim()) {
            ctx.addIssue({
              code: 'custom',
              path: ['options', index, 'text'],
              message: 'Option text is required',
            });
          }
        });
        if (question.options.length < MIN_OPTIONS) {
          ctx.addIssue({
            code: 'custom',
            path: ['options'],
            message: `Add at least ${MIN_OPTIONS} options`,
          });
        } else if (!question.options.some((option) => option.isCorrect)) {
          ctx.addIssue({
            code: 'custom',
            path: ['options'],
            message: 'Mark at least one option as correct',
          });
        }
        break;
    }
  });

export const quizFormSchema = z.object({
  title: z.string().trim().min(1, 'Quiz title is required').max(200),
  questions: z.array(questionFormSchema).min(1, 'Add at least one question'),
});

export type QuizFormValues = z.infer<typeof quizFormSchema>;
export type QuestionFormValues = QuizFormValues['questions'][number];

export const createEmptyOption = () => ({ text: '', isCorrect: false });

export const createEmptyQuestion = (): QuestionFormValues => ({
  type: 'BOOLEAN',
  text: '',
  booleanAnswer: null,
  textAnswer: '',
  options: Array.from({ length: MIN_OPTIONS }, createEmptyOption),
});

export const defaultQuizFormValues: QuizFormValues = {
  title: '',
  questions: [createEmptyQuestion()],
};

function toQuestionPayload(question: QuestionFormValues): CreateQuestionPayload {
  const text = question.text.trim();

  switch (question.type) {
    case 'BOOLEAN':
      return { type: 'BOOLEAN', text, correctAnswer: question.booleanAnswer === 'true' };
    case 'INPUT':
      return { type: 'INPUT', text, correctAnswer: question.textAnswer.trim() };
    case 'CHECKBOX':
      return {
        type: 'CHECKBOX',
        text,
        options: question.options.map((option) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
        })),
      };
  }
}

export function toCreateQuizPayload(values: QuizFormValues): CreateQuizPayload {
  return {
    title: values.title.trim(),
    questions: values.questions.map(toQuestionPayload),
  };
}
