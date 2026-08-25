import { useState, useMemo } from "react";
import { useCatalogue } from "../context/CatalogueContext.jsx";
import { checkCombination } from "../engine/combination.js";

export function Combine({ compare }) {
  const { schemes: SCHEMES } = useCatalogue();
  const [a, setA] = useState(compare[0] || "");
  const [b, setB] = useState(compare[1] || "");
  const res = useMemo(() => checkCombination(a, b), [a, b]);
  const tone = res && { yes: "var(--em)", cond: "var(--amber)", no: "var(--red)", unk: "var(--muted)" }[res.status];
  const sym = res && { yes: "✓", cond: "⚠", no: "✕", unk: "—" }[res.status];
  return (
    <div className="fadein" style={{ padding: "34px 0", maxWidth: 860 }}>
      <div className="eyebrow gold" style={{ marginBottom: 10 }}>Signature feature</div>
      <h2 className="sec" style={{ marginBottom: 6 }}>Subsidy Combination Engine</h2>
      <p className="sub" style={{ fontSize: 13.5, marginBottom: 22 }}>Can I combine these schemes? Select a pair to test against the prototype rule-set. Subsidy360 never invents government combination rules — every result below is a demonstration rule or an explicit “not established”.</p>
      <div className="panel" style={{ padding: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "end" }}>
          <div>
            <label className="tt" style={{ display: "block", marginBottom: 6 }}>Scheme A</label>
            <select className="sel" value={a} onChange={e => setA(e.target.value)}>
              <option value="">Select scheme…</option>{SCHEMES.map(s => <option key={s.id} value={s.id}>{s.short}</option>)}
            </select>
          </div>
          <div className="mono" style={{ color: "var(--gold)", fontSize: 22, paddingBottom: 8 }}>+</div>
          <div>
            <label className="tt" style={{ display: "block", marginBottom: 6 }}>Scheme B</label>
            <select className="sel" value={b} onChange={e => setB(e.target.value)}>
              <option value="">Select scheme…</option>{SCHEMES.filter(s => s.id !== a).map(s => <option key={s.id} value={s.id}>{s.short}</option>)}
            </select>
          </div>
        </div>
        {res && (
          <div className="fadein" style={{ marginTop: 22, border: `1px solid ${tone}`, borderRadius: 5, padding: 18, background: "rgba(6,13,26,.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <span className="mono" style={{ fontSize: 26, color: tone, fontWeight: 600 }}>{sym}</span>
              <span style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 19, color: "var(--paper)" }}>{res.label}</span>
              <span className="badge b-demo" style={{ marginLeft: "auto" }}>{res.status === "unk" ? "NO VERIFIED RULE" : "DEMONSTRATION RULE"}</span>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
              <span className="mono" style={{ color: "var(--cy)", fontSize: 11.5 }}>REASON — </span>{res.reason}
            </div>
            <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--amber)" }}>
              Demonstration rule — verify with official scheme guidelines before relying on any combination.
            </div>
          </div>
        )}
        {!res && <div style={{ marginTop: 20, color: "var(--muted2)", fontSize: 13 }}>Select two different schemes to run the check.</div>}
      </div>
      <div className="panel" style={{ padding: 18, marginTop: 16 }}>
        <div className="tt" style={{ marginBottom: 10 }}>How the engine decides</div>
        {[["✓ Compatible", "A demonstration rule indicates the two instruments operate on different layers (e.g. a subsidy plus a guarantee)."],
          ["⚠ Conditional", "A demonstration rule exists but hinges on caps, lender participation, or component-level checks."],
          ["✕ Not compatible", "A demonstration rule reflects an explicit exclusion (typically two margin-money subsidies on one project)."],
          ["— Not established", "No verified rule in the ruleset. Subsidy360 refuses to guess."]].map(([k, v]) => (
            <div key={k} className="kv"><span className="k mono" style={{ fontSize: 12 }}>{k}</span><span className="v" style={{ fontSize: 12.5, color: "var(--muted)" }}>{v}</span></div>
          ))}
      </div>
    </div>
  );
}
