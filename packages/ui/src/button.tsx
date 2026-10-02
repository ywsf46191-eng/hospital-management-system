import type { ButtonHTMLAttributes, CSSProperties, PropsWithChildren } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    PropsWithChildren {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: '#0f4c81',
    color: '#fff',
    border: '1px solid #0c3d67',
  },
  secondary: {
    background: '#f3f4f6',
    color: '#111827',
    border: '1px solid #d1d5db',
  },
  danger: {
    background: '#b91c1c',
    color: '#fff',
    border: '1px solid #991b1b',
  },
};

export function Button({
  variant = 'primary',
  children,
  style,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      style={{
        padding: '0.5rem 0.9rem',
        borderRadius: '0.375rem',
        fontWeight: 600,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
