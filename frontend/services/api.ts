import type { CreateQuizPayload, Quiz, QuizSummary } from '@/types/quiz';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type ApiValidationIssue = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly issues: ApiValidationIssue[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, `Cannot reach the API at ${API_URL}. Is the backend running?`);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      errors?: ApiValidationIssue[];
    } | null;
    throw new ApiError(
      response.status,
      body?.message ?? `Request failed with status ${response.status}`,
      body?.errors,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const quizApi = {
  list: (signal?: AbortSignal) => request<QuizSummary[]>('/quizzes', { signal }),

  get: (id: number | string, signal?: AbortSignal) =>
    request<Quiz>(`/quizzes/${encodeURIComponent(id)}`, { signal }),

  create: (payload: CreateQuizPayload) =>
    request<Quiz>('/quizzes', { method: 'POST', body: JSON.stringify(payload) }),

  remove: (id: number) => request<void>(`/quizzes/${id}`, { method: 'DELETE' }),
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
