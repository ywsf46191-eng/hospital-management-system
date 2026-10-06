/** Server-side base URL of the API (never exposed to the browser for authenticated calls). */
export function apiInternalBaseUrl(): string {
  return (
    process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1'
  ).replace(/\/$/, '');
}
