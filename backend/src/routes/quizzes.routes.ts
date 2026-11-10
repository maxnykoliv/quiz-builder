import { Router } from 'express';
import * as quizzesController from '../controllers/quizzes.controller';

export const quizzesRouter = Router();

quizzesRouter.post('/', quizzesController.createQuiz);
quizzesRouter.get('/', quizzesController.listQuizzes);
quizzesRouter.get('/:id', quizzesController.getQuiz);
quizzesRouter.delete('/:id', quizzesController.deleteQuiz);
