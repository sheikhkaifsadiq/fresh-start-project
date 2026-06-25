import { useEffect, useRef, useState } from "react";
import { Kinetic, Mask, useParallaxRef, usePointerParallax } from "../../lib/motion";
import { MagneticLink } from "./MagneticLink";

const LIVE_REQS = [
  { ua: "chrome/126 · macOS",  asn: "AS13335", geo: "US-CA", score: 0.04, verdict: "ALLOW" },
  { ua: "headless/119 · linux", asn: "AS14061", geo: "DE-HE", score: 0.91, verdict: "SINK"  },
  { ua: "safari/17 · iOS",      asn: "AS7922",  geo: "US-NY", score: 0.07, verdict: "ALLOW" },
  { ua: "curl/8.4",             asn: "AS16509", geo: "IE-D",  score: 0.74, verdict: "CHLG"  },
  { ua: "firefox/128 · linux",  asn: "AS3320",  geo: "DE-BY", score: 0.11, verdict: "ALLOW" },
  { ua: "python-requests/2.31", asn: "AS8075",  geo: "US-WA", score: 0.83, verdict: "SINK"  },
];

export function Hero() {
  const [link, setLink] = useState("https://acme.com/q4/launch?utm=press");
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
    <header id="top" className="hero hero-stage">
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
