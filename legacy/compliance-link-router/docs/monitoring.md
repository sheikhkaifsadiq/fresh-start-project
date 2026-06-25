# Monitoring and Operations Guide for Secure, Compliance-Shielded Link Routing SaaS Platform

## 1. Introduction

This document outlines the monitoring strategy, key metrics, and operational procedures required to maintain the health, performance, and security of the link routing platform. It ensures the system meets its Service Level Objectives (SLOs), specifically the 99.99% uptime (NFR-12) and sub-30ms latency (NFR-1).

## 2. Key Performance Indicators (KPIs) & Metrics

Monitoring is divided across the different architectural layers.

### 2.1. Edge Middleware (Vercel)

These metrics are critical for ensuring routing performance and traffic classification efficacy.

*   **Edge Request Latency (p50, p95, p99):** The time taken for the Edge function to execute. *Target: p95 < 30ms.*
*   **Edge Request Volume (RPS):** Total requests per second handled by the Edge.
*   **Edge Error Rate (4xx, 5xx):** Percentage of requests resulting in errors at the Edge.
*   **Rate Limit Triggers:** Number of requests blocked by the IP Leaky-Bucket rate limiter (FR-09). A sudden spike indicates a potential DDoS or scraping attack.
*   **ML Classification Distribution:** The distribution of bot probability scores (e.g., % scored > 0.8 vs % scored < 0.2).
*   **Fallback Heuristic Triggers:** How often the system falls back to deterministic rules instead of the ML model (FR-15). High numbers indicate ML model issues or Edge KV store latency.

### 2.2. Backend API (Node.js)

*   **API Request Latency:** Time taken to process management API requests (creating links, rules).
*   **API Error Rate:** Percentage of failed API requests.
*   **Authentication Failures:** Number of failed login attempts or invalid JWT rejections.

### 2.3. Database (Supabase PostgreSQL)

*   **Database CPU & Memory Usage:** Resource utilization of the PostgreSQL instance.
*   **Active Connections:** Number of active connections to the database. Must be monitored to prevent connection pool exhaustion.
*   **Query Latency:** Performance of common queries (e.g., fetching links for a user).
*   **Storage Usage:** Growth rate of the database and Supabase Storage buckets.

## 3. Monitoring Tools

*   **Vercel Analytics/Logs:** Used for monitoring Edge Middleware performance, request volumes, and Edge function execution logs.
*   **Supabase Dashboard/pg_stat_statements:** Used for monitoring database health, query performance, and connection metrics.
*   **Application Performance Monitoring (APM) (e.g., Datadog, New Relic):** Integrated into the Backend API to trace requests, monitor Node.js runtime metrics, and aggregate logs.
*   **Log Aggregation (e.g., ELK, Datadog):** Centralized repository for all application logs, Edge logs, and Audit Logs (NFR-10) for alerting and forensic analysis.

## 4. Alerting Strategy

Alerts must be configured to notify the operations team (via PagerDuty, Slack, etc.) when critical thresholds are breached.

| Alert Name | Condition | Severity | Action |
| :--- | :--- | :--- | :--- |
| **Edge Latency High** | Edge p95 latency > 40ms for 5 minutes. | High | Investigate Edge KV store performance or ML model execution time. |
| **High Error Rate (Edge)** | Edge 5xx errors > 1% for 5 minutes. | Critical | Check Vercel status, verify Edge function deployments. |
| **Database CPU High** | Supabase DB CPU > 80% for 10 minutes. | High | Check for inefficient queries, consider scaling database tier. |
| **Rate Limit Spike** | Rate limit blocks increase by 500% over baseline. | Medium | Monitor for potential DDoS; verify rate limit configurations are not too aggressive. |
| **Audit Log Failure** | Backend fails to write to `audit_logs` table. | High | Investigate database connectivity; compliance risk. |

## 5. Incident Response & Disaster Recovery

### 5.1. Incident Response Plan

1.  **Detection:** Alert triggered by monitoring systems.
2.  **Triage:** On-call engineer acknowledges the alert and assesses severity.
3.  **Mitigation:** Apply immediate fixes (e.g., rollback a bad deployment, block a specific attacking IP range).
4.  **Resolution:** Identify and fix the root cause.
5.  **Post-Mortem:** Document the incident, root cause, and steps taken to prevent recurrence.

### 5.2. Disaster Recovery (NFR-13)

*   **RTO (Recovery Time Objective):** 4 hours.
*   **RPO (Recovery Point Objective):** 1 hour.
*   **Procedure:**
    *   Supabase provides automated daily backups and Point-in-Time Recovery (PITR).
    *   In the event of a catastrophic database failure, the operations team will initiate a restore from the latest PITR snapshot via the Supabase console or CLI.
    *   Infrastructure as Code (IaC) should be used to quickly spin up replacement backend API instances if the primary hosting environment fails.
