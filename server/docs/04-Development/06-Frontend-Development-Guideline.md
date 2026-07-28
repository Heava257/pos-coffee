# DEVELOPMENT SPECIFICATION
## PART 5 — FRONTEND & MOBILE DEVELOPMENT GUIDELINES

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal Frontend Architect & Mobile Engineering Lead  
**Status:** Approved  

---

## 1. Client Development Philosophy

### 1.1 Core Objectives & Principles
The client interfaces (Next.js web and React Native mobile) represent the direct point of contact for merchants and store cashiers.
*   **Intuitive Checkout UX:** The cashier checkout layout is optimized for touchscreen speed, ensuring checkouts complete in under 3 taps.
*   **Responsive Layouts:** Enforce layouts that adapt cleanly across tablets, desktops, and mobile screens.
*   **Offline-First POS Operation:** Cash registers must remain functional during internet drops, caching sales transaction logs locally.

---

## 2. Client Application Architecture

Dependencies flow in a single downward direction to decouple UI rendering from data processing:

```
[ PRESENTATION LAYER ] (React components, visual screen views)
          │
          ▼
[ STATE MANAGEMENT LAYER ] (Zustand config, client state slices)
          │
          ▼
[ BUSINESS LOGIC LAYER ] (Custom React hooks, local tax calculations)
          │
          ▼
[ API COMMUNICATION LAYER ] (Axios clients, request interceptors)
          │
          ▼
[ DATA STORAGE LAYER ] (WatermelonDB SQLite database, local cache)
```

### 2.1 Layer Boundaries
*   **Presentation Layer:** Responsibilities are limited to rendering UI and capturing actions. Forbidden from executing direct API calls or business validations.
*   **Data Storage Layer:** Accesses local mobile storage. Cannot depend on presentation logic or API interfaces.

---

## 3. Frontend & Mobile Project Structure

Both the Next.js web application and the React Native mobile app share a consistent feature-based layout:
*   `src/components/ui/`: Reusable, atomic UI components (buttons, input fields, badges).
*   `src/features/`: Isolated feature folders containing:
    *   `components/`: Feature-specific UI cards (e.g., `CartItemRow`).
    *   `hooks/`: Component state controllers (e.g., `usePOSCart`).
    *   `services/`: Endpoint API call scripts (e.g., `orderService.ts`).
    *   `screens/`: Top-level router view pages (e.g., `CheckoutScreen`).

---

## 4. Reusable Component Standards

*   **Responsibility:** Components must perform a single task. Keep methods short (under 60 lines).
*   **Props Design:** Props must be type-safe (TypeScript). Do not use the `any` keyword.
*   **Accessibility:** Components must include native accessibility labels (`accessibilityLabel` in mobile; `aria-label` in web).

---

## 5. State Management Strategy

We categorize application state to optimize re-renders:
*   **Local State (`useState`):** Used for micro UI state changes (e.g., modal visibility switches).
*   **Global State (Zustand):** Used for shared app state (e.g., selected branch context, active cashier shifts).
*   **Server State (React Query):** Manages API query cache states, auto-refresh triggers, and loading loaders.

---

## 6. Client API Integration Standards

*   **API Client Setup:** Use Axios instances with configured request/response interceptor chains.
*   **Authentication Interceptor:** Automatically appends the user's `Authorization: Bearer <token>` access token to outgoing request headers.
*   **Error Handling Interceptor:** Detects `401 Unauthorized` responses and triggers the refresh token routine. If it fails, redirects the user to the login screen.

---

## 7. Client-Side Authentication Flow

The client app executes a secure authentication cycle:

```
[ LOGIN VIEW ] ──► [ POST /LOGIN ] ──► [ JWT TO MEMORY ] ──► [ SECURE COOKIE SET ]
                                                                    │
                                                                    ▼
[ REDIRECT DASHBOARD ] ◄── [ ATTACH AUTH HEADERS ] ◄────────────────┘
```

*   **JWT Storage:** Access tokens are stored strictly in-memory (not in localStorage) to mitigate XSS risks.
*   **Session Refresh:** Access tokens are silently refreshed in the background using HttpOnly secure cookies before they expire.

---

## 8. UI/UX Implementation Standards

*   **Responsive layouts:** Enforce flexible layouts utilizing Tailwind utility grids.
*   **Empty & Error States:** Tables and checkout grids must render helpful empty views (e.g., "No inventory items found. Tap '+' to create one") and error blocks when fetches fail.
*   **Localization:** Enforce Khmer Unicode font rendering using **Koh Santepheap** paired with **Inter** for number layouts.

---

## 9. Client Performance Optimization

*   **Web Dashboards:** Use Next.js dynamic code splitting and image optimizations.
*   **Mobile POS Clients:** Avoid unnecessary re-renders in checkout grids by memoizing list items (`React.memo`) and lazy-loading product images.

---

## 10. Security Guidelines

*   **Input Validation:** Enforce form schema checks (e.g., using Yup or Zod) before submitting requests.
*   **Sensitive Data Protection:** Never store passwords or customer personal details in plaintext inside client caches.

---

## 11. Testing Standards

*   **Component Testing:** Write unit tests for custom React hooks and data parsers.
*   **E2E Integration Testing:** Execute Playwright user flow scripts (e.g., add to cart, trigger cash payment, verify receipt render).

---

## 12. Conclusion

This Frontend & Mobile Development Guideline Document defines the client architecture, directory layouts, state management strategies, and performance guidelines for client development. Enforcing these practices ensures client applications remain fast, secure, and maintainable.

Developers can now configure their workspace workspaces and begin coding.
