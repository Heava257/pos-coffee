# SOFTWARE REQUIREMENT SPECIFICATION (SRS)
## PART 11 — PROCESS SPECIFICATION & PROCESS ANALYSIS

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Senior System Analyst, Business Process Analyst & Enterprise Software Architect  
**Status:** Under Review  

---

## 1. Process Identification

This section lists the key workflows that define system actions and verify data consistency.

### PROC-001: Tenant Account Registration
*   **Description:** Creates and activates a new tenant workspace and user profile.
*   **Purpose:** Registers the business tenant and generates their database environment.
*   **Responsible Actor:** Business Owner.
*   **Related Use Case:** UC-001: Register Account.
*   **Related Business Rules:** BR-USR-001 (Email Verification Rule).

### PROC-002: Tenant Workspace Onboarding
*   **Description:** Guides the tenant owner through company, base currency, tax, and branch configurations.
*   **Purpose:** Configures operational parameters before enabling sales checkouts.
*   **Responsible Actor:** Business Owner.
*   **Related Use Case:** UC-003: Setup Business, UC-005: Setup Branch.
*   **Related Business Rules:** BR-WKF-001 (Onboarding Order).

### PROC-003: Subscription Plan Activation
*   **Description:** Processes plan selection and routes payment details through the payment gateway.
*   **Purpose:** Sets plan limits and updates subscription status.
*   **Responsible Actor:** Business Owner.
*   **Related Use Case:** UC-004: Select Subscription Plan.
*   **Related Business Rules:** BR-SUB-001 (Active Subscription Check).

### PROC-004: Staff Provisioning & Role Invitation
*   **Description:** Invites staff, sends onboarding links, and maps roles and branch permissions.
*   **Purpose:** Grants employees secure access to assigned branches.
*   **Responsible Actor:** Business Owner (or Manager).
*   **Related Use Case:** UC-006: Invite Employee.
*   **Related Business Rules:** BR-USR-001, BR-DAT-001.

### PROC-005: Coffee POS Sales Checkout
*   **Description:** Calculates subtotals, processes payments, updates inventory levels, and records transaction details.
*   **Purpose:** Processes in-store customer checkouts.
*   **Responsible Actor:** Cashier.
*   **Related Use Case:** UC-008: Create POS Order, UC-009: Process Payment.
*   **Related Business Rules:** BR-TXN-001, BR-TXN-002, BR-DAT-002, BR-FIN-001.

### PROC-006: Inventory Audit & Waste Adjustment
*   **Description:** Records physical counts, calculates variances, and updates inventory levels.
*   **Purpose:** Synchronizes database inventory levels with physical stock.
*   **Responsible Actor:** Inventory Staff.
*   **Related Use Case:** UC-012: Audit Stock Count.
*   **Related Business Rules:** BR-DAT-001, BR-TXN-002 (Manager PIN Override).

### PROC-007: Shift Reconciliation (Z-Report Generation)
*   **Description:** Reconciles cash drawer balances and generates sales summaries at shift end.
*   **Purpose:** Audit cashier drawer balances and close active shifts.
*   **Responsible Actor:** Cashier.
*   **Related Use Case:** UC-011: Generate Shift Z-Report.
*   **Related Business Rules:** BR-WKF-002, BR-TXN-001.

### PROC-008: Real-Time Low Stock Alert Dispatch
*   **Description:** Monitors stock levels and sends alerts when ingredients fall below replenishment thresholds.
*   **Purpose:** Prevents ingredient shortages.
*   **Responsible Actor:** System.
*   **Related Use Case:** UC-014: Trigger Alert Notifications.
*   **Related Business Rules:** BR-DAT-002, BR-DAT-001.

---

## 2. Process Decomposition

### 2.1 Main Process: PROC-005 (Coffee POS Sales Checkout)

```
[ PROC-005: Coffee POS Sales Checkout ]
                   │
                   ▼
  +───────────────────────────────────+
  │ Sub-Process 5.1: Initialize Cart  │
  +───────────────────────────────────+
                   │
                   ▼
  +───────────────────────────────────+
  │ Sub-Process 5.2: Process Payment  │
  +───────────────────────────────────+
                   │
                   ▼
  +───────────────────────────────────+
  │ Sub-Process 5.3: Deduct Inventory │
  +───────────────────────────────────+
                   │
                   ▼
  +───────────────────────────────────+
  │ Sub-Process 5.4: Log Transaction  │
  +───────────────────────────────────+
```

*   **Sub-Process 5.1: Initialize Cart & Calculate Total:**
    *   *Description:* Cashier builds the cart, system verifies product prices, applies localized taxes, and computes the grand total.
    *   *Dependencies:* Depends on product catalog details and active register shifts.
    *   *Decision Point:* If a cashier modifies a unit price, prompt for manager authorization PIN.
*   **Sub-Process 5.2: Process Payment Authorization:**
    *   *Description:* System processes payments based on the selected method (cash, card, mobile QR).
    *   *System Action:* card or QR payments are routed to the payment gateway API for authorization.
*   **Sub-Process 5.3: Deduct Inventory Levels:**
    *   *Description:* System updates ingredient stock levels based on product recipe mappings.
    *   *System Action:* Deduct stock balances and check if levels fall below warning thresholds.
*   **Sub-Process 5.4: Log Transaction Ledger:**
    *   *Description:* Writes read-only sales records to database tables.
    *   *System Action:* Generates transaction records and dispatches digital receipts to the customer.

---

## 3. Process Input / Output Analysis

### 3.1 Process Name: PROC-005 (Coffee POS Sales Checkout)

*   **Input:**
    *   *Product IDs & Modifier Selections:* Input via touchscreen POS client.
    *   *Payment Details:* Cash amount or payment token from the card terminal.
    *   *Tenant & Branch Context:* Session metadata stored in client headers.
*   **Processing:**
    *   *Tax Calculation:* Applies branch tax configuration rules to the subtotal.
    *   *Discount Validation:* Compiles subtotals and checks discount levels against limits.
    *   *Stock Adjustments:* Queries recipe maps to compute and deduct stock levels.
*   **Output:**
    *   *Invoice Record:* Written to `Order` and `OrderItem` database tables.
    *   *Payment Confirmation:* Logged in the `Payment` table.
    *   *Kitchen Order Ticket:* Dispatched to the kitchen display screen (KDS).

---

## 4. Process Flow Specification

This section maps process flows as they transit through user actions, system checks, database operations, and external services:

```
[ START ] (Cashier submits cart for checkout)
    │
    ▼
[ USER ACTION ] (Cashier selects payment type: Card or QR)
    │
    ▼
[ VALIDATION ] (Verify tenant's subscription status is active)
    │
    ▼
[ DECISION POINT ] (Is payment approved by gateway?)
    ├── Yes ──> [ PROCESSING ] (Calculate local sales tax and subtotal)
    │                │
    │                v
    │           [ DATABASE OPERATION ] (Log read-only transaction & deduct stock)
    │                │
    │                v
    │           [ EXTERNAL INTERACTION ] (Send invoice receipt via email/SMS)
    │                │
    │                v
    │           [ RESULT ] (Print receipt and close transaction screen)
    │                │
    │                v
    │            [ END ]
    │
    └── No ───> [ ERROR HANDLING ] (Cancel checkout process and log failure)
                     │
                     v
                 [ END ]
```

---

## 5. Process Logic Analysis

### 5.1 Process Name: PROC-005 (Coffee POS Sales Checkout)

*   **Conditions:**
    *   The cashier must have an active, open shift.
    *   The tenant's subscription status must be Active.
*   **Rules:**
    *   Transactions are read-only once finalized (`BR-TXN-001`).
    *   Inventory levels must update automatically upon checkout (`BR-DAT-002`).
*   **Decision Logic (If/Else):**
    ```
    IF subscription_status != "Active" THEN
        Abort transaction;
        Display error: "Subscription inactive. Checkout blocked."
    ELSE IF payment_method == "Card" THEN
        Execute external API payment charge;
        IF payment_approved == True THEN
            Write transaction database records;
            Deduct recipe stock levels;
            Complete checkout;
        ELSE
            Cancel checkout;
            Display error: "Card declined."
        ENDIF
    ELSE IF payment_method == "Cash" THEN
        Calculate customer change;
        Open cash drawer;
        Write transaction database records;
        Deduct recipe stock levels;
        Complete checkout;
    ENDIF
    ```
*   **Exceptions:**
    *   *Gateway Timeout:* If the payment gateway API fails to respond within 10 seconds, rollback the transaction, update the status to Failed, and log the event.
*   **Recovery:**
    *   If database connections fail mid-checkout, rollback pending transactions, cache the order on the local POS client, and retry synchronization when connections restore.

---

## 6. System Process States

This section defines state transitions for system entities during execution:

### 6.1 Entity: Order (Sales Invoice)
*   **Initial State:** `Pending` (Created when items are added to the POS cart).
*   **Action:** Cashier processes card checkout payment.
*   **New State:** `Paid` (Set when the payment gateway approves the transaction).
*   **Action:** System deducts stock levels and writes ledger records.
*   **New State:** `Completed` (Final state. Order details are read-only).
*   **Allowed Transitions:**
    *   `Pending` $\rightarrow$ `Paid` $\rightarrow$ `Completed` (Main success path).
    *   `Pending` $\rightarrow$ `Voided` (Condition: Cashier cancels the active checkout session).
    *   `Completed` $\rightarrow$ `Refunded` (Condition: Manager overrides and approves invoice refund).

---

## 7. Process Interaction Analysis

This diagram maps communications between components during POS checkouts:

```
[ POS CLIENT ] ----( Cart details & Payment token )----> [ API GATEWAY ]
                                                             │
                                                             ▼
[ PAYMENT GATEWAY ] <---( Capture charge ) <--- [ PAYMENT ROUTER SERVICE ]
                                                             │
                                                             ▼
[ DATABASE SERVER ] <---( Log order & deduct stock ) <--- [ POS SERVICE ]
                                                             │
                                                             ▼
[ NOTIFICATION SERVICE ] ----( Dispatch receipt ) ----> [ SENDGRID / TWILIO ]
```

---

## 8. Process Performance Considerations

*   **Processing Time:** The checkout process (cart calculations, tax calculations, and database writes) must execute in under **500 milliseconds**.
*   **Transaction Volume:** The POS checkout service must support a baseline processing capacity of **2,000 requests per second** across the platform.
*   **Concurrent Execution:** The database must use transaction isolation parameters to prevent double-deducting stock during concurrent checkouts of the same product.

---

## 9. Process Specification Table

This table maps process IDs to actors, inputs, transformations, and priorities:

| Process ID | Process Name | Actor | Input | Processing | Output | Related Use Case | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PROC-001** | Tenant Registration | Business Owner | Registration form inputs. | Check email uniqueness, create tenant database workspace. | Active workspace, welcome email. | UC-001 | Must Have |
| **PROC-004** | Staff Invitation | Business Owner | Staff email, role, and branch mappings. | Validate seat limits, send invitation email. | Pending user profile, email invitation link. | UC-006 | Must Have |
| **PROC-005** | POS Checkout | Cashier | Cart item list, payment token. | Calculate taxes, authorize payment, deduct stock levels. | Completed order, print receipt. | UC-008 / UC-009 | Must Have |
| **PROC-006** | Inventory Audit | Inventory Staff | Physical stock count input. | Calculate stock variance, update database levels. | Adjusted stock levels, audit logs. | UC-012 | Must Have |
| **PROC-007** | Shift Z-Report | Cashier | Drawer cash total. | Reconcile cash totals against invoice records, close active shift. | Shift Z-report summary. | UC-011 | Must Have |

---

## 10. Conclusion

This Process Specification Document defines the operational workflows, input/output data structures, validation steps, and performance targets for the platform. It provides a detailed map of how data moves through the system during execution.

With these processes documented, the **System Analysis Phase** is finished. The product and engineering teams can now proceed to the **System Design Phase**, where these specifications will guide the implementation of database schemas, API controllers, and testing scripts.
