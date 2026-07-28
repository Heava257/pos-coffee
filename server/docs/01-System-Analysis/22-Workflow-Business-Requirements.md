# BUSINESS REQUIREMENTS & SPECIFICATION DOCUMENT
## Enterprise SaaS Business Management Platform

**Source Document:** [06-Business-Process-Modeling.md](file:///c:/Users/Prime/Desktop/Project%20System/pos-coffee/server/docs/01-System-Analysis/06-Business-Process-Modeling.md)  
**Date:** July 28, 2026  
**Author:** Senior Business Analyst  
**Status:** Initial Draft for Review  

---

## 1. Introduction & Context

This specification outlines the business analysis findings derived **ONLY** from the business process modeling workflow document ([06-Business-Process-Modeling.md](file:///c:/Users/Prime/Desktop/Project%20System/pos-coffee/server/docs/01-System-Analysis/06-Business-Process-Modeling.md)). It covers the entire lifecycle of a SaaS tenant across onboarding, subscriptions, POS sales, inventory, and support, detailing roles, permissions, functional and non-functional requirements, rules, validations, inputs/outputs, and exception flows.

---

## 2. User Roles

The following roles are explicitly identified or referenced in the business workflow:

1. **Business Owner**: The primary tenant administrator who registers the account, creates the organization profile, subscribes to plans, configures branch-level parameters, invites employees, manages roles, and reviews consolidated reports.
2. **Manager**: An administrative role responsible for managing employees, receiving low-stock alerts, auditing stock counts, and authorizing high-privilege activities (such as refunds and manual stock adjustments) via PIN.
3. **Employee**: The generic staff category invited by owners or managers, who can configure their personal password and security PIN.
4. **Cashier**: A front-line operations role responsible for running point-of-sale checkouts, building carts, confirming prices, receiving customer payments, and compiling register shift Z-reports.
5. **Kitchen Staff**: A back-of-house operations role responsible for preparing POS orders and marking them as ready on the Kitchen Display Screen (KDS).
6. **Inventory Staff**: An operations role responsible for logging incoming stock shipments and wastage counts for specific branches.
7. **Customer**: The external purchaser who places POS orders and receives physical or digital invoice receipts.
8. **Support Agent**: An external platform support role responsible for receiving support tickets, reviewing diagnostics logs/troubleshooting parameters, resolving issues, and escalations.
9. **Engineering Team**: An external platform technical team responsible for resolving escalated support tickets.
10. **Platform Administrator**: An external platform technical administrator responsible for high-level system maintenance and updates. Platform Admins have no direct access to tenant databases; troubleshooting requires a masquerade token explicitly generated/authorized by the tenant.

---

## 3. Permissions Matrix

Based on the rules and workflows specified, the permission levels are defined as follows:

| User Role | System Permissions & Domain Scope | Restrictions & Boundaries |
| :--- | :--- | :--- |
| **Business Owner** | Full write/read permissions across the tenant database workspace. Subscription control, branch setup, user provisioning, and full audit log reporting. | None within their isolated tenant workspace. |
| **Manager** | Invite employees and assign roles; log manual inventory adjustments; view branch-level reports. Authorize cashier cash overrides, price overrides, and refunds. | Bounded by user seat limits. Cannot bypass subscription controls. |
| **Cashier** | Manage cart, initiate checkouts, input payments, open cash drawer (upon payment), generate own shift Z-report. | Blocked from viewing consolidated reports across branches. Blocked from manual register reopening, transaction refunds, or pricing overrides without Manager PIN. |
| **Inventory Staff**| View inventory list at target branch, record incoming shipments, log product wastage. | Blocked from making manual stock level adjustments or overrides without manager PIN/authorization. |
| **Kitchen Staff** | Read-only view of POS order tickets; write access to update order status (ready). | Blocked from sales, inventory, and reporting dashboards. |
| **Customer** | No system access. | Restricted to receiving final output (receipt). |
| **Support Agent** | Read-only access to tenant diagnostic logs and troubleshooting parameters. Update ticket status. | Blocked from modifying tenant data or transactions directly. |
| **Platform Administrator** | Read-only infrastructure configuration. Platform-level maintenance. | Bounded by zero-direct-access tenant database isolation rules. Cannot access or modify tenant transaction/business data without explicit tenant masquerade authorization. |

---

## 4. Inputs

The following structured inputs are gathered across the workflows:

*   **Process 1: New Business Registration**
    *   *Form Inputs*: Email address, Business Name, Password.
    *   *OAuth Tokens*: Email address, User Name (fetched from Google OAuth or similar provider).
    *   *Verification Input*: Verification token (via email activation link click).
*   **Process 2: Tenant Organization Setup**
    *   *Company Details*: Legal Name, Contact Information, Tax Identification Numbers.
    *   *Localization Settings*: Base Currency, Timezone, Local Date Format.
    *   *Branch Details*: Physical Branch Address, Localized Tax Configurations.
*   **Process 3: Subscription Management**
    *   *Plan Choice*: Subscription Plan Tier (Starter, Growth, Enterprise) and Billing Frequency.
    *   *Payment Method*: Credit card details or debit card details.
*   **Process 4: User and Employee Management**
    *   *User Data*: Employee Name, Email Address, Role (e.g., Cashier), Branch Assignment.
    *   *Profile Setup*: Employee Password, Employee Security PIN (input via invitation link).
*   **Process 5: Coffee POS Sales**
    *   *Cart Selection*: Menu Item IDs, Modifier selections (e.g., espresso shots, milk options).
    *   *Payment Method*: Payment type (Cash, Card, QR).
    *   *Card Payment*: Transaction authorization token/payload from card terminal.
    *   *Cash Payment*: Cash Amount Received.
*   **Process 6: Inventory Management**
    *   *Selection*: Target Branch ID.
    *   *Incoming Shipment*: Item Counts, Unit Cost, Batch ID.
    *   *Wastage Entry*: Wastage item counts, wastage reasons (e.g., spilled beans, expired milk).
    *   *Override PIN*: Manager PIN code for manual stock level overrides.
*   **Process 7: Reporting Process**
    *   *Parameters*: Target Branch ID, Target Date Range.
*   **Process 8: Customer Support Process**
    *   *Ticket Form*: Issue description (hardware error, billing issue, bug details) in chat.
    *   *System Data*: Automated diagnostic logs and troubleshooting parameters.
    *   *Survey Form*: User feedback rating upon ticket closure.

---

## 5. Outputs

The following outputs are generated by the system across the workflows:

*   **Process 1: New Business Registration**
    *   Emailed verification link.
    *   Isolated, deactivated Tenant database workspace.
*   **Process 2: Tenant Organization Setup**
    *   Stored Company Profile and hierarchy.
    *   Stored initial physical branch.
*   **Process 3: Subscription Management**
    *   Subscription Payment Provider Transaction ID.
    *   "Active" or "Grace" status.
    *   Initialized workspace seat and branch limits.
*   **Process 4: User and Employee Management**
    *   Emailed invitation link.
    *   Activated user profile mapping to roles/permissions.
*   **Process 5: Coffee POS Sales**
    *   Calculated Customer Change (for Cash Sales).
    *   Printed or emailed digital receipt.
    *   Kitchen Order Ticket sent to KDS or printer.
    *   Updated database ledger records (`Order`, `OrderItem`, `Payment`).
*   **Process 6: Inventory Management**
    *   Updated stock levels and adjusted average unit cost basis.
    *   Low-stock alerts (delivered to Manager).
    *   Logged wastage records.
*   **Process 7: Reporting Process**
    *   Compiled UI charts and sales tables.
    *   Exported files: PDF, CSV, or Excel formats.
*   **Process 8: Customer Support Process**
    *   Open Support Ticket record.
    *   Escalated ticket records.
    *   Closed ticket resolution metrics.

---

## 6. Functional Requirements

*   **FR-REG-001 (Owner Sign Up)**: The system must allow users to register an account by entering their email, business name, and password.
*   **FR-REG-002 (OAuth Integration)**: The system must support registration through third-party OAuth providers, skipping manual email verification if verified email details are retrieved.
*   **FR-REG-003 (Email Verification Dispatch)**: The system must generate and send a unique activation link to the registered email address upon manual sign up.
*   **FR-ONB-001 (Onboarding Wizard)**: The system must guide verified owners to enter company legal name, contact information, tax ID numbers, base currency, timezone, local date formats, and the first physical branch address.
*   **FR-ONB-002 (Vertical Templates)**: The system must apply default configuration templates based on the tenant's business vertical (e.g., F&B templates) during onboarding.
*   **FR-SUB-001 (Plan Configuration)**: The system must present subscription plan tiers and process credit/debit billing, updating workspace limits (users/branches) upon payment success.
*   **FR-SUB-002 (Free Trial)**: The system must allow owners to activate a 14-day free trial, updating tenant workspace limits without requiring payment details.
*   **FR-USR-001 (User Invitations)**: The system must allow owners and managers to input employee details (name, email, role, branch) and send email invitation links.
*   **FR-USR-002 (Staff Activation)**: The system must allow invited employees to set up passwords and security PINs via the invitation link to activate their accounts.
*   **FR-POS-001 (Cart Construction)**: The system must support building a cart with menu items and options (modifiers).
*   **FR-POS-002 (Sales Tax Calculation)**: The system must calculate and apply localized sales taxes to the cart subtotal based on the branch configuration.
*   **FR-POS-003 (Card Checkout)**: The system must route card checkout requests to the payment provider API and wait for approval.
*   **FR-POS-004 (Cash Checkout)**: The system must accept cash amount inputs, calculate change, trigger the opening of the physical cash drawer, and write payment records.
*   **FR-POS-005 (Kitchen Dispatch)**: The system must automatically dispatch order tickets to the kitchen display screen or kitchen printer upon checkout completion.
*   **FR-POS-006 (Inventory Update)**: The system must automatically deduct ingredients from stock levels in real time upon successful checkout according to product recipe maps.
*   **FR-INV-001 (Shipment Logging)**: The system must allow inventory staff to record incoming shipments (counts, unit cost, batch ID) and update average cost bases.
*   **FR-INV-002 (Wastage Log)**: The system must allow staff to log wastage (e.g., spilled beans, expired milk) and deduct inventory levels.
*   **FR-INV-003 (Threshold Alerts)**: The system must monitor stock levels against configured low-stock thresholds and dispatch warning alerts to managers when levels are breached.
*   **FR-REP-001 (Shift Z-Reports)**: The system must support the generation of shift Z-reports to reconcile cash drawer balances and close cashier register sessions.
*   **FR-REP-002 (Report Queries & Export)**: The system must enable owners and managers to query transaction, inventory, and audit logs by date and branch, and export them as PDF, CSV, or Excel files.
*   **FR-SUP-001 (In-App Support Ticket)**: The system must enable tenants to submit support requests via in-app chat, capture diagnostic logs, and collect user feedback ratings on ticket resolution.

---

## 7. Non-Functional Requirements

*   **NFR-SEC-001 (Logical Multi-Tenant Isolation)**: All database queries, reports, and search results must be strictly scoped to the user's active tenant ID, preventing cross-tenant data exposure.
*   **NFR-SEC-002 (Access Control)**: No user is permitted to log in to POS terminals or access back-office dashboards unless their profile status is "Active."
*   **NFR-SEC-003 (High-Privilege Auditing)**: All manual stock overrides and transaction refunds must require manager PIN validation, and the actions must be logged in a persistent, read-only audit history.
*   **NFR-REL-001 (Subscription Grace Period)**: The system must support a 3-day grace period for payment failures during which the account remains functional.
*   **NFR-REL-002 (Grace Period Expiry Action)**: Upon expiration of the 3-day grace period, the system must restrict write-access to the tenant workspace while allowing read-only reporting access.
*   **NFR-USA-001 (Localization Settings)**: System date formats, currencies, and tax rates must display and calculate dynamically based on onboarding configuration settings.
*   **NFR-PER-001 (System Performance)**: Target page load latency must be less than 2 seconds, and POS cart calculation and database write times must be less than 1 second.
*   **NFR-PER-002 (System Throughput)**: The system must support up to 50 concurrent transactions per second per tenant.
*   **NFR-REL-003 (System Availability SLA)**: The expected platform service availability SLA must be 99.9% uptime.
*   **NFR-COM-001 (Compliance and Data Retention)**: Sales ledgers and invoices must be retained for 5 years for tax compliance; system audit trails must be retained for 1 year before automatic archiving.

---

## 8. Business Rules

*   **BR-REG-001 (Email Verification Rule)**: Every business owner must verify their email address before they can access tenant dashboards or configure organization profiles.
*   **BR-ONB-001 (Branch Pre-requisite Rule)**: A tenant must configure at least one physical branch location before they can activate modules or invite staff users.
*   **BR-SUB-001 (Invitation Limit)**: The platform must block invitations to new users if the active employee count matches the subscription plan limit.
*   **BR-SUB-002 (Trial Limits)**: On 14-day free trials, system limits must be enforced without requiring billing details.
*   **BR-USR-001 (Active Profile Login)**: A user cannot log in to a POS terminal or access back-office dashboards unless their profile status is Active.
*   **BR-TXN-001 (Transaction Integrity)**: Point-of-sale checkout orders cannot be finalized without payment confirmation from the Payment Provider or cashier cash confirmation.
*   **BR-REP-001 (Reconciliation Permanence)**: Cashier register sessions cannot be reopened once Z-reports are compiled and closed.
*   **BR-DAT-001 (Tenant Data Isolation)**: All database queries, reports, and search results must be scoped to the user's active tenant ID to enforce logical isolation.
*   **BR-INV-001 (Manager Adjustment Override)**: Manual stock adjustments (other than automatic checkout deductions and logged incoming shipments) and transaction refunds require manager authentication PINs, and the actions must be logged in the audit history.

---

## 9. Validation Rules

*   **VAL-REG-001 (Email Uniqueness)**: During registration, the system must validate that the entered email address is unique across the platform database.
*   **VAL-ONB-001 (Completeness of Onboarding)**: The system must block onboarding completion until company name, contact info, tax ID, base currency, timezone, local date formats, and at least one branch address are provided.
*   **VAL-SUB-001 (User Seat Availability)**: Prior to sending an employee invite, the system must check that the number of active users is less than the subscription plan user seat limit.
*   **VAL-POS-001 (Payment Approval Check)**: During card checkouts, the system must check the payment provider transaction response and block order completion if the status is not approved.
*   **VAL-INV-001 (Input Sign Checks)**: The system must validate that entered quantities and costs for shipments are positive numerical values.
*   **VAL-INV-002 (PIN Authorization Check)**: Before saving manual stock adjustments, refunds, or price changes, the system must validate that the entered manager security PIN exists and belongs to a user with the Manager or Owner role.
*   **VAL-REG-002 (Password Strength)**: Passwords must be at least 8 characters long and contain at least one letter and one number.
*   **VAL-ONB-002 (Tax Identification Format)**: Tax Identification Numbers must be alphanumeric and between 9 and 15 characters long.
*   **VAL-POS-002 (Manual Cash Drawer Release)**: Manual cash drawer opens without a direct transaction require validation of a manager's security PIN and must be recorded as an audit event.

---

## 10. Exception Cases

*   **EXC-REG-001 (Email Already Registered)**
    *   *Condition*: Owner tries to sign up with an existing email.
    *   *Action*: Display an error message, block the registration, and prompt the owner to log in or reset their password.
*   **EXC-SUB-001 (Subscription Payment Declined)**
    *   *Condition*: Plan purchase or renewal payment fails.
    *   *Action*: Notify the owner of the failure, apply a 3-day grace status to the account, and prompt for updated billing details.
*   **EXC-SUB-002 (User Seats Exceeded)**
    *   *Condition*: Administrator attempts to invite a user but the subscription user seat limit has been reached.
    *   *Action*: Block the invitation and prompt the owner to upgrade their subscription plan.
*   **EXC-POS-001 (Card Payment Declined)**
    *   *Condition*: Payment Provider returns a declined status during card checkout.
    *   *Action*: Abort checkout completion, keep the current cart active on screen, display a payment failure message, and prompt the cashier for a different payment method.
*   **EXC-INV-001 (Low Stock Threshold Breached)**
    *   *Condition*: Ingredient stock levels fall below set low-stock thresholds.
    *   *Action*: Trigger the system to dispatch warning alerts to the manager.
*   **EXC-POS-002 (Payment Gateway Timeout)**: If the payment provider API times out (after 15 seconds), the checkout is aborted, any transaction lock is released, and the cashier is prompted to retry or select cash.
*   **EXC-SYS-001 (Offline POS Checkout)**: When network connectivity is lost, POS terminals switch to offline mode using client-side caching (IndexedDB). Orders are queued and automatically synced when connection is restored.
*   **EXC-SYS-002 (Verification Link Expiry)**: Tenant email verification links expire after 24 hours. Clicking an expired link displays an error page with an option to request a new link.
*   **EXC-SYS-003 (Database Connection Failure Mid-Checkout)**: If a database write failure occurs during checkout, the transaction is rolled back locally, and the cashier is shown a retry dialog to prevent duplicate records or mismatched states.

---

## 11. Finalized Specifications & Rules

The following items have been resolved and finalized as mandatory system and security specifications:

1. **Platform Administrator Role & Permissions**: Restrictive access model. Platform Admins have no direct tenant database access. Support troubleshooting requires masquerade tokens explicitly authorized by the tenant.
2. **Offline POS Capability**: Full offline checkouts using IndexedDB with automatic queue sync on reconnection.
3. **Transaction/Payment Gateway Timeouts**: 15-second timeout with automatic rollback and cash fallback prompt.
4. **Localization Patterns**: Multi-currency conversion and customizable tax rates (VAT/Sales tax support).
5. **System Performance Targets**: Page load < 2s, checkout write < 1s, peak concurrency 50 checkouts/sec.
6. **Data Validation Formats**: Alphanumeric tax IDs (9-15 chars), 8+ character password (letter + number), 4-digit employee PINs.
7. **Email Verification Link Lifespan**: 24-hour expiration window.
8. **Compliance and Data Archiving**: 5-year sales ledger retention, 1-year audit trail retention before archiving.
