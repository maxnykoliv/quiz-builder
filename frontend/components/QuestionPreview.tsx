import { CheckIcon } from '@/components/icons';
import { QUESTION_TYPE_LABELS } from '@/types/quiz';
import type { Question } from '@/types/quiz';

type QuestionPreviewProps = {
  question: Question;
  index: number;
};

export function QuestionPreview({ question, index }: QuestionPreviewProps) {
  return (
    <article className="space-y-4 card p-4 sm:p-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="font-medium">
          <span className="mr-2 text-slate-400">{index + 1}.</span>
          {question.text}
        </h2>
        <span className="w-fit shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {QUESTION_TYPE_LABELS[question.type]}
        </span>
      </header>
      <QuestionBody question={question} />
    </article>
  );
}

function QuestionBody({ question }: { question: Question }) {
  switch (question.type) {
    case 'BOOLEAN':
      return (
        <ul className="flex gap-3">
          {[true, false].map((value) => (
            <AnswerChoice
              key={String(value)}
              kind="radio"
              label={value ? 'True' : 'False'}
              checked={question.correctAnswer === value}
            />
          ))}
        </ul>
      );
    case 'INPUT':
      return (
        <div>
          <span className="label text-slate-500">Correct answer</span>
          <input className="input" value={question.correctAnswer} readOnly disabled />
        </div>
      );
    case 'CHECKBOX':
      return (
        <ul className="grid gap-2 sm:grid-cols-2">
          {question.options.map((option) => (
            <AnswerChoice
              key={option.id}
              kind="checkbox"
              label={option.text}
              checked={option.isCorrect}
            />
          ))}
        </ul>
      );
  }
}

type AnswerChoiceProps = {
  kind: 'radio' | 'checkbox';
  label: string;
  checked: boolean;
};

function AnswerChoice({ kind, label, checked }: AnswerChoiceProps) {
  return (
    <li
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
        checked
          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
          : 'border-slate-200 text-slate-600'
      }`}
    >
      <input
        type={kind}
        checked={checked}
        readOnly
        disabled
        className="accent-emerald-600"
        aria-label={label}
      />
      <span className="flex-1">{label}</span>
      {checked && (
        <span className="flex items-center gap-1 text-xs font-medium">
          <CheckIcon /> Correct
        </span>
      )}
    </li>
  );
}
