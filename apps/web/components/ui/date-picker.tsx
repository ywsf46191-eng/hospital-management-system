import type { InputHTMLAttributes } from 'react';
import { Input } from './input';

/** Native date control, styled with the form input tokens. */
export function DatePicker(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="date" {...props} />;
}
