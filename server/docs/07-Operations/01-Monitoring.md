# OPERATIONS SPECIFICATION
## PART 1 — PRODUCTION MONITORING & OBSERVABILITY STRATEGY

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** SRE Lead, Observability Specialist & Cloud Operations Engineer  
**Status:** Approved  

---

## 1. Monitoring Overview

### 1.1 Monitoring vs. Observability — Key Distinction

These two terms are frequently used interchangeably but represent distinct disciplines:

| Aspect | Monitoring | Observability |
| :--- | :--- | :--- |
| **Definition** | Collecting and alerting on predefined metrics and health states | The ability to understand internal system state from external outputs |
| **Approach** | Reactive — alerts fire when known thresholds are crossed | Proactive — allows engineers to ask new questions about unknown failures |
| **Data** | Metrics, uptime checks, health endpoints | Metrics + structured logs + distributed traces |
| **Goal** | "Is the system up?" | "Why is the system behaving this way?" |
| **Tooling** | CloudWatch alarms, Grafana dashboards | CloudWatch Logs Insights, tracing with X-Ray, structured JSON logs |

Both are required. Monitoring provides the safety net; observability provides the diagnostic depth.

### 1.2 Monitoring Objectives
*   Detect failures before merchants report them.
*   Maintain visibility into all critical system paths — authentication, checkout, inventory, reporting.
*   Measure SLIs (Service Level Indicators) continuously and alert when SLOs (Service Level Objectives) are at risk.
*   Provide SRE engineers with enough signal to diagnose and resolve incidents without direct database or container access.

### 1.3 Why Monitoring is Critical

*   **Availability:** CloudWatch health checks and ECS task monitoring detect unhealthy containers within 30 seconds — before the ALB routes traffic to them.
*   **Performance:** p99 latency tracking on the checkout API enforces the $\le 50\text{ ms}$ SLO and alerts before merchants experience visible slowdowns.
*   **Security:** WAF block rate monitoring and authentication failure rate tracking surface attack patterns in real time.
*   **User Experience:** API error rate and business transaction success rate monitoring directly correlates infrastructure health with merchant revenue impact.

---

## 2. Observability Architecture

The observability stack follows the three-pillar model: **Metrics**, **Logs**, and **Traces**.

```
[ MERCHANTS / CASHIERS / ADMINS ]
 Web browser · React Native tablet POS
             │
             ▼
[ APPLICATION LAYER ]
 Next.js SSR · Go REST API · pgBouncer sidecar
             │
     ┌───────┼────────────┐
     ▼       ▼            ▼
[ METRICS ]  [ LOGS ]  [ TRACES ]
 CloudWatch  CloudWatch  AWS X-Ray
 Prometheus  Logs        (distributed
 Grafana     (structured  request tracing)
             JSON)
             │
             ▼
[ ALERT MANAGEMENT ]
 CloudWatch Alarms → PagerDuty (P0/P1)
                  → Slack (P2/P3)
             │
             ▼
[ OPERATIONS TEAM ]
 On-Call SRE · DevOps Engineers
 Grafana Dashboards · CloudWatch Insights
```

### 2.1 Pillar Definitions

*   **Metrics:** Numeric time-series data (CPU %, request count, error rate, p99 latency). Collected by CloudWatch Agent and pushed to CloudWatch. Aggregated in Grafana for visualisation.
*   **Logs:** Structured JSON log events emitted by every container to stdout. Captured by the `awslogs` ECS log driver and stored in CloudWatch Logs. Queried with CloudWatch Logs Insights for investigation.
*   **Traces:** Distributed request traces recording the full execution path of an API request (Go API → pgBouncer → RDS → S3). Collected by AWS X-Ray and correlated with logs via `traceId` field injection.

---

## 3. Monitoring Layers

### 3.1 Six-Layer Monitoring Taxonomy

| Layer | Focus | Primary Tool |
| :--- | :--- | :--- |
| **Application** | API health, latency, error rates, business transactions | CloudWatch ALB metrics + Application logs |
| **Infrastructure** | ECS CPU/memory, task count, container restarts | CloudWatch ECS metrics |
| **Database** | RDS connections, query latency, storage, replication | CloudWatch RDS + Performance Insights |
| **Network** | ALB traffic, WAF blocks, VPC flow anomalies | CloudWatch ALB/WAF + VPC Flow Logs |
| **Security** | Auth failures, WAF events, IAM changes, secret access | CloudWatch Logs Insights + AWS CloudTrail |
| **Business** | Daily GMV, order volume, checkout success rate, active tenants | CloudWatch custom metrics + Grafana |

---

## 4. Application Monitoring Strategy

### 4.1 Key Application Metrics

| Metric | Collection Source | SLO Target | Alert Threshold |
| :--- | :--- | :--- | :--- |
| **API Availability** | ALB target group health | $\ge 99.9\%$ | Any unhealthy task |
| **API p99 Latency** | CloudWatch ALB `TargetResponseTime` | $\le 50\text{ ms}$ | $\ge 200\text{ ms}$ for 5 min |
| **API Error Rate (5xx)** | CloudWatch ALB `HTTPCode_Target_5XX_Count` | $\le 0.5\%$ | $\ge 1\%$ for 3 min |
| **Request Volume** | CloudWatch ALB `RequestCount` | Baseline ± 50% | Spike $\ge 3\times$ baseline |
| **Active ECS Tasks** | CloudWatch ECS `RunningTaskCount` | $\ge 2$ | $\le 1$ |
| **Container Restart Count** | CloudWatch ECS task stopped events | 0 unplanned | Any unplanned restart |

### 4.2 Critical Application SLIs
*   **Checkout SLI:** Checkout endpoint (`POST /api/v1/orders/{id}/checkout`) p99 latency $\le 50\text{ ms}$.
*   **Authentication SLI:** Login endpoint (`POST /api/v1/auth/login`) p99 latency $\le 100\text{ ms}$.
*   **Availability SLI:** API `GET /healthz` returning `200 OK` with $\ge 99.9\%$ success rate over any rolling 30-day window.

---

## 5. Infrastructure Monitoring Strategy

### 5.1 ECS Fargate Metrics

| Metric | Normal Range | Alert Threshold | Action |
| :--- | :--- | :--- | :--- |
| CPU Utilization | $\le 60\%$ | $\ge 85\%$ for 5 min | PagerDuty; review auto-scale |
| Memory Utilization | $\le 70\%$ | $\ge 90\%$ | PagerDuty; increase task memory |
| Running Task Count | 2–10 | $\le 1$ | PagerDuty; ECS self-heals; investigate root cause |
| Task Stop Reason | — | Any `OOMKilled` or crash | Slack alert; inspect logs |

### 5.2 Normal vs. Abnormal Conditions

| Condition | Normal | Abnormal |
| :--- | :--- | :--- |
| ECS CPU | 20–60% during peak | $\ge 85\%$ sustained for $\ge 5$ minutes |
| Memory | 40–70% | $\ge 90\%$ — risk of OOMKill |
| Task count | 2 (off-peak) to 8 (peak) | $\le 1$ at any time |
| Container restarts | 0 per hour | $\ge 1$ unplanned restart |
| NAT Gateway traffic | Steady baseline | Sudden spike — possible data exfiltration |

---

## 6. Database Monitoring Strategy

### 6.1 RDS PostgreSQL Metrics

| Metric | Normal Range | Alert Threshold | Notification |
| :--- | :--- | :--- | :--- |
| CPU Utilization | $\le 40\%$ | $\ge 80\%$ for 5 min | PagerDuty |
| DB Connections | $\le 100$ | $\ge 180$ of 200 max | Slack |
| Free Storage | $\ge 20\text{ GB}$ | $\le 10\text{ GB}$ | PagerDuty |
| Read Latency | $\le 5\text{ ms}$ | $\ge 20\text{ ms}$ | Slack |
| Write Latency | $\le 10\text{ ms}$ | $\ge 50\text{ ms}$ | PagerDuty |
| Replication Lag | 0 (Multi-AZ sync) | $\ge 1\text{ second}$ | PagerDuty |
| Backup Status | Daily successful | Missed daily backup | PagerDuty |

### 6.2 Performance Insights
*   AWS RDS Performance Insights is enabled at 1-second granularity.
*   The top 10 queries by average execution time are reviewed weekly.
*   Any query with an average duration $\ge 100\text{ ms}$ is investigated and optimised (index review or query rewrite).

---

## 7. API Monitoring Strategy

### 7.1 Endpoint-Level Monitoring

| Endpoint Group | Metrics | Alert Condition |
| :--- | :--- | :--- |
| `POST /api/v1/auth/*` | Request count, error rate, p99 latency | Error rate $\ge 2\%$ OR latency $\ge 200\text{ ms}$ |
| `GET /api/v1/products*` | Request count, cache hit rate, p99 latency | Error rate $\ge 1\%$ OR latency $\ge 100\text{ ms}$ |
| `POST /api/v1/orders*` | Request count, error rate, p99 latency | Error rate $\ge 0.5\%$ OR latency $\ge 50\text{ ms}$ |
| `POST /api/v1/orders/{id}/checkout` | Request count, error rate, p99 latency | **Any error** (P1 alert) |
| `GET /api/v1/reports*` | Request count, p99 latency | Latency $\ge 5\text{ s}$ |

### 7.2 Authentication Failure Monitoring
*   A CloudWatch Logs Insights query counts `401 Unauthorized` and `403 Forbidden` responses per 5-minute window.
*   If authentication failures from a single IP exceed 50 per 5 minutes, a security alert fires to Slack `#security` and the WAF rate-limiting rule is evaluated for tightening.

---

## 8. Security Monitoring Strategy

### 8.1 Security Signal Sources

| Signal | Source | Detection | Response |
| :--- | :--- | :--- | :--- |
| **Brute-force login attempts** | CloudWatch Logs (API auth errors) | $\ge 50$ auth failures per IP per 5 min | Block IP at WAF; alert `#security` |
| **WAF rule triggers** | CloudWatch WAF metrics | Spike in block count ($\ge 500$/min) | Security team review; potential DDoS investigation |
| **Suspicious IAM activity** | AWS CloudTrail | Unexpected `AssumeRole` or `PutBucketPolicy` | PagerDuty P1; security team escalation |
| **Secret access anomaly** | AWS Secrets Manager audit logs | Access outside deployment window | Security team alert |
| **RLS policy violation attempt** | Application logs (`POLICY VIOLATION` log tag) | Any occurrence | PagerDuty; DB Lead investigation |
| **Configuration change** | AWS CloudTrail | Security group rule modification | Slack `#security` alert; Terraform drift check |

---

## 9. Business Monitoring Strategy

### 9.1 Business KPI Metrics (Custom CloudWatch Metrics)

| Business Metric | Unit | Collection Method | Dashboard |
| :--- | :--- | :--- | :--- |
| **Daily Order Count** | Count | Go API emits `orders.created` metric on each order | Executive Dashboard |
| **Daily GMV (Gross Merchandise Value)** | USD/KHR | Go API emits `orders.total_value` metric on checkout | Executive Dashboard |
| **Checkout Success Rate** | Percentage | (`checkout.success` / `checkout.attempts`) × 100 | Executive + Operations Dashboard |
| **Active Tenant Count** | Count | Daily CloudWatch Logs Insights query on `tenant_id` field | Executive Dashboard |
| **Feature Adoption Rate** | Percentage | Specific endpoint call counts per tenant | Product Dashboard |
| **Receipt Generation Success** | Percentage | `receipts.generated` / `orders.paid` | Operations Dashboard |

### 9.2 Business SLO Targets
*   Checkout success rate: $\ge 99.5\%$ over any rolling 24-hour window.
*   Daily order processing without error: $\ge 99.9\%$.

---

## 10. Alert Management Strategy

### 10.1 Alert Lifecycle

```
[ METRIC THRESHOLD CROSSED ]
 CloudWatch Alarm state changes: OK → ALARM
         │
         ▼
[ ALERT GENERATED ]
 CloudWatch sends SNS notification
         │
         ▼
[ NOTIFICATION ROUTING ]
 P0/P1 → PagerDuty (on-call SRE paged immediately)
 P2/P3 → Slack #alerts channel
         │
         ▼
[ INVESTIGATION ]
 SRE acknowledges PagerDuty incident
 Reviews Grafana dashboard + CloudWatch Logs Insights
         │
         ▼
[ RESOLUTION ]
 SRE executes runbook or escalates to Engineering Lead
 System restored; alarm state returns to OK
         │
         ▼
[ POST-INCIDENT DOCUMENTATION ]
 Incident record updated with root cause and resolution time
```

### 10.2 Alert Severity Classification

| Severity | Definition | Response Time | Notification |
| :--- | :--- | :--- | :--- |
| **P0 — Critical** | Complete service outage; merchants cannot transact | Immediate page | PagerDuty + phone call to Engineering Lead |
| **P1 — High** | Core feature degraded; checkout or auth errors $\ge 1\%$ | $\le 5\text{ minutes}$ | PagerDuty |
| **P2 — Medium** | Non-critical degradation; report latency high; cache miss rate elevated | $\le 30\text{ minutes}$ | Slack `#alerts` |
| **P3 — Low** | Warning thresholds crossed; certificate expiry at 30 days; disk at 80% | Next business day | Slack `#alerts` |

### 10.3 Alert Fatigue Prevention
*   All alarms require sustained threshold breach (e.g., $\ge 85\%$ CPU for $\ge 5$ minutes) before firing — single spikes do not page.
*   Duplicate alert suppression: PagerDuty deduplicates alerts from the same alarm within a 5-minute window.
*   Monthly alert audit: Any alarm that fires $\ge 20\times$ per month without a real incident is reviewed for threshold adjustment.

---

## 11. Monitoring Dashboard Design

### 11.1 Executive Dashboard
*   **Audience:** Engineering Lead, CTO, Product Owner.
*   **Refresh:** 5 minutes.
*   **Key Panels:**
    *   Platform uptime percentage (rolling 30-day SLO gauge).
    *   Daily order count and GMV trend (bar chart).
    *   Checkout success rate (gauge; green $\ge 99.5\%$, yellow $\ge 99.0\%$, red $< 99.0\%$).
    *   Active tenant count.
    *   Current system status (green/yellow/red traffic light per service).

### 11.2 Operations Dashboard
*   **Audience:** On-call SRE, DevOps engineers.
*   **Refresh:** 30 seconds.
*   **Key Panels:**
    *   ALB request rate and p99 latency (time-series).
    *   ALB 5xx error rate (time-series; red line at 1%).
    *   ECS task count and CPU/memory utilization (per-service gauges).
    *   RDS connections and CPU (time-series).
    *   CloudWatch alarm status list (current OK / ALARM state per alarm).

### 11.3 Application Dashboard
*   **Audience:** Backend engineers, SRE.
*   **Refresh:** 1 minute.
*   **Key Panels:**
    *   Per-endpoint p50/p95/p99 latency (heatmap).
    *   Error rate by endpoint (time-series).
    *   Authentication failure rate (time-series).
    *   Go API request volume by route (bar chart).
    *   ECS task health status list.

### 11.4 Database Dashboard
*   **Audience:** DB Lead, SRE.
*   **Refresh:** 1 minute.
*   **Key Panels:**
    *   RDS CPU and connection count (dual-axis time-series).
    *   pgBouncer active/idle/waiting connection pools.
    *   Top 10 slowest queries (from Performance Insights API).
    *   Free storage remaining (gauge with 10 GB alert line).
    *   Replication lag (gauge).

### 11.5 Security Dashboard
*   **Audience:** Security Lead, Engineering Lead.
*   **Refresh:** 5 minutes.
*   **Key Panels:**
    *   WAF blocked requests by rule group (bar chart).
    *   Auth failure rate by IP (table; top 10 offenders).
    *   CloudTrail IAM events (table; filtered to sensitive actions).
    *   RLS policy violation attempts (count per day).
    *   ACM certificate expiry countdown (days remaining gauge).

---

## 12. Monitoring Data Retention Strategy

| Data Type | Retention Period | Storage | Rationale |
| :--- | :--- | :--- | :--- |
| **CloudWatch Metrics (high-resolution 1-min)** | 15 days | CloudWatch | Active investigation window |
| **CloudWatch Metrics (5-min aggregated)** | 63 days | CloudWatch | Sprint retrospective analysis |
| **CloudWatch Metrics (1-hour aggregated)** | 15 months | CloudWatch | Quarterly and annual trend reporting |
| **CloudWatch Logs (application)** | 90 days | CloudWatch Logs | Incident investigation; 90-day compliance window |
| **CloudWatch Logs (VPC Flow Logs)** | 90 days | CloudWatch Logs | Security investigation |
| **CloudTrail audit logs** | 1 year | S3 (Glacier after 90 days) | Compliance and security forensics |
| **X-Ray traces** | 30 days | AWS X-Ray | Performance regression investigation |
| **Grafana dashboard snapshots** | Indefinite | S3 | Historical operations reports |

### 12.1 Storage Optimisation
*   CloudWatch Logs Subscription Filters stream logs older than 90 days to S3 Glacier for long-term compliance retention at reduced cost.
*   CloudWatch metric alarms use pre-aggregated 5-minute periods for evaluation — not high-resolution 1-minute data — reducing CloudWatch API call costs.

---

## 13. Monitoring Tools Strategy

| Tool Category | Selected Tool | Purpose |
| :--- | :--- | :--- |
| **Metrics Platform** | AWS CloudWatch | Collect, store, and alarm on all AWS service and custom application metrics |
| **Logging Platform** | AWS CloudWatch Logs + Logs Insights | Structured log ingestion, storage, and query engine |
| **Tracing Platform** | AWS X-Ray | Distributed request tracing across Go API, pgBouncer, and RDS |
| **Dashboard Platform** | Grafana (hosted on ECS) | Unified visualisation for CloudWatch, RDS, and custom business metrics |
| **Alert Platform** | AWS CloudWatch Alarms → Amazon SNS → PagerDuty | Alert generation, routing, and on-call escalation |
| **Incident Platform** | PagerDuty | On-call rotation management; P0/P1 escalation; incident timeline recording |
| **Collaboration** | Slack | P2/P3 alert channels; deployment notifications; team communication |

---

## 14. Monitoring Operations Workflow

### 14.1 Daily SRE Operations Routine

```
[ MORNING REVIEW — 09:00 ]
 Open Operations Dashboard in Grafana
 Review all overnight CloudWatch Alarm state changes
 Confirm all ECS tasks healthy; RDS status: available
         │
         ▼
[ ALERT TRIAGE ]
 Review Slack #alerts for overnight P2/P3 notifications
 Categorize: resolved automatically / needs investigation / open ticket
         │
         ▼
[ ACTIVE INVESTIGATION ]
 For any unresolved P2/P3: use CloudWatch Logs Insights to query root cause
 Check RDS Performance Insights for slow queries from overnight batch jobs
         │
         ▼
[ RESOLUTION OR ESCALATION ]
 Resolve if within SRE scope
 Escalate to DB Lead (DB issues) or Backend Lead (application issues) with context
         │
         ▼
[ DAILY DOCUMENTATION ]
 Update incident log for any alert that required investigation
 Note: metric trend observations (CPU creeping up, connection count increasing)
         │
         ▼
[ EVENING HANDOVER — 17:00 ]
 Brief on-call SRE on overnight alert thresholds and any active investigations
 Confirm PagerDuty escalation policy is active for the overnight window
```

---

## 15. Monitoring Readiness Checklist

*   `[x]` CloudWatch metrics collection active for ECS, RDS, ElastiCache, ALB, WAF, and S3.
*   `[x]` ECS container logs streaming to CloudWatch Logs via `awslogs` driver.
*   `[x]` CloudWatch Alarms configured for all 8+ alert scenarios with appropriate thresholds.
*   `[x]` PagerDuty integration active; on-call rotation schedule defined.
*   `[x]` Slack `#alerts` and `#deployments` channels receiving CloudWatch SNS notifications.
*   `[x]` Grafana dashboards (Executive, Operations, Application, Database, Security) created and tested.
*   `[x]` AWS X-Ray tracing enabled on Go API; trace sampling configured at 5%.
*   `[x]` AWS CloudTrail enabled; logs shipped to S3 with 1-year retention.
*   `[x]` Security monitoring: WAF block rate and auth failure rate queries scheduled in CloudWatch Logs Insights.
*   `[x]` Business custom metrics (order count, GMV, checkout success rate) emitted by Go API and visible in Grafana.
*   `[x]` RDS Performance Insights enabled; weekly slow-query review process defined.
*   `[x]` Certificate expiry alarm set at $\le 30\text{ days}$ remaining.

---

## 16. Conclusion

This Production Monitoring & Observability Strategy Document defines the complete three-pillar observability architecture (metrics, logs, traces), a 6-layer monitoring taxonomy, per-service alert thresholds, five Grafana dashboard specifications, a data retention policy, and a daily SRE operations workflow. Enforcing this strategy provides the visibility required to maintain the platform's reliability, performance, and security SLOs continuously in production.

Operations teams can now proceed to **Part 2 — Logging Strategy**, which defines structured log schema standards, log aggregation pipelines, log-based alerting, and audit log compliance procedures.
