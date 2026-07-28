# SOFTWARE REQUIREMENT SPECIFICATION (SRS)
## PART 8 — USE CASE DIAGRAM & DETAILED USE CASE SPECIFICATION

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Senior System Analyst, UML Specialist & Enterprise Software Architect  
**Status:** Under Review  

---

## 1. Actor Identification

The system boundary connects human users and external services. These actors are classified based on their role in the platform.

### 1.1 Platform-Level Actors

#### Actor Name: Platform Administrator
*   **Actor Type:** Human Actor
*   **Classification:** Primary Actor
*   **Description:** SaaS operations administrators representing the platform owner.
*   **Responsibilities:** Provisioning tenants, managing subscription tiers, toggling modules, and auditing logs.
*   **System Access Level:** Global SaaS Portal Admin (Access to metadata, configuration, and tenant billing; blocked from tenant business databases).

#### Actor Name: Support Staff
*   **Actor Type:** Human Actor
*   **Classification:** Primary Actor
*   **Description:** Customer support agents assisting tenants with system configuration and troubleshooting.
*   **Responsibilities:** Diagnosing issues, checking subscription states, and reviewing system errors.
*   **System Access Level:** Read-Only Platform Admin (Access limited to configurations and system diagnostic logs).

---

### 1.2 Tenant-Level Actors

#### Actor Name: Business Owner (Tenant Owner)
*   **Actor Type:** Human Actor
*   **Classification:** Primary Actor
*   **Description:** The customer who purchases the SaaS subscription to run their business.
*   **Responsibilities:** Managing billing, configuring branches, defining roles, and viewing consolidated reports.
*   **System Access Level:** Tenant Admin (Full read/write access across all branches under the tenant).

#### Actor Name: Business Manager
*   **Actor Type:** Human Actor
*   **Classification:** Primary Actor
*   **Description:** Store supervisors responsible for managing daily branch operations.
*   **Responsibilities:** Auditing shifts, updating stock levels, scheduling staff, and processing overrides.
*   **System Access Level:** Branch Admin (Operational read/write access restricted to assigned branches).

#### Actor Name: Cashier
*   **Actor Type:** Human Actor
*   **Classification:** Primary Actor
*   **Description:** Front-line staff who process customer transactions.
*   **Responsibilities:** Registering sales, processing payments, and generating shift reports.
*   **System Access Level:** POS Client Access (Restricted strictly to the active checkout screen).

#### Actor Name: Inventory Staff
*   **Actor Type:** Human Actor
*   **Classification:** Primary Actor
*   **Description:** Warehouse or back-office staff who manage stock.
*   **Responsibilities:** Receiving shipments, tracking stock audits, and logging wastage.
*   **System Access Level:** Inventory Dashboard Access (Restricted to inventory and supplier management views).

#### Actor Name: Kitchen Staff
*   **Actor Type:** Human Actor
*   **Classification:** Primary Actor
*   **Description:** F&B staff who prepare customer orders.
*   **Responsibilities:** Viewing incoming orders, preparing items, and updating preparation status.
*   **System Access Level:** Kitchen Screen Access (Restricted to order queue displays).

---

### 1.3 External Systems

#### Actor Name: Payment Gateway
*   **Actor Type:** External System Actor
*   **Classification:** External System
*   **Description:** Third-party gateways (Stripe, Bakong/KHQR) that process transactions.
*   **Responsibilities:** Validating cards, generating checkout codes, and confirming payments.
*   **System Access Level:** Scoped Integration API.

#### Actor Name: SMS & Email Services
*   **Actor Type:** External System Actor
*   **Classification:** External System
*   **Description:** Cloud-based notification services (Twilio, SendGrid).
*   **Responsibilities:** Delivering verification codes, onboarding emails, and invoices.
*   **System Access Level:** Outbound API integration.

---

## 2. Use Case Identification

### 2.1 Core Platform Use Case Registry

| Use Case ID | Use Case Name | Primary Actor | System Goal | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **UC-001** | Register Account | Business Owner | Initialize a verified tenant workspace. | Must Have |
| **UC-002** | Authenticate User | User (General) | Generate a secure, role-based session token. | Must Have |
| **UC-003** | Setup Business Organization | Business Owner | Configure legal company settings and base currency. | Must Have |
| **UC-004** | Select Subscription Plan | Business Owner | Activate plan limits and set up billing. | Must Have |
| **UC-005** | Configure Branch Settings | Business Owner | Register a branch and configure local tax rules. | Must Have |
| **UC-006** | Invite Employee | Owner / Manager | Send onboarding links and assign roles/branches. | Must Have |
| **UC-007** | Manage Product Catalog | Manager | Add, edit, or delete items, pricing, and modifiers. | Must Have |
| **UC-008** | Create Order (POS) | Cashier | Build a cart and route print tickets. | Must Have |
| **UC-009** | Process Checkout Payment | Cashier | Validate card, cash, or QR payments and log sales. | Must Have |
| **UC-010** | Deduct Inventory | System | Automatically update stock counts upon checkout. | Must Have |
| **UC-011** | Generate Shift Z-Report | Cashier | Reconcile cashier drawer balances at shift end. | Must Have |
| **UC-012** | Audit Stock Count | Inventory Staff | Update stock levels and verify physical counts. | Must Have |
| **UC-013** | Export Sales Reports | Owner / Manager | Download sales summaries in PDF or CSV formats. | Must Have |
| **UC-014** | Trigger Alert Notifications | System | Send alerts for low stock levels or payment failures. | Should Have |

---

## 3. Use Case Diagram Design

UML use case diagrams represent the system boundary, actors, use cases, and their relationships.

```
       +--------------------------------------------------------------+
       |                         SYSTEM BOUNDARY                      |
       |                                                              |
       |  +--------------------+                                      |
       |  | UC-001: Register   |                                      |
       |  +--------------------+                                      |
       |            ^                                                 |
       |            │ <<include>>                                     |
       |            v                                                 |
       |  +--------------------+                                      |
       |  | UC-002: Authenticate|                                     |
       |  +--------------------+                                      |
       |            ^                                                 |
       |            │ <<include>>                                     |
       |            v                                                 |
       |  +--------------------+            +--------------------+    |
       |  | UC-008: Create POS | ---------> | UC-009: Process    |    |
       |  | Order              |            | Payment            |    |
       |  +--------------------+            +--------------------+    |
       |            |                                |                |
       |            │ <<extend>>                     │                |
       |            v                                v                |
       |  +--------------------+                     │                |
       |  | UC-015: Apply      |                     │                |
       |  | Discount           |                     │                |
       |  +--------------------+                     │                |
       +---------------------------------------------│----------------+
                                                     │
                                                     v
                                            [ Payment Gateway ]
```

### 3.1 Use Case Relationship Map
*   **Business Owner** $\rightarrow$ **UC-001 (Register Account)** $\rightarrow$ *Association*
*   **Business Owner** $\rightarrow$ **UC-004 (Select Subscription Plan)** $\rightarrow$ *Association*
*   **UC-004 (Select Subscription Plan)** $\rightarrow$ **Payment Gateway** $\rightarrow$ *Association*
*   **Business Manager** $\rightarrow$ **UC-007 (Manage Product Catalog)** $\rightarrow$ *Association*
*   **Cashier** $\rightarrow$ **UC-008 (Create POS Order)** $\rightarrow$ *Association*
*   **UC-008 (Create POS Order)** $\rightarrow$ **UC-002 (Authenticate User)** $\rightarrow$ *`<<include>>`*
*   **UC-008 (Create POS Order)** $\rightarrow$ **UC-009 (Process Checkout Payment)** $\rightarrow$ *`<<include>>`*
*   **UC-009 (Process Checkout Payment)** $\rightarrow$ **Payment Gateway** $\rightarrow$ *Association*
*   **UC-008 (Create POS Order)** $\rightarrow$ **UC-015 (Apply Discount Override)** $\rightarrow$ *`<<extend>>`* (Trigger condition: Manager PIN authorization)
*   **UC-009 (Process Checkout Payment)** $\rightarrow$ **UC-010 (Deduct Inventory)** $\rightarrow$ *`<<include>>`*
*   **Inventory Staff** $\rightarrow$ **UC-012 (Audit Stock Count)** $\rightarrow$ *Association*
*   **Business Owner** $\rightarrow$ **Business Manager** $\rightarrow$ *Actor Generalization (Owner inherits Manager roles)*
*   **Business Manager** $\rightarrow$ **Cashier** $\rightarrow$ *Actor Generalization (Manager inherits Cashier roles)*

---

## 4. Detailed Use Case Specification

### 4.1 UC-001: Register Account
*   **Use Case ID:** UC-001
*   **Use Case Name:** Register Account
*   **Primary Actor:** Business Owner
*   **Secondary Actor:** Email Service
*   **Description:** A new business owner registers their company to initialize their isolated SaaS workspace.
*   **Pre-condition:** The owner has a valid email address and is not currently registered.
*   **Trigger:** Owner submits the registration form.
*   **Main Success Flow:**
    1. Owner enters their email, business name, and password.
    2. System verifies that the input email address is unique.
    3. System validates the password complexity.
    4. System creates a pending tenant database shell.
    5. System requests the Email Service to dispatch a verification link containing an activation token.
    6. Owner clicks the verification link, system updates the tenant status to Active, and redirects the owner to the onboarding wizard.
*   **Alternative Flow (OAuth Sign-up):** Owner signs up using Google OAuth. System retrieves the verified email and name, bypasses email verification, and activates the tenant account immediately.
*   **Exception Flow (Email Already Registered):** System displays an error message, blocks registration, and prompts the owner to log in or reset their password.
*   **Post-condition:** The tenant account is activated and the Owner profile is created.
*   **Business Rules:** Email verification must be completed before the owner can configure company profiles or invite staff.

---

### 4.2 UC-002: Authenticate User
*   **Use Case ID:** UC-002
*   **Use Case Name:** Authenticate User (Login)
*   **Primary Actor:** User (General)
*   **Secondary Actor:** None
*   **Description:** A user authenticates into the platform to access their workspace.
*   **Pre-condition:** User account is registered and active.
*   **Trigger:** User enters credentials on the login screen.
*   **Main Success Flow:**
    1. User enters their email and password.
    2. System validates credentials against the user directory.
    3. System verifies that the tenant account is active (not suspended).
    4. System generates a secure session token containing the user's role and tenant ID.
    5. System redirects the user to their designated landing page.
*   **Alternative Flow (POS Terminal PIN Login):** Cashier logs in to a POS terminal by entering their 4-digit PIN. The system validates the PIN for that terminal and logs them in.
*   **Exception Flow (Invalid Credentials):** System displays an error message. After 5 failed attempts, the system locks the account for 15 minutes.
*   **Post-condition:** A secure session is established, and the user's role-based permissions are loaded.
*   **Business Rules:** Sessions must invalidate after 30 minutes of inactivity.

---

### 4.3 UC-004: Select Subscription Plan
*   **Use Case ID:** UC-004
*   **Use Case Name:** Select Subscription Plan
*   **Primary Actor:** Business Owner
*   **Secondary Actor:** Payment Gateway
*   **Description:** The owner selects a plan, enters payment details, and activates plan limits.
*   **Pre-condition:** Owner is logged in and the tenant account is initialized.
*   **Trigger:** Owner submits billing configurations.
*   **Main Success Flow:**
    1. Owner reviews pricing plans and selects a tier (Starter, Growth, Enterprise).
    2. Owner enters credit card and billing details.
    3. System routes the payment request to the Payment Gateway.
    4. Payment Gateway approves the transaction.
    5. System updates the subscription status to Active and updates workspace limits.
*   **Exception Flow (Payment Declined):** System displays an error, prompts for a different card, and places the tenant account on trial/grace status.
*   **Post-condition:** Subscription plan is active, and limits are updated.
*   **Business Rules:** If payment fails after the grace period, the system blocks write-access to the tenant database, allowing read-only reporting access until payment is updated.

---

### 4.4 UC-006: Invite Employee
*   **Use Case ID:** UC-006
*   **Use Case Name:** Invite Employee
*   **Primary Actor:** Business Owner (or Manager)
*   **Secondary Actor:** Email Service
*   **Description:** An administrator invites an employee to join their organization.
*   **Pre-condition:** Owner or Manager is logged in and their subscription user limit has not been reached.
*   **Trigger:** Administrator submits the employee's details.
*   **Main Success Flow:**
    1. Administrator enters the employee's name, email, role, and branch assignment.
    2. System verifies that the subscription plan has available user seats.
    3. System sends an invitation link to the employee's email.
    4. Employee clicks the link and configures their password and PIN.
    5. System activates the user profile and assigns the designated role and permissions.
*   **Exception Flow (Seat Limit Reached):** System blocks the invitation and prompts the Owner to upgrade their subscription plan.
*   **Post-condition:** A new user record is created, and the employee is granted access to the assigned branch.
*   **Business Rules:** Employee role permissions are restricted to the assigned branch.

---

### 4.5 UC-008: Create POS Order
*   **Use Case ID:** UC-008
*   **Use Case Name:** Create POS Order
*   **Primary Actor:** Cashier
*   **Secondary Actor:** Kitchen Staff (via KDS)
*   **Description:** A cashier processes a customer's cart, calculates taxes, updates inventory, and registers the transaction.
*   **Pre-condition:** Cashier is logged in, and an active register shift is open.
*   **Trigger:** Cashier adds products to the cart.
*   **Main Success Flow:**
    1. Cashier adds menu items and modifiers (e.g., espresso shots) to the cart.
    2. System calculates subtotals, applies tax rules, and displays the total.
    3. Cashier selects the payment method (e.g., Credit Card) and submits the transaction.
    4. System routes the payment request to the Payment Gateway.
    5. Payment Gateway approves the transaction.
    6. System deducts the purchased items from inventory, records the sale in the ledger, and routes the ticket to the kitchen display screen (KDS).
*   **Alternative Flow (Cash Payment):** At Step 3, if the payment method is Cash, the cashier enters the cash received. The system calculates change, opens the cash drawer, and skips the card payment step.
*   **Exception Flow (Item Out of Stock):** System displays a warning indicator for out-of-stock items and blocks checkout until the items are removed or a manager authorizes the transaction override.
*   **Post-condition:** The sale is recorded in the ledger, inventory levels are updated, and the register shift balances are adjusted.
*   **Business Rules:** A transaction cannot be completed without verified payment.

---

### 4.6 UC-012: Audit Stock Count
*   **Use Case ID:** UC-012
*   **Use Case Name:** Audit Stock Count
*   **Primary Actor:** Inventory Staff
*   **Secondary Actor:** Business Manager (Approval)
*   **Description:** Inventory staff count physical stock and log adjustments in the system.
*   **Pre-condition:** User is logged in and authorized.
*   **Trigger:** User submits a stock adjustment count.
*   **Main Success Flow:**
    1. User selects the branch and database item list.
    2. User inputs the physical stock counts.
    3. System calculates the variance between recorded stock and physical counts.
    4. User submits the adjustment request.
    5. Manager approves the adjustment request.
    6. System updates stock levels and logs the changes in the audit trail.
*   **Exception Flow (Variance Limit Exceeded):** If the variance exceeds 10% of total stock, the system flags the adjustment for priority review and blocks the change until a manager enters their authorization PIN.
*   **Post-condition:** Database stock levels are synchronized with physical counts, and the adjustment is logged in the audit trail.
*   **Business Rules:** All manual stock adjustments must log the user ID and timestamps.

---

## 5. Use Case Relationship Analysis

UML use case relationships manage dependencies and optimize workflows:

*   **Mandatory Behavior (`<<include>>`):** 
    *   `Process Checkout Payment` and `Create POS Order` both include the `Login` authentication check. This ensures users are verified before accessing data.
    *   `Process POS Checkout` includes `Deduct Inventory` to ensure stock levels remain synchronized with sales.
*   **Optional Behavior (`<<extend>>`):** 
    *   `Apply Discount Override` extends `Create POS Order`. It is only executed when a cashier applies a discount that exceeds preset limits, requiring a manager's override PIN.
    *   `Generate Z-Report` extends `Logout`, triggering cash reconciliation workflows only at the end of the shift.
*   **Actor Generalization (Inheritance):** 
    *   The abstract actor `StaffUser` defines baseline permissions (e.g., POS checkout). The `Business Manager` actor inherits those base permissions while adding management capabilities (e.g., stock adjustments, shift approvals).

---

## 6. Use Case Priority Analysis

We classify use cases to plan development phases:

*   **Must Have (Core Platform MVP):**
    *   `UC-001: Register Account`, `UC-002: Authenticate User`, `UC-004: Select Subscription Plan`, `UC-006: Invite Employee`, `UC-008: Create POS Order`, `UC-009: Process Checkout Payment`, `UC-010: Deduct Inventory`, and `UC-011: Generate Z-Report`.
*   **Should Have (Supporting Workflows):**
    *   `UC-007: Manage Product Catalog`, `UC-012: Audit Stock Count`, `UC-013: Export Sales Reports`, and `UC-014: Trigger Alert Notifications`.
*   **Could Have (Additional Features):**
    *   `UC-015: Apply Discount Override` and in-app support chat portals.
*   **Future (Ecosystem Scale):**
    *   AI-driven demand forecasting, third-party delivery service integrations, and app marketplace registries.

---

## 7. Use Case Traceability Matrix

This matrix maps Use Case IDs to requirement definitions:

| Use Case ID | Use Case Name | Primary Actor | Requirement ID | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **UC-001** | Register Account | Business Owner | FR-AUTH-001 | Must Have |
| **UC-002** | Authenticate User | User (General) | FR-AUTH-002 | Must Have |
| **UC-004** | Select Subscription Plan | Business Owner | FR-SUB-002 | Must Have |
| **UC-006** | Invite Employee | Owner / Manager | FR-USR-001 | Must Have |
| **UC-008** | Create POS Order | Cashier | FR-POS-ORD-001 | Must Have |
| **UC-009** | Process Checkout Payment | Cashier | FR-POS-PAY-002 | Must Have |
| **UC-010** | Deduct Inventory | System | FR-POS-INV-001 | Must Have |
| **UC-012** | Audit Stock Count | Inventory Staff | FR-POS-INV-002 | Must Have |
| **UC-013** | Export Sales Reports | Owner / Manager | FR-REP-003 | Must Have |

---

## 8. Conclusion

This Use Case Analysis and Specification Document defines the interactions between users, external systems, and the platform. By mapping actors, use cases, and relationship rules, we establish the functional requirements for development.

With this specification complete, the **System Analysis Phase** is finished. The product and engineering teams can now proceed to the **System Design Phase**, where these use cases and specifications will serve as the reference for database schemas, technical API routes, and user interface designs.
