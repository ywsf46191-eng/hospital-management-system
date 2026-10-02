HOSPITAL MANAGEMENT SYSTEM
Official Government & Institutional UI/UX Specification
Document: UI_UX_SPECIFICATION.mdVersion: 1.0Status: Official Enterprise / Government Interface Standard
Related Documents:
HOSPITAL_SYSTEM_MASTER_SPEC.md
DATABASE_SCHEMA.md
MODULES.md
RBAC.md
API_SPECIFICATION.md
1. Design Philosophy
The Hospital Management System is an institutional healthcare platform.
It may be deployed in:
Government hospitals
Ministries of Health
Public healthcare institutions
Private hospitals
Non-profit hospitals
Large medical centers
Therefore, the user interface must communicate:
Official
Professional
Reliable
Clear
Stable
Accessible
Organized
Serious
Institutional
The interface must NOT look like:
Consumer startup
Social media application
Gaming interface
Marketing website
Crypto application
Entertainment application
AI demo
2. Core Visual Direction
The visual style must be:
Government Enterprise / Healthcare Administration
The system should look like software used by:
Ministries
Government departments
National healthcare organizations
Large hospitals
Universities
Financial institutions
Enterprise organizations
The interface should prioritize usability and information density over visual effects.
3. No Unnecessary Visual Effects
The system must NOT use:
Excessive animations
Floating decorative elements
Large gradients
Neon colors
Glowing cards
Glassmorphism
Excessive shadows
3D decorations
Animated backgrounds
Excessive rounded cards
Large marketing-style illustrations
Excessive emoji usage
The system is an operational application, not a marketing website.
4. Modern Does Not Mean Decorative
The interface should still be modern through:
Clean spacing
Consistent typography
Good information hierarchy
Responsive layout
Clear navigation
Accessible forms
Professional tables
Consistent components
Fast interaction
Keyboard support
Modernization should come from structure and usability, not visual effects.
5. Official Visual Identity
The default design should use a restrained professional palette.
Primary colors should be based around:
Deep Navy / Institutional Blue
White
Neutral Gray
Light Gray
Dark Text
Muted Secondary Text
Additional semantic colors may be used only when they communicate status.
Examples:
Success → restrained green
Warning → restrained amber
Error → restrained red
Information → restrained blue
These colors must not become decorative.
6. Color Rules
Avoid:
Neon Green
Neon Blue
Bright Purple
Hot Pink
Strong Orange
Cyberpunk palettes
Rainbow gradients
Do not use color as the only indicator of important information.
Example:
A critical status should display:
Icon + Text + Color
not color alone.
7. Color Tokens
Use design tokens instead of hard-coding colors.
Example conceptual tokens:
--primary
--primary-hover
--primary-active
--background
--surface
--surface-muted
--border
--border-strong
--text-primary
--text-secondary
--text-muted
--success
--warning
--danger
--info
The final values should be centralized in the design system.
8. Typography
Typography must be highly readable.
The system supports:
Arabic
English
Arabic must be treated as a first-class language.
Recommended font direction:
Arabic:
Noto Sans Arabic / equivalent professional Arabic UI font
English:
Inter / Noto Sans / equivalent enterprise UI font
The final implementation should use a consistent font stack.
Avoid decorative fonts.
9. Typography Hierarchy
Recommended hierarchy:
Page Title
Section Title
Card / Panel Title
Field Label
Body Text
Secondary Text
Table Text
Helper Text
Do not use huge typography.
This is an enterprise application where many controls and data must fit on screen.
10. Arabic RTL
When Arabic is selected:
Direction: RTL
The interface must correctly mirror:
Sidebar
Navigation
Breadcrumbs
Tables
Forms
Dialogs
Icons where direction matters
Pagination
Dropdowns
However, icons with universal meanings should not be unnecessarily mirrored.
11. English LTR
When English is selected:
Direction: LTR
The same application must support English without creating a separate UI.
12. Language Switching
The language selector should be available in the authenticated application.
Example:
العربية
English
Language changes must not require rebuilding the application.
User language preference should be stored.
13. Application Shell
The entire application should use a consistent shell:
┌──────────────────────────────────────────────────────┐
│ Header                                               │
├──────────────┬───────────────────────────────────────┤
│              │                                       │
│ Sidebar      │ Main Content                          │
│              │                                       │
│              │                                       │
│              │                                       │
└──────────────┴───────────────────────────────────────┘
The shell must remain consistent across modules.
14. Header
The header should contain:
Hospital / Institution Name
Current Department
Notifications
Language
User Account
Potentially:
System Status
for authorized technical users.
The header should remain visually simple.
15. Hospital Branding
The hospital may configure:
Hospital Logo
Hospital Name
Ministry / Organization Name
Branch Name
Example:
وزارة الصحة
مستشفى ______ الحكومي
The logo should be displayed professionally.
Do not use giant branding that consumes workspace.
16. Sidebar
The sidebar is the primary navigation.
Example:
Dashboard
Patients
Appointments
Reception
Emergency
Clinical
Inpatient
Nursing
Laboratory
Radiology
Pharmacy
Surgery
Blood Bank
Inventory
Procurement
Finance
Insurance
HR
Reports
Administration
System
Only authorized modules should appear.
17. Sidebar Behavior
The sidebar should support:
Expanded
Collapsed
Collapsed mode should show icons with accessible tooltips.
Do not create excessive animations when collapsing.
Use a short, subtle transition only if necessary.
18. Navigation Structure
Navigation should follow the user's role.
Example:
Doctor
Dashboard
Patients
Appointments
My Queue
Clinical Encounters
Prescriptions
Laboratory
Radiology
Reports
Nurse
Dashboard
My Ward
Patients
Nursing Tasks
Vitals
Medication Administration
Handover
Reception
Dashboard
Patient Registration
Appointments
Queue
Check-in
Accountant
Dashboard
Invoices
Payments
Refunds
Insurance
Financial Reports
19. Dashboard Philosophy
Dashboards must be operational.
Do not create dashboards filled with decorative charts.
A dashboard should answer:
What do I need to know and what do I need to do now?
20. Government Dashboard
Example:
┌────────────────────────────────────────────────────┐
│ Hospital Overview                                  │
├────────────┬────────────┬────────────┬─────────────┤
│ Patients   │ Emergency  │ Admissions │ Available   │
│ Today      │ Today      │ Today      │ Beds        │
├────────────┴────────────┴────────────┴─────────────┤
│ Operational Alerts                                │
├────────────────────────────────────────────────────┤
│ Pending Tasks                                      │
├────────────────────────────┬───────────────────────┤
│ Appointments               │ Department Activity   │
└────────────────────────────┴───────────────────────┘
Charts should be used only when they improve understanding.
21. Role-Based Dashboard
The dashboard must be role-aware.
Doctor:
Today's Appointments
Waiting Patients
Active Encounters
Pending Lab Results
Pending Radiology
Tasks
Nurse:
Assigned Patients
Pending Vitals
Medication Tasks
Nursing Tasks
Admissions
Discharges
Receptionist:
Today's Appointments
Waiting Patients
Check-ins
Queue
Registration
Accountant:
Invoices
Payments
Pending Payments
Refund Requests
Financial Tasks
22. Cards
Cards should be simple.
Preferred:
┌─────────────────────────┐
│ Today's Patients        │
│                         │
│ 124                     │
│ +12 from yesterday      │
└─────────────────────────┘
Avoid:
Huge rounded cards
Gradient backgrounds
Animated counters
Glowing borders
3D icons
23. Tables
Tables are one of the most important UI components.
Hospital systems contain large amounts of structured data.
Tables must support:
Search
Filtering
Sorting
Pagination
Column visibility
Row actions
Export where authorized
24. Table Design
Preferred:
┌──────┬──────────────┬──────────┬────────────┬────────┐
│ ID   │ Patient      │ Date     │ Department │ Status │
├──────┼──────────────┼──────────┼────────────┼────────┤
│ 001  │ Ahmad Ali    │ 01/10    │ Cardiology │ Active │
│ 002  │ Sara Hassan  │ 01/10    │ Emergency  │ Done   │
└──────┴──────────────┴──────────┴────────────┴────────┘
Use subtle borders and clear row separation.
25. Dense Information Layout
Hospital employees may use the system for many hours.
The interface should support a productive information density.
Avoid excessively large:
padding
cards
buttons
headers
empty spaces
At the same time, do not create cramped interfaces.
The target is:
Dense but readable.
26. Forms
Forms should be structured into logical sections.
Example:
Patient Information
Personal Information
────────────────────────────
First Name
Last Name
Date of Birth
Gender
Contact Information
────────────────────────────
Phone
Address
Emergency Contact
Medical Information
────────────────────────────
Allergies
Blood Type
27. Form Layout
Use responsive grids.
Example:
First Name        Last Name
[____________]    [____________]
Date of Birth     Gender
[____________]    [____________]
Phone             National ID
[____________]    [____________]
Avoid unnecessarily long single-column forms.
28. Required Fields
Required fields must be clearly indicated.
Example:
Full Name *
The system should validate fields before submission and provide clear messages.
29. Form Validation
Validation messages should be:
Specific
Short
Actionable
Bad:
Invalid input.
Better:
Enter a valid phone number.
30. Destructive Actions
Actions such as:
Delete
Cancel
Void
Reject
Disable
Merge
must require appropriate confirmation.
Example:
Are you sure you want to cancel this appointment?
Appointment:
A-2026-000321
[Cancel Appointment]
[Keep Appointment]
31. Medical Record UI
The patient medical record should be a central workspace.
Example:
┌───────────────────────────────────────────────────┐
│ Patient Header                                    │
│ Name | Patient No. | DOB | Gender | Alerts       │
├───────────────────────────────────────────────────┤
│ Overview | Visits | Diagnoses | Medications       │
│ Labs | Radiology | Admissions | Documents         │
├───────────────────────────────────────────────────┤
│                                                   │
│ Current Information                               │
│                                                   │
└───────────────────────────────────────────────────┘
32. Patient Header
The patient header should always make identity clear.
Display:
Patient Name
Patient Number
Date of Birth
Gender
Phone
Blood Type where appropriate
Important Alerts
Avoid displaying sensitive information unnecessarily.
33. Patient Alerts
Critical alerts should be visually noticeable but professional.
Examples:
Allergy
Fall Risk
Critical Clinical Alert
Isolation
Use:
Icon
Text
Subtle semantic color
Do not use flashing animations.
34. Clinical Workspace
Doctors should have a focused workspace.
Example:
Patient
↓
Encounter
↓
History
↓
Examination
↓
Diagnosis
↓
Orders
↓
Prescription
↓
Follow-up
The interface should minimize unnecessary navigation.
35. Clinical Note Editor
Clinical notes should use a clean professional editor.
Sections may include:
Chief Complaint
History
Examination
Assessment
Diagnosis
Plan
The exact clinical template should be configurable.
36. Laboratory UI
Laboratory interface should prioritize:
Orders
Samples
Pending Tests
Results
Review
Approval
Example:
Pending Laboratory Work
────────────────────────────────────
Patient | Test | Sample | Status
Technicians should immediately see pending work.
37. Laboratory Result Entry
Result entry should be optimized for accuracy.
Display:
Test
Result
Unit
Reference Range
Flag
Notes
Avoid unnecessary visual decoration.
Abnormal results may use restrained status indicators.
38. Radiology UI
Radiology should provide:
Orders
Worklist
Studies
PACS access
Reports
Approval
The radiologist should have enough workspace for the report without excessive surrounding UI.
39. Pharmacy UI
Pharmacy screens should prioritize:
Prescription Queue
Patient
Medication
Dose
Availability
Stock
Dispensing
Stock warnings should be clear.
40. Inventory UI
Inventory should focus on:
Items
Warehouses
Stock
Movements
Transfers
Receipts
Adjustments
Stock quantities should be immediately readable.
41. Finance UI
Financial screens should be formal and data-oriented.
Use:
Invoices
Payments
Receipts
Refunds
Reports
Avoid flashy financial dashboard designs.
42. Reports UI
Reports should have:
Report Name
Date Range
Department
Filters
Generate
Preview
Export
Print
Only authorized export formats should be available.
43. Government Reporting
Government hospitals may require reports by:
Hospital
Department
Date
Patient category
Service
Disease category
Utilization
Admissions
Discharges
Emergency
Laboratory
Radiology
Pharmacy
Inventory
The exact reporting requirements should be configurable.
44. Modal Dialogs
Dialogs should be used for focused actions.
Good uses:
Confirmation
Quick edit
Approval
Reason entry
Small form
Do not put entire complex workflows inside giant modals.
Complex workflows should use dedicated pages.
45. Drawers
Side drawers may be used for:
Quick patient preview
Appointment details
Notification details
Activity details
They should not replace full pages for complex clinical workflows.
46. Buttons
Buttons should have clear labels.
Preferred:
Save
Create Patient
Approve Result
Cancel Appointment
Generate Report
Avoid vague labels:
Go
Do it
Action
Proceed
unless the context makes the action unambiguous.
47. Button Hierarchy
Use a clear hierarchy:
Primary
Secondary
Tertiary
Danger
There should generally be one primary action per workflow section.
48. Icons
Use a consistent professional icon library.
Recommended:
Lucide Icons
Icons should support text, not replace text for important actions.
Avoid decorative icon overload.
49. Empty States
Empty states should be informative.
Example:
No appointments found.
Try changing the selected date or filter.
Avoid cartoon illustrations unless there is a specific institutional reason.
50. Loading States
Use simple:
Skeleton
Spinner
Loading indicator
Do not use elaborate animations.
51. Error States
Errors should clearly communicate:
What happened
What the user can do
Example:
Unable to save the patient.
Please check the required fields and try again.
For system errors:
The service is temporarily unavailable.
Request ID: 4C2A9F
52. Offline State
The hospital system must clearly indicate connectivity status.
Example:
● Local Server Connected
● Cloud Sync Active
During Internet outage:
● Local Mode
Cloud synchronization paused
The indicator must not imply that the hospital application is unusable.
53. Synchronization Status
Authorized technical users may see:
Synchronization
────────────────────────────
Status: Connected
Pending Events: 12
Failed Events: 0
Last Sync: 14:32
Ordinary users should not be overwhelmed with infrastructure information.
54. System Status
The system may provide an institutional status indicator:
Operational
Limited Connectivity
Local Mode
Maintenance
Use restrained colors and text.
Never use flashing alerts.
55. Accessibility
The UI must follow accessibility principles.
Support:
Keyboard navigation
Visible focus
Readable text
Sufficient contrast
Screen readers where practical
Accessible form labels
ARIA where necessary
Do not depend on color alone.
56. Keyboard Support
Common workflows should support keyboard navigation.
Examples:
Tab
Shift + Tab
Enter
Escape
Arrow Keys
The exact shortcuts should be documented if introduced.
57. Responsive Design
The application must support:
Desktop
Laptop
Tablet
Desktop is the primary environment for hospital workstations.
Mobile support may focus on:
Notifications
Simple approvals
Quick views
Nursing workflows
On-call tasks
Do not force every complex desktop workflow onto a small mobile screen.
58. Screen Resolution
The UI should work properly at common resolutions:
1366 × 768
1440 × 900
1920 × 1080
2560 × 1440
Do not design exclusively for ultra-wide monitors.
59. Print Design
Healthcare systems frequently require printing.
Provide dedicated print layouts for:
Prescriptions
Lab Results
Radiology Reports
Invoices
Receipts
Patient Summaries
Admission Documents
Discharge Documents
Official Reports
Printed documents must not contain unnecessary navigation elements.
60. Official Documents
Printed documents should support configurable institutional headers.
Example:
وزارة الصحة
اسم المستشفى
اسم الإدارة / القسم
────────────────────────────
Document Title
Patient:
Patient Number:
Date:
────────────────────────────
Content
The exact government branding must be configurable by the deploying institution.
Do not hard-code one country's government logo into the core product.
61. Government Deployment Branding
The system should support:
Organization Logo
Ministry Logo
Hospital Logo
Hospital Name
Department Name
Official Document Header
Footer
Contact Information
This should be configuration-driven.
62. Theme
The primary product theme should be:
Light
Dark mode may be technically supported in the future, but it should not be a priority for the initial government deployment.
The default government interface must remain a professional light institutional interface.
63. Rounded Corners
Use restrained corner radius.
Preferred:
4px
6px
8px
Avoid excessive:
24px
32px
40px
The interface should not look like a consumer mobile application.
64. Shadows
Use subtle shadows only when they improve hierarchy.
Examples:
Dropdown
Modal
Floating panel
Avoid shadows on every card.
Borders and spacing should provide most of the visual hierarchy.
65. Animation
Animation should be minimal.
Allowed:
Short sidebar transition
Modal appearance
Dropdown transition
Loading indicator
Avoid:
Animated dashboards
Floating objects
Continuous motion
Parallax
Large transitions
Confetti
Animated counters
66. No Marketing UI
The authenticated hospital system must not contain:
Hero sections
Marketing slogans
Promotional banners
Sales animations
Testimonials
Decorative landing-page sections
The public product website may have marketing design.
The hospital application must not.
67. Design System
The UI should use a centralized component system.
Recommended:
shadcn/ui
Tailwind CSS
Lucide Icons
Components should include:
Button
Input
Select
Combobox
DatePicker
Dialog
Drawer
Tabs
Table
Pagination
Badge
Alert
Toast
Dropdown
Tooltip
Card
Form
Breadcrumb
Sidebar
Header
68. Component Consistency
A component must look the same throughout the application.
For example:
Primary Button
must not look different in:
Reception
Laboratory
Pharmacy
Finance
Administration
Consistency is critical in enterprise software.
69. Design Tokens
All UI components should use centralized tokens for:
Colors
Spacing
Typography
Radius
Borders
Shadows
Breakpoints
Do not hard-code arbitrary values throughout pages.
70. Page Layout Standard
Every main page should follow:
Breadcrumb
↓
Page Title
↓
Page Description / Context
↓
Primary Actions
↓
Filters / Search
↓
Main Content
Example:
Patients
Manage hospital patients and medical records.
[Register Patient]
[Search...] [Department] [Status]
────────────────────────────────────
Patient Table
71. Breadcrumbs
Use breadcrumbs for complex areas.
Example:
Patients
/
Patient Details
/
Clinical Encounters
/
Encounter #ENC-00123
Breadcrumbs should help users understand where they are.
72. Confirmation Patterns
Sensitive actions should show:
Action
Target
Consequence
Confirmation
Example:
Approve Laboratory Result
Patient:
Ahmad Ali
Test:
CBC
After approval, the result will become part of the
official patient record.
[Approve Result]
[Cancel]
73. Audit Visibility
Where appropriate, authorized users should see an activity history.
Example:
Activity
10:32 — Result entered
10:41 — Result reviewed
10:45 — Result approved
Do not expose audit information to users without permission.
74. User Profile
The user menu may contain:
My Profile
My Department
Language
Security
Active Sessions
Logout
Administrative functions should not be mixed into the normal user profile unnecessarily.
75. Notifications
Notifications should be categorized:
Clinical
Operational
Administrative
System
Security
Examples:
New appointment
Lab result ready
Medication task
Approval required
System maintenance
Security alert
Avoid unnecessary notifications.
76. Notification Priority
Use:
Informational
Important
Urgent
Critical
Critical notifications must be visually distinguishable without flashing.
77. Search
Global search may support:
Patients
Appointments
Encounters
Orders
Documents
but search results must always respect authorization.
A user should never discover a resource merely because global search ignores permissions.
78. Global Command Search
A command palette may be introduced for power users.
Example:
Ctrl + K
Possible actions:
Search Patient
Open Appointment
Create Appointment
Open Reports
This should be optional and must not replace normal navigation.
79. Department Workspaces
Departments may have specialized workspaces.
Examples:
Emergency Workspace
Laboratory Workspace
Radiology Workspace
Pharmacy Workspace
Operating Room Workspace
Blood Bank Workspace
Each workspace should use the same overall design system.
80. Emergency Workspace
Emergency interface should prioritize speed and visibility.
Display:
Waiting
Triage
Critical
In Treatment
Observation
Ready for Discharge
Admission Required
The interface should remain calm and professional.
Do not use alarming animations.
81. Operating Room Workspace
Display:
Today's Schedule
Operating Rooms
Patient
Procedure
Surgeon
Anesthesia
Status
Use clear schedule and status indicators.
82. Ward Workspace
Display:
Ward
Rooms
Beds
Patients
Nursing Tasks
Vitals
Medications
Discharges
The UI should allow staff to identify patient status quickly.
83. Pharmacy Workspace
Display:
Pending Prescriptions
Ready for Dispensing
Low Stock
Out of Stock
Recent Dispensing
Prioritize queue management.
84. Laboratory Workspace
Display:
Pending Samples
Processing
Results Pending Review
Results Pending Approval
Critical Results
Use clear status labels.
85. Radiology Workspace
Display:
Worklist
Scheduled
In Progress
Completed
Reporting
Pending Approval
PACS access should be integrated cleanly.
86. Finance Workspace
Display:
Invoices
Payments
Pending Payments
Refund Requests
Insurance Claims
Reports
Financial information should remain visually formal.
87. Administration Workspace
Hospital administrators should see:
Hospital Settings
Departments
Users
Roles
Modules
Audit
Reports
Configuration
Administrative screens should use the same design language.
88. Technical Administration
IT administrators may see:
System Health
Servers
Database
Sync
Queues
Backups
Logs
Integrations
Technical information should not be visible to ordinary clinical users.
89. Security UI
Security events may display:
Failed Login
Suspicious Activity
Permission Change
Account Disabled
Break-Glass Access
Sensitive security information must be restricted.
90. No Excessive Dashboard Charts
Charts should only be used when they provide meaningful analytical value.
Good examples:
Monthly admissions
Emergency volume
Bed occupancy
Laboratory workload
Pharmacy consumption
Bad examples:
Decorative donut charts
Random percentages
Animated graphs
Charts with no operational purpose
91. Data Visualization
Charts should be:
Simple
Readable
Accessible
Printable
Exportable where authorized
Use restrained colors.
Avoid multi-color visual overload.
92. Status Badges
Status badges should be simple.
Examples:
Active
Pending
Completed
Cancelled
Approved
Rejected
Critical
Use semantic colors sparingly.
93. Tables and Status
Example:
Patient       Department       Status
Ahmad Ali     Emergency        Active
Sara Hassan   Cardiology       Pending
Omar Khaled   Laboratory       Completed
Status should be readable as text.
94. Institutional Trust
Every design decision should answer:
Does this make the system easier and safer for a hospital employee to use?
If the answer is no, do not add the visual element.
95. Design Anti-Patterns
Cursor must NOT generate:
❌ Gradient-heavy dashboards
❌ Neon interfaces
❌ Glassmorphism
❌ Excessive rounded cards
❌ Huge empty spaces
❌ Animated backgrounds
❌ Floating decorative objects
❌ Excessive icons
❌ Consumer-style onboarding
❌ Gaming-style status indicators
❌ Marketing-style dashboards
❌ Excessive motion
❌ Random colors
96. Design Quality Standard
The interface should feel similar in seriousness to:
Government systems
Enterprise ERP systems
Hospital information systems
Banking administration systems
Large institutional software
without copying any specific product.
97. Frontend Architecture
Recommended:
apps/web/
│
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── tables/
│   ├── forms/
│   ├── patients/
│   ├── clinical/
│   ├── laboratory/
│   ├── radiology/
│   ├── pharmacy/
│   ├── inventory/
│   ├── finance/
│   └── administration/
│
├── features/
├── hooks/
├── lib/
├── services/
├── stores/
├── i18n/
└── styles/
98. Component Rules
Reusable components should be created for repeated patterns.
Examples:
PatientHeader
PatientSearch
PatientTable
AppointmentTable
ClinicalTimeline
StatusBadge
PermissionGuard
PageHeader
DataTable
FormSection
ConfirmDialog
AuditTimeline
Avoid duplicating the same UI logic across modules.
99. Permission-Aware UI
The frontend must respect RBAC.
Example:
Can user approve laboratory results?
↓
YES → Show Approve button
NO  → Do not show Approve button
But the backend must still enforce:
lab.result.approve
100. Module-Aware UI
If a hospital disables a module:
Finance = Disabled
the UI should not display:
Finance navigation
Finance dashboards
Finance pages
Finance actions
The backend must also reject unauthorized module requests.
101. Government Mode
The product should support a formal institutional visual profile.
Configuration example:
uiProfile:
type: GOVERNMENT
This profile should enforce:
Minimal animation
Formal typography
Restrained colors
Institutional layout
Official document styling
High information density
102. Private Hospital Mode
Private hospitals may configure:
Logo
Brand colors
Hospital name
Department branding
However, the underlying UI system must remain professional.
Private branding must not break usability or accessibility.
103. Non-Profit Mode
Non-profit hospitals may use:
Institution Logo
Organization Name
Service Programs
Beneficiary Categories
while maintaining the same core interface.
104. Multi-Tenant Design System
The same application must support different organizations without creating separate codebases.
Example:
Government Hospital
│
├── Government UI profile
│
Private Hospital
│
├── Institutional branded profile
│
Non-Profit Hospital
│
└── Non-profit institutional profile
The core component system remains shared.
105. Design Tokens Must Be Configurable
Hospital-specific configuration may include:
Logo
Primary color
Secondary color
Organization name
Ministry name
Document header
Document footer
Language defaults
Timezone
Do not allow tenant configuration to introduce unsafe arbitrary CSS or scripts.
106. Performance
The UI should remain fast on hospital LAN networks and ordinary workstation hardware.
Avoid unnecessary:
Large JavaScript bundles
Heavy animations
Huge images
Unnecessary dependencies
Continuous polling
Use:
Pagination
Lazy loading
Caching
Optimized queries
Code splitting
where appropriate.
107. Offline UX
When the local server is available:
Internet OFF
↓
Application continues operating
The UI should clearly distinguish:
Local operation
Cloud synchronization
Users should not be forced to understand technical synchronization details.
108. Unsaved Changes
If a user is editing important data and attempts to leave:
You have unsaved changes.
Leave without saving?
This is especially important for:
Clinical notes
Lab results
Radiology reports
Financial forms
Procurement forms
109. Long Clinical Forms
Long forms should support:
Sections
Tabs where appropriate
Sticky patient header
Autosave where safe
Draft state
Validation
Autosave must never silently publish/approve clinical data.
110. Official System Language
UI wording should be:
Professional
Clear
Neutral
Institutional
Avoid:
Hey!
Awesome!
Great job!
Wow!
Let's go!
Preferred:
Saved successfully.
Approval completed.
Unable to complete the operation.
Please review the required fields.
111. Arabic Terminology
Arabic translations should use consistent medical and administrative terminology.
Create a centralized translation dictionary.
Example:
Patient = المريض
Appointment = الموعد
Encounter = الزيارة / المقابلة السريرية حسب context
Admission = الدخول / التنويم حسب context
Discharge = الخروج
Laboratory = المختبر
Radiology = الأشعة
Pharmacy = الصيدلية
Inventory = المخزون
Procurement = المشتريات
Finance = المالية
Insurance = التأمين
The final terminology should be reviewed for the deployment country's healthcare terminology.
112. No Hard-Coded Country Assumptions
The core product must not assume one country.
Do not hard-code:
Government name
Ministry name
Currency
National ID format
Phone format
Date format
Healthcare regulations
Official logos
These must be configurable.
113. Localization Settings
Hospital configuration should support:
Language
Timezone
Date Format
Time Format
Currency
Number Format
Country
Phone Format
National ID Rules
114. Official Printing
Print templates must be independent from screen UI.
Use dedicated print components.
Example:
Screen UI
↓
Print Template
↓
PDF / Printer
Do not simply print the browser screen.
115. PDF Documents
Official PDFs should support:
Hospital logo
Organization name
Document title
Patient information
Document number
Date/time
Authorized staff
Signature area where needed
Footer
116. Digital Signatures
Where legally and technically required, future versions may support:
Digital signatures
Electronic approvals
Certificate-based signing
This should be implemented according to the relevant jurisdiction and legal requirements.
117. UI Testing
The frontend must be tested for:
Arabic RTL
English LTR
Desktop
Tablet
1366×768
1920×1080
Long tables
Long names
Long Arabic text
Validation errors
Permission restrictions
Offline state
Slow network
Empty states
Loading states
Error states
Print layouts
118. Visual QA
Before considering a page complete, verify:
Spacing
Typography
Alignment
RTL
Tables
Forms
Buttons
Status colors
Responsive behavior
Accessibility
Loading
Errors
Permissions
119. Cursor Implementation Rules
Cursor must:
Read all previous project documents.
Use this document as the visual authority.
Build a reusable design system first.
Create the application shell.
Create RTL/LTR support.
Create the navigation system.
Create reusable tables and forms.
Create permission-aware components.
Build role-based dashboards.
Implement modules incrementally.
Avoid decorative UI.
Avoid unnecessary animation.
Avoid gradient-heavy designs.
Avoid consumer-style interfaces.
Keep the system suitable for government deployment.
Test Arabic and English.
Test desktop resolutions.
Test accessibility.
Test offline indicators.
Keep all design tokens centralized.
120. Final Design Standard
The final system should communicate:
Government
Healthcare
Security
Reliability
Order
Professionalism
Trust
Efficiency
The design should be:
Modern in architecture
Modern in usability
Traditional in institutional appearance
This means:
Modern Enterprise Software, not a Modern Marketing Website.
121. Final Visual Principle
The interface should feel like software that a:
Doctor
Nurse
Receptionist
Laboratory Technician
Radiologist
Pharmacist
Accountant
Hospital Manager
Ministry Official
IT Administrator
can use for an entire working day without visual fatigue.
The system must prioritize:
Clarity
Speed
Accuracy
Consistency
Accessibility
Security
over visual novelty.
122. Final UI Rule
The following rule is mandatory:
FUNCTION FIRST
↓
CLARITY SECOND
↓
ACCESSIBILITY THIRD
↓
VISUAL POLISH FOURTH
Never reverse this order.
The system is an official healthcare information system, not a visual showcase.
123. Final Architecture
DESIGN SYSTEM
│
┌──────────────┼──────────────┐
▼              ▼              ▼
RTL/LTR        Components      Tokens
│              │              │
└──────────────┼──────────────┘
▼
APPLICATION SHELL
│
┌──────────────┼──────────────┐
▼              ▼              ▼
Navigation      Dashboard       Pages
│              │              │
└──────────────┼──────────────┘
▼
MODULE WORKSPACES
│
▼
ROLE-AWARE UI
│
▼
PERMISSION-AWARE UI
│
▼
API / BACKEND
124. Final Cursor Directive
Before creating any new page, Cursor must ask:
1. Who uses this page?
2. What is the primary task?
3. What information must be visible?
4. What permissions are required?
5. What actions are available?
6. What happens when there is no data?
7. What happens during loading?
8. What happens when an error occurs?
9. How does it work in Arabic RTL?
10. How does it work in English LTR?
11. Does it work on the hospital's standard desktop screens?
12. Does it follow the institutional design system?
If a UI element does not improve the user's task, it should not be added.
125. Official Product Identity
The Hospital Management System should ultimately look and feel like:
A serious national / institutional healthcare platform
rather than:
A startup dashboard
The interface should be calm, structured, professional, accessible, and suitable for official government deployment.
