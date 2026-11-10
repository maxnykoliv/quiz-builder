import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/quizzes', label: 'Quizzes' },
  { href: '/create', label: 'Create quiz' },
];

type LayoutProps = {
  title?: string;
  children: ReactNode;
};

export function Layout({ title, children }: LayoutProps) {
  const { pathname } = useRouter();
  const pageTitle = title ? `${title} · Quiz Builder` : 'Quiz Builder';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/quizzes" className="flex items-center gap-2 text-lg font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                Q
              </span>
              <span className="hidden sm:inline">Quiz Builder</span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/quizzes'
                    ? pathname.startsWith('/quizzes')
                    : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </div>
    </>
  );
}
