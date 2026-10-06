'use client';

import { Button } from '@hospital/ui';
import { useSession } from '@/components/session-context';
import { apiCall } from '@/lib/client-api';

export function LogoutButton() {
  const { me } = useSession();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await apiCall('POST', '/auth/logout', { csrfToken: me.csrfToken });
        window.location.assign('/login');
      }}
    >
      Sign out
    </Button>
  );
}
