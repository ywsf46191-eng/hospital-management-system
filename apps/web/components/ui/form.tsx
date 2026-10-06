import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { Input } from './input';
import { Label } from './label';
import { NativeSelect } from './select';

export function Field({
  label,
  children,
  ...props
}: { label: string; children?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      {children ?? <Input {...props} />}
    </div>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <NativeSelect {...props}>{children}</NativeSelect>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
