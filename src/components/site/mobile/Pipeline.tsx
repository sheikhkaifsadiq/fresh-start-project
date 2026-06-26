/**
 * @file src/components/site/mobile/Pipeline.tsx
 * @description Vertical 5-stage pipeline. Read top-to-bottom, no scroll
 * traps, no pinning. Each stage stands alone.
 */

const STAGES = [
  { name: "Ingest",  note: "Edge captures the request — UA, ASN, geo, fingerprint, intent." },
  { name: "Inspect", note: "Signals fan out across 19 behavioural and reputation models." },
  { name: "Score",   note: "A single confidence number, 0 → 1, with full feature attribution." },
  { name: "Decide",  note: "Allow, challenge, or sink — policy you control, observable in real time." },
  { name: "Route",   note: "The verdict is acted on at the nearest POP. The request never leaves the edge unverified." },
];

export function MobilePipeline() {
  return (
    <section className="m-section">
      <div className="m-kicker">02 · The pipeline</div>
      <h2 className="m-h2">
        Five stages. <span className="is-italic">Twelve milliseconds.</span>
      </h2>
      <ol className="m-stages">
        {STAGES.map((s, i) => (
          <li key={s.name}>
            <div className="m-stage-num">0{i + 1}</div>
            <div>
              <div className="m-stage-name">{s.name}</div>
              <p className="m-stage-note">{s.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
