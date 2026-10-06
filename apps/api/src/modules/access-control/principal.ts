import type { ActiveSession } from '../identity/session.service';

export type GrantScope = 'GLOBAL' | 'HOSPITAL' | 'DEPARTMENT' | 'WARD' | 'ASSIGNED_PATIENT' | 'OWN_RECORD';

export interface PermissionGrant {
  permission: string;
  scope: GrantScope;
  /** Tenant of the grant; `null` for platform grants. */
  tenantId: string | null;
  /** Department restriction carried by the role assignment, if any. */
  departmentId: string | null;
}

/** The authenticated caller, resolved from the server-side session only. */
export interface AuthPrincipal {
  userId: string;
  sessionId: string;
  tenantId: string | null;
  session: ActiveSession;
  sessionToken: string;
  grants?: PermissionGrant[];
}
