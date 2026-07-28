# ENTERPRISE SYSTEM ANALYSIS SPECIFICATION
## SYSTEM ANALYSIS FINAL REPORT

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal System Analyst, Enterprise Solution Architect & Technical Lead  
**Status:** Approved / Handover Ready  

---

## CHAPTER 1 — INTRODUCTION

### 1.1 System Background
The Enterprise SaaS Business Management Platform is a cloud-based operational hub designed for Small, Medium, and Micro Enterprises (SMMEs). The platform uses a multi-tenant model that allows merchants to run daily operations using modular applications. Phase 1 introduces the Coffee POS module as a foundation for F&B operations, with plans to expand to retail, pharmacy, and clinic industries.

### 1.2 Problem Statement
Small businesses face challenges from disconnected software systems, manual stock tracking, transaction reconciliation delays, cashier fraud risks, and high software fees. These issues impact business margins and limit operational scalability.

### 1.3 System Purpose
The platform serves as a unified operational engine that handles billing, identity, reporting, and organizational structures. It supports plug-and-play business modules, allowing merchants to manage multiple branches, process payments, and track inventory through a single user identity and billing profile.

### 1.4 Project Objectives
*   **Launch Year 1:** Deploy the Core Engine and Coffee POS module, onboarding 100+ active tenants.
*   **Ecosystem Expansion:** Launch Retail, Pharmacy, and Salon modules in Years 2-3.
*   **Scale Operations:** Onboard 5,000+ active tenants and maintain a 99.9% uptime target by Year 3.

### 1.5 Scope Definition
*   **In-Scope (Phase 1):** Tenant and Branch Registries, IAM Authentication, Coffee POS (Orders, Payments), Basic Inventory Management, and Shift Z-Reports.
*   **Out-of-Scope (Phase 1):** AI demand forecasting, developer SDKs, app marketplaces, and complex general ledger accounting modules.

### 1.6 Stakeholders Overview
*   **Internal:** Platform Owner, Product Managers, Development Team, and Technical Support Agents.
*   **External:** Tenant Business Owners, Store Managers, Cashiers, Inventory Staff, and End Customers.

---

## CHAPTER 2 — EXISTING SYSTEM ANALYSIS

### 2.1 Current System Description
Most target SMMEs operate using standalone cash registers, offline spreadsheet trackers, or single-terminal POS software. These configurations lack integration, meaning sales, stock levels, and staff shifts must be reconciled manually.

### 2.2 Existing Business Process
1.  **Sales checkout:** Cashier rings up sales and handles cash manually.
2.  **Inventory Tracking:** Staff perform manual weekly stock checks, recording counts in paper logs or spreadsheet cells.
3.  **Manager Audit:** Managers collect register paper receipts to calculate daily totals.

### 2.3 Current Problems
*   **Data Silos:** Sales and inventory data are disconnected, leading to out-of-stock events.
*   **Fraud Vulnerability:** The lack of secure cashier shift audit logs increases the risk of cash drawer discrepancies.
*   **No Multi-Branch Visibility:** Owners must visit branches in person to collect sales and operational reports.

### 2.4 Limitations & Improvement Opportunities
Legacy systems lack real-time synchronization, mobile responsiveness, and multi-tenant scaling. Implementing a unified cloud platform creates opportunities to automate inventory tracking, secure shift reconciliations, and centralize management across multiple branches.

---

## CHAPTER 3 — PROPOSED SYSTEM ANALYSIS

### 3.1 Proposed System Overview
The proposed platform features a core service layer (IAM, billing, settings) and an extensible application layer for industry-specific modules. It is designed to scale horizontally on cloud infrastructure and supports offline operations on client terminals.

### 3.2 System Goals
*   **Fast POS Transactions:** POS checkouts must calculate carts and log records in under 500 milliseconds.
*   **Tenant Data Separation:** Enforce logical data isolation across all shared databases using row-level security.
*   **Offline Operation:** POS clients must support local transaction caching to ensure continuity during internet outages.

### 3.3 Expected Benefits
*   **For Tenants:** Reduced licensing fees, automated inventory alerts, and real-time operational reports.
*   **For Platform Owners:** High-margin recurring subscription revenue, lower maintenance overheads, and future ecosystem expansion.

### 3.4 Major Features & System Boundaries
```
+-------------------------------------------------------------+
|                       SYSTEM BOUNDARY                       |
|                                                             |
|   +-------------------+              +------------------+   |
|   |   Identity (IAM)  |              |    Coffee POS    |   |
|   +-------------------+              +------------------+   |
|             │                                 │             |
|             ▼                                 ▼             |
|   +-------------------+              +------------------+   |
|   | Tenant Settings   |              | Inventory Manager|   |
|   +-------------------+              +------------------+   |
|             │                                 │             |
|             ▼                                 ▼             |
|   +-------------------+              +------------------+   |
|   | Billing Engine    |              |  Sales Ledger    |   |
|   +-------------------+              +------------------+   |
|                                                             |
+-------------------------------------------------------------+
```

---

## CHAPTER 4 — REQUIREMENT ANALYSIS

### 4.1 Functional Requirements (FRS)
*   **FR-AUTH-001 (Identity Management):** Secure logins, password complexity validations, and terminal PIN logins.
*   **FR-TEN-001 (Tenant Configurations):** Multi-branch registration, company settings, and local tax profiles.
*   **FR-SUB-001 (Billing Engine):** Subscription tier verification and payment gateways configurations.
*   **FR-POS-ORD-001 (POS checkout):** Item variant cataloging, cart tax calculations, and kitchen order routing.
*   **FR-POS-INV-001 (Inventory Management):** Recipe deductions and low-stock warning triggers.
*   **FR-AUD-001 (Security Auditing):** Immutable logging of administrative settings and price overrides.

### 4.2 Non-Functional Requirements (NFRS)
*   **Performance (NFR-PER-001):** API latency $\le 200\text{ ms}$ (reads), $\le 500\text{ ms}$ (writes). POS checkouts calculate in $\le 500\text{ ms}$.
*   **Scalability (NFR-SCA-001):** Horizontal scaling of application nodes, with database architectures scaling to support 100,000 active tenants.
*   **Availability (NFR-AVR-001):** Target monthly uptime of 99.9%. RTO $\le 4\text{ hours}$; RPO $\le 1\text{ hour}$.
*   **Security (NFR-SEC-001):** Tenant data isolation using row-level security, AES-256 data encryption at rest, and TLS 1.3 in transit.
*   **Usability (NFR-USA-001):** POS touch interface checkouts must complete in $\le 3\text{ screen taps}$. Support for Khmer Unicode localization.

---

## CHAPTER 5 — USER & SYSTEM INTERACTION ANALYSIS

### 5.1 Actor Identification
*   **Platform Administrator:** Manages global plans, provisions tenants, and monitors platform resources.
*   **Business Owner (Tenant Owner):** Full admin access to the tenant's workspace and billing settings.
*   **Business Manager:** Operates assigned branch workflows and approves inventory audits.
*   **Cashier:** processes transactions and reconciles register shifts.
*   **Payment Gateway (External):** Processes payment card charges.

### 5.2 Detailed Use Case Specification (UC-008: Create POS Order)
*   **Primary Actor:** Cashier.
*   **Pre-condition:** Cashier is logged in, and an active register shift is open.
*   **Main Success Flow:**
    1. Cashier adds menu items and modifiers to the cart.
    2. System calculates subtotals, tax components, and displays the total.
    3. Cashier selects the payment method (Credit Card) and submits the transaction.
    4. System routes the payment request to the Payment Gateway.
    5. Payment Gateway approves the transaction.
    6. System deducts the purchased items from inventory and logs the sales record.
*   **Post-condition:** The transaction is recorded in the ledger, and stock levels are adjusted.

---

## CHAPTER 6 — BUSINESS LOGIC ANALYSIS

### 6.1 Business Rules
*   **BR-USR-001:** Tenants must verify their email addresses before accessing workspace modules.
*   **BR-TXN-001:** Completed transaction records in the ledger are read-only and cannot be edited.
*   **BR-TXN-002:** Price overrides, refunds, and voids require manager PIN authorization.
*   **BR-DAT-001:** Database queries must verify tenant ID parameters to ensure data isolation.

### 6.2 Status Transition Rules (Order Entity)
```
[ PENDING ] ──( Payment Confirmed )──> [ PAID ] ──( Stock Deducted )──> [ COMPLETED ]
```

---

## CHAPTER 7 — DATA ANALYSIS

### 7.1 Entity Identification
*   **Tenant (`Tenant`):** Tenant organization profile.
*   **Branch (`Branch`):** Physical location details and tax configurations.
*   **User (`User`):** Identity, credentials, and session profiles.
*   **Product (`Product`):** Product descriptions, barcodes, and pricing.
*   **Order (`Order`):** Invoice header records.
*   **OrderItem (`OrderItem`):** Invoice line-item details.

### 7.2 Data Dictionary (Table: User)
| Field Name | Data Type | Constraint | Required | Default Value | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **id** | UUID | Primary Key | Yes | Auto-generated | `d720b08a-...` | Unique user identifier. |
| **tenant_id** | UUID | Foreign Key | Yes | None | `f38992ba-...` | Links to the Tenant organization. |
| **email** | VARCHAR(100) | Unique | Yes | None | `owner@brew.com` | User email address. |
| **password_hash**| VARCHAR(255) | None | Yes | None | `$argon2id$v...` | Hashed password. |
| **pin_hash** | VARCHAR(255) | None | No | Null | `$2b$12$...` | Hashed 4-digit PIN code. |

---

## 8. PROCESS ANALYSIS

### 8.1 Process Decomposition (PROC-005: Coffee POS Sales Checkout)
*   **Sub-Process 5.1 (Initialize Cart):** Cashier builds the cart, system calculates taxes, and computes the total.
*   **Sub-Process 5.2 (Process Payment):** Card transactions are routed to the payment gateway API for authorization.
*   **Sub-Process 5.3 (Deduct Inventory):** System updates ingredient stock levels based on product recipe mappings.
*   **Sub-Process 5.4 (Log Transaction):** Writes read-only sales records to database tables.

---

## 9. SYSTEM CONSTRAINT ANALYSIS

### 9.1 Technical Constraints
*   **CON-TEC-001 (Offline Browser Storage):** Client-side IndexedDB databases have memory limits (e.g., 50MB to 250MB depending on the device OS), restricting local image caches and historical sales logs.
*   **CON-TEC-002 (Data Isolation Overhead):** Validating tenant parameters on SQL query loops adds CPU overhead.

### 9.2 Integration & Regulatory Constraints
*   **CON-SEC-001 (PCI-DSS):** Platforms are prohibited from storing raw card numbers, requiring tokenized gateway widget integrations.
*   **CON-LEG-001 (GDT Cambodia):** Tax invoices must support Khmer Unicode formatting and meet official layout rules.

---

## 10. SECURITY ANALYSIS

### 10.1 Security Objectives
*   **Confidentiality:** Protect tenant databases and financial records from unauthorized access.
*   **Integrity:** Prevent unauthorized edits to sales invoices and stock counts.
*   **Authorization (RBAC):** Restrict user actions to permissions allowed by their assigned roles.

### 10.2 Security Threat Analysis
*   **THR-001 (Cross-Tenant Data Leakage):** Unauthorized access to other tenant's databases. *Mitigation:* Enforce SQL Row-Level Security (RLS).
*   **THR-002 (Brute-Force Authentication):** Attackers guessing login PINs. *Mitigation:* Suspend accounts for 15 minutes after 5 consecutive failed attempts.

---

## CHAPTER 11 — SYSTEM ANALYSIS SUMMARY

### 11.1 Major Findings
SMMEs require a secure, affordable cloud platform with multi-branch management capabilities. To ensure reliability in regional locations, the system must support offline operations on client terminals.

### 11.2 Key Requirements
The system must enforce strict multi-tenant isolation, achieve sub-500ms checkout times, and calculate inventory deductions automatically using recipe mappings.

### 11.3 Critical Decisions
*   **Modular Monolith Architecture:** Selected to keep hosting fees and deployment complexity low during Phase 1.
*   **Hybrid Tenant Database Model:** Use shared databases with RLS for Starter/Growth plans, and dedicated database engines for Enterprise clients.

### 11.4 Next Development Phase: System Design
With this requirements document finalized, the project is ready to transition to the **System Design Phase**. The next phase will define:
1.  **System Architecture Design:** Service boundary mappings, gateway setups, and communication protocols.
2.  **Database Schema Design:** Entity Relationship Diagrams (ERDs), table schemas, and index structures.
3.  **Application Design:** Backend API controllers, routing structures, and frontend components.

---

## TRACEABILITY RELATIONSHIP SPECIFICATION

This matrix traces requirements from business objectives to database structures:

| Business Objective | Functional Req | Use Case | Business Rule | Database Entity | System Component |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Reduce operational silos** | FR-POS-ORD-001 | UC-008: POS Order | BR-TXN-001: Read-Only | `Order`, `OrderItem` | POS Checkout Service |
| **Prevent cashier fraud** | FR-AUD-001 | UC-011: Shift Z-Report | BR-TXN-002: Overrides | `AuditLog` | Security Audit Engine |
| **Automate stock audits** | FR-POS-INV-001 | UC-012: Audit Stock | BR-DAT-002: Recipes | `Inventory` | Inventory Manager |
| **Secure client workspace** | FR-AUTH-001 | UC-002: Login | BR-USR-002: Lockout | `User` | Identity Service (IAM) |

---

## SYSTEM ANALYSIS CHECKLIST

```
[x] System Background & Objectives Defined (BRD Chapter 1)
[x] Existing System Problems Documented (Chapter 2)
[x] System Boundary and Scope Baselined (Chapter 3)
[x] FRS & NFRS Specifications Baselined (Chapter 4)
[x] Actors & Detailed Use Cases Specs Documented (Chapter 5)
[x] Business Rules & Status Transitions Defined (Chapter 6)
[x] Data Entities & Data Dictionary Baselined (Chapter 7)
[x] Input / Processing / Output Workflows Mapped (Chapter 8)
[x] Technical & Compliance Constraints Checked (Chapter 9)
[x] Security Threat Controls Formulated (Chapter 10)
[x] Traceability Matrix Maps Data to Core Components (Checklist Summary)
```

**Status:** HANDOVER TO SYSTEM DESIGN PHASE IS AUTHORIZED.
