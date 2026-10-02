HOSPITAL MANAGEMENT SYSTEM
Master Software Specification & Architecture
Document Type: Master Product & Software Architecture SpecificationVersion: 1.0Status: Initial ArchitectureTarget: Cursor / Development Team
1. Project Overview
We are building a comprehensive Hospital Information & Management System (HIS/HMS) designed to manage the daily operations of hospitals through one integrated digital platform.
The system must support different hospital business models without creating separate applications.
The same platform should be configurable for:
Government hospitals
Private hospitals
Non-profit / charitable hospitals
Small hospitals
Medium hospitals
Large hospitals
The hospital administrator should be able to activate or deactivate modules according to the hospital's operational and financial requirements.
The goal is to create a professional, secure, scalable and resilient hospital platform that can operate:
Inside the hospital's local network.
Through the cloud when Internet connectivity is available.
During complete Internet outages through the hospital's internal server.
With automatic synchronization between the hospital and cloud infrastructure when connectivity returns.
The system is intended to become a commercial product that can be deployed for multiple hospitals.
2. Core Product Concept
The platform follows a Modular Multi-Tenant Hospital Platform architecture.
There should be one core product rather than a different application for every hospital.
Each hospital is represented as a separate tenant.
Example:
Hospital Platform
│
├── Hospital A
│   ├── Users
│   ├── Patients
│   ├── Departments
│   └── Configuration
│
├── Hospital B
│   ├── Users
│   ├── Patients
│   ├── Departments
│   └── Configuration
│
└── Hospital C
├── Users
├── Patients
├── Departments
└── Configuration
Each hospital must have isolated data.
One hospital must never be able to access another hospital's data.
3. Hospital Type Configuration
The system must support hospital-type configuration.
Possible types:
GOVERNMENT
PRIVATE
NON_PROFIT
The hospital type must NOT create completely different codebases.
Instead, it controls configuration and module availability.
For example:
Government Hospital
May use:
Patient Management
Medical Records
Emergency
Inpatient
Nursing
Laboratory
Radiology
Pharmacy
Surgery
Blood Bank
Inventory
HR
Reports
Administration
Financial modules may be limited or disabled depending on the hospital's requirements.
Private Hospital
May additionally use:
Billing
Payments
Accounting
Insurance
Claims
Financial reporting
Patient invoices
Revenue management
Non-Profit Hospital
May use:
Patient Management
Medical Records
Clinical Modules
Donations
Aid programs
Subsidized services
Beneficiary management
Inventory
Financial modules according to configuration
The platform must remain flexible enough to support additional hospital models in the future.
4. Main Architecture
The system should initially use a:
Modular Monolith Architecture
Do NOT start with microservices.
The application should be internally divided into independent modules while remaining deployable as one main application.
This provides:
Easier development
Easier deployment
Easier debugging
Lower infrastructure complexity
Better suitability for small and medium hospitals
Easier on-premise deployment
The architecture must allow future extraction of specific modules into services if the product becomes large enough.
5. High-Level Infrastructure
The system must support a hybrid architecture.
INTERNET
│
│
┌───────▼───────┐
│ Cloud Platform │
│               │
│ Cloud API     │
│ Cloud DB      │
│ Object Store  │
│ Monitoring    │
└───────▲───────┘
│
Secure Sync
│
▼
┌───────────────────────┐
│ Hospital Infrastructure│
│                       │
│ Internal Server       │
│ PostgreSQL            │
│ Object Storage        │
│ Sync Engine           │
└───────────┬───────────┘
│
Hospital LAN
│
┌─────────────────┼─────────────────┐
│                 │                 │
Doctors           Nurses          Reception
│                 │                 │
Pharmacy            Lab          Administration
6. On-Premise Hospital Infrastructure
Every hospital deployment should have an internal server.
The internal server is responsible for local hospital operations.
It must continue functioning even when the Internet connection completely fails.
The hospital LAN and Internet connection are separate concepts.
If the Internet goes down:
Internet = OFF
Hospital LAN = ON
Hospital Server = ON
Doctors → Server = WORKING
Nurses → Server = WORKING
Reception → Server = WORKING
Laboratory → Server = WORKING
Pharmacy → Server = WORKING
Only services requiring external connectivity should become unavailable.
7. Client Architecture
The hospital should not install a separate database on every computer.
Instead:
Doctor PC
│
Nurse PC
│
Reception PC
│
Pharmacy PC
│
Lab PC
│
▼
Hospital Network
│
▼
Internal Hospital Server
All users access the same hospital application.
The preferred client interface is a web application.
Example:
https://hospital.local
or an equivalent internal DNS hostname.
Users should not normally need to know the server IP address.
8. Network Infrastructure
The recommended hospital network architecture is:
Internet
│
Firewall / Router
│
Core Switch
┌────────────┼────────────┐
│            │            │
Server       Access       Access
Network      Switch       Switch
│
┌───────┼───────┐
│       │       │
PCs     APs    Devices
For larger hospitals:
Core Switch
│
├── Floor 1 Access Switch
├── Floor 2 Access Switch
├── Floor 3 Access Switch
├── Administration Switch
├── Medical Devices Switch
└── Server Infrastructure
Use wired Ethernet for fixed and critical systems whenever possible.
Wi-Fi should primarily support mobile devices and appropriate hospital workflows.
9. Network Segmentation
The network should support VLAN segmentation.
Suggested architecture:
VLAN 10 → Servers
VLAN 20 → Medical Devices
VLAN 30 → Doctors / Nurses
VLAN 40 → Administration
VLAN 50 → Pharmacy / Laboratory
VLAN 60 → Guest Wi-Fi
VLAN 70 → Network Management
Firewall and access-control rules must prevent unauthorized communication between VLANs.
Guest Wi-Fi must never have access to hospital servers or medical systems.
10. Internal Server
The internal server is the primary operational infrastructure for the hospital's local environment.
Recommended characteristics:
Enterprise-grade hardware
ECC RAM
Redundant storage where appropriate
RAID
Multiple network interfaces
Redundant power supply where possible
UPS protection
Monitoring
Automated backups
Restricted physical access
Possible server families:
Dell PowerEdge
HPE ProLiant
Lenovo ThinkSystem
The exact hardware must be selected according to:
Number of users
Number of departments
Concurrent sessions
Database size
File storage
Medical images
Laboratory data
Radiology/PACS requirements
Expected growth
Do not hard-code one server specification for every hospital.
11. Storage Architecture
Structured application data should be stored in PostgreSQL.
Large files should NOT be stored directly inside normal database tables unless there is a specific technical reason.
Use object/file storage for:
Patient documents
Attachments
Reports
Scanned documents
Medical files
Images
Other large objects
Recommended object-storage technology:
MinIO
for on-premise environments.
Cloud object storage can be used for cloud deployments.
12. Radiology and Medical Imaging
Radiology should eventually support medical imaging standards.
The architecture must be prepared for:
DICOM
PACS
Imaging metadata
Radiology reports
Do not design the system as if normal image-file uploads are sufficient for a complete radiology department.
Radiology/PACS integration should be treated as a dedicated technical component.
13. Cloud Infrastructure
The cloud environment provides:
Centralized platform management
Remote administration
Cloud data synchronization
Disaster recovery
Monitoring
Reporting where permitted
Backup
Multi-hospital management
Software updates
Possible cloud architecture:
Cloud Load Balancer
│
▼
Application Server
│
┌──────┴──────┐
│             │
API          Web App
│
├── PostgreSQL
├── Redis
├── Object Storage
├── Sync Service
└── Monitoring
Cloud infrastructure must be designed so that the loss of Internet connectivity does not stop the hospital's core local operations.
14. Offline-First Principle
Offline operation is a core product requirement.
The system must not simply display an error when the Internet disappears.
Core hospital workflows should continue using the internal hospital server.
Examples:
Register patient
Search patient
Open medical record
Create encounter
Record diagnosis
Create prescription
Create laboratory order
Record laboratory result
Manage appointments
Manage beds
Manage admissions
Manage nursing activities
Manage pharmacy operations
Manage inventory
Internet-dependent functionality can be temporarily unavailable.
15. Synchronization Architecture
Synchronization between the hospital server and cloud server must NOT be implemented as simply copying the entire database.
Use an event/change-based synchronization architecture.
Local Database
│
▼
Change Tracking
│
▼
Local Sync Queue
│
▼
Sync Engine
│
│ Internet
▼
Cloud Sync Gateway
│
▼
Cloud Database
The reverse direction must also be supported when appropriate.
The sync system must support:
Retry
Acknowledgment
Idempotency
Ordering where required
Conflict detection
Conflict resolution
Failed synchronization queue
Sync status
Logging
Recovery after connection loss
16. Conflict Resolution
Synchronization conflicts must not be solved by blindly overwriting data.
Different medical data types require different strategies.
For example:
Event-based records
Examples:
Lab result events
Medication administration events
Audit events
Clinical activity events
These should generally be append-oriented.
Sensitive mutable information
Examples:
Allergy information
Active medication orders
Diagnosis status
Patient demographic information
Financial transactions
Potential conflicts should be detected and handled according to defined business rules.
Some conflicts may require manual review.
The sync engine must never silently destroy important medical data.
17. Synchronization Reliability
Every synchronized entity should have enough metadata to support reliable synchronization.
Potential fields include:
id
tenant_id
created_at
updated_at
deleted_at
version
server_version
device_id
sync_status
last_synced_at
The exact schema should be determined during database design.
The synchronization mechanism must be idempotent.
If the same event is received twice, the system must not create duplicate medical or financial transactions.
18. Backup Is Not Synchronization
Synchronization must never be considered a backup.
The system must have an independent backup strategy.
Recommended protection:
1. Hospital Primary Server
│
▼
2. Local Backup
│
▼
3. Cloud Copy
│
▼
4. Independent Versioned Backup
Backups should support:
Encryption
Versioning
Retention
Point-in-time recovery where appropriate
Restore testing
A backup that has never been tested for restoration should not be considered reliable.
19. Application Technology Stack
Recommended technology stack:
Frontend
Next.js
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
Requirements:
Arabic RTL
English LTR
Responsive interface
Desktop-first hospital workflows
Tablet support
Accessibility
Role-based navigation
20. Backend
Recommended:
NestJS
TypeScript
REST API
WebSockets where required
Backend responsibilities:
Authentication
Authorization
Business logic
Validation
Database operations
Audit logging
File management
Synchronization
Notifications
Reporting APIs
The frontend must never directly implement critical business rules that should be enforced by the backend.
21. Database
Primary database:
PostgreSQL
ORM:
Prisma
The database must be designed for:
Multi-tenancy
Referential integrity
Auditability
Transactions
Concurrency
Data consistency
Scalability
Critical medical and financial operations must use proper database transactions.
22. Caching and Background Jobs
Recommended:
Redis
BullMQ
Use them for:
Background jobs
Notifications
Scheduled tasks
Synchronization queues
Report generation
Non-critical asynchronous processing
Do not use a cache as the authoritative source for medical records.
PostgreSQL remains the primary source of structured application data.
23. Authentication and Authorization
The system requires strong identity and access management.
Requirements:
Secure authentication
MFA support
Password policies
Session management
Role-based access control
Permission-based access
Account activation/deactivation
Login auditing
Failed-login monitoring
Possible identity platform:
Keycloak
The architecture should allow an alternative identity provider if required.
24. RBAC
Access must be based on roles and permissions.
Example roles:
Super Administrator
Hospital Administrator
Doctor
Nurse
Receptionist
Laboratory Technician
Radiology Technician
Pharmacist
Accountant
HR Officer
Inventory Officer
Procurement Officer
Insurance Officer
Medical Records Officer
Department Manager
IT Administrator
Permissions should be granular.
Example:
patient.read
patient.create
patient.update
medical_record.read
medical_record.create
medical_record.update
lab.order.create
lab.result.create
lab.result.approve
pharmacy.dispense
invoice.create
payment.create
Do not rely only on frontend hiding.
The backend must enforce permissions.
25. Audit Logging
Important operations must generate audit records.
Audit information should include where appropriate:
User
Tenant
Action
Resource
Resource ID
Timestamp
IP Address
Device
Previous Value
New Value
Result
Examples:
Patient record opened
Patient record modified
Diagnosis created
Prescription created
Prescription modified
Lab result entered
Lab result approved
Payment created
User permission changed
Patient record deleted
Audit logs should be protected from ordinary users.
26. Security Architecture
Security is a fundamental requirement, not an optional feature.
The system must follow:
Least privilege
Secure authentication
Authorization
Encryption in transit
Encryption at rest where appropriate
Secure secrets management
Input validation
Output encoding
Protection against SQL injection
Protection against XSS
CSRF protection where applicable
Rate limiting
Secure headers
Session protection
Audit logging
Backup protection
Network segmentation
Security-sensitive operations must be handled server-side.
27. Main Functional Modules
The initial platform should contain the following module groups.
Core
Dashboard
Authentication
Users
Roles
Permissions
Hospital settings
Departments
Audit logs
Patient Management
Patient registration
Patient profile
Medical history
Documents
Contacts
Identification
Patient search
Reception
Registration
Appointments
Queue management
Check-in
Check-out
Clinical
Outpatient clinic
Doctor workspace
Encounters
Diagnoses
Treatment plans
Prescriptions
Clinical notes
Emergency
Emergency registration
Triage
Emergency encounters
Treatment
Disposition
Admission/referral
Inpatient
Admissions
Wards
Rooms
Beds
Transfers
Discharge
Nursing
Nursing notes
Vital signs
Medication administration
Nursing tasks
Patient monitoring
Laboratory
Lab orders
Sample collection
Test processing
Results
Result approval
Reports
Radiology
Imaging requests
Scheduling
Reports
DICOM/PACS integration layer
Pharmacy
Medication catalog
Prescriptions
Dispensing
Stock
Expiration
Returns
Surgery
Operating rooms
Surgical scheduling
Procedures
Surgical team
Anesthesia records
Post-operative records
Blood Bank
Blood products
Blood inventory
Compatibility
Requests
Transfusion records
Inventory
Items
Warehouses
Stock
Stock movements
Transfers
Expiration
Inventory counts
Procurement
Suppliers
Purchase requests
Purchase orders
Goods receiving
Finance
Primarily configurable for private hospitals:
Billing
Invoices
Payments
Expenses
Revenue
Financial reports
Insurance
Insurance providers
Policies
Eligibility
Claims
Claim status
Approvals
HR
Employees
Departments
Attendance
Leave
Payroll integration layer
Reports
Operational reports
Clinical reports
Financial reports
Inventory reports
Management dashboards
28. Patient Journey
The architecture should support a complete patient journey.
Example:
Patient Registration
↓
Appointment / Walk-in
↓
Reception
↓
Doctor / Clinical Encounter
↓
Diagnosis
↓
Lab / Radiology / Pharmacy
↓
Treatment
↓
Admission if required
↓
Nursing
↓
Discharge
↓
Billing / Insurance
↓
Reports
The modules must communicate through shared domain entities rather than creating isolated duplicate patient systems.
29. Financial Architecture
Financial functionality should be modular.
Example:
Patient
↓
Encounter
↓
Services
↓
Invoice
↓
Payment
Insurance:
Patient
↓
Insurance Policy
↓
Encounter
↓
Claim
↓
Approval
↓
Insurance Payment
Government hospitals can disable or simplify these components without requiring a different software product.
30. Inventory Architecture
Inventory must support the full lifecycle.
Supplier
↓
Purchase Order
↓
Goods Receipt
↓
Warehouse
↓
Stock
↓
Stock Movement
↓
Department / Pharmacy
↓
Patient / Usage
Every important stock movement should be traceable.
31. Multi-Tenant Architecture
Every hospital is a tenant.
All tenant-owned records must contain a tenant relationship.
Example:
Hospital
│
├── Users
├── Departments
├── Patients
├── Encounters
├── Orders
├── Inventory
└── Financial Records
Tenant isolation must be enforced at the backend and database access layers.
A user belonging to Hospital A must never retrieve Hospital B data by manipulating API parameters.
32. Configuration System
Hospitals must be configurable without changing source code for every deployment.
Configuration may include:
Hospital type
Departments
Working hours
Appointment rules
Currency
Language
Time zone
Billing settings
Insurance settings
Pharmacy settings
Laboratory settings
Notification settings
Enabled modules
Example:
Hospital Settings
│
├── Type
├── Modules
├── Departments
├── Users
├── Clinical Settings
├── Financial Settings
└── System Settings
33. Internationalization
The platform must support at minimum:
Arabic
English
Arabic must be a first-class language, not a translated afterthought.
Requirements:
RTL
LTR
Localized dates
Localized numbers where required
Translation files
No hard-coded UI strings
Language switching
The architecture must allow additional languages later.
34. Deployment
The application should be containerized.
Recommended:
Docker
Docker Compose
Initial on-premise deployment may contain:
Reverse Proxy
│
▼
Web Application
│
▼
Backend API
│
┌────┴─────┐
▼          ▼
PostgreSQL Redis
│
▼
MinIO
Production deployments should use proper secrets management, monitoring and backup procedures.
35. Updates
Software updates must not require manually reinstalling every client computer.
Because the application is server-based:
Server Updated
↓
All Hospital Clients
↓
Automatically use new version
This is one of the major advantages of the web-based architecture.
Updates must include:
Database migrations
Application deployment
Rollback strategy
Backup before migration
Version tracking
36. Monitoring
The platform should provide infrastructure and application monitoring.
Monitor:
Server CPU
RAM
Storage
Database
Network
Application errors
API latency
Failed jobs
Sync status
Backup status
Disk health
Critical alerts should be visible to authorized administrators.
37. Disaster Recovery
The platform must be designed for failure.
Potential failures:
Internet outage
Power outage
Server failure
Disk failure
Database corruption
Network failure
Human error
Software deployment failure
The system must have documented recovery procedures.
At minimum:
UPS
+
Local Backup
+
Cloud Backup
+
Versioned Backup
+
Restore Procedure
38. Development Principles
Cursor must follow these principles throughout development:
1. Do not create unnecessary complexity.
Prefer a modular monolith initially.
2. Do not duplicate business logic.
Business rules should have one authoritative implementation.
3. Do not bypass backend security.
Frontend restrictions are not security.
4. Do not create isolated patient databases for each module.
There must be one unified patient identity.
5. Do not overwrite medical data silently.
Important changes must be traceable.
6. Do not treat synchronization as backup.
Both systems are separate concerns.
7. Do not build the entire application in one generation.
Build incrementally and test each module.
8. Do not modify unrelated modules.
Changes must remain scoped.
9. Every important feature must have validation and error handling.
10. Database migrations must be safe and documented.
39. Development Workflow for Cursor
Cursor should work according to this sequence:
Architecture
↓
Database Design
↓
Core Infrastructure
↓
Authentication
↓
Multi-Tenancy
↓
RBAC
↓
Patient Management
↓
Reception
↓
Clinical
↓
Emergency
↓
Inpatient
↓
Laboratory
↓
Radiology
↓
Pharmacy
↓
Inventory
↓
Finance
↓
Insurance
↓
HR
↓
Reports
↓
Synchronization
↓
Deployment
↓
Security Testing
Each phase must be tested before moving to the next phase.
40. Required Project Documentation
The repository should contain:
/docs
HOSPITAL_SYSTEM_MASTER_SPEC.md
ARCHITECTURE.md
DATABASE_SCHEMA.md
MODULES.md
RBAC.md
API_SPECIFICATION.md
SYNC_ARCHITECTURE.md
SECURITY.md
DEPLOYMENT.md
BACKUP_AND_DR.md
NETWORK_ARCHITECTURE.md
TESTING.md
These documents should remain synchronized with the actual implementation.
41. Repository Structure
Recommended initial structure:
hospital-system/
│
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
├── docs/
│
├── prisma/
│
├── tests/
│
├── scripts/
│
├── .env.example
├── docker-compose.yml
└── README.md
The exact structure can be changed if there is a strong architectural reason.
42. Testing Strategy
Testing must be part of development from the beginning.
Required categories:
Unit Tests
Integration Tests
API Tests
Database Tests
Authorization Tests
Security Tests
End-to-End Tests
Synchronization Tests
Backup/Restore Tests
Particular attention must be given to:
Patient data isolation
Permission enforcement
Duplicate prevention
Concurrent updates
Synchronization
Conflict handling
Database transactions
43. Security Priority
Medical data is highly sensitive.
The development team must treat patient data as confidential.
Never:
Log passwords
Expose secrets in source code
Return unauthorized patient records
Store sensitive tokens in unsafe locations
Disable security checks merely to make development easier
Allow unrestricted database access from clients
Development shortcuts must not become production architecture.
44. Product Philosophy
This is not simply a collection of CRUD screens.
The platform must represent actual hospital workflows.
Every module should answer:
Who performs the action?
Why?
When?
What data is required?
What happens afterward?
Who can see it?
Who can modify it?
What should be recorded in the audit log?
What happens if the network fails?
What happens if the operation is duplicated?
Business workflow is more important than simply creating forms.
45. Cursor's Role
Cursor should act as a senior software engineering assistant implementing the architecture defined in this document.
Cursor should:
Analyze before coding.
Ask for clarification when a requirement is genuinely ambiguous.
Follow the architecture.
Reuse existing components.
Avoid unnecessary dependencies.
Maintain documentation.
Write tests.
Review security implications.
Check database consistency.
Preserve backward compatibility where possible.
Explain significant architectural changes.
Cursor should NOT independently redesign the entire system without documenting the reason and impact.
46. Product Owner Role
The product owner defines:
Business requirements
Hospital workflows
Priority
User experience
Deployment requirements
Commercial requirements
Technical implementation decisions should follow the documented architecture.
47. Architecture Evolution
The first version should optimize for:
Reliability
Security
Maintainability
Offline operation
Simple deployment
Correct hospital workflows
Not:
Maximum number of technologies
Maximum number of microservices
Unnecessary complexity
The architecture can evolve as the product gains real hospital deployments.
48. Initial MVP
The first production-capable milestone should focus on the core hospital workflow.
Recommended MVP:
Authentication
+
Hospital/Tenant Management
+
Users/Roles/Permissions
+
Patients
+
Reception
+
Appointments
+
Clinical Encounters
+
Doctors
+
Nursing
+
Emergency
+
Inpatient
+
Basic Laboratory
+
Basic Pharmacy
+
Inventory
+
Audit Logs
+
Reports
+
On-Premise Deployment
After the core is stable:
Radiology
Surgery
Blood Bank
Finance
Insurance
HR
Advanced Analytics
PACS
Cloud Synchronization
Advanced Disaster Recovery
However, the initial architecture must be designed from the beginning so these future modules can be added without rebuilding the platform.
49. Final Architectural Principle
The most important principle of this project is:
Build one hospital platform that can adapt to many hospitals, rather than building a separate application for every hospital.
The system should be:
Modular
+
Multi-Tenant
+
Secure
+
Offline-Capable
+
Cloud-Connected
+
Configurable
+
Scalable
+
Auditable
+
Maintainable
The hospital's internal server must allow core operations to continue during Internet outages.
The cloud environment must provide synchronization, centralized services, monitoring and disaster recovery.
The application must use a shared architecture and configurable modules instead of duplicated codebases.
All future implementation decisions must be evaluated against this architecture.
50. Instruction to Cursor
Before implementing major functionality, Cursor must:
Read this document.
Inspect the current repository.
Identify existing architecture.
Identify conflicts with this specification.
Propose the required implementation plan.
Wait for approval before making large architectural changes.
Implement incrementally.
Test each completed component.
Update documentation when architecture changes.
Never silently remove or replace important functionality.
The project should be developed as a professional commercial hospital software product, not as a simple demo application.
