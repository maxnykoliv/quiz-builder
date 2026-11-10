import Link from 'next/link';
import { TrashIcon } from '@/components/icons';
import type { QuizSummary } from '@/types/quiz';

type QuizListItemProps = {
  quiz: QuizSummary;
  isDeleting: boolean;
  onDelete: (quiz: QuizSummary) => void;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export function QuizListItem({ quiz, isDeleting, onDelete }: QuizListItemProps) {
  const questionLabel = `${quiz.questionCount} ${quiz.questionCount === 1 ? 'question' : 'questions'}`;

  return (
    <li
      className={`flex items-center gap-2 card transition hover:border-indigo-300 hover:shadow ${
        isDeleting ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <Link href={`/quizzes/${quiz.id}`} className="min-w-0 flex-1 px-4 py-4 sm:px-5">
        <h2 className="truncate font-semibold text-slate-900">{quiz.title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          <span className="font-medium text-indigo-600">{questionLabel}</span>
          <span className="mx-2">·</span>
          <time dateTime={quiz.createdAt}>{dateFormatter.format(new Date(quiz.createdAt))}</time>
        </p>
      </Link>
      <button
        type="button"
        onClick={() => onDelete(quiz)}
        disabled={isDeleting}
        className="mr-2 btn-ghost hover:bg-red-50 hover:text-red-600 sm:mr-3"
        aria-label={`Delete quiz "${quiz.title}"`}
        title="Delete quiz"
      >
        <TrashIcon />
      </button>
    </li>
  );
}
