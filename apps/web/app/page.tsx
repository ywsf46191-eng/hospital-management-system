import Link from 'next/link';
import { Button } from '@hospital/ui';
import { APP_NAME } from '@hospital/config';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-hospital-primary">
        Foundation
      </p>
      <h1 className="text-4xl font-bold text-hospital-ink">{APP_NAME}</h1>
      <p className="max-w-2xl text-lg leading-relaxed text-slate-700">
        Phase 0 + Phase 1 monorepo foundation is online. Specifications in{' '}
        <code className="rounded bg-white px-1.5 py-0.5 text-sm">docs/</code> are the source of
        truth. Business modules are not started yet.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/health">
          <Button>Open health page</Button>
        </Link>
      </div>
    </main>
  );
}
