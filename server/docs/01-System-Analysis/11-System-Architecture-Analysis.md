# SYSTEM ARCHITECTURE ANALYSIS

## 1. Architectural Style Analysis
To balance low hosting costs during the startup phase with long-term scaling targets, the platform uses a **Modular Monolith** style. This approach keeps deployment simple while enforcing clean domain boundaries between core modules and business modules.

## 2. Multi-Tenant Database Strategy
Enforce a **Hybrid Multi-Tenant Model**:
* **Starter / Growth Plans:** Share database engines, using Row-Level Security (RLS) to isolate tenant data.
* **Enterprise Plans:** Run on dedicated databases to provide isolation and custom backup options.
