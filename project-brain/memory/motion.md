# Cinematic Motion and Spring Animations

### 4.4 Motion Philosophy
- **Information reveals on scroll, not on mount.** Mount animations are reserved for the Preloader.
- **One choreography per section.** No copy-paste fade-in-up.
- **Velocity is a first-class input** — `useStage()` exposes `progress` and `velocity` so components can overshoot on fast scroll, settle on slow scroll.
- **Reveal trigger** fires at ~115% of viewport height (35–40% from bottom). Set in `src/lib/motion.tsx`.
- **Spring constants live in `src/lib/physics.ts`** — do not inline. Cohesion depends on shared springs.
- **HandoffToken** (`src/lib/token.tsx` + `src/components/site/HandoffToken.tsx`) is a single `RequestToken` object passed visually through Hero → Pipeline → Threat → Confidence so the page feels like "one system observed nine ways".
- `prefers-reduced-motion` is respected: motion bus short-circuits to end-state.


- Configured Physics Spring Constants: src/lib/physics.ts