import { useEffect, useState } from "react";

export function Loader({ ready }: { ready: boolean }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setHidden(true), 1400);
    return () => clearTimeout(t);
  }, [ready]);

  if (hidden) return null;

  return (
    <div className={`loader ${ready ? "is-done" : ""}`}>
      <div className="loader-inner">
        <div className="big"><em>aegisroute</em></div>
        <div>A short film in twelve acts</div>
        <div className="loader-bar" />
      </div>
    </div>
  );
}
