/**
 * @file src/routes/auth.tsx
 * @description Public login + signup page in the AegisRoute editorial
 * language. Calls the same /api/v1/auth/login and /api/v1/auth/signup
 * endpoints as the legacy product — no contract change.
 */

import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mask, Kinetic } from "@/lib/motion";
import { useAuthStore } from "@/lib/stores/auth-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AegisRoute" },
      { name: "description", content: "Sign in to AegisRoute to manage routed links, threat policies, and live analytics." },
      { property: "og:title", content: "Sign in — AegisRoute" },
      { property: "og:description", content: "Edge-routed URL shortening with AI threat detection." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
        navigate({ to: "/dashboard" });
      } else {
        const res = await fetch("/api/v1/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message ?? data?.error ?? "Signup failed.");
        }
        setInfo("Account created. Signing you in…");
        await login(email, password);
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-nav">
        <a href="/" className="brand">
          <span className="brand-mark" aria-hidden />
          AegisRoute
        </a>
        <span className="kicker" style={{ margin: 0 }}>
          {mode === "login" ? "Operator sign-in" : "Operator enrolment"}
        </span>
      </header>

      <div className="auth-stage">
        <div className="auth-copy">
          <Mask delay={50}>
            <div className="kicker">AegisRoute · console · {new Date().getFullYear()}</div>
          </Mask>

          <Kinetic
            as="h1"
            text={mode === "login" ? "Welcome back, operator." : "Open your routing console."}
            split="word"
            stagger={60}
            duration={900}
            italicWords={[2]}
            style={{ margin: "20px 0 14px", fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5.4vw, 78px)", letterSpacing: "-0.02em", lineHeight: 1.02 }}
          />

          <Mask delay={420}>
            <p className="hero-sub" style={{ maxWidth: 480 }}>
              The same edge-routed inspections, ML-scored verdicts, and
              real-time telemetry the public sees — now from your side of
              the wire.
            </p>
          </Mask>
        </div>

        <form className="auth-card" onSubmit={handleSubmit} aria-busy={busy}>
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`auth-tab${mode === "login" ? " is-active" : ""}`}
              onClick={() => { setMode("login"); setError(null); }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={`auth-tab${mode === "signup" ? " is-active" : ""}`}
              onClick={() => { setMode("signup"); setError(null); }}
            >
              Create account
            </button>
          </div>

          {mode === "signup" ? (
            <label className="auth-field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Ada Lovelace"
              />
            </label>
          ) : null}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="operator@company.com"
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 8 : 1}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}
          {info ? <div className="auth-info">{info}</div> : null}

          <button type="submit" className="btn auth-submit" disabled={busy}>
            {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
            <span className="arrow" style={{ marginLeft: 10 }}>→</span>
          </button>

          <div className="auth-foot">
            {mode === "login" ? (
              <span>
                No account yet?{" "}
                <button type="button" className="auth-link" onClick={() => setMode("signup")}>
                  Create one
                </button>
              </span>
            ) : (
              <span>
                Already enrolled?{" "}
                <button type="button" className="auth-link" onClick={() => setMode("login")}>
                  Sign in
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Silence unused-import warning in environments that tree-shake before TS checks
void redirect;
