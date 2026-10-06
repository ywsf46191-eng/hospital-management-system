# API_INTEGRATION_ARCHITECTURE.md
## 1. الهدف
يحدد هذا المستند معمارية:
* REST API
* Internal APIs
* External APIs
* WebSockets
* Webhooks
* Event-driven communication
* Hospital integrations
* Laboratory integrations
* PACS/DICOM integrations
* Pharmacy integrations
* Insurance integrations
* Payment integrations
* SMS/Email integrations
* Cloud synchronization
* Future third-party integrations
الهدف هو بناء API مؤسسي قابل للتوسع وآمن، بحيث يمكن إضافة تكاملات مستقبلية دون إعادة بناء النظام الأساسي.
---
# 2. المبادئ الأساسية
يجب أن تعتمد API Architecture على:
```text
Consistency
Security
Versioning
Validation
Authorization
Auditability
Idempotency
Observability
Backward Compatibility
Documentation
```
يجب ألا تقوم Modules بالوصول المباشر إلى جداول Modules أخرى.
مثال غير صحيح:
```text
Pharmacy
↓
Direct SQL
↓
Finance Tables
```
الصحيح:
```text
Pharmacy
↓
Domain Service / API
↓
Finance
```
---
# 3. API Architecture
البنية الأساسية:
```text
Client
│
▼
Reverse Proxy
│
▼
API Layer
│
├── Authentication
├── Authorization
├── Validation
├── Rate Limiting
├── Audit
└── Request Tracking
│
▼
Domain Services
│
┌──────┼──────┐
▼      ▼      ▼
Clinical Pharmacy Finance
│      │      │
└──────┼──────┘
▼
PostgreSQL
```
---
# 4. API Style
الأسلوب الأساسي:
```text
REST API
```
مع استخدام:
```text
WebSockets
Events
Webhooks
```
عند الحاجة.
REST هو الواجهة الأساسية للعمليات التقليدية.
---
# 5. Base URL
يجب أن تكون API Versioned.
مثال:
```text
/api/v1
```
مثال:
```text
/api/v1/patients
/api/v1/appointments
/api/v1/encounters
/api/v1/laboratory/orders
/api/v1/radiology/studies
/api/v1/pharmacy/prescriptions
```
---
# 6. API Versioning
لا يجب تغيير API الحالية بطريقة تكسر Clients قديمة.
مثال:
```text
/api/v1
/api/v2
```
عند الحاجة إلى تغيير Breaking Change.
يفضل الحفاظ على Version لفترة انتقالية قبل إيقاف الإصدار القديم.
---
# 7. Resource Naming
يفضل استخدام أسماء واضحة بصيغة plural.
مثال:
```text
/patients
/appointments
/encounters
/admissions
/departments
/medications
/prescriptions
/lab-orders
/radiology-orders
/invoices
/payments
```
لا تستخدم أسماء غير واضحة مثل:
```text
/getPatientsNow
/doPatient
/saveStuff
```
---
# 8. HTTP Methods
استخدام REST conventions:
```text
GET
POST
PUT/PATCH
DELETE
```
حسب طبيعة العملية.
أمثلة:
```text
GET /api/v1/patients
GET /api/v1/patients/{id}
POST /api/v1/patients
PATCH /api/v1/patients/{id}
```
---
# 9. Business Actions
بعض العمليات الطبية أو المالية ليست CRUD بسيطًا.
يمكن استخدام Action Endpoints واضحة.
مثال:
```text
POST /api/v1/lab-results/{id}/approve
POST /api/v1/prescriptions/{id}/dispense
POST /api/v1/admissions/{id}/discharge
POST /api/v1/invoices/{id}/finalize
```
يجب أن تكون هذه العمليات:
* Authorized.
* Validated.
* Audited.
* Transactional where required.
---
# 10. API Response Standard
يجب توحيد شكل Responses.
مثال نجاح:
```json
{
"success": true,
"data": {},
"meta": {}
}
```
مثال خطأ:
```json
{
"success": false,
"error": {
"code": "PATIENT_NOT_FOUND",
"message": "Patient was not found",
"requestId": "..."
}
}
```
لا يجب إرجاع Stack Traces للمستخدم.
---
# 11. HTTP Status Codes
استخدام Status Codes المناسبة.
أمثلة:
```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```
---
# 12. Request ID
كل API Request يجب أن يمتلك:
```text
requestId
```
مثال:
```text
Client
↓
Request ID: req_123
↓
API
↓
Database
↓
Logs
```
يساعد ذلك في تتبع الأخطاء.
---
# 13. Correlation ID
في العمليات التي تمر بعدة Services:
```text
Request
↓
API
↓
Queue
↓
Worker
↓
External Integration
```
يجب الحفاظ على:
```text
correlationId
```
حتى يمكن تتبع العملية بالكامل.
---
# 14. Authentication
كل API حساسة يجب أن تتطلب Authentication.
مثال:
```text
User
↓
Login
↓
Identity Provider
↓
Session / Token
↓
API
```
لا تعتمد API على إخفاء Endpoint.
---
# 15. Authorization
كل Endpoint يجب أن يتحقق من:
```text
User
Hospital
Role
Permission
Department
Resource
Action
```
مثال:
```text
POST /lab-results/{id}/approve
```
لا يكفي:
```text
User is logged in
```
بل يجب:
```text
User
+
LAB_RESULT_APPROVE
+
Correct Hospital
+
Correct Scope
```
---
# 16. Tenant Context
كل Request يجب أن يمتلك Tenant Context.
مثال:
```text
Authenticated User
↓
Session (active membership → tenant_id)
↓
Request Context
↓
Service
↓
Database Query
```
لا يجب السماح للمستخدم بتحديد:
```text
tenant_id=another-hospital
```
والاعتماد على القيمة القادمة من Frontend فقط.
Tenant يجب أن يأتي من Context موثوق.
---
# 17. API Input Validation
كل Endpoint يجب أن يستخدم Schema Validation.
مثال:
```text
POST /patients
```
يتحقق من:
```text
firstName
lastName
dateOfBirth
nationalId
phone
gender
```
حسب إعدادات المؤسسة وقواعد البلد.
---
# 18. Localization
API يجب أن تدعم:
```text
Arabic
English
```
ولا يجب وضع النصوص داخل Business Logic.
مثال:
```text
error.code:
PATIENT_NOT_FOUND
```
ثم الواجهة تعرض الرسالة المناسبة باللغة الحالية.
---
# 19. Date and Time
يجب تخزين Timestamps بطريقة موحدة.
يفضل:
```text
UTC
```
مع عرض الوقت وفق:
```text
Hospital Timezone
```
مثال:
```text
Database:
2026-10-01T14:30:00Z
Hospital:
Local Time
```
---
# 20. Currency
لا يجب Hard-code للعملة.
يجب أن يدعم النظام:
```text
Currency
Decimal Precision
Exchange Rate
Tax Configuration
```
حسب المستشفى.
---
# 21. Pagination
القوائم الكبيرة يجب أن تدعم Pagination.
مثال:
```text
GET /patients?page=1&limit=25
```
ويفضل دعم:
```text
page
limit
sort
order
```
حسب Endpoint.
---
# 22. Filtering
مثال:
```text
GET /patients?
search=Yousef
&gender=male
&page=1
&limit=25
```
يجب عدم السماح للمستخدم بتمرير Filters تؤدي إلى استعلامات غير آمنة.
---
# 23. Search
يجب أن تكون Search APIs مصممة للبيانات الحساسة.
مثال:
```text
Patient Search
```
يجب أن تتحقق من صلاحية المستخدم قبل إرجاع النتائج.
لا يجب أن يعيد Search:
```text
Private Notes
Full Medical History
Financial Data
```
إلا إذا كانت الصلاحية تسمح بذلك.
---
# 24. API Rate Limiting
يجب تطبيق Rate Limits على:
```text
Authentication
Search
Public APIs
File Upload
Exports
External Webhooks
Password Reset
OTP
```
---
# 25. Idempotency
العمليات الحساسة يجب أن تدعم Idempotency.
خصوصًا:
```text
Payments
Orders
Claims
Sync Events
Webhooks
External Integrations
```
مثال:
```text
POST /payments
Idempotency-Key: abc123
```
إذا تكرر الطلب:
```text
abc123
```
لا يجب إنشاء Payment ثانية.
---
# 26. Transactions
العمليات الحساسة يجب أن تستخدم Database Transactions.
مثال:
```text
Dispense Medication
↓
Create Dispensing
↓
Decrease Stock
↓
Create Stock Movement
↓
Audit
```
يجب أن تكون العملية متسقة.
إذا فشل جزء أساسي:
```text
Rollback
```
حسب العملية.
---
# 27. Domain Events
يمكن استخدام Events للتواصل بين Modules.
مثال:
```text
PatientRegistered
AppointmentCreated
EncounterCompleted
LabOrderCreated
LabResultApproved
MedicationDispensed
InvoiceCreated
PaymentReceived
PatientAdmitted
PatientDischarged
```
---
# 28. Event Architecture
```text
Domain Module
│
▼
Domain Event
│
▼
Event Bus / Queue
│
┌────┼──────┐
▼    ▼      ▼
Audit Notification Reporting
```
---
# 29. Events vs Direct API Calls
استخدم Direct Service/API Call عندما تحتاج النتيجة مباشرة.
مثال:
```text
Pharmacy
↓
Check Stock
```
استخدم Event عندما تكون العملية غير متزامنة.
مثال:
```text
Payment Received
↓
Event
├── Notification
├── Audit
└── Analytics
```
---
# 30. Queue Architecture
يمكن استخدام:
```text
Redis
+
BullMQ
```
لـ:
* Background jobs.
* Notifications.
* Reports.
* Sync.
* External integrations.
* File processing.
---
# 31. Queue Reliability
كل Job يجب أن يدعم:
```text
Retry
Backoff
Dead Letter / Failed Queue
Job ID
Idempotency
Logging
Monitoring
```
---
# 32. External Integrations
يجب بناء Integration Layer منفصلة.
```text
Hospital System
│
▼
Integration Layer
│
┌─────┼─────────┐
▼     ▼         ▼
Lab   PACS      SMS
API   DICOM     Provider
```
لا يجب وضع Provider-specific code داخل Patient Module أو Finance Module.
---
# 33. Integration Adapter Pattern
كل مزود خارجي يجب أن يكون Adapter.
مثال:
```text
SmsProvider
│
├── ProviderA
├── ProviderB
└── ProviderC
```
يمكن تغيير المزود بدون تعديل Business Logic.
---
# 34. SMS Integration
النظام يجب أن يدعم SMS Provider abstraction.
مثال:
```text
Notification Service
↓
SMS Adapter
↓
Provider
```
الاستخدامات:
```text
Appointment Reminder
Patient Notification
Password Reset
OTP
```
حسب سياسة المستشفى.
---
# 35. Email Integration
نفس المبدأ:
```text
Email Service
↓
Provider Adapter
↓
SMTP / API Provider
```
لا يجب ربط النظام مباشرة بمزود واحد.
---
# 36. WhatsApp / Messaging
إذا تم دعم Messaging Provider مستقبلًا:
```text
Notification Service
↓
Messaging Adapter
↓
External Provider
```
يجب أن يكون اختياريًا وقابلًا للتعطيل لكل مستشفى.
---
# 37. Payment Integration
للمستشفيات التي تحتاج Payments:
```text
Finance
↓
Payment Service
↓
Payment Adapter
↓
Payment Provider
```
أمثلة مستقبلية:
```text
Card
Bank
Online Gateway
Local Payment Provider
```
لا يجب تخزين بيانات البطاقة الحساسة داخل النظام إذا لم يكن ذلك مطلوبًا.
يفضل استخدام Tokenization/Hosted Payment Pages عند توفرها.
---
# 38. Insurance Integration
البنية:
```text
Patient
↓
Insurance
↓
Eligibility
↓
Encounter
↓
Claim
↓
Integration Adapter
↓
Insurance Provider
```
يجب دعم:
```text
Eligibility Check
Claim Submission
Claim Status
Claim Response
```
حسب API المتوفر لدى مزود التأمين.
---
# 39. Laboratory Integration
يمكن ربط Laboratory Information Systems أو أجهزة المختبر عند توفر واجهة مناسبة.
المعمارية:
```text
HIS
│
▼
Lab Integration Adapter
│
▼
LIS / Analyzer
```
يجب أن تدعم المعمارية مستقبلًا معايير صحية مناسبة عندما تكون متاحة، مثل:
```text
HL7
FHIR
```
لكن لا يجب افتراض أن كل جهاز أو مختبر يدعمها.
---
# 40. HL7
يجب تصميم Integration Layer بحيث يمكنها التعامل مستقبلًا مع HL7.
أمثلة استخدام:
```text
Patient Registration
Orders
Results
Admissions
Discharges
Transfers
```
ويجب أن يكون Parsing/Mapping في طبقة Integration وليس داخل Core Domain.
---
# 41. FHIR
يجب تصميم النظام ليكون قابلًا لتوفير FHIR-compatible APIs مستقبلًا.
أمثلة Resources:
```text
Patient
Practitioner
Organization
Encounter
Observation
DiagnosticReport
Medication
MedicationRequest
Appointment
Condition
Procedure
```
لكن لا يجب إجبار قاعدة البيانات الداخلية على مطابقة FHIR حرفيًا.
الصحيح:
```text
Internal Domain Model
↓
FHIR Mapping Layer
↓
FHIR API
```
---
# 42. Radiology / DICOM
Radiology Integration:
```text
HIS
│
▼
Radiology Order
│
▼
DICOM Workflow
│
▼
PACS
│
▼
Radiologist
│
▼
Report
```
يجب أن يدعم النظام معرفات تربط:
```text
Patient
Encounter
Order
Study
Accession Number
PACS Study UID
Report
```
---
# 43. DICOM Gateway
يفضل أن تكون هناك طبقة Gateway عند الحاجة:
```text
Imaging Device
↓
DICOM Gateway
↓
PACS
↓
HIS Integration
```
هذا يمنع ربط Core Application مباشرة بكل جهاز طبي.
---
# 44. Pharmacy Integration
يمكن مستقبلًا ربط:
```text
Medication Database
Drug Information Provider
Barcode Systems
External Pharmacy
```
عن طريق Adapter Layer.
---
# 45. Inventory Integration
يمكن دعم:
```text
Barcode
RFID
Warehouse Systems
Supplier APIs
Procurement Platforms
```
حسب احتياجات المستشفى.
---
# 46. Government Integrations
يجب أن تكون التكاملات الحكومية اختيارية وقابلة للتكوين.
مثال:
```text
Hospital
↓
Government Integration Adapter
↓
External Government System
```
لا يجب Hard-code لنظام حكومي معين داخل Core Platform.
---
# 47. Webhooks
يمكن للنظام استقبال Webhooks من الأنظمة الخارجية.
مثال:
```text
Payment Provider
↓
Webhook
↓
Integration API
↓
Validation
↓
Process
↓
Audit
```
---
# 48. Webhook Security
يجب التحقق من:
```text
Signature
Timestamp
Provider
Event ID
Replay Protection
Payload
```
يجب عدم الوثوق في Webhook لمجرد وصوله إلى Endpoint.
---
# 49. Webhook Idempotency
كل Webhook يجب أن يمتلك Event ID أو معرفًا مكافئًا.
إذا وصل:
```text
event_123
event_123
```
يجب معالجة الأول فقط.
---
# 50. API Security for External Clients
إذا كان هناك Client خارجي:
```text
External System
↓
API Gateway
↓
Authentication
↓
Authorization
↓
Integration Service
```
لا يجب إعطاء External Client وصولًا كاملًا إلى Core API.
---
# 51. API Keys
API Keys يمكن استخدامها لبعض التكاملات، لكن:
* لا توضع في Frontend.
* يجب أن تكون قابلة للإلغاء.
* يجب تحديد صلاحياتها.
* يجب تسجيل استخدامها.
* يجب تدويرها.
* يجب تحديد انتهاء صلاحيتها عندما يكون ذلك مناسبًا.
---
# 52. Service Accounts
التكاملات طويلة الأجل يمكن أن تستخدم Service Accounts.
مثال:
```text
PACS Integration Account
```
ويجب أن يمتلك فقط:
```text
Required Permissions
```
ولا يجب أن يكون:
```text
SUPER_ADMIN
```
بدون ضرورة.
---
# 53. Integration Credentials
Credentials الخاصة بكل Integration يجب تخزينها في:
```text
Secret Manager
```
أو نظام Secrets مناسب.
لا تحفظ:
```text
API Secret
Private Key
Password
Token
```
داخل Database كنص واضح إذا كان بالإمكان تجنب ذلك.
---
# 54. Integration Configuration
كل مستشفى يجب أن يستطيع تفعيل التكاملات المطلوبة.
مثال:
```text
Integrations
├── SMS
├── Email
├── Payment
├── Insurance
├── PACS
├── LIS
└── Government
```
كل Integration:
```text
Enabled
Disabled
Configured
Test Connection
Last Sync
Last Error
```
---
# 55. Integration Health
يجب توفير صفحة Admin تعرض:
```text
Integration
Status
Last Successful Request
Last Failure
Latency
Pending Jobs
Failed Jobs
```
مثال:
```text
PACS
Connected
SMS
Connected
Insurance
Error
LIS
Not Configured
```
---
# 56. Integration Logs
كل Integration يجب أن تسجل:
```text
timestamp
integration
direction
event
requestId
status
duration
errorCode
```
لكن لا يجب تسجيل Secrets أو بيانات طبية كاملة بلا حاجة.
---
# 57. Retry Strategy
الاتصالات الخارجية قد تفشل.
يجب استخدام:
```text
Retry
Exponential Backoff
```
مثال:
```text
Attempt 1
↓
5 seconds
Attempt 2
↓
15 seconds
Attempt 3
↓
60 seconds
```
القيم قابلة للتكوين.
---
# 58. Circuit Breaker
إذا كان External Provider متوقفًا:
```text
Provider DOWN
↓
Repeated Failures
↓
Circuit Open
```
بدل إرسال آلاف Requests إليه.
بعد فترة:
```text
Half Open
↓
Test
↓
Recovered
```
---
# 59. Timeout
كل External Request يجب أن يمتلك Timeout.
لا يجب أن يبقى Request مفتوحًا إلى أجل غير محدود.
مثال:
```text
Provider Timeout
↓
Mark Failed / Pending
↓
Retry
```
---
# 60. Async Integration
العمليات التي لا تحتاج Response فوري يفضل تنفيذها Async.
مثال:
```text
Appointment Created
↓
Queue
↓
Send SMS
```
لا يجب أن يتوقف تسجيل الموعد بالكامل بسبب توقف SMS Provider.
---
# 61. Synchronous Integration
استخدم Synchronous عندما تكون النتيجة مطلوبة فورًا.
مثال:
```text
Check Insurance Eligibility
↓
Need Immediate Response
```
لكن يجب التعامل مع:
```text
Timeout
Failure
Unavailable Provider
```
بشكل واضح.
---
# 62. Integration Data Mapping
كل Integration يجب أن يحتوي على Mapping واضح.
مثال:
```text
Internal Patient ID
↕
External Patient ID
```
ويجب تخزين External Identifier بطريقة منظمة.
---
# 63. External IDs
يفضل وجود:
```text
ExternalSystem
ExternalEntityType
ExternalEntityId
InternalEntityId
```
حتى لا تعتمد المنصة على ID الخاص بالنظام الخارجي كـPrimary Key.
---
# 64. Data Ownership
يجب تحديد مصدر الحقيقة لكل بيانات.
مثال:
```text
Patient Identity
→ Hospital HIS
Lab Result
→ LIS / Hospital Lab Module
Radiology Study
→ PACS
Invoice
→ Finance Module
Payment
→ Finance / Payment Provider reconciliation
```
لا يجب أن يقوم نظام خارجي بتغيير بيانات داخلية مباشرة بدون Integration Workflow.
---
# 65. External Data Import
عند استيراد بيانات:
```text
External Data
↓
Validation
↓
Mapping
↓
Duplicate Detection
↓
Preview / Approval where needed
↓
Import
↓
Audit
```
لا يجب إدخال البيانات مباشرة إلى Database.
---
# 66. Data Export
يجب حماية:
```text
CSV
Excel
PDF
FHIR
HL7
API Export
```
والتحقق من صلاحية المستخدم.
كل Export حساس يجب أن يسجل في Audit Log.
---
# 67. Bulk Operations
عمليات Bulk يجب ألا تنفذ Request ضخمًا بدون حماية.
مثال:
```text
Import 100,000 Patients
```
يجب تنفيذها:
```text
Upload
↓
Queue
↓
Validate
↓
Process in Batches
↓
Report
```
---
# 68. API Documentation
يجب استخدام:
```text
OpenAPI
Swagger
```
لتوثيق API.
يجب أن تتضمن الوثائق:
```text
Endpoint
Method
Authentication
Permissions
Request
Response
Errors
Examples
```
---
# 69. API Contract
كل API يجب أن يكون له Contract واضح.
مثال:
```text
POST /api/v1/patients
```
يجب تعريف:
```text
Request Schema
Response Schema
Validation Rules
Error Codes
Permissions
Audit Behavior
```
---
# 70. API Testing
يجب إنشاء Tests لـ:
```text
Authentication
Authorization
Validation
Tenant Isolation
CRUD
Business Actions
Errors
Rate Limits
Idempotency
```
---
# 71. Integration Testing
يجب اختبار كل Integration باستخدام:
```text
Mock Provider
Sandbox
Test Environment
```
عندما يكون متوفرًا.
لا تستخدم Production Provider أثناء الاختبارات.
---
# 72. Contract Testing
عند وجود External API:
```text
Our API Contract
↕
External API Contract
```
يجب اختبار أن التغييرات لا تكسر التكامل.
---
# 73. API Monitoring
يجب مراقبة:
```text
Request Count
Latency
Error Rate
5xx
4xx
Timeouts
Queue Length
External Provider Failures
```
---
# 74. API Health
مثال:
```text
GET /api/v1/health
```
يمكن استخدامه داخليًا لمراقبة:
```text
API
Database
Redis
Storage
Queue
Sync
```
ويجب عدم كشف التفاصيل الداخلية للعامة.
---
# 75. Public API
إذا تم فتح API لجهات خارجية مستقبلًا، يجب أن يكون:
```text
Separate
Versioned
Rate Limited
Documented
Permissioned
Monitored
```
ويفضل عدم إعطاء Public API نفس صلاحيات Internal API.
---
# 76. Mobile Applications
إذا تم تطوير تطبيق Mobile مستقبلًا:
```text
Mobile App
↓
Public/API Gateway
↓
Authentication
↓
API
↓
Domain Services
```
لا يجب أن يتصل Mobile App مباشرة بـ:
```text
PostgreSQL
Redis
MinIO
```
---
# 77. Third-Party Apps
أي تطبيق خارجي يجب أن يتعامل مع:
```text
API Gateway
```
وليس Database مباشرة.
---
# 78. Internal Module Communication
داخل Modular Monolith:
```text
Patient Module
↓
Patient Service
```
و:
```text
Clinical Module
↓
Clinical Service
```
إذا احتاج Clinical إلى Patient:
```text
Clinical
↓
Patient Domain Service
```
وليس:
```text
Clinical
↓
Direct SQL into Patient Tables
```
---
# 79. Event Bus داخل Modular Monolith
حتى مع Modular Monolith، يجب تصميم Domain Events.
مثال:
```text
PatientRegistered
```
قد يستمع إليه:
```text
Audit
Notifications
Analytics
Integration
```
هذا يسهل الانتقال مستقبلًا إلى Services مستقلة إذا احتاج المشروع ذلك.
---
# 80. Future Microservices
لا يجب بناء Microservices الآن بدون حاجة.
لكن Architecture يجب أن تكون قابلة للتقسيم مستقبلًا:
```text
Current:
Modular Monolith
↓
Future:
Patient Service
Clinical Service
Lab Service
Radiology Service
Pharmacy Service
Finance Service
Integration Service
```
---
# 81. API Gateway Future
إذا أصبح النظام كبيرًا جدًا:
```text
Clients
↓
API Gateway
↓
Services
```
لكن لا يجب إضافة Gateway معقد فقط لمجرد استخدامه.
---
# 82. Integration Architecture Summary
البنية النهائية:
```text
CLIENTS
│
┌─────────────┼─────────────┐
│             │             │
Web          Mobile       External
│             │          Systems
└─────────────┼─────────────┘
│
▼
API / Gateway
│
┌─────────────┼─────────────┐
│             │             │
Auth/RBAC     Validation      Audit
│             │             │
└─────────────┼─────────────┘
│
DOMAIN SERVICES
│
┌───────────┬───────┼───────────┐
│           │       │           │
Clinical     Lab   Pharmacy      Finance
│           │       │           │
└───────────┴───────┼───────────┘
│
Event / Queue
│
┌─────────────────┼─────────────────┐
│                 │                 │
SMS              Email            Reports
│
├── Insurance
├── Payment
├── LIS
├── PACS/DICOM
├── FHIR/HL7
└── Government APIs
```
---
# 83. API Definition of Done
لا تعتبر API Feature مكتملة إلا إذا:
```text
[ ] Endpoint designed
[ ] Version defined
[ ] Authentication checked
[ ] Authorization checked
[ ] Tenant isolation checked
[ ] Input validation implemented
[ ] Response standardized
[ ] Error codes defined
[ ] Audit requirement reviewed
[ ] Idempotency considered
[ ] Transaction requirements reviewed
[ ] Rate limit considered
[ ] Tests implemented
[ ] OpenAPI documented
[ ] Monitoring/logging considered
```
---
# 84. Integration Definition of Done
لا يعتبر أي Integration مكتملًا إلا إذا:
```text
[ ] Adapter created
[ ] Credentials secured
[ ] Authentication implemented
[ ] Request validation implemented
[ ] Response mapping implemented
[ ] Timeout configured
[ ] Retry configured
[ ] Idempotency implemented
[ ] Error handling implemented
[ ] Audit implemented
[ ] Logs implemented
[ ] Health check implemented
[ ] Monitoring implemented
[ ] Sandbox tested
[ ] Production configuration documented
```
---
# 85. Cursor Implementation Rules
قبل تنفيذ أي API أو Integration:
1. اقرأ جميع وثائق المشروع السابقة.
2. حدد Module Owner للبيانات.
3. حدد مصدر الحقيقة للبيانات.
4. حدد Authentication.
5. حدد Permissions.
6. حدد Tenant Boundary.
7. حدد Audit Requirements.
8. حدد Transaction Requirements.
9. حدد Sync Requirements.
10. حدد Idempotency.
11. حدد Error Handling.
12. أنشئ Tests.
13. حدّث OpenAPI.
14. لا تضف Provider-specific code داخل Core Domain.
15. لا تنشئ تكاملًا مباشرًا مع Database خارجي.
16. لا تكسر API Version موجودًا دون خطة انتقال.
17. لا تستخدم Production Credentials في Development.
---
# 86. Final API Principle
الهدف هو أن تكون المنصة:
```text
API-FIRST
+
SECURE
+
MODULAR
+
VERSIONED
+
INTEGRATION-READY
+
OFFLINE-CAPABLE
+
AUDITABLE
+
SCALABLE
```
وتكون جميع التكاملات خارج Core Domain قدر الإمكان:
```text
Core Hospital Platform
│
▼
Integration Layer
│
┌──────┼────────┬────────┬─────────┐
▼      ▼        ▼        ▼         ▼
PACS   LIS    Insurance  Payment   Messaging
```
بهذه الطريقة يمكن تغيير مزود SMS أو Payment أو Insurance أو PACS دون إعادة بناء النظام الأساسي.
