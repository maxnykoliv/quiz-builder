import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getErrorMessage, quizApi } from '@/services/api';

const fetchMock = vi.fn();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('quizApi', () => {
  it('list() sends GET /quizzes and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 1, title: 'Q', questionCount: 2 }]));

    await expect(quizApi.list()).resolves.toEqual([{ id: 1, title: 'Q', questionCount: 2 }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/quizzes',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('get() sends GET /quizzes/:id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 7 }));
    await quizApi.get(7);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:4000/quizzes/7');
  });

  it('create() sends POST /quizzes with a JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 3 }, 201));
    const payload = {
      title: 'Q',
      questions: [{ type: 'INPUT' as const, text: 'T', correctAnswer: 'A' }],
    };

    await expect(quizApi.create(payload)).resolves.toEqual({ id: 3 });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/quizzes',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    );
  });

  it('remove() sends DELETE /quizzes/:id and handles 204 No Content', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(quizApi.remove(5)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/quizzes/5',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('throws ApiError with message and validation issues for error responses', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { message: 'Validation failed', errors: [{ path: 'title', message: 'Required' }] },
        400,
      ),
    );

    const error = await quizApi.create({ title: '', questions: [] }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: 'Validation failed',
      issues: [{ path: 'title', message: 'Required' }],
    });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500 }));
    await expect(quizApi.list()).rejects.toMatchObject({
      status: 500,
      message: 'Request failed with status 500',
    });
  });

  it('throws a helpful ApiError when the backend is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(quizApi.list()).rejects.toMatchObject({
      status: 0,
      message: 'Cannot reach the API at http://localhost:4000. Is the backend running?',
    });
  });
});

describe('getErrorMessage', () => {
  it('returns the message of an Error and a fallback otherwise', () => {
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom');
    expect(getErrorMessage('nope')).toBe('Something went wrong');
  });
});
