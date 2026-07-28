# DEPLOYMENT SPECIFICATION
## PART 6 — SSL, DOMAIN & NETWORK SECURITY SETUP

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Cloud Security Architect & Network Infrastructure Engineer  
**Status:** Approved  

---

## 1. Domain & Network Overview

### 1.1 Domain Management Objectives
Secure, correctly configured domains are the public entry point for every merchant, cashier, and administrator who interacts with the platform. Domain and network configuration failures have direct operational consequences:

*   **Security:** Misconfigured TLS or missing HSTS headers expose authentication tokens and payment data to interception.
*   **Trust:** A valid, correctly chained SSL certificate is the browser's signal to the merchant that the platform is trustworthy. An expired or invalid certificate causes browser security warnings that drive merchants away.
*   **Availability:** Incorrect DNS routing or missing health checks can black-hole traffic and take the platform offline without any infrastructure failure.
*   **Performance:** Optimally configured CDN edge routing and HTTP/2 on the ALB reduce page load times and API response latency for geographically distributed merchants.

---

## 2. Domain Architecture Design

### 2.1 Subdomain Topology

| Subdomain | Purpose | Target Service | Public? |
| :--- | :--- | :--- | :--- |
| `saas-platform.com` | Root domain — marketing & documentation site | S3 static site / CloudFront | ✅ Public |
| `app.saas-platform.com` | Merchant web admin portal (Next.js) | ALB → ECS Next.js tasks | ✅ Public |
| `api.saas-platform.com` | REST API for all frontend and mobile clients | ALB → ECS Go API tasks | ✅ Public |
| `staging.saas-platform.com` | Staging web portal (UAT access) | Staging ALB | 🔒 Restricted (IP allowlist) |
| `staging-api.saas-platform.com` | Staging API (CI/CD + UAT testing) | Staging ALB | 🔒 Restricted (IP allowlist) |
| `grafana.saas-platform.com` | Grafana APM monitoring dashboard | Internal ALB (VPN-only) | 🔒 Private (VPN) |

### 2.2 Security Considerations Per Subdomain

*   **`app.` and `api.`:** Protected by AWS WAF, HTTPS-only, HSTS enforced.
*   **`staging.*`:** IP allowlist restricts access to the DevOps team, QA engineers, and PO office IPs only.
*   **`grafana.`:** Accessible only from the corporate VPN IP range; not reachable from the internet.

---

## 3. DNS Architecture Strategy

### 3.1 DNS Provider: AWS Route 53
AWS Route 53 is the authoritative DNS service. All domain records are managed as Infrastructure-as-Code (Terraform Route 53 resources).

### 3.2 DNS Record Types

| Record Type | Usage in this Project |
| :--- | :--- |
| **A (Alias)** | `app.saas-platform.com` → ALB DNS name (Route 53 Alias record) |
| **A (Alias)** | `api.saas-platform.com` → ALB DNS name (Route 53 Alias record) |
| **CNAME** | `www.saas-platform.com` → `saas-platform.com` (canonical redirect) |
| **TXT** | Domain ownership validation for ACM certificate issuance |
| **MX** | Mail exchange records for transactional email (SES / SendGrid) |
| **CAA** | Restricts which Certificate Authorities may issue certs for this domain |

### 3.3 Environment DNS Separation

| Environment | DNS Pattern | Routing Target | Access |
| :--- | :--- | :--- | :--- |
| **Local Dev** | `localhost` / `*.local` | Docker Compose (127.0.0.1) | Developer machine only |
| **QA / Testing** | CI ephemeral (no public DNS) | CI container network | CI pipeline only |
| **Staging** | `staging.saas-platform.com` | Staging ALB (IP allowlisted WAF rule) | DevOps + QA team |
| **Production** | `app.saas-platform.com`, `api.saas-platform.com` | Production ALB | Public |

### 3.4 DNS TTL Strategy
*   **Standard TTL:** 300 seconds (5 minutes) for all production records — allows reasonably fast DNS propagation during incident failover without excessive DNS query load.
*   **Pre-Deployment TTL Reduction:** Before any DNS change, TTL is reduced to 60 seconds at least 10 minutes in advance to minimize client cache staleness during the cutover window.

---

## 4. SSL/TLS Certificate Strategy

### 4.1 Certificate Provider: AWS Certificate Manager (ACM)
All SSL/TLS certificates are provisioned and managed by AWS Certificate Manager. ACM certificates are free, automatically renewed, and natively integrated with ALB, CloudFront, and API Gateway.

### 4.2 Certificate Scope

| Certificate | Covers | Method | Renewal |
| :--- | :--- | :--- | :--- |
| Production wildcard | `*.saas-platform.com`, `saas-platform.com` | DNS validation via Route 53 TXT record | Auto-renewed by ACM (60 days before expiry) |
| Staging certificate | `*.staging.saas-platform.com` | DNS validation via Route 53 TXT record | Auto-renewed by ACM |

### 4.3 Certificate Lifecycle

```
[ REQUEST ]
 ACM issues a certificate signing request for the domain
         │
         ▼
[ DOMAIN VALIDATION ]
 ACM creates a CNAME DNS record in Route 53
 DNS validation confirms domain ownership automatically
         │
         ▼
[ CERTIFICATE ISSUED ]
 ACM stores the certificate; certificate ARN is referenced
 in ALB HTTPS listener configuration
         │
         ▼
[ RENEWAL ]
 ACM automatically renews the certificate 60 days before expiry
 No manual action required; renewal is zero-downtime
         │
         ▼
[ MONITORING ]
 CloudWatch tracks certificate expiry days remaining
 Alert fires if < 30 days remain (safety net for auto-renewal failures)
```

---

## 5. HTTPS Security Configuration

### 5.1 TLS Protocol Standards

| Parameter | Configuration | Rationale |
| :--- | :--- | :--- |
| **Minimum TLS Version** | TLS 1.2 | Rejects SSLv3, TLS 1.0, TLS 1.1 (deprecated, vulnerable) |
| **Preferred TLS Version** | TLS 1.3 | Strongest available; reduced handshake latency |
| **ALB Security Policy** | `ELBSecurityPolicy-TLS13-1-2-2021-06` | AWS-managed cipher suite; TLS 1.3 preferred, 1.2 fallback |
| **HTTP/2** | Enabled | Multiplexed streams; lower latency for Next.js asset loading |

### 5.2 Required HTTP Security Response Headers

| Header | Value | Purpose |
| :--- | :--- | :--- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Prevents protocol downgrade to HTTP; submits domain to HSTS preload list |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'` (strict policy) | Prevents cross-site scripting (XSS) by whitelisting content sources |
| `X-Frame-Options` | `DENY` | Prevents clickjacking by blocking iframe embedding |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information sent to third parties |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser APIs |

### 5.3 How HTTPS Protects the Platform
*   **User Data:** All form submissions (login credentials, product data, payment details) are encrypted in transit using AES-256-GCM cipher suites.
*   **Authentication:** JWT access tokens in `Authorization` headers and HttpOnly refresh token cookies are protected from interception by TLS.
*   **API Communication:** Mobile POS devices communicate with `api.saas-platform.com` over TLS 1.3, preventing transaction data interception on merchant Wi-Fi networks.

---

## 6. Reverse Proxy Security Design

The AWS Application Load Balancer (ALB) serves as the production reverse proxy:

*   **SSL/TLS Termination:** The ALB terminates TLS using the ACM certificate. Backend ECS tasks communicate with the ALB over plain HTTP within the private VPC subnet — no internal self-signed certificates are needed.
*   **HTTP → HTTPS Enforcement:** An ALB listener on port 80 issues a permanent `301 Moved Permanently` redirect to the HTTPS equivalent URL. No plaintext traffic reaches the application.
*   **Path-Based Routing:**
    *   `/api/*` requests are forwarded to the Go API ECS target group (port 8080).
    *   All other paths are forwarded to the Next.js SSR ECS target group (port 3000).
*   **Traffic Filtering:** AWS WAF is associated with the ALB and filters all inbound requests before they are forwarded to target groups.
*   **Backend Service Protection:** No ECS container, RDS instance, or ElastiCache node has a direct public IP address. The ALB is the sole internet-facing entry point.

---

## 7. Network Security Architecture

The VPC is structured in distinct security tiers:

```
[ INTERNET ]
       │
       ▼
[ AWS WAF ] (SQL injection, XSS, rate-limit rules)
       │
       ▼
[ PUBLIC SUBNET: 10.0.1.0/24 ]
 ├── Application Load Balancer (ALB) — port 443 open to internet
 └── NAT Gateway — outbound-only internet for private subnet
       │
       ▼
[ PRIVATE SUBNET: 10.0.2.0/24 ]
 ├── ECS Fargate Go API tasks (port 8080 — ALB SG only)
 ├── ECS Fargate Next.js tasks (port 3000 — ALB SG only)
 ├── ElastiCache Redis (port 6379 — ECS SG only)
 └── pgBouncer sidecar (port 6432 — ECS SG only)
       │
       ▼
[ DATABASE SUBNET: 10.0.3.0/24 ]
 └── RDS PostgreSQL (port 5432 — ECS SG only; no internet route)
```

*   The database subnet has **no route to the internet gateway**. RDS is unreachable from outside the VPC.
*   The NAT Gateway allows ECS containers to make outbound calls (e.g., Stripe API, Bakong gateway) without exposing inbound ports.

---

## 8. Firewall & Access Control Strategy

### 8.1 Security Group Rule Matrix

| Security Group | Inbound Allowed | Source | Outbound |
| :--- | :--- | :--- | :--- |
| **ALB-SG** | HTTPS (443) | 0.0.0.0/0 (internet) | Port 8080, 3000 to ECS-SG |
| **ECS-SG** | Port 8080, 3000 | ALB-SG only | Port 5432 to RDS-SG; Port 6379 to Redis-SG; HTTPS 443 to internet (via NAT) |
| **RDS-SG** | Port 5432 | ECS-SG only | None |
| **Redis-SG** | Port 6379 | ECS-SG only | None |
| **Bastion-SG** | Port 22 | VPN IP range only | Port 5432 to RDS-SG (emergency access) |

### 8.2 Principle of Minimum Required Access
*   Every security group allows the minimum set of ports from the minimum set of sources.
*   No security group uses `0.0.0.0/0` as an inbound source except the ALB on port 443.
*   All security group rules are defined in Terraform; manual console changes are blocked by an AWS Config rule.

---

## 9. API Security Through the Network Layer

*   **AWS WAF Rule Groups:** The WAF associated with the ALB applies the following rule sets:
    *   AWS Managed Rules — Common Rule Set (CRS): Blocks common web exploits.
    *   AWS Managed Rules — SQL Database Rule Set: Blocks SQL injection patterns.
    *   AWS Managed Rules — Known Bad Inputs: Blocks known-malicious user-agents and path patterns.
    *   Rate-Based Rule: Blocks IPs sending more than 2,000 requests per 5-minute window.
*   **API Endpoint Exposure Control:** Only `/api/v1/*` paths are exposed externally via the ALB. Internal service-to-service calls (e.g., pgBouncer to RDS) use private subnet DNS and never leave the VPC.
*   **Request Monitoring:** AWS WAF logs all blocked requests to CloudWatch Logs. Security dashboards aggregate WAF block counts by rule group and source IP.

---

## 10. Environment Network Separation

| Environment | Network Boundary | Cross-Environment Access | Justification |
| :--- | :--- | :--- | :--- |
| **Local Dev** | Docker bridge network (isolated to developer laptop) | None | Developer experiments cannot affect shared infrastructure |
| **QA / Testing** | Separate VPC (or isolated subnets in a shared non-prod VPC) | None to staging or production | Automated test failures cannot corrupt staging data |
| **Staging** | Shared non-prod VPC; separate subnets from QA | None to production | UAT testers cannot access or modify production RDS |
| **Production** | Dedicated production VPC | None to non-prod | A production incident cannot propagate to testing environments |

*   VPC Peering is **not established** between the production VPC and any non-production VPC.
*   Cross-account IAM roles are used if any CI/CD jobs must read from production S3 (e.g., anonymizing a production data export to staging).

---

## 11. Domain Security Management

*   **Domain Registrar MFA:** The domain registrar account requires hardware MFA for all administrative actions, including nameserver changes.
*   **Registrar Lock (Transfer Lock):** Domain transfer lock is enabled on the registrar to prevent unauthorized domain hijacking.
*   **CAA DNS Record:** A Certification Authority Authorization (CAA) record restricts certificate issuance to AWS Certificate Manager only. Unauthorized CAs cannot issue fraudulent certificates for the domain.
*   **DNSSEC:** Route 53 DNSSEC signing is evaluated for enablement to protect against DNS spoofing and cache poisoning attacks on the domain.
*   **Renewal Management:** Domain registration expiry is tracked; the domain is set to auto-renew at least 30 days before expiry. A CloudWatch Event fires an alert 90 days before the domain registration expires.

---

## 12. SSL Monitoring & Renewal Strategy

### 12.1 Certificate Expiry Monitoring

| Alert Threshold | Notification Channel | Responsible Team |
| :--- | :--- | :--- |
| Certificate expires in $\le 30\text{ days}$ | PagerDuty + Slack | DevOps on-call |
| Certificate expires in $\le 14\text{ days}$ | PagerDuty (high severity) | DevOps Lead + Security Lead |
| Certificate expires in $\le 7\text{ days}$ | PagerDuty (P1) | CTO + DevOps Lead |

*   ACM auto-renewal handles the standard renewal cycle. These alerts serve as a safety net if auto-renewal fails (e.g., due to DNS validation record removal or ACM service disruption).

### 12.2 Renewal Process for ACM Failure
1.  DevOps engineer identifies the failed renewal in ACM console.
2.  Verify that the Route 53 CNAME validation record still exists.
3.  Re-trigger validation from the ACM console.
4.  Confirm the new certificate is issued and associated with the ALB listener.
5.  Document the incident and root cause.

---

## 13. Network Monitoring Strategy

| Metric | Monitoring Tool | Threshold | Alert |
| :--- | :--- | :--- | :--- |
| ALB Active Connection Count | CloudWatch | Unusual spike ($\ge 10\times$ baseline) | Slack + WAF review |
| ALB 4xx Rate | CloudWatch | $\ge 5\%$ of requests | Slack |
| ALB 5xx Rate | CloudWatch | $\ge 1\%$ of requests | PagerDuty |
| WAF Blocked Requests | CloudWatch WAF | $\ge 500$ blocks/minute | Slack (potential attack) |
| VPC Flow Logs — Rejected Traffic | CloudWatch Insights | Significant volume from single IP | Security team investigation |
| Certificate Expiry Days | CloudWatch / ACM | $\le 30\text{ days}$ | PagerDuty |
| NAT Gateway Error Rate | CloudWatch | $\ge 1\%$ | Slack |

---

## 14. SSL & Domain Deployment Workflow

```
[ DOMAIN REGISTRATION ]
 Register saas-platform.com at domain registrar
 Enable transfer lock and MFA on registrar account
         │
         ▼
[ ROUTE 53 HOSTED ZONE CREATION ]
 Create public hosted zone in Route 53
 Update registrar nameservers to Route 53 NS records
         │
         ▼
[ DNS RECORD CONFIGURATION ]
 Create A-Alias records for app.* and api.* pointing to ALB
 Create CAA record restricting issuance to Amazon CA
         │
         ▼
[ ACM CERTIFICATE REQUEST ]
 Request wildcard certificate for *.saas-platform.com
 ACM creates DNS validation CNAME in Route 53 automatically
 Wait for certificate status: ISSUED
         │
         ▼
[ ALB HTTPS LISTENER CONFIGURATION ]
 Attach ACM certificate ARN to ALB port 443 listener
 Configure ALB security policy: TLS 1.3 preferred
 Add HTTP → HTTPS redirect rule on port 80 listener
         │
         ▼
[ WAF ASSOCIATION ]
 Associate AWS WAF web ACL with production ALB
 Enable CRS, SQL, and rate-based rule groups
         │
         ▼
[ SECURITY HEADER CONFIGURATION ]
 Configure CloudFront or application response headers:
 HSTS, CSP, X-Frame-Options, X-Content-Type-Options
         │
         ▼
[ HTTPS VALIDATION ]
 SSL Labs test: target grade A or A+
 Verify HTTP → HTTPS redirect is working
 Verify HSTS header is present in all responses
         │
         ▼
[ PRODUCTION RELEASE ]
 DNS propagation confirmed; HTTPS validated
 CloudWatch monitoring and alerts active
```

---

## 15. Security Validation Checklist

*   `[x]` Domain registered; registrar MFA and transfer lock enabled.
*   `[x]` Route 53 hosted zone created; registrar nameservers updated.
*   `[x]` DNS A-Alias records for all production subdomains created.
*   `[x]` CAA record restricting certificate issuance to Amazon CA deployed.
*   `[x]` ACM wildcard certificate issued via DNS validation.
*   `[x]` ALB HTTPS listener configured with ACM certificate; TLS 1.3 security policy applied.
*   `[x]` HTTP → HTTPS permanent redirect active on port 80 ALB listener.
*   `[x]` HSTS header with `max-age=31536000; includeSubDomains; preload` present in all responses.
*   `[x]` CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers verified.
*   `[x]` AWS WAF associated with ALB; CRS and SQL injection rule groups enabled.
*   `[x]` Rate-based WAF rule (2,000 requests / 5 minutes) active.
*   `[x]` VPC security group rules validated — no open `0.0.0.0/0` inbound rules except ALB port 443.
*   `[x]` SSL Labs score validated: grade A or A+.
*   `[x]` CloudWatch certificate expiry alarm set at $\le 30\text{ days}$.
*   `[x]` WAF block request count monitoring active; alerts routing to Slack.

---

## 16. Conclusion

This SSL, Domain, and Network Security Setup Plan Document defines the complete public-facing security architecture for the platform — from domain registration and Route 53 DNS topology, through ACM certificate lifecycle management and TLS 1.3 enforcement, to AWS WAF rule sets, VPC network isolation layers, and CloudWatch monitoring strategies. Enforcing this configuration ensures that every merchant interaction with the platform is encrypted, authenticated, and protected against common web threats.

DevOps engineers and network architects can now proceed to Terraform Route 53, ACM, and WAF resource provisioning.
