# DEPLOYMENT SPECIFICATION
## PART 8 — ROLLBACK STRATEGY & DISASTER RECOVERY PLANNING

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Disaster Recovery Architect, SRE Lead & Business Continuity Specialist  
**Status:** Approved  

---

## 1. Disaster Recovery Overview

### 1.1 Recovery Philosophy
Enterprise SaaS platforms that process live merchant financial transactions cannot treat recovery as an afterthought. Every deployment decision, infrastructure choice, and monitoring strategy in this project has been made with the following disaster recovery philosophy:

*   **Plan for Failure:** Every component will eventually fail. Architecture, processes, and runbooks are designed assuming failure will occur, not if it occurs.
*   **Automate Recovery Where Possible:** Multi-AZ automatic database failover, ECS task replacement, and blue-green rollback are all automated — reducing human reaction time during incidents.
*   **Test Recovery Regularly:** A backup that has never been restored is not a backup. Recovery procedures are tested on a scheduled basis.
*   **Protect Data Above All Else:** Merchant transaction data, inventory records, and financial ledgers are the highest-priority assets. Recovery procedures prioritise data integrity over recovery speed.

### 1.2 Why Disaster Recovery Is Critical for Enterprise Systems
*   **Revenue Impact:** A 1-hour platform outage during peak trading hours can represent significant direct revenue loss for merchants.
*   **Trust Impact:** Merchants who cannot process payments during an outage lose confidence in the platform. Churn risk increases with every incident.
*   **Regulatory Impact:** Financial transaction platforms may be subject to data retention and availability regulations. Inability to recover data within defined windows can constitute a compliance breach.

---

## 2. Recovery Objectives Definition

### 2.1 Recovery Time Objective (RTO)
The RTO defines the maximum acceptable duration between a failure event and full system restoration. Exceeding the RTO means the business has suffered an unacceptable service interruption.

| Tier | Component | RTO Target | Recovery Mechanism |
| :--- | :--- | :--- | :--- |
| **Critical** | Payment checkout API | $\le 5\text{ minutes}$ | Blue-green ECS rollback |
| **Critical** | Authentication service | $\le 5\text{ minutes}$ | Blue-green ECS rollback |
| **High** | Admin web portal | $\le 15\text{ minutes}$ | ECS task replacement |
| **High** | RDS PostgreSQL (AZ failure) | $\le 5\text{ minutes}$ | RDS Multi-AZ automatic failover |
| **Medium** | Full infrastructure (region failure) | $\le 4\text{ hours}$ | Terraform reprovisioning + RDS snapshot restore |
| **Low** | Grafana monitoring dashboards | $\le 24\text{ hours}$ | ECS task restart |

### 2.2 Recovery Point Objective (RPO)
The RPO defines the maximum acceptable data loss measured as time — how far back in time data may need to be restored from in the worst case.

| Tier | Component | RPO Target | Data Protection Mechanism |
| :--- | :--- | :--- | :--- |
| **Critical** | Transaction & order records | $\le 1\text{ minute}$ | RDS Multi-AZ synchronous replication |
| **High** | All PostgreSQL data | $\le 1\text{ hour}$ | Continuous WAL archiving to S3 |
| **Medium** | Receipt PDFs & file assets | $\le 24\text{ hours}$ | Daily S3 Cross-Region Replication |
| **Low** | Application configuration | $0\text{ minutes}$ (no data loss) | Terraform state in S3 (versioned) |

---

## 3. Rollback Strategy Overview

### 3.1 When Rollback Is Required
A production rollback reverts the application to the last known-stable version. The on-call SRE is authorised to initiate a rollback without manager approval if any of the following conditions are met:

| Trigger | Condition | Rollback Type |
| :--- | :--- | :--- |
| **Failed Deployment** | ECS Green tasks fail health checks after deployment | Application rollback (Blue-Green switch back) |
| **Critical Application Error** | API 5xx error rate $\ge 5\%$ for $\ge 5\text{ minutes}$ | Application rollback |
| **Database Migration Failure** | `golang-migrate up` exits with error | Schema auto-rollback (transaction); no app deployed |
| **Performance Degradation** | p99 checkout latency $\ge 500\text{ ms}$ for $\ge 10\text{ minutes}$ | Application rollback; investigate query regression |
| **Data Integrity Failure** | Post-migration validation checks fail | Application rollback; RDS snapshot restore if data mutated |
| **Security Incident** | Exploit or data breach detected in new deployment | Emergency rollback; security isolation procedures activated |

---

## 4. Application Rollback Strategy

### 4.1 Blue-Green Application Rollback Process

```
[ DETECT ISSUE ]
 CloudWatch alarm fires OR smoke test fails OR SRE manual assessment
         │
         ▼
[ STOP RELEASE — DECLARE ROLLBACK ]
 SRE posts to #deployments: "⚠️ Initiating rollback of v<X.Y.Z>"
 P1 PagerDuty incident opened
         │
         ▼
[ RESTORE PREVIOUS VERSION ]
 ALB listener rule updated: 100% traffic switched back from Green → Blue
 Blue tasks (previous stable version) are already running and healthy
 Time to restore: ≤ 5 minutes (ALB listener update is instantaneous)
         │
         ▼
[ VALIDATE SYSTEM ]
 Re-run production smoke tests against Blue tasks
 Confirm: /healthz returns 200 OK
 Confirm: error rate returns to ≤ 0.5%
 Confirm: p99 latency returns to ≤ 50 ms
         │
         ▼
[ RESUME SERVICE — DECLARE STABLE ]
 SRE posts: "✅ Rollback complete. v<previous> stable."
 Green ECS tasks terminated; ECR image tag quarantined
 Post-mortem scheduled
```

### 4.2 Rollback Decision Criteria
*   **Automatic Rollback Triggers:** Smoke test failure on a critical-path test case. The CI/CD pipeline executes the ALB listener revert without human intervention.
*   **Manual Rollback Triggers:** SRE observes sustained metric degradation. The SRE executes the rollback via the GitHub Actions manual rollback workflow run.
*   **Rollback Window:** The Blue ECS task group is retained for a minimum of 60 minutes after the traffic switch. Blue tasks are only terminated after the SRE declares the Green deployment stable.

---

## 5. Database Rollback Strategy

### 5.1 Why Database Rollback Requires Special Planning
Database rollback is fundamentally more complex than application rollback because:
*   `DROP TABLE` and `DROP COLUMN` operations are destructive and cannot be undone without a backup.
*   A `golang-migrate down` reversion can revert schema structure but cannot restore data that was deleted or transformed by the `up` migration.
*   Application code and database schema must always be compatible. A schema rollback without a simultaneous application rollback will break the running application.

### 5.2 Database Rollback Decision Tree

```
Did the migration fail BEFORE committing?
│
├── YES → Transaction auto-rolled back. Schema unchanged.
│         No data loss. Proceed with application rollback only.
│
└── NO → Migration committed successfully.
          │
          ├── Was any data deleted or transformed?
          │   │
          │   ├── NO → Run golang-migrate down <N>.
          │   │         Verify schema version. Proceed.
          │   │
          │   └── YES → Restore from pre-deployment RDS snapshot.
          │             (30-minute restore; all transactions since snapshot are lost)
          │             Coordinate with business team to reprocess lost orders.
          │
          └── Post-migration application incompatibility detected?
              → Run golang-migrate down <N> + application rollback simultaneously.
```

### 5.3 RDS Snapshot Restoration Procedure
1.  DevOps Lead initiates a P1 incident and notifies the Engineering Lead.
2.  The snapshot ID recorded in the deployment log is confirmed.
3.  A new RDS instance is restored from the snapshot in a separate endpoint.
4.  The restored instance is validated (row counts, data integrity checks).
5.  Application ECS tasks are updated to point to the restored RDS endpoint.
6.  The original (corrupted) RDS instance is retained for forensic analysis before termination.

---

## 6. Infrastructure Recovery Strategy

### 6.1 Failure Scenarios & Recovery

| Failure Type | Detection | Response | Recovery Target |
| :--- | :--- | :--- | :--- |
| **ECS Task Crash** | CloudWatch ECS task stopped alarm | ECS automatically replaces the failed task within 30 seconds | Automatic; RTO $\le 1\text{ minute}$ |
| **Availability Zone (AZ) Failure** | CloudWatch: ECS tasks unhealthy in one AZ | ECS reschedules tasks in healthy AZ; RDS Multi-AZ fails over to standby | Automatic; RTO $\le 5\text{ minutes}$ |
| **RDS Primary Failure** | CloudWatch RDS: `ReplicaLag = -1` (failover in progress) | RDS automatically promotes standby replica to primary | Automatic; RTO $\le 5\text{ minutes}$; RPO $= 0$ |
| **ElastiCache Redis Node Failure** | CloudWatch: Redis `CurrConnections` drops to 0 | ElastiCache promotes replica to primary; sessions re-establish | Automatic; RTO $\le 2\text{ minutes}$ |
| **ALB Health Check Failure** | CloudWatch: ALB `UnHealthyHostCount > 0` | ALB deregisters unhealthy tasks; ECS replaces them | Automatic; RTO $\le 3\text{ minutes}$ |
| **Full AWS Region Failure** | AWS Service Health Dashboard; all CloudWatch alarms firing | Manual DR: Terraform reprovisioning in secondary region + RDS snapshot restore | Manual; RTO $\le 4\text{ hours}$ |

### 6.2 Network Failure Recovery
*   **NAT Gateway Failure:** ECS tasks lose outbound internet (cannot reach Stripe/Bakong). Fallback: AWS creates a replacement NAT Gateway automatically in the same AZ. If the entire subnet is lost, tasks are rescheduled to a healthy AZ.
*   **Route 53 DNS Failure:** Route 53 is a globally distributed service with 100% uptime SLA. No mitigation required beyond confirming TTL values are set appropriately.

---

## 7. Backup & Restore Strategy

### 7.1 Backup Inventory

| Backup Type | Target | Tool | Frequency | Retention | Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RDS Automated Snapshot** | Full PostgreSQL instance | AWS RDS Backup | Daily at 02:00 UTC | 7 days | AWS RDS Backup vault |
| **RDS WAL Archiving** | Continuous transaction log | AWS RDS PITR | Continuous | 7 days | AWS RDS (internal) |
| **Pre-Deployment Snapshot** | Full PostgreSQL instance | CI/CD pipeline (manual RDS snapshot) | Before every production migration | 30 days | AWS RDS Backup vault |
| **S3 Receipts & Files** | Receipt PDFs, product images | S3 Cross-Region Replication | Real-time | Permanent | S3 (secondary region) |
| **Terraform State** | Full infrastructure definition | Terraform S3 backend | On every `terraform apply` | Versioned (indefinite) | S3 + DynamoDB lock |
| **Application Secrets** | All Secrets Manager entries | Secrets Manager versioning | On every rotation | 90-day version history | AWS Secrets Manager |

### 7.2 Restore Validation
*   Every backup restoration must be validated by querying the restored environment for expected row counts on the `orders`, `tenants`, and `products` tables.
*   Restored databases undergo the RLS cross-tenant isolation test before the restored endpoint is connected to the application.

---

## 8. Disaster Recovery Architecture

### 8.1 Primary and Recovery Architecture

```
[ PRIMARY ENVIRONMENT — AWS ap-southeast-1 (Singapore) ]
 ECS Fargate (Go API + Next.js)
 RDS PostgreSQL Multi-AZ
 ElastiCache Redis Multi-AZ
 S3 (receipts, assets)
         │
         │ Continuous replication
         ▼
[ BACKUP SYSTEMS ]
 RDS Automated Daily Snapshots → AWS RDS Backup Vault
 RDS WAL Continuous Archiving → Point-in-Time Recovery
 S3 Cross-Region Replication → ap-southeast-2 (Sydney)
 Terraform State → S3 versioned backend
         │
         │ On declared regional disaster
         ▼
[ RECOVERY ENVIRONMENT — AWS ap-southeast-2 (Sydney) ]
 Terraform reprovisioning from state file
 RDS restored from latest snapshot or cross-region replica
 ECS tasks launched from ECR (images replicated to secondary region)
 Route 53 DNS updated to point to recovery ALB
```

### 8.2 Recovery Tiers

| Tier | Scenario | Recovery Approach | Estimated RTO |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Single ECS task failure | ECS automatic task replacement | $\le 1\text{ minute}$ |
| **Tier 2** | AZ failure or RDS primary failure | Multi-AZ automatic failover | $\le 5\text{ minutes}$ |
| **Tier 3** | Full service outage (app-level) | Blue-green rollback or ECS service redeploy | $\le 15\text{ minutes}$ |
| **Tier 4** | Data corruption requiring snapshot restore | RDS PITR or snapshot restore | $\le 1\text{ hour}$ |
| **Tier 5** | Full AWS regional failure | Cross-region DR reprovisioning | $\le 4\text{ hours}$ |

---

## 9. High Availability & Failover Strategy

### 9.1 Redundancy by Component

| Component | Redundancy Mechanism | Failover Type |
| :--- | :--- | :--- |
| **ECS API Tasks** | Minimum 2 tasks across 2 AZs | ALB redistributes traffic; ECS replaces failed task |
| **ECS Web Tasks** | Minimum 2 tasks across 2 AZs | ALB redistributes traffic automatically |
| **RDS PostgreSQL** | Multi-AZ with synchronous standby replica | Automatic DNS failover in $\le 5\text{ minutes}$; zero data loss |
| **ElastiCache Redis** | Primary + 1 replica | Automatic promotion of replica on primary failure |
| **ALB** | AWS-managed; inherently multi-AZ | No action required; AWS SLA 99.99% |
| **Route 53 DNS** | Global Anycast network | No action required; AWS SLA 100% |

### 9.2 Health Monitoring Enabling Failover
*   **ALB Health Checks:** Poll `/healthz` every 10 seconds. Tasks failing 3 consecutive checks are deregistered.
*   **ECS Task Health:** CloudWatch monitors ECS `TaskCount` vs. desired count; auto-scaling replaces stopped tasks.
*   **RDS Enhanced Monitoring:** Monitors OS-level metrics (CPU, I/O) at 1-second granularity to detect pre-failure conditions.

---

## 10. Incident Recovery Workflow

```
[ INCIDENT DETECTION ]
 Source: CloudWatch alarm / PagerDuty / smoke test failure / merchant report
 Owner: On-Call SRE
         │
         ▼
[ IMPACT ANALYSIS ] (Target: < 5 minutes)
 Determine: Is this a deployment issue or infrastructure issue?
 Determine: Which services are affected? (API / Web / DB / Cache)
 Determine: Is data loss or corruption possible?
 Owner: On-Call SRE + Engineering Lead
         │
         ▼
[ RECOVERY DECISION ]
 P0/P1: Declare incident; initiate rollback or DR procedure
 P2/P3: Investigate; decide between rollback, hotfix, or infrastructure fix
 Owner: On-Call SRE (P1 authority to rollback without approval)
         │
         ▼
[ EXECUTE RECOVERY PLAN ]
 Application rollback (ALB listener switch) OR
 Infrastructure recovery (ECS redeploy / RDS failover) OR
 Data recovery (RDS snapshot restore)
 Owner: DevOps Engineer + On-Call SRE
         │
         ▼
[ SYSTEM VALIDATION ]
 Smoke tests; health check; metric baseline comparison
 Owner: QA Lead + On-Call SRE
         │
         ▼
[ INCIDENT CLOSURE ]
 Declare service restored; update incident record
 Post-mortem scheduled within 24 hours (P0/P1) or 72 hours (P2)
 Owner: Engineering Lead + DevOps Lead
```

### 10.1 Incident Severity Classification

| Severity | Definition | Response Time | Escalation |
| :--- | :--- | :--- | :--- |
| **P0 — Critical** | Complete platform outage; no merchants can process payments | Immediate (on-call SRE paged now) | CTO + Engineering Lead within 5 minutes |
| **P1 — Major** | Core feature unavailable; checkout or login broken | $\le 15\text{ minutes}$ | Engineering Lead within 15 minutes |
| **P2 — Moderate** | Non-critical feature broken; workaround exists | $\le 1\text{ hour}$ | Engineering Lead notified |
| **P3 — Minor** | Cosmetic or low-impact issue | Next business day | Ticket created |

---

## 11. Data Recovery Validation

After any data recovery operation (snapshot restore or PITR), the following validation sequence must pass before the recovered database is connected to the production application:

```
[ DATABASE INTEGRITY CHECKS ]
 Row count assertions on all core tables:
 tenants, users, products, orders, inventory, payments
         │
         ▼
[ REFERENTIAL INTEGRITY CHECKS ]
 Foreign key constraint validation (no orphaned records)
 NOT NULL constraint scan on critical fields
         │
         ▼
[ MULTI-TENANT RLS ISOLATION TEST ]
 Tenant A session cannot read Tenant B's orders
 Confirm RLS policies are correctly applied on restored database
         │
         ▼
[ APPLICATION FUNCTIONALITY VERIFICATION ]
 API health check: /healthz → 200 OK
 Authentication flow: login returns valid JWT
 Core transaction: checkout completes without error
         │
         ▼
[ BUSINESS PROCESS VALIDATION ]
 End-to-end order flow (create → pay → receipt) on recovered environment
 Report generation returns correct historical data
         │
         ▼
[ DATA RECOVERY SIGN-OFF ]
 DB Lead and DevOps Lead co-sign the recovery validation report
 Recovery report stored in S3 incident log bucket
```

---

## 12. Recovery Testing Strategy

### 12.1 Scheduled Recovery Tests

| Test Type | Frequency | Environment | Owner | Success Criterion |
| :--- | :--- | :--- | :--- | :--- |
| **RDS Snapshot Restore** | Quarterly | Isolated recovery environment | DevOps Engineer | Full restore completes; all integrity checks pass |
| **RDS Point-in-Time Recovery** | Quarterly | Isolated recovery environment | DB Lead + DevOps | PITR to a specific timestamp; RPO $\le 1\text{ hour}$ validated |
| **Blue-Green Rollback Drill** | Every release cycle | Staging environment | On-Call SRE | ALB rollback completes in $\le 5\text{ minutes}$ |
| **ECS Task Failure Simulation** | Monthly | Staging environment | DevOps Engineer | ECS auto-replaces task; no traffic interruption |
| **Multi-AZ Failover Test** | Bi-annual | Staging RDS | DevOps Lead | RDS failover completes; application reconnects in $\le 5\text{ minutes}$ |
| **Full DR Drill (Region Failure)** | Annual | Recovery region environment | DevOps Lead + SRE | Full stack reprovisioned; RTO $\le 4\text{ hours}$ |

### 12.2 Recovery Test Documentation
*   Every recovery test produces a written test report recording the actual RTO achieved, issues discovered, and any runbook updates required.
*   Test reports are stored in the S3 DR documentation bucket and reviewed in the quarterly infrastructure review meeting.

---

## 13. Incident Communication Plan

### 13.1 During Incident Communication

| Audience | Channel | Timing | Content |
| :--- | :--- | :--- | :--- |
| **On-Call SRE** | PagerDuty alert | Immediate (automated) | Alert details; affected service; severity |
| **Engineering Lead** | PagerDuty escalation + Slack DM | P0: 5 min; P1: 15 min | Impact summary; recovery plan |
| **CTO** | Phone + Slack DM | P0 only; within 10 minutes | Business impact; estimated RTO |
| **DevOps Team** | Slack `#incidents` | Within 5 minutes | Incident declared; SRE taking lead |
| **Business Users / Merchants** | Email / Status page | P0: within 30 minutes | "We are aware of an issue and are working to resolve it." |

### 13.2 After Incident Communication

| Audience | Channel | Timing | Content |
| :--- | :--- | :--- | :--- |
| **All Engineering** | Slack `#incidents` | Immediately on resolution | "Service restored. Post-mortem on [date]." |
| **Management** | Email | Within 1 hour of resolution | Executive summary: duration; impact; root cause |
| **Merchants** | Email / Status page | Within 2 hours of resolution | Incident summary; what happened; what was fixed |
| **Post-Mortem Participants** | Confluence / document | Within 24–72 hours | Full post-mortem; timeline; root cause; action items |

---

## 14. Disaster Recovery Documentation

The following documents must be maintained and reviewed quarterly:

| Document | Owner | Content | Storage |
| :--- | :--- | :--- | :--- |
| **DR Plan** (this document) | DevOps Lead | Recovery procedures; RTO/RPO targets; failover architecture | Git repository `docs/06-Deployment/08-Rollback-Plan.md` |
| **Backup Verification Report** | DevOps Engineer | Quarterly backup restore test results | S3 DR documentation bucket |
| **Runbook: Application Rollback** | On-Call SRE | Step-by-step ALB rollback procedure | Internal wiki (Confluence) |
| **Runbook: RDS Snapshot Restore** | DB Lead + DevOps | Step-by-step snapshot restore procedure | Internal wiki (Confluence) |
| **Runbook: Full Region DR** | DevOps Lead | Terraform re-provisioning steps for secondary region | Internal wiki (Confluence) |
| **Incident Report** | On-Call SRE | Per-incident: timeline; impact; root cause | S3 incident log bucket |
| **Post-Incident Review** | Engineering Lead | Root cause analysis; action items; prevention measures | Confluence; shared with management |

---

## 15. Recovery Readiness Checklist

*   `[x]` Pre-deployment RDS snapshot policy defined and automated in CI/CD pipeline.
*   `[x]` RDS automated daily snapshots configured; 7-day retention.
*   `[x]` RDS WAL continuous archiving enabled for point-in-time recovery.
*   `[x]` S3 Cross-Region Replication active for receipt PDFs and file assets.
*   `[x]` Terraform state stored in versioned S3 backend; DynamoDB state lock configured.
*   `[x]` RDS Multi-AZ enabled; automatic failover tested.
*   `[x]` ECS task minimum count set to 2 across 2 Availability Zones.
*   `[x]` Blue-green rollback procedure documented; ALB listener revert tested in staging.
*   `[x]` golang-migrate down files present for every up migration.
*   `[x]` Incident severity classification defined; PagerDuty escalation policies configured.
*   `[x]` CloudWatch alarms and PagerDuty integration active and tested.
*   `[x]` Recovery testing calendar scheduled (quarterly snapshot restore; bi-annual failover test; annual DR drill).
*   `[x]` Incident communication plan reviewed by Engineering Lead and CTO.
*   `[x]` All runbooks written and accessible to on-call engineers.

---

## 16. Conclusion

This Rollback Strategy and Disaster Recovery Planning Document establishes the complete business continuity framework for the platform — from blue-green application rollback with a 5-minute execution target, through tiered infrastructure failover mechanisms and database snapshot restoration procedures, to cross-region DR reprovisioning for regional disaster scenarios. Enforcing this strategy ensures the platform remains resilient, recoverable, and trustworthy for merchants who depend on it for their daily business operations.

This document concludes **Phase 6 — Deployment**. All eight deployment documents are now complete. The project is ready to proceed to **Phase 7 — Operations**, beginning with the Monitoring & Observability Strategy.
