/**
 * @file src/components/site/mobile/Cta.tsx
 * @description Final CTA + footer for the mobile landing.
 */

import { Link } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/auth-store";

export function MobileCta() {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const cta = isAuthed
    ? { href: "/dashboard", label: "Open dashboard" }
    : { href: "/auth", label: "Route a link" };

  return (
    <section className="m-cta">
      <div className="m-kicker">05 · Start routing</div>
      <h2 className="m-h2">
        Your next redirect, <span className="is-italic">inspected.</span>
      </h2>
      <p className="m-lede">
        Free during open beta. No card required. Live in under two minutes.
      </p>
      <Link to={cta.href} className="m-cta-primary">
        {cta.label} <span aria-hidden>→</span>
      </Link>
      <footer className="m-foot">
        <div>AegisRoute · 2026</div>
        <div>SOC 2 · ISO 27001 · GDPR</div>
        <div>hello@aegisroute.example</div>
      </footer>
    </section>
  );
}
