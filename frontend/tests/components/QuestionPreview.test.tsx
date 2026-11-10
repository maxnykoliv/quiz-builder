import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuestionPreview } from '@/components/QuestionPreview';
import { sampleQuiz } from '../mocks';

const [booleanQuestion, inputQuestion, checkboxQuestion] = sampleQuiz.questions;

describe('QuestionPreview', () => {
  it('renders a True/False question as read-only radios with the correct one checked', () => {
    render(<QuestionPreview question={booleanQuestion} index={0} />);

    expect(screen.getByRole('heading')).toHaveTextContent('1.JS is statically typed');
    expect(screen.getByText('True / False')).toBeInTheDocument();
    const trueRadio = screen.getByRole('radio', { name: 'True' });
    const falseRadio = screen.getByRole('radio', { name: 'False' });
    expect(trueRadio).not.toBeChecked();
    expect(falseRadio).toBeChecked();
    expect(trueRadio).toBeDisabled();
    expect(falseRadio).toBeDisabled();
  });

  it('renders a short answer question with the expected answer in a disabled input', () => {
    render(<QuestionPreview question={inputQuestion} index={1} />);

    expect(screen.getByText('Short answer')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('const');
    expect(input).toBeDisabled();
  });

  it('renders a multiple choice question with every correct option checked', () => {
    render(<QuestionPreview question={checkboxQuestion} index={2} />);

    expect(screen.getByText('Multiple choice')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'string' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'object' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'symbol' })).toBeChecked();
    screen.getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).toBeDisabled());
    expect(screen.getAllByText('Correct')).toHaveLength(2);
  });
});
