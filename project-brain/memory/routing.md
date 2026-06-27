# File-Based Routing and Navigation

## 6. Routing

File-based. Conventions in `<tanstack-route-architecture>` apply.

- `/` public landing (SSR on)
- `/auth` public sign-in/sign-up
- `/_authenticated/*` gated subtree. The `_authenticated.tsx` layout checks Supabase session client-side and redirects to `/auth` if absent. **Do not author a competing gate elsewhere.**
- Server routes: `/api/v1/auth/*`, `/api/v1/links/*`.
- `/sitemap.xml` via `sitemap[.]xml.ts`.

Navigate with `<Link to=... params=...>` from `@tanstack/react-router`. Never `<a href>` for internal routes.

---


## Active Route Map
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/__root.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/auth.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/index.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/sitemap[.]xml.ts)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/analytics.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/audit-logs.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/dashboard.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/docs.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/links.$id.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/links.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/ml-engine.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/rules.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/security.tsx)
- [Route](file://C:\Users\Sheikhkaifsadiq\Desktop\Aegis Route/src/routes/_authenticated/settings.tsx)