import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
} from "three";
import { samplePalette } from "./palette";

type Props = { progressRef: { current: number }; count?: number };

// Fog-borne particulate; drifts slowly, fades with the LUT.
export function Particles({ progressRef, count = 700 }: Props) {
  const ref = useRef<Points>(null);

  const { geom, mat } = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = -Math.random() * 180;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));

    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color("#f3e7c8") },
        uSize: { value: 1 },
        uPx: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime; uniform float uSize; uniform float uPx;
        void main() {
          vec3 p = position;
          p.y += sin(uTime * 0.3 + aSeed * 6.28) * 0.4;
          p.x += cos(uTime * 0.15 + aSeed * 9.0) * 0.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * uPx * (260.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d) * 0.55;
          gl_FragColor = vec4(uColor, a);
        }
      `,
    });
    return { geom: g, mat: m };
  }, [count]);

  useFrame(({ clock, size }) => {
    const p = progressRef.current;
    const s = samplePalette(p);
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uColor.value.copy(s.skyTop);
    mat.uniforms.uPx.value = Math.min(2, window.devicePixelRatio || 1);
    mat.uniforms.uSize.value = 0.8;
  });

  return <points ref={ref} args={[geom, mat]} frustumCulled={false} />;
}
