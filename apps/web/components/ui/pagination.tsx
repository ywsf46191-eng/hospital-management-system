import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
  labels,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
  labels: { newer: string; older: string; summary: string };
}) {
  const hasNewer = page > 1;
  const hasOlder = page * pageSize < total;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
      {hasNewer ? (
        <Link href={hrefFor(page - 1)} className="text-primary hover:underline">
          {labels.newer}
        </Link>
      ) : null}
      {hasOlder ? (
        <Link href={hrefFor(page + 1)} className="text-primary hover:underline">
          {labels.older}
        </Link>
      ) : null}
      <span className={cn('text-muted-foreground')}>{labels.summary}</span>
    </div>
  );
}
