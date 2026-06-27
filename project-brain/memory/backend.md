# Backend Integration & Supabase Schema

## 7. Authentication

- Supabase Auth, email/password.
- Browser client: `src/lib/supabase/client.ts` (`createClient()`, singleton).
- Zustand store: `src/lib/stores/auth-store.ts` exposes the client + user/session state.
- `src/components/auth/AuthProvider.tsx` mounts once in `__root.tsx`, subscribes to `onAuthStateChange`, syncs to Zustand. Filters: `SIGNED_IN`, `TOKEN_REFRESHED`, `USER_UPDATED`, `SIGNED_OUT`, `INITIAL_SESSION`. **Do not add a second subscriber.**
- `_authenticated.tsx` is a manually authored gate (this is **not** a Lovable-Cloud-managed Supabase project). On sign-out: cancel queries → clear cache → `signOut()` → `navigate({to:'/auth', replace:true})`.
- Admin/service-role: `src/lib/supabase/admin.server.ts` — server-only, name guard. Never import from client modules.

---


## 8. Backend Integration

The backend is the existing external Supabase project from `legacy/`. Schema:
- `users` (Supabase Auth)
- `links` (slug, destination_url, ml_sensitivity, active, …)
- `redirect_rules` (geo/device/browser/language, priority, target_url)
- `audit_logs` (append-only, ml_features_json, bot_probability_score)
- `ml_models` (versioning)

Oracle ML engine (Python/FastAPI on private ARM box) is **out of scope** for this frontend repo — it lives in `legacy/oracle-ml-engine/` for reference only. The edge middleware that calls it is also legacy-only at the moment.
