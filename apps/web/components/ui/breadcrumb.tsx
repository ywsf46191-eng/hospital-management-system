import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Breadcrumb({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('mb-3 text-sm text-muted-foreground', className)}>
      <ol className="flex flex-wrap items-center gap-1">{children}</ol>
    </nav>
  );
}

export function BreadcrumbItem({ href, children }: { href?: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-1">
      <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
      {href ? (
        <Link href={href} className="hover:text-foreground hover:underline">
          {children}
        </Link>
      ) : (
        <span className="font-medium text-foreground">{children}</span>
      )}
    </li>
  );
}

export function BreadcrumbHome({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-foreground hover:underline">
        {children}
      </Link>
    </li>
  );
}
