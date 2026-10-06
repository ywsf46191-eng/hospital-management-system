import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold', {
  variants: {
    tone: {
      neutral: 'bg-muted text-foreground',
      success: 'bg-success-foreground text-success',
      warning: 'bg-warning-foreground text-warning',
      danger: 'bg-destructive/10 text-destructive',
      info: 'bg-info-foreground text-info',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'ACTIVE' || status === 'SUCCESS'
      ? 'success'
      : status === 'DENIED' || status === 'DISABLED' || status === 'FAILURE'
        ? 'danger'
        : status === 'PENDING' || status === 'SUSPENDED'
          ? 'warning'
          : 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
}
