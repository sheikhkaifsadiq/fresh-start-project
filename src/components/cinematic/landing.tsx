import "@fontsource/sora/200.css";
import "@fontsource/sora/300.css";
import "@fontsource/sora/600.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./cinematic.css";
import "./dataviz.css";

import { useEffect, useRef, useState } from "react";
import { CinematicScrollProvider } from "./scroll";
import { CinematicScene } from "./scene";
import { Chapter, Words } from "./chapter";
import { CinematicPreloader } from "./preloader";
import {
  LiveAreaChart, EdgeLatencyChart, ThreatFeed, ConfidenceGauge,
  PipelineViz, BarRace, GeoMap, DonutMix, StatGrid, SignalMatrix,
  Sparkline, ScrollRing, StatChip, ClientOnly, Tilt3D,
  RadialHeatmap, Waterfall,
} from "./dataviz";
import { Reveal } from "./reveal";

const CHAPTERS = 8;

/* ---------- Top + bottom HUD chrome (telemetry-style) ---------- */
function Chrome() {
  const reqRef = useRef<HTMLSpanElement>(null);
  const tRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let reqId = Math.floor(Math.random() * 0xffff);
    const id = window.setInterval(() => {
      reqId = (reqId + Math.floor(1 + Math.random() * 4)) & 0xffff;
      if (reqRef.current) reqRef.current.textContent = `0x${reqId.toString(16).padStart(4, "0")}`;
      if (tRef.current) tRef.current.textContent = `${(Math.random() * 11 + 1).toFixed(2)}ms`;
    }, 220);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <header className="cine-hud top">
        <div className="group">
          <span className="brand">AEGIS · ROUTE</span>
          <span style={{ opacity: 0.5 }}>v1.0 / edge-runtime</span>
        </div>
        <div className="group">
          <a className="linkish" href="#proof">Proof</a>
          <a className="linkish" href="#routes">Routing</a>
          <a className="linkish" href="#scale">Scale</a>
          <a className="linkish" href="/auth">Sign in</a>
        </div>
      </header>

      <footer className="cine-hud bot">
        <div className="group">
          <span className="dot" />
          <span>REQ <span ref={reqRef}>0x0000</span></span>
          <span style={{ opacity: 0.55 }}>EDGE-LHR-04</span>
        </div>
        <div className="group">
          <span style={{ opacity: 0.55 }}>P50 DECIDE</span>
          <span ref={tRef}>0.00ms</span>
          <span style={{ opacity: 0.55 }}>LIVE</span>
        </div>
      </footer>

      <div className="cine-progress-fixed"><ScrollRing /></div>
    </>
  );
}

const SPARK_A = [12, 14, 11, 18, 22, 19, 26, 24, 30, 28, 34, 31, 38, 42, 39];
const SPARK_B = [80, 78, 82, 76, 70, 72, 68, 64, 60, 58, 55, 52, 48, 46, 44];
const SPARK_C = [40, 44, 39, 48, 52, 49, 56, 54, 60, 58, 64, 61, 68, 72, 69];

/* ---------- Content overlay (8 chapters, each with distinct anim style) ---------- */
function ChapterOverlay() {
  return (
    <div className="cine-scroll">
      {/* 0 — Hero */}
      <Chapter index={0} align="left" className="cine-hero cine-anim-mask">
        <Reveal v="clip-l" duration={700}><span className="cine-kicker">A smarter route for every link</span></Reveal>
        <h1 className="cine-title">
          <Words>Every redirect is</Words>{" "}
          <em><Words>a decision.</Words></em>
        </h1>
        <Reveal v="up" delay={300} duration={1000}>
          <p className="cine-lede">
            AegisRoute resolves, inspects, scores, and decides the fate of every short link
            in under <strong>12 milliseconds</strong> — at the edge, on every continent.
          </p>
        </Reveal>
        <Reveal v="rise" delay={550} duration={900}>
          <div className="cine-cta-row">
            <a href="/auth" className="cine-cta">Start routing <span className="arr">→</span></a>
            <a href="#proof" className="cine-cta ghost">See the proof</a>
          </div>
        </Reveal>
        <div className="dv-rail">
          {[
            ["LIVE TRAFFIC", 12483, " rps", 420, "var(--c-aqua)"],
            ["P50 EDGE", 4.1, "ms", 0.2, "var(--c-amber)"],
            ["THREATS / MIN", 284, "", 30, "var(--c-magenta)"],
            ["REGIONS", 38, "", 0, "var(--c-sky)"],
            ["MODELS", 7, "", 0, "var(--c-lime)"],
            ["UPTIME", 99.99, "%", 0, "var(--c-bubble)"],
          ].map(([l, v, s, w, a], i) => (
            <Reveal key={l as string} v={(["pop","drop","elastic","rot-l","rot-r","swing"] as const)[i % 6]} delay={400 + i * 90} duration={700} magnet>
              <StatChip label={l as string} value={v as number} suffix={s as string} wobble={w as number} accent={a as string} />
            </Reveal>
          ))}
        </div>
        <ClientOnly>
          <Reveal v="flip-y" delay={600} duration={1100}>
            <div className="dv-side"><Tilt3D><LiveAreaChart label="GLOBAL REQ / SEC" /></Tilt3D></div>
          </Reveal>
        </ClientOnly>
      </Chapter>

      {/* 1 — Ingest */}
      <Chapter index={1} align="right" className="cine-anim-slide-r">
        <Reveal v="right" duration={700}><span className="cine-kicker">01 · Ingest</span></Reveal>
        <h2 className="cine-title">
          <Words>A click arrives at the nearest</Words> <em><Words>edge.</Words></em>
        </h2>
        <Reveal v="blur" delay={300}>
          <p className="cine-lede">
            TLS terminated at the POP nearest to the visitor. Headers parsed,
            JA4 fingerprint computed, ASN resolved — before a single millisecond of logic runs.
          </p>
        </Reveal>
        <Reveal v="clip-r" delay={500}>
          <dl className="cine-meta">
            <div><dt>Avg TLS</dt><dd>0.8ms</dd></div>
            <div><dt>Headers</dt><dd>42 read</dd></div>
            <div><dt>POPs touched</dt><dd>1 / 38</dd></div>
            <div><dt>JA4 hash</dt><dd>t13d_a18</dd></div>
          </dl>
        </Reveal>
        <div className="dv-rail">
          <Reveal v="drop" delay={400} magnet><StatChip label="HANDSHAKE" value={0.8} suffix="ms" accent="var(--c-aqua)" /></Reveal>
          <Reveal v="elastic" delay={520} magnet><StatChip label="ASN" value={13335} accent="var(--c-sky)" /></Reveal>
        </div>
        <ClientOnly>
          <Reveal v="flip-x" delay={500} duration={1100}>
            <div className="dv-side dv-stack"><Tilt3D><GeoMap /></Tilt3D></div>
          </Reveal>
        </ClientOnly>
      </Chapter>

      {/* 2 — Inspect */}
      <Chapter index={2} align="left" className="cine-anim-split">
        <Reveal v="clip-down" duration={700}><span className="cine-kicker">02 · Inspect</span></Reveal>
        <h2 className="cine-title">
          <Words>Every request is read</Words> <em><Words>like a fingerprint.</Words></em>
        </h2>
        <Reveal v="skew" delay={300}>
          <p className="cine-lede">
            TLS · HTTP/2 · ALPN · cipher order. 187 signal axes form a unique shape we've seen
            a million versions of before.
          </p>
        </Reveal>
        <Reveal v="left" delay={420}>
          <div className="dv-inline">
            <Sparkline data={SPARK_A} color="var(--c-aqua)" /> <span className="dv-mono">unique fingerprints +186% / 24h</span>
          </div>
        </Reveal>
        <Reveal v="right" delay={540}>
          <div className="dv-inline">
            <Sparkline data={SPARK_C} color="var(--c-bubble)" /> <span className="dv-mono">distinct JA4 +312 / hr</span>
          </div>
        </Reveal>
        <ClientOnly>
          <div className="dv-side dv-stack">
            <Reveal v="rot-r" delay={400} duration={1100}><Tilt3D><SignalMatrix /></Tilt3D></Reveal>
            <Reveal v="zoom" delay={620} duration={1000}><Tilt3D intensity={6}><RadialHeatmap /></Tilt3D></Reveal>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 3 — Score */}
      <Chapter index={3} align="right" className="cine-anim-zoom">
        <Reveal v="zoom-out" duration={700}><span className="cine-kicker">03 · Score</span></Reveal>
        <h2 className="cine-title">
          <Words>A model assigns intent</Words> <em><Words>before it acts.</Words></em>
        </h2>
        <Reveal v="up" delay={300}>
          <p className="cine-lede">
            An ensemble runs at the edge, never the cloud — gradient-boosted trees, neural
            fingerprints, a continuously trained reputation graph.
          </p>
        </Reveal>
        <Reveal v="clip-l" delay={420}>
          <div className="dv-inline">
            <Sparkline data={SPARK_B} color="var(--c-magenta)" /> <span className="dv-mono">false-positive rate ↓42% / 30d</span>
          </div>
        </Reveal>
        <div className="dv-rail">
          <Reveal v="swing" delay={400} magnet><StatChip label="PRECISION" value={96.4} suffix="%" wobble={0.15} accent="var(--c-aqua)" /></Reveal>
          <Reveal v="drop"  delay={520} magnet><StatChip label="RECALL"    value={94.8} suffix="%" wobble={0.12} accent="var(--c-lime)" /></Reveal>
          <Reveal v="pop"   delay={640} magnet><StatChip label="F1"        value={95.6} suffix="%" wobble={0.10} accent="var(--c-amber)" /></Reveal>
        </div>
        <ClientOnly>
          <Reveal v="flip-x" delay={500} duration={1100}>
            <div className="dv-side dv-stack"><Tilt3D><ConfidenceGauge value={96.4} /></Tilt3D></div>
          </Reveal>
        </ClientOnly>
      </Chapter>

      {/* 4 — Decide */}
      <Chapter index={4} align="left" className="cine-anim-flip">
        <Reveal v="flip-y" duration={800}><span className="cine-kicker">04 · Decide</span></Reveal>
        <h2 className="cine-title">
          <Words>Two paths.</Words> <em><Words>One is chosen.</Words></em>
        </h2>
        <Reveal v="split" delay={300}>
          <p className="cine-lede">
            Allow, challenge, redirect, or block. The rule that fired, the model that voted,
            the signals that mattered — all written to your ledger before the next request lands.
          </p>
        </Reveal>
        <ClientOnly>
          <div className="dv-side dv-stack">
            <Reveal v="clip-up" delay={400} duration={1200}><Tilt3D intensity={8}><PipelineViz /></Tilt3D></Reveal>
            <Reveal v="rot-l" delay={620} duration={1100}><Tilt3D intensity={6}><Waterfall /></Tilt3D></Reveal>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 5 — Route */}
      <Chapter index={5} align="right" className="cine-anim-drift">
        <a id="routes" />
        <Reveal v="rise" duration={700}><span className="cine-kicker">05 · Route</span></Reveal>
        <h2 className="cine-title">
          <Words>The visitor arrives</Words> <em><Words>before they finish blinking.</Words></em>
        </h2>
        <Reveal v="up" delay={300}>
          <p className="cine-lede">
            A/B splits, geo-routing, device fallbacks, deep-links — composable as a small graph.
            One short URL, one durable contract, a thousand intelligent destinations.
          </p>
        </Reveal>
        <div className="dv-rail">
          <Reveal v="elastic" delay={400} magnet><StatChip label="A/B SPLITS" value={1248} accent="var(--c-violet)" /></Reveal>
          <Reveal v="pop"     delay={520} magnet><StatChip label="GEO RULES"  value={342}  accent="var(--c-sky)" /></Reveal>
          <Reveal v="drop"    delay={640} magnet><StatChip label="DEEP LINKS" value={88}   suffix="k" accent="var(--c-lime)" /></Reveal>
        </div>
        <ClientOnly>
          <div className="dv-side dv-stack">
            <Reveal v="right" delay={400} duration={1100}><Tilt3D><BarRace /></Tilt3D></Reveal>
            <Reveal v="zoom"  delay={600} duration={1000}><Tilt3D intensity={6}><DonutMix /></Tilt3D></Reveal>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 6 — Proof */}
      <Chapter index={6} align="left" className="cine-anim-cascade">
        <a id="proof" />
        <Reveal v="left" duration={700}><span className="cine-kicker">06 · Proof</span></Reveal>
        <h2 className="cine-title">
          <Words>Numbers we'd</Words> <em><Words>publish on a wall.</Words></em>
        </h2>
        <Reveal v="blur" delay={300}>
          <p className="cine-lede">
            A year of production traffic, measured on Cloudflare's network and reported in real time.
            Nothing in this section is hand-picked.
          </p>
        </Reveal>
        <Reveal v="clip-up" delay={420}><StatGrid /></Reveal>
        <ClientOnly>
          <div className="dv-grid-2">
            <Reveal v="rot-l" delay={500} duration={1100}><Tilt3D intensity={5}><EdgeLatencyChart /></Tilt3D></Reveal>
            <Reveal v="rot-r" delay={650} duration={1100}><Tilt3D intensity={5}><DonutMix /></Tilt3D></Reveal>
          </div>
          <div className="dv-side dv-stack">
            <Reveal v="rise" delay={500} duration={1100}><Tilt3D intensity={8}><ThreatFeed /></Tilt3D></Reveal>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 7 — Finale */}
      <Chapter index={7} align="center" className="cine-anim-focus">
        <a id="scale" />
        <Reveal v="zoom-out" duration={800}><span className="cine-kicker">07 · Begin</span></Reveal>
        <h2 className="cine-title">
          <Words>Route your first link</Words> <em><Words>in 90 seconds.</Words></em>
        </h2>
        <Reveal v="up" delay={300}>
          <p className="cine-lede">
            No credit card. 10,000 routes free, forever. Bring your own domain when you're ready.
          </p>
        </Reveal>
        <Reveal v="elastic" delay={500} duration={1000}>
          <div className="cine-finale-card">
            <div className="row">
              <input placeholder="https://your-long-url.com/destination" aria-label="URL" />
              <button className="cine-cta">Route it <span className="arr">→</span></button>
            </div>
            <div className="dv-rail" style={{ marginTop: 16 }}>
              <Reveal v="pop"  delay={700} magnet><StatChip label="FREE ROUTES" value={10000} accent="var(--c-aqua)" /></Reveal>
              <Reveal v="drop" delay={820} magnet><StatChip label="SETUP TIME"  value={90}    suffix="s" accent="var(--c-amber)" /></Reveal>
              <Reveal v="swing"delay={940} magnet><StatChip label="CREDIT CARD" value={0}     suffix=" req." accent="var(--c-magenta)" /></Reveal>
            </div>
          </div>
        </Reveal>
      </Chapter>
    </div>
  );
}

/* ---------- Root ---------- */
export function CinematicLanding() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = done ? "" : "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [done]);

  return (
    <CinematicScrollProvider chapterCount={CHAPTERS}>
      <div className="cine-root">
        <CinematicScene />
        <div className="cine-vignette" aria-hidden />
        <div className="cine-grain"   aria-hidden />
        <Chrome />
        <ChapterOverlay />
      </div>
      {!done && <CinematicPreloader onDone={() => setDone(true)} />}
    </CinematicScrollProvider>
  );
}
