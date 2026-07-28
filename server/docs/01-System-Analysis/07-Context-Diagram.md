# SYSTEM CONTEXT DIAGRAM SPECIFICATION

## 1. System Context Diagram
The System Context Diagram establishes the system boundary and defines the interface connections between the SaaS Platform and external actors.

`
                    +------------------------------------------+
                    |           EXTERNAL SMS SERVICE           |
                    +------------------------------------------+
                                         â–²
                                         â”‚ SMS Notifications
                                         â–¼
+---------------+   Requests    +==================+   SQL Query   +------------------+
| BUSINESS USER | ------------> |   SaaS PLATFORM  | ------------> | PRIMARY DATABASE |
+---------------+ <------------ |  SYSTEM BOUNDARY | <------------ +------------------+
                    Response    +==================+   Data Pool
                                         â–²
                                         â”‚ Card Authorization
                                         â–¼
                    +------------------------------------------+
                    |          EXTERNAL PAYMENT GATEWAY        |
                    +------------------------------------------+
`

## 2. External System Mappings
* **Payment Gateways:** Standard REST integrations with Stripe and local KHQR providers.
* **SMS Providers:** Twilio integration for delivering authorization PIN codes and receipts.
* **Email Services:** SendGrid integration for routing onboarding links and billing invoices.
