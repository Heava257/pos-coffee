# FRONTEND DEPLOYMENT, CI/CD & PRODUCTION DELIVERY ARCHITECTURE

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0 — Baseline Standard  
**Date:** July 13, 2026  
**Authors:** Principal Frontend DevOps Architect, Cloud Frontend Engineer, CI/CD Engineer, Next.js Deployment Specialist & Release Manager  
**Classification:** Enterprise Internal — Unrestricted  
**Status:** 🏛️ APPROVED FRONTEND DELIVERY & PRODUCTION ARCHITECTURE SPECIFICATION  

---

## SECTION 1 — FRONTEND DELIVERY FOUNDATION

### 1.1 Frontend Delivery Lifecycle

Every line of code written by a frontend engineer follows a deterministic, automated path from a developer's machine to a production environment serving thousands of business users:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Development  │  Local coding, hot reload, component iteration      │
├─────────────────────────────────────────────────────────────────────┤
│  Commit       │  Git push → branch protection → pull request review │
├─────────────────────────────────────────────────────────────────────┤
│  Build        │  Install → Lint → TypeScript → Test → Next.js build │
├─────────────────────────────────────────────────────────────────────┤
│  Test         │  Unit / Component / Integration / E2E / Lighthouse  │
├─────────────────────────────────────────────────────────────────────┤
│  Deploy       │  Staging → Approval → Blue/Green production deploy   │
├─────────────────────────────────────────────────────────────────────┤
│  Monitor      │  Sentry errors, Web Vitals RUM, Datadog APM alerts  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Enterprise Frontend Deployment Principles

| Principle | Description | Enforcement |
| :--- | :--- | :--- |
| **Everything as Code** | All environments, pipelines, infra, and configuration are version-controlled. | Terraform + GitHub Actions YAML in monorepo; no manual console changes. |
| **Deploy Frequently, Safely** | Deploy small changes often rather than large releases infrequently. | Feature flags decouple deploy from release; trunk-based development. |
| **Automation First** | No human manually deploys to staging or production; every deployment is pipeline-driven. | Branch protection rules + required status checks enforced on all branches. |
| **Immutable Artifacts** | Build once; promote the same artifact through environments. Never rebuild for staging or production. | Docker image digest pinning; artifact registry with immutable tags. |
| **Zero-Downtime Deployment** | Production deployments never take the site offline. | Blue/Green deployment on Vercel/AWS; health checks before traffic switch. |
| **Environment Parity** | Staging mirrors production configuration as closely as possible to eliminate "works on staging" issues. | Same container image; same environment variable schema; same CDN config. |
| **Secrets Never in Code** | No API keys, tokens, or credentials committed to version control. | GitHub Actions secrets; AWS Secrets Manager; Vault; pre-commit git-secrets hook. |
| **Rollback in Minutes** | Every production deployment has a one-command or one-click rollback path. | Vercel instant rollback; AWS CloudFront previous distribution; Docker image reversion. |

---

## SECTION 2 — ENVIRONMENT ARCHITECTURE

### 2.1 Environment Hierarchy

```mermaid
graph TD
    Local[Local Development\nDocker Compose\nMocked APIs\nHot Reload] -->|git push feature branch| Dev[Development Environment\nAuto-deployed on push\nShared MSW + Dev API\nInternal team access]

    Dev -->|PR merged to develop| Testing[Testing / QA Environment\nE2E + Regression Suite\nFull API integration\nQA team access]

    Testing -->|QA sign-off| Staging[Staging Environment\nProduction-identical config\nLoad testing\nClient UAT access]

    Staging -->|Release approval| Production[Production Environment\nBlue-Green deployment\nReal user traffic\nFull monitoring]

    Production -->|Hotfix branch| Hotfix[Hotfix Pipeline\nDirect to staging then production\nSkips feature queue]

    style Local fill:#1a3a5c,color:#fff
    style Dev fill:#1e4d2b,color:#fff
    style Testing fill:#4d3a1e,color:#fff
    style Staging fill:#4d1e4d,color:#fff
    style Production fill:#7B0000,color:#fff
    style Hotfix fill:#4d4d00,color:#fff
```

### 2.2 Environment Purpose and Configuration

| Environment | Purpose | Deployment Trigger | Access Level | API Target |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | Developer iteration; rapid feedback loop. | Manual: `npm run dev` | Developer only | MSW mocks + local NestJS |
| **Development** | Continuous integration; automated testing on every push. | Push to any feature branch | Engineering team | Dev API (`api.dev.platform.io`) |
| **Testing / QA** | Full integration testing; E2E suite; QA validation. | Merge to `develop` branch | QA team + Engineers | Staging API (seed data) |
| **Staging** | Production-mirror for UAT; load testing; final pre-release validation. | Merge to `release/*` branch | Engineering + Stakeholders | Staging API (`api.staging.platform.io`) |
| **Production** | Live system; real users and real data. | Manual approval + pipeline trigger | Public / tenant users | Production API (`api.platform.io`) |

### 2.3 Environment Variable Schema

| Variable | Local | Dev | Staging | Production |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3001/v1` | `https://api.dev.platform.io/v1` | `https://api.staging.platform.io/v1` | `https://api.platform.io/v1` |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:3001` | `wss://ws.dev.platform.io` | `wss://ws.staging.platform.io` | `wss://ws.platform.io` |
| `NEXT_PUBLIC_ENVIRONMENT` | `local` | `development` | `staging` | `production` |
| `NEXT_PUBLIC_SENTRY_DSN` | — | Dev DSN | Staging DSN | Production DSN |
| `NEXT_PUBLIC_FEATURE_FLAGS_KEY` | Local key | Dev key | Staging key | Production key |

---

## SECTION 3 — SOURCE CONTROL STRATEGY

### 3.1 Git Branching Model

We use a **trunk-based development model** with short-lived feature branches and aggressive use of feature flags to decouple deployment from release:

```mermaid
gitGraph
    commit id: "Initial"

    branch feature/pos-checkout
    checkout feature/pos-checkout
    commit id: "feat: POS UI"
    commit id: "feat: POS cart"

    checkout main
    branch feature/inventory-filter
    checkout feature/inventory-filter
    commit id: "feat: filter UI"

    checkout main
    merge feature/pos-checkout id: "Merge POS (flag: off)"

    checkout feature/inventory-filter
    commit id: "feat: filter logic"
    checkout main
    merge feature/inventory-filter id: "Merge inventory"

    branch release/1.4.0
    checkout release/1.4.0
    commit id: "chore: bump version"
    checkout main
    merge release/1.4.0 id: "Release 1.4.0" tag: "v1.4.0"

    branch hotfix/pos-void-bug
    checkout hotfix/pos-void-bug
    commit id: "fix: void order crash"
    checkout main
    merge hotfix/pos-void-bug id: "Hotfix merged" tag: "v1.4.1"
```

### 3.2 Branch Naming Conventions

| Branch Type | Pattern | Example | Lifetime |
| :--- | :--- | :--- | :--- |
| **Main** | `main` | `main` | Permanent |
| **Develop** | `develop` | `develop` | Permanent |
| **Feature** | `feature/{ticket-id}-{short-desc}` | `feature/SAAS-412-pos-discount-ui` | Days to 1 week |
| **Release** | `release/{semver}` | `release/1.4.0` | 1–3 days |
| **Hotfix** | `hotfix/{ticket-id}-{desc}` | `hotfix/SAAS-501-login-crash` | Hours to 1 day |
| **Chore** | `chore/{desc}` | `chore/upgrade-next-15` | Days |

### 3.3 Branch Protection Rules (`main` + `develop`)

```yaml
# GitHub Branch Protection (enforced via GitHub API / Terraform)
branch_protection:
  pattern: main
  required_status_checks:
    strict: true                # Branch must be up to date before merge
    contexts:
      - "TypeScript Check"
      - "ESLint"
      - "Unit & Component Tests"
      - "E2E Tests (Staging)"
      - "Lighthouse CI"
      - "Security Audit"
  required_pull_request_reviews:
    required_approving_review_count: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
  enforce_admins: true
  allow_force_pushes: false
  allow_deletions: false
```

### 3.4 Commit Message Convention (Conventional Commits)

```
feat(pos): add discount percentage input to checkout modal
fix(auth): prevent token refresh loop on expired sessions
chore(deps): upgrade next.js to 15.2.0
perf(inventory): virtualize product list with tanstack-virtual
test(dashboard): add widget loading state coverage
docs(api): update service layer README
ci(pipeline): add bundle size gate to PR checks
```

---

## SECTION 4 — FRONTEND BUILD PIPELINE

### 4.1 Build Stage Architecture

```mermaid
graph TD
    Source[Source Code: GitHub Repository] --> Trigger[CI Trigger: Push or PR]

    Trigger --> Parallel1[Parallel Stage: Static Analysis]
    Parallel1 --> TSC[TypeScript Check: tsc --noEmit]
    Parallel1 --> Lint[ESLint + Prettier]
    Parallel1 --> Audit[npm audit --audit-level=high]

    TSC --> Tests[Test Stage]
    Lint --> Tests
    Audit --> Tests

    Tests --> Unit[Jest: Unit + Component Tests]
    Tests --> A11y[jest-axe Accessibility]
    Unit --> CovGate{Coverage Threshold Met?}
    CovGate -->|Fail| FailBuild[FAIL: Block PR]
    CovGate -->|Pass| Build[Next.js Production Build]

    Build --> BundleCheck[Bundle Size Gate]
    Build --> LH[Lighthouse CI Audit]

    BundleCheck --> Security[Security Stage]
    LH --> Security

    Security --> DepCheck[Dependency Vulnerability Scan]
    Security --> HeaderCheck[Security Headers Validation]

    DepCheck --> Artifact[Package Build Artifact]
    HeaderCheck --> Artifact

    Artifact --> Deploy[Deploy to Target Environment]
```

### 4.2 Build Optimization Configuration (`next.config.ts`)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',                // Include only required files in Docker image
  compress: true,                      // Enable gzip compression for all responses
  poweredByHeader: false,              // Remove X-Powered-By header (security)
  reactStrictMode: true,              // Enable React strict mode in all environments
  experimental: {
    ppr: true,                         // Partial Prerendering: stream shell + defer dynamic data
    serverComponentsExternalPackages: ['@sentry/nextjs'],
  },
  images: {
    formats: ['image/avif', 'image/webp'], // Serve AVIF first, WebP as fallback
    domains: ['assets.platform.io', 'cdn.platform.io'],
    minimumCacheTTL: 86400,            // Cache processed images for 24 hours
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false };
    }
    return config;
  },
};

export default nextConfig;
```

---

## SECTION 5 — CI/CD ARCHITECTURE

### 5.1 Complete GitHub Actions CI/CD Workflow

```yaml
# .github/workflows/frontend-ci-cd.yml
name: Frontend CI/CD Pipeline

on:
  push:
    branches: [main, develop, 'release/**', 'hotfix/**']
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true   # Cancel stale runs when new commits push to same branch

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/web-app

jobs:
  # ─── Stage 1: Static Analysis (runs in parallel) ─────────────────────────
  static-analysis:
    name: Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci

      - name: TypeScript type check
        run: npx tsc --noEmit

      - name: ESLint
        run: npm run lint -- --max-warnings 0

      - name: Prettier format check
        run: npx prettier --check "src/**/*.{ts,tsx,css}"

      - name: Security audit
        run: npm audit --audit-level=high

  # ─── Stage 2: Automated Tests ─────────────────────────────────────────────
  test:
    name: Tests & Coverage
    needs: static-analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci

      - name: Unit & Component Tests with Coverage
        run: npm test -- --coverage --ci --forceExit
        env:
          CI: true

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: true

  # ─── Stage 3: Build ────────────────────────────────────────────────────────
  build:
    name: Next.js Production Build
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image-digest: ${{ steps.push.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci

      - name: Build Next.js application
        run: npm run build
        env:
          NEXT_PUBLIC_ENVIRONMENT: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}

      - name: Analyze bundle size
        uses: preactjs/compressed-size-action@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          pattern: '.next/static/**/*.{js,css}'
          compression: gzip
          warn-if-larger-than: 250000
          error-if-larger-than: 500000

      - name: Build Docker image
        run: |
          docker build \
            --label "git-sha=${{ github.sha }}" \
            --label "built-at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest \
            .

      - name: Push image to registry
        id: push
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }})
          echo "digest=$DIGEST" >> $GITHUB_OUTPUT

  # ─── Stage 4: E2E + Performance ───────────────────────────────────────────
  e2e-and-performance:
    name: E2E Tests & Lighthouse
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium firefox

      - name: Run Playwright E2E tests
        run: npm run test:e2e
        env:
          E2E_BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Upload E2E artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

      - name: Lighthouse CI
        run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  # ─── Stage 5: Deploy to Staging ───────────────────────────────────────────
  deploy-staging:
    name: Deploy to Staging
    needs: e2e-and-performance
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' || startsWith(github.ref, 'refs/heads/release/')
    environment:
      name: staging
      url: ${{ secrets.STAGING_URL }}
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Staging)
        run: npx vercel deploy --token=${{ secrets.VERCEL_TOKEN }} --env=staging
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  # ─── Stage 6: Deploy to Production (manual approval required) ────────────
  deploy-production:
    name: Deploy to Production
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://app.platform.io
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Production)
        run: npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Notify Slack on success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            { "text": "✅ Production deployment complete — ${{ github.sha }} by ${{ github.actor }}" }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 5.2 CI/CD Pipeline Execution Time Targets

| Stage | Target Duration | Parallelization |
| :--- | :--- | :--- |
| **Static Analysis** | < 3 minutes | Parallel with other static checks |
| **Unit + Component Tests** | < 5 minutes | Jest `--maxWorkers=4` |
| **Next.js Build** | < 8 minutes | Cached `.next` build artifacts |
| **Docker Build + Push** | < 6 minutes | Docker layer caching |
| **E2E Tests** | < 12 minutes | Playwright 4 workers |
| **Lighthouse CI** | < 5 minutes | 3 URL runs × 3 pages |
| **Total PR Pipeline** | < 20 minutes | Stages parallelized |
| **Production Deploy** | < 5 minutes | Vercel atomic deployment |

---

## SECTION 6 — NEXT.JS DEPLOYMENT STRATEGY

### 6.1 Deployment Platform Comparison

| Platform | Strengths | Weaknesses | Recommended For |
| :--- | :--- | :--- | :--- |
| **Vercel** | Zero-config Next.js; ISR built-in; Edge Runtime; instant rollback; preview URLs per PR. | Vendor lock-in; higher cost at scale; limited control over infra. | ✅ **Primary: rapid deployment, ISR, preview environments.** |
| **AWS (App Runner / ECS)** | Full infrastructure control; AWS ecosystem integration; cost-optimized at scale. | More complex setup; manual ISR configuration. | Enterprise-scale deployments requiring full AWS control. |
| **Docker + Kubernetes** | Maximum portability; on-premise support; full control. | Significant operational overhead; requires DevOps expertise. | Self-hosted enterprise or regulated environments. |
| **Cloudflare Pages** | Global edge; Workers integration; competitive pricing; DDoS protection. | Limited Next.js feature parity (no full ISR); smaller ecosystem. | Static or edge-heavy sites without ISR requirements. |
| **Self-Hosted (Node.js)** | Full control; no vendor dependency; cost-effective. | Requires server provisioning, updates, and monitoring. | Legacy environments or air-gapped networks. |

### 6.2 Our Deployment Stack Decision

```
Primary:       Vercel (Next.js SSR + ISR + Edge Runtime)
Static Assets: AWS S3 + CloudFront (images, fonts, static files)
API Gateway:   Kong on AWS ECS (backend services)
Mobile (CI):   GitHub Actions → Fastlane → TestFlight / Play Console
```

### 6.3 Vercel Project Configuration (`vercel.json`)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "regions": ["sin1", "syd1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.platform.io/v1/:path*" }
  ],
  "env": {
    "NEXT_PUBLIC_ENVIRONMENT": "production"
  }
}
```

---

## SECTION 7 — DOCKER FRONTEND ARCHITECTURE

### 7.1 Multi-Stage Docker Build

```dockerfile
# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && cp -R node_modules /tmp/prod_node_modules
RUN npm ci                     # Install all deps for build stage

# ─── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inject build-time environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_ENVIRONMENT
ARG NEXT_PUBLIC_SENTRY_DSN

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Stage 3: Production Runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only the standalone output — minimal image size
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 7.2 Docker Image Size Optimization

| Stage | Image Size | Optimization |
| :--- | :--- | :--- |
| **Base image** | `node:20-alpine` (~55 MB) | Alpine over Debian saves ~800 MB. |
| **Build stage** | ~1.2 GB (with devDependencies) | Discarded — not shipped. |
| **Production image** | ~180 MB total | Only `standalone` output + static files. Non-root user. |

### 7.3 Docker Compose for Local Development

```yaml
# docker-compose.yml
services:
  web:
    build:
      context: .
      target: builder    # Use builder stage for hot reload
      args:
        NEXT_PUBLIC_API_BASE_URL: http://localhost:3001/v1
        NEXT_PUBLIC_ENVIRONMENT: local
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev
    depends_on:
      - api

  api:
    image: ghcr.io/saasplatform/api:latest
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/saas_dev

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: saas_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## SECTION 8 — MOBILE RELEASE PIPELINE

### 8.1 React Native Release Architecture

```mermaid
graph TD
    Dev[Developer: Feature Branch] -->|PR Merge to develop| CI[GitHub Actions CI]

    CI --> UnitTests[Jest Unit Tests]
    CI --> DetoxTests[Detox E2E Tests: Simulators]

    UnitTests --> Build[Fastlane Build Stage]
    DetoxTests --> Build

    Build --> iOS[iOS Build: Xcode + Fastlane]
    Build --> Android[Android Build: Gradle + Fastlane]

    iOS --> TestFlight[Apple TestFlight: Beta Distribution]
    Android --> PlayBeta[Google Play Internal Testing]

    TestFlight -->|QA Approval| AppStore[Apple App Store: Production]
    PlayBeta -->|QA Approval| PlayProd[Google Play Store: Production]

    AppStore -->|Monitor crashes| Sentry[Sentry Mobile Monitoring]
    PlayProd --> Sentry
```

### 8.2 Fastlane iOS Configuration (`fastlane/Fastfile`)

```ruby
default_platform(:ios)

platform :ios do
  desc "Run E2E tests on simulator"
  lane :test do
    run_tests(
      workspace: "ios/SaaSMobile.xcworkspace",
      scheme: "SaaSMobile",
      devices: ["iPhone 15 Pro"]
    )
  end

  desc "Build and upload to TestFlight"
  lane :beta do
    ensure_git_status_clean

    increment_build_number(
      build_number: ENV["BUILD_NUMBER"],
      xcodeproj: "ios/SaaSMobile.xcodeproj"
    )

    build_app(
      workspace: "ios/SaaSMobile.xcworkspace",
      scheme: "SaaSMobile",
      configuration: "Release",
      export_method: "app-store",
      output_directory: "./build"
    )

    upload_to_testflight(
      api_key_path: "fastlane/app_store_connect_api_key.json",
      skip_waiting_for_build_processing: true
    )

    slack(
      message: "✅ iOS build #{ENV['BUILD_NUMBER']} uploaded to TestFlight",
      webhook_url: ENV["SLACK_WEBHOOK_URL"]
    )
  end

  desc "Submit to App Store for review"
  lane :release do
    deliver(
      api_key_path: "fastlane/app_store_connect_api_key.json",
      submit_for_review: true,
      automatic_release: false,
      force: true
    )
  end
end
```

### 8.3 Fastlane Android Configuration

```ruby
platform :android do
  desc "Build and upload to Play Store internal testing"
  lane :beta do
    gradle(
      task: "bundle",
      build_type: "Release",
      project_dir: "android/",
      properties: {
        "android.injected.signing.store.file" => ENV["ANDROID_KEYSTORE_FILE"],
        "android.injected.signing.store.password" => ENV["ANDROID_KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["ANDROID_KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["ANDROID_KEY_PASSWORD"],
      }
    )

    upload_to_play_store(
      track: "internal",
      json_key: ENV["GOOGLE_PLAY_JSON_KEY"],
      aab: "android/app/build/outputs/bundle/release/app-release.aab"
    )
  end

  desc "Promote internal build to production"
  lane :release do
    upload_to_play_store(
      track: "internal",
      track_promote_to: "production",
      json_key: ENV["GOOGLE_PLAY_JSON_KEY"],
      rollout: "0.1"    # 10% gradual rollout
    )
  end
end
```

### 8.4 Mobile CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/mobile/**'

jobs:
  test-and-build-ios:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci

      - name: Install CocoaPods
        run: cd apps/mobile/ios && pod install

      - name: Run unit tests
        run: npm test --workspace=apps/mobile

      - name: Build and upload to TestFlight
        if: github.ref == 'refs/heads/main'
        run: bundle exec fastlane ios beta
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
          BUILD_NUMBER: ${{ github.run_number }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  test-and-build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - run: npm ci

      - name: Run unit tests
        run: npm test --workspace=apps/mobile

      - name: Build and upload to Play Store
        if: github.ref == 'refs/heads/main'
        run: bundle exec fastlane android beta
        env:
          ANDROID_KEYSTORE_FILE: ${{ secrets.ANDROID_KEYSTORE_FILE }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
          GOOGLE_PLAY_JSON_KEY: ${{ secrets.GOOGLE_PLAY_JSON_KEY }}
```

---

## SECTION 9 — ENVIRONMENT CONFIGURATION

### 9.1 Environment Variable Management Strategy

| Layer | Tool | Usage |
| :--- | :--- | :--- |
| **Local development** | `.env.local` (gitignored) | Developer overrides; MSW endpoints; local ports. |
| **CI/CD pipeline** | GitHub Actions Secrets | Build-time and runtime vars injected by pipeline. |
| **Vercel deployment** | Vercel Environment Variables | Per-environment values; encrypted at rest. |
| **Kubernetes / ECS** | AWS Secrets Manager + Parameter Store | Runtime secrets for self-hosted deployments. |
| **Mobile (React Native)** | `.env.production` via `react-native-config` | Bundled at build time by Fastlane. |

### 9.2 Environment File Structure

```
apps/web/
├── .env.example              ← Template; committed to git; no real values
├── .env.local                ← Developer local overrides; gitignored
├── .env.development          ← Dev environment defaults; committed
├── .env.staging              ← Staging defaults; committed (no secrets)
└── .env.production           ← Production defaults; committed (no secrets)
```

### 9.3 `.env.example` Template

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.platform.io/v1
NEXT_PUBLIC_WS_URL=wss://ws.platform.io

# Environment
NEXT_PUBLIC_ENVIRONMENT=production

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS_KEY=your-feature-flags-sdk-key

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Analytics
NEXT_PUBLIC_ANALYTICS_KEY=your-analytics-key

# Payment (public keys only; private keys stay server-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### 9.4 Secret Injection at Build Time (GitHub Actions)

```yaml
- name: Build with secrets
  run: npm run build
  env:
    NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.SENTRY_DSN_PROD }}
    NEXT_PUBLIC_ANALYTICS_KEY: ${{ secrets.ANALYTICS_KEY_PROD }}
    NEXT_PUBLIC_FEATURE_FLAGS_KEY: ${{ secrets.FEATURE_FLAGS_KEY_PROD }}
    # Server-side only secrets (never exposed to client)
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

---

## SECTION 10 — FEATURE FLAG ARCHITECTURE

### 10.1 Feature Flag Strategy

We use feature flags to decouple code deployment from feature release, enabling continuous delivery without exposing incomplete features to users:

```
Code merged and deployed → Feature behind flag (default: OFF)
    ↓
QA validates on staging with flag ON
    ↓
Gradual rollout: 5% → 25% → 50% → 100%
    ↓
Feature flag removed from codebase in next sprint
```

### 10.2 Feature Flag Implementation (`lib/featureFlags.ts`)

```typescript
import { OpenFeature, type Client } from '@openfeature/web-sdk';
import { CloudbeesProvider } from '@openfeature/cloudbees-provider';

// Initialize OpenFeature provider (works with LaunchDarkly, CloudBees, Growthbook)
OpenFeature.setProvider(new CloudbeesProvider({
  sdkKey: process.env.NEXT_PUBLIC_FEATURE_FLAGS_KEY!,
}));

const flagClient: Client = OpenFeature.getClient();

// Typed feature flag definitions
export const FEATURE_FLAGS = {
  NEW_POS_DISCOUNT_UI:    'new-pos-discount-ui',
  ADVANCED_ANALYTICS:     'advanced-analytics-dashboard',
  MULTI_BRANCH_SELECTOR:  'multi-branch-selector',
  NEW_CHECKOUT_FLOW:      'new-checkout-flow',
  AI_DEMAND_FORECASTING:  'ai-demand-forecasting',
} as const;

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

export async function isFeatureEnabled(
  flag: FeatureFlag,
  context?: { userId?: string; tenantId?: string; plan?: string }
): Promise<boolean> {
  return flagClient.getBooleanValue(flag, false, context);
}
```

### 10.3 `useFeatureFlag` Hook

```typescript
// hooks/useFeatureFlag.ts
import { useState, useEffect } from 'react';
import { isFeatureEnabled, type FeatureFlag } from '@/lib/featureFlags';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantStore } from '@/store/useTenantStore';

export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  const [enabled, setEnabled] = useState(false);
  const { userId } = useAuthStore();
  const { tenantId, plan } = useTenantStore();

  useEffect(() => {
    isFeatureEnabled(flag, { userId, tenantId, plan: plan ?? undefined })
      .then(setEnabled);
  }, [flag, userId, tenantId, plan]);

  return enabled;
};

// Usage in component
const NewCheckoutFlow = () => {
  const isNewCheckout = useFeatureFlag(FEATURE_FLAGS.NEW_CHECKOUT_FLOW);
  return isNewCheckout ? <NewPOSCheckout /> : <LegacyPOSCheckout />;
};
```

### 10.4 Feature Flag Rollout Strategy

| Phase | Audience | Flag Config | Duration |
| :--- | :--- | :--- | :--- |
| **Alpha** | Internal team only (`@platform.io` emails) | 0% public; allow list by user ID | 1–2 days |
| **Beta** | QA environment + beta tenant list | Specific `tenantId` allow list | 3–7 days |
| **Canary 5%** | 5% of all production tenants | 5% random hash rollout | 1–2 days |
| **Canary 25%** | 25% of all production tenants | 25% random hash rollout | 2–3 days |
| **Canary 50%** | 50% of all production tenants | 50% rollout | 2–3 days |
| **General Availability** | 100% of production users | Flag removed from code | Sprint cleanup |

---

## SECTION 11 — CDN DELIVERY ARCHITECTURE

### 11.1 CDN Delivery Architecture

```mermaid
graph TD
    Build[CI/CD: Next.js Build Complete] --> Upload[Upload static assets to S3]
    Build --> Vercel[Deploy app to Vercel Edge]

    Upload --> CFDist[AWS CloudFront Distribution]
    Vercel --> CFDist

    CFDist --> Invalidate[Cache Invalidation: content-hashed files = skip, HTML = purge]

    CFDist --> PoP1[Edge PoP: Singapore: ap-southeast-1]
    CFDist --> PoP2[Edge PoP: Tokyo: ap-northeast-1]
    CFDist --> PoP3[Edge PoP: Sydney: ap-southeast-2]
    CFDist --> PoP4[Edge PoP: US-East: us-east-1]
    CFDist --> PoP5[Edge PoP: Frankfurt: eu-central-1]

    User_SEA[SEA Users: Cambodia, Thailand, Vietnam] -->|Nearest PoP: Singapore| PoP1
    User_JP[Japan Users] --> PoP2
    User_AU[Australia Users] --> PoP3
    User_US[US Users] --> PoP4
    User_EU[EU Users] --> PoP5

    PoP1 -->|Cache HIT: HTML, CSS, JS, Images| User_SEA
    PoP1 -->|Cache MISS| CFDist
```

### 11.2 CloudFront Distribution Configuration

```yaml
# terraform/cloudfront.tf (simplified representation)
CloudFront Distribution:
  Origins:
    - S3 bucket: static assets (JS, CSS, images, fonts)
    - Vercel: SSR/ISR Next.js pages
    - Kong Gateway: API responses (bypass CDN — no caching)

  Cache Behaviors:
    - Path: /_next/static/*
      Cache: 365 days (immutable)
      Compress: true (Brotli + gzip)
      HTTP/3: enabled

    - Path: /_next/image/*
      Cache: 24 hours
      TTL: 86400

    - Path: /api/*
      Cache: none (forward to Kong)
      Forward cookies: all
      Forward headers: all

    - Path: /*
      Cache: s-maxage=60; stale-while-revalidate=3600
      Compress: true

  Geographic Restrictions: none (global delivery)
  Price Class: PriceClass_All (all edge locations)
  WAF: enabled (AWS WAF + Cloudflare upstream)
  Minimum TLS: TLSv1.3
```

### 11.3 Asset URL Strategy

```
Production static assets:
  https://cdn.platform.io/_next/static/chunks/main-[contenthash].js
  https://cdn.platform.io/_next/static/css/app-[contenthash].css
  https://cdn.platform.io/assets/products/[uuid]/image.webp

Content-hash filenames:
  → Cache busted automatically on content change
  → Browser caches for 1 year (immutable)
  → No manual CDN invalidation needed for static assets

HTML pages:
  → Purged from CDN cache on every deployment
  → S-maxage=60 for ISR pages (served stale during revalidation)
```

---

## SECTION 12 — CACHE INVALIDATION STRATEGY

### 12.1 Cache Invalidation Rules by Asset Type

| Asset Type | Cache-Control | CDN TTL | Invalidation Strategy |
| :--- | :--- | :--- | :--- |
| **JS bundles** (`*.js` with content hash) | `immutable, max-age=31536000` | 365 days | Content hash changes on rebuild — no manual invalidation. |
| **CSS bundles** (content-hashed) | `immutable, max-age=31536000` | 365 days | Same as JS bundles. |
| **HTML pages (SSR)** | `no-store` | 0 | Always fresh from server. |
| **HTML pages (ISR)** | `s-maxage=60, stale-while-revalidate=3600` | 60 s | Auto-revalidated; on-demand via `revalidatePath()`. |
| **Product images (S3)** | `public, max-age=604800` | 7 days | CloudFront invalidation on S3 key change. |
| **Fonts** | `public, max-age=31536000` | 365 days | Served by next/font; content-hashed. |
| **Service Worker** | `no-cache` (always revalidate) | 0 | Browser fetches fresh on every page load. |

### 12.2 On-Demand Cache Invalidation (ISR)

```typescript
// app/api/revalidate/route.ts — Webhook from backend CMS or admin action
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidation-secret');
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path, tag } = await request.json();

  if (path) revalidatePath(path);                // Invalidate specific page
  if (tag)  revalidateTag(tag);                  // Invalidate all pages tagged with this key

  return Response.json({ revalidated: true, timestamp: new Date().toISOString() });
}

// Trigger from backend after product update:
// POST /api/revalidate
// Body: { "path": "/inventory/products", "tag": "products" }
```

### 12.3 CloudFront Programmatic Invalidation

```typescript
// scripts/invalidate-cdn.ts — Run after production deploy
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

const client = new CloudFrontClient({ region: 'us-east-1' });

await client.send(new CreateInvalidationCommand({
  DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
  InvalidationBatch: {
    CallerReference: `deploy-${Date.now()}`,
    Paths: {
      Quantity: 3,
      Items: [
        '/index.html',
        '/',
        '/_next/data/*',  // Invalidate ISR JSON data pages
      ],
    },
  },
}));
```

---

## SECTION 13 — RELEASE MANAGEMENT

### 13.1 Release Process

```mermaid
graph TD
    Sprint[Sprint Planning] --> Dev[Development: Feature Branches]
    Dev -->|Features merged to develop| RC[Release Candidate Creation]
    RC --> ReleaseTag[Create release/x.y.z branch]

    ReleaseTag --> Staging[Deploy to Staging: Auto]
    Staging --> LoadTest[Load Testing: k6]
    Staging --> UAT[Client UAT Acceptance Testing]
    Staging --> Security[OWASP ZAP Security Scan]

    LoadTest --> GoNoGo{Go/No-Go Decision}
    UAT --> GoNoGo
    Security --> GoNoGo

    GoNoGo -->|No-Go| Bugfix[Fix Issues on Release Branch]
    Bugfix --> Staging

    GoNoGo -->|Go| Approval[Engineering Manager + QA Lead Approval]
    Approval --> BlueGreen[Blue-Green Production Deploy]

    BlueGreen --> SmokeTest[Automated Smoke Test: 5 min]
    SmokeTest -->|Pass| TrafficSwitch[100% Traffic Switch to New Version]
    SmokeTest -->|Fail| Rollback[Automatic Rollback to Previous Version]

    TrafficSwitch --> Monitor[30-minute Active Monitoring]
    Monitor -->|No incidents| Merge[Merge release branch to main]
    Monitor -->|Incident| Rollback
```

### 13.2 Semantic Versioning Strategy

```
Format: MAJOR.MINOR.PATCH  (e.g., 2.4.1)

PATCH: Bug fixes, performance improvements, security patches.
  → Deploy via hotfix branch; minimal testing; fast-track to production.
  → Example: 2.4.0 → 2.4.1

MINOR: New features (behind feature flags), UX improvements.
  → Full release process; full sprint testing cycle.
  → Example: 2.4.0 → 2.5.0

MAJOR: Breaking changes, architectural changes, major redesign.
  → Extended QA cycle; stakeholder sign-off; migration plan.
  → Example: 2.x.x → 3.0.0
```

### 13.3 Release Checklist

- [ ] All feature PRs merged and closed; release branch created.
- [ ] Version number bumped in `package.json` and `CHANGELOG.md` updated.
- [ ] All CI pipeline stages pass on release branch.
- [ ] Full E2E regression suite passes on staging.
- [ ] Load test: 200 concurrent users; p99 checkout ≤ 50 ms.
- [ ] OWASP ZAP scan: zero HIGH/CRITICAL findings.
- [ ] Lighthouse CI: performance ≥ 85 mobile, ≥ 90 desktop.
- [ ] Accessibility: score ≥ 90; zero WCAG AA violations.
- [ ] Feature flags reviewed: new features correctly defaulted OFF.
- [ ] Sentry release created and source maps uploaded.
- [ ] Rollback plan documented and tested.
- [ ] Engineering Manager and QA Lead sign-off obtained.
- [ ] Deployment scheduled during low-traffic window (SEA: 02:00–04:00 UTC+7).

---

## SECTION 14 — BLUE-GREEN DEPLOYMENT

### 14.1 Blue-Green Deployment Strategy

Blue-green deployment maintains two identical production environments. At any time, one is live (serving all traffic) and one is idle (receiving the new deployment):

```mermaid
graph TD
    LB[Load Balancer / CloudFront] -->|100% traffic| Blue[Blue: Current Production v1.4.0]

    Deploy[New Deployment: v1.5.0] --> Green[Green: New Version v1.5.0]
    Green --> HealthCheck[Automated Health Checks + Smoke Tests]

    HealthCheck -->|All checks pass| Switch[Traffic Switch: 0% Blue → 100% Green]
    HealthCheck -->|Any check fails| AbortDeploy[Abort: Keep traffic on Blue]

    Switch -->|New production: Green| LB2[Load Balancer] -->|100% traffic| GreenLive[Green: v1.5.0 active]
    Switch --> BlueStandby[Blue: v1.4.0 on standby for rollback]

    Incident[Incident Detected] --> Rollback[Instant Rollback: 100% traffic to Blue]
    Rollback --> BlueActive[Blue: v1.4.0 restored in under 60 seconds]
```

### 14.2 Vercel Blue-Green Deployment

```bash
# Vercel automatically implements blue-green via atomic deployments

# Step 1: Deploy new version (does not affect live traffic yet)
vercel deploy --prod --token=$VERCEL_TOKEN
# Returns: https://web-app-git-main-xxx.vercel.app (preview URL)

# Step 2: Run smoke tests against new deployment
npm run test:smoke -- --base-url=https://web-app-git-main-xxx.vercel.app

# Step 3: On success, promote to production (instant traffic switch)
vercel alias set web-app-git-main-xxx.vercel.app app.platform.io

# Step 4: Rollback if needed (instant — previous deployment is retained)
vercel rollback --token=$VERCEL_TOKEN
```

### 14.3 Health Check Automation

```typescript
// scripts/smoke-test.ts — Run against new deployment before traffic switch
const SMOKE_TESTS = [
  { url: '/', expectStatus: 200, expectText: 'Business Dashboard' },
  { url: '/login', expectStatus: 200, expectText: 'Sign in to your account' },
  { url: '/api/health', expectStatus: 200, expectJson: { status: 'healthy' } },
  { url: '/_next/static/chunks/main.js', expectStatus: 200 },
];

async function runSmokeTests(baseUrl: string): Promise<void> {
  for (const test of SMOKE_TESTS) {
    const response = await fetch(`${baseUrl}${test.url}`);
    if (response.status !== test.expectStatus) {
      throw new Error(`Smoke test FAILED: ${test.url} returned ${response.status}`);
    }
    console.info(`✅ Smoke test passed: ${test.url}`);
  }
}

await runSmokeTests(process.env.DEPLOY_URL!);
```

---

## SECTION 15 — CANARY RELEASE STRATEGY

### 15.1 Canary Traffic Routing Architecture

```mermaid
graph TD
    User[User Request] --> CloudFront[CloudFront / Vercel Edge]
    CloudFront --> Router[Canary Router: Lambda@Edge / Edge Function]

    Router -->|Canary cookie absent: assign bucket| BucketAssign[Assign user to bucket: 0-99 random]
    Router -->|Canary cookie present: read bucket| BucketRead[Read existing bucket]

    BucketAssign --> BucketCheck{User bucket number}
    BucketRead --> BucketCheck

    BucketCheck -->|Bucket 0-4: 5% canary| NewVersion[Route to v1.5.0: Green deployment]
    BucketCheck -->|Bucket 5-99: 95% stable| OldVersion[Route to v1.4.0: Blue deployment]

    NewVersion --> Sentry[Sentry: Monitor error rate]
    OldVersion --> Sentry

    Sentry -->|Error rate delta greater than 0.5%| AutoRollback[Auto-rollback: 0% canary]
    Sentry -->|Error rate nominal| Expand[Expand canary: 5% → 25% → 50% → 100%]
```

### 15.2 Canary Rollout Schedule

| Phase | Traffic % | Duration | Promotion Criteria |
| :--- | :--- | :--- | :--- |
| **Internal** | 0% (internal team by flag) | 1 day | No errors; all flows work. |
| **Canary 5%** | 5% production users | 24 hours | Error rate delta < 0.1%; no P0 issues. |
| **Canary 25%** | 25% production users | 24 hours | Error rate delta < 0.1%; Sentry clean. |
| **Canary 50%** | 50% production users | 12–24 hours | Error rate nominal; Web Vitals stable. |
| **Full Rollout** | 100% production users | Permanent | Final confirmation; monitor for 1 hour. |
| **Rollback Trigger** | Back to 0% instantly | — | Error rate delta > 0.5% or P0 incident. |

### 15.3 Edge Function Canary Router

```typescript
// Cloudflare Worker or Vercel Edge Function
export default async function canaryRouter(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const cookie = request.headers.get('Cookie') || '';

  // Parse or assign canary bucket
  let bucket: number;
  const bucketMatch = cookie.match(/canary-bucket=(\d+)/);
  if (bucketMatch) {
    bucket = parseInt(bucketMatch[1]);
  } else {
    bucket = Math.floor(Math.random() * 100);
  }

  const CANARY_PERCENTAGE = parseInt(process.env.CANARY_PERCENTAGE ?? '5');
  const isCanary = bucket < CANARY_PERCENTAGE;
  const targetOrigin = isCanary
    ? process.env.GREEN_ORIGIN   // New version
    : process.env.BLUE_ORIGIN;   // Stable version

  const response = await fetch(new Request(targetOrigin + url.pathname, request));
  const newResponse = new Response(response.body, response);

  // Set bucket cookie to ensure session consistency
  newResponse.headers.set('Set-Cookie', `canary-bucket=${bucket}; Path=/; SameSite=Strict; Secure`);
  newResponse.headers.set('X-Canary-Bucket', String(bucket));
  newResponse.headers.set('X-Canary-Version', isCanary ? 'green' : 'blue');

  return newResponse;
}
```

---

## SECTION 16 — FRONTEND MONITORING

### 16.1 Monitoring Architecture

```mermaid
graph TD
    Production[Production Application] --> RUM[Real User Monitoring: web-vitals]
    Production --> Errors[JavaScript Errors: Sentry]
    Production --> Logs[Application Logs: Datadog]
    Production --> Uptime[Uptime Checks: Datadog Synthetics]

    RUM --> Dashboard[Performance Dashboard]
    Errors --> Alerts[PagerDuty Alerts]
    Logs --> Dashboard
    Uptime --> Alerts

    Dashboard --> Team[Engineering Team: Slack Notifications]
    Alerts --> OnCall[On-Call Engineer: PagerDuty]
```

### 16.2 Sentry Release Tracking

```typescript
// sentry.client.config.ts — Tag each deployment with release version
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  release: process.env.NEXT_PUBLIC_APP_VERSION,   // e.g., "1.5.0+sha.abc1234"
  tracesSampleRate: 0.1,

  // Alert: > 1% new error rate on canary vs. baseline
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllInputs: true }),
  ],
});
```

```bash
# CI: Upload source maps and create Sentry release
npx sentry-cli releases new $APP_VERSION
npx sentry-cli releases files $APP_VERSION upload-sourcemaps .next/static/chunks
npx sentry-cli releases finalize $APP_VERSION
npx sentry-cli releases deploys $APP_VERSION new -e production
```

### 16.3 Monitoring Alert Rules

| Alert | Condition | Severity | Response |
| :--- | :--- | :--- | :--- |
| **JS Error Rate Spike** | Error rate > 1% (up from baseline < 0.1%) | P1 | PagerDuty → on-call; assess rollback. |
| **LCP Regression** | p75 LCP > 3.0 s (was ≤ 2.0 s) | P2 | Slack alert → performance investigation. |
| **Uptime Failure** | Health check fails 3x in 5 min | P0 | PagerDuty immediate; activate incident. |
| **404 Rate Spike** | 404s > 5% of requests | P2 | Routing audit; asset reference check. |
| **Canary Error Delta** | New version error rate > old version by 0.5% | P1 | Auto-rollback canary to 0%. |
| **Bundle Size Increase** | Any chunk > 500 kB gzipped | P2 | CI blocks PR; engineer must resolve. |

---

## SECTION 17 — SECURITY IN DEPLOYMENT

### 17.1 Secret Management Architecture

```mermaid
graph TD
    Dev[Developer] -->|Never commits secrets| Git[GitHub Repository]
    Git -->|CI reads secrets from| GHSecrets[GitHub Actions Secrets]

    GHSecrets -->|Injected at build time| Build[Next.js Build Process]
    GHSecrets -->|Injected at deploy| Vercel[Vercel Environment Variables]

    Vercel -->|Runtime env vars| App[Production Next.js App]
    App -->|Reads| Env[process.env.NEXT_PUBLIC_*]

    Backend[NestJS Backend] -->|Reads at runtime| ASM[AWS Secrets Manager]
    ASM -->|Rotated automatically| Backend

    PreCommit[git commit] --> GitSecrets[git-secrets Hook: Blocks hardcoded credentials]
```

### 17.2 Pre-Commit Security Hook

```bash
# .husky/pre-commit — Block commits containing secrets
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Scan for hardcoded secrets before every commit
npm run lint-staged
npx git-secrets --scan
npx secretlint "**/*"    # Uses .secretlintrc rules to detect API keys, tokens, DSNs
```

### 17.3 Dependency Security in CI

```yaml
# Security scan stages in CI pipeline
- name: Dependency vulnerability audit
  run: npm audit --audit-level=high
  # Fails CI if any HIGH or CRITICAL CVE found in production dependencies

- name: SBOM generation
  run: npx @cyclonedx/cyclonedx-npm --output-file sbom.json
  # Software Bill of Materials for supply chain audit

- name: Container image scan
  run: docker run --rm -v /var/run/docker.sock:/var/run/docker.sock
       aquasec/trivy image ${{ env.IMAGE_NAME }}:${{ github.sha }}
       --exit-code 1 --severity HIGH,CRITICAL
  # Scan Docker image for OS-level CVEs

- name: Upload SBOM artifact
  uses: actions/upload-artifact@v4
  with:
    name: sbom
    path: sbom.json
```

### 17.4 HTTPS and Header Enforcement

```typescript
// All environments enforce HTTPS via next.config.ts headers + Vercel HTTPS-only
// Staging and Production: HSTS preload submitted to Chrome HSTS preload list

// next.config.ts
headers: [
  {
    source: '/:path*',
    headers: [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'nonce-{nonce}'",
          "connect-src 'self' https://api.platform.io wss://ws.platform.io",
          "img-src 'self' https://cdn.platform.io data: blob:",
          "font-src 'self' https://fonts.gstatic.com",
          "frame-ancestors 'none'",
        ].join('; '),
      },
    ],
  },
],
```

---

## SECTION 18 — DISASTER RECOVERY

### 18.1 Frontend Disaster Recovery Tiers

| Failure Scenario | RTO | RPO | Recovery Action |
| :--- | :--- | :--- | :--- |
| **Deployment regression (Vercel)** | < 2 min | 0 (code unchanged) | `vercel rollback` — instant previous deployment restore. |
| **CDN cache poisoning** | < 5 min | 0 | CloudFront full invalidation + origin revalidation. |
| **Feature flag misconfiguration** | < 1 min | 0 | Kill switch: disable flag via dashboard instantly. |
| **Third-party service outage (analytics)** | Transparent | N/A | Services degraded gracefully; feature flag disables integration. |
| **DNS failure** | < 15 min | 0 | Failover DNS to secondary CDN via Route 53 health checks. |
| **Complete CDN failure** | < 30 min | 0 | Re-route traffic directly to Vercel origin via DNS update. |
| **Production data corruption** | N/A (frontend) | N/A | Backend DR plan activates; frontend shows maintenance page. |

### 18.2 Rollback Procedures

```bash
# ─── Vercel Rollback (< 2 minutes) ───────────────────────────────────────────
# Option A: Vercel Dashboard → Deployments → Previous → Promote
# Option B: CLI
vercel rollback --token=$VERCEL_TOKEN

# ─── CloudFront Rollback (< 5 minutes) ────────────────────────────────────────
# Point CloudFront origin to previous S3 path
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file://previous-config.json

# Invalidate all caches to serve previous version
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# ─── Docker / Kubernetes Rollback ─────────────────────────────────────────────
# Kubernetes rolls back to previous ReplicaSet
kubectl rollout undo deployment/web-app

# Or deploy specific previous image digest
kubectl set image deployment/web-app \
  web=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@sha256:previous_digest

# ─── Mobile Rollback (App Store / Play Store) ─────────────────────────────────
# iOS: Submit previous build from TestFlight archive for expedited review
# Android: Play Console → Release → Rollout → Halt rollout + reactivate previous
```

### 18.3 Maintenance Mode

```typescript
// Controlled maintenance mode via feature flag or environment variable
// middleware.ts — Show maintenance page to all users when flag is ON

export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (maintenanceMode && !request.nextUrl.pathname.startsWith('/maintenance')) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}
```

---

## SECTION 19 — FRONTEND DEVOPS TOOL STACK

### 19.1 Complete Frontend DevOps Tool Stack

| Category | Tool | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Source Control** | GitHub | Enterprise | Code hosting; branch protection; PR reviews; Actions. |
| **CI/CD** | GitHub Actions | — | Build, test, deploy automation; environment secrets. |
| **Package Manager** | npm (with `ci` lockfile mode) | 10+ | Deterministic dependency installs in CI. |
| **Containerization** | Docker | 25+ | Multi-stage builds; portable production images. |
| **Container Registry** | GitHub Container Registry (GHCR) | — | Private image storage; digest pinning. |
| **Web Deployment** | Vercel | — | Next.js SSR/ISR/Edge; instant rollback; preview URLs. |
| **Static Assets** | AWS S3 | — | Immutable static file storage; lifecycle policies. |
| **CDN (Primary)** | AWS CloudFront | — | Global edge delivery; Brotli compression; WAF integration. |
| **CDN (Secondary / WAF)** | Cloudflare | Pro+ | DDoS protection; WAF rules; Workers for edge logic. |
| **DNS** | AWS Route 53 | — | Health-check-based failover; latency-based routing. |
| **Mobile CI** | Fastlane | 2+ | iOS and Android build automation; App Store + Play Store upload. |
| **Mobile CI Runner** | GitHub Actions (macOS) | — | Xcode builds for iOS; Gradle builds for Android. |
| **Feature Flags** | OpenFeature + CloudBees | — | Provider-agnostic feature flag SDK; canary rollouts. |
| **Error Monitoring** | Sentry | — | JS error tracking; session replay; release tracking. |
| **APM / RUM** | Datadog | — | Real user monitoring; distributed tracing; dashboards. |
| **Uptime Monitoring** | Datadog Synthetics | — | Synthetic browser tests from global PoPs every 1 min. |
| **Secret Management** | GitHub Actions Secrets + AWS Secrets Manager | — | Build-time and runtime secret injection. |
| **Security Scanning** | `npm audit` + Trivy + OWASP ZAP | — | Dependency CVE; container CVE; DAST scanning. |
| **Notification** | Slack + PagerDuty | — | CI/CD alerts; deployment notifications; on-call escalation. |
| **Infrastructure as Code** | Terraform | 1.8+ | CloudFront, S3, Route 53, IAM roles as code. |

---

## SECTION 20 — FINAL FRONTEND DELIVERY ARCHITECTURE DIAGRAMS

### 20.1 Complete Frontend CI/CD Pipeline

```mermaid
graph TD
    Dev[Developer: Code Change] --> PR[Pull Request Opened]

    PR --> Parallel[Parallel: Static Analysis]
    Parallel --> TSC[TypeScript: tsc]
    Parallel --> ESLint[ESLint + Prettier]
    Parallel --> Audit[npm audit]

    TSC --> TestStage[Test Stage]
    ESLint --> TestStage
    Audit --> TestStage

    TestStage --> Unit[Jest: Unit + Component]
    TestStage --> A11y[jest-axe: Accessibility]
    Unit --> Coverage{Coverage OK?}
    Coverage -->|Fail| BlockPR[Block PR]
    Coverage -->|Pass| BuildStage[Build Stage]

    BuildStage --> NextBuild[Next.js Production Build]
    BuildStage --> DockerBuild[Docker Multi-Stage Build]
    BuildStage --> BundleGate[Bundle Size Gate]

    NextBuild --> E2EStage[E2E + Performance Stage]
    DockerBuild --> Registry[Push to GHCR]
    BundleGate --> E2EStage

    E2EStage --> Playwright[Playwright E2E: 4 workers]
    E2EStage --> LH[Lighthouse CI: 3 pages]

    Playwright --> DeployStaging[Deploy to Staging]
    LH --> DeployStaging

    DeployStaging --> SmokeTest[Automated Smoke Tests]
    SmokeTest -->|Fail| Rollback[Auto-Rollback Staging]
    SmokeTest -->|Pass| Approval[Engineering Manager Approval]

    Approval --> BlueGreen[Blue-Green Production Deploy]
    BlueGreen --> ProdSmoke[Production Smoke Test: 5 min]
    ProdSmoke -->|Fail| ProdRollback[Auto-Rollback Production: under 2 min]
    ProdSmoke -->|Pass| Monitor[30-min Active Monitoring]
    Monitor --> Done[Deployment Complete]
```

### 20.2 Deployment Architecture

```mermaid
graph TD
    subgraph Build [CI/CD Build Layer]
        GHA[GitHub Actions]
        GHCR[GitHub Container Registry]
        S3Build[AWS S3: Build Artifacts]
    end

    subgraph Edge [Edge Delivery Layer]
        CF[Cloudflare: WAF + DDoS + DNS]
        CloudFront[AWS CloudFront: CDN]
        Vercel[Vercel Edge: SSR + ISR + Edge Functions]
    end

    subgraph Origin [Origin Layer]
        S3Static[AWS S3: Static Assets]
        Kong[Kong API Gateway]
    end

    subgraph Services [Backend Services]
        NestJS[NestJS Microservices]
        Redis[(Redis Cache)]
        Postgres[(PostgreSQL)]
    end

    GHA --> GHCR
    GHA --> S3Build
    S3Build --> S3Static
    GHA --> Vercel

    User[End User] --> CF
    CF --> CloudFront
    CF --> Vercel

    CloudFront --> S3Static
    CloudFront --> Vercel

    Vercel --> Kong
    Kong --> NestJS
    NestJS --> Redis
    NestJS --> Postgres
```

### 20.3 Environment Promotion Flow

```mermaid
graph LR
    Local[Local\nDocker Compose\nMocked APIs] -->|git push feature| Dev[Development\nAuto-deploy on push\nCI: lint + unit tests]

    Dev -->|PR merged to develop| QA[QA / Testing\nFull E2E suite\nIntegration tests]

    QA -->|QA sign-off| Staging[Staging\nLoad test\nUAT\nSecurity scan]

    Staging -->|Release approval| Prod[Production\nBlue-Green deploy\nCanary rollout\nFull monitoring]

    Prod -->|Hotfix branch| HF[Hotfix Fast-Track\nStaging smoke test\nDirect to production]
    HF --> Prod

    style Local fill:#1a3a5c,color:#fff
    style Dev fill:#1e4d2b,color:#fff
    style QA fill:#4d3a1e,color:#fff
    style Staging fill:#4d1e4d,color:#fff
    style Prod fill:#7B0000,color:#fff
    style HF fill:#4d4d00,color:#fff
```

### 20.4 CDN Delivery Architecture

```mermaid
graph TD
    Deploy[CI/CD: Production Deploy] --> S3Upload[Upload Static Assets to S3]
    Deploy --> VercelDeploy[Vercel Atomic Deployment]

    S3Upload --> CloudFrontInvalidate[CloudFront Cache Invalidation: HTML only]
    VercelDeploy --> CloudFrontInvalidate

    CloudFrontInvalidate --> EdgeNetwork[Global CloudFront Edge Network]

    EdgeNetwork --> SEA[Singapore Edge: ap-southeast-1\nPrimary: SEA Users]
    EdgeNetwork --> AU[Sydney Edge: ap-southeast-2\nDR + Australia]
    EdgeNetwork --> JP[Tokyo Edge: ap-northeast-1\nJapan]
    EdgeNetwork --> US[US-East Edge\nUS Users]
    EdgeNetwork --> EU[Frankfurt Edge\nEU Users]

    User[Business User] -->|Cloudflare DNS: nearest PoP| SEA
    SEA -->|Static JS/CSS: Cache HIT: 365 days| User
    SEA -->|ISR HTML: Cache HIT: 60s SWR| User
    SEA -->|Cache MISS| CloudFrontInvalidate
```

### 20.5 Release Management Process

```mermaid
graph TD
    Sprint[Sprint Complete: Features in develop] --> RC[Release Candidate: release/x.y.z branch]

    RC --> StagingDeploy[Auto-deploy to Staging]
    StagingDeploy --> Tests[Parallel: Load Test + UAT + Security]

    Tests --> GoNoGo{Go / No-Go?}
    GoNoGo -->|Issues found| Fix[Fix on release branch]
    Fix --> StagingDeploy

    GoNoGo -->|Go| Approval[Sign-Off: Eng Manager + QA Lead]
    Approval --> Canary5[Canary: 5% traffic to new version]

    Canary5 --> ErrorCheck1{Error rate delta OK?}
    ErrorCheck1 -->|Issue| AutoRollback[Auto-Rollback to 0%]
    ErrorCheck1 -->|OK: 24 hours| Canary25[Canary: 25% traffic]

    Canary25 --> ErrorCheck2{Error rate delta OK?}
    ErrorCheck2 -->|Issue| AutoRollback
    ErrorCheck2 -->|OK: 24 hours| Canary100[Full Rollout: 100%]

    Canary100 --> Monitor[30-min Active Monitoring]
    Monitor -->|Clean| Merge[Merge to main + tag v1.5.0]
    Monitor -->|Incident| AutoRollback

    Merge --> Sentry[Sentry: Finalize Release]
    Merge --> Changelog[Update CHANGELOG.md]
    Merge --> Slack[Notify: Slack release announcement]
```

---

## APPENDIX A — DEPLOYMENT QUICK REFERENCE

```
CI/CD Platform:       GitHub Actions
Web Deploy:           Vercel (primary), AWS ECS (enterprise)
Mobile Deploy:        Fastlane → TestFlight + Google Play
Container Registry:   GitHub Container Registry (GHCR)
Static Asset CDN:     AWS S3 + CloudFront
DNS:                  AWS Route 53 + Cloudflare (WAF layer)
Secret Storage:       GitHub Actions Secrets + AWS Secrets Manager
Feature Flags:        OpenFeature + CloudBees SDK

Web RTO:              < 2 minutes (Vercel rollback)
Web RPO:              0 (code unchanged; configuration rollback)
Mobile RTO:           < 30 minutes (Play Store halt + restore)
Mobile RPO:           0 (previous build in TestFlight/Play Console)

Deployment Window:    02:00–04:00 UTC+7 (low-traffic window for SEA)
Deployment Frequency: Multiple times per day (feature flag-gated)
Release Cadence:      Bi-weekly production releases; hotfixes anytime
```

## APPENDIX B — BRANCH LIFECYCLE QUICK REFERENCE

```
feature/*  → develop → QA environment
release/*  → staging  → production (with approval)
hotfix/*   → staging  → production (fast-track)
main       → production (always reflects live state)
develop    → development + QA environment
```

---

*End of Frontend Deployment, CI/CD & Production Delivery Architecture*  
*Document maintained by: Principal Frontend DevOps Architect & Release Manager | Status: Approved Frontend Delivery Architecture Specification*
