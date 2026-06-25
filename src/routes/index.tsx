import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ScrollProgressProvider, useProgressRef } from "../lib/scroll-progress";
import { detectTier, supportsWebGL, type Tier } from "../lib/capabilities";
import { Chrome } from "../components/site/Chrome";
import { Overlay } from "../components/site/Overlay";
import { Loader } from "../components/site/Loader";
import { Cursor } from "../components/site/Cursor";
import { Fallback } from "../components/site/Fallback";

const World = lazy(() =>
  import("../components/scene/World").then((m) => ({ default: m.World }))
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AegisRoute — Routing, Shielded." },
      {
        name: "description",
        content:
          "An edge-routed link, watched in real time. AegisRoute pairs URL shortening with AI threat detection at the perimeter.",
      },
      { property: "og:title", content: "AegisRoute — Routing, Shielded." },
      {
        property: "og:description",
        content:
          "An edge-routed link, watched in real time. URL shortening with AI threat detection.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  const [tier, setTier] = useState<Tier>("high");
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setTier(detectTier());
    setHasWebGL(supportsWebGL());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)" }} />
    );
  }

  if (!hasWebGL) {
    return <Fallback />;
  }

  return (
    <ScrollProgressProvider>
      <Film tier={tier} />
    </ScrollProgressProvider>
  );
}

function Film({ tier }: { tier: Tier }) {
  const progressRef = useProgressRef();
  const [ready, setReady] = useState(false);

  // give the canvas a beat to compile shaders before lifting the loader
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div className="film-stage">
        <Suspense fallback={null}>
          <World progressRef={progressRef} tier={tier} />
        </Suspense>
      </div>
      <Chrome />
      <Overlay />
      <Cursor />
      <div className="film-scroll-length" />
      <Loader ready={ready} />
    </>
  );
}
