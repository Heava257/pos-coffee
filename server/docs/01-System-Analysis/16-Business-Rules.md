# SOFTWARE REQUIREMENT SPECIFICATION (SRS)
## PART 9 — BUSINESS RULE ANALYSIS

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Senior System Analyst, Business Analyst & Enterprise Solution Architect  
**Status:** Under Review  

---

## 1. Business Rule Identification

This section lists the core business rules that govern system actions and verify operational consistency.

### BR-USR-001: Email Verification Rule
*   **Rule ID:** BR-USR-001
*   **Rule Name:** Email Verification Rule
*   **Category:** User Management
*   **Description:** A business tenant account must verify its email address before accessing dashboards, branches, or modules.
*   **Source:** Product Management Security Policy
*   **Priority:** High (Must Have)
*   **Affected Components:** Onboarding Wizard, IAM Services, Tenant Registry.

### BR-USR-002: User Session Lockout Rule
*   **Rule ID:** BR-USR-002
*   **Rule Name:** User Session Lockout Rule
*   **Category:** User Management
*   **Description:** A user account must be suspended for 15 minutes after 5 consecutive failed login attempts.
*   **Source:** Enterprise Security Policy (NFRS Section 6)
*   **Priority:** High (Must Have)
*   **Affected Components:** Login Service, Authentication Gateways.

### BR-TXN-001: Transaction Immutability Rule
*   **Rule ID:** BR-TXN-001
*   **Rule Name:** Transaction Immutability Rule
*   **Category:** Transaction Rules
*   **Description:** Finalized transaction records in the ledger are read-only and cannot be edited or deleted. Adjustments or voids must be recorded as separate, offset transaction logs.
*   **Source:** GDT Compliance & Auditing Standards
*   **Priority:** High (Must Have)
*   **Affected Components:** Sales Ledger, POS Checkout, Reporting Engine.

### BR-TXN-002: Manager Override Authorization Rule
*   **Rule ID:** BR-TXN-002
*   **Rule Name:** Manager Override Authorization Rule
*   **Category:** Transaction Rules
*   **Description:** High-risk POS actions (refunds, item voids, manual price changes) require manager PIN authorization before execution.
*   **Source:** Retail Fraud Prevention Guidelines
*   **Priority:** High (Must Have)
*   **Affected Components:** POS Checkout Client, Permission Manager.

### BR-DAT-001: Multi-Tenant Data Isolation Rule
*   **Rule ID:** BR-DAT-001
*   **Rule Name:** Multi-Tenant Data Isolation Rule
*   **Category:** Data Rules
*   **Description:** All database query transactions must include a tenant ID check to prevent cross-tenant data leaks.
*   **Source:** SaaS Security Architecture (NFRS Section 7)
*   **Priority:** High (Must Have)
*   **Affected Components:** SQL Query Router, Application Layer.

### BR-DAT-002: Recipe Inventory Deduction Rule
*   **Rule ID:** BR-DAT-002
*   **Rule Name:** Recipe Inventory Deduction Rule
*   **Category:** Data Rules
*   **Description:** Completing a menu item sale must automatically deduct ingredients from stock levels based on the configured recipe mappings.
*   **Source:** F&B Inventory Management Specifications
*   **Priority:** High (Must Have)
*   **Affected Components:** POS Checkout Service, Inventory Manager.

### BR-SUB-001: Active Subscription Verification Rule
*   **Rule ID:** BR-SUB-001
*   **Rule Name:** Active Subscription Verification Rule
*   **Category:** Financial Rules
*   **Description:** If a tenant’s subscription expires or payment fails, the system must set the workspace status to Read-Only, blocking POS sales checkouts.
*   **Source:** Subscription Business Model (BRD Section 6)
*   **Priority:** High (Must Have)
*   **Affected Components:** API Gateway, Subscription Engine, POS Checkout Client.

### BR-FIN-001: Local Sales Tax Calculation Rule
*   **Rule ID:** BR-FIN-001
*   **Rule Name:** Local Sales Tax Calculation Rule
*   **Category:** Financial Rules
*   **Description:** The checkout calculator must apply localized tax rates (e.g., 10% VAT in Cambodia) to order totals.
*   **Source:** Regional Tax Regulations
*   **Priority:** High (Must Have)
*   **Affected Components:** POS Checkout Service, Billing Engine.

---

## 2. Business Rule Categories

```
+---------------------------------------------------------------------------------+
|                            BUSINESS RULE CATEGORIES                             |
|                                                                                 |
|  [ USER RULES ]                 [ TRANSACTION RULES ]       [ DATA RULES ]      |
|  BR-USR-001: Email Verification BR-TXN-001: Immutability    BR-DAT-001: Isolation|
|  BR-USR-002: Account Lockout    BR-TXN-002: Manager PIN     BR-DAT-002: Recipe  |
|                                                                                 |
|  [ WORKFLOW RULES ]             [ SECURITY RULES ]          [ FINANCIAL RULES ] |
|  BR-WKF-001: Onboarding Path    BR-SEC-001: Token Expiry    BR-FIN-001: Tax Calc|
|  BR-WKF-002: Shift Open Check   BR-SEC-002: RLS Enforce     BR-FIN-002: Refund  |
+---------------------------------------------------------------------------------+
```

### 2.1 User Management Rules
*   *Registration:* Registration requires a verified, unique email address.
*   *Authentication:* POS terminal logins require a unique 4-digit PIN.
*   *Account Status:* Delinquent billing status blocks write-access to the workspace.
*   *Permission:* Users cannot access branches or functions outside their assigned role permissions.

### 2.2 Transaction Rules
*   *Transaction Validation:* Orders must contain at least one item and have a validated payment type before checkout completion.
*   *Processing:* Completing a payment must trigger receipt printing and inventory deductions.
*   *Cancellation:* Canceled orders must log the cashier details and cancellation reasons.

### 2.3 Data Rules
*   *Validation:* Product prices and inventory counts cannot be set to negative values.
*   *Integrity:* Deleting products must use soft-deletes to preserve historical sales records.
*   *Isolation:* SQL database queries must verify tenant ID parameter mappings.

### 2.4 Workflow Rules
*   *Onboarding:* Tenants must complete organization and initial branch configurations before they can invite employees.
*   *Shift Check:* Cashiers must open a register shift session and log starting drawer cash before processing checkout orders.

### 2.5 Security Rules
*   *Access Control:* Session tokens must invalidate after 30 minutes of user inactivity.
*   *Auditing:* The system must record administrative changes and transaction overrides in the audit trail.

### 2.6 Financial Rules
*   *Pricing:* Upgrades mid-cycle must calculate prorated fees based on the remaining days in the billing cycle.
*   *Refunds:* Refund transactions must be linked to the original sales invoice ID.

---

## 3. Business Process Rules

### 3.1 Process Name: Coffee POS Sales Checkout
*   **Step 1: Cashier creates order cart.**
    *   *Rule Applied:* `BR-WKF-002 (Shift Check)` — The cashier must have an active, open register shift before adding items to the cart.
*   **Step 2: Cashier applies discount override.**
    *   *Rule Applied:* `BR-TXN-002 (Manager PIN Override)` — If the discount exceeds 10%, the system must prompt for manager PIN entry before updating the cart.
*   **Step 3: Cashier selects payment type.**
    *   *Rule Applied:* `BR-SUB-001 (Subscription Check)` — The system must verify that the tenant's subscription status is Active.
*   **Step 4: Cashier completes payment and processes checkout.**
    *   *Rule Applied:* `BR-DAT-002 (Recipe Inventory Deduction)` — The system must automatically deduct ingredients from stock levels.

---

## 4. Decision Logic Analysis

### Decision ID: DS-AUTH-01 (User Authentication)
*   **Condition:** User submits login credentials.
*   **Outcomes:**
    *   If credentials match and tenant status is Active $\rightarrow$ Generate session token and grant access.
    *   If credentials match but tenant status is Suspended $\rightarrow$ Display billing warning and block access.
    *   If credentials do not match $\rightarrow$ Show error, increment failed attempt count, and log event.

### Decision ID: DS-POS-02 (Price Override Validation)
*   **Condition:** Cashier modifies a product's preset unit price.
*   **Outcomes:**
    *   If cashier has override permissions $\rightarrow$ Update item price and log changes.
    *   If cashier does not have override permissions $\rightarrow$ Prompt for manager authorization PIN.
    *   If manager PIN is invalid $\rightarrow$ Block price changes and show warning.

---

## 5. Status Transition Rules

### 5.1 Entity: Tenant Account Lifecycle

```
[ REGISTERED ] ----( Email Confirmed? )----> [ ACTIVE ]
      │                                         │
      │                                   ( Payment Fails? )
      v                                         │
[ SUSPENDED ] <---( 7-Day Grace Ends ) <--- [ READ-ONLY ]
```

*   **States Defined:**
    *   *Registered:* Tenant database created, awaiting email verification.
    *   *Active:* Full read/write access.
    *   *Read-Only:* Account suspended or payment failed. Users can view dashboards but POS checkouts are blocked.
    *   *Suspended:* Tenant access is blocked due to non-payment or administrative actions.
*   **Allowed Transitions:**
    *   `Registered` $\rightarrow$ `Active` (Condition: Email confirmation confirmed).
    *   `Active` $\rightarrow$ `Read-Only` (Condition: Subscription payment fails).
    *   `Read-Only` $\rightarrow$ `Suspended` (Condition: Grace period of 7 days expires without payment).
    *   `Read-Only` / `Suspended` $\rightarrow$ `Active` (Condition: Billing payment processed successfully).

---

## 6. Validation Rules

### 6.1 Input Validation
*   *Required Fields:* Product creations require Name, Price, and Category inputs.
*   *Format Rules:* User email addresses must match standard structures (`user@domain.com`).
*   *Range Rules:* Product selling prices must be set to $\ge 0.00$.

### 6.2 Data Validation
*   *Duplicate Prevention:* The system must verify that product barcodes are unique within the tenant’s catalog.
*   *Referential Integrity:* Transactions must fail if the system cannot verify the cashier, branch, or tenant IDs.

### 6.3 Business Validation
*   *Stock Validation:* The system must block checkout checkouts if an item is out of stock, unless a manager overrides the warning.

---

## 7. Exception Handling Rules

| Error Condition | Business Rule | System Response | User Notification |
| :--- | :--- | :--- | :--- |
| **Card Reader Failure** | Transactions cannot be completed without verified payment. | Cancel checkout process, release table lock, and log error code. | "Card terminal communication failed. Select cash checkout or retry." |
| **Duplicate Barcode Registry** | Barcodes must be unique within the branch catalog. | Block database write operation and flag duplicate fields. | "Product barcode already registered. Enter a different barcode." |
| **Failed Database Connection** | Offline transactions must cache locally on terminals. | Enable offline mode, write checkout logs to local storage, and queue syncs. | "Platform offline. POS running in local cache mode." |

---

## 8. Business Rule Traceability Matrix

This matrix maps Business Rules to use cases and modules:

| Rule ID | Business Rule Name | Category | Affected Use Case | Affected Module | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BR-USR-001** | Email Verification | User Management | UC-001: Register Account | Identity (IAM) | High |
| **BR-USR-002** | User Session Lockout | User Management | UC-002: Authenticate User | Identity (IAM) | High |
| **BR-TXN-001** | Transaction Immutability | Transaction Rules | UC-009: Process Payment | Sales Ledger | High |
| **BR-TXN-002** | Manager PIN Override | Transaction Rules | UC-008: Create Order | Coffee POS | High |
| **BR-DAT-001** | Multi-Tenant Data Isolation | Data Rules | All Use Cases | Platform Database | High |
| **BR-DAT-002** | Recipe Inventory Deduction | Data Rules | UC-009: Process Payment | Inventory Manager | High |
| **BR-SUB-001** | Active Subscription Check | Financial Rules | UC-008: Create Order | Billing Engine | High |
| **BR-FIN-001** | Local Sales Tax Calc | Financial Rules | UC-008: Create Order | Coffee POS | High |

---

## 9. Conclusion

This Business Rule Analysis Document defines the operational rules, data constraints, validation logic, and status transitions for the platform. It provides developers and QA teams with a reference for system behavior and exception handling.

With these rules documented, the **System Analysis Phase** is finished. The product and engineering teams can now proceed to the **System Design Phase**, where these rules will guide the implementation of database constraints, API validations, and testing scripts.
