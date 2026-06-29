import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
// Critical above-fold path — loaded immediately
import { ScrollProgressProvider } from "../lib/scroll-progress";
import { MotionProvider } from "../lib/motion";
import { StageProvider, useStage } from "../lib/stage";
import { TokenProvider } from "../lib/token";
import { Nav } from "../components/site/Nav";
import { Hero } from "../components/site/Hero";
import { RoutingField } from "../components/site/RoutingField";
import { CursorRing } from "../components/site/CursorRing";
import { Preloader } from "../components/site/Preloader";
import { SectionGlyph } from "../components/site/SectionGlyph";
import { HandoffToken } from "../components/site/HandoffToken";

// Below-fold heavy components — lazy loaded after initial paint
const Problem = lazy(() => import("../components/site/Problem").then(m => ({ default: m.Problem })));
const Pipeline = lazy(() => import("../components/site/Pipeline").then(m => ({ default: m.Pipeline })));
const Threat = lazy(() => import("../components/site/Threat").then(m => ({ default: m.Threat })));
const Analytics = lazy(() => import("../components/site/Analytics").then(m => ({ default: m.Analytics })));
const Network = lazy(() => import("../components/site/Network").then(m => ({ default: m.Network })));
const Layers = lazy(() => import("../components/site/Layers").then(m => ({ default: m.Layers })));
const Confidence = lazy(() => import("../components/site/Confidence").then(m => ({ default: m.Confidence })));
const Finale = lazy(() => import("../components/site/Finale").then(m => ({ default: m.Finale })));
const TelemetryChrome = lazy(() => import("../components/site/TelemetryChrome").then(m => ({ default: m.TelemetryChrome })));
const Terminology = lazy(() => import("../components/site/Terminology").then(m => ({ default: m.Terminology })));

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
      { property: "og:url", content: "https://aegisroute.com/" },
    ],
    links: [{ rel: "canonical", href: "https://aegisroute.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AegisRoute",
          applicationCategory: "SecurityApplication",
          operatingSystem: "Web",
          url: "https://aegisroute.com/",
          description:
            "Edge-routed URL shortening with AI threat detection and real-time analytics.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Index,
});

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
  const lastScrollRef = useRef<number | null>(null);

  const rectRef = useRef<DOMRect | null>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Cache rect so subscriber never forces a live layout read
    const ro = new ResizeObserver(() => {
      rectRef.current = el.getBoundingClientRect();
    });
    ro.observe(el);
    // Initial read
    rectRef.current = el.getBoundingClientRect();

    // Track scroll to keep rect fresh without a layout thrash
    const onScroll = () => {
      if (!rectRef.current || !visibleRef.current) return;
      // Cheap: shift cached rect by scroll delta instead of forcing reflow
      const scrollDelta = window.scrollY - (lastScrollRef.current ?? window.scrollY);
      lastScrollRef.current = window.scrollY;
      if (rectRef.current) {
        rectRef.current = new DOMRect(
          rectRef.current.x,
          rectRef.current.y - scrollDelta,
          rectRef.current.width,
          rectRef.current.height,
        );
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Only subscribe to stage when element is visible
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        rectRef.current = el.getBoundingClientRect();
        lastScrollRef.current = window.scrollY;
      }
    }, { rootMargin: '200px' });
    io.observe(el);

    const unsub = stage.subscribe((f) => {
      if (!visibleRef.current || !rectRef.current) return;
      const r = rectRef.current;
      // -1 (below viewport) → 0 (centred) → +1 (above viewport)
      const c = (r.top + r.height / 2 - f.vh / 2) / f.vh;
      const cc = Math.max(-1, Math.min(1, c));
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

    return () => {
      unsub();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [stage, framing]);



  return (
    <div ref={ref} className="scene-frame" style={{ position: "relative" }}>
      <SectionGlyph text={glyph} align={align} size={size} over={over} top={top} shade={shade} />
      {children}
    </div>
  );
}

function Index() {
  const [preloaderDone, setPreloaderDone] = useState(false);
  return (
    <>
      {/* Experience renders IMMEDIATELY so React hydrates the full tree.
          Preloader sits on top as a CSS overlay and fades out on done. */}
      <Experience preloaderDone={preloaderDone} />
      {!preloaderDone && <Preloader onDone={() => setPreloaderDone(true)} />}
    </>
  );
}

function Experience({ preloaderDone }: { preloaderDone: boolean }) {
  if (typeof window !== 'undefined' && !(window as any).AegisStartup.expStart) {
    (window as any).AegisStartup.expStart = performance.now();
    console.log('[Startup] 5. Experience Rendered:', performance.now().toFixed(2) + 'ms');
  }
  return (
    <MotionProvider preloaderDone={preloaderDone}>
      <StageProvider>
        <TokenProvider>
        <ScrollProgressProvider>
          {/* Visible once preloader lifts — opacity transition so no layout shift */}
          <div style={{ opacity: preloaderDone ? 1 : 0, transition: 'opacity 0.3s' }}>
            <RoutingField />
            <CursorRing />
          </div>
          <Nav />
          <HandoffToken />
          <main>
            {/* Hero — always eager, above fold */}
            <Scene glyph="route." size="22vw" top="22vh" align="right" framing="pull">
              <Hero />
            </Scene>

            {/* Each section has its OWN Suspense so one slow chunk never
                blocks the rest. Previously ALL 9 sections shared one
                boundary — if Network (cobe WebGL) was slow, nothing below
                Hero rendered until it finished. */}
            <Suspense fallback={null}>
              <Scene glyph="blind." size="20vw" top="6vh" align="left" shade="ember" framing="tiltL">
                <Problem />
              </Scene>
            </Suspense>
            <Suspense fallback={null}>
              <Scene glyph="inspect." size="20vw" top="4vh" align="right" over framing="push">
                <Pipeline />
              </Scene>
            </Suspense>
            <Suspense fallback={null}>
              <Scene glyph="score." size="22vw" top="2vh" align="left" shade="ember" framing="tiltR">
                <Threat />
              </Scene>
            </Suspense>
            <Suspense fallback={null}>
              <Scene glyph="observe." size="20vw" top="4vh" align="right" framing="level">
                <Analytics />
              </Scene>
            </Suspense>
            <Suspense fallback={null}>
              <Terminology />
            </Suspense>
            <Suspense fallback={null}>
              <Scene glyph="38 regions" size="14vw" top="4vh" align="left" over framing="pull">
                <Network />
              </Scene>
            </Suspense>
            <Suspense fallback={null}>
              <Scene glyph="layer." size="22vw" top="2vh" align="right" framing="push">
                <Layers />
              </Scene>
            </Suspense>
            <Suspense fallback={null}>
              <Scene glyph="proof." size="20vw" top="6vh" align="left" framing="tiltL">
                <Confidence />
              </Scene>
            </Suspense>
            <Suspense fallback={null}>
              <Scene glyph="routed." size="26vw" top="40%" align="center" shade="paper" framing="pull">
                <Finale />
              </Scene>
            </Suspense>
          </main>
          <Suspense fallback={null}>
            <TelemetryChrome />
          </Suspense>
        </ScrollProgressProvider>
        </TokenProvider>
      </StageProvider>
    </MotionProvider>
  );
}

