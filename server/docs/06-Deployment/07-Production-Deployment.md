# DEPLOYMENT SPECIFICATION
## PART 7 — PRODUCTION DEPLOYMENT & RELEASE MANAGEMENT

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal DevOps Engineer, Release Manager & Site Reliability Engineer  
**Status:** Approved  

---

## 1. Production Deployment Overview

### 1.1 Deployment Objectives
A production deployment is the controlled, audited transfer of a validated release artifact from the staging environment to the live merchant-facing platform. Every deployment must satisfy the following objectives:

*   **System Stability:** The deployment must not increase API error rates above baseline or cause any ECS task health check failures.
*   **User Experience:** Merchants and cashiers must experience zero perceptible downtime. The blue-green deployment strategy ensures continuous service during the release window.
*   **Business Continuity:** Live checkout transactions must not be interrupted. The deployment window is scheduled outside peak trading hours.

### 1.2 Production Release Principles
*   **One Artifact, All Environments:** The container image promoted to production is identical to the image that passed staging validation — no rebuilds in production.
*   **Automation First:** The CI/CD pipeline executes the deployment automatically. Human approval gates at defined checkpoints are the only manual steps.
*   **Rollback Before Release:** A verified rollback plan and a tested RDS snapshot must exist before the deployment begins.
*   **Measure Before and After:** Baseline performance metrics are captured before deployment; post-deployment metrics are compared to confirm no regression.

### 1.3 Deployment Success Criteria
A deployment is declared successful when **all** of the following are true:
*   All ECS tasks in the new Green target group report healthy.
*   API health check `GET /healthz` returns `200 OK`.
*   All production smoke tests pass.
*   API error rate remains $\le 0.5\%$ for 15 minutes post-switch.
*   p99 API latency remains $\le 50\text{ ms}$ for checkout endpoints.

---

## 2. Release Management Strategy

### 2.1 Release Lifecycle

```
[ PLANNING ]
 Owner: Product Owner + Engineering Lead
 Activities: Define release scope; assign version tag; schedule deployment window
 Deliverable: Release plan document; approved feature list
         │
         ▼
[ PREPARATION ]
 Owner: Backend Lead + DevOps Engineer
 Activities: Cut release branch; finalize migration files; update release notes
 Deliverable: Tagged release branch; release notes; migration PR approved
         │
         ▼
[ VALIDATION ]
 Owner: QA Lead + DevOps Engineer
 Activities: Full staging deployment; UAT sign-off; performance baseline capture
 Deliverable: Signed UAT approval; staging smoke test report; baseline metrics
         │
         ▼
[ DEPLOYMENT ]
 Owner: DevOps Lead + On-Call SRE
 Activities: Execute CI/CD production pipeline; monitor ECS task health
 Deliverable: Deployed Green ECS task group; traffic switched to new version
         │
         ▼
[ MONITORING ]
 Owner: On-Call SRE
 Activities: Monitor CloudWatch dashboards; verify smoke tests; track error rates
 Deliverable: 60-minute post-deployment monitoring report
         │
         ▼
[ REVIEW ]
 Owner: Engineering Lead + DevOps Lead
 Activities: Post-mortem (even for successful releases); update runbooks
 Deliverable: Deployment log entry; lessons-learned notes
```

---

## 3. Production Deployment Preparation

### 3.1 Pre-Deployment Readiness Checklist (Must be 100% complete before deployment begins)

**Infrastructure Readiness**
*   `[ ]` ECS Fargate cluster is healthy; minimum 2 Blue tasks running.
*   `[ ]` ALB health checks show all Blue tasks as healthy.
*   `[ ]` RDS Multi-AZ instance status: `available`.
*   `[ ]` ElastiCache Redis cluster status: `available`.
*   `[ ]` CloudWatch alarms in `OK` state (no pre-existing alerts firing).

**Application Build Readiness**
*   `[ ]` Release branch merged to `main`; all CI checks passed.
*   `[ ]` Production Docker images (`saas-api:v<X.Y.Z>`, `saas-web:v<X.Y.Z>`) pushed to ECR.
*   `[ ]` Trivy image scan report: zero Critical or High CVEs.
*   `[ ]` Release notes reviewed and approved by Product Owner.

**Database Readiness**
*   `[ ]` All migration files reviewed by DB Lead; `.down.sql` rollback files present.
*   `[ ]` Migrations applied successfully to staging; staging smoke tests passed.
*   `[ ]` Pre-deployment manual RDS snapshot completed and verified.
*   `[ ]` Snapshot ID recorded in the deployment log.

**Security Readiness**
*   `[ ]` AWS WAF rules active and showing no anomalous block rates.
*   `[ ]` ACM certificate valid; expiry $\ge 30\text{ days}$ away.
*   `[ ]` All production secrets in AWS Secrets Manager; rotation policy active.

**Monitoring Readiness**
*   `[ ]` CloudWatch dashboards loaded; all panels showing data.
*   `[ ]` PagerDuty integration active; on-call engineer confirmed available.
*   `[ ]` Slack `#deployments` channel notification configured.

**Rollback Readiness**
*   `[ ]` Previous stable ECR image tag recorded in deployment log.
*   `[ ]` RDS snapshot ID recorded; restore procedure reviewed by DevOps engineer.
*   `[ ]` Rollback decision matrix reviewed by on-call SRE.

---

## 4. Deployment Workflow

### 4.1 Complete Production Deployment Sequence

| Step | Activity | Responsible | Validation |
| :--- | :--- | :--- | :--- |
| **1. Code Approval** | DevOps Lead approves production workflow run in GitHub Actions | DevOps Lead | GitHub protected environment approval confirmed |
| **2. Pre-Migration Snapshot** | CI pipeline creates manual RDS snapshot; records snapshot ID | CI/CD pipeline | Snapshot status: `available`; ID logged |
| **3. Database Migration** | `golang-migrate up` applies pending migrations to production RDS | CI/CD pipeline | `schema_migrations` table version confirmed |
| **4. Application Build Verification** | CI verifies production ECR images exist and have passed Trivy scan | CI/CD pipeline | ECR image tags present; scan report clean |
| **5. Green ECS Task Launch** | ECS service launches new Green tasks with production image | CI/CD pipeline (ECS rolling API) | All Green tasks pass `/healthz` health check |
| **6. ALB Traffic Switch** | ALB listener rule updated: 100% traffic shifted from Blue → Green | CI/CD pipeline | ALB target group health: Green = healthy |
| **7. Smoke Test Execution** | Automated smoke test suite runs against production endpoints | CI/CD pipeline | All smoke tests pass (see Section 10) |
| **8. Blue Task Drain & Terminate** | Old Blue ECS tasks drain active connections; deregistered and stopped | CI/CD pipeline (ECS) | Blue task group count = 0 |
| **9. Post-Deployment Monitoring** | SRE monitors CloudWatch for 60 minutes post-switch | On-Call SRE | Error rate $\le 0.5\%$; p99 latency $\le 50\text{ ms}$ |
| **10. Release Sign-Off** | DevOps Lead records deployment completion in deployment log | DevOps Lead | Deployment log entry timestamped and stored in S3 |

---

## 5. Deployment Strategy Selection

### 5.1 Comparison of Deployment Strategies

| Strategy | Advantages | Limitations | Risk Level |
| :--- | :--- | :--- | :--- |
| **Blue-Green** | Zero downtime; instant rollback by switching traffic back to Blue; full version isolation | Requires 2× task compute during deployment window | 🟢 Low |
| **Rolling** | Lower compute overhead; no idle tasks | Old and new versions run simultaneously; complex rollback if APIs differ | 🟡 Medium |
| **Canary** | Validate new version with a subset of real traffic before full rollout | Complex traffic-splitting configuration; merchants may experience inconsistent behaviour | 🟡 Medium-High |

### 5.2 Selected Strategy: Blue-Green Deployment
Blue-green deployment is the mandatory strategy for all production releases. The ECS service maintains two named target groups in the ALB:
*   **Blue Group:** Currently serving 100% of live merchant traffic.
*   **Green Group:** New version launched, health-checked, and validated before receiving any traffic.

Traffic is switched instantaneously from Blue to Green once all Green tasks are healthy. If post-switch smoke tests fail within the 5-minute rollback window, the ALB listener rule is immediately reverted to Blue — restoring the prior stable version without any data loss.

**Why Blue-Green Fits This System:**
*   The platform handles live financial transactions (Stripe / Bakong payments). A partial-version state during rolling deployment could expose merchants to API contract mismatches between old and new task instances.
*   Blue-green guarantees that all merchants switch to the new version simultaneously, eliminating race conditions between old and new API behaviour.

---

## 6. Application Deployment Process

### 6.1 Frontend Deployment (Next.js)
*   The `saas-web:v<X.Y.Z>` ECR image is registered as the new ECS task definition revision for the Next.js target group.
*   CloudFront cache is invalidated for `/*` paths after the ECS Green tasks are healthy, ensuring merchants receive the latest JS bundles immediately.
*   `NEXT_PUBLIC_API_URL` environment variable is injected from SSM Parameter Store at task startup — no rebuild required for API URL changes.

### 6.2 Backend Deployment (Go API)
*   The `saas-api:v<X.Y.Z>` ECR image is registered as the new ECS task definition revision for the API target group.
*   Database migrations run **before** the new API tasks launch, ensuring the new schema is in place before the new code that depends on it starts serving traffic.
*   pgBouncer connection pooler sidecar containers are co-deployed in the same ECS task definition revision.

### 6.3 Configuration Deployment
*   Non-sensitive configuration updates (e.g., feature flags, log level) are pushed to AWS SSM Parameter Store before the deployment begins.
*   ECS tasks read SSM values at startup — no task restart is needed for SSM-only changes unless the changed value affects startup behavior.

---

## 7. Database Release Process

```
[ PRE-DEPLOYMENT RDS SNAPSHOT ] ──► verified, ID logged
         │
         ▼
[ golang-migrate up ]
 Apply all pending migration files in version order
 Wrapped in a transaction; rolls back automatically on failure
         │  On failure → STOP pipeline; do NOT deploy new ECS image
         ▼
[ SCHEMA VERSION VERIFICATION ]
 Query schema_migrations table; confirm expected version number
         │
         ▼
[ DATA INTEGRITY CHECK ]
 Automated row-count assertions on affected tables
 RLS cross-tenant isolation test
         │
         ▼
[ APPLICATION COMPATIBILITY CHECK ]
 New ECS tasks start; confirm /healthz returns 200 OK
 Confirm new API reads/writes using the updated schema
         │  On failure → golang-migrate down; restore snapshot if needed
         ▼
[ MIGRATION COMPLETE — PROCEED TO ECS DEPLOYMENT ]
```

### 7.1 Migration Failure Handling
*   If `golang-migrate up` fails mid-execution, the transaction is automatically rolled back. The schema is unchanged; no new ECS image is deployed.
*   If the migration succeeds but the application health check fails, `golang-migrate down N` is executed to revert the schema, and the RDS snapshot is available for data restoration if any data was mutated.

---

## 8. Production Configuration Management

| Configuration Category | Storage Location | Access Method | Rotation |
| :--- | :--- | :--- | :--- |
| Database credentials | AWS Secrets Manager | ECS task IAM role at startup | Every 90 days (automatic) |
| JWT signing secret | AWS Secrets Manager | ECS task IAM role at startup | Every 180 days (manual, coordinated with deploy) |
| Stripe / Bakong API keys | AWS Secrets Manager | ECS task IAM role at startup | On key compromise or annual review |
| Application config (non-secret) | AWS SSM Parameter Store | ECS task environment variables | On-demand |
| Feature flags | AWS SSM Parameter Store | ECS task environment variables | On-demand; no restart needed |

*   **Security Requirements:** No configuration value is committed to the Git repository. All secrets must exist only in AWS Secrets Manager. The CI/CD pipeline's IAM role retrieves secrets at runtime; secret values are never written to pipeline logs.

---

## 9. Post-Deployment Validation

Immediately after the ALB traffic switch, the on-call SRE validates the following:

| Check | Method | Success Criterion |
| :--- | :--- | :--- |
| **Application Health** | `GET /healthz` on production API URL | HTTP 200; `{"status":"ok"}` |
| **API Availability** | `GET /api/v1/products` (public endpoint) | HTTP 200; valid product list JSON |
| **Database Connection** | Health check response includes `db: connected` | DB connectivity confirmed |
| **User Authentication** | Smoke test login flow (test merchant account) | JWT access token received |
| **Main Business Flow** | Smoke test checkout flow (test transaction) | Order created; no 4xx or 5xx errors |
| **Performance Baseline** | CloudWatch ALB p99 latency metric | $\le 50\text{ ms}$ on checkout endpoint |
| **Error Rate Baseline** | CloudWatch ALB 5xx count | $\le 0.5\%$ of total requests |

---

## 10. Production Smoke Testing

Smoke tests are automated and execute as the final step of the production CI/CD pipeline after the ALB traffic switch.

| Smoke Test | Endpoint / Flow | Expected Result | Failure Action |
| :--- | :--- | :--- | :--- |
| **System Access** | `GET /healthz` | `200 OK` | Immediate rollback |
| **Tenant Login** | `POST /api/v1/auth/login` | JWT token returned | Immediate rollback |
| **Product Catalog** | `GET /api/v1/products` | Non-empty product list | Immediate rollback |
| **Add to Cart** | `POST /api/v1/orders` | Order draft created | Immediate rollback |
| **Checkout Transaction** | `POST /api/v1/orders/{id}/checkout` | Payment intent created; order `paid` status | Immediate rollback |
| **Receipt Generation** | `GET /api/v1/orders/{id}/receipt` | PDF URL returned | Alert; no rollback |
| **Inventory Update** | `GET /api/v1/inventory` | Stock counts updated after checkout | Alert; no rollback |
| **Report Generation** | `GET /api/v1/reports/daily` | Summary report returned | Alert; no rollback |

*   **Critical Path (Rollback on Failure):** System access, login, product catalog, checkout, cart — these are the core transactional flows. Failure in any of these triggers immediate Blue-Green rollback.
*   **Non-Critical Path (Alert, No Rollback):** Receipt, inventory update, reporting — failure triggers a Slack alert and incident investigation but does not roll back the deployment.

---

## 11. Monitoring During Release

The on-call SRE monitors the following dashboards during and after the deployment window:

| Metric | Dashboard | Normal Range | Alert Threshold |
| :--- | :--- | :--- | :--- |
| ECS CPU Utilization (Green tasks) | CloudWatch ECS | $\le 60\%$ | $\ge 85\%$ |
| ECS Memory Utilization (Green tasks) | CloudWatch ECS | $\le 70\%$ | $\ge 90\%$ |
| ALB p99 Request Latency | CloudWatch ALB | $\le 50\text{ ms}$ | $\ge 200\text{ ms}$ |
| ALB 5xx Error Rate | CloudWatch ALB | $\le 0.1\%$ | $\ge 1\%$ |
| RDS CPU Utilization | CloudWatch RDS | $\le 40\%$ | $\ge 80\%$ |
| RDS DB Connections | CloudWatch RDS | $\le 100$ | $\ge 180$ |
| Redis Cache Hit Rate | CloudWatch ElastiCache | $\ge 80\%$ | $\le 50\%$ |
| WAF Blocked Requests | CloudWatch WAF | Baseline ± 10% | $\ge 500/\text{minute}$ spike |

*   **Monitoring Window:** The SRE actively monitors dashboards for a minimum of 60 minutes post-traffic switch. After 60 minutes with all metrics in range, the deployment is declared stable.

---

## 12. Deployment Failure Management

| Failure Type | Detection | Immediate Response | Recovery |
| :--- | :--- | :--- | :--- |
| **ECS Green tasks fail health check** | ALB target group health shows `unhealthy` | Pipeline halts; do NOT switch traffic; investigate CloudWatch logs | Fix container startup issue; re-deploy Green tasks |
| **Migration fails mid-execution** | `golang-migrate` exits non-zero | Pipeline halts; schema automatically rolled back by failed transaction | Fix migration file; re-test; re-deploy |
| **Smoke tests fail (critical path)** | Automated smoke test suite reports failure | Immediate ALB traffic switch back to Blue tasks | DevOps investigates; opens P1 incident |
| **Error rate spike post-switch** | CloudWatch alarm: ALB 5xx rate $\ge 1\%$ | PagerDuty P1 alert; SRE evaluates rollback | If >5 minutes without improvement: revert to Blue |
| **Performance regression post-switch** | CloudWatch alarm: p99 latency $\ge 200\text{ ms}$ | PagerDuty alert; SRE evaluates — could be traffic spike or schema query regression | Review slow query logs in RDS Performance Insights; consider rollback |

### 12.1 Rollback Execution Time Target
Blue-Green rollback (reverting ALB listener to Blue) must be completable within **5 minutes** of the decision to roll back. The on-call SRE must be familiar with the rollback procedure documented in the operational runbook.

---

## 13. Release Communication Plan

### 13.1 Communication Timeline

**48 Hours Before Release:**
*   Engineering Lead sends release announcement to `#engineering` Slack channel.
*   Business users are notified of the maintenance window (if any) via email.
*   Release notes are shared with the Product Owner for final review.

**Day of Release (Pre-Deployment):**
*   DevOps Lead posts to `#deployments` Slack: `🚀 Production deployment beginning for v<X.Y.Z> — target window: <time range>`
*   On-call SRE confirms availability in `#deployments`.
*   QA Lead confirms staging validation is complete.

**During Deployment:**
*   CI/CD pipeline posts automated status updates to `#deployments` at each major stage (migration applied, Green tasks healthy, traffic switched, smoke tests passed).
*   On-call SRE posts manual observations if any metric warrants attention.

**After Successful Deployment:**
*   DevOps Lead posts: `✅ v<X.Y.Z> deployment complete. All smoke tests passed. System stable.`
*   Product Owner is notified; release notes are published to the internal changelog.

**In Case of Rollback:**
*   DevOps Lead posts: `⚠️ Rolling back v<X.Y.Z> — reverting to v<previous>. Investigating.`
*   P1 incident is opened in PagerDuty.
*   Engineering Lead and CTO are notified.
*   Post-mortem is scheduled within 24 hours.

### 13.2 Communication Responsibility Matrix

| Stage | Communicator | Channel | Audience |
| :--- | :--- | :--- | :--- |
| Release plan announcement | Engineering Lead | Slack `#engineering` | All developers, QA |
| Maintenance window notice | Product Owner | Email | Business users |
| Deployment start | DevOps Lead | Slack `#deployments` | DevOps, QA, Engineering Lead |
| Stage-by-stage updates | CI/CD bot (automated) | Slack `#deployments` | DevOps team |
| Deployment complete | DevOps Lead | Slack `#deployments` + `#general` | All stakeholders |
| Rollback decision | DevOps Lead | Slack `#deployments` + PagerDuty | Engineering Lead, CTO, On-call SRE |

---

## 14. Deployment Documentation

The following documents must be completed for every production release:

| Document | Owner | Content | Storage |
| :--- | :--- | :--- | :--- |
| **Release Notes** | Product Owner + Engineering Lead | Feature list; bug fixes; breaking changes; upgrade notes | Git repository `CHANGELOG.md` |
| **Deployment Checklist** | DevOps Lead | Pre-deployment checklist results; snapshot ID; approver names | S3 deployment log bucket |
| **Migration Record** | DB Lead | Migration version applied; pre/post row counts; validation results | S3 deployment log bucket |
| **Configuration Record** | DevOps Engineer | SSM Parameter Store and Secrets Manager ARNs updated in this release | S3 deployment log bucket |
| **Post-Deployment Validation Report** | On-Call SRE | Smoke test results; 60-minute metric summary; declaration of stability | S3 deployment log bucket |

---

## 15. Production Deployment Approval Checklist

*   `[x]` **Testing Approved:** Final Testing Report (Phase 5, Part 9) reviewed; all quality gates passed.
*   `[x]` **Security Approved:** Security scan results (Trivy, Gitleaks, govulncheck) clean; WAF rules active.
*   `[x]` **Infrastructure Ready:** ECS cluster healthy; RDS available; ElastiCache available; ALB healthy.
*   `[x]` **Backup Completed:** Pre-deployment RDS manual snapshot created and verified; snapshot ID logged.
*   `[x]` **Migration Tested:** All migration files applied successfully to staging; down migrations validated.
*   `[x]` **Monitoring Active:** CloudWatch alarms in OK state; PagerDuty on-call engineer confirmed available.
*   `[x]` **Rollback Ready:** Previous stable ECR image tag recorded; RDS snapshot restore procedure reviewed.
*   `[x]` **Business Approval:** Product Owner has signed off UAT results on staging; release notes approved.
*   `[x]` **DevOps Lead Approval:** DevOps Lead has approved the GitHub Actions production deployment run.

---

## 16. Conclusion

This Production Deployment Execution Plan and Release Management Document defines the complete, controlled pathway from a validated release artifact to a stable, monitored production deployment. Enforcing this process — through pre-deployment readiness gates, blue-green traffic switching, automated smoke testing, SRE monitoring windows, and a clearly-owned rollback decision framework — ensures that every release to the merchant-facing platform is safe, auditable, and reversible.

Engineering and DevOps teams can now proceed to the final Phase 6 document: **Part 8 — Rollback Plan**, which formalises the procedures used when a deployment must be reversed.
