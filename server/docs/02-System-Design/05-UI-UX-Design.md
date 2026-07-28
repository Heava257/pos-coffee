# SYSTEM DESIGN SPECIFICATION
## PART 5 — UI/UX DESIGN

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Senior UX Architect, Product Designer & Frontend Solution Architect  
**Status:** Under Review  

---

## 1. UX Design Vision

### 1.1 UX Goals & Design Principles
The core goal of the user interface is to provide a fast, error-resistant interface that minimizes cashier transaction times and simplifies multi-branch store operations.
*   **Speed & Efficiency:** Enable cashiers to complete checkouts in under 3 clicks, minimizing checkout queues.
*   **Cognitive Load Reduction:** Present only contextually relevant actions on mobile and tablet screens.
*   **Offline Visibility:** Clear indicators showing whether the device is operating in Offline or Online mode.

### 1.2 Usability Objectives & Business Alignment
*   **User Efficiency:** Streamlined POS checkout views that prevent cash drawer discrepancies.
*   **Error Prevention:** Immediate field validation and confirmation dialogs during cash register opening and closing.
*   **Accessibility:** Full support for Khmer Unicode fonts, clear color contrast, and large touch targets ($\ge 44\times44\text{ px}$) to prevent touch errors on tablet POS devices.

---

## 2. User Persona Analysis

### Persona: Sopheak (Cashier)
*   **Role:** Store Cashier.
*   **Goals:** Speed up customer checkout queues and verify register balances.
*   **Needs:** Large touch buttons, offline checkout support, and instant receipt printing.
*   **Problems:** Unstable internet connectivity, touch registration issues on small screens, and cash discrepancies during shift changes.
*   **System Usage:** Tablet POS checkout module, shift opening/closing inputs.
*   **Expected Experience:** Fast, responsive touchscreen grid with clear feedback during checkout operations.

### Persona: Leakhena (Business Owner)
*   **Role:** Tenant Administrator.
*   **Goals:** Monitor sales metrics, adjust product catalogs, and audit cashier registers.
*   **Needs:** Consolidated reports across branches, role-based permission controls, and secure auditing.
*   **Problems:** Lack of real-time sales visibility, difficulties tracking inventory, and invoice printing issues.
*   **System Usage:** Web Admin portal, inventory setup dashboard, and financial reports.
*   **Expected Experience:** Desktop dashboard with search capabilities, export features, and data grids.

---

## 3. User Journey Analysis

### Journey: POS Checkout Workflow
*   **User Goal:** Process a customer order and complete payment.
*   **Starting Point:** Active POS checkout view on the tablet device.
*   **Journey Steps:**
    1.  **Select Items:** Cashier taps catalog items on the touchscreen grid.
        *   *System Response:* Adds items to the active cart, updates the total, and calculates sales tax.
    2.  **Choose Payment:** Cashier taps "Pay" and selects "KHQR Code".
        *   *System Response:* Generates and displays the Bakong/KHQR payment code on the tablet.
    3.  **Confirm Payment:** Cashier verifies the transfer on their bank screen and taps "Complete".
        *   *System Response:* Logs the transaction, sends deductions to inventory, and prints the receipt.
*   **End Result:** Order is saved, the kitchen notification fires, and the cart is reset.

---

## 4. Information Architecture (IA)

```
[ SAAS PLATFORM APPLICATION ]
  │
  ├──► [ TABLET POS APPLICATION ]
  │      ├──► Checkout Grid (Catalog selection, Cart sidebar)
  │      ├──► Register Shift (Open shift, Close shift, Cash count)
  │      └──► Offline Synchronization Indicator
  │
  └──► [ WEB ADMIN PORTAL ]
         ├──► Analytics Dashboard (Sales metrics, Branch reports)
         ├──► Inventory Manager (Catalog setup, Stock alerts)
         ├──► Tenant Configurations (Users, RBAC, Subscriptions)
         └──► Shift Audit Logs (Z-Report reviews)
```

---

## 5. Screen Specification

### Screen ID: SCR-POS-001 (POS Checkout Screen)
*   **Purpose:** Primary operational screen for processing transactions.
*   **User Role:** Cashier, Store Manager.
*   **Main Components:**
    *   **Catalog Panel:** Visual grid of products categorized by folders (e.g., Espresso, Bakery).
    *   **Cart Sidebar:** List of selected items, item quantities, discounts, and total totals.
    *   **Payment Trigger Buttons:** Cash, Card, and KHQR trigger actions.
    *   **Connectivity Banner:** Colored header indicating Connection Status (Green: Online, Yellow: Offline Cache Mode).
*   **User Actions:** Tapping products, editing cart quantities, tapping pay triggers, and clearing active carts.
*   **Required Data:** Product catalog cache (IndexedDB), branch tax settings.
*   **Related API:** `POST /api/v1/pos/orders` (deferred if offline).

---

## 6. UI Component Design System

### 6.1 Interactive Buttons
*   **Primary Action Button:**
    *   *Purpose:* Submits forms, confirms checkouts.
    *   *Behavior:* Large touchscreen target size, visual feedback when pressed.
    *   *States:* Default, Hover, Active, Disabled, Loading (with spinning indicator).
*   **Secondary Action Button:**
    *   *Purpose:* Triggers cancel actions, navigates back.
    *   *States:* Default, Hover, Active, Disabled.

### 6.2 Data Tables
*   **Purpose:** Displays inventory listings and order histories.
*   *Usage:* Multi-column tables with fixed headers, sorting arrows, and pagination links.
*   *States:* Default, Empty (displaying "No records found"), Loading Skeleton.

---

## 7. Responsive Design Strategy

*   **Tablet App Layout (POS Grid):** Locked in Landscape mode ($1024\times768\text{ px}$ and above) to support a side-by-side catalog panel and cart view.
*   **Web Admin Layout (Dashboard):** Responsive grid (Desktop first) that collapses to a single column on tablet devices for remote monitoring.
*   **Mobile Layout:** Refactors tables into vertical card layouts, and collapses menus into navigation buttons.

---

## 8. Design System Guidelines

*   **Color Strategy:**
    *   *Primary Brand Color:* Deep Slate Blue (Used for headers, primary actions).
    *   *Success Accent:* Emerald Green (Used for online status, completed payments).
    *   *Alert Accent:* Amber (Used for offline alerts, low-stock warnings).
*   **Typography:**
    *   *Interface Font:* **Inter** (for numeric clarity) paired with **Koh Santepheap** (for readable Khmer Unicode rendering on POS layouts).
*   **Touch Targets:** Minimum target area of $48\times48\text{ dp}$ on all POS tablet buttons to prevent cashier input errors.

---

## 9. User Interaction Design

*   **System Feedback:** Display success messages (e.g., "Order Completed") inside snackbars that auto-dismiss after 3 seconds.
*   **Loading States:** Use skeleton screens for page loading and disable action buttons during API calls to prevent double submissions.
*   **Empty States:** Provide illustrations with call-to-actions when dashboards have no data (e.g., "Set up your first product to get started").
*   **Confirmation Dialogs:** Require confirmation for destructive operations like deleting catalog items or closing register shifts.

---

## 10. Form & Validation Design

*   **Real-Time Validation:** Validate input fields when focus shifts (e.g., email patterns, unique barcode scans).
*   **Inline Errors:** Position error text directly below the invalid input field, highlighted in red.
*   **Assistance Indicators:** Provide validation rules (e.g., "Password must be at least 8 characters") below input fields.

---

## 11. Accessibility Design

*   **Khmer Language Support:** Set interface font sizes to a minimum of 14px to maintain readability for Khmer Unicode text.
*   **Keyboard Navigation:** Support keyboard navigation (Tab, Enter, Escape) on all Web Admin forms.
*   **Screen Reader Support:** Add descriptive ARIA labels to buttons containing only icons (e.g., `aria-label="Add new product"`).

---

## 12. UI/UX Security Consideration

*   **Masked Fields:** Mask passwords on the login screen, and hide API secrets on setup forms.
*   **Automatic Logouts:** Automatically lock the POS interface after 10 minutes of inactivity to prevent unauthorized access.
*   **Permission-Based Rendering:** Hide admin action buttons (e.g., "Void Transaction", "Adjust Price") if the logged-in user is a cashier.

---

## 13. UI/UX Traceability Matrix

| Functional Requirement | Use Case | User Flow / Journey | Primary Screen | UI Component |
| :--- | :--- | :--- | :--- | :--- |
| **FR-AUTH-001** | UC-002: Login | Cashier Authentication | SCR-AUTH-01 (Login) | Email Input, Password Input |
| **FR-POS-ORD-001**| UC-008: Checkout | POS Checkout Workflow | SCR-POS-01 (POS Grid) | Catalog Grid, Cart Sidebar |
| **FR-POS-PAY-001**| UC-009: Payment | POS Checkout Workflow | SCR-PAY-01 (Payment) | Payment Select Modal, KHQR Box |
| **FR-INV-MON-001**| UC-011: Inventory| Stock Monitoring | SCR-INV-01 (Inventory)| Data Table, Stock Alert Banner|

---

## 14. Conclusion

This UI/UX Design Document establishes the user experience framework, interface standards, and screen flows for client applications. By using responsive grid layouts, readable Khmer Unicode font configurations, and touch-optimized buttons, we ensure the platform's user interfaces are fast, secure, and easy to use.

Developers can now proceed to frontend component build setup, state management integration, and stylesheet styling.
