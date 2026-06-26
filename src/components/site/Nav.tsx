import { useEffect, useState } from "react";
import { MagneticLink } from "./MagneticLink";

const LINKS = ["routing", "threat", "analytics", "network", "security"];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <nav
        className="nav"
        style={{
          background: scrolled
            ? "color-mix(in oklab, var(--paper) 86%, transparent)"
            : "color-mix(in oklab, var(--paper) 0%, transparent)",
          backdropFilter: scrolled ? "blur(14px) saturate(120%)" : "none",
          borderBottom: scrolled ? "1px solid var(--rule)" : "1px solid transparent",
          transition: "background .4s var(--ease-out), border-color .4s var(--ease-out), backdrop-filter .4s var(--ease-out)",
        }}
      >
        <div className="container-x nav-inner">
          <a href="#top" className="brand">
            <span className="brand-mark" />
            AegisRoute
          </a>
          <div className="nav-links">
            {LINKS.map((id) => (
              <a key={id} href={`#${id}`}>{id.charAt(0).toUpperCase() + id.slice(1)}</a>
            ))}
          </div>
          <MagneticLink href="#cta" className="btn btn-ghost nav-cta" style={{ padding: "10px 16px" }}>
            Route a Link
            <span className="arrow">→</span>
          </MagneticLink>
          <button
            className="nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div
        className={`nav-drawer${open ? " is-open" : ""}`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div className="nav-drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="nav-drawer-head">
            <span className="brand"><span className="brand-mark" /> AegisRoute</span>
            <button className="nav-drawer-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          <ul className="nav-drawer-links">
            {LINKS.map((id) => (
              <li key={id}>
                <a href={`#${id}`} onClick={() => setOpen(false)}>
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </a>
              </li>
            ))}
          </ul>
          <a href="#cta" className="btn nav-drawer-cta" onClick={() => setOpen(false)}>
            Route a Link <span className="arrow">→</span>
          </a>
        </div>
      </div>
    </>
  );
}
