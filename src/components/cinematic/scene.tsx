import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCinematicScroll } from "./scroll";

/* ============================================================
   "Liquid Cosmos" — a hyper-saturated, gravity-driven scene.
   - 10+ color palette flowing through every layer
   - Interactive pointer gravity (particles fall toward cursor)
   - Morphing iridescent core that mutates per chapter
   - Aurora ribbons + nebula clouds + bokeh dust
   ============================================================ */

const PALETTE = [
  "#ff2d75", // hot magenta
  "#ff6a3d", // coral
  "#ffb547", // amber
  "#ffe45c", // sun gold
  "#7cf38a", // lime mint
  "#3cf0d4", // aqua
  "#3ab8ff", // sky
  "#6a6bff", // indigo
  "#b66bff", // violet
  "#ff7ae0", // bubblegum
  "#ff4775", // rose
  "#62ffd5", // turquoise
].map((c) => new THREE.Color(c));

/* ---------------- Pointer (normalized, eased) ---------------- */
function usePointer() {
  const ref = useRef({ x: 0, y: 0, tx: 0, ty: 0, down: 0, tdown: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ref.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onDown = () => (ref.current.tdown = 1);
    const onUp = () => (ref.current.tdown = 0);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);
  useFrame((_, dt) => {
    const p = ref.current;
    const k = 1 - Math.exp(-dt * 6);
    p.x += (p.tx - p.x) * k;
    p.y += (p.ty - p.y) * k;
    p.down += (p.tdown - p.down) * k;
  });
  return ref;
}

/* ---------------- Camera rig (drifts through 8 stations) ---------------- */
const STATIONS = [
  [0, 0.3, 14, 0, 0, 0],
  [1.2, -0.4, 10, 0, 0, -2],
  [-1.4, 0.6, 6, 0, 0, -5],
  [0.5, -0.8, 2, 0, 0, -9],
  [-1.6, 0.4, -3, 0, 0, -12],
  [0.0, 0.0, -9, 0, 0, -18],
  [0.0, -0.4, -16, 0, 0, -24],
  [0.0, 0.0, -22, 0, 0, -30],
] as const;

function CameraRig({ pointer }: { pointer: ReturnType<typeof usePointer> }) {
  const { camera } = useThree();
  const scroll = useCinematicScroll();
  const pos = useRef(new THREE.Vector3(0, 0.3, 14));
  const look = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, dt) => {
    const f = scroll.read();
    const i0 = Math.max(0, Math.min(STATIONS.length - 2, Math.floor(f.c)));
    const t = Math.max(0, Math.min(1, f.c - i0));
    const e = t * t * (3 - 2 * t);
    const a = STATIONS[i0];
    const b = STATIONS[i0 + 1] ?? a;
    const px = pointer.current.x, py = pointer.current.y;
    const target = new THREE.Vector3(
      a[0] + (b[0] - a[0]) * e + px * 0.9,
      a[1] + (b[1] - a[1]) * e + py * 0.6,
      a[2] + (b[2] - a[2]) * e,
    );
    const lookT = new THREE.Vector3(
      a[3] + (b[3] - a[3]) * e + px * 0.4,
      a[4] + (b[4] - a[4]) * e + py * 0.3,
      a[5] + (b[5] - a[5]) * e,
    );
    const damp = 1 - Math.exp(-dt * 4);
    pos.current.lerp(target, damp);
    look.current.lerp(lookT, damp);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    camera.rotation.z = px * 0.05;
  });
  return null;
}

/* ---------------- Gravity dust: 2400 colorful instanced points
                    that fall toward pointer + drift on physics ---------------- */
function GravityDust({ pointer }: { pointer: ReturnType<typeof usePointer> }) {
  const COUNT = 2400;
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scroll = useCinematicScroll();

  const data = useMemo(
    () =>
      new Array(COUNT).fill(0).map(() => {
        const r = 4 + Math.random() * 16;
        const a = Math.random() * Math.PI * 2;
        const z = -30 + Math.random() * 50;
        return {
          p: new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.6, z),
          v: new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
          ),
          s: 0.018 + Math.random() * 0.06,
          c: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          phase: Math.random() * Math.PI * 2,
        };
      }),
    [],
  );

  // Per-instance color
  useEffect(() => {
    if (!ref.current) return;
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const c = data[i].c;
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    ref.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    ref.current.instanceColor.needsUpdate = true;
  }, [data]);

  const tmpTarget = useMemo(() => new THREE.Vector3(), []);
  const tmpForce = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    if (!ref.current) return;
    const f = scroll.read();
    const flow = 1 + Math.min(6, Math.abs(f.v) * 60);
    // Project pointer into world at z ~ camera-2
    const cam = state.camera;
    tmpTarget.set(pointer.current.x, pointer.current.y, 0.5).unproject(cam);
    // Pull dust gently toward a point in front of camera, biased by pointer
    const gravity = 0.7 + pointer.current.down * 2.4;

    for (let i = 0; i < COUNT; i++) {
      const d = data[i];
      tmpForce.copy(tmpTarget).sub(d.p);
      const dist2 = Math.max(0.6, tmpForce.lengthSq());
      tmpForce.normalize().multiplyScalar((gravity / dist2) * dt);
      d.v.add(tmpForce);
      // Swirling field
      d.v.x += Math.sin(d.p.y * 0.3 + state.clock.elapsedTime * 0.4 + d.phase) * 0.0006 * flow;
      d.v.y += Math.cos(d.p.x * 0.3 + state.clock.elapsedTime * 0.5 + d.phase) * 0.0006 * flow;
      d.v.z += 0.002 * flow * dt * 20;
      // Damp
      d.v.multiplyScalar(0.985);
      d.p.add(d.v);
      // Recycle when past camera
      if (d.p.z > 8) {
        d.p.z = -32;
        d.p.x = (Math.random() - 0.5) * 30;
        d.p.y = (Math.random() - 0.5) * 18;
      }

      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + d.phase) * 0.25;
      dummy.position.copy(d.p);
      dummy.scale.setScalar(d.s * pulse);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial vertexColors toneMapped={false} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------- Liquid Core: iridescent shader sphere ---------------- */
const coreVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform float uTime;
  uniform float uDistort;
  // simple 3d noise (Ashima-style minimal)
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289v4(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289v4(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0,0.5,1.0,2.0);
    vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m*m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  void main(){
    vec3 p = position;
    float n = snoise(p*1.2 + vec3(uTime*0.35));
    float n2 = snoise(p*2.6 + vec3(-uTime*0.5));
    p += normal * (n*0.45 + n2*0.18) * uDistort;
    vNormal = normalize(normalMatrix * normal);
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
  }
`;

const coreFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform float uTime;
  uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uD;
  void main(){
    float f = dot(normalize(vNormal), vec3(0.0,0.0,1.0));
    float fres = pow(1.0 - max(f, 0.0), 2.2);
    // Iridescent ramp across 4 colors over normal angle + time
    float t = 0.5 + 0.5*sin(vPos.x*1.2 + vPos.y*1.4 + uTime*0.6);
    float u = 0.5 + 0.5*cos(vPos.z*1.1 - uTime*0.4);
    vec3 col1 = mix(uA, uB, t);
    vec3 col2 = mix(uC, uD, u);
    vec3 col = mix(col1, col2, fres);
    col += fres * 0.6;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function LiquidCore() {
  const ref = useRef<THREE.Mesh>(null);
  const scroll = useCinematicScroll();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistort: { value: 0.2 },
      uA: { value: new THREE.Color("#ff2d75") },
      uB: { value: new THREE.Color("#6a6bff") },
      uC: { value: new THREE.Color("#3cf0d4") },
      uD: { value: new THREE.Color("#ffb547") },
    }),
    [],
  );

  useFrame((_, dt) => {
    if (!ref.current) return;
    const f = scroll.read();
    uniforms.uTime.value += dt;
    // distortion peaks mid-journey
    const peak = 1 - Math.abs(f.c - 3) / 4;
    uniforms.uDistort.value = THREE.MathUtils.lerp(uniforms.uDistort.value, 0.25 + Math.max(0, peak) * 0.85, 0.05);
    // rotate slow palette through PALETTE based on chapter
    const i = Math.floor(f.c) % PALETTE.length;
    uniforms.uA.value.lerp(PALETTE[i], 0.02);
    uniforms.uB.value.lerp(PALETTE[(i + 3) % PALETTE.length], 0.02);
    uniforms.uC.value.lerp(PALETTE[(i + 6) % PALETTE.length], 0.02);
    uniforms.uD.value.lerp(PALETTE[(i + 9) % PALETTE.length], 0.02);

    ref.current.rotation.y += dt * 0.18;
    ref.current.rotation.x = Math.sin(uniforms.uTime.value * 0.4) * 0.2;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.8, 64]} />
      <shaderMaterial vertexShader={coreVert} fragmentShader={coreFrag} uniforms={uniforms} />
    </mesh>
  );
}

/* ---------------- Aurora ribbons (3 large stretched planes) ---------------- */
function Aurora() {
  const groupRef = useRef<THREE.Group>(null);
  const tRef = useRef(0);
  useFrame((_, dt) => {
    tRef.current += dt;
    if (!groupRef.current) return;
    groupRef.current.children.forEach((m, i) => {
      m.rotation.z = Math.sin(tRef.current * 0.2 + i) * 0.4;
      m.position.y = Math.sin(tRef.current * 0.3 + i * 1.3) * 1.2;
    });
  });
  const colors = ["#ff2d75", "#3ab8ff", "#7cf38a", "#b66bff"];
  return (
    <group ref={groupRef} position={[0, 0, -10]}>
      {colors.map((c, i) => (
        <mesh key={i} position={[(i - 1.5) * 3, 0, -i * 2]} rotation={[0, 0, i * 0.3]}>
          <planeGeometry args={[28, 4, 1, 1]} />
          <meshBasicMaterial color={c} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- Scene wrapper ---------------- */
function SceneBody() {
  const pointer = usePointer();
  return (
    <>
      <color attach="background" args={["#05030f"]} />
      <fog attach="fog" args={["#05030f", 14, 60]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 4, 5]} intensity={2} color="#ff2d75" distance={20} />
      <pointLight position={[-6, -3, 4]} intensity={1.6} color="#3cf0d4" distance={22} />
      <pointLight position={[0, 6, -8]} intensity={1.2} color="#ffb547" distance={28} />
      <Suspense fallback={null}>
        <Aurora />
        <LiquidCore />
        <GravityDust pointer={pointer} />
      </Suspense>
      <CameraRig pointer={pointer} />
    </>
  );
}

export function CinematicScene() {
  return (
    <div className="cine-canvas-fixed">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.3, 14], fov: 42, near: 0.1, far: 200 }}
      >
        <SceneBody />
      </Canvas>
    </div>
  );
}
