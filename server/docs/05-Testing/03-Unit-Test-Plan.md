# TESTING SPECIFICATION
## PART 3 — UNIT TESTING STRATEGY & IMPLEMENTATION STANDARDS

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Software Test Architect & Engineering Quality Lead  
**Status:** Approved  

---

## 1. Unit Testing Overview

### 1.1 Purpose & Quality Philosophy
Unit testing validates the smallest testable parts of the codebase (functions, services, hooks) in isolation.
*   **Developer Responsibility:** Developers own the quality of their code. A feature task is incomplete unless it has matching unit tests.
*   **Reliability:** Catch logical errors early before code is merged.
*   **Maintainability:** Allow engineers to refactor code confidently, knowing that regressions will be flagged immediately.

---

## 2. Unit Testing Scope

### 2.1 Backend Modules
*   **Application Services:** Validate business calculations, discount application rules, and receipt formatting logic.
*   **Validation Rules:** Ensure invalid request payloads (e.g., negative prices, malformed emails) are rejected.
*   **Utility Functions:** Validate datetime parsing, numeric rounding, and currency converter tools.

### 2.2 Frontend & Mobile Modules
*   **Zustand State Stores:** Verify actions update state properties correctly.
*   **Custom React Hooks:** Validate state lifecycle hooks and catalog lookup filters.
*   **UI Components:** Confirm components render layout states (loading, error, empty) correctly.

---

## 3. Unit Testing Principles

Developers must write tests that follow these principles:
*   **Independent Tests:** Tests must not depend on the execution order or state of other test cases.
*   **Fast Execution:** Unit tests must compile and run in milliseconds. Avoid database queries or network calls.
*   **Repeatable Results:** Tests must return identical results regardless of the execution environment (local or CI server).
*   **Single Responsibility:** Each test case should verify a single logical behavior or assertion.

---

## 4. Test File Structure & Naming Conventions

*   **Go Backend Naming:**
    *   *Test File:* Positioned alongside the source file (e.g., `checkout_service.go` has a matching `checkout_service_test.go`).
    *   *Test Case:* Use PascalCase prefixed with `Test` (e.g., `func TestCalculateTax_WithStandardRate(t *testing.T)`).
*   **Frontend / Mobile Naming:**
    *   *Test File:* Standard `.test.tsx` or `.test.ts` extension (e.g., `CartGrid.test.tsx`).
    *   *Test Case:* Use descriptive, lowercase strings: `it('should calculate total tax when cart has multiple items', () => { ... })`.

---

## 5. Unit Test Design Pattern: AAA (Arrange, Act, Assert)

All unit tests must follow the **Arrange-Act-Assert (AAA)** structural pattern:

```
[ ARRANGE ] (Define inputs, mock dependencies, instantiate entities)
     │
     ▼
  [ ACT ] (Invoke the target method or function under test)
     │
     ▼
[ ASSERT ] (Compare return values against expected parameters)
```

1.  **Arrange:** Set up preconditions, initialize input arguments, and mock external interfaces.
2.  **Act:** Execute the function or method being tested.
3.  **Assert:** Confirm that return values match expected outcomes and verify that mock expectations were met.

---

## 6. Backend Unit Testing Strategy

*   **Controllers:**
    *   *What to test:* JSON request binding, router validation checks, HTTP status codes.
    *   *What NOT to test:* Core business logic, tax calculations.
*   **Services:**
    *   *What to test:* Core calculations, permission checks, repository save triggers.
    *   *What NOT to test:* Database engines execution, third-party network APIs.
    *   *Coverage target:* $\ge 90\%$.
*   **Repositories:**
    *   *What to test:* SQL query syntax, parameter bindings.
    *   *What NOT to test:* Raw database engine connections.

---

## 7. Frontend / Mobile Unit Testing Strategy

*   **State Testing:** Verify that calling Zustand store actions updates the state properties correctly (e.g., adding an item updates `cartItems`).
*   **Hook Testing:** Use test utilities (like `@testing-library/react-hooks`) to verify that state updates and catalog search hooks execute correctly.
*   **Component Rendering:** Verify that buttons, input fields, and category grids render correctly and fire event callbacks when clicked.

---

## 8. Mocking Strategy

*   **Mock Scope:** External dependencies (database services, Redis connection pools, third-party payment gateways like Stripe or Bakong) must be mocked using Go interfaces or mock handlers.
*   **Mocking Rules:**
    *   Mock only dependencies that cross boundary layers (e.g., database repository queries).
    *   Avoid excessive mocking that duplicates application logic within the test itself.

---

## 9. Test Data Strategy

*   **Fixtures:** Use predefined JSON test fixtures to represent static entities (e.g., mock product Catalogs, tax rates).
*   **Factories:** Use factory methods to generate randomized mock entities (e.g., `GenerateMockUser()`), preventing test dependencies on static database IDs.

---

## 10. Test Coverage Targets

*   **Backend Code Coverage:** Target $\ge 80\%$ overall coverage.
*   **Critical Business Logic:** Target 100% coverage on core checkout calculations, tax rules, and currency conversion logic.
*   *Verification note:* High coverage percentage alone is not enough; tests must also verify boundary values (e.g., zero, negative, and maximum inputs).

---

## 11. Developer Workflow

```
[ WRITE CODE ] ──► [ WRITE UNIT TEST ] ──► [ RUN LOCAL TESTS ]
                                                  │
                                                  ▼
[ COMMIT CODE ] ◄── [ FIX TEST FAILURES ] ◄───────┘
```

1.  **Write Code:** Implement feature requirements.
2.  **Write Unit Test:** Write matching test scenarios following the AAA pattern.
3.  **Run Tests:** Execute test suites locally before submitting pull requests.

---

## 12. CI Pipeline Integration

*   **Pipeline Gate:** Pull requests targeting `develop` trigger automated test execution via GitHub Actions.
*   **Failure Handling:** If any unit test fails, the build pipeline is flagged as failed and merging is blocked.

---

## 13. Unit Test Review Checklist

*   `[ ]` Test executes independently of other test cases.
*   `[ ]` Test follows the Arrange-Act-Assert (AAA) pattern.
*   `[ ]` Naming clearly describes the scenario and expected outcome.
*   `[ ]` Database queries and network calls are mocked.
*   `[ ]` Test asserts both successful paths and error handling paths.

---

## 14. Conclusion

This Unit Testing Strategy and Implementation Standard Document defines the testing scopes, AAA structures, mocking rules, and CI gates for unit testing. Enforcing these development practices ensures code quality and reliability.

Developers can now configure their test runners and begin writing unit tests.
