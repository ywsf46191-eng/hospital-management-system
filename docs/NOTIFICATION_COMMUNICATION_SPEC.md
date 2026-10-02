# Hospital Management System
## Notification & Communication Specification
**Document:** `docs/NOTIFICATION_COMMUNICATION_SPEC.md`
**Version:** 1.0
**Status:** Authoritative Specification
---
# 1. Purpose
The notification system provides reliable communication between:
* Hospital staff
* Patients
* Departments
* Hospital administration
* External services
Supported channels:
```text
In-App
SMS
Email
Push Notifications
Webhooks
```
The system MUST use provider adapters so that the hospital is not permanently locked to one external provider.
---
# 2. Notification Architecture
```text
Business Event
↓
Notification Service
↓
Template
↓
Recipient Resolution
↓
Queue
↓
Provider Adapter
↓
External Provider
↓
Delivery Result
↓
Audit / Status
```
---
# 3. Notification Types
## Patient Notifications
Examples:
* Appointment confirmation
* Appointment reminder
* Appointment cancellation
* Appointment rescheduling
* Lab result availability
* Prescription availability
* Follow-up reminder
* Payment receipt
* Insurance update
## Staff Notifications
Examples:
* New appointment
* Emergency alert
* New lab order
* Critical lab result
* New radiology order
* Pending approval
* Low inventory
* System alert
---
# 4. Internal Notifications
Internal notifications should work without Internet.
Examples:
```text
Doctor → Nurse
Lab → Doctor
Pharmacy → Doctor
Administration → Staff
```
Use:
* WebSockets
* Notification database
* Polling fallback where necessary
---
# 5. SMS
SMS provider integration must use an adapter:
```text
SmsProvider
```
Example:
```text
sendSms()
getDeliveryStatus()
```
The core system must not directly depend on one provider SDK.
---
# 6. Email
Email service should support:
* SMTP
* API-based providers
* Hospital mail server
Templates should support:
* Arabic
* English
---
# 7. Templates
Templates should be stored/configured separately.
Example:
```text
APPOINTMENT_REMINDER_AR
APPOINTMENT_REMINDER_EN
LAB_RESULT_READY_AR
LAB_RESULT_READY_EN
PAYMENT_RECEIPT_AR
```
Templates should support variables:
```text
{{patientName}}
{{appointmentDate}}
{{doctorName}}
{{hospitalName}}
```
---
# 8. Localization
Notification language should be determined by:
1. Patient preference
2. Hospital configuration
3. System default
Never assume one language.
---
# 9. Notification Preferences
Patients/staff may have configurable preferences where legally and operationally appropriate.
Example:
```text
SMS = Enabled
Email = Disabled
In-App = Enabled
```
Critical operational notifications may override normal preferences where necessary.
---
# 10. Notification Priority
Recommended priorities:
```text
CRITICAL
HIGH
NORMAL
LOW
```
Example:
Critical:
```text
Critical laboratory result notification
```
Normal:
```text
Appointment reminder
```
---
# 11. Queue Architecture
Use:
```text
Redis
+
BullMQ
```
Queue jobs should support:
* Retry
* Exponential backoff
* Delayed jobs
* Dead-letter/failed jobs
* Monitoring
---
# 12. Retry Rules
Example:
```text
Attempt 1 → immediate
Attempt 2 → 30 seconds
Attempt 3 → 2 minutes
Attempt 4 → 10 minutes
Attempt 5 → failed queue
```
Exact values should be configurable.
---
# 13. Idempotency
Notifications MUST avoid accidental duplication.
Every notification should have a unique logical identifier.
Example:
```text
appointment-reminder:
hospitalId + appointmentId + reminderType + scheduledDate
```
---
# 14. Delivery Status
Supported states:
```text
PENDING
QUEUED
SENDING
SENT
DELIVERED
FAILED
CANCELLED
```
Provider-specific statuses should be mapped into the common model.
---
# 15. Webhooks
External providers may send delivery updates.
Webhook endpoints MUST:
* Verify authenticity
* Validate payload
* Use idempotency
* Prevent replay
* Log events
* Avoid trusting arbitrary client data
---
# 16. Security
Never put sensitive medical information into SMS unless explicitly permitted and appropriately designed.
Avoid:
```text
Your test shows...
```
Prefer:
```text
A new medical result is available. Please contact the hospital.
```
---
# 17. Emergency Notifications
Emergency alerts may be delivered through:
* Internal real-time notifications
* Audible/visual hospital alerts
* SMS
* Email
depending on hospital configuration.
---
# 18. Notification Scheduling
The system should support scheduled notifications.
Example:
```text
Appointment:
2026-10-15 10:00
Reminder:
2026-10-14 10:00
```
Scheduler should use hospital timezone.
---
# 19. Offline Mode
When Internet is unavailable:
* Internal notifications continue.
* SMS/email jobs remain queued locally.
* Once connectivity returns, jobs synchronize/send.
* Duplicate sends must be prevented.
---
# 20. Cloud Synchronization
Notification state may synchronize between:
```text
Hospital Server
↕
Cloud
```
But local operational notifications should not depend on cloud connectivity.
---
# 21. Audit
Record:
* Notification ID
* Hospital
* Sender/system
* Recipient
* Channel
* Template
* Created time
* Sent time
* Delivery status
* Provider
* Failure reason
Do not store unnecessary sensitive message content.
---
# 22. Communication Logs
Authorized staff may view communication history.
Filters:
* Date
* Recipient
* Channel
* Status
* Notification type
---
# 23. Rate Limiting
Protect against:
* SMS abuse
* Email abuse
* Notification loops
* Provider cost explosions
Rate limits should exist per:
* Hospital
* User
* Patient
* Provider
* Notification type
---
# 24. Provider Adapter
Recommended architecture:
```text
NotificationService
↓
SmsProvider
├── ProviderA
├── ProviderB
└── ProviderC
```
The business domain must not import provider SDKs directly.
---
# 25. Future Channels
Architecture should allow:
* WhatsApp where legally/provider-supported
* Mobile push
* Patient portal notifications
* Voice calls
* Hospital displays
* Queue screens
without redesigning the core notification system.
---
# 26. Cursor Rules
Cursor MUST:
* Create a central notification service.
* Use queues.
* Use provider adapters.
* Implement retries.
* Implement idempotency.
* Implement delivery states.
* Add webhook validation.
* Support Arabic/English.
* Protect sensitive medical information.
* Add tests.
* Keep provider code isolated.
---
# 27. Definition of Done
Notification infrastructure is complete when:
* In-app notifications work
* Queue works
* Retry works
* Failed jobs are visible
* SMS adapter exists
* Email adapter exists
* Templates work
* Localization works
* Delivery statuses work
* Webhooks are secure
* Audit works
* Offline queue works
* Tests exist
