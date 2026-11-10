import { describe, expect, it } from 'vitest';
import { createQuizSchema, quizIdParamSchema } from '../src/validation/quiz.schema';
import { buildQuizPayload } from './fixtures';

const issuesOf = (input: unknown) => {
  const result = createQuizSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
};

describe('createQuizSchema', () => {
  it('accepts a quiz with all three question types', () => {
    expect(createQuizSchema.safeParse(buildQuizPayload()).success).toBe(true);
  });

  it('trims the title, question text and answers', () => {
    const parsed = createQuizSchema.parse({
      title: '  Quiz  ',
      questions: [{ type: 'INPUT', text: '  Q?  ', correctAnswer: '  A  ' }],
    });
    expect(parsed).toEqual({
      title: 'Quiz',
      questions: [{ type: 'INPUT', text: 'Q?', correctAnswer: 'A' }],
    });
  });

  it('strips unknown fields', () => {
    const parsed = createQuizSchema.parse({ ...buildQuizPayload(), id: 99, extra: true });
    expect(parsed).not.toHaveProperty('id');
    expect(parsed).not.toHaveProperty('extra');
  });

  it('requires a non-blank title', () => {
    expect(issuesOf(buildQuizPayload({ title: '   ' }))).toContainEqual({
      path: 'title',
      message: 'Quiz title is required',
    });
  });

  it('requires at least one question', () => {
    expect(issuesOf(buildQuizPayload({ questions: [] }))).toContainEqual({
      path: 'questions',
      message: 'Add at least one question',
    });
  });

  it('rejects an unknown question type', () => {
    const issues = issuesOf({ title: 'Q', questions: [{ type: 'ESSAY', text: 'Why?' }] });
    expect(issues[0]?.path).toBe('questions.0.type');
  });

  it('requires question text', () => {
    const issues = issuesOf({
      title: 'Q',
      questions: [{ type: 'BOOLEAN', text: '', correctAnswer: true }],
    });
    expect(issues).toContainEqual({
      path: 'questions.0.text',
      message: 'Question text is required',
    });
  });

  it('requires a boolean answer for BOOLEAN questions', () => {
    const issues = issuesOf({
      title: 'Q',
      questions: [{ type: 'BOOLEAN', text: 'True?', correctAnswer: 'yes' }],
    });
    expect(issues[0]?.path).toBe('questions.0.correctAnswer');
  });

  it('requires a non-empty answer for INPUT questions', () => {
    const issues = issuesOf({
      title: 'Q',
      questions: [{ type: 'INPUT', text: 'Name?', correctAnswer: '  ' }],
    });
    expect(issues).toContainEqual({
      path: 'questions.0.correctAnswer',
      message: 'Correct answer is required',
    });
  });

  it('requires at least two options for CHECKBOX questions', () => {
    const issues = issuesOf({
      title: 'Q',
      questions: [{ type: 'CHECKBOX', text: 'Pick', options: [{ text: 'A', isCorrect: true }] }],
    });
    expect(issues).toContainEqual({
      path: 'questions.0.options',
      message: 'Add at least two options',
    });
  });

  it('requires at least one correct option for CHECKBOX questions', () => {
    const issues = issuesOf({
      title: 'Q',
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
    expect(issues).toContainEqual({
      path: 'questions.0.options',
      message: 'Mark at least one option as correct',
    });
  });

  it('allows several correct options for CHECKBOX questions', () => {
    const result = createQuizSchema.safeParse({
      title: 'Q',
      questions: [
        {
          type: 'CHECKBOX',
          text: 'Pick',
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: true },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('requires non-empty option text', () => {
    const issues = issuesOf({
      title: 'Q',
      questions: [
        {
          type: 'CHECKBOX',
          text: 'Pick',
          options: [
            { text: '', isCorrect: true },
            { text: 'B', isCorrect: false },
          ],
        },
      ],
    });
    expect(issues).toContainEqual({
      path: 'questions.0.options.0.text',
      message: 'Option text is required',
    });
  });
});

describe('quizIdParamSchema', () => {
  it.each([
    ['1', 1],
    ['42', 42],
  ])('parses %s as %d', (raw, expected) => {
    expect(quizIdParamSchema.parse({ id: raw })).toEqual({ id: expected });
  });

  it.each(['abc', '0', '-1', '1.5'])('rejects %s', (raw) => {
    expect(quizIdParamSchema.safeParse({ id: raw }).success).toBe(false);
  });
});
