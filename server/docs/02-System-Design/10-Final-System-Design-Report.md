# SYSTEM DESIGN SPECIFICATION
## PART 10 — FINAL SYSTEM DESIGN REPORT

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal Software Architect, Enterprise Architect & Technical Documentation Lead  
**Status:** Approved / Ready for Implementation  

---

## 1. Executive Summary

### 1.1 System Overview & Objectives
The Enterprise SaaS Business Management Platform is a cloud-based operating system designed to centralize business management for small, medium, and micro enterprises (SMMEs). The system begins with a highly optimized Coffee POS module designed for touchscreen layouts, localized compliance (Khmer fonts, official GDT invoices), and offline execution.

### 1.2 Architectural Vision & Core Decisions
*   **Modular Monolith Style:** Chosen to minimize cloud infrastructure costs while enforcing strict domain boundaries.
*   **PostgreSQL with Row-Level Security (RLS):** Implements a hybrid multi-tenant database approach to guarantee data isolation without the overhead of maintaining thousands of schemas.
*   **Offline-First POS Client:** Uses browser-based IndexedDB storage to cache sales logs and product catalogs, ensuring sales continue during internet drops.

---

## 2. System Architecture Summary

The system is organized into a clean multi-tier architecture to separate responsibilities:

```
[ CLIENT LAYER ] (Web Admin Dashboard / Tablet POS Checkout Grid)
       │
       ▼ (HTTPS REST / JSON / WebSocket)
[ APPLICATION LAYER ] (API Gateway, Rate Limiting, TLS Termination, Route 53)
       │
       ▼
[ BUSINESS LAYER ] (Modular Monolith: IAM, Billing, Inventory, POS Checkout modules)
       │
       ▼ (PostgreSQL RLS / Redis Cache pools)
[ DATA LAYER ] (PostgreSQL Cluster + Redis Sessions)
       │
       ▼
[ EXTERNAL SERVICES ] (Stripe Billing, Twilio SMS Gateway, Bakong KHQR QR-Code API)
```

---

## 3. Software Architecture Summary

### 3.1 Modular Decomposition
The codebase is structured into isolated domain packages:
*   `com.platform.iam`: Manages authentication, login verification, and role-based permissions.
*   `com.platform.pos`: Handles cart checkouts, register shifts, and Z-report ledger logs.
*   `com.platform.inventory`: Controls catalog lists, recipe configurations, and low-stock alerts.

### 3.2 Backend Pattern & Design Patterns
*   **Layered Service Pattern:** Each module enforces a `Controller -> Service -> Domain -> Repository` flow.
*   **Key Design Patterns:**
    *   *Repository Pattern:* Decouples domain logic from database engines.
    *   *Strategy Pattern:* Selects payment gateway implementations (Stripe, Bakong) dynamically at runtime.
    *   *Dependency Injection (DI):* Injects dependencies to simplify unit testing.

---

## 4. Database Architecture Summary

### 4.1 Hybrid Multi-Tenancy Strategy
*   **Shared PostgreSQL Schema (Starter / Growth plans):** Enforces tenant separation using Row-Level Security (RLS) policies, appending `WHERE tenant_id = current_setting('app.current_tenant_id')` to all queries.
*   **Isolated PostgreSQL Engines (Enterprise plans):** Run on dedicated database instances for complete isolation.

### 4.2 Data Normalization & Caching
*   **3NF Normalization:** Used across core tables (User, Tenant, Branch, Product) to prevent data anomalies.
*   **Selective Denormalization:** Cart price histories are saved directly in `order_items` records to ensure finalized invoices are immutable.
*   **Caching Layer:** Redis cache stores active user sessions, configuration setups, and API rate counters.

---

## 5. API Architecture Summary

### 5.1 REST Endpoint Design
The platform exposes public REST interfaces under URI version control (`/api/v1/`):
*   `POST /api/v1/auth/login`: Authenticates credentials, returns JWT tokens and set refresh cookies.
*   `POST /api/v1/pos/orders`: Submits cart orders, runs payments, and deducts inventory.
*   `GET /api/v1/inventory/items`: Monitors catalog lists and stock levels.

### 5.2 Token Security
Enforces stateless session handling using RS256-signed Access Tokens (15-min life) and rotated Refresh Tokens stored in secure HTTP-only cookies.

---

## 6. UI/UX Architecture Summary

### 6.1 Touchscreen POS & Responsive Web Admin
*   **Tablet POS Layout:** Landscape grid layout optimized for touchscreen targets ($\ge 48\times48\text{ dp}$), keeping checkout workflows under 3 taps.
*   **Responsive Web Admin:** Desktop-first dashboard for owners to manage catalogs, branches, and shift reports from any device.
*   **Localization:** Khmer font rendering using **Koh Santepheap** paired with **Inter** for numeric clarity.

---

## 7. UML Design Summary

### 7.1 Static Class Structures & Dynamic Runtime Interactions
*   **Class Diagram:** Employs composition relationships (e.g., `Order` owns `OrderItem`) and interface realizations (`CheckoutServiceImpl` implements `ICheckoutService`) to maintain loose coupling.
*   **Sequence Diagram:** Details checkout flows. It maps out transaction boundaries, ensures payment gateway validations complete before inventory updates, and triggers transactions rollback on any failure.

---

## 8. Deployment Architecture Summary

### 8.1 AWS Cloud Infrastructure & CI/CD Pipeline
*   **VPC Subnet Separation:** Routes database, cache, and internal container clusters inside private subnets, exposing only the ALB load balancer publicly.
*   **Containerized ECS Fargate:** Serverless container cluster running auto-scaled app instances.
*   **CI/CD Pipeline:** Uses GitHub Actions to run linters, execute unit tests, build Docker images, run migrations, and deploy containers using blue-green strategies.

---

## 9. Cross-Cutting Concerns

*   **Security:** Argon2id password hashing, RLS tenant isolation, AES-256 data encryption, and TLS 1.3 transit security.
*   **Performance:** Composite B-Tree indexes, Redis query cache, and Read Replica query routing.
*   **Reliability:** Continuous CloudWatch health checks, WAL point-in-time recovery logs, daily S3 backups, and multi-AZ failovers (RPO $\le 1\text{ hour}$, RTO $\le 4\text{ hours}$).

---

## 10. Architecture Decision Records (ADR)

### ADR-001: Architecture Style Selection
*   **Decision:** Decoupled Modular Monolith.
*   **Context:** Dev team size is 5; initial hosting costs must be low.
*   **Selected Solution:** Separate domains inside a single deployable artifact.
*   **Trade-offs:** If a single module encounters memory leaks, it can affect other services in the monolith.

### ADR-002: Multi-Tenant Database Strategy
*   **Decision:** PostgreSQL Row-Level Security (RLS) for shared schemas.
*   **Context:** High database initialization costs for thousands of low-tier tenants.
*   **Selected Solution:** Enforce `tenant_id` scopes at the SQL engine layer.
*   **Trade-offs:** Adds query routing overhead; index maintenance must be managed carefully.

---

## 11. System Design Traceability Matrix

| Functional Requirement | Use Case | Design Component | Implementation Area |
| :--- | :--- | :--- | :--- |
| **FR-AUTH-001** (Login) | UC-002: Login | `LoginServiceImpl` | `com.platform.iam` |
| **FR-POS-ORD-001** (Checkout) | UC-008: Create Order | `POSOrderController` | `com.platform.pos` |
| **FR-INV-DED-001** (Stock) | UC-010: Deduct Stock | `InventoryServiceImpl`| `com.platform.inventory` |
| **FR-DB-ISO-001** (Isolation) | Multi-Tenancy | Postgres RLS Policies | `db/migrations/` |

---

## 12. Implementation Readiness Checklist

*   `[x]` High-Level System Architecture blueprinted.
*   `[x]` Multi-Tenant Database schemas and isolation layers designed.
*   `[x]` REST HTTP API endpoint request/response payloads specified.
*   `[x]` Touchscreen POS grid layouts and responsive web admin navigation defined.
*   `[x]` Domain aggregates and decoupled class interface boundaries modeled.
*   `[x]` Dynamic sequence runtimes and transaction rollback boundaries defined.
*   `[x]` AWS deployment networks, Docker configurations, and backup policies planned.
*   `[x]` Password hashing and write-only audit logging security designed.

---

## 13. Final Architecture Review

### Strengths
*   **Low hosting overhead:** Runs efficiently on basic AWS container clusters.
*   **Robust security:** RLS policies prevent tenant data leaks at the database layer.
*   **Reliable transactions:** ACID transactions ensure invoice records and stock levels match.

### Limitations
*   **Monolithic deployment:** Deployment changes require building the entire monolithic image.
*   **Vertical database limits:** Extremely large reporting queries can impact checkout database performance.

---

## 14. Conclusion

This Final System Design Report consolidates the technical design, database models, and deployment strategies for the platform. With all system architectures, schemas, API endpoints, and infrastructure components defined and reviewed, the system design is complete. The project is ready for the **Implementation Phase**.
