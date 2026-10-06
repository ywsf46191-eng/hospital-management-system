import type { Paginated, TenantUser } from '@hospital/types';
import Link from 'next/link';
import { CreateUserForm } from '@/components/admin/create-user-form';
import { Card, ErrorText, PageHeader, StatusBadge, Table, Td } from '@/components/ui';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const me = await requireSession();
  const { search, page } = await searchParams;
  const query = new URLSearchParams({ pageSize: '50', page: page && /^\d+$/.test(page) ? page : '1' });
  if (search) query.set('search', search);
  const users = await loadPageData<Paginated<TenantUser>>(`/users?${query.toString()}`);

  return (
    <>
      <PageHeader title="Users" description={`Accounts with access to ${me.activeTenant?.name ?? 'this hospital'}.`} />
      {me.permissions.includes('user.create') ? (
        <Card title="Create user">
          <CreateUserForm minLength={me.passwordMinLength} />
        </Card>
      ) : null}
      <Card>
        <form className="mb-4 flex gap-2" action="/admin/users">
          <input name="search" defaultValue={search ?? ''} placeholder="Search username or name" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </form>
        <ErrorText message={users.error?.message} />
        {users.data ? (
          <>
            <Table headers={['Username', 'Name', 'Access', 'Roles', 'Last sign-in']}>
              {users.data.items.map((user) => (
                <tr key={user.id}>
                  <Td>
                    <Link href={`/admin/users/${user.id}`} className="text-hospital-primary underline">
                      {user.username}
                    </Link>
                  </Td>
                  <Td>{user.displayName}</Td>
                  <Td>
                    <StatusBadge status={user.userStatus === 'ACTIVE' ? user.membershipStatus : user.userStatus} />
                  </Td>
                  <Td>{user.roles.map((assignment) => assignment.role.key).join(', ') || '—'}</Td>
                  <Td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</Td>
                </tr>
              ))}
            </Table>
            <p className="mt-3 text-xs text-slate-500">
              {users.data.total} user(s) · page {users.data.page}
            </p>
          </>
        ) : null}
      </Card>
    </>
  );
}
