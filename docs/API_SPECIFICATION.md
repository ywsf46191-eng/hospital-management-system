# HOSPITAL MANAGEMENT SYSTEM
## API Specification
**Document:** `API_SPECIFICATION.md`
**Version:** 1.0
**Status:** Backend & Frontend Integration Specification
**Related Documents:**
* `HOSPITAL_SYSTEM_MASTER_SPEC.md`
* `DATABASE_SCHEMA.md`
* `MODULES.md`
* `RBAC.md`
---
# 1. Purpose
This document defines the API architecture for the Hospital Management System.
The API is the primary communication layer between:
```text
Web Application
↓
Backend API
↓
Business Logic
↓
Database / Services
```
The API must support:
* Hospital management
* Patient management
* Clinical workflows
* Appointments
* Emergency
* Inpatient care
* Nursing
* Laboratory
* Radiology
* Pharmacy
* Surgery
* Blood Bank
* Inventory
* Procurement
* Finance
* Insurance
* HR
* Reports
* Notifications
* Synchronization
* File management
* Audit logs
---
# 2. API Architecture
The initial architecture is:
```text
Next.js Web Application
│
▼
NestJS API
│
┌─────┴─────┐
▼           ▼
PostgreSQL    Redis
│
▼
Domain Services
```
The API should be modular and follow the same domain boundaries defined in `MODULES.md`.
---
# 3. API Style
The primary API style should be:
```text
REST API
```
with:
```text
WebSockets
```
where real-time communication is required.
Examples:
* Queue displays
* Emergency status
* Notifications
* Bed availability
* Sync monitoring
* Live dashboards
Do not use WebSockets for ordinary CRUD operations when REST is sufficient.
---
# 4. API Base URL
Development:
```text
/api/v1
```
Production example:
```text
https://hospital.example.com/api/v1
```
Internal hospital server example:
```text
https://hospital.local/api/v1
```
The actual hostname must be configurable.
Never hard-code the hospital domain inside application code.
---
# 5. API Versioning
All production API endpoints should use versioning:
```text
/api/v1
```
Future breaking changes may use:
```text
/api/v2
```
Do not introduce breaking API changes into an existing version without an explicit migration strategy.
---
# 6. HTTP Methods
Use standard HTTP methods.
```text
GET     Read
POST    Create / Action
PUT     Full replacement where appropriate
PATCH   Partial update
DELETE  Delete where appropriate
```
For medical and financial records, prefer controlled business actions over destructive DELETE operations.
Examples:
```text
POST /prescriptions/:id/cancel
POST /lab/results/:id/correct
POST /invoices/:id/void
```
instead of blindly deleting records.
---
# 7. Authentication
All protected endpoints require authentication.
Decided in Phase 3 (ADP-003, ADP-006 / P3-D4): browser clients authenticate with an **opaque
server-side session** carried in a Secure + HttpOnly + SameSite cookie. State-changing requests
must also send the session's CSRF token in the `X-CSRF-Token` header. Bearer tokens are not used
by the web application; non-human service accounts will receive a separate mechanism later.
Identity is application-managed (Argon2id) behind an `IdentityProvider` interface so that
Keycloak or another approved identity provider can replace it later.
---
# 8. Authentication Flow
Conceptually:
```text
User
↓
Login
↓
Identity Provider
↓
Access Token
↓
Frontend
↓
API
↓
Token Validation
↓
User Identity
↓
Tenant
↓
Permissions
```
---
# 9. API Authorization
Authentication alone is insufficient.
Every protected request must verify:
```text
Authenticated
+
Active User
+
Correct Tenant
+
Required Permission
+
Resource Access
```
Refer to:
`RBAC.md`
for the authorization model.
---
# 10. Tenant Identification
The API must never trust a user-provided `tenant_id` (or any hospital identifier) as the tenant
security mechanism. The tenant identifier is `tenant_id` (ADP-004).
Incorrect:
```json
{
"tenant_id": "hospital-b"
}
```
and assuming that the user is authorized.
The server must derive the authenticated tenant context from the authenticated user/session.
If cross-tenant access is required for a platform administrator, it must be explicitly authorized.
---
# 11. Request ID
Every API request should receive a unique request identifier.
Example:
```text
X-Request-ID: 4c2a9f...
```
The ID should be included in:
* Server logs
* Audit logs where appropriate
* Error responses
* Monitoring/tracing
This allows technical teams to trace a request across services.
---
# 12. Standard Response Structure
Successful single-resource response:
```json
{
"success": true,
"data": {
"id": "uuid",
"name": "Example"
}
}
```
Successful list response:
```json
{
"success": true,
"data": [],
"meta": {
"page": 1,
"pageSize": 25,
"total": 100,
"totalPages": 4
}
}
```
---
# 13. Standard Error Structure
All API errors should follow a consistent structure.
Example:
```json
{
"success": false,
"error": {
"code": "PATIENT_NOT_FOUND",
"message": "Patient was not found.",
"details": null,
"requestId": "4c2a9f..."
}
}
```
Do not expose:
* Stack traces
* Database errors
* SQL queries
* Internal filesystem paths
* Secrets
* Tokens
* Internal infrastructure details
in production responses.
---
# 14. Error Codes
Error codes should be stable machine-readable identifiers.
Examples:
```text
AUTH_REQUIRED
AUTH_INVALID
AUTH_EXPIRED
ACCESS_DENIED
TENANT_ACCESS_DENIED
VALIDATION_ERROR
RESOURCE_NOT_FOUND
RESOURCE_CONFLICT
PATIENT_NOT_FOUND
DUPLICATE_PATIENT
APPOINTMENT_NOT_FOUND
APPOINTMENT_CONFLICT
LAB_RESULT_NOT_APPROVED
LAB_RESULT_ALREADY_APPROVED
INSUFFICIENT_STOCK
PAYMENT_FAILED
SYNC_CONFLICT
SYNC_FAILED
INTERNAL_ERROR
```
Frontend applications should use the error code rather than parsing the human-readable message.
---
# 15. HTTP Status Codes
Use standard HTTP status codes.
```text
200 OK
201 Created
202 Accepted
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```
---
# 16. Validation
Every API input must be validated.
Recommended:
```text
NestJS
+
class-validator / Zod / approved validation layer
```
depending on the final implementation.
Never trust:
* Request body
* Query parameters
* URL parameters
* Uploaded files
* Client-generated IDs
---
# 17. Input Validation Example
Patient creation:
```json
{
"firstName": "Ahmad",
"lastName": "Ali",
"dateOfBirth": "1990-01-01",
"gender": "MALE"
}
```
The server validates:
```text
firstName
lastName
dateOfBirth
gender
phone
national ID
```
according to the actual database and hospital configuration.
---
# 18. Pagination
Large collections must support pagination.
Example:
```text
GET /patients?page=1&pageSize=25
```
Maximum page size should be enforced.
Example:
```text
pageSize <= 100
```
The exact limit should be configurable.
---
# 19. Filtering
Resources should support controlled filtering.
Example:
```text
GET /patients?search=Ahmad&gender=MALE&page=1&pageSize=25
```
Do not dynamically expose arbitrary database fields for filtering.
Only approved filter fields should be supported.
---
# 20. Sorting
Example:
```text
GET /appointments?sortBy=appointmentDate&sortOrder=asc
```
Allowed sort fields must be whitelisted.
Never pass arbitrary client strings directly into SQL `ORDER BY`.
---
# 21. Searching
Search endpoints should support appropriate indexed fields.
Patient search may include:
```text
Patient Number
National ID
Name
Phone
Date of Birth
```
Access to search results must still follow authorization rules.
---
# 22. Patient API
Base:
```text
/api/v1/patients
```
Endpoints:
```text
GET    /patients
POST   /patients
GET    /patients/:id
PATCH  /patients/:id
GET    /patients/:id/contacts
POST   /patients/:id/contacts
GET    /patients/:id/documents
POST   /patients/:id/documents
GET    /patients/:id/encounters
GET    /patients/:id/appointments
GET    /patients/:id/allergies
POST   /patients/:id/allergies
GET    /patients/:id/medical-summary
```
---
# 23. Patient Creation
```text
POST /api/v1/patients
```
Required:
```text
patient.create
```
Backend must:
1. Validate input.
2. Check duplicate possibilities.
3. Generate patient number.
4. Create patient.
5. Create audit event.
6. Create synchronization event when applicable.
---
# 24. Patient Duplicate Detection
The API should detect possible duplicates using configurable matching rules.
Possible matching fields:
```text
National ID
Phone
Name
Date of Birth
Existing Patient Number
```
The API should not silently create duplicates when a high-confidence match exists.
---
# 25. Patient Merge
Because patient merging is sensitive:
```text
POST /patients/:id/merge
```
must require a special permission.
Example:
```text
patient.merge
```
The operation must:
* Require authorization.
* Preserve audit history.
* Preserve traceability.
* Avoid losing clinical records.
* Record source and target patient.
* Be reversible where technically and legally appropriate.
---
# 26. Appointment API
Base:
```text
/api/v1/appointments
```
Endpoints:
```text
GET    /appointments
POST   /appointments
GET    /appointments/:id
PATCH  /appointments/:id
POST   /appointments/:id/confirm
POST   /appointments/:id/cancel
POST   /appointments/:id/check-in
POST   /appointments/:id/complete
```
---
# 27. Queue API
```text
GET  /queues
POST /queues/tickets
GET  /queues/:id
POST /queues/:id/call-next
POST /queues/:id/call/:ticketId
POST /queues/:id/skip/:ticketId
POST /queues/:id/complete/:ticketId
```
Queue operations should support real-time updates.
---
# 28. Clinical Encounter API
```text
GET   /encounters
POST  /encounters
GET   /encounters/:id
PATCH /encounters/:id
POST  /encounters/:id/notes
GET   /encounters/:id/notes
POST  /encounters/:id/diagnoses
GET   /encounters/:id/diagnoses
POST  /encounters/:id/prescriptions
POST  /encounters/:id/lab-orders
POST  /encounters/:id/radiology-orders
POST  /encounters/:id/complete
```
---
# 29. Vital Signs API
```text
GET  /patients/:patientId/vitals
POST /patients/:patientId/vitals
```
Examples:
```text
Temperature
Blood Pressure
Heart Rate
Respiratory Rate
Oxygen Saturation
Weight
Height
BMI
```
Units and validation must be configurable where necessary.
---
# 30. Diagnosis API
```text
GET  /encounters/:id/diagnoses
POST /encounters/:id/diagnoses
PATCH /diagnoses/:id
POST  /diagnoses/:id/correct
```
Clinical diagnosis corrections must preserve audit history.
---
# 31. Prescription API
```text
GET  /prescriptions
POST /prescriptions
GET   /prescriptions/:id
PATCH /prescriptions/:id
POST /prescriptions/:id/cancel
POST /prescriptions/:id/renew
```
A prescription must contain appropriate:
```text
Medication
Dose
Route
Frequency
Duration
Instructions
```
according to hospital policy.
---
# 32. Medication Administration API
```text
GET  /medication-administrations
POST /medication-administrations
GET  /medication-administrations/:id
PATCH /medication-administrations/:id
```
Administration records must be auditable.
---
# 33. Emergency API
```text
GET  /emergency/visits
POST /emergency/visits
GET  /emergency/visits/:id
POST /emergency/visits/:id/triage
POST /emergency/visits/:id/treatment
POST /emergency/visits/:id/disposition
```
Disposition values may include:
```text
DISCHARGED
ADMITTED
TRANSFERRED
REFERRED
DECEASED
```
according to configured hospital workflows.
---
# 34. Admission API
```text
GET  /admissions
POST /admissions
GET   /admissions/:id
PATCH /admissions/:id
POST /admissions/:id/assign-bed
POST /admissions/:id/transfer
POST /admissions/:id/discharge
```
Bed assignment must be transactional.
---
# 35. Bed API
```text
GET /wards
GET /wards/:id
GET /wards/:id/rooms
GET /rooms/:id/beds
GET /beds
```
Bed status may include:
```text
AVAILABLE
OCCUPIED
RESERVED
CLEANING
MAINTENANCE
BLOCKED
```
---
# 36. Nursing API
```text
GET  /nursing/assignments
POST /nursing/assignments
GET  /nursing/notes
POST /nursing/notes
GET  /nursing/tasks
POST /nursing/tasks
PATCH /nursing/tasks/:id
GET  /nursing/handovers
POST /nursing/handovers
```
---
# 37. Laboratory API
Base:
```text
/api/v1/laboratory
```
Endpoints:
```text
GET  /laboratory/tests
POST /laboratory/tests
GET  /laboratory/orders
POST /laboratory/orders
GET  /laboratory/orders/:id
POST /laboratory/orders/:id/collect-sample
GET  /laboratory/samples
PATCH /laboratory/samples/:id
POST /laboratory/results
GET  /laboratory/results/:id
POST /laboratory/results/:id/review
POST /laboratory/results/:id/approve
POST /laboratory/results/:id/correct
```
---
# 38. Laboratory Result State
A laboratory result should have controlled states.
Example:
```text
ORDERED
SAMPLE_COLLECTED
PROCESSING
RESULT_ENTERED
UNDER_REVIEW
APPROVED
CORRECTED
CANCELLED
```
Approved results must not be silently overwritten.
---
# 39. Radiology API
Base:
```text
/api/v1/radiology
```
Endpoints:
```text
GET  /radiology/orders
POST /radiology/orders
GET  /radiology/studies
POST /radiology/studies
GET  /radiology/studies/:id
PATCH /radiology/studies/:id
POST /radiology/studies/:id/complete
POST /radiology/studies/:id/report
GET  /radiology/reports/:id
POST /radiology/reports/:id/approve
POST /radiology/reports/:id/correct
```
---
# 40. DICOM / PACS Integration
Radiology must support integration with PACS/DICOM infrastructure.
The application should not assume that medical images are ordinary uploaded files.
Possible architecture:
```text
Imaging Device
↓
DICOM
↓
PACS
↓
Study Metadata
↓
Hospital System
```
The API should store appropriate references and metadata rather than unnecessarily duplicating large imaging datasets.
---
# 41. Pharmacy API
```text
GET  /pharmacy/prescriptions
GET  /pharmacy/prescriptions/:id
POST /pharmacy/dispensing
GET  /pharmacy/dispensing/:id
GET /pharmacy/stock
GET /pharmacy/medications
POST /pharmacy/stock/adjust
POST /pharmacy/stock/transfer
```
Dispensing must create the appropriate inventory movement.
---
# 42. Inventory API
```text
GET  /inventory/items
POST /inventory/items
GET  /inventory/warehouses
POST /inventory/warehouses
GET  /inventory/stocks
GET  /inventory/movements
POST /inventory/receipts
POST /inventory/transfers
POST /inventory/adjustments
```
Stock must never be changed by directly editing a quantity without creating the corresponding movement history.
---
# 43. Procurement API
```text
GET  /procurement/suppliers
POST /procurement/suppliers
GET  /procurement/purchase-requests
POST /procurement/purchase-requests
GET  /procurement/purchase-orders
POST /procurement/purchase-orders
POST /procurement/purchase-orders/:id/approve
POST /procurement/purchase-orders/:id/cancel
POST /procurement/goods-receipts
```
---
# 44. Finance API
Finance endpoints are available only when the Finance module is enabled and the user has appropriate permissions.
```text
GET  /finance/services
POST /finance/services
GET  /finance/invoices
POST /finance/invoices
GET  /finance/invoices/:id
POST /finance/invoices/:id/void
GET  /finance/payments
POST /finance/payments
POST /finance/refunds
POST /finance/refunds/:id/approve
GET /finance/reports
```
---
# 45. Insurance API
```text
GET  /insurance/providers
POST /insurance/providers
GET  /insurance/plans
POST /insurance/plans
GET  /insurance/patients/:patientId/policies
POST /insurance/patients/:patientId/policies
POST /insurance/eligibility/check
GET  /insurance/claims
POST /insurance/claims
POST /insurance/claims/:id/submit
POST /insurance/claims/:id/status
```
---
# 46. HR API
```text
GET  /hr/employees
POST /hr/employees
GET  /hr/employees/:id
PATCH /hr/employees/:id
GET  /hr/attendance
POST /hr/attendance
GET  /hr/leaves
POST /hr/leaves
POST /hr/leaves/:id/approve
POST /hr/leaves/:id/reject
GET /hr/payroll
```
---
# 47. User Management API
```text
GET    /users
POST   /users
GET    /users/:id
PATCH  /users/:id
POST   /users/:id/activate
POST   /users/:id/suspend
POST   /users/:id/disable
GET    /users/:id/roles
POST   /users/:id/roles
DELETE /users/:id/roles/:roleId
```
All operations must follow `RBAC.md`.
---
# 48. Roles API
```text
GET  /roles
POST /roles
GET  /roles/:id
PATCH /roles/:id
GET  /roles/:id/permissions
POST /roles/:id/permissions
DELETE /roles/:id/permissions/:permissionId
```
Role modifications must be audited.
---
# 49. Hospital Configuration API
```text
GET   /hospital
PATCH /hospital
GET   /hospital/settings
PATCH /hospital/settings
GET   /hospital/departments
POST  /hospital/departments
GET   /hospital/modules
PATCH /hospital/modules/:module
```
Only authorized administrators may access configuration endpoints.
---
# 50. Notifications API
```text
GET   /notifications
PATCH /notifications/:id/read
POST  /notifications/read-all
```
Notifications may be delivered through:
```text
In-App
WebSocket
Email
SMS
Push
```
depending on enabled integrations.
---
# 51. Files API
Files must not be uploaded directly into arbitrary filesystem paths.
Example:
```text
POST /files
```
The backend must:
1. Authenticate the user.
2. Validate permission.
3. Validate file type.
4. Validate file size.
5. Generate safe storage identifier.
6. Store metadata.
7. Store the file in approved object/file storage.
8. Create audit information when appropriate.
---
# 52. File Download
Example:
```text
GET /files/:id
```
The API must check:
```text
User
Tenant
Permission
Resource ownership/context
```
before returning the file.
Never expose internal storage paths.
---
# 53. File Security
Uploaded files must be treated as untrusted.
Apply:
```text
Extension validation
MIME validation
Size limits
Malware scanning where available
Safe filenames
Access control
Audit logging
```
---
# 54. Reports API
```text
GET /reports
POST /reports/generate
GET /reports/:id
POST /reports/:id/export
```
Reports must respect the permissions of the user generating them.
A user must not be able to create a report that exposes data they cannot otherwise access.
---
# 55. Audit API
```text
GET /audit-logs
GET /audit-logs/:id
```
Audit logs should generally be append-only from the application perspective.
Normal users must not be allowed to modify or delete audit events.
---
# 56. Synchronization API
The synchronization subsystem may expose internal endpoints such as:
```text
GET  /sync/status
GET  /sync/queue
GET  /sync/conflicts
POST /sync/retry
POST /sync/conflicts/:id/resolve
```
These endpoints must be highly restricted.
---
# 57. Sync Event API
Conceptual event:
```json
{
"eventId": "uuid",
"tenantId": "uuid",
"entity": "Patient",
"entityId": "uuid",
"operation": "CREATE",
"version": 1,
"occurredAt": "2026-10-01T10:00:00Z",
"payload": {}
}
```
The exact payload strategy must respect security and privacy requirements.
---
# 58. Idempotency
Important POST operations should support idempotency.
Example:
```text
Idempotency-Key: 9d4c...
```
This is particularly important for:
* Payments
* Billing
* Dispensing
* Inventory movements
* Sync events
* External integrations
If the same request is accidentally sent twice, the system should avoid creating duplicate business transactions.
---
# 59. Transactions
Critical operations must use database transactions.
Examples:
```text
Prescription Dispensing
+
Stock Reduction
```
must be atomic.
Another example:
```text
Admission
+
Bed Assignment
```
must be consistent.
Another:
```text
Payment
+
Invoice Update
+
Receipt
```
must follow an appropriate transactional workflow.
---
# 60. Concurrency Control
The API must protect against race conditions.
Example:
Two users attempt to assign the same bed simultaneously.
The backend must guarantee:
```text
Only one valid assignment
```
through:
* Database constraints
* Transactions
* Appropriate locking
* Optimistic concurrency where appropriate
---
# 61. Optimistic Concurrency
Important records may contain a version field.
Example:
```json
{
"id": "uuid",
"version": 5
}
```
Update:
```text
PATCH /patients/:id
```
may include:
```json
{
"version": 5,
"firstName": "Ahmad"
}
```
If the current version is already 6:
```text
409 Conflict
```
This prevents silent overwrites.
---
# 62. Rate Limiting
Sensitive endpoints should have rate limits.
Especially:
```text
Login
Password Reset
OTP
Search
Exports
File Upload
Public APIs
```
Limits should be configurable.
---
# 63. API Security Headers
The deployment layer should apply appropriate security headers.
Examples:
```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
```
Do not expose unnecessary server information.
---
# 64. CORS
CORS must be explicitly configured.
Do not use:
```text
Access-Control-Allow-Origin: *
```
for authenticated production APIs unless there is a documented and secure reason.
Allowed origins should come from configuration.
---
# 65. CSRF
If cookie-based authentication is used, CSRF protection must be implemented.
If bearer-token architecture is used, the overall authentication design must still protect against token theft and browser-based attacks.
Cursor must choose the final strategy consistently rather than mixing incompatible authentication models.
---
# 66. WebSocket API
WebSockets may be used for:
```text
Queue updates
Emergency status
Notifications
Bed availability
Live dashboards
Sync status
```
Example conceptual channels:
```text
/ws/notifications
/ws/queues
/ws/emergency
/ws/beds
/ws/sync
```
WebSocket connections must authenticate and authorize users.
---
# 67. Real-Time Event Example
Queue event:
```json
{
"event": "QUEUE_TICKET_CALLED",
"queueId": "uuid",
"ticketId": "uuid",
"timestamp": "2026-10-01T10:00:00Z"
}
```
Only authorized clients should receive the event.
---
# 68. Offline API Behavior
The local hospital server is the operational authority when Internet connectivity is unavailable.
Architecture:
```text
Hospital PCs
↓
Local Network
↓
Local API
↓
Local PostgreSQL
```
The system must continue supporting core operations without Internet access.
---
# 69. Cloud API Behavior
When cloud connectivity exists:
```text
Local Server
↓
Synchronization Layer
↓
Cloud API
↓
Cloud Services
```
Cloud services should not be required for basic local clinical operation.
---
# 70. Sync Conflict Handling
The API must not blindly overwrite conflicting data.
Example:
```text
Local Version: 5
Cloud Version: 6
```
If both contain different modifications:
```text
CONFLICT
```
The synchronization system must:
* Detect conflict.
* Preserve both relevant versions.
* Record conflict.
* Apply predefined rules where safe.
* Request human resolution where necessary.
---
# 71. API Logging
API logs should include:
```text
Timestamp
Request ID
User ID
Tenant ID
HTTP Method
Endpoint
Status Code
Duration
```
Avoid logging sensitive payloads unnecessarily.
Never log:
```text
Passwords
Access Tokens
Secrets
Full sensitive medical information
```
unless there is a controlled and justified mechanism.
---
# 72. Audit vs Technical Logs
These are different.
Technical log:
```text
GET /patients
200
145ms
```
Audit log:
```text
Dr. Ahmed viewed patient medical record.
```
The system needs both.
---
# 73. API Documentation
The backend should generate API documentation using:
```text
OpenAPI / Swagger
```
The documentation must include:
* Endpoints
* Authentication
* Parameters
* Request schemas
* Response schemas
* Error responses
* Permission requirements where appropriate
---
# 74. API Naming Convention
Use plural resource names.
Preferred:
```text
/patients
/appointments
/encounters
/prescriptions
/invoices
/payments
```
Avoid inconsistent names such as:
```text
/getPatient
/createPatient
/fetchPatients
```
Business actions may use action endpoints where appropriate:
```text
POST /patients/:id/merge
POST /appointments/:id/cancel
POST /lab/results/:id/approve
```
---
# 75. Database IDs
API resources should use UUIDs or approved opaque identifiers.
Example:
```text
GET /patients/550e8400-e29b-41d4-a716-446655440000
```
Human-readable business numbers may still exist:
```text
PAT-2026-000123
```
but must not replace internal primary identifiers.
---
# 76. Date and Time
API timestamps should use ISO 8601.
Example:
```text
2026-10-01T15:30:00Z
```
The backend should store timestamps consistently.
Hospital timezone should be configurable.
Frontend should display dates according to the hospital/user locale.
---
# 77. Localization
API error messages and user-facing labels should support:
```text
Arabic
English
```
The API should preferably return stable error codes while localization is handled by the client.
Example:
```json
{
"code": "PATIENT_NOT_FOUND"
}
```
The frontend translates the message.
---
# 78. API Modules
Recommended NestJS structure:
```text
apps/api/src/
│
├── auth/
├── users/
├── roles/
├── permissions/
├── hospitals/
├── departments/
├── patients/
├── appointments/
├── queues/
├── clinical/
├── emergency/
├── admissions/
├── nursing/
├── laboratory/
├── radiology/
├── pharmacy/
├── surgery/
├── blood-bank/
├── inventory/
├── procurement/
├── finance/
├── insurance/
├── hr/
├── reports/
├── files/
├── notifications/
├── audit/
├── sync/
└── common/
```
The exact structure may evolve, but domain boundaries must remain clear.
---
# 79. DTO Architecture
Each API operation should have explicit DTOs.
Example:
```text
CreatePatientDto
UpdatePatientDto
PatientResponseDto
PatientListQueryDto
```
Do not expose Prisma/database entities directly as API responses.
---
# 80. Service Architecture
Recommended:
```text
Controller
↓
Application Service
↓
Domain Logic
↓
Repository / Prisma
```
Controllers should remain thin.
Business rules should not be placed directly inside controllers.
---
# 81. Cross-Module Communication
Modules should communicate through:
```text
Domain Services
Internal APIs
Events
```
Avoid arbitrary direct manipulation of another module's tables.
Example:
Pharmacy should not directly update inventory tables without using the Inventory domain service.
Correct:
```text
Pharmacy
↓
Dispensing Service
↓
Inventory Service
↓
Stock Movement
```
---
# 82. Event-Driven Operations
Certain operations should emit domain events.
Examples:
```text
PatientCreated
AppointmentBooked
EncounterCompleted
LabResultApproved
PrescriptionDispensed
StockAdjusted
InvoiceCreated
PaymentReceived
AdmissionCreated
PatientDischarged
```
Events may be consumed by:
* Notifications
* Reporting
* Synchronization
* Audit
* Analytics
---
# 83. API Events Must Be Reliable
Events that affect critical workflows must not be silently lost.
Use:
```text
Transactional Outbox
```
or an equivalent reliable event mechanism.
Example:
```text
Database Transaction
├── Business Data
└── Outbox Event
↓
Event Worker
↓
Redis/BullMQ
↓
Consumers
```
---
# 84. Background Jobs
Use background jobs for operations such as:
```text
Email
SMS
Notifications
Report generation
File processing
Sync
Data exports
Backup tasks
```
Do not make long-running tasks block ordinary API requests unnecessarily.
---
# 85. API Health Endpoints
Provide controlled health endpoints.
Example:
```text
GET /health
GET /health/ready
GET /health/live
```
Health checks may verify:
```text
API
Database
Redis
Storage
Sync service
```
Do not expose sensitive infrastructure information publicly.
---
# 86. Readiness vs Liveness
Liveness:
```text
Is the process running?
```
Readiness:
```text
Can this instance serve requests?
```
These should be separate.
---
# 87. API Monitoring
Monitor:
```text
Request rate
Error rate
Latency
Database latency
Queue depth
Background job failures
Sync failures
Authentication failures
```
Critical alerts should be configurable.
---
# 88. API Performance
The API should:
* Use database indexes.
* Avoid N+1 queries.
* Paginate large results.
* Select only required fields.
* Cache appropriate read-heavy data.
* Use Redis where justified.
* Avoid loading entire patient histories unnecessarily.
Performance optimizations must not weaken authorization.
---
# 89. Sensitive API Responses
Do not return more information than the client needs.
For example, a receptionist's patient response should not include:
```text
Private clinical notes
Full laboratory history
Sensitive diagnoses
Internal administrative information
```
unless explicitly authorized.
Use role/context-specific response shaping where appropriate.
---
# 90. API Permissions
Each endpoint must map to one or more permissions.
Example:
```text
POST /patients
↓
patient.create
```
```text
POST /lab/results/:id/approve
↓
lab.result.approve
```
```text
POST /finance/refunds/:id/approve
↓
payment.refund.approve
```
This mapping should be documented and testable.
---
# 91. Public API
If future external integrations are required, create a separate controlled API surface.
Example:
```text
/api/v1/integrations
```
Do not expose internal administrative endpoints to external clients.
External integrations must use:
* Scoped credentials
* API keys or OAuth where appropriate
* Rate limits
* Audit logs
* Tenant restrictions
* Versioning
---
# 92. Integration Examples
Potential integrations:
```text
PACS
Laboratory analyzers
Payment providers
Insurance systems
SMS providers
Email providers
National health systems
External pharmacies
Identity providers
```
Each integration must have its own adapter/service.
Do not spread vendor-specific code throughout the application.
---
# 93. API Testing
Every module should include:
### Unit Tests
Business logic.
### Integration Tests
Database + services.
### E2E Tests
Real API workflows.
### Authorization Tests
Allowed and denied users.
### Tenant Isolation Tests
Cross-hospital access.
### Security Tests
Authentication, validation, rate limiting, file upload, etc.
---
# 94. Critical E2E Scenarios
At minimum test:
```text
Patient Registration
Appointment Booking
Check-in
Doctor Encounter
Diagnosis
Prescription
Pharmacy Dispensing
Stock Reduction
Lab Order
Sample Collection
Result Entry
Result Approval
Radiology Order
Study
Report
Approval
Emergency Registration
Triage
Treatment
Disposition
Admission
Bed Assignment
Transfer
Discharge
Invoice
Payment
Receipt
Insurance Claim
Local Offline Operation
Synchronization
Conflict Handling
```
---
# 95. API Development Order
Cursor should implement APIs incrementally.
Recommended order:
```text
Phase 1
Authentication
Users
Roles
Permissions
Hospitals
Departments
Phase 2
Patients
Appointments
Queues
Phase 3
Clinical
Emergency
Admissions
Nursing
Phase 4
Laboratory
Radiology
Phase 5
Pharmacy
Inventory
Phase 6
Surgery
Blood Bank
Phase 7
Procurement
Phase 8
Finance
Insurance
Phase 9
HR
Reports
Phase 10
Sync
Integrations
Advanced analytics
```
Do not attempt to implement every endpoint in one operation.
---
# 96. API Implementation Rule
For every module:
```text
Database
↓
Domain Model
↓
Validation
↓
Service
↓
Authorization
↓
Controller
↓
API Documentation
↓
Tests
```
A module is not complete when only its controller exists.
---
# 97. Cursor Instructions
Before writing API code, Cursor must:
1. Read all previous project documents.
2. Inspect the existing repository.
3. Identify existing API architecture.
4. Identify conflicts with this document.
5. Propose an implementation plan.
6. Do not replace working architecture without approval.
7. Build one module at a time.
8. Create DTOs.
9. Create validation.
10. Implement authorization.
11. Implement tenant isolation.
12. Implement service/business logic.
13. Implement database access.
14. Add tests.
15. Add Swagger/OpenAPI documentation.
16. Update project documentation.
17. Run linting and type checks.
18. Run relevant tests.
19. Report what was implemented.
20. Stop and ask before major architectural changes.
---
# 98. Definition of API Completion
An API module is considered complete only when it has:
```text
✓ Endpoints
✓ DTOs
✓ Validation
✓ Authorization
✓ Tenant isolation
✓ Business logic
✓ Database integration
✓ Error handling
✓ Audit requirements
✓ Transaction handling where needed
✓ Tests
✓ OpenAPI documentation
✓ Security review
```
---
# 99. Final API Architecture
The final conceptual architecture:
```text
WEB CLIENT
│
▼
NEXT.JS FRONTEND
│
▼
REST API / WS
│
▼
AUTHENTICATION LAYER
│
▼
TENANT + RBAC LAYER
│
▼
API CONTROLLERS
│
▼
APPLICATION SERVICES
│
┌─────────────┼─────────────┐
▼             ▼             ▼
CLINICAL      FINANCE       INVENTORY
│             │             │
└─────────────┼─────────────┘
▼
DOMAIN SERVICES
│
▼
PRISMA
│
▼
POSTGRESQL
│
┌──────────┴──────────┐
▼                     ▼
REDIS                STORAGE
│
▼
BACKGROUND JOBS
│
▼
SYNC / INTEGRATIONS
```
---
# 100. Final Principle
The API is not simply a collection of CRUD endpoints.
It is the controlled business layer of the Hospital Information System.
Every operation must respect:
```text
Authentication
+
Authorization
+
Tenant Isolation
+
Validation
+
Business Rules
+
Transactions
+
Audit
+
Security
+
Offline Requirements
+
Synchronization
```
Cursor must treat this document together with:
```text
HOSPITAL_SYSTEM_MASTER_SPEC.md
DATABASE_SCHEMA.md
MODULES.md
RBAC.md
```
as the authoritative project specification.
Any major deviation must be identified and proposed before implementation.
