import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BackSide,
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from "three";
import {
  marbleVert,
  marbleFrag,
  paintedSkyVert,
  paintedSkyFrag,
  shaftVert,
  shaftFrag,
  terrainVert,
  terrainFrag,
} from "./shaders";
import { samplePalette, smoothstep } from "./palette";

type P = { progressRef: { current: number } };

// === Painted Sky =============================================================
export function Sky({ progressRef }: P) {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: paintedSkyVert,
        fragmentShader: paintedSkyFrag,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTop: { value: new Color("#c9c2b4") },
          uBottom: { value: new Color("#9a9384") },
          uFog: { value: new Color("#dcd5c8") },
          uTime: { value: 0 },
        },
      }),
    []
  );

  useFrame(({ clock }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    mat.uniforms.uTop.value.copy(s.skyTop);
    mat.uniforms.uBottom.value.copy(s.skyBottom);
    mat.uniforms.uFog.value.copy(s.fog);
    mat.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// === Act 1 — Origin: a single carved monolith ===============================
function Monolith({ progressRef }: P) {
  const ref = useRef<Mesh>(null);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: marbleVert,
        fragmentShader: marbleFrag,
        transparent: true,
        uniforms: {
          uBase: { value: new Color("#6c6457") },
          uVein: { value: new Color("#3a342c") },
          uFog: { value: new Color("#dcd5c8") },
          uCam: { value: new Vector3() },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
        },
      }),
    []
  );
  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    mat.uniforms.uBase.value.lerpColors(new Color("#6c6457"), s.accent, 0.15);
    mat.uniforms.uVein.value.copy(s.edge);
    mat.uniforms.uFog.value.copy(s.fog);
    mat.uniforms.uCam.value.copy(camera.position);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uOpacity.value = 1 - smoothstep(0.18, 0.32, p);
    if (ref.current) ref.current.position.y = 2.2 + Math.sin(clock.elapsedTime * 0.25) * 0.05;
  });
  return (
    <mesh ref={ref} position={[0.6, 2.2, 0]}>
      <boxGeometry args={[1.2, 4.6, 0.9]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// === Act 2 — Approach: ridge line in fog ====================================
function Ridge({ progressRef }: P) {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: terrainVert,
        fragmentShader: terrainFrag,
        transparent: true,
        side: DoubleSide,
        uniforms: {
          uLow: { value: new Color("#7e8a72") },
          uHigh: { value: new Color("#d6d2bd") },
          uFog: { value: new Color("#e7e1d0") },
          uCam: { value: new Vector3() },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
        },
      }),
    []
  );
  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    mat.uniforms.uLow.value.copy(s.edge);
    mat.uniforms.uHigh.value.copy(s.skyBottom);
    mat.uniforms.uFog.value.copy(s.fog);
    mat.uniforms.uCam.value.copy(camera.position);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uOpacity.value =
      Math.min(smoothstep(0.04, 0.12, p), 1 - smoothstep(0.22, 0.34, p));
  });
  return (
    <mesh position={[0, -1.2, -22]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[60, 60, 80, 80]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// === Act 3 — Threshold: a tall arched aperture ==============================
function Aperture({ progressRef }: P) {
  const ref = useRef<Mesh>(null);
  const innerRef = useRef<Mesh>(null);
  useFrame(({ camera, mouse }) => {
    const p = progressRef.current;
    const vis = Math.min(smoothstep(0.14, 0.22, p), 1 - smoothstep(0.30, 0.40, p));
    if (ref.current) {
      const m = ref.current.material as any;
      if (m.opacity !== undefined) {
        m.opacity = vis;
        m.transparent = true;
      }
      ref.current.position.x = mouse.x * 0.4;
      ref.current.position.y = 1.8 + mouse.y * 0.25;
    }
    if (innerRef.current) {
      const m = innerRef.current.material as any;
      m.opacity = vis * 0.85;
      m.transparent = true;
      innerRef.current.position.x = mouse.x * 0.55;
      innerRef.current.position.y = 1.6 + mouse.y * 0.3;
    }
  });
  const p0 = progressRef.current;
  const s = samplePalette(p0);
  return (
    <group position={[0, 0, -32]}>
      {/* tall outer arch — flat ring */}
      <mesh ref={ref} position={[0, 1.8, 0]}>
        <ringGeometry args={[2.1, 2.35, 64, 1, 0, Math.PI]} />
        <meshBasicMaterial color={s.edge} side={DoubleSide} transparent />
      </mesh>
      {/* inner light pool */}
      <mesh ref={innerRef} position={[0, 1.6, -1]}>
        <circleGeometry args={[1.7, 64]} />
        <meshBasicMaterial color={s.skyTop} transparent />
      </mesh>
    </group>
  );
}

// === Act 4 — Material: a flowing marble face ================================
function MarbleFace({ progressRef }: P) {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: marbleVert,
        fragmentShader: marbleFrag,
        transparent: true,
        uniforms: {
          uBase: { value: new Color("#efe2d2") },
          uVein: { value: new Color("#cf7c66") },
          uFog: { value: new Color("#f1e1d2") },
          uCam: { value: new Vector3() },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
        },
      }),
    []
  );
  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    mat.uniforms.uBase.value.lerpColors(new Color("#efe2d2"), s.skyTop, 0.4);
    mat.uniforms.uVein.value.copy(s.accent);
    mat.uniforms.uFog.value.copy(s.fog);
    mat.uniforms.uCam.value.copy(camera.position);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uOpacity.value = Math.min(
      smoothstep(0.23, 0.30, p),
      1 - smoothstep(0.38, 0.46, p)
    );
  });
  return (
    <mesh position={[0.6, 0.4, -47]} rotation={[0, -0.35, -0.05]}>
      <planeGeometry args={[6.5, 4.2, 1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// === Act 5 — Pattern: tessellated lattice of small tiles ====================
function Pattern({ progressRef }: P) {
  const ref = useRef<InstancedMesh>(null);
  const COUNT = 280;
  const items = useMemo(() => {
    const arr: { x: number; y: number; z: number; rot: number; scale: number }[] = [];
    const cols = 20;
    for (let i = 0; i < COUNT; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      arr.push({
        x: (c - cols / 2) * 0.6 + (Math.sin(r * 1.3) * 0.1),
        y: 0.05 + (r * 0.05),
        z: -57 + (r - 7) * 0.65 + Math.cos(c * 1.1) * 0.15,
        rot: (Math.sin(c * 3.1 + r) * 0.18),
        scale: 0.85 + Math.random() * 0.3,
      });
    }
    return arr;
  }, []);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: marbleVert,
        fragmentShader: marbleFrag,
        transparent: true,
        uniforms: {
          uBase: { value: new Color("#e9cfae") },
          uVein: { value: new Color("#b88550") },
          uFog: { value: new Color("#ecdcc6") },
          uCam: { value: new Vector3() },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
        },
      }),
    []
  );
  useMemo(() => {
    setTimeout(() => {
      const mesh = ref.current;
      if (!mesh) return;
      const m = new Matrix4();
      const q = new Quaternion();
      const s = new Vector3();
      const p = new Vector3();
      items.forEach((it, i) => {
        p.set(it.x, it.y, it.z);
        q.setFromAxisAngle(new Vector3(0, 1, 0), it.rot);
        s.set(it.scale, it.scale, it.scale);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }, 0);
  }, [items]);
  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    mat.uniforms.uBase.value.copy(s.skyTop);
    mat.uniforms.uVein.value.copy(s.accent);
    mat.uniforms.uFog.value.copy(s.fog);
    mat.uniforms.uCam.value.copy(camera.position);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uOpacity.value = Math.min(
      smoothstep(0.34, 0.40, p),
      1 - smoothstep(0.48, 0.56, p)
    );
  });
  return (
    <instancedMesh ref={ref} args={[undefined as any, mat, COUNT]} frustumCulled={false}>
      <boxGeometry args={[0.42, 0.06, 0.42]} />
    </instancedMesh>
  );
}

// === Act 6 — Light: a single architectural shaft ============================
function LightShaft({ progressRef }: P) {
  const shaftMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: shaftVert,
        fragmentShader: shaftFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColor: { value: new Color("#f5e9cb") },
          uOpacity: { value: 0 },
        },
      }),
    []
  );
  const floorMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: marbleVert,
        fragmentShader: marbleFrag,
        transparent: true,
        uniforms: {
          uBase: { value: new Color("#2e2418") },
          uVein: { value: new Color("#e0c790") },
          uFog: { value: new Color("#f5ead0") },
          uCam: { value: new Vector3() },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
        },
      }),
    []
  );
  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    const vis = Math.min(smoothstep(0.44, 0.50, p), 1 - smoothstep(0.58, 0.66, p));
    shaftMat.uniforms.uOpacity.value = vis * 0.85;
    shaftMat.uniforms.uColor.value.copy(s.accent).lerp(s.skyTop, 0.6);
    floorMat.uniforms.uBase.value.copy(s.edge);
    floorMat.uniforms.uVein.value.copy(s.accent);
    floorMat.uniforms.uFog.value.copy(s.fog);
    floorMat.uniforms.uCam.value.copy(camera.position);
    floorMat.uniforms.uTime.value = clock.elapsedTime;
    floorMat.uniforms.uOpacity.value = vis;
  });
  return (
    <group position={[0, 0, -76]}>
      {/* multi-plane shaft to fake volumetric */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          rotation={[0, (i * Math.PI) / 4, 0]}
          position={[0, 3, 0]}
        >
          <planeGeometry args={[2.4, 7.0]} />
          <primitive object={shaftMat} attach="material" />
        </mesh>
      ))}
      {/* dark floor catching the light */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <circleGeometry args={[8, 64]} />
        <primitive object={floorMat} attach="material" />
      </mesh>
    </group>
  );
}

// === Act 10 — Sanctuary: three receding arches ==============================
function Sanctuary({ progressRef }: P) {
  const matRef = useRef<ShaderMaterial>(null);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: marbleVert,
        fragmentShader: marbleFrag,
        transparent: true,
        side: DoubleSide,
        uniforms: {
          uBase: { value: new Color("#f3e7c8") },
          uVein: { value: new Color("#c89a6a") },
          uFog: { value: new Color("#f3ead0") },
          uCam: { value: new Vector3() },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
        },
      }),
    []
  );
  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    mat.uniforms.uBase.value.copy(s.skyTop);
    mat.uniforms.uVein.value.copy(s.accent);
    mat.uniforms.uFog.value.copy(s.fog);
    mat.uniforms.uCam.value.copy(camera.position);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uOpacity.value = Math.min(
      smoothstep(0.80, 0.86, p),
      1 - smoothstep(0.92, 0.98, p)
    );
  });
  return (
    <group position={[0, 0, -134]}>
      {[0, 1, 2].map((i) => {
        const z = -i * 4.5;
        const w = 4.5 - i * 0.7;
        const h = 5.0 - i * 0.7;
        return (
          <group key={i} position={[(i - 1) * 0.4, 0, z]}>
            {/* arch silhouette via tall ring (half) */}
            <mesh position={[0, h / 2, 0]}>
              <ringGeometry args={[w * 0.42, w * 0.5, 48, 1, 0, Math.PI]} />
              <primitive object={mat} attach="material" />
            </mesh>
            {/* columns */}
            <mesh position={[-w * 0.46, h * 0.25, 0]}>
              <boxGeometry args={[0.16, h * 0.5, 0.16]} />
              <primitive object={mat} attach="material" />
            </mesh>
            <mesh position={[w * 0.46, h * 0.25, 0]}>
              <boxGeometry args={[0.16, h * 0.5, 0.16]} />
              <primitive object={mat} attach="material" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// === Act 11 — Proof: a vellum field with a single inscribed mark ===========
function Proof({ progressRef }: P) {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: marbleVert,
        fragmentShader: marbleFrag,
        transparent: true,
        uniforms: {
          uBase: { value: new Color("#e1dac6") },
          uVein: { value: new Color("#6c6457") },
          uFog: { value: new Color("#ece5d1") },
          uCam: { value: new Vector3() },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
        },
      }),
    []
  );
  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    mat.uniforms.uBase.value.copy(s.skyTop);
    mat.uniforms.uVein.value.copy(s.edge);
    mat.uniforms.uFog.value.copy(s.fog);
    mat.uniforms.uCam.value.copy(camera.position);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uOpacity.value = Math.min(
      smoothstep(0.88, 0.93, p),
      1 - smoothstep(0.96, 1.00, p)
    );
  });
  return (
    <mesh position={[0, 1.4, -154]} rotation={[0, 0, -0.02]}>
      <planeGeometry args={[5.5, 3.6, 1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// === Act 12 — Invitation: horizon + ground ==================================
function Invitation({ progressRef }: P) {
  const ground = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: marbleVert,
        fragmentShader: marbleFrag,
        transparent: true,
        side: DoubleSide,
        uniforms: {
          uBase: { value: new Color("#d09a62") },
          uVein: { value: new Color("#b6703a") },
          uFog: { value: new Color("#f5e2c0") },
          uCam: { value: new Vector3() },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
        },
      }),
    []
  );
  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    ground.uniforms.uBase.value.copy(s.skyBottom);
    ground.uniforms.uVein.value.copy(s.accent);
    ground.uniforms.uFog.value.copy(s.fog);
    ground.uniforms.uCam.value.copy(camera.position);
    ground.uniforms.uTime.value = clock.elapsedTime;
    ground.uniforms.uOpacity.value = smoothstep(0.92, 0.99, p);
  });
  return (
    <mesh position={[0, -1.0, -176]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[80, 40, 1, 1]} />
      <primitive object={ground} attach="material" />
    </mesh>
  );
}

// === Aggregate ==============================================================
export function Acts(props: P) {
  return (
    <>
      <Monolith {...props} />
      <Ridge {...props} />
      <Aperture {...props} />
      <MarbleFace {...props} />
      <Pattern {...props} />
      <LightShaft {...props} />
      <Sanctuary {...props} />
      <Proof {...props} />
      <Invitation {...props} />
    </>
  );
}
