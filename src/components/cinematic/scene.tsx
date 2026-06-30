import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCinematicScroll } from "./scroll";

/* ---------- Camera rig: flies down the Z axis through 8 stations ---------- */
const STATIONS = [
  // [x, y, z, lookAtX, lookAtY, lookAtZ]
  [0,    0.2,  18,   0,  0,   0],   // 0 Hero — wide
  [0.6, -0.4,  10,   0,  0,  -2],   // 1 Ingest — closer, slight side
  [-0.4, 0.3,   3,   0,  0,  -6],   // 2 Inspect — inside the shell
  [0.2, -0.2,  -3,   0,  0, -10],   // 3 Score — through the field
  [-0.8, 0.4,  -9,   0,  0, -14],   // 4 Decide — fork
  [0.0,  0.0, -16,   0,  0, -22],   // 5 Route — ribbon tunnel
  [0.0, -0.3, -24,   0,  0, -30],   // 6 Proof — globe approach
  [0.0,  0.0, -32,   0,  0, -38],   // 7 Finale — pulled back
] as const;

function CameraRig() {
  const { camera } = useThree();
  const scroll = useCinematicScroll();
  const pos = useRef(new THREE.Vector3(0, 0.2, 18));
  const look = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, dt) => {
    const f = scroll.read();
    const idx = f.c; // 0..STATIONS.length-1
    const i0 = Math.max(0, Math.min(STATIONS.length - 2, Math.floor(idx)));
    const t  = Math.max(0, Math.min(1, idx - i0));
    // Smooth eased blend between stations
    const e = t * t * (3 - 2 * t);
    const a = STATIONS[i0];
    const b = STATIONS[i0 + 1] ?? a;

    const tx = a[0] + (b[0] - a[0]) * e;
    const ty = a[1] + (b[1] - a[1]) * e;
    const tz = a[2] + (b[2] - a[2]) * e;
    const lx = a[3] + (b[3] - a[3]) * e;
    const ly = a[4] + (b[4] - a[4]) * e;
    const lz = a[5] + (b[5] - a[5]) * e;

    // Subtle parallax breathing
    const breathe = Math.sin(performance.now() * 0.0006) * 0.06;

    const damp = 1 - Math.exp(-dt * 5);
    pos.current.lerp(new THREE.Vector3(tx, ty + breathe, tz), damp);
    look.current.lerp(new THREE.Vector3(lx, ly, lz), damp);

    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });

  return null;
}

/* ---------- Packet tunnel (instanced glowing particles along Z) ---------- */
function PacketTunnel() {
  const COUNT = 1400;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const scroll = useCinematicScroll();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      new Array(COUNT).fill(0).map((_, i) => ({
        r: 1.6 + Math.random() * 4.2,
        a: Math.random() * Math.PI * 2,
        z: -36 + Math.random() * 56,
        s: 0.02 + Math.random() * 0.05,
        v: 0.5 + Math.random() * 1.6,
        hueShift: Math.random(),
        twist: (Math.random() - 0.5) * 0.4,
      })),
    [],
  );

  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    const f = scroll.read();
    const flow = 1 + Math.min(8, Math.abs(f.v) * 80);
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      // Move toward camera along Z
      s.z += dt * s.v * flow;
      if (s.z > 22) s.z = -36;
      const a = s.a + s.twist * Math.sin(performance.now() * 0.0004 + i);
      dummy.position.set(Math.cos(a) * s.r, Math.sin(a) * s.r, s.z);
      const scale = s.s * (1 + Math.min(1.5, Math.abs(f.v) * 30));
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    // Color shift across chapters
    if (matRef.current) {
      const hue = 0.52 - Math.min(0.16, f.c * 0.012);
      matRef.current.color.setHSL(hue, 0.7, 0.62);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial ref={matRef} color="#7adfff" transparent opacity={0.85} toneMapped={false} />
    </instancedMesh>
  );
}

/* ---------- Core: morphing icosahedron with wireframe shell ---------- */
function Core() {
  const inner = useRef<THREE.Mesh>(null);
  const outer = useRef<THREE.LineSegments>(null);
  const scroll = useCinematicScroll();

  const geom = useMemo(() => new THREE.IcosahedronGeometry(1.6, 3), []);
  const basePositions = useMemo(() => {
    const arr = geom.attributes.position.array as Float32Array;
    return new Float32Array(arr);
  }, [geom]);

  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.0, 1)), []);

  useFrame(() => {
    if (!inner.current || !outer.current) return;
    const f = scroll.read();
    const t = performance.now() * 0.00035;

    // Distortion increases through "Inspect" → peaks at chapter 3
    const dist = 0.04 + Math.min(0.55, Math.max(0, (f.c - 1) * 0.18));
    const pos = inner.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const bx = basePositions[i], by = basePositions[i + 1], bz = basePositions[i + 2];
      const n = Math.sin(bx * 3 + t * 2.1) * Math.cos(by * 3 + t * 1.6) * Math.sin(bz * 3 + t * 1.3);
      const k = 1 + n * dist;
      arr[i] = bx * k; arr[i + 1] = by * k; arr[i + 2] = bz * k;
    }
    pos.needsUpdate = true;
    inner.current.geometry.computeVertexNormals();

    inner.current.rotation.y += 0.0025;
    inner.current.rotation.x = Math.sin(t) * 0.18;
    outer.current.rotation.y -= 0.0014;
    outer.current.rotation.x = Math.cos(t * 0.8) * 0.12;

    // Fade out as we leave it (after chapter 4)
    const visIn  = THREE.MathUtils.smoothstep(f.c, -0.2, 0.6);
    const visOut = 1 - THREE.MathUtils.smoothstep(f.c, 3.4, 5.2);
    const vis = Math.max(0, Math.min(1, visIn * visOut));
    (inner.current.material as THREE.MeshStandardMaterial).opacity = vis * 0.95;
    ((outer.current.material as THREE.LineBasicMaterial)).opacity = vis * 0.45;
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={inner} geometry={geom}>
        <meshStandardMaterial
          color="#0e2a36"
          emissive="#7adfff"
          emissiveIntensity={0.35}
          roughness={0.18}
          metalness={0.85}
          transparent
          opacity={0.9}
        />
      </mesh>
      <lineSegments ref={outer} geometry={edges}>
        <lineBasicMaterial color="#b9cdd5" transparent opacity={0.45} />
      </lineSegments>
    </group>
  );
}

/* ---------- Fork: two diverging ribbons (Decide) ---------- */
function Fork() {
  const scroll = useCinematicScroll();
  const groupRef = useRef<THREE.Group>(null);

  const curves = useMemo(() => {
    const make = (sx: number, col: string) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const z = -8 - t * 12;
        const x = sx * Math.pow(t, 1.6) * 4.5;
        const y = Math.sin(t * Math.PI) * 0.4 * sx;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.TubeGeometry(curve, 80, 0.035, 8, false);
      return { tube, col };
    };
    return [make(-1, "#7adfff"), make(1, "#ff8a5b")];
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const f = scroll.read();
    const vis = THREE.MathUtils.smoothstep(f.c, 3.0, 4.6) * (1 - THREE.MathUtils.smoothstep(f.c, 5.4, 6.4));
    groupRef.current.children.forEach((m) => {
      const mat = (m as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = vis;
    });
  });

  return (
    <group ref={groupRef}>
      {curves.map((c, i) => (
        <mesh key={i} geometry={c.tube}>
          <meshBasicMaterial color={c.col} transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Globe shell (Proof/Route) ---------- */
function GlobeShell() {
  const ref = useRef<THREE.LineSegments>(null);
  const scroll = useCinematicScroll();
  const geom = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.4, 4)), []);

  useFrame(() => {
    if (!ref.current) return;
    const f = scroll.read();
    const vis = THREE.MathUtils.smoothstep(f.c, 5.2, 6.4);
    (ref.current.material as THREE.LineBasicMaterial).opacity = vis * 0.6;
    ref.current.rotation.y += 0.0015;
    ref.current.rotation.x += 0.0004;
  });

  return (
    <lineSegments ref={ref} position={[0, 0, -30]} geometry={geom}>
      <lineBasicMaterial color="#7adfff" transparent opacity={0} toneMapped={false} />
    </lineSegments>
  );
}

/* ---------- Scene ---------- */
export function CinematicScene() {
  return (
    <div className="cine-canvas-fixed">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 18], fov: 38, near: 0.1, far: 200 }}
      >
        <color attach="background" args={["#02080d"]} />
        <fog attach="fog" args={["#02080d", 18, 70]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[6, 8, 6]} intensity={0.6} color="#7adfff" />
        <pointLight position={[-4, -2, 4]} intensity={0.8} color="#ff8a5b" distance={20} />
        <Suspense fallback={null}>
          <Core />
          <PacketTunnel />
          <Fork />
          <GlobeShell />
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
