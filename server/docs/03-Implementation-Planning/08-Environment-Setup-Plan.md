# IMPLEMENTATION PLANNING SPECIFICATION
## PART 6 — DEVELOPMENT ENVIRONMENT SETUP PLAN

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** DevOps Architect, Cloud Engineer & Software Infrastructure Specialist  
**Status:** Approved  

---

## 1. Environment Strategy Overview

The environment strategy isolates development, testing, staging, and production workloads to maintain security and stability:

```
[ DEVELOPER WORKSTATION ] (Local sandbox)
           │
           ▼
[ SHARED DEVELOPMENT ] (Collab integrations)
           │
           ▼
[ STAGING / UAT ] (Pre-release sanity check)
           │
           ▼
[ PRODUCTION CLUSTER ] (Active tenant transactions)
```

*   **Developer Workstation:** Isolated sandbox for code implementation and local testing.
*   **Shared Development:** Centralized environment used for staging integration checks.
*   **Staging / UAT:** Replicates production infrastructure to validate releases.
*   **Production Cluster:** Secure, high-availability platform hosting live tenant operations.

---

## 2. Local Workstation Requirements & Standardized Tools

### 2.1 Standardized Developer Tooling
To align development environments, we standardize on the following tools:
*   **Integrated Development Environment (IDE):**
    *   *Backend:* **GoLand** or VS Code (with official Go plugins).
    *   *Frontend / Mobile:* **VS Code** configured with ESLint and Prettier.
*   **Database Management Client:** **DBeaver** or pgAdmin 4.
*   **API Verification Client:** **Postman** (using shared workspaces for collection syncs).

### 2.2 Runtimes & Infrastructure Engines
*   **Go Runtime (1.22.x):** Backend runtime compiler.
*   **Node.js (20.x LTS):** Frontend and mobile app Javascript execution compiler.
*   **Docker Desktop (4.x):** Local container environment.

---

## 3. Backend Development Environment Setup

*   **Runtime:** Go 1.22+.
*   **Package Manager:** Go Modules (using `go.mod` and `go.sum`).
*   **Local Execution Flow:**
    *   Configure database parameters in a local `.env` file.
    *   Run `docker compose up` to start local PostgreSQL and Redis containers.
    *   Launch migrations using the golang-migrate binary.
    *   Start the API service locally using standard Go execution routes.

---

## 4. Frontend / Mobile Development Environment Setup

*   **Frameworks:** React Native (TypeScript) for the tablet POS app; Next.js (TypeScript) for the Web Admin.
*   **Package Manager:** npm (utilizing `package-lock.json` lockfiles).
*   **API Connection Strategy:**
    *   Local developers route API requests to `http://localhost:8080/api/v1/`.
    *   Mock API setups are configured for development scenarios when the backend service is offline.

---

## 5. Database Development Environment

*   **Database Engine:** PostgreSQL 16.
*   **Migration Engine:** golang-migrate.
*   *Migration files* are version-controlled in the repository (`db/migrations/`).
*   **Seed Data Strategy:** Run database seed scripts to populate default parameters (such as mock product categories, tax settings, and role permissions) for testing.

---

## 6. Container Development Strategy

*   **Local Docker Compose Services:**
    *   `postgres`: Relational engine initialized with custom multi-tenant databases.
    *   `redis`: Cache engine for sessions and rate limiting.
*   **Docker Network:** Isolated user-defined bridge network (`platform-net`) to ensure containers can communicate using service names.
*   **Volume Management:** Mount local directories to map PostgreSQL transaction logs, preserving database records when containers restart.

---

## 7. Source Control Environment

*   **Repository Strategy:** Monorepo structure containing frontend, backend, and infrastructure folders under a unified repository to simplify dependency updates.
*   **Pull Request Requirements:**
    *   Requires 2 positive code reviews before merging to develop.
    *   Requires all automated CI tests (compilation checks, unit test suites) to pass.

---

## 8. Configuration Management Design

Configuration is managed using environment variables loaded at runtime:
*   **Local Dev (`.env.local`):** Uses default Docker database passwords and mock payment key targets.
*   **Staging / Production:** Values are injected securely into ECS containers from AWS Secrets Manager, keeping sensitive keys out of code repositories.

---

## 9. Developer Onboarding Process

A 6-step onboarding workflow ensures new developers can run the codebase quickly:

```
[ STEP 1: ACCESS ] (Get Git access, clone monorepo)
       │
       ▼
[ STEP 2: INSTALL ] (Install Go, Node, Docker)
       │
       ▼
[ STEP 3: CONTAINERS ] (Run docker-compose up)
       │
       ▼
[ STEP 4: CONFIG ] (Setup .env.local parameters)
       │
       ▼
[ STEP 5: RUN APPS ] (Run migrations & launch API)
       │
       ▼
[ STEP 6: VERIFY ] (Execute Postman test collection)
```

1.  **Access Setup:** DevOps configures Git credentials and grants access to developer channels.
2.  **Install Tooling:** Developer installs Node, Go, and Docker.
3.  **Run Containers:** Run `docker compose up` to start local databases.
4.  **Verification:** Execute the Postman verification collection to confirm endpoints respond correctly.

---

## 10. Conclusion

This Development Environment Setup Plan Document establishes the tools, runtime systems, database migrations, and onboarding workflows for the platform. By standardizing development environments, we ensure that new team members can onboard quickly and start coding with minimal friction.

Developers can now proceed to clone repositories, configure local variables, and start development.
