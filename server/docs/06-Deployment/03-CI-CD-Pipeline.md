# DEPLOYMENT SPECIFICATION
## PART 3 — CI/CD PIPELINE DESIGN & AUTOMATED DEPLOYMENT STRATEGY

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** DevOps Architect & CI/CD Engineering Lead  
**Status:** Approved  

---

## 1. CI/CD Overview

### 1.1 Purpose & Automation Objectives
The CI/CD pipeline automates every step between a developer committing code and that code running in production — eliminating manual build steps, ensuring consistent quality gates, and reducing deployment risk.

*   **Development Speed:** Automated builds and test execution give developers pass/fail feedback within minutes of pushing code.
*   **Code Quality:** Static analysis, unit tests, and API integration checks run on every pull request — bugs are caught before they reach `main`.
*   **Release Reliability:** The same validated container image that passed all CI checks is promoted to production without rebuild.
*   **Production Stability:** Blue-green deployment strategy ensures zero-downtime releases; automatic rollback fires if health checks fail post-deploy.

---

## 2. CI/CD Pipeline Architecture

The full pipeline moves code through a deterministic sequence of validated stages:

```
[ DEVELOPER COMMITS CODE ]
         │
         ▼
[ GITHUB: PULL REQUEST OPENED ]
         │
         ▼
[ CI STAGE 1: CODE VALIDATION ]
 (Lint · Format check · Type check)
         │
         ▼
[ CI STAGE 2: AUTOMATED TESTS ]
 (Unit Tests · API Integration Tests)
         │
         ▼
[ CI STAGE 3: SECURITY SCANS ]
 (Trivy · Govulncheck · Gitleaks)
         │
         ▼
[ CI STAGE 4: DOCKER IMAGE BUILD ]
 (Multi-stage build · Tag with SHA)
         │
         ▼
[ CI STAGE 5: IMAGE PUSH TO ECR ]
 (Amazon ECR registry)
         │
         ▼
[ CD STAGE 1: AUTO-DEPLOY → STAGING ]
         │
         ▼
[ CD STAGE 2: MANUAL APPROVAL GATE ]
 (Product Owner / DevOps Lead sign-off)
         │
         ▼
[ CD STAGE 3: BLUE-GREEN DEPLOY → PRODUCTION ]
         │
         ▼
[ POST-DEPLOY: SMOKE TESTS + APM MONITORING ]
```

---

## 3. Source Control Integration

### 3.1 Branch Trigger Rules

| Branch / Event | Pipeline Triggered | Stages Executed |
| :--- | :--- | :--- |
| `feature/*` push | PR validation workflow | Lint, unit tests, security scan |
| `develop` merge | Integration pipeline | All CI stages + staging deploy |
| `release/*` branch | Release pipeline | Full CI + staging smoke tests + manual gate |
| `main` merge (via release PR) | Production pipeline | Blue-green production deploy |
| `hotfix/*` merge to `main` | Hotfix pipeline | Expedited CI + canary production deploy |

### 3.2 Pull Request Validation Rules
*   All status checks must pass before a PR can be merged into `develop` or `main`.
*   Branch protection rules enforce a minimum of **2 reviewer approvals** on `main`.
*   Force pushes to `develop` and `main` are disabled.

---

## 4. Continuous Integration (CI) Strategy

### Stage 1: Source Code Validation
*   *Purpose:* Enforce code style and formatting standards.
*   *Tools:* `gofmt` / `staticcheck` for Go; `ESLint` / `tsc --noEmit` for TypeScript.
*   *Success Criteria:* Zero lint errors; zero type errors.

### Stage 2: Dependency Installation
*   *Purpose:* Restore Go modules and Node packages from cache; verify lock files match declared dependencies.
*   *Success Criteria:* `go.sum` and `package-lock.json` pass integrity checks.

### Stage 3: Code Quality Check
*   *Purpose:* Run static analysis to detect code-quality issues.
*   *Tools:* `staticcheck` (Go); `SonarCloud` quality gate (TypeScript).
*   *Success Criteria:* No new blocker or critical issues introduced.

### Stage 4: Unit Testing
*   *Purpose:* Validate individual functions and component logic.
*   *Success Criteria:* All tests pass; Go service coverage $\ge 80\%$.

### Stage 5: Integration Testing
*   *Purpose:* Validate API endpoint contracts against a test database.
*   *Environment:* Ephemeral Docker Compose environment spun up for the test job.
*   *Success Criteria:* 100% of API integration test cases pass.

### Stage 6: Application Build
*   *Purpose:* Compile the Go binary and Next.js production bundle.
*   *Success Criteria:* Builds complete without errors; artifacts are cached for the Docker build stage.

---

## 5. Automated Testing Integration

| Test Type | Runs On PR | Runs On `develop` Merge | Runs Before Production Release |
| :--- | :--- | :--- | :--- |
| Unit Tests | ✅ | ✅ | ✅ |
| API Integration Tests | ✅ | ✅ | ✅ |
| Security Scans (Trivy, Gitleaks) | ✅ | ✅ | ✅ |
| Staging Smoke Tests | ❌ | ✅ | ✅ |
| Performance Regression Check | ❌ | ❌ | ✅ |

---

## 6. Build Pipeline Design

### 6.1 Build Stages
```
[ SOURCE CODE CHECKOUT ]
        │
        ▼
[ DEPENDENCY CACHE RESTORE ]
        │
        ▼
[ COMPILE GO BINARY / NEXT.JS BUNDLE ]
        │
        ▼
[ MULTI-STAGE DOCKER BUILD ]
 (Stage 1: builder · Stage 2: distroless runtime)
        │
        ▼
[ IMAGE TAG: <sha> + <semver> ]
        │
        ▼
[ TRIVY IMAGE SCAN ]
 (Block on Critical/High CVEs)
        │
        ▼
[ PUSH TO AMAZON ECR ]
```

### 6.2 Build Quality Checks
*   Docker image size is validated — pipeline warns if the Go API image exceeds 50 MB or the Next.js image exceeds 300 MB.
*   Container image layers are inspected to verify no secrets, credentials, or `.env` files are embedded.

---

## 7. Artifact & Image Management

### 7.1 Versioning Convention
Every image is tagged with two identifiers:
*   **Git SHA tag:** `saas-api:a3f7b2c` — uniquely identifies the exact commit.
*   **Semantic version tag:** `saas-api:v1.4.0` — applied at release time from the `release/*` branch.

### 7.2 ECR Lifecycle Policy
*   Images tagged with a semantic version are retained indefinitely.
*   Untagged images and SHA-only tags older than 30 days are automatically deleted by an ECR lifecycle rule.

---

## 8. Continuous Deployment (CD) Strategy

### 8.1 Deployment Flow per Environment

| Environment | Trigger | Approval Required | Validation |
| :--- | :--- | :--- | :--- |
| **Development** | `feature/*` branch push | None (automatic) | Local Docker Compose |
| **QA / Testing** | `develop` branch merge | None (automatic) | Automated API tests |
| **Staging / UAT** | `develop` merge | None (automatic) | Smoke tests + UAT access |
| **Production** | Manual release promotion from `main` | DevOps Lead + PO sign-off | Blue-green + smoke tests |

---

## 9. Production Deployment Strategy

### 9.1 Deployment Approach Comparison

| Strategy | Advantages | Limitations | Best Use Case |
| :--- | :--- | :--- | :--- |
| **Blue-Green** | Zero downtime; instant rollback by switching traffic back. | Requires 2× compute capacity during deployment. | Standard scheduled releases. |
| **Rolling** | Gradual replacement; lower compute overhead. | Brief period where old and new versions run concurrently. | Minor patches with backward-compatible APIs. |
| **Canary** | Route small % of traffic to new version; monitor before full rollout. | Complex traffic splitting configuration. | High-risk releases with uncertain impact. |

### 9.2 Selected Strategy: Blue-Green Deployment
Blue-green is the primary production deployment strategy. The ECS service maintains two task groups: **Blue** (current live) and **Green** (new version). The ALB listener switches 100% of traffic from Blue to Green once all Green health checks pass. If post-switch smoke tests fail within 5 minutes, traffic is immediately re-routed back to Blue.

---

## 10. Security Integration in CI/CD (DevSecOps)

| Security Gate | Tool | Stage | Action on Failure |
| :--- | :--- | :--- | :--- |
| Dependency CVE Scan | `govulncheck` (Go), `npm audit` (Node) | CI: after dependency install | Block PR merge |
| Secret Detection | `Gitleaks` | CI: on every commit | Block PR merge; alert security team |
| Container Image Scan | `Trivy` | CI: after Docker build | Block ECR push on Critical/High CVEs |
| SAST Code Analysis | `SonarCloud` | CI: code quality stage | Flag; require review on new blockers |
| Infrastructure Scan | `Checkov` (Terraform) | CI: infrastructure changes | Block infrastructure PRs |

---

## 11. Environment Management

| Environment | Configuration Source | Secret Source | Access |
| :--- | :--- | :--- | :--- |
| **Local Dev** | `.env.local` file | `.env.local` file | Developer only |
| **QA / Testing** | GitHub Actions environment variables | GitHub Actions secrets | CI/CD pipeline |
| **Staging** | AWS SSM Parameter Store | AWS Secrets Manager | DevOps team + CI/CD |
| **Production** | AWS SSM Parameter Store | AWS Secrets Manager (auto-rotate 90d) | DevOps on-call only |

---

## 12. Deployment Approval Workflow

```
[ ALL CI CHECKS PASS ]
         │
         ▼
[ AUTO-DEPLOY TO STAGING ]
         │
         ▼
[ SMOKE TESTS PASS ON STAGING ]
         │
         ▼
[ PRODUCT OWNER UAT SIGN-OFF ]
         │
         ▼
[ DEVOPS LEAD APPROVES PRODUCTION RELEASE ]
         │
         ▼
[ BLUE-GREEN PRODUCTION DEPLOYMENT BEGINS ]
```

*   **Staging Sign-off:** Product Owner reviews the deployed staging environment and approves in GitHub via a protected environment approval rule.
*   **Production Sign-off:** The DevOps Lead verifies the release notes and deployment checklist before approving the production workflow run in GitHub Actions.

---

## 13. Post-Deployment Monitoring

After every production deployment, the pipeline automatically executes:
*   **Smoke Tests:** A lightweight test suite verifies that authentication, product catalog queries, and the checkout endpoint return expected responses on production.
*   **Health Check Monitoring:** CloudWatch tracks ECS task health. If more than 20% of tasks report unhealthy within 5 minutes of deployment, an automatic rollback alert fires.
*   **Error Rate Monitoring:** If the API error rate rises above 1% compared to the pre-deployment baseline, a PagerDuty incident is created automatically.

---

## 14. CI/CD Failure Handling

| Failure Type | Detection | Action | Recovery |
| :--- | :--- | :--- | :--- |
| **Build Failure** | GitHub Actions step exits non-zero | Pipeline stops; PR is blocked | Developer fixes build error; re-push |
| **Test Failure** | Unit or integration test assertions fail | Pipeline stops; PR is blocked | Developer resolves failing tests |
| **Security Scan Failure** | Trivy / Gitleaks finds Critical issue | Image push blocked; Slack alert sent | Security triage; remediate CVE or rotate secret |
| **Staging Deploy Failure** | ECS task fails health checks | Pipeline rolls back staging to last stable image | DevOps investigates container logs |
| **Production Deploy Failure** | Smoke tests fail or error rate spikes | Automatic blue-green rollback to Blue tasks | On-call DevOps confirms Blue stability; opens incident |

---

## 15. CI/CD Readiness Checklist

*   `[x]` GitHub branch protection rules configured for `develop` and `main`.
*   `[x]` GitHub Actions workflows designed for CI, staging CD, and production CD.
*   `[x]` All automated test types integrated and assigned to correct pipeline triggers.
*   `[x]` Trivy, Gitleaks, and govulncheck security gates configured.
*   `[x]` ECR image lifecycle policy defined.
*   `[x]` Blue-green ECS deployment strategy documented.
*   `[x]` Manual approval gates defined for staging and production environments.
*   `[x]` Post-deployment smoke tests and CloudWatch rollback alerts configured.

---

## 16. Conclusion

This CI/CD Pipeline Design and Automated Deployment Strategy Document defines the complete automation path from developer commit to production deployment. Enforcing this pipeline ensures every release is built consistently, tested thoroughly, scanned for security vulnerabilities, and deployed safely with zero downtime.

DevOps engineers can now proceed to GitHub Actions workflow file authoring and ECS deployment configuration.
