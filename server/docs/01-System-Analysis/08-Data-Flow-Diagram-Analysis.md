# DATA FLOW DIAGRAM (DFD) SPECIFICATION

## 1. DFD Level 0 (Context Level)
Defines high-level data transitions between external actors and the platform.
* **Business Owner** enters registration details, receiving tenant configurations.
* **Cashier** submits cart entries and payment tokens, receiving receipt tickets.
* **Payment Gateway** validates tokens and sends transaction authorizations.

## 2. DFD Level 1 (Decomposed Processes)
* **Process 1.0 (Registration):** Captures user profiles, validates emails, and initializes tenant workspaces.
* **Process 2.0 (POS Checkout):** Computes cart totals, applies tax settings, processes payments, and updates inventory.
* **Process 3.0 (Inventory Update):** Deducts stock levels and triggers low-stock alerts.
* **Process 4.0 (Analytics):** Computes ledger records to compile dashboard metrics.
