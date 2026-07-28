# SECURITY_PRINCIPLES.md

## Purpose

This document defines mandatory security rules for the entire project.

Every AI agent, developer, and code generator MUST follow these rules.

This document overrides any conflicting implementation.

---

# 1. Authorization

NEVER hardcode permissions.

❌ Bad

```javascript
if (user.role === "ADMIN") {
    ...
}

if (user.permission === "DELETE_USER") {
    ...
}
```

✅ Good

Permissions must be loaded from the database.

```
Role
    ↓
RolePermission
    ↓
Permission
```

Authorization must always query the permission service.

---

# 2. RBAC

Implement Database-driven RBAC.

Tables:

- Users
- Roles
- Permissions
- RolePermissions
- UserRoles

Never hardcode:

- roles
- permissions
- menu access
- API access
- screen access

---

# 3. Feature Flags

Every feature must be configurable.

Store feature flags in database.

Never use

```javascript
if (true)
```

or

```javascript
const ENABLE_PAYMENT = true
```

---

# 4. Configuration

Secrets must never exist in source code.

Store:

- JWT Secret
- Database Password
- API Keys
- SMTP Password
- OAuth Secret

inside environment variables or Secret Manager.

---

# 5. Password

Passwords must be hashed.

Never store plaintext passwords.

---

# 6. Authentication

Support:

- JWT
- Refresh Token
- Session Revocation

Never trust client-side data.

---

# 7. API Security

Every API must include:

- Authentication
- Authorization
- Validation
- Rate Limiting
- Audit Logging

---

# 8. Input Validation

Validate every input.

Never trust:

- Request Body
- Query
- Headers
- File Uploads

---

# 9. SQL

Always use ORM or parameterized queries.

Never concatenate SQL strings.

---

# 10. Audit Log

Sensitive operations must be logged.

Examples:

- Login
- Logout
- Delete
- Permission Change
- Price Change
- Inventory Adjustment
- Payment
- Role Assignment

---

# 11. Soft Delete

Business data must use Soft Delete unless permanent deletion is explicitly approved.

---

# 12. Principle of Least Privilege

Every user only receives the minimum permissions required.

---

# 13. Menu Authorization

Menus must come from permissions.

Never hardcode sidebar menus.

---

# 14. UI Authorization

- Buttons
- Pages
- Routes
- Components

must check permissions.

---

# 15. Backend Authorization

Frontend permission checking is NOT sufficient.

Backend must verify every request.

---

# 16. Multi-Tenant

Never expose another tenant's data.

Every query must filter by Tenant ID when multi-tenancy is enabled.

---

# 17. Security Headers

Enable:

- Helmet
- CORS
- CSP
- HSTS
- XSS Protection

---

# 18. File Upload

Validate:

- File Type
- File Size
- MIME Type

Never trust file extension.

---

# 19. Logging

Never log:

- Passwords
- Tokens
- Secrets
- Credit Card
- OTP
- API Keys

---

# 20. AI Development Rules

AI MUST NEVER:

- hardcode roles
- hardcode permissions
- hardcode feature access
- bypass authorization
- skip validation
- expose secrets
- disable audit logs

If business rules are unclear:

Return:

"Need Client Confirmation"

instead of making assumptions.
