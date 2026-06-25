# Director's Note

AegisRoute is a 12-act scroll film. The intent is a museum monograph, not a SaaS page.

- **I. Origin** — a single carved monolith, off-center-left, low camera. Negative space dominates so the viewer settles into the room.
- **II. Approach** — a soft ridge of sage rises; the camera lifts to a high vantage. The dolly trades intimacy for distance.
- **III. Threshold** — a single arched aperture, the only beat with cursor parallax. The film acknowledges the viewer once, then withdraws.
- **IV. Material** — a flowing marble surface, slightly tilted. This is the "link" carved in stone — the product, made tactile.
- **V. Pattern** — instanced tessellation. Routing at scale, but composed as a meadow, not a grid.
- **VI. Light** — a single architectural shaft falls across a dark floor. The first dramatic vertical of the film.
- **VII–IX. Fracture → Lattice → Plan** — the signature moment. One instanced mesh of 600 tetrahedral fragments interpolates through three states from a single shader (uP1, uP2). Fully scrub-reversible. The viewer can drag the timeline backward and the crystal reforms.
- **X. Sanctuary** — three receding arches in warm cream. Compositional release.
- **XI. Proof** — a vellum field with a single inscribed quote. The only beat that intentionally hides the product.
- **XII. Invitation** — a horizon at dawn, magnetic CTA. Return to origin, palette warmer.

Camera, palette, fog, and material all derive from one scroll progress (0..1) and one color LUT (palette.ts). Every transition uses `smoothstep`, never a snap. The wordmark stays centered, behind the action, via `mix-blend-mode: difference`.
