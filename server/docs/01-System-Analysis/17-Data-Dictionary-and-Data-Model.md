# SOFTWARE REQUIREMENT SPECIFICATION (SRS)
## PART 10 — DATA DICTIONARY & DATA MODEL ANALYSIS

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Senior Database Architect, Data Modeler & Enterprise Solution Architect  
**Status:** Under Review  

---

## 1. Data Entity Identification

This section lists the key database entities that form the data layer of the multi-tenant SaaS platform.

### ENT-001: Tenant
*   **Description:** Stores the isolated corporate organization profile for each registered business account.
*   **Purpose:** Enforces data isolation boundaries and tenant configuration settings.
*   **Related Business Process:** New Business Registration, Tenant Organization Setup.
*   **Related Actors:** Business Owner, Platform Administrator.

### ENT-002: Branch
*   **Description:** Stores physical locations, retail stores, or warehouses linked to a tenant organization.
*   **Purpose:** Manages localized settings (e.g., tax profiles, timezone, receipt layouts) for each location.
*   **Related Business Process:** Tenant Organization Setup, Coffee POS Sales.
*   **Related Actors:** Business Owner, Business Manager, Cashier.

### ENT-003: User
*   **Description:** Stores identity, authentication credentials, and session profiles for employees and administrators.
*   **Purpose:** Coordinates login validations and access permissions.
*   **Related Business Process:** User and Employee Management, Coffee POS Sales.
*   **Related Actors:** Business Owner, Manager, Cashier, Inventory Staff, Kitchen Staff.

### ENT-004: Role
*   **Description:** Stores role templates and permission sets (e.g., Owner, Manager, Cashier) linked to tenant workspaces.
*   **Purpose:** Enforces role-based permissions (RBAC) at the API and database levels.
*   **Related Business Process:** User and Employee Management.
*   **Related Actors:** Business Owner, Platform Administrator.

### ENT-005: Subscription
*   **Description:** Stores subscription package details, renewal schedules, and active feature limits.
*   **Purpose:** Governs tenant plan status and enforces system boundaries.
*   **Related Business Process:** Subscription Management.
*   **Related Actors:** Business Owner, Payment Gateway.

### ENT-006: Product
*   **Description:** Stores item details, pricing, modifier configurations, and categories in the menu catalog.
*   **Purpose:** populates point-of-sale grids and manages product catalogs.
*   **Related Business Process:** Product Management, Coffee POS Sales.
*   **Related Actors:** Business Manager, Cashier.

### ENT-007: Inventory
*   **Description:** Stores stock levels, raw ingredient weights, and replenishment thresholds for each branch.
*   **Purpose:** Monitors stock balances and triggers low-stock alerts.
*   **Related Business Process:** Inventory Management, Coffee POS Sales.
*   **Related Actors:** Inventory Staff, Business Manager, Cashier.

### ENT-008: Order
*   **Description:** Stores transaction header records for POS sales checkout.
*   **Purpose:** Tracks invoice details, cashier IDs, branch scopes, and payment statuses.
*   **Related Business Process:** Coffee POS Sales.
*   **Related Actors:** Cashier, Business Manager, End Customer.

### ENT-009: OrderItem
*   **Description:** Stores line-item details for transactions, including quantity, unit price, tax components, and selected options.
*   **Purpose:** Computes sales details and tracks product performance metrics.
*   **Related Business Process:** Coffee POS Sales.
*   **Related Actors:** Cashier, End Customer.

### ENT-010: Payment
*   **Description:** Stores invoice payments, tracking payment type (cash, card, mobile QR) and gateway details.
*   **Purpose:** records payments and reconciles shift ledgers.
*   **Related Business Process:** Coffee POS Sales, Subscription Management.
*   **Related Actors:** Cashier, Payment Gateway.

### ENT-011: AuditLog
*   **Description:** Stores records of administrative updates, manager overrides, security audits, and financial adjustments.
*   **Purpose:** Enforces audit controls and tracks security changes.
*   **Related Business Process:** Security Auditing.
*   **Related Actors:** Platform Administrator, Business Owner, Business Manager.

---

## 2. Data Dictionary Creation

### 2.1 Table: Tenant
*   **Logical Name:** Tenant Organization  
*   **Description:** Stores the isolated corporate organization profile for each registered business account.

| Field Name | Data Type | Constraint | Required | Default Value | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | UUID | Primary Key | Yes | Auto-generated | `f38992ba-2023...` | Unique identifier for the tenant. |
| **business_name** | VARCHAR(150) | None | Yes | None | `Brew Coffee Co.` | Legal name of the business entity. |
| **subdomain** | VARCHAR(50) | Unique | Yes | None | `brewcafe` | Assigned routing subdomain prefix. |
| **tax_id** | VARCHAR(30) | None | No | Null | `KH-900123490` | Corporate tax identification number. |
| **base_currency**| VARCHAR(3) | None | Yes | `USD` | `KHR` | Corporate standard billing currency. |
| **status** | VARCHAR(20) | None | Yes | `Registered` | `Active` | Status code (`Registered`, `Active`, `Read-Only`, `Suspended`). |
| **created_at** | TIMESTAMP | None | Yes | Current time | `2026-07-11...` | Timestamp when the record was created. |

### 2.2 Table: Branch
*   **Logical Name:** Branch Location  
*   **Description:** Stores physical locations, retail stores, or warehouses linked to a tenant organization.

| Field Name | Data Type | Constraint | Required | Default Value | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | UUID | Primary Key | Yes | Auto-generated | `b0981a2e-4011...` | Unique identifier for the branch. |
| **tenant_id** | UUID | Foreign Key | Yes | None | `f38992ba-2023...` | Links to the parent Tenant organization. |
| **branch_name** | VARCHAR(100) | None | Yes | None | `Phnom Penh Center`| Name of the physical branch location. |
| **address** | TEXT | None | Yes | None | `Vattanac Tower, PP`| Physical address of the branch. |
| **tax_rate** | DECIMAL(5,2) | None | Yes | `10.00` | `10.00` | Localized sales tax / VAT rate. |
| **timezone** | VARCHAR(40) | None | Yes | `Asia/Phnom_Penh`| `Asia/Phnom_Penh`| Local branch timezone. |

### 2.3 Table: User
*   **Logical Name:** User Directory  
*   **Description:** Stores identity, authentication credentials, and session profiles for employees and administrators.

| Field Name | Data Type | Constraint | Required | Default Value | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | UUID | Primary Key | Yes | Auto-generated | `d720b08a-1123...` | Unique identifier for the user. |
| **tenant_id** | UUID | Foreign Key | Yes | None | `f38992ba-2023...` | Links to the parent Tenant organization. |
| **email** | VARCHAR(100) | Unique | Yes | None | `owner@brew.com` | User email address used for logins. |
| **password_hash** | VARCHAR(255) | None | Yes | None | `$argon2id$v=19...`| Encrypted credential hash value. |
| **pin_hash** | VARCHAR(255) | None | No | Null | `$2b$12$eK...` | Encrypted 4-digit PIN for POS login. |
| **status** | VARCHAR(20) | None | Yes | `Pending` | `Active` | Profile status (`Pending`, `Active`, `Suspended`). |

### 2.4 Table: Product
*   **Logical Name:** Product Catalog  
*   **Description:** Stores item details, pricing, modifier configurations, and categories in the menu catalog.

| Field Name | Data Type | Constraint | Required | Default Value | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | UUID | Primary Key | Yes | Auto-generated | `c8762ab4-1901...` | Unique identifier for the product. |
| **tenant_id** | UUID | Foreign Key | Yes | None | `f38992ba-2023...` | Links to the parent Tenant organization. |
| **product_name** | VARCHAR(100) | None | Yes | None | `Iced Latte` | Product name displayed on invoices and menus. |
| **barcode** | VARCHAR(50) | None | No | Null | `884900123901` | Product UPC/EAN barcode. |
| **selling_price** | DECIMAL(10,2) | None | Yes | `0.00` | `3.50` | Selling price before taxes. |
| **cost_price** | DECIMAL(10,2) | None | Yes | `0.00` | `1.10` | Product unit cost (used to calculate COGS). |
| **is_deleted** | BOOLEAN | None | Yes | `False` | `False` | soft-delete flag to preserve sales history. |

### 2.5 Table: Order
*   **Logical Name:** Sales Invoice Header  
*   **Description:** Stores transaction header records for POS sales checkout.

| Field Name | Data Type | Constraint | Required | Default Value | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | UUID | Primary Key | Yes | Auto-generated | `a981c2de-3012...` | Unique identifier for the order invoice. |
| **tenant_id** | UUID | Foreign Key | Yes | None | `f38992ba-2023...` | Links to the parent Tenant organization. |
| **branch_id** | UUID | Foreign Key | Yes | None | `b0981a2e-4011...` | Links to the branch where the order was placed. |
| **cashier_id** | UUID | Foreign Key | Yes | None | `d720b08a-1123...` | Links to the cashier user who processed the order. |
| **order_number** | VARCHAR(30) | Unique | Yes | None | `INV-20260711-001` | Unique transaction invoice number. |
| **subtotal** | DECIMAL(12,2) | None | Yes | `0.00` | `10.50` | Total price before taxes and discounts. |
| **tax_amount** | DECIMAL(12,2) | None | Yes | `0.00` | `1.05` | Sales tax / VAT calculated. |
| **discount_total**| DECIMAL(12,2) | None | Yes | `0.00` | `0.50` | Total discount amount applied to the cart. |
| **grand_total** | DECIMAL(12,2) | None | Yes | `0.00` | `11.05` | Final invoice total. |
| **status** | VARCHAR(20) | None | Yes | `Pending` | `Completed` | Order status (`Pending`, `Paid`, `Completed`, `Voided`). |

---

## 3. Relationship Analysis

The system architecture defines the database relationships and constraints to enforce tenant isolation:

### Relationship 3.1: Tenant to Branch
*   **Entity A:** Tenant
*   **Relationship:** Has One or More
*   **Entity B:** Branch
*   **Relationship Type:** One-to-Many (1:N)
*   **Business Meaning:** A business tenant organization represents the corporate headquarters. It can configure and operate multiple physical branches, retail outlets, or warehouses.
*   **Data Dependency:** Cascading delete is blocked. The system must verify that a branch does not contain active inventory or sales records before it can be deleted.

### Relationship 3.2: Branch to User (Staff Assignment)
*   **Entity A:** Branch
*   **Relationship:** Employs
*   **Entity B:** User
*   **Relationship Type:** Many-to-Many (M:N)
*   **Business Meaning:** Employees can work at and access multiple physical store branches under the parent tenant organization.
*   **Data Dependency:** Managed using an association table (`UserBranchMapping`) containing foreign key mappings for `user_id` and `branch_id`.

### Relationship 3.3: Product to Category
*   **Entity A:** Product
*   **Relationship:** belongs to
*   **Entity B:** Category
*   **Relationship Type:** Many-to-One (N:1)
*   **Business Meaning:** Every menu item or retail product belongs to a specific category (e.g., Hot Coffee, Iced Coffee, Pastries) to organize POS screens.
*   **Data Dependency:** Category deletions must check if products are still assigned, preventing database integrity issues.

### Relationship 3.4: Order to OrderItem
*   **Entity A:** Order
*   **Relationship:** Contains
*   **Entity B:** OrderItem
*   **Relationship Type:** One-to-Many (1:N)
*   **Business Meaning:** A single checkout transaction invoice can contain multiple line items representing the products purchased.
*   **Data Dependency:** Enforces cascade-delete logic. Deleting an order invoice record (in non-production environments) must cascade and delete all linked line items.

---

## 4. ERD Design Specification

The Entity Relationship Diagram (ERD) defines the database structure and cardinality rules:

*   `Tenant` **1:N** `Branch` *(One Tenant owns many Branches)*
*   `Tenant` **1:N** `User` *(One Tenant registers many Users)*
*   `Tenant` **1:N** `Product` *(One Tenant configures many Products)*
*   `Tenant` **1:N** `Subscription` *(One Tenant pays for one or more Subscriptions)*
*   `Branch` **1:N** `Order` *(One Branch hosts many Orders)*
*   `Branch` **1:N** `Inventory` *(One Branch tracks stock for many Products)*
*   `User` **1:N** `Order` *(One Cashier user processes many Orders)*
*   `Order` **1:N** `OrderItem` *(One Order invoice contains many line Items)*
*   `Product` **1:N** `OrderItem` *(One Product is referenced in many line Items)*
*   `Order` **1:1** `Payment` *(One Order invoice maps to one Payment transaction)*
*   `Tenant` **1:N** `AuditLog` *(One Tenant logs many Audit records)*

---

## 5. Data Flow & Storage Analysis

This section maps data flows as they transit from entry interfaces to storage locations:

```
[ ENTRY INTERFACES ] ----( Input Data )----> [ API GATEWAY ] ----( Process Data )----> [ SQL DATABASE ]
Tablet POS, Web Portal,                      Rate limits and                          Multi-Tenant tables,
External APIs                                token validation                         RLS query scopes
                                                                                              │
                                                                                              ▼
[ LOG COLLECTORS ] <---( JSON Logs ) <--- [ APP SERVERS ] <---( CSV Export ) <--- [ DASHBOARD EXPORT ]
Activity logs and                         APM, request tracing,                       PDF and Excel reports
security audit trails                     audited modifications
```

### 5.1 Data Flow ID: DF-POS-01 (Process POS Sale)
*   **Source:** Touchscreen POS Client Terminal.
*   **Destination:** Database Server (Tables: `Order`, `OrderItem`, `Payment`, `Inventory`).
*   **Data Description:** Cart item IDs, quantity modifications, payment details, cashier identifiers, and branch scopes.
*   **Frequency:** Real-time, triggered upon customer checkout.

### 5.2 Data Flow ID: DF-REP-02 (Generate Z-Report)
*   **Source:** Backend Analytics Engine (Read-only Database Replicas).
*   **Destination:** Web Dashboard interface (Manager Portal) and Cloud Object Storage (PDF Invoice).
*   **Data Description:** Consolidated sales totals, payment mode cash counts, inventory waste summaries, and cashier shift audits.
*   **Frequency:** Daily, triggered upon cashier shift checkout.

---

## 6. Data Lifecycle Analysis

### 6.1 Entity: Product
*   **Creation:** Product records are created when a manager adds an item via the Web Portal interface.
*   **Modification:** Product details (pricing, variants, description fields) are updated when a manager edits settings. Historical prices are preserved in the audit log.
*   **Usage:** Product records are queried to populate the POS client checkout grids and calculate cart values.
*   **Archiving:** Deleted products are marked as inactive (`is_deleted = True`) to preserve historical sales records.
*   **Deletion:** Physical database deletions are blocked. The system uses soft-deletes to protect transactional database history.

### 6.2 Entity: Order
*   **Creation:** Order records are created when a cashier completes a sale.
*   **Modification:** Order statuses are updated from `Pending` to `Paid` upon payment verification. Completed transaction details are read-only.
*   **Usage:** Order data is queried to compile reporting dashboards and calculate cashier shift reports.
*   **Archiving:** Transaction records are archived to cold storage databases after 7 years for auditing.
*   **Deletion:** Deletion of order history records is blocked.

---

## 7. Data Validation Rules

### 7.1 Field Validation Rules
*   **Email Formats:** Emails must match standard validation structures (`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`).
*   **Pricing Ranges:** Product prices and invoice subtotals must be set to $\ge 0.00$.
*   **Identifier Format:** All primary keys (`id`) and reference mapping keys must be formatted as valid UUIDv4 strings.

### 7.2 Relationship Validation Rules
*   **Branch Constraints:** Branch creation requests must include a valid, active parent `tenant_id`.
*   **Order Mappings:** Transactions must fail if the system cannot verify the `cashier_id`, `branch_id`, or `tenant_id`.

### 7.3 Business Validation Rules
*   **Inventory Thresholds:** The system must block checkout checkouts if an item is out of stock, unless a manager overrides the warning.

---

## 8. Database Design Considerations

*   **Database Normalization:** Tables must be normalized to Third Normal Form (3NF) to eliminate data redundancy, while using read replicas to offload reporting queries.
*   **Data Integrity (RLS):** Relational databases must enforce Row-Level Security (RLS) policies scoped to the user's active tenant ID.
*   **Index Requirements:** The system must create indexes on foreign keys (`tenant_id`, `branch_id`) and search parameters (`barcode`, `order_number`) to ensure query times remain $\le 50\text{ ms}$.
*   **Transaction Consistency:** The system must use transactions to process sales, ensuring cart calculations and inventory deductions occur within a single database transaction.
*   **Backup & Security:** The system must run hourly backups of database schemas, storing data securely in AES-256 encrypted storage.

---

## 9. Data Dictionary Traceability Matrix

This matrix maps database entities to requirement definitions:

| Entity Name | Database Table | Related Requirement | Related Use Case | Business Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Tenant** | `Tenant` | FR-TEN-001: Create Org | UC-001: Register Account | BR-DAT-001 |
| **Branch** | `Branch` | FR-TEN-003: Manage Branch| UC-005: Setup Branch | BR-DAT-001 |
| **User** | `User` | FR-AUTH-001: User Register| UC-002: Authenticate | BR-USR-001 |
| **Product** | `Product` | FR-POS-PROD-001: Product | UC-007: Manage Product | BR-DAT-002 |
| **Order** | `Order` | FR-POS-ORD-001: Order | UC-008: Create Order | BR-TXN-001 |
| **OrderItem**| `OrderItem` | FR-POS-ORD-001: Order | UC-008: Create Order | BR-TXN-001 |
| **Payment** | `Payment` | FR-POS-PAY-002: Payment | UC-009: Process Payment | BR-FIN-002 |
| **AuditLog** | `AuditLog` | FR-AUD-001: User Log | All Use Cases | BR-TXN-002 |

---

## 10. Conclusion

This Data Dictionary and Data Model Analysis Document defines the database entities, tables, relationships, validation rules, and indexes for the platform. It provides a technical blueprint to ensure data isolation, consistency, and integrity.

With this analysis complete, the **System Analysis Phase** is finished. The engineering and database teams can now proceed to the **System Design Phase**, where these specifications will guide the implementation of SQL schemas, indexes, and database constraints.
