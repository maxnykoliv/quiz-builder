import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/httpError';
import type { CreateQuizInput, QuestionInput, QuestionType } from '../validation/quiz.schema';

const quizWithQuestions = {
  questions: {
    orderBy: { position: 'asc' },
    include: { options: { orderBy: { position: 'asc' } } },
  },
} satisfies Prisma.QuizInclude;

type QuizWithQuestions = Prisma.QuizGetPayload<{ include: typeof quizWithQuestions }>;
type QuestionRecord = QuizWithQuestions['questions'][number];

export type QuizSummary = {
  id: number;
  title: string;
  questionCount: number;
  createdAt: Date;
};

export type QuestionDto =
  | { id: number; type: 'BOOLEAN'; text: string; correctAnswer: boolean }
  | { id: number; type: 'INPUT'; text: string; correctAnswer: string }
  | {
      id: number;
      type: 'CHECKBOX';
      text: string;
      options: { id: number; text: string; isCorrect: boolean }[];
    };

export type QuizDto = {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  questions: QuestionDto[];
};

function toQuestionCreateData(
  question: QuestionInput,
  position: number,
): Prisma.QuestionCreateWithoutQuizInput {
  const base = { position, type: question.type, text: question.text };

  switch (question.type) {
    case 'BOOLEAN':
      return { ...base, booleanAnswer: question.correctAnswer };
    case 'INPUT':
      return { ...base, textAnswer: question.correctAnswer };
    case 'CHECKBOX':
      return {
        ...base,
        options: {
          create: question.options.map((option, index) => ({
            position: index,
            text: option.text,
            isCorrect: option.isCorrect,
          })),
        },
      };
  }
}

function toQuestionDto(question: QuestionRecord): QuestionDto {
  const type = question.type as QuestionType;

  switch (type) {
    case 'BOOLEAN':
      return {
        id: question.id,
        type,
        text: question.text,
        correctAnswer: question.booleanAnswer ?? false,
      };
    case 'INPUT':
      return {
        id: question.id,
        type,
        text: question.text,
        correctAnswer: question.textAnswer ?? '',
      };
    case 'CHECKBOX':
      return {
        id: question.id,
        type,
        text: question.text,
        options: question.options.map(({ id, text, isCorrect }) => ({ id, text, isCorrect })),
      };
  }
}

function toQuizDto(quiz: QuizWithQuestions): QuizDto {
  return {
    id: quiz.id,
    title: quiz.title,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
    questions: quiz.questions.map(toQuestionDto),
  };
}

export async function createQuiz(input: CreateQuizInput): Promise<QuizDto> {
  const quiz = await prisma.quiz.create({
    data: {
      title: input.title,
      questions: { create: input.questions.map(toQuestionCreateData) },
    },
    include: quizWithQuestions,
  });

  return toQuizDto(quiz);
}

export async function listQuizzes(): Promise<QuizSummary[]> {
  const quizzes = await prisma.quiz.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { id: true, title: true, createdAt: true, _count: { select: { questions: true } } },
  });

  return quizzes.map(({ _count, ...quiz }) => ({ ...quiz, questionCount: _count.questions }));
}

export async function getQuizById(id: number): Promise<QuizDto> {
  const quiz = await prisma.quiz.findUnique({ where: { id }, include: quizWithQuestions });

  if (!quiz) {
    throw new NotFoundError(`Quiz with id ${id} not found`);
  }

  return toQuizDto(quiz);
}

export async function deleteQuiz(id: number): Promise<void> {
  const { count } = await prisma.quiz.deleteMany({ where: { id } });

  if (count === 0) {
    throw new NotFoundError(`Quiz with id ${id} not found`);
  }
}
