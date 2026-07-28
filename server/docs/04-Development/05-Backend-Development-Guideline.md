# DEVELOPMENT SPECIFICATION
## PART 4 — BACKEND DEVELOPMENT GUIDELINES

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal Backend Engineer & Backend Architect  
**Status:** Approved  

---

## 1. Backend Development Philosophy

### 1.1 Core Objectives & Principles
The backend engine serves as the transactional and security foundation of the SaaS platform.
*   **Security-First Execution:** Enforce multi-tenant Row-Level Security (RLS) and validate all input payloads before processing.
*   **High Performance:** Ensure POS checkout paths execute with response times $\le 50\text{ ms}$.
*   **Architectural Maintainability:** Build with modularity, decoupling domains (IAM, Inventory, POS checkout) to prevent service coupling.

---

## 2. Backend Architecture Implementation

To isolate concerns, dependencies must strictly flow in a single downward direction:

```
[ API LAYER ] (Gin routing endpoints)
      │
      ▼
[ APPLICATION LAYER ] (User authentication, session verification)
      │
      ▼
[ DOMAIN LAYER ] (Core business logic, calculations, aggregates)
      │
      ▼
[ INFRASTRUCTURE LAYER ] (Database connectors, pgBouncer connection pools)
      │
      ▼
[ DATABASE LAYER ] (PostgreSQL physical engine with RLS)
```

### 2.1 Layer Rules
*   **API Layer:** Allowed to depend on the Application Layer. Cannot execute database queries directly.
*   **Domain Layer:** Decoupled. Cannot depend on third-party frameworks, API controllers, or database schemas.
*   **Infrastructure Layer:** Implements repository interfaces. Forbidden from containing domain calculations or business rules.

---

## 3. Backend Project Structure

The Go monolithic backend (`services/api-backend/`) uses this structure:
*   `cmd/server/`: The entry point where the HTTP server starts.
*   `internal/`: Contains core packages:
    *   `controller/`: Maps URL parameters and parses JSON requests into DTO structures.
    *   `service/`: Coordinates transaction flows and calls repositories.
    *   `repository/`: Contains raw SQL queries and maps entities to DB structs.
    *   `middleware/`: Enforces JWT parsing and RLS variable injection.

---

## 4. Module Development Standard

Every backend module (e.g., Inventory) must include:
1.  **Repository Interface:** Decouples services from DB configurations.
2.  **DTO Definitions:** Validates incoming payloads (e.g., `CreateItemRequest`).
3.  **Entity Models:** Defines structural database rows.
4.  **Unit Tests:** Verifies service calculations and validation rules.

---

## 5. API Development Standard

*   **REST Endpoint Design:** Use plural nouns for resources (e.g., `/api/v1/pos/orders`).
*   **HTTP Status Codes:**
    *   `200 OK`: Successful resource retrievals or updates.
    *   `201 Created`: Successful resource creation.
    *   `400 Bad Request`: Payload validation failures.
    *   `401 Unauthorized`: Authentication errors.
    *   `403 Forbidden`: Authorization errors (tenant or role mismatches).
    *   `500 Internal Server Error`: Server exceptions.

---

## 6. Business Logic Separation

To maintain clean codebases, developers must follow these assignment rules:

*   **Controllers:**
    *   *Should do:* Bind request JSONs, check path variables, and format responses.
    *   *Should NOT do:* Access databases, execute tax calculations, or update stock records.
*   **Services:**
    *   *Should do:* Manage database transactions and coordinate service actions.
    *   *Should NOT do:* Read HTTP headers or write JSON payloads directly.
*   **Repositories:**
    *   *Should do:* Execute SQL queries and map database rows.
    *   *Should NOT do:* Validate user roles or perform tax calculations.

---

## 7. Database Integration Standard

*   **Repository Pattern:** Access databases via repository structs implementing domain interfaces, allowing developers to switch DB libraries without modifying business logic.
*   **Transaction Management:** POS checkouts (deducting stock, logging ledger transactions, and generating invoices) must run inside explicit PostgreSQL transactions with a `Serializable` isolation level.

---

## 8. Authentication & Authorization Implementation

*   **Auth Flow:** Clients pass user credentials to `/auth/login`, which returns an asymmetric RS256-signed JWT token (15-min life) and a secure HTTP cookie (7-day life) containing a refresh token.
*   **RBAC Middleware:** Backend handlers check JWT scopes before executing controller actions.

---

## 9. Validation & Error Handling

*   **Input Validation:** Enforce validator tags on all DTO inputs (e.g., `binding:"required,email"`).
*   **Error payload standard:** Return structured JSON error envelopes:
    *   `{ "code": "INVALID_PARAMETERS", "message": "The product code is required." }`

---

## 10. Backend Security Standards

*   **SQL Injection Prevention:** Parameterize all database query arguments.
*   **Tenant Isolation Validation:** Ensure that every database session sets the tenant context variable at connection checkout before executing query scripts.

---

## 11. Logging & Monitoring Standards

*   **Application Logs:** Log route executions, server boot stages, and background jobs.
*   **Audit logs:** Save all security actions (e.g., login updates, role changes, cash shift overrides) to write-only database schemas.
*   **Metrics:** Monitor endpoint response latencies, active database connection pools, and container CPU usage.

---

## 12. Testing Strategy

*   **Unit Tests:** Write tests for service logic, verification checks, and helper methods.
*   **API Integration Tests:** Execute endpoint check runs on test databases, verifying that HTTP responses match.
*   **Security Validation:** Run automated scans to ensure RLS database rules are active on all tables.

---

## 13. Performance Guidelines

*   **Composite Indexing:** Ensure B-Tree indexes are created for fields frequently used in lookup queries.
*   **Connection Pools:** Use PgBouncer to manage database connection reuse, keeping database CPU overhead low.

---

## 14. Conclusion

This Backend Development Guideline Document defines the layered architecture, folder structure, database patterns, and security standards for backend development. Enforcing these rules ensures the backend remains fast, secure, and maintainable.

Developers can now configure their frameworks and begin coding.
