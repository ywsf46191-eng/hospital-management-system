'use client';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/locale-provider';
import { useSession } from '@/components/session-context';
import { apiCall } from '@/lib/client-api';

export function LogoutButton() {
  const { me } = useSession();
  const { t } = useI18n();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await apiCall('POST', '/auth/logout', { csrfToken: me.csrfToken });
        window.location.assign('/login');
      }}
    >
      {t('auth.signOut')}
    </Button>
  );
}
