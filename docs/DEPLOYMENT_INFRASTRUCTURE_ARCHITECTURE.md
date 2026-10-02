# DEPLOYMENT_INFRASTRUCTURE_ARCHITECTURE.md
## 1. الهدف
يحدد هذا المستند البنية التحتية وطريقة نشر وتشغيل منصة إدارة المستشفيات الإلكترونية.
الهدف هو أن يكون النظام قادرًا على العمل في:
* مستشفى حكومي.
* مستشفى خاص.
* مستشفى غير ربحي.
* مستشفى صغير أو متوسط أو كبير.
* بيئة داخلية On-Premises.
* بيئة Cloud.
* بيئة Hybrid تجمع بين الاثنين.
يجب أن يكون النظام قادرًا على الاستمرار في تشغيل العمليات الأساسية داخل المستشفى حتى عند انقطاع الإنترنت.
---
# 2. Deployment Architecture
البنية الأساسية:
```text
INTERNET
│
▼
┌─────────────┐
│ ISP / Router│
└──────┬──────┘
│
▼
┌─────────────┐
│   FIREWALL  │
└──────┬──────┘
│
Hospital LAN
│
┌────────┴────────┐
│                 │
▼                 ▼
Internal Server      Network Devices
│
┌──────┼──────┐
│      │      │
▼      ▼      ▼
Web     API    DB
│      │
└──────┼──────┐
│      │
Redis  Storage
│
▼
Sync Service
│
Encrypted Link
│
▼
CLOUD
```
---
# 3. Hybrid Architecture
المنصة تعتمد Hybrid Architecture.
يوجد:
```text
Hospital On-Premises
+
Cloud Infrastructure
```
## On-Premises
يحتوي على الخدمات الضرورية للتشغيل المحلي:
```text
Web
API
Database
Redis
Object Storage
Sync Service
Monitoring
Local Backup
```
## Cloud
يستخدم للخدمات المركزية مثل:
```text
Remote Access
Central Monitoring
Cloud Backup
Disaster Recovery
Synchronization
Central Administration
Notifications
Analytics
Future Integrations
```
ليس مطلوبًا أن تعتمد العمليات الأساسية داخل المستشفى على Cloud بشكل مباشر.
---
# 4. Offline-First Operation
يجب أن يستطيع المستشفى الاستمرار في العمل عند:
```text
Internet = DOWN
```
لكن:
```text
Hospital LAN = UP
```
مثال:
```text
Doctor PC
│
▼
Hospital LAN
│
▼
Internal Server
│
▼
Hospital Database
```
يستطيع الطبيب:
* فتح ملف المريض.
* تسجيل الزيارة.
* إضافة التشخيص.
* كتابة الملاحظات.
* إنشاء وصفة.
* طلب مختبر.
* طلب أشعة.
حتى لو كان الإنترنت متوقفًا.
---
# 5. What Requires Internet?
الخدمات التي يمكن تأجيلها عند انقطاع الإنترنت تشمل:
```text
Cloud Sync
Cloud Backup
Remote Monitoring
External Notifications
External Integrations
Remote Administration
External Analytics
```
يجب أن تدخل العمليات المؤجلة في Queue.
عند عودة الإنترنت:
```text
Internet Restored
↓
Sync Queue
↓
Retry
↓
Cloud
↓
Acknowledgment
```
---
# 6. Hospital Internal Server
كل مستشفى يجب أن يمتلك Server داخليًا.
مثال:
```text
Server IP:
192.168.10.10
Internal DNS:
hospital.local
```
يمكن للمستخدمين الوصول:
```text
https://hospital.local
```
بدل كتابة IP في كل جهاز.
---
# 7. Server Hardware
اختيار السيرفر يعتمد على:
* عدد المستخدمين.
* عدد الأجهزة.
* عدد المرضى.
* عدد العمليات اليومية.
* عدد الأقسام.
* حجم الملفات.
* حجم الصور الطبية.
* PACS/DICOM.
* مدة الاحتفاظ بالبيانات.
كمثال مبدئي لمستشفى صغير/متوسط:
```text
CPU:
8–16 cores
RAM:
32–64 GB ECC
Storage:
Enterprise SSD/NVMe
Network:
1/10 GbE
Power:
Redundant PSU where possible
UPS:
Required
```
هذه ليست مواصفات ثابتة لكل مستشفى.
يجب إجراء Sizing قبل الشراء.
---
# 8. Server Vendors
يمكن استخدام Servers من الشركات المؤسسية مثل:
* Dell PowerEdge
* HPE ProLiant
* Lenovo ThinkSystem
ويتم اختيار الموديل حسب:
```text
Capacity
Budget
Warranty
Support
Expansion
Storage
Redundancy
```
---
# 9. Storage Architecture
يفضل عدم وضع كل البيانات على قرص واحد.
مثال:
```text
OS
↓
SSD
Database
↓
Enterprise SSD / RAID
Documents
↓
Object Storage
Backups
↓
Separate Storage
```
---
# 10. RAID
يجب اختيار RAID حسب متطلبات المستشفى.
أمثلة:
```text
RAID 1
RAID 5
RAID 6
RAID 10
```
لا يجب اعتبار RAID Backup.
القاعدة:
```text
RAID ≠ Backup
```
---
# 11. Local Backup
يجب أن يمتلك المستشفى Backup محليًا منفصلًا عن Primary Storage.
مثال:
```text
Primary Server
│
▼
Backup Server / NAS
```
يجب أن يكون Backup:
* Automated.
* Encrypted where appropriate.
* Versioned.
* Monitored.
* Tested.
---
# 12. Cloud Backup
يجب إرسال نسخة احتياطية إلى Cloud حسب سياسة المستشفى.
```text
Primary
↓
Local Backup
↓
Cloud Backup
```
Cloud Backup يجب ألا يعتمد على نفس Credentials المستخدمة في التطبيق.
---
# 13. Backup Schedule
مثال قابل للتعديل:
```text
Database:
Every 15–60 minutes for critical systems
Daily:
Full/Incremental Backup
Weekly:
Longer Retention Backup
Monthly:
Archive Backup
```
القيم النهائية تعتمد على:
```text
RPO
RTO
Storage
Budget
Hospital Policy
```
---
# 14. Backup Retention
يجب أن تكون سياسة الاحتفاظ قابلة للإعداد.
مثال:
```text
Hourly:
24–48 hours
Daily:
30 days
Weekly:
3 months
Monthly:
12 months
```
هذه أمثلة وليست سياسة قانونية ثابتة.
---
# 15. Restore Testing
Backup بدون Restore Test ليس ضمانًا كافيًا.
يجب اختبار:
```text
Backup
↓
Restore
↓
Integrity Check
↓
Application Test
```
بشكل دوري.
---
# 16. UPS
يجب توفير UPS للسيرفرات ومعدات الشبكة الأساسية.
على الأقل:
```text
Server
Network Switch
Firewall
Storage
```
ويفضل أن تكون الأجهزة الحرجة مدعومة بمصدر طاقة احتياطي مناسب.
---
# 17. Network Architecture
مثال شبكة:
```text
INTERNET
│
FIREWALL
│
CORE SWITCH
│
┌─────────────────┼─────────────────┐
│                 │                 │
Servers           Access Switch      Wi-Fi AP
│                 │
│          ┌──────┼──────┐
│          │      │      │
▼          ▼      ▼      ▼
Server     Doctors Nurses Admin
```
---
# 18. VLAN Architecture
يجب دعم VLANs.
مثال:
```text
VLAN 10
Servers
VLAN 20
Medical Devices
VLAN 30
Doctors / Nurses
VLAN 40
Administration
VLAN 50
Pharmacy / Laboratory
VLAN 60
Guest Wi-Fi
VLAN 70
Network Management
```
---
# 19. Inter-VLAN Rules
يجب ألا تكون كل VLANs قادرة على التواصل بحرية.
مثال:
```text
Guest
X
↓
Servers
Medical Devices
→ Only Required Services
Doctors/Nurses
→ Application
Administration
→ Authorized Application Modules
```
---
# 20. Internal DNS
يفضل استخدام Internal DNS.
مثال:
```text
hospital.local
```
أو نطاق داخلي مناسب حسب سياسة المؤسسة.
مثال:
```text
app.hospital.local
api.hospital.local
pacs.hospital.local
```
---
# 21. TLS Inside LAN
حتى داخل شبكة المستشفى، يجب عدم افتراض أن الشبكة موثوقة بالكامل.
يفضل استخدام HTTPS داخليًا.
مثال:
```text
https://hospital.local
```
بدل:
```text
http://192.168.10.10
```
---
# 22. Internal Certificate Management
يجب توفير طريقة لإدارة Certificates داخل المستشفى.
يمكن استخدام:
```text
Internal CA
```
أو حل مؤسسي مناسب.
يجب أن تكون أجهزة المستشفى قادرة على Trust الـCertificate.
---
# 23. Reverse Proxy
يجب استخدام Reverse Proxy أمام خدمات الويب/API.
مثال:
```text
Client
↓
HTTPS
↓
Nginx / Traefik
↓
Web / API
```
---
# 24. Application Containers
يفضل تشغيل الخدمات في Containers.
مثال:
```text
Docker
│
├── web
├── api
├── postgres
├── redis
├── minio
├── sync
└── monitoring
```
يمكن استخدام Docker Compose في البيئات الصغيرة والمتوسطة.
---
# 25. Container Networks
يجب فصل الشبكات منطقيًا.
مثال:
```text
proxy-network
application-network
database-network
storage-network
```
ليس مطلوبًا أن تكون كل الحاويات قادرة على الوصول إلى بعضها.
---
# 26. PostgreSQL Deployment
PostgreSQL يجب أن يكون داخل شبكة داخلية.
مثال:
```text
API
│
▼
PostgreSQL
```
ولا يجب:
```text
Internet
↓
PostgreSQL
```
---
# 27. Redis Deployment
Redis يستخدم للـ:
* Cache.
* Queues.
* Background jobs.
* Session-related infrastructure حسب التصميم.
ولا يستخدم كمصدر البيانات الطبية الأساسي.
---
# 28. Object Storage
يجب استخدام Object Storage للملفات الكبيرة.
On-Premises:
```text
MinIO
```
Cloud:
```text
Cloud Object Storage
```
مثال:
```text
Patient Document
↓
Object Storage
↓
File ID
↓
Database
```
لا يتم تخزين Binary Files الكبيرة داخل جداول PostgreSQL إلا إذا كان هناك سبب معماري واضح.
---
# 29. File Storage Structure
يفضل تنظيم الملفات باستخدام معرفات داخلية.
مثال:
```text
tenant/
patient/
patient-id/
documents/
lab/
radiology/
```
لكن يجب ألا يكون المسار نفسه وسيلة Authorization.
الصلاحية تأتي من Application Authorization.
---
# 30. Cloud Architecture
مثال:
```text
CLOUD
│
┌─────────┼─────────┐
│         │         │
API      Storage    Backup
│
DB
│
Redis
│
Monitoring
```
ويجب أن تكون Cloud Services معزولة ومحمية.
---
# 31. Cloud Is Not the Primary Local Database
في النظام Offline-First:
```text
Hospital Database
```
هو مصدر البيانات المحلي أثناء التشغيل الداخلي.
Cloud يعمل كجزء من Hybrid Architecture وليس كبديل إجباري لاتصال الإنترنت.
---
# 32. Synchronization
المزامنة:
```text
Hospital
│
│ Encrypted Sync
▼
Cloud
```
يجب أن تكون:
* Event-based.
* Retryable.
* Idempotent.
* Auditable.
* Conflict-aware.
---
# 33. Sync Queue
عند انقطاع الإنترنت:
```text
Local Operation
↓
Database Transaction
↓
Sync Event
↓
Pending Queue
```
عند عودة الاتصال:
```text
Pending Queue
↓
Sync Worker
↓
Cloud
↓
ACK
↓
Completed
```
---
# 34. Sync Status
يجب أن يستطيع Administrator رؤية:
```text
Connected
Syncing
Offline
Pending Events
Failed Events
Last Successful Sync
Last Error
```
---
# 35. Deployment Environments
يجب توفير:
```text
Development
Testing
Staging
Production
```
لكل بيئة إعداداتها الخاصة.
---
# 36. Production Configuration
يجب ألا يتم تشغيل Production باستخدام إعدادات Development.
يجب فصل:
```text
DATABASE_URL
JWT_SECRET
API_KEYS
SMTP
STORAGE
CLOUD
```
لكل بيئة.
---
# 37. Environment Variables
يجب توفير:
```text
.env.example
```
مثال:
```text
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
CLOUD_SYNC_URL=
```
يجب ألا يحتوي الملف على Credentials حقيقية.
---
# 38. Deployment Automation
يفضل توفير Scripts مثل:
```text
install.sh
update.sh
backup.sh
restore.sh
health-check.sh
```
أو بدائل Windows/Linux مناسبة.
---
# 39. Hospital Installation Process
عند تركيب النظام في مستشفى جديد:
```text
1. Network Assessment
2. Server Preparation
3. OS Installation
4. Docker Installation
5. Database Setup
6. Storage Setup
7. Application Deployment
8. Internal DNS
9. TLS
10. Firewall Rules
11. User/Role Setup
12. Module Configuration
13. Backup Configuration
14. Cloud Connection
15. Sync Configuration
16. Testing
17. Training
18. Go-Live
```
---
# 40. Hospital Configuration
كل مستشفى يجب أن يمتلك:
```text
Hospital Profile
Hospital Type
Departments
Branches
Users
Roles
Permissions
Modules
Working Hours
Localization
Currency
Timezone
Numbering
Print Settings
Notification Settings
Backup Policy
Sync Policy
```
---
# 41. Module Activation
لا يجب تشغيل كل Modules لكل مستشفى تلقائيًا.
مثال:
```text
Private Hospital:
Clinical
Emergency
Laboratory
Radiology
Pharmacy
Finance
Insurance
Inventory
Government Hospital:
Clinical
Emergency
Laboratory
Radiology
Pharmacy
Inventory
Reports
Non-Profit:
Clinical
Beneficiary Services
Laboratory
Pharmacy
Inventory
Optional Finance
```
هذه أمثلة Configuration وليست قواعد ثابتة.
---
# 42. Branch Architecture
إذا كان للمستشفى عدة فروع:
```text
Organization
│
├── Hospital A
├── Hospital B
└── Hospital C
```
يمكن أن تشارك المؤسسة بعض الإعدادات المركزية مع الحفاظ على عزل البيانات حسب الفرع.
---
# 43. Multi-Tenant Cloud
إذا كانت المنصة تخدم عدة مستشفيات:
```text
Cloud
│
├── Hospital A
├── Hospital B
├── Hospital C
└── Hospital D
```
يجب تطبيق Tenant Isolation بشكل صارم.
لا يجب أن يستطيع مستخدم Hospital A الوصول إلى Hospital B.
---
# 44. Local Tenant Isolation
حتى في بيئة مستشفى واحدة يجب تطبيق الصلاحيات حسب:
```text
Hospital
Branch
Department
Role
User
```
حسب Configuration.
---
# 45. Monitoring Architecture
يجب توفير Monitoring.
يمكن استخدام:
```text
Prometheus
Grafana
Loki
```
أو بدائل مؤسسية مناسبة.
المراقبة تشمل:
```text
CPU
RAM
Disk
Network
Database
API
Containers
Sync
Backups
```
---
# 46. Health Checks
كل Service مهم يجب أن يمتلك Health Check.
مثال:
```text
/api/health
```
يجب أن يوضح على الأقل حالة:
```text
Application
Database
Redis
Storage
Sync
```
مع عدم كشف معلومات حساسة للمستخدمين غير المصرح لهم.
---
# 47. Logging Architecture
يفضل جمع Logs مركزيًا.
```text
Web
│
API
│
Workers
│
Sync
│
Database
│
▼
Central Logging
```
يجب فصل:
```text
Application Logs
Audit Logs
Security Logs
Infrastructure Logs
```
حسب الحاجة.
---
# 48. Updates
يجب أن تكون تحديثات النظام قابلة للإدارة.
مثال:
```text
New Version
↓
Backup
↓
Health Check
↓
Database Migration
↓
Deploy
↓
Verification
```
---
# 49. Database Migrations
كل تغيير في Database يجب أن يتم عبر Migration.
يمنع:
```text
Manual Production Schema Editing
```
بدون توثيق أو Migration.
يجب أن تكون migrations:
* Versioned.
* Reviewable.
* Tested.
* Reproducible.
---
# 50. Update Rollback
قبل التحديث:
```text
Database Backup
Application Backup
Configuration Backup
```
إذا حدث فشل:
```text
Failed Update
↓
Investigate
↓
Rollback / Recovery Plan
```
لا يجب افتراض أن كل Database Migration يمكن عكسها تلقائيًا.
---
# 51. Zero-Downtime
يمكن دعم Zero-Downtime للتحديثات في البيئات الكبيرة مستقبلًا.
لكن المستشفيات الصغيرة يمكن أن تستخدم Maintenance Window.
الأولوية:
```text
Data Integrity
+
Safe Deployment
```
قبل Zero-Downtime.
---
# 52. Disaster Recovery Site
المستشفيات الكبيرة قد تحتاج:
```text
Primary Site
│
▼
Secondary Site
│
▼
Cloud Disaster Recovery
```
حسب RTO/RPO.
---
# 53. High Availability
يمكن دعم High Availability مستقبلًا:
```text
Server A
│
├── Application
│
Server B
│
└── Application
Database HA
Storage HA
Network HA
```
لكن لا يجب إضافة التعقيد بدون حاجة تشغيلية واضحة.
---
# 54. Small Hospital Deployment
مثال لمستشفى صغير:
```text
Internet
│
Firewall
│
Switch
│
Server
├── Web
├── API
├── PostgreSQL
├── Redis
├── MinIO
└── Sync
```
مع:
```text
UPS
+
Local Backup
+
Cloud Backup
```
---
# 55. Medium Hospital Deployment
```text
Internet
│
Firewall HA
│
Core Switch
│
┌──┼──────────────┐
│  │              │
Servers      Access Switches
│                  │
│          ┌───────┼────────┐
│          │       │        │
Doctors   Nurses  Pharmacy  Admin
│
├── DB
├── API
├── Web
├── Storage
├── Sync
└── Monitoring
```
---
# 56. Large Hospital Deployment
يمكن أن يتضمن:
```text
Multiple Servers
Database Cluster
Dedicated Storage
PACS
Redundant Network
Multiple Firewalls
Load Balancers
Backup Infrastructure
Monitoring Cluster
Disaster Recovery
```
يتم تصميمه بعد إجراء Capacity Planning.
---
# 57. PACS Infrastructure
Radiology قد تحتاج بنية منفصلة:
```text
CT
MRI
X-Ray
Ultrasound
│
▼
DICOM Network
│
▼
DICOM Gateway
│
▼
PACS
│
▼
Hospital HIS
```
الـHIS لا يجب أن يحاول أن يصبح PACS كاملًا إذا كانت المؤسسة تحتاج نظام PACS متخصص.
---
# 58. Printing Infrastructure
النظام يجب أن يدعم:
```text
Reception Printers
Prescription Printers
Lab Printers
Radiology Printers
Finance Printers
Label Printers
```
ويجب أن تكون إعدادات الطباعة قابلة للتكوين حسب القسم والمستشفى.
---
# 59. Barcode Infrastructure
يمكن دعم:
```text
Barcode Scanner
Label Printer
Patient Barcode
Sample Barcode
Medication Barcode
Inventory Barcode
```
ويجب ربطها بالعمليات وليس اعتبارها مجرد إدخال نص.
---
# 60. Time Synchronization
جميع الأجهزة والخوادم يجب أن تستخدم وقتًا متزامنًا قدر الإمكان.
يفضل استخدام:
```text
NTP
```
لأن:
```text
Audit Logs
Sync
Medical Events
Financial Transactions
```
تعتمد على Timestamp صحيح.
---
# 61. DNS and Naming
يجب وضع Naming Convention واضح.
مثال:
```text
app.hospital.local
api.hospital.local
db.hospital.local
pacs.hospital.local
monitoring.hospital.local
```
لا يجب كشف أسماء داخلية حساسة للعامة.
---
# 62. Server Naming
مثال:
```text
HOSP-APP-01
HOSP-DB-01
HOSP-STORAGE-01
HOSP-BACKUP-01
HOSP-MON-01
```
يمكن تغيير Naming Convention حسب المؤسسة.
---
# 63. Infrastructure Inventory
يجب أن يحتفظ النظام أو وثائق Deployment بجرد:
```text
Server
IP
MAC
Hostname
OS
Version
Role
Location
Warranty
Owner
Backup Status
```
لكن يجب حماية هذه المعلومات.
---
# 64. Installation Checklist
قبل Go-Live:
```text
[ ] Network tested
[ ] VLANs configured
[ ] Firewall configured
[ ] Server installed
[ ] UPS installed
[ ] RAID/storage verified
[ ] OS updated
[ ] Docker installed
[ ] Application deployed
[ ] Database configured
[ ] Redis configured
[ ] Object storage configured
[ ] Internal DNS configured
[ ] HTTPS configured
[ ] Users configured
[ ] Roles configured
[ ] Modules configured
[ ] Backup configured
[ ] Restore tested
[ ] Cloud configured
[ ] Sync tested
[ ] Monitoring enabled
[ ] Health checks verified
[ ] Printing tested
[ ] Barcode tested
[ ] PACS integration tested if applicable
[ ] Staff training completed
[ ] Go-Live approval completed
```
---
# 65. Production Acceptance Test
قبل تسليم النظام للمستشفى يجب اختبار:
### Core
```text
Login
Patient
Appointment
Encounter
Prescription
Lab
Radiology
Pharmacy
Inventory
Finance
```
حسب Modules المفعلة.
### Offline
```text
Disconnect Internet
↓
Use System
↓
Create Records
↓
Reconnect Internet
↓
Verify Sync
```
### Backup
```text
Create Backup
↓
Restore
↓
Verify Data
```
### Security
```text
Unauthorized User
↓
Access Denied
```
---
# 66. Go-Live Strategy
يفضل عدم نقل كل المستشفى دفعة واحدة إذا كان حجم النظام كبيرًا.
يمكن استخدام:
```text
Phase 1:
Registration + Patients
Phase 2:
Appointments + Clinical
Phase 3:
Lab + Radiology
Phase 4:
Pharmacy + Inventory
Phase 5:
Finance + Insurance
Phase 6:
Advanced Modules
```
حسب احتياجات المستشفى.
---
# 67. Rollout
يمكن تنفيذ:
```text
Pilot Department
↓
Validation
↓
Fixes
↓
Second Department
↓
Hospital-wide Rollout
```
---
# 68. Support Architecture
بعد Go-Live يجب وجود:
```text
Support
Monitoring
Backup Monitoring
Security Monitoring
Update Management
Incident Management
```
ويجب أن يكون لكل مستشفى جهة اتصال ومسؤول نظام.
---
# 69. Remote Support
إذا احتاج فريق الشركة إلى الوصول عن بعد:
يجب ألا يتم فتح السيرفر مباشرة على الإنترنت.
يفضل استخدام:
```text
VPN
```
أو حل Remote Access مؤسسي آمن.
الوصول الإداري يجب أن يكون:
* Authenticated.
* Authorized.
* Logged.
* Time-limited where possible.
---
# 70. No Hidden Backdoors
يمنع إنشاء:
```text
Hidden Admin Account
Master Password
Secret URL
Undocumented API
```
للوصول إلى النظام.
أي وصول إداري يجب أن يكون موثقًا ومراقبًا.
---
# 71. Documentation Delivered With Hospital
عند تسليم النظام، يجب توفير:
```text
Installation Guide
Admin Guide
User Guide
Network Diagram
Server Diagram
Backup Policy
Recovery Procedure
Security Configuration
Update Procedure
Troubleshooting Guide
Contact / Support Procedure
```
---
# 72. Infrastructure Definition of Done
لا تعتبر عملية Deployment مكتملة إلا إذا:
```text
[ ] Server operational
[ ] Network operational
[ ] Application operational
[ ] Database operational
[ ] Storage operational
[ ] Backup operational
[ ] Restore tested
[ ] HTTPS operational
[ ] DNS operational
[ ] Authentication operational
[ ] RBAC operational
[ ] Audit operational
[ ] Monitoring operational
[ ] Sync operational
[ ] Offline mode tested
[ ] Security tested
[ ] Documentation delivered
```
---
# 73. Cursor Implementation Rules
قبل بناء Deployment:
1. اقرأ:
* `HOSPITAL_SYSTEM_MASTER_SPEC.md`
* `DATABASE_SCHEMA.md`
* `MODULES.md`
* `UI_UX_SPECIFICATION.md`
* `SECURITY_ARCHITECTURE.md`
* `DEPLOYMENT_INFRASTRUCTURE_ARCHITECTURE.md`
2. افحص المشروع الحالي.
3. لا تغير Architecture الرئيسية بدون توثيق.
4. لا تضع Secrets داخل Repository.
5. لا تجعل Database Public.
6. لا تفترض أن Internet متاح دائمًا.
7. اختبر النظام بدون Internet.
8. اختبر Backup وRestore.
9. اختبر Sync بعد عودة الإنترنت.
10. وثق أي Infrastructure Decision جديد.
---
# 74. Final Architecture
المعمارية النهائية المستهدفة:
```text
INTERNET
│
▼
┌───────────────┐
│    FIREWALL   │
└───────┬───────┘
│
HOSPITAL LAN
│
┌───────┴────────┐
│                │
▼                ▼
CORE SWITCH        Wi-Fi
│
┌─────────┼──────────┐
│         │          │
▼         ▼          ▼
Servers    Medical    Users
│       Devices
│
┌─────┼────────────────────────┐
│     │       │       │        │
▼     ▼       ▼       ▼        ▼
Web   API     DB     Redis    Storage
│     │       │       │        │
└─────┴───────┴───────┴────────┘
│
▼
Sync Service
│
Encrypted Link
│
▼
CLOUD
│
┌────────────┼────────────┐
▼            ▼            ▼
Backup       Storage      Monitoring
│
▼
Disaster Recovery
```
---
# 75. Final Principle
البنية التحتية يجب أن تحقق:
```text
LOCAL FIRST
+
SECURE
+
RELIABLE
+
OFFLINE CAPABLE
+
CLOUD CONNECTED
+
BACKUP READY
+
SCALABLE
+
MONITORED
```
والهدف ليس بناء نظام يعتمد على سيرفر Cloud فقط.
الهدف هو بناء منصة مؤسسية تستطيع أن تعمل داخل المستشفى بشكل مستقل، ثم تستفيد من Cloud للمزامنة، النسخ الاحتياطي، المراقبة، الخدمات المركزية، والتوسع.
---
# 76. Cursor Final Instruction
تعامل مع هذا المستند كمرجع Infrastructure رسمي للمشروع.
لا تبدأ في تنفيذ Production Deployment قبل التأكد من:
```text
Architecture
+
Security
+
Database
+
Network
+
Backup
+
Recovery
+
Monitoring
+
Offline Operation
+
Synchronization
```
كل Deployment يجب أن يكون:
```text
Repeatable
Documented
Testable
Recoverable
Secure
```
ولا يجب إنشاء Infrastructure خاصة بمستشفى واحد داخل الكود الأساسي إذا كان بالإمكان جعلها Configuration قابلة لإعادة الاستخدام.
