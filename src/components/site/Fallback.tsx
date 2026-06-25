import { BEATS } from "../scene/beats";

export function Fallback() {
  return (
    <main className="fallback">
      <header>
        <div className="lbl">AegisRoute · A film in twelve acts</div>
        <h2>
          An edge-routed link, <em>watched in real time</em>.
        </h2>
      </header>
      {BEATS.map((b) => (
        <section key={b.id}>
          <div className="lbl">{b.subtitle}</div>
          <h2 dangerouslySetInnerHTML={{ __html: b.headline }} />
        </section>
      ))}
      <footer>
        <div className="lbl">Invitation</div>
        <a
          href="mailto:hello@aegisroute.example"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "1.4rem",
            color: "var(--ink)",
          }}
        >
          Route your first link →
        </a>
      </footer>
    </main>
  );
}
