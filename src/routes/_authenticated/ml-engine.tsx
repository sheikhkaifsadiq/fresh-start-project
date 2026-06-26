/**
 * @file src/routes/_authenticated/ml-engine.tsx
 * @description ML model dashboard. Mirrors legacy ml-engine page contract
 * (model status, accuracy, feature importance) using shared primitives.
 */

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/ml-engine")({
  head: () => ({ meta: [{ title: "ML Engine — AegisRoute" }] }),
  component: MLEnginePage,
});

const FEATURES = [
  { k: "Request entropy",      v: 0.91 },
  { k: "UA reputation",        v: 0.84 },
  { k: "ASN risk score",       v: 0.78 },
  { k: "Header fingerprint",   v: 0.71 },
  { k: "TLS JA3 cluster",      v: 0.66 },
  { k: "Geo·time anomaly",     v: 0.52 },
  { k: "Click cadence",        v: 0.41 },
];

function MLEnginePage() {
  return (
    <AppShell title="ML Engine." kicker="MODEL · FEATURES · CONFIDENCE">
      <section className="ds-hero">
        <div className="ds-hero-l">
          <div className="ds-kicker">Active model</div>
          <div className="ds-hero-figure">
            <span className="ds-hero-num">v2.3.1</span>
            <span className="ds-hero-unit">bot-detector</span>
          </div>
          <p className="ds-hero-note">
            Gradient-boosted ensemble · 184 features · trained on 412M
            verdicts. Promoted to all 38 edge regions 6 days ago.
          </p>
        </div>
        <dl className="ds-hero-side">
          {[
            { k: "Accuracy",       v: "99.4%" },
            { k: "False positive", v: "0.21%" },
            { k: "Inference p95",  v: "4.2ms" },
            { k: "Last rollout",   v: "6d ago" },
          ].map((s) => (<div className="ds-side-row" key={s.k}><dt>{s.k}</dt><dd>{s.v}</dd></div>))}
        </dl>
      </section>

      <hr className="ds-rule" />

      <section className="ds-grid-2">
        <div>
          <div className="ds-kicker">Feature importance</div>
          <h2 className="ds-section-title">Signals the model weights most.</h2>
          <table className="ds-table" style={{ marginTop: 18 }}>
            <thead><tr><th>Feature</th><th>Weight</th><th className="num">Score</th></tr></thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.k}>
                  <td>{f.k}</td>
                  <td>
                    <div style={{ height: 4, background: "var(--rule)", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, width: `${f.v * 100}%`, background: "var(--ink)" }} />
                    </div>
                  </td>
                  <td className="num">{f.v.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="ds-kicker">Training pipeline</div>
          <h2 className="ds-section-title">Continuous learning loop.</h2>
          <ol className="ds-steps">
            <li><span className="ds-step-n">01</span><div><strong>Ingest.</strong><span>Every verdict, labelled by downstream outcome, streams to the feature store.</span></div></li>
            <li><span className="ds-step-n">02</span><div><strong>Retrain.</strong><span>Nightly run on the last 30 days. Models compete on a held-out 7-day window.</span></div></li>
            <li><span className="ds-step-n">03</span><div><strong>Canary.</strong><span>Winning model serves 1% of traffic for 24h before global promotion.</span></div></li>
          </ol>
        </div>
      </section>
    </AppShell>
  );
}
