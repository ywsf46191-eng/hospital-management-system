import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 space-y-1">
      <h1 className="text-2xl font-bold text-hospital-ink">{title}</h1>
      {description ? <p className="text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {title ? <h2 className="mb-3 text-lg font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input className="rounded-md border border-slate-300 px-3 py-2 focus:border-hospital-primary focus:outline-none" {...props} />
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select className="rounded-md border border-slate-300 px-3 py-2" {...props}>
        {children}
      </select>
    </label>
  );
}

export function ErrorText({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-slate-200 py-2 pr-4 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children }: { children: ReactNode }) {
  return <td className="border-b border-slate-100 py-2 pr-4 align-top">{children}</td>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'ACTIVE' || status === 'SUCCESS'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'DENIED' || status === 'DISABLED' || status === 'FAILURE'
        ? 'bg-red-50 text-red-800'
        : 'bg-amber-50 text-amber-800';
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${tone}`}>{status}</span>;
}
