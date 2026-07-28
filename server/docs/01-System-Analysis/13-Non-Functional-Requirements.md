# SOFTWARE REQUIREMENT SPECIFICATION (SRS)
## PART 7 — NON-FUNCTIONAL REQUIREMENT ANALYSIS

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Senior System Analyst, Enterprise Architect & Software Requirement Engineer  
**Status:** Under Review  

---

## 1. Performance Requirements

The platform must maintain high performance, especially during peak retail hours.

### NFR-PER-001: System Response Time
*   **Description:** The system must process standard read-write API requests quickly to ensure a responsive user experience.
*   **Priority:** High (Must Have)
*   **Target Metrics:**
    *   API read requests (GET): $\le 200\text{ ms}$ (95th percentile).
    *   API write requests (POST/PUT/DELETE): $\le 500\text{ ms}$ (95th percentile).
    *   Dashboard metric loads: $\le 1.5\text{ seconds}$.

### NFR-PER-002: Transaction Processing Speed
*   **Description:** The POS checkout process must calculate items, taxes, modifiers, and log the transaction in the ledger quickly.
*   **Priority:** High (Must Have)
*   **Target Metrics:** POS checkout transaction computation and ledger logging: $\le 500\text{ ms}$.

### NFR-PER-003: Concurrent User Handling
*   **Description:** The platform must support many simultaneous sessions across multiple tenant organizations without performance drops.
*   **Priority:** High (Must Have)
*   **Target Metrics:** Support at least **10,000 active concurrent user sessions** per second, scaling dynamically up to 100,000 sessions.

### NFR-PER-004: Request Processing Capacity
*   **Description:** The API Gateway must process incoming traffic and manage load-shedding during peak hours.
*   **Priority:** High (Must Have)
*   **Target Metrics:** The API Gateway must process a baseline of **2,000 HTTP requests per second (RPS)**, with a peak surge capability of 6,000 RPS.

### NFR-PER-005: Database Performance
*   **Description:** Database query execution times must be minimized, especially for reporting queries.
*   **Priority:** High (Must Have)
*   **Target Metrics:**
    *   Primary database write queries: $\le 100\text{ ms}$.
    *   Primary database read queries: $\le 50\text{ ms}$.
    *   Analytical reporting query execution (read replicas): $\le 3.0\text{ seconds}$.

### NFR-PER-006: Real-Time Communication
*   **Description:** Real-time data streams, such as kitchen order tickets or queue status changes, must display quickly.
*   **Priority:** Medium (Should Have)
*   **Target Metrics:** WebSocket message delivery latency: $\le 100\text{ ms}$ from source write to subscriber client display.

---

## 2. Scalability Requirements

The platform must support growth in tenants, users, and branches.

### NFR-SCA-001: Expected Growth Scope
*   **User/Tenant Growth:** The database and application layer must support growth from 1,000 tenants to **100,000 active tenants** over 3 years.
*   **Data Growth:** The storage architecture must support data volume growth of **1.2 TB of transactional data per year**, assuming automated database archiving configurations.
*   **Traffic Growth:** Network configurations must scale to handle peak bandwidth requirements of **50 Gbps** by Year 3.

### NFR-SCA-002: Horizontal Scaling
*   The application servers must be stateless.
*   The system must support auto-scaling (adding server instances) when CPU usage exceeds 70% or memory usage exceeds 75% for 3 consecutive minutes.

### NFR-SCA-003: Vertical Scaling
*   The system must support vertical scaling (adding CPU, RAM, or storage resources) for the database layer to handle increased transaction volumes and reporting queries.
*   Managed SQL database clusters must support online scaling of IOPS and memory parameters without database downtime.

### NFR-SCA-004: Load Balancing & Cloud Considerations
*   **Load Balancing:** Layer 7 load balancers must distribute incoming HTTP traffic across stateless application nodes using round-robin routing.
*   **Multi-Zone Infrastructure:** The platform must be deployed across at least three cloud availability zones in the primary deployment region.

---

## 3. Availability & Reliability Requirements

The platform must remain highly available to ensure merchants can run their daily operations.

### NFR-AVR-001: System Uptime
*   **Uptime SLA:** The platform must maintain a monthly uptime of **99.9%** ($3\text{ nines}$), allowing no more than 43 minutes of unscheduled downtime per month.
*   **Operating Hours Availability:** The platform must target **99.95% uptime** during business operating hours (06:00 to 22:00 local time).

### NFR-AVR-002: Backup Strategy
*   **Incremental Backups:** The system must run automated incremental backups of all tenant database schemas every hour.
*   **Full Backups:** The system must run daily full database backups, storing encrypted files in a separate cloud storage region for 30 days.

### NFR-AVR-003: Disaster Recovery & Fault Tolerance
*   **Recovery Objectives:**
    *   **Recovery Time Objective (RTO):** $\le 4\text{ hours}$ to restore full platform availability.
    *   **Recovery Point Objective (RPO):** $\le 1\text{ hour}$ of transactional data loss.
*   **Automated Failover:** The system must use multi-region deployment configurations with automated DNS failover, redirecting traffic to secondary regions within 5 minutes of a primary region outage.
*   **Fault Tolerance:** Component failures must be isolated. If the reporting dashboard is down, POS terminal transactions must continue to process.

---

## 4. Security Requirements

The system must protect multi-tenant workspaces, business data, and transaction details.

### 4.1 Authentication Security
*   **Password Hashing:** The system must hash all user password data using secure algorithms (e.g., Argon2id or bcrypt) before database storage.
*   **Multi-Factor Authentication (MFA):** The system must support MFA for administrative roles (Platform Admin, Tenant Owner).
*   **POS Terminal PINs:** Cashiers must be able to log in to POS terminals using a unique 4-digit PIN.
*   **Session Management:** The system must invalidate session tokens after 30 minutes of user inactivity.

### 4.2 Authorization Security
*   **Role-Based Access Control (RBAC):** The system must enforce RBAC validations on all API requests, verifying user roles and permissions before returning data.
*   **Tenant Data Isolation:** All database queries must include tenant ID checks to prevent unauthorized access to data from other tenant organizations.

### 4.3 Data Security
*   **Encryption in Transit:** All network communication must be encrypted using Transport Layer Security (TLS 1.3 or minimum TLS 1.2).
*   **Encryption at Rest:** All tenant databases, system configurations, and cloud files must be encrypted using AES-256 standards.
*   **PII Masking:** The system must mask sensitive information, such as credit card details (e.g., displaying only the last 4 digits), in logs and interfaces.

### 4.4 Application Security
*   **Input Validation:** The system must sanitize inputs to prevent common vulnerabilities, including SQL injection, Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF).
*   **Rate Limiting:** The API Gateway must limit client requests (e.g., maximum 100 requests per minute per IP address) to prevent Denial of Service (DoS) attacks.
*   **Audit Logging:** The system must maintain immutable audit logs tracking administrative actions, user authorization changes, manual stock adjustments, and refund transactions.

---

## 5. Usability Requirements

The user interface must be intuitive to minimize staff training times and checkout delays.

*   **NFR-USA-001: Touchscreen POS Flow:** The terminal checkout interface must be optimized for touchscreen tablets, requiring **no more than 3 taps** to complete a standard sale.
*   **NFR-USA-002: Tenant Onboarding Setup:** An onboarding wizard must guide new tenant owners through company, branch, and role setups in under 15 minutes.
*   **NFR-USA-003: Accessibility (WCAG):** The web portals must comply with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
*   **NFR-USA-004: Language Support:** The system must support multi-language interface translations, including **Khmer Unicode** and English.
*   **NFR-USA-005: Mobile Responsiveness:** The owner and manager dashboards must be responsive, displaying correctly on mobile devices, tablets, and desktop monitors.
*   **NFR-USA-006: Error Prevention:** Destructive actions (such as deletion or overrides) require double confirmations.

---

## 6. Maintainability Requirements

The codebase and infrastructure must be designed for updates and maintenance.

*   **NFR-MNT-001: Clean Code Coverage:** The engineering team must enforce code standards through automated testing pipelines, targetting at least **80% code coverage** for core services.
*   **NFR-MNT-002: Modular Architecture:** The application code must be modular, separating the platform core from individual industry modules to support code changes.
*   **NFR-MNT-003: Versioned API Documentation:** The system must use versioned API endpoints (e.g., `/api/v1/`) and automatically compile OpenAPI/Swagger documentation.
*   **NFR-MNT-004: Uniform Logging:** Stateless nodes must output logs in structured JSON formats to support APM and debugging tools.
*   **NFR-MNT-005: Testing Pipelines:** All code updates must pass automated security scans and integration tests before deployment to staging environments.
*   **NFR-MNT-006: Blue-Green Deployments:** The deployment pipeline must use blue-green deployment strategies to allow zero-downtime production updates.

---

## 7. Compatibility Requirements

The platform must support standard web browsers, operating systems, and hardware devices.

*   **Browser Compatibility:** The web portals must be compatible with Chrome, Safari, Firefox, and Edge (minimum current version and previous 2 releases).
*   **Mobile OS Compatibility:** The POS client application must run on iOS (version 15+) and Android (version 10+) tablet devices.
*   **Peripheral Hardware Support:** The system must support standard receipt printers, barcode scanners, and cash drawers using browser drivers.
*   **Integration Standards:** The platform integrations must connect with standard webhooks and JSON-REST payload structures.

---

## 8. Compliance Requirements

The platform must comply with standard financial and data privacy regulations:

*   **NFR-COM-001: Data Privacy Compliance:** The system must store and handle personal identifiable information (PII) in compliance with regional regulations (GDPR, CCPA).
*   **NFR-COM-002: Payment Processing Compliance:** The platform must use PCI-DSS compliant third-party gateways (e.g., Stripe) to capture and process payment card data, ensuring the platform does not store raw credit card numbers.
*   **NFR-COM-003: Immutable Financial Auditing:** The ledger must keep an immutable record of all transactions to support tax compliance audits.
*   **NFR-COM-004: Regional Cambodia Compliance:** The system must comply with the General Department of Taxation (GDT) requirements for official tax invoice printing and integrate with the Bakong (KHQR) payment system.

---

## 9. Non-Functional Requirement Traceability Matrix

This matrix maps NFR IDs to categories, priorities, measurements, and system components:

| Req ID | Category | Description | Priority | Measurement Criteria | Related Component |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NFR-PER-001** | Performance | API latency targets. | High | Latency $\le 200\text{ ms}$ (read), $\le 500\text{ ms}$ (write) under simulated load. | API Gateway & Core Services |
| **NFR-PER-002** | Performance | POS checkout transaction computation. | High | Transaction processing time $\le 500\text{ ms}$. | Coffee POS Module |
| **NFR-SCA-002** | Scalability | Auto-scaling stateless container instances. | High | Spin up new instances when CPU exceeds 70% for 3 mins. | Cloud Infrastructure / DevOps |
| **NFR-AVR-001** | Availability | Monthly platform uptime. | High | Monthly availability $\ge 99.9\%$. | Cloud Infrastructure / DevOps |
| **NFR-AVR-003** | Reliability | RTO / RPO disaster recovery metrics. | High | RTO $\le 4\text{ hours}$, RPO $\le 1\text{ hour}$ during drill testing. | Database & Cloud Backup Engine |
| **NFR-SEC-02** | Security | Enforce tenant data separation. | High | 100% database query tenant parameterization checks. | Database & SQL Query Layer |
| **NFR-SEC-03** | Security | Encrypt all data in transit and at rest. | High | Verify TLS 1.3 usage and AES-256 storage settings. | Infrastructure Security Layer |
| **NFR-USA-001** | Usability | POS touchscreen transaction. | Medium | Standard POS checkout completes in $\le 3\text{ taps}$. | Coffee POS Client |
| **NFR-MNT-001** | Maintainability | Automated code test coverage. | Medium | Automated CI/CD verification targets coverage $\ge 80\%$. | Core CI/CD Pipeline |
| **NFR-COM-004** | Compliance | Support local Cambodia market requirements. | High | Khmer language, Bakong payments, and GDT invoice printing. | Local Settings & POS Modules |
