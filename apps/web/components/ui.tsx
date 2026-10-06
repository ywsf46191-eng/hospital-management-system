import type { ReactNode } from 'react';
import { Alert, ErrorText } from './ui/alert';
import { Badge, StatusBadge } from './ui/badge';
import { Button } from './ui/button';
import { Card as UiCard, CardContent, CardHeader, CardTitle } from './ui/card';
import { Field, PageHeader, SelectField } from './ui/form';
import { Input } from './ui/input';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export { Alert, Badge, Button, CardContent, CardHeader, CardTitle, ErrorText, Field, Input, PageHeader, SelectField, StatusBadge };

/** Page section used across administration screens. */
export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <UiCard className="mb-6">
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </UiCard>
  );
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <UiTable>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead key={`${index}-${header}`}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </UiTable>
  );
}

export function Td({ children }: { children: ReactNode }) {
  return <TableCell>{children}</TableCell>;
}
