# AegisRoute — Landing Page Specification

A complete narrative description of the current landing page (`src/routes/index.tsx`).
Written so another AI can **rebuild it from scratch** without seeing the prior code.
Read top-to-bottom. Every paragraph is a hard requirement, not a suggestion.

---

## 0. North Star

> **One intelligent routing system, observed through nine perspectives.**

It is **not** a stack of marketing sections with animations bolted on.
It is one cinematic, editorial scroll-film with the product (URL routing + AI
threat detection) as the literal subject. Visual references: Igloo Inc, Basic/Dept,
Active Theory. Tone: premium, editorial, paper-and-graphite, restrained.

**Hard "never do" list**
- Never a generic AI/SaaS landing (gradient hero, three feature cards, testimonial grid, FAQ).
- Never purple/indigo glow, neon, or "AI" gradients.
- Never floating monoliths, abstract crystals, hero shaders without product meaning.
- Never separate mobile/tablet trees. One source of truth; mobile is a **density and choreography** variant of the same scenes.
- Never remove desktop motion to make mobile feel calmer — scale it, don't strip it.

---

## 1. Design system (must match exactly)

**Palette** (CSS vars in `src/styles.css`):
- `--paper` ivory background `#f6f1e3` / `#fcfbf8` family (warm cream, not white).
- `--ink` near-black `#14161a` for type and rules.
- `--ember` warm coral `#c25535` — threat / interception accent.
- `--signal` muted mint `#2f6d5a` — safe / allow accent.
- `--rule` low-contrast hairline (`#ece6d4`-ish) for dividers, grids, charts.
- Optional muted lavender / amber for tertiary accents. **No pure white, no pure black, no bright primaries.**

**Typography**
- Display: **Fraunces** (serif). Used italic for emphasis words.
- Mono / UI labels: **IBM Plex Mono**, uppercase, letter-spacing ~0.18em, ~10–11px.
- Body: a clean neo-grotesk (Inter/Söhne-like) at editorial sizes.
- Headings huge and confident (hero H1 ≈ `9.6vw`), tight tracking, mixed roman + italic words.

**Motion philosophy**
- Spring physics shared in `src/lib/physics.ts` — small set of constants reused everywhere.
- All scroll-driven animation flows through one **frame bus** (`src/lib/stage.tsx`) and a **scroll progress provider** (`src/lib/scroll-progress.tsx`) backed by Lenis smooth scroll. No per-component scroll listeners.
- Reveals fire at ~35–40% from the bottom of the viewport, not at 60%.
- Velocity is a first-class input: chrome metrics, particle density, and overshoot all react to scroll speed.
- Respect `prefers-reduced-motion` — snap to revealed state, kill packets/marquees.

**Layout primitives (in `src/styles.css`)**
- `.container-x` — max-width editorial column with side padding that breathes.
- `.section`, `.scene-frame` — consistent vertical rhythm.
- `.kicker` — mono uppercase eyebrow label.
- `.hero-rule`, `.rule` — hairline divider, draws in with `scaleX`.
- Mobile breakpoint **≤720px**: reduce vertical whitespace 30–40%, switch certain sections to pinned/horizontal behaviour (see §6).

---

## 2. Top-level composition

File: `src/routes/index.tsx`. Boots a `Preloader`, then renders `<Experience />`:

```
MotionProvider
  StageProvider                  ← frame bus (rAF + scroll velocity)
    TokenProvider                ← one canonical RequestToken object
      ScrollProgressProvider     ← Lenis-driven 0..1 page progress
        <RoutingField />         ← page-wide ambient canvas (fixed, behind everything)
        <CursorRing />           ← custom cursor (desktop only)
        <Nav />                  ← sticky top nav, blurs in on scroll
        <HandoffToken />         ← fixed right-rail chip, morphs across scenes
        <main>
          Scene("route.", pull)        → <Hero />
          Scene("blind.", tiltL, ember)→ <Problem />
          Scene("inspect.", push, over)→ <Pipeline />     ← CENTERPIECE
          Scene("score.", tiltR, ember)→ <Threat />
          Scene("observe.", level)     → <Analytics />
          <Terminology />              ← own scene wrapper inside
          Scene("38 regions", pull, over)→ <Network />
          Scene("layer.", push)        → <Layers />
          Scene("proof.", tiltL)       → <Confidence />
          Scene("routed.", pull, paper)→ <Finale />
        </main>
        <TelemetryChrome />      ← fixed bottom strip, live metrics
```

Order is fixed. Nine scenes. Each scene = one perspective on the same routing request.

---

## 3. Global providers and primitives

### 3.1 `MotionProvider` (`src/lib/motion.tsx`)
Bundles reusable motion primitives:
- `Kinetic` — splits a string into words/letters and reveals them with a stagger from a chosen direction. Used for hero H1 with italic words at specified indices.
- `Mask` — reveal child via an inky horizontal mask wipe; takes `delay`, `duration`.
- `useParallaxRef(strength)` — scroll-parallax for a single element.
- `usePointerParallax(strength)` — cursor-parallax for ambient blobs.
- `useTilt()` — 3D card tilt on hover (capped, subtle).
- `useMagnetic(strength, radius)` — magnetic pull on buttons/links toward cursor.
- `useElementProgress(ref)` — 0..1 progress of an element across the viewport.

### 3.2 `StageProvider` (`src/lib/stage.tsx`)
A single rAF loop that emits `{ vh, scrollY, velocity, t }` to subscribers. Components call `useStage().subscribe(fn)` to animate per-frame without spawning their own listeners.

### 3.3 `ScrollProgressProvider` (`src/lib/scroll-progress.tsx`)
Initialises **Lenis** for buttery smooth scroll, exposes 0..1 page progress, and listens for a `aegis:scroll-owner` custom event — when fired with `{active:true}` it calls `lenis.stop()` so a pinned mobile chapter can fully own scroll (see §6).

### 3.4 `TokenProvider` (`src/lib/token.tsx`)
One canonical `RequestToken` (id, url, asn, ua, score, verdict, pop). The same object is read by Hero, HeroPipeline, Pipeline, Threat, Analytics, HandoffToken, Finale — so the user feels they are watching **one** request travel through the page.

### 3.5 `RoutingField` (`src/components/site/RoutingField.tsx`)
Fixed full-viewport `<canvas>` behind everything. Sparse graph of edge POPs (~12 nodes) with packets always in flight between them. Most are mint (allowed), a few ember (intercepted). Density modulates with scroll: idle in Hero, busiest at Pipeline/Threat, calmer at Confidence/Finale. ~0.6% CPU at idle. DPR capped at 1.25 on mobile; particle count scaled 0.35× on small phones. Disabled when `prefers-reduced-motion`.

### 3.6 `CursorRing` (`src/components/site/CursorRing.tsx`)
Custom cursor: a small ink dot + larger lagging ring that grows over interactive elements. Desktop / hover-capable pointers only. Native cursor hidden when active.

### 3.7 `TelemetryChrome` (`src/components/site/TelemetryChrome.tsx`)
Fixed bottom strip, full width, mono. Three live readouts: **median decision latency (ms)**, **intercepted count this session**, **active region label** (rotates through SFO-01, LHR-02, FRA-03, SIN-04, HND-05, GRU-06, DXB-07, SYD-08). Each scene has its own baseline (e.g. Threat runs hot — faster intercept ticks, higher latency; Confidence/Finale near silent). Scroll velocity adds jitter. On mobile it becomes a horizontally scrollable rail with edge-fade mask — **never hidden**.

### 3.8 `HandoffToken` (`src/components/site/HandoffToken.tsx`)
A fixed chip pinned to the right rail. Carries the canonical request through all nine scenes. As the user scrolls, it morphs through nine states (label + sub-caption + tone + shape — dot, ring, bar, shield, node, burst). The next label cross-fades in over the last 20% of the previous scene so the handoff is **felt**, not announced. This is the literal embodiment of "one routing system, nine perspectives" and is the cohesion device that prevents the page feeling like nine disconnected sections.

### 3.9 `Preloader` (`src/components/site/Preloader.tsx`)
**Authored entry sequence — not a generic spinner.** The site is already in motion underneath (RoutingField is rendering, Hero is already typing). A diagonal ink curtain uncovers the page. The number shown is **product telemetry** ("requests inspected this session"), not a percentage. Status line cycles: `INITIALISING EDGE MESH → LINKING 38 REGIONS → WARMING ML MODELS → SYNCING REPUTATION GRAPH → HANDSHAKE COMPLETE`. Acts as a **mount gate**: nothing else renders until `onDone` fires. Reduced motion: snap to revealed state on first paint.

### 3.10 `Scene` wrapper (defined inline in `index.tsx`)
Wraps each section. Adds:
- A `SectionGlyph` (oversized Fraunces italic word like "route.", "blind.", "inspect.") drifting at ~15% faster than scroll, occasionally crossing in front of the diagram when `over` is true.
- A **cinematic framing**: small rotational push/pull/tilt (≤0.8°) driven by element progress, so consecutive scenes feel like camera moves, not slides.

### 3.11 `Nav` (`src/components/site/Nav.tsx`)
Sticky top bar. Transparent at top of page; on scroll it acquires a blurred paper background + hairline bottom rule. Links: Routing, Threat, Analytics, Network, Security. CTA: **Route a Link**, magnetic. Mobile: hamburger that opens a full-height drawer (body scroll locked, Esc closes).

### 3.12 `MagneticLink`
Buttons and the hero CTA use this — anchor wrapped in a span; inner anchor pulls slightly toward the cursor within a radius.

### 3.13 `Marquee`
Generic horizontal infinite marquee (px/sec, direction). Used by Finale as a giant 220px Fraunces italic line at low opacity.

### 3.14 `Reveal`
Light IntersectionObserver wrapper for "appears once" reveals where `Mask`/`Kinetic` are overkill.

---

## 4. The nine scenes (in order)

Each scene listed below describes: **the idea**, **what's on screen**, **how it moves**.

### Scene 1 — Hero (`Hero.tsx`) — glyph "route."
- **Idea**: A smarter route for every link. Show the product in the first viewport.
- **Content**:
  - Eyebrow: `AegisRoute · v3 · HH:MM:SS UTC` (UTC clock ticks).
  - H1, Fraunces, ~9.6vw: **"A smarter route for every link."** — word 5 is italic, revealed with `Kinetic` (word split, bottom stagger).
  - Sub-paragraph (~3 lines) introducing edge-routed shortening with AI threat detection, **decided in under twelve milliseconds**.
  - **Link bar**: looks like a real input — fixed `aegis.to /` prefix, free-text input bound to the canonical token's URL, ink **Route →** button (magnetic). Must never wrap on mobile.
  - **HeroPipeline** below the link bar (see §4b).
  - Hairline `.hero-rule` draws in left-to-right with `scaleX`.
  - **Hero meta** row, 4 cells: `11.4ms median decision · 2.1B links routed / mo · 99.997% uptime / 12 mo · 38 edge regions`.
- **Background**: three large pointer-parallax blobs (`b1 b2 b3`), very soft.
- **Framing**: `pull` (slight scale out as you scroll past).

### Scene 1b — `HeroPipeline` (lives inside Hero)
- A live mini-product visualization: `Incoming Link → AI Inspection → Threat Decision → Safe Route`.
- A packet enters from the left, score rises during Inspection, a verdict is taken (ALLOW / CHALLENGE / SINK), packet is routed to a POP (SFO/LHR/FRA/SIN/...). Loops continuously — the system is alive **before** the user scrolls.
- Mobile: recomposes as a vertical stepper (not a horizontal pipeline).

### Scene 2 — Problem (`Problem.tsx`) — glyph "blind.", ember shade, tiltL
- **Idea**: What the world looks like without AegisRoute.
- **Three diagrammed cards**, each an inline editorial SVG:
  1. **Blind Redirect** — 302s with no awareness. Dashed line with ember bot dots passing through to origin.
  2. **Bot Saturation** — 63% of traffic is non-human. Grid of squares, ember-tinted bots vs ink humans.
  3. **Zero Visibility** — empty chart frame; teams ship blind.
- Each card: mono tag, Fraunces title, body paragraph, diagram. Subtle `useTilt` on hover.
- **Mobile** (≤720px): becomes a **scroll-owned horizontal rail**. When the centre of the first card hits viewport centre, the section pins; vertical scroll input is converted into horizontal card travel; releases natively after the last card. Uses `useMobileScrollOwner` (see §6).

### Scene 3 — Pipeline (`Pipeline.tsx`) — glyph "inspect.", push, **over** — **CENTERPIECE**
- **Idea**: The Decision Pipeline. The whole product is one machine; here it is, in detail.
- **Pinned 320vh on desktop** (mobile: pinned via scroll-owner — see §6). A request packet physically travels across **5 stages**, while the camera pushes in:

  ```
  01 Ingest  →  02 Inspect  →  03 Score  →  04 Decide  →  05 Route
  ```

- Choreography fractions of the pinned timeline (`T.enter / travel1 / inspect / travel2 / score / travel3 / decide / travel4 / route / hold`):
  - Packet glides between stage nodes.
  - At **Inspect**, a fingerprint card extracts mid-flight (JA4, ASN, UA, headers).
  - At **Score**, six ML feature bars build (`asn.rep, ja4.entropy, ua.coherence, geo.velocity, hdr.signature, tls.fp`) — each bar fills to its weight, then a threat overlay paints over it.
  - At **Decide**, a branch resolves: ember (deny/sink) or mint (allow) — the active branch **glows**.
  - At **Route**, a 302 is emitted to a clean destination; decision is logged.
- Right side: a live decision ledger entry materialises as the verdict resolves.
- Mobile vertical mode: cards stack and reveal **one scroll = one stage**. Card 1 drifts up to ~30% vh while Card 2 settles at ~50% vh, etc.

### Scene 4 — Threat (`Threat.tsx`) — glyph "score.", ember, tiltR
- **Idea**: What the model actually sees.
- A **rotating live request feed** table (mono): IP · UA · score · verdict (ALLOW / CHALLENGE / DENY). The canonical token highlights as it cycles in. Seeded plus synthetic rows that rotate on a tick. Verdict cells coloured: mint for ALLOW, amber for CHALLENGE, ember for DENY.
- Editorial copy explains JA4, ASN reputation, UA coherence in plain words.

### Scene 5 — Analytics (`Analytics.tsx`) — glyph "observe."
- **Idea**: The product owner's view. Real-time but calm.
- Live **area chart** (re-seeded every 2.4s, smooth sine + noise), a couple of mono **tickers** (counts incrementing every 1.6s), a small breakdown table.
- Hairlines, no chartjunk, no legends-as-chips. Editorial financial-report feel (Getty/FT, not Stripe dashboard).

### Scene 6 — Terminology (`Terminology.tsx`) — own scene
- **Idea**: A vocabulary chapter. Six verbs that define the system.
- A continuous auto-scrolling marquee: **"Inspect · Score · Decide · Route · Observe · Repeat"** — large Fraunces italic.
- Below: six numbered terms with definitions (01 Inspect ... 06 Repeat).
- **Mobile**: pinned + horizontal scroll-owned chapter (same behaviour as Problem on mobile). Each card snaps to centre; releases after the last term.

### Scene 7 — Network (`Network.tsx`) — glyph "38 regions", over, pull
- **Idea**: Global edge presence — but not a stock 3D earth.
- A `cobe`-rendered globe (small, restrained, **not oversized**), warm paper-tone, no neon. Nine well-spaced POPs: SFO, GRU, LHR, FRA, JNB, DXB, SIN, HND, SYD. Arcs animate between defined pairs.
- Sits beside an editorial right-column body and a small POP list.

### Scene 8 — Layers (`Layers.tsx`) — glyph "layer.", push
- **Idea**: Defense, sequenced. Four rows stack upward on scroll (z + soft shadow), and a **coverage meter** fills as a *consequence* of each row landing — not as decoration.
- Rows: **01 Detection · 02 Verification · 03 Mitigation · 04 Routing**, each with a one-line body and an ML coverage value (0.96, 0.88, 0.92, 1.0).

### Scene 9 — Confidence (`Confidence.tsx`) — glyph "proof.", tiltL
- **Idea**: Proof in numbers. A KPI ledger — not testimonial cards, not logo grids.
- A stacked editorial ledger of key metrics with mono labels and Fraunces values. Mobile: single-column to prevent horizontal overflow.

### Scene 10 — Finale (`Finale.tsx`) — glyph "routed.", paper, pull
- **Idea**: Close the loop. Restate the brand.
- Giant Fraunces italic marquee at ~8% opacity behind everything: `AegisRoute · routing, shielded ·`.
- Final H1 + body.
- Single CTA: if authenticated → **Open Dashboard** to `/dashboard`; else **Route a Link** to `/auth`. Magnetic.

---

## 5. Section-wrapping glyphs

`SectionGlyph` is rendered by `Scene` for each section. It's an oversized Fraunces italic word that drifts ~15% faster than scroll, occasionally crossing over the foreground when `over=true`. Each scene's glyph (in order): `route. · blind. · inspect. · score. · observe. · 38 regions · layer. · proof. · routed.` Sizes 14vw–26vw. Shades: `ink` (default), `ember` (Problem, Threat), `paper` (Finale).

---

## 6. Mobile (≤720px) — scroll ownership

Three sections take over scroll on mobile via `src/lib/mobile-scroll-owner.ts`:

- **Problem** — horizontal scroll-owned rail of three cards.
- **Pipeline** — vertical scroll-owned stepper, one stage per scroll beat.
- **Terminology** — horizontal scroll-owned chapter of six terms.

Mechanics (do not "fake" with CSS):
1. The hook attaches `wheel` and `touchmove` listeners with `{ capture: true, passive: false }`.
2. When a target section's trigger hits ~viewport centre, the hook **takes ownership**: dispatches `aegis:scroll-owner` `{active:true}` (Lenis stops), starts a rAF loop locking `window.scrollY`, and converts vertical input delta into 0..1 local progress.
3. Local progress drives the section's transform (horizontal rail translation or vertical stepper).
4. When progress reaches 0 going up or 1 going down, the hook **releases** — restores native scroll, re-enables Lenis, and scrolls to just before/after the section.

Other mobile rules:
- One source of truth: **no MobileLanding/MobileExperience trees** — the same components run, just denser/scaled.
- `HandoffToken` stays alive on mobile.
- `TelemetryChrome` becomes a horizontally scrollable mono rail with edge-fade mask.
- `RoutingField` caps DPR at 1.25, scales particle count by 0.35× on small phones.
- Section padding shrinks ~30–40%.
- Touch targets ≥44px; iOS safe-area respected.
- `CursorRing` hidden on touch-only pointers.

---

## 7. Routing & auth touchpoints

The landing lives at `/` (`src/routes/index.tsx`). The only auth coupling is in Finale:
- `useAuthStore` decides CTA target (`/dashboard` vs `/auth`).
- Never call protected server functions from the landing's loader; the landing must prerender for unauthenticated visitors.

`/auth` and `/dashboard` are owned by the rest of the app — landing must not redefine them.

---

## 8. SEO (route head)

In `Route.head()` for `/`:
- `title`: "AegisRoute — A smarter route for every link." (<60 chars).
- `description` (<160 chars): edge-routed URL shortening with AI threat detection and real-time analytics; every redirect inspected and decided in under 12ms.
- `og:title`, `og:description`, `og:url` mirrors.
- `link rel="canonical"` → `https://aegisroute.lovable.app/`.
- JSON-LD `SoftwareApplication` with name, category `SecurityApplication`, url, description, free offer.
- Single H1 (Hero).

---

## 9. Performance budget

- 60fps on a mid-range laptop and modern phones.
- One canvas (`RoutingField`), one cobe globe, one Lenis instance. No WebGL beyond these.
- All scroll-driven work flows through the `StageProvider` rAF — no per-component `scroll` listeners.
- Reduced motion: marquees stop, packets stop, masks snap, preloader collapses to a single fade.

---

## 10. Things that must never change

1. The nine-scene order and the canonical `RequestToken` threaded through them.
2. `Pipeline` is the centerpiece — never demoted to a normal section.
3. `HandoffToken` exists and morphs across all nine scenes — it is the cohesion device.
4. `TelemetryChrome` is always visible (rail-form on mobile).
5. One unified landing for all viewports — no MobileLanding/TabletLanding tree.
6. Mobile pinning for Problem / Pipeline / Terminology is **real** scroll interception, not CSS sticky tricks.
7. `Preloader` is a mount gate; the rest of the page does not render until it completes.
8. Paper-and-graphite palette, Fraunces + IBM Plex Mono. No purple/indigo, no neon, no generic AI gradients.
9. Editorial framing (≤0.8° camera tilts) — never game-like.
10. Reveals at ~35–40% from bottom, never at 60%.

---

## 11. Build checklist for restoration

When rebuilding, ship in this order:
1. Tokens + typography in `src/styles.css`; load Fraunces + IBM Plex Mono in `__root.tsx` head as `<link>` tags.
2. `physics.ts`, `stage.tsx`, `scroll-progress.tsx` (with Lenis), `motion.tsx`, `token.tsx`, `mobile-scroll-owner.ts`.
3. `RoutingField`, `CursorRing`, `TelemetryChrome`, `HandoffToken`, `Preloader`, `SectionGlyph`, `Scene` wrapper.
4. `Nav`, `MagneticLink`, `Marquee`, `Reveal`, `SectionHead`.
5. `Hero` + `HeroPipeline`.
6. `Problem` (+ mobile rail), `Pipeline` (centerpiece, 320vh pinned + mobile stepper), `Threat`, `Analytics`, `Terminology` (+ mobile chapter), `Network` (cobe), `Layers`, `Confidence`, `Finale`.
7. Wire `index.tsx` exactly as in §2. SEO head per §8.
8. Verify the "must never change" list against the running preview at 360px, 768px, 1280px, and 1920px viewports.
