import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeftIcon } from '@/components/icons';
import { Layout } from '@/components/Layout';
import { QuestionPreview } from '@/components/QuestionPreview';
import { EmptyState, ErrorMessage, SkeletonList } from '@/components/StatusMessage';
import { useAsync } from '@/hooks/useAsync';
import { ApiError, getErrorMessage, quizApi } from '@/services/api';

export default function QuizDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;

  const {
    data: quiz,
    error,
    isLoading,
    reload,
  } = useAsync((signal) => quizApi.get(id!, signal), [id], router.isReady && !!id);

  const isNotFound = error instanceof ApiError && (error.status === 404 || error.status === 400);

  return (
    <Layout title={quiz?.title ?? 'Quiz'}>
      <Link
        href="/quizzes"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeftIcon /> All quizzes
      </Link>

      {isNotFound ? (
        <EmptyState
          title="Quiz not found"
          description="It may have been deleted, or the link is incorrect."
          action={
            <Link href="/quizzes" className="btn-primary">
              Back to quizzes
            </Link>
          }
        />
      ) : error ? (
        <ErrorMessage message={getErrorMessage(error)} onRetry={reload} />
      ) : isLoading || !quiz ? (
        <SkeletonList count={3} />
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold break-words">{quiz.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'} ·
              read-only preview with correct answers highlighted
            </p>
          </div>
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <QuestionPreview key={question.id} question={question} index={index} />
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
