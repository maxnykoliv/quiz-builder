import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuizDetailPage from '@/pages/quizzes/[id]';
import { ApiError, quizApi } from '@/services/api';
import type * as ApiModule from '@/services/api';
import { mockRouter, sampleQuiz } from '../mocks';

vi.mock('next/router', () => ({ useRouter: () => mockRouter }));
vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>();
  return {
    ...actual,
    quizApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), remove: vi.fn() },
  };
});

const api = vi.mocked(quizApi);

beforeEach(() => {
  mockRouter.pathname = '/quizzes/[id]';
  mockRouter.query = { id: '1' };
  mockRouter.isReady = true;
});

describe('Quiz detail page (/quizzes/:id)', () => {
  it('fetches the quiz by id and renders its title and all questions read-only', async () => {
    api.get.mockResolvedValue(sampleQuiz);
    render(<QuizDetailPage />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'JavaScript Fundamentals' }),
    ).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('1', expect.any(AbortSignal));
    expect(screen.getByText('3 questions', { exact: false })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);

    [
      ...screen.getAllByRole('radio'),
      ...screen.getAllByRole('checkbox'),
      screen.getByRole('textbox'),
    ].forEach((control) => expect(control).toBeDisabled());
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('waits for the router before fetching', () => {
    mockRouter.isReady = false;
    mockRouter.query = {};
    render(<QuizDetailPage />);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('shows a "not found" state for a missing quiz', async () => {
    api.get.mockRejectedValue(new ApiError(404, 'Quiz with id 1 not found'));
    render(<QuizDetailPage />);

    expect(await screen.findByText('Quiz not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to quizzes' })).toHaveAttribute(
      'href',
      '/quizzes',
    );
  });

  it('shows other errors with a retry button', async () => {
    api.get.mockRejectedValue(new ApiError(500, 'Internal server error'));
    render(<QuizDetailPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
