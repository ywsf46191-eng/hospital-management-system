import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: ButtonVariant;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))]',
  secondary: 'border border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]',
  danger: 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]',
};

/** Institutional button aligned with the Phase 4 tokens (used if imported from @hospital/ui). */
export function Button({ variant = 'primary', children, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
