# HOSPITAL MANAGEMENT SYSTEM
## Modules & Workflows Specification
**Document:** `MODULES.md`
**Version:** 1.0
**Status:** Product & Functional Architecture
**Related Documents:**
* `HOSPITAL_SYSTEM_MASTER_SPEC.md`
* `DATABASE_SCHEMA.md`
---
# 1. Purpose
This document defines the functional modules of the Hospital Management System and explains how they interact.
The system must not be treated as a collection of unrelated screens.
Each module represents a real hospital department, operational function, or administrative function.
The platform must provide:
* Clear module boundaries
* Defined responsibilities
* Defined users
* Defined workflows
* Controlled communication between modules
* Shared patient identity
* Shared hospital configuration
* Shared authorization system
* Shared audit system
---
# 2. Overall Module Architecture
The platform is divided into the following major areas:
```text
Hospital Management System
│
├── Platform & Administration
│
├── Patient Management
│
├── Reception & Appointments
│
├── Clinical Care
│   ├── Outpatient
│   ├── Emergency
│   ├── Inpatient
│   └── Nursing
│
├── Diagnostic Services
│   ├── Laboratory
│   └── Radiology
│
├── Treatment Services
│   ├── Pharmacy
│   ├── Surgery
│   └── Blood Bank
│
├── Supply Chain
│   ├── Inventory
│   └── Procurement
│
├── Financial
│   ├── Billing
│   └── Payments
│
├── Insurance
│
├── Human Resources
│
├── Reports & Analytics
│
└── Synchronization & Infrastructure
```
---
# 3. Module Design Principle
Every module must have:
```text
Purpose
Responsibilities
Users
Entities
Workflows
Permissions
Inputs
Outputs
Dependencies
Audit Requirements
```
A module must own its business logic.
For example:
```text
Laboratory
```
owns:
* Samples
* Laboratory processing
* Laboratory results
* Result approval
The Clinical module can request a laboratory test, but it should not directly modify laboratory results.
---
# 4. Platform Administration Module
## Purpose
Provides system-level configuration and administration for each hospital.
## Main Functions
* Hospital configuration
* Hospital profile
* Departments
* Locations
* Users
* Roles
* Permissions
* Module activation
* System settings
* Numbering configuration
* Language
* Currency
* Time zone
* Audit logs
* System status
## Users
* Super Administrator
* Hospital Administrator
* IT Administrator
## Main Workflow
```text
Hospital
↓
Configure Departments
↓
Configure Users
↓
Assign Roles
↓
Assign Permissions
↓
Enable Modules
↓
Configure Hospital
```
---
# 5. Dashboard Module
## Purpose
Provide role-specific overview information.
The dashboard must not show the same information to every user.
Examples:
### Doctor
```text
Today's Appointments
Waiting Patients
Active Encounters
Pending Lab Results
Pending Radiology Reports
Recent Patients
```
### Nurse
```text
Assigned Patients
Vital Signs Due
Medication Tasks
Nursing Tasks
Admissions
```
### Receptionist
```text
Today's Appointments
Waiting Queue
New Registrations
Check-ins
```
### Administrator
```text
Patient Statistics
Hospital Activity
Department Activity
System Alerts
Users
Infrastructure Status
```
Dashboard data must respect permissions.
---
# 6. Patient Management Module
## Purpose
Create and maintain the unified patient identity.
This module is central to the entire system.
## Main Functions
* Register patient
* Search patient
* Patient profile
* Demographics
* Contacts
* Emergency contacts
* Identification
* Allergies
* Medical history
* Documents
* Patient timeline
* Duplicate detection
* Patient merge workflow where authorized
## Users
Potential users:
* Receptionist
* Doctor
* Nurse
* Medical Records Officer
* Administrator
## Core Principle
There must be one patient identity.
The system must never create separate patient records for:
* Laboratory
* Pharmacy
* Radiology
* Emergency
* Inpatient
All modules reference the same patient.
---
# 7. Patient Registration Workflow
```text
Reception
↓
Search Existing Patient
│
├── Found → Open Patient
│
└── Not Found
↓
Duplicate Check
↓
Create Patient
↓
Generate Patient Number
↓
Save
↓
Audit Event
```
The system should warn about possible duplicate patients.
---
# 8. Patient Timeline
The patient profile should provide a unified timeline.
Example:
```text
Patient
│
├── Registration
├── Appointment
├── Outpatient Visit
├── Diagnosis
├── Prescription
├── Laboratory Test
├── Radiology Study
├── Emergency Visit
├── Admission
├── Nursing Events
├── Surgery
├── Discharge
└── Follow-up
```
The timeline must respect the viewer's permissions.
---
# 9. Reception Module
## Purpose
Manage the front desk and patient flow.
## Main Functions
* Patient registration
* Appointment check-in
* Walk-in registration
* Queue management
* Department routing
* Patient arrival
* Patient departure
* Basic administrative information
## Users
* Receptionist
* Reception Supervisor
* Department staff where permitted
---
# 10. Appointment Module
## Purpose
Manage scheduled patient visits.
## Main Functions
* Create appointment
* Reschedule
* Cancel
* Confirm
* Check-in
* No-show
* Appointment calendar
* Doctor schedules
* Department schedules
## Workflow
```text
Patient
↓
Appointment Request
↓
Select Department
↓
Select Doctor
↓
Select Time
↓
Appointment Created
↓
Confirmation
↓
Patient Arrives
↓
Check-in
↓
Queue
↓
Doctor
```
---
# 11. Queue Management Module
Appointments and queues are separate concepts.
A patient may arrive without an appointment.
## Workflow
```text
Patient Arrival
↓
Check-in
↓
Queue Ticket
↓
Waiting
↓
Called
↓
Service
↓
Completed
```
The queue should support:
* Department
* Doctor
* Priority
* Ticket number
* Waiting time
* Status
---
# 12. Clinical Module
## Purpose
Provide doctors with the main clinical workspace.
The clinical module is responsible for the medical encounter.
## Main Functions
* Patient history
* Clinical assessment
* Clinical notes
* Diagnoses
* Vital signs
* Allergies
* Procedures
* Treatment plans
* Prescriptions
* Laboratory orders
* Radiology orders
* Follow-up
* Referrals
---
# 13. Doctor Workspace
The doctor should have one unified patient workspace.
Conceptual interface:
```text
Patient Header
│
├── Demographics
├── Allergies
├── Medical History
├── Current Medications
│
├── Current Encounter
│   ├── Chief Complaint
│   ├── History
│   ├── Examination
│   ├── Vital Signs
│   ├── Diagnosis
│   ├── Treatment Plan
│   └── Notes
│
├── Orders
│   ├── Laboratory
│   └── Radiology
│
├── Prescription
│
└── Follow-up
```
---
# 14. Clinical Encounter Workflow
```text
Patient
↓
Check-in
↓
Encounter Created
↓
Doctor Opens Patient
↓
History
↓
Examination
↓
Diagnosis
↓
Treatment Plan
↓
Orders / Prescription
↓
Follow-up
↓
Encounter Completed
```
---
# 15. Diagnosis Module
Doctors can:
* Add diagnosis
* Mark primary diagnosis
* Add secondary diagnosis
* Update diagnosis status
* Record diagnosis notes
Diagnosis history must remain traceable.
---
# 16. Prescription Module
## Purpose
Allow authorized clinicians to prescribe medication.
Workflow:
```text
Doctor
↓
Select Medication
↓
Dose
↓
Route
↓
Frequency
↓
Duration
↓
Instructions
↓
Prescription
↓
Pharmacy
```
Prescription is separate from dispensing.
---
# 17. Emergency Department Module
## Purpose
Manage emergency patients from arrival through disposition.
## Main Functions
* Emergency registration
* Triage
* Vital signs
* Emergency assessment
* Priority
* Orders
* Treatments
* Procedures
* Observation
* Admission
* Referral
* Discharge
---
# 18. Emergency Workflow
```text
Patient Arrives
↓
Emergency Registration
↓
Triage
↓
Priority
↓
Doctor Assessment
↓
Treatment / Orders
│
├── Laboratory
├── Radiology
├── Pharmacy
└── Procedures
↓
Disposition
│
├── Discharge
├── Admission
├── Transfer
└── Referral
```
Emergency patients may not have prior registration.
The system must support rapid registration.
---
# 19. Triage Module
Triage records:
* Arrival time
* Symptoms
* Vital signs
* Priority
* Nurse
* Notes
The exact clinical triage classification must be configurable according to the hospital's approved workflow.
---
# 20. Inpatient Module
## Purpose
Manage patients admitted to the hospital.
## Main Functions
* Admission
* Ward management
* Room management
* Bed management
* Transfers
* Daily clinical care
* Discharge
* Discharge summary
---
# 21. Admission Workflow
```text
Doctor Decision
↓
Admission Request
↓
Check Bed Availability
↓
Select Ward
↓
Select Bed
↓
Admission
↓
Nursing Assignment
↓
Inpatient Care
```
---
# 22. Bed Management
The system must display real-time bed states.
Example:
```text
Ward A
Room 101
├── Bed 1 → Occupied
└── Bed 2 → Available
Room 102
├── Bed 1 → Reserved
└── Bed 2 → Maintenance
```
Authorized staff can:
* View beds
* Assign beds
* Transfer patients
* Reserve beds
* Block beds
* Release beds
Every bed assignment should be traceable.
---
# 23. Nursing Module
## Purpose
Support nursing workflows.
## Main Functions
* Patient assignments
* Vital signs
* Nursing notes
* Nursing tasks
* Medication administration
* Care plans
* Patient monitoring
* Shift handover
---
# 24. Nursing Workflow
```text
Admission
↓
Assign Nurse
↓
Review Patient
↓
Vital Signs
↓
Care Tasks
↓
Medication Administration
↓
Nursing Notes
↓
Shift Handover
```
---
# 25. Medication Administration
Prescription and administration are different workflows.
```text
Doctor
↓
Prescription
↓
Pharmacy
↓
Medication Available
↓
Nurse
↓
Administration
↓
Record Administration
```
The system should record:
* Medication
* Dose
* Route
* Time
* Nurse
* Patient
* Status
* Notes
---
# 26. Laboratory Module
## Purpose
Manage laboratory operations from order to approved result.
## Main Functions
* Test catalog
* Lab orders
* Sample collection
* Sample tracking
* Processing
* Result entry
* Result review
* Result approval
* Result publication
* Lab reports
---
# 27. Laboratory Workflow
```text
Doctor
↓
Lab Order
↓
Laboratory
↓
Sample Collection
↓
Sample Processing
↓
Result Entry
↓
Review
↓
Approval
↓
Patient Record
```
---
# 28. Laboratory Result Security
After approval, results must not be silently modified.
If correction is necessary:
```text
Approved Result
↓
Correction
↓
Authorization
↓
New Corrected Result
↓
Audit Trail
```
The original result must remain traceable.
---
# 29. Radiology Module
## Purpose
Manage radiology requests, scheduling, studies and reports.
## Main Functions
* Radiology orders
* Scheduling
* Modality management
* Study tracking
* Radiologist workspace
* Reports
* Report approval
* PACS/DICOM integration
---
# 30. Radiology Workflow
```text
Doctor
↓
Radiology Order
↓
Scheduling
↓
Patient Preparation
↓
Imaging Study
↓
PACS / DICOM
↓
Radiologist
↓
Report
↓
Approval
↓
Patient Record
```
---
# 31. Pharmacy Module
## Purpose
Manage medication dispensing and pharmacy operations.
## Main Functions
* Medication catalog
* Prescription queue
* Dispensing
* Stock
* Batch
* Expiration
* Returns
* Pharmacy reports
---
# 32. Pharmacy Workflow
```text
Prescription
↓
Pharmacy Queue
↓
Pharmacist Review
↓
Medication Availability
↓
Dispensing
↓
Stock Movement
↓
Prescription Completed
```
The pharmacy must not simply reduce a quantity field.
Every stock change must create a stock movement.
---
# 33. Surgery Module
## Purpose
Manage surgical procedures.
## Main Functions
* Surgery scheduling
* Operating rooms
* Surgical procedures
* Surgical team
* Pre-operative assessment
* Anesthesia
* Operation record
* Post-operative care
---
# 34. Surgery Workflow
```text
Clinical Decision
↓
Surgery Request
↓
Pre-operative Assessment
↓
Schedule
↓
Operating Room
↓
Surgical Team
↓
Procedure
↓
Anesthesia Record
↓
Post-operative Care
↓
Recovery
```
---
# 35. Blood Bank Module
## Purpose
Manage blood products and transfusion workflows.
## Main Functions
* Blood products
* Blood units
* Inventory
* Blood requests
* Compatibility testing
* Transfusion
* Expiration
* Disposal
* Traceability
---
# 36. Blood Bank Workflow
```text
Blood Request
↓
Availability Check
↓
Compatibility
↓
Blood Unit Assignment
↓
Issue
↓
Transfusion
↓
Transfusion Record
```
Every blood unit must remain traceable.
---
# 37. Inventory Module
## Purpose
Manage hospital supplies and stock.
Inventory may include:
* Medicines
* Medical supplies
* Laboratory supplies
* Surgical supplies
* Office supplies
* Equipment
* Consumables
---
# 38. Inventory Workflow
```text
Purchase
↓
Goods Receipt
↓
Warehouse
↓
Stock
↓
Transfer / Dispensing / Consumption
↓
Stock Movement
```
---
# 39. Warehouse Management
The system should support multiple warehouses.
Example:
```text
Main Warehouse
├── Pharmacy Warehouse
├── Laboratory Warehouse
├── Surgical Warehouse
└── Emergency Warehouse
```
Each warehouse must maintain independent stock while remaining part of the hospital's overall inventory.
---
# 40. Procurement Module
## Purpose
Manage purchasing.
## Functions
* Suppliers
* Purchase requests
* Approvals
* Purchase orders
* Receiving
* Supplier records
* Procurement reports
---
# 41. Procurement Workflow
```text
Department Request
↓
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
# 42. Finance Module
## Purpose
Manage financial operations where enabled.
This module is particularly relevant to private hospitals but must remain configurable.
## Functions
* Services
* Pricing
* Invoices
* Invoice items
* Payments
* Refunds
* Expenses
* Financial reports
---
# 43. Billing Workflow
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
↓
Receipt
```
The system should support different payment methods according to hospital configuration.
---
# 44. Insurance Module
## Purpose
Manage insurance-related workflows.
## Functions
* Insurance companies
* Insurance plans
* Patient policies
* Eligibility
* Coverage
* Claims
* Claim items
* Claim status
* Rejections
* Settlement
---
# 45. Insurance Workflow
```text
Patient
↓
Insurance Policy
↓
Eligibility
↓
Encounter
↓
Services
↓
Claim
↓
Insurance Review
↓
Approved / Rejected
↓
Settlement
```
---
# 46. Human Resources Module
## Purpose
Manage hospital employees and HR operations.
## Functions
* Employee records
* Departments
* Employment
* Attendance
* Leave
* Payroll-related data
* Documents
HR data must be separated from general clinical data through permissions.
---
# 47. Reports Module
## Purpose
Provide operational and management reporting.
Reports may include:
### Patient Reports
* Patient volume
* New patients
* Returning patients
### Clinical Reports
* Encounters
* Diagnoses
* Procedures
* Admissions
* Discharges
### Laboratory
* Orders
* Completed tests
* Pending tests
* Results
### Pharmacy
* Dispensing
* Stock
* Expiration
### Inventory
* Stock levels
* Movements
* Purchases
* Consumption
### Finance
* Revenue
* Payments
* Outstanding invoices
### Insurance
* Claims
* Approved claims
* Rejected claims
* Pending claims
---
# 48. Administration Reports
Administrators may require:
* User activity
* Login activity
* Audit activity
* Department performance
* System usage
* Sync status
* Backup status
Sensitive reports must respect permissions.
---
# 49. Notification Module
Notifications can be generated by different modules.
Examples:
```text
Appointment Reminder
Lab Result Ready
Prescription Ready
Bed Assignment
Emergency Alert
Low Stock
Expired Medication
System Alert
```
Notification channels:
```text
In-App
Email
SMS
Push
```
Availability depends on infrastructure and hospital configuration.
---
# 50. Search Module
The platform should provide centralized search where appropriate.
Search may cover:
* Patients
* Patient numbers
* Appointments
* Encounters
* Admissions
* Lab orders
* Radiology studies
* Prescriptions
* Invoices
Search results must respect user permissions and tenant boundaries.
---
# 51. Patient Portal
The platform may provide a patient-facing portal.
Potential functionality:
* Appointments
* Appointment requests
* Medical documents
* Laboratory results
* Radiology reports
* Prescriptions
* Billing
* Notifications
Patient portal access must be isolated from the internal hospital administrative interface.
---
# 52. Module Dependencies
Modules must have clear dependencies.
Conceptual dependency map:
```text
PLATFORM
│
▼
PATIENT
│
┌────────────┼────────────┐
▼            ▼            ▼
RECEPTION      CLINICAL     EMERGENCY
│            │            │
│       ┌────┼────┐       │
│       ▼    ▼    ▼       │
│      LAB  RAD  PHARMACY │
│                         │
└──────────┬──────────────┘
▼
INPATIENT
│
┌──────┼──────┐
▼      ▼      ▼
NURSING SURGERY BLOOD
SUPPLY CHAIN
│        │
▼        ▼
INVENTORY PROCUREMENT
FINANCIAL
│
┌────┴────┐
▼         ▼
BILLING   INSURANCE
```
---
# 53. Cross-Module Rules
## Patient
Owned by Patient Management.
Other modules reference the patient.
## Encounter
Owned by Clinical/Encounter domain.
Other modules may attach orders or events to an encounter.
## Laboratory
Owns laboratory results.
## Radiology
Owns radiology studies and reports.
## Pharmacy
Owns dispensing and pharmacy stock.
## Inventory
Owns general stock movement.
## Finance
Owns invoices and payments.
## Insurance
Owns claims and insurance processing.
This prevents multiple modules from modifying the same business concept independently.
---
# 54. Government Hospital Configuration
A government hospital may enable:
```text
Patient
Reception
Clinical
Emergency
Inpatient
Nursing
Laboratory
Radiology
Pharmacy
Surgery
Blood Bank
Inventory
Procurement
HR
Reports
Administration
```
Financial functionality can be enabled only to the extent required by that hospital.
---
# 55. Private Hospital Configuration
A private hospital may enable:
```text
All Core Clinical Modules
+
Billing
+
Payments
+
Finance
+
Insurance
+
Revenue Reports
```
The platform should not require a different software build.
---
# 56. Non-Profit Hospital Configuration
A non-profit hospital may use:
```text
Clinical
Emergency
Laboratory
Pharmacy
Inventory
Patient Management
```
and optionally:
```text
Donor Programs
Subsidized Services
Beneficiary Management
Financial Management
```
These features should be modular.
---
# 57. Module Activation
Each hospital can have enabled modules.
Conceptual configuration:
```text
Hospital
│
├── Module: Patients → ENABLED
├── Module: Clinical → ENABLED
├── Module: Pharmacy → ENABLED
├── Module: Finance → ENABLED
├── Module: Insurance → DISABLED
└── Module: Blood Bank → ENABLED
```
Module activation must be controlled by authorized administrators.
Disabled modules must not expose their routes, APIs, navigation or unauthorized data.
Backend authorization remains mandatory even when a module is hidden from the UI.
---
# 58. Module Communication
Modules should communicate through:
* Domain services
* Internal APIs
* Events where appropriate
Avoid direct database manipulation across module boundaries.
Bad pattern:
```text
Clinical → directly modifies Pharmacy Stock
```
Preferred:
```text
Clinical
↓
Prescription
↓
Pharmacy
↓
Dispensing
↓
Inventory Movement
```
---
# 59. Clinical Event Principle
Clinical events should be traceable.
Examples:
```text
Diagnosis Created
Prescription Created
Lab Ordered
Sample Collected
Result Approved
Radiology Ordered
Study Completed
Medication Administered
Procedure Performed
Admission Created
Discharge Completed
```
Important events should be recorded in the patient's clinical history and audit system as appropriate.
---
# 60. Workflow Status Principle
Long-running processes should have explicit states.
Example:
```text
Lab Order
ORDERED
→ SAMPLE_COLLECTED
→ PROCESSING
→ RESULT_ENTERED
→ APPROVED
→ PUBLISHED
```
Avoid using arbitrary booleans such as:
```text
is_done = true
```
when a process actually has multiple meaningful states.
---
# 61. Error Handling
Every workflow must define what happens when something fails.
Example:
```text
Pharmacy Dispensing
↓
Stock Check
↓
Insufficient Stock
↓
Do NOT complete dispensing
↓
Show appropriate status
```
The system must never create a completed transaction while silently failing another required operation.
---
# 62. Offline Workflow
Core modules must continue functioning through the internal hospital server during Internet outages.
Example:
```text
Internet OFF
↓
Hospital LAN remains operational
↓
User opens internal system
↓
Patient registered
↓
Clinical activity recorded
↓
Local database updated
↓
Sync queue records required changes
↓
Internet returns
↓
Synchronization starts
```
Users should not need to manually copy databases or files between computers.
---
# 63. Synchronization Visibility
Authorized administrators should be able to see:
```text
Sync Status
Last Successful Sync
Pending Events
Failed Events
Conflicts
Retry
Connection Status
```
Normal clinical users should not be burdened with technical synchronization details.
---
# 64. Audit Requirements by Module
Every module must identify important auditable actions.
Examples:
### Patient
```text
Created
Updated
Merged
Viewed where required
```
### Clinical
```text
Diagnosis Created
Prescription Created
Clinical Note Modified
```
### Laboratory
```text
Result Entered
Result Approved
Result Corrected
```
### Pharmacy
```text
Dispensing
Return
Stock Adjustment
```
### Finance
```text
Invoice Created
Payment Created
Refund
Correction
```
### Administration
```text
User Created
Role Changed
Permission Changed
Module Enabled
```
---
# 65. User Experience Principle
Hospital staff often work under time pressure.
Interfaces should prioritize:
* Speed
* Clarity
* Minimal unnecessary clicks
* Search
* Keyboard navigation where useful
* Clear status
* Clear patient identification
* Error prevention
* Large actionable controls where appropriate
The system should not sacrifice safety for visual complexity.
---
# 66. Patient Safety Principle
The software must be designed to reduce avoidable workflow errors.
Examples:
* Clearly display patient identity.
* Clearly display allergies.
* Distinguish active and discontinued medications.
* Confirm high-impact actions.
* Prevent duplicate submissions.
* Display critical status information.
* Require appropriate authorization for sensitive operations.
The system must support clinical staff rather than replace clinical judgment.
---
# 67. Module Development Order
Recommended development order:
```text
1. Platform
2. Authentication
3. Users / Roles / Permissions
4. Patient Management
5. Reception
6. Appointments / Queue
7. Clinical
8. Emergency
9. Inpatient
10. Nursing
11. Laboratory
12. Pharmacy
13. Inventory
14. Radiology
15. Surgery
16. Blood Bank
17. Procurement
18. Finance
19. Insurance
20. HR
21. Reports
22. Patient Portal
23. Synchronization
24. Advanced Infrastructure
```
This order may change based on actual implementation priorities, but dependencies must be respected.
---
# 68. Module Completion Criteria
A module is not considered complete merely because its screens exist.
A module is complete when it has:
```text
UI
+
Backend API
+
Database
+
Validation
+
Authorization
+
Audit Logging
+
Error Handling
+
Tests
+
Documentation
```
Where applicable:
```text
Offline Support
+
Synchronization
```
must also be implemented.
---
# 69. Cursor Implementation Rules
Before implementing any module, Cursor must:
1. Read the Master Specification.
2. Read the Database Specification.
3. Read this Modules Specification.
4. Inspect existing code.
5. Identify dependencies.
6. Identify existing reusable components.
7. Define the workflow.
8. Define required API endpoints.
9. Define required database changes.
10. Implement backend first where appropriate.
11. Implement frontend.
12. Implement permissions.
13. Implement audit logging.
14. Add tests.
15. Test error cases.
16. Update documentation.
Cursor must not build a UI disconnected from the actual business workflow.
---
# 70. Do Not Build All Modules at Once
The project must be developed incrementally.
Do NOT instruct Cursor:
```text
"Build the complete hospital system now."
```
Instead:
```text
Implement Module X according to the architecture.
Do not modify unrelated modules.
First analyze the existing code.
Then propose the implementation plan.
Then implement the backend, database changes,
authorization, frontend, tests and documentation.
```
---
# 71. Final Functional Architecture
The final system should behave as one integrated platform:
```text
HOSPITAL
│
PATIENT
│
┌─────────────┼─────────────┐
│             │             │
RECEPTION      CLINICAL      EMERGENCY
│             │             │
│       ┌─────┼─────┐       │
│       │     │     │       │
│      LAB   RAD  PHARMACY   │
│                         │
└────────────┬────────────┘
│
INPATIENT
│
┌─────┼─────┐
│     │     │
NURSING SURGERY BLOOD
SUPPLY CHAIN
│          │
INVENTORY   PROCUREMENT
FINANCE
┌────┴────┐
│         │
BILLING   INSURANCE
HR
│
REPORTS
│
ADMINISTRATION
```
The platform must maintain a single coherent hospital data model rather than isolated applications.
---
# 72. Final Principle
The Hospital Management System should behave like a real hospital's digital operating platform.
The core relationship is:
```text
Patient
↓
Hospital Workflow
↓
Clinical / Operational Services
↓
Results / Treatments / Resources
↓
Financial / Insurance / Inventory Operations
↓
Reporting / Audit
```
Every module must contribute to this unified workflow.
The objective is not to create the largest number of screens.
The objective is to create a reliable system that accurately represents how a hospital operates.
---
# 73. Instruction to Cursor
When implementing modules:
* Follow `HOSPITAL_SYSTEM_MASTER_SPEC.md`.
* Follow `DATABASE_SCHEMA.md`.
* Follow this `MODULES.md`.
* Do not invent conflicting architecture.
* Do not duplicate domain entities.
* Do not bypass authorization.
* Do not bypass audit requirements.
* Do not directly modify another module's data without an approved domain interface.
* Do not silently change established workflows.
* Do not implement medical workflows based on assumptions when the requirement is unclear.
* Keep modules independently understandable.
* Keep the system deployable as one application.
* Preserve compatibility with future cloud synchronization.
* Preserve compatibility with on-premise operation.
* Test every important workflow.
* Document significant architectural decisions.
This document is the functional map of the Hospital Management System and must be treated as a core development reference throughout the project.
