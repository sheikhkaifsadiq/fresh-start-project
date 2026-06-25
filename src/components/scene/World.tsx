import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useEffect, useRef } from "react";
import { FogExp2, Color } from "three";
import { CameraRig } from "./CameraRig";
import { Acts, Sky } from "./Acts";
import { Signature } from "./Signature";
import { Particles } from "./Particles";
import { samplePalette } from "./palette";
import type { Tier } from "../../lib/capabilities";

type Props = { progressRef: { current: number }; tier: Tier };

// Drives scene-level state (fog) from progress without re-rendering React.
function SceneDriver({ progressRef }: { progressRef: { current: number } }) {
  const fog = useRef(new FogExp2(0xdcd5c8, 0.018)).current;
  useFrame(({ scene }) => {
    const s = samplePalette(progressRef.current);
    if (scene.fog !== fog) scene.fog = fog;
    (fog.color as Color).copy(s.fog);
  });
  return null;
}

export function World({ progressRef, tier }: Props) {
  const dpr = tier === "high" ? [1, 1.75] as [number, number] : [1, 1] as [number, number];
  const fragmentCount = tier === "high" ? 600 : 300;
  const particleCount = tier === "high" ? 700 : 320;

  return (
    <Canvas
      className="film-stage-canvas"
      dpr={dpr}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: 38, near: 0.1, far: 400, position: [0, 1.6, 6] }}
      onCreated={({ gl }) => {
        gl.setClearColor(new Color("#dcd5c8"), 1);
      }}
    >
      <Suspense fallback={null}>
        <SceneDriver progressRef={progressRef} />
        <Sky progressRef={progressRef} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 6, 2]} intensity={0.35} />
        <Acts progressRef={progressRef} />
        <Signature progressRef={progressRef} count={fragmentCount} />
        <Particles progressRef={progressRef} count={particleCount} />
        <CameraRig progressRef={progressRef} />
        {tier === "high" && (
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.18}
              luminanceThreshold={0.85}
              luminanceSmoothing={0.2}
              mipmapBlur
            />
            <Noise opacity={0.04} blendFunction={BlendFunction.SCREEN} />
            <Vignette eskil={false} offset={0.35} darkness={0.55} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
