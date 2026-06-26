import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MobileLanding } from "../components/site/mobile/MobileLanding";
import { ScrollProgressProvider } from "../lib/scroll-progress";
import { MotionProvider } from "../lib/motion";
import { StageProvider, useStage } from "../lib/stage";
import { TokenProvider } from "../lib/token";
import { Nav } from "../components/site/Nav";
import { Hero } from "../components/site/Hero";
import { Problem } from "../components/site/Problem";
import { Pipeline } from "../components/site/Pipeline";
import { Threat } from "../components/site/Threat";
import { Analytics } from "../components/site/Analytics";
import { Network } from "../components/site/Network";
import { Layers } from "../components/site/Layers";
import { Confidence } from "../components/site/Confidence";
import { Finale } from "../components/site/Finale";
import { RoutingField } from "../components/site/RoutingField";
import { TelemetryChrome } from "../components/site/TelemetryChrome";
import { CursorRing } from "../components/site/CursorRing";
import { Preloader } from "../components/site/Preloader";
import { SectionGlyph } from "../components/site/SectionGlyph";
import { HandoffToken } from "../components/site/HandoffToken";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AegisRoute — A smarter route for every link." },
      {
        name: "description",
        content:
          "Edge-routed URL shortening with AI threat detection and real-time analytics. Every redirect inspected and decided in under 12ms.",
      },
      { property: "og:title", content: "AegisRoute — A smarter route for every link." },
      {
        property: "og:description",
        content:
          "Edge-routed URL shortening with AI threat detection and real-time analytics.",
      },
      { property: "og:url", content: "https://aegisroute.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://aegisroute.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AegisRoute",
          applicationCategory: "SecurityApplication",
          operatingSystem: "Web",
          url: "https://aegisroute.lovable.app/",
          description:
            "Edge-routed URL shortening with AI threat detection and real-time analytics.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Index,
});

function DriftBand() {
  const phrase = "Inspect · Score · Decide · Route · Observe · Repeat";
  return (
    <section aria-hidden className="drift-band">
      <div className="drift-track">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="drift-item">{phrase}<span className="drift-sep">·</span></span>
        ))}
      </div>
    </section>
  );
}

/**
 * Scene wrapper — provides:
 *  - oversized drifting glyph (spatial typography)
 *  - very subtle cinematic framing: a 0.4-0.8deg rotational push on
 *    enter/exit so consecutive scenes feel like camera moves, not slides.
 *    Cap is intentionally small (editorial, not game-like).
 */
function Scene({
  children, glyph, align = "right", size = "18vw", over = false, top = "auto", shade,
  framing = "level",
}: {
  children: React.ReactNode;
  glyph: string;
  align?: "left" | "right" | "center";
  size?: string;
  over?: boolean;
  top?: string;
  shade?: "ink" | "ember" | "paper";
  /** subtle camera framing for the scene */
  framing?: "level" | "push" | "pull" | "tiltL" | "tiltR";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stage = useStage();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return stage.subscribe((f) => {
      const r = el.getBoundingClientRect();
      // -1 (below viewport) → 0 (centred) → +1 (above viewport)
      const c = (r.top + r.height / 2 - f.vh / 2) / f.vh;
      const cc = Math.max(-1, Math.min(1, c));
      // base parameters per framing — cap intentionally small
      let rx = 0, ry = 0, ty = 0, sc = 1;
      switch (framing) {
        case "push":  sc = 1 - cc * 0.012; rx = cc * 0.4; break;
        case "pull":  sc = 1 + cc * 0.012; rx = -cc * 0.4; break;
        case "tiltL": ry = cc * 0.6; rx = -cc * 0.3; break;
        case "tiltR": ry = -cc * 0.6; rx = -cc * 0.3; break;
        default:      rx = -cc * 0.25;
      }
      ty = cc * 6;
      el.style.transform =
        `perspective(2200px) translate3d(0, ${ty.toFixed(2)}px, 0) ` +
        `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${sc.toFixed(4)})`;
    });
  }, [stage, framing]);

  return (
    <div ref={ref} className="scene-frame" style={{ position: "relative" }}>
      <SectionGlyph text={glyph} align={align} size={size} over={over} top={top} shade={shade} />
      {children}
    </div>
  );
}

function Index() {
  const [ready, setReady] = useState(false);
  // Synchronous viewport check — phones never mount the desktop tree.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 720px)");
    const on = () => setIsMobile(mql.matches);
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
      {ready && (isMobile ? <MobileLanding /> : <Experience />)}
    </>
  );
}

function Experience() {
  return (
    <MotionProvider>
      <StageProvider>
        <TokenProvider>
        <ScrollProgressProvider>
          <RoutingField />
          <CursorRing />
          <Nav />
          <HandoffToken />
          <main>
            <Scene glyph="route." size="22vw" top="22vh" align="right" framing="pull">
              <Hero />
            </Scene>
            <Scene glyph="blind." size="20vw" top="6vh" align="left" shade="ember" framing="tiltL">
              <Problem />
            </Scene>
            <DriftBand />
            <Scene glyph="inspect." size="20vw" top="4vh" align="right" over framing="push">
              <Pipeline />
            </Scene>
            <Scene glyph="score." size="22vw" top="2vh" align="left" shade="ember" framing="tiltR">
              <Threat />
            </Scene>
            <Scene glyph="observe." size="20vw" top="4vh" align="right" framing="level">
              <Analytics />
            </Scene>
            <DriftBand />
            <Scene glyph="38 regions" size="14vw" top="4vh" align="left" over framing="pull">
              <Network />
            </Scene>
            <Scene glyph="layer." size="22vw" top="2vh" align="right" framing="push">
              <Layers />
            </Scene>
            <Scene glyph="proof." size="20vw" top="6vh" align="left" framing="tiltL">
              <Confidence />
            </Scene>
            <Scene glyph="routed." size="26vw" top="40%" align="center" shade="paper" framing="pull">
              <Finale />
            </Scene>
          </main>
          <TelemetryChrome />
        </ScrollProgressProvider>
        </TokenProvider>
      </StageProvider>
    </MotionProvider>
  );
}
