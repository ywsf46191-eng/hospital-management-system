/**
 * Code-defined permission registry — the source of truth (ADP-006 / P3-D6).
 * Synchronized into the `permissions` table at startup; never edited through the API.
 *
 * Naming: `<resource>.<action>` with `read` (P3-D5, RBAC.md §34). Keys are collected from
 * RBAC.md §8–§33, §34, §60, §61, §63, §66, SECURITY_ARCHITECTURE.md §12, DATABASE_SCHEMA.md §11
 * and HOSPITAL_SYSTEM_MASTER_SPEC.md §24. Additions required by Phase 3 are marked below.
 *
 * Level:
 *   PLATFORM — platform administration; never grants access to tenant data.
 *   TENANT   — evaluated only inside the session's active tenant.
 *   ANY      — may be granted by platform or tenant roles.
 */
export type PermissionLevel = 'PLATFORM' | 'TENANT' | 'ANY';

export interface PermissionDefinition {
  key: string;
  module: string;
  level: PermissionLevel;
  description: string;
}

/** Modules that are always enabled. Module activation per hospital arrives in Phase 5. */
export const CORE_MODULES: ReadonlySet<string> = new Set([
  'platform',
  'system',
  'administration',
  'identity',
  'audit',
]);

const CATALOG: Record<string, { level: PermissionLevel; keys: readonly string[] }> = {
  platform: {
    level: 'PLATFORM',
    keys: [
      'tenant.create',
      'tenant.read',
      'tenant.update',
      'tenant.suspend',
      'tenant.admin.create', // Phase 3: create a hospital's first administrator
      'tenant.membership.manage', // Phase 3: grant memberships in additional hospitals
      'platform.settings.read',
      'platform.settings.update',
      'platform.audit.read', // Phase 3: platform-level audit log (tenant_id NULL)
      'platform.user.manage', // Phase 3: global user status/password for multi-hospital users
      'system.monitor',
      'deployment.read',
      'sync.monitor',
      'support.access',
    ],
  },
  system: { level: 'ANY', keys: ['system.health.read'] },
  administration: {
    level: 'TENANT',
    keys: [
      'hospital.read',
      'hospital.update',
      'department.read',
      'department.create',
      'department.update',
      'department.disable',
      'department.staff.read',
      'department.schedule.read',
      'department.schedule.manage',
      'department.reports.read',
      'department.queue.read',
      'department.activity.read',
      'module.read',
      'module.enable',
      'module.disable',
      'system.read',
      'system.configure',
      'auth.configure',
      'backup.read',
      'backup.verify',
    ],
  },
  identity: {
    level: 'TENANT',
    keys: [
      'user.read',
      'user.create',
      'user.update',
      'user.disable',
      'user.password_reset', // Phase 3: admin-initiated password reset (P3-D8)
      'role.read',
      'role.create',
      'role.update',
      'role.assign',
      'permission.read',
    ],
  },
  audit: { level: 'TENANT', keys: ['audit.read'] },
  sync: {
    level: 'TENANT',
    keys: ['sync.read', 'sync.write', 'sync.acknowledge', 'sync.retry', 'sync.resolve'],
  },
  patients: {
    level: 'TENANT',
    keys: [
      'patient.read',
      'patient.read_basic',
      'patient.read_limited',
      'patient.create',
      'patient.update',
      'patient.update_limited',
      'patient.update_demographics',
      'patient.delete',
      'patient.merge',
      'patient.export',
      'patient.print',
      'patient_document.read',
      'patient_document.create',
      'patient_merge.request',
      'patient_merge.execute',
      'duplicate_detection.read',
      'medical_record.read',
      'medical_record.create',
      'medical_record.update',
    ],
  },
  appointments: {
    level: 'TENANT',
    keys: [
      'appointment.read',
      'appointment.create',
      'appointment.update',
      'appointment.cancel',
      'queue.read',
      'queue.create',
      'queue.update',
      'checkin.create',
      'checkout.basic',
    ],
  },
  clinical: {
    level: 'TENANT',
    keys: [
      'encounter.read',
      'encounter.create',
      'encounter.update',
      'encounter.complete',
      'clinical_note.create',
      'clinical_note.update',
      'diagnosis.create',
      'diagnosis.update',
      'prescription.read',
      'prescription.create',
      'prescription.cancel',
      'prescription.review',
      'prescription.print',
      'procedure.create',
      'procedure.update',
      'allergy.read',
      'allergy.create',
      'allergy.update',
      'vitals.read',
      'vitals.create',
    ],
  },
  nursing: {
    level: 'TENANT',
    keys: [
      'admission.read',
      'ward.read',
      'bed.read',
      'nursing.read_all',
      'nursing_note.create',
      'nursing_note.update',
      'nursing.assignment.create',
      'nursing.assignment.update',
      'nursing_reports.read',
      'medication_administration.read',
      'medication_administration.create',
      'care_plan.read',
      'care_plan.create',
      'care_plan.update',
      'task.read',
      'task.update',
      'staff_schedule.read',
      'staff_schedule.manage',
      'shift_handover.read',
      'shift_handover.manage',
    ],
  },
  laboratory: {
    level: 'TENANT',
    keys: [
      'lab.order.read',
      'lab.order.create',
      'lab.sample.create',
      'lab.sample.update',
      'lab.processing.read',
      'lab.processing.update',
      'lab.result.read',
      'lab.result.create',
      'lab.result.update',
      'lab.result.write',
      'lab.result.review',
      'lab.result.approve',
      'lab.result.correct',
      'lab.reports.read',
      'lab.settings.manage',
      'lab_report.print',
    ],
  },
  radiology: {
    level: 'TENANT',
    keys: [
      'radiology.order.read',
      'radiology.order.create',
      'radiology.schedule.read',
      'radiology.study.read',
      'radiology.study.create',
      'radiology.study.update',
      'radiology.patient_prepare',
      'radiology.report.read',
      'radiology.report.create',
      'radiology.report.update',
      'radiology.report.approve',
      'radiology_report.print',
    ],
  },
  pharmacy: {
    level: 'TENANT',
    keys: [
      'pharmacy.dispense',
      'dispensing.create',
      'dispensing.update',
      'dispensing.cancel',
      'pharmacy.stock.read',
      'pharmacy.stock.adjust_request',
      'pharmacy.stock.manage',
      'pharmacy.reports.read',
      'pharmacy.settings.manage',
      'medication.read',
      'medication.create',
      'medication.update',
    ],
  },
  surgery: {
    level: 'TENANT',
    keys: [
      'surgery.request.create',
      'surgery.schedule.read',
      'surgical_record.create',
      'surgical_record.update',
      'preoperative_assessment.read',
      'postoperative_record.read',
      'postoperative_record.create',
      'anesthesia_record.create',
      'anesthesia_record.update',
    ],
  },
  blood_bank: {
    level: 'TENANT',
    keys: [
      'blood_inventory.read',
      'blood_unit.create',
      'blood_unit.update',
      'blood_request.read',
      'blood_request.process',
      'compatibility_test.create',
      'compatibility_test.update',
      'transfusion.read',
      'transfusion.record',
    ],
  },
  inventory: {
    level: 'TENANT',
    keys: [
      'inventory.read',
      'inventory.item.create',
      'inventory.item.update',
      'warehouse.read',
      'warehouse.manage',
      'stock.read',
      'stock.transfer',
      'stock.receipt',
      'stock.adjust',
      'stock.adjust.request',
      'stock.report.read',
    ],
  },
  procurement: {
    level: 'TENANT',
    keys: [
      'supplier.read',
      'supplier.create',
      'supplier.update',
      'purchase_request.read',
      'purchase_request.create',
      'purchase_order.read',
      'purchase_order.create',
      'purchase_order.update',
      'goods_receipt.read',
      'goods_receipt.create',
    ],
  },
  finance: {
    level: 'TENANT',
    keys: [
      'service.read',
      'price.read',
      'invoice.read',
      'invoice.read_all',
      'invoice.create',
      'invoice.update',
      'invoice.update_limited',
      'invoice.manage',
      'invoice.print',
      'payment.read',
      'payment.read_all',
      'payment.create',
      'payment.manage',
      'payment.refund',
      'refund.request',
      'refund.create',
      'refund.approve',
      'financial_reports.read',
      'financial_reports.export',
      'financial.export',
      'finance.settings.manage',
    ],
  },
  insurance: {
    level: 'TENANT',
    keys: [
      'insurance_provider.read',
      'insurance_provider.manage',
      'insurance_policy.read',
      'insurance_policy.create',
      'insurance_policy.update',
      'eligibility.check',
      'claim.read',
      'claim.create',
      'claim.update',
      'claim.submit',
      'claim.status.update',
    ],
  },
  hr: {
    level: 'TENANT',
    keys: [
      'employee.read',
      'employee.create',
      'employee.update',
      'employment.read',
      'employment.manage',
      'attendance.read',
      'attendance.manage',
      'leave.read',
      'leave.manage',
      'hr_reports.read',
    ],
  },
  reports: {
    level: 'TENANT',
    keys: ['reports.read', 'reports.generate', 'reports.export', 'report.export', 'dashboards.read'],
  },
};

export const PERMISSION_KEY_PATTERN = /^[a-z][a-z_]*(\.[a-z][a-z_]*)+$/;

function describe(key: string): string {
  const parts = key.split('.');
  const action = parts.pop() ?? key;
  return `${action.replace(/_/g, ' ')}: ${parts.join(' ').replace(/_/g, ' ')}`;
}

export const PERMISSIONS: readonly PermissionDefinition[] = Object.entries(CATALOG).flatMap(
  ([module, { level, keys }]) => keys.map((key) => ({ key, module, level, description: describe(key) })),
);

export const PERMISSIONS_BY_KEY: ReadonlyMap<string, PermissionDefinition> = new Map(
  PERMISSIONS.map((permission) => [permission.key, permission]),
);

export function isKnownPermission(key: string): boolean {
  return PERMISSIONS_BY_KEY.has(key);
}
