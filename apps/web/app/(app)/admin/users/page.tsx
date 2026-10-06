import type { Paginated, TenantUser } from '@hospital/types';
import Link from 'next/link';
import { CreateUserForm } from '@/components/admin/create-user-form';
import { Card, ErrorText, PageHeader, StatusBadge, Table, Td } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/i18n/translate';
import { getTranslator } from '@/lib/i18n/server';
import { loadPageData, requireSession } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const me = await requireSession();
  const { locale, t } = await getTranslator();
  const { search, page } = await searchParams;
  const query = new URLSearchParams({ pageSize: '50', page: page && /^\d+$/.test(page) ? page : '1' });
  if (search) query.set('search', search);
  const users = await loadPageData<Paginated<TenantUser>>(`/users?${query.toString()}`);

  return (
    <>
      <PageHeader
        title={t('users.title')}
        description={t('users.description', { hospital: me.activeTenant?.name ?? t('users.thisHospital') })}
      />
      {me.permissions.includes('user.create') ? (
        <Card title={t('users.create')}>
          <CreateUserForm minLength={me.passwordMinLength} />
        </Card>
      ) : null}
      <Card>
        <form className="mb-4 flex gap-2" action="/admin/users">
          <Input name="search" defaultValue={search ?? ''} placeholder={t('users.search')} className="flex-1" />
        </form>
        <ErrorText message={users.error?.message} />
        {users.data ? (
          <>
            <Table headers={[t('auth.username'), t('users.name'), t('users.access'), t('users.roles'), t('users.lastSignIn')]}>
              {users.data.items.map((user) => (
                <tr key={user.id}>
                  <Td>
                    <Link href={`/admin/users/${user.id}`} className="text-primary underline">
                      {user.username}
                    </Link>
                  </Td>
                  <Td>{user.displayName}</Td>
                  <Td>
                    <StatusBadge status={user.userStatus === 'ACTIVE' ? user.membershipStatus : user.userStatus} />
                  </Td>
                  <Td>{user.roles.map((assignment) => assignment.role.key).join(', ') || '—'}</Td>
                  <Td>{user.lastLoginAt ? formatDateTime(user.lastLoginAt, locale) : t('users.never')}</Td>
                </tr>
              ))}
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">{t('users.summary', { total: users.data.total, page: users.data.page })}</p>
          </>
        ) : null}
      </Card>
    </>
  );
}
