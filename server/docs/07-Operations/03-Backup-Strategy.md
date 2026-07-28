# OPERATIONS SPECIFICATION
## PART 3 — BACKUP STRATEGY & DATA PROTECTION OPERATIONS PLAN

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Database Reliability Engineer, SRE Lead & Data Protection Specialist  
**Status:** Approved  

---

## 1. Backup Strategy Overview

### 1.1 Backup Philosophy
The backup strategy for this platform follows a **3-2-1 data protection rule**:
*   **3** copies of all critical data (production live + primary backup + secondary archive).
*   **2** different storage technologies (RDS Backup Vault + S3 Object Storage).
*   **1** copy stored off-site or in a separate geographic region (S3 Cross-Region Replication to a secondary AWS region).

### 1.2 Business Continuity Requirements
*   **RPO (Recovery Point Objective):** $\le 1\text{ hour}$ for all PostgreSQL data; $\le 24\text{ hours}$ for file assets.
*   **RTO (Recovery Time Objective):** $\le 30\text{ minutes}$ for a single-table or single-tenant data restore; $\le 4\text{ hours}$ for full infrastructure reprovisioning from backup.

### 1.3 Why Backup Strategy Is Critical

*   **Data Protection:** Merchant transaction records, inventory ledgers, and financial reports are irreplaceable. Accidental deletion or data corruption without a verified backup constitutes permanent business damage.
*   **Disaster Recovery:** A regional AWS outage without cross-region backups could make the platform unrecoverable within business SLA windows.
*   **System Reliability:** Pre-migration snapshots and configuration backups allow engineers to revert any failed change without data loss, enabling aggressive and safe release cadence.

---

## 2. Backup Scope Definition

### 2.1 Complete Backup Inventory

| Asset | Criticality | Backup Frequency | Retention | Recovery Priority |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL database (all tables)** | 🔴 Critical | Continuous WAL + Daily snapshot | 7 days snapshot; 7 years audit data | P0 |
| **PostgreSQL schema (DDL)** | 🔴 Critical | On every migration | Versioned in Git | P0 |
| **Receipt PDFs** | 🟠 High | Real-time S3 replication | Permanent | P1 |
| **Product images** | 🟡 Medium | Real-time S3 replication | 2 years | P2 |
| **Application configuration (SSM)** | 🔴 Critical | On every change (SSM versioning) | 90-day version history | P0 |
| **Secrets (Secrets Manager)** | 🔴 Critical | On every rotation | 90-day version history | P0 |
| **Container images (ECR)** | 🟠 High | On every CI build | SemVer tags indefinite; SHA tags 30 days | P1 |
| **Terraform infrastructure state** | 🔴 Critical | On every `terraform apply` | Versioned in S3 indefinitely | P0 |
| **Audit logs** | 🔴 Critical | Real-time streaming to S3 | 7 years (WORM Object Lock) | P0 |
| **Application logs (operational)** | 🟡 Medium | Real-time to CloudWatch | 90 days active; 1 year archive | P3 |

---

## 3. Backup Architecture Design

```
[ PRODUCTION SYSTEMS ]
 RDS PostgreSQL (primary)
 AWS S3 (receipts, images)
 AWS Secrets Manager
 AWS SSM Parameter Store
 Amazon ECR (container images)
         │
         ▼
[ BACKUP PROCESS LAYER ]
 RDS: Automated daily snapshots + continuous WAL archiving (PITR)
 S3: Cross-Region Replication (real-time async replication)
 Secrets Manager: Version history (automatic on rotation)
 ECR: Image tag immutability policy
 Terraform: S3 versioned backend (state file preserved on every change)
         │
         ▼
[ BACKUP STORAGE LAYER ]
 Tier 1 (Hot): RDS Backup Vault (7-day snapshots)
 Tier 2 (Warm): S3 Standard-IA (30–365 day objects)
 Tier 3 (Cold): S3 Glacier (audit data; 1–7 year archives)
         │
         ▼
[ RECOVERY SYSTEM ]
 Tier 1: RDS PITR restore to new instance endpoint
 Tier 2: S3 object restore from Standard-IA
 Tier 3: S3 Glacier expedited retrieval (1–5 hours)
 Full DR: Terraform reprovisioning + RDS snapshot restore in secondary region
```

### 3.1 Component Responsibilities

| Component | Responsibility | Security Consideration |
| :--- | :--- | :--- |
| **AWS RDS Backup** | Automated daily snapshot management; PITR window | Snapshots encrypted with KMS CMK; accessible only by DevOps IAM role |
| **S3 Cross-Region Replication** | Real-time async replication of S3 objects to secondary region | Replication encrypted at rest (SSE-S3); replication IAM role is least-privilege |
| **S3 Object Lock (WORM)** | Immutable audit log storage for 7 years | No principal can delete WORM objects — even the DevOps IAM role |
| **ECR Image Immutability** | Prevents existing image tags from being overwritten | Enforced by ECR repository policy |
| **Terraform S3 Backend** | Versioned infrastructure state | State file encrypted with SSE-KMS; DynamoDB table enforces single-writer lock |

---

## 4. Backup Types Strategy

### 4.1 Full Backup
*   **Purpose:** A complete point-in-time snapshot of all data — no dependency on any prior backup.
*   **Advantages:** Simple restore (single file/snapshot); no dependency chain.
*   **Limitations:** Largest storage footprint; slowest to produce for large datasets.
*   **Usage in this project:** RDS daily automated snapshots are full backups of the entire PostgreSQL instance.

### 4.2 Incremental Backup
*   **Purpose:** Captures only the data changed since the last backup of any type.
*   **Advantages:** Smallest storage cost per backup run; fastest to produce.
*   **Limitations:** Restore requires the full backup plus every incremental since — complex restore chain.
*   **Usage in this project:** PostgreSQL WAL (Write-Ahead Log) archiving is continuous incremental — each WAL segment captures only the transactions since the previous segment. Used to enable Point-in-Time Recovery (PITR) between daily snapshots.

### 4.3 Differential Backup
*   **Purpose:** Captures all data changed since the last **full** backup.
*   **Advantages:** Simpler restore than incremental (full + one differential only).
*   **Limitations:** Grows larger than incremental over time; more expensive than incremental.
*   **Usage in this project:** Not directly used. The combination of daily RDS snapshots (full) + WAL archiving (incremental) provides equivalent or superior recovery granularity at lower operational overhead.

---

## 5. Database Backup Strategy

### 5.1 RDS PostgreSQL Backup Configuration

| Backup Type | Method | Schedule | Retention | Storage |
| :--- | :--- | :--- | :--- | :--- |
| **Automated Daily Snapshot** | AWS RDS Backup (full) | 02:00 UTC daily | 7 days | RDS Backup Vault |
| **Pre-Migration Manual Snapshot** | Manual RDS snapshot triggered by CI/CD | Before every production migration | 30 days | RDS Backup Vault |
| **WAL Continuous Archiving** | RDS PITR (automatic) | Continuous | 7-day PITR window | AWS RDS (internal) |
| **Schema DDL Backup** | Git repository (`db/migrations/`) | On every migration commit | Indefinite (Git history) | GitHub repository |
| **Long-term Compliance Archive** | AWS Backup cross-account copy | Monthly | 7 years | S3 Glacier (secondary region) |

### 5.2 Point-in-Time Recovery (PITR) Window
*   RDS PITR allows restoration to any second within the last 7 days.
*   Combined RPO: data loss limited to $\le 1\text{ minute}$ (WAL segment duration) for non-disaster scenarios.
*   The latest restorable time is continuously updated as new WAL segments arrive.

### 5.3 Backup Validation
*   Every automated daily snapshot is verified by an automated CloudWatch Event that checks the `CreateDBSnapshot` API response and alerts if the snapshot status is not `available` within 2 hours.
*   Snapshot restore is tested quarterly in a dedicated recovery environment (see Section 12).

---

## 6. Application Backup Strategy

### 6.1 Application Code
*   **Backup Method:** Git repository (GitHub). Every commit is a versioned backup of the application source code.
*   **Protection:** GitHub branch protection rules; required PR reviews; repository is mirrored to a secondary Git host quarterly.
*   **Recovery:** Any commit can be checked out and rebuilt by the CI/CD pipeline in minutes.

### 6.2 Application Configuration
*   **SSM Parameter Store:** All non-secret configuration values use SSM parameter versioning. Every update creates a new version; previous versions are retained for 90 days.
*   **Secrets Manager:** Every secret rotation creates a new version. Previous versions are accessible for 90 days post-rotation.
*   **Recovery:** Roll back to a prior SSM or Secrets Manager version requires only an ECS task restart — no infrastructure reprovisioning.

### 6.3 Container Images (ECR)
*   **Backup Policy:** SemVer-tagged images (`v1.4.0`) are never deleted by ECR lifecycle rules.
*   **Image Tag Immutability:** ECR repository immutability policy is enabled — existing tags cannot be overwritten.
*   **Recovery:** Deploying a prior version requires only updating the ECS task definition to reference the prior image tag — no rebuild.

### 6.4 Infrastructure Configuration (Terraform State)
*   **Backup Method:** S3 versioned backend. Every `terraform apply` creates a new state file version. The DynamoDB lock table prevents concurrent state modifications.
*   **Recovery:** A prior Terraform state version can be selected from S3 to roll back to an earlier infrastructure configuration.

---

## 7. File Storage Backup Strategy

### 7.1 S3 Asset Backup Architecture

| Asset Category | Primary S3 Bucket | Replication Target | Replication Type | Retention |
| :--- | :--- | :--- | :--- | :--- |
| **Receipt PDFs** | `saas-receipts-ap-southeast-1` | `saas-receipts-backup-ap-southeast-2` | S3 Cross-Region Replication (real-time) | Permanent |
| **Product images** | `saas-assets-ap-southeast-1` | `saas-assets-backup-ap-southeast-2` | S3 Cross-Region Replication (real-time) | 2 years |
| **Database export archives** | `saas-db-exports-ap-southeast-1` | — | S3 Intelligent-Tiering to Glacier | 7 years |
| **Audit log archives** | `saas-audit-logs-ap-southeast-1` | `saas-audit-backup-ap-southeast-2` | S3 Cross-Region Replication + Object Lock | 7 years (WORM) |

### 7.2 S3 Lifecycle Policy
*   Objects in the primary receipt bucket transition from S3 Standard → S3 Standard-IA after **30 days** (receipts are read frequently in the first month by merchants for reconciliation).
*   Objects older than 90 days transition to S3 Glacier (rarely accessed; retained for compliance).
*   S3 Versioning is enabled on all production buckets — accidental object deletion creates a delete marker (recoverable) rather than a permanent deletion.

---

## 8. Backup Security Strategy

### 8.1 Encryption Standards

| Backup Asset | Encryption at Rest | Encryption in Transit |
| :--- | :--- | :--- |
| RDS Automated Snapshots | AWS KMS CMK (AES-256) | TLS 1.2+ (AWS internal) |
| S3 Primary Buckets | SSE-KMS (AES-256) | HTTPS enforced via bucket policy |
| S3 Cross-Region Replication | SSE-KMS (destination KMS key) | TLS in-transit (AWS replication) |
| S3 Glacier Archives | SSE-KMS | HTTPS enforced |
| Terraform State (S3) | SSE-KMS | HTTPS enforced |

### 8.2 Access Control on Backups

| Backup Asset | Read Access | Restore Access | Delete Access |
| :--- | :--- | :--- | :--- |
| RDS Snapshots | DevOps Lead IAM role | DevOps Lead IAM role | DevOps Lead only; 7-day retention enforced |
| S3 Receipt Bucket | Application ECS task role (write); DevOps (read) | DevOps Lead | Prohibited (S3 Versioning active) |
| S3 Audit Bucket | Security Lead + DevOps Lead | Security Lead | Prohibited (WORM Object Lock) |
| Terraform State | DevOps team | DevOps Lead | Prohibited (S3 Versioning; MFA delete required) |

### 8.3 Backup Isolation
*   Backup storage (RDS Backup Vault, S3 backup buckets) is in a separate AWS account from the production application account, preventing a compromised application IAM role from accessing or deleting backups.
*   Cross-account backup replication uses a dedicated backup IAM role with write-only permissions on the destination — the source account cannot delete from the destination.

---

## 9. Backup Retention Policy

### 9.1 Retention Tiers

| Tier | Duration | Storage Class | Cost Profile | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Short-term (Hot)** | 0–7 days | RDS Backup Vault / S3 Standard | Higher cost; instant access | Operational recovery from accidental deletion or failed migration |
| **Medium-term (Warm)** | 7 days–1 year | S3 Standard-IA / S3 Intelligent-Tiering | ~50% lower than Standard | Monthly reporting access; migration recovery; audit investigation |
| **Long-term (Cold)** | 1 year–7 years | S3 Glacier | ~80% lower than Standard | Compliance archive; forensic investigation; regulatory audit |

### 9.2 Cost-Compliance Balance
*   Daily RDS snapshots retained for **7 days** (not longer) to balance instant recovery capability against RDS Backup Vault storage costs.
*   Operational application logs archived to S3 Standard-IA after 90 days — a 50% cost reduction vs. CloudWatch Logs storage for the same data.
*   Audit logs are retained for 7 years in S3 Glacier — the lowest cost tier that still satisfies enterprise financial record retention requirements.

---

## 10. Backup Monitoring Strategy

All backup operations emit status events that feed CloudWatch Alarms:

| Monitoring Check | Method | Alert Threshold | Notification |
| :--- | :--- | :--- | :--- |
| **Daily RDS snapshot success** | CloudWatch Event on `CreateDBSnapshot` status | Snapshot not `available` within 2 hours | PagerDuty P1 |
| **RDS PITR window health** | CloudWatch metric `OldestRestorableTime` | Gap $\ge 2\text{ hours}$ in PITR coverage | PagerDuty P1 |
| **Pre-migration snapshot created** | CI/CD pipeline snapshot ID check | Snapshot creation failure blocks pipeline | CI/CD pipeline halt |
| **S3 Cross-Region Replication lag** | S3 Replication Time Control metric | Replication age $\ge 1\text{ hour}$ | Slack P2 |
| **S3 Backup Bucket Storage Growth** | CloudWatch S3 `BucketSizeBytes` | $\ge 90\%$ of projected budget capacity | Slack P2 |
| **Audit Log Delivery Continuity** | CloudWatch Logs Metric Filter (event count per hour) | 0 events per hour during business hours | PagerDuty P1 |
| **RDS Snapshot Expiry Imminent** | CloudWatch Events on snapshot expiry | $\le 1\text{ day}$ until 7-day expiry | Slack reminder |

---

## 11. Restore Strategy

### 11.1 Standard Restore Workflow

```
[ IDENTIFY REQUIRED BACKUP ]
 Determine recovery target: specific tenant? specific table? point in time?
 Identify backup type needed: PITR (minute-level) or daily snapshot (day-level)
         │
         ▼
[ VALIDATE BACKUP ]
 Confirm snapshot status: `available`
 Confirm S3 object ETag matches expected checksum (for file restores)
 Review snapshot creation timestamp — confirm it precedes the incident
         │
         ▼
[ RESTORE DATA ]
 RDS PITR: Create new RDS instance from PITR restore to a specific timestamp
 RDS Snapshot: Create new RDS instance from snapshot
 S3 File: Copy object from Cross-Region Replication bucket to primary bucket
 Terraform: Select prior S3 state version; `terraform apply` to reprovisioned state
         │
         ▼
[ VERIFY SYSTEM ]
 Row count assertions on restored instance
 RLS cross-tenant isolation test
 Application health check against restored endpoint
 Smoke tests confirm core business flows operational
         │
         ▼
[ RESUME OPERATION ]
 Update application ECS task environment variables to point to restored endpoint
 Notify stakeholders: "Data restored to [timestamp]. Operations resumed."
 Document incident and root cause in incident log
```

### 11.2 Restore Time Estimates

| Restore Type | Estimated Duration | Notes |
| :--- | :--- | :--- |
| RDS PITR (existing instance) | $\le 30\text{ minutes}$ | New instance created; DNS update required |
| RDS snapshot restore (100 GB) | $\le 45\text{ minutes}$ | Full instance provision from snapshot |
| S3 file restore (Standard-IA) | $\le 5\text{ minutes}$ | Copy from backup bucket to primary |
| S3 Glacier restore (expedited) | 1–5 hours | Expedited retrieval tier |
| Full DR Terraform reprovisioning | $\le 4\text{ hours}$ | Complete infrastructure + RDS from snapshot |

---

## 12. Backup Testing Strategy

### 12.1 Why Untested Backups Are Not Backups
A backup file that has never been restored is an assumption, not a guarantee. Corrupted snapshots, expired KMS keys, misconfigured S3 replication, and incorrect restore procedures are all discovered only during a restore test — ideally scheduled, not during a P0 incident.

### 12.2 Recovery Test Schedule

| Test | Frequency | Environment | Owner | Success Criterion |
| :--- | :--- | :--- | :--- | :--- |
| **RDS Daily Snapshot Restore** | Quarterly | Isolated recovery VPC | DevOps Engineer | Full restore; integrity checks pass; actual RTO $\le 45\text{ min}$ |
| **RDS PITR Restore to Specific Timestamp** | Quarterly | Isolated recovery VPC | DB Lead + DevOps | Restore to T-60 min; row count correct; actual RPO $\le 1\text{ hour}$ |
| **S3 Cross-Region Restore** | Bi-annual | Staging environment | DevOps Engineer | Receipt PDF restored from secondary bucket; file hash matches |
| **Terraform Reprovisioning from State** | Annual | Recovery region | DevOps Lead | Full stack operational; RTO $\le 4\text{ hours}$ |
| **Secrets Manager Version Rollback** | Annual | Staging environment | DevOps Engineer | Previous secret version restored; application reconnects |

### 12.3 Test Documentation Requirements
Every backup restore test produces a written report recording:
*   Actual restore duration vs. RTO/RPO target.
*   Data integrity check results (pass/fail per assertion).
*   Issues discovered and remediation actions.
*   Confirmation that the restore procedure documentation is still accurate.

---

## 13. Backup Failure Management

| Failure Type | Detection | Immediate Response | Recovery |
| :--- | :--- | :--- | :--- |
| **Daily RDS snapshot fails** | CloudWatch Event: snapshot status `failed` | PagerDuty P1 alert; trigger manual snapshot immediately | DevOps investigates RDS instance state; re-triggers snapshot; opens AWS support case if systemic |
| **S3 Cross-Region Replication lag** | CloudWatch S3 RTC metric exceeds 1 hour | Slack P2 alert; verify S3 replication health dashboard | Check IAM replication role permissions; verify destination bucket policy; re-enable replication rule if disabled |
| **Corrupted backup discovered** | Restore test fails; checksums mismatch | Escalate to P1; identify next valid backup in history | Restore from the nearest valid prior snapshot; document gap in coverage; review backup process for corruption source |
| **Missing pre-migration backup** | CI/CD pipeline check fails; snapshot ID not found | Pipeline halts — migration does not proceed | DevOps manually creates RDS snapshot; confirms availability; re-triggers deployment |
| **KMS key inaccessible (snapshot decrypt fails)** | Restore attempt returns `KMS key not found` error | Escalate to P0; KMS key policy or key deletion suspected | Restore KMS key from CloudTrail audit; re-grant key access; if key deleted, escalate to AWS support for recovery |

---

## 14. Data Protection Compliance

### 14.1 Data Privacy Requirements
*   **Merchant PII in PostgreSQL:** All personally identifiable fields (customer names, phone numbers, addresses) stored in the database are encrypted at the column level using PostgreSQL `pgcrypto` where required by local data privacy regulations.
*   **Backup Data Privacy:** Backup snapshots contain live production data and are subject to the same privacy controls. Access to RDS snapshots is restricted to named DevOps IAM principals.

### 14.2 Access Control on Backup Operations
*   Backup creation and restore operations generate CloudTrail audit entries: who triggered the operation, which resource was targeted, and the outcome.
*   Backup access IAM policies are reviewed bi-annually to ensure no ex-employee retains access.

### 14.3 Secure Deletion of Expired Backups
*   RDS snapshot expiry is managed by the RDS automated backup retention policy — expired snapshots are deleted by AWS, not manually.
*   S3 lifecycle policies delete Standard-IA objects after their retention period expires. All S3 deletes are logged in S3 server access logs.
*   WORM-protected audit log objects **cannot be deleted** before the Object Lock retention period expires — this is enforced by S3 at the API level.

### 14.4 Audit Trail for Backup Operations
Every backup-related action is captured in AWS CloudTrail:
*   `CreateDBSnapshot`, `RestoreDBInstanceFromDBSnapshot`
*   `s3:PutObject`, `s3:GetObject` (from the backup buckets)
*   `kms:Decrypt` (when decrypting backup data for restore)

---

## 15. Backup Operations Readiness Checklist

*   `[x]` RDS automated daily snapshot configured; 7-day retention; 02:00 UTC schedule.
*   `[x]` RDS PITR enabled; 7-day PITR window; WAL archiving active.
*   `[x]` Pre-migration manual snapshot policy defined and enforced in CI/CD pipeline.
*   `[x]` S3 Cross-Region Replication configured for receipts, assets, and audit logs.
*   `[x]` S3 Versioning enabled on all production buckets.
*   `[x]` S3 Object Lock (WORM) enabled on the audit log archive bucket; 7-year retention.
*   `[x]` All backup storage encrypted with KMS CMK; keys managed in dedicated KMS key policy.
*   `[x]` Backup storage hosted in a separate AWS account from production.
*   `[x]` CloudWatch Event monitoring for daily snapshot success/failure.
*   `[x]` CloudWatch S3 replication lag monitoring alert at $\ge 1\text{ hour}$.
*   `[x]` ECR image tag immutability enabled; SemVer tags protected from lifecycle deletion.
*   `[x]` Terraform state versioned S3 backend with DynamoDB lock and MFA delete.
*   `[x]` Quarterly RDS snapshot restore test scheduled; bi-annual S3 restore test scheduled.
*   `[x]` Backup failure PagerDuty alert routing confirmed active.

---

## 16. Conclusion

This Backup Strategy and Data Protection Operations Plan Document defines the complete data protection architecture for the platform — from the 3-2-1 backup philosophy and multi-tier storage architecture, through RDS PITR and daily snapshot governance, S3 Cross-Region Replication and WORM audit log compliance, backup encryption and access control standards, to restore procedures, failure management matrices, and quarterly testing schedules. Enforcing this strategy guarantees that merchant financial data, inventory records, and audit trails remain protected, recoverable, and compliant under all failure scenarios.

Operations teams can now proceed to **Part 4 — Disaster Recovery**, which formalises the cross-region DR architecture, RTO/RPO verification procedures, incident response runbooks, and annual DR drill execution plan.
