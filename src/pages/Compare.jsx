import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCatalogue } from "../context/CatalogueContext.jsx";
import { fmtL, appLabel } from "../engine/format.js";
import { LevelBadge } from "../components/LevelBadge.jsx";
import { DemoTag } from "../components/DemoTag.jsx";

export function Compare({ compare, toggleCompare, go }) {
  const { schemes: SCHEMES } = useCatalogue();
  const picked = compare.map(id => SCHEMES.find(s => s.id === id)).filter(Boolean);
  const rowsDef = [
    ["Benefit", s => s.benefit || <span className="badge b-nr">! Not reported</span>],
    ["Maximum support", s => s.maxBenefitL != null ? <span className="mono" style={{ color: "var(--gold)", fontWeight: 600 }}>{fmtL(s.maxBenefitL)}</span> : <span className="badge b-nr">! Not reported</span>],
    ["Benefit type", s => s.benefitType || <span className="badge b-nr">! Not reported</span>],
    ["Target beneficiary", s => s.applicants.map(appLabel).join(", ")],
    ["Investment range", s => s.investMaxL > 0 ? `${fmtL(s.investMinL)} – ${fmtL(s.investMaxL)}` : "No project investment"],
    ["Loan requirement", s => s.loanRequired ? "Bank loan required" : "No loan needed"],
    ["Application route", s => s.process[0] || <span className="badge b-nr">! Not reported</span>],
    ["Department", s => s.dept || <span className="badge b-nr">! Not reported</span>],
    ["State availability", s => s.states === "all" ? "All India" : s.states.join(", ")],
    ["Documents", s => s.docs.length ? s.docs.slice(0, 3).join("; ") + (s.docs.length > 3 ? " …" : "") : <span className="badge b-nr">! Not reported</span>],
    ["Official source", s => <span className="mono" style={{ fontSize: 12, color: "var(--cy)" }}>{s.source}</span>],
    ["Last verified", s => s.verified ? <span className="badge b-verified">◷ {s.verified}</span> : <span className="badge b-nr">! Not reported</span>],
  ];
  return (
    <div className="fadein" style={{ padding: "34px 0" }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Compare</div>
      <h2 className="sec" style={{ marginBottom: 6 }}>Side-by-side comparison</h2>
      <p className="sub" style={{ fontSize: 13.5, marginBottom: 16 }}>Select two or more schemes — there is no upper limit; the table scrolls. Currently selected: {picked.length}.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {SCHEMES.slice(0, 60).map(s => (
          <button key={s.id} className={`chip ${compare.includes(s.id) ? "on" : ""}`}
            onClick={() => toggleCompare(s.id)}>{s.short}</button>
        ))}
      </div>
      {picked.length < 2 ? (
        <div className="panel" style={{ padding: 34, textAlign: "center", color: "var(--muted)" }}>
          Pick at least two schemes above to build the comparison table.
        </div>
      ) : (
        <>
          <div className="cmp-wrap panel" style={{ padding: 0 }}>
            <table className="cmp">
              <thead><tr><th style={{ width: 170 }}>Attribute</th>{picked.map(s => <th key={s.id}>{s.short}<div style={{ marginTop: 5 }}><LevelBadge level={s.level} /></div></th>)}</tr></thead>
              <tbody>
                {rowsDef.map(([label, fn]) => (
                  <tr key={label}><td className="lbl">{label}</td>{picked.map(s => <td key={s.id}>{fn(s)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel" style={{ padding: 20, marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              <h2 className="sec" style={{ fontSize: 17 }}>Maximum reported cash benefit (₹ lakh)</h2><DemoTag />
            </div>
            <p style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 10 }}>Schemes without a reported cash ceiling are shown at zero and flagged “Not reported” — they are not lesser schemes, just differently structured.</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={picked.map(s => ({ n: s.short, v: s.maxBenefitL ?? 0, nr: s.maxBenefitL == null }))} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                  <CartesianGrid stroke="#1D3050" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="n" tick={{ fill: "#8496B4", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#1D3050" }} tickLine={false} />
                  <YAxis tick={{ fill: "#5F6F8E", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0E1B33", border: "1px solid #28406B", borderRadius: 4, fontSize: 12 }} formatter={(v, n, pr) => pr.payload.nr ? ["Not reported", "Max benefit"] : [`₹${v} lakh`, "Max benefit"]} cursor={{ fill: "rgba(216,169,69,.06)" }} />
                  <Bar dataKey="v" fill="#D8A945" radius={[2, 2, 0, 0]} maxBarSize={54} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {picked.length >= 2 && <button className="btn pri" onClick={() => go("combine")}>Can I combine these? →</button>}
            <button className="btn sec" onClick={() => go("discover")}>← Back to explorer</button>
          </div>
        </>
      )}
    </div>
  );
}
