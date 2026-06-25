import { Mask, Kinetic } from "../../lib/motion";
import { MagneticLink } from "./MagneticLink";
import { Marquee } from "./Marquee";
import { useRequestToken } from "../../lib/token";
import { useAuthStore } from "@/lib/stores/auth-store";

export function Finale() {
  const token = useRequestToken();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const ctaHref = isAuthenticated ? "/dashboard" : "/auth";
  const ctaLabel = isAuthenticated ? "Open Dashboard" : "Route a Link";
  return (
    <section id="cta" className="finale">
      <div style={{
        position: "absolute", top: 60, left: 0, right: 0, opacity: 0.08,
        pointerEvents: "none",
      }}>
        <Marquee speed={28}>
          <span style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 220, letterSpacing: "-0.04em", color: "#f3eee0",
            padding: "0 80px",
          }}>
            AegisRoute · routing, shielded ·
          </span>
        </Marquee>
      </div>

      <div className="container-x" style={{ position: "relative" }}>
        <Mask delay={0}>
          <div className="kicker">
            REQ 0x{token.id} resolved · {token.ms}ms · {token.verdict} · {token.pop}
          </div>
        </Mask>

        <Kinetic
          as="h2"
          text="Route a link. See what was actually on the other side."
          split="char"
          stagger={16}
          duration={1100}
          italicWords={[4]}
          style={{ margin: "28px 0 32px" }}
        />

        <Mask delay={700}>
          <div className="finale-resolved" aria-hidden>
            <span>your request</span>
            <span className="line" />
            <span style={{ color: "#f3eee0", letterSpacing: "0.18em" }}>resolved →</span>
          </div>
        </Mask>

        <Mask delay={950}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <MagneticLink href={ctaHref} className="btn">
              {ctaLabel}
              <span className="arrow" style={{ marginLeft: 10 }}>→</span>
            </MagneticLink>
            <MagneticLink href="#routing" className="btn btn-ghost" style={{
              color: "#f3eee0", borderColor: "color-mix(in oklab, #f3eee0 30%, transparent)",
            }}>
              Read the Architecture
            </MagneticLink>
          </div>
        </Mask>
      </div>

      <footer className="foot" style={{ marginTop: 80, position: "relative" }}>
        <div className="container-x foot-inner">
          <span>AegisRoute · 2026 · Routing, shielded.</span>
          <span>SOC 2 · ISO 27001 · GDPR</span>
          <span>hello@aegisroute.example</span>
        </div>
      </footer>
    </section>
  );
}
