# SYSTEM DESIGN SPECIFICATION
## PART 9 — SECURITY DESIGN

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal Security Architect & Enterprise Software Security Engineer  
**Status:** Under Review  

---

## 1. Security Architecture Overview
The security framework ensures data confidentiality, operational integrity, and high availability across the multi-tenant system. Key objectives include:
*   **Tenant Data Isolation:** Ensure tenants cannot access each other's data using PostgreSQL Row-Level Security (RLS).
*   **Secure API Communication:** Force all traffic over HTTPS TLS 1.3, terminating at the load balancer layer.
*   **Audit Accountability:** Maintain write-only audit logs for all security and financial transactions.

---

## 2. Identity & Authentication Design

### 2.1 Password Hashing & Storage
User passwords must never be stored in plaintext. The system uses the **Argon2id** hashing algorithm, configured with secure parameters:
*   **Memory Cost:** 64 MB (65,536 KB)
*   **Time Cost:** 3 iterations
*   **Parallelism:** 4 threads
*   **Unique Salt:** Generated per password using a secure random generator (minimum 16 bytes).

### 2.2 Stateless Session Management (JWT & Refresh Tokens)
1.  **Access Token (JWT):** Passed in the `Authorization: Bearer <token>` header. Contains the user's ID, role, tenant ID, and permissions array. Signed using RS256 with an asymmetric key pair. Expiration time: 15 minutes.
2.  **Refresh Token:** Long-lived secure cookie (valid for 7 days) configured with:
    *   `HttpOnly = true` (prevents access via client-side JavaScript)
    *   `Secure = true` (only transmitted over HTTPS)
    *   `SameSite = Strict` (blocks CSRF cross-origin access)
3.  **Token Rotation:** Every token refresh request replaces the active refresh token, mitigating token reuse risks.

---

## 3. Authorization & Tenant Isolation Design

### 3.1 Role-Based Access Control (RBAC)
The system uses role-based access control, checking scopes at the handler layer:
*   **Tenant Owner:** Full access to subscription setups, billing settings, user management, and branch reports.
*   **Store Manager:** Manage branch inventory, view register shifts, and check transactions.
*   **Store Cashier:** Open/close cash drawers, execute cart checkouts, and print receipts.

### 3.2 Row-Level Security (RLS) Implementation
PostgreSQL tables enforce Row-Level Security policies to maintain tenant isolation:
*   Enable RLS on tables containing tenant data.
*   Enforce the policy: `CREATE POLICY tenant_isolation_policy ON table FOR ALL TO authenticated USING (tenant_id = current_setting('app.current_tenant_id'));`
*   Verify that backend connection pools set this variable at the start of each query request context.

---

## 4. Data Encryption Design

*   **Encryption at Rest:**
    *   *Database Storage:* Encrypt database storage and backup snapshots using **AES-256** keys managed by AWS Key Management Service (KMS).
    *   *PII Columns:* Encrypt sensitive personal details (e.g., phone numbers, emails) at the application layer using AES-GCM before writing to the database.
*   **Encryption in Transit:**
    *   Enforce HTTPS TLS 1.3 for all external connections.
    *   Restrict internal VPC service-to-service communication to secure subnet routing protocols.

---

## 5. Network & Infrastructure Security

*   **VPC Subnet Separation:** Route databases, cache engines, and internal micro-services inside private VPC subnets. Expose only the Application Load Balancer to the public internet.
*   **API Gateway Security:**
    *   **Rate Limiting:** Enforce a limit of 100 requests per minute per IP address for standard API routes, and 10 requests per minute per IP for authentication routes (`/auth/login`).
    *   **Input Validation:** Validate JSON request schemas against DTO targets to prevent SQL injection and cross-site scripting (XSS).

---

## 6. Security Logging & Auditing

*   **Write-Only Audit Log Schema:**
    *   Log all security events (e.g., logins, password updates, permission changes) and POS shift adjustments to a write-only audit table.
    *   The audit database role must have `INSERT` and `SELECT` permissions; `UPDATE` and `DELETE` queries are blocked to prevent tampering.
*   **Log Structure:** Store the event category, user ID, tenant context, client IP address, change details (JSON), and correlation ID.

---

## 7. Conclusion
This Security Design Document defines the authentication, encryption, network, and auditing standards required to secure the SaaS platform. By using PostgreSQL RLS, Argon2id hashing, and stateless token rotation, we ensure that both business operations and tenant data remain secure and isolated.
