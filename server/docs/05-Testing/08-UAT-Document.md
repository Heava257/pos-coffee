# TESTING SPECIFICATION
## PART 8 — USER ACCEPTANCE TESTING (UAT) & BUSINESS VALIDATION

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Product Owner, Business Analyst & UAT Specialist  
**Status:** Approved  

---

## 1. UAT Overview

### 1.1 Purpose & Objectives
User Acceptance Testing (UAT) is the final validation phase before production deployment. It ensures that the SaaS platform satisfies real-world business needs and is ready for merchant operations.
*   **System Testing vs. UAT:**
    *   *System Testing* is executed by QA engineers to verify that the software meets technical requirements and is bug-free.
    *   *User Acceptance Testing* is executed by business users and store managers to verify that the application supports daily business operations and satisfies user expectations.

---

## 2. UAT Scope Definition

*   **In-Scope (Business Verification):**
    *   *Cashier Workflows:* Cart checkouts, cash drawer openings, and receipt printing.
    *   *Inventory Management:* Product catalog configurations and low-stock warnings.
    *   *Local Integrations:* Local payment gateway checkouts (Bakong KHQR codes).
    *   *Compliance Requirements:* Khmer Unicode receipts and GDT tax invoice printing layouts.
*   **Out-of-Scope (Technical Verification):**
    *   *Infrastructure Audits:* VPC configurations, container scaling metrics, and log analyzers.
    *   *Developer Testing:* Code unit test coverage and database schema rollbacks.

---

## 3. UAT Participants & Responsibilities

*   **Product Owner:**
    *   *Responsibility:* Manages overall acceptance sign-off.
    *   *Activities:* Evaluates business feedback and prioritizes post-UAT updates.
    *   *Approval Authority:* Final system release sign-off.
*   **Business User (Store Owner):**
    *   *Responsibility:* Validates dashboard reports and tenant setup configurations.
    *   *Activities:* Configures catalog categories and verifies sales reporting.
    *   *Approval Authority:* Signs off on administration features.
*   **End User Representative (Store Cashier):**
    *   *Responsibility:* Validates POS touchscreen checkout speed.
    *   *Activities:* Performs checkouts, cashier shift changes, and receipts printing.
    *   *Approval Authority:* Signs off on touchscreen checkout workflows.
*   **QA Lead:**
    *   *Responsibility:* Manages UAT environment setups and logs defects.
    *   *Activities:* Seeds UAT test data and tracks bug resolutions.
    *   *Approval Authority:* Pre-UAT sanity check sign-off.

---

## 4. UAT Environment Preparation

UAT is executed on a dedicated **Staging/UAT Environment** that represents real business conditions:
*   *Configuration:* Matches production infrastructure settings (AWS ECS tasks, Postgres databases, and Redis clusters).
*   *Test Data:* Populated with realistic merchant catalogs, branch configurations, tax rates, and mock sales data.
*   *Access Control:* Access is granted to merchant users via test accounts with role-based permissions (Owner, Manager, Cashier).

---

## 5. UAT Scenario Design

### Scenario UAT-SC-01: Cashier Touchscreen Checkout
*   **User Role:** Store Cashier.
*   **Precondition:** Cashier shift is open; product catalog is cached.
*   **Steps:**
    1.  Tap 3 products from the Visual Catalog Grid to add them to the cart.
    2.  Apply a $10\%$ store discount.
    3.  Select "Bakong KHQR" as the payment method.
    4.  Verify that the KHQR code is generated and displayed in $\le 1\text{ second}$.
    5.  Scan the test QR code to confirm payment.
    6.  Confirm that the thermal printer generates the receipt in Khmer Unicode.
*   **Expected Business Outcome:** Checkout completes, inventory is updated, and the receipt prints correctly.

### Scenario UAT-SC-02: Tenant Management & GDT Compliance
*   **User Role:** Store Owner (Tenant Owner).
*   **Precondition:** Tenant account is active; branch details are configured.
*   **Steps:**
    1.  Log in to the Web Admin Portal.
    2.  Navigate to Tenant Settings $\rightarrow$ Tax Configurations.
    3.  Input the business VAT number and save settings.
    4.  Generate an official tax invoice.
*   **Expected Business Outcome:** GDT compliance fields (business name, tax ID) render correctly on the invoice layout.

---

## 6. Business Process Validation

Validation tracks the user journey through the system to ensure correct business outcomes:

```
[ Cashier Cart Selection ] ──► [ Payment & Tax Applied ] ──► [ Inventory Deducted ]
                                                                   │
                                                                   ▼
[ Owner Sales Reports ] ◄── [ Sales Ledger Written ] ◄─────────────┘
```

*   **Workflow Validation:** Confirm that the sequence of checkout actions matches the physical register operations at store branches.
*   **Calculation Validation:** Verify that sales tax (10% VAT) and item discounts are calculated correctly.

---

## 7. UAT Test Case Template

UAT test cases use a simplified template designed for business users:
*   `Test Case ID`: Unique identifier (e.g., `TC-UAT-POS-001`).
*   `Business Scenario`: Description of the business flow (e.g., Cash Cart Checkout).
*   `Objective`: Target outcome (e.g., verify cash drawer opening).
*   `Steps`: Simple step-by-step navigation instructions.
*   `Expected Result`: Expected outcome (e.g., drawer opens and cash sales log is created).
*   `User Feedback / Comments`: Input notes from business users.

---

## 8. Defect Severity Matrix & Resolution

*   **Critical Business Issue (Blocker):**
    *   *Impact:* Core business flow fails (e.g., checkout crashes, incorrect tax calculations).
    *   *Priority:* High. *Resolution:* Immediate fix; blocks release.
*   **Major Issue:**
    *   *Impact:* A feature fails but a workaround exists (e.g., QR payment fails, cashier must switch to cash).
    *   *Priority:* Medium. *Resolution:* Fix within the current sprint.
*   **Minor Issue / Improvement Request:**
    *   *Impact:* Cosmetic issue (e.g., alignment issues, font size adjustments).
    *   *Priority:* Low. *Resolution:* Log to the product backlog for future updates.

---

## 9. UAT Feedback & Review Loop

```
[ User Feedback Logged ] ──► [ BA / PO Analysis ] ──► [ Priority Decision ]
                                                              │
                                                              ▼
[ Staging Verification ] ◄── [ Dev Bug Fix ] ◄────────────────┘
```

1.  **Feedback Logged:** Users log feedback in Jira.
2.  **Analysis:** The Business Analyst and Product Owner evaluate the feedback.
3.  **Decision:** Valid issues are categorized as bugs; change requests are sent to the backlog.
4.  **Verification:** Bug fixes are deployed and verified on staging.

---

## 10. UAT Success Criteria

UAT is successful, and the release candidate is approved for production deployment, once:
*   `[x]` 100% of core business scenarios are completed successfully.
*   `[x]` Zero critical or major business issues remain open.
*   `[x]` GDT tax compliance layouts render correctly.
*   `[x]` Merchant stakeholders sign off on the release candidate.

---

## 11. Production Release Decisions

Following UAT reviews, the Product Owner selects one of three release paths:
*   **Approved:** All acceptance criteria are met. Proceed to production deployment immediately.
*   **Conditional Approval:** Minor issues remain. Proceed to production with documented workarounds.
*   **Rejected:** Critical issues remain unresolved. Return the release candidate to the development team.

---

## 12. UAT Metrics

*   **Scenario Completion Rate:** Target 100% completion on MVP scenarios.
*   **Acceptance Rate:** Percentage of test cases marked as passed by business users. Target $\ge 95\%$.
*   **Approval Time:** Elapsed time from UAT start to final PO sign-off.

---

## 13. Conclusion

This User Acceptance Testing (UAT) Strategy and Business Validation Document defines the UAT scopes, scenarios, roles, defect severities, and release paths. Enforcing this quality framework ensures that the system satisfies merchant expectations and is ready for production.

Merchant stakeholders and business users can now begin UAT executions.
