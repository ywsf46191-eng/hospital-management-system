# Hospital Management System
## Roles & Permissions Matrix
**Document:** `docs/ROLES_PERMISSIONS_MATRIX.md`
**Version:** 1.0
**Status:** Authoritative Specification
**Audience:** Product Owner, Architects, Developers, Security Engineers, QA, Cursor
---
# 1. Purpose
This document defines the authorization model for the Hospital Management System.
The system MUST implement authorization at multiple layers:
1. Authentication
2. Tenant/Hospital isolation
3. Role-based access control (RBAC)
4. Permission-based authorization
5. Department/scope restrictions
6. Record-level restrictions where required
7. Audit logging
A user being authenticated does NOT automatically mean that the user can access a resource.
---
# 2. Authorization Principles
The system MUST follow:
* Least privilege
* Deny by default
* Explicit permissions
* Hospital/tenant isolation
* Department scope
* Role separation
* Sensitive-data protection
* Auditability
* No authorization based only on frontend visibility
* Backend authorization is mandatory
* UI permissions are only a usability layer
Frontend hiding a button is NOT security.
Every protected API endpoint MUST verify authorization on the backend.
---
# 3. Multi-Tenant Authorization
Every authenticated user belongs to one or more hospital contexts according to system configuration.
A request MUST contain a resolved tenant/hospital context.
The backend MUST verify:
```text
Authenticated User
↓
Hospital/Tenant
↓
Role
↓
Permission
↓
Department Scope
↓
Resource Scope
↓
Action
```
A user from Hospital A MUST NEVER access Hospital B data unless explicitly authorized through a supported cross-tenant administrative mechanism.
Cross-tenant access MUST be extremely restricted and audited.
---
# 4. Permission Naming Convention
**Superseded (ADP-006 / P3-D5):** permissions use `<resource>.<action>` with `read`, as defined in
`RBAC.md` §34 (e.g. `patient.read`, `lab.result.approve`). The `<module>.<resource>.<action>` /
`view` examples below are kept for history only; the code-defined permission registry is
authoritative.
Original proposal:
```text
<module>.<resource>.<action>
```
Examples:
```text
patients.patient.view
patients.patient.create
patients.patient.update
patients.patient.merge
appointments.appointment.view
appointments.appointment.create
appointments.appointment.cancel
clinical.encounter.view
clinical.encounter.create
clinical.encounter.update
clinical.encounter.sign
lab.order.create
lab.result.view
lab.result.enter
lab.result.approve
pharmacy.dispense.create
finance.invoice.view
finance.invoice.create
finance.payment.create
reports.report.view
reports.report.export
```
---
# 5. Standard Actions
Supported actions should include:
```text
view
create
update
delete
approve
reject
cancel
sign
print
export
dispense
administer
schedule
assign
transfer
close
reopen
merge
void
refund
submit
review
verify
```
Not every resource needs every action.
---
# 6. Core System Roles
The platform should support configurable roles.
Recommended default roles:
### Platform Level
* Platform Super Admin
* Platform Support
* Platform Auditor
### Hospital Administration
* Hospital Administrator
* Hospital Manager
* Department Manager
* IT Administrator
* Security/Audit Officer
### Clinical
* Physician
* Specialist Physician
* Resident
* Nurse
* Head Nurse
* Emergency Physician
* Surgeon
* Anesthesiologist
* Radiologist
* Laboratory Specialist
* Pharmacist
* Blood Bank Specialist
* Dietitian
### Front Office
* Receptionist
* Appointment Officer
* Registration Officer
* Call Center Officer
### Finance
* Accountant
* Cashier
* Billing Officer
* Finance Manager
### Insurance
* Insurance Officer
* Insurance Manager
### Supply Chain
* Storekeeper
* Procurement Officer
* Procurement Manager
### HR
* HR Officer
* HR Manager
### Reporting
* Data Analyst
* Reporting Officer
---
# 7. Platform Super Admin
This role is platform-level.
Capabilities may include:
* Manage hospitals
* Create hospitals
* Activate/deactivate modules
* Configure system-level settings
* Manage platform users
* Manage integrations
* Manage deployment configuration
* View platform health
* View synchronization health
* View system audit logs
This role MUST NOT automatically provide unrestricted access to clinical records.
Clinical data access should require an explicit audited permission.
---
# 8. Hospital Administrator
Can manage:
* Hospital settings
* Departments
* Hospital users
* Hospital roles
* Permissions
* Module activation
* Workflows
* Appointment configuration
* Queues
* Wards
* Rooms
* Beds
* Price lists
* Hospital documents
* Notification settings
* Operational reports
Cannot automatically modify signed clinical records.
---
# 9. Physician
Typical permissions:
### Patient
* Search patient
* View patient profile
* View authorized clinical history
* View allergies
* View medications
### Clinical
* Create encounter
* View encounter
* Update own active encounter
* Create clinical notes
* Create diagnoses
* Create orders
* Create prescriptions
* Create referrals
* Create follow-up plans
* Sign clinical encounter
### Restrictions
Physician MUST NOT:
* Modify financial payments
* Modify inventory quantities directly
* Approve laboratory results unless assigned appropriate lab role
* Approve radiology reports unless assigned radiologist role
* Modify another physician's signed clinical record without a controlled correction workflow
---
# 10. Nurse
Typical permissions:
* View assigned patients
* View clinical orders
* Record vital signs
* Create nursing notes
* Create nursing tasks
* Record medication administration
* View allergies
* View care plans
* Record admission-related nursing information
* Perform patient handover
Nurses should only access patients within their authorized department/ward unless broader permission exists.
---
# 11. Receptionist
Typical permissions:
* Search patients
* Register patients
* Update demographic information
* Create appointments
* Reschedule appointments
* Check-in patients
* Manage queues
* Print registration documents
Receptionists should NOT access detailed clinical notes unless explicitly authorized.
---
# 12. Laboratory Specialist
Permissions:
```text
lab.order.view
lab.sample.create
lab.sample.update
lab.result.enter
lab.result.update
lab.result.review
lab.result.approve
lab.result.print
```
Laboratory users can access laboratory data necessary for their workflow.
Approved results MUST be protected from silent modification.
Corrections require an auditable correction workflow.
---
# 13. Radiologist
Permissions include:
* View radiology orders
* View assigned studies
* Access DICOM/PACS studies
* Create radiology report
* Update draft report
* Sign report
* Approve report
* Print report
A radiologist should not modify pharmacy, finance, or inventory data.
---
# 14. Pharmacist
Permissions include:
* View prescriptions
* Validate prescriptions
* Check medication availability
* Dispense medication
* Record dispensing
* View pharmacy stock
* Record stock-related pharmacy movements
* Print dispensing documents
Medication dispensing MUST create appropriate inventory/stock movement records.
---
# 15. Finance Roles
## Accountant
Can:
* View invoices
* Create invoices
* Review financial transactions
* Manage expenses
* Generate financial reports
## Cashier
Can:
* View payable invoices
* Receive payments
* Print receipts
* Process authorized refunds
Cashier should not have unrestricted accounting configuration permissions.
## Finance Manager
Can:
* Approve financial operations
* Review reports
* Manage financial settings
* Review refunds
* Review expenses
* Approve selected transactions
---
# 16. Insurance Officer
Can:
* Manage insurance policies
* Verify eligibility
* Prepare claims
* Submit claims
* Track claim status
* View authorized billing information
Should not modify clinical diagnoses.
---
# 17. Inventory Roles
## Storekeeper
Can:
* View stock
* Receive goods
* Issue stock
* Transfer stock
* Record stock movements
* Manage batches
* Perform stock counts
## Procurement Officer
Can:
* Create purchase requests
* Create purchase orders
* Manage suppliers
* Track deliveries
* Review procurement documents
Procurement approval should be separated from procurement creation where required.
---
# 18. HR Roles
HR users can manage:
* Employee profiles
* Employment records
* Attendance
* Leave
* HR documents
* Payroll information where authorized
HR users should not automatically access patient clinical information.
---
# 19. Auditor
Auditors may have read-only access to:
* Audit logs
* User activity
* Security events
* Financial audit records
* Clinical audit trails
* Synchronization events
* Configuration changes
Auditors MUST NOT modify audited records.
---
# 20. Permission Scope
Permissions may have scope:
```text
GLOBAL
HOSPITAL
DEPARTMENT
WARD
ASSIGNED_PATIENT
OWN_RECORD
```
Example:
A nurse may have:
```text
patients.patient.view = DEPARTMENT
```
while a hospital administrator may have:
```text
patients.patient.view = HOSPITAL
```
---
# 21. Sensitive Data
Sensitive data includes:
* Clinical notes
* Diagnoses
* Laboratory results
* Radiology studies
* Medication records
* Mental/behavioral health records where applicable
* Financial records
* Insurance records
* Identity documents
Access must be logged where appropriate.
---
# 22. Record Modification Rules
Important records should have lifecycle states.
Example:
```text
DRAFT
↓
SUBMITTED
↓
REVIEWED
↓
APPROVED
↓
SIGNED
```
After signing:
```text
SIGNED
```
does NOT mean immutable forever.
Instead, modification requires:
```text
Correction Request
↓
Authorization
↓
New Version
↓
Audit Log
```
The original value must remain traceable.
---
# 23. Emergency Access
The system may support controlled:
```text
BREAK_GLASS
```
access.
Requirements:
* User must have permission
* Reason is mandatory
* Event is logged
* Access scope is limited
* Security/audit team can review it
Example:
```text
Reason:
Emergency treatment requires access to allergy information.
```
---
# 24. Authentication
Authentication should support:
* Username/password
* MFA
* SSO where configured
* Session expiration
* Refresh token rotation where applicable
* Account lockout/risk controls
* Password policies
* Secure recovery
---
# 25. Permission Checks
Backend example:
```text
authenticate()
↓
resolveTenant()
↓
loadUserRoles()
↓
checkPermission()
↓
checkScope()
↓
checkResource()
↓
execute()
↓
audit()
```
---
# 26. UI Authorization
The frontend MUST:
* Hide unauthorized navigation
* Disable unauthorized actions
* Prevent access to unauthorized pages
* Show appropriate authorization errors
But backend authorization remains mandatory.
---
# 27. Audit Requirements
Authorization-sensitive events should record:
* User
* Hospital
* Role
* Permission
* Action
* Resource
* Resource ID
* Timestamp
* IP
* Device/session information where appropriate
* Result
* Reason where required
---
# 28. Hospital Type Profiles
## Government
Default focus:
* Clinical
* Emergency
* Inpatient
* Nursing
* Laboratory
* Radiology
* Pharmacy
* Inventory
* Public reporting
Commercial finance may be disabled.
## Private
May activate:
* Billing
* Payments
* Insurance
* Finance
* Procurement
* HR
* Commercial reports
## Non-Profit
May activate:
* Clinical
* Beneficiary management
* Subsidized services
* Donations/program funding integration
* Finance where required
* Reporting
The underlying permission architecture remains the same.
---
# 29. Permission Matrix
The implementation should maintain a machine-readable permission registry.
Example:
| Module    | Permission       | Typical Roles               |
| --------- | ---------------- | --------------------------- |
| Patients  | View             | Physician, Nurse, Reception |
| Patients  | Create           | Reception                   |
| Clinical  | Create Encounter | Physician                   |
| Clinical  | Sign Encounter   | Physician                   |
| Nursing   | Record Vitals    | Nurse                       |
| Lab       | Enter Result     | Lab Specialist              |
| Lab       | Approve Result   | Lab Specialist/Manager      |
| Radiology | Sign Report      | Radiologist                 |
| Pharmacy  | Dispense         | Pharmacist                  |
| Inventory | Receive Goods    | Storekeeper                 |
| Finance   | Receive Payment  | Cashier                     |
| Insurance | Submit Claim     | Insurance Officer           |
| HR        | Manage Employees | HR Officer                  |
| Audit     | View Logs        | Auditor/Admin               |
This table is conceptual; the implementation registry is authoritative.
---
# 30. Cursor Implementation Rules
Cursor MUST:
1. Read this document before implementing authorization.
2. Never rely on frontend permissions.
3. Create centralized authorization services.
4. Create permission constants/registry.
5. Implement tenant isolation.
6. Implement scope checking.
7. Protect every API route.
8. Add authorization tests.
9. Add audit logging.
10. Avoid duplicated permission logic.
11. Avoid hard-coded role checks where permission checks are more appropriate.
12. Keep roles configurable.
Preferred:
```text
hasPermission(user, "lab.result.approve")
```
rather than:
```text
if user.role === "LAB_MANAGER"
```
---
# 31. Definition of Done
Authorization is complete only when:
* Authentication works
* RBAC works
* Permissions are centralized
* Tenant isolation works
* Department scope works
* Backend enforcement works
* Frontend authorization works
* Sensitive data is protected
* Audit logging works
* Emergency access is controlled
* Automated tests exist
* Unauthorized access tests pass
* Documentation is updated
