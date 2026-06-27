# Mobile Performance & Responsive Model

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
