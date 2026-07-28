# OPERATIONS SPECIFICATION
## PART 4 — DISASTER RECOVERY OPERATIONS & BUSINESS CONTINUITY MANAGEMENT

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** SRE Lead, DR Architect & Business Continuity Manager  
**Status:** Approved  

---

## 1. Disaster Recovery Operations Overview

### 1.1 Operational Resilience Goals
Disaster Recovery (DR) Operations is the practice of maintaining or rapidly restoring business service continuity when a significant system failure occurs. For this SaaS platform, resilience is defined not as the absence of failures — which is impossible — but as the measured, predictable ability to recover from failures within defined RTO and RPO windows.

*   **Recovery Time Objective (RTO):** Maximum acceptable elapsed time from failure event to service restoration.
*   **Recovery Point Objective (RPO):** Maximum acceptable data loss, measured as the age of the last known-good recoverable state.

### 1.2 Business Continuity Principles
*   **Recovery is Pre-Planned:** Every recovery action is documented in a runbook before a disaster occurs. Engineers do not improvise during a P0 incident.
*   **Authority is Pre-Delegated:** The Incident Commander has authority to execute recovery actions — including rollback and infrastructure reprovisioning — without waiting for management approval.
*   **Data Protection is Paramount:** No recovery action that risks permanent data loss is taken without explicit confirmation from the Database Reliability Engineer.
*   **Communication Runs Parallel to Recovery:** Stakeholder communication begins immediately — not after recovery is complete.

### 1.3 Why DR is Essential for Enterprise Systems
*   **Revenue Continuity:** Every minute of checkout downtime represents direct merchant revenue loss and platform revenue loss.
*   **Trust and Retention:** Merchants who cannot operate their business during an outage evaluate alternatives. Repeated outages without clear communication cause permanent churn.
*   **Regulatory Obligation:** Financial transaction platforms are frequently subject to availability and data protection obligations. Inability to recover within defined windows may constitute a regulatory breach.

---

## 2. Disaster Classification

### 2.1 Eight-Category Disaster Matrix

| Category | Description | Risk Level | Impact | Recovery Approach |
| :--- | :--- | :--- | :--- | :--- |
| **Application Failure** | ECS task crash; application bug causing 5xx errors; OOMKill | 🟡 Medium | Partial or full API unavailability | Blue-green rollback; ECS task replacement |
| **Database Failure** | RDS primary failure; connection pool exhaustion; data corruption | 🔴 High | All merchant operations suspended | RDS Multi-AZ failover (automatic); PITR restore |
| **Infrastructure Failure** | AZ outage; ECS cluster failure; ALB unresponsive | 🔴 High | Full or partial service outage | AWS auto-recovery; Terraform reprovisioning |
| **Network Failure** | NAT Gateway failure; Route 53 misconfiguration; VPC routing issue | 🟡 Medium | External connectivity lost; API unreachable | AWS managed service recovery; DNS TTL failover |
| **Security Incident** | Active exploit; credential compromise; data breach detected | 🔴 Critical | Potential data exposure; mandatory service isolation | Isolate; contain; forensic investigation; controlled restore |
| **Human Error** | Accidental schema DROP; wrong environment targeted; config deletion | 🟡 Medium | Data loss or misconfiguration | RDS PITR; SSM version rollback; Terraform state revert |
| **Cloud Provider Failure** | AWS regional outage (ap-southeast-1) | 🔴 Critical | Complete platform unavailability | Cross-region DR reprovisioning in ap-southeast-2 |
| **Natural Disaster** | Physical data center event affecting AWS regional infrastructure | 🔴 Critical | Regional infrastructure loss | Cross-region DR; business continuity manual operations |

---

## 3. Disaster Recovery Architecture

```
[ PRIMARY PRODUCTION ENVIRONMENT ]
 AWS ap-southeast-1 (Singapore)
 ECS Fargate · RDS Multi-AZ · ElastiCache · ALB · WAF
 Route 53 → app.saas-platform.com → Production ALB
         │
         │ Continuous Replication & Backup
         ▼
[ BACKUP ENVIRONMENT ]
 AWS RDS Backup Vault (7-day snapshots + WAL PITR)
 S3 Cross-Region Replication → ap-southeast-2 (Sydney)
 ECR images (available in secondary region via replication policy)
 Terraform state → S3 versioned backend (accessible from any region)
         │
         │ On declared regional disaster
         ▼
[ RECOVERY ENVIRONMENT ]
 AWS ap-southeast-2 (Sydney)
 Terraform reprovisioning: VPC · ECS · RDS (from snapshot) · ElastiCache · ALB
 Route 53 DNS A-Alias records updated to point to Recovery ALB
 Estimated build time: ≤ 4 hours
         │
         ▼
[ BUSINESS CONTINUITY OPERATION ]
 Full service restored in recovery region
 Merchants notified of resolution via status page and email
 Root cause investigation begins in primary region
 Post-DR review scheduled within 48 hours
```

### 3.1 Architecture Component Responsibilities

| Component | Purpose | Recovery Flow |
| :--- | :--- | :--- |
| **RDS Multi-AZ** | Automatic failover within primary region for single-AZ failures | AWS auto-promotes standby; DNS update occurs within 5 minutes |
| **S3 Cross-Region Replication** | Real-time asset availability in secondary region | Objects available in ap-southeast-2 immediately on creation |
| **Terraform State Backend** | Infrastructure definition recoverable from S3 in any region | `terraform apply` reprovisioning from secondary region targeting ap-southeast-2 |
| **ECR (secondary region)** | Container images available for ECS task launch in recovery region | ECR replication policy keeps images in sync across regions |
| **Route 53** | Authoritative DNS; single-record update redirects all merchants | DNS propagation within 60–300 seconds (TTL-dependent) |

---

## 4. Recovery Team Structure

### 4.1 Team Roles and Authority

| Role | Responsibilities | Decision Authority | Communication Role |
| :--- | :--- | :--- | :--- |
| **Incident Commander (IC)** | Declares incident severity; coordinates all recovery activities; owns timeline | Full authority to execute recovery without additional approvals | Primary communicator to management and CTO |
| **SRE Lead** | Leads technical recovery execution; monitors CloudWatch; executes runbooks | Authorised to rollback, restart services, and escalate to DR | Provides status updates to IC every 10 minutes |
| **DevOps Engineer** | Executes infrastructure recovery; Terraform reprovisioning; ECS redeployment | Executes approved recovery actions from runbook | Reports actions to SRE Lead; no external comms |
| **Database Reliability Engineer (DRE)** | Manages RDS failover, PITR restore, and data integrity validation | Sole authority to approve data restoration or deletion | Confirms data integrity to IC before service resumption |
| **Security Team Lead** | Leads response for security incidents; evaluates isolation requirements | Authority to isolate compromised services from the network | Communicates security findings to IC; manages external breach notification |
| **Application Engineer** | Diagnoses application-level failures; reviews logs; validates application behaviour | No infrastructure authority; advises IC on application issues | Reports findings to SRE Lead |
| **Business Representative** | Communicates with merchants and partners; manages status page; provides business impact context | Authority to post external communications | Communicates with customers; coordinates with IC on messaging |

### 4.2 Incident Commander Selection
*   **Primary IC:** DevOps Lead.
*   **Secondary IC:** SRE Lead (if DevOps Lead is unavailable).
*   **Tertiary IC:** Engineering Lead (if both primary and secondary are unavailable).
*   The on-call engineer who detects the incident is the acting IC until a designated IC assumes command.

---

## 5. Disaster Recovery Process

### 5.1 Complete DR Lifecycle

```
[ INCIDENT DETECTION ]
 Source: CloudWatch alarm · PagerDuty page · smoke test failure · merchant report
 Acting IC: On-call SRE
 Time target: Detection within 1 minute of failure onset (CloudWatch alarm latency)
         │
         ▼
[ IMPACT ASSESSMENT ] (Target: ≤ 5 minutes)
 Determine scope: single service? full platform? data affected?
 Classify disaster category (Section 2 matrix)
 Assign severity: P0 / P1 / P2 / P3
 Open PagerDuty incident; assemble recovery team
         │
         ▼
[ RECOVERY DECISION ] (Target: ≤ 10 minutes from detection)
 IC selects recovery path from playbook:
 Option A: Automatic recovery (ECS restart / RDS Multi-AZ failover)
 Option B: Blue-green rollback (application failure)
 Option C: RDS PITR or snapshot restore (data failure)
 Option D: Cross-region DR reprovisioning (regional failure)
         │
         ▼
[ EXECUTE RECOVERY PLAN ]
 DevOps Engineer executes approved runbook steps
 DRE confirms data integrity before and after restore
 Security Team isolates affected resources if security incident
 IC tracks timeline; posts status updates every 10 minutes
         │
         ▼
[ SYSTEM VALIDATION ] (see Section 7 / 8 detail)
 Health checks · smoke tests · data integrity checks
 Performance baseline comparison
 Security Team confirms no ongoing threat (for security incidents)
         │
         ▼
[ BUSINESS CONFIRMATION ]
 Business Representative confirms key merchant accounts can transact
 Business Representative clears status page incident
 IC confirms with Engineering Lead that service is stable
         │
         ▼
[ INCIDENT CLOSURE ]
 IC declares incident resolved; records resolution timestamp
 Post-incident review scheduled within 24 hours (P0) or 72 hours (P1)
 PagerDuty incident closed; Slack `#incidents` updated
```

---

## 6. Application Recovery Strategy

### 6.1 Recovery Approaches by Failure Type

| Application Failure | Detection Signal | Recovery Action | Validation |
| :--- | :--- | :--- | :--- |
| ECS task OOMKill | CloudWatch: task stop reason `OOMKilled` | ECS auto-replaces task; if recurring, increase task memory allocation | Health check returns 200 OK |
| Application 5xx rate spike | CloudWatch ALB: 5xx rate $\ge 1\%$ for 5 min | Blue-green rollback to previous stable image | Smoke tests pass; error rate normalizes |
| Dependency failure (Stripe API down) | Application ERROR logs: `stripe: timeout` | Enable payment degraded mode (queue orders for retry); post status update | Retry queue processing when Stripe recovers |
| Configuration error | Application CRITICAL log: startup failure | Roll back SSM Parameter Store to prior version; restart ECS tasks | Application starts successfully; health check passes |
| Memory leak (gradual degradation) | CloudWatch ECS: memory creeping above 85% | Rolling ECS task replacement with `--force-new-deployment` | Memory utilization returns to baseline after replacement |

---

## 7. Database Recovery Strategy

### 7.1 Database Recovery Decision Tree

| Failure Scenario | RTO Target | Recovery Mechanism | DRE Action Required |
| :--- | :--- | :--- | :--- |
| RDS primary AZ failure | $\le 5\text{ min}$ | RDS Multi-AZ automatic failover | Confirm new primary endpoint; verify connection pool reconnects |
| RDS connection pool exhaustion | $\le 10\text{ min}$ | Restart pgBouncer sidecars; review connection limits | Monitor RDS `DatabaseConnections` metric until normalized |
| Accidental row/table deletion | $\le 30\text{ min}$ | RDS PITR restore to pre-deletion timestamp | Validate row counts; RLS cross-tenant isolation test |
| Schema migration data corruption | $\le 1\text{ hr}$ | Restore from pre-migration RDS snapshot | Full data integrity assertion suite; application smoke test |
| Full RDS instance failure | $\le 45\text{ min}$ | Restore from most recent daily snapshot | Row count validation; FK constraint check; RLS test |

### 7.2 Data Validation Steps After Recovery
1.  Row count assertions on all critical tables (tenants, orders, products, payments, inventory).
2.  Referential integrity check — no orphaned foreign key references.
3.  Multi-tenant RLS cross-tenant isolation test — Tenant A cannot see Tenant B's orders.
4.  Application health check against the restored endpoint.
5.  DRE co-signs the data validation report before IC clears the incident.

---

## 8. Infrastructure Recovery Strategy

| Infrastructure Failure | Detection | Recovery Action | Validation | RTO |
| :--- | :--- | :--- | :--- | :--- |
| **Single ECS task crash** | CloudWatch: task stopped; ALB unhealthy count increases | ECS service automatically replaces task within 60 seconds | Health check returns 200 OK; task count = desired | $\le 2\text{ min}$ |
| **Full AZ failure (ECS)** | CloudWatch: multiple tasks stopped; AZ-specific pattern | ECS reschedules tasks to healthy AZs automatically | All tasks healthy in remaining AZs | $\le 5\text{ min}$ |
| **ALB target group unhealthy** | CloudWatch: `UnHealthyHostCount > 0` | ECS replaces failed tasks; DRE investigates if RDS-related | ALB health check: all targets healthy | $\le 5\text{ min}$ |
| **NAT Gateway failure** | ECS tasks: outbound internet failures in logs | AWS auto-creates replacement in same AZ; tasks in other AZs unaffected | Outbound connectivity confirmed | $\le 10\text{ min}$ |
| **Full regional infrastructure failure** | AWS Service Health Dashboard; all CloudWatch alarms firing | IC declares P0 regional DR; DevOps initiates Terraform reprovisioning in ap-southeast-2 | Full smoke test suite in recovery region | $\le 4\text{ hr}$ |

---

## 9. Recovery Priority Management

### 9.1 Service Recovery Priority Order
When multiple systems are affected simultaneously, the recovery sequence follows this priority:

| Priority | Service | Reason | Target RTO |
| :--- | :--- | :--- | :--- |
| **P1 — Critical** | PostgreSQL RDS (database) | Without the database, all other services are non-functional | $\le 5\text{ min}$ (Multi-AZ) |
| **P2 — Critical** | Go REST API | Core business logic; payment processing depends on this | $\le 5\text{ min}$ (ECS restart) |
| **P3 — High** | Authentication Service (part of Go API) | Merchants cannot log in without auth | $\le 10\text{ min}$ |
| **P4 — High** | Next.js Web Portal | Merchant admin interface; cashier POS web | $\le 15\text{ min}$ |
| **P5 — Medium** | ElastiCache Redis | Session cache; degraded performance without cache but functional | $\le 15\text{ min}$ |
| **P6 — Medium** | Receipt Generation (S3 PDF) | Receipts can be re-generated; not a blocking dependency | $\le 30\text{ min}$ |
| **P7 — Low** | Grafana Monitoring Dashboard | Monitoring works through CloudWatch; Grafana is a visualisation layer | $\le 24\text{ hr}$ |

### 9.2 Recovery Priority Rationale
The RDS database is the highest recovery priority because all application services are stateless — they can be restarted instantly, but they serve no function without a healthy database connection. Restoring database connectivity unlocks recovery of all higher-priority application services simultaneously.

---

## 10. Business Continuity Planning

### 10.1 During a P0 Outage (Full Platform Unavailable)

| Time | Business Action | Owner |
| :--- | :--- | :--- |
| T+0 min | IC declares P0 incident; SRE team assembled | IC |
| T+5 min | Status page updated: `"We are experiencing an incident. Our team is investigating."` | Business Representative |
| T+15 min | Affected merchants notified via email: estimated restoration time provided | Business Representative |
| T+30 min | Internal business update: Engineering Lead briefs management on scope and estimated RTO | IC |
| T+60 min | Status page update: recovery progress (if RTO > 60 minutes) | Business Representative |
| T + RTO | Status page cleared: `"Service has been restored."` | Business Representative |

### 10.2 Temporary Manual Operations During Extended Outage
*   For outages expected to exceed 2 hours, the Business Representative activates the manual operations fallback:
    *   Merchants are advised to record sales on physical receipts or local spreadsheets.
    *   Payments can be accepted offline using card terminals (not platform-dependent).
    *   Inventory updates will be synchronised once the platform is restored.
*   Manual transaction records are imported after platform restoration through a coordinated data reconciliation process with the DRE.

---

## 11. Recovery Testing Strategy

### 11.1 DR Test Calendar

| Test | Frequency | Participants | Environment | Success Criterion |
| :--- | :--- | :--- | :--- | :--- |
| **ECS Task Failure Simulation** | Monthly | SRE Lead | Staging | ECS auto-replaces task; no traffic interruption; RTO $\le 2\text{ min}$ |
| **RDS Multi-AZ Failover Simulation** | Bi-annual | DRE + DevOps | Staging RDS | Failover completes; application reconnects; RTO $\le 5\text{ min}$ |
| **RDS Snapshot Restore** | Quarterly | DRE + DevOps | Isolated recovery VPC | Full restore; data integrity checks pass; actual RTO $\le 45\text{ min}$ |
| **Blue-Green Rollback Drill** | Per release cycle | SRE + DevOps | Staging | ALB rollback completes in $\le 5\text{ min}$; smoke tests pass |
| **Communication Plan Drill** | Annual | IC + Business Rep | Simulated incident | All stakeholders notified within defined time targets |
| **Full Regional DR Drill** | Annual | Full DR team | ap-southeast-2 (recovery region) | Full stack operational; RTO $\le 4\text{ hr}$; RPO $\le 1\text{ hr}$ |

### 11.2 Why Testing Without Drills Is Insufficient
*   Runbooks contain manual steps. Steps that are never practiced become incorrect as infrastructure evolves.
*   RTO targets are assumptions until measured in a real (or simulated) restore exercise.
*   The communication plan is only effective if participants know their role and notification channels before an incident fires.

---

## 12. Disaster Communication Plan

### 12.1 Internal Communication Channels

| Audience | Channel | Timing | Message Type |
| :--- | :--- | :--- | :--- |
| **SRE / DevOps Team** | PagerDuty page + Slack `#incidents` | Immediate | Technical incident details; severity; call-to-action |
| **Engineering Lead** | PagerDuty escalation + Slack DM | P0: 5 min; P1: 15 min | Impact summary; IC identity; initial RTO estimate |
| **CTO** | Phone + Slack DM | P0 only; within 10 min | Business impact; RTO; recovery path selected |
| **Product Owner** | Slack DM + email | P0: 15 min; P1: 30 min | Feature/service impact; merchant impact scope |
| **All Engineering** | Slack `#incidents` post | On incident declaration | Incident declared; IC assigned; all-hands if needed |

### 12.2 External Communication

| Audience | Channel | Timing | Message Guidelines |
| :--- | :--- | :--- | :--- |
| **Merchants (P0 outage)** | Status page + email | Within 30 minutes of P0 declaration | Acknowledge outage; estimated recovery time; manual workaround guidance |
| **Merchants (resolution)** | Status page + email | Within 30 minutes of resolution | Confirm restored service; apologise; brief description of issue |
| **Enterprise Partners** | Phone + email | P0 only; within 1 hour | Direct account manager communication; custom impact statement |
| **Post-Incident (all users)** | Email + blog post | Within 48–72 hours of P0 | Transparent post-mortem summary; corrective actions committed |

### 12.3 Communication Message Standards
*   **Never:** Speculate on root cause in external communications before it is confirmed.
*   **Always:** Provide a specific next-update time (e.g., "We will update this page in 30 minutes.").
*   **Always:** Acknowledge impact honestly — avoid minimising phrases like "minor issue."
*   **Always:** Close the incident with a clear "service has been fully restored" statement.

---

## 13. Post-Disaster Review

### 13.1 Post-Incident Review Process

```
[ INCIDENT SUMMARY ]
 Compile: detection time, IC assigned, recovery start, resolution time
 Calculate: actual RTO vs. target RTO; actual RPO vs. target RPO
 Owner: SRE Lead
         │
         ▼
[ ROOT CAUSE ANALYSIS (RCA) ]
 Method: Five Whys or Fishbone Diagram
 Goal: Identify the deepest contributing cause — not just the immediate trigger
 Owner: IC + Application or DRE (depending on failure domain)
         │
         ▼
[ IMPACT ASSESSMENT ]
 Quantify: merchant downtime duration; estimated transaction volume affected
 Review: Was the RTO target met? Was the RPO target met?
 Review: Was the communication plan executed correctly?
 Owner: Business Representative + IC
         │
         ▼
[ IMPROVEMENT PLAN ]
 Categorise all identified gaps as: Runbook Update / Monitoring Improvement /
 Architecture Change / Process Improvement
 Assign owner and deadline for each action item
 Owner: Engineering Lead
         │
         ▼
[ IMPROVEMENT TRACKING ]
 Action items entered into the engineering backlog with P1 priority
 Follow-up review scheduled in 30 days to confirm actions completed
 Owner: Engineering Lead
```

### 13.2 Blameless Post-Mortem Culture
*   Post-incident reviews are blameless. The goal is system improvement, not fault attribution.
*   Engineers who surfaced an issue or executed a recovery are recognized for their contribution.
*   The post-mortem document is shared internally across the engineering organisation to spread learning.

---

## 14. Disaster Recovery Documentation

The following documents constitute the complete DR documentation suite:

| Document | Owner | Purpose | Location |
| :--- | :--- | :--- | :--- |
| **This DR Operations Document** | DevOps Lead | Strategy, classification, roles, workflow | `docs/07-Operations/04-Disaster-Recovery.md` |
| **Runbook: ECS Task Rollback** | SRE Lead | Step-by-step blue-green rollback | Internal wiki |
| **Runbook: RDS PITR Restore** | DRE | Step-by-step PITR restore procedure | Internal wiki |
| **Runbook: Full Regional DR** | DevOps Lead | Terraform reprovisioning in secondary region | Internal wiki |
| **Emergency Contact List** | Engineering Lead | IC, DRE, Security, Business Rep contacts | PagerDuty schedule + printed copy in ops room |
| **System Dependency Map** | Backend Architect | Service → database → cache → external dependency graph | `docs/02-System-Design/02-Detailed-Software-Design.md` |
| **Incident Report Template** | SRE Lead | Structured incident documentation | Internal wiki (template) |
| **Post-Incident Review Template** | Engineering Lead | Five-Why RCA + impact + action items | Internal wiki (template) |

---

## 15. Disaster Recovery Readiness Checklist

*   `[x]` Disaster classification matrix defined; all 8 categories have documented recovery approaches.
*   `[x]` RTO/RPO targets defined per tier; baseline tested in staging.
*   `[x]` Three-tier DR architecture (primary → backup → recovery region) documented and provisioned.
*   `[x]` Recovery team roles, decision authorities, and escalation contacts defined in PagerDuty.
*   `[x]` Incident Commander role designated; primary, secondary, and tertiary IC assigned.
*   `[x]` Service recovery priority order documented and agreed with business stakeholders.
*   `[x]` Runbooks written for: ECS rollback, RDS PITR restore, regional DR, and configuration rollback.
*   `[x]` Business continuity manual operations plan defined for extended P0 outages.
*   `[x]` DR test calendar scheduled: monthly task simulation, quarterly snapshot restore, annual full DR drill.
*   `[x]` Internal and external communication plan reviewed by Business Representative and Engineering Lead.
*   `[x]` Post-incident review process and blameless post-mortem culture established.
*   `[x]` Status page configured; Business Representative trained on status update procedures.

---

## 16. Conclusion

This Disaster Recovery Operations and Business Continuity Management Document defines the complete operational resilience framework — from an 8-category disaster classification matrix and three-tier cross-region DR architecture, through a 7-role recovery team structure with pre-delegated authority, a complete incident lifecycle workflow, tiered service recovery priority ordering, and business continuity interim operations planning, to a DR testing calendar, structured post-mortem process, and blameless incident culture. Enforcing this strategy ensures that the platform recovers predictably and safely from any failure scenario while maintaining transparent, timely communication with all stakeholders.

Operations teams can now proceed to **Part 5 — Incident Management**, which defines the formal incident response lifecycle, escalation matrices, SLA management, on-call operations, and continuous improvement processes for production operations.
