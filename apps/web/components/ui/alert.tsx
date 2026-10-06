import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const alertVariants = cva('rounded-md border px-3 py-2 text-sm', {
  variants: {
    variant: {
      default: 'border-border bg-surface text-foreground',
      destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
      success: 'border-success/30 bg-success-foreground text-success',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Alert({ className, variant, ...props }: HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function ErrorText({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return <Alert variant="destructive">{message}</Alert>;
}
