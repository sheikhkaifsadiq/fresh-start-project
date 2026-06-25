import { useEffect, useState } from "react";
import { Reveal } from "./Reveal";

export function Hero() {
  const [link, setLink] = useState("https://acme.com/q4/launch?utm=press");
  const [time, setTime] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setTime(
        d.toUTCString().split(" ").slice(4, 5).join("") + " UTC"
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header id="top" className="hero">
      <div className="container-x">
        <div className="hero-grid">
          <div>
            <Reveal>
              <div className="kicker">AegisRoute · v3 · {time || "00:00:00 UTC"}</div>
            </Reveal>
            <Reveal delay={80}>
              <h1>
                A smarter route<br />
                for every <em>link.</em>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="hero-sub" style={{ marginTop: 40 }}>
                AegisRoute is an edge-routed URL platform with AI threat
                detection and real-time analytics. Every redirect is
                inspected, scored, and decided in under twelve milliseconds —
                close to the request, far from the harm.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="link-bar">
                <div className="prefix">aegis.to /</div>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  spellCheck={false}
                  aria-label="Destination URL"
                />
                <button type="button">Route →</button>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={400}>
          <div className="hero-meta">
            <div className="cell"><div className="v">11.4ms</div><div className="l">Median Decision</div></div>
            <div className="cell"><div className="v">2.1B</div><div className="l">Links Routed / Mo</div></div>
            <div className="cell"><div className="v">99.997%</div><div className="l">Uptime · 12 Mo</div></div>
            <div className="cell"><div className="v">38</div><div className="l">Edge Regions</div></div>
          </div>
        </Reveal>
      </div>
    </header>
  );
}
