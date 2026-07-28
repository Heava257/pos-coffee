# SYSTEM DESIGN SPECIFICATION
## PART 4 — API DESIGN

**Project Name:** Enterprise SaaS Business Management Platform  
**Document Version:** 1.0.0  
**Date:** July 11, 2026  
**Author:** Principal API Architect, Backend Architect & Integration Architect  
**Status:** Under Review  

---

## 1. API Architecture Overview

### 1.1 API Architecture Style Selection
To support multi-client interactions (Web Admin portals, mobile tablet POS apps) and ensure integration compatibility, the platform uses a **REST (Representational State Transfer) API** architectural style. 
*   **Suitability:** REST over HTTPS provides a stateless, standard interface that simplifies caching, testing, and integration with third-party systems like local payment gateways.
*   **gRPC Consideration:** gRPC is reserved for high-performance internal communication between modules if they are decomposed into microservices in the future.
*   **WebSockets:** WebSockets are used specifically for real-time kitchen display screens and live cashier register synchronization.

### 1.2 Versioning & Security Strategy
*   **Versioning:** URI versioning is enforced for all public endpoints (e.g., `/api/v1/`). This guarantees that client applications do not break when backend schemas are updated.
*   **Security:** All connections require TLS 1.3. Stateless JWT tokens are passed via the standard `Authorization: Bearer <token>` header to manage authentication.

---

## 2. API Layer Architecture

Requests flow through a series of structured middleware and application layers:

```
[ CLIENT APPLICATION ] (Web Browser / Tablet POS)
         │
         ▼
[ API GATEWAY / LOAD BALANCER ] (Rate Limiting, CORS verification, SSL termination)
         │
         ▼
[ AUTHENTICATION MIDDLEWARE ] (Validates JWT tokens and extracts tenant contexts)
         │
         ▼
[ CONTROLLER LAYER ] (Validates DTO payloads and maps URLs to handler functions)
         │
         ▼
[ SERVICE LAYER ] (Executes application logic, manages transactions)
         │
         ▼
[ DATABASE / EXTERNAL SERVICE ] (Queries SQL tables or executes REST calls)
```

*   **API Gateway:** Manages SSL termination, CORS policies, and rate limits to block malicious traffic.
*   **Authentication Middleware:** Validates JWT signatures and sets the global `tenant_id` context.
*   **Controller Layer:** Validates HTTP request payloads, maps paths to handlers, and returns standardized JSON outputs.
*   **Service Layer:** Executes domain workflows, coordinates transactions, and enforces business rules.

---

## 3. API Module Organization

### 3.1 Authentication & IAM API
*   **Purpose:** Manages login, registration, password resets, and token refreshes.
*   **Related Use Cases:** UC-001 (Register Account), UC-002 (Authenticate User).
*   **Main Operations:** `login`, `register`, `refreshToken`, `logout`.
*   **Security Requirements:** None for login/register; verification tokens required for refresh and logout.

### 3.2 POS Transactions API
*   **Purpose:** Processes in-store orders, calculates taxes, and records payments.
*   **Related Use Cases:** UC-008 (Create POS Order), UC-009 (Process Payment).
*   **Main Operations:** `createOrder`, `processPayment`, `listOrders`.
*   **Security Requirements:** Valid JWT with `pos:checkout` permissions.

---

## 4. API Endpoint Design

### API-AUTH-01: Authenticate User
*   **HTTP Method:** `POST`
*   **URL Path:** `/api/v1/auth/login`
*   **Purpose:** Authenticates user credentials and issues a session token.
*   **Actor:** System User (Admin, Manager, Cashier).
*   **Authentication Required:** No.
*   **Request Body (JSON):**
    ```json
    {
      "email": "cashier@bakery.com",
      "password": "Password123!"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Authentication successful",
      "data": {
        "accessToken": "eyJhbGciOi...",
        "refreshToken": "rfr_987654",
        "expiresIn": 3600
      },
      "timestamp": "2026-07-11T22:36:27Z"
    }
    ```
*   **Validation Rules:** `email` must be a valid format. `password` must not be empty.
*   **Error Cases:** 
    *   `401 Unauthorized` for invalid credentials.
    *   `429 Too Many Requests` if rate limits are exceeded.

### API-POS-01: Create POS Order
*   **HTTP Method:** `POST`
*   **URL Path:** `/api/v1/pos/orders`
*   **Purpose:** Creates a new POS order and updates stock levels.
*   **Actor:** Cashier, Store Manager.
*   **Authentication Required:** Yes (JWT Bearer Token).
*   **Request Body (JSON):**
    ```json
    {
      "branchId": "b1b2b3b4-5555-6666-7777-888888888888",
      "items": [
        {
          "productId": "p1p2p3p4-1111-2222-3333-444444444444",
          "quantity": 2,
          "unitPrice": 3.50
        }
      ],
      "paymentMethod": "KHQR"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Order created successfully",
      "data": {
        "orderId": "o9o9o9o9-0000-1111-2222-333333333333",
        "invoiceNumber": "INV-2026-00041",
        "totalAmount": 7.70,
        "status": "COMPLETED"
      },
      "timestamp": "2026-07-11T22:36:27Z"
    }
    ```
*   **Validation Rules:** `branchId` must be a valid UUID. `items` array must contain at least one item. Quantities must be positive integers.

---

## 5. API Resource Design

*   **Resource `Order`:**
    *   *Description:* Represents a transaction invoice.
    *   *Operations:* Create (`POST /pos/orders`), Read (`GET /pos/orders/{id}`), Search/Filter (`GET /pos/orders?branchId=...`).
*   **Resource `Product`:**
    *   *Description:* Catalog items.
    *   *Operations:* Create (`POST /products`), Read (`GET /products/{id}`), Update (`PUT /products/{id}`), Delete (`DELETE /products/{id}`).
*   **Relationships:** Sub-resources follow nested routes: `GET /pos/orders/{id}/payments`.

---

## 6. Authentication & Authorization API Design

### 6.1 JWT Strategy & Token Refresh
1.  **Access Token:** Short-lived JWT (valid for 15 minutes) containing the user’s ID, tenant ID, and permissions array.
2.  **Refresh Token:** Long-lived random string (valid for 7 days) stored securely in HTTP-only, secure, SameSite cookies.
3.  **Rotation:** Every token refresh requests generates a new access token and rotates the refresh token to prevent replay attacks.

```
[ Client ] ──( Credentials )──> [ Auth Controller ] ──( Generate Access & Refresh )──> [ Cookie / Response ]
                                                                                            │
                                                                                            ▼
[ Protected API ] <──( Access Token )── [ Client ] <──( Rotated Tokens )── [ Refresh API ] <── ( Cookie )
```

### 6.2 Role-Based Access Control (RBAC)
Endpoints are annotated with required permissions. The auth middleware decodes the JWT and validates that the permissions array contains the required resource actions before routing the request.

---

## 7. API Request & Response Standards

### 7.1 Standard Request Headers
*   `Authorization: Bearer <JWT_Token>`
*   `Content-Type: application/json`
*   `X-Correlation-ID: <UUID>` (For tracing requests across services)

### 7.2 Standard Response Format
```json
{
  "status": "success | error",
  "message": "Human-readable status summary",
  "data": {},
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 120
  },
  "timestamp": "2026-07-11T22:36:27Z"
}
```

---

## 8. API Error Handling Design

Errors use standard HTTP status codes and return detailed error responses:

```json
{
  "status": "error",
  "message": "Invalid request parameters",
  "error": {
    "code": "VALIDATION_FAILED",
    "details": [
      {
        "field": "items[0].quantity",
        "issue": "Quantity must be greater than zero"
      }
    ]
  },
  "timestamp": "2026-07-11T22:36:27Z"
}
```

### Error Classifications
*   `VALIDATION_FAILED` (400 Bad Request)
*   `UNAUTHORIZED` (401 Unauthorized)
*   `FORBIDDEN` (403 Forbidden)
*   `RESOURCE_NOT_FOUND` (404 Not Found)
*   `RATE_LIMIT_EXCEEDED` (429 Too Many Requests)
*   `INTERNAL_ERROR` (500 Internal Server Error)

---

## 9. API Security Design

*   **Rate Limiting:** Enforce a limit of 100 requests per minute per IP address for standard API routes, and 10 requests per minute per IP for authentication routes (`/auth/login`).
*   **Input Validation:** Enforce strict JSON schema validations on all controllers before executing services.
*   **CORS Policy:** Restrict cross-origin resource sharing to whitelisted subdomains configured for each tenant (e.g., `tenant-name.platform.com`).

---

## 10. External API Integration Design

### 10.1 Payment Gateway (Stripe / Local Banks)
*   **Purpose:** Processes subscription payments and POS card checkouts.
*   **API Communication:** HTTPS REST API, JSON payloads.
*   **Authentication:** Bearer token with a private API key.
*   **Failure Handling:** If requests fail due to network timeouts, retry up to 3 times using exponential backoff before returning an error to the client.

### 10.2 SMS Provider (Twilio)
*   **Purpose:** Delivers two-factor authentication PINs and digital receipt links.
*   **API Communication:** HTTPS POST using URL-encoded payloads.
*   **Authentication:** Basic Auth using Account SID and Auth Token.
*   **Failure Handling:** Queue failed messages in the database and retry delivery asynchronously.

---

## 11. Real-Time Communication Design

The system uses WebSockets to support real-time operations like kitchen order notifications:

```
[ POS Terminal ] ──( Create Order )──> [ Backend API ]
                                            │
                                            ▼ (Publish Event)
[ Kitchen Screen ] <──( WebSocket Msg )── [ Redis Pub/Sub ]
```

*   **Heartbeat Policy:** Clients must send a ping frame every 30 seconds. If a ping is missed within 60 seconds, the server drops the connection to free resources.

---

## 12. API Documentation Strategy

*   **OpenAPI Specification:** Maintain API specifications in OpenAPI 3.0 YAML format (e.g., `swagger.yaml`).
*   **Interactive Documentation:** Deploy Swagger UI or ReDoc within the developer portal. This gives frontend and mobile developers access to interactive sandboxes for testing API endpoints.

---

## 13. API Traceability Matrix

| Requirement | Use Case | API Module | HTTP Endpoint | Backend Component |
| :--- | :--- | :--- | :--- | :--- |
| **FR-AUTH-001** | UC-002: Login | Auth API | `POST /api/v1/auth/login` | `LoginController` |
| **FR-POS-ORD-001**| UC-008: Create Order | POS API | `POST /api/v1/pos/orders` | `POSOrderController` |
| **FR-POS-PAY-001**| UC-009: Payment | POS API | `POST /api/v1/pos/orders/{id}/payments` | `PaymentController` |
| **FR-INV-MON-001**| UC-011: Check Stock | Inventory API | `GET /api/v1/inventory/items` | `InventoryController` |

---

## 14. Conclusion

This API Design Document establishes the endpoints, payload formats, error responses, and security policies required for client-server interaction. By using stateless REST routes, secure HTTP cookies, and structured error responses, we ensure that both backend and client developers can build their respective platforms independently.

Developers can now proceed to route implementation, client app integration, and environment configuration.
