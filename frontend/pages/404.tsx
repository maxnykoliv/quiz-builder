import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { EmptyState } from '@/components/StatusMessage';

export default function NotFoundPage() {
  return (
    <Layout title="Page not found">
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist."
        action={
          <Link href="/quizzes" className="btn-primary">
            Go to quizzes
          </Link>
        }
      />
    </Layout>
  );
}
