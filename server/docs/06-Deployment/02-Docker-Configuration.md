# DEPLOYMENT SPECIFICATION
## PART 2 — DOCKER CONFIGURATION & CONTAINERIZATION STRATEGY

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** DevOps Architect & Container Platform Engineer  
**Status:** Approved  

---

## 1. Containerization Overview

### 1.1 Purpose & Strategy Objectives
Docker containerization packages each application service (Go API, Next.js web, React Native build tools) and its runtime dependencies into isolated, portable units. This eliminates the "works on my machine" problem and ensures that the exact same image artifact moves through development, QA, staging, and production without modification.

*   **Development Consistency:** Developers run identical service images locally via Docker Compose, eliminating environment drift between team members.
*   **Deployment Reliability:** A container image built in CI is the exact binary deployed to production ECS Fargate tasks.
*   **Environment Management:** Environment-specific values (database URLs, API keys) are injected at runtime via environment variables; they are never baked into images.
*   **Scalability:** ECS Fargate orchestrates container replicas horizontally without requiring OS-level provisioning.

---

## 2. Container Architecture Design

The full container topology arranges services in layers:

```
[ EXTERNAL USERS ]
       │
       ▼
[ NGINX REVERSE PROXY / ALB ]
 (TLS termination, path routing)
       │
       ├─────────────────────────┐
       ▼                         ▼
[ NEXT.JS WEB CONTAINER ]  [ GO API CONTAINER ]
 (Port 3000)                (Port 8080)
       │                         │
       │                         ├──────────────┐
       │                         ▼              ▼
       │                 [ REDIS CONTAINER ] [ PGBOUNCER SIDECAR ]
       │                  (Port 6379)         (Port 5432 proxy)
       │                                           │
       │                                           ▼
       │                                 [ POSTGRESQL CONTAINER ]
       │                                  (Port 5432)
       │
       └─────────────────────► [ S3 / LOCAL MINIO (dev) ]
                                (Object storage)
```

*   **Nginx Reverse Proxy:** Routes `/api/*` traffic to the Go API container and all other paths to the Next.js container. Handles TLS termination in local development.
*   **Go API Container:** Serves all REST endpoints. Communicates with pgBouncer (database), Redis (cache), and S3 (file storage).
*   **Next.js Web Container:** Renders the server-side admin portal. Calls the Go API internally.
*   **pgBouncer Sidecar:** Pools database connections on behalf of the Go API container.

---

## 3. Docker Component Strategy

### 3.1 Docker Images
*   *Purpose:* Immutable, versioned snapshots of the application and its dependencies.
*   *Management:* Images are built in CI pipelines and pushed to Amazon ECR (Elastic Container Registry). Every merge to `main` produces a tagged production image.

### 3.2 Docker Containers
*   *Purpose:* Running instances of images with injected environment configurations.
*   *Lifecycle:* Containers are ephemeral. State is never stored inside a container; all persistent data resides in volumes or external services (RDS, S3).

### 3.3 Docker Networks
*   *Purpose:* Provide isolated communication channels between containers.
*   *Communication:* Services communicate using their container names as DNS hostnames within a shared bridge network (e.g., the Go API connects to `postgres:5432` and `redis:6379`).

### 3.4 Docker Volumes
*   *Purpose:* Preserve database data and file uploads across container restarts.
*   *Persistent Data:* PostgreSQL data directory and MinIO (local dev object storage) are mounted to named volumes. Application containers use no volumes — they are stateless.

---

## 4. Application Container Design

### 4.1 Go API Backend Container
*   *Runtime:* Multi-stage Dockerfile. Stage 1 compiles the Go binary using the official `golang:1.22-alpine` image. Stage 2 copies only the compiled binary into a minimal `gcr.io/distroless/static-debian12` base image.
*   *Configuration:* All runtime values (database URL, JWT secret, Stripe key) are injected via environment variables at container start.
*   *Health Checking:* The container exposes a `/healthz` HTTP endpoint. ECS and Docker Compose poll this endpoint every 30 seconds.

### 4.2 Next.js Frontend Container
*   *Build Process:* Multi-stage Dockerfile. Stage 1 runs `npm run build` to compile the Next.js production bundle. Stage 2 copies the `.next/` output and `node_modules` into a slim `node:20-alpine` base image.
*   *Static Files:* Static assets (JS bundles, CSS, fonts) are served by the Next.js server from the container, with CloudFront CDN caching them at the edge in production.

### 4.3 PostgreSQL Database Container
*   *Use Case:* Local development and QA environments only. Production uses RDS PostgreSQL (managed service).
*   *Persistence:* The PostgreSQL data directory is mounted to a named Docker volume (`postgres_data`) to survive container restarts.
*   *Initialization:* An `init.sql` seed script runs on first container start to create the application database and role.

---

## 5. Docker Image Management Strategy

### 5.1 Image Naming & Tagging Convention

| Image | Registry Path | Tag Format |
| :--- | :--- | :--- |
| Go API | `<account>.dkr.ecr.<region>.amazonaws.com/saas-api` | `v1.2.3`, `latest` |
| Next.js Web | `<account>.dkr.ecr.<region>.amazonaws.com/saas-web` | `v1.2.3`, `latest` |

### 5.2 Base Image Selection Rules
*   **Prefer distroless or Alpine images:** Minimizes attack surface and image size.
*   **Pin base image digests:** Use `@sha256:...` digest pins in production Dockerfiles to prevent unintended base image updates.
*   **No `latest` base images in production:** Always pin an explicit version tag (e.g., `golang:1.22-alpine`).

### 5.3 Image Lifecycle
```
[ BUILD ] (CI compiles image on PR merge)
    │
    ▼
[ SCAN ] (Trivy vulnerability scan in CI pipeline)
    │
    ▼
[ PUSH ] (Tagged image pushed to ECR on success)
    │
    ▼
[ DEPLOY ] (ECS pulls image from ECR; rolling update)
    │
    ▼
[ RETIRE ] (Old images deleted from ECR after 30 days)
```

---

## 6. Docker Compose Architecture

Docker Compose orchestrates the full local development and QA environment. Services are organized into a single `docker-compose.yml` at the monorepo root.

| Service | Image | Port | Depends On |
| :--- | :--- | :--- | :--- |
| `api` | `saas-api:local` | 8080 | `postgres`, `redis` |
| `web` | `saas-web:local` | 3000 | `api` |
| `postgres` | `postgres:16-alpine` | 5432 | — |
| `redis` | `redis:7-alpine` | 6379 | — |
| `pgbouncer` | `bitnami/pgbouncer` | 6432 | `postgres` |
| `minio` | `minio/minio` | 9000 | — |

*   **Startup Order:** Docker Compose health checks enforce startup order. The `api` container only starts once `postgres` and `redis` pass their health checks.
*   **Shared Network:** All services join a single bridge network (`saas-network`), allowing them to resolve each other by service name.

---

## 7. Environment Configuration Management

Environment-specific values are managed through `.env` files for local development and AWS Secrets Manager for staging and production.

| Configuration | Local Dev | QA / Staging | Production |
| :--- | :--- | :--- | :--- |
| **Database URL** | `.env.local` | AWS Secrets Manager | AWS Secrets Manager |
| **JWT Secret** | `.env.local` | AWS Secrets Manager | AWS Secrets Manager |
| **Stripe API Key** | `.env.local` (test key) | AWS Secrets Manager (test key) | AWS Secrets Manager (live key) |
| **S3 Bucket** | MinIO local container | QA S3 bucket | Production S3 bucket |

*   **Rule:** No secrets are ever committed to the Git repository. The `.gitignore` file excludes all `.env*` files.

---

## 8. Container Security Strategy

*   **Minimal Base Images:** Use distroless or Alpine images. Remove build tools from final production images using multi-stage Dockerfile builds.
*   **Non-Root Execution:** All application containers run as a non-root user (`USER appuser`). The Go API and Next.js containers create and use a dedicated low-privilege OS user.
*   **Read-Only Filesystems:** Production containers mount the filesystem as read-only where possible, with only `/tmp` writable.
*   **Image Vulnerability Scanning:** Trivy scans all images in the CI pipeline. Images with Critical or High CVEs block the build pipeline.
*   **No Secrets in Images:** Runtime secrets are injected at container startup via environment variables sourced from AWS Secrets Manager, not baked into image layers.

---

## 9. Container Networking Design

All containers in a Docker Compose or ECS task communicate over isolated internal networks:

*   **Internal Service Communication:** The Go API container connects to `pgbouncer:6432` and `redis:6379` using container DNS names. No external port exposure is needed for database or cache containers.
*   **External Access:** Only the Nginx reverse proxy (local dev) or the ALB (production) exposes ports to the host network or the internet.
*   **Network Isolation:** Database and cache containers have no direct internet access.

---

## 10. Data Persistence Strategy

| Data Category | Storage Location | Persistence Strategy |
| :--- | :--- | :--- |
| PostgreSQL tables | Named Docker volume (`postgres_data`) | Survives container restarts; managed by RDS in production |
| Receipt PDFs | S3 / MinIO volume (`minio_data`) | Permanent; versioning enabled in production |
| Redis session cache | In-memory (ephemeral) | Intentionally ephemeral; sessions re-authenticate on Redis restart |
| Container logs | Stdout / CloudWatch Logs | Forwarded to CloudWatch; retained for 90 days |

*   **Container data vs. Persistent data:** Data written inside a container's writable layer is lost when the container is removed. Persistent data must be stored in named volumes or external managed services (RDS, S3, ElastiCache).

---

## 11. Container Health Check & Monitoring Strategy

*   **Health Endpoints:** The Go API exposes `GET /healthz` returning `200 OK`. The Next.js container exposes `GET /api/health`.
*   **Docker Compose Health Checks:** Each service definition includes a `healthcheck` block with a `30s` interval and a `3`-retry threshold before marking a service as unhealthy.
*   **Resource Limits:** Each ECS Fargate task definition sets hard CPU (`1 vCPU`) and memory (`2 GB`) limits to prevent noisy-neighbour resource starvation.
*   **Container Restart Policy:** ECS automatically replaces failed tasks. Docker Compose uses `restart: unless-stopped` for local resilience.

---

## 12. Container Deployment Workflow

```
[ DEVELOPER MERGES PR ] ──► [ CI BUILDS IMAGE ] ──► [ TRIVY SECURITY SCAN ]
                                                              │
                                                              ▼
[ ECS ROLLING UPDATE ] ◄── [ ECR IMAGE PUSH ] ◄── [ UNIT TESTS PASS ]
       │
       ▼
[ CLOUDWATCH MONITORS NEW TASKS ]
```

1.  **Build:** CI builds Docker images from the Dockerfile in the repository.
2.  **Scan:** Trivy scans the image for CVEs. Critical or High vulnerabilities block the pipeline.
3.  **Push:** The tagged image is pushed to Amazon ECR.
4.  **Deploy:** ECS performs a rolling update, launching new tasks before draining old ones.
5.  **Monitor:** CloudWatch tracks task health and fires alerts on failure.

---

## 13. Docker Best Practices Summary

*   `[x]` **Small Images:** Multi-stage builds produce lean production images (Go API target $\le 20\text{ MB}$, Next.js target $\le 200\text{ MB}$).
*   `[x]` **Clear Naming:** Images follow a consistent `<registry>/<service>:<version>` naming convention.
*   `[x]` **Version Control:** Every production image is tagged with a Semantic Version and Git commit SHA.
*   `[x]` **Security Scanning:** Trivy vulnerability scans run automatically in CI before image pushes.
*   `[x]` **Resource Limits:** ECS task definitions enforce CPU and memory hard limits.
*   `[x]` **Non-Root Users:** All containers run as a dedicated non-root application user.

---

## 14. Container Troubleshooting Strategy

| Issue | Detection | Resolution |
| :--- | :--- | :--- |
| **Container crash loop** | ECS task entering `STOPPED` state; CloudWatch `OOMKilled` error. | Inspect CloudWatch logs for the last stdout output before termination. Increase task memory limits. |
| **Image pull failure** | ECS task stuck in `PENDING` state. | Verify ECR image tag exists. Check ECS task IAM role has `ecr:GetAuthorizationToken` permission. |
| **Network timeout** | API returns `500` errors connecting to `postgres:5432`. | Verify security group rules allow traffic from ECS task SG to RDS SG on port 5432. |
| **Volume data loss** | PostgreSQL data missing after container restart. | Confirm data directory is mounted to a named volume, not the container writable layer. |
| **Secrets not loaded** | Application logs `missing environment variable` errors. | Verify ECS task definition references the correct Secrets Manager ARN and the task IAM role has `secretsmanager:GetSecretValue` permission. |

---

## 15. Docker Readiness Checklist

*   `[x]` Multi-stage Dockerfiles designed for Go API and Next.js web applications.
*   `[x]` Docker Compose service graph defined for local development.
*   `[x]` Image naming, tagging, and ECR lifecycle policies specified.
*   `[x]` Non-root user execution and read-only filesystem rules established.
*   `[x]` Trivy vulnerability scanning integrated into the CI pipeline.
*   `[x]` Named volume persistence strategy defined for local PostgreSQL and MinIO.
*   `[x]` Environment variable injection strategy defined per environment track.

---

## 16. Conclusion

This Docker Configuration and Containerization Strategy Document defines the container architecture, image management lifecycle, Docker Compose service graphs, security practices, and deployment workflows for the platform. Enforcing this containerization standard ensures consistent, secure, and reproducible deployments across all environments.

DevOps engineers and backend developers can now proceed to Dockerfile creation and Docker Compose configuration authoring.
