import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateQuizPage from '@/pages/create';
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
  mockRouter.pathname = '/create';
});

async function fillValidQuiz(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Quiz title'), '  Capitals  ');
  await user.type(screen.getByLabelText('Question'), 'Kyiv is the capital of Ukraine');
  await user.click(screen.getByRole('radio', { name: 'True' }));
  await user.click(screen.getByRole('button', { name: 'Create quiz' }));
}

describe('Create quiz page (/create)', () => {
  it('POSTs the quiz payload and navigates to the new quiz', async () => {
    api.create.mockResolvedValue({ ...sampleQuiz, id: 42 });
    const user = userEvent.setup();
    render(<CreateQuizPage />);

    await fillValidQuiz(user);

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/quizzes/42'));
    expect(api.create).toHaveBeenCalledWith({
      title: 'Capitals',
      questions: [{ type: 'BOOLEAN', text: 'Kyiv is the capital of Ukraine', correctAnswer: true }],
    });
  });

  it('shows the server error and validation details when creation fails', async () => {
    api.create.mockRejectedValue(
      new ApiError(400, 'Validation failed', [{ path: 'title', message: 'Too long' }]),
    );
    const user = userEvent.setup();
    render(<CreateQuizPage />);

    await fillValidQuiz(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Validation failed: title — Too long',
    );
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
