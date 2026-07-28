# BACKEND SECURITY ARCHITECTURE, HARDENING & COMPLIANCE STRATEGY

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0 — Baseline Standard  
**Date:** July 13, 2026  
**Authors:** Principal Security Architect, Backend Security Engineer, OWASP Specialist, Cloud Security Engineer & Compliance Architect  
**Classification:** Enterprise Internal — Restricted (Security Sensitive)  
**Status:** 🔒 APPROVED BACKEND SECURITY ARCHITECTURE & HARDENING SPECIFICATION  

---

## SECTION 1 — SECURITY ARCHITECTURE FOUNDATION

### 1.1 Enterprise Security Model

```
ZERO TRUST SECURITY MODEL:
─────────────────────────────────────────────────────────────────────────
"Never Trust, Always Verify"

Every request — internal or external — must:
  1. Authenticate:   Prove identity (Who are you?)
  2. Authorize:      Prove permission (Are you allowed?)
  3. Validate:       Prove intent is safe (Is the request well-formed?)
  4. Audit:          Record the action (What did you do?)
  5. Monitor:        Detect anomalies (Is this normal behavior?)

No component trusts another component implicitly.
Even internal service calls require authentication.
Even database connections use least-privilege credentials.
─────────────────────────────────────────────────────────────────────────

Security Model Layers:

IDENTITY LAYER:
  → Who is making the request?
  → Verify JWT signature, check token revocation, validate tenant claim
  → Multi-factor authentication for privileged operations

ACCESS CONTROL LAYER:
  → What is this identity allowed to do?
  → RBAC: Role-Based Access Control at module level
  → Permission guards at route level
  → Resource ownership check at data level

DATA PROTECTION LAYER:
  → What data can this identity access?
  → Row-Level Security (PostgreSQL RLS) — database-enforced tenant isolation
  → Field-level encryption for PII and sensitive fields
  → Data masking in logs and responses

MONITORING LAYER:
  → What is happening in the system?
  → Security event log for every sensitive action
  → Real-time anomaly detection
  → Alert on suspicious patterns

RESPONSE LAYER:
  → How do we react to detected threats?
  → Automated blocking (rate limiting, IP ban)
  → Incident response procedure
  → Forensic audit trail
```

### 1.2 Enterprise Security Principles

| Principle | Definition | Implementation |
| :--- | :--- | :--- |
| **Zero Trust** | No implicit trust — every request verified | JWT validation + RLS on every query |
| **Least Privilege** | Only the minimum access needed | DB users with table-level GRANT; RBAC role scopes |
| **Defense in Depth** | Multiple overlapping security layers | WAF + API Gateway + Guards + RLS + Encryption |
| **Secure by Default** | Secure configuration is the out-of-the-box default | All endpoints require auth unless `@Public()` |
| **Fail Secure** | On error, deny access (not grant) | Authorization Guard throws 403; never defaults to allow |
| **Separation of Concerns** | Security controls isolated from business logic | Guards, interceptors, and middleware handle security |
| **Complete Mediation** | Every access to every resource is checked | No direct DB access bypassing authorization layer |
| **Auditability** | Every security-relevant action is logged | SecurityAuditService writes to immutable audit log |
| **Economy of Mechanism** | Simpler systems have fewer vulnerabilities | Standard NestJS guards; avoid custom crypto |
| **Open Design** | Security does not depend on obscurity | Standard algorithms (bcrypt, AES-256, RS256) |

---

## SECTION 2 — DEFENSE IN DEPTH ARCHITECTURE

### 2.1 Security Layer Architecture

```mermaid
graph TD
    Internet[Internet Traffic] --> WAF[Layer 1: WAF\nCloudflare WAF\nDDoS protection, bot filtering, IP reputation]
    WAF --> LB[Layer 2: Load Balancer\nSSL/TLS termination, cert pinning\nHTTPS only — HTTP redirected]
    LB --> APIGateway[Layer 3: API Gateway Kong\nRate limiting, auth pre-check\nRequest logging, CORS enforcement]
    APIGateway --> NestJS2[Layer 4: NestJS Application\nJWT guard, RBAC guard, permission guard\nRequest validation DTOs, CSRF, security headers]
    NestJS2 --> AppLogic[Layer 5: Application Logic\nBusiness rule validation\nData sanitization, output encoding]
    AppLogic --> Redis2[Layer 6: Cache Layer\nTLS connections, Redis AUTH\nACL-restricted access]
    AppLogic --> PrismaORM[Layer 7: Database ORM Layer\nParameterized queries only\nPrisma prevents raw SQL injection]
    PrismaORM --> PostgreSQL2[Layer 8: PostgreSQL\nRLS policies, least-privilege users\nConnection TLS, audit logging, WAL encryption]

    subgraph CrossCutting [Cross-Cutting Security Controls]
        AuditLog[Security Audit Log\nEvery sensitive action]
        SIEM[SIEM: Aggregated threat detection]
        Monitoring[Prometheus + Grafana\nSecurity dashboards]
        Alerts[PagerDuty + Slack\nReal-time incident alerts]
    end

    NestJS2 --> AuditLog --> SIEM --> Monitoring --> Alerts
    PostgreSQL2 --> AuditLog
```

### 2.2 Security Control Responsibility Matrix

| Layer | Component | Controls Applied | Failure Mode |
| :--- | :--- | :--- | :--- |
| **Network** | Cloudflare WAF | DDoS, bot detection, IP reputation, geo-block | Deny traffic, 403 |
| **Transport** | Load Balancer (TLS) | TLS 1.3 only, HSTS, cert pinning | Connection refused |
| **Gateway** | Kong API Gateway | Rate limiting, API key check, request logging | 429/401 |
| **Application** | NestJS Guards | JWT validation, RBAC, permission, tenant | 401/403 |
| **Input** | DTO + class-validator | Schema validation, type coercion, XSS sanitization | 400 |
| **Business** | Domain Services | Business rule validation, ownership check | 422/403 |
| **Cache** | Redis ACL + TLS | Least-privilege access, encrypted channel | Reject connection |
| **Database** | PostgreSQL RLS | Tenant row isolation, column privileges | Query returns no rows |
| **Storage** | S3 Bucket Policy | Signed URLs only, no public access | 403 from S3 |

---

## SECTION 3 — OWASP TOP 10 PROTECTION

### 3.1 A01 — Broken Access Control

```typescript
// ─── Every route is protected by default ───────────────────────────────────
// NestJS global guard configuration (main.ts):
app.useGlobalGuards(
  app.get(JwtAuthGuard),           // Must be authenticated
  app.get(TenantGuard),            // Must have valid tenantId matching request
  app.get(PermissionGuard),        // Must have required permission code
);

// Public routes must be explicitly whitelisted:
@Controller('auth')
export class AuthController {
  @Post('login')
  @Public()   // ← Explicit opt-out of auth
  async login(@Body() dto: LoginDto) { ... }
}

// Resource ownership check (not just role — must own the resource):
@Get(':id')
@RequirePermission('orders.read')
async getOrder(@Param('id') id: string, @CurrentUser() user: RequestUser) {
  const order = await this.orderService.findById(id, user.tenantId);

  // Ownership check: user can only see orders from their tenant
  if (order.tenantId !== user.tenantId) {
    throw new ForbiddenException('Access denied: resource not in your tenant');
  }

  // Branch-level check: cashier can only see their branch orders
  if (user.role === 'CASHIER' && order.branchId !== user.branchId) {
    throw new ForbiddenException('Access denied: order not in your branch');
  }

  return order;
}
```

### 3.2 A02 — Cryptographic Failures

```typescript
// PASSWORD HASHING: bcrypt with cost factor 12 (approx 300ms per hash)
async hashPassword(plaintext: string): Promise<string> {
  const BCRYPT_ROUNDS = 12;  // Never < 10; Never use MD5, SHA1, SHA256 for passwords
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

// TOKEN GENERATION: cryptographically secure random
const refreshToken = crypto.randomBytes(48).toString('hex');  // 384-bit entropy
const otpCode = crypto.randomInt(100000, 999999).toString();  // Uniform distribution

// SENSITIVE FIELD ENCRYPTION: AES-256-GCM (authenticated encryption)
async encryptField(plaintext: string): Promise<string> {
  const key = Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, 'hex');  // 32 bytes from Secrets Manager
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store: iv + authTag + ciphertext (all needed for decryption)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

// What is NEVER done:
//   × bcrypt.hash(password, 1)       — too fast, brute-forceable
//   × crypto.createHash('md5')       — not a KDF
//   × Math.random()                  — not cryptographically secure
//   × AES-256-ECB                    — no IV, pattern-preserving
//   × Storing passwords in plaintext — immediate disqualification
```

### 3.3 A03 — Injection

```typescript
// SQL INJECTION: Prisma ORM uses parameterized queries by default
// ALL Prisma operations use prepared statements internally
const user = await prisma.user.findUnique({
  where: { email: userInput },  // ← Parameterized; SQL injection impossible
});

// When raw SQL is absolutely necessary: always use Prisma tagged template
const rows = await prisma.$queryRaw`
  SELECT id, name FROM products
  WHERE tenant_id = ${tenantId}::uuid    -- ← ${} = parameterized binding
    AND category = ${categoryInput}
`;

// What is NEVER done:
//   ✗ prisma.$queryRawUnsafe(`SELECT * WHERE name = '${userInput}'`)
//   ✗ String interpolation in any query

// NOSQL INJECTION (Redis): use typed commands, never eval with user input
await redis.get(`user:${userId}`);  // ← Key is built from validated UUID, not raw input

// COMMAND INJECTION: never pass user input to system commands
//   ✗ exec(`convert ${fileName}`)        — OS command injection
//   ✓ Use libraries (sharp, pdfkit)       — never shell exec with user data
```

### 3.4 A04 — Insecure Design

```typescript
// RATE LIMITING on all sensitive operations (by design, not afterthought)
@Post('login')
@Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
async login(@Body() dto: LoginDto, @Ip() ip: string) { ... }

// BUSINESS LOGIC VALIDATION at domain layer (not just input layer)
// Example: Prevent order manipulation by re-validating price server-side
async completeOrder(orderId: string, tenantId: string): Promise<Order> {
  const order = await this.orderRepo.findById(orderId, tenantId);

  // Re-calculate server-side — never trust client-submitted prices
  const serverPrice = await this.pricingService.calculate(order.items, tenantId);
  if (Math.abs(order.totalAmount - serverPrice.total) > 0.01) {
    throw new DomainException('PRICE_MISMATCH', 'Order total does not match server calculation');
  }
}
```

### 3.5 A05 — Security Misconfiguration

```typescript
// SECURITY HEADERS: applied globally via Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", 'data:', 'https://cdn.yourdomain.com'],
      connectSrc:     ["'self'", 'https://api.yourdomain.com'],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts:              { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff:           true,
  xssFilter:         true,
  referrerPolicy:    { policy: 'strict-origin-when-cross-origin' },
  frameguard:        { action: 'deny' },
  hidePoweredBy:     true,  // Remove X-Powered-By: Express
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));

// CORS: strict allowlist, not wildcard
app.enableCors({
  origin: ['https://app.yourdomain.com', 'https://admin.yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-CSRF-Token'],
});

// ERROR RESPONSES: never expose stack traces in production
app.useGlobalFilters(new GlobalExceptionFilter());
// GlobalExceptionFilter returns: { statusCode, message, requestId }
// Never: { stack, query, internalError, dbError }
```

### 3.6 A06 — Vulnerable and Outdated Components

```
Dependency Security Strategy:
  → npm audit run in every CI pipeline (blocks merge if HIGH/CRITICAL found)
  → Snyk integration: continuous monitoring of production dependencies
  → Dependabot: automated PRs for dependency version updates
  → Monthly dependency review meeting
  → Docker base images: use distroless or Alpine; updated monthly
  → Node.js LTS version: updated within 30 days of security patch release
  → Automated SBOM (Software Bill of Materials) generated per release
```

### 3.7 A07 — Identification and Authentication Failures

```typescript
// See Section 5 (Authentication Security) for full implementation.
// Summary of controls:
//  1. bcrypt(12) password hashing
//  2. Account lockout after 5 failed attempts (15-minute lockout)
//  3. OTP required for admin and financial operations
//  4. Secure token rotation: refresh tokens single-use
//  5. JWT RS256 (asymmetric): private key for signing, public key for verification
//  6. Refresh token stored as bcrypt hash; plain token sent once, never stored
//  7. Access tokens: 15-minute TTL; memory-only on client
//  8. Session JTI revocation list in Redis for immediate logout
```

### 3.8 A09 — Security Logging and Monitoring Failures

```
Security Logging Controls (see Section 12 for full implementation):
  → Every authentication event: login, logout, failure, MFA
  → Every authorization failure: permission denied, tenant mismatch
  → Every sensitive data access: PII fields, financial records
  → Every admin action: user creation, role change, config change
  → Every security config change: permission grant, policy update
  → Immutable audit log: append-only, signed with HMAC
  → Log aggregation: centralized SIEM (Elasticsearch + Kibana)
  → Real-time alerting: > 10 failed logins/minute → PagerDuty
```

### 3.9 A10 — Server-Side Request Forgery (SSRF)

```typescript
// SSRF PREVENTION: validate and allowlist any URL that the backend fetches
@Injectable()
export class SsrfGuardService {
  private readonly ALLOWED_DOMAINS = [
    'api.stripe.com',
    'api.sendgrid.com',
    'api.twilio.com',
    's3.amazonaws.com',
  ];

  validate(url: string): void {
    const parsed = new URL(url);  // Throws on malformed URLs

    // Block private/internal IPs
    const hostname = parsed.hostname;
    if (this.isPrivateIP(hostname)) {
      throw new ForbiddenException(`SSRF protection: Internal IP access blocked: ${hostname}`);
    }

    // Block non-allowlisted domains
    const isAllowed = this.ALLOWED_DOMAINS.some(d => hostname.endsWith(d));
    if (!isAllowed) {
      throw new ForbiddenException(`SSRF protection: Domain not allowlisted: ${hostname}`);
    }
  }

  private isPrivateIP(hostname: string): boolean {
    return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1|localhost|0\.0\.0\.0)/.test(hostname);
  }
}
```

---

## SECTION 4 — API SECURITY ARCHITECTURE

### 4.1 API Security Pipeline

```mermaid
graph TD
    Request2[Incoming API Request] --> TLS2[TLS 1.3 Termination\nLB enforces HTTPS only]
    TLS2 --> RateLimit2[Kong Rate Limiting\n300 req/min authenticated\n30 req/min unauthenticated]
    RateLimit2 --> CORS2[CORS Validation\nOrigin allowlist check\nCredentials: true]
    CORS2 --> SecurityHeaders[Security Headers Middleware\nHelmet.js: CSP, HSTS, X-Frame]
    SecurityHeaders --> JWTGuard[JwtAuthGuard\nVerify RS256 signature\nCheck expiry + revocation]
    JWTGuard --> TenantGuard[TenantGuard\nValidate X-Tenant-ID header\nvs JWT tenantId claim]
    TenantGuard --> PermissionGuard[PermissionGuard\nCheck required permission code\nvs user permission set in cache]
    PermissionGuard --> DTOValidation[DTO Validation\nclass-validator: type, length, format\nclass-sanitizer: strip HTML]
    DTOValidation --> Controller3[Controller\nRequest dispatched to handler]
    Controller3 --> Interceptor[Response Interceptor\nRemove internal fields\nMask sensitive data]
    Interceptor --> Response3[JSON Response\nNo stack traces\nStandardized envelope]
```

### 4.2 Security Headers Implementation

| Header | Value | Purpose |
| :--- | :--- | :--- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS for 1 year including subdomains |
| `Content-Security-Policy` | `default-src 'self'; frame-ancestors 'none'` | Prevent XSS and clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Enable legacy browser XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer information leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restrict browser feature access |
| `Cache-Control` | `no-store` (for auth responses) | Prevent auth data in browser cache |
| `X-Request-ID` | `{uuid}` | Request tracing; included in error logs |

### 4.3 Input Validation Architecture

```typescript
// common/decorators/sanitize.decorator.ts — Global input sanitization
@Injectable()
export class RequestSanitizationInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = ctx.switchToHttp().getRequest();
    request.body   = this.sanitize(request.body);
    request.params = this.sanitize(request.params);
    request.query  = this.sanitize(request.query);
    return next.handle();
  }

  private sanitize(obj: unknown): unknown {
    if (typeof obj === 'string') return sanitizeHtml(obj, { allowedTags: [], allowedAttributes: {} });
    if (Array.isArray(obj)) return obj.map(item => this.sanitize(item));
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, this.sanitize(v)])
      );
    }
    return obj;
  }
}

// Example DTO with comprehensive validation:
export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(String(value), { allowedTags: [] }))
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => value ? sanitizeHtml(String(value), { allowedTags: [] }) : undefined)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9_999_999.99)
  price: number;

  @IsUUID()
  categoryId: string;   // UUID format enforced — prevents injection via ID field

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })  // Each element must be a valid UUID
  tags?: string[];
}
```

---

## SECTION 5 — AUTHENTICATION SECURITY

### 5.1 Password Security

```typescript
// auth/security/password.service.ts
@Injectable()
export class PasswordService {
  private static readonly BCRYPT_ROUNDS = 12;
  private static readonly MIN_LENGTH = 8;
  private static readonly COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
  private static readonly BREACHED_LIST_CHECK = true;  // HaveIBeenPwned API check

  async validateComplexity(password: string): Promise<void> {
    if (password.length < this.MIN_LENGTH) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    if (!this.COMPLEXITY_REGEX.test(password)) {
      throw new BadRequestException(
        'Password must contain: uppercase, lowercase, number, and special character'
      );
    }
    if (this.BREACHED_LIST_CHECK && await this.isBreached(password)) {
      throw new BadRequestException(
        'Password has appeared in a data breach. Please choose a different password.'
      );
    }
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, PasswordService.BCRYPT_ROUNDS);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);  // Timing-safe comparison built into bcrypt
  }

  private async isBreached(password: string): Promise<boolean> {
    // k-anonymity: send only first 5 chars of SHA1 hash — password never sent
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const hashes = await response.text();
    return hashes.includes(sha1.slice(5));
  }
}
```

### 5.2 Account Lockout Protection

```typescript
// auth/security/account-protection.service.ts
@Injectable()
export class AccountProtectionService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_SECONDS = 15 * 60;  // 15 minutes
  private static readonly PROGRESSIVE_DELAY_SECONDS = [0, 1, 2, 4, 8, 16];

  constructor(private readonly redis: RedisService) {}

  async recordFailedAttempt(email: string): Promise<void> {
    const key = `login:attempts:${email}`;
    const attempts = await this.redis.incr(key);
    if (attempts === 1) {
      await this.redis.expire(key, this.LOCKOUT_DURATION_SECONDS);
    }

    if (attempts >= AccountProtectionService.MAX_ATTEMPTS) {
      // Lock account
      await this.redis.setex(`login:locked:${email}`, this.LOCKOUT_DURATION_SECONDS, '1');
      await this.securityAuditService.log({
        event: 'ACCOUNT_LOCKED',
        email,
        reason: `${attempts} consecutive failed login attempts`,
        severity: 'HIGH',
      });
    }
  }

  async checkLocked(email: string): Promise<void> {
    const locked = await this.redis.exists(`login:locked:${email}`);
    if (locked) {
      const ttl = await this.redis.ttl(`login:locked:${email}`);
      throw new TooManyRequestsException(
        `Account temporarily locked. Try again in ${Math.ceil(ttl / 60)} minutes.`
      );
    }
  }

  async clearFailedAttempts(email: string): Promise<void> {
    await this.redis.del(`login:attempts:${email}`, `login:locked:${email}`);
  }
}
```

### 5.3 JWT Security Configuration

```typescript
// JWT: RS256 (asymmetric) — private key signs, public key verifies
// If signing key leaks → rotate private key; all verification keys public anyway

const JWT_CONFIG = {
  algorithm:  'RS256',                          // Asymmetric — not HS256 (shared secret)
  accessToken: {
    ttl:      '15m',                             // Short-lived — minimize exposure window
    audience: 'saas-platform-api',
    issuer:   'saas-platform-auth',
  },
  refreshToken: {
    ttl:      '7d',                              // Stored hashed in Redis
    rotation: true,                              // Single-use: rotation on every use
  },
};

// Claims validation on every request:
async validateToken(token: string): Promise<JwtPayload> {
  const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
    algorithms: ['RS256'],
    audience:   'saas-platform-api',
    issuer:     'saas-platform-auth',
  });

  // Check JTI revocation (for logged-out tokens still within TTL)
  const revoked = await this.redis.exists(`session:revoked:${payload.jti}`);
  if (revoked) throw new UnauthorizedException('Token has been revoked');

  // Validate tenant claim consistency
  if (!payload.tenantId || !payload.userId || !payload.role) {
    throw new UnauthorizedException('Invalid token claims');
  }

  return payload;
}
```

---

## SECTION 6 — AUTHORIZATION SECURITY

### 6.1 RBAC + Permission Guard System

```typescript
// common/guards/permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY, [context.getHandler(), context.getClass()]
    );

    // No @RequirePermission() → use @Roles() only → skip permission check
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    // Load permissions from cache (populated on login or lazy-loaded on miss)
    const permissions = await this.cacheService.getOrSet(
      CacheKeys.userPermissions(user.tenantId, user.userId),
      () => this.permissionRepo.findByUserId(user.userId, user.tenantId),
      CacheTTL.USER_PERMISSIONS,
    );

    const hasPermission = permissions.includes(requiredPermission);

    if (!hasPermission) {
      await this.securityAuditService.log({
        event:      'PERMISSION_DENIED',
        userId:     user.userId,
        tenantId:   user.tenantId,
        permission: requiredPermission,
        route:      request.url,
        method:     request.method,
        severity:   'MEDIUM',
      });
    }

    return hasPermission;
  }
}

// Usage:
@Get('reports/financial')
@RequirePermission('reports.financial.read')
async getFinancialReport(@TenantId() tenantId: string) { ... }

@Post('users/:id/role')
@RequirePermission('users.role.update')
async changeUserRole(@Param('id') userId: string) { ... }
```

### 6.2 Permission Hierarchy

```
SUPER_ADMIN:   All permissions (platform administration only — no tenant data)
TENANT_OWNER:  All permissions within their tenant
MANAGER:       Read + write most modules; cannot manage users, change security settings
CASHIER:       POS operations only: create/complete orders, process payments
INVENTORY_STAFF: Inventory read/write; no access to finance, HR
HR_STAFF:      HR module only: employees, attendance, payroll
FINANCE_STAFF: Finance module only: invoices, expenses, reports
VIEWER:        Read-only across assigned modules
CUSTOM:        Admin-defined combination of specific permissions
```

---

## SECTION 7 — MULTI-TENANT SECURITY

### 7.1 Tenant Isolation Architecture

```mermaid
graph TD
    Request3[Incoming Request] --> TenantHeader[Extract X-Tenant-ID header]
    TenantHeader --> JWTClaim[Extract tenantId from JWT payload]
    JWTClaim --> ConsistencyCheck{Header == JWT claim?}
    ConsistencyCheck -->|No match| Reject2[401: Tenant context mismatch]
    ConsistencyCheck -->|Match| TenantGuard2[TenantGuard: Validate tenant exists + active]
    TenantGuard2 --> TenantStatus{Tenant status?}
    TenantStatus -->|Suspended| Block[402: Tenant account suspended]
    TenantStatus -->|Trial expired| Block2[402: Trial period expired]
    TenantStatus -->|Active| InjectContext[Inject TenantContext into request\nAll downstream services use this context]
    InjectContext --> DBQuery[All DB queries include:\nWHERE tenant_id = :tenantId\n+ PostgreSQL RLS auto-filters]
    DBQuery --> CacheKeys2[All cache keys include:\ntenant:{tenantId}:...]
    CacheKeys2 --> Response4[Response: only tenant's data]
```

### 7.2 Row-Level Security (RLS) — Database-Enforced Isolation

```sql
-- PostgreSQL Row-Level Security: tenant isolation enforced AT DATABASE LEVEL
-- Even if application code has a bug and omits tenant_id filter, RLS catches it

-- Enable RLS on all tenant-scoped tables
ALTER TABLE pos.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.invoices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.employees      ENABLE ROW LEVEL SECURITY;

-- Policy: application user can only see rows matching their session's tenant_id
CREATE POLICY tenant_isolation ON pos.orders
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON inventory.products
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Set tenant context on every connection before query execution
-- (Prisma middleware injects this before every operation)
SET LOCAL app.tenant_id = '${tenantId}';
```

```typescript
// prisma/middleware/tenant-rls.middleware.ts
export function tenantRlsMiddleware(tenantId: string): Prisma.Middleware {
  return async (params: Prisma.MiddlewareParams, next) => {
    // Set tenant context before any Prisma query
    // This is picked up by RLS policies in PostgreSQL
    await prisma.$executeRaw`SET LOCAL app.tenant_id = ${tenantId}::uuid`;
    return next(params);
  };
}
```

### 7.3 Tenant Security Controls

| Control | Layer | Description |
| :--- | :--- | :--- |
| **JWT tenant claim** | Application | `tenantId` embedded in JWT; validated on every request |
| **X-Tenant-ID header** | Application | Must match JWT claim; prevents cross-tenant requests |
| **TenantGuard** | Application | Validates tenant exists and is active on every request |
| **Service-layer filter** | Application | All service methods receive and filter by `tenantId` |
| **Prisma middleware** | ORM | Injects `SET LOCAL app.tenant_id` before every query |
| **PostgreSQL RLS** | Database | `USING (tenant_id = current_setting('app.tenant_id'))` |
| **Cache key namespace** | Cache | All keys prefixed with `tenant:{tenantId}:` |
| **S3 path isolation** | Storage | Files stored at `/{tenantId}/{...}`; presigned URLs scoped |
| **WebSocket rooms** | Real-time | Socket.IO rooms namespaced: `tenant:{tenantId}:branch:{id}` |

---

## SECTION 8 — DATA SECURITY ARCHITECTURE

### 8.1 Data Classification

| Classification | Examples | Protection Required |
| :--- | :--- | :--- |
| **Public** | Product names, pricing, business hours | No encryption; may be indexed |
| **Internal** | Order totals, stock levels, reports | Role-based access; tenant RLS |
| **Confidential** | Customer names, contact info, employee data | Field encryption at application layer |
| **Restricted** | Passwords, OTP secrets, payment keys, API tokens | bcrypt/AES-256; never logged; never cached plain |
| **Compliance-scoped** | Payment card fragments, national IDs, bank accounts | Tokenize or mask; PCI DSS scope minimization |

### 8.2 Field-Level Encryption

```typescript
// common/security/field-encryption.service.ts
@Injectable()
export class FieldEncryptionService {
  private readonly key: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly secretsManager: SecretsManagerService) {
    const rawKey = secretsManager.getSync('field-encryption-key');
    this.key = Buffer.from(rawKey, 'hex');  // 32 bytes = 256 bits
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();  // Authentication tag prevents tampering
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);  // Verifies integrity — throws if tampered
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  // One-way deterministic hash for searchable encrypted fields
  searchableHash(value: string): string {
    const hmacKey = crypto.scryptSync(this.key, 'searchable-salt', 32);
    return crypto.createHmac('sha256', hmacKey).update(value.toLowerCase()).digest('hex');
  }
}

// Encrypted Prisma model fields:
model Customer {
  id              String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId        String  @db.Uuid
  nameEncrypted   String  @db.Text    // AES-256-GCM encrypted
  emailEncrypted  String  @db.Text    // AES-256-GCM encrypted
  emailHash       String  @db.Char(64) // HMAC-SHA256 for lookup by email
  phone           String? @db.Text    // Encrypted
  @@unique([tenantId, emailHash])     // Unique constraint on hash (enables search)
}
```

### 8.3 Data Masking in API Responses

```typescript
// common/interceptors/data-masking.interceptor.ts
@Injectable()
export class DataMaskingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map(response => this.maskSensitiveFields(response))
    );
  }

  private maskSensitiveFields(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(item => this.maskSensitiveFields(item));
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
          if (key === 'password' || key === 'passwordHash') return [key, undefined];
          if (key === 'cardNumber') return [key, `****${String(value).slice(-4)}`];
          if (key === 'bankAccount') return [key, `****${String(value).slice(-4)}`];
          if (key === 'otp') return [key, undefined];
          if (key === 'secret' || key === 'privateKey') return [key, undefined];
          return [key, this.maskSensitiveFields(value)];
        })
      );
    }
    return obj;
  }
}
```

---

## SECTION 9 — DATABASE SECURITY

### 9.1 Database User Privilege Model

```sql
-- PRINCIPLE OF LEAST PRIVILEGE: dedicated DB users per role

-- 1. Application user: DML only (no DDL, no TRUNCATE, no DROP)
CREATE USER saas_app_user WITH PASSWORD '...';
GRANT CONNECT ON DATABASE saas_platform TO saas_app_user;
GRANT USAGE ON SCHEMA pos, inventory, finance, hr, crm TO saas_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pos TO saas_app_user;
-- Note: No GRANT DROP, TRUNCATE, ALTER, CREATE to app user

-- 2. Migration user: DDL for schema migrations (Prisma migrate)
CREATE USER saas_migrate_user WITH PASSWORD '...';
GRANT ALL PRIVILEGES ON DATABASE saas_platform TO saas_migrate_user;
-- Used only during deployment pipeline; credential not in app runtime

-- 3. Read replica user: SELECT only for analytics + reports
CREATE USER saas_readonly_user WITH PASSWORD '...';
GRANT CONNECT ON DATABASE saas_platform TO saas_readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA pos, analytics TO saas_readonly_user;

-- 4. Audit user: only write to audit tables (no read of business data)
CREATE USER saas_audit_user WITH PASSWORD '...';
GRANT INSERT ON TABLE audit.security_events TO saas_audit_user;
GRANT INSERT ON TABLE audit.event_log TO saas_audit_user;
```

### 9.2 Database Connection Security

```typescript
// Prisma connection string: TLS + SSL certificate verification
DATABASE_URL = "postgresql://saas_app_user:${SECRET}@db.internal:5432/saas_platform?sslmode=require&sslcert=...&sslkey=...&sslrootcert=..."

// Connection pool configuration:
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
  log: [
    { level: 'query',  emit: 'event' },   // Log queries to audit logger (not stdout in prod)
    { level: 'error',  emit: 'event' },
    { level: 'warn',   emit: 'event' },
  ],
});

// Prevent slow query attacks — kill queries exceeding timeout
prisma.$executeRaw`SET statement_timeout = '30000'`;  // 30 second max per query
prisma.$executeRaw`SET lock_timeout = '5000'`;         // 5 second max lock wait
```

### 9.3 PostgreSQL Security Hardening

```
Configuration (postgresql.conf):
  ssl                      = on
  ssl_cert_file            = 'server.crt'
  ssl_key_file             = 'server.key'
  ssl_ca_file              = 'ca.crt'
  ssl_min_protocol_version = 'TLSv1.2'
  password_encryption      = scram-sha-256
  log_connections          = on
  log_disconnections       = on
  log_duration             = on
  log_min_duration_statement = 1000  -- Log queries > 1 second
  log_statement            = 'ddl'   -- Log all DDL (DROP, ALTER, CREATE)

pg_hba.conf (host-based authentication):
  TYPE  DATABASE        USER           ADDRESS       METHOD
  local all             postgres       127.0.0.1/32  reject   -- No local superuser access
  host  saas_platform   saas_app_user  10.0.0.0/8    scram-sha-256
  host  all             all            0.0.0.0/0     reject   -- Reject all else
```

---

## SECTION 10 — SECRET MANAGEMENT

### 10.1 Secret Classification and Storage

| Secret Type | Storage | Rotation | Access |
| :--- | :--- | :--- | :--- |
| **Database passwords** | AWS Secrets Manager | Automated every 90 days | API pods via IAM role |
| **JWT signing key (RS256)** | AWS Secrets Manager | Manual (breaking change) | Auth service only |
| **Redis password** | AWS Secrets Manager | Automated every 90 days | API pods via IAM role |
| **Stripe API keys** | AWS Secrets Manager | Manual on compromise | Payment service only |
| **Email service API key** | AWS Secrets Manager | Manual | Notification service only |
| **S3 bucket credentials** | IAM Role (no long-term key) | Automatic (STS) | Storage service |
| **OTP TOTP seed** | Encrypted in PostgreSQL | Never (TOTP nature) | Auth service only |
| **Field encryption key** | AWS KMS + Secrets Manager | Annual or on compromise | Crypto service only |

### 10.2 Secrets Manager Integration

```typescript
// common/secrets/secrets-manager.service.ts
@Injectable()
export class SecretsManagerService implements OnModuleInit {
  private readonly client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  private cache = new Map<string, { value: string; expiresAt: number }>();

  async getSecret(secretName: string): Promise<string> {
    const cached = this.cache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const response = await this.client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    const value = response.SecretString ?? '';
    // Cache for 5 minutes — balance between freshness and API calls
    this.cache.set(secretName, { value, expiresAt: Date.now() + 5 * 60 * 1000 });
    return value;
  }
}

// Environment variable security rules:
//   ✅ DATABASE_URL loaded from Secrets Manager at startup
//   ✅ JWT_PRIVATE_KEY loaded from Secrets Manager at startup
//   ❌ No secrets in .env files committed to Git
//   ❌ No secrets in Docker images or Kubernetes manifests plaintext
//   ✅ Kubernetes Secrets encrypted at rest with KMS
//   ✅ RBAC: only authorized service accounts can read Kubernetes Secrets
```

---

## SECTION 11 — FILE SECURITY

### 11.1 File Upload Security Pipeline

```typescript
// common/file/file-security.service.ts
@Injectable()
export class FileSecurityService {
  private readonly ALLOWED_MIME_TYPES = {
    images:    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    exports:   ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  };

  private readonly MAX_FILE_SIZES = {
    images:    5 * 1024 * 1024,    // 5 MB
    documents: 20 * 1024 * 1024,   // 20 MB
    exports:   50 * 1024 * 1024,   // 50 MB
  };

  async validateFile(
    file: Express.Multer.File,
    allowedCategory: keyof typeof this.ALLOWED_MIME_TYPES,
  ): Promise<void> {
    // 1. Validate file size
    const maxSize = this.MAX_FILE_SIZES[allowedCategory];
    if (file.size > maxSize) {
      throw new BadRequestException(`File exceeds maximum size of ${maxSize / 1024 / 1024}MB`);
    }

    // 2. Validate MIME type from magic bytes (not file extension — spoofable)
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !this.ALLOWED_MIME_TYPES[allowedCategory].includes(detected.mime)) {
      throw new BadRequestException(`File type '${detected?.mime ?? 'unknown'}' not allowed for ${allowedCategory}`);
    }

    // 3. Virus scan via ClamAV (async scan, reject if infected)
    await this.scanForViruses(file.buffer);

    // 4. Strip metadata from images (EXIF can contain GPS, device info)
    if (allowedCategory === 'images') {
      file.buffer = await this.stripImageMetadata(file.buffer);
    }
  }

  private async scanForViruses(buffer: Buffer): Promise<void> {
    const clamscan = new NodeClam().init({ scanLog: '/var/log/clamscan.log' });
    const { isInfected, viruses } = await clamscan.scanBuffer(buffer);
    if (isInfected) {
      throw new BadRequestException(`Infected file detected: ${viruses.join(', ')}`);
    }
  }

  // Generate isolated S3 key — tenant-scoped path, random filename (no user input)
  generateS3Key(tenantId: string, category: string, originalExtension: string): string {
    const safeExt = ['jpg', 'png', 'webp', 'pdf', 'xlsx', 'csv'].includes(originalExtension)
      ? originalExtension : 'bin';
    return `${tenantId}/${category}/${generateId()}.${safeExt}`;  // UUID filename
  }

  // Generate time-limited presigned URL (not public S3 URL)
  async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }
}
```

---

## SECTION 12 — LOGGING & AUDIT SECURITY

### 12.1 Security Event Classification

| Severity | Events | Retention | Alert |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Payment fraud attempt, mass data export, config tampering | 7 years | Immediate PagerDuty |
| **HIGH** | Account lockout, privilege escalation attempt, tenant bypass attempt | 3 years | 5-min Slack + PagerDuty |
| **MEDIUM** | Permission denied, invalid token, suspicious request pattern | 1 year | 15-min Slack aggregated |
| **LOW** | Successful login, logout, routine permission use | 90 days | Dashboard only |
| **INFO** | API request, data access, routine business operations | 30 days | Dashboard only |

### 12.2 Security Audit Service

```typescript
// common/security/security-audit.service.ts
@Injectable()
export class SecurityAuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) {}

  async log(event: SecurityAuditEvent): Promise<void> {
    // Append-only — no UPDATE or DELETE permission for this table
    await this.prisma.securityEvent.create({
      data: {
        eventType:   event.event,
        userId:      event.userId,
        tenantId:    event.tenantId,
        ipAddress:   event.ip,
        userAgent:   event.userAgent,
        resource:    event.resource,
        resourceId:  event.resourceId,
        action:      event.action,
        outcome:     event.outcome ?? 'SUCCESS',
        reason:      event.reason,
        metadata:    event.metadata ? JSON.stringify(event.metadata) : null,
        severity:    event.severity ?? 'INFO',
        occurredAt:  new Date(),
        // Integrity hash: prevents log tampering
        integrityHash: this.computeIntegrityHash(event),
      },
    });

    // Real-time alerting for high-severity events
    if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
      await this.alertService.sendSecurityAlert(event);
    }
  }

  private computeIntegrityHash(event: SecurityAuditEvent): string {
    const content = JSON.stringify(event) + process.env.AUDIT_HMAC_KEY;
    return crypto.createHmac('sha256', process.env.AUDIT_HMAC_KEY!).update(content).digest('hex');
  }
}

// Security events logged throughout the platform:
const SECURITY_EVENTS = {
  AUTH_LOGIN_SUCCESS:        { severity: 'LOW',      log: true },
  AUTH_LOGIN_FAILED:         { severity: 'MEDIUM',   log: true, alert: 'threshold' },
  AUTH_ACCOUNT_LOCKED:       { severity: 'HIGH',     log: true, alert: true },
  AUTH_LOGOUT:               { severity: 'LOW',      log: true },
  AUTH_TOKEN_REVOKED:        { severity: 'MEDIUM',   log: true },
  AUTH_OTP_FAILED:           { severity: 'MEDIUM',   log: true, alert: 'threshold' },
  AUTHZ_PERMISSION_DENIED:   { severity: 'MEDIUM',   log: true },
  AUTHZ_TENANT_MISMATCH:     { severity: 'HIGH',     log: true, alert: true },
  DATA_EXPORT_BULK:          { severity: 'HIGH',     log: true, alert: true },
  DATA_PII_ACCESS:           { severity: 'MEDIUM',   log: true },
  USER_ROLE_CHANGED:         { severity: 'HIGH',     log: true, alert: true },
  PERMISSION_GRANTED:        { severity: 'HIGH',     log: true, alert: true },
  PAYMENT_REFUND:            { severity: 'HIGH',     log: true, alert: true },
  ORDER_VOID:                { severity: 'MEDIUM',   log: true },
  CONFIG_CHANGED:            { severity: 'HIGH',     log: true, alert: true },
  ADMIN_ACTION:              { severity: 'HIGH',     log: true, alert: true },
  SUSPICIOUS_PATTERN:        { severity: 'CRITICAL', log: true, alert: true },
} as const;
```

---

## SECTION 13 — SECURITY MONITORING

### 13.1 Security Monitoring Architecture

```mermaid
graph TD
    subgraph Sources [Event Sources]
        AppEvents[NestJS SecurityAuditService\nAuth, authz, data access events]
        NginxLogs[Load Balancer Logs\nHTTP access logs, TLS errors]
        PGLogs[PostgreSQL Logs\nFailed logins, DDL, slow queries]
        RedisLogs[Redis Logs\nFailed auth, command errors]
        K8sLogs[Kubernetes Events\nPod crashes, OOM, evictions]
    end

    subgraph Aggregation [Log Aggregation]
        Fluentd[Fluentd DaemonSet\nCollect all pod logs]
        Fluentd --> Elastic[Elasticsearch\nFull-text search; security event index]
        Elastic --> Kibana[Kibana\nSecurity dashboards; threat hunting]
    end

    subgraph Metrics [Metrics]
        Prometheus4[Prometheus\nSecurity counters, failed requests]
        Prometheus4 --> Grafana4[Grafana Security Dashboard\nFailed login rate, permission denied rate, DLT size]
    end

    subgraph Alerting [Alerting]
        AlertRules[Alert Rules\nThreshold-based anomaly detection]
        AlertRules --> Slack4[Slack: #security-alerts]
        AlertRules --> PagerDuty4[PagerDuty: On-Call Security]
        AlertRules --> Jira[Jira: Auto-create security ticket]
    end

    AppEvents & NginxLogs & PGLogs & RedisLogs & K8sLogs --> Fluentd
    Elastic --> AlertRules
    Prometheus4 --> AlertRules
```

### 13.2 Security Alert Thresholds

| Alert | Condition | Threshold | Response |
| :--- | :--- | :--- | :--- |
| **Brute force login** | Failed logins from same IP | > 20/min | Auto-block IP; Slack alert |
| **Account lockout spike** | Multiple accounts locked | > 5 accounts/min | High severity PagerDuty |
| **Permission denied flood** | Authz failures per user | > 50/min | Investigate; possible account compromise |
| **Tenant bypass attempt** | Tenant mismatch errors | > 3 per user session | Immediately terminate session; Critical alert |
| **Bulk data export** | Large exports | > 10,000 records/min | Require re-authentication; alert manager |
| **Admin action outside hours** | Admin action 01:00–06:00 local time | Any | Alert immediately; verify with manager |
| **New admin account** | User granted ADMIN role | Any | Immediate Slack alert + confirmation required |
| **Unusual API geography** | Login from new country | Any for high-value accounts | Email notification + optional MFA challenge |

---

## SECTION 14 — SECURITY TESTING STRATEGY

### 14.1 Security Test Pyramid

| Level | Test Type | Tool | Frequency | Blocking |
| :--- | :--- | :--- | :--- | :--- |
| **Static Analysis** | SAST (code scan) | SonarQube, ESLint security rules | Every commit | Yes (HIGH/CRITICAL) |
| **Dependency Scan** | SCA (library vulnerabilities) | Snyk, npm audit | Every PR | Yes (HIGH/CRITICAL) |
| **Secret Detection** | Hardcoded secrets | Gitleaks, Semgrep | Every commit | Yes |
| **Container Scan** | Docker image vulnerabilities | Trivy | Every build | Yes (CRITICAL) |
| **API Security** | OWASP API Top 10 | OWASP ZAP (automated) | Every staging deploy | Yes (HIGH) |
| **Authentication Test** | Auth bypass, token manipulation | Jest + custom scripts | Every PR | Yes |
| **Authorization Test** | Privilege escalation, IDOR | Jest integration tests | Every PR | Yes |
| **Penetration Test** | Full attack simulation | Burp Suite (manual) | Quarterly | No (findings tracked) |
| **Load + Security** | DDoS simulation | k6 + Gatling | Monthly | No |

### 14.2 Automated Security Tests

```typescript
// security/tests/auth-security.spec.ts
describe('Authentication Security', () => {
  describe('JWT Security', () => {
    it('rejects tokens signed with wrong algorithm (HS256 → RS256)', async () => {
      const tampered = jwt.sign({ userId: 'attacker' }, 'any-secret', { algorithm: 'HS256' });
      await request(app.getHttpServer())
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${tampered}`)
        .expect(401);
    });

    it('rejects expired tokens', async () => {
      const expired = jwt.sign({ userId: validUserId }, privateKey, {
        algorithm: 'RS256', expiresIn: '-1s'
      });
      await request(app.getHttpServer())
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
    });

    it('rejects token from different issuer', async () => {
      const wrongIssuer = jwt.sign({ userId: validUserId }, privateKey, {
        algorithm: 'RS256', issuer: 'attacker.com'
      });
      await request(app.getHttpServer())
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${wrongIssuer}`)
        .expect(401);
    });
  });

  describe('Tenant Isolation', () => {
    it('prevents accessing other tenant resources with valid token', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/orders/${otherTenantOrderId}`)
        .set('Authorization', `Bearer ${tenant1ValidToken}`)
        .set('X-Tenant-ID', tenant1Id)
        .expect(404);  // Not 200; RLS returns empty result
    });

    it('rejects mismatched X-Tenant-ID vs JWT tenantId', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${tenant1ValidToken}`)
        .set('X-Tenant-ID', tenant2Id)   // Mismatched!
        .expect(401);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('sanitizes SQL injection in query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/products?search='; DROP TABLE products; --")
        .set('Authorization', `Bearer ${validToken}`)
        .set('X-Tenant-ID', validTenantId)
        .expect(200);  // Treated as literal search string; no error; returns []
      expect(response.body.data).toEqual([]);
    });
  });
});
```

---

## SECTION 15 — PENETRATION TESTING STRATEGY

### 15.1 Penetration Testing Scope

| Phase | Activities | Tools | Duration |
| :--- | :--- | :--- | :--- |
| **Reconnaissance** | DNS enumeration, subdomain discovery, technology fingerprinting | Shodan, nmap, whatweb | 1 day |
| **Scanning** | Port scanning, service version detection, SSL analysis | nmap, SSLyze, Nikto | 1 day |
| **Vulnerability Discovery** | Automated scan for known vulnerabilities | OWASP ZAP, Burp Suite Pro | 2 days |
| **Authentication Testing** | Auth bypass, token manipulation, session fixation | Burp Suite, custom scripts | 2 days |
| **Authorization Testing** | IDOR, privilege escalation, tenant bypass, path traversal | Burp Suite, custom scripts | 2 days |
| **Business Logic Testing** | Price manipulation, workflow bypass, race conditions | Manual + scripts | 2 days |
| **API Security Testing** | OWASP API Top 10 against all endpoints | OWASP ZAP API scan | 1 day |
| **Reporting** | Findings documentation with CVSS scoring, POC, remediation | — | 2 days |

### 15.2 Penetration Test Acceptance Criteria

```
CRITICAL findings:   Must be remediated before go-live (deploy blocked)
HIGH findings:       Must be remediated within 7 days
MEDIUM findings:     Must be remediated within 30 days
LOW findings:        Tracked in backlog; remediated within 90 days
INFORMATIONAL:       Documentation improvements; no code fix required
```

---

## SECTION 16 — SECURITY COMPLIANCE

### 16.1 Compliance Control Mapping

| Control Area | OWASP Top 10 | ISO 27001 | SOC 2 | PCI DSS (Consideration) |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | A02, A07 | A.9 | CC6.1 | Req 8 |
| **Access Control** | A01 | A.9 | CC6.3 | Req 7 |
| **Encryption in transit** | A02 | A.10 | CC6.7 | Req 4 |
| **Encryption at rest** | A02 | A.10 | CC6.7 | Req 3 |
| **Audit logging** | A09 | A.12 | CC7.2 | Req 10 |
| **Vulnerability management** | A06 | A.12 | CC7.1 | Req 6 |
| **Incident response** | A09, A10 | A.16 | CC7.5 | Req 12 |
| **Secret management** | A02 | A.10 | CC6.6 | Req 3, 6 |
| **Network security** | A05 | A.13 | CC6.6 | Req 1 |
| **Security testing** | All | A.12 | CC7.1 | Req 11 |

### 16.2 GDPR Principles Implementation

| GDPR Principle | Implementation |
| :--- | :--- |
| **Lawfulness** | Explicit consent logging for data processing; purpose limitation enforced |
| **Data minimization** | Only required fields collected; periodic data purge jobs |
| **Accuracy** | User self-service profile update; data correction workflow |
| **Storage limitation** | Configurable retention policies per data type; automated purge |
| **Right to erasure** | `DELETE /api/v1/gdpr/users/{id}/erase` — anonymizes PII fields |
| **Right to portability** | `GET /api/v1/gdpr/users/{id}/export` — JSON export of all user data |
| **Data breach notification** | Incident response procedure includes 72-hour regulatory notification |
| **Privacy by design** | RLS, field encryption, data masking applied by default |

---

## SECTION 17 — INCIDENT RESPONSE

### 17.1 Incident Response Procedure

```mermaid
graph TD
    Detection[Detection\nSIEM alert, user report, automated trigger] --> Classify{Classify Severity}

    Classify -->|CRITICAL: Active breach, data exposure| P1[P1: Immediate Response\nNotify CISO + On-Call in < 15 min]
    Classify -->|HIGH: Attempted breach, anomaly| P2[P2: Urgent Response\nNotify On-Call in < 1 hour]
    Classify -->|MEDIUM: Suspicious activity| P3[P3: Investigate\nReview within 4 hours]

    P1 --> Contain[Containment Actions\n1. Isolate affected tenant or user\n2. Revoke all sessions for compromised accounts\n3. Block IPs or block API key\n4. Snapshot affected DB state for forensics]

    Contain --> Investigate[Investigation\n1. Review security audit log\n2. Analyze Kafka event log for timeline\n3. Check Redis session records\n4. Correlate with SIEM events]

    Investigate --> Assess[Impact Assessment\n1. Was data exposed? Which tenants?\n2. What data was accessed?\n3. How long was the window open?\n4. Is breach ongoing?]

    Assess --> Remediate[Remediation\n1. Patch vulnerability\n2. Rotate compromised credentials\n3. Deploy fix to production\n4. Verify containment effective]

    Remediate --> Notify[Notifications\n1. Affected tenants notified within SLA\n2. Regulatory notification if PII exposed\n3. GDPR: 72-hour window from discovery]

    Notify --> Review[Post-Incident Review\nRoot cause analysis\nFix process gaps\nUpdate runbooks\nUpdate security tests]
```

### 17.2 Automated Incident Response

```typescript
// common/security/incident-response.service.ts
@Injectable()
export class IncidentResponseService {
  // Called by security monitoring on threshold breach
  async respondToTenantBypassAttempt(userId: string, tenantId: string, ip: string): Promise<void> {
    // 1. Immediately terminate all sessions for this user
    await this.sessionService.terminateAllSessions(userId, tenantId);

    // 2. Block IP at rate limiter level
    await this.redis.setex(`blocked:ip:${ip}`, 24 * 60 * 60, 'SECURITY_BLOCK');

    // 3. Log critical security event
    await this.securityAuditService.log({
      event: 'SUSPICIOUS_PATTERN',
      userId, tenantId, ip,
      severity: 'CRITICAL',
      reason: 'Tenant bypass attempt detected; all sessions terminated',
    });

    // 4. Alert security team immediately
    await this.alertService.sendCriticalSecurityAlert({
      title:   '🚨 CRITICAL: Tenant bypass attempt',
      message: `User ${userId} attempted to access data from another tenant. Sessions terminated. IP: ${ip}`,
      channel: '#security-critical',
    });
  }

  async respondToAccountCompromise(userId: string, tenantId: string): Promise<void> {
    await this.sessionService.terminateAllSessions(userId, tenantId);
    await this.userService.requirePasswordReset(userId);
    await this.userService.requireMfaSetup(userId);
  }
}
```

---

## SECTION 18 — SECURITY TOOL STACK

### 18.1 Complete Security Technology Stack

| Category | Tool | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Web Application Firewall** | Cloudflare WAF | Enterprise | DDoS, bot filtering, IP reputation, OWASP rule set |
| **API Gateway Security** | Kong Gateway + OIDC plugin | 3.x | Rate limiting, JWT pre-validation, request logging |
| **Input Validation** | class-validator + class-transformer | — | DTO schema validation, type coercion, XSS stripping |
| **Password Hashing** | bcrypt | 5.x | Cost-factor 12 password hashing; timing-safe comparison |
| **JWT** | @nestjs/jwt + jsonwebtoken | — | RS256 token signing, verification, expiry management |
| **Secret Management** | AWS Secrets Manager + KMS | — | Secret storage, rotation, encryption key management |
| **Secrets Detection** | Gitleaks + Semgrep | — | Pre-commit hook: detect hardcoded secrets in code |
| **SAST** | SonarQube Community | 10.x | Static code analysis, security hotspot detection |
| **Dependency Scan (SCA)** | Snyk | — | Continuous vulnerability monitoring of npm packages |
| **Container Scan** | Trivy | 0.5x | Docker image CVE scanning; Kubernetes manifest scan |
| **API Security Testing** | OWASP ZAP | 2.14 | Automated OWASP API Top 10 scan; CI/CD integration |
| **Manual Pen Testing** | Burp Suite Professional | 2024 | Manual penetration testing; session analysis; IDOR |
| **DAST** | OWASP ZAP Automation | — | Dynamic application security testing in staging |
| **Log Aggregation** | Elasticsearch + Kibana (ELK) | 8.x | Security event search, threat hunting, dashboards |
| **Metrics** | Prometheus + Grafana | — | Security metric counters, alert threshold dashboards |
| **Alerting** | PagerDuty + Slack | — | Real-time security incident notification |
| **File Virus Scan** | ClamAV | 1.x | Server-side antivirus scan for uploaded files |
| **Security Headers** | Helmet.js | 7.x | HTTP security headers middleware for NestJS |

---

## SECTION 19 — SECURITY GOVERNANCE

### 19.1 Security Review Process

| Gate | Trigger | Reviewer | Outcome |
| :--- | :--- | :--- | :--- |
| **Pre-commit** | Developer commit | Automated (Gitleaks, ESLint security) | Block if secrets or HIGH vulnerabilities found |
| **PR Security Review** | Any PR touching auth/authz/crypto | Security Architect (manual) | Approve or request changes |
| **Dependency Review** | Weekly automated scan | Security Team | Create Jira ticket for HIGH/CRITICAL CVEs |
| **Deployment Gate** | Pre-production deploy | SonarQube + Snyk CI check | Block if quality gate fails |
| **Quarterly Access Review** | Calendar trigger | Team Leads + Security | Remove stale permissions, rotate keys |
| **Annual Penetration Test** | Calendar trigger | External Security Firm | Report delivered; remediation tracked |

### 19.2 Security Standards and Rules

| Standard | Rule | Enforcement |
| :--- | :--- | :--- |
| **Password storage** | bcrypt with rounds ≥ 12 | SonarQube rule: detect weak hashing |
| **Algorithm selection** | AES-256-GCM for symmetric; RS256 for asymmetric | Code review checklist |
| **Secret handling** | No secrets in code, logs, or error messages | Gitleaks pre-commit + SonarQube |
| **Input validation** | Every controller DTO must use class-validator | Lint rule + code review |
| **Error responses** | No stack traces in HTTP responses | GlobalExceptionFilter enforced |
| **Logging PII** | No PII in application logs | Custom ESLint rule + log review |
| **TLS** | TLS 1.2+ for all connections; TLS 1.3 preferred | SSL check in CI |
| **Dependency age** | No packages with CRITICAL CVE in production | Snyk pipeline gate |
| **Session TTL** | Access tokens ≤ 15 min; refresh tokens ≤ 7 days | JWT config review |
| **Admin operations** | All admin actions require MFA re-verification | Guards + workflow review |

---

## SECTION 20 — FINAL SECURITY ARCHITECTURE DIAGRAMS

### 20.1 Backend Security Architecture

```mermaid
graph TD
    User2[Users: Web + Mobile] --> CF[Cloudflare\nWAF + DDoS + Bot filter]
    CF --> LB2[Load Balancer\nTLS 1.3 termination\nHTTPS only]
    LB2 --> Kong2[Kong API Gateway\nRate limit, CORS, logging]
    Kong2 --> NestJS3[NestJS Application\nHelmet, CSRF, JWT Guard, RBAC Guard]
    NestJS3 --> Validation[Validation Layer\nDTO, sanitization, SSRF guard]
    Validation --> Services2[Business Services\nOwnership check, business rule validation]
    Services2 --> ORM2[Prisma ORM\nParameterized queries only, RLS middleware]
    ORM2 --> PG2[(PostgreSQL\nRLS, least privilege, TLS, audit log)]
    Services2 --> Redis3[(Redis\nTLS, ACL, sentinel HA)]
    Services2 --> S3[AWS S3\nPresigned URLs, no public access]

    subgraph SecurityControls [Cross-Cutting Security]
        Audit2[SecurityAuditService\nAll security events logged]
        Secrets2[SecretsManagerService\nAWS Secrets Manager]
        Crypto[FieldEncryptionService\nAES-256-GCM for PII]
        Monitor2[Prometheus + ELK\nReal-time threat detection]
    end

    NestJS3 --> Audit2
    NestJS3 --> Secrets2
    NestJS3 --> Crypto
    Audit2 --> Monitor2
```

### 20.2 Authentication Security Flow

```mermaid
sequenceDiagram
    participant User3 as User
    participant API5 as NestJS Auth API
    participant AccProt as AccountProtectionService
    participant PwdSvc as PasswordService
    participant JWTSvc as JWTService
    participant Redis7 as Redis
    participant AuditSvc as SecurityAuditService

    User3->>API5: POST /auth/login { email, password }
    API5->>AccProt: checkLocked(email)
    AccProt->>Redis7: EXISTS login:locked:{email}
    Redis7-->>AccProt: 0 (not locked)

    API5->>PwdSvc: verify(password, storedHash)
    Note over PwdSvc: bcrypt.compare — timing safe

    alt Wrong password
        PwdSvc-->>API5: false
        API5->>AccProt: recordFailedAttempt(email)
        AccProt->>Redis7: INCR login:attempts:{email}
        API5->>AuditSvc: log AUTH_LOGIN_FAILED HIGH
        API5-->>User3: 401 Unauthorized
    else Correct password
        PwdSvc-->>API5: true
        API5->>AccProt: clearFailedAttempts(email)
        API5->>JWTSvc: issueTokenPair(user)
        Note over JWTSvc: Access: RS256 15min\nRefresh: 384-bit random → bcrypt hash

        API5->>Redis7: Store session Hash + Set
        API5->>AuditSvc: log AUTH_LOGIN_SUCCESS LOW
        API5-->>User3: Access token (body)\nRefresh token (HttpOnly cookie only)
    end
```

### 20.3 Authorization Flow

```mermaid
graph TD
    Req4[Authenticated Request\nBearer {access_token}] --> JWTGuard2[JwtAuthGuard\nVerify RS256 signature\nValidate exp, iss, aud]
    JWTGuard2 --> JTICheck2[Check JTI revocation\nRedis: session:revoked:{jti}]
    JTICheck2 --> TenantGuard3[TenantGuard\nX-Tenant-ID == JWT tenantId?\nTenant active in DB?]
    TenantGuard3 --> PermGuard2[PermissionGuard\nLoad permissions from Redis\nRequired permission in set?]
    PermGuard2 --> OwnershipCheck[Resource Ownership Check\nIs this resource in the user's tenant?\nIs this resource in the user's branch?]
    OwnershipCheck --> RLS2[PostgreSQL RLS\nSET LOCAL app.tenant_id\nFinal database-level filter]
    RLS2 --> DataReturned[Only authorized data returned]

    JWTGuard2 -->|Invalid/expired| R1[401 Unauthorized]
    JTICheck2 -->|Revoked| R2[401 Token revoked]
    TenantGuard3 -->|Mismatch| R3[401 Tenant context mismatch]
    PermGuard2 -->|No permission| R4[403 Forbidden]
    OwnershipCheck -->|Wrong tenant| R5[404 Not Found]
```

### 20.4 Multi-Tenant Security Isolation

```mermaid
graph TD
    T1[Tenant A Request\nJWT: tenantId=A\nX-Tenant-ID: A] --> Guard3[TenantGuard\nValidates A == A ✅]
    T2[Tenant B Request\nJWT: tenantId=B\nX-Tenant-ID: B] --> Guard3

    Guard3 --> PrismaCtx[Prisma Middleware\nSET LOCAL app.tenant_id = tenantId]

    subgraph Database [PostgreSQL with RLS]
        RLS3[RLS Policy: tenant_id = current_setting\nFilters every SELECT/INSERT/UPDATE/DELETE]
        OrdersA[(Tenant A rows\ntenant_id = A)]
        OrdersB[(Tenant B rows\ntenant_id = B)]
    end

    PrismaCtx --> RLS3
    RLS3 -->|Query from Tenant A| OrdersA
    RLS3 -->|Query from Tenant B| OrdersB

    T1_Attempt[Tenant A with\nX-Tenant-ID: B] --> Guard4[TenantGuard\nA != B → 401 ❌]
    CrossAttempt[Tenant A accessing\nTenant B resource ID] --> RLS3
    RLS3 -->|RLS returns 0 rows| Empty[404 Not Found\nNo data leakage]

    subgraph Cache2 [Redis Cache — Namespace Isolated]
        CacheA[tenant:A:dashboard:...]
        CacheB[tenant:B:dashboard:...]
    end

    Guard3 --> Cache2
```

### 20.5 Security Monitoring Architecture

```mermaid
graph TD
    subgraph EventSources [Security Event Sources]
        AuthEvents[Auth Events\nLogin/logout/failed/OTP]
        AuthzEvents[Authz Events\nPermission denied/tenant bypass]
        DataEvents[Data Events\nPII access/bulk export]
        AdminEvents[Admin Events\nRole changes/config updates]
        InfraEvents[Infrastructure Events\nPod crashes/K8s alerts]
    end

    subgraph Processing [Event Processing]
        AuditDB2[(security_events table\nImmutable + HMAC-signed)]
        Fluentd2[Fluentd\nLog shipping]
        Elastic2[Elasticsearch\nSecurity event index]
    end

    subgraph Detection [Threat Detection]
        Rules2[Alert Rules\nThreshold + anomaly]
        Rules2 -->|Brute force: 20 fail/min| BF_Alert[Block IP + Alert]
        Rules2 -->|Tenant bypass: any| TB_Alert[CRITICAL: Terminate session]
        Rules2 -->|Bulk export| BE_Alert[Re-auth required + Alert]
        Rules2 -->|Admin outside hours| AH_Alert[Immediate alert + verify]
    end

    subgraph Response [Response]
        Slack5[Slack: #security-alerts]
        PagerDuty5[PagerDuty: On-Call]
        AutoResponse[IncidentResponseService\nAuto-terminate sessions]
    end

    AuthEvents & AuthzEvents & DataEvents & AdminEvents --> AuditDB2
    AuthEvents & InfraEvents --> Fluentd2 --> Elastic2 --> Rules2
    Rules2 --> Slack5 & PagerDuty5 & AutoResponse
```

---

## APPENDIX A — SECURITY QUICK REFERENCE

```
Authentication:      bcrypt(12), RS256 JWT, 15min access token, 7-day refresh token
Session:             JTI revocation in Redis; multi-device Set tracking
MFA:                 Required for admin operations and financial actions
Authorization:       RBAC (8 roles) + Permission system (code-based guards)
Tenant Isolation:    JWT claim + Header validation + Prisma RLS middleware + PostgreSQL RLS
Database:            Least-privilege users; parameterized queries; TLS; RLS; audit log
Secrets:             AWS Secrets Manager; 90-day rotation; never in .env commits
Encryption:          AES-256-GCM for PII fields; TLS 1.3 for all connections
File Uploads:        Magic byte MIME check; ClamAV scan; EXIF strip; S3 presigned URLs
Headers:             Helmet.js: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
Rate Limiting:       5 login/15min; 300 API read/min; 60 API write/min
Audit Log:           Immutable + HMAC-signed; CRITICAL → 7 years retention
OWASP:               A01-A10 controls implemented; automated ZAP scan in CI
Penetration Test:    Quarterly by external firm; CVSS-scored findings; tracked remediation
```

## APPENDIX B — SECURITY CHECKLIST PER FEATURE

```
For every new API endpoint or feature:
  [ ] Does the route have @Public() only if truly public? (Default: auth required)
  [ ] Is the required permission defined in the @RequirePermission() decorator?
  [ ] Does the DTO use class-validator for all fields with explicit constraints?
  [ ] Does the service layer check resource ownership (tenantId + branchId)?
  [ ] Are any user-facing error messages free of internal details?
  [ ] Does the feature log security-relevant actions in SecurityAuditService?
  [ ] If file upload: magic byte check, virus scan, EXIF strip, S3 presigned URL?
  [ ] If external URL fetch: SSRF guard applied?
  [ ] If sensitive data returned: DataMaskingInterceptor masks correctly?
  [ ] Is the feature covered by at least one authentication and authorization test?
```

---

*End of Backend Security Architecture, Hardening & Compliance Strategy*  
*Document maintained by: Principal Security Architect & Backend Security Engineer | Status: Approved Backend Security Architecture & Hardening Specification — RESTRICTED DISTRIBUTION*
