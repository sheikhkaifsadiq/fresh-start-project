# Application Flow Document for Secure, Compliance-Shielded Link Routing SaaS Platform

## 1. Introduction

This document outlines the primary application flows for the secure, compliance-shielded link routing SaaS platform. It details the step-by-step processes for key user interactions and system operations, providing a clear understanding of how data moves through the system and how different components interact.

## 2. User Authentication Flow

This flow describes how a user authenticates with the platform to access the dashboard and API.

1.  **User Action:** The user navigates to the login page and enters their email and password.
2.  **Frontend Request:** The Next.js frontend sends a `POST` request to the `/api/v1/auth/login` endpoint with the credentials.
3.  **Backend Processing:**
    *   The Node.js backend receives the request.
    *   It forwards the credentials to Supabase Auth for verification.
4.  **Supabase Auth:** Supabase Auth verifies the credentials against the stored password hash.
5.  **Response Generation:**
    *   *Success:* Supabase Auth returns a session object containing a JWT. The backend forwards this JWT to the frontend.
    *   *Failure:* Supabase Auth returns an error. The backend returns a `401 Unauthorized` response to the frontend.
6.  **Frontend Action:**
    *   *Success:* The frontend stores the JWT securely (e.g., in an HttpOnly cookie or local storage) and redirects the user to the dashboard.
    *   *Failure:* The frontend displays an error message to the user.

## 3. Link Creation Flow

This flow describes how an authenticated administrator creates a new routing link.

1.  **User Action:** The administrator clicks "Create Link" on the dashboard, fills out the form (slug, target URL, description), and submits it.
2.  **Frontend Validation:** The frontend performs basic validation (e.g., required fields, format).
3.  **Frontend Request:** The frontend sends a `POST` request to `/api/v1/links` with the link data and the JWT in the `Authorization` header.
4.  **Backend Processing:**
    *   **Authentication:** The backend verifies the JWT using Supabase Auth.
    *   **Input Validation (NFR-5):** The backend validates the input against strict bound controls (e.g., slug max 50 chars, target URL max 2048 chars).
    *   **Sanitization (NFR-6):** The backend sanitizes the input to prevent XSS and SQLi.
5.  **Database Operation:** The backend executes an `INSERT` query into the `links` table in Supabase PostgreSQL, using parameterized queries.
6.  **Row-Level Security (RLS):** Supabase PostgreSQL evaluates the RLS policies to ensure the user has permission to insert the record.
7.  **Response Generation:**
    *   *Success:* The database confirms the insertion. The backend returns a `201 Created` response with the new link details.
    *   *Failure:* The database returns an error (e.g., slug already exists). The backend returns a `400 Bad Request` or `500 Internal Server Error` response.
8.  **Frontend Action:** The frontend updates the UI to display the newly created link or shows an error message.

## 4. Traffic Routing and Classification Flow (Edge Middleware)

This is the critical path for handling incoming traffic to a routed link. It must execute within 30 milliseconds (NFR-1).

1.  **Incoming Request:** A user clicks a link (e.g., `https://route.example.com/promo1`). The request hits the globally distributed CDN.
2.  **Edge Middleware Interception:** The Vercel Edge Middleware intercepts the request.
3.  **Rate Limiting (FR-09):**
    *   The middleware checks the requester's IP address against the leaky-bucket rate limiting mechanism (e.g., using Vercel KV or Upstash Redis).
    *   *If limit exceeded:* The middleware immediately returns a `429 Too Many Requests` response.
4.  **Feature Extraction (FR-12):** The middleware extracts relevant features from the request:
    *   IP address
    *   HTTP Headers (User-Agent, Accept-Language, etc.)
    *   Connection timing data (if available at the Edge)
5.  **ML Traffic Classification (FR-11, FR-14):**
    *   The middleware passes the extracted features to the lightweight ML Neural Network model loaded in memory.
    *   The model returns a bot probability score (0.0 to 1.0).
6.  **Fallback Heuristics (FR-15):**
    *   If the ML model is unavailable or returns an uncertain score, the middleware applies deterministic fallback rules (e.g., checking against known bad IP lists).
7.  **Link Configuration Lookup:**
    *   The middleware queries a fast Edge data store (e.g., Vercel KV) for the routing configuration associated with the requested slug (`promo1`).
    *   *If not found:* The middleware returns a `404 Not Found` response.
8.  **Rule Evaluation (FR-08):**
    *   The middleware evaluates the redirect rules defined for the link, considering the ML score, user's geolocation, device type, etc.
    *   It selects the target URL from the highest-priority matching rule. If no rules match, it selects the default target URL.
9.  **Redirection:** The middleware returns a `301 Moved Permanently` or `302 Found` response, redirecting the user to the selected target URL.

## 5. Secure File Upload Flow (Malicious File Upload Prevention)

This flow describes the process of uploading an asset (e.g., a custom logo for a link preview) while enforcing security constraints (NFR-4).

1.  **User Action:** The administrator selects an image file to upload via the dashboard.
2.  **Frontend Request:** The frontend sends a `POST` request to a specific backend endpoint (e.g., `/api/v1/assets/upload`) with the file data and JWT.
3.  **Backend Processing:**
    *   **Authentication:** The backend verifies the JWT.
    *   **Size Validation:** The backend checks the file size. If it exceeds 2 MB, it rejects the request (`400 Bad Request`).
    *   **MIME Type Validation:** The backend checks the file's MIME type. If it is not `image/png`, `image/jpeg`, or `image/webp`, it rejects the request (`400 Bad Request`).
4.  **Supabase Storage Interaction:**
    *   The backend initiates an upload to a designated *private* bucket in Supabase Storage.
    *   Supabase Storage policies are configured to prevent execution of any scripts within this bucket.
5.  **Response Generation:**
    *   *Success:* Supabase confirms the upload. The backend returns a `200 OK` response with the asset's internal reference ID.
    *   *Failure:* Supabase returns an error. The backend returns a `500 Internal Server Error`.

## 6. Audit Logging Flow

This flow describes how administrative actions are recorded for compliance purposes (NFR-10).

1.  **Trigger Event:** An administrative action occurs (e.g., a link is deleted via the `DELETE /api/v1/links/:id` endpoint).
2.  **Action Execution:** The backend performs the requested action (deleting the link from the database).
3.  **Log Generation:** The backend constructs an audit log entry containing:
    *   `user_id` of the administrator performing the action.
    *   `event_type` (e.g., 'link_deleted').
    *   `details` (JSON object containing the ID of the deleted link).
    *   `ip_address` of the requester.
4.  **Database Operation:** The backend executes an `INSERT` query into the `audit_logs` table in Supabase PostgreSQL.
5.  **Completion:** The primary action's response is returned to the user. The audit logging process should ideally be asynchronous or non-blocking to avoid impacting the performance of the primary action.
