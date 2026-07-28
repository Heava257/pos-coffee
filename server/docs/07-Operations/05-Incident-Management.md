# OPERATIONS SPECIFICATION
## PART 5 — INCIDENT MANAGEMENT & PRODUCTION SUPPORT WORKFLOW

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** SRE Lead, Incident Response Specialist & IT Operations Manager  
**Status:** Approved  

---

## 1. Incident Management Overview

### 1.1 Incident Management Objectives
An incident is any unplanned event that disrupts or degrades the normal operation of the production platform. Incident management is the structured, repeatable process of detecting, classifying, responding to, resolving, and learning from these events.

*   **System Availability:** A disciplined response process reduces the time between failure detection and service restoration, directly improving the platform's SLA performance.
*   **Customer Experience:** Merchants whose businesses depend on the platform experience direct revenue loss during outages. A fast, well-communicated response reduces the business impact and preserves merchant trust.
*   **Business Continuity:** Structured incident management prevents ad-hoc, improvised responses that can escalate incidents — for example, an engineer deleting the wrong ECS service during a panic response.

### 1.2 Reliability Principles
*   **Detect Fast:** Monitoring and alerting must surface incidents before merchants report them. Target MTTD $\le 2\text{ minutes}$ for SEV-1 events.
*   **Respond Structured:** Every incident follows the same lifecycle — no improvisation of process under pressure.
*   **Resolve Safe:** No production action that could worsen the incident is taken without the Incident Commander's approval.
*   **Learn Always:** Every SEV-1 and SEV-2 incident produces a post-incident review with documented corrective actions.

---

## 2. Incident Classification

### 2.1 Seven-Category Incident Taxonomy

| Category | Description | Typical Impact |
| :--- | :--- | :--- |
| **Application Incident** | ECS task crash; application bug causing 5xx errors; startup failure; memory leak | API unavailability; checkout failures; authentication errors |
| **Infrastructure Incident** | ECS cluster failure; ALB health check failures; AZ outage; NAT Gateway failure | Partial or full service outage; reduced capacity |
| **Database Incident** | RDS primary failure; connection pool exhaustion; query performance regression; data corruption | All merchants blocked; transaction failures; data integrity risk |
| **Security Incident** | Active exploit; credential compromise; brute-force attack; unauthorized data access | Data breach risk; mandatory service isolation; regulatory obligation |
| **Network Incident** | VPC routing failure; Route 53 misconfiguration; CloudFront degradation; WAF false positives | Merchants cannot reach the platform; API timeouts |
| **Performance Incident** | API latency exceeds SLO; database slow queries; cache exhaustion; resource saturation | Degraded merchant experience; slow checkout; timeout errors |
| **User Experience Incident** | Feature broken for specific tenant; UI rendering error; report generation failure | Subset of merchants affected; reduced platform functionality |

---

## 3. Incident Severity Classification

### 3.1 SEV Severity Matrix

| Severity | Impact | Response Time Target | Responsible Team | Resolution Target |
| :--- | :--- | :--- | :--- | :--- |
| **SEV-1 Critical** | Complete platform outage; no merchant can process payments or log in | Acknowledge within **5 minutes** of alert | IC + Full SRE team + DRE | Restore service within **1 hour** |
| **SEV-2 High** | Core feature degraded ($\ge 1\%$ error rate on checkout or auth); significant merchant impact | Acknowledge within **15 minutes** | IC + SRE Lead | Restore service within **4 hours** |
| **SEV-3 Medium** | Non-critical feature broken; workaround available; single-tenant issue | Acknowledge within **1 hour** | SRE on-call | Resolve within **24 hours** |
| **SEV-4 Low** | Cosmetic bug; minor degradation; no merchant revenue impact | Acknowledge within **4 hours** | Engineering team (next business day) | Resolve within **72 hours** |

### 3.2 Severity Escalation
*   A SEV-3 is upgraded to SEV-2 if it is still unresolved after 8 hours.
*   A SEV-2 is upgraded to SEV-1 if the API error rate escalates above 5% at any point.
*   Severity escalation is the Incident Commander's authority — no approval required.

---

## 4. Incident Detection Process

### 4.1 Detection Sources

| Source | Mechanism | Typical Lead Time | Example |
| :--- | :--- | :--- | :--- |
| **CloudWatch Alarms → PagerDuty** | Automated; metric threshold breach triggers SNS → PagerDuty | $\le 2\text{ minutes}$ from failure | ALB 5xx rate $\ge 1\%$ alarm fires |
| **Smoke Test Failure** | Post-deployment automated smoke test suite | Immediate (during deployment) | Checkout smoke test returns 500 |
| **CloudWatch Logs Metric Filter** | Log pattern triggers CloudWatch alarm | $\le 1\text{ minute}$ | CRITICAL log level detected in `/ecs/saas-api` |
| **Merchant Support Report** | Merchant contacts support team via email or chat | Variable (5 min – 2 hours) | Merchant reports "cannot login" |
| **Grafana Dashboard (SRE Observation)** | SRE spots anomaly during daily dashboard review | Variable | p99 latency creeping above 200 ms |
| **Security Monitoring** | WAF block spike; CloudTrail anomaly; auth failure burst | $\le 5\text{ minutes}$ via scheduled CloudWatch Logs Insights queries | 500 WAF blocks in 1 minute |

### 4.2 Incident Registration
*   Every detected incident — regardless of source — must be registered in PagerDuty within 5 minutes of detection.
*   A PagerDuty incident record is the canonical source of truth for the incident lifecycle.
*   The detecting engineer creates the initial PagerDuty incident if it was not auto-created by a CloudWatch alarm.

---

## 5. Incident Response Workflow

### 5.1 Complete 9-Stage Incident Lifecycle

| Stage | Activity | Owner | Output |
| :--- | :--- | :--- | :--- |
| **1. Detection** | Metric alarm fires or engineer detects anomaly | CloudWatch / On-call SRE | PagerDuty alert created |
| **2. Registration** | PagerDuty incident created; initial severity assigned; IC paged | On-call SRE | PagerDuty incident record with timestamp and initial SEV |
| **3. Classification** | IC classifies incident by category (Section 2) and confirms severity | IC | Confirmed SEV level; incident category tag |
| **4. Prioritisation** | IC assembles required team members based on SEV and category | IC | Team assembled; response channel opened in Slack `#incidents` |
| **5. Investigation** | Technical team diagnoses root cause using CloudWatch Logs, metrics, and X-Ray | SRE Lead + technical team | Working hypothesis of root cause; impact scope confirmed |
| **6. Resolution** | IC approves recovery action; DevOps/DRE executes from runbook | DevOps / DRE (as appropriate) | Service restored or degraded-mode workaround active |
| **7. Validation** | SRE runs smoke tests; confirms metric baseline restored | SRE Lead | Smoke tests pass; error rate $\le 0.5\%$; latency $\le 50\text{ ms}$ |
| **8. Closure** | IC declares incident resolved; PagerDuty incident closed; status page cleared | IC + Business Representative | PagerDuty incident closed with resolution timestamp |
| **9. Review** | Post-incident review conducted; RCA documented; action items created | Engineering Lead + IC | PIR document; action items in engineering backlog |

---

## 6. Incident Response Team Structure

| Role | Responsibilities | Decision Authority | Communication |
| :--- | :--- | :--- | :--- |
| **Incident Commander (IC)** | Declares severity; coordinates team; approves all recovery actions; owns the incident timeline | Full authority to execute any runbook action without manager approval | Posts status updates to Slack `#incidents` every 10 minutes; briefs management |
| **Technical Lead (SRE)** | Leads diagnostic investigation; drives CloudWatch Logs Insights queries; proposes recovery options | Recommends recovery actions; IC must approve before execution | Reports findings to IC; no external communication |
| **Application Engineer** | Diagnoses code-level failures; reviews application logs; tests application fixes | Proposes hotfixes; IC approves before any production deployment | Reports to Technical Lead |
| **Database Engineer (DRE)** | Manages RDS recovery; validates data integrity; approves any data restoration | Sole authority to approve data restore or deletion | Reports data status to IC; DRE confirmation required before resuming traffic after DB incident |
| **Infrastructure Engineer** | Manages ECS, ALB, VPC, and network recovery; executes Terraform changes | Executes IC-approved infrastructure recovery actions | Reports infrastructure status to Technical Lead |
| **Security Engineer** | Leads response for security incidents; evaluates isolation requirements; manages breach notification | Authority to isolate compromised services from network | Reports security findings to IC; manages external breach notification per regulatory obligation |
| **Customer Support** | Manages merchant-facing communication; updates status page; responds to merchant queries | Authority to post external status page updates (with IC approval on content) | Posts external communications; relays merchant impact reports to IC |

---

## 7. Incident Investigation Process

### 7.1 Structured Investigation Workflow

```
[ COLLECT INFORMATION ]
 Open CloudWatch Operations Dashboard
 Confirm: which services are affected? What changed recently? (recent deployment?)
 Review PagerDuty alert details and alarm name
         │
         ▼
[ ANALYZE LOGS ]
 CloudWatch Logs Insights query on affected log groups
 filter level = "ERROR" OR level = "CRITICAL" | sort @timestamp desc
 Identify: first ERROR timestamp (determines incident start time)
 Identify: common error message pattern (first diagnostic lead)
         │
         ▼
[ REVIEW METRICS ]
 Grafana Operations Dashboard: identify which metric first deviated
 Correlate: API error rate spike vs. ECS task count vs. RDS connection count
 Check RDS Performance Insights for slow query correlation
         │
         ▼
[ IDENTIFY ROOT CAUSE ]
 Construct working hypothesis from log evidence + metric pattern
 Validate hypothesis: does this explanation account for all observed symptoms?
 Apply Five-Why analysis to reach the systemic root cause (not just proximate cause)
         │
         ▼
[ APPLY SOLUTION ]
 IC approves solution from approved runbook or proposes a new action
 DevOps/DRE executes; SRE monitors for recovery signals
 Confirm: did the solution resolve the symptoms (metrics returning to baseline)?
```

---

## 8. Root Cause Analysis (RCA)

### 8.1 Mandatory RCA Fields (for all SEV-1 and SEV-2 incidents)

| Field | Description | Example |
| :--- | :--- | :--- |
| **Incident Summary** | One-paragraph description of what happened | "RDS primary instance restarted due to OOM condition at 02:14 UTC. Application reconnect attempts exhausted pgBouncer pool, causing API 503 errors for 18 minutes." |
| **Timeline** | Chronological log of all significant events | `02:14 UTC: RDS restart. 02:15: CloudWatch alarm fires. 02:17: IC declared. 02:32: RDS Multi-AZ failover complete. 02:35: Service restored.` |
| **Technical Root Cause** | Deepest technical explanation of the failure | "PostgreSQL `work_mem` parameter set too high during weekly batch report generation caused 12 simultaneous queries to allocate 12 × 256 MB = 3 GB, exceeding the RDS instance's 2 GB RAM." |
| **Business Impact** | Duration, affected tenant count, estimated transaction loss | "18 minutes of checkout unavailability; approximately 200 transactions blocked; estimated $8,000 USD GMV impact." |
| **Corrective Action** | Immediate fix applied | "RDS `work_mem` parameter reduced from 256 MB to 64 MB. pgBouncer pool size increased to provide faster reconnect capacity." |
| **Preventive Action** | Systemic change to prevent recurrence | "Add CloudWatch alarm for RDS `FreeableMemory < 200 MB`. Add weekly batch report query to RDS Performance Insights review checklist. Document `work_mem` tuning guidance in DB development guidelines." |

### 8.2 Five-Why Template
The Five-Why analysis drills from the immediate symptom to the systemic root cause:

*   **Why 1:** Why did merchants get 503 errors? → Because pgBouncer reported no available connections.
*   **Why 2:** Why were there no connections available? → Because RDS restarted and all connections were dropped.
*   **Why 3:** Why did RDS restart? → Because the RDS instance ran out of memory.
*   **Why 4:** Why did the instance run out of memory? → Because the weekly report query used `work_mem = 256 MB` per sort operation.
*   **Why 5:** Why was `work_mem` set so high? → Because the parameter was tuned for an old instance size and not reviewed after the migration to `db.t3.medium`.

---

## 9. Incident Communication Strategy

### 9.1 Internal Communication Protocol

| Audience | Channel | Timing | Content |
| :--- | :--- | :--- | :--- |
| **SRE / DevOps Team** | PagerDuty page + Slack `#incidents` | T+0 (immediate) | Alarm details; severity; initial hypothesis |
| **Engineering Lead** | PagerDuty escalation + Slack DM | SEV-1: T+5 min; SEV-2: T+15 min | Impact summary; IC identity; initial RTO estimate |
| **CTO** | Phone call | SEV-1 only; T+10 min | Business impact; recovery path; RTO estimate |
| **Product Owner** | Slack DM + email | SEV-1: T+15 min; SEV-2: T+30 min | Affected features; merchant impact; workarounds |
| **All Engineering** | Slack `#incidents` channel update | On IC declaration | "SEV-1 declared. IC: [Name]. All-hands standby." |
| **IC Status Updates** | Slack `#incidents` | Every 10 minutes (SEV-1); every 30 minutes (SEV-2) | Current status; next action; ETA to resolution |

### 9.2 External Communication Protocol

| Audience | Channel | Timing | Content Rules |
| :--- | :--- | :--- | :--- |
| **All Merchants (SEV-1 outage)** | Status page update + email | Within 30 minutes of SEV-1 declaration | Acknowledge impact; provide next-update time; suggest workaround if available |
| **All Merchants (resolution)** | Status page clear + email | Within 30 minutes of resolution | Confirm service restored; brief incident description; apology |
| **Enterprise Partners** | Phone + email (account manager) | SEV-1 only; within 60 minutes | Direct communication; custom impact statement |
| **Post-Incident Transparency** | Blog post or email | 48–72 hours after SEV-1 | Full transparent post-mortem summary; committed preventive actions |

### 9.3 Status Page Message Standards
*   **Investigating:** `"We are aware of an issue affecting [service area]. Our engineering team is actively investigating. Next update in 30 minutes."`
*   **Identified:** `"We have identified the cause of the issue and are working to restore service. Next update in 20 minutes."`
*   **Monitoring:** `"The issue has been resolved and we are monitoring the system for stability."`
*   **Resolved:** `"This incident has been resolved. We apologize for the disruption."`

---

## 10. Incident Resolution Process

### 10.1 Temporary Workaround vs. Permanent Fix

```
[ TEMPORARY SOLUTION (applied during incident) ]
 Goal: restore service as fast as possible
 Examples: blue-green rollback; ECS task restart; RDS failover; config rollback
 Risk assessment: IC confirms action does not risk data loss
         │
         ▼
[ PERMANENT FIX DESIGN ]
 Post-incident: Application or DRE team designs root-cause fix
 Permanent fix undergoes standard code review and CI/CD pipeline
 No production hotfixes committed directly to main — all changes via PR
         │
         ▼
[ TESTING ]
 Permanent fix applied to staging environment
 QA validates fix resolves the original failure scenario
 Load test validates no performance regression
         │
         ▼
[ DEPLOYMENT ]
 Standard CI/CD deployment process followed
 No expedited deployments that skip CI quality gates
 Monitored deployment with SRE watching CloudWatch dashboards
         │
         ▼
[ VALIDATION ]
 Confirm fix resolves the root cause in production
 CloudWatch metrics confirm no recurrence of the incident pattern
 IC confirms: "Permanent fix deployed and validated. Incident permanently resolved."
```

---

## 11. Post-Incident Review (PIR)

### 11.1 PIR Requirements by Severity

| Severity | PIR Required? | Deadline | Participants |
| :--- | :--- | :--- | :--- |
| **SEV-1** | Mandatory | Within 24 hours | IC, SRE Lead, DRE (if involved), Engineering Lead, Business Representative |
| **SEV-2** | Mandatory | Within 72 hours | IC, SRE Lead, relevant technical team |
| **SEV-3** | Recommended | Within 1 week | SRE on-call |
| **SEV-4** | Optional | Next sprint | Engineering team |

### 11.2 PIR Document Structure

*   **Incident Summary:** What happened, when, and how long.
*   **Timeline:** Chronological log from first symptom to final resolution.
*   **Detection Assessment:** Was MTTD within target? How was it detected?
*   **Response Assessment:** Was MTTR within target? Were the right people involved?
*   **Root Cause Analysis:** Five-Why output; technical and systemic causes.
*   **Impact Assessment:** Merchant downtime; estimated transaction impact; SLA compliance status.
*   **What Went Well:** Aspects of the response that should be preserved or reinforced.
*   **What Could Be Improved:** Gaps in detection, runbooks, communication, or tooling.
*   **Action Items:** Specific preventive actions with assigned owner and target completion date.

---

## 12. Production Support Workflow

### 12.1 Merchant-Reported Issue Escalation Path

```
[ MERCHANT REPORTS ISSUE ]
 Channel: support email / in-app chat
         │
         ▼
[ SUPPORT TEAM — TRIAGE ]
 Collect: tenant ID, user ID, browser/app version, steps to reproduce
 Check: is there an active PagerDuty incident for this symptom?
         │
     ┌───┴───────────────┐
     ▼                   ▼
[ ACTIVE INCIDENT ]   [ NEW ISSUE ]
 Link to PagerDuty    Create support ticket
 Update merchant      Assign to SRE for investigation
 via status page      Target: acknowledge within 4 hours
         │                   │
         └─────────┬──────────┘
                   ▼
[ SRE / ENGINEERING INVESTIGATION ]
 Reproduce in staging (if possible)
 Query CloudWatch Logs for tenant_id + error pattern
 Determine: code bug / data issue / configuration issue?
                   │
                   ▼
[ RESOLUTION ]
 Code fix: PR → CI → deploy (standard process)
 Data fix: DRE executes targeted correction; DRE validates
 Config fix: SSM parameter update; ECS task restart
                   │
                   ▼
[ MERCHANT CONFIRMATION ]
 Support team confirms with merchant that issue is resolved
 Merchant confirms in their environment
                   │
                   ▼
[ TICKET CLOSURE ]
 Support ticket closed with resolution summary
 If a bug: linked to engineering backlog item for permanent fix
```

---

## 13. Incident Documentation Standards

### 13.1 Required Documents per Incident

| Document | Trigger | Owner | Storage | Retention |
| :--- | :--- | :--- | :--- | :--- |
| **Incident Ticket (PagerDuty)** | All severities | On-call SRE | PagerDuty | Indefinite |
| **Incident Timeline Log** | SEV-1, SEV-2 | IC | S3 incident log bucket | 3 years |
| **RCA Document** | SEV-1, SEV-2 | IC + Engineering Lead | Confluence wiki | 3 years |
| **Resolution Report** | SEV-1, SEV-2 | SRE Lead | Confluence wiki | 3 years |
| **Improvement Action Items** | SEV-1, SEV-2 | Engineering Lead | Jira / engineering backlog | Until completed |
| **External Incident Communication** | SEV-1 (public impact) | Business Representative | Status page history + S3 | 3 years |

---

## 14. Incident Metrics & Reporting

### 14.1 SLA Performance Metrics

| Metric | Definition | Target | Measurement |
| :--- | :--- | :--- | :--- |
| **MTTD (Mean Time To Detect)** | Time from failure onset to alert detection | $\le 2\text{ min}$ (SEV-1) | CloudWatch alarm trigger time vs. ECS task stop time |
| **MTTR (Mean Time To Respond)** | Time from alert to IC acknowledging and assembling team | $\le 5\text{ min}$ (SEV-1) | PagerDuty acknowledgement timestamp - alert creation timestamp |
| **MTTRe (Mean Time To Resolve)** | Time from IC declaration to service restoration | $\le 60\text{ min}$ (SEV-1) | Incident resolved timestamp - IC declaration timestamp |
| **Incident Frequency** | Number of incidents per category per month | Trending downward month-over-month | PagerDuty monthly incident count report |
| **Recurring Incident Rate** | % of incidents with the same root cause as a prior incident | $\le 5\%$ | PIR action item completion tracking |
| **SEV-1 SLA Compliance** | % of SEV-1 incidents resolved within 60-minute target | $\ge 95\%$ | Monthly engineering report |

### 14.2 Monthly Incident Review Report
*   Published by Engineering Lead on the first Monday of each month.
*   Contents: incident count by severity and category; MTTD/MTTR/MTTRe vs. targets; recurring incident rate; open PIR action item status; top 3 root causes.
*   Audience: Engineering Lead, DevOps Lead, SRE Lead, CTO.

---

## 15. Incident Management Readiness Checklist

*   `[x]` Incident severity classification (SEV-1 through SEV-4) defined and documented.
*   `[x]` PagerDuty on-call rotation configured; primary and secondary IC designated.
*   `[x]` PagerDuty escalation policies: SEV-1 pages IC within 5 minutes; Engineering Lead within 10 minutes.
*   `[x]` Slack `#incidents` channel configured; CloudWatch SNS alarm notifications routing active.
*   `[x]` Runbooks written for all SEV-1 and SEV-2 incident types; published in Confluence wiki.
*   `[x]` CloudWatch Logs Insights standard investigative queries documented.
*   `[x]` Status page configured; Business Representative trained on message standards.
*   `[x]` PIR process defined; PIR template published in Confluence wiki.
*   `[x]` RCA Five-Why template documented and available for all on-call engineers.
*   `[x]` Monthly incident metrics reporting schedule established.
*   `[x]` Production support escalation path defined; support team trained on triage process.
*   `[x]` MTTD/MTTR/MTTRe targets reviewed against monitoring alarm latencies; targets are achievable.

---

## 16. Conclusion

This Incident Management Process and Production Support Workflow Document defines the complete production support framework — from a 7-category incident taxonomy and 4-tier SEV severity matrix with response time targets, through a 9-stage incident lifecycle with ownership at each stage, a 7-role response team with pre-delegated authority, structured CloudWatch Logs investigation workflows, a mandatory Five-Why RCA framework, tiered internal and external communication protocols, blameless post-incident review standards, and monthly MTTD/MTTR SLA performance reporting. Enforcing this process ensures that every production incident is handled predictably, resolved safely, and used as an opportunity to improve system reliability.

Operations teams can now proceed to **Part 6 — Scaling Strategy**, which defines the auto-scaling policies, capacity planning processes, load testing thresholds, and horizontal scaling architecture required to grow the platform reliably.
