# System Architecture

## 2. Architecture

- **Framework**: TanStack Start v1 (React 19, Vite 7, SSR/SSG capable, Cloudflare Worker target with `nodejs_compat`).
- **Styling**: Tailwind CSS v4 via `src/styles.css` (`@import "tailwindcss"`, `@theme`, native CSS — no `tailwind.config.js`).
- **Router**: File-based routing in `src/routes/`. `routeTree.gen.ts` is generated — never hand-edit.
- **State**: Zustand for auth (`src/lib/stores/auth-store.ts`). TanStack Query is available but the landing page does not rely on it.
- **Animation**: Framer Motion + custom scroll/frame bus (no GSAP, no Lenis ScrollTrigger; Lenis is used for smooth scroll only).
- **Backend**: Supabase (already wired via legacy schema). Lovable Cloud is **NOT** enabled — the user explicitly forbade it. Use the existing external Supabase project.
- **Server runtime**: Cloudflare Worker (workerd) — no child_process, no native bindings, see `<server-runtime>` constraints.

---


## Component Dependency Statistics
- Total components: 314
- Total routes: 15
