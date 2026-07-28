# CORE CONFIGURATION & ENVIRONMENT MANAGEMENT ARCHITECTURE

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0 — Baseline Standard  
**Date:** July 14, 2026  
**Authors:** Principal Backend Architect and NestJS Enterprise Engineer  
**Classification:** Internal — Confidential  
**Phase:** 23.5 — Core Configuration & Environment Management Architecture  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Configuration Architecture](#2-configuration-architecture)
3. [NestJS Configuration Module Design](#3-nestjs-configuration-module-design)
4. [Environment Variables Design](#4-environment-variables-design)
5. [Security Best Practices](#5-security-best-practices)
6. [Configuration Validation](#6-configuration-validation)
7. [Multi-Tenant SaaS Configuration](#7-multi-tenant-saas-configuration)
8. [Docker & Production Integration](#8-docker--production-integration)
9. [Architecture Diagrams](#9-architecture-diagrams)
10. [Enterprise Implementation Guidelines](#10-enterprise-implementation-guidelines)
11. [Implementation Summary](#11-implementation-summary)

---

## 1. Executive Summary

### 1.1 Document Purpose
This document establishes the **Core Configuration & Environment Management Architecture** (Phase 23.5). It designs an enterprise-grade configuration system for the backend, ensuring environment isolation, secure secrets handling, automated validation, and flexible tenant configurations.

---

## 2. Configuration Architecture

### 2.1 Importance of Configuration Management
Configuration management separates code from environmental dependencies, satisfying twelve-factor app principles. It allows the same code bundle to run seamlessly across local development, CI pipelines, staging platforms, and production Kubernetes clusters by altering env variables.

### 2.2 Environment Separation
*   **Development:** Designed for developer machines, utilizing local mock servers and verbose console logs.
*   **Testing:** Transient environments for integration and unit test runs, resetting database instances on each run.
*   **Staging:** Identical replica of production, connected to staging-level external services (e.g., Stripe Sandbox).
*   **Production:** Strict high-security environments, using managed secrets engines, low logs verbosity, and cluster network isolation.

### 2.3 Configuration Loading Flow

```
  SOURCE FILES                VALIDATION GATE             APP RESOLUTION
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│ .env files / │ ───►   │ Joi / Zod    │ ───►   │ ConfigModule │
│ ConfigMap /  │        │ schema-based │        │ injects typed│
│ Vault engine │        │ type checks  │        │ class config │
└──────────────┘        └──────────────┘        └──────────────┘
                                                       │
                                                       ▼
                                                INFRASTRUCTURE
                                                ┌──────────────┐
                                                │ DB, Redis,   │
                                                │ Mail, and S3 │
                                                │ connections  │
                                                └──────────────┘
```

---

## 3. NestJS Configuration Module Design

The configuration architecture is isolated within `src/core/config/`:

```
src/core/config/
 ├── config.module.ts       (Initializes ConfigurationModule and validation schema)
 ├── config.service.ts      (Exposes typed getters for loaded variables)
 ├── database.config.ts     (Configuration settings for PostgreSQL database)
 ├── redis.config.ts        (Configuration settings for Redis instances)
 ├── jwt.config.ts          (Configuration settings for JWT expirations and keys)
 ├── app.config.ts          (Host, port, environment, and general configurations)
 └── validation.schema.ts   (Zod / Joi validation definitions for variables)
```

### 3.1 Responsibilities of Module Components
*   **ConfigModule:** Root module managing configuration values.
*   **ConfigService:** NestJS injectable service providing type-safe getters (e.g., `configService.get('db.url')`), preventing raw string queries.
*   **Configuration Files (database, redis, jwt, app):** Sub-config namespaces grouping parameters into structured namespaces.
*   **ValidationSchema:** Schema validating that variables are loaded with correct formats, types, and values before application startup.

---

## 4. Environment Variables Design

The system uses structured environment variables:

### 4.1 Application Properties
*   `NODE_ENV`: String enum (`development`, `test`, `staging`, `production`).
*   `PORT`: Port integer (Default: `3000`).
*   `APP_NAME`: Service identifier name.

### 4.2 Database Properties
*   `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:pass@host:port/dbname?schema=public`).

### 4.3 Redis Properties
*   `REDIS_HOST`: Redis host endpoint.
*   `REDIS_PORT`: Port integer (Default: `6379`).

### 4.4 Authentication Properties
*   `JWT_SECRET`: Cryptographically strong secret key.
*   `JWT_EXPIRES_IN`: Lifespan format code (e.g., `15m`).

### 4.5 Storage Properties
*   `STORAGE_PROVIDER`: File storage system provider type (`local`, `s3`).

### 4.6 Third-Party Integrations
*   `STRIPE_SECRET_KEY`: Payout interface key.
*   `SENDGRID_API_KEY`: Mail delivery provider key.
*   `TWILIO_ACCOUNT_SID`: SMS integration key.

---

## 5. Security Best Practices

*   **Secrets Prohibited in Git:** Development secrets are restricted from source code files. Environment templates (`.env.example`) are used as scaffolding references.
*   **Production Secrets Injection:** Production deployments retrieve secrets from secure managers (AWS Secrets Manager / Vault) rather than static files.
*   **Secrets Rotation:** Credentials (API keys, DB passwords, keys) are rotated every 90 days using automated rotation scripts.
*   **Environment Variable Encryption:** Production environment variables are encrypted at rest when stored in configuration vaults.

---

## 6. Configuration Validation

Validation schemas ensure the application fails fast if configured incorrectly:

*   **Zod Schema Validator:** Config maps are evaluated against strict Zod parsing schemas at launch.
*   **Type Assertions:** Enforces port limits (`1024-65535`), standard email formats, and URL validations.
*   **Default Assignments:** Assigns default fallbacks for optional parameters (e.g., `PORT=3000`, `NODE_ENV=development`).
*   **Startup Failure Handling:** If validation fails, the application prints a validation report to console log channels and exits immediately (exit code `1`).

---

## 7. Multi-Tenant SaaS Configuration

The platform supports dynamic settings configurations by tenant:

*   **Tenant Setting Ledgers:** Configuration databases store key-value settings parameters grouped by `tenantId`.
*   **Business Module Feature Flags:** Feature flags enable or disable business modules (e.g., POS, Pharmacy, Restaurant) based on tenant subscriptions.
*   **Subscription Plan Limits:** Enforces capacity limits based on the active plan, preventing resource consumption exceeding subscription bounds.

### 7.1 Module Feature Flag Mapping
```
      Tenant POS Subscription
                 │
                 ├── Coffee POS Module ──► [ENABLED]
                 ├── Restaurant Module  ──► [DISABLED]
                 └── Pharmacy Module   ──► [ENABLED]
```

---

## 8. Docker & Production Integration

Deployment configurations scale dynamically across orchestration layers:

*   **Docker Compose Configuration:** Pass environment variables to local container networks using `.env` files.
*   **Kubernetes ConfigMaps:** Store non-sensitive configuration values (e.g., `NODE_ENV`, `PORT`).
*   **Kubernetes Secrets:** Securely mount database connection strings, JWT keys, and third-party API credentials.

---

## 9. Architecture Diagrams

### 9.1 Configuration Pipeline Architecture

```mermaid
graph TD
    ENV_FILE[.env File / K8s ConfigMap] --> LOAD[1. Load variables at start]
    K8S_SEC[K8s Secrets / AWS Secrets Manager] --> LOAD
    LOAD --> VALIDATE[2. Validate Schema - Joi/Zod]
    VALIDATE -->|Parse Failed| FAIL[3a. Output Errors & Exit]
    VALIDATE -->|Parse Passed| APP[3b. Initialize ConfigModule]
    APP --> SERVICE[4. Inject ConfigService]
    SERVICE --> DB[PostgreSQL Connection]
    SERVICE --> REDIS[Redis Connection]
    SERVICE --> EMAIL[Mail Service Connection]
```

### 9.2 Dynamic Tenant Config Resolver

```mermaid
sequenceDiagram
    participant User as User Request
    participant Resolver as Config Resolver Service
    participant Cache as Redis Config Cache
    participant DB as PostgreSQL DB

    User->>Resolver: Request module (e.g., Pharmacy POS)
    Resolver->>Cache: Fetch tenant settings (tenant-uuid)
    alt Cache Hit
        Cache-->>Resolver: Return feature flag list
    else Cache Miss
        Resolver->>DB: Query tenant subscription config
        DB-->>Resolver: Return configurations from database
        Resolver->>Cache: Cache config settings
    end
    Resolver->>Resolver: Validate: Module == Enabled
    Resolver-->>User: Process request / Return HTTP 403 Forbidden
```

### 9.3 Config Vault Integrations

```mermaid
graph LR
    subgraph Cloud["Production Environment"]
        VAULT[AWS Secrets Manager]
        POD[EKS Container Pod]
    end

    VAULT -->|AWS IAM credentials role| POD
    POD -->|Load secrets at startup| BOOT[NestJS Config Module]
```

### 9.4 Docker Environment Variables Mapping

```mermaid
graph TD
    ENV[.env File] --> COMPOSE[docker-compose.yml]
    COMPOSE -->|Environment mappings| CONTAINER[Docker Container runtime]
```

### 9.5 Release Config Lifecycle

```mermaid
graph LR
    CODE[Merge Code] --> BUILD[CI/CD Build App]
    BUILD --> STAGING[Apply Staging ConfigMap]
    STAGING --> PROD[Mount Production Secrets]
```

---

## 10. Enterprise Implementation Guidelines

### 10.1 Naming Conventions
*   **Environment Variable Keys:** Uppercase with underscore separators (e.g., `DATABASE_URL`, `JWT_SECRET`).
*   **Configuration Files:** Lowercase, suffixed with `.config.ts` (e.g., `database.config.ts`).
*   **Config Keys:** camelCase namespaces (e.g., `db.url`, `redis.host`).

### 10.2 Folder Organization
Keep configuration files isolated under `src/core/config/` to simplify security audits and updates.

### 10.3 CI/CD Integration
CI/CD systems validate configuration syntax before deployments. Security verification steps block deployment if required variables are missing.

---

## 11. Implementation Summary

### 11.1 Config Setup Schedule

| Task | Target Timeline | Status |
| :--- | :--- | :--- |
| Create validation schemas | Day 1 | Planned |
| Create config service classes | Day 2 | Planned |
| Implement tenant settings module | Day 3 | Planned |
| Validate Kubernetes integration configurations | Day 4 | Planned |

---

## Document Control

| Field | Value |
|---|---|
| **Document ID** | SBMP-BE-23.5-CORE-CONFIG |
| **Version** | 1.0.0 |
| **Status** | APPROVED — Baseline |
| **Owner** | Principal Backend Architect |
| **Reviewed By** | DevOps Director, Security Manager, QA Lead |
| **Review Cycle** | Quarterly |
| **Next Review** | October 2026 |

---

*Phase 23.5 — Core Configuration & Environment Management Architecture | SaaS Business Management Platform*  
*Enterprise Confidential — © 2026 All Rights Reserved*
