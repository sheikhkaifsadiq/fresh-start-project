# System Overview

## 1. Product

AegisRoute is an enterprise URL routing + analytics + threat-detection SaaS. The shipped surface is two distinct experiences in one app:

1. **Public landing page** (`/`) — a single-route editorial/cinematic scroll that sells the product. The bar set by the user is Igloo Inc / Active Theory / Basic Dept tier motion. "Information in motion", not decoration.
2. **Authenticated application** (`/_authenticated/*`) — the dashboard/product surface (Links, Rules, Analytics, Security, ML Engine, Audit Logs, Settings, Docs).

Legacy Next.js implementation lives under `legacy/` and is the source of truth for **business logic and backend contracts**. The current TanStack Start app is a **frontend re-presentation** of that logic, not a port of UI.

---


- Active modules scanned: 526
