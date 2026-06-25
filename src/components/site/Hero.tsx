import { useEffect, useRef, useState } from "react";
import { Kinetic, Mask, useParallaxRef, usePointerParallax } from "../../lib/motion";
import { MagneticLink } from "./MagneticLink";
import { useRequestToken } from "../../lib/token";
import { HeroPipeline } from "./HeroPipeline";


export function Hero() {
  const token = useRequestToken();
  const [link, setLink] = useState(token.url);
  const [time, setTime] = useState("");
  const subRef = useParallaxRef<HTMLDivElement>(0.06);
  const metaRef = useParallaxRef<HTMLDivElement>(0.04);
  const blob1 = usePointerParallax<HTMLDivElement>(28);
  const blob2 = usePointerParallax<HTMLDivElement>(-22);
  const blob3 = usePointerParallax<HTMLDivElement>(14);
  const ruleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setTime(d.toUTCString().split(" ").slice(4, 5).join("") + " UTC");
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = ruleRef.current;
    if (!el) return;
    el.style.transform = "scaleX(0)";
    requestAnimationFrame(() => {
      el.style.transition = "transform 1.4s cubic-bezier(0.76,0,0.24,1) 700ms";
      el.style.transform = "scaleX(1)";
    });
  }, []);

  return (
    <header id="hero" className="hero hero-stage">
      <div className="hero-bg" aria-hidden>
        <div ref={blob1} className="blob b1" />
        <div ref={blob2} className="blob b2" />
        <div ref={blob3} className="blob b3" />
      </div>

      <div className="container-x">
        <div className="hero-grid">
          <div>
            <Mask delay={120}>
              <div className="kicker">AegisRoute · v3 · {time || "00:00:00 UTC"}</div>
            </Mask>

            <Kinetic
              as="h1"
              text="A smarter route for every link."
              split="word"
              from="bottom"
              delay={220}
              stagger={70}
              duration={1200}
              italicWords={[5]}
              style={{ marginTop: 24 }}
            />

            <div ref={subRef} className="hero-sub" style={{ marginTop: 40 }}>
              <Mask delay={900} duration={1000}>
                AegisRoute is an edge-routed URL platform with AI threat
                detection and real-time analytics. Every redirect is
                inspected, scored, and decided in under twelve milliseconds —
                close to the request, far from the harm.
              </Mask>
            </div>

            <Mask delay={1100} duration={900}>
              <div className="link-bar">
                <div className="prefix">aegis.to /</div>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  spellCheck={false}
                  aria-label="Destination URL"
                />
                <MagneticLink href="#cta" className="hero-route-btn" style={{
                  display: "inline-flex", alignItems: "center",
                  background: "var(--ink)", color: "var(--paper)",
                  padding: "0 22px", fontFamily: "var(--font-mono)",
                  fontSize: 11, letterSpacing: "0.18em",
                  textTransform: "uppercase", textDecoration: "none",
                }}>Route →</MagneticLink>
              </div>
            </Mask>

            <Mask delay={1300} duration={900}>
              <HeroPipeline />
            </Mask>

          </div>
        </div>


        <div ref={ruleRef} className="hero-rule" />

        <div ref={metaRef} className="hero-meta">
          {[
            { v: "11.4ms",   l: "Median Decision" },
            { v: "2.1B",     l: "Links Routed / Mo" },
            { v: "99.997%",  l: "Uptime · 12 Mo" },
            { v: "38",       l: "Edge Regions" },
          ].map((c, i) => (
            <Mask key={i} delay={1300 + i * 120} duration={900}>
              <div className="cell"><div className="v">{c.v}</div><div className="l">{c.l}</div></div>
            </Mask>
          ))}
        </div>
      </div>
    </header>
  );
}

type FeedRow = { ua: string; asn: string; geo: string; score: number; verdict: string };

function LiveFeed({ token }: { token: ReturnType<typeof useRequestToken> }) {
  // The canonical request is pinned at the top — the same token Pipeline,
  // Threat, Analytics, Network, Layers, and Confidence all describe.
  const canonical: FeedRow = {
    ua: token.ua.toLowerCase(),
    asn: token.asn,
    geo: token.geo.split(" ")[0],
    score: token.score,
    verdict: token.verdict === "ALLOW" ? "ALLOW" : token.verdict === "DENY" ? "SINK" : "CHLG",
  };
  const [rows, setRows] = useState<FeedRow[]>(() => [canonical, ...ROTATING_REQS.slice(0, 3)]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setRows((r) => {
        const next = ROTATING_REQS[(tick + r.length) % ROTATING_REQS.length];
        // canonical stays at top; only the rotating tail changes
        return [canonical, next, ...r.slice(1, 3)];
      });
      setTick((t) => t + 1);
    }, 1400);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  return (
    <div className="hero-feed" aria-hidden>
      <div className="hero-feed-head">
        <span className="dot" /> LIVE · tracking REQ 0x{token.id}
      </div>
      <div className="hero-feed-rows">
        {rows.map((r, i) => (
          <div
            key={`${r.ua}-${i}-${tick}`}
            className={`hf-row ${r.score > 0.6 ? "bad" : "ok"}`}
            style={i === 0 ? {
              borderLeft: "2px solid var(--ink)",
              paddingLeft: 10,
              marginLeft: -12,
            } : undefined}
          >
            <span className="hf-ua">{r.ua}{i === 0 ? "  · 0x" + token.id : ""}</span>
            <span className="hf-asn">{r.asn}</span>
            <span className="hf-geo">{r.geo}</span>
            <span className="hf-score">{r.score.toFixed(2)}</span>
            <span className="hf-verdict">{r.verdict}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
