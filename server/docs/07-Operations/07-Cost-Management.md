# OPERATIONS SPECIFICATION
## PART 7 — CLOUD COST MANAGEMENT & FINANCIAL GOVERNANCE

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal Cloud Architect, SRE Lead & FinOps Specialist  
**Status:** Approved  

---

## 1. Cost Management Overview

### 1.1 Cost Management Objectives
Cloud cost management — also called FinOps (Financial Operations) — is the practice of ensuring that every cloud resource provisioned delivers measurable business value proportional to its cost. For a SaaS platform operating on a monthly subscription revenue model, cloud infrastructure cost is a direct component of gross margin. Unchecked infrastructure spend erodes profitability.

*   **Cost Visibility:** Every team member must be able to see which services are generating cost, which features drive the most spend, and whether cost growth is proportional to business growth.
*   **Cost Accountability:** Each engineering domain (backend, frontend, database, DevOps) is accountable for the cost of the resources it owns.
*   **Cost Optimization:** Resources are continuously right-sized. Idle or over-provisioned resources are identified and resized monthly.
*   **Cost Predictability:** Monthly infrastructure spend must be predictable within ±15% of the projected budget, enabling reliable business financial planning.

### 1.2 Why Cost Governance Is Critical

*   **Unit Economics:** The cost per active tenant determines the platform's unit economics. If cost per tenant increases faster than revenue per tenant, the business model is unsustainable.
*   **Scaling Without Waste:** As the platform grows (see Part 6 — Scaling Strategy), infrastructure cost must grow sub-linearly relative to revenue growth — achieved through Reserved Instances, auto-scaling efficiency, and caching.
*   **AWS Bill Surprises:** Without budget alerts and anomaly detection, a misconfigured NAT Gateway data transfer loop or an accidental public RDS snapshot transfer can generate a $10,000+ monthly bill anomaly.

---

## 2. Cost Centre Definition

### 2.1 Service Cost Ownership Matrix

| Cost Centre | AWS Services | Owner | Reporting |
| :--- | :--- | :--- | :--- |
| **Compute** | ECS Fargate (API + Web tasks), Elastic Load Balancing | DevOps Lead | Monthly capacity review |
| **Database** | RDS PostgreSQL, ElastiCache Redis | Database Reliability Engineer | Monthly DB review |
| **Storage** | S3 (all buckets), RDS storage, CloudWatch Logs | DevOps Lead | Monthly storage review |
| **Network** | NAT Gateway, CloudFront, Route 53, VPC Flow Logs data transfer | DevOps Lead | Monthly network review |
| **Security & Compliance** | AWS WAF, AWS Secrets Manager, AWS KMS, CloudTrail | Security Lead | Quarterly security review |
| **Monitoring** | CloudWatch (metrics, logs, alarms), AWS X-Ray | SRE Lead | Monthly operations review |
| **CI/CD & Build** | ECR storage, AWS CodeBuild (if used), GitHub Actions (external) | DevOps Lead | Monthly CI/CD review |

---

## 3. Monthly Cost Baseline & Projections

### 3.1 Service-by-Service Cost Breakdown

| AWS Service | Launch (M0) | M6 | M12 (with RIs) | M24 (with RIs) |
| :--- | :--- | :--- | :--- | :--- |
| **ECS Fargate (API + Web)** | $55 | $110 | $160 | $450 |
| **RDS PostgreSQL** | $60 | $110 | $180 | $400 |
| **ElastiCache Redis** | $35 | $50 | $80 | $180 |
| **ALB** | $20 | $30 | $40 | $80 |
| **CloudFront CDN** | $5 | $20 | $50 | $150 |
| **NAT Gateway** | $15 | $30 | $50 | $100 |
| **S3 Storage** | $5 | $20 | $50 | $150 |
| **CloudWatch (metrics + logs)** | $15 | $30 | $50 | $100 |
| **AWS WAF** | $10 | $10 | $10 | $15 |
| **Secrets Manager + KMS** | $5 | $5 | $10 | $15 |
| **Route 53** | $2 | $2 | $3 | $5 |
| **AWS X-Ray** | $0 | $5 | $10 | $20 |
| **ECR Storage** | $2 | $5 | $8 | $15 |
| **Miscellaneous** | $5 | $15 | $20 | $40 |
| **TOTAL (estimated)** | **~$234/month** | **~$442/month** | **~$721/month** | **~$1,720/month** |

*Note: M12 and M24 totals reflect Reserved Instance discounts applied to RDS, ElastiCache, and ECS Fargate Savings Plans.*

### 3.2 Revenue-to-Cost Ratio Target
*   Infrastructure cost must not exceed **15% of monthly recurring revenue (MRR)** at any growth phase.
*   If infrastructure cost growth outpaces MRR growth for two consecutive months, a mandatory cost review is triggered.

---

## 4. AWS Budget & Alert Strategy

### 4.1 AWS Budgets Configuration

| Budget | Threshold | Alert Channel | Action |
| :--- | :--- | :--- | :--- |
| **Monthly Total Spend** | 80% of projected month budget | Slack `#cost-alerts` | Review current spend; identify anomalies |
| **Monthly Total Spend** | 100% of projected month budget | PagerDuty P2 + Slack | Engineering Lead + DevOps Lead review |
| **Monthly Total Spend** | 120% of projected month budget | PagerDuty P1 + email to CTO | Immediate cost audit; identify overprovisioning |
| **ECS Fargate** | 150% of ECS baseline | Slack `#cost-alerts` | Check for runaway task count; review auto-scaling |
| **RDS** | 130% of RDS baseline | Slack `#cost-alerts` | Check for unexpected storage growth or Reserved Instance expiry |
| **Data Transfer (NAT + CloudFront)** | 200% of baseline | Slack `#cost-alerts` | Check for data exfiltration pattern or misconfigured client |

### 4.2 AWS Cost Anomaly Detection
*   AWS Cost Anomaly Detection is enabled with a threshold of $50 USD above the expected daily spend.
*   Anomaly alerts are routed to the Slack `#cost-alerts` channel and escalated to the DevOps Lead for same-day investigation.

---

## 5. Resource Rightsizing Policy

### 5.1 Rightsizing Review Process
*   **Monthly:** DevOps Lead reviews AWS Cost Explorer "Rightsizing Recommendations" report.
*   **Quarterly:** Full resource audit — every ECS task definition, RDS instance class, and ElastiCache node is reviewed against the past 90 days of CloudWatch utilization data.

### 5.2 Rightsizing Decision Rules

| Resource | Downsize If | Upsize If |
| :--- | :--- | :--- |
| **ECS Fargate task (CPU)** | Average CPU $\le 20\%$ for 30 days | Average CPU $\ge 70\%$ for 7 days |
| **ECS Fargate task (Memory)** | Average memory $\le 30\%$ for 30 days | Average memory $\ge 75\%$ for 7 days |
| **RDS instance class** | Average CPU $\le 15\%$ and connections $\le 30$ for 30 days | Average CPU $\ge 60\%$ for 7 days |
| **ElastiCache node** | Memory usage $\le 25\%$ for 30 days | Memory usage $\ge 60\%$ or evictions $\ge 0.5\%$ for 7 days |

---

## 6. Reserved Instance & Savings Plans Strategy

### 6.1 Purchase Timeline

| Commitment | Type | Purchase Timing | Estimated Saving | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **RDS `db.t3.medium`** | 1-year Reserved Instance (No Upfront) | Month 6 (traffic stable) | ~30% vs. On-Demand | 12 months |
| **ElastiCache `cache.t3.medium`** | 1-year Reserved Node (No Upfront) | Month 6 | ~30% vs. On-Demand | 12 months |
| **ECS Fargate** | Compute Savings Plan (1-year) | Month 6 | ~17% vs. On-Demand Fargate | 12 months |
| **RDS `db.r6g.large`** | 1-year Reserved Instance (Partial Upfront) | Month 12 (after vertical resize) | ~38% vs. On-Demand | 12 months |

### 6.2 Reserved Instance Governance
*   Reserved Instances are purchased only after 30 consecutive days of stable utilization at or above the RI target instance class — preventing purchasing RIs for temporarily over-provisioned resources.
*   RI expiry dates are tracked in a shared calendar. Renewal review is triggered 60 days before expiry.
*   RI coverage target: $\ge 70\%$ of baseline (non-auto-scaled) compute hours covered by RIs or Savings Plans.

---

## 7. ECS Fargate Cost Optimization

### 7.1 Task Configuration Efficiency
*   **Right-sized task definition:** 1 vCPU / 2 GB RAM is the launch configuration. Fargate pricing is proportional to CPU and memory — over-allocating memory without using it wastes money.
*   **ARM64 Graviton Migration (Phase 2):** At M6, ECS tasks are migrated to ARM64 architecture (`FARGATE` + `linux/arm64` platform version). Graviton Fargate is ~20% cheaper than x86 at equivalent performance for Go workloads.
*   **Scale-In Aggressiveness:** The 15-minute scale-in cooldown balances responsiveness against task churn cost. Tasks running below threshold for 15+ minutes are terminated — idle Fargate tasks cost money.

### 7.2 Off-Peak Scaling
*   Between **02:00–06:00 UTC** (low merchant activity window), the ECS service minimum task count is reduced to 2 via a CloudWatch Events scheduled scaling action.
*   Between **08:00–20:00 UTC** (peak business hours), the minimum is raised to 4 to reduce scale-out response time.
*   Estimated saving: 15–20% reduction in monthly Fargate compute hours.

---

## 8. Database Cost Optimization

### 8.1 RDS Cost Controls

| Optimization | Action | Saving |
| :--- | :--- | :--- |
| **Reserved Instance** | Purchase at M6 | 30–38% |
| **gp3 SSD over gp2** | gp3 provides same performance at lower baseline cost; 20% cheaper per GB | ~20% on storage |
| **Storage autoscaling ceiling** | Set max 1 TB to prevent unbounded growth without review | Cost control |
| **Automated snapshot retention** | 7 days (not more) — additional RDS snapshot storage costs per GB | Minimal; controlled |
| **Performance Insights retention** | 7-day free tier (not the 2-year paid tier) | $0 vs. ~$30/month |
| **Read replica scaling** | Add read replica only when needed (M6 trigger), not speculatively | Defers ~$110/month |

### 8.2 pgBouncer Connection Pooling Value
*   Without pgBouncer, each ECS task maintains persistent connections to RDS. At 10 tasks × 10 goroutines = 100 connections — approaching the 200 `max_connections` limit.
*   pgBouncer allows 10 tasks with 50 goroutines each = 500 application-level connections multiplexed over 20 actual RDS connections.
*   This defers the need to upgrade to a larger (more expensive) RDS instance class by extending the effective connection capacity of the current instance.

---

## 9. Storage Cost Optimization

### 9.1 S3 Lifecycle Policy Cost Impact

| Storage Tier | Price per GB/month | Minimum Duration | Objects Affected |
| :--- | :--- | :--- | :--- |
| **S3 Standard** | $0.023 | None | Newly uploaded receipts, active product images |
| **S3 Standard-IA** | $0.0125 | 30 days | Receipts older than 30 days (transition via lifecycle) |
| **S3 Glacier Instant Retrieval** | $0.004 | 90 days | Receipts older than 90 days; audit archive |
| **S3 Glacier Flexible Retrieval** | $0.0036 | 90 days | Long-term compliance archives (7-year WORM) |

*   **Example saving:** 100 GB of receipts older than 90 days stored in Glacier ($0.36/month) vs. S3 Standard ($2.30/month) = **84% cost reduction** for the same data.

### 9.2 CloudWatch Logs Cost Optimization

| Optimization | Action | Saving |
| :--- | :--- | :--- |
| **Disable DEBUG logs in production** | Single configuration change; reduces log volume by ~70% | 70% reduction in CloudWatch Logs ingestion cost |
| **Archive to S3 after 90 days** | CloudWatch Logs subscription filter ships to S3 | 80% reduction vs. CloudWatch Logs storage for aged data |
| **Log group retention policies** | Set retention on all log groups (no "indefinite" groups) | Prevents unbounded log storage cost accumulation |
| **Efficient log format** | Structured JSON (no duplicate fields, no verbose stack traces in production) | 20–30% reduction in log byte volume |

---

## 10. Network Cost Optimization

### 10.1 Data Transfer Cost Sources

| Cost Source | Optimization | Saving |
| :--- | :--- | :--- |
| **ALB → internet (API responses)** | Enable response compression (gzip/br) on Go API | 60–80% reduction in data transfer bytes |
| **ECS → internet (outbound via NAT)** | Minimize outbound calls; batch Stripe webhooks; use VPC endpoints for S3 and Secrets Manager | S3 and Secrets Manager calls via VPC Endpoint are free (no NAT Gateway charge) |
| **CloudFront → end users** | CloudFront has lower data transfer pricing than ALB → internet; static assets should always go via CloudFront | 30–50% reduction vs. ALB-direct data transfer |
| **Cross-AZ data transfer** | ECS tasks in same AZ as RDS preferred; pgBouncer sidecar is same-task (no AZ cross) | Eliminates pgBouncer → RDS cross-AZ cost |

### 10.2 VPC Endpoints for Cost Reduction
*   AWS PrivateLink VPC Endpoints are configured for: **S3**, **Secrets Manager**, **SSM Parameter Store**, **ECR**, and **CloudWatch Logs**.
*   VPC Endpoint traffic is free (no NAT Gateway data processing charge of $0.045/GB).
*   For a system generating 50 GB/month of S3 traffic, this saves ~$2.25/month — modest at launch but significant at scale.

---

## 11. AWS Cost Tagging Governance

### 11.1 Mandatory Resource Tags
All AWS resources must be tagged with the following taxonomy to enable cost allocation reporting:

| Tag Key | Required Values | Purpose |
| :--- | :--- | :--- |
| `Project` | `saas-platform` | Identifies all resources belonging to this project |
| `Environment` | `production` / `staging` / `qa` | Separates environment costs |
| `Component` | `api` / `web` / `database` / `cache` / `network` / `monitoring` | Maps cost to system component |
| `Owner` | `devops` / `backend` / `security` | Maps cost to owning team |
| `CostCentre` | `engineering` | Links to finance cost centre code |

### 11.2 Tag Compliance Enforcement
*   AWS Config rule `required-tags` enforces mandatory tags on all EC2, RDS, ECS, ElastiCache, S3, and CloudWatch resources.
*   Untagged resources trigger a Slack `#cost-alerts` alert and are added to the DevOps Lead's weekly review list.
*   Monthly Cost Explorer report is filtered by tag to generate per-component and per-environment cost breakdowns.

---

## 12. FinOps Review Cadence

### 12.1 Monthly Cost Review

*   **Owner:** DevOps Lead + Engineering Lead.
*   **Inputs:** AWS Cost Explorer previous-month report; AWS Budgets summary; Rightsizing Recommendations report.
*   **Outputs:** Cost report documenting: actual vs. budget; top 3 cost drivers; any anomalies investigated; action items for the next month.
*   **Format:** Shared Google Sheet / Confluence page updated monthly.

### 12.2 Quarterly FinOps Audit

*   **Owner:** DevOps Lead + CTO.
*   **Scope:** Full resource audit; Reserved Instance utilization review; RI renewal decisions; architecture cost review; comparison of actual vs. projected cost from the scaling roadmap.
*   **Output:** Updated cost projections for the next quarter; RI purchase or renewal decisions; any rightsizing actions committed.

### 12.3 Annual Cost Planning

*   **Owner:** Engineering Lead + CFO/Finance.
*   **Scope:** 12-month forward cost projection based on growth roadmap; budget approval for next fiscal year; Reserved Instance 1-year purchase decisions.
*   **Output:** Approved annual cloud infrastructure budget; RI purchase plan; cost-per-tenant unit economics report.

---

## 13. Cost Incident Management

### 13.1 Cost Anomaly Response

| Anomaly | Detection | Investigation | Resolution |
| :--- | :--- | :--- | :--- |
| **Daily spend $\ge 50\%$ above expected** | AWS Cost Anomaly Detection | DevOps Lead reviews Cost Explorer by service and tag | Identify resource; terminate or resize; open engineering ticket if code-level issue |
| **NAT Gateway data spike** | CloudWatch NAT Gateway `BytesOutToDestination` | Check VPC Flow Logs for destination IPs; identify ECS task generating volume | Investigate application for loop or data exfiltration; add VPC Endpoint if S3/AWS traffic |
| **RDS storage growing faster than projected** | CloudWatch RDS `FreeStorageSpace` declining rapidly | Review slow-growing tables with `pg_relation_size`; check WAL retention | Tune vacuum; check for table bloat; add archival job for aged data |
| **CloudFront data transfer spike** | CloudWatch CloudFront `BytesDownloaded` | Review CloudFront access logs for crawlers or large file downloads | Add WAF rule blocking crawler user-agents; add throttling for large asset downloads |

---

## 14. Cost-to-Business Value Reporting

### 14.1 Key Financial Ratios

| Metric | Formula | Target |
| :--- | :--- | :--- |
| **Infrastructure Cost per Tenant** | Total monthly AWS cost ÷ Active tenant count | Decreasing over time (economies of scale) |
| **Infrastructure Cost as % of MRR** | Total monthly AWS cost ÷ Monthly Recurring Revenue × 100 | $\le 15\%$ |
| **Cost per Transaction** | Total monthly AWS cost ÷ Monthly transaction count | Decreasing as transaction volume grows |
| **Reserved Instance Coverage** | RI-covered compute hours ÷ Total compute hours × 100 | $\ge 70\%$ of baseline |
| **S3 Storage Tiering Rate** | GB in Standard-IA + Glacier ÷ Total S3 GB × 100 | $\ge 60\%$ of total S3 volume |

---

## 15. Cost Management Readiness Checklist

*   `[x]` AWS Budgets configured: 80%, 100%, 120% thresholds with Slack and PagerDuty routing.
*   `[x]` AWS Cost Anomaly Detection enabled; $50 USD daily threshold; alerts to Slack `#cost-alerts`.
*   `[x]` AWS Cost Explorer enabled; resource-level granularity activated.
*   `[x]` Mandatory resource tagging taxonomy defined and enforced via AWS Config rule.
*   `[x]` Monthly Cost Explorer tag-based cost allocation report scheduled.
*   `[x]` VPC Endpoints configured for S3, Secrets Manager, SSM, ECR, and CloudWatch Logs (NAT bypass).
*   `[x]` S3 lifecycle policies deployed: Standard → Standard-IA at 30 days → Glacier at 90 days.
*   `[x]` CloudWatch Logs archive to S3 after 90 days; DEBUG logs disabled in production.
*   `[x]` Response compression (gzip/br) enabled on Go API to reduce data transfer costs.
*   `[x]` Reserved Instance purchase plan documented: RDS + ElastiCache + Fargate Savings Plan at M6.
*   `[x]` Off-peak ECS minimum task count scheduled to reduce (02:00–06:00 UTC window).
*   `[x]` ARM64 Graviton ECS task migration planned for Phase 2 (M6).
*   `[x]` Monthly FinOps review meeting scheduled; DevOps Lead and Engineering Lead participants.
*   `[x]` Quarterly FinOps audit schedule established; CTO included.
*   `[x]` Cost-per-tenant and infrastructure-as-%-of-MRR metrics tracked in monthly report.

---

## 16. Conclusion

This Cloud Cost Management and Financial Governance Document defines the complete FinOps framework for the platform — from service-by-service cost baselines and growth projections, through AWS Budgets alerting and Cost Anomaly Detection, Reserved Instance purchase timing and Savings Plans governance, resource rightsizing policies and decision rules, S3 and CloudWatch Logs cost reduction strategies, mandatory resource tagging for cost allocation, to monthly/quarterly/annual FinOps review cadences and cost-to-business-value reporting ratios. Enforcing this framework ensures that infrastructure investment grows sub-linearly relative to revenue — maintaining healthy unit economics as the platform scales from launch to enterprise operation.

This document completes **Phase 7 — Operations**. All seven operations documents are now complete. The project is ready to proceed to the final phase consolidation.
