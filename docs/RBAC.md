HOSPITAL MANAGEMENT SYSTEM
Roles, Permissions & Access Control Specification
Document: RBAC.mdVersion: 1.0Status: Security & Authorization ArchitectureRelated Documents:
HOSPITAL_SYSTEM_MASTER_SPEC.md
DATABASE_SCHEMA.md
MODULES.md
1. Purpose
This document defines the authorization architecture for the Hospital Management System.
The system handles:
Medical records
Patient information
Laboratory results
Radiology reports
Prescriptions
Medication administration
Inventory
Financial information
Insurance information
Employee information
System administration
Therefore, access control must be a core architectural component.
The authorization system must determine:
Who can access the system.
Which hospital they belong to.
Which departments they can access.
Which modules they can use.
Which records they can see.
Which actions they can perform.
Which actions require additional authorization.
Which actions must be audited.
2. Core Authorization Principle
The system must use:
Authentication
+
Tenant Isolation
+
RBAC
+
Permissions
+
Contextual Access Control
+
Audit Logging
Authentication answers:
Who are you?
Authorization answers:
What are you allowed to do?
Tenant isolation answers:
Which hospital's data are you allowed to access?
Permissions answer:
What operation can you perform?
3. Never Trust the Frontend
Hiding a button is NOT security.
Incorrect:
if user.role === "DOCTOR":
show Edit button
This only controls the UI.
A malicious user could still call the API directly.
Correct architecture:
Frontend
↓
API Request
↓
Authentication
↓
Tenant Validation
↓
Permission Check
↓
Resource Access Check
↓
Business Logic
↓
Database
The backend must enforce every sensitive permission.
4. Multi-Tenant Authorization
Every authenticated user belongs to a hospital tenant unless they are a platform-level administrator.
Example:
Hospital A
├── Doctor A
├── Nurse A
└── Receptionist A
Hospital B
├── Doctor B
├── Nurse B
└── Receptionist B
Doctor A must never access Hospital B data.
Even if Doctor A manually changes:
hospital_id=HospitalB
in an API request, the server must reject the request.
The server must derive tenant context from the authenticated identity and authorized session.
5. Authorization Layers
Access control should operate at multiple levels.
Level 1 → Platform
Level 2 → Hospital / Tenant
Level 3 → Module
Level 4 → Department
Level 5 → Resource
Level 6 → Action
Example:
Doctor
↓
Hospital A
↓
Clinical Module
↓
Cardiology Department
↓
Patient Record
↓
READ / CREATE / UPDATE
6. Role-Based Access Control
The system uses RBAC as the primary authorization model.
A user receives one or more roles.
A role contains permissions.
Example:
User
↓
Role
↓
Permissions
Example:
Dr. Ahmed
↓
DOCTOR
↓
patient.read
encounter.read
encounter.create
diagnosis.create
prescription.create
lab.order.create
radiology.order.create
7. Roles
Initial system roles:
SUPER_ADMIN
HOSPITAL_ADMIN
IT_ADMIN
DOCTOR
NURSE
RECEPTIONIST
LAB_TECHNICIAN
LAB_SUPERVISOR
RADIOLOGY_TECHNICIAN
RADIOLOGIST
PHARMACIST
PHARMACY_MANAGER
SURGEON
ANESTHESIOLOGIST
BLOOD_BANK_TECHNICIAN
INVENTORY_OFFICER
PROCUREMENT_OFFICER
ACCOUNTANT
FINANCE_MANAGER
INSURANCE_OFFICER
HR_OFFICER
MEDICAL_RECORDS_OFFICER
DEPARTMENT_MANAGER
NURSE_MANAGER
REPORTING_OFFICER
Hospitals may create custom roles later.
8. SUPER_ADMIN
Scope
Platform-level administration.
A Super Admin manages the software platform itself rather than normal hospital clinical operations.
Potential permissions:
tenant.create
tenant.read
tenant.update
tenant.suspend
platform.settings.read
platform.settings.update
system.monitor
system.health.read
deployment.read
sync.monitor
support.access
Super Admin should not automatically have unrestricted access to patient clinical records.
Access to sensitive hospital data must be explicitly controlled and audited.
9. HOSPITAL_ADMIN
Scope
Hospital-level administration.
Responsibilities may include:
Hospital settings
Departments
Users
Roles
Module configuration
Operational reports
Hospital-wide administration
Permissions:
hospital.read
hospital.update
department.read
department.create
department.update
department.disable
user.read
user.create
user.update
user.disable
role.read
role.create
role.update
role.assign
permission.read
module.read
module.enable
module.disable
audit.read
reports.read
Hospital administrators must not automatically have unrestricted clinical editing permissions.
10. IT_ADMIN
Scope
Technical administration.
May manage:
Users
Authentication
System configuration
Infrastructure
Monitoring
Synchronization
Backups
Technical logs
Example permissions:
system.read
system.configure
user.read
user.create
user.update
user.disable
auth.configure
sync.read
sync.retry
sync.resolve
backup.read
backup.verify
system.health.read
audit.read
IT administrators should not automatically have permission to modify clinical records.
11. DOCTOR
Scope
Clinical care.
Primary access:
Patients
Appointments
Clinical Encounters
Medical History
Diagnoses
Clinical Notes
Prescriptions
Laboratory Orders
Radiology Orders
Procedures
Follow-up
Typical permissions:
patient.read
patient.update_limited
appointment.read
appointment.update
encounter.read
encounter.create
encounter.update
encounter.complete
clinical_note.create
clinical_note.update
diagnosis.create
diagnosis.update
prescription.create
prescription.cancel
lab.order.create
lab.result.read
radiology.order.create
radiology.report.read
procedure.create
allergy.read
allergy.create
allergy.update
vitals.read
A doctor should not automatically be allowed to:
Modify approved laboratory results.
Modify financial transactions.
Change user permissions.
Access unrestricted HR data.
Modify pharmacy stock.
12. Doctor Patient Access
The system should support contextual access.
A doctor may be allowed to access:
Patients assigned to them.
Patients in their department.
Patients involved in an active encounter.
Hospital policy may allow broader access for certain authorized doctors.
The exact access policy should be configurable.
13. NURSE
Scope
Patient care and nursing workflows.
Typical permissions:
patient.read
encounter.read
admission.read
ward.read
bed.read
nursing_note.create
nursing_note.update
vitals.create
vitals.read
medication_administration.create
medication_administration.read
care_plan.read
care_plan.create
care_plan.update
task.read
task.update
Nurses should not normally:
Create diagnoses as physicians.
Approve laboratory results.
Modify prescriptions.
Change billing.
Manage system permissions.
14. NURSE_MANAGER
Scope
Nursing department management.
Additional permissions:
nursing.read_all
nursing.assignment.create
nursing.assignment.update
nursing_reports.read
staff_schedule.read
staff_schedule.manage
shift_handover.read
shift_handover.manage
Access must remain limited to authorized nursing information.
15. RECEPTIONIST
Scope
Front desk operations.
Typical permissions:
patient.read_basic
patient.create
patient.update_demographics
appointment.read
appointment.create
appointment.update
appointment.cancel
queue.create
queue.read
queue.update
checkin.create
checkout.basic
Receptionists should not have unrestricted access to clinical notes.
They may see the minimum necessary information required to perform their work.
16. MEDICAL_RECORDS_OFFICER
Scope
Medical records administration.
Potential permissions:
patient.read
patient.update_demographics
patient_document.read
patient_document.create
medical_record.read
duplicate_detection.read
patient_merge.request
patient_merge.execute
Patient merge operations should require strong authorization and audit logging.
17. LAB_TECHNICIAN
Scope
Laboratory operations.
Permissions:
lab.order.read
lab.sample.create
lab.sample.update
lab.processing.read
lab.processing.update
lab.result.create
lab.result.update
lab.result.read
A technician should not automatically approve their own critical results if hospital policy requires independent review.
18. LAB_SUPERVISOR
Additional permissions:
lab.result.review
lab.result.approve
lab.result.correct
lab.reports.read
lab.settings.manage
Approved-result corrections must be fully audited.
19. RADIOLOGY_TECHNICIAN
Permissions may include:
radiology.order.read
radiology.schedule.read
radiology.study.create
radiology.study.update
radiology.patient_prepare
Technicians should not automatically approve radiology interpretations.
20. RADIOLOGIST
Permissions:
radiology.order.read
radiology.study.read
radiology.study.update
radiology.report.create
radiology.report.update
radiology.report.approve
radiology.report.read
Approved reports must use controlled correction workflows.
21. PHARMACIST
Permissions:
patient.read_limited
prescription.read
prescription.review
dispensing.create
dispensing.update
dispensing.cancel
pharmacy.stock.read
pharmacy.stock.adjust_request
medication.read
A pharmacist should not modify a doctor's prescription directly.
If clarification is required, use an appropriate workflow.
22. PHARMACY_MANAGER
Additional permissions:
pharmacy.stock.read
pharmacy.stock.manage
stock.adjust
stock.transfer
medication.create
medication.update
pharmacy.reports.read
pharmacy.settings.manage
Stock adjustments must be audited.
23. SURGEON
The surgeon is a specialized clinical role.
Permissions may include:
encounter.read
procedure.create
procedure.update
surgery.request.create
surgery.schedule.read
surgical_record.create
surgical_record.update
postoperative_record.create
The role inherits appropriate clinical permissions.
24. ANESTHESIOLOGIST
Permissions may include:
patient.read
encounter.read
anesthesia_record.create
anesthesia_record.update
preoperative_assessment.read
postoperative_record.read
Access should be limited to patients relevant to the anesthesiology workflow.
25. BLOOD_BANK_TECHNICIAN
Permissions:
blood_inventory.read
blood_unit.create
blood_unit.update
blood_request.read
blood_request.process
compatibility_test.create
compatibility_test.update
transfusion.read
transfusion.record
Blood-unit traceability must be mandatory.
26. INVENTORY_OFFICER
Permissions:
inventory.read
inventory.item.create
inventory.item.update
warehouse.read
warehouse.manage
stock.read
stock.transfer
stock.receipt
stock.adjust.request
stock.report.read
Important stock adjustments must require authorization.
27. PROCUREMENT_OFFICER
Permissions:
supplier.read
supplier.create
supplier.update
purchase_request.read
purchase_request.create
purchase_order.read
purchase_order.create
purchase_order.update
goods_receipt.read
goods_receipt.create
Approval authority should be separated where appropriate.
28. ACCOUNTANT
For hospitals where Finance is enabled.
Permissions:
service.read
price.read
invoice.read
invoice.create
invoice.update_limited
payment.read
payment.create
refund.request
financial_reports.read
Accountants should not modify clinical records.
29. FINANCE_MANAGER
Additional permissions:
invoice.read_all
invoice.manage
payment.read_all
payment.manage
refund.approve
financial_reports.read
financial_reports.export
finance.settings.manage
Financial corrections must be auditable.
30. INSURANCE_OFFICER
Permissions:
insurance_provider.read
insurance_provider.manage
insurance_policy.read
insurance_policy.create
insurance_policy.update
eligibility.check
claim.create
claim.update
claim.submit
claim.read
claim.status.update
Insurance users should access only the clinical information required for claim processing.
31. HR_OFFICER
Permissions:
employee.read
employee.create
employee.update
employment.read
employment.manage
attendance.read
attendance.manage
leave.read
leave.manage
hr_reports.read
HR users should not automatically access patient clinical records.
32. DEPARTMENT_MANAGER
Department managers require access to operational information within their department.
Examples:
department.read
department.staff.read
department.schedule.read
department.schedule.manage
department.reports.read
department.queue.read
department.activity.read
The manager's exact permissions depend on the department.
A laboratory manager and an emergency manager may have different capabilities.
33. REPORTING_OFFICER
Permissions:
reports.read
reports.generate
reports.export
dashboards.read
Sensitive reports must be permission-controlled.
Exporting patient-level data should require additional authorization.
34. Permission Naming Convention
Permissions must use a predictable naming structure.
Recommended:
<resource>.<action>
Examples:
patient.read
patient.create
patient.update
appointment.read
appointment.create
encounter.read
encounter.create
encounter.update
lab.result.read
lab.result.create
lab.result.approve
invoice.read
invoice.create
invoice.update
user.read
user.create
user.update
For more complex operations:
patient.merge
patient.export
lab.result.correct
payment.refund
stock.adjust
sync.retry
sync.resolve
35. Standard Actions
The system should support common actions:
read
create
update
delete
approve
reject
cancel
complete
assign
export
print
manage
Not every resource needs every action.
Avoid giving users unnecessary permissions.
36. Delete Permissions
Delete should be treated as a high-risk operation.
For important medical and financial records, the system should often use:
void
cancel
correct
archive
instead of physical deletion.
Example:
Prescription
should generally be:
CANCELLED
rather than deleted.
37. Approval Permissions
Some actions require separation of duties.
Examples:
Lab Technician
↓
Enter Result
Lab Supervisor
↓
Approve Result
Another example:
Accountant
↓
Create Refund Request
Finance Manager
↓
Approve Refund
This prevents a single user from controlling every step of sensitive workflows.
38. Separation of Duties
The system should support configurable separation of duties.
Examples:
Create Purchase Order
≠
Approve Purchase Order
Enter Lab Result
≠
Approve Lab Result
Create Refund
≠
Approve Refund
Create User
≠
Grant Super Admin
Hospitals should be able to configure these rules.
39. Department-Based Access
Roles alone may not be enough.
Example:
Doctor
+
Cardiology Department
The doctor may have access to cardiology workflows.
Another doctor:
Doctor
+
Pediatrics Department
may have different contextual access.
The system should support department assignment.
40. Resource-Level Access
Certain resources require contextual restrictions.
Example:
A doctor may access:
Patient involved in active encounter
but may not automatically access every patient record in the hospital.
A nurse may access:
Patients assigned to their ward
This must be configurable according to hospital policy.
41. Break-Glass Access
The system should support controlled emergency access.
Example:
A doctor needs to access a patient record outside their normal assignment during an emergency.
The system may allow:
Emergency Access
↓
Reason Required
↓
Temporary Access
↓
Audit Log
Break-glass access must:
Require a reason.
Be audited.
Be visible to authorized administrators.
Follow hospital policy.
Not silently bypass authorization.
42. Sensitive Data Permissions
Some information should have additional access restrictions.
Examples:
Psychological / mental health records
Sensitive clinical notes
Financial records
HR records
Insurance records
Administrative investigations
The exact classification must be configurable according to the hospital's policies and applicable law.
43. Patient-Level Privacy
The system should support restrictions at the patient level where necessary.
Potential use cases:
VIP / restricted patient
Sensitive case
Legal restriction
Confidential record
Access may require additional authorization.
Every such access must be audited.
44. API Authorization
Every protected API endpoint must enforce authorization.
Example:
GET /patients/:id
must validate:
Authenticated?
↓
Correct Tenant?
↓
Has patient.read?
↓
Allowed to access this patient?
↓
Return data
It must not simply check whether the user is logged in.
45. Backend Authorization Architecture
Recommended conceptual architecture:
Request
↓
Authentication Guard
↓
Tenant Resolver
↓
Permission Guard
↓
Resource Access Policy
↓
Business Service
↓
Database
Authorization logic should be centralized and reusable.
Avoid copying authorization logic into dozens of controllers.
46. Frontend Authorization
The frontend should use permissions to:
Hide unauthorized navigation.
Hide unauthorized actions.
Disable unavailable controls.
Prevent confusing workflows.
However:
Frontend authorization is for user experience. Backend authorization is for security.
Both are required.
47. Navigation Permissions
The sidebar should dynamically display available modules.
Example:
Doctor
├── Dashboard
├── Patients
├── Appointments
├── Clinical
├── Laboratory
├── Radiology
└── Prescriptions
An accountant may see:
Dashboard
Patients (limited)
Billing
Payments
Insurance
Reports
A pharmacist may see:
Dashboard
Patients (limited)
Pharmacy
Inventory
Prescriptions
Reports
48. Module Permissions
A module can have:
Enabled
Disabled
at the hospital level.
But the user's role must also have permissions.
Therefore:
Hospital Module Enabled
AND
User Has Permission
AND
Resource Access Allowed
must all be satisfied.
49. Permission Evaluation
Conceptually:
CanUserPerformAction(
user,
tenant,
resource,
action,
context
)
must evaluate:
User Active?
↓
Correct Tenant?
↓
Role Active?
↓
Permission Exists?
↓
Module Enabled?
↓
Department Allowed?
↓
Resource Allowed?
↓
Special Restrictions?
↓
ALLOW / DENY
50. Permission Denial
When access is denied:
The system should return an appropriate authorization error.
Do not expose sensitive information about why another resource exists.
For example, an unauthorized user searching for a patient should not necessarily receive:
Patient exists but you are not allowed to see it.
when that itself could reveal sensitive information.
The exact API behavior should depend on the resource and security requirements.
51. Audit of Authorization
Important authorization events should be logged.
Examples:
Permission denied
Role assigned
Role removed
Permission changed
User activated
User disabled
Break-glass access
Sensitive record access
Export performed
52. Role Management
Hospital administrators may create custom roles.
Example:
Role:
Emergency Supervisor
Permissions:
patient.read
emergency.read
emergency.manage
reports.read
Custom roles must not be allowed to exceed the administrator's own authority.
A hospital administrator should not be able to grant permissions beyond the permissions they are authorized to manage.
53. Permission Hierarchy
Avoid automatically assuming:
update > read
or:
admin > all permissions
Permissions should be explicitly defined.
A user should only receive permissions that are actually assigned.
54. Temporary Permissions
The system may support temporary permissions.
Example:
User
↓
Temporary Role
↓
Start Date
↓
End Date
Useful for:
Temporary department assignments
Staff rotations
Emergency coverage
Training
Temporary administrative responsibilities
Temporary permissions must expire automatically.
55. Account Lifecycle
User lifecycle:
Created
↓
Pending
↓
Active
↓
Suspended
↓
Disabled
Possible states:
PENDING
ACTIVE
SUSPENDED
DISABLED
Disabled users must not authenticate.
56. Authentication Events
Authentication events should be logged separately from general audit where appropriate.
Examples:
Login
Logout
Failed Login
Password Reset
MFA Challenge
MFA Failure
Account Lock
Session Revoked
57. MFA
Multi-factor authentication should be available for sensitive accounts.
MFA should be strongly considered for:
Super Admin
Hospital Admin
IT Admin
Finance Manager
System Administrators
Hospitals may require MFA for all users.
58. Session Management
Sessions must support:
Expiration
Revocation
Logout
Idle timeout
Device/session visibility
Security invalidation
High-risk changes may require re-authentication.
59. Password Security
If passwords are managed by the application:
Never store plaintext passwords.
Use a strong password hashing algorithm.
Apply password policy.
Protect reset tokens.
Expire reset tokens.
Rate-limit authentication attempts.
If Keycloak or another identity provider is used, password management should be delegated to it.
60. Data Export Permissions
Exporting hospital data is a high-risk operation.
Examples:
patient.export
report.export
financial.export
Export permissions should be explicitly assigned.
Exports should be audited.
Where possible, exports should record:
Who
When
What
Why
Scope
Format
61. Printing Permissions
Printing may expose sensitive information.
Permissions may include:
patient.print
prescription.print
lab_report.print
radiology_report.print
invoice.print
Hospitals may configure printing permissions by role.
62. API Service Accounts
The system may require non-human accounts for:
PACS
Laboratory devices
External systems
Synchronization
Monitoring
Integrations
Service accounts must:
Have limited permissions.
Have no unnecessary interactive login.
Use secure credentials.
Be auditable.
Be revocable.
63. Medical Device Access
Medical devices must not automatically receive general application privileges.
Each integration should have:
Specific Device Identity
+
Specific API Permission
+
Specific Scope
Example:
Laboratory Analyzer
↓
lab.result.write
It should not receive:
patient.delete
user.manage
finance.read
64. Cloud and Local Authorization
The same authorization model must work in both environments:
Hospital Local Server
+
Cloud Server
Permissions must not become weaker during offline operation.
Local users must still be authenticated and authorized.
65. Offline Authorization
During Internet outages:
Internet = OFF
the hospital server must continue enforcing:
Authentication
Roles
Permissions
Tenant isolation
Department restrictions
Audit logging
The local system must not enter an unrestricted "offline admin" mode.
66. Synchronization Permissions
Synchronization services should have their own restricted privileges.
Example:
SYNC_SERVICE
may:
sync.read
sync.write
sync.acknowledge
sync.resolve
It should not automatically have:
user.manage
role.manage
clinical.approve
finance.manage
unless specifically required.
67. Authorization Matrix
The final implementation should maintain a matrix similar to:
Role
Patients
Clinical
Lab
Radiology
Pharmacy
Inventory
Finance
HR
Admin
Super Admin
Configurable
Configurable
Configurable
Configurable
Configurable
Configurable
Configurable
Configurable
Full platform
Hospital Admin
Manage
Limited
Limited
Limited
Limited
Manage
Configurable
Manage
Manage
Doctor
Clinical
Full clinical
Order/Read
Order/Read
Prescribe
No
Limited/None
No
No
Nurse
Care
Read
Read
Read
Administer
Limited
No
No
No
Receptionist
Basic
Limited
No
No
No
No
Limited
No
No
Lab Technician
Limited
Order context
Full lab
No
No
Lab stock
No
No
No
Radiologist
Clinical context
Clinical
No
Full radiology
No
No
No
No
No
Pharmacist
Limited
Prescription context
No
No
Full pharmacy
Pharmacy stock
No
No
No
Accountant
Limited
No
No
No
No
No
Full finance
No
No
HR Officer
No clinical
No
No
No
No
No
No
Full HR
No
Inventory Officer
Limited
No
Limited
No
Inventory
Full inventory
No
No
No
This table is conceptual.
The actual system must use granular permissions rather than broad module labels.
68. Permission Matrix Must Be Data-Driven
Do not hard-code permissions throughout the application.
Use a permission system such as:
User
Role
Permission
RolePermission
UserRole
Potentially:
UserDepartment
RolePermission
for contextual access.
69. Authorization Testing
Authorization must have dedicated tests.
Test cases should include:
Positive
Doctor can create diagnosis.
Doctor can create prescription.
Pharmacist can dispense.
Lab supervisor can approve result.
Negative
Receptionist cannot modify diagnosis.
Pharmacist cannot approve lab result.
Accountant cannot modify clinical notes.
Nurse cannot change user roles.
Tenant Isolation
Hospital A user cannot access Hospital B patient.
API Bypass
Test direct API requests without relying on the UI.
70. Security Test Principle
Every important permission should have at least:
Allowed Test
+
Denied Test
Example:
lab.result.approve
Allowed:
Lab Supervisor
Denied:
Lab Technician
Doctor
Receptionist
Accountant
unless hospital configuration explicitly changes the policy.
71. Permission Changes
Changes to roles and permissions must be audited.
Example:
Admin
↓
Adds permission:
finance.refund.approve
↓
User:
Ahmed
↓
Role:
Finance Manager
Audit event:
Role Permission Added
with:
actor
target role
permission
timestamp
tenant
72. Principle of Least Privilege
Users should receive only the permissions necessary to perform their job.
Do not solve authorization by giving everyone:
admin.*
or:
*
The system should start restrictive and add permissions intentionally.
73. Default Deny
The authorization system must follow:
No Permission
↓
DENY
Access should not be granted simply because an endpoint was forgotten during permission configuration.
74. Emergency Access Does Not Mean Unlimited Access
Emergency workflows may require broader access, but this must still be:
Controlled
+
Time-aware where appropriate
+
Reason-based
+
Audited
Emergency access should never become a permanent bypass.
75. Final Authorization Architecture
The complete access model is:
USER
│
▼
AUTHENTICATION
│
▼
USER ACCOUNT
│
▼
ROLE
│
▼
PERMISSIONS
│
┌─────────┴─────────┐
▼                   ▼
TENANT             DEPARTMENT
│                   │
└─────────┬─────────┘
▼
RESOURCE ACCESS
│
▼
ACTION
│
┌──────┴──────┐
▼             ▼
ALLOW          DENY
│
▼
AUDIT
76. Final Authorization Principle
The system must answer five questions before allowing a sensitive action:
1. Who is the user?
2. Which hospital do they belong to?
3. What role/permissions do they have?
4. Are they allowed to access this specific resource?
5. Are they allowed to perform this specific action?
If any required authorization condition fails:
DENY
77. Instruction to Cursor
Before implementing authorization:
Read HOSPITAL_SYSTEM_MASTER_SPEC.md.
Read DATABASE_SCHEMA.md.
Read MODULES.md.
Create the complete permission catalog.
Create the role catalog.
Create role-permission relationships.
Implement tenant isolation.
Implement backend authorization guards/policies.
Implement frontend permission-aware navigation.
Implement department/resource-level restrictions where required.
Implement audit logging for authorization changes.
Implement negative authorization tests.
Test direct API access.
Test cross-tenant access.
Test offline authorization.
Never rely on frontend restrictions for security.
Cursor must treat authorization as a foundational security layer, not as a UI feature.
78. Final Security Rule
The following rule must always apply:
HIDDEN IN UI
≠
SECURE
BACKEND AUTHORIZATION
+
TENANT ISOLATION
+
RESOURCE ACCESS CONTROL
+
AUDIT LOGGING
=
SECURE AUTHORIZATION ARCHITECTURE
No module should be considered production-ready until its authorization behavior has been tested.
