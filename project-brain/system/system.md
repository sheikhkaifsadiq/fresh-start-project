# System Rules & Directives

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
