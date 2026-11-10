import type { Request, Response } from 'express';
import * as quizzesService from '../services/quizzes.service';
import { createQuizSchema, quizIdParamSchema } from '../validation/quiz.schema';

export async function createQuiz(req: Request, res: Response) {
  const input = createQuizSchema.parse(req.body);
  const quiz = await quizzesService.createQuiz(input);
  res.status(201).json(quiz);
}

export async function listQuizzes(_req: Request, res: Response) {
  const quizzes = await quizzesService.listQuizzes();
  res.json(quizzes);
}

export async function getQuiz(req: Request, res: Response) {
  const { id } = quizIdParamSchema.parse(req.params);
  const quiz = await quizzesService.getQuizById(id);
  res.json(quiz);
}

export async function deleteQuiz(req: Request, res: Response) {
  const { id } = quizIdParamSchema.parse(req.params);
  await quizzesService.deleteQuiz(id);
  res.status(204).send();
}
