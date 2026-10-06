# HOSPITAL MANAGEMENT SYSTEM
## Database Architecture & Schema Specification
**Document:** DATABASE_SCHEMA.md
**Version:** 1.0
**Status:** Architecture Specification
**Database:** PostgreSQL
**ORM:** Prisma
**Primary Purpose:** Define the data architecture, entities, relationships, integrity rules, auditability, and multi-tenant structure of the Hospital Management System.
---
# 1. Purpose
This document defines the database architecture for the Hospital Management System.
The database must support:
* Multiple hospitals
* Multiple departments
* Multiple users and roles
* Patients
* Medical records
* Clinical encounters
* Appointments
* Emergency visits
* Admissions
* Beds and wards
* Nursing
* Laboratory
* Radiology
* Pharmacy
* Surgery
* Blood bank
* Inventory
* Procurement
* Billing
* Payments
* Insurance
* HR
* Reports
* Audit logs
* Offline synchronization
* Cloud synchronization
The database must be designed for a long-term production system.
It must not be designed as a simple CRUD application.
---
# 2. Database Technology
Primary database:
```text
PostgreSQL
```
ORM:
```text
Prisma
```
PostgreSQL is the authoritative relational database for structured application data.
The system must use:
* Foreign keys
* Constraints
* Transactions
* Indexes
* Unique constraints
* Proper normalization
* Soft deletion where appropriate
* Auditability
---
# 3. Multi-Tenant Database Model
The system is multi-tenant.
A tenant represents a hospital.
Core relationship:
```text
Hospital
│
├── Users
├── Departments
├── Patients
├── Encounters
├── Appointments
├── Laboratory
├── Pharmacy
├── Inventory
├── Finance
└── Other hospital data
```
Most tenant-owned tables must contain:
```text
tenant_id
```
referencing `hospitals.id` (decided in ADP-004: `tenant_id` is the only tenant identifier;
`hospital_id` must not be used as an interchangeable tenant column).
The backend must always enforce tenant isolation.
A user belonging to Hospital A must never access Hospital B data.
---
# 4. Tenant Isolation Rules
Tenant isolation must exist at multiple layers.
## Application Layer
Every request must resolve the authenticated user's tenant.
## Authorization Layer
The user's permissions must be checked against the tenant.
## Database Layer
Queries involving tenant-owned data must include tenant restrictions.
## API Layer
Client-provided `tenant_id` values must never be trusted as authorization.
The server must determine the tenant from authenticated context.
---
# 5. Core Entity Groups
The database should be organized conceptually into these domains:
```text
1. Organization
2. Identity & Access
3. Patient
4. Clinical
5. Reception
6. Emergency
7. Inpatient
8. Nursing
9. Laboratory
10. Radiology
11. Pharmacy
12. Surgery
13. Blood Bank
14. Inventory
15. Procurement
16. Finance
17. Insurance
18. HR
19. Audit
20. Synchronization
21. Files/Documents
22. Notifications
```
---
# 6. Organization Domain
## Hospital
Represents the tenant.
Suggested fields:
```text
id
name
legal_name
hospital_code
hospital_type
license_number
phone
email
address
country
city
timezone
currency
default_language
status
created_at
updated_at
```
Hospital types:
```text
GOVERNMENT
PRIVATE
NON_PROFIT
```
Status:
```text
ACTIVE
SUSPENDED
ARCHIVED
```
---
# 7. Hospital Settings
Hospital-specific configuration should not be hard-coded.
Example:
```text
HospitalSettings
```
Possible configuration:
```text
appointment settings
billing settings
insurance settings
pharmacy settings
laboratory settings
notification settings
working hours
patient numbering
invoice numbering
clinical configuration
```
Configuration should be extensible.
---
# 8. Departments
Entity:
```text
Department
```
Examples:
```text
Emergency
Internal Medicine
Surgery
Pediatrics
Obstetrics
Gynecology
Cardiology
Radiology
Laboratory
Pharmacy
Nursing
Administration
Finance
HR
```
Suggested fields:
```text
id
tenant_id
name
code
type
description
status
created_at
updated_at
```
A hospital can create its own departments.
---
# 9. Users
Users represent system accounts (identities). Decided in Phase 3 (ADP-006 / P3-D3): a user may
belong to **one or more** hospitals through memberships, so `users` has no `tenant_id`.
Implemented fields (`users`):
```text
id
username
email
display_name
status            PENDING | ACTIVE | SUSPENDED | DISABLED
failed_login_count
locked_until
last_login_at
created_at
updated_at
```
Memberships (`user_hospital_memberships`):
```text
id
tenant_id
user_id
status            ACTIVE | SUSPENDED | DISABLED
created_at
updated_at
```
The active tenant of a request is the tenant stored in the server-side session, selected from the
user's own active memberships.
Credentials are owned by the identity provider (ADP-003). The local provider stores them in
`user_credentials` (`user_id`, `password_hash` (Argon2id), `must_change`, `password_changed_at`).
Do not store plaintext passwords.
---
# 10. Roles
Entity:
```text
Role
```
Examples:
```text
SUPER_ADMIN
HOSPITAL_ADMIN
DOCTOR
NURSE
RECEPTIONIST
LAB_TECHNICIAN
RADIOLOGY_TECHNICIAN
PHARMACIST
ACCOUNTANT
HR_OFFICER
INVENTORY_OFFICER
PROCUREMENT_OFFICER
INSURANCE_OFFICER
MEDICAL_RECORDS_OFFICER
DEPARTMENT_MANAGER
IT_ADMIN
```
---
# 11. Permissions
Permissions must be granular.
Example:
```text
patient.read
patient.create
patient.update
appointment.read
appointment.create
appointment.update
encounter.read
encounter.create
encounter.update
lab.order.create
lab.result.create
lab.result.approve
pharmacy.dispense
invoice.create
payment.create
user.create
user.update
role.assign
```
Permissions should be assigned to roles.
Users receive permissions through their roles.
---
# 12. User-Role Relationship
A user may have one or multiple roles depending on the system configuration.
Example:
```text
User
│
├── Doctor
└── Department Manager
```
The system must support role assignment without duplicating user accounts.
Implemented in Phase 3:
```text
role_assignments           tenant role assigned within a membership (tenant_id, user_id, role_id,
                           optional department_id, valid_from, valid_until)
platform_role_assignments  platform-level roles (no tenant)
user_departments           department membership (tenant_id, user_id, department_id)
roles                      tenant_id NULL = read-only system template
role_permissions           role_id, permission_key, scope
permissions                code-defined registry synchronized into PostgreSQL
sessions                   opaque server-side sessions (token hash only)
audit_logs                 append-only (UPDATE/DELETE/TRUNCATE rejected by triggers)
```
See `AUTHENTICATION_AUTHORIZATION.md`.
---
# 13. Staff / Professional Profile
A system user and a medical professional are not necessarily the same concept.
Create a professional/staff entity.
Example:
```text
Staff
```
Possible fields:
```text
id
tenant_id
user_id
employee_number
first_name
last_name
professional_type
license_number
department_id
specialty
status
created_at
updated_at
```
Examples of professional types:
```text
DOCTOR
NURSE
PHARMACIST
LAB_TECHNICIAN
RADIOLOGY_TECHNICIAN
ADMINISTRATOR
```
---
# 14. Patient Architecture
The patient is one of the most important entities in the system.
There must be one unified patient identity.
Entity:
```text
Patient
```
Suggested fields:
```text
id
tenant_id
patient_number
first_name
middle_name
last_name
date_of_birth
gender
national_id
phone
email
address
blood_type
marital_status
emergency_contact
status
created_at
updated_at
```
The exact fields should remain configurable according to jurisdiction and hospital requirements.
---
# 15. Patient Number
Every patient should have a unique hospital-level patient number.
Example:
```text
PAT-000001
PAT-000002
PAT-000003
```
The numbering system must be configurable.
A patient's patient number should remain stable throughout their relationship with the hospital.
---
# 16. Patient Identity and Duplicate Prevention
The system must reduce duplicate patient records.
Potential matching fields:
```text
National ID
Phone
Date of Birth
Name
Patient Number
```
The system should provide duplicate detection before creating a new patient.
However, the system must not automatically merge patients without an appropriate controlled workflow.
---
# 17. Patient Contacts
Separate patient contact information where appropriate.
Example:
```text
PatientContact
```
Fields:
```text
id
patient_id
name
relationship
phone
email
address
is_emergency_contact
```
---
# 18. Patient Documents
Documents should be stored outside normal relational tables when they are large.
Entity:
```text
PatientDocument
```
Possible fields:
```text
id
tenant_id
patient_id
document_type
file_name
storage_key
mime_type
file_size
uploaded_by
created_at
```
Actual files should be stored in object/file storage such as MinIO.
The database stores metadata and the storage reference.
---
# 19. Medical Record Architecture
The patient record must not be a single giant database table.
It should be composed of related clinical entities.
Conceptually:
```text
Patient
│
├── Encounters
├── Diagnoses
├── Allergies
├── Medications
├── Procedures
├── Lab Orders
├── Radiology Orders
├── Prescriptions
├── Clinical Notes
└── Documents
```
---
# 20. Encounters
An encounter represents a clinical interaction.
Examples:
```text
Outpatient Visit
Emergency Visit
Inpatient Visit
Follow-up
Telemedicine
```
Entity:
```text
Encounter
```
Suggested fields:
```text
id
tenant_id
patient_id
encounter_number
encounter_type
department_id
doctor_id
start_time
end_time
status
reason
created_at
updated_at
```
---
# 21. Encounter Status
Possible states:
```text
OPEN
IN_PROGRESS
COMPLETED
CANCELLED
CLOSED
```
The exact workflow may vary by encounter type.
---
# 22. Clinical Notes
Clinical notes should be separate records.
Entity:
```text
ClinicalNote
```
Possible fields:
```text
id
tenant_id
patient_id
encounter_id
author_id
note_type
content
created_at
updated_at
```
Examples:
```text
History
Examination
Assessment
Plan
Progress Note
Discharge Note
```
Important clinical records should be auditable.
---
# 23. Diagnoses
Entity:
```text
Diagnosis
```
Possible fields:
```text
id
tenant_id
patient_id
encounter_id
diagnosis_code
description
type
status
diagnosed_by
diagnosed_at
```
The system should eventually support standardized diagnosis coding where required.
---
# 24. Allergies
Entity:
```text
PatientAllergy
```
Possible fields:
```text
id
tenant_id
patient_id
allergen
reaction
severity
status
recorded_by
recorded_at
```
Allergy changes must be audited.
---
# 25. Vital Signs
Entity:
```text
VitalSign
```
Possible fields:
```text
id
tenant_id
patient_id
encounter_id
recorded_by
recorded_at
temperature
heart_rate
respiratory_rate
blood_pressure_systolic
blood_pressure_diastolic
oxygen_saturation
weight
height
notes
```
The system should support future expansion for additional measurements.
---
# 26. Appointments
Entity:
```text
Appointment
```
Relationships:
```text
Patient
Doctor
Department
```
Possible fields:
```text
id
tenant_id
patient_id
doctor_id
department_id
appointment_number
scheduled_start
scheduled_end
appointment_type
status
reason
notes
created_by
created_at
updated_at
```
Statuses:
```text
SCHEDULED
CONFIRMED
CHECKED_IN
IN_PROGRESS
COMPLETED
CANCELLED
NO_SHOW
```
---
# 27. Reception and Queue
Queue management should be represented separately from appointments.
A walk-in patient may not have an appointment.
Example:
```text
QueueTicket
```
Relationships:
```text
Patient
Department
Doctor
Encounter
```
Possible states:
```text
WAITING
CALLED
IN_SERVICE
COMPLETED
CANCELLED
```
---
# 28. Emergency Department
Emergency visits should connect to the unified patient record.
Core entities:
```text
EmergencyVisit
TriageAssessment
EmergencyTreatment
EmergencyDisposition
```
Flow:
```text
Emergency Registration
↓
Triage
↓
Doctor Assessment
↓
Orders / Treatment
↓
Disposition
```
Possible dispositions:
```text
DISCHARGED
ADMITTED
REFERRED
TRANSFERRED
DECEASED
```
---
# 29. Admission Architecture
Entity:
```text
Admission
```
Possible fields:
```text
id
tenant_id
patient_id
encounter_id
admission_number
admission_type
admitted_at
discharged_at
admitting_doctor_id
ward_id
bed_id
status
```
---
# 30. Ward and Bed Management
Entities:
```text
Ward
Room
Bed
BedAssignment
```
Hierarchy:
```text
Hospital
↓
Ward
↓
Room
↓
Bed
```
A bed must have a clear availability state.
Examples:
```text
AVAILABLE
OCCUPIED
RESERVED
MAINTENANCE
BLOCKED
```
Bed assignment history must be retained.
---
# 31. Nursing
Nursing activities must connect to:
```text
Patient
Encounter
Admission
Nurse
```
Potential entities:
```text
NursingNote
NursingTask
MedicationAdministration
VitalSign
CarePlan
```
---
# 32. Medication Administration
Medication administration must be separated from prescription.
Important distinction:
```text
Prescription ≠ Medication Administration
```
A doctor may prescribe a medication.
A nurse may later administer it.
The system must record both events separately.
---
# 33. Pharmacy
Core entities:
```text
Medication
MedicationCategory
Prescription
PrescriptionItem
Dispensing
DispensingItem
PharmacyStock
```
Relationship:
```text
Doctor
↓
Prescription
↓
Pharmacy
↓
Dispensing
↓
Patient
```
---
# 34. Laboratory
Laboratory architecture:
```text
LabOrder
↓
LabOrderItem
↓
Sample
↓
LabTest
↓
LabResult
```
Entities:
```text
LabTest
LabOrder
LabOrderItem
LabSample
LabResult
LabResultApproval
```
Important laboratory results should have an approval workflow.
---
# 35. Laboratory Result Lifecycle
Example:
```text
ORDERED
↓
SAMPLE_COLLECTED
↓
PROCESSING
↓
RESULT_ENTERED
↓
RESULT_REVIEWED
↓
RESULT_APPROVED
↓
PUBLISHED
```
A result should not be silently modified after approval.
Changes after approval must follow a controlled correction workflow.
---
# 36. Radiology
Core entities:
```text
RadiologyOrder
RadiologyStudy
RadiologyReport
RadiologyProcedure
```
Architecture must support future PACS/DICOM integration.
Possible flow:
```text
Doctor
↓
Radiology Order
↓
Scheduled
↓
Study
↓
PACS / DICOM
↓
Radiologist
↓
Report
↓
Approved
```
---
# 37. Surgery
Core entities:
```text
OperatingRoom
SurgerySchedule
SurgicalProcedure
SurgicalTeam
AnesthesiaRecord
PostOperativeRecord
```
Surgery records must connect to the patient's encounter/admission.
---
# 38. Blood Bank
Core entities:
```text
BloodProduct
BloodUnit
BloodInventory
BloodRequest
CompatibilityTest
Transfusion
```
Blood-unit tracking must be traceable from receipt through usage or disposal.
---
# 39. Inventory
Inventory must use transaction-based stock movement.
Core entities:
```text
Item
Warehouse
Stock
StockMovement
StockBatch
StockAdjustment
StockTransfer
```
Do not simply store one editable `quantity` without a movement history.
The system should be able to reconstruct stock changes.
---
# 40. Stock Movement
Examples:
```text
PURCHASE_RECEIPT
TRANSFER_IN
TRANSFER_OUT
DISPENSING
CONSUMPTION
RETURN
ADJUSTMENT
EXPIRATION
DAMAGE
```
Each movement should contain:
```text
item
quantity
source
destination
user
timestamp
reference
reason
```
---
# 41. Procurement
Entities:
```text
Supplier
PurchaseRequest
PurchaseOrder
PurchaseOrderItem
GoodsReceipt
GoodsReceiptItem
```
Flow:
```text
Purchase Request
↓
Approval
↓
Purchase Order
↓
Supplier
↓
Goods Receipt
↓
Inventory
```
---
# 42. Finance
Financial modules should be optional.
Core entities:
```text
Service
PriceList
Invoice
InvoiceItem
Payment
Refund
Expense
```
Relationship:
```text
Patient
↓
Encounter
↓
Services
↓
Invoice
↓
Payment
```
Financial transactions must be immutable or correction-based wherever appropriate.
---
# 43. Insurance
Core entities:
```text
InsuranceProvider
InsurancePlan
PatientInsurance
EligibilityCheck
InsuranceClaim
ClaimItem
ClaimStatusHistory
```
Flow:
```text
Patient
↓
Insurance
↓
Encounter
↓
Services
↓
Claim
↓
Approval / Rejection
↓
Settlement
```
---
# 44. HR
HR should be separated from system authentication.
Entities may include:
```text
Employee
EmploymentRecord
Attendance
LeaveRequest
PayrollRecord
```
An employee may have a system account, but the concepts are not identical.
---
# 45. Audit Architecture
Audit logs must be centralized.
Entity:
```text
AuditLog
```
Possible fields:
```text
id
tenant_id
user_id
action
resource_type
resource_id
timestamp
ip_address
user_agent
before_data
after_data
result
```
Do not store unnecessary sensitive information in logs.
Audit logs should be append-oriented.
Ordinary users must not be able to modify them.
---
# 46. File Architecture
Files should be represented by metadata records.
Example:
```text
FileObject
```
Possible fields:
```text
id
tenant_id
entity_type
entity_id
file_name
storage_provider
storage_key
mime_type
file_size
checksum
uploaded_by
created_at
```
Actual binary content should be stored in object storage.
---
# 47. Notification Architecture
Notifications should be represented separately.
Entity:
```text
Notification
```
Potential channels:
```text
IN_APP
EMAIL
SMS
PUSH
```
Not every channel will always be available.
The system must allow notifications to be queued and retried.
---
# 48. Synchronization Data Model
The database must be prepared for offline/cloud synchronization.
Potential entities:
```text
SyncEvent
SyncQueue
SyncConflict
SyncCheckpoint
```
Example:
```text
SyncEvent
---------
id
tenant_id
entity_type
entity_id
operation
version
device_id
created_at
payload
status
```
Possible statuses:
```text
PENDING
PROCESSING
SYNCED
FAILED
CONFLICT
```
The exact implementation must be finalized during the synchronization architecture phase.
---
# 49. Event Idempotency
Every synchronization event must have a unique identity.
Example:
```text
event_id
```
The cloud system must be able to determine whether an event has already been processed.
If an event is received twice:
```text
First request → processed
Second request → recognized as duplicate
```
It must not create duplicate:
* Patients
* Payments
* Lab results
* Medication administrations
* Stock movements
* Other transactions
---
# 50. Soft Deletion
Not every record should be physically deleted.
For important business and medical records, prefer controlled deletion or archival.
Potential fields:
```text
deleted_at
deleted_by
deletion_reason
```
However, medical and financial records may require specialized correction/voiding workflows rather than deletion.
Never implement unrestricted hard deletion for critical records.
---
# 51. Timestamps
All important entities should use timestamps.
Recommended:
```text
created_at
updated_at
```
Some entities may additionally require:
```text
deleted_at
approved_at
completed_at
cancelled_at
```
Use UTC internally where appropriate and convert to the hospital's configured timezone for presentation.
---
# 52. Database IDs
Use stable unique identifiers.
Recommended primary-key strategy:
```text
UUID
```
or another collision-resistant identifier.
Human-readable identifiers such as:
```text
PAT-000123
INV-000123
LAB-000123
```
should be separate business identifiers.
Do not use human-readable numbers as database primary keys.
---
# 53. Database Constraints
Use database constraints whenever possible.
Examples:
```text
UNIQUE
NOT NULL
FOREIGN KEY
CHECK
```
Business-critical uniqueness must not rely only on frontend validation.
Example:
A patient number must be unique within the appropriate hospital scope.
---
# 54. Indexing Strategy
Indexes must be designed according to real queries.
Important indexes may include:
```text
tenant_id
patient_id
encounter_id
appointment_date
doctor_id
department_id
status
created_at
updated_at
```
Composite indexes should be introduced when query patterns justify them.
Do not create excessive indexes without considering write performance.
---
# 55. Transactions
Use database transactions for operations that must succeed or fail together.
Examples:
### Patient registration
```text
Create Patient
+
Create Patient Number
+
Create Audit Event
```
### Pharmacy dispensing
```text
Create Dispensing
+
Create Stock Movement
+
Decrease Available Stock
```
### Payment
```text
Create Payment
+
Update Invoice Status
+
Create Audit Record
```
If one critical operation fails, the transaction should roll back appropriately.
---
# 56. Medical Data Integrity
Medical records require stronger integrity rules than ordinary business CRUD.
For example:
A lab result marked `APPROVED` should not simply be overwritten.
Instead:
```text
Original Result
↓
Correction Request
↓
Authorized Review
↓
Corrected Result
↓
Audit Trail
```
The original record must remain traceable.
---
# 57. Financial Data Integrity
Financial transactions require similar protection.
Do not allow users to simply modify historical payments without traceability.
Prefer:
```text
Original Transaction
↓
Correction / Reversal
↓
New Transaction
```
rather than silently changing history.
---
# 58. Data Relationship Principle
The database should represent real hospital relationships.
Example:
```text
Patient
│
├── Appointment
│       │
│       └── Encounter
│              │
│              ├── Diagnosis
│              ├── Prescription
│              ├── Lab Order
│              ├── Radiology Order
│              └── Procedures
│
└── Admission
│
├── Ward
├── Bed
├── Nursing
└── Discharge
```
Do not create unrelated duplicate patient records for each module.
---
# 59. Referential Integrity
Foreign keys must be used for relationships where appropriate.
Examples:
```text
Encounter.patient_id → Patient.id
Appointment.patient_id → Patient.id
LabOrder.encounter_id → Encounter.id
Prescription.patient_id → Patient.id
Admission.patient_id → Patient.id
```
The database should prevent invalid references.
---
# 60. Schema Evolution
Database changes must be managed through migrations.
Never manually modify the production database schema without a documented migration.
Each migration must be:
* Versioned
* Reviewable
* Reproducible
* Tested
* Reversible where practical
Before dangerous migrations:
```text
Backup
↓
Migration
↓
Validation
↓
Application deployment
```
---
# 61. Prisma Rules
Prisma should be used as the main application ORM.
The Prisma schema must:
* Clearly define relations
* Define indexes
* Define unique constraints
* Define enums carefully
* Avoid unnecessary duplication
* Reflect the domain architecture
Do not allow Cursor to generate an enormous Prisma schema without reviewing domain boundaries.
Build the schema progressively.
---
# 62. Database Enums
Enums may be used for stable finite states.
Examples:
```text
HospitalType
UserStatus
EncounterType
EncounterStatus
AppointmentStatus
AdmissionStatus
BedStatus
OrderStatus
PaymentStatus
SyncStatus
```
Avoid enums for values that hospitals are expected to customize frequently.
For configurable values, use database tables.
---
# 63. Configurable Catalogs
Hospital-specific catalogs should generally be database entities rather than hard-coded enums.
Examples:
```text
Departments
Services
Medications
Laboratory Tests
Radiology Procedures
Inventory Items
Insurance Providers
```
This allows different hospitals to configure their own data.
---
# 64. Data Ownership
Every entity must have a clearly defined owner/domain.
Example:
```text
Patient → Patient Management
Encounter → Clinical
LabResult → Laboratory
Prescription → Clinical/Pharmacy
StockMovement → Inventory
Invoice → Finance
Claim → Insurance
```
Avoid unclear ownership where multiple modules independently modify the same entity without defined rules.
---
# 65. Cross-Module Architecture
Modules should communicate through well-defined domain services and APIs.
Example:
```text
Clinical
↓
Prescription
↓
Pharmacy
```
Clinical should not directly manipulate pharmacy stock tables.
Instead, Pharmacy owns dispensing and stock operations.
Similarly:
```text
Clinical
↓
Lab Order
↓
Laboratory
```
Laboratory owns sample processing and results.
---
# 66. Reporting
Reports should not directly manipulate transactional data.
Reporting queries should be optimized separately where required.
For large installations, consider:
```text
Transactional Database
↓
Reporting Layer
```
Do not introduce a separate data warehouse unless actual scale requires it.
---
# 67. Data Retention
Retention policies must be configurable and compliant with applicable legal and institutional requirements.
The system should not automatically delete medical records simply because they are old.
Retention and archival must be treated as controlled administrative processes.
---
# 68. Privacy
The database must follow the principle of minimum necessary access.
Users should only retrieve data necessary for their role.
Examples:
A pharmacist does not automatically need access to every administrative record.
An accountant does not automatically need full clinical notes.
A nurse may need clinical information relevant to patient care but not unrestricted financial information.
Authorization must be implemented accordingly.
---
# 69. Development Order
The database should be implemented in phases.
## Phase 1 — Foundation
```text
Hospital
Department
User
Role
Permission
Staff
AuditLog
```
## Phase 2 — Patient Core
```text
Patient
PatientContact
PatientDocument
```
## Phase 3 — Clinical Core
```text
Encounter
ClinicalNote
Diagnosis
Allergy
VitalSign
Procedure
```
## Phase 4 — Reception
```text
Appointment
QueueTicket
```
## Phase 5 — Emergency/Inpatient
```text
EmergencyVisit
TriageAssessment
Admission
Ward
Room
Bed
BedAssignment
```
## Phase 6 — Clinical Services
```text
Prescription
LabOrder
LabResult
RadiologyOrder
RadiologyReport
```
## Phase 7 — Pharmacy/Inventory
```text
Medication
Dispensing
Warehouse
Stock
StockMovement
```
## Phase 8 — Financial
```text
Service
Invoice
InvoiceItem
Payment
InsuranceClaim
```
## Phase 9 — Advanced Modules
```text
Surgery
BloodBank
HR
Procurement
Advanced Reporting
```
## Phase 10 — Synchronization
```text
SyncEvent
SyncQueue
SyncConflict
SyncCheckpoint
```
---
# 70. Database Development Rules for Cursor
Cursor MUST follow these rules:
### Rule 1
Never create a new table simply because a new screen needs somewhere to store data.
First determine whether an existing domain entity already represents the concept.
### Rule 2
Never duplicate the Patient entity across modules.
### Rule 3
Never bypass foreign-key relationships just to simplify implementation.
### Rule 4
Never remove existing database fields or relations without checking their dependencies.
### Rule 5
Never perform destructive migrations without explicit approval.
### Rule 6
Every new entity must have a documented purpose.
### Rule 7
Every relationship must have a documented reason.
### Rule 8
Every important transaction must consider concurrency and rollback.
### Rule 9
Every tenant-owned record must respect tenant isolation.
### Rule 10
Critical medical and financial data must remain auditable.
---
# 71. Example Core Relationship Map
The conceptual core should resemble:
```text
HOSPITAL
│
┌───────────────┼───────────────┐
│               │               │
DEPARTMENT         USER            STAFF
│               │
│               └── ROLE
│                    │
│                PERMISSION
│
▼
PATIENT
│
┌─────┼─────────────┐
│     │             │
▼     ▼             ▼
APPOINTMENT ENCOUNTER  ADMISSION
│            │
┌───────┼───────┐    ├── WARD
│       │       │    ├── ROOM
▼       ▼       ▼    └── BED
DIAGNOSIS  ORDERS  NOTES
│
┌──────┼──────┐
│             │
▼             ▼
LAB ORDER    RADIOLOGY ORDER
│             │
▼             ▼
LAB RESULT   RADIOLOGY REPORT
ENCOUNTER
│
▼
PRESCRIPTION
│
▼
DISPENSING
│
▼
STOCK MOVEMENT
ENCOUNTER
│
▼
SERVICE
│
▼
INVOICE
│
▼
PAYMENT
```
---
# 72. Final Database Principle
The database must represent the hospital as an integrated system.
The central concept is:
```text
Hospital
↓
Patient
↓
Encounter
↓
Clinical / Operational Services
↓
Orders / Results / Treatments
↓
Financial / Insurance / Inventory consequences
```
The system must maintain one consistent patient identity and one connected medical history.
The database must prioritize:
```text
Data Integrity
+
Security
+
Auditability
+
Tenant Isolation
+
Clinical Traceability
+
Financial Traceability
+
Offline Synchronization
+
Scalability
+
Maintainability
```
---
# 73. Instruction to Cursor
Before implementing the database:
1. Read `HOSPITAL_SYSTEM_MASTER_SPEC.md`.
2. Read this document.
3. Inspect the current repository.
4. Create a complete conceptual ERD.
5. Identify all entities and relationships.
6. Identify required indexes and unique constraints.
7. Identify tenant boundaries.
8. Identify which entities require auditability.
9. Identify which entities require soft deletion or correction workflows.
10. Identify synchronization requirements.
11. Produce the proposed Prisma schema structure.
12. Do NOT immediately create the entire production schema blindly.
13. Present the proposed database architecture for review.
14. After approval, implement the schema in controlled phases.
15. Create Prisma migrations for every structural change.
16. Add database tests for critical constraints.
17. Never silently redesign the database architecture.
The database is the foundation of the entire Hospital Management System. Incorrect database architecture will create problems across every future module, therefore schema changes must be deliberate, documented, and tested.
