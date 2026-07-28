# SYSTEM DESIGN SPECIFICATION
## PART 2 — DETAILED SOFTWARE DESIGN

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal Software Architect, Backend Architect & Enterprise Software Design Engineer  
**Status:** Under Review  

---

## 1. Software Design Overview

### 1.1 Design Objectives & Principles
The objective of this detailed design is to structure the platform into decoupled components that can be independently built, tested, and scaled. 
*   **Separation of Concerns:** Keep presentation, application logic, and data storage layers decoupled.
*   **Domain-Driven Design (DDD):** Use domain entities to organize business logic and maintain transactional boundaries.
*   **Dependency Inversion:** Depend on interfaces rather than concrete implementations, ensuring modules remain loosely coupled.

### 1.2 Modular Monolith Organization Strategy
The codebase is organized as a **Modular Monolith**. Each domain (e.g., IAM, Billing, POS Checkout, Inventory) is isolated into a separate package containing its own controllers, services, repositories, and domain models. Communication between modules is restricted to defined interfaces, preventing direct queries across package database contexts. This structure supports:
*   **Scalability:** Hot modules (e.g., POS Checkout) can be easily extracted into independent microservices if traffic demands increase.
*   **Security:** Tenant connection routing and permission controls are checked at the module boundary.
*   **Maintainability:** Changes to one module can be deployed without impacting the stability of other services.

---

## 2. System Module Decomposition

### MOD-01: Identity & Access Management (IAM)
*   **Purpose:** Manages user authentication, credentials, sessions, and roles.
*   **Responsibilities:** Authenticates logins, issues JWT tokens, validates PINs, and checks permissions.
*   **Main Features:** User Sign-up, JWT Issuance, PIN Login, and RBAC Permission Checks.
*   **Related Use Cases:** UC-001 (Register Account), UC-002 (Authenticate User), and UC-006 (Invite Employee).
*   **Related Business Rules:** BR-USR-001 (Email Verification) and BR-USR-002 (Session Lockout).
*   **Dependencies:** None.

### MOD-04: Coffee POS Checkout Module
*   **Purpose:** Processes in-store customer checkouts and handles register shifts.
*   **Responsibilities:** Calculates cart totals, applies local tax rates, and coordinates payments.
*   **Main Features:** Cart calculations, payment processing, shift Z-reports, and kitchen order routing.
*   **Related Use Cases:** UC-008 (Create POS Order) and UC-009 (Process Payment).
*   **Related Business Rules:** BR-TXN-001 (Ledger Immutability) and BR-FIN-001 (Local Tax Calculation).
*   **Dependencies:** MOD-01 (IAM), Tenant Settings, and Inventory Manager.

---

## 3. Component Architecture Design

### 3.1 Module: Identity & Access Management (IAM)
*   **Login Service:**
    *   *Responsibility:* Validates user emails and passwords against secure hashes (Argon2id).
    *   *Input:* Email, password.
    *   *Output:* User profile record or authentication error.
    *   *Dependencies:* Database connection.
*   **Token Service:**
    *   *Responsibility:* Generates and signs secure JWT session tokens containing user roles and tenant IDs.
    *   *Input:* User ID, role, tenant ID.
    *   *Output:* Signed JWT token string.
    *   *Dependencies:* Private key configuration.
*   **Permission Service:**
    *   *Responsibility:* Verifies that the user's role has the permissions required to access an API endpoint.
    *   *Input:* JWT token, required permission code.
    *   *Output:* Authorization result (Boolean).
    *   *Dependencies:* IAM Database.

### 3.2 Module: Coffee POS Checkout
*   **Checkout Service:**
    *   *Responsibility:* Coordinates the checkout workflow (validates cart, calls payment gateway, updates ledger).
    *   *Input:* Cart items, payment token, cashier identifier, and branch context.
    *   *Output:* Transaction status and invoice number.
    *   *Dependencies:* Payment Router, Sales Ledger, and Inventory Manager.
*   **Tax Calculator:**
    *   *Responsibility:* Applies localized sales tax rates to cart items.
    *   *Input:* Product subtotal, branch ID.
    *   *Output:* Tax amount.
    *   *Dependencies:* Tenant Settings.

---

## 4. Backend Architecture Design

The backend uses a layered architecture to separate presentation, business logic, and database access:

```
[ CLIENT REQUEST ] ──( JSON Payload )──> [ CONTROLLER LAYER ] (Validates inputs & parses DTOs)
                                              │
                                              ▼
[ SECURITY MIDDLEWARE ] <──( Verify JWT ) ── [ SERVICE LAYER ] (Coordinates business logic workflows)
                                              │
                                              ▼
[ REPOSITORY LAYER ] <───( Parameterized )─── [ DOMAIN LAYER ] (Enforces business validation rules)
                                              │
                                              ▼
[ DATABASE SYSTEM ] ───( Return records )──> [ REPOSITORY LAYER ] (Fetches and writes SQL tables)
```

*   **Controller Layer:** Entry point for API requests. Parses JSON payloads, validates parameters, and maps inputs to DTOs.
*   **Service Layer:** Coordinates business workflows (e.g., calling the payment router and updating stock levels).
*   **Domain Layer:** Enforces business logic and validation rules (e.g., verifying product prices and ingredients).
*   **Repository Layer:** Manages database query executions, ensuring all actions are parameterised.

---

## 5. Domain Design Analysis

### Aggregate 5.1: Sales Transaction (`Order`)
*   **Root Entity:** `Order` (Tracks invoice number, total values, cashier, and branch).
*   **Entities:** `OrderItem` (Tracks cart line items, quantity details, and variants).
*   **Value Objects:** `Money` (Currency and amount), `TaxRate` (Percentage and tax code).
*   **Domain Services:** `CheckoutProcessor` (Validates cart totals and coordinates deductions).
*   **Domain Events:** `OrderCompletedEvent` (Fires when payment is approved, triggering inventory updates).

### Entity 5.2: Product
*   **Purpose:** Represents a menu item or retail product in the catalog.
*   **Business Rules:** Selling prices and unit costs must be positive values. Barcodes must be unique within the tenant's workspace.
*   **Relationships:** Many-to-One relationship with the product `Category` entity.

---

## 6. Frontend / Mobile Application Architecture

The client application uses a decoupled frontend architecture:

```
[ USER INTERFACE LAYER ] (Screen views, Touchscreen POS checkout grids)
           │
           ▼
[ STATE MANAGEMENT ] (Active user session, Cart state, Inventory cache)
           │
           ▼
[ SERVICE LAYER ] (Handles local IndexedDB storage and offline operations)
           │
           ▼
[ API COMMUNICATION LAYER ] (Executes HTTP calls and syncs cached transactions)
```

*   **State Management:** Stores active user session tokens, cart states, and cached product menus.
*   **Service Layer:** Coordinates local IndexedDB operations, allowing cashiers to checkout orders offline during network outages.
*   **API Layer:** Handles HTTPS communication with the backend API gateway, and syncs cached transaction logs when connections restore.

---

## 7. Database Access Design

*   **Repository Pattern:** Expose domain repositories (e.g., `OrderRepository`, `ProductRepository`) to decouple database queries from business logic.
*   **Data Isolation (Row-Level Security):** PostgreSQL connection pools must enforce Row-Level Security (RLS), appending `tenant_id` filters to all query executions.
*   **Transaction Management:** Enforce database transactions during checkouts. If database updates or inventory deductions fail, rollback the transaction to prevent data discrepancies.
*   **Query Optimization:** Create indexes on foreign keys (`tenant_id`, `branch_id`) and search parameters (`barcode`, `order_number`) to maintain query response times $\le 50\text{ ms}$.

---

## 8. External Service Integration Design

### 8.1 Integration: Payment Gateway (Stripe)
*   **Purpose:** Processes credit card subscription fees and customer checkouts.
*   **Communication Protocol:** HTTPS REST API.
*   **Data Exchange:** Tokenized payment IDs, invoice totals, and currencies.
*   **Authentication Method:** Secure API key authentication.
*   **Failure Handling:** If the gateway timeout expires, return a "Gateway Timeout" error, log the transaction as Pending, and flag the event for retry.

### 8.2 Integration: SMS Provider (Twilio)
*   **Purpose:** Sends cashier login verification PINs and digital receipt links.
*   **Communication Protocol:** HTTPS REST API.
*   **Data Exchange:** Phone numbers, SMS body templates.
*   **Authentication Method:** Basic Authentication (Account SID and Auth Token).
*   **Failure Handling:** If Twilio is unreachable, queue messages in an internal database table and retry delivery at scheduled intervals.

---

## 9. Error Handling Design

*   **Global Error Middleware:** Implement middleware at the API layer to catch unhandled errors and return sanitized JSON responses (e.g., `{"error": "Internal Server Error", "code": 500}`).
*   **Exceptions Mapping:** Map internal errors to standard HTTP status codes:
    *   Validation errors $\rightarrow$ `400 Bad Request`
    *   Authentication failures $\rightarrow$ `401 Unauthorized`
    *   Insufficient permissions $\rightarrow$ `403 Forbidden`
    *   Entity not found $\rightarrow$ `404 Not Found`
*   **Structured Logging:** Format application logs as structured JSON outputs containing severity levels, timestamps, request IDs, tenant context, and error details.

---

## 10. Configuration Management Design

*   **Environment Configuration:** Store environment parameters (e.g., database connection pools, server ports) in standard environment files (`.env`).
*   **Secret Management:** Store sensitive credentials (e.g., database passwords, Stripe keys) in secure key management vaults, rather than plaintext configuration files.
*   **Feature Flags:** Use feature flags in the database to toggle modules (e.g., enabling advanced inventory features) for specific subscription tiers.

---

## 11. Design Patterns Selection

*   **Repository Pattern:**
    *   *Purpose:* Decouples business logic from database query execution details.
    *   *Where Used:* Data access operations across all core services.
    *   *Benefit:* Simplifies unit testing by allowing developers to mock database access.
*   **Dependency Injection (DI):**
    *   *Purpose:* Injects required dependencies (services, repositories) into controllers.
    *   *Where Used:* Backend controller initialization.
    *   *Benefit:* Loosely couples modules and supports unit testing.
*   **Strategy Pattern:**
    *   *Purpose:* Selects payment processing strategies based on checkout choices.
    *   *Where Used:* Payment router modules.
    *   *Benefit:* Supports adding new payment methods without modifying the POS checkout engine.

---

## 12. Detailed Component Interaction

This diagram maps component communications during checkout operations:

```
[ POS Client ] ────( Submits Order & Payment token )────> [ API Gateway ]
                                                               │
                                                               ▼
[ Identity Service ] <──( Validate JWT session ) ─── [ POS Controller ]
                                                               │
                                                               ▼
[ Payment Router ] <──( Process payment request ) ─── [ POS Service ]
                                                               │
                                                               ▼
[ Inventory Service ] <──( Deduct recipe stock ) ──── [ POS Service ]
                                                               │
                                                               ▼
[ Sales Ledger ] ────( Log finalized invoice ) ────> [ Database Server ]
```

---

## 13. Design Traceability Matrix

This matrix traces requirements from functional specifications to software implementations:

| Requirement ID | Use Case ID | Module ID | Component Name | Implementation Area |
| :--- | :--- | :--- | :--- | :--- |
| **FR-AUTH-001** | UC-002: Login | MOD-01 (IAM) | Login Service | `services/iam/auth.go` |
| **FR-TEN-001** | UC-005: Setup Branch | Tenant Settings | Branch Controller | `controllers/tenant/branch.go` |
| **FR-POS-ORD-001**| UC-008: Create Order | MOD-04 (POS) | Checkout Service | `services/pos/checkout.go` |
| **FR-POS-INV-001**| UC-010: Deduct Stock | Inventory Manager | Stock Deductor | `services/inventory/stock.go` |
| **FR-AUD-001** | All Use Cases | Audit Logger | Audit Service | `middleware/audit.go` |

---

## 14. Conclusion

This Detailed Software Design Document establishes the database, API, and component structures required for implementation. By using a **Modular Monolith** architecture, a **Layered Service Pattern**, and **Domain-Driven Design**, we ensure the platform is secure, maintainable, and ready to build.

With these technical specifications finalized, the system design is complete. Developers can now proceed to the **Implementation Phase**, where these designs will guide database schema builds, API routing setups, and unit testing scripts.
