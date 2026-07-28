# DEVELOPMENT SPECIFICATION
## PART 6 — DATABASE DEVELOPMENT GUIDELINES

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal Database Architect & Data Engineer  
**Status:** Approved  

---

## 1. Database Development Philosophy

### 1.1 Core Objectives & Principles
The database is the system of record for merchant and financial data.
*   **Data Integrity & Quality:** Enforce relational constraints and prevent invalid states at the database engine layer.
*   **Tenant Separation:** Utilize PostgreSQL Row-Level Security (RLS) to enforce data boundaries between tenants.
*   **High Performance:** Optimize index structures to ensure checkout query latencies stay under the $\le 50\text{ ms}$ threshold.

---

## 2. Database Architecture Implementation

The database tier is organized to separate data access from raw storage:

```
[ APPLICATION LAYER ] (Business logic services)
        │
        ▼
[ ORM / DATA ACCESS LAYER ] (Repository query interfaces, Go SQL drivers)
        │
        ▼
[ DATABASE ENGINE LAYER ] (PostgreSQL logical tables, indexes, RLS policies)
        │
        ▼
[ STORAGE TIER ] (AWS EBS volume storage, RDS snapshots)
```

### 2.1 Layer Boundaries
*   **ORM Layer:** Allowed to translate object models into SQL queries. Forbidden from directly modifying table schemas.
*   **Database Layer:** Responsible for enforcing constraints and RLS rules.
*   **Storage Tier:** Manages physical data blocks and snapshot lifecycles.

---

## 3. Database Project Structure

Database assets are stored in the Go monolithic backend repository (`services/api-backend/db/`):
*   `migrations/`: Version-controlled SQL migration scripts (paired `.up.sql` and `.down.sql` scripts).
*   `seeds/`: Standard database seed files containing default configurations (such as currency codes, localized tax structures, and role permissions) for local sandboxes.
*   `scripts/`: Automated database cleanup and snapshot verification utilities.

---

## 4. Schema Development Standards

*   **Table Naming:** Use plural, snake_case nouns (e.g., `tenants`, `order_items`).
*   **Column Naming:** Use snake_case nouns (e.g., `tenant_id`, `created_at`).
*   **Identifiers:** Enforce `UUIDv4` primary keys to support offline checkout synchronization.
*   **Foreign Keys:** Define explicit foreign keys for relational tables. Cascading deletes are prohibited on transactional tables to prevent accidental data loss.

---

## 5. Data Modeling & Normalization Standards

*   **Third Normal Form (3NF):** Enforce 3NF on core entities (e.g., users, branches, configurations) to eliminate data redundancy.
*   **Selective Denormalization:** Cart pricing schemas (such as item prices, tax margins, and product names) are duplicated into transactional `order_items` tables, preserving invoice history even if catalog prices change.

---

## 6. Migration Management Strategy

*   **Version Control:** All database changes must be versioned using migration scripts; manual production schema updates are prohibited.
*   **Rollback Strategy:** Every `.up.sql` migration file must have a corresponding `.down.sql` rollback script that reverts the schema changes.
*   **Execution Flow:** Migrations apply automatically during the CI/CD pipeline deployment check.

---

## 7. ORM Development Standards

*   **Explicit Mapping:** Model definitions must match database column constraints exactly.
*   **Query Handling:** Use the ORM for simple CRUD tasks (e.g., fetching a user by ID). Use raw SQL queries for high-volume transactions to prevent ORM mapping overhead.

---

## 8. Query Development Standards

*   **N+1 Query Prevention:** Developers must eager-load relational records instead of running query loops in application service layers.
*   **Query Safety:** All SQL queries must use parameterized placeholders to prevent SQL injection.

---

## 9. Database Performance Optimization

*   **Composite Indexing:** Create composite B-Tree indexes matching `(tenant_id, search_field)` for query lookups.
*   **Connection Pooling:** Route connections through pgBouncer connection pools to manage database connections under heavy load.

---

## 10. Database Security Standards

*   **Access Control:** Backend services must connect to database engines using a restricted application role. Administrative operations are isolated on a separate credential track.
*   **Row-Level Security:** Enforce policies check `WHERE tenant_id = current_setting('app.current_tenant_id')` on all multi-tenant tables.

---

## 11. Data Validation & Integrity

*   **Validation Levels:**
    1.  *Application validation:* Enforce payload syntax validation (e.g., check email structures) at the API gateway layer.
    2.  *Database validation:* Enforce constraints (such as `NOT NULL`, `UNIQUE`, and `CHECK`) at the database engine layer.

---

## 12. Backup & Recovery Standards

*   **Backup Schedule:** Perform full RDS database snapshots daily and ship WAL transaction logs to S3 hourly.
*   **Disaster Recovery Targets:**
    *   *Recovery Point Objective (RPO):* $\le 1\text{ hour}$ (maximum allowable data loss).
    *   *Recovery Time Objective (RTO):* $\le 4\text{ hours}$ (maximum allowable database downtime).

---

## 13. Testing Strategy

*   **Migration Testing:** Run migrations up and down on local database containers to verify rollback scripts.
*   **Integrity Testing:** Run test transactions that violate constraints (e.g., inserting duplicate barcodes) to confirm the database engine rejects them.

---

## 14. Conclusion

This Database Development Guideline Document defines the data architecture, table standards, migration processes, performance optimizations, and backup strategies. Enforcing these guidelines ensures the database tier remains secure and performant.

Engineers can now proceed to database schema migrations and query implementations.
