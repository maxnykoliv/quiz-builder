import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { buildQuizPayload } from './fixtures';

const app = createApp();

async function createQuiz(overrides = {}) {
  const response = await request(app).post('/quizzes').send(buildQuizPayload(overrides));
  expect(response.status).toBe(201);
  return response.body as { id: number; title: string };
}

describe('POST /quizzes', () => {
  it('creates a quiz with all question types and returns it', async () => {
    const response = await request(app).post('/quizzes').send(buildQuizPayload());

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      title: 'JavaScript Basics',
      createdAt: expect.any(String),
      questions: [
        {
          id: expect.any(Number),
          type: 'BOOLEAN',
          text: 'JavaScript is single-threaded.',
          correctAnswer: true,
        },
        {
          id: expect.any(Number),
          type: 'INPUT',
          text: 'Keyword for a constant?',
          correctAnswer: 'const',
        },
        {
          id: expect.any(Number),
          type: 'CHECKBOX',
          text: 'Which are primitives?',
          options: [
            { id: expect.any(Number), text: 'string', isCorrect: true },
            { id: expect.any(Number), text: 'object', isCorrect: false },
            { id: expect.any(Number), text: 'number', isCorrect: true },
          ],
        },
      ],
    });
  });

  it('persists the quiz in the database', async () => {
    const { id } = await createQuiz();

    const stored = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: { include: { options: true } } },
    });
    expect(stored?.questions).toHaveLength(3);
    expect(stored?.questions.flatMap((question) => question.options)).toHaveLength(3);
  });

  it('stores a FALSE boolean answer correctly', async () => {
    const response = await request(app)
      .post('/quizzes')
      .send({
        title: 'Q',
        questions: [{ type: 'BOOLEAN', text: 'Earth is flat', correctAnswer: false }],
      });

    expect(response.status).toBe(201);
    expect(response.body.questions[0].correctAnswer).toBe(false);
  });

  it('returns 400 with field-level errors for an invalid quiz', async () => {
    const response = await request(app)
      .post('/quizzes')
      .send({
        title: '',
        questions: [
          {
            type: 'CHECKBOX',
            text: 'Pick',
            options: [
              { text: 'A', isCorrect: false },
              { text: 'B', isCorrect: false },
            ],
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        { path: 'title', message: 'Quiz title is required' },
        { path: 'questions.0.options', message: 'Mark at least one option as correct' },
      ]),
    );
    expect(await prisma.quiz.count()).toBe(0);
  });

  it('returns 400 for a quiz without questions', async () => {
    const response = await request(app).post('/quizzes').send({ title: 'Empty', questions: [] });
    expect(response.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/quizzes')
      .set('Content-Type', 'application/json')
      .send('{"title": ');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Malformed JSON in request body');
  });
});

describe('GET /quizzes', () => {
  it('returns an empty list when there are no quizzes', async () => {
    const response = await request(app).get('/quizzes');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns titles and question counts, newest first, without question details', async () => {
    const first = await createQuiz({ title: 'First' });
    const second = await createQuiz({
      title: 'Second',
      questions: [{ type: 'INPUT', text: 'Q', correctAnswer: 'A' }],
    });

    const response = await request(app).get('/quizzes');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: second.id, title: 'Second', questionCount: 1, createdAt: expect.any(String) },
      { id: first.id, title: 'First', questionCount: 3, createdAt: expect.any(String) },
    ]);
  });
});

describe('GET /quizzes/:id', () => {
  it('returns the full quiz with questions in their original order', async () => {
    const { id } = await createQuiz();

    const response = await request(app).get(`/quizzes/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(id);
    expect(response.body.questions.map((q: { type: string }) => q.type)).toEqual([
      'BOOLEAN',
      'INPUT',
      'CHECKBOX',
    ]);
    expect(response.body.questions[2].options.map((o: { text: string }) => o.text)).toEqual([
      'string',
      'object',
      'number',
    ]);
  });

  it('returns 404 for a missing quiz', async () => {
    const response = await request(app).get('/quizzes/999999');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Quiz with id 999999 not found');
  });

  it('returns 400 for a non-numeric id', async () => {
    const response = await request(app).get('/quizzes/abc');
    expect(response.status).toBe(400);
    expect(response.body.errors[0].path).toBe('id');
  });
});

describe('DELETE /quizzes/:id', () => {
  it('deletes the quiz together with its questions and options', async () => {
    const { id } = await createQuiz();

    const response = await request(app).delete(`/quizzes/${id}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    expect((await request(app).get(`/quizzes/${id}`)).status).toBe(404);
    expect(await prisma.question.count()).toBe(0);
    expect(await prisma.questionOption.count()).toBe(0);
  });

  it('only deletes the requested quiz', async () => {
    const keep = await createQuiz({ title: 'Keep' });
    const remove = await createQuiz({ title: 'Remove' });

    await request(app).delete(`/quizzes/${remove.id}`).expect(204);

    const list = await request(app).get('/quizzes');
    expect(list.body.map((quiz: { id: number }) => quiz.id)).toEqual([keep.id]);
  });

  it('returns 404 when the quiz does not exist', async () => {
    const response = await request(app).delete('/quizzes/999999');
    expect(response.status).toBe(404);
  });
});

describe('app', () => {
  it('responds to the health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns JSON 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Route GET /unknown not found');
  });

  it('returns a generic 500 without leaking details on unexpected errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const findManySpy = vi
      .spyOn(prisma.quiz, 'findMany')
      .mockRejectedValueOnce(new Error('connection lost: secret-host:5432'));

    const response = await request(app).get('/quizzes');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
    expect(consoleSpy).toHaveBeenCalled();
    findManySpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('allows CORS requests from the configured frontend origin', async () => {
    const response = await request(app).get('/quizzes').set('Origin', 'http://localhost:3000');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});
