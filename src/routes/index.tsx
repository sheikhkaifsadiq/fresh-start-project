import { createFileRoute } from "@tanstack/react-router";
import { ScrollProgressProvider } from "../lib/scroll-progress";
import { MotionProvider } from "../lib/motion";
import { StageProvider } from "../lib/stage";
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

/** Wrap a section with an oversized drifting editorial fragment. */
function Scene({
  children, glyph, align = "right", size = "18vw", over = false, top = "auto", shade,
}: {
  children: React.ReactNode;
  glyph: string;
  align?: "left" | "right" | "center";
  size?: string;
  over?: boolean;
  top?: string;
  shade?: "ink" | "ember" | "paper";
}) {
  return (
    <div style={{ position: "relative" }}>
      <SectionGlyph text={glyph} align={align} size={size} over={over} top={top} shade={shade} />
      {children}
    </div>
  );
}

function Index() {
  return (
    <MotionProvider>
      <StageProvider>
        <ScrollProgressProvider>
          <Preloader />
          <RoutingField />
          <CursorRing />
          <Nav />
          <main>
            <Scene glyph="route." size="22vw" top="22vh" align="right">
              <Hero />
            </Scene>
            <Scene glyph="blind." size="20vw" top="6vh" align="left" shade="ember">
              <Problem />
            </Scene>
            <DriftBand />
            <Scene glyph="inspect." size="20vw" top="4vh" align="right" over>
              <Pipeline />
            </Scene>
            <Scene glyph="score." size="22vw" top="2vh" align="left" shade="ember">
              <Threat />
            </Scene>
            <Scene glyph="observe." size="20vw" top="4vh" align="right">
              <Analytics />
            </Scene>
            <DriftBand />
            <Scene glyph="38 regions" size="14vw" top="4vh" align="left" over>
              <Network />
            </Scene>
            <Scene glyph="layer." size="22vw" top="2vh" align="right">
              <Layers />
            </Scene>
            <Scene glyph="proof." size="20vw" top="6vh" align="left">
              <Confidence />
            </Scene>
            <Scene glyph="routed." size="26vw" top="40%" align="center" shade="paper">
              <Finale />
            </Scene>
          </main>
          <TelemetryChrome />
        </ScrollProgressProvider>
      </StageProvider>
    </MotionProvider>
  );
}
