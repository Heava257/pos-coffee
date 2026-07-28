# DEPLOYMENT SPECIFICATION
## PART 4 — SERVER SETUP & PRODUCTION ENVIRONMENT CONFIGURATION

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Cloud Infrastructure Engineer & Production Environment Specialist  
**Status:** Approved  

---

## 1. Server Setup Overview

### 1.1 Server Preparation Objectives
Proper server configuration is the foundation upon which all application services run reliably. An unconfigured or improperly hardened server introduces security vulnerabilities, performance bottlenecks, and operational instability — all of which directly impact merchant transactions and uptime.

*   **Security:** A hardened server reduces the attack surface, limits lateral movement in the event of a breach, and enforces the principle of least privilege at the infrastructure level.
*   **Stability:** Correctly provisioned compute, memory, and storage resources prevent unexpected crashes, OOM-killed processes, and disk saturation during peak traffic.
*   **Performance:** Correct kernel tuning, connection limits, and storage I/O configurations allow the application to reach p99 latency targets of $\le 50\text{ ms}$.
*   **Maintainability:** A consistently configured server estate — enforced via Infrastructure-as-Code (Terraform) — allows any team member to reproduce, audit, or replace any node without tribal knowledge.

---

## 2. Production Server Architecture

All production infrastructure runs on AWS managed services. The server topology follows a layered architecture:

```
[ INTERNET / MERCHANT DEVICES ]
             │
             ▼
[ AWS WAF ]
 (SQL/XSS/DDoS rule sets)
             │
             ▼
[ APPLICATION LOAD BALANCER (ALB) ]
 (TLS 1.3 termination · Path routing)
             │
     ┌───────┴────────┐
     ▼                ▼
[ ECS FARGATE ]   [ ECS FARGATE ]
 Go API tasks      Next.js SSR tasks
     │
     ├──────────────────┐
     ▼                  ▼
[ RDS POSTGRESQL ]  [ ELASTICACHE REDIS ]
 (Multi-AZ)          (Session cache)
     │
     ▼
[ AWS S3 ]
 (Receipts · Backups · Assets)
     │
     ▼
[ CLOUDWATCH + GRAFANA ]
 (Metrics · Alerts · Logs)
```

*   **AWS WAF:** First line of defence — blocks malicious traffic patterns before they reach the ALB.
*   **Application Load Balancer:** Routes HTTPS traffic, distributes load across ECS tasks, and performs TLS termination using ACM certificates.
*   **ECS Fargate Tasks:** Serverless compute units running the Go API and Next.js containers. AWS manages the underlying host OS — the team configures task definitions, not servers.
*   **RDS PostgreSQL:** Managed database service. AWS handles OS patching, disk provisioning, and Multi-AZ failover.
*   **ElastiCache Redis:** Managed in-memory cache. Handles session data and API rate-limit counters.

---

## 3. Operating System Strategy

### 3.1 OS Selection: Amazon Linux 2023 (AL2023)
The ECS container host OS is Amazon Linux 2023, managed entirely by AWS Fargate. The team does **not** directly configure or access the host OS — all configuration is expressed through ECS task definitions and Docker container images.

For any EC2-based infrastructure components (e.g., bastion hosts, monitoring agents), Amazon Linux 2023 (AL2023) is selected as the standard OS.

| Criterion | Amazon Linux 2023 |
| :--- | :--- |
| **Vendor Support** | Long-term support from AWS; quarterly security update cadence |
| **AWS Integration** | Native integration with SSM, CloudWatch Agent, and ECS |
| **Package Manager** | `dnf` (rpm-based); minimal default package footprint |
| **Security** | SELinux enforcing mode; kernel live-patching supported |
| **Licensing** | No-cost; included in EC2 pricing |

### 3.2 OS Update Strategy
*   **ECS Fargate:** AWS rotates host OS patches automatically. No manual OS patching is required.
*   **EC2 Bastion Host:** AWS Systems Manager (SSM) Patch Manager applies OS security patches automatically on a weekly schedule during a defined maintenance window.

---

## 4. Server Resource Planning

### 4.1 Environment Resource Specifications

| Environment | Compute | Memory | Storage | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Local Dev** | Developer laptop (any OS) | 8+ GB RAM | 50 GB SSD | Docker Compose local stack |
| **QA / Testing** | ECS Fargate 0.5 vCPU | 1 GB RAM | RDS 20 GB gp3 | Automated CI/CD test jobs |
| **Staging / UAT** | ECS Fargate 1 vCPU | 2 GB RAM | RDS 50 GB gp3 | Pre-release business validation |
| **Production** | ECS Fargate 1 vCPU | 2 GB RAM | RDS 100 GB gp3 | Live merchant operations |

### 4.2 Production Scaling Thresholds

| Metric | Scale-Out Trigger | Scale-In Trigger | Maximum Capacity |
| :--- | :--- | :--- | :--- |
| ECS CPU Utilization | $\ge 70\%$ for 2 minutes | $\le 30\%$ for 10 minutes | 10 tasks |
| RDS Storage | Auto-scales at 85% capacity | — | 500 GB |
| ElastiCache Memory | Alert at $\ge 75\%$ | — | Vertical scale to `t3.small` |

---

## 5. Server Initial Configuration

### 5.1 ECS Fargate Task Definition Configuration
Each ECS task definition specifies:
*   **CPU & Memory Hard Limits:** Prevents a single task from consuming excess resources and impacting co-located tasks.
*   **Log Driver:** `awslogs` forwards all container stdout/stderr to CloudWatch Logs automatically.
*   **Environment Variables:** Injected at task startup from AWS Secrets Manager and SSM Parameter Store.
*   **Health Check Command:** Polls the container's `/healthz` endpoint to determine task readiness before routing traffic.

### 5.2 Bastion Host Initial Configuration
A single, hardened EC2 bastion host provides emergency SSH access to the private subnet for operational needs.
*   **Time Synchronization:** Amazon Time Sync Service (chrony) is configured as the NTP source.
*   **Hostname:** Follows the convention `bastion-prod-01` to identify the environment and role.
*   **Log Forwarding:** CloudWatch Agent forwards all system logs (`/var/log/secure`, `/var/log/messages`) to CloudWatch.

---

## 6. User & Access Management

### 6.1 Access Tier Matrix

| Role | Access Method | Permissions | Scope |
| :--- | :--- | :--- | :--- |
| **Developer** | AWS Console (read-only IAM role) | View CloudWatch logs; no EC2 or RDS direct access | QA environment only |
| **DevOps Engineer** | AWS SSM Session Manager | ECS task exec; bastion host SSH | Staging & production |
| **On-Call Engineer** | AWS SSM Session Manager | Full ECS + RDS access during incident | Production only |
| **CI/CD Pipeline** | IAM Role (OIDC from GitHub Actions) | ECR push; ECS deploy; S3 write | Defined by pipeline stage |
| **Database Service** | RDS IAM Authentication | Read/write on application schema via pgBouncer | Production RDS only |

### 6.2 Least-Privilege IAM Policy Rules
*   Every IAM role grants only the specific actions required — no wildcard (`*`) action policies in production.
*   Developer IAM roles do not have `iam:PassRole`, `ec2:*`, or `rds:*` permissions.
*   Service roles are scoped to specific AWS resource ARNs (not all resources in an account).

---

## 7. SSH & Remote Access Security

AWS Systems Manager Session Manager replaces traditional SSH for all production access. Direct SSH port 22 is **closed** on all production security groups.

| Access Method | Standard | Rationale |
| :--- | :--- | :--- |
| **Primary Access** | AWS SSM Session Manager | No open SSH port; full session audit trail; no key management |
| **Emergency Bastion SSH** | SSH via bastion host | Used only when SSM is unavailable; requires VPN + MFA |
| **Direct SSH from internet** | ❌ Prohibited | All port 22 access from 0.0.0.0/0 is blocked by security group |

### 7.1 SSH Key Management (Bastion Host)
*   SSH public keys for authorized DevOps engineers are managed via AWS Systems Manager Parameter Store.
*   Password-based SSH authentication is disabled (`PasswordAuthentication no`).
*   Root login via SSH is disabled (`PermitRootLogin no`).

---

## 8. Server Security Hardening

### 8.1 ECS Task Security Standards
*   **Non-Root Container User:** All containers run as a non-root user (UID $\ge 1000$).
*   **Read-Only Root Filesystem:** Containers mount a read-only root filesystem; only `/tmp` is writable.
*   **No Privileged Mode:** No ECS tasks run with Docker `--privileged` mode.
*   **Capability Dropping:** All Linux kernel capabilities are dropped except those explicitly required.

### 8.2 Network-Level Hardening
*   **Security Groups as Micro-Firewalls:** Each AWS service (ALB, ECS, RDS, Redis) has its own security group with the minimum required inbound/outbound rules.
*   **No Default Security Groups:** Default AWS VPC security groups are unused; all traffic uses purpose-built security groups.
*   **VPC Flow Logs:** Enabled on all subnets; logs stored in CloudWatch Logs for 90 days.

### 8.3 Bastion Host Hardening
*   `fail2ban` is configured to block IP addresses after 5 failed SSH authentication attempts.
*   Only ports 22 (from the VPN IP range only) and 443 (for SSM agent) are open.
*   All non-essential packages and services are removed or disabled.

---

## 9. Application Runtime Environment

### 9.1 Container Runtime Configuration
ECS Fargate manages the container runtime. The team configures the following at the task definition level:
*   **Runtime Platform:** `LINUX` / `X86_64` (ARM64 for Graviton-optimized tasks in future scaling).
*   **Environment Variable Injection:** Secrets are referenced by ARN from AWS Secrets Manager; non-sensitive configuration is stored in SSM Parameter Store.
*   **Startup Dependencies:** ECS task `dependsOn` conditions ensure the application container does not start until its health check passes.

### 9.2 Environment Variable Categories

| Category | Example Keys | Source |
| :--- | :--- | :--- |
| **Database** | `DATABASE_URL`, `DB_MAX_CONNS` | AWS Secrets Manager |
| **Authentication** | `JWT_SECRET`, `JWT_EXPIRY_SECS` | AWS Secrets Manager |
| **Payment** | `STRIPE_SECRET_KEY`, `BAKONG_API_KEY` | AWS Secrets Manager |
| **Application** | `APP_ENV`, `APP_PORT`, `LOG_LEVEL` | SSM Parameter Store |
| **Storage** | `S3_BUCKET_NAME`, `S3_REGION` | SSM Parameter Store |

---

## 10. Database Server Preparation

### 10.1 RDS PostgreSQL Configuration

| Parameter | Value | Rationale |
| :--- | :--- | :--- |
| **Engine Version** | PostgreSQL 16 | Latest stable LTS version |
| **Instance Class** | `db.t3.medium` | 2 vCPU, 4 GB RAM — sufficient for initial load |
| **Multi-AZ** | Enabled | Automatic failover to standby AZ |
| **Storage Type** | gp3 SSD | Higher IOPS at lower cost than gp2 |
| **Storage Encryption** | AWS KMS (AES-256) | All data at rest encrypted |
| **Automated Backups** | 7-day retention | Daily snapshot at 02:00 UTC |
| **Performance Insights** | Enabled | Query-level performance diagnostics |
| **Parameter Group** | Custom | `max_connections=200`, `shared_buffers=1GB` |

### 10.2 RLS (Row-Level Security) Preparation
*   Multi-tenant data isolation is enforced via PostgreSQL RLS policies. The `app_tenant_id` session variable is set by the application layer before every query.
*   Superuser credentials are stored in Secrets Manager. Application service uses a restricted `app_user` role with no `SUPERUSER` privilege.

---

## 11. Reverse Proxy & Web Server Setup

The Application Load Balancer (ALB) serves as the production reverse proxy:

*   **TLS Termination:** ALB terminates TLS 1.3 using ACM-managed certificates. Backend ECS tasks receive plain HTTP internally.
*   **Path-Based Routing:**
    *   `/api/*` → ECS Go API target group (port 8080)
    *   `/*` → ECS Next.js Web target group (port 3000)
*   **HTTP → HTTPS Redirect:** ALB listener on port 80 issues a `301 Redirect` to HTTPS.
*   **HSTS Header:** ALB response headers include `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
*   **Health Check Path:** `/healthz` for API target group; `/api/health` for web target group. Unhealthy tasks are deregistered within 30 seconds.

---

## 12. Server Monitoring Preparation

| Metric | Monitoring Tool | Alert Threshold | Notification |
| :--- | :--- | :--- | :--- |
| ECS CPU Utilization | CloudWatch | $\ge 85\%$ for 5 minutes | PagerDuty + Slack |
| ECS Memory Utilization | CloudWatch | $\ge 90\%$ | PagerDuty |
| RDS CPU | CloudWatch RDS | $\ge 80\%$ | PagerDuty |
| RDS Free Storage | CloudWatch RDS | $\le 10\text{ GB}$ | PagerDuty |
| RDS Connection Count | CloudWatch RDS | $\ge 180$ of 200 max | Slack |
| ALB 5xx Error Rate | CloudWatch ALB | $\ge 1\%$ | PagerDuty |
| ALB p99 Latency | CloudWatch ALB | $\ge 500\text{ ms}$ | Slack |
| Redis Memory | CloudWatch ElastiCache | $\ge 75\%$ | Slack |

---

## 13. Backup & Recovery Preparation

### 13.1 Backup Schedule

| Asset | Backup Method | Frequency | Retention | Storage |
| :--- | :--- | :--- | :--- | :--- |
| RDS PostgreSQL | Automated RDS snapshot | Daily at 02:00 UTC | 7 days | AWS RDS Backup |
| RDS PostgreSQL | WAL transaction log archiving | Continuous | 24 hours | S3 |
| S3 Receipt PDFs | S3 Cross-Region Replication | Real-time | Permanent | S3 (secondary region) |
| ECS Task Definitions | Terraform state in S3 backend | On every change | Versioned | S3 + DynamoDB lock |
| Application Secrets | AWS Secrets Manager versioning | On every rotation | 90 days | AWS Secrets Manager |

### 13.2 Recovery Testing
*   **RDS Point-in-Time Restore:** Tested quarterly in a dedicated recovery environment to validate RPO of $\le 1\text{ hour}$.
*   **Disaster Recovery Drill:** Full infrastructure reprovisioning from Terraform state is tested annually.

---

## 14. Production Environment Validation Checklist

*   `[x]` AWS VPC, subnets, and security groups provisioned by Terraform.
*   `[x]` ECS Fargate cluster created; task definitions registered with correct CPU, memory, and log configuration.
*   `[x]` RDS PostgreSQL Multi-AZ instance active; automated backups enabled.
*   `[x]` ElastiCache Redis cluster active; TLS in-transit enabled.
*   `[x]` ALB configured with path-based routing; ACM certificate attached; HTTP-to-HTTPS redirect active.
*   `[x]` AWS WAF rules deployed and associated with ALB.
*   `[x]` CloudWatch dashboards, metric alarms, and PagerDuty integrations active.
*   `[x]` Bastion host provisioned; SSM Session Manager enabled; port 22 closed to internet.
*   `[x]` All secrets loaded into AWS Secrets Manager; rotation policy set to 90 days.
*   `[x]` RDS backup schedule validated; first manual snapshot taken and verified.

---

## 15. Server Maintenance Strategy

| Activity | Frequency | Owner | Method |
| :--- | :--- | :--- | :--- |
| **ECS Host OS Patching** | Automatic (AWS-managed) | AWS Fargate | No action required |
| **RDS Minor Version Patches** | Quarterly during maintenance window | DevOps team | Auto-upgrade enabled |
| **Bastion Host OS Patches** | Weekly | DevOps team | SSM Patch Manager (automated) |
| **CloudWatch Log Retention Review** | Quarterly | DevOps team | Adjust retention policy if cost increases |
| **Security Group Rule Audit** | Bi-annual | Security Lead + DevOps | Manual audit + Terraform diff review |
| **Capacity Planning Review** | Monthly | DevOps + Engineering Lead | Review CloudWatch CPU/memory trends |
| **Disaster Recovery Drill** | Annual | DevOps Lead | Full restore from Terraform state + RDS snapshot |

---

## 16. Conclusion

This Server Setup and Production Environment Configuration Plan Document defines the complete production readiness standard — covering compute provisioning, OS strategy, security hardening, access control, database preparation, monitoring setup, and backup planning. Enforcing this standard ensures the platform is operationally secure, observable, and recoverable in all failure scenarios.

DevOps engineers and infrastructure teams can now proceed to Terraform module authoring and ECS task definition provisioning.
