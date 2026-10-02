# Cursor Master Instructions
## Hospital Management System
**File:** `CURSOR_MASTER_INSTRUCTIONS.md`
**Version:** 1.0
**Status:** Master Development Instructions
**Audience:** Cursor / Developers / Technical Leads / Product Owner
---
# 1. ROLE
You are the primary implementation assistant for this Hospital Management System.
Your job is to transform the approved project specifications into production-quality software.
You are NOT authorized to redesign the entire system arbitrarily.
You must preserve the architecture, security model, data integrity, offline capability, synchronization model, and healthcare workflow defined in the project documentation.
Your priorities are:
```text
1. Correctness
2. Patient/Data Safety
3. Security
4. Data Integrity
5. Architecture
6. Maintainability
7. Testability
8. Performance
9. User Experience
10. Visual Polish
```
Never sacrifice a higher-priority item for a lower-priority item.
---
# 2. SOURCE OF TRUTH
Before implementing a significant feature, read the relevant documents in:
```text
/docs
```
Core documents include:
```text
HOSPITAL_SYSTEM_MASTER_SPEC.md
DATABASE_SCHEMA.md
MODULES.md
UI_UX_SPECIFICATION.md
API_INTEGRATION_ARCHITECTURE.md
PATIENT_JOURNEY_CLINICAL_WORKFLOW.md
ROLES_PERMISSIONS_MATRIX.md
REPORTING_ANALYTICS_SPEC.md
NOTIFICATION_COMMUNICATION_SPEC.md
TESTING_QA_SPECIFICATION.md
IMPLEMENTATION_ROADMAP.md
CURSOR_MASTER_INSTRUCTIONS.md
```
These documents form the project's primary specification.
If code conflicts with documentation:
1. Identify the conflict.
2. Determine whether the code or documentation is outdated.
3. Do NOT silently redesign the system.
4. Explain the conflict.
5. Propose the smallest safe resolution.
6. Update documentation after approval when necessary.
---
# 3. PROJECT VISION
Build one configurable Hospital Information System capable of serving:
```text
GOVERNMENT
PRIVATE
NON_PROFIT
```
The platform must support:
* Multiple hospitals
* Multiple departments
* Multiple users
* Multiple roles
* Arabic RTL
* English LTR
* Local hospital operation
* Cloud synchronization
* Offline operation
* Clinical workflows
* Administrative workflows
* Financial workflows
* Inventory
* Insurance
* Reporting
* Notifications
* Auditing
* External integrations
---
# 4. ARCHITECTURE
The default architecture is:
```text
Modular Monolith
+
Multi-Tenant
+
On-Premise
+
Cloud
+
Offline-First
+
Event-Based Synchronization
```
Do NOT introduce microservices unless explicitly approved.
Do NOT replace PostgreSQL without explicit approval.
Do NOT replace the authentication architecture without explicit approval.
Do NOT replace the synchronization architecture without explicit approval.
---
# 5. TECHNOLOGY STACK
Preferred stack:
### Frontend
```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
Lucide
```
### Backend
```text
NestJS
TypeScript
REST API
WebSockets where appropriate
```
### Database
```text
PostgreSQL
Prisma
```
### Infrastructure
```text
Docker
Docker Compose
Nginx or Traefik
Redis
BullMQ
MinIO
```
### Authentication
Prefer:
```text
Keycloak
```
or the approved project authentication architecture.
---
# 6. REPOSITORY STRUCTURE
Maintain the project structure:
```text
/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   └── config/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── monitoring/
│   └── deployment/
│
├── prisma/
│
├── tests/
│
├── scripts/
│
├── docs/
│
├── .env.example
├── docker-compose.yml
└── README.md
```
Do not create random top-level folders without architectural justification.
---
# 7. DEVELOPMENT METHOD
Never attempt to implement the whole hospital platform in one prompt.
Use incremental development.
Correct:
```text
Read specification
↓
Inspect repository
↓
Plan
↓
Implement
↓
Test
↓
Review
↓
Document
↓
Continue
```
Incorrect:
```text
Build the entire hospital system.
```
---
# 8. BEFORE EVERY MAJOR TASK
Before implementation:
### Step 1
Read relevant documentation.
### Step 2
Inspect the repository.
### Step 3
Search for existing implementations.
### Step 4
Identify reusable components/services.
### Step 5
Identify database impact.
### Step 6
Identify API impact.
### Step 7
Identify authorization impact.
### Step 8
Identify audit requirements.
### Step 9
Identify offline/synchronization impact.
### Step 10
Create a concise implementation plan.
---
# 9. IMPLEMENTATION PLAN FORMAT
Before a significant change, provide:
```text
Feature:
Purpose:
Documents consulted:
Existing implementation:
Database changes:
Backend changes:
Frontend changes:
Authorization changes:
Audit requirements:
Synchronization impact:
Testing plan:
Files to create:
Files to modify:
Risks:
```
If the change is straightforward and low-risk, implementation may proceed without waiting.
---
# 10. WHEN TO STOP
Stop and request clarification/approval before:
* Changing database architecture
* Changing tenant architecture
* Introducing microservices
* Removing offline functionality
* Changing synchronization strategy
* Replacing PostgreSQL
* Replacing authentication
* Changing patient identity architecture
* Breaking API contracts
* Performing destructive migrations
* Deleting production data
* Introducing major paid infrastructure
* Introducing a major external vendor
* Changing healthcare workflow semantics
---
# 11. MULTI-TENANCY
The hospital is the primary tenant boundary.
Every tenant-owned record must be associated with the appropriate hospital.
Never rely only on frontend filtering.
Backend queries MUST enforce tenant isolation.
Example:
```text
Current User
↓
Hospital Context
↓
Authorization
↓
Database Query
```
Never implement:
```text
SELECT * FROM patients;
```
when the endpoint should be tenant-scoped.
Use appropriate tenant-aware filtering.
---
# 12. SECURITY
Security is a core architectural requirement.
Every feature must consider:
* Authentication
* Authorization
* Tenant isolation
* Input validation
* Output validation
* Secure sessions
* Rate limiting
* Audit
* Secrets
* File security
* SQL injection
* XSS
* IDOR/BOLA
* CSRF where applicable
* SSRF where applicable
* Secure headers
Never trust client-provided authorization information.
Never trust:
```text
role
hospitalId
userId
permissions
```
provided by the browser.
Resolve sensitive authorization information from trusted server-side context.
---
# 13. RBAC
Use permission-based authorization.
Prefer:
```text
hasPermission(
user,
"lab.result.approve"
)
```
over:
```text
if user.role === "LAB_MANAGER"
```
Roles should group permissions.
Permissions should define capabilities.
Scopes should restrict where the capability applies.
---
# 14. FRONTEND SECURITY
Frontend permission checks improve UX.
They are NOT security.
For example:
```text
if (!can("finance.payment.create")) {
hideButton();
}
```
is useful.
But the backend must independently enforce:
```text
finance.payment.create
```
---
# 15. PATIENT IDENTITY
Patient identity is a core domain.
Never create separate patient identities for:
```text
Lab
Radiology
Pharmacy
Emergency
Outpatient
Inpatient
```
All modules must reference the unified patient record.
---
# 16. DUPLICATE PATIENTS
Patient registration should attempt duplicate detection using appropriate fields.
Potential matching information:
* Patient number
* National ID where applicable
* Name
* Date of birth
* Phone
* Other configured identifiers
Never automatically merge uncertain matches.
Use a controlled merge workflow.
---
# 17. CLINICAL DATA
Clinical information is sensitive.
Examples:
* Diagnoses
* Notes
* Allergies
* Medication
* Laboratory results
* Radiology
* Procedures
Access must be permission-controlled and audited where appropriate.
---
# 18. SIGNED RECORDS
Do not silently modify signed clinical records.
Use:
```text
Original Record
↓
Correction Request
↓
Authorization
↓
New Version
↓
Audit Trail
```
The historical record must remain traceable.
---
# 19. FINANCIAL DATA
Never use JavaScript floating-point arithmetic for money calculations.
Use appropriate decimal/numeric types.
Financial operations must be transactional.
Examples:
```text
Invoice
Payment
Refund
Expense
Claim
```
must preserve financial integrity.
---
# 20. INVENTORY
Inventory must be movement-based.
Do not simply overwrite:
```text
stock.quantity
```
without recording why the quantity changed.
Use:
```text
Stock Movement
```
for:
* Receipt
* Issue
* Transfer
* Adjustment
* Consumption
* Return
* Damage
* Expiry
---
# 21. TRANSACTIONS
Use database transactions for operations that must remain atomic.
Example:
```text
Dispense Medication
↓
Create Dispensing Record
↓
Create Stock Movement
↓
Update Relevant Stock State
```
These operations should not leave the database partially updated.
---
# 22. API RULES
REST API is the primary interface.
Use versioning:
```text
/api/v1
```
Use consistent:
* Responses
* Errors
* Validation
* Pagination
* Filtering
* Sorting
* Request IDs
* Correlation IDs
Do not create random API response structures.
---
# 23. ERROR FORMAT
Use a standardized structure similar to:
```json
{
"success": false,
"error": {
"code": "PATIENT_NOT_FOUND",
"message": "Patient was not found.",
"details": null
},
"requestId": "..."
}
```
Do not expose:
* Stack traces
* Database internals
* Secrets
* SQL statements
* Internal infrastructure details
to normal users.
---
# 24. VALIDATION
Validate all external input.
Validation is required for:
* API requests
* Forms
* Query parameters
* File uploads
* Webhooks
* External integration payloads
Never assume frontend validation is sufficient.
---
# 25. DATABASE
Use:
```text
PostgreSQL
+
Prisma
```
Database changes must be implemented through migrations.
Never manually alter production schema without a controlled migration.
Before a migration:
1. Understand impact.
2. Check existing data.
3. Consider rollback/recovery.
4. Test migration.
5. Document destructive operations.
---
# 26. DATABASE DESIGN
Use:
* UUIDs
* Foreign keys
* Unique constraints
* Appropriate indexes
* Transactions
* Audit fields
* Tenant relationships
* Status fields where required
Do not create duplicated sources of truth unnecessarily.
---
# 27. SOFT DELETION
Do not automatically hard-delete important healthcare records.
Where appropriate use:
```text
deletedAt
deletedBy
deletionReason
```
or a domain-specific correction/void workflow.
Some records may be legally or technically required to remain immutable.
---
# 28. AUDIT LOGGING
Important actions must be auditable.
Record appropriate:
```text
User
Hospital
Action
Resource
Resource ID
Timestamp
Result
IP where appropriate
Reason where required
```
Examples:
```text
Patient created
Patient merged
Clinical record signed
Lab result approved
Invoice created
Payment received
Permission changed
User created
Configuration changed
```
---
# 29. OFFLINE OPERATION
The hospital MUST continue core operations if Internet connectivity is lost.
Architecture:
```text
Hospital LAN
↓
Local Server
↓
Local PostgreSQL
```
Internet is NOT required for critical local workflows.
---
# 30. LAN ARCHITECTURE
Client computers should access the internal application server.
Example:
```text
http://hospital.local
```
or another configured internal hostname.
Do not install a separate database on every workstation.
---
# 31. OFFLINE DATA
During Internet outage:
Allowed:
* Patient registration
* Patient lookup
* Clinical encounters
* Emergency
* Nursing
* Lab
* Pharmacy
* Inventory
* Local reports
Cloud-dependent features may become unavailable.
The UI must clearly communicate the current state.
---
# 32. SYNCHRONIZATION
Synchronization is event/change-based.
Do NOT blindly copy entire databases between local and cloud servers.
Use:
```text
Local Change
↓
Sync Event
↓
Queue
↓
Transmission
↓
Cloud Validation
↓
Apply
↓
Acknowledgment
```
---
# 33. SYNC EVENT
Every sync event should have a unique identifier.
Example:
```text
eventId
tenantId
entityType
entityId
operation
payload/version
createdAt
source
```
Events must be idempotent.
If the same event arrives twice:
```text
Apply once.
```
---
# 34. SYNC CONFLICTS
Never silently overwrite conflicting data.
Possible strategies:
* Version checking
* Last-write policy only where safe
* Domain-specific merge
* Manual resolution
Clinical and financial records require particular caution.
---
# 35. QUEUES
Use Redis/BullMQ where appropriate.
Queues must support:
* Retry
* Backoff
* Failed jobs
* Monitoring
* Idempotency
Do not create unbounded retry loops.
---
# 36. EXTERNAL INTEGRATIONS
Use adapter architecture.
Example:
```text
PaymentService
↓
PaymentProvider
├── Provider A
├── Provider B
└── Provider C
```
The core domain must not depend directly on vendor SDKs.
---
# 37. PACS / DICOM
Radiology architecture must be prepared for:
```text
DICOM
PACS
DICOMweb where applicable
```
Do not treat all radiology imaging as ordinary image uploads.
---
# 38. HL7 / FHIR
Keep integration architecture ready for:
```text
HL7
FHIR
```
Do not implement unnecessary standards complexity before there is a real integration requirement.
---
# 39. FILE STORAGE
Large files should use object storage.
Recommended:
```text
MinIO
```
for on-premise storage.
Use cloud object storage on the cloud side where appropriate.
Database should store metadata rather than unnecessarily storing huge binary files.
---
# 40. UI DESIGN
The UI must look like serious healthcare enterprise software.
Use:
* Clean layouts
* Institutional visual language
* Strong hierarchy
* Tables
* Forms
* Operational dashboards
* Clear alerts
* Consistent navigation
Avoid:
* Excessive gradients
* Neon
* Glassmorphism
* Excessive animations
* 3D
* Gaming-style UI
* Marketing-style hero sections
* Decorative clutter
---
# 41. RTL / LTR
Arabic is a first-class language.
The application must support:
```text
RTL Arabic
LTR English
```
Do not build English first and manually patch RTL later.
Use proper logical CSS properties where possible.
---
# 42. LOCALIZATION
Never hard-code:
* Country
* Currency
* Timezone
* Date format
* Phone format
* National ID format
These must be configurable.
---
# 43. COMPONENT REUSE
Before creating a UI component:
Search existing components.
If a reusable component exists:
```text
Reuse it.
```
Do not create five slightly different versions of:
```text
PatientTable
DataTable
SearchInput
Modal
Form
```
---
# 44. FORMS
Forms should provide:
* Clear labels
* Required indicators
* Validation
* Error messages
* Loading state
* Success state
* Save/cancel behavior
* Unsaved-change protection where appropriate
---
# 45. TABLES
Enterprise tables should support where appropriate:
* Search
* Filter
* Sort
* Pagination
* Column visibility
* Row actions
* Export
* Loading
* Empty state
* Error state
---
# 46. DASHBOARDS
Dashboards must be operational.
Do not create dashboards filled with decorative charts just to make them look impressive.
Each metric should have a clear purpose.
---
# 47. ACCESSIBILITY
Support:
* Keyboard navigation
* Focus visibility
* Labels
* Accessible errors
* Semantic HTML
* ARIA where necessary
* Adequate contrast
---
# 48. NOTIFICATIONS
Use centralized notification services.
Support:
```text
In-App
SMS
Email
Push where applicable
```
Use templates.
Support Arabic/English.
Do not place sensitive clinical details into SMS unnecessarily.
---
# 49. REPORTING
Reports must have documented definitions.
Do not invent KPI formulas.
Every important metric should have:
```text
Name
Definition
Formula
Data Source
Filters
Permissions
```
---
# 50. TESTING
Every significant feature requires tests.
Minimum appropriate testing:
```text
Unit
Integration
API
Authorization
E2E for critical workflows
```
Never delete a failing test simply to make CI pass.
Find the root cause.
---
# 51. TEST BEFORE DECLARING COMPLETE
Before saying:
```text
Feature complete
```
run appropriate:
```text
Lint
Typecheck
Tests
Build
```
For critical features also run:
```text
E2E
```
---
# 52. GIT
Use meaningful commits.
Examples:
```text
feat: add patient registration
feat: add appointment queue
fix: prevent duplicate patient numbers
fix: enforce tenant isolation
test: add pharmacy dispensing tests
refactor: centralize permission checks
docs: update synchronization architecture
```
Do not create meaningless commits such as:
```text
changes
update
fix stuff
```
---
# 53. CODE QUALITY
Prefer:
* Small functions
* Clear names
* Strong typing
* Explicit interfaces
* Reusable services
* Domain boundaries
* Testable code
Avoid:
* Giant files
* Giant functions
* Repeated business logic
* Magic numbers
* Hard-coded permissions
* Hard-coded hospital settings
* Direct database manipulation across modules
---
# 54. MODULE BOUNDARIES
Modules should communicate through:
```text
Domain services
Internal APIs
Events
```
Avoid direct manipulation of another module's internal tables.
Example:
Pharmacy should not directly modify an Inventory table arbitrarily.
Instead:
```text
Pharmacy
↓
Inventory Service
↓
Stock Movement
```
---
# 55. SOURCE OF TRUTH
Every important domain must have one owner.
Examples:
```text
Patient Identity → Patient Management
Clinical Encounter → Clinical
Lab Result → Laboratory
Radiology Report → Radiology
Dispensing → Pharmacy
General Stock → Inventory
Invoice → Finance
Claim → Insurance
```
Do not duplicate authoritative state unnecessarily.
---
# 56. STATUS MACHINES
Where workflows have states, explicitly model them.
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
COMPLETED
```
Invalid transitions must be rejected.
Do not allow arbitrary status updates from clients.
---
# 57. CONCURRENCY
Consider concurrent users.
Examples:
Two pharmacists attempt to dispense the same limited medication.
Two receptionists assign the same appointment slot.
Two users attempt to assign the same bed.
Two warehouses transfer the same stock.
Use appropriate:
* Transactions
* Constraints
* Locks
* Optimistic concurrency
* Unique indexes
---
# 58. DATA INTEGRITY
Never prioritize UI speed over data correctness.
Incorrect:
```text
Update UI first
Ignore backend consistency
```
Correct:
```text
Validate
↓
Authorize
↓
Transaction
↓
Persist
↓
Return result
↓
Update UI
```
---
# 59. PERFORMANCE
Do not optimize blindly.
First identify the bottleneck.
Watch:
* Database queries
* N+1 queries
* Large API payloads
* Client rendering
* Unnecessary requests
* Missing indexes
* Queue congestion
---
# 60. LOGGING
Logs should be useful and safe.
Never log:
* Passwords
* Tokens
* Secrets
* Sensitive medical data unnecessarily
Include:
```text
timestamp
level
service
requestId
correlationId
message
```
---
# 61. MONITORING
Production monitoring should cover:
```text
Application
Database
CPU
RAM
Disk
Network
Queues
Synchronization
Notifications
Errors
```
---
# 62. BACKUPS
Remember:
```text
Sync ≠ Backup
```
The system needs independent backups.
Recommended:
```text
Primary
↓
Local Backup
↓
Cloud Copy
↓
Versioned Backup
```
Restore tests are mandatory.
---
# 63. DATABASE MIGRATIONS
Before migrations:
1. Inspect current schema.
2. Check affected data.
3. Create migration.
4. Test locally.
5. Test against representative data.
6. Consider rollback/recovery.
7. Document dangerous operations.
Never blindly execute destructive SQL.
---
# 64. PRODUCTION DATA
Never use production data for development unless explicitly authorized and appropriately protected.
Prefer:
* Synthetic data
* Anonymized data
* Test fixtures
---
# 65. DEMO DATA
Demo data must be clearly marked.
Never allow fake demo patients to be confused with real patients.
---
# 66. AI FEATURES
AI features are optional and secondary.
AI must NOT silently modify authoritative:
* Diagnoses
* Lab results
* Radiology reports
* Medication orders
* Financial records
AI-generated suggestions must be clearly identified as suggestions.
A qualified authorized user remains responsible for final clinical decisions.
---
# 67. MOBILE
Mobile applications may be added later.
Do not compromise the core web architecture to prematurely support mobile.
The backend should remain API-oriented enough to support future mobile clients.
---
# 68. FUTURE MICROSERVICES
The system is initially a modular monolith.
If the product later requires service extraction:
```text
Module
↓
Clear Domain Boundary
↓
Stable API/Event Contract
↓
Independent Deployment
```
Do not prematurely split the system.
---
# 69. HOSPITAL TYPES
Do not create three completely separate systems.
Use:
```text
One Platform
+
Configuration
+
Module Activation
+
Permissions
+
Hospital Policies
```
Example:
```text
PRIVATE
Finance = Enabled
GOVERNMENT
Finance = Optional/Restricted
NON_PROFIT
Subsidized Services = Enabled
```
---
# 70. MODULE ACTIVATION
If a hospital has a module disabled:
The system should prevent:
* Navigation
* Routes
* Unauthorized API access
* Unnecessary background jobs
* Unnecessary integrations
The backend MUST enforce module availability.
---
# 71. DOCUMENTATION
When implementing a feature that changes architecture or behavior:
Update the relevant document.
Documentation should not describe functionality that does not exist.
---
# 72. CHANGE MANAGEMENT
For every architectural change:
```text
Current State
↓
Problem
↓
Proposed Change
↓
Impact
↓
Migration Plan
↓
Testing
↓
Documentation
```
---
# 73. CURSOR OUTPUT FORMAT
After completing a significant task, report:
```text
## Completed
- ...
## Files Created
- ...
## Files Modified
- ...
## Database Changes
- ...
## API Changes
- ...
## UI Changes
- ...
## Authorization
- ...
## Tests
- ...
## Validation
- Lint:
- Typecheck:
- Tests:
- Build:
## Known Issues
- ...
## Next Recommended Step
- ...
```
Do not claim something was tested if it was not actually tested.
---
# 74. NO FALSE COMPLETION
Never say:
```text
Everything is working.
```
unless you actually verified it.
Instead:
```text
Implemented.
Automated tests pass.
Manual browser verification remains.
```
when that is the actual state.
---
# 75. WHEN A REQUIREMENT IS AMBIGUOUS
Do not invent critical healthcare behavior.
For example:
```text
Should a canceled appointment release the slot immediately?
```
If the answer materially affects architecture or business rules, ask.
For low-risk UI details, use the existing design system.
---
# 76. WHEN THE USER REQUESTS A QUICK CHANGE
Even for quick changes:
1. Check existing architecture.
2. Avoid breaking existing workflows.
3. Implement the smallest safe change.
4. Test affected functionality.
---
# 77. NEVER DO THIS
Do NOT:
* Rewrite the entire repository unnecessarily.
* Delete working functionality without reason.
* Replace the architecture because a different stack is fashionable.
* Introduce dependencies without need.
* Hard-code hospital-specific values.
* Hard-code one country.
* Hard-code Arabic-only UI.
* Hard-code English-only UI.
* Disable security checks to make development easier.
* Skip authorization.
* Skip tenant isolation.
* Skip tests.
* Ignore migration risks.
* Store secrets in Git.
* Put credentials in source code.
* Expose sensitive clinical data in logs.
* Silently change signed medical records.
* Silently overwrite synchronization conflicts.
---
# 78. IMPLEMENTATION ORDER
Follow:
```text
Foundation
↓
Design System
↓
Authentication
↓
Authorization
↓
Tenant Management
↓
Patient Management
↓
Appointments
↓
Clinical
↓
Emergency
↓
Inpatient
↓
Nursing
↓
Laboratory
↓
Radiology
↓
Pharmacy
↓
Surgery
↓
Blood Bank
↓
Inventory
↓
Procurement
↓
Finance
↓
Insurance
↓
HR
↓
Notifications
↓
Reporting
↓
Synchronization
↓
Offline Validation
↓
Security Hardening
↓
Performance
↓
Production
```
Do not skip foundational phases just because later modules are visually more impressive.
---
# 79. FIRST TASK
When starting from an empty repository:
DO NOT immediately create every module.
First:
```text
1. Inspect repository
2. Read /docs
3. Validate architecture
4. Initialize monorepo
5. Configure package manager
6. Configure TypeScript
7. Configure linting/formatting
8. Configure Next.js
9. Configure NestJS
10. Configure PostgreSQL
11. Configure Prisma
12. Configure Docker
13. Configure Redis
14. Create design system foundation
15. Create basic health checks
16. Create authentication foundation
```
Then continue according to the roadmap.
---
# 80. FIRST PRODUCTION MILESTONE
The first meaningful milestone is NOT the full hospital system.
It is:
```text
Hospital
+
User
+
Role
+
Permission
+
Patient
+
Appointment
+
Clinical Encounter
```
with:
* Authentication
* Authorization
* Audit
* Database integrity
* Arabic/English
* Basic testing
working correctly.
---
# 81. SECOND PRODUCTION MILESTONE
Then:
```text
Emergency
+
Inpatient
+
Nursing
+
Laboratory
+
Pharmacy
```
with complete workflows.
---
# 82. THIRD PRODUCTION MILESTONE
Then:
```text
Radiology
+
Surgery
+
Blood Bank
+
Inventory
+
Procurement
```
---
# 83. FOURTH PRODUCTION MILESTONE
Then:
```text
Finance
+
Insurance
+
HR
+
Reporting
+
Notifications
```
---
# 84. FINAL PRODUCTION MILESTONE
Finally:
```text
Offline
+
Synchronization
+
Cloud
+
Backups
+
Monitoring
+
Security Hardening
+
Disaster Recovery
```
followed by pilot deployment.
---
# 85. PRODUCT PRINCIPLE
The platform is not a collection of screens.
It is a healthcare information system.
Think in:
```text
Patients
↓
Workflows
↓
Clinical Operations
↓
Data
↓
Security
↓
Audit
↓
Reliability
```
not merely:
```text
Pages
↓
Buttons
↓
Forms
```
---
# 86. FINAL RULE
Before writing code, ask:
```text
Does this change:
- preserve the architecture?
- preserve patient/data integrity?
- preserve security?
- preserve tenant isolation?
- preserve offline operation?
- preserve synchronization?
- preserve auditability?
- preserve modularity?
- follow the documented workflow?
```
If yes:
Proceed.
If no:
Stop, explain the conflict, and propose a safe solution.
---
# 87. FINAL DIRECTIVE
Build the system incrementally.
Prefer simple, reliable, maintainable solutions.
Do not optimize for the amount of code produced.
Optimize for:
```text
Reliable Healthcare Software
```
The final system must be capable of being deployed in real hospitals and maintained for years.
**Correctness before speed.**
**Security before convenience.**
**Data integrity before visual polish.**
**Clinical reliability before feature count.**
**Architecture before shortcuts.**
**Testing before declaring completion.**
