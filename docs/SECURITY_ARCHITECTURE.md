# SECURITY ARCHITECTURE.md
## 1. الهدف
يحدد هذا المستند معمارية الأمن والحماية لمنصة إدارة المستشفيات الإلكترونية.
المنصة تتعامل مع بيانات شديدة الحساسية، بما في ذلك:
* بيانات المرضى الشخصية.
* السجلات الطبية.
* التشخيصات والعلاجات.
* نتائج المختبر.
* صور وتقارير الأشعة.
* الوصفات والأدوية.
* بيانات العمليات.
* بيانات بنك الدم.
* بيانات الموظفين.
* الفواتير والمدفوعات.
* بيانات التأمين.
* سجلات الدخول والتدقيق.
* بيانات المزامنة بين الخوادم.
يجب تصميم الأمن كجزء أساسي من النظام منذ البداية، وليس كإضافة لاحقة.
---
# 2. المبادئ الأمنية الأساسية
يجب أن تعتمد المنصة على المبادئ التالية:
1. Least Privilege
2. Defense in Depth
3. Secure by Default
4. Zero Trust داخل حدود النظام
5. Separation of Duties
6. Tenant Isolation
7. Auditability
8. Data Minimization
9. Fail Securely
10. Secure Development Lifecycle
لا يجوز اعتبار وجود النظام داخل شبكة المستشفى سببًا كافيًا لاعتباره آمنًا.
---
# 3. طبقات الحماية
يجب تقسيم الأمن إلى عدة طبقات:
```text
Internet
│
▼
Firewall / Router
│
▼
Reverse Proxy / WAF
│
▼
Application/API
│
▼
Authentication / Authorization
│
▼
Domain Services
│
▼
Database
│
▼
Encrypted Storage
```
بالإضافة إلى:
```text
Identity Security
Network Security
Endpoint Security
Database Security
Application Security
File Security
Audit & Monitoring
Backup & Disaster Recovery
Physical Security
```
---
# 4. Network Security
## 4.1 Network Segmentation
يجب دعم تقسيم شبكة المستشفى إلى VLANs.
مثال:
```text
VLAN 10 → Servers
VLAN 20 → Medical Devices
VLAN 30 → Doctors / Nurses
VLAN 40 → Administration
VLAN 50 → Pharmacy / Laboratory
VLAN 60 → Guest Wi-Fi
VLAN 70 → Network Management
```
لا يجب السماح لجميع الشبكات بالتواصل المباشر مع بعضها.
مثال:
```text
Guest Wi-Fi
X
│
X → Database
X → Medical Servers
```
---
# 5. Firewall
يجب أن تكون جميع الاتصالات الخارجية والداخلية الحساسة محكومة بسياسات Firewall.
يجب منع:
* الوصول المباشر إلى PostgreSQL من الإنترنت.
* الوصول المباشر إلى Redis من الإنترنت.
* الوصول المباشر إلى MinIO من الإنترنت بدون طبقة حماية.
* الوصول المباشر إلى Docker services من الإنترنت.
* أي Port غير ضروري.
قاعدة أساسية:
```text
Default Deny
```
ثم السماح فقط بالاتصالات المطلوبة.
---
# 6. المنافذ Ports
يجب عدم فتح منافذ الخدمات الداخلية للعامة.
مثال:
```text
80/443
↓
Reverse Proxy
3000
↓
Web Application
4000
↓
API
5432
↓
PostgreSQL
```
يجب ألا يكون:
```text
Internet → 5432
Internet → Redis
Internet → Internal API
```
مسموحًا.
---
# 7. HTTPS / TLS
جميع الاتصالات التي تحتوي على بيانات حساسة يجب أن تستخدم TLS.
يشمل ذلك:
* Browser → Server
* Browser → Cloud
* Server → Cloud
* API → API
* Sync → Sync
* Authentication
* File Upload
* PACS/DICOM gateway عندما يكون الاتصال عبر شبكة غير موثوقة
لا يجوز إرسال:
```text
Passwords
Tokens
Patient Data
Medical Records
Financial Data
```
عبر HTTP غير المشفر.
---
# 8. Authentication
يجب أن تكون المصادقة مركزية وقابلة للتوسع.
يجب دعم:
* Username/Password.
* MFA.
* Session management.
* Password policies.
* Account lockout/rate limiting.
* Password reset.
* Session expiration.
* Logout.
* Token rotation حيثما يلزم.
يجب عدم تخزين كلمات المرور كنص صريح.
استخدم خوارزمية Password Hashing قوية مثل:
```text
Argon2id
```
أو حلًا موثوقًا يوفره مزود الهوية.
---
# 9. Multi-Factor Authentication
يجب أن يدعم النظام MFA للمستخدمين الذين يتعاملون مع البيانات الحساسة.
أمثلة:
```text
Password
+
Authenticator App / TOTP
```
ويمكن دعم وسائل إضافية مستقبلًا حسب بيئة المستشفى.
يجب أن تكون MFA قابلة للتفعيل حسب:
* Hospital
* Role
* User
* Security Policy
---
# 10. Session Security
يجب حماية جلسات المستخدمين.
المتطلبات:
* Secure cookies.
* HttpOnly cookies.
* SameSite policy.
* Session expiration.
* Idle timeout.
* Session revocation.
* حماية من Session Fixation.
* حماية من CSRF عند استخدام Cookies.
* عدم وضع الأسرار داخل LocalStorage بدون ضرورة.
عند تسجيل خروج المستخدم:
```text
Session → Revoked
```
---
# 11. Authorization
المصادقة Authentication لا تعني أن المستخدم يستطيع الوصول إلى كل شيء.
يجب تطبيق:
```text
Authentication
↓
Role
↓
Permission
↓
Hospital
↓
Department
↓
Resource
↓
Action
```
مثال:
الممرضة يمكنها:
```text
View Patient
View Vitals
Add Nursing Note
Record Medication Administration
```
لكن لا يمكنها تلقائيًا:
```text
Approve Lab Result
Modify Invoice
Manage Users
Change System Configuration
```
---
# 12. RBAC
يجب استخدام Role-Based Access Control.
أمثلة Roles:
```text
SUPER_ADMIN
HOSPITAL_ADMIN
DOCTOR
NURSE
RECEPTIONIST
PHARMACIST
LAB_TECHNICIAN
RADIOLOGIST
SURGEON
ANESTHESIA
BLOOD_BANK_STAFF
ACCOUNTANT
INSURANCE_OFFICER
INVENTORY_OFFICER
HR_OFFICER
REPORT_VIEWER
```
لكن يجب عدم اعتبار Role وحده كافيًا.
يجب دعم Permissions مثل:
```text
PATIENT_VIEW
PATIENT_CREATE
PATIENT_EDIT
ENCOUNTER_VIEW
ENCOUNTER_CREATE
ENCOUNTER_EDIT
LAB_RESULT_ENTER
LAB_RESULT_APPROVE
RADIOLOGY_REPORT_CREATE
RADIOLOGY_REPORT_APPROVE
INVOICE_CREATE
PAYMENT_CREATE
REFUND_CREATE
USER_CREATE
USER_EDIT
ROLE_ASSIGN
```
---
# 13. Separation of Duties
العمليات الحساسة يجب ألا تعتمد على مستخدم واحد عندما تكون بيئة المستشفى بحاجة إلى فصل الصلاحيات.
مثال:
```text
Doctor
↓
Creates Order
Lab Technician
↓
Enters Result
Authorized Reviewer
↓
Approves Result
```
مثال مالي:
```text
Employee
↓
Creates Expense
Authorized Manager
↓
Approves Expense
```
---
# 14. Hospital Tenant Isolation
كل مستشفى يعتبر Tenant مستقل.
يجب ألا يستطيع مستخدم مستشفى A الوصول إلى بيانات مستشفى B.
يجب فرض العزل على عدة مستويات:
```text
Authentication
Authorization
API
Service Layer
Database Queries
File Storage
Reports
Search
Sync
```
يجب ألا يعتمد النظام فقط على إخفاء المستشفى من واجهة المستخدم.
---
# 15. Database Security
PostgreSQL هو مصدر البيانات الأساسي.
يجب:
* استخدام مستخدم Database محدود الصلاحيات للتطبيق.
* عدم استخدام PostgreSQL superuser من التطبيق.
* عدم كشف PostgreSQL للإنترنت.
* استخدام Prepared Statements / Prisma.
* حماية Connection Strings.
* استخدام Transactions للعمليات الحساسة.
* تطبيق Foreign Keys.
* تطبيق Constraints.
* إنشاء Indexes مناسبة.
* تفعيل النسخ الاحتياطي.
* مراقبة الوصول.
---
# 16. SQL Injection
يجب منع SQL Injection.
استخدام:
```text
Prisma
```
يساعد في ذلك، لكن لا يلغي مسؤولية المطور.
عند الحاجة إلى Raw SQL يجب استخدام:
```text
Parameterized Queries
```
ويمنع بناء SQL من:
```text
String Concatenation
```
باستخدام بيانات المستخدم.
---
# 17. Input Validation
كل البيانات القادمة من:
* Browser
* API
* Mobile
* External Integrations
* Sync
* Import Files
يجب التحقق منها.
استخدم طبقة Validation مركزية.
مثال:
```text
Zod
```
أو Validation مناسب في NestJS.
يجب التحقق من:
* Type
* Length
* Format
* Range
* Required fields
* Enum values
* IDs
* Dates
* Files
---
# 18. API Security
كل API Endpoint يجب أن يحدد:
```text
Authentication
Authorization
Validation
Rate Limit
Audit Requirement
```
مثال:
```text
POST /api/patients
```
يحتاج إلى:
```text
Authenticated User
+
PATIENT_CREATE
+
Valid Tenant
+
Valid Payload
+
Audit Log
```
---
# 19. Rate Limiting
يجب تطبيق Rate Limiting خصوصًا على:
```text
Login
Password Reset
OTP
Public APIs
File Upload
Search
Export
```
مثال:
```text
Too many login attempts
↓
Temporary block / cooldown
```
يجب تسجيل محاولات الهجوم المحتملة.
---
# 20. File Security
النظام قد يتعامل مع:
* Medical documents
* Lab attachments
* Radiology reports
* Images
* PDFs
* Patient documents
* Identity documents
يجب عدم حفظ الملفات الحساسة في:
```text
/public
```
أو مسار يمكن الوصول إليه مباشرة بدون Authorization.
يفضل استخدام:
```text
Private Object Storage
```
مع:
```text
Signed URLs
+
Expiration
+
Permission Check
```
---
# 21. File Upload Protection
يجب فحص:
```text
File Extension
MIME Type
File Size
File Content
Filename
```
يجب منع الملفات الخطرة مثل الملفات التنفيذية غير المطلوبة.
يجب إعادة تسمية الملفات باستخدام UUID أو معرف آمن بدل استخدام اسم المستخدم مباشرة.
مثال:
```text
original:
patient-report.pdf
stored:
7c9e...uuid.pdf
```
---
# 22. Medical Imaging / DICOM
Radiology يجب أن تكون قابلة للتكامل مع:
```text
DICOM
PACS
DICOM Gateway
```
ويجب ألا يتم التعامل مع الصور الطبية الكبيرة كأنها مجرد صور عادية.
المعمارية المقترحة:
```text
Imaging Device
↓
DICOM Gateway
↓
PACS
↓
Hospital System
↓
Radiology Study
↓
Radiologist Report
```
يجب تطبيق Authentication وNetwork Controls على هذه الاتصالات.
---
# 23. Secrets Management
يمنع وضع:
```text
Database Password
JWT Secret
API Keys
Encryption Keys
Cloud Credentials
SMTP Password
```
داخل Git.
يجب استخدام:
```text
Environment Variables
Secret Manager
Protected Deployment Secrets
```
ويجب توفير:
```text
.env.example
```
بدون أسرار حقيقية.
---
# 24. Encryption at Rest
يجب حماية البيانات المخزنة حسب مستوى حساسيتها.
يشمل ذلك:
```text
Database
Backups
Object Storage
Sensitive Files
Cloud Storage
```
يجب عدم اعتبار تشفير القرص بديلًا عن التحكم في صلاحيات التطبيق.
---
# 25. Encryption in Transit
يجب تشفير الاتصالات الحساسة.
مثال:
```text
Browser
↓ TLS
Nginx
↓
API
↓
Database
```
وفي الاتصال السحابي:
```text
Hospital Server
↓
Encrypted Sync
↓
Cloud Server
```
---
# 26. Audit Logging
يجب أن يكون Audit Log جزءًا أساسيًا من النظام.
يجب تسجيل العمليات الحساسة مثل:
```text
Login
Logout
Failed Login
Patient Created
Patient Updated
Record Viewed
Diagnosis Added
Prescription Created
Lab Result Entered
Lab Result Approved
Radiology Report Approved
Medication Dispensed
Invoice Created
Payment Recorded
Refund Created
User Created
Permission Changed
Configuration Changed
Data Exported
```
---
# 27. Audit Log Fields
يفضل أن يحتوي السجل على:
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
request_id
before_value
after_value
metadata
```
لكن يجب عدم تسجيل كلمات المرور أو الأسرار أو بيانات حساسة بلا حاجة.
---
# 28. Audit Log Immutability
لا يجب السماح للمستخدمين العاديين بتعديل Audit Logs.
يجب أن تكون عملية الحذف أو الاحتفاظ بها خاضعة لسياسة واضحة.
يفضل استخدام:
```text
Append-only
```
للسجلات الحساسة.
---
# 29. Data Privacy
يجب تطبيق مبدأ:
```text
Need to Know
```
المستخدم يرى فقط البيانات التي يحتاجها لأداء عمله.
مثال:
موظف الاستقبال قد يحتاج:
```text
Patient Name
Patient Number
Contact
Appointment
```
لكنه لا يحتاج بالضرورة إلى:
```text
Detailed Psychiatric Notes
Private Clinical Notes
Financial Information
```
---
# 30. Sensitive Data Access
يجب تسجيل الوصول إلى البيانات الطبية الحساسة عندما يكون ذلك مطلوبًا وفق سياسة المستشفى.
مثال:
```text
Doctor A
↓
Opened Patient Record
↓
System logs access
```
هذا يختلف عن مجرد تسجيل عملية تعديل البيانات.
---
# 31. Backup Security
النسخ الاحتياطية يجب ألا تكون جزءًا من نفس نظام التخزين فقط.
المعمارية المقترحة:
```text
Primary Hospital Server
│
├── Local Backup
│
└── Cloud Backup
│
└── Versioned Backup
```
يجب حماية النسخ الاحتياطية من:
* Unauthorized Access
* Accidental Deletion
* Ransomware
* Corruption
* Credential Compromise
---
# 32. Backup Encryption
يجب تشفير النسخ الاحتياطية الحساسة.
ويجب فصل صلاحيات النسخ الاحتياطي عن صلاحيات مستخدمي النظام اليومية قدر الإمكان.
---
# 33. Disaster Recovery
يجب تعريف:
```text
RPO
RTO
```
لكل مستشفى أو مستوى خدمة.
مثال:
```text
RPO:
Maximum acceptable data loss window.
RTO:
Maximum acceptable recovery time.
```
لا يجب افتراض قيمة واحدة لكل مستشفى.
يتم إعدادها أثناء Deployment حسب احتياجات المؤسسة.
---
# 34. Ransomware Protection
يجب تصميم النظام بحيث لا يكون اختراق حساب مستخدم واحد كافيًا لتدمير النظام والنسخ الاحتياطية.
يجب:
* فصل Backup Credentials.
* استخدام Versioned Backups.
* تطبيق Least Privilege.
* مراقبة عمليات الحذف الجماعي.
* تسجيل الأنشطة غير الطبيعية.
* فصل Backup Storage عن النظام الأساسي قدر الإمكان.
---
# 35. Sync Security
المزامنة بين:
```text
Hospital Server
↕
Cloud Server
```
يجب أن تكون مشفرة ومصادقًا عليها.
كل Sync Event يجب أن يحتوي على معرف فريد.
مثال:
```text
event_id
tenant_id
entity_type
entity_id
operation
payload
created_at
source_node
version
```
---
# 36. Sync Authentication
يجب ألا تعتمد المزامنة على:
```text
Public API Key
```
مكشوف.
يجب استخدام آلية قوية مثل:
```text
Mutual TLS
```
أو:
```text
Short-lived signed credentials
```
أو آلية مؤسسية مكافئة.
---
# 37. Sync Idempotency
إذا وصل نفس الحدث مرتين:
```text
Event A
Event A
```
يجب ألا يتم تنفيذ العملية مرتين.
مثال:
```text
event_id = abc123
```
إذا تم تطبيقه سابقًا:
```text
Duplicate → Ignore safely
```
---
# 38. Sync Conflict Security
في حالة التعارض:
```text
Hospital Data
VS
Cloud Data
```
يجب عدم الكتابة فوق البيانات تلقائيًا بدون سياسة.
خصوصًا في:
```text
Medical Records
Lab Results
Financial Records
Approved Reports
```
يجب إنشاء:
```text
Sync Conflict
```
وإحالته إلى آلية حل معتمدة.
---
# 39. Offline Security
عند انقطاع الإنترنت:
```text
Hospital LAN
↓
Internal Server
↓
Application
```
يجب أن يستمر النظام الأساسي.
لكن يجب ألا يعني Offline Mode تعطيل:
```text
Authentication
Authorization
Audit
```
يجب أن تستمر الضوابط الأمنية محليًا.
---
# 40. Device Security
أجهزة المستشفى قد تشمل:
```text
Desktop
Laptop
Tablet
Nursing Station
Reception PC
Medical Device
Barcode Scanner
Printer
```
يجب عدم افتراض أن الجهاز موثوق دائمًا.
يجب تطبيق:
* OS Security
* Antivirus/EDR حيث يناسب
* Screen Lock
* Automatic Session Timeout
* Restricted Accounts
* Network Segmentation
---
# 41. Medical Device Network
الأجهزة الطبية يجب أن تكون في شبكة منفصلة أو مقيدة قدر الإمكان.
لا يجب السماح لجهاز طبي غير ضروري بالوصول إلى:
```text
Database
Internet
Administrative Network
```
إلا إذا كان ذلك مطلوبًا وظيفيًا.
---
# 42. Security Headers
يجب تكوين Reverse Proxy وApplication لإرسال Security Headers المناسبة، مثل:
```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```
ويجب اختبار إعدادات CSP وعدم تعطيلها بشكل واسع فقط لتجنب مشاكل التطوير.
---
# 43. CORS
يجب عدم استخدام:
```text
Access-Control-Allow-Origin: *
```
لـ APIs الحساسة.
يجب تعريف Origins المسموحة صراحةً.
---
# 44. CSRF
إذا كانت المصادقة تعتمد على Cookies، يجب تطبيق حماية CSRF المناسبة.
يجب اختبار:
```text
POST
PUT
PATCH
DELETE
```
خصوصًا العمليات الحساسة.
---
# 45. XSS Protection
يجب منع تخزين وعرض HTML غير موثوق.
يجب تنظيف البيانات التي يمكن للمستخدم إدخالها وعرضها.
لا تستخدم:
```text
dangerouslySetInnerHTML
```
بدون سبب واضح وآلية Sanitization موثوقة.
---
# 46. Logging Security
يجب ألا تحتوي Logs على:
```text
Passwords
Access Tokens
Refresh Tokens
Database Passwords
Encryption Keys
```
ويجب تقليل البيانات الطبية الحساسة داخل Logs.
---
# 47. Monitoring
يجب مراقبة:
```text
CPU
RAM
Disk
Database
API
Sync
Authentication
Failed Login
Storage
Backup
Network
```
مع إمكانية إرسال Alerts.
مثال:
```text
Disk > 85%
↓
Warning
Disk > 95%
↓
Critical Alert
```
---
# 48. Intrusion Detection
يمكن إضافة IDS/IPS حسب حجم المستشفى والبنية التحتية.
يمكن أن تشمل المنظومة:
```text
Firewall Logs
Server Logs
Authentication Logs
Application Audit Logs
Network Monitoring
IDS/IPS
```
الهدف هو اكتشاف الأنشطة غير المعتادة وليس الاعتماد على أداة واحدة.
---
# 49. Vulnerability Management
يجب فحص:
```text
Dependencies
Docker Images
Operating System
Node Packages
npm/pnpm packages
Database
Web Application
```
بشكل دوري.
يجب معالجة:
```text
Critical
High
Medium
Low
```
حسب المخاطر والبيئة.
---
# 50. Secure Dependency Management
يجب:
* تثبيت إصدارات معروفة.
* استخدام Lockfile.
* مراجعة Dependencies.
* تحديث الحزم.
* إزالة الحزم غير المستخدمة.
* مراقبة Vulnerabilities.
لا يجب إضافة Package لمجرد أنها توفر ميزة صغيرة إذا كان بالإمكان تجنبها.
---
# 51. Secure Development
يجب اعتماد:
```text
Feature
↓
Threat Consideration
↓
Implementation
↓
Validation
↓
Authorization
↓
Tests
↓
Security Review
```
---
# 52. Code Review
الميزات الحساسة تحتاج مراجعة إضافية، خصوصًا:
```text
Authentication
Authorization
Patient Data
Medical Records
Payments
Insurance
User Management
File Upload
Sync
Backup
```
---
# 53. Security Testing
يجب أن تتضمن الاختبارات:
### Authentication Tests
```text
Invalid password
Locked account
Expired session
Invalid token
MFA failure
```
### Authorization Tests
```text
Unauthorized user
Wrong role
Wrong tenant
Wrong department
```
### API Tests
```text
Invalid input
Injection attempts
Rate limits
Malformed payloads
```
### File Tests
```text
Invalid extension
Oversized file
Unauthorized download
Malicious upload
```
### Sync Tests
```text
Duplicate event
Out-of-order event
Network failure
Conflict
Retry
```
---
# 54. Penetration Testing
قبل تشغيل النظام في مستشفى فعلي، يجب إجراء Security Assessment مناسب.
يشمل:
```text
Web Application
API
Authentication
Network
Database
File Storage
Sync
Infrastructure
```
يجب معالجة النتائج قبل الإنتاج حسب مستوى الخطورة.
---
# 55. Production Security Checklist
قبل Production يجب التأكد من:
```text
[ ] HTTPS enabled
[ ] Strong authentication
[ ] MFA configured where required
[ ] RBAC implemented
[ ] Tenant isolation tested
[ ] Database not publicly exposed
[ ] Secrets removed from repository
[ ] Rate limiting enabled
[ ] Input validation enabled
[ ] Audit logging enabled
[ ] File upload protected
[ ] Backups configured
[ ] Backup restore tested
[ ] Sync secured
[ ] Monitoring configured
[ ] Security headers configured
[ ] CORS restricted
[ ] Dependencies scanned
[ ] Vulnerability review completed
[ ] Disaster recovery tested
```
---
# 56. Security Incident Response
يجب أن يكون هناك مسار واضح عند اكتشاف حادث أمني:
```text
Detection
↓
Containment
↓
Investigation
↓
Eradication
↓
Recovery
↓
Post-Incident Review
```
يجب تسجيل:
```text
What happened?
When?
Which system?
Which tenant?
Which data?
Which accounts?
What was affected?
What action was taken?
```
---
# 57. Account Compromise
في حالة الاشتباه باختراق حساب:
```text
Disable / Suspend Account
↓
Revoke Sessions
↓
Reset Credentials
↓
Review Audit Logs
↓
Check Recent Activity
↓
Restore Access According to Policy
```
---
# 58. Data Breach
عند الاشتباه بتسريب بيانات:
يجب:
1. احتواء الحادث.
2. منع استمرار الوصول غير المصرح.
3. حفظ الأدلة والسجلات.
4. تحديد البيانات المتأثرة.
5. تحديد المستشفيات/المستخدمين المتأثرين.
6. تقييم المتطلبات القانونية والتنظيمية.
7. تنفيذ خطة الإبلاغ المعتمدة.
8. معالجة السبب.
9. توثيق الحادث.
---
# 59. Security Configuration
يجب عدم Hard-code للإعدادات الأمنية.
يجب أن تكون إعدادات مثل:
```text
Session Timeout
Password Policy
MFA Requirement
File Size Limit
Rate Limit
Backup Policy
Audit Retention
Sync Policy
```
قابلة للإدارة وفق صلاحيات مناسبة.
---
# 60. Environment Separation
يجب الفصل بين:
```text
Development
Testing
Staging
Production
```
ولا يجب استخدام Production Database في التطوير.
---
# 61. Production Data Protection
بيانات المرضى الحقيقية لا يجب نسخها إلى بيئة Development أو Testing إلا وفق سياسة معتمدة.
يفضل استخدام:
```text
Synthetic Data
Anonymized Data
```
للاختبارات.
---
# 62. Docker Security
عند استخدام Docker:
* لا تعمل الحاويات بصلاحيات أعلى من الحاجة.
* لا تستخدم `privileged` بدون ضرورة.
* لا تضع Secrets داخل Dockerfile.
* استخدم Images موثوقة.
* حدّث Images.
* افصل الشبكات بين الخدمات.
* لا تعرض جميع Ports.
* استخدم Read-only filesystem حيث يكون ذلك مناسبًا.
---
# 63. Reverse Proxy
يجب أن يكون Nginx أو Traefik هو المدخل الرئيسي للتطبيق عند الحاجة.
مثال:
```text
Client
↓
HTTPS
↓
Reverse Proxy
↓
Web/API
```
ويجب أن يتولى حسب التصميم:
* TLS
* Routing
* Security Headers
* Rate Limiting
* Access Controls المناسبة
* Logging
---
# 64. Database Network
PostgreSQL يجب أن يكون داخل شبكة داخلية.
مثال:
```text
Frontend
↓
API Network
↓
Database Network
↓
PostgreSQL
```
لا يجب أن يكون Database على شبكة المستخدمين مباشرة.
---
# 65. Redis Security
Redis يجب ألا يكون Public.
يجب استخدام:
```text
Private Network
Authentication
TLS where required
Access Restrictions
```
ويجب ألا يتم استخدام Redis كقاعدة بيانات طبية أساسية.
---
# 66. Object Storage Security
MinIO أو Cloud Object Storage يجب أن يكون:
```text
Private by default
```
والوصول إلى الملفات يتم عبر التطبيق أو Signed URLs.
---
# 67. Access Review
يجب أن تدعم المنصة مراجعة الصلاحيات بشكل دوري.
مثال:
```text
User
↓
Current Roles
↓
Current Permissions
↓
Department
↓
Employment Status
```
عند خروج الموظف:
```text
Employee Disabled
↓
Account Disabled
↓
Sessions Revoked
↓
Access Removed
```
---
# 68. Emergency Access
يمكن تصميم Emergency Access للبيئات الطبية عند الحاجة، لكن يجب أن يكون مضبوطًا بشدة.
مثال:
```text
Break Glass Access
```
عند استخدامه:
```text
Reason Required
+
Enhanced Audit
+
Time Limitation
```
ولا يجب استخدامه لتجاوز جميع ضوابط الأمن بشكل دائم.
---
# 69. Administrative Access
حسابات Super Admin يجب ألا تستخدم للعمليات اليومية.
يفضل:
```text
Normal Account
+
Privileged Administrative Account
```
حسب سياسة المؤسسة.
---
# 70. Security Architecture Summary
البنية الأمنية النهائية:
```text
INTERNET
│
▼
┌──────────────┐
│   FIREWALL   │
└──────┬───────┘
│
▼
┌──────────────┐
│ REVERSE PROXY│
│ HTTPS / WAF  │
└──────┬───────┘
│
┌─────────┴─────────┐
│                   │
▼                   ▼
WEB APPLICATION         API
│                   │
└─────────┬─────────┘
│
AUTH / RBAC / MFA
│
▼
DOMAIN SERVICES
│
┌────────────┼────────────┐
│            │            │
▼            ▼            ▼
PostgreSQL      Redis       Object Storage
│
▼
AUDIT LOG
│
▼
LOCAL BACKUP
│
▼
CLOUD BACKUP
```
وبالنسبة للمستشفى:
```text
Hospital LAN
│
├── Doctors
├── Nurses
├── Reception
├── Pharmacy
├── Laboratory
├── Radiology
└── Administration
│
▼
Internal Server
│
├── PostgreSQL
├── API
├── Web
├── Redis
├── Object Storage
└── Sync Service
│
│ Encrypted
▼
Cloud
```
---
# 71. Cursor Implementation Rules
يجب على Cursor التعامل مع هذا المستند باعتباره المرجع الأمني الأساسي.
قبل تنفيذ أي Feature:
1. تحديد البيانات الحساسة التي ستتعامل معها.
2. تحديد المستخدمين المسموح لهم بالوصول.
3. تحديد Permissions المطلوبة.
4. تحديد Tenant Boundary.
5. تحديد Audit Requirements.
6. تحديد Validation.
7. تحديد API Security.
8. تحديد File Security إذا وجدت ملفات.
9. تحديد Sync Security إذا كانت الميزة Offline/Cloud.
10. كتابة Tests للسيناريوهات الأمنية.
لا يجوز لـ Cursor:
* تجاوز Authorization لتسهيل التطوير.
* كشف Database مباشرة للواجهة.
* وضع Secrets داخل الكود.
* تعطيل HTTPS في Production.
* تعطيل Tenant Isolation.
* استخدام `*` في CORS للـ Production بدون مبرر.
* إنشاء Admin Backdoor.
* إنشاء Password ثابت للمستشفى.
* تخزين كلمات المرور كنص صريح.
* حذف Audit Logs لتسهيل الاختبار.
* السماح للمستخدم بتعديل بيانات لا يملك صلاحية تعديلها.
* نسخ بيانات Production إلى Development بدون حماية مناسبة.
---
# 72. Security Definition of Done
لا تعتبر أي Feature مكتملة أمنيًا إلا إذا تحقق:
```text
[ ] Authentication checked
[ ] Authorization checked
[ ] Tenant isolation checked
[ ] Input validation implemented
[ ] Secure database access
[ ] Audit requirements implemented
[ ] Sensitive data minimized
[ ] File security implemented where applicable
[ ] Rate limiting considered
[ ] Error messages do not leak secrets
[ ] Tests added
[ ] Security edge cases tested
[ ] Offline behavior reviewed where applicable
[ ] Sync security reviewed where applicable
[ ] Documentation updated
```
---
# 73. Final Security Principle
الأمن ليس Module مستقلًا فقط.
الأمن يجب أن يكون:
```text
Architecture
+
Code
+
Database
+
Network
+
Identity
+
Infrastructure
+
Operations
+
Monitoring
+
Backup
+
Development Process
```
ويجب أن تكون المنصة:
```text
Secure by Design
```
وليس:
```text
Secure After Development
```
---
# 74. Cursor Final Instruction
قبل تنفيذ أي جزء أمني أو Feature يتعامل مع بيانات المستشفى:
1. اقرأ:
* `HOSPITAL_SYSTEM_MASTER_SPEC.md`
* `DATABASE_SCHEMA.md`
* `MODULES.md`
* `UI_UX_SPECIFICATION.md`
* `SECURITY_ARCHITECTURE.md`
2. افحص Repository الحالي.
3. حدد أي تعارض بين التصميم الحالي وهذه الوثائق.
4. لا تقم بإعادة تصميم Architecture كاملة بشكل صامت.
5. اقترح خطة تنفيذ صغيرة وقابلة للاختبار.
6. نفذ على مراحل.
7. اختبر:
* Authentication
* Authorization
* Tenant Isolation
* Validation
* Audit
* Error Handling
* Offline
* Sync
8. حدّث الوثائق عند تغيير Architecture.
9. لا تعتبر Feature مكتملة لمجرد أن UI تعمل.
الهدف النهائي هو بناء منصة مستشفيات مؤسسية آمنة وقابلة للتشغيل محليًا داخل المستشفى، وقابلة للمزامنة مع Cloud، وقابلة للتوسع دون التضحية بعزل البيانات أو قابلية التدقيق.
