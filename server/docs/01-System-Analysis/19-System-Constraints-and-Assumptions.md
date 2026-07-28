# SOFTWARE REQUIREMENT SPECIFICATION (SRS)
## PART 12 â€” SYSTEM CONSTRAINT ANALYSIS

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Senior System Analyst, Enterprise Architect & Solution Designer  
**Status:** Under Review  

---

## 1. Constraint Identification

This section identifies the technical, business, and operational constraints that affect the design and implementation of the platform.

### CON-TEC-001: Browser Local Storage Limitations
*   **Constraint ID:** CON-TEC-001
*   **Constraint Name:** Browser Local Storage Limitations
*   **Category:** Technical Constraint
*   **Description:** The offline POS transaction cache must operate within browser storage limits (e.g., IndexedDB boundaries of 50MB to 250MB depending on the device OS).
*   **Impact:** Restricts offline sales logs, product catalogs, and image caches from growing indefinitely on the client terminal.
*   **Severity:** High
*   **Mitigation Strategy:** Implement automated database cleaning rules that remove completed, synchronized sales logs older than 7 days from browser memory, and compress product catalog assets.

### CON-TEC-002: Relational Database Tenant Isolation Overhead
*   **Constraint ID:** CON-TEC-002
*   **Constraint Name:** Relational Database Tenant Isolation Overhead
*   **Category:** Technical Constraint
*   **Description:** Row-level security (RLS) and query parameterization must verify tenant isolation on every SQL database execution.
*   **Impact:** Increases database CPU usage and query complexity.
*   **Severity:** High
*   **Mitigation Strategy:** Set up indexes on tenant ID columns across all transactional tables, and run automated query scans to identify security leaks.

### CON-BUS-001: Starter Plan Revenue/Infrastructure Cost Cap
*   **Constraint ID:** CON-BUS-001
*   **Constraint Name:** Starter Plan Revenue/Infrastructure Cost Cap
*   **Category:** Business Constraint
*   **Description:** The hosting and operational costs for Starter plan tenants must remain below $2.00 per month per tenant to maintain subscription margins.
*   **Impact:** Blocks assigning dedicated cloud databases or compute nodes to Starter tier accounts.
*   **Severity:** High
*   **Mitigation Strategy:** Run smaller plans on a shared database using RLS configurations, reserving dedicated database engines for Enterprise tier accounts.

### CON-SEC-001: PCI-DSS Compliance Boundaries
*   **Constraint ID:** CON-SEC-001
*   **Constraint Name:** PCI-DSS Compliance Boundaries
*   **Category:** Security Constraint
*   **Description:** The platform databases are prohibited from storing raw credit card details, CVVs, or pin codes.
*   **Impact:** Requires all card transactions to route through PCI-compliant external payment gateways (e.g., Stripe, Acleda bank connectors) using secure tokens.
*   **Severity:** Critical
*   **Mitigation Strategy:** Enforce API architectures where raw card inputs are handled by gateway widgets (e.g., Stripe Elements) on the client, returning transaction authorization tokens to the platform database.

### CON-DAT-001: Analytical Query Lock Contention
*   **Constraint ID:** CON-DAT-001
*   **Constraint Name:** Analytical Query Lock Contention
*   **Category:** Data Constraint
*   **Description:** Large analytical reports run by tenant managers must not lock operational tables used for checkout transactions.
*   **Impact:** May cause cashier checkout delays if reports block database transactions.
*   **Severity:** High
*   **Mitigation Strategy:** Set up database read replicas to process analytics and dashboard reporting queries, separating reporting traffic from checkout writes.

### CON-INT-001: Local Payment Gateway Webhook Dependencies
*   **Constraint ID:** CON-INT-001
*   **Constraint Name:** Local Payment Gateway Webhook Dependencies
*   **Category:** Integration Constraint
*   **Description:** POS mobile QR checkouts (e.g., Bakong/KHQR in Cambodia) depend on the external bank gateway sending a webhook notification to confirm payment.
*   **Impact:** Slow response times or outages from the bank's gateway can delay in-store checkouts.
*   **Severity:** Critical
*   **Mitigation Strategy:** Implement a dual confirmation design that allows cashier terminal apps to poll the payment status API directly if webhook notifications are delayed.

### CON-OPR-001: Zero Downtime Deployment Execution
*   **Constraint ID:** CON-OPR-001
*   **Constraint Name:** Zero Downtime Deployment Execution
*   **Category:** Operational Constraint
*   **Description:** Platform updates and database migrations must not disrupt active cashier checkout shifts.
*   **Impact:** Requires rolling database migrations and blue-green application deployments.
*   **Severity:** High
*   **Mitigation Strategy:** Use schema migrations that support backward compatibility (e.g., adding columns instead of renaming), and deploy updates using container orchestration during off-peak hours.

### CON-LEG-001: GDT Official Tax Invoice Format
*   **Constraint ID:** CON-LEG-001
*   **Constraint Name:** GDT Official Tax Invoice Format
*   **Category:** Legal & Compliance Constraint
*   **Description:** In Cambodia, official tax invoices must include specific fields in both Khmer and English languages, and comply with GDT layout standards.
*   **Impact:** POS terminal receipt generation templates must support Khmer Unicode text formatting.
*   **Severity:** High
*   **Mitigation Strategy:** Implement configurable receipt templates that support Khmer fonts and align layouts with GDT tax requirements.

---

## 2. Technical Constraints

*   **Programming Language & Framework Constraints:** The platform core must use compiled, type-safe runtimes (e.g., Go or Node.js with TypeScript) to ensure fast API execution and low resource usage on shared nodes.
*   **Database Constraints:** Managed database clusters must support native Row-Level Security (RLS) to enforce tenant data isolation.
*   **Network & Bandwidth Constraints:** Because internet connectivity can be unstable in regional locations, client interfaces must use compressed JSON payloads and support local browser caching.

---

## 3. Business Constraints

*   **Development Resources:** The initial system design must be manageable by a team of 5 developers. This constraint rules out complex microservice architectures for Phase 1.
*   **Subscription Pricing Caps:** Low subscription fees require keeping hosting costs minimal. Starter accounts must share database resources.

---

## 4. Security Constraints

*   **Data Access Constraints:** Support staff must only access configuration settings and system logs; they are blocked from viewing tenant transactional databases.
*   **Data Protection Constraints:** Backups and databases must be encrypted using AES-256 standards. Network traffic must require TLS 1.3 or minimum TLS 1.2 protocols.

---

## 5. Data Constraints

*   **Retention Constraints:** Transaction databases must keep invoice ledgers for at least 7 years to meet tax compliance audit rules.
*   **Migration Constraints:** Database schema updates must be backward-compatible to prevent data corruption across active tenant databases.

---

## 6. Integration Constraints

| Integration Target | External Dependency | Integration Constraint | System Impact |
| :--- | :--- | :--- | :--- |
| **Payment Gateways** | Stripe, Bakong APIs | Requires secure network handshakes and fast payment confirmations. | Gateway delays can increase checkout queue times. |
| **SMS/Email Services** | Twilio, SendGrid | Requires rate-limiting to manage API costs and prevent spam blocks. | Delays in delivery can impact user onboarding and password resets. |
| **Object Storage** | Cloud AWS S3 APIs | Requires secure token authorization to access uploaded assets. | Storage delays can slow down menu display loads. |

---

## 7. Operational Constraints

*   **Zero-Downtime Maintenance:** Database updates and software deployments must occur during off-peak hours (01:00 to 04:00 local time).
*   **System Performance Monitoring:** Container nodes must export health metrics to APM platforms (e.g., Datadog) to alert operations teams of performance issues.

---

## 8. Legal & Compliance Constraints

*   **Data Privacy Rules:** Personally Identifiable Information (PII) must be stored and processed in compliance with regional regulations (GDPR, CCPA).
*   **Local Tax Laws:** Receipt invoice generation must follow regional formats, tax calculations, and GDT standards in Cambodia.

---

## 9. Constraint Impact Analysis

This table maps identified constraints to their affected components, severity levels, and mitigations:

| Constraint ID | Category | Description | Affected Component | Severity Level | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CON-TEC-001** | Technical | Browser local storage limitations. | POS Offline Cache | High | Clean synchronized logs older than 7 days from IndexedDB memory. |
| **CON-BUS-001** | Business | Infrastructure cost caps for Starter plan. | Cloud Infrastructure | High | Share database engines using RLS, reserving dedicated databases for Enterprise plans. |
| **CON-SEC-001** | Security | PCI-DSS compliance boundaries. | Database Schema | Critical | Route payments through secure third-party gateway widgets (Stripe Elements). |
| **CON-DAT-001** | Data | Analytical query lock contention. | Core Database | High | Deploy read replicas to process analytics and reporting queries. |
| **CON-INT-001** | Integration | Local bank API gateway webhooks. | Payment Router | Critical | Cashier terminal app polls payment status API if webhooks are delayed. |
| **CON-LEG-001** | Legal | GDT tax invoice format rules. | Receipt Engine | High | Configure receipt templates that support Khmer Unicode fonts. |

---

## 10. Assumption Analysis

### ASS-001: Stable Power Infrastructure
*   **Description:** We assume that physical store branches have a stable power supply or battery backup systems to operate POS tablets and local receipt printers.
*   **Reason:** POS terminals require power to run local hardware, printers, and barcode scanners.
*   **Risk if incorrect:** Frequent power outages can halt store operations and damage local cache databases.

### ASS-002: Minimum Internet Connectivity
*   **Description:** We assume store locations have at least basic internet access (via Wi-Fi or 4G mobile networks) to synchronize cached offline sales transactions.
*   **Reason:** The system uses cloud databases for centralized sales reporting and inventory tracking.
*   **Risk if incorrect:** Prolonged offline status can cause inventory data to become outdated, leading to stock tracking discrepancies across branches.

### ASS-003: Basic Staff Technical Skills
*   **Description:** We assume cashiers and store staff have basic technical skills required to navigate touchscreen tablet applications.
*   **Reason:** POS clients are designed as app interfaces.
*   **Risk if incorrect:** Staff errors can lead to transaction entry mistakes and slow down checkout lines.

---

## 11. Conclusion

This System Constraint Analysis Document defines the technical, business, and legal limitations that affect the design and implementation of the platform. It provides developers and architects with a reference for system boundaries, external dependencies, and risk mitigation strategies.

With these constraints analyzed, the **System Analysis Phase** is finished. The engineering and architecture teams can now proceed to the **System Design Phase**, where these constraints will guide the database schema design, application layer routing, and deployment setup.


# SYSTEM CONSTRAINTS AND ASSUMPTIONS ANALYSIS DOCUMENT

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Senior Business Analyst, Enterprise Solution Architect & Project Planning Specialist  
**Status:** Under Review  

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Project Assumptions](#2-project-assumptions)
3. [System Constraints](#3-system-constraints)
4. [Dependency Analysis](#4-dependency-analysis)
5. [Risks Caused by Constraints](#5-risks-caused-by-constraints)
6. [Decision Boundaries](#6-decision-boundaries)
7. [Constraint vs. Assumption Matrix](#7-constraint-vs-assumption-matrix)
8. [Validation Requirements](#8-validation-requirements)
9. [Conclusion](#9-conclusion)

---

## 1. Introduction

### 1.1 Purpose of Identifying Constraints and Assumptions
The purpose of identifying constraints and assumptions is to document the parameters and boundaries that influence system planning. Assumptions represent facts taken to be true without proof, while constraints are real-world limitations that restrict system design.

### 1.2 Importance in System Planning
Identifying these factors early:
*   Reduces planning errors by aligning system expectations with technical and operational realities.
*   Enforces risk management by highlighting potential system bottlenecks.
*   Provides clear boundaries for the technical architecture and product roadmap.

### 1.3 Impact on Architecture and Project Decisions
Architectural choices (e.g., local database caching, offline transaction synchronization) are directly driven by constraints like local network stability. Similarly, integration interfaces are designed based on assumptions regarding the reliability of third-party APIs.

---

## 2. Project Assumptions

These assumptions are the foundation of our current product strategy. If any of these assumptions prove false, the system design must be reviewed.

### 2.1 Business Assumptions
*   **Adoption of Cloud Software:** Target business owners are willing to transition from legacy, on-premise solutions or paper ledgers to a cloud-based SaaS platform.
*   **Centralized Operational Need:** Multi-branch operators require a single, centralized database to run consolidated reporting and manage employees.
*   **Subscription Acceptance:** The subscription pricing model is acceptable to merchants in our target markets.
*   **Accuracy of Onboarding Data:** Onboarding tenants will provide valid business registration information, tax identification numbers, and contact details.

### 2.2 User Assumptions
*   **Basic Technical Knowledge:** Front-line staff (e.g., cashiers, baristas) possess the basic technical skills required to operate a touchscreen tablet interface.
*   **Internet Access Availability:** Store managers and owners have access to standard web browsers on their local hardware.
*   **Self-Service Administration:** Business Owners will manage their own employee profiles, roles, and branch assignments.

### 2.3 Operational Assumptions
*   **Daily Data Management:** Merchants will log checkout sales, inventory restocks, and wastage events on a daily basis.
*   **Standardized Workflows:** Front-line staff will follow standard workflows (e.g., opening and closing cashier drawers, logging Z-reports at shift end).
*   **Process Standardization:** Basic operational workflows (such as inventory deductions and checkouts) can be standardized across similar business domains.

### 2.4 Technology Assumptions
*   **Cloud Infrastructure Availability:** Major managed cloud infrastructure hosts (AWS, GCP, Azure) maintain service availability.
*   **Stable External APIs:** External payment gateways (Stripe), email engines (SendGrid), and SMS dispatch APIs (Twilio) provide stable APIs and prompt webhook responses.
*   **Hardware Compatibility:** Standard client tablet hardware supports standard web browser applications.

### 2.5 Integration Assumptions
*   **Payment Gateways:** Third-party payment gateways support standard merchant billing operations and secure checkout card routing.
*   **SMS Providers:** Gateway services can deliver OTP authentication codes and receipt link SMS notifications globally without carrier blocks.
*   **Email Services:** Dispatch engines maintain clean delivery domains to prevent invoices and invitations from routing to spam folders.

---

## 3. System Constraints

Constraints represent real-world limits that restrict system design and implementation options.

```
       +-------------------------------------------------------+
       |                  SYSTEM CONSTRAINTS                   |
       +-------------------------------------------------------+
                                  |
         +------------------------+------------------------+
         |                        |                        |
         v                        v                        v
  [ BUSINESS & PERFORMANCE ]   [ REGIONAL CONSTRAINTS ]   [ SECURITY & AUDIT ]
  Budget, latency limits,      Khmer UI, Bakong (KHQR)    PII laws, database
  and device limitations.      sync, and offline fallback. tenant isolation.
```

### 3.1 Business Constraints
*   **Pricing Sensitivity:** The starter plan fee ($29/month) limits structural margins, requiring optimized cloud compute resources to manage operational costs.
*   **Development Timeline:** The core platform and the initial Coffee POS module must be delivered within the designated release cycle.

### 3.2 Technical Constraints
*   **Stateless Execution:** Front-end application interfaces must run on standard browsers without requiring local custom software installations.
*   **Hardware Limitations:** Tablet devices used by merchants may have limited CPU and memory resources, requiring lightweight POS client code.

### 3.3 Security & Compliance Constraints
*   **Tenant Separation:** The database query layers must enforce tenant isolation, ensuring no user can read or write data belonging to another tenant.
*   **Data Protection Laws:** Customer and employee PII must be stored and processed in compliance with regional privacy laws (GDPR, CCPA).
*   **Financial Compliance:** The ledger must compile transaction logs in a read-only format to support tax compliance audits.

### 3.4 Performance Constraints
*   **Response Latency:** Point-of-sale checkouts must complete in under 2 seconds.
*   **Concurrent Scaling:** The database engine must handle at least 1,000 writes per second during peak holiday sales.

### 3.5 Operational Constraints
*   **Support Schedule:** Support staff must be available 24/7 to resolve POS terminal and billing checkout issues.
*   **Maintenance Windows:** System updates must be scheduled during low-traffic hours (01:00 to 04:00 local time).

### 3.6 Regional Constraints (Southeast Asia Focus)
*   **Cambodia Market Requirements:** The system must comply with the General Department of Taxation (GDT) requirements for official tax invoice printing.
*   **Local Payment Integrations:** The platform must integrate with local payment gateways, including **Bakong (KHQR)**, Wing, ACLEDA, and Pi Pay.
*   **Local Language Support:** All front-line POS client interfaces and printed receipts must support both **Khmer Unicode** and English.
*   **Internet Reliability Variations:** Outside major cities (Phnom Penh, Siem Reap), internet connectivity may be unstable, requiring local caching and offline POS operations.

---

## 4. Dependency Analysis

The platform relies on several internal and external dependencies to complete core workflows:

```
[ Authentication Core ] -------> Depends on ------> [ User Directory & Permissions ]
[ POS Sales Processing ] -----> Depends on ------> [ Product Catalogs & Modifiers ]
[ Financial Reporting ] -------> Depends on ------> [ Ledger Transaction History ]

================================== [ SYSTEM BOUNDARY ] ==================================

[ SaaS Platform Core ] -------> Integrates with -> [ Stripe Payment Processing API ]
                       -------> Integrates with -> [ Twilio SMS Gateway OTP Service ]
                       -------> Integrates with -> [ Cloud Storage Asset Bucket ]
```

### 4.1 Internal Dependencies
*   **Authentication & Access Control:** Every user session validation depends on the status of the parent Tenant Organization and active permissions in the User Directory.
*   **POS Sales Processing:** The checkout cart calculator depends on configurations in the Product Catalog and Modifier settings.
*   **Financial Reporting:** Reporting and dashboard summaries depend on transaction logs in the Ledger database.

### 4.2 External Dependencies
*   **Payment Gateways:** Subscription billing and POS card transactions depend on external Payment Gateway availability.
*   **SMS & Email Gateways:** Staff invitations and security OTPs depend on the availability of SMS and Email services.
*   **Cloud Infrastructure:** Data storage, backups, and compute instances depend on the underlying cloud host provider.

---

## 5. Risks Caused by Constraints

| Constraint Identified | Potential Business Impact | Risk Level | Possible Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Internet Instability** (Regional) | POS checkout fails when the connection drops, blocking sales. | **High** | Implement local browser database caching, allowing sales to continue offline and sync once connected. |
| **Local Payment Complexity** (Bakong/Wing) | Merchants cannot accept digital payments, causing customer churn. | **High** | Build a modular payment adapter service to support both international and local payment options. |
| **Multi-Tenant Data Leakage** | A security breach exposes customer data across tenant workspaces. | **Critical** | Enforce database tenant isolation and run automated security checks. |
| **Pricing Limitations** ($29/month plan) | Infrastructure costs exceed tenant subscription revenues. | **Medium** | Use stateless containers and database connection pooling to minimize cloud resource consumption. |

---

## 6. Decision Boundaries

This section defines architectural and product decisions that are deferred to later phases:

*   **Database Strategy:** Deciding between a single database with tenant ID columns vs. separate databases for each tenant to balance isolation security against operational costs.
*   **Cloud Provider Selection:** Selecting the primary cloud host (AWS vs. GCP) based on local data centers and region pricing.
*   **Subscription Pricing Tiers:** Adjusting feature limits for subscription plans based on pilot merchant feedback.
*   **Mobile Application Strategy:** Selecting the development approach (e.g., React Native vs. Swift/Kotlin) for native tablet applications.
*   **Integration Partners:** Identifying local SMS and email gateways for regional markets.

---

## 7. Constraint vs. Assumption Matrix

This matrix maps planning constraints and assumptions, analyzing their impact and priority.

| Type | Name / Description | System Impact | Priority |
| :--- | :--- | :--- | :--- |
| **Constraint** | Internet instability in regional markets. | Blocks real-time sales transactions if the system does not support offline caching. | High |
| **Constraint** | 100% tenant data separation. | Dictates database query patterns and security layers. | High |
| **Assumption** | Merchants accept the subscription billing model. | Governs the platform's revenue projections. | High |
| **Constraint** | Khmer language and Unicode support. | Affects character rendering on interfaces and receipt printers. | Medium |
| **Assumption** | Front-line employees have basic technical skills. | Influences the design complexity of POS touchscreen interfaces. | Medium |
| **Assumption** | External SMS APIs maintain 99.9% uptime. | Affects login speeds and security verification workflows. | Low |

---

## 8. Validation Requirements

Assumptions and constraints must be reviewed and validated at key project milestones:

### 8.1 Business Review
*   **Cadence:** Quarterly.
*   **Focus:** Validate pricing acceptance, subscription tiers, and local business partnerships.

### 8.2 Technical Review
*   **Cadence:** Prior to architecture sign-off.
*   **Focus:** Validate database isolation designs, local payment integrations, and offline caching performance.

### 8.3 Security Review
*   **Cadence:** Prior to production release.
*   **Focus:** Audit tenant separation rules, data encryption settings, and security logs.

### 8.4 Stakeholder Approval
*   **Requirement:** Formal approval of the Constraints and Assumptions document by project sponsors and tech leads before proceeding to database design.

---

## 9. Conclusion

This System Constraints and Assumptions Analysis Document defines the business, technical, and regional parameters that guide system planning. It maps the platform's dependencies, analyzes risks, and outlines the decisions required to implement these specifications.

With this analysis complete, the platform's business requirements, system scope, use cases, workflows, and specifications are documented. The product and engineering teams can now proceed to the **System Architecture and Database Design** phase, using these documents as the reference specifications for implementation.

