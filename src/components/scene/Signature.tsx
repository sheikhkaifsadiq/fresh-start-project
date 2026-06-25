import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferAttribute,
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Quaternion,
  ShaderMaterial,
  TetrahedronGeometry,
  Vector3,
} from "three";
import { fragmentVert, fragmentFrag } from "./shaders";
import { samplePalette, smoothstep } from "./palette";

type Props = { progressRef: { current: number }; count?: number };

// Fragments live around z = -94 to -118, sweeping across the signature beats.
export function Signature({ progressRef, count = 600 }: Props) {
  const meshRef = useRef<InstancedMesh>(null);

  const { material, geometry } = useMemo(() => {
    const geom = new TetrahedronGeometry(0.18, 0);
    // per-instance attributes
    const start = new Float32Array(count * 3);
    const grid = new Float32Array(count * 3);
    const plan = new Float32Array(count * 3);
    const rot = new Float32Array(count * 3);
    const seed = new Float32Array(count);

    // Lattice = a controlled-asymmetric grid (not perfectly uniform)
    const cols = 30;
    const rows = Math.ceil(count / cols);
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = (col - cols / 2 + 0.5) * 0.42 + (Math.sin(row * 1.7) * 0.06);
      const cy = (row - rows / 2 + 0.5) * 0.42 + (Math.cos(col * 1.3) * 0.05);
      // shattered start: a turbulent cloud
      const r = 2.6 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      start[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      start[i * 3 + 1] = 1.4 + r * Math.cos(phi);
      start[i * 3 + 2] = -94.0 + r * Math.sin(phi) * Math.sin(theta);
      // locked lattice
      grid[i * 3 + 0] = cx;
      grid[i * 3 + 1] = 1.2 + cy * 0.5;
      grid[i * 3 + 2] = -104.0;
      // plan view: flattened, top-down architectural draft
      plan[i * 3 + 0] = cx * 1.1;
      plan[i * 3 + 1] = -0.02 - Math.random() * 0.01; // ground-flat
      plan[i * 3 + 2] = -114.0 + cy * 0.9;

      rot[i * 3 + 0] = (Math.random() - 0.5) * 4.0;
      rot[i * 3 + 1] = (Math.random() - 0.5) * 4.0;
      rot[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
      seed[i] = Math.random();
    }
    geom.setAttribute("aStart", new InstancedBufferAttribute(start, 3));
    geom.setAttribute("aGrid", new InstancedBufferAttribute(grid, 3));
    geom.setAttribute("aPlan", new InstancedBufferAttribute(plan, 3));
    geom.setAttribute("aRot", new InstancedBufferAttribute(rot, 3));
    geom.setAttribute("aSeed", new InstancedBufferAttribute(seed, 1));

    const mat = new ShaderMaterial({
      vertexShader: fragmentVert,
      fragmentShader: fragmentFrag,
      transparent: true,
      uniforms: {
        uP1: { value: 0 },
        uP2: { value: 0 },
        uTime: { value: 0 },
        uAccent: { value: new Color("#8e8fb4") },
        uEdge: { value: new Color("#2c2a36") },
        uFog: { value: new Color("#dcd8e0") },
        uCam: { value: new Vector3() },
        uOpacity: { value: 1 },
      },
    });
    return { material: mat, geometry: geom };
  }, [count]);

  // Identity matrices for the instanced mesh; shader does all the work.
  useMemo(() => {
    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3(1, 1, 1);
    const p = new Vector3(0, 0, 0);
    // we'll write into mesh after mount
    setTimeout(() => {
      const mesh = meshRef.current;
      if (!mesh) return;
      for (let i = 0; i < count; i++) {
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }, 0);
  }, [count]);

  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const u = material.uniforms;
    // sub-progress windows
    const p1 = smoothstep(0.56, 0.74, p);
    const p2 = smoothstep(0.68, 0.82, p);
    u.uP1.value = p1;
    u.uP2.value = p2;
    u.uTime.value = clock.elapsedTime;
    u.uCam.value.copy(camera.position);

    // palette feeds material
    const s = samplePalette(p);
    u.uAccent.value.copy(s.accent);
    u.uEdge.value.copy(s.edge);
    u.uFog.value.copy(s.fog);

    // visible across signature window and gently into plan
    const vis = Math.min(
      smoothstep(0.52, 0.6, p),
      1 - smoothstep(0.84, 0.92, p)
    );
    u.uOpacity.value = Math.max(0, vis);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
