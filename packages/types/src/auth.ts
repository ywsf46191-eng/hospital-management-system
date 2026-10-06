export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
export type PermissionScope = 'GLOBAL' | 'HOSPITAL' | 'DEPARTMENT' | 'WARD' | 'ASSIGNED_PATIENT' | 'OWN_RECORD';
export type PermissionLevel = 'PLATFORM' | 'TENANT' | 'ANY';
export type RoleLevel = 'PLATFORM' | 'TENANT';
export type AuditResult = 'SUCCESS' | 'FAILURE' | 'DENIED';

export interface HospitalSummary {
  id: string;
  code: string;
  name: string;
}

export interface MembershipSummary {
  tenantId: string;
  hospital: HospitalSummary;
  status: MembershipStatus;
}

/** `GET /auth/me`. Permissions are for UI navigation only; the API enforces authorization. */
export interface AuthMe {
  user: { id: string; username: string; displayName: string; email: string | null };
  activeTenant: HospitalSummary | null;
  memberships: MembershipSummary[];
  platformRoles: string[];
  roles: string[];
  permissions: string[];
  passwordChangeRequired: boolean;
  passwordMinLength: number;
  tenantSelectionRequired: boolean;
  csrfToken: string;
  session: { id: string; idleExpiresAt: string; absoluteExpiresAt: string };
}

export interface SessionSummary {
  id: string;
  current: boolean;
  tenantId: string | null;
  createdAt: string;
  lastSeenAt: string;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface RoleAssignmentSummary {
  id: string;
  role: { id: string; key: string; name: string; isSystem: boolean };
  departmentId: string | null;
  validFrom: string;
  validUntil: string | null;
}

export interface TenantUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  userStatus: UserStatus;
  membershipStatus: MembershipStatus;
  lastLoginAt: string | null;
  roles: RoleAssignmentSummary[];
  departments: { id: string; code: string; name: string }[];
}

export interface RolePermissionSummary {
  key: string;
  scope: PermissionScope;
}

export interface RoleSummary {
  id: string;
  key: string;
  name: string;
  description: string | null;
  level: RoleLevel;
  isSystem: boolean;
  status: 'ACTIVE' | 'DISABLED';
  permissions: RolePermissionSummary[];
}

export interface PermissionSummary {
  key: string;
  module: string;
  level: PermissionLevel;
  description: string;
  moduleEnabled: boolean;
}

export interface DepartmentSummary {
  id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'DISABLED';
}

export interface AuditLogEntry {
  id: string;
  occurredAt: string;
  tenantId: string | null;
  actorType: 'USER' | 'SYSTEM' | 'ANONYMOUS';
  actorUserId: string | null;
  action: string;
  category: string;
  resourceType: string | null;
  resourceId: string | null;
  result: AuditResult;
  reason: string | null;
  requestId: string | null;
  ipAddress: string | null;
  metadata: unknown;
  beforeData: unknown;
  afterData: unknown;
}

export interface PlatformHospital extends HospitalSummary {
  type: 'GOVERNMENT' | 'PRIVATE' | 'NON_PROFIT';
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
