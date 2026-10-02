# PATIENT_JOURNEY_CLINICAL_WORKFLOW.md
## 1. الهدف
يحدد هذا المستند رحلة المريض الكاملة داخل نظام إدارة المستشفى، من لحظة إنشاء ملف المريض وحتى الخروج والمتابعة.
الهدف هو توحيد العمليات بين:
* الاستقبال.
* المواعيد.
* العيادات.
* الطوارئ.
* التمريض.
* المختبر.
* الأشعة.
* الصيدلية.
* العمليات.
* بنك الدم.
* التنويم.
* المالية.
* التأمين.
* إدارة المستشفى.
يجب أن تكون رحلة المريض مترابطة، بحيث لا يتم إدخال نفس البيانات بشكل غير ضروري في كل قسم.
---
# 2. المبدأ الأساسي
يجب أن يكون للمريض هوية موحدة داخل النظام:
```text id="q8l2ma"
Patient
│
├── Demographics
├── Contacts
├── Documents
├── Encounters
├── Appointments
├── Diagnoses
├── Medications
├── Lab Results
├── Radiology
├── Procedures
├── Admissions
├── Billing
└── Insurance
```
لا يتم إنشاء Patient جديد لكل زيارة.
---
# 3. Patient Master Record
لكل مريض:
```text id="1v5j8c"
Patient ID
Medical Record Number
Full Name
Date of Birth
Gender
Phone
Address
Emergency Contact
Identification
Allergies
Alerts
Insurance
Registration History
```
بعض الحقول تعتمد على إعدادات البلد والمستشفى.
---
# 4. Patient Identification
يجب دعم أكثر من طريقة للبحث:
```text id="d8jv2p"
Medical Record Number
National ID
Phone
Full Name
Date of Birth
Barcode
```
لكن يجب عدم الاعتماد على الاسم وحده كمُعرّف.
---
# 5. Duplicate Patient Detection
قبل إنشاء Patient جديد:
```text id="s5e6nr"
Search Existing Patient
↓
Potential Matches
↓
Review
↓
Existing?
┌───┴───┐
YES      NO
│        │
Open      Create
Existing   New
```
يجب تقليل احتمالية إنشاء ملفات مكررة.
---
# 6. Patient Registration Workflow
```text id="i0u1df"
Reception
↓
Search Patient
↓
Duplicate Check
↓
Create / Select Patient
↓
Enter Demographics
↓
Verify Contact
↓
Assign MRN
↓
Audit
```
---
# 7. Registration Permissions
الاستقبال يستطيع:
```text id="6nks5m"
Create Patient
Edit Demographics
View Basic Information
Create Appointment
Check-in
```
ولا يستطيع تلقائيًا:
```text id="o4j9fj"
Edit Clinical Notes
Approve Lab Results
Modify Medical Reports
Change Financial Transactions
```
---
# 8. Appointment Workflow
```text id="3gxk6r"
Patient
↓
Department
↓
Doctor / Service
↓
Available Slot
↓
Appointment
↓
Confirmation
↓
Check-in
↓
Queue
↓
Doctor
```
---
# 9. Appointment Statuses
يجب دعم حالات واضحة:
```text id="x9r7yk"
SCHEDULED
CONFIRMED
CHECKED_IN
IN_QUEUE
IN_PROGRESS
COMPLETED
CANCELLED
NO_SHOW
RESCHEDULED
```
---
# 10. Check-In
عند وصول المريض:
```text id="0k4lwr"
Appointment
↓
Check-in
↓
Verify Patient
↓
Verify Department
↓
Queue Ticket
```
إذا لم يكن لديه Appointment:
```text id="zn0b4s"
Walk-in
↓
Registration
↓
Service Selection
↓
Queue
```
حسب سياسة المستشفى.
---
# 11. Queue Management
يجب أن يدعم النظام:
```text id="k5sl1r"
Department Queue
Doctor Queue
Emergency Queue
Lab Queue
Radiology Queue
Pharmacy Queue
```
كل Queue Ticket قد يحتوي على:
```text id="a2x84u"
Ticket Number
Patient
Department
Service
Priority
Created Time
Status
Called Time
Completed Time
```
---
# 12. Queue Priority
يمكن دعم:
```text id="8fdr3l"
Normal
Urgent
Emergency
```
ويجب أن تكون قواعد الأولوية قابلة للتكوين حسب القسم.
---
# 13. Outpatient Clinical Workflow
```text id="w6jz4p"
Check-in
↓
Queue
↓
Nurse / Vital Signs
↓
Doctor
↓
History
↓
Examination
↓
Diagnosis
↓
Treatment Plan
↓
Orders
├── Lab
├── Radiology
├── Medication
└── Procedure
↓
Follow-up
↓
Encounter Completion
```
---
# 14. Clinical Encounter
كل زيارة سريرية يجب أن تكون Encounter.
مثال:
```text id="4n7h0k"
Patient
↓
Encounter #12345
├── Chief Complaint
├── History
├── Examination
├── Vitals
├── Diagnoses
├── Clinical Notes
├── Orders
├── Prescriptions
└── Follow-up
```
---
# 15. Encounter Status
```text id="v3i8c4"
OPEN
IN_PROGRESS
WAITING
COMPLETED
CANCELLED
```
لا يجب تعديل Encounter مكتمل بدون صلاحية مناسبة.
---
# 16. Vital Signs
يمكن للتمريض إدخال:
```text id="q6w4d8"
Temperature
Blood Pressure
Heart Rate
Respiratory Rate
Oxygen Saturation
Weight
Height
Pain Score
```
والحقول قابلة للتكوين حسب الحاجة.
---
# 17. Allergies
Allergies يجب أن تكون واضحة في Patient Header.
مثال:
```text id="d1r5kn"
ALLERGY ALERT
```
ويجب أن تظهر للمستخدمين المصرح لهم في النقاط الحرجة.
---
# 18. Clinical Alerts
يمكن أن تشمل:
```text id="d7z7jm"
Allergy
Critical Condition
Fall Risk
Isolation
Special Precaution
```
ولا يجب استخدام اللون وحده لتمثيل Alert.
---
# 19. Diagnosis
الطبيب يستطيع تسجيل:
```text id="1b9y0g"
Primary Diagnosis
Secondary Diagnosis
Working Diagnosis
Final Diagnosis
```
ويجب دعم Coding System قابل للتكوين مثل ICD عندما يكون مطلوبًا.
---
# 20. Clinical Notes
يمكن أن تحتوي على:
```text id="c7ph4f"
History
Examination
Assessment
Plan
Progress Note
Discharge Note
```
يجب تسجيل:
```text id="h1xqf8"
Author
Timestamp
Encounter
```
---
# 21. Clinical Note Security
الملاحظات الطبية لا يمكن تعديلها من أي مستخدم.
يجب استخدام:
```text id="0l7vib"
Role
Permission
Author
Encounter State
```
لتحديد الصلاحيات.
عند الحاجة إلى التصحيح:
```text id="h3t0p5"
Original Note
↓
Correction / Addendum
↓
Audit
```
بدل حذف التاريخ الأصلي بصمت.
---
# 22. Orders
الطبيب يمكنه إنشاء:
```text id="1ym9gr"
Lab Order
Radiology Order
Medication Order
Procedure Order
Referral
```
كل Order يجب أن يرتبط بـ:
```text id="e1e0qg"
Patient
Encounter
Ordering User
Department
Timestamp
Priority
Status
```
---
# 23. Order Status
```text id="z8w7oc"
DRAFT
ORDERED
ACCEPTED
IN_PROGRESS
COMPLETED
CANCELLED
REJECTED
```
حسب نوع Order.
---
# 24. Laboratory Workflow
```text id="4w8n4f"
Doctor
↓
Lab Order
↓
Lab Reception
↓
Sample Collection
↓
Sample Label
↓
Laboratory Processing
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
# 25. Lab Sample
كل Sample يجب أن يحتوي على:
```text id="2r9x9b"
Sample ID
Patient
Order
Sample Type
Collected By
Collection Time
Status
```
ويفضل استخدام Barcode.
---
# 26. Laboratory Results
Result Workflow:
```text id="m9x8s1"
Result Entry
↓
Validation
↓
Review
↓
Approval
↓
Published
```
النتيجة المعتمدة لا يتم تعديلها مباشرة بدون Workflow مناسب.
---
# 27. Critical Lab Results
يمكن تعريف نتائج حرجة.
عند وجود Critical Result:
```text id="o2qv7x"
Critical Result
↓
Alert
↓
Responsible Staff
↓
Acknowledgment
↓
Audit
```
---
# 28. Radiology Workflow
```text id="2v6jhy"
Doctor
↓
Radiology Order
↓
Scheduling
↓
Patient
↓
Imaging
↓
DICOM/PACS
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
# 29. Radiology Study
يجب ربط:
```text id="4t5w8x"
Patient
Encounter
Order
Study
Accession Number
PACS Study UID
Radiology Report
```
---
# 30. Radiology Report
الحالات:
```text id="h6m1k7"
DRAFT
DICTATED
REVIEW
APPROVED
AMENDED
```
التقرير المعتمد لا يجب حذفه بصمت.
---
# 31. Emergency Department
رحلة الطوارئ:
```text id="y1h2fb"
Patient Arrival
↓
Registration
↓
Triage
↓
Priority
↓
Doctor Assessment
↓
Orders
↓
Treatment
↓
Disposition
```
---
# 32. Triage
يمكن تسجيل:
```text id="x4w8sy"
Chief Complaint
Vital Signs
Pain
Priority
Allergies
Risk Factors
Triage Notes
```
---
# 33. Emergency Disposition
النتيجة النهائية:
```text id="z2l9q8"
Discharge
Admission
Transfer
Referral
Observation
Death
```
إذا كان خيارًا معتمدًا لدى المستشفى.
---
# 34. Inpatient Admission
```text id="2k8q0z"
Admission Request
↓
Approval
↓
Bed Search
↓
Ward
↓
Room
↓
Bed
↓
Admission
```
---
# 35. Bed Management
يجب أن يكون لكل Bed حالة:
```text id="q9z3lp"
AVAILABLE
OCCUPIED
RESERVED
CLEANING
MAINTENANCE
BLOCKED
```
---
# 36. Bed Assignment
يجب تسجيل:
```text id="2e7v9d"
Patient
Ward
Room
Bed
Start Time
End Time
Assigned By
Reason
```
---
# 37. Nursing Workflow
```text id="u4x2gn"
Patient
↓
Nurse Assignment
↓
Vitals
↓
Care Plan
↓
Tasks
↓
Medication Administration
↓
Nursing Notes
↓
Handover
```
---
# 38. Nursing Handover
يجب دعم تسليم الحالة بين المناوبات.
مثال:
```text id="x5l7m3"
Patient
Current Condition
Active Orders
Medications
Pending Tests
Risks
Important Notes
```
يجب أن يكون Handover منظمًا وقابلًا للتدقيق.
---
# 39. Medication Administration
يجب أن يتم تسجيل:
```text id="f7y4zq"
Patient
Medication
Dose
Route
Time
Administered By
Status
```
مثال Status:
```text id="w8m0ld"
GIVEN
HELD
REFUSED
MISSED
CANCELLED
```
---
# 40. Pharmacy Workflow
```text id="k8w9em"
Prescription
↓
Pharmacy Queue
↓
Pharmacist Review
↓
Stock Check
↓
Dispensing
↓
Stock Movement
↓
Patient
```
---
# 41. Pharmacy Safety
قبل Dispensing يجب التحقق من:
```text id="p6v0dr"
Patient
Medication
Dose
Quantity
Availability
Prescription Status
Allergy / Alerts where applicable
```
---
# 42. Surgery Workflow
```text id="3z4j5a"
Clinical Decision
↓
Surgery Request
↓
Approval
↓
Pre-op Assessment
↓
Scheduling
↓
Operating Room
↓
Anesthesia
↓
Procedure
↓
Post-op
↓
Recovery
```
---
# 43. Pre-Operative
يمكن أن يشمل:
```text id="1d8u5f"
Patient Verification
Consent
Allergies
Medication Review
Lab Results
Imaging
Anesthesia Assessment
Surgical Checklist
```
---
# 44. Operating Room
يجب تسجيل:
```text id="3w8q0k"
Operating Room
Procedure
Surgeon
Assistants
Anesthesia
Start Time
End Time
Findings
Complications
Specimens
```
---
# 45. Post-Operative
```text id="5y4k2r"
Recovery
↓
Post-op Monitoring
↓
Medication
↓
Orders
↓
Nursing
↓
Discharge / Admission
```
---
# 46. Blood Bank
Workflow:
```text id="8q7d2m"
Blood Request
↓
Check Availability
↓
Compatibility Testing
↓
Approval
↓
Issue Blood Unit
↓
Transfusion
↓
Record
```
---
# 47. Blood Unit Tracking
يجب تسجيل:
```text id="s2l4k0"
Unit ID
Blood Type
Component
Expiry
Storage
Status
Patient
Request
Issue
Transfusion
```
---
# 48. Inventory Workflow
```text id="n8c3d1"
Purchase
↓
Goods Receipt
↓
Warehouse
↓
Stock
↓
Transfer / Dispense / Consumption
↓
Stock Movement
```
---
# 49. Stock Movement
لا يجب تعديل Quantity فقط.
يجب إنشاء Movement:
```text id="4r0v9b"
IN
OUT
TRANSFER
ADJUSTMENT
RETURN
CONSUMPTION
```
كل Movement يجب أن يحتوي على سبب ومصدر العملية.
---
# 50. Procurement Workflow
```text id="7k5p2d"
Department Request
↓
Review
↓
Approval
↓
Purchase Order
↓
Supplier
↓
Goods Receipt
↓
Warehouse
```
---
# 51. Finance Workflow
للمستشفيات التي تفعل Finance:
```text id="m5n7p1"
Patient
↓
Services
↓
Charges
↓
Invoice
↓
Payment
↓
Receipt
```
---
# 52. Financial Status
```text id="e3k6s8"
DRAFT
ISSUED
PARTIALLY_PAID
PAID
VOID
REFUNDED
```
---
# 53. Insurance Workflow
```text id="9z1k7x"
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
Submission
↓
Response
↓
Settlement
```
---
# 54. Discharge Workflow
```text id="8j4r2m"
Doctor Decision
↓
Discharge Order
↓
Discharge Summary
↓
Medication
↓
Follow-up
↓
Finance / Insurance Clearance
↓
Bed Released
↓
Discharge Completed
```
بعض الخطوات قد تكون غير مطلوبة في مستشفى حكومي أو غير ربحي حسب Configuration.
---
# 55. Discharge Summary
يمكن أن يحتوي على:
```text id="5v3m7q"
Admission Reason
Diagnosis
Procedures
Treatment
Important Results
Medications
Follow-up
Instructions
Doctor
Date
```
---
# 56. Referral
يمكن إنشاء Referral:
```text id="7m8x3a"
Department
Doctor
External Hospital
Specialty
Reason
Urgency
Clinical Summary
```
ويجب تسجيل حالة الإحالة.
---
# 57. Follow-up
```text id="f5q2r8"
Discharge
↓
Follow-up Appointment
↓
Patient Returns
↓
New Encounter
```
لا يجب إنشاء سجل Patient جديد.
---
# 58. Complete Patient Journey
المسار الكامل:
```text id="9x3k7m"
PATIENT
│
▼
REGISTRATION
│
┌─────────┴─────────┐
│                   │
APPOINTMENT         EMERGENCY
│                   │
▼                   ▼
CHECK-IN            TRIAGE
│                   │
└─────────┬─────────┘
▼
QUEUE
│
▼
DOCTOR
│
▼
ENCOUNTER
│
┌────────────┼─────────────┐
│            │             │
▼            ▼             ▼
LAB        RADIOLOGY     PHARMACY
│            │             │
└────────────┼─────────────┘
▼
TREATMENT PLAN
│
┌─────────┴─────────┐
│                   │
OUTPATIENT           INPATIENT
│                   │
│             ┌─────┼─────┐
│             │     │     │
│          NURSING SURGERY BLOOD
│             │     │     │
└─────────────┴─────┴─────┘
│
▼
DISCHARGE
│
▼
FOLLOW-UP
```
---
# 59. Patient State Machine
يجب أن تكون حالة المريض التشغيلية واضحة.
مثال:
```text id="h5v9r2"
REGISTERED
↓
WAITING
↓
IN_CARE
↓
DIAGNOSTICS
↓
TREATMENT
↓
DISCHARGE
↓
FOLLOW_UP
```
لكن Patient نفسه لا يجب أن يمتلك State واحدًا يغطي كل حياته الطبية.
الحالة الأساسية تكون على مستوى:
```text id="u8k2m4"
Encounter
Admission
Appointment
Order
Prescription
```
---
# 60. Medical Record Integrity
السجلات الطبية المهمة يجب ألا يتم حذفها بشكل نهائي من خلال واجهة المستخدم العادية.
يفضل:
```text id="7q2k8x"
Correction
Amendment
Versioning
Audit
```
بدل:
```text id="3m7p9v"
Hard Delete
```
للسجلات السريرية المكتملة.
---
# 61. Clinical Timeline
يجب أن يستطيع المستخدم المصرح له رؤية Timeline:
```text id="2n8v5q"
Registration
↓
Appointment
↓
Encounter
↓
Lab
↓
Radiology
↓
Prescription
↓
Admission
↓
Surgery
↓
Discharge
```
مع احترام الصلاحيات.
---
# 62. Patient Summary
يجب أن يوفر النظام Summary سريعًا:
```text id="0x7m3k"
Patient Identity
Allergies
Active Problems
Current Medications
Recent Visits
Recent Results
Current Admission
Upcoming Appointments
Alerts
```
---
# 63. Clinical Dashboard
Dashboard الطبيب يجب أن يعرض:
```text id="r7k3n1"
Today's Patients
Waiting Patients
Current Encounters
Pending Orders
Critical Results
Follow-ups
```
بدون إظهار معلومات لا يحتاجها الطبيب.
---
# 64. Nursing Dashboard
```text id="4j8m2x"
Assigned Patients
Vitals Due
Medication Due
Tasks
Alerts
Pending Handover
```
---
# 65. Laboratory Dashboard
```text id="8k2r6p"
Pending Samples
Processing
Pending Results
Critical Results
Pending Approval
Completed
```
---
# 66. Radiology Dashboard
```text id="3n7v9m"
Pending Orders
Scheduled Studies
Studies Awaiting Report
Draft Reports
Reports Awaiting Approval
```
---
# 67. Pharmacy Dashboard
```text id="6p4k8x"
Prescription Queue
Pending Dispensing
Low Stock
Expired Items
Stock Alerts
```
---
# 68. Reception Dashboard
```text id="1m9q4v"
Appointments
Waiting Patients
Check-ins
Queue
New Registrations
```
---
# 69. Emergency Dashboard
```text id="7x2k5n"
Waiting
Triage
Critical
In Treatment
Observation
Admissions
Discharges
```
---
# 70. Cross-Module Rules
يجب أن تكون ملكية البيانات واضحة.
```text id="5m8r2x"
Patient Module
→ Patient Identity
Clinical
→ Encounters / Diagnoses / Notes
Laboratory
→ Lab Orders / Samples / Results
Radiology
→ Studies / Reports
Pharmacy
→ Prescriptions / Dispensing / Pharmacy Stock
Inventory
→ General Stock
Finance
→ Invoices / Payments
Insurance
→ Claims
HR
→ Employees
```
---
# 71. Module Communication
لا يجب أن تعدل Module جداول Module أخرى مباشرة.
الصحيح:
```text id="8q3n7m"
Module A
↓
Service / Event
↓
Module B
```
---
# 72. Error Handling
إذا فشل جزء غير أساسي:
```text id="3m7x1q"
Appointment Created
↓
SMS Failed
```
يجب أن يبقى Appointment ناجحًا، ويدخل SMS إلى Queue.
لكن إذا فشل جزء أساسي:
```text id="8v2k5n"
Medication Dispensing
↓
Stock Update Failed
```
يجب ألا تعتبر العملية مكتملة بشكل غير متسق.
---
# 73. Offline Clinical Workflow
عند انقطاع الإنترنت:
```text id="7n4m2x"
Patient Registration
↓
Clinical Encounter
↓
Lab Order
↓
Prescription
↓
Local Database
```
تستمر العمليات الأساسية.
عند عودة الإنترنت:
```text id="9k3x6v"
Local Events
↓
Sync Queue
↓
Cloud
```
---
# 74. Clinical Sync Priority
ليست كل البيانات بنفس الأولوية.
يمكن ترتيب:
```text id="4q8m2n"
Critical Clinical Data
↓
High
Normal Clinical Data
↓
Medium
Analytics / Non-critical
↓
Low
```
لكن يجب أن تكون الأولويات قابلة للتكوين.
---
# 75. Conflict Handling
في حالة تعديل نفس السجل من موقعين:
```text id="6x9k3m"
Hospital A
│
├── Update
│
Cloud
│
└── Update
```
لا يجب الكتابة فوق أحدهما بشكل صامت.
يجب إنشاء:
```text id="7m2x8q"
Conflict
```
وحله وفق نوع البيانات.
---
# 76. Clinical Conflict Policy
البيانات الطبية المعتمدة مثل:
```text id="3k8n5x"
Approved Lab Result
Approved Radiology Report
Final Diagnosis
Discharge Summary
```
يجب أن تكون أكثر تحفظًا في التعارض.
يفضل استخدام:
```text id="8q2m7v"
Amendment
+
Version
+
Audit
```
بدل Last Write Wins.
---
# 77. Permissions by Workflow
الصلاحيات يجب أن تكون مرتبطة بالعملية.
مثال:
```text id="4m7x9k"
Doctor
→ Create Diagnosis
Nurse
→ Record Vitals
Lab Technician
→ Enter Result
Lab Reviewer
→ Approve Result
Pharmacist
→ Dispense Medication
Accountant
→ Record Payment
```
---
# 78. Workflow Audit
كل انتقال مهم يجب تسجيله.
مثال:
```text id="6n2k8m"
Lab Result
DRAFT
↓
REVIEW
↓
APPROVED
```
يجب معرفة:
```text id="q8m3x5"
Who
When
From Status
To Status
```
---
# 79. Workflow Notifications
يمكن إرسال Notifications عند الأحداث المهمة:
```text id="m7x4n2"
Appointment Reminder
Critical Lab Result
Prescription Ready
Patient Admission
Patient Discharge
Insurance Response
Payment Confirmation
```
يجب أن تكون Notifications قابلة للتكوين.
---
# 80. Workflow Configuration
لا يجب Hard-code لكل مستشفى.
يجب أن يستطيع Configuration تحديد:
```text id="2k9m5x"
Departments
Services
Appointment Rules
Queue Rules
Approval Rules
Discharge Rules
Billing Rules
Insurance Rules
```
---
# 81. Government Hospital Workflow
قد يستخدم:
```text id="5x8n2m"
Registration
Clinical
Emergency
Laboratory
Radiology
Pharmacy
Inpatient
Reports
```
مع Finance/Insurance حسب Configuration.
---
# 82. Private Hospital Workflow
يمكن تفعيل:
```text id="7m3k9x"
Clinical
Emergency
Laboratory
Radiology
Pharmacy
Surgery
Inventory
Finance
Insurance
```
---
# 83. Non-Profit Hospital Workflow
يمكن تفعيل:
```text id="8n4x2m"
Patient
Clinical
Emergency
Laboratory
Pharmacy
Beneficiary Services
Subsidized Services
Inventory
Optional Finance
```
---
# 84. Patient Journey Definition of Done
لا تعتبر رحلة Module مكتملة إلا إذا:
```text id="3x7m9k"
[ ] Patient identity linked
[ ] Encounter linked
[ ] Permissions defined
[ ] Workflow states defined
[ ] Validation implemented
[ ] Audit implemented
[ ] Error handling implemented
[ ] Offline behavior defined
[ ] Sync behavior defined
[ ] Notifications considered
[ ] Reports considered
[ ] UI workflow implemented
[ ] API workflow implemented
[ ] Database relationships implemented
[ ] Tests implemented
```
---
# 85. Cursor Implementation Rules
قبل تنفيذ أي Clinical Workflow:
1. اقرأ جميع الوثائق السابقة.
2. حدد Owner لكل بيانات.
3. حدد المستخدمين المشاركين.
4. حدد الحالات State Machine.
5. حدد انتقالات الحالات.
6. حدد Permissions.
7. حدد Audit Events.
8. حدد Notifications.
9. حدد Offline Behavior.
10. حدد Sync Behavior.
11. حدد Failure Scenarios.
12. اكتب Tests.
13. لا تختصر Workflow طبي معقد إلى CRUD فقط.
---
# 86. Final Patient Journey Principle
النظام يجب أن يفكر في:
```text id="n7m2x9"
PATIENT JOURNEY
```
وليس فقط:
```text id="k3x8m5"
DATABASE TABLES
```
كل شاشة وكل API وكل جدول يجب أن يخدم Workflow حقيقي داخل المستشفى.
الهدف:
```text id="q9m4x7"
One Patient
↓
One Medical Identity
↓
Connected Clinical Journey
↓
Connected Departments
↓
Complete Audit Trail
↓
Safe Continuity of Care
```
---
# 87. Cursor Final Instruction
تعامل مع هذا المستند باعتباره المرجع الأساسي لسير العمل السريري.
قبل تنفيذ أي Workflow جديد:
```text
Understand Workflow
↓
Identify Actors
↓
Define States
↓
Define Permissions
↓
Define Data Ownership
↓
Define Events
↓
Implement Backend
↓
Implement UI
↓
Test
↓
Document
```
لا تقم ببناء شاشات منفصلة بدون ربطها بالـWorkflow الحقيقي.
ولا تعتبر النظام مكتملًا لمجرد أن CRUD الخاص بالجداول يعمل.
