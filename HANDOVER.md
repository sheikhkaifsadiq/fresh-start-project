# AegisRoute — Engineering Handover

Audience: senior engineer picking this up cold. No prior chat access. Read top-to-bottom before touching code.

---

## 1. Product

AegisRoute is an enterprise URL routing + analytics + threat-detection SaaS. The shipped surface is two distinct experiences in one app:

1. **Public landing page** (`/`) — a single-route editorial/cinematic scroll that sells the product. The bar set by the user is Igloo Inc / Active Theory / Basic Dept tier motion. "Information in motion", not decoration.
2. **Authenticated application** (`/_authenticated/*`) — the dashboard/product surface (Links, Rules, Analytics, Security, ML Engine, Audit Logs, Settings, Docs).

Legacy Next.js implementation lives under `legacy/` and is the source of truth for **business logic and backend contracts**. The current TanStack Start app is a **frontend re-presentation** of that logic, not a port of UI.

---

## 2. Architecture

- **Framework**: TanStack Start v1 (React 19, Vite 7, SSR/SSG capable, Cloudflare Worker target with `nodejs_compat`).
- **Styling**: Tailwind CSS v4 via `src/styles.css` (`@import "tailwindcss"`, `@theme`, native CSS — no `tailwind.config.js`).
- **Router**: File-based routing in `src/routes/`. `routeTree.gen.ts` is generated — never hand-edit.
- **State**: Zustand for auth (`src/lib/stores/auth-store.ts`). TanStack Query is available but the landing page does not rely on it.
- **Animation**: Framer Motion + custom scroll/frame bus (no GSAP, no Lenis ScrollTrigger; Lenis is used for smooth scroll only).
- **Backend**: Supabase (already wired via legacy schema). Lovable Cloud is **NOT** enabled — the user explicitly forbade it. Use the existing external Supabase project.
- **Server runtime**: Cloudflare Worker (workerd) — no child_process, no native bindings, see `<server-runtime>` constraints.

---

## 3. Repository Structure

```
src/
  routes/
    __root.tsx                  Root layout: head, providers, Preloader gate, Nav, Outlet
    index.tsx                   Public landing (cinematic scroll)
    auth.tsx                    Public sign-in / sign-up
    _authenticated.tsx          Pathless layout: gate -> redirect to /auth if no session
    _authenticated/
      dashboard.tsx
      links.tsx                 Links manager (table + create panel)
      links.$id.tsx             Link detail
      rules.tsx                 Rule Builder (routing rules)
      analytics.tsx
      security.tsx
      ml-engine.tsx
      audit-logs.tsx
      settings.tsx
      docs.tsx
    api/v1/
      auth/{login,logout,me,signup}.ts
      links/{index,$id,check-slug}.ts
    sitemap[.]xml.ts            /sitemap.xml
  components/
    site/                       Landing-page motion components (see §10)
    app/AppShell.tsx            Authenticated chrome: sidebar, header, mobile drawer
    links/                      Links domain UI (LinksManager, LinksTable, CreateLinkPanel, RuleBuilder, types)
    ui/                         shadcn primitives (do not restyle in place; compose)
    auth/AuthProvider.tsx       Mounts at root, syncs Supabase session -> Zustand
  lib/
    motion.tsx                  MotionProvider, Kinetic, Mask, Reveal helpers, useElementProgress
    stage.tsx                   Frame bus: useStage (scroll progress + velocity, RAF-driven)
    scroll-progress.tsx         Lenis bootstrap + global scroll progress, exposes lenis.stop/start
    mobile-scroll-owner.ts      Mobile-only scroll interception (pin + delta -> local progress)
    physics.ts                  Shared spring constants (stiffness, damping, mass)
    token.tsx                   HandoffToken context (canonical RequestToken across sections)
    schemas.ts                  Zod schemas (link, rule, auth)
    env.ts                      resolvePublicSupabaseUrl / Key
    stores/auth-store.ts        Zustand auth store + Supabase browser client export
    supabase/
      client.ts                 createClient() — browser, singleton
      admin.server.ts           Service-role client (server-only, *.server.ts guard)
    audit-logger.server.ts      Server-only audit writes
    utils.ts                    cn() etc.
  styles.css                    Design system + responsive primitives (single CSS file)
  router.tsx, start.ts, server.ts, routeTree.gen.ts
legacy/                         Read-only reference: Next.js source of truth for business logic, Oracle ML engine, Supabase migrations
public/                         robots.txt, llms.txt
```

`src/pages/` does not exist and must not be created (Next/Remix convention, not TanStack).

---

## 4. Design System

All tokens are CSS custom properties in `src/styles.css`, exposed to Tailwind via `@theme inline`. **Never hardcode colors** (`text-white`, `bg-[#fff]`) in components — always semantic tokens.

### 4.1 Aesthetic
Editorial / "paper and graphite". The reference axis the user set is:
- 70% Igloo Inc (editorial scroll choreography)
- 15% Buttermax (warmth, restraint)
- 10% Getty (typographic gravity)
- 5% Apple (precision)

**Forbidden** (explicitly rejected, do not re-introduce):
- Generic AI landing tropes: purple/indigo gradients, glassmorphism on dark, floating monoliths.
- Anime/cyberpunk neon (the legacy Next.js style — gone on purpose).
- Default fonts (Inter/Poppins) on the landing page.
- Section-stacked card layouts with `motion.div` fade-ins as the only motion.
- Abstract WebGL "cinematic short film" with no product (an earlier direction the user killed).

### 4.2 Typography
- **Headlines / editorial**: Fraunces (serif, variable, optical sizing).
- **Body / UI**: IBM Plex Mono for metadata, labels, captions; Inter for dense product UI inside authenticated app.
- Fonts loaded via `<link>` tag in `__root.tsx` `head()` — **never** `@import` remote URLs from `styles.css` (Tailwind v4 Lightning CSS resolves from FS).
- Hero `h1` is `9.6vw` on desktop. Editorial body line-height is generous (1.5–1.65). Tracking on display sizes is slightly negative (`-0.02em`).

### 4.3 Color System
Light, pastel-glow base. Tokens (semantic, all `oklch`):
- `--background` ivory/cream
- `--foreground` near-black graphite
- Accents: muted coral, mint, lavender, warm amber (used sparingly — never all four in one viewport)
- `--border` low-contrast warm grey
- Dark mode tokens exist but the landing page is light-only. Authenticated app respects `.dark`.

Buttons: solid foreground bg with background text **or** outlined with foreground border — never same-color text/bg (a bug we've fixed twice; do not regress).

### 4.4 Motion Philosophy
- **Information reveals on scroll, not on mount.** Mount animations are reserved for the Preloader.
- **One choreography per section.** No copy-paste fade-in-up.
- **Velocity is a first-class input** — `useStage()` exposes `progress` and `velocity` so components can overshoot on fast scroll, settle on slow scroll.
- **Reveal trigger** fires at ~115% of viewport height (35–40% from bottom). Set in `src/lib/motion.tsx`.
- **Spring constants live in `src/lib/physics.ts`** — do not inline. Cohesion depends on shared springs.
- **HandoffToken** (`src/lib/token.tsx` + `src/components/site/HandoffToken.tsx`) is a single `RequestToken` object passed visually through Hero → Pipeline → Threat → Confidence so the page feels like "one system observed nine ways".
- `prefers-reduced-motion` is respected: motion bus short-circuits to end-state.

### 4.5 Responsive System
Targets: iPhone SE → S24 Ultra; iPad Mini → Pro 13"; laptop; desktop; ultrawide.

Breakpoints used in `styles.css`:
- `≤480px` — small phone
- `≤768px` — phone/phablet
- `≤1024px` — tablet
- `≥1280px` — desktop (source of truth)
- `≥1920px` — ultrawide

**Critical rule (user-imposed, non-negotiable)**: there is **one** landing-page render tree. No `MobileLanding`, `TabletLanding`, `MobileExperience`. Mobile is the desktop architecture with **reduced density and performance scaling**, not removal. RoutingField, TelemetryChrome, HandoffToken, editorial motion all stay alive on mobile.

Mobile performance scaling:
- `RoutingField` particle count × 0.35 below 480px; DPR capped at 1.25.
- `TelemetryChrome` becomes a horizontally scrollable rail with edge-fade mask (not hidden).
- iOS safe-area insets honored; minimum touch target 44px.

---

## 5. Reusable Components

### 5.1 `src/components/site/` (landing)
| Component | Purpose |
|---|---|
| `Preloader.tsx` | Mount gate; ink-stage entry animation. Renders before anything else. |
| `Nav.tsx` | Top nav; mobile hamburger drawer. |
| `CursorRing.tsx` | Custom cursor (desktop only, pointer-fine). |
| `MagneticLink.tsx` | Magnetic hover wrapper. |
| `Reveal.tsx` | Generic scroll reveal — wraps `Kinetic`/`Mask`. |
| `SectionHead.tsx` | Section heading composition (eyebrow + Fraunces title). |
| `SectionGlyph.tsx` | Numerical chapter glyph. |
| `Marquee.tsx` | Auto-scrolling horizontal band (used by `Terminology` for vocabulary). |
| `Hero.tsx` | Hero copy + CTA + link bar (non-wrapping). |
| `HeroPipeline.tsx` | Hero-visible pipeline preview (product visible in first viewport). |
| `Pipeline.tsx` | **Centerpiece**. 360vh pinned on desktop; mobile-pinned with intercepted scroll → stage-by-stage card reveal. |
| `Threat.tsx` | Rotating live request feed using canonical HandoffToken. |
| `Layers.tsx` | Architecture layer crossing visualization. |
| `Confidence.tsx` | KPI ledger (stacked single-column on mobile to prevent overflow). |
| `Analytics.tsx` | Analytics visualization (cobe globe + chart). |
| `Network.tsx` | Network/edge diagram. |
| `Finale.tsx` | Closing CTA. |
| `Terminology.tsx` | Pinned horizontal chapter ("Six verbs…") + inline auto-scrolling marquee. Mobile uses `useMobileScrollOwner`. |
| `Problem.tsx` | Three-card comparison. Mobile = pinned horizontal swipe rail (`ProblemMobileRail`). |
| `HandoffToken.tsx` | Renders the threaded `RequestToken`. |
| `Ambient.tsx` | Background ambient layer. |
| `RoutingField.tsx` | Background particle field (WebGL). |
| `TelemetryChrome.tsx` | Live metrics chrome; velocity-modulated. |

### 5.2 `src/components/app/`
- `AppShell.tsx` — sidebar + header + mobile drawer for `_authenticated/*`. Single source of authenticated chrome.

### 5.3 `src/components/links/`
- `LinksManager.tsx`, `LinksTable.tsx`, `CreateLinkPanel.tsx`, `RuleBuilder.tsx`, `types.ts` — domain UI for links + redirect rules. Ported from legacy Next.js.

### 5.4 `src/components/ui/`
shadcn primitives. Standard. Do not edit primitives to "fix" a page — compose.

### 5.5 Motion library — `src/lib/`
- `motion.tsx` — `MotionProvider`, `Kinetic` (per-letter/word stagger), `Mask` (clip-path reveal), `useElementProgress`.
- `stage.tsx` — `useStage({ ref, range })` returns `{ progress, velocity }` from a global RAF/scroll bus.
- `scroll-progress.tsx` — Lenis setup; listens for `aegis:scroll-owner` CustomEvent to `lenis.stop()` during mobile pins.
- `mobile-scroll-owner.ts` — `useMobileScrollOwner({ ref, length })` — intercepts wheel + touchmove with `{ capture: true, passive: false }`, locks `window.scrollY` via RAF, returns local progress 0–1. Dispatches `aegis:scroll-owner` start/end events.
- `physics.ts` — shared spring constants.
- `token.tsx` — `HandoffTokenProvider`, `useHandoffToken`.

---

## 6. Routing

File-based. Conventions in `<tanstack-route-architecture>` apply.

- `/` public landing (SSR on)
- `/auth` public sign-in/sign-up
- `/_authenticated/*` gated subtree. The `_authenticated.tsx` layout checks Supabase session client-side and redirects to `/auth` if absent. **Do not author a competing gate elsewhere.**
- Server routes: `/api/v1/auth/*`, `/api/v1/links/*`.
- `/sitemap.xml` via `sitemap[.]xml.ts`.

Navigate with `<Link to=... params=...>` from `@tanstack/react-router`. Never `<a href>` for internal routes.

---

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

### 8.1 APIs already migrated to `/api/v1/`
- `auth/login`, `auth/logout`, `auth/me`, `auth/signup`
- `links/index` (list + create), `links/$id` (get/update/delete), `links/check-slug`

### 8.2 APIs still pending (legacy only — not yet ported)
- `rules/*` (CRUD for `redirect_rules`)
- `analytics/*` (aggregations over `audit_logs`)
- `audit-logs/*` (paginated read with JSON expansion)
- `security/*` (blocked IPs, threat feed)
- `ml-engine/*` (model status proxy to Oracle, feature importance read)
- `qr/*` (QR generation — legacy had QR Labs)
- `bulk/*` (bulk link operations)
- `settings/api-keys/*` (rotation, revocation)
- Webhook notifications endpoint
- Edge redirect handler (`/l/:slug`) — currently legacy-only; not yet on TanStack edge

---

## 9. Responsive Primitives (in `src/styles.css`)
- `.ds-tabs` — horizontally scrollable tabs with edge fade.
- `.ds-table-cards` — table → card stack below 768px.
- `.ds-sheet` — bottom-sheet treatment for mobile drawers.
- `.link-bar` — non-wrapping search + CTA composition.
- `.problem-pin`, `.pipeline-pin`, `.term-chapter` — mobile pinned sections (heights are tuned: 104–112vh; do not re-inflate to 300vh+).
- `.drift-band` / `.drift-band--mobile` — auto-scrolling vocabulary marquee, mobile variant kept visible while desktop hidden.
- `.conf-metrics` — stacked single-column ledger on mobile.

---

## 10. Landing Page Interaction System

### 10.1 Desktop
- Lenis smooth scroll.
- `useStage` (RAF + scroll progress) drives all section choreography.
- Pinned sections use CSS `position: sticky` containers with tall scroll heights (300–360vh).
- Velocity from `useStage` feeds spring overshoot in HeroPipeline and TelemetryChrome metrics.

### 10.2 Mobile (`≤768px`) — Scroll Ownership Model
Critical: on mobile, three sections **own scroll** via `useMobileScrollOwner` (Problem, Pipeline, Terminology).

Mechanics:
1. When the section's pin element hits viewport center, `useMobileScrollOwner` adds `wheel` + `touchmove` listeners with `{ capture: true, passive: false }`.
2. It calls `preventDefault()`, locks `window.scrollY` to the entry position via a RAF loop, dispatches `aegis:scroll-owner` start.
3. `scroll-progress.tsx` listens and calls `lenis.stop()` to kill momentum drift.
4. Wheel/touch delta is accumulated and normalized into local `progress` 0→1.
5. At `progress === 1` and continued forward delta, the hook releases ownership, dispatches end, calls `lenis.start()`, native scroll resumes.

Per section:
- **Problem**: progress → horizontal translateX of `.problem-track` (card 1 center → card 2 center → card 3 center → release).
- **Pipeline**: progress → vertical translateY of `.pipeline-rail` so the active card sits at ~50vh and drifts to ~30vh as next card enters. 3 stages.
- **Terminology**: pinned horizontal chapter rail (same model as Problem). Inline `.drift-band--mobile` auto-marquee remains continuously running independently of pin.

### 10.3 Things to know about mobile
- Verified with a headless Chromium script `/tmp/verify-release-synthetic.mjs` that for each pinned section: `pageMovedPx===0` while active, axis movement registers, release works.
- No CSS-only fake pinning. Do not "simplify" this to `overflow-x: scroll` swipe rails — that was rejected.
- DriftBand has exactly **one** instance on mobile (the inline one inside `Terminology`). A duplicate was deleted; do not reintroduce.

---

## 11. Known Bugs / Watch-outs

- **Build secret/publishable key shape**: Lovable Cloud may inject `sb_secret_*` keys; admin Data API reads expecting JWT can fail with `Expected 3 parts in JWT; got 1`. We are **not** on Lovable Cloud, but the external Supabase project must use legacy JWT-format keys for `admin.server.ts`. Don't swap formats blindly.
- **Hero h1 at 9.6vw**: on ultrawide it gets huge — acceptable per user direction, do not cap unless asked.
- **Cobe globe** in Analytics is GPU-intensive — already DPR-capped. Re-test on mid-tier Android if you change it.
- **Scroll-owner edge case**: very fast flicks on iOS Safari can momentarily over-scroll before the RAF lock catches; tolerable, do not "fix" by removing `passive: false` (that breaks the whole model).

## 12. Known Regressions (resolved — do not redo)
- Duplicated vocabulary band on mobile — removed.
- `MobileLanding` / `TabletLanding` parallel trees — deleted; reverted to single render tree.
- Section-stacked AI-landing layout — replaced.
- WebGL cinematic short film with no product — replaced.
- Button text same color as background — fixed; keep contrast.
- Footer height equal to header — enforced.

## 13. Remaining Tasks
1. Port pending APIs (§8.2) into `/api/v1/`.
2. Rebuild remaining authenticated pages from first principles where they still feel like ports (audit each against AppShell visual language).
3. Auth polish: redirect-back via `?redirect=` search param on `/auth`, social providers if the user requests.
4. Edge redirect handler `/l/$slug` with Oracle ML inference call + waitUntil audit log.
5. QR Labs UI + endpoint.
6. Bulk operations UI on Links.
7. Settings → API key rotation flow.
8. Full responsive QA pass on authenticated pages (landing is done).
9. SEO: per-route `head()` metadata on every shareable route. Currently the landing route has it; authenticated routes are noindex by default.
10. `og:image` only at leaf routes; never on `__root.tsx`.
11. Documentation route (`/_authenticated/docs.tsx`) is a stub — fill with real content.

---

## 14. Important Implementation Decisions

1. **Lovable Cloud is OFF and stays OFF.** Backend is the external Supabase from legacy. The user was explicit and repeated.
2. **One render tree per page.** No device-specific component trees. Use CSS + perf scaling.
3. **Motion lives in `src/lib/`**, not inlined per component. Cohesion comes from shared springs + shared stage bus.
4. **HandoffToken threads a single conceptual request** through Hero → Pipeline → Threat → Confidence. This is the cohesion anchor; do not let sections render independent tokens.
5. **Pipeline is the centerpiece.** Other sections support it. Do not let any section out-spectacle Pipeline.
6. **Mobile pinning is real scroll interception**, not `position: sticky` + tall parent. The `useMobileScrollOwner` hook is the contract.
7. **Reveal threshold is 35–40% from bottom**, not the default 60%. Set in `motion.tsx`.
8. **Preloader is a mount gate**, not an overlay. Nothing else renders until it completes.
9. **Server-only files** end in `.server.ts` and are import-protected. `admin.server.ts` must never appear in a client-reachable import chain.
10. **`src/routeTree.gen.ts` is generated.** Never hand-edit.

## 15. Intentional Reverts (do not undo)
- Removed: separate `MobileLanding`, `TabletLanding`, `MobileExperience` trees.
- Removed: GSAP / ScrollTrigger (Framer Motion + custom stage bus is the system).
- Removed: dark-mode glassmorphism on landing.
- Removed: WebGL-only abstract intro.
- Removed: extra DriftBand on mobile.
- Removed: per-route `beforeLoad` Supabase session checks — gating lives only in `_authenticated.tsx`.
- Removed: full-page CSS pinning fakes for mobile sections — replaced by `useMobileScrollOwner`.

## 16. Things That Must Never Change
- **No Lovable Cloud activation.**
- **No second auth gate** outside `_authenticated.tsx`.
- **No `src/pages/` directory.** TanStack uses `src/routes/`.
- **No `@import` of remote font URLs in `styles.css`.** Use `<link>` in root `head()`.
- **No hardcoded color values in components.** Tokens only.
- **No removal of motion systems on mobile.** Scale density; never strip.
- **No editing `routeTree.gen.ts`.**
- **No `<a href>` for internal nav.** `<Link to=…>` only.
- **No `useEffect` + `fetch` for initial data.** Loader + Query pattern.
- **No reintroduction of the killed AI-landing aesthetic** (purple gradients, floating monoliths, generic fade-ins).
- **No service-role key in client bundles.** `admin.server.ts` server-only.
- **Pipeline stays the centerpiece.**

---

## 17. Files Modified (since project bootstrap — non-exhaustive, the meaningful ones)

```
src/styles.css                                  Design system + responsive primitives + mobile pin classes
src/routes/__root.tsx                           Fonts, providers, Preloader gate, Nav
src/routes/index.tsx                            Landing composition (Hero → … → Finale)
src/routes/auth.tsx                             Sign-in/up
src/routes/_authenticated.tsx                   Auth gate
src/routes/_authenticated/*.tsx                 All product pages
src/routes/api/v1/auth/*.ts                     Auth API
src/routes/api/v1/links/*.ts                    Links API
src/routes/sitemap[.]xml.ts                     Sitemap

src/components/site/*                           Entire landing motion system (see §5.1)
src/components/app/AppShell.tsx                 Authenticated chrome
src/components/links/*                          Links domain UI
src/components/auth/AuthProvider.tsx            Auth sync

src/lib/motion.tsx                              Reveal threshold @ ~115% vh; Kinetic; Mask
src/lib/stage.tsx                               Frame bus
src/lib/scroll-progress.tsx                     Lenis + scroll-owner event integration
src/lib/mobile-scroll-owner.ts                  Mobile pin/interception hook (NEW, critical)
src/lib/physics.ts                              Shared springs
src/lib/token.tsx                               HandoffToken context
src/lib/stores/auth-store.ts                    Zustand + supabase client export
src/lib/supabase/{client,admin.server}.ts       Supabase clients
src/lib/schemas.ts                              Zod
src/lib/env.ts                                  env resolution
```

---

## 18. Operating Notes for the Next Engineer

- Verify any mobile interaction change with a headless Chromium script that asserts `pageMovedPx===0` during pins. The previous regression cycle was caused by trusting eyeballs.
- When you add a new landing section, route its choreography through `useStage`. Do not add a new RAF loop.
- When you add a new authenticated page, start from `AppShell` and do **not** invent a second chrome.
- When you add a new server fn that touches Supabase as the user, see `<tanstack-supabase-integration>` — but note this project pre-dates the integration-managed `_authenticated/route.tsx` pattern. We use a manually authored `_authenticated.tsx` gate; don't migrate it without the user asking.
- When in doubt about visual direction, the reference is Igloo Inc. When in doubt about restraint, the reference is Buttermax. When in doubt about typography, the reference is Getty.

End of handover.
