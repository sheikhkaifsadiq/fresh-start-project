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
      {/* 0 — Hero · anim: mask-up */}
      <Chapter index={0} align="left" className="cine-hero cine-anim-mask">
        <span className="cine-kicker">A smarter route for every link</span>
        <h1 className="cine-title">
          <Words>Every redirect is</Words>{" "}
          <em><Words>a decision.</Words></em>
        </h1>
        <p className="cine-lede">
          AegisRoute resolves, inspects, scores, and decides the fate of every short link
          in under <strong>12 milliseconds</strong> — at the edge, on every continent.
        </p>
        <div className="cine-cta-row">
          <a href="/auth" className="cine-cta">Start routing <span className="arr">→</span></a>
          <a href="#proof" className="cine-cta ghost">See the proof</a>
        </div>
        <div className="dv-rail">
          <StatChip label="LIVE TRAFFIC"  value={12483} suffix=" rps" wobble={420} />
          <StatChip label="P50 EDGE"      value={4.1}   suffix="ms"  wobble={0.2} accent="var(--c-amber)" />
          <StatChip label="THREATS / MIN" value={284}   wobble={30}  accent="var(--c-magenta)" />
          <StatChip label="REGIONS"       value={38}    accent="var(--c-sky)" />
          <StatChip label="MODELS"        value={7}     accent="var(--c-lime)" />
          <StatChip label="UPTIME"        value={99.99} suffix="%"   accent="var(--c-bubble)" />
        </div>
        <ClientOnly>
          <div className="dv-side"><Tilt3D><LiveAreaChart label="GLOBAL REQ / SEC" /></Tilt3D></div>
        </ClientOnly>
      </Chapter>

      {/* 1 — Ingest · anim: slide-from-right + depth-blur */}
      <Chapter index={1} align="right" className="cine-anim-slide-r">
        <span className="cine-kicker">01 · Ingest</span>
        <h2 className="cine-title">
          <Words>A click arrives at the nearest</Words> <em><Words>edge.</Words></em>
        </h2>
        <p className="cine-lede">
          TLS terminated at the POP nearest to the visitor. Headers parsed,
          JA4 fingerprint computed, ASN resolved — before a single millisecond of logic runs.
        </p>
        <dl className="cine-meta">
          <div><dt>Avg TLS</dt><dd>0.8ms</dd></div>
          <div><dt>Headers</dt><dd>42 read</dd></div>
          <div><dt>POPs touched</dt><dd>1 / 38</dd></div>
          <div><dt>JA4 hash</dt><dd>t13d_a18</dd></div>
        </dl>
        <div className="dv-rail">
          <StatChip label="HANDSHAKE" value={0.8} suffix="ms" accent="var(--c-aqua)" />
          <StatChip label="ASN" value={13335} accent="var(--c-sky)" />
        </div>
        <ClientOnly>
          <div className="dv-side dv-stack">
            <Tilt3D><GeoMap /></Tilt3D>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 2 — Inspect · anim: glitch / split */}
      <Chapter index={2} align="left" className="cine-anim-split">
        <span className="cine-kicker">02 · Inspect</span>
        <h2 className="cine-title">
          <Words>Every request is read</Words> <em><Words>like a fingerprint.</Words></em>
        </h2>
        <p className="cine-lede">
          TLS · HTTP/2 · ALPN · cipher order. 187 signal axes form a unique shape we've seen
          a million versions of before.
        </p>
        <div className="dv-inline">
          <Sparkline data={SPARK_A} color="var(--c-aqua)" /> <span className="dv-mono">unique fingerprints +186% / 24h</span>
        </div>
        <div className="dv-inline">
          <Sparkline data={SPARK_C} color="var(--c-bubble)" /> <span className="dv-mono">distinct JA4 +312 / hr</span>
        </div>
        <ClientOnly>
          <div className="dv-side dv-stack">
            <Tilt3D><SignalMatrix /></Tilt3D>
            <Tilt3D intensity={6}><RadialHeatmap /></Tilt3D>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 3 — Score · anim: zoom + rotate */}
      <Chapter index={3} align="right" className="cine-anim-zoom">
        <span className="cine-kicker">03 · Score</span>
        <h2 className="cine-title">
          <Words>A model assigns intent</Words> <em><Words>before it acts.</Words></em>
        </h2>
        <p className="cine-lede">
          An ensemble runs at the edge, never the cloud — gradient-boosted trees, neural
          fingerprints, a continuously trained reputation graph.
        </p>
        <div className="dv-inline">
          <Sparkline data={SPARK_B} color="var(--c-magenta)" /> <span className="dv-mono">false-positive rate ↓42% / 30d</span>
        </div>
        <div className="dv-rail">
          <StatChip label="PRECISION" value={96.4} suffix="%" wobble={0.15} accent="var(--c-aqua)" />
          <StatChip label="RECALL"    value={94.8} suffix="%" wobble={0.12} accent="var(--c-lime)" />
          <StatChip label="F1"        value={95.6} suffix="%" wobble={0.10} accent="var(--c-amber)" />
        </div>
        <ClientOnly>
          <div className="dv-side dv-stack">
            <Tilt3D><ConfidenceGauge value={96.4} /></Tilt3D>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 4 — Decide · anim: fold/perspective flip */}
      <Chapter index={4} align="left" className="cine-anim-flip">
        <span className="cine-kicker">04 · Decide</span>
        <h2 className="cine-title">
          <Words>Two paths.</Words> <em><Words>One is chosen.</Words></em>
        </h2>
        <p className="cine-lede">
          Allow, challenge, redirect, or block. The rule that fired, the model that voted,
          the signals that mattered — all written to your ledger before the next request lands.
        </p>
        <ClientOnly>
          <div className="dv-side dv-stack">
            <Tilt3D intensity={8}><PipelineViz /></Tilt3D>
            <Tilt3D intensity={6}><Waterfall /></Tilt3D>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 5 — Route · anim: drift-from-bottom */}
      <Chapter index={5} align="right" className="cine-anim-drift">
        <a id="routes" />
        <span className="cine-kicker">05 · Route</span>
        <h2 className="cine-title">
          <Words>The visitor arrives</Words> <em><Words>before they finish blinking.</Words></em>
        </h2>
        <p className="cine-lede">
          A/B splits, geo-routing, device fallbacks, deep-links — composable as a small graph.
          One short URL, one durable contract, a thousand intelligent destinations.
        </p>
        <div className="dv-rail">
          <StatChip label="A/B SPLITS" value={1248} accent="var(--c-violet)" />
          <StatChip label="GEO RULES"  value={342}  accent="var(--c-sky)" />
          <StatChip label="DEEP LINKS" value={88}   suffix="k" accent="var(--c-lime)" />
        </div>
        <ClientOnly>
          <div className="dv-side dv-stack">
            <Tilt3D><BarRace /></Tilt3D>
            <Tilt3D intensity={6}><DonutMix /></Tilt3D>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 6 — Proof · anim: stagger-cascade */}
      <Chapter index={6} align="left" className="cine-anim-cascade">
        <a id="proof" />
        <span className="cine-kicker">06 · Proof</span>
        <h2 className="cine-title">
          <Words>Numbers we'd</Words> <em><Words>publish on a wall.</Words></em>
        </h2>
        <p className="cine-lede">
          A year of production traffic, measured on Cloudflare's network and reported in real time.
          Nothing in this section is hand-picked.
        </p>
        <StatGrid />
        <div className="dv-grid-2">
          <Tilt3D intensity={5}><EdgeLatencyChart /></Tilt3D>
          <Tilt3D intensity={5}><DonutMix /></Tilt3D>
        </div>
        <ClientOnly>
          <div className="dv-side dv-stack">
            <Tilt3D intensity={8}><ThreatFeed /></Tilt3D>
          </div>
        </ClientOnly>
      </Chapter>

      {/* 7 — Finale · anim: focus-pull */}
      <Chapter index={7} align="center" className="cine-anim-focus">
        <a id="scale" />
        <span className="cine-kicker">07 · Begin</span>
        <h2 className="cine-title">
          <Words>Route your first link</Words> <em><Words>in 90 seconds.</Words></em>
        </h2>
        <p className="cine-lede">
          No credit card. 10,000 routes free, forever. Bring your own domain when you're ready.
        </p>
        <div className="cine-finale-card">
          <div className="row">
            <input placeholder="https://your-long-url.com/destination" aria-label="URL" />
            <button className="cine-cta">Route it <span className="arr">→</span></button>
          </div>
          <div className="dv-rail" style={{ marginTop: 16 }}>
            <StatChip label="FREE ROUTES" value={10000} accent="var(--c-aqua)" />
            <StatChip label="SETUP TIME"  value={90}    suffix="s" accent="var(--c-amber)" />
            <StatChip label="CREDIT CARD" value={0}     suffix=" req." accent="var(--c-magenta)" />
          </div>
        </div>
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
