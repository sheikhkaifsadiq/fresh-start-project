# Security Architecture Document for Secure, Compliance-Shielded Link Routing SaaS Platform

## 1. Introduction

This document details the security architecture and specific controls implemented within the secure, compliance-shielded link routing SaaS platform. Security is a foundational pillar of this system, designed to protect against malicious traffic, unauthorized access, and data breaches, while ensuring high availability and compliance.

## 2. Threat Model & Mitigation Strategy

The platform faces several primary threats, which are mitigated through a multi-layered defense-in-depth approach.

| Threat | Description | Primary Mitigation | Secondary Mitigation |
| :--- | :--- | :--- | :--- |
| **DDoS Attacks** | Volumetric attacks aiming to exhaust resources. | Edge-level IP Leaky-Bucket Rate Limiting (FR-09). | CDN infrastructure (Vercel) inherent DDoS protection. |
| **Malicious Bots/Scrapers** | Automated scripts attempting to scrape content or abuse routing. | ML Traffic Classifier Engine (FR-11) at the Edge. | Fallback Heuristics (FR-15) and Rate Limiting. |
| **Injection Attacks (SQLi, XSS)** | Malicious payloads injected through user inputs. | Strict Input Bound Controls (NFR-5) and Input Sanitization (NFR-6). | Parameterized queries (Prisma/Supabase) and React's auto-escaping. |
| **Unauthorized Access** | Attackers gaining access to administrative functions or other users' data. | Supabase Auth JWT validation (NFR-7). | Row-Level Security (RLS) in PostgreSQL (FR-18). |
| **Malicious File Uploads** | Uploading executable scripts or oversized files to compromise storage or execute code. | Malicious File Upload Prevention (NFR-4): 2MB limit, strict MIME checking, private buckets. | Storage layer execution prevention. |
| **Supply Chain Attacks** | Vulnerabilities introduced via third-party dependencies. | Automated Dependabot configuration (NFR-8). | Regular security audits. |

## 3. Detailed Security Controls

### 3.1. Edge Security (Vercel Middleware)

The Edge Middleware acts as the first line of defense, intercepting all traffic before it reaches the backend or database.

*   **IP Leaky-Bucket Rate Limiting (FR-09):** Implemented using a distributed key-value store (e.g., Upstash Redis). It tracks request rates per IP address. If an IP exceeds the defined threshold (bucket capacity and leak rate), subsequent requests are immediately dropped with a `429 Too Many Requests` status, protecting backend resources.
*   **ML Traffic Classification (FR-11):** A lightweight neural network analyzes request features (headers, timing, TCP/IP fingerprints) in real-time (<30ms). Traffic scoring high for bot probability is routed according to specific rules (e.g., blocked, challenged, or routed to a honeypot) rather than the intended destination.
*   **Header Inspection (FR-10):** The middleware inspects HTTP headers to identify anomalous or known-malicious patterns, feeding this data into the ML model and fallback heuristics.

### 3.2. Application Security (Backend API & Frontend)

*   **Input Bound Controls (NFR-5):** The API strictly enforces maximum character limits on all inputs (e.g., `slug` <= 50 chars, `target URL` <= 2048 chars). This prevents buffer overflow vulnerabilities and limits the payload size for potential injection attacks. Implemented using schema validation libraries like Zod.
*   **Input Sanitization (NFR-6):**
    *   **XSS Prevention:** All user-supplied data is treated as untrusted. The frontend framework (Next.js/React) automatically escapes data rendered in the DOM. The backend further sanitizes inputs before storage if they are intended for raw HTML rendering.
    *   **SQLi Neutralization:** The backend interacts with the Supabase PostgreSQL database exclusively through parameterized queries or an ORM that handles parameterization. Direct string concatenation for SQL queries is strictly prohibited.
*   **Malicious File Upload Prevention (NFR-4):**
    *   Uploads are restricted to a maximum of 2 MB.
    *   Validation is locked to specific, safe MIME formats (`image/png`, `image/jpeg`, `image/webp`).
    *   Files are stored in a secure, private bucket path within Supabase Storage.
    *   The storage configuration explicitly prevents the execution of any uploaded content (execution layers killed).

### 3.3. Data & Infrastructure Security (Supabase)

*   **Prebuilt Auth & Authorization (NFR-7):** The platform leverages Supabase Auth. Upon successful login, users receive a JSON Web Token (JWT). Every request to a protected API endpoint must include this JWT. The backend cryptographically verifies the token's signature and expiration before granting access.
*   **Row-Level Security (RLS) (FR-18):** RLS is enabled on all sensitive database tables (`users`, `links`, `redirect_rules`). Policies are defined such that a user's JWT identity is evaluated at the database level, ensuring they can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` rows that belong to their organization or user ID. This provides a robust defense against broken access control vulnerabilities.
*   **Data Encryption (NFR-9):**
    *   **At Rest:** All data stored in the Supabase PostgreSQL database and Storage buckets is encrypted at rest using industry-standard AES-256 encryption.
    *   **In Transit:** All communication between the client, Edge Middleware, Backend API, and Database is encrypted using TLS 1.2 or higher.

### 3.4. Operational Security

*   **Dependabot Configuration (NFR-8):** A `.github/dependabot.yml` file is configured in the repository to continuously monitor all package managers (npm, etc.) for known vulnerabilities. It automatically generates pull requests to update vulnerable dependencies, mitigating supply chain risks.
*   **Audit Logging (NFR-10):** A comprehensive audit trail is maintained in the `audit_logs` table. It records all administrative actions (e.g., creating links, modifying rules) and security-sensitive events (e.g., failed logins, rate limit triggers), including the user ID, timestamp, event type, and IP address. This is crucial for incident response and compliance reporting.
