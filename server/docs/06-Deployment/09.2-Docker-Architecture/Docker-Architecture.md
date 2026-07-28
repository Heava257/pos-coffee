# ENTERPRISE DOCKER PRODUCTION ARCHITECTURE & CONTAINER STRATEGY

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0 — Baseline Standard  
**Date:** July 13, 2026  
**Authors:** Principal DevOps Architect, Docker Specialist & Container Security Lead  
**Classification:** Enterprise Internal — Unrestricted  
**Status:** 🏛️ APPROVED CONTAINER STANDARD  

---

## SECTION 1 — CONTAINERIZATION PRINCIPLES

### 1.1 Why Docker is Important for SaaS
Multi-tenant, modular SaaS applications run on distributed, heterogeneous host servers. Containerization solves environment drifts and resource distribution risks:
*   **Environment Consistency:** Ensures code runs identically in development, QA, staging, and production environments.
*   **Faster Deployments:** Minimizes runtime setups, enabling container startups in milliseconds.
*   **Easy Scaling:** Enables developers to scale application containers horizontally in response to shifting merchant loads.
*   **Resource Isolation:** Secures tenant contexts by confining running processes within isolated namespaces.
*   **Developer Productivity:** Simplifies local configurations by packaging supporting systems into local Docker Compose environments.

### 1.2 Traditional vs. Container Deployments

```
TRADITIONAL DEPLOYMENT                 CONTAINER DEPLOYMENT
┌──────────────────────┐               ┌──────────────────────┐
│  NextJS / NestJS App │               │  NextJS / NestJS App │
├──────────────────────┤               ├──────────────────────┤
│  Operating System    │               │ Container Namespace  │
├──────────────────────┤               ├──────────────────────┤
│  Server Hardware     │               │ Container Engine     │
└──────────────────────┘               ├──────────────────────┤
                                       │ Operating System     │
                                       ├──────────────────────┤
                                       │ Server Hardware      │
                                       └──────────────────────┘
```

---

## SECTION 2 — DOCKER ARCHITECTURE

Our container systems coordinate commands from local terminals and CI agents, packaging resources into immutable execution containers.

```mermaid
graph TD
    Client[Docker Client] -->|API Calls| Daemon[Docker Daemon Engine]
    Daemon -->|Local Cache| Images[Docker Images]
    Daemon -->|Executes| Containers[Running Containers]
    Daemon -->|Pulls / Pushes| Registry[Image Registry: ECR / GHCR]
```

### 2.1 Core Docker Components
*   **Docker Client:** Command-line tool used by engineers to run, inspect, and build containers.
*   **Docker Engine (Daemon):** System service that manages container virtualization, image compilation, and storage volumes.
*   **Docker Image:** Immutable read-only layers that package application code and dependencies.
*   **Docker Container:** Isolated runtime environments instantiated from Docker images.
*   **Docker Registry:** Private image repositories (AWS ECR, GitHub Container Registry) that host compiled images.

---

## SECTION 3 — PRODUCTION CONTAINER ARCHITECTURE

Production deployments route traffic through edge firewalls and load balancers to private subnets hosting isolated container instances.

```mermaid
graph TD
    User[Client Application] -->|HTTPS| ALB[Application Load Balancer]
    ALB -->|Port 80/443| Nginx[Nginx Ingress Container]
    
    subgraph PrivateSubnet [Isolated Private Compute Subnets]
        Nginx -->|Route: /| Web[NextJS Frontend Containers]
        Nginx -->|Route: /api| App[NestJS Backend API Containers]
        App -->|Internal Route| Worker[Background Queue Workers]
    end
    
    subgraph DataSubnet [Isolated Storage Subnets]
        App --> DB[(PostgreSQL Database Container)]
        App --> Redis[(Redis Cache Container)]
    end
    
    subgraph Observability [Ops Cluster]
        cAdvisor[cAdvisor Node Collector] --> Prom[Prometheus Monitoring Container]
    end
```

---

## SECTION 4 — FRONTEND CONTAINER STRATEGY

The Next.js frontend uses multi-stage builds to keep final production image sizes small and secure.

### 4.1 Next.js Production Dockerfile
```dockerfile
# Stage 1: Install dependencies and lock packages
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Compile applications
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Minimal production runtime environment
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Secure container privilege bounds
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { if(r.statusCode === 200) process.exit(0); else process.exit(1); })"

CMD ["node", "server.js"]
```

### 4.2 Frontend Best Practices
*   **Next.js Standalone Build:** Output standalone application packages to include only the node modules required for runtime execution.
*   **Asset Exclusions:** Exclude static source code files from production runtimes to minimize image sizes.

---

## SECTION 5 — BACKEND CONTAINER STRATEGY

Our NestJS API containers run under Node.js runtime engines.

### 5.1 NestJS Production Dockerfile
```dockerfile
# Stage 1: Restore dependencies
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Production execution environment
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Secure privilege bounds
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => { if(r.statusCode === 200) process.exit(0); else process.exit(1); })"

CMD ["node", "dist/main"]
```

### 5.2 Container Lifecycles
*   **Graceful Shutdowns:** Configure backend applications to intercept termination signals (`SIGTERM`) and close active database connection pools before shutting down.
*   **Explicit Environment Variables:** Pass environment configuration values via Kubernetes manifests instead of baking credentials directly into images.

---

## SECTION 6 — DATABASE CONTAINER STRATEGY

### 6.1 Database Deployment Rules
*   **Development:** Run isolated PostgreSQL database containers locally with persistent data volumes.
*   **Production:** Run databases on managed cloud database engines (like AWS RDS) to support automated backups and multi-region replication.
*   **Volume Security:** Configure database containers to write data to external hosts using persistent directory storage volume mappings.

---

## SECTION 7 — SUPPORTING SERVICE CONTAINERS

*   **Redis Containers:** Configured to cache query results, run message queues, and store session tokens.
*   **Message Queues:** Handle asynchronous message routing and distribute load spikes.
*   **Worker Containers:** Process background tasks like email notifications and document exports.
*   **Monitoring Containers:** Collect container performance metrics and host Grafana visualization dashboards.

---

## SECTION 8 — DOCKER COMPOSE PRODUCTION ARCHITECTURE

For local development and testing, we coordinate multi-service architectures using Docker Compose configuration files.

### 8.1 Production docker-compose.yml
```yaml
version: '3.8'

networks:
  frontend_net:
    driver: bridge
  backend_net:
    driver: bridge
  database_net:
    driver: bridge
    internal: true # Isolate database network from public routing paths

volumes:
  pg_data:
    driver: local
  redis_data:
    driver: local

services:
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - frontend_net
    depends_on:
      - frontend
      - backend

  frontend:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    networks:
      - frontend_net
    environment:
      - NEXT_PUBLIC_API_URL=http://nginx/api

  backend:
    build:
      context: ./services/api
      dockerfile: Dockerfile
    networks:
      - frontend_net
      - backend_net
      - database_net
    environment:
      - DATABASE_URL=postgresql://postgres:secret@postgres:5432/saas_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data
    networks:
      - database_net
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=saas_db

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - database_net
```

---

## SECTION 9 — CONTAINER NETWORKING

We secure communication pathways by configuring isolated container networks.
*   **Frontend Network:** Exposes the API gateway and Next.js web application ports to public internet routers.
*   **Backend Network:** Connects application containers to proxy caches and backend services.
*   **Database Network:** Isolate database containers from public routing paths, allowing connections only from authorized backend API servers.

---

## SECTION 10 — CONTAINER STORAGE STRATEGY

Container filesystems are ephemeral. We persistent application data using dedicated storage drivers:
*   **Docker Volumes:** Configure volume drivers to save PostgreSQL log files on stable host directories.
*   **Object Storage (AWS S3):** Save PDF invoices, media assets, and employee uploads directly to Amazon S3.

---

## SECTION 11 — CONTAINER SECURITY

We enforce security controls to protect containers from runtime exploits.
*   **Image Scans:** Scan built images in CI pipelines using **Trivy** to identify outdated dependencies.
*   **Minimal Base Images:** Use Alpine Linux base images (`node:20-alpine`) to minimize attack surfaces.
*   **Non-Root Executions:** Enforce non-root execution privileges across all container configurations.
*   **Read-Only Filesystem:** Configure container filesystems as read-only to prevent malicious scripts from modifying directories.

---

## SECTION 12 — RESOURCE MANAGEMENT

We configure resource limits to prevent memory leaks from affecting other system services.

### 12.1 Container Sizing Specifications

| Container Service | Minimum CPU Request | Maximum CPU Limit | Memory Request | Memory Limit |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web** | $200\text{ mCores}$ | $1000\text{ mCores}$ | $256\text{ MB}$ | $512\text{ MB}$ |
| **Backend API** | $500\text{ mCores}$ | $2000\text{ mCores}$ | $512\text{ MB}$ | $2048\text{ MB}$ |
| **Redis Cache** | $250\text{ mCores}$ | $1000\text{ mCores}$ | $512\text{ MB}$ | $1024\text{ MB}$ |
| **Database Container** | $1000\text{ mCores}$ | $4000\text{ mCores}$ | $1024\text{ MB}$ | $4096\text{ MB}$ |

---

## SECTION 13 — HEALTH CHECK STRATEGY

We use health checks to monitor container statuses and recycle failing instances.
*   **Startup Checks:** Verify that applications load successfully before routing traffic.
*   **Readiness Checks:** Query application status endpoints (e.g., `/health`) to confirm services are ready to accept requests.
*   **Liveness Checks:** Perform regular checks to verify containers are running, and restart unhealthy instances.

---

## SECTION 14 — DOCKER CI/CD CONTAINER PIPELINE

Our CI/CD pipeline builds, tests, and deploys images to production registries.

```mermaid
graph TD
    Commit[Developer PR Commit] --> Build[Compile Multi-stage Docker Image]
    Build --> Test[Run Container Unit Tests]
    Test --> Scan[Run Trivy Vulnerability Scan]
    Scan --> Push[Push Container Image to AWS ECR]
    Push --> Deploy[Deploy Update to Kubernetes Cluster]
```

---

## SECTION 15 — KUBERNETES PREPARATION

To scale containerized applications, we map Docker Compose settings to Kubernetes cluster resources.

### 15.1 Configuration Mapping Matrix

| Docker Compose Context | Kubernetes Target Resource | Operational Purpose |
| :--- | :--- | :--- |
| `service: backend` | **Deployment** | Manages NestJS application scaling and rolling updates. |
| `ports: - 3000:3000` | **Service (ClusterIP)** | Exposes internal pod networks to routing controllers. |
| `networks: database_net` | **NetworkPolicy** | Restricts network traffic to database pods. |
| `volumes: pg_data` | **PersistentVolumeClaim** | Mounts persistent cloud storage volumes to database pods. |
| `environment` | **ConfigMap / Secret** | Injects environment configurations into running containers. |

---

## SECTION 16 — CONTAINER OBSERVABILITY

We monitor container performance metrics to ensure system health.
*   **Resource Metrics:** Monitor container CPU loads, memory footprints, and restart counts.
*   **System Metrics:** Monitor API latency trends and server error rates.
*   **Tooling:** cAdvisor, Prometheus, Grafana, Loki.

---

## SECTION 17 — DOCKER TOOL STACK REFERENCE

Our standardized Docker tools are detailed in the table below:

| Category | Selected Tool | Purpose |
| :--- | :--- | :--- |
| **Runtime Container**| **Docker Engine** | Virturalizes resources to run application containers. |
| **Orchestration** | **Docker Compose** | Coordinates multi-container setups for local testing. |
| **Private Registry** | **AWS ECR** | Secure cloud repository for Docker images. |
| **Image Scanning** | **Trivy / Snyk** | Scans container images for vulnerabilities. |
| **Container Manager**| **Portainer** | Visual dashboard for monitoring container runtimes. |
| **Metrics Collector**| **cAdvisor** | Collects resource usage data from running containers. |
| **Monitoring Dashboard**| **Grafana** | Visualizes container metrics and system health. |

---

## SECTION 18 — FINAL DOCKER ARCHITECTURE MERMAID DIAGRAMS

### 18.1 Production Container Architecture
```mermaid
graph TD
    LB[AWS Load Balancer] -->|Route /api| Nest[NestJS API Container]
    LB -->|Route /| Next[NextJS Web Container]
    Nest -->|Verify Auth| Redis[Redis Session Store]
    Nest -->|Read/Write| Postgres[RDS PostgreSQL DB]
```

### 18.2 Docker Compose Architecture
```
[ Nginx Gateway Container ]
        │
        ├─► [ NextJS Web Container ] (frontend_net)
        │
        └─► [ NestJS API Container ] (backend_net)
                    │
                    ├─► [ PostgreSQL Container ] (database_net - isolated)
                    │
                    └─► [ Redis Cache Container ] (database_net - isolated)
```

### 18.3 CI/CD Container Pipeline
```
[ Commit code ] ──> [ Build Image ] ──> [ Trivy scan ] ──> [ Push ECR ] ──> [ Helm upgrade ] ──> [ Verify health ]
```

### 18.4 Container Security Flow
```mermaid
graph TD
    Base[Minimal Alpine Base Image] --> Build[Docker Multi-Stage Build]
    Build --> Scan{Trivy Vulnerability Check}
    Scan -->|Vulnerabilities Found| Fix[Reject & Repair Build]
    Scan -->|Clear| Rootless[Configure User: 1001]
    Rootless --> Run[Run Container in Read-Only Mode]
```

---

*End of Enterprise Docker Production Architecture & Container Strategy*  
*Document maintained by: Principal DevOps Architect | Status: Approved Container Standard*
