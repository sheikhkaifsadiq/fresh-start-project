import { createFileRoute } from "@tanstack/react-router";
import { ScrollProgressProvider } from "../lib/scroll-progress";
import { MotionProvider } from "../lib/motion";
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
import { Ambient } from "../components/site/Ambient";
import { CursorRing } from "../components/site/CursorRing";
import { Mask, Kinetic } from "../lib/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AegisRoute — A smarter route for every link." },
      {
        name: "description",
        content:
          "AegisRoute is an edge-routed URL platform with AI threat detection and real-time analytics. Every redirect inspected, scored, and decided in under twelve milliseconds.",
      },
      { property: "og:title", content: "AegisRoute — A smarter route for every link." },
      {
        property: "og:description",
        content:
          "Edge-routed URL shortening with AI threat detection and real-time analytics for serious teams.",
      },
    ],
  }),
  component: Index,
});

function DriftBand() {
  return (
    <section aria-hidden style={{ overflow: "hidden" }}>
      <div className="drift-band">
        <Mask>
          <Kinetic
            as="div"
            text="Inspect · Score · Decide · Route · Observe · Repeat"
            split="word"
            stagger={60}
            duration={1100}
            italicWords={[0, 2, 4]}
            style={{ display: "inline-block", whiteSpace: "nowrap" }}
          />
        </Mask>
      </div>
    </section>
  );
}

function Index() {
  return (
    <MotionProvider>
      <ScrollProgressProvider>
        <Ambient />
        <CursorRing />
        <Nav />
        <main>
          <Hero />
          <Problem />
          <DriftBand />
          <Pipeline />
          <Threat />
          <Analytics />
          <DriftBand />
          <Network />
          <Layers />
          <Confidence />
          <Finale />
        </main>
      </ScrollProgressProvider>
    </MotionProvider>
  );
}
