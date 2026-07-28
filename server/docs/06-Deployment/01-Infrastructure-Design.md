# DEPLOYMENT SPECIFICATION
## PART 1 — INFRASTRUCTURE DESIGN & PRODUCTION ARCHITECTURE

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Cloud Architect, DevOps Architect & Site Reliability Engineer  
**Status:** Approved  

---

## 1. Infrastructure Overview

### 1.1 Production Infrastructure Objectives
The production infrastructure is designed to deliver the SaaS Business Management Platform with enterprise-grade reliability, security, and scalability.

*   **Availability Goals:** Target system uptime of $\ge 99.9\%$, enabling an allowable downtime of $\le 8.7\text{ hours}$ per year.
*   **Scalability Goals:** Automatically scale application compute capacity from 2 to 10 container task nodes under load.
*   **Security Principles:** Apply a defence-in-depth approach. All services run in private subnets; only the Application Load Balancer (ALB) is internet-facing.
*   **Business Continuity:** Maintain a Recovery Point Objective (RPO) of $\le 1\text{ hour}$ and a Recovery Time Objective (RTO) of $\le 4\text{ hours}$.

---

## 2. Production Architecture Overview

The production architecture follows a layered traffic routing model:

```
[ MERCHANTS & USERS ] (Web browsers, React Native Tablet POS)
         │
         ▼
[ ROUTE 53 DNS ] (Geo-routing + Latency-based routing)
         │
         ▼
[ CLOUDFRONT CDN ] (Edge caching for static Next.js bundles)
         │
         ▼
[ APPLICATION LOAD BALANCER (ALB) ] (HTTPS termination, path routing)
         │
         ├──────────────────────────┐
         ▼                          ▼
[ ECS FARGATE: API ]     [ ECS FARGATE: ADMIN WEB ]
 (Go Monolith)            (Next.js SSR)
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
[ ELASTICACHE REDIS ]                [ RDS POSTGRESQL (PRIMARY) ]
 (Session & rate-limit cache)         (Multi-AZ, Private Subnet)
                                              │
                                              ▼
                                   [ RDS READ REPLICA ]
                                    (Analytics queries)
         │
         ▼
[ AWS S3 ] (Receipt PDFs, Product images, Backup exports)
         │
         ▼
[ CLOUDWATCH + PROMETHEUS + GRAFANA ] (APM monitoring)
```

---

## 3. Infrastructure Component Specifications

### 3.1 Application Compute — AWS ECS Fargate
*   *Purpose:* Runs containerized Go API and Next.js SSR applications.
*   *Recommended Configuration:* Each task uses 1 vCPU and 2 GB RAM.
*   *Scaling Strategy:* Auto-scales based on CPU utilization (scale-out at $\ge 70\%$, scale-in at $\le 30\%$), maintaining between 2 and 10 task instances.

### 3.2 Relational Database — AWS RDS PostgreSQL
*   *Purpose:* Primary transactional data store for tenants, orders, inventory, and financial ledgers.
*   *Recommended Configuration:* Multi-AZ deployment using `db.t3.medium` (2 vCPU, 4 GB RAM) with 100 GB gp3 SSD storage.
*   *Scaling Strategy:* Add RDS Read Replicas for analytics and reporting workloads. Storage auto-scales at 10 GB increments.

### 3.3 Session Cache — AWS ElastiCache Redis
*   *Purpose:* Stores JWT session metadata, cashier shift states, and API rate-limit counters.
*   *Recommended Configuration:* `cache.t3.micro` in cluster mode with 1 primary node and 1 replica.
*   *Scaling Strategy:* Vertical scaling to `cache.t3.small` during peak checkout periods.

### 3.4 File & Receipt Storage — AWS S3
*   *Purpose:* Stores generated receipt PDFs, product catalog images, database backup exports, and audit log archives.
*   *Recommended Configuration:* S3 Standard tier for active receipts. S3 Intelligent-Tiering for archived documents older than 90 days.
*   *Scaling Strategy:* Automatically scales; no capacity configuration is needed.

### 3.5 CDN — AWS CloudFront
*   *Purpose:* Caches and serves Next.js static asset bundles from edge locations worldwide, reducing latency for web admin portal loads.
*   *Recommended Configuration:* CloudFront Distribution pointing to the ALB origin with HTTPS enforcement and HSTS headers.

---

## 4. Cloud Infrastructure Strategy

### 4.1 Cloud vs. Self-Hosted Analysis

| Dimension | AWS Cloud | Self-Hosted |
| :--- | :--- | :--- |
| **Cost** | Pay-as-you-go; scales down during off-hours. | High upfront hardware investments. |
| **Scalability** | Auto-scaling built into ECS and RDS. | Manual horizontal scaling; limited by hardware. |
| **Maintenance** | AWS manages OS patching for RDS and Fargate tasks. | Full OS patching is the team's responsibility. |
| **Security** | AWS WAF, Shield, and IAM are managed services. | In-house security management required. |
| **Reliability** | Multi-AZ deployments provide built-in redundancy. | Requires manual failover configurations. |

### 4.2 Selected Approach: AWS Cloud (Managed Infrastructure)
AWS is selected as the cloud provider. Managed services (RDS, ECS Fargate, ElastiCache) eliminate operational overhead, allowing the engineering team to focus on application development rather than infrastructure maintenance.

---

## 5. Server Environment Architecture

| Environment | Purpose | Instance Type | Access Control |
| :--- | :--- | :--- | :--- |
| **Local Dev** | Developer sandbox | Docker Compose (local) | Developer laptop only |
| **QA / Testing** | Integration & regression testing | ECS `t3.small` tasks | QA team & CI/CD pipeline |
| **Staging / UAT** | Pre-release business validation | ECS `t3.medium` tasks | QA Lead, PO, DevOps team |
| **Production** | Live merchant operations | ECS Fargate `1 vCPU / 2 GB` | DevOps on-call only |

---

## 6. Network Architecture Design

The network is organized using a Virtual Private Cloud (VPC) with isolated subnets:

```
[ AWS VPC: 10.0.0.0/16 ]
│
├── [ PUBLIC SUBNET: 10.0.1.0/24 ]
│    └── Application Load Balancer (ALB)
│    └── NAT Gateway (outbound internet for private tasks)
│
└── [ PRIVATE SUBNET: 10.0.2.0/24 ]
     └── ECS Fargate API containers
     └── ECS Fargate Admin Web containers
     └── ElastiCache Redis cluster
     └── RDS PostgreSQL Primary (Multi-AZ)
     └── RDS PostgreSQL Read Replica
```

*   **Traffic Flow:** All inbound HTTPS traffic arrives at the ALB in the public subnet. The ALB routes requests to ECS containers running in the private subnet. Containers access RDS and Redis exclusively within the private network.
*   **Firewall / Security Groups:**
    *   *ALB Security Group:* Allows inbound HTTPS (port 443) from the internet.
    *   *ECS Security Group:* Allows inbound traffic only from the ALB Security Group.
    *   *RDS Security Group:* Allows connections only from the ECS Security Group (port 5432).
    *   *Redis Security Group:* Allows connections only from the ECS Security Group (port 6379).

---

## 7. Application Deployment Architecture

*   **Frontend (Next.js):** Deployed as ECS Fargate tasks. Static assets are served via CloudFront CDN. Server-side rendered pages run in the container.
*   **Backend API (Go):** Deployed as ECS Fargate tasks behind the ALB with path-based routing (`/api/v1/*`).
*   **Configuration Management:** Environment variables (database credentials, API keys) are injected at container startup from AWS Secrets Manager. No secrets are stored in container images.

---

## 8. Database Infrastructure Design

*   **Primary Database:** RDS PostgreSQL Multi-AZ. Automatic failover to a standby replica in a separate Availability Zone in the event of primary failure.
*   **Read Replicas:** One RDS Read Replica for analytics and report generation queries, reducing load on the primary instance.
*   **Connection Management:** pgBouncer connection poolers run as sidecar containers alongside ECS API tasks.
*   **Storage:** 100 GB gp3 SSD with Auto Scaling enabled (scales to 500 GB).

---

## 9. Security Infrastructure Design

*   **SSL/TLS Termination:** HTTPS is enforced at the ALB using ACM (AWS Certificate Manager) certificates. HTTP requests are permanently redirected to HTTPS.
*   **AWS WAF:** Web Application Firewall rules block SQL injection attempts, XSS patterns, and excess request volumes.
*   **IAM Roles:** ECS task roles are granted least-privilege permissions using IAM Roles (no static access keys).
*   **Secrets Management:** Database credentials and third-party API keys are stored in AWS Secrets Manager and rotated automatically every 90 days.

---

## 10. Scalability Architecture

*   **Horizontal Scaling:** ECS Service Auto Scaling monitors average CPU utilization. Policies scale out at $\ge 70\%$ CPU and scale in at $\le 30\%$ CPU.
*   **Database Read Scaling:** Read replicas serve analytics queries and static report generation, separating read traffic from transactional write workloads on the primary node.
*   **Cache Scaling:** ElastiCache Redis caches API rate-limit counters and session data, reducing query load on RDS.

---

## 11. High Availability Design

*   **Multi-AZ Deployments:** RDS and ElastiCache are deployed in Multi-AZ configurations. Automatic failover occurs in the event of an Availability Zone outage.
*   **Load Balancing:** ALB distributes traffic across multiple ECS container tasks, preventing single-task overloads.
*   **Database Backups:** Daily automated RDS snapshots and hourly WAL transaction log exports to S3.

---

## 12. Infrastructure Monitoring Design

*   **Application Monitoring:** AWS CloudWatch receives ECS container CPU, memory, and request count metrics.
*   **Database Monitoring:** AWS CloudWatch RDS metrics track query latency, connection counts, and disk IOPS.
*   **Alerting:** CloudWatch Alarms trigger PagerDuty notifications when CPU exceeds $85\%$, error rates exceed $1\%$, or RDS connections exceed 80% of the connection limit.

---

## 13. Infrastructure Cost Planning

| Cost Category | Estimated Monthly Cost |
| :--- | :--- |
| ECS Fargate (2 tasks, production) | ~$60 USD |
| RDS PostgreSQL (Multi-AZ, `t3.medium`) | ~$120 USD |
| ElastiCache Redis (`t3.micro`) | ~$25 USD |
| S3 Storage (100 GB) | ~$5 USD |
| CloudFront CDN | ~$15 USD |
| **Estimated Total** | **~$225 USD / month** |

*   **Cost Optimization:** Auto-scaling ensures tasks scale down during off-peak hours. Lifecycle policies move older S3 objects to Glacier storage automatically.

---

## 14. Production Readiness Checklist

*   `[x]` AWS VPC, subnets, and security groups designed.
*   `[x]` ECS Fargate cluster and task definitions specified.
*   `[x]` RDS Multi-AZ and Read Replica configurations defined.
*   `[x]` ElastiCache Redis cluster configuration specified.
*   `[x]` CloudFront CDN distribution planned.
*   `[x]` AWS WAF rules, ACM certificates, and Secrets Manager configurations defined.
*   `[x]` CloudWatch monitoring and PagerDuty alerting designed.
*   `[x]` Database backup and disaster recovery strategy defined.

---

## 15. Conclusion

This Infrastructure Design and Production Architecture Planning Document defines the complete AWS cloud topology, VPC network segmentation, compute configurations, database high-availability architectures, security controls, and monitoring strategies. Enforcing this architecture ensures the platform remains reliable, secure, and scalable in production.

DevOps engineers and cloud architects can now proceed to Terraform infrastructure provisioning.
