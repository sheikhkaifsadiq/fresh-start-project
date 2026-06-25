# Compliance Document for Secure, Compliance-Shielded Link Routing SaaS Platform

## 1. Introduction

This document outlines the compliance strategy and specific measures implemented within the secure, compliance-shielded link routing SaaS platform to adhere to major data privacy and security regulations, primarily focusing on GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act).

## 2. General Compliance Posture

The platform is designed with a "privacy-by-design" and "security-by-design" philosophy. By minimizing data collection, enforcing strict access controls, and maintaining comprehensive audit trails, the system aims to simplify compliance for both the platform operators and the enterprise customers utilizing the service.

## 3. GDPR (General Data Protection Regulation) Compliance

The platform acts primarily as a Data Processor on behalf of its customers (the Data Controllers). The following measures ensure GDPR compliance:

### 3.1. Data Minimization (Article 5)

*   **Implementation:** The platform collects only the minimum data necessary for routing traffic and identifying malicious bots. For end-users clicking links, this typically includes IP addresses and HTTP headers (User-Agent). This data is used transiently at the Edge for classification and routing.
*   **Action:** We do not store personally identifiable information (PII) of the end-users clicking the links beyond aggregated, anonymized analytics or short-lived security logs necessary for threat mitigation.

### 3.2. Lawfulness of Processing (Article 6)

*   **Implementation:** Processing of end-user data (IP, headers) for security purposes (bot detection, rate limiting) is conducted under the lawful basis of "Legitimate Interests" (Article 6(1)(f)), as it is strictly necessary to protect the platform and customer assets from malicious activity.

### 3.3. Data Subject Rights (Articles 15-22)

While the platform holds minimal end-user PII, it holds PII for the platform's administrative users (customers).

*   **Right to Access & Portability:** Administrators can access and export their account data and routing configurations via the dashboard and API.
*   **Right to Erasure (Right to be Forgotten):** Administrators can delete their accounts, which triggers a cascading deletion of their links, rules, and associated data from the active database. Backups are purged according to a defined retention schedule (e.g., 30 days).

### 3.4. Security of Processing (Article 32)

*   **Implementation:** The platform employs robust security measures, including:
    *   Encryption at rest (Supabase PostgreSQL) and in transit (TLS 1.2+).
    *   Row-Level Security (RLS) to ensure data isolation between tenants.
    *   Strict input validation and sanitization to prevent injection attacks.
    *   Malicious file upload prevention mechanisms.

### 3.5. Data Protection Impact Assessment (DPIA) (Article 35)

*   **Action:** A DPIA has been conducted specifically focusing on the Machine Learning traffic classification engine to ensure that the profiling of traffic does not result in discriminatory or legally significant effects on human users, and that the fallback heuristics are fair and transparent.

## 4. CCPA (California Consumer Privacy Act) Compliance

The platform supports CCPA compliance through similar mechanisms as GDPR, focusing on transparency and consumer rights.

### 4.1. Right to Know and Access

*   **Implementation:** The platform provides mechanisms for administrative users to access the specific pieces of personal information collected about them.

### 4.2. Right to Delete

*   **Implementation:** Account deletion processes ensure the removal of personal information from active systems, subject to exceptions allowed by CCPA (e.g., retaining audit logs for security incidents).

### 4.3. Do Not Sell My Personal Information

*   **Implementation:** The platform **does not sell** personal information of its users or the end-users traversing the routing network. Therefore, an explicit opt-out mechanism for the sale of data is not required, but this stance is clearly stated in the Privacy Policy.

## 5. Audit and Accountability

### 5.1. Comprehensive Audit Logging (NFR-10)

*   **Implementation:** To demonstrate compliance and facilitate security investigations, the platform maintains a tamper-evident `audit_logs` table.
*   **Scope:** This logs all administrative actions (e.g., user login, link creation, rule modification) and security events (e.g., rate limit exceeded, suspicious file upload attempt).
*   **Retention:** Audit logs are retained for a period defined by compliance requirements (e.g., 1 year) and are accessible only to authorized administrative personnel.

## 6. Third-Party Sub-processors

The platform utilizes the following key sub-processors. Data Processing Agreements (DPAs) or standard contractual clauses are maintained with each:

*   **Vercel:** For Edge Middleware execution and Frontend hosting.
*   **Supabase:** For PostgreSQL database hosting, Authentication, and Storage.
*   **Upstash (or similar):** For distributed Redis/KV store used in rate limiting.

## 7. Continuous Compliance

Compliance is not a one-time setup. The platform incorporates automated tools to maintain its posture:

*   **Dependabot (NFR-8):** Automated scanning of dependencies ensures that known vulnerabilities in third-party libraries are identified and patched promptly, maintaining the security of processing.
*   **Regular Audits:** The system architecture and security controls are subject to periodic internal reviews and external penetration testing.
