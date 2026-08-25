
export function About({ openMethod }) {
  return (
    <div className="fadein" style={{ padding: "34px 0", maxWidth: 820 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>About / Methodology</div>
      <h2 className="sec" style={{ marginBottom: 14 }}>An economics project on subsidy transparency</h2>
      <p style={{ color: "var(--muted)", marginBottom: 14 }}>
        Subsidy360 is a prototype interface exploring how India's citizens — farmers, students, households, entrepreneurs and MSMEs — could navigate government schemes the way analysts navigate markets: with sources, ceilings, budget lines and honest gaps, rather than hearsay.
      </p>
      <p style={{ color: "var(--muted)", marginBottom: 22 }}>
        The economics lens: subsidies are fiscal transfers with allocation (BE/RE), execution (Actuals) and targeting (eligibility design). The interface makes each layer legible and keeps them strictly separate.
      </p>
      <div className="grid-cards">
        {[["Evidence-first", "Every scheme record carries its official source and a last-verified stamp. Unknowns render as “Not reported” — never as a guessed figure."],
          ["Informational, not official", "Match scores and combination checks are decision aids. Eligibility is decided only by the administering authority."],
          ["Prototype dataset", "12 realistic Indian scheme records demonstrate the interface. Production intent: thousands of indexed schemes with the same honesty rules."],
          ["BE ≠ spent", "Budget estimates are plans. The interface never converts an allocation into “sanctioned”, “released” or “utilised”."]].map(([k, v]) => (
          <div key={k} className="panel" style={{ padding: 18 }}>
            <div className="mono" style={{ color: "var(--cy)", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{k}</div>
            <div style={{ fontSize: 13.5, color: "var(--muted)" }}>{v}</div>
          </div>
        ))}
      </div>
      <button className="btn sec" style={{ marginTop: 20 }} onClick={openMethod}>Open data methodology drawer →</button>
    </div>
  );
}
