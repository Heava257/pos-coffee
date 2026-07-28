# ENTITY & DATA ANALYSIS

## 1. Entity Core Classifications
* **Organizational Entities:** Tenant (Isolated workspace), Branch (Store location).
* **Identity Entities:** User (Credential repository), Role (Access permission templates).
* **Operational Entities:** Product (Item descriptions), Inventory (Stock levels).
* **Transactional Entities:** Order (Sales headers), OrderItem (Cart line items), Payment (Reconciliation logs).

## 2. Relational Cardinality
* A single Tenant owns **one or more** Branch profiles (1:N).
* A single Branch houses **zero or more** Inventory lines (1:N).
* A single Order invoice contains **one or more** OrderItem lines (1:N).
