export function Nav() {
  return (
    <nav className="nav">
      <div className="container-x nav-inner">
        <a href="#top" className="brand">
          <span className="brand-mark" />
          AegisRoute
        </a>
        <div className="nav-links">
          <a href="#routing">Routing</a>
          <a href="#threat">Threat Intel</a>
          <a href="#analytics">Analytics</a>
          <a href="#network">Network</a>
          <a href="#security">Security</a>
        </div>
        <a href="#cta" className="btn btn-ghost" style={{ padding: "10px 16px" }}>
          Route a Link
          <span className="arrow">→</span>
        </a>
      </div>
    </nav>
  );
}
