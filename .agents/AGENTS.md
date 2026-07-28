# Workspace Rules

Every developer, AI agent, and code generator MUST adhere to the security rules and instructions documented in [SECURITY_PRINCIPLES.md](file:///c:/Users/Prime/Desktop/Project%20System/pos-coffee/SECURITY_PRINCIPLES.md).

These rules cover:
1. Database-driven RBAC & Authorization (Never hardcode roles or permissions)
2. Configurable Feature Flags
3. Environment-based Secrets configuration
4. Parameterized SQL Queries & ORM usage
5. Input Validation on all APIs
6. Security headers and upload type/size checks
7. AI development guidelines (Return "Need Client Confirmation" rather than guessing)
