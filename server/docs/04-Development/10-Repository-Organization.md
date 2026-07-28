# DEVELOPMENT SPECIFICATION
## PART 1 — REPOSITORY & SOURCE CODE ORGANIZATION

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal Software Architect, Backend Architect & Frontend Lead  
**Status:** Approved  

---

## 1. Repository Strategy Overview

### 1.1 Monorepo vs. Multi-Repository Analysis
We evaluated branching and source code management strategies and selected the **Monorepo** approach:
*   **Advantages:**
    *   *Unified API Contracts:* Frontend (Next.js), Mobile (React Native), and Backend (Go) share a single API schema repository, preventing drift in endpoint models.
    *   *Simple Developer Onboarding:* Developers clone a single repository and run a single docker command to stand up the local system.
    *   *Shared Deployment Pipelines:* Infrastructure-as-code (Terraform) scripts are versioned alongside the code they deploy.
*   **Limitations:** Git checkouts can become slow as the project grows. We mitigate this using Git sparse checkout configurations.
*   **Selected Approach:** A single Monorepo hosting all packages, services, infrastructure configs, and documentation.

---

## 2. Project Repository Structure

The monorepo organizes applications, libraries, and infrastructure setups:

```
project-root/
├── apps/               # Client-facing platforms
│   ├── web-admin/      # Next.js SaaS owner web dashboard
│   └── mobile-pos/     # React Native tablet cashier app
├── services/           # Backend monolithic engines
│   └── api-backend/    # Go Gin API service codebase
├── packages/           # Shared models and configurations
│   ├── api-contracts/  # OpenAPI Swagger specs and JSON models
│   └── common-utils/   # Shared utility methods
├── docs/               # System documentation assets
├── infrastructure/     # Terraform configurations and docker setups
├── scripts/            # Database seeding and developer tools
└── tests/              # End-to-End integration test suites
```

---

## 3. Backend Source Code Organization (Go Monolith)

The `services/api-backend/` codebase is structured to enforce clean domain-driven boundaries:

```
api-backend/
├── cmd/                # Application entry points
│   └── server/         # Main HTTP server initialization (main.go)
├── config/             # Environment configurations loader
├── internal/           # Private application code
│   ├── iam/            # Identity and Access Management domain
│   ├── pos/            # Cashier shift & POS Checkout domain
│   ├── inventory/      # Ingredient & low-stock alert domain
│   └── middleware/     # JWT security and RLS database routers
└── db/                 # Migrations and seed scripts
```

### 3.1 Domain Package Internal Structures
Each domain folder (e.g., `internal/pos/`) isolates its layers:
*   `controller/`: Gin HTTP handler methods (binds requests and writes JSON envelopes).
*   `service/`: Core business logic services (calculates sales tax, verifies shift states).
*   `domain/`: Aggregate root models and custom business rules.
*   `repository/`: Database queries and entity operations.

---

## 4. Frontend & Mobile Source Code Organization (React Native / Next.js)

The client apps (web and mobile) employ a **feature-based organization strategy**:

```
apps/mobile-pos/src/
├── features/           # Self-contained modules (auth, cart, catalog)
│   ├── auth/
│   │   ├── components/ # Input fields, login PIN pads
│   │   ├── hooks/      # useCashierAuth hooks
│   │   ├── services/   # AuthService API request handlers
│   │   └── screens/    # CashierPinLoginScreen views
│   └── cart/
├── navigation/         # Navigators and route configurations
├── state/              # Global state slices (Zustand configuration)
├── assets/             # SVG icons, logo vectors
└── utils/              # Khmer Unicode render helpers
```

---

## 5. Database Project Organization

*   **Directory Location:** `services/api-backend/db/`
*   **Structure:**
    *   `migrations/`: SQL migration files using standard timestamp prefixes:
        *   `20260711100000_create_tenants_table.up.sql`
        *   `20260711100000_create_tenants_table.down.sql`
    *   `seeds/`: SQL data seeds to populate mock inventory items for local testing.
*   **Version Control:** Schemas are managed via migrations; direct database modifications are strictly prohibited.

---

## 6. Configuration Management Structure

Configuration is loaded at startup using environment variables:
*   `.env.development`: Sets local docker database passwords.
*   `.env.test`: Connects to test databases and sets test keys.
*   `.env.production`: Configured dynamically using values injected from AWS Secrets Manager.

---

## 7. Git Repository Structure & Conventions

*   **Branch Strategy (Git Flow):**
    *   `main`: Active production code. Direct commits are blocked.
    *   `develop`: Integration branch for developers.
    *   `feature/`: Created for specific sprint stories (`feature/us-auth-login`).
*   **Commit Message Convention:** Follow Conventional Commits:
    *   `feat(pos): build touch grid scroll controls`
    *   `fix(auth): rotate refresh token cookie`

---

## 8. Code Ownership Strategy

We assign code owners to prevent configuration drift:

| Module Area | Primary Owner | Secondary Owner | Reviewer Required |
| :--- | :--- | :--- | :--- |
| **api-backend** | Backend Lead | Solution Architect | 2 Backend Devs |
| **mobile-pos** | Mobile Lead | Frontend Architect | 2 Mobile Devs |
| **infrastructure**| DevOps Lead | Solution Architect | DevOps Engineer |

---

## 9. Development Documentation Structure

*   **API Documentation:** Documented under `packages/api-contracts/swagger.yaml` in OpenAPI format.
*   **Database Documentation:** Schema designs are stored under `/docs/02-System-Design/03-Database-Design.md`.

---

## 10. Dependency Management Strategy

*   **Backend:** Go Modules (`go.mod`, `go.sum`). Checked weekly for updates using `go list -m -u all`.
*   **Frontend & Mobile:** npm package management (`package.json`, `package-lock.json`).
*   **Vulnerability Scanning:** Configure GitHub Actions to run security audits on dependencies every Friday night, flagging outdated packages.

---

## 11. Conclusion

This Repository and Source Code Organization Design Document defines the Monorepo structure, folder layout for Go backend services, React Native screen architectures, migration scripts, configurations, and Git workflow strategies. Standardizing this repository layout ensures development teams can build code consistently.

Developers can now configure their workspaces and begin development.
