import { Reveal } from "./Reveal";

export function Finale() {
  return (
    <section id="cta" className="finale">
      <div className="container-x">
        <Reveal>
          <div className="kicker">Invitation · v3 now in general availability</div>
        </Reveal>
        <Reveal delay={120}>
          <h2>
            Route a link.<br />
            See what was <em>actually</em><br />
            on the other side.
          </h2>
        </Reveal>
        <Reveal delay={240}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href="#top" className="btn">
              Route a Link
              <span className="arrow">→</span>
            </a>
            <a href="#routing" className="btn btn-ghost" style={{
              color: "#f3eee0", borderColor: "color-mix(in oklab, #f3eee0 30%, transparent)",
            }}>
              Read the Architecture
            </a>
          </div>
        </Reveal>
      </div>

      <footer className="foot" style={{ marginTop: 160 }}>
        <div className="container-x foot-inner">
          <span>AegisRoute · 2026 · Routing, shielded.</span>
          <span>SOC 2 · ISO 27001 · GDPR</span>
          <span>hello@aegisroute.example</span>
        </div>
      </footer>
    </section>
  );
}
