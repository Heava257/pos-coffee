# DEVELOPMENT SPECIFICATION
## PART 2 — CODING STANDARDS & SOFTWARE ENGINEERING GUIDELINES

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal Software Engineer, Code Quality Lead & Engineering Architect  
**Status:** Approved  

---

## 1. Coding Standard Overview

### 1.1 Purpose & Quality Objectives
The coding standards establish uniform code quality criteria to ensure the codebase remains readable, secure, and maintainable. In long-term SaaS projects, coding guidelines prevent technical debt and allow engineering teams to onboard new developers without friction.

### 1.2 Core Development Consistency Principles
*   **Uniform Formatting:** Enforce standard formatting rules (e.g., standard gofmt, Prettier/ESLint configs).
*   **Expressive Naming:** Variables and functions must describe their behavior clearly.
*   **Strict Security Baselines:** Block manual query concatenation, compile secure input validations, and enforce RLS-scoped database operations.

---

## 2. General Programming Principles

*   **Clean Code:**
    *   *Purpose:* Write self-documenting code. Methods must be short (under 50 lines) and focus on one task.
    *   *Example:* Write `IsOrderAuthorized(user)` instead of complex logical comparisons inline.
*   **SOLID Principles:**
    *   *Purpose:* Guide class and interface structures for modular systems.
    *   *Example (SRP):* Separate invoice printing utilities from database order write actions.
*   **DRY (Don't Repeat Yourself):**
    *   *Purpose:* Eliminate duplicate logic patterns by utilizing helper functions.
*   **KISS (Keep It Simple, Stupid):**
    *   *Purpose:* Use simple code patterns. Avoid complex, over-engineered class abstractions when standard flows work.
*   **YAGNI (You Aren't Gonna Need It):**
    *   *Purpose:* Do not write code for future requirements. Focus strictly on sprint user stories.

---

## 3. Naming Convention Standards

| Component | Standard Naming Convention | Examples |
| :--- | :--- | :--- |
| **Variables** | camelCase | `userProfile`, `cartTotal` |
| **Functions** | camelCase | `createUser()`, `calculateTax()` |
| **Classes / Types**| PascalCase | `UserService`, `CheckoutController` |
| **Interfaces** | PascalCase (prefixed with `I` in TS, descriptive in Go) | `IAuthService` / `OrderRepository` |
| **Constants** | UPPERCASE_WITH_UNDERSCORES | `TOKEN_EXPIRY_MINS`, `MAX_LOGIN_ATTEMPTS` |
| **Database Tables**| snake_case (plural) | `tenants`, `order_items` |
| **API Endpoints** | lowercase-with-hyphens (plural resource name) | `/api/v1/pos/orders` |

---

## 4. Code Structure Standards

Backend systems must enforce a **strict dependency direction** from controllers to database repositories:

```
[ CONTROLLER LAYER ] (Gin handlers, maps HTTP to requests/responses)
        │
        ▼
[ SERVICE LAYER ] (Coordinates business logic and transactions)
        │
        ▼
[ REPOSITORY LAYER ] (Database query interface, abstracts SQL engines)
        │
        ▼
[ DATABASE SCHEMAS ] (PostgreSQL physical engine with RLS)
```

---

## 5. Backend Coding Standards

*   **Controller Design:** Limit controller methods to input parsing, parameter validation, and JSON response generation.
*   **Service Design:** House all business validations, calculations, and domain operations inside services. Service methods should run within database transactions.
*   **Error Handling:** Never swallow errors. Propagate errors up to the controller to write standard API error payloads.
*   **Logging:** Inject transaction correlation IDs into logging contexts, allowing team members to trace request paths.

---

## 6. Frontend / Mobile Coding Standards

*   **Component Structure:** Build modular components using React hooks to separate visual styling from business state.
*   **State Management (Zustand):** State slices must have explicit action methods. Components must not update state properties directly.
*   **API Communication:** Encapsulate API calls inside services and execute queries using React hooks.
*   **UI Reuse:** Place buttons, icons, and input cards inside a shared UI library (`/src/components/ui/`).

---

## 7. Database Coding Standards

*   **Identifiers:** Primary keys must use the `UUID` format.
*   **Query Safety:** All SQL statements must use parameterized arguments. Direct string concats are blocked.
*   **Index Rules:** Create composite indexes for columns frequently used in search queries, verifying they utilize `tenant_id`.

---

## 8. API Development Standards

*   **HTTP Methods:**
    *   `GET`: Retrieve resources. Safe and idempotent.
    *   `POST`: Create new resources.
    *   `PUT`: Update existing resources.
    *   `DELETE`: Remove resources.
*   **Error payload standard:** APIs must return uniform JSON structures for errors:
    *   `{ "code": "VALIDATION_FAILED", "message": "Invalid email address." }`

---

## 9. Security Coding Standards

*   **Input Sanitization:** Run DTO schemas validation against strict rules (e.g., regex checks on email inputs) before executing business logic.
*   **Audit Trail:** Log all critical transactions (e.g., refunds, configuration adjustments, user additions) to write-only database tables.
*   **Secret Protection:** Block hardcoded API keys and credentials in source repositories.

---

## 10. Error Handling & Exception Management

*   **Backend Go Flow:** Return errors explicitly. Do not use panics for standard operational errors (e.g., database connection timeouts, validation errors).
*   **Frontend Client Flow:** Implement React Error Boundaries around feature modules to prevent app crashes.

---

## 11. Logging Standards

*   **Debug:** Information for local developer troubleshooting.
*   **Info:** Standard system logs (e.g., server startup, transaction completions).
*   **Warning:** Non-blocking anomalies (e.g., payment API retries).
*   **Error:** Blocking exceptions (e.g., database timeouts).
*   **Critical:** System-wide failures (e.g., connection pools exhausted).
*   *Do NOT log* PII details (e.g., customer names, passwords, credit card values).

---

## 12. Testing Standards

*   **Unit Tests:** Required for all service calculation helper methods. Coverage target: $\ge 80\%$.
*   **Integration Tests:** Enforce transaction isolation checks on order checkouts.
*   **Quality Gates:** Commit hook tests must pass cleanly before code reviews can begin.

---

## 13. Quality Gate Rules

The CI pipeline blocks pull request merges unless the following gates pass:
*   `[x]` Build compiles clean without compiler warnings.
*   `[x]` 100% of unit and integration test suites pass.
*   `[x]` Minimum code review checklist approvals (2 reviews) signed off.
*   `[x]` Static security code scans verify no hardcoded secrets exist.

---

## 14. Conclusion

This Coding Standards and Software Engineering Guidelines Document establishes formatting, security, naming, and quality gates for the platform. By enforcing these rules, we ensure the codebase remains clean, secure, and maintainable.

Developers can now configure their IDE linter rules and begin writing code.
