// All GLSL fragments centralized. Pure strings, no JSX.

export const common = /* glsl */ `
  vec3 fogMix(vec3 col, float depth, vec3 fogCol, float near, float far) {
    float f = smoothstep(near, far, depth);
    return mix(col, fogCol, f);
  }
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise2(p); p *= 2.02; a *= 0.5; }
    return v;
  }
`;

export const paintedSkyVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

export const paintedSkyFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uFog;
  uniform float uTime;
  ${common}
  void main() {
    float y = pow(vUv.y, 1.35);
    vec3 col = mix(uBottom, uTop, y);
    // soft painterly cloud band
    float n = fbm(vec2(vUv.x * 3.0, vUv.y * 1.2 + uTime * 0.005));
    col = mix(col, uFog, smoothstep(0.35, 0.85, n) * 0.32);
    // film grain
    float g = (hash21(vUv * vec2(1920.0, 1080.0) + uTime) - 0.5) * 0.035;
    col += g;
    // vignette
    float v = smoothstep(0.95, 0.35, length(vUv - 0.5));
    col *= mix(0.78, 1.0, v);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const marbleVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export const marbleFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;
  uniform vec3 uBase;
  uniform vec3 uVein;
  uniform vec3 uFog;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uCam;
  ${common}
  void main() {
    vec2 p = vUv * 3.5;
    float n = fbm(p + vec2(uTime * 0.02, -uTime * 0.01));
    float veins = smoothstep(0.45, 0.55, fbm(p * 2.0 + n * 1.4));
    vec3 col = mix(uBase, uBase * 0.82, fbm(p * 0.6) * 0.6);
    col = mix(col, uVein, veins * 0.7);
    // sub edge darken
    float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)
               * smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
    col *= mix(0.55, 1.0, edge);
    // atmospheric perspective
    float depth = length(vWorld - uCam);
    col = fogMix(col, depth, uFog, 6.0, 60.0);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

export const terrainVert = /* glsl */ `
  varying vec3 vWorld;
  varying float vH;
  uniform float uTime;
  ${common}
  void main() {
    vec3 p = position;
    float h = fbm(p.xz * 0.08 + uTime * 0.005) * 2.6
            + fbm(p.xz * 0.3) * 0.6;
    p.y += h;
    vH = h;
    vec4 w = modelMatrix * vec4(p, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export const terrainFrag = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  varying float vH;
  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform vec3 uFog;
  uniform vec3 uCam;
  uniform float uOpacity;
  ${common}
  void main() {
    float band = smoothstep(-0.5, 2.0, vH);
    vec3 col = mix(uLow, uHigh, band);
    // banded value steps for editorial flatness
    float steps = floor(band * 5.0) / 5.0;
    col = mix(col, mix(uLow, uHigh, steps), 0.35);
    float depth = length(vWorld - uCam);
    col = fogMix(col, depth, uFog, 8.0, 80.0);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

// Fragment instance: positions interpolate aStart -> aGrid -> aPlan
export const fragmentVert = /* glsl */ `
  precision highp float;
  attribute vec3 aStart;
  attribute vec3 aGrid;
  attribute vec3 aPlan;
  attribute vec3 aRot;
  attribute float aSeed;

  uniform float uP1;   // fracture -> lattice  (0..1)
  uniform float uP2;   // lattice  -> plan     (0..1)
  uniform float uTime;

  varying vec3 vWorld;
  varying float vEdge;
  varying float vPhase;

  mat3 rotX(float a){ float c=cos(a),s=sin(a); return mat3(1.,0.,0., 0.,c,-s, 0.,s,c); }
  mat3 rotY(float a){ float c=cos(a),s=sin(a); return mat3(c,0.,s, 0.,1.,0., -s,0.,c); }
  mat3 rotZ(float a){ float c=cos(a),s=sin(a); return mat3(c,-s,0., s,c,0., 0.,0.,1.); }

  void main() {
    // Asymmetric eased blends — each phase has its own ease shape
    float p1 = smoothstep(0.0, 1.0, uP1);
    float p2 = smoothstep(0.0, 1.0, uP2);

    vec3 a = mix(aStart, aGrid, p1);
    vec3 b = mix(a, aPlan, p2);

    // a gentle hover during the "lattice" hold
    float hover = sin(uTime * 0.6 + aSeed * 6.28) * 0.04 * (1.0 - p2) * p1;
    b.y += hover;

    // rotation falls toward 0 as the plan resolves
    float rotMix = (1.0 - p2);
    mat3 rot = rotZ(aRot.z * rotMix) * rotY(aRot.y * rotMix) * rotX(aRot.x * rotMix);
    vec3 local = rot * position;

    vec4 instanced = instanceMatrix * vec4(local + b, 1.0);
    vec4 world = modelMatrix * instanced;
    vWorld = world.xyz;
    vPhase = p2;
    vEdge = 1.0 - clamp(dot(normalize(normal), vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const fragmentFrag = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  varying float vEdge;
  varying float vPhase;
  uniform vec3 uAccent;
  uniform vec3 uEdge;
  uniform vec3 uFog;
  uniform vec3 uCam;
  uniform float uOpacity;
  ${common}
  void main() {
    vec3 col = mix(uAccent * 0.85, uAccent, 0.6);
    col = mix(col, uEdge, vEdge * 0.6);
    // plan view flattens to graphite line-work look
    col = mix(col, uEdge * 1.35, vPhase * 0.55);
    float depth = length(vWorld - uCam);
    col = fogMix(col, depth, uFog, 5.0, 50.0);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

// A single tall light-shaft, additive
export const shaftVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const shaftFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  ${common}
  void main() {
    float x = abs(vUv.x - 0.5) * 2.0;
    float y = vUv.y;
    float core = pow(1.0 - x, 3.0);
    float fall = mix(1.0, 0.4, y);
    float n = fbm(vec2(vUv.x * 8.0, vUv.y * 2.0)) * 0.6 + 0.6;
    float a = core * fall * n * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;
