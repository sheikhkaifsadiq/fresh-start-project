import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import { damp3 } from "maath/easing";

type Props = { progressRef: { current: number } };

// Hand-tuned camera stations. Each act gets its own framing — asymmetric,
// no two adjacent positions sharing the same axis emphasis.
const STATIONS: { pos: [number, number, number]; look: [number, number, number] }[] = [
  // 1 Origin — low, off-center-left, monolith looms
  { pos: [-2.6,  1.4,   8.0], look: [ 0.6, 2.2, 0.0] },
  // 2 Approach — high vantage, distant ridge
  { pos: [ 1.4,  3.2,  -8.0], look: [-0.6, 1.4, -22.0] },
  // 3 Threshold — pulled in to the aperture, slightly above center
  { pos: [ 0.0,  1.8, -22.0], look: [ 0.0, 1.6, -34.0] },
  // 4 Material — macro framing, slightly tilted
  { pos: [-0.8,  0.6, -42.0], look: [ 0.0, 0.4, -48.0] },
  // 5 Pattern — orbiting wide, looking down-and-in
  { pos: [ 3.4,  3.0, -56.0], look: [ 0.0, 0.0, -62.0] },
  // 6 Light — pulled back, low, dramatic vertical
  { pos: [-1.6,  0.8, -72.0], look: [ 0.0, 2.4, -78.0] },
  // 7 Fracture — push in to the shatter
  { pos: [ 0.4,  1.6, -88.0], look: [ 0.0, 1.2, -94.0] },
  // 8 Lattice — settle, rule-of-thirds left
  { pos: [-2.0,  1.4, -100.0], look: [ 0.6, 1.2, -108.0] },
  // 9 Plan — rise to a near top-down
  { pos: [ 0.0,  9.0, -115.0], look: [ 0.0, 0.0, -118.0] },
  // 10 Sanctuary — eye level, calm, off-center-right
  { pos: [ 2.0,  1.6, -130.0], look: [-0.4, 1.6, -140.0] },
  // 11 Proof — long lens look at a single object
  { pos: [ 0.2,  1.4, -148.0], look: [ 0.0, 1.4, -156.0] },
  // 12 Invitation — pulls up to the horizon
  { pos: [ 0.0,  2.6, -162.0], look: [ 0.0, 2.2, -176.0] },
];

export function CameraRig({ progressRef }: Props) {
  const { camera } = useThree();
  const eyeCurve = useMemo(
    () => new CatmullRomCurve3(STATIONS.map((s) => new Vector3(...s.pos)), false, "catmullrom", 0.5),
    []
  );
  const lookCurve = useMemo(
    () => new CatmullRomCurve3(STATIONS.map((s) => new Vector3(...s.look)), false, "catmullrom", 0.5),
    []
  );
  const tmpEye = useRef(new Vector3());
  const tmpLook = useRef(new Vector3());
  const curEye = useRef(new Vector3(...STATIONS[0].pos));
  const curLook = useRef(new Vector3(...STATIONS[0].look));

  useFrame((_, dt) => {
    const p = progressRef.current;
    // tiny hesitation before big reveals (acts 3, 7, 12)
    const hesitation =
      0.012 * Math.sin(p * 6.28 * 2.0) * Math.exp(-Math.pow((p - 0.62) * 9.0, 2.0));
    const u = Math.min(1, Math.max(0, p + hesitation));
    eyeCurve.getPoint(u, tmpEye.current);
    lookCurve.getPoint(u, tmpLook.current);
    // damp toward target — varies smoothing per beat for human pacing
    const smooth = 0.35 + 0.25 * Math.sin(p * 6.28 * 1.5 + 0.6);
    damp3(curEye.current, tmpEye.current, smooth, Math.min(dt, 0.05));
    damp3(curLook.current, tmpLook.current, smooth, Math.min(dt, 0.05));
    camera.position.copy(curEye.current);
    camera.lookAt(curLook.current);
  });
  return null;
}
