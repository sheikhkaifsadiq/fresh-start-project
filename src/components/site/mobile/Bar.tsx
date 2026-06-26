/**
 * @file src/components/site/mobile/Bar.tsx
 * @description Top app bar for the mobile landing. Thin, sticky,
 * one-line. Drawer is a Notion-style slide-over with backdrop.
 */

import { useState } from "react";
import { Link } from "@tanstack/react-router";

export function MobileBar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="m-bar">
        <div className="m-bar-brand">AegisRoute</div>
        <button
          className="m-bar-burger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span /><span />
        </button>
      </div>

      <div
        className={`m-drawer ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        <aside
          className="m-drawer-panel"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="m-drawer-head">
            <div className="m-bar-brand">AegisRoute</div>
            <button
              className="m-drawer-close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <nav>
            <a href="#pipeline" onClick={() => setOpen(false)}>Pipeline</a>
            <a href="#threat"   onClick={() => setOpen(false)}>Threat</a>
            <a href="#network"  onClick={() => setOpen(false)}>Network</a>
            <a href="#cta"      onClick={() => setOpen(false)}>Start</a>
          </nav>
          <Link to="/auth" className="m-cta-primary" onClick={() => setOpen(false)}>
            Sign in <span aria-hidden>→</span>
          </Link>
        </aside>
      </div>
    </>
  );
}
