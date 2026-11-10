import type { ReactNode } from 'react';

type ErrorMessageProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
    >
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary shrink-0">
          Try again
        </button>
      )}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 card px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="h-20 animate-pulse card bg-slate-100" />
      ))}
    </ul>
  );
}
