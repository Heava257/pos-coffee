# SYSTEM DESIGN SPECIFICATION
## PART 3 — DATABASE DESIGN

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Senior Database Architect, Data Engineer & Enterprise Software Designer  
**Status:** Under Review  

---

## 1. Database Architecture Overview

### 1.1 Database Design Objectives & Strategy
The core database objective is to support a high-volume, multi-tenant POS environment while maintaining data isolation and low operational overhead. 
*   **Data Isolation:** Enforce isolation between tenants to comply with data privacy policies.
*   **Transactional Integrity (ACID):** Ensure ledger entries, inventory updates, and checkout states are written atomically.
*   **High Performance:** Maintain latency targets ($\le 50\text{ ms}$ checkout queries) under high read/write concurrency.

### 1.2 Multi-Tenant Storage Approach
To optimize hosting costs during the startup phase, the platform uses a **Hybrid Multi-Tenant Storage Model**:
*   **Shared Schema with Row-Level Security (RLS) (Starter/Growth Plans):** Tenants share a database cluster. Row-Level Security policies automatically append a `tenant_id` filter to all incoming queries, ensuring data isolation.
*   **Isolated Database (Enterprise Plans):** Dedicated database clusters are provisioned for enterprise tenants to provide complete data isolation, customized backup options, and custom performance tuning.

---

## 2. Database Technology Decision

### 2.1 Relational Database: PostgreSQL
*   **Purpose:** Core transactional data store for tenants, users, inventory, checkouts, and ledger logs.
*   **Reason for Selection:** Strong support for ACID transactions, built-in Row-Level Security (RLS), and JSONB capabilities for schema flexibility.
*   **Advantages:** Mature index tuning options, robust connection pool management, and a rich ecosystem for analytics.
*   **Limitations:** Vertical scaling limits write throughput; requires horizontal partitioning or sharding for massive transactional datasets.

### 2.2 Cache Database: Redis
*   **Purpose:** Session caching, API rate limiting, and temporary client state logs.
*   **Reason for Selection:** High-throughput, sub-millisecond in-memory data store.
*   **Advantages:** Built-in TTL keys, support for pub/sub event queues, and atomic operation counters.
*   **Limitations:** Memory-bound storage capacity; requires backup snapshots to prevent data loss.

---

## 3. Logical Data Model Design

### Entity 3.1: Tenant
*   **Purpose:** Represents an isolated business entity using the SaaS platform.
*   **Attributes:** Tenant ID (UUID), Workspace Name, Subscription Plan Tier, Status, Localization Font Settings.
*   **Primary Key:** Tenant ID.
*   **Foreign Keys:** None.
*   **Relationships:** One-to-Many relationship with `Branch` and `User` entities.
*   **Business Rules:** Subscription Plan Tier determines configuration limits (e.g., number of branches or products).

### Entity 3.2: Order
*   **Purpose:** Represents a completed sales transaction.
*   **Attributes:** Order ID (UUID), Tenant ID, Branch ID, Cashier User ID, Invoice Number, Subtotal, Tax Amount, Discount, Total Paid, Status, Created Timestamp.
*   **Primary Key:** Order ID.
*   **Foreign Keys:** Tenant ID (references Tenant), Branch ID (references Branch), Cashier User ID (references User).
*   **Relationships:** One-to-Many relationship with `OrderItem` and `Payment` entities.
*   **Business Rules:** Finalized orders and ledger logs must be immutable. Invoice numbers must be unique within the tenant's workspace.

---

## 4. Entity Relationship Diagram (ERD) Design

This section details the relational cardinality and foreign key paths:

```
+---------------+ (1)           (N) +---------------+ (1)           (N) +---------------+
|    TENANT     | ────────────────> |    BRANCH     | ────────────────> |   INVENTORY   |
+---------------+                   +---------------+                   +---------------+
        │ (1)                               │ (1)                               ▲ (N)
        │                                   │                                   │
        ▼ (N)                               ▼ (N)                               │ (Deducts)
+---------------+ (1)           (N) +---------------+ (1)           (N) +---------------+
|     USER      | ────────────────> |     ORDER     | ────────────────> |  ORDER_ITEM   |
+---------------+                   +---------------+                   +---------------+
                                            │ (1)
                                            │
                                            ▼ (N)
                                    +---------------+
                                    |    PAYMENT    |
                                    +---------------+
```

### Relational Cardinality
*   **Tenant | One-to-Many (1:N) | Branch:** A single tenant owns one or more business locations.
*   **Branch | One-to-Many (1:N) | Order:** A branch registers and records multiple customer orders.
*   **Order | One-to-Many (1:N) | OrderItem:** An order contains one or more line items.
*   **Order | One-to-Many (1:N) | Payment:** An order checkout supports split payments (e.g., Cash and KHQR Card).

---

## 5. Physical Database Design

### Table 5.1: `tenants`
*   **Purpose:** Stores configuration profiles for tenants.
*   *Columns:*
    *   `id` (UUID, Primary Key, Default: gen_random_uuid())
    *   `workspace_name` (VARCHAR(100), Not Null, Unique)
    *   `plan_tier` (VARCHAR(20), Not Null)
    *   `status` (VARCHAR(20), Not Null)
    *   `settings` (JSONB, Nullable)
    *   `created_at` (TIMESTAMPTZ, Not Null, Default: CURRENT_TIMESTAMP)
*   *Indexes:* Primary key index on `id`.

### Table 5.2: `orders`
*   **Purpose:** Records transactional details for billing.
*   *Columns:*
    *   `id` (UUID, Primary Key, Default: gen_random_uuid())
    *   `tenant_id` (UUID, Not Null, Foreign Key references tenants.id)
    *   `branch_id` (UUID, Not Null, Foreign Key references branches.id)
    *   `invoice_number` (VARCHAR(50), Not Null)
    *   `total_amount` (NUMERIC(12, 4), Not Null)
    *   `tax_amount` (NUMERIC(12, 4), Not Null)
    *   `discount_amount` (NUMERIC(12, 4), Not Null, Default: 0)
    *   `status` (VARCHAR(20), Not Null)
    *   `created_at` (TIMESTAMPTZ, Not Null, Default: CURRENT_TIMESTAMP)
*   *Indexes:* Unique composite index on `(tenant_id, invoice_number)`. Foreign key index on `branch_id`.

---

## 6. Database Normalization Analysis

### 6.1 Normalization Forms
*   **First Normal Form (1NF):** All columns contain atomic values, and there are no repeating groups. Order items are decoupled into a separate `order_items` table.
*   **Second Normal Form (2NF):** Satisfies 1NF, and all non-key columns depend on the entire primary key. In `order_items`, price and quantity depend on the composite key of `(order_id, product_id)`.
*   **Third Normal Form (3NF):** Satisfies 2NF, and no non-key column depends transitively on the primary key. Tax settings are stored in the `branches` table, rather than duplication in the `orders` table.

### 6.2 Performance Exceptions (Denormalization)
For historical reporting purposes, the `orders` table denormalizes and stores a static snapshot of the tax and product pricing at checkout. This prevents historical invoice reports from changing if the tenant updates catalog prices later.

---

## 7. Database Relationship Design

### 7.1 Cascade Rules
*   **Tenant Deletion:** Delete Cascade. If a tenant workspace is deleted, all associated branches, products, orders, and user mappings are removed.
*   **Branch Deletion:** Restrict Delete. If a branch contains active order history, deletion is blocked to prevent data loss. The branch status must be set to `Inactive` instead.

### 7.2 Delete & Update Behaviors
| Parent Entity | Child Entity | Relationship | Delete Behavior | Update Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `tenants` | `branches` | 1:N | CASCADE | CASCADE |
| `branches` | `orders` | 1:N | RESTRICT | CASCADE |
| `orders` | `order_items`| 1:N | CASCADE | CASCADE |
| `products` | `order_items`| 1:N | RESTRICT | CASCADE |

---

## 8. Database Transaction Design

### 8.1 Transaction Boundaries & ACID
All write operations that modify inventory levels or register sales logs must execute within an explicit database transaction block. 
*   **Atomicity:** If the payment gateway fails or database inserts time out, rollback all modifications.
*   **Isolation Level:** Use **Read Committed** for standard transactions, and upgrade to **Serializable** for inventory allocations to prevent race conditions during high-volume checkouts.

---

## 9. Indexing & Performance Strategy

*   **Primary Indexes:** Default B-Tree indexes on all UUID primary key column layouts (`id`).
*   **Foreign Key Indexes:** B-Tree indexes on all relational columns (`tenant_id`, `branch_id`, `user_id`) to accelerate table joins.
*   **Composite Indexing:** Use composite indexes on common filtering pairs (e.g., `(tenant_id, created_at)` for reporting queries, and `(tenant_id, barcode)` for inventory checks).
*   **Partial Indexes:** Index active sessions only, using conditions like `WHERE status = 'Active'` to keep index sizes small and fast.

---

## 10. Data Security Design

### 10.1 Row-Level Security (RLS) Isolation
For the shared database schema, define Row-Level Security policies on all tables:
*   Enforce tenant isolation by applying `WHERE tenant_id = current_setting('app.current_tenant_id')` to all operations.
*   Verify that backend connection routers set this variable at the start of each request.

### 10.2 Sensitive Data Protection
*   **Credit Card Details:** raw PAN/CVV storage on platform servers is blocked. Use token strings provided by PCI-compliant gateways.
*   **Passwords:** Secure user password storage using the **Argon2id** hashing algorithm, configured with unique salts.
*   **Personal Data:** Encrypt customer emails and phone numbers at rest using AES-256 keys managed by a key vault service.

---

## 11. Data Migration Strategy

*   **Version Control:** Use database migration tools (e.g., Liquibase, golang-migrate) to version control the database schema.
*   **Incremental Updates:** Apply changes using migration files (e.g., `0001_create_tenants.up.sql`). Each file must include a matching rollback script (e.g., `0001_create_tenants.down.sql`).
*   **Zero-Downtime Deployments:** Avoid schema changes that require table locks. Add new columns as nullable, populate data asynchronously, and drop old columns in a separate deploy phase.

---

## 12. Backup & Recovery Strategy

*   **Backup Frequency:** Hourly transaction log shipping (Write-Ahead Logs) combined with daily full backups.
*   **Storage Isolation:** Store backups in encrypted, geographically isolated object storage buckets.
*   **Recovery Targets:**
    *   **RPO (Recovery Point Objective):** $\le 1\text{ hour}$ (maximum data loss window).
    *   **RTO (Recovery Time Objective):** $\le 4\text{ hours}$ (maximum time to restore active operations).
*   **Drill Testing:** Run automated backup recovery tests monthly to verify data integrity.

---

## 13. Database Scaling Strategy

*   **Read Replicas:** Route reporting queries to read replicas, freeing up write capacity on the primary database engine.
*   **Horizontal Sharding:** For enterprise plans, scale write capacity by partitioning tenant schemas across database clusters based on `tenant_id` hash ranges.
*   **Archiving Strategy:** Archive order logs older than 2 years into compressed archive tables to keep active transaction indexes fast.

---

## 14. Database Traceability Matrix

| Functional Requirement | Business Rule | Entity | Database Table | Index / Constraint |
| :--- | :--- | :--- | :--- | :--- |
| **FR-TEN-001** (Registration) | BR-TEN-001 (Unique Workspace)| Tenant | `tenants` | UNIQUE `workspace_name` |
| **FR-POS-ORD-001** (Checkout) | BR-TXN-001 (Immutable Sales) | Order | `orders` | Foreign Key `tenant_id` |
| **FR-POS-INV-001** (Stock) | BR-INV-001 (Positive Stock)  | Inventory | `inventory`| Check `quantity >= 0` |
| **FR-AUTH-001** (Login) | BR-USR-001 (Active Tenant)   | User | `users` | Index `(email, status)` |

---

## 15. Conclusion

This Database Design Document establishes the relational models, Row-Level Security configurations, and transaction rules required for implementation. By using PostgreSQL RLS for multi-tenant isolation, structured database indexing, and a robust transaction scaling strategy, we ensure the platform's data layer remains secure, fast, and scalable.

Developers can now proceed to database schema setup, backend configuration, and deployment planning.
