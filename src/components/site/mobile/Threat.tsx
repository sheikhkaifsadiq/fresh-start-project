/**
 * @file src/components/site/mobile/Threat.tsx
 * @description One focused card answering "why does this matter?".
 */

export function MobileThreat() {
  return (
    <section className="m-section">
      <div className="m-kicker">03 · Why it matters</div>
      <h2 className="m-h2">
        Every shortened link is a <span className="is-italic">blind redirect.</span>
      </h2>
      <p className="m-lede">
        Without inspection, you forward attackers as eagerly as customers.
        Phishing, scrapers, credential stuffing — all wrapped in
        trusted-looking URLs.
      </p>
      <div className="m-stat-card">
        <div className="m-stat-figure">38%</div>
        <div className="m-stat-label">
          of clicks on shortened links in 2025 carried automated or hostile signals.
        </div>
      </div>
    </section>
  );
}
