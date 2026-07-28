# OPERATIONS SPECIFICATION
## PART 2 — LOGGING ARCHITECTURE & LOG MANAGEMENT STRATEGY

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** SRE Lead, Security Operations Engineer & Enterprise Logging Specialist  
**Status:** Approved  

---

## 1. Logging Overview

### 1.1 Logging Objectives
Logging is the systematic capture of discrete events emitted by every layer of the platform — applications, infrastructure, databases, and network components. Unlike metrics (which answer "how much?"), logs answer "what happened and why?".

*   **Troubleshooting:** When an API returns a 500 error, structured logs trace the exact execution path, the SQL query that failed, the error message, and the request context — reducing mean time to diagnosis (MTTD) from hours to minutes.
*   **Security Investigation:** Authentication failure logs, WAF block events, and IAM audit trails provide the forensic evidence needed to reconstruct a security incident timeline.
*   **Performance Analysis:** Request timing logs annotated with tenant ID and endpoint path allow engineers to identify which tenants or features are generating the highest query latency.
*   **Compliance:** Financial transaction platforms require audit-grade records of who performed what action, on which data, at what time. Tamper-resistant, long-retained audit logs satisfy regulatory and enterprise governance requirements.

---

## 2. Logging Architecture Design

The platform uses a centralized logging architecture where all services emit logs to a single aggregation layer:

```
[ APPLICATION SERVICES ]
 Go API · Next.js Web · pgBouncer sidecar
 (Emit structured JSON to stdout)
             │
             ▼
[ LOG COLLECTION LAYER ]
 ECS awslogs driver → CloudWatch Logs
 AWS CloudTrail → S3 + CloudWatch Logs
 VPC Flow Logs → CloudWatch Logs
 RDS Enhanced Monitoring → CloudWatch Logs
             │
             ▼
[ LOG PROCESSING LAYER ]
 CloudWatch Logs Subscription Filter
 (Routes logs to Lambda / Kinesis for enrichment)
             │
         ┌───┴───────────┐
         ▼               ▼
[ LOG STORAGE LAYER ]  [ ARCHIVE LAYER ]
 CloudWatch Logs        S3 (Glacier)
 (Hot: 0–90 days)       (Cold: 90 days–7 years)
         │
         ▼
[ SEARCH & ANALYSIS ]
 CloudWatch Logs Insights (ad-hoc queries)
 Grafana Log Panels (dashboard integration)
 Scheduled Insights queries (security detection)
         │
         ▼
[ ALERTING & OPERATIONS ]
 CloudWatch Metric Filters → CloudWatch Alarms
 → PagerDuty (P0/P1) · Slack (P2/P3)
```

### 2.1 Component Responsibilities

| Component | Purpose | Data Flow |
| :--- | :--- | :--- |
| **ECS awslogs driver** | Captures container stdout/stderr and ships to CloudWatch Logs | Application → CloudWatch |
| **AWS CloudTrail** | Records every AWS API call (IAM, ECS, RDS, S3, Secrets Manager actions) | AWS Services → CloudTrail → S3 |
| **VPC Flow Logs** | Records all accepted and rejected network connection attempts in the VPC | VPC → CloudWatch Logs |
| **RDS Enhanced Monitoring** | OS-level metrics and slow query log from PostgreSQL | RDS → CloudWatch Logs |
| **CloudWatch Logs Insights** | SQL-like query engine for ad-hoc log investigation | CloudWatch Logs → Query Results |
| **CloudWatch Metric Filters** | Extracts numeric signals from log patterns (e.g., count of ERROR lines) | CloudWatch Logs → CloudWatch Metrics → Alarms |

---

## 3. Log Types Classification

### 3.1 Seven-Category Log Taxonomy

| Category | Purpose | Example Information | Retention |
| :--- | :--- | :--- | :--- |
| **Application Logs** | Record API requests, responses, and internal processing events | Request method, path, status code, duration, tenant ID | 90 days active; 1 year S3 archive |
| **Error Logs** | Record exceptions, panics, and unhandled errors | Stack trace, error message, request ID, user context | 90 days active; 1 year S3 archive |
| **Database Logs** | Record slow queries, connection events, and schema changes | Query text (truncated), execution time, client IP | 90 days active |
| **Security Logs** | Record authentication events, authorisation failures, and policy violations | User ID, IP address, action, result, tenant ID | 1 year active; 7 years S3 Glacier |
| **Network Logs** | Record VPC traffic flows, WAF block events, and ALB access | Source IP, destination port, action (ALLOW/REJECT), bytes | 90 days active |
| **Audit Logs** | Record all state-changing business actions for compliance | Actor, action, resource, timestamp, outcome | 7 years S3 Glacier (compliance) |
| **Business Event Logs** | Record domain events (order created, payment processed) | Event type, tenant ID, entity ID, amount, status | 90 days active; 1 year S3 archive |

---

## 4. Application Logging Strategy

### 4.1 What Must Be Logged

| Log Category | Required Fields |
| :--- | :--- |
| **Inbound HTTP Request** | Timestamp, method, path, status code, duration ms, request ID, tenant ID, user ID |
| **Outbound External Call** | Timestamp, target service (Stripe/Bakong), method, status code, duration ms, request ID |
| **Business Event** | Timestamp, event type, entity type, entity ID, tenant ID, actor user ID, result |
| **Authentication Event** | Timestamp, event type (LOGIN/LOGOUT/REFRESH), user ID, tenant ID, IP address, result |
| **Application Error** | Timestamp, error message, stack trace, request ID, tenant ID, log level: ERROR |
| **Database Query (slow)** | Timestamp, query pattern (no values), execution ms, table name, tenant ID |

### 4.2 What Must Never Be Logged (PII & Secret Exclusion)

| Prohibited Data | Reason | Handling |
| :--- | :--- | :--- |
| Passwords and password hashes | Credential exposure | Never log; reference only by user ID |
| JWT token values | Authentication bypass risk | Log only `jti` (token ID), never the token string |
| Credit card numbers | PCI DSS violation | Never log payment card data |
| Full API keys (Stripe, Bakong) | Third-party credential exposure | Log only last 4 characters: `sk_live_****abcd` |
| Personal identity data (CCCD, passport) | Privacy regulation | Log only entity ID reference; never raw PII |
| Database connection strings | Credential exposure | Never log; reference by alias (`main-db`) |
| AWS Secrets Manager values | Secret exposure | Never log retrieved secret values |

---

## 5. Log Format Standardization

### 5.1 Structured JSON Log Schema
All application log lines emitted by the Go API and Next.js web service use a standardized JSON structure:

```
{
  "timestamp":   "2026-07-11T09:45:23.412Z",    // RFC3339 UTC
  "level":       "INFO",                          // DEBUG|INFO|WARN|ERROR|CRITICAL
  "service":     "saas-api",                      // Container service name
  "version":     "v1.4.0",                        // Deployed image version tag
  "request_id":  "req_8f3a2c1d-4b5e-...",         // UUID; correlates request across logs
  "trace_id":    "1-60f7a2b3-abc123def456...",     // AWS X-Ray trace ID
  "tenant_id":   "tenant_uuid_...",               // Multi-tenant context
  "user_id":     "user_uuid_...",                 // Authenticated user (null if unauthenticated)
  "method":      "POST",                          // HTTP method (for request logs)
  "path":        "/api/v1/orders",                // URL path (no query params with PII)
  "status":      201,                             // HTTP status code
  "duration_ms": 23,                             // Request duration in milliseconds
  "message":     "Order created successfully",   // Human-readable event description
  "error":       null                             // Error message (null if no error)
}
```

### 5.2 Why Structured Logs Improve Operations
*   **CloudWatch Logs Insights** can parse structured JSON fields directly — queries like `filter level = "ERROR" | filter tenant_id = "abc123"` are instant.
*   The `request_id` field correlates all log lines from a single HTTP request across multiple log entries, allowing full request trace reconstruction without distributed tracing overhead.
*   The `trace_id` field correlates application logs with AWS X-Ray traces for performance profiling.
*   The `tenant_id` field enables per-tenant incident isolation — critical for multi-tenant RLS debugging.

---

## 6. Log Level Management

| Level | Purpose | Usage Rules | Example |
| :--- | :--- | :--- | :--- |
| **DEBUG** | Detailed execution tracing for development | Never enabled in production; only in local Docker Compose | SQL query parameters, function entry/exit |
| **INFO** | Normal operational events | Standard for all successful request completions and business events | `Order created`, `User authenticated`, `Report generated` |
| **WARN** | Unexpected but handled conditions | Non-critical issues that may indicate future problems | Rate limit approaching, cache miss, retry attempted |
| **ERROR** | Failures that affect a specific request | Failed requests, unhandled exceptions, third-party API errors | `Stripe webhook signature invalid`, `DB query timeout` |
| **CRITICAL** | System-level failures affecting all traffic | Full service failure, database unreachable, OOM | `Cannot connect to database`, `Redis connection pool exhausted` |

### 6.1 Production Log Level Configuration

| Environment | Minimum Log Level | Rationale |
| :--- | :--- | :--- |
| Local Dev | DEBUG | Full diagnostic visibility for developer debugging |
| QA / Testing | INFO | Standard operations; test assertions depend on log output |
| Staging | INFO | Mirror production behaviour |
| Production | INFO | All significant events captured; DEBUG excluded to reduce log volume and cost |

---

## 7. Security Logging Strategy

### 7.1 Required Security Log Events

| Event | Fields Logged | Severity | Alert |
| :--- | :--- | :--- | :--- |
| Successful login | `user_id`, `tenant_id`, `ip_address`, `user_agent` | INFO | None |
| Failed login attempt | `email_hash`, `tenant_id`, `ip_address`, `attempt_count` | WARN | P2 alert if $\ge 10$ failures from same IP within 5 min |
| Account locked | `user_id`, `tenant_id`, `ip_address`, `reason` | WARN | Slack `#security` |
| JWT refresh rejected | `jti`, `reason`, `ip_address` | WARN | None |
| Authorisation denied (403) | `user_id`, `tenant_id`, `resource`, `action`, `ip_address` | WARN | Alert if $\ge 20$ per tenant in 5 min |
| RLS policy violation attempt | `user_id`, `tenant_id`, `target_tenant_id`, `query_pattern` | ERROR | PagerDuty P1 |
| Admin privilege used | `user_id`, `action`, `tenant_id`, `timestamp` | INFO | Audit log entry |
| Secret accessed outside deployment | AWS Secrets Manager CloudTrail event | CRITICAL | PagerDuty P0 |

---

## 8. Audit Logging Strategy

### 8.1 Five-W Audit Standard
Every state-changing business action must produce an audit log entry capturing the Five W's:

| Dimension | Field | Example |
| :--- | :--- | :--- |
| **Who** | `actor_user_id`, `actor_role` | `user_uuid_123`, `CASHIER` |
| **What** | `action`, `entity_type`, `entity_id` | `ORDER_CHECKOUT`, `Order`, `order_uuid_456` |
| **When** | `timestamp` (RFC3339 UTC) | `2026-07-11T09:45:23.412Z` |
| **Where** | `ip_address`, `tenant_id`, `service` | `192.168.1.1`, `tenant_abc`, `saas-api` |
| **Result** | `outcome`, `status_code` | `SUCCESS`, `201` |

### 8.2 Actions Requiring Mandatory Audit Logs

*   Any financial transaction (order creation, checkout, refund, void).
*   Any inventory adjustment (stock in, stock out, manual correction).
*   Any user account action (create, update role, deactivate, password reset).
*   Any tenant configuration change (payment gateway update, tax rate change).
*   Any system administrator action (RLS policy change, schema migration).

### 8.3 Audit Log Integrity
*   Audit logs are written to a dedicated CloudWatch Log Group: `/saas/audit`.
*   The `/saas/audit` log group has a **resource policy that prohibits deletion** — logs cannot be deleted even by the DevOps IAM role.
*   Audit logs are streamed in real-time to an S3 bucket with Object Lock (WORM mode) enabled, ensuring immutability for 7 years.

---

## 9. Log Collection Strategy

### 9.1 Collection per Source

| Source | Collection Method | Log Group |
| :--- | :--- | :--- |
| **Go API containers** | ECS `awslogs` driver (stdout) | `/ecs/saas-api` |
| **Next.js Web containers** | ECS `awslogs` driver (stdout) | `/ecs/saas-web` |
| **pgBouncer sidecars** | ECS `awslogs` driver (stdout) | `/ecs/saas-pgbouncer` |
| **RDS PostgreSQL** | RDS slow query log + error log | `/aws/rds/cluster/saas-db/postgresql` |
| **AWS CloudTrail** | Automatic; all API calls | S3 + `/aws/cloudtrail/saas` |
| **VPC Flow Logs** | VPC flow log configuration | `/vpc/saas-production-flow` |
| **ALB Access Logs** | ALB access log to S3 | S3 `saas-alb-access-logs/` |
| **Bastion Host (SSH)** | CloudWatch Agent (`/var/log/secure`) | `/ec2/bastion/secure` |

### 9.2 Centralized Log Architecture Benefits
*   All logs arrive in a single AWS account and region — no cross-account log shipping complexity.
*   CloudWatch Logs Insights queries can span multiple log groups in a single query using `--log-group-names` parameter.
*   CloudWatch Metric Filters can be applied to any log group to generate custom metrics and alarms from log patterns.

---

## 10. Log Storage Strategy

### 10.1 Storage Tier Policy

| Log Group | Hot Retention (CloudWatch Logs) | Cold Archive (S3 Glacier) | Deletion |
| :--- | :--- | :--- | :--- |
| `/ecs/saas-api` | 90 days | 1 year (S3 Standard-IA) | After 1 year |
| `/ecs/saas-web` | 90 days | None | After 90 days |
| `/saas/audit` | 1 year | 7 years (S3 Glacier + WORM) | After 7 years (compliance) |
| `/saas/security` | 1 year | 7 years (S3 Glacier) | After 7 years |
| `/vpc/saas-production-flow` | 90 days | 1 year (S3) | After 1 year |
| `/aws/cloudtrail/saas` | 90 days | 1 year (S3 Glacier) | After 1 year |
| `/aws/rds/cluster/saas-db/*` | 90 days | None | After 90 days |

### 10.2 Access Control on Log Storage
*   Developer IAM roles have read-only access to `/ecs/saas-api` and `/ecs/saas-web` log groups.
*   Audit log group `/saas/audit` is readable only by the DevOps Lead and Security Lead IAM roles.
*   S3 audit log archive bucket has a bucket policy denying deletion by all principals (Object Lock enforces WORM).

---

## 11. Log Search & Analysis Strategy

### 11.1 Operational Query Workflow

```
[ ALERT FIRES / ISSUE REPORTED ]
         │
         ▼
[ OPEN CLOUDWATCH LOGS INSIGHTS ]
 Select relevant log group(s)
 Set time range to incident window
         │
         ▼
[ SEARCH BY REQUEST ID / ERROR TYPE ]
 filter level = "ERROR" | sort @timestamp desc
 filter request_id = "req_8f3a2c1d-..."
         │
         ▼
[ ANALYZE LOG PATTERN ]
 stats count(*) by error, path
 Identify: which endpoint? which tenant? which error?
         │
         ▼
[ CORRELATE ACROSS SOURCES ]
 Cross-reference: RDS slow query log + API error log by timestamp
 Cross-reference: WAF block event + API 401 log by IP address
         │
         ▼
[ IDENTIFY ROOT CAUSE ]
 Formulate: was this a code bug? DB timeout? third-party failure?
         │
         ▼
[ RESOLVE & DOCUMENT ]
 Implement fix or workaround
 Document root cause in incident log
```

### 11.2 Standard Investigative Queries

| Investigation Scenario | Query Pattern |
| :--- | :--- |
| API errors in last hour | `filter level = "ERROR" \| sort @timestamp desc \| limit 50` |
| All requests for a specific tenant | `filter tenant_id = "<uuid>" \| sort @timestamp desc` |
| Slowest endpoints today | `stats avg(duration_ms), max(duration_ms) by path \| sort avg(duration_ms) desc` |
| Authentication failure summary | `filter path = "/api/v1/auth/login" and status = 401 \| stats count() by ip_address` |
| Errors by service in last 15 min | `stats count() by service, level \| filter level in ["ERROR", "CRITICAL"]` |

---

## 12. Log Security & Privacy

### 12.1 Data Masking Requirements

| Data Type | Masking Rule | Implementation |
| :--- | :--- | :--- |
| Email addresses | Log only SHA-256 hash for failed login tracking | Go API hashes before logging |
| API keys | Log only last 4 characters: `****abcd` | Go API truncates before logging |
| JWT token values | Log only `jti` claim, never the token string | Go API extracts `jti` only |
| Database query values | Log query pattern without literal values: `WHERE id = $1` | pgBouncer and Go API use parameterized queries |
| Payment amounts | Log in audit trail; excluded from standard request logs | Business event log only |
| Personal identity numbers | Never logged under any category | Application-level filter |

### 12.2 Log Transmission Security
*   **In transit:** CloudWatch Logs accepts logs over HTTPS (TLS 1.2+) by default. No logs are transmitted over plain HTTP.
*   **At rest:** CloudWatch Logs encrypts all stored log data using AWS KMS keys. The S3 audit log archive uses SSE-KMS (Server-Side Encryption with KMS).

### 12.3 Log Access Control
*   CloudWatch Log Group resource policies restrict who can call `logs:GetLogEvents` and `logs:FilterLogEvents`.
*   Audit log access is logged in CloudTrail — any engineer reading the audit log creates a trace record.

---

## 13. Log Monitoring & Alerting

CloudWatch Metric Filters extract numeric signals from log patterns and feed CloudWatch Alarms:

| Log Pattern | Metric Filter | Alarm Threshold | Alert |
| :--- | :--- | :--- | :--- |
| `"level":"ERROR"` in `/ecs/saas-api` | `api_error_count` | $\ge 50$ errors / 5 min | Slack P2 |
| `"level":"CRITICAL"` in `/ecs/saas-api` | `api_critical_count` | $\ge 1$ per 1 min | PagerDuty P1 |
| `status = 401` in auth endpoint | `auth_failure_count` | $\ge 100$ per 5 min | Slack `#security` P2 |
| `"POLICY VIOLATION"` in `/saas/security` | `rls_violation_count` | $\ge 1$ per 1 min | PagerDuty P0 |
| `"OOMKilled"` in ECS task stop reason | `oom_kill_count` | $\ge 1$ | PagerDuty P1 |
| Slow query $\ge 1000\text{ ms}$ in RDS log | `slow_query_count` | $\ge 10$ per 5 min | Slack P2 |
| CloudTrail: `DeleteLogGroup` event | `audit_log_delete_attempt` | $\ge 1$ | PagerDuty P0 |

---

## 14. Log Management Operations

### 14.1 Daily Log Management Workflow

```
[ MORNING LOG REVIEW — 09:00 ]
 Review CloudWatch Logs Insights for overnight ERROR/CRITICAL events
 Confirm zero POLICY VIOLATION events
 Confirm audit log group is receiving entries (order activity expected)
         │
         ▼
[ ISSUE INVESTIGATION ]
 For each overnight ERROR event: determine if transient or recurring
 Transient (single occurrence, non-repeating): document and close
 Recurring: open investigation ticket; assign to backend or DB lead
         │
         ▼
[ STORAGE REVIEW — WEEKLY ]
 Review CloudWatch Logs storage consumption per log group
 Confirm lifecycle policies are archiving logs older than 90 days to S3
 Confirm S3 audit archive Object Lock status is intact
         │
         ▼
[ RETENTION MANAGEMENT — MONTHLY ]
 Verify log group retention periods match the policy in this document
 Identify log groups with unexpectedly high volume; investigate source
         │
         ▼
[ QUERY OPTIMISATION — QUARTERLY ]
 Review CloudWatch Logs Insights scheduled queries
 Update security detection queries for new threat patterns
 Review and tune CloudWatch Metric Filters for alert fatigue
```

### 14.2 Log Rotation and Cost Management
*   CloudWatch Logs charges by ingestion volume (GB/month) and storage volume.
*   DEBUG logs are disabled in production — this single rule reduces log ingestion volume by an estimated 70%.
*   Log group retention periods are enforced via Terraform; no log group has an "indefinite" retention setting (except the audit log, which uses Object Lock for WORM compliance rather than retention policy).

---

## 15. Log Management Readiness Checklist

*   `[x]` ECS `awslogs` log driver configured for all production task definitions.
*   `[x]` Structured JSON log format implemented in Go API; log schema documented.
*   `[x]` `request_id` UUID generated for every inbound request; propagated to all log lines.
*   `[x]` `tenant_id` and `user_id` included in all application log lines.
*   `[x]` PII masking rules implemented in application logging layer (emails hashed, JWTs truncated).
*   `[x]` Audit log group `/saas/audit` created with resource policy prohibiting deletion.
*   `[x]` S3 audit archive bucket with Object Lock (WORM) configured for 7-year retention.
*   `[x]` CloudWatch Metric Filters configured for ERROR count, CRITICAL count, auth failure count, RLS violation.
*   `[x]` CloudWatch Alarms linked to metric filters with PagerDuty/Slack routing.
*   `[x]` CloudWatch Logs Insights standard investigative queries documented in SRE runbook.
*   `[x]` Log group retention periods configured in Terraform for all log groups.
*   `[x]` CloudTrail enabled; all AWS API calls logged to S3 with 1-year retention.
*   `[x]` RDS slow query log enabled; threshold set at 1 second.
*   `[x]` VPC Flow Logs enabled; stored in CloudWatch Logs for 90 days.

---

## 16. Conclusion

This Logging Architecture and Log Management Strategy Document defines the complete centralized logging pipeline — from structured JSON emission standards and seven-category log taxonomy, through CloudWatch Logs collection, Logs Insights analysis, log-based CloudWatch Metric Filters and Alarms, to PII masking requirements, audit log WORM immutability, and tiered retention policies. Enforcing this strategy provides the diagnostic depth, security forensic capability, and compliance evidence trail required to operate the platform at enterprise grade.

Operations teams can now proceed to **Part 3 — Backup Strategy**, which defines the complete production data protection, backup schedule, restore validation, and business continuity backup architecture.
