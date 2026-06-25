/**
 * @file src/components/links/CreateLinkPanel.tsx
 * @description AegisRoute-styled "Create link" slide-over.
 *
 * BUSINESS LOGIC PRESERVED from the legacy CreateLinkModal:
 *   - POST /api/v1/links payload shape
 *   - GET  /api/v1/links/check-slug live availability check
 *   - 7-char slug generator
 *   - protection flags (password, expires_at)
 *
 * Only the visual presentation, motion, and typography were rebuilt to
 * match the landing page (paper/ink palette, Fraunces + IBM Plex Mono,
 * Mask reveal motion).
 */

import { useEffect, useState } from "react";
import { Mask } from "@/lib/motion";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function randomSlug() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 7; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

export function CreateLinkPanel({ open, onClose, onCreated }: Props) {
  const [destination, setDestination] = useState("");
  const [slug, setSlug] = useState("");
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [mlSensitivity, setMlSensitivity] = useState(0.5);

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live slug availability — same /api/v1/links/check-slug contract.
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    let cancelled = false;
    setCheckingSlug(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/links/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!cancelled) setSlugAvailable(Boolean(data?.available));
      } finally {
        if (!cancelled) setCheckingSlug(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/v1/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_url: destination,
          slug: slug || undefined,
          expires_at: expiresAt || null,
          password_protected: passwordProtected,
          password: passwordProtected ? password : null,
          ml_sensitivity: mlSensitivity,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message ?? "Failed to create link.");
      }
      // Reset and close
      setDestination("");
      setSlug("");
      setPassword("");
      setExpiresAt("");
      setPasswordProtected(false);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lk-panel-overlay" role="dialog" aria-modal="true">
      <button
        type="button"
        className="lk-panel-scrim"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="lk-panel">
        <header className="lk-panel-head">
          <div>
            <div className="kicker">New routed link</div>
            <h2 className="lk-panel-title">Compose a pathway.</h2>
          </div>
          <button className="lk-icon-btn" onClick={onClose} aria-label="Close">×</button>
        </header>

        <form className="lk-panel-body" onSubmit={submit}>
          <Mask delay={40}>
            <label className="auth-field">
              <span>Destination URL</span>
              <input
                type="url"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="https://acme.example/landing"
              />
            </label>
          </Mask>

          <Mask delay={120}>
            <label className="auth-field">
              <span>Slug · optional</span>
              <div className="lk-slug-row">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-"))}
                  placeholder="auto-generated"
                />
                <button type="button" className="lk-mini-btn" onClick={() => setSlug(randomSlug())}>
                  randomise
                </button>
              </div>
              <div className="lk-slug-status">
                {checkingSlug ? "checking…" : slug && slugAvailable === true ? "✓ available"
                  : slug && slugAvailable === false ? "× taken" : "—"}
              </div>
            </label>
          </Mask>

          <Mask delay={200}>
            <div className="lk-row-2">
              <label className="auth-field">
                <span>Expires at · optional</span>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </label>
              <label className="auth-field">
                <span>ML sensitivity · {mlSensitivity.toFixed(2)}</span>
                <input
                  type="range"
                  min={0} max={1} step={0.05}
                  value={mlSensitivity}
                  onChange={(e) => setMlSensitivity(parseFloat(e.target.value))}
                />
              </label>
            </div>
          </Mask>

          <Mask delay={280}>
            <div className="lk-toggle-row">
              <label className="lk-toggle">
                <input
                  type="checkbox"
                  checked={passwordProtected}
                  onChange={(e) => setPasswordProtected(e.target.checked)}
                />
                <span>Password-protect this link</span>
              </label>
              {passwordProtected ? (
                <input
                  type="text"
                  className="lk-inline-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="passphrase"
                />
              ) : null}
            </div>
          </Mask>

          {error ? <div className="auth-error">{error}</div> : null}

          <Mask delay={360}>
            <div className="lk-panel-foot">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={busy || (slug.length > 0 && slugAvailable === false)}>
                {busy ? "Routing…" : "Create link"}
                <span className="arrow" style={{ marginLeft: 10 }}>→</span>
              </button>
            </div>
          </Mask>
        </form>
      </aside>
    </div>
  );
}
