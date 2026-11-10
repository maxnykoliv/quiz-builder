import { z } from 'zod';

export const QUESTION_TYPES = ['BOOLEAN', 'INPUT', 'CHECKBOX'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

const questionText = z.string().trim().min(1, 'Question text is required').max(500);

const booleanQuestionSchema = z.object({
  type: z.literal('BOOLEAN'),
  text: questionText,
  correctAnswer: z.boolean({ required_error: 'Select the correct answer' }),
});

const inputQuestionSchema = z.object({
  type: z.literal('INPUT'),
  text: questionText,
  correctAnswer: z.string().trim().min(1, 'Correct answer is required').max(200),
});

const checkboxOptionSchema = z.object({
  text: z.string().trim().min(1, 'Option text is required').max(200),
  isCorrect: z.boolean(),
});

const checkboxQuestionSchema = z.object({
  type: z.literal('CHECKBOX'),
  text: questionText,
  options: z
    .array(checkboxOptionSchema)
    .min(2, 'Add at least two options')
    .max(10, 'No more than 10 options')
    .refine((options) => options.some((option) => option.isCorrect), {
      message: 'Mark at least one option as correct',
    }),
});

export const questionSchema = z.discriminatedUnion('type', [
  booleanQuestionSchema,
  inputQuestionSchema,
  checkboxQuestionSchema,
]);

export const createQuizSchema = z.object({
  title: z.string().trim().min(1, 'Quiz title is required').max(200),
  questions: z.array(questionSchema).min(1, 'Add at least one question').max(50),
});

export const quizIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Quiz id must be a positive integer'),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
