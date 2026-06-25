import { useEffect, useState } from "react";
import { MagneticLink } from "./MagneticLink";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className="nav" style={{
      background: scrolled
        ? "color-mix(in oklab, var(--paper) 86%, transparent)"
        : "color-mix(in oklab, var(--paper) 0%, transparent)",
      backdropFilter: scrolled ? "blur(14px) saturate(120%)" : "none",
      borderBottom: scrolled ? "1px solid var(--rule)" : "1px solid transparent",
      transition: "background .4s var(--ease-out), border-color .4s var(--ease-out), backdrop-filter .4s var(--ease-out)",
    }}>
      <div className="container-x nav-inner">
        <a href="#top" className="brand">
          <span className="brand-mark" />
          AegisRoute
        </a>
        <div className="nav-links">
          {["routing", "threat", "analytics", "network", "security"].map((id) => (
            <a key={id} href={`#${id}`}>{id.charAt(0).toUpperCase() + id.slice(1)}</a>
          ))}
        </div>
        <MagneticLink href="#cta" className="btn btn-ghost" style={{ padding: "10px 16px" }}>
          Route a Link
          <span className="arrow">→</span>
        </MagneticLink>
      </div>
    </nav>
  );
}
