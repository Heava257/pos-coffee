# DEPLOYMENT SPECIFICATION
## PART 5 — DATABASE MIGRATION & PRODUCTION DATA DEPLOYMENT

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Database Architect & Data Migration Specialist  
**Status:** Approved  

---

## 1. Database Migration Overview

### 1.1 Purpose & Migration Objectives
Database migration is the controlled process of evolving a production schema — adding tables, modifying columns, creating indexes, or transforming existing data — without causing data loss, application downtime, or tenant data leakage.

For a multi-tenant SaaS platform that handles live financial transactions, every schema change that reaches production must be:
*   **Reviewed:** Peer-reviewed by a second engineer before execution.
*   **Tested:** Successfully applied and rolled back in development and staging environments.
*   **Backed up:** A verified full database snapshot exists before any migration runs.
*   **Audited:** Every applied migration is logged with a timestamp and executing identity.

### 1.2 Why Database Migration Requires Careful Planning
*   **Multi-Tenant RLS Policies:** PostgreSQL Row-Level Security policies are schema-level objects. A misconfigured migration can expose one tenant's data to another.
*   **ACID Transactions:** Long-running migrations that hold table locks can block live checkout transactions, causing merchant revenue loss.
*   **Irreversible Operations:** `DROP TABLE` and `DROP COLUMN` are irreversible. Without a backup, data loss is permanent.
*   **Zero-Downtime Requirements:** The platform must remain available during business hours. Migrations must be designed to apply without taking the application offline.

---

## 2. Database Environment Strategy

### 2.1 Environment Definitions

| Environment | Purpose | Dataset | Access | Management |
| :--- | :--- | :--- | :--- | :--- |
| **Local Dev** | Developer schema experimentation | Seeded synthetic data | Developer only | Docker Compose PostgreSQL container |
| **QA / Testing** | Automated migration testing in CI | Minimal fixture data | CI/CD pipeline | RDS `t3.micro` (auto-reset on each CI run) |
| **Staging / UAT** | Production-replica validation | Anonymized production export | DevOps team + QA Lead | RDS `t3.medium` (manual reset before each UAT cycle) |
| **Production** | Live merchant data | Real tenant transactions | DevOps on-call only | RDS `t3.medium` Multi-AZ (never manually modified) |

*   **Golden Rule:** No developer or engineer modifies the production database directly. Every change must arrive through the CI/CD pipeline as a versioned migration file.

---

## 3. Database Migration Lifecycle

Each schema or data change follows a complete lifecycle from requirement to production verification:

```
[ REQUIREMENT CHANGE / FEATURE REQUEST ]
              │  Owner: Product Owner
              ▼
[ SCHEMA UPDATE DESIGN ]
              │  Owner: Backend Architect / DB Lead
              │  Output: ERD update + migration plan document
              ▼
[ MIGRATION FILE CREATION ]
              │  Owner: Backend Developer
              │  Output: Numbered migration UP + DOWN files
              ▼
[ DEVELOPMENT TESTING ]
              │  Owner: Developer
              │  Output: Migration applied and rolled back locally ✅
              ▼
[ CODE REVIEW + QA VALIDATION ]
              │  Owner: DB Lead + QA Engineer
              │  Output: PR approved; CI migration test passes ✅
              ▼
[ STAGING DEPLOYMENT ]
              │  Owner: DevOps Engineer
              │  Output: Migration applied on staging; smoke tests pass ✅
              ▼
[ PRODUCTION DEPLOYMENT APPROVAL ]
              │  Owner: DevOps Lead + Product Owner
              │  Output: Written approval recorded in deployment log
              ▼
[ PRODUCTION MIGRATION EXECUTION ]
              │  Owner: CI/CD Pipeline (automated)
              │  Output: Migration applied; schema version table updated
              ▼
[ POST-MIGRATION VERIFICATION ]
              │  Owner: DevOps Engineer + QA Lead
              │  Output: Data integrity checks pass; application healthy ✅
```

---

## 4. Migration Version Control Strategy

### 4.1 Migration Tool: `golang-migrate`
The project uses `golang-migrate` to manage all schema migrations. It maintains a `schema_migrations` table in PostgreSQL that records which migration versions have been applied and their dirty state.

### 4.2 Migration File Naming Convention
```
<version>_<description>.<direction>.sql

Examples:
000001_create_tenants_table.up.sql
000001_create_tenants_table.down.sql
000002_add_product_category_index.up.sql
000002_add_product_category_index.down.sql
000015_add_bakong_payment_method.up.sql
000015_add_bakong_payment_method.down.sql
```

*   **Version:** 6-digit zero-padded sequential integer. New migrations always increment the highest existing version number.
*   **Description:** Snake_case description of the change. Must be specific (e.g., `add_cashier_shift_end_time` not `update_users`).
*   **Direction:** `.up.sql` applies the change; `.down.sql` reverts it.

### 4.3 Version Control Rules
*   Migration files are stored in the Git repository under `db/migrations/`.
*   **Never edit or delete an already-applied migration file.** If a fix is needed, create a new migration.
*   All migration PRs require a database lead review before merge.
*   A migration file cannot be merged to `main` without a corresponding `.down.sql` rollback file.

---

## 5. Schema Migration Strategy

### 5.1 Change Safety Classification

| Change Type | Risk Level | Zero-Downtime Safe? | Approach |
| :--- | :--- | :--- | :--- |
| Add new table | ✅ Low | ✅ Yes | Apply directly |
| Add nullable column | ✅ Low | ✅ Yes | Apply directly |
| Add index (`CONCURRENTLY`) | ✅ Low | ✅ Yes | Use `CREATE INDEX CONCURRENTLY` |
| Add NOT NULL column with default | ⚠️ Medium | ✅ Yes (if default provided) | Add column with default; backfill; add constraint |
| Rename column | ⚠️ Medium | ❌ No (if applied at once) | Use Expand-and-Contract pattern |
| Add foreign key constraint | ⚠️ Medium | ✅ Yes (if data is valid) | Validate data first; add `NOT VALID`; validate separately |
| Drop column | ❌ High | ❌ No | Expand-and-Contract; ensure no app references first |
| Drop table | ❌ High | ❌ No | Two-phase: soft-delete → archive → drop |
| Modify column data type | ❌ High | ❌ No | New column → backfill → rename → drop old |

### 5.2 Index Change Procedure
*   All new indexes in production are created using `CREATE INDEX CONCURRENTLY` to avoid locking the table during index construction.
*   `CONCURRENTLY` cannot run inside a transaction block; it must be in a standalone migration file.

### 5.3 Constraint Change Procedure
*   Foreign key constraints are added with `NOT VALID` first, then validated in a separate migration step, separating the lock-holding periods.

---

## 6. Data Migration Strategy

### 6.1 Initial Data Loading (New Deployment)
*   **Seed Data:** Reference tables (currencies, tax categories, payment methods) are populated by a dedicated `db/seeds/` seed script that runs once on first deployment.
*   **Default Tenant Setup:** The system creates one default Super Admin tenant during initial deployment via the seed script.

### 6.2 Existing Data Transformation
*   Large data backfills (e.g., populating a new column for all historical records) are performed in **batched transactions** to avoid table lock escalation.
*   Each batch commits independently — if the process is interrupted, it can resume from the last committed batch.

### 6.3 Data Cleanup
*   Deprecated data fields are marked as `deprecated` in the schema comment and stopped being written by the application before their column is eventually dropped.
*   A data audit migration verifies no application code references the column before the DROP migration is executed.

### 6.4 Data Validation After Migration
*   Row count assertions verify that data transformation migrations did not silently delete rows.
*   NOT NULL constraint checks validate that backfill operations completed successfully for all rows.

---

## 7. Database Deployment Process

The deployment workflow is integrated into the CI/CD pipeline and executes in the following sequence:

```
[ PRE-MIGRATION BACKUP ]
 RDS snapshot created; verified before proceeding
         │
         ▼
[ MIGRATION DRY-RUN CHECK ]
 golang-migrate validates pending migrations without applying
         │
         ▼
[ APPLY MIGRATIONS (golang-migrate up) ]
 Migrations execute in version order inside a transaction
         │
         ▼
[ SCHEMA VERSION VERIFICATION ]
 Query schema_migrations table; confirm target version applied
         │
         ▼
[ APPLICATION HEALTH CHECK ]
 API /healthz endpoint returns 200 OK; DB connection active
         │
         ▼
[ DATA INTEGRITY VERIFICATION ]
 Automated validation queries confirm row counts and constraints
         │
         ▼
[ RELEASE APPROVAL ]
 DevOps Lead confirms deployment log; production traffic enabled
```

---

## 8. Database Backup Before Migration

### 8.1 Mandatory Pre-Migration Backup Policy
A verified RDS snapshot **must exist** before any migration is applied to the staging or production database.

| Environment | Backup Type | Timing | Verified By |
| :--- | :--- | :--- | :--- |
| **Staging** | Manual RDS snapshot | Taken by CI/CD pipeline before migration step | Automated snapshot ID check |
| **Production** | Manual RDS snapshot + daily automated backup | Taken by CI/CD pipeline; DevOps engineer confirms snapshot is available | DevOps engineer before approving deployment |

*   The snapshot ID is recorded in the deployment log alongside the migration version applied.
*   If the snapshot creation fails, the migration pipeline halts and does not proceed.

### 8.2 Why Backup is Mandatory
*   A migration that applies successfully but produces incorrect data cannot be undone by running the `.down.sql` file — data already modified by the migration is already changed.
*   An RDS snapshot allows a point-in-time restore to the exact pre-migration state in under 30 minutes, satisfying the RTO of $\le 4\text{ hours}$.

---

## 9. Migration Testing Strategy

### 9.1 Local Development Testing
*   The developer applies the migration to the local Docker Compose PostgreSQL container.
*   The developer confirms the migration runs without errors in `up` direction.
*   The developer confirms the rollback runs without errors in `down` direction.
*   The developer re-applies the `up` migration to confirm idempotency.

### 9.2 CI Pipeline Migration Testing
*   On every PR to `develop`, the CI pipeline spins up an ephemeral PostgreSQL container.
*   `golang-migrate up` applies all pending migrations from a clean schema.
*   `golang-migrate down 1` rolls back the last migration.
*   `golang-migrate up 1` re-applies the last migration.
*   If any step fails, the PR is blocked.

### 9.3 Performance Testing on Staging
*   For migrations involving large tables ($\ge 100,000$ rows), a staging environment loaded with representative data volume is used to benchmark migration execution time.
*   Migrations that take longer than 60 seconds are redesigned using batched processing or `CONCURRENTLY` techniques.

---

## 10. Rollback Strategy

### 10.1 Rollback Decision Criteria

| Trigger | Decision | Rollback Method |
| :--- | :--- | :--- |
| Migration fails mid-execution (transaction rolled back) | Automatic | `golang-migrate` transaction ensures DB is unchanged; no manual action needed |
| Migration succeeds but application returns 5xx errors | Manual | Run `golang-migrate down N`; restore snapshot if data was mutated |
| Migration succeeds but data integrity check fails | Manual | Restore RDS snapshot to pre-migration state |
| Migration causes performance regression | Manual | Run `golang-migrate down N`; redesign migration; redeploy |

### 10.2 Rollback Limitations
*   `DROP TABLE` and `DROP COLUMN` migrations are **irreversible via down migration** if the snapshot has been discarded. This is why destructive operations are the last step of a multi-phase Expand-and-Contract cycle.
*   RDS snapshots are the ultimate rollback mechanism for production. Down migrations handle schema reversion; snapshots handle data reversion.

### 10.3 Rollback Validation
*   After rollback, the `schema_migrations` table version is confirmed.
*   Application health checks must return `200 OK` before declaring rollback successful.
*   The incident is documented in the deployment log with root cause and corrective action.

---

## 11. Database Security During Migration

*   **Access Restriction During Migration:** The DevOps on-call engineer is the only person with credentials to trigger a production migration. No developer has production RDS credentials.
*   **Credential Protection:** Production RDS connection strings are stored in AWS Secrets Manager. The CI/CD pipeline retrieves credentials via IAM role at runtime — credentials are never printed to pipeline logs.
*   **Migration Audit Log:** Every migration execution is recorded in CloudWatch Logs with timestamp, migration version, executing IAM identity, and success/failure status.
*   **Sensitive Data in Migrations:** Migration files must never contain actual production data, PII, or credentials. Seed data files containing default values (e.g., currency codes) are reviewed for sensitivity before commit.
*   **RLS Policy Validation:** After any migration that modifies the RLS policy, a cross-tenant isolation test is executed to verify that tenant A cannot read tenant B's data.

---

## 12. Production Data Validation

A structured validation sequence runs after every production migration:

```
[ SCHEMA VALIDATION ]
 Confirm target schema_migrations version
 Confirm expected tables, columns, and indexes exist
         │
         ▼
[ DATA INTEGRITY VALIDATION ]
 Row count assertions on affected tables
 NOT NULL constraint verification
 Foreign key referential integrity check
 RLS policy cross-tenant isolation test
         │
         ▼
[ APPLICATION INTEGRATION TESTING ]
 API /healthz returns 200 OK
 Smoke tests: login, product list, checkout flow
         │
         ▼
[ PERFORMANCE VALIDATION ]
 Query execution plan (EXPLAIN ANALYZE) on critical paths
 p99 latency check: checkout endpoint ≤ 50ms
         │
         ▼
[ DEPLOYMENT LOG SIGN-OFF ]
 DevOps Lead records: migration version, validation results, approver
```

---

## 13. Zero-Downtime Migration Strategy

### 13.1 Expand-and-Contract Pattern
All breaking schema changes (column renames, type changes, table restructures) use the Expand-and-Contract (also known as "Parallel Change") pattern:

**Phase 1 — Expand:**
*   Add the new column/table alongside the existing one.
*   Update the application to write to both old and new simultaneously.
*   Deploy the application update first.

**Phase 2 — Migrate:**
*   Run a background backfill job to copy data from the old column to the new column for existing rows.
*   Validate that all rows have been backfilled.

**Phase 3 — Contract:**
*   Update the application to read exclusively from the new column.
*   Deploy the application update.
*   Drop the old column in a final migration.

### 13.2 Backward-Compatible Migration Rules
*   New columns must have default values or be nullable so the existing application version can insert rows without providing the new column.
*   No column that the current application version writes to may be dropped in the same deployment.
*   New NOT NULL constraints must be added `NOT VALID` first, then validated in a separate step.

### 13.3 Connection Pooler Coordination
*   pgBouncer connection poolers are paused (transaction pooling mode) during the migration execution window. Existing connections complete their current transactions before the migration lock is acquired.

---

## 14. Database Migration Automation

### 14.1 CI/CD Pipeline Integration
Database migrations are embedded in the application deployment pipeline:

*   **PR Stage:** Migration files are linted and validated (up/down pair existence, naming convention check).
*   **QA Stage:** Migrations are automatically applied against the QA database on merge to `develop`.
*   **Staging Stage:** Migrations are automatically applied against the staging database after QA passes.
*   **Production Stage:** Migrations run as the first step of the production deployment job, before the new ECS task image is deployed.

### 14.2 Migration Execution Order in Production Pipeline
```
[ PRE-MIGRATION RDS SNAPSHOT ] (automated)
         │
         ▼
[ golang-migrate up ] (runs pending migrations)
         │
         ▼
[ SCHEMA VALIDATION QUERY ] (confirms version)
         │
         ▼
[ NEW ECS TASK IMAGE DEPLOYED ] (blue-green switch)
         │
         ▼
[ SMOKE TESTS ] (confirms application + schema compatibility)
```

*   The pipeline treats a migration failure as a hard stop — the new ECS image is **not** deployed if migrations fail.

---

## 15. Database Deployment Readiness Checklist

*   `[x]` Migration tool (`golang-migrate`) configured and integrated into the CI/CD pipeline.
*   `[x]` Migration naming convention and directory structure established (`db/migrations/`).
*   `[x]` All migration files include both `.up.sql` and `.down.sql` counterparts.
*   `[x]` Pre-migration RDS snapshot policy defined and automated.
*   `[x]` Migration successfully tested in development (up and down cycle).
*   `[x]` Migration successfully applied to staging database.
*   `[x]` Expand-and-Contract pattern documented for all breaking changes.
*   `[x]` `CREATE INDEX CONCURRENTLY` used for all production index additions.
*   `[x]` Cross-tenant RLS isolation test included in post-migration validation.
*   `[x]` Rollback procedure tested and documented.
*   `[x]` Production migration approval recorded in deployment log.
*   `[x]` Post-migration smoke tests confirm application health.

---

## 16. Conclusion

This Database Migration Strategy and Production Data Deployment Plan Document defines the complete framework for safely evolving the production schema — from migration file conventions and CI/CD automation, through zero-downtime Expand-and-Contract techniques, to pre-migration backup requirements and post-migration validation checklists. Enforcing this strategy ensures the platform's multi-tenant data remains consistent, secure, and available throughout every schema evolution.

DevOps engineers and backend developers can now proceed to authoring the initial schema migration files and configuring `golang-migrate` in the CI/CD pipeline.
