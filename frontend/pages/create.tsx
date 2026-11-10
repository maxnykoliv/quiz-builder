import { useRouter } from 'next/router';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { QuizForm } from '@/components/quiz-form/QuizForm';
import { toCreateQuizPayload } from '@/lib/quizForm';
import type { QuizFormValues } from '@/lib/quizForm';
import { ApiError, getErrorMessage, quizApi } from '@/services/api';

export default function CreateQuizPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: QuizFormValues) => {
    setSubmitError(null);
    try {
      const quiz = await quizApi.create(toCreateQuizPayload(values));
      await router.push(`/quizzes/${quiz.id}`);
    } catch (error) {
      const details =
        error instanceof ApiError && error.issues.length > 0
          ? `: ${error.issues.map((issue) => `${issue.path} — ${issue.message}`).join('; ')}`
          : '';
      setSubmitError(`${getErrorMessage(error)}${details}`);
    }
  };

  return (
    <Layout title="Create quiz">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create a quiz</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a title and as many questions as you like. Each question can be True/False, a short
          answer, or multiple choice.
        </p>
      </div>
      <QuizForm onSubmit={handleSubmit} submitError={submitError} />
    </Layout>
  );
}
