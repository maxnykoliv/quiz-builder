import Link from 'next/link';
import { useState } from 'react';
import { PlusIcon } from '@/components/icons';
import { Layout } from '@/components/Layout';
import { QuizListItem } from '@/components/QuizListItem';
import { EmptyState, ErrorMessage, SkeletonList } from '@/components/StatusMessage';
import { useAsync } from '@/hooks/useAsync';
import { getErrorMessage, quizApi } from '@/services/api';
import type { QuizSummary } from '@/types/quiz';

export default function QuizListPage() {
  const {
    data: quizzes,
    error,
    isLoading,
    reload,
    setData,
  } = useAsync((signal) => quizApi.list(signal), []);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (quiz: QuizSummary) => {
    if (!window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;

    setDeleteError(null);
    setDeletingId(quiz.id);
    try {
      await quizApi.remove(quiz.id);
      setData((current) => current?.filter((item) => item.id !== quiz.id));
    } catch (err) {
      setDeleteError(`Could not delete "${quiz.title}": ${getErrorMessage(err)}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout title="Quizzes">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          {quizzes && (
            <p className="mt-1 text-sm text-slate-500">
              {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}
            </p>
          )}
        </div>
        <Link href="/create" className="btn-primary">
          <PlusIcon /> New quiz
        </Link>
      </div>

      {deleteError && (
        <div className="mb-4">
          <ErrorMessage message={deleteError} />
        </div>
      )}

      {error && !quizzes ? (
        <ErrorMessage message={getErrorMessage(error)} onRetry={reload} />
      ) : isLoading && !quizzes ? (
        <SkeletonList />
      ) : quizzes && quizzes.length > 0 ? (
        <ul className="space-y-3">
          {quizzes.map((quiz) => (
            <QuizListItem
              key={quiz.id}
              quiz={quiz}
              isDeleting={deletingId === quiz.id}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No quizzes yet"
          description="Create your first quiz to see it listed here."
          action={
            <Link href="/create" className="btn-primary">
              <PlusIcon /> Create quiz
            </Link>
          }
        />
      )}
    </Layout>
  );
}
