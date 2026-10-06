# Hospital Management System
## Implementation Roadmap
**Document:** `docs/IMPLEMENTATION_ROADMAP.md`
**Version:** 1.0
**Status:** Authoritative Implementation Plan
---
# 1. Purpose
This document defines the implementation sequence for building the Hospital Management System from an empty repository to a production-ready hospital platform.
The system MUST be developed incrementally.
Cursor MUST NOT attempt to generate the entire platform in one operation.
---
# 2. Development Strategy
Use:
```text
Architecture
↓
Foundation
↓
Infrastructure
↓
Authentication
↓
Multi-Tenancy
↓
Core Patient
↓
Clinical
↓
Diagnostics
↓
Treatment
↓
Operations
↓
Finance/Insurance
↓
Reports
↓
Notifications
↓
Sync
↓
Testing
↓
Production
```
---
# 3. Phase 0 — Repository Initialization
Create:
```text
apps/
packages/
infrastructure/
docs/
prisma/
tests/
scripts/
```
Create:
```text
README.md
.env.example
docker-compose.yml
```
Configure:
* Git
* TypeScript
* ESLint
* Prettier
* pnpm
* Environment configuration
---
# 4. Phase 1 — Monorepo Foundation
Implement:
```text
apps/web
apps/api
packages/ui
packages/types
packages/validation
packages/config
```
Configure:
* Next.js
* NestJS
* Tailwind
* shadcn/ui
* Prisma
* PostgreSQL
---
# 5. Phase 2 — Infrastructure
Implement Docker services:
```text
PostgreSQL
Redis
MinIO
Nginx/Traefik
```
Optional development services:
```text
Mail testing
Monitoring
Logs
```
---
# 6. Phase 3 — Authentication & Authorization
Renumbered 2026-10-06 (ADP-006 / P3-D0): the former Phase 4 (Authentication) and Phase 5
(Authorization) are implemented together as Phase 3, before the Design System. Only minimal
authentication/administration UI is built in this phase.
Authentication:
* Login
* Logout
* Session management
* Password handling
* MFA-ready architecture
* Admin-initiated password reset (self-service reset requires Notifications)
* User status
* Account lockout controls
Authorization:
* Users
* Roles
* Permissions
* Scopes
* Tenant isolation
* Department scope
* Audit
Use the permission architecture from:
```text
RBAC.md
ROLES_PERMISSIONS_MATRIX.md
AUTHENTICATION_AUTHORIZATION.md
```
---
# 7. Phase 4 — Design System
Before building modules, create:
* Colors
* Typography
* Spacing
* Buttons
* Inputs
* Selects
* Tables
* Dialogs
* Drawers
* Alerts
* Toasts
* Badges
* Navigation
* Breadcrumbs
* Pagination
Support:
```text
Arabic RTL
English LTR
```
---
# 8. Phase 5 — Hospital/Tenant Management
Implement:
* Hospitals
* Hospital settings
* Hospital type
* Departments
* Locations
* Module activation
* Branding
* Localization
* Timezone
* Currency
* Number formats
Hospital types:
```text
GOVERNMENT
PRIVATE
NON_PROFIT
```
---
# 9. Phase 6 — Core Patient Management
Implement:
* Patient registration
* Patient number
* Search
* Duplicate detection
* Demographics
* Contacts
* Documents
* Patient timeline
* Patient summary
* Merge workflow
This is the central foundation.
---
# 10. Phase 7 — Reception & Appointments
Implement:
* Appointment types
* Schedules
* Doctor availability
* Booking
* Rescheduling
* Cancellation
* Check-in
* Queue
* Waiting room
---
# 11. Phase 8 — Clinical Core
Implement:
* Encounters
* Clinical notes
* Vitals
* Diagnoses
* Allergies
* Medications
* Orders
* Clinical timeline
* Follow-up
* Referrals
---
# 12. Phase 9 — Emergency
Implement:
* Emergency registration
* Triage
* Emergency queue
* Assessment
* Treatment
* Orders
* Disposition
* Admission
* Transfer
* Referral
* Discharge
---
# 13. Phase 10 — Inpatient
Implement:
* Wards
* Rooms
* Beds
* Admission
* Bed assignment
* Transfer
* Discharge
* Inpatient timeline
---
# 14. Phase 11 — Nursing
Implement:
* Nursing assignments
* Vitals
* Nursing notes
* Tasks
* Care plans
* Medication administration
* Handover
---
# 15. Phase 12 — Laboratory
Implement:
* Lab catalog
* Lab orders
* Samples
* Processing
* Results
* Review
* Approval
* Critical results
* Printing
---
# 16. Phase 13 — Radiology
Implement:
* Radiology catalog
* Orders
* Scheduling
* Studies
* PACS integration
* DICOM
* Reports
* Approval
Start with integration-ready architecture even if a real PACS is not available during development.
---
# 17. Phase 14 — Pharmacy
Implement:
* Medication catalog
* Prescription
* Pharmacy queue
* Dispensing
* Batch
* Expiry
* Pharmacy stock
* Medication history
---
# 18. Phase 15 — Surgery
Implement:
* Surgical requests
* Pre-op
* Scheduling
* Operating rooms
* Surgical procedure
* Surgical team
* Anesthesia
* Post-op
* Discharge
---
# 19. Phase 16 — Blood Bank
Implement:
* Blood products
* Units
* Inventory
* Requests
* Compatibility
* Issue
* Transfusion
* Reactions
---
# 20. Phase 17 — Inventory
Implement:
* Items
* Categories
* Warehouses
* Stock
* Batches
* Movements
* Transfers
* Adjustments
* Expiry
* Stock counts
---
# 21. Phase 18 — Procurement
Implement:
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
# 22. Phase 19 — Finance
Implement when enabled:
* Services
* Price lists
* Invoices
* Invoice items
* Payments
* Refunds
* Expenses
* Financial reports
Finance MUST remain configurable per hospital.
---
# 23. Phase 20 — Insurance
Implement:
* Providers
* Plans
* Patient policies
* Eligibility
* Claims
* Claim items
* Claim status
* Settlement
---
# 24. Phase 21 — HR
Implement:
* Employees
* Employment
* Attendance
* Leave
* Payroll records
* HR documents
---
# 25. Phase 22 — Notifications
Implement:
* Internal notifications
* Email
* SMS adapter
* Templates
* Queues
* Retry
* Delivery status
* Webhooks
---
# 26. Phase 23 — Reporting
Implement:
* Role dashboards
* Operational reports
* Clinical reports
* Inventory reports
* Finance reports
* Insurance reports
* HR reports
* Export
* Audit
---
# 27. Phase 24 — Synchronization
Only after local workflows are stable.
Implement:
```text
Sync Event
↓
Local Queue
↓
Transmission
↓
Cloud
↓
Validation
↓
Acknowledgment
```
Features:
* Event IDs
* Idempotency
* Retry
* Backoff
* Ordering
* Conflict detection
* Conflict resolution
* Dead-letter queue
* Monitoring
---
# 28. Phase 25 — Offline Mode
Validate:
```text
Internet OFF
```
The hospital must continue operating locally.
Critical workflows:
* Login
* Patient search
* Patient registration
* Clinical encounters
* Emergency
* Nursing
* Pharmacy
* Lab
* Inventory
Cloud-only features should clearly indicate unavailable status.
---
# 29. Phase 26 — Security Hardening
Implement/review:
* MFA
* RBAC
* Tenant isolation
* Session security
* Rate limiting
* Secure headers
* Encryption
* Secret management
* File security
* Audit
* Network segmentation guidance
Perform security testing.
---
# 30. Phase 27 — Performance
Test:
* Database
* API
* Frontend
* Reports
* Queues
* Sync
* Concurrent users
Add indexes based on measured query patterns.
---
# 31. Phase 28 — Backup & Disaster Recovery
Implement:
```text
Primary Server
+
Local Backup
+
Cloud Copy
+
Versioned Backup
```
Test restore.
Document:
* RPO
* RTO
* Recovery procedures
* Server replacement
* Database restoration
* File restoration
---
# 32. Phase 29 — Production Deployment
Production environment should include:
```text
Firewall
↓
Network
↓
Application Server
↓
Database
↓
Storage
↓
Backup
↓
Monitoring
```
Use secure TLS certificates and production secrets.
---
# 33. Phase 30 — Pilot Hospital
Before broad deployment:
1. Select pilot hospital.
2. Configure hospital profile.
3. Import required base data.
4. Create users.
5. Train users.
6. Test workflows.
7. Run acceptance tests.
8. Monitor performance.
9. Collect issues.
10. Fix and document.
11. Repeat validation.
---
# 34. Phase 31 — Production Launch
Launch checklist:
* Backup verified
* Restore tested
* Users created
* Permissions reviewed
* Network tested
* Offline mode tested
* Sync tested
* Integrations tested
* Reports tested
* Printing tested
* Security reviewed
* Training completed
* Support process established
---
# 35. Phase 32 — Post-Launch
Monitor:
* Errors
* API latency
* Database health
* Disk
* RAM
* CPU
* Queue depth
* Sync failures
* Failed notifications
* Security events
---
# 36. Release Strategy
Use semantic versioning:
```text
MAJOR.MINOR.PATCH
```
Example:
```text
1.0.0
1.1.0
1.1.1
```
Database migrations MUST be version-controlled.
---
# 37. Feature Development Cycle
Every feature follows:
```text
Requirement
↓
Design
↓
Database
↓
API
↓
Authorization
↓
UI
↓
Tests
↓
Documentation
↓
Review
↓
Deployment
```
---
# 38. Cursor Working Method
Cursor MUST NOT work blindly.
For every feature:
### Step 1
Read relevant documents.
### Step 2
Inspect current repository.
### Step 3
Identify existing implementation.
### Step 4
Prepare implementation plan.
### Step 5
List files to create/change.
### Step 6
Implement small increments.
### Step 7
Run tests.
### Step 8
Run type checking.
### Step 9
Run lint.
### Step 10
Review architecture.
### Step 11
Update documentation.
### Step 12
Report changes.
---
# 39. Cursor Must Stop and Ask Before
Cursor should stop before:
* Changing architecture
* Changing database strategy
* Replacing PostgreSQL
* Replacing authentication architecture
* Introducing microservices
* Removing a major module
* Breaking API contracts
* Changing tenant model
* Changing synchronization model
* Removing offline support
* Making irreversible data migrations
* Adding external services with major cost/security implications
---
# 40. No Big-Bang Implementation
Never request:
```text
Build the entire hospital system now.
```
Instead:
```text
Implement Phase 1.
```
Then:
```text
Test.
Review.
Proceed.
```
---
# 41. Definition of Done
A phase is complete only when:
* Implementation exists
* Database changes are migrated
* API works
* UI works
* Permissions work
* Validation works
* Audit works where required
* Tests pass
* Type checking passes
* Lint passes
* Documentation is updated
* No known critical regression exists
---
# 42. Final Product Goal
The final system should be:
```text
Modular
Multi-Tenant
Secure
Offline-Capable
Cloud-Connected
Arabic/English
Configurable
Auditable
Scalable
Maintainable
Enterprise-Grade
```
The system should operate as one coherent hospital platform rather than a collection of disconnected applications.
---
# 43. Implementation Priority
Priority order:
```text
P0
Security
Identity
Tenant Isolation
Patient Identity
Clinical Core
Emergency
Inpatient
Data Integrity
P1
Laboratory
Radiology
Pharmacy
Nursing
Inventory
Surgery
P2
Finance
Insurance
Procurement
HR
Reporting
Notifications
P3
Advanced Analytics
Mobile
External APIs
Advanced Integrations
AI-assisted features
```
P3 features MUST NOT compromise the reliability of P0/P1 workflows.
---
# 44. Final Cursor Directive
Cursor should treat all documents in:
```text
/docs
```
as the project's architectural and functional specification.
When documents conflict:
1. Identify the conflict.
2. Do not silently choose one.
3. Report the conflict.
4. Propose a resolution.
5. Obtain approval for architectural changes.
6. Update the affected documentation.
7. Then implement.
The goal is not to generate the maximum amount of code.
The goal is to build a reliable, maintainable, secure hospital information system that can be deployed in real hospitals.
