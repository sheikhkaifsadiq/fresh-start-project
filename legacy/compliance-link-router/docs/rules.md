# System Rules and Guidelines Document for Secure, Compliance-Shielded Link Routing SaaS Platform

## 1. Introduction

This document defines the strict rules, coding standards, and operational guidelines that must be adhered to by all engineering, security, and operations teams working on the secure, compliance-shielded link routing SaaS platform. These rules are designed to ensure the system meets its stringent security, performance, and compliance requirements (GDPR, CCPA, etc.).

## 2. Security Rules

### 2.1. Input Handling and Validation

*   **RULE-SEC-01 (Input Bound Controls):** All user inputs MUST be strictly validated against predefined maximum character limits at both the client (Frontend) and server (Backend API) levels.
    *   `slug`: Maximum 50 characters.
    *   `target URL`: Maximum 2048 characters.
    *   `title`: Maximum 100 characters.
    *   `description`: Maximum 250 characters.
    *   *Enforcement:* Use schema validation libraries (e.g., Zod, Joi) on the backend. Requests exceeding these limits MUST be rejected with a `400 Bad Request`.
*   **RULE-SEC-02 (Input Sanitization):** All user-supplied input MUST be sanitized to prevent Cross-Site Scripting (XSS) and SQL Injection (SQLi).
    *   *XSS:* Output encoding MUST be applied when rendering user data in the UI.
    *   *SQLi:* All database interactions MUST use parameterized queries or an ORM (like Prisma) that automatically parameterizes inputs. String concatenation for SQL queries is strictly forbidden.

### 2.2. File Uploads

*   **RULE-SEC-03 (Malicious File Upload Prevention):** Any feature allowing file uploads (e.g., to Supabase Storage) MUST enforce the following constraints:
    *   **Size Limit:** Maximum file size is strictly 2 MB.
    *   **MIME Type Restriction:** Only `image/png`, `image/jpeg`, and `image/webp` are permitted.
    *   **Storage Location:** Files MUST be stored in a private bucket path, preventing direct public access without authorization.
    *   **Execution Prevention:** The storage environment MUST be configured to prevent the execution of any uploaded scripts (execution layers killed).

### 2.3. Authentication and Authorization

*   **RULE-SEC-04 (Prebuilt Auth):** The platform MUST utilize Supabase Auth for identity management. Custom authentication implementations are prohibited.
*   **RULE-SEC-05 (JWT Validation):** Every request to a protected API endpoint MUST include a valid JSON Web Token (JWT) in the `Authorization` header. The backend MUST verify the token's signature, expiration, and claims before processing the request.
*   **RULE-SEC-06 (Row-Level Security):** All database tables containing tenant or user-specific data MUST have Row-Level Security (RLS) enabled and properly configured to ensure data isolation.

### 2.4. Dependency Management

*   **RULE-SEC-07 (Dependabot):** The project repository MUST maintain an active and correctly configured `.github/dependabot.yml` file to automate the scanning and updating of vulnerable dependencies across all package managers (npm, etc.).

## 3. Performance Rules

### 3.1. Edge Routing

*   **RULE-PERF-01 (Latency Budget):** The Edge Middleware routing logic, including ML inference and rule evaluation, MUST execute within a 30-millisecond budget globally.
*   **RULE-PERF-02 (Stateless Edge):** Edge functions MUST remain stateless. Any required state (e.g., routing rules, rate limit counters) MUST be fetched from a fast, globally distributed key-value store (e.g., Upstash Redis, Vercel KV).

### 3.2. Frontend Optimization

*   **RULE-PERF-03 (Client-Side Debouncing):** All search input fields that trigger API calls MUST implement a 300-millisecond client-side debounce mechanism to prevent excessive backend load.

## 4. Compliance Rules

### 4.1. Data Handling

*   **RULE-COMP-01 (Data Minimization):** Only data strictly necessary for the operation of the routing service and security auditing shall be collected and stored.
*   **RULE-COMP-02 (Encryption):** All sensitive data MUST be encrypted at rest (using Supabase's default encryption) and in transit (using TLS 1.2+).

### 4.2. Audit Logging

*   **RULE-COMP-03 (Comprehensive Auditing):** All administrative actions (creating/modifying links, changing rules) and security-sensitive events (failed logins, rate limit triggers) MUST be logged in the `audit_logs` table. Logs must include the user ID, timestamp, event type, and IP address.

## 5. Development and Deployment Rules

### 5.1. Code Quality

*   **RULE-DEV-01 (Testing):** All new features and bug fixes MUST be accompanied by unit and/or integration tests. A minimum code coverage of 80% is required for the backend API and Edge Middleware.
*   **RULE-DEV-02 (Code Review):** All code changes MUST undergo a peer review process via Pull Requests before being merged into the main branch.

### 5.2. API Design

*   **RULE-DEV-03 (Versioning):** All API endpoints MUST be versioned in the URL path (e.g., `/api/v1/...`). Breaking changes require a new API version.

### 5.3. ML Model Updates

*   **RULE-DEV-04 (Seamless Updates):** Updates to the ML Traffic Classifier model MUST be deployed using a blue/green or shadow deployment strategy to ensure zero downtime and allow for performance verification before full rollout.
