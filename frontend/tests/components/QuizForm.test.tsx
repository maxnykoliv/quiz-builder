import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuizForm } from '@/components/quiz-form/QuizForm';

function setup(submitError?: string) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<QuizForm onSubmit={onSubmit} submitError={submitError} />);
  return { onSubmit, user };
}

const questionCards = () => screen.getAllByRole('group', { name: /^Question \d+$/ });
const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Create quiz' }));

describe('QuizForm', () => {
  it('starts with a title field and one True/False question', () => {
    setup();
    expect(screen.getByLabelText('Quiz title')).toBeInTheDocument();
    expect(questionCards()).toHaveLength(1);
    expect(screen.getByLabelText('Type')).toHaveValue('BOOLEAN');
    expect(screen.getByRole('radio', { name: 'True' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'False' })).toBeInTheDocument();
  });

  it('shows all validation errors on the first submit and does not submit', async () => {
    const { onSubmit, user } = setup();

    await submit(user);

    expect(await screen.findByText('Quiz title is required')).toBeInTheDocument();
    expect(screen.getByText('Question text is required')).toBeInTheDocument();
    expect(screen.getByText('Select the correct answer')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('adds and removes questions dynamically, keeping at least one', async () => {
    const { user } = setup();
    const removeFirst = () => screen.getByRole('button', { name: 'Remove question 1' });

    expect(removeFirst()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Add question' }));
    await user.click(screen.getByRole('button', { name: 'Add question' }));
    expect(questionCards()).toHaveLength(3);
    expect(removeFirst()).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Remove question 2' }));
    expect(questionCards()).toHaveLength(2);
  });

  it('removes the right question when one in the middle is deleted', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Add question' }));
    await user.click(screen.getByRole('button', { name: 'Add question' }));

    const inputs = screen.getAllByLabelText('Question');
    await user.type(inputs[0], 'First');
    await user.type(inputs[1], 'Second');
    await user.type(inputs[2], 'Third');

    await user.click(screen.getByRole('button', { name: 'Remove question 2' }));

    expect(
      screen.getAllByLabelText('Question').map((input) => (input as HTMLInputElement).value),
    ).toEqual(['First', 'Third']);
  });

  it('shows the answer field matching the selected question type', async () => {
    const { user } = setup();
    const typeSelect = screen.getByLabelText('Type');

    await user.selectOptions(typeSelect, 'INPUT');
    expect(screen.getByLabelText('Correct answer')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    await user.selectOptions(typeSelect, 'CHECKBOX');
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.queryByLabelText('Correct answer')).not.toBeInTheDocument();
  });

  it('lets the user add and remove checkbox options with a minimum of two', async () => {
    const { user } = setup();
    await user.selectOptions(screen.getByLabelText('Type'), 'CHECKBOX');

    expect(screen.getByRole('button', { name: 'Remove option 1' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Add option' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Remove option 3' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('requires a correct option and clears the error once one is ticked', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByLabelText('Quiz title'), 'Quiz');
    await user.type(screen.getByLabelText('Question'), 'Pick');
    await user.selectOptions(screen.getByLabelText('Type'), 'CHECKBOX');
    await user.type(screen.getByLabelText('Option 1 text'), 'A');
    await user.type(screen.getByLabelText('Option 2 text'), 'B');

    await submit(user);
    expect(await screen.findByText('Mark at least one option as correct')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText('Option 2 is correct'));
    await waitFor(() =>
      expect(screen.queryByText('Mark at least one option as correct')).not.toBeInTheDocument(),
    );
  });

  it('submits a quiz with all three question types', async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText('Quiz title'), 'Mixed quiz');

    await user.type(screen.getAllByLabelText('Question')[0], 'Sky is blue');
    await user.click(screen.getByRole('radio', { name: 'True' }));

    await user.click(screen.getByRole('button', { name: 'Add question' }));
    const second = questionCards()[1];
    await user.type(within(second).getByLabelText('Question'), 'Capital of France?');
    await user.selectOptions(within(second).getByLabelText('Type'), 'INPUT');
    await user.type(within(second).getByLabelText('Correct answer'), 'Paris');

    await user.click(screen.getByRole('button', { name: 'Add question' }));
    const third = questionCards()[2];
    await user.type(within(third).getByLabelText('Question'), 'Even numbers?');
    await user.selectOptions(within(third).getByLabelText('Type'), 'CHECKBOX');
    await user.type(within(third).getByLabelText('Option 1 text'), '2');
    await user.type(within(third).getByLabelText('Option 2 text'), '3');
    await user.click(within(third).getByRole('button', { name: 'Add option' }));
    await user.type(within(third).getByLabelText('Option 3 text'), '4');
    await user.click(within(third).getByLabelText('Option 1 is correct'));
    await user.click(within(third).getByLabelText('Option 3 is correct'));

    await submit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      title: 'Mixed quiz',
      questions: [
        expect.objectContaining({ type: 'BOOLEAN', text: 'Sky is blue', booleanAnswer: 'true' }),
        expect.objectContaining({ type: 'INPUT', text: 'Capital of France?', textAnswer: 'Paris' }),
        expect.objectContaining({
          type: 'CHECKBOX',
          text: 'Even numbers?',
          options: [
            { text: '2', isCorrect: true },
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true },
          ],
        }),
      ],
    });
  });

  it('displays a submit error passed from the page', () => {
    setup('Cannot reach the API');
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot reach the API');
  });
});
