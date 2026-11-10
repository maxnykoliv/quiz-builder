import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import QuizListPage from '@/pages/quizzes';
import { ApiError, quizApi } from '@/services/api';
import type * as ApiModule from '@/services/api';
import { mockRouter, quizSummaries } from '../mocks';

vi.mock('next/router', () => ({ useRouter: () => mockRouter }));
vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>();
  return {
    ...actual,
    quizApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), remove: vi.fn() },
  };
});

const api = vi.mocked(quizApi);
let confirmSpy: MockInstance<typeof window.confirm>;

beforeEach(() => {
  mockRouter.pathname = '/quizzes';
  confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  confirmSpy.mockRestore();
});

describe('Quiz list page (/quizzes)', () => {
  it('fetches quizzes and shows each title, question count and a link to its page', async () => {
    api.list.mockResolvedValue(quizSummaries);
    render(<QuizListPage />);

    await screen.findByText('Web Basics');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);

    const first = within(items[0]);
    expect(first.getByRole('link')).toHaveAttribute('href', '/quizzes/2');
    expect(first.getByText('Web Basics')).toBeInTheDocument();
    expect(first.getByText('1 question')).toBeInTheDocument();

    const second = within(items[1]);
    expect(second.getByRole('link')).toHaveAttribute('href', '/quizzes/1');
    expect(second.getByText('3 questions')).toBeInTheDocument();
  });

  it('deletes a quiz via the API and removes it from the page', async () => {
    api.list.mockResolvedValue(quizSummaries);
    api.remove.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<QuizListPage />);

    await user.click(
      await screen.findByRole('button', { name: 'Delete quiz "JavaScript Fundamentals"' }),
    );

    expect(api.remove).toHaveBeenCalledWith(1);
    await waitFor(() =>
      expect(screen.queryByText('JavaScript Fundamentals')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Web Basics')).toBeInTheDocument();
    expect(api.list).toHaveBeenCalledTimes(1);
  });

  it('does not delete when the user cancels the confirmation', async () => {
    api.list.mockResolvedValue(quizSummaries);
    confirmSpy.mockReturnValue(false);
    const user = userEvent.setup();
    render(<QuizListPage />);

    await user.click(await screen.findByRole('button', { name: 'Delete quiz "Web Basics"' }));

    expect(api.remove).not.toHaveBeenCalled();
    expect(screen.getByText('Web Basics')).toBeInTheDocument();
  });

  it('keeps the quiz and shows an error when deletion fails', async () => {
    api.list.mockResolvedValue(quizSummaries);
    api.remove.mockRejectedValue(new ApiError(500, 'Internal server error'));
    const user = userEvent.setup();
    render(<QuizListPage />);

    await user.click(await screen.findByRole('button', { name: 'Delete quiz "Web Basics"' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not delete "Web Basics": Internal server error',
    );
    expect(screen.getByText('Web Basics')).toBeInTheDocument();
  });

  it('shows an empty state with a link to create a quiz', async () => {
    api.list.mockResolvedValue([]);
    render(<QuizListPage />);

    expect(await screen.findByText('No quizzes yet')).toBeInTheDocument();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Create quiz' }),
    ).toHaveAttribute('href', '/create');
  });

  it('shows a loading error and retries on demand', async () => {
    api.list.mockRejectedValueOnce(new ApiError(0, 'Cannot reach the API'));
    api.list.mockResolvedValueOnce(quizSummaries);
    const user = userEvent.setup();
    render(<QuizListPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the API');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Web Basics')).toBeInTheDocument();
    expect(api.list).toHaveBeenCalledTimes(2);
  });
});
