import { useState, useMemo } from "react";
import { APPLICANTS, SECTORS, INCOME_BANDS, INVEST_BANDS } from "../data/constants.js";
import { useCatalogue } from "../context/CatalogueContext.jsx";
import { matchScheme } from "../engine/matching.js";
import { Check } from "../components/Check.jsx";

export function Eligibility({ go, profile, setProfile }) {
  const { schemes: SCHEMES, states: refStates, facets } = useCatalogue();
  const STATES = refStates.length ? refStates : facets.states.map(s => s.value);
  const [step, setStep] = useState(profile ? 99 : 0);
  const [p, setP] = useState(profile || { state: "", district: "", applicant: "", sector: "", income: "", invest: null, stage: "", loan: null });
  const steps = [
    { key: "state", q: "Which state are you in?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {STATES.map(s => <button key={s} className={`chip ${p.state === s ? "on" : ""}`} onClick={() => setP({ ...p, state: s })}>{s}</button>)}
      </div>) },
    { key: "district", q: "Which district? (optional)", render: () => (
      <input className="txt" style={{ maxWidth: 340 }} placeholder="e.g. Kheda" value={p.district} onChange={e => setP({ ...p, district: e.target.value })} />), optional: true },
    { key: "applicant", q: "What describes you best?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {APPLICANTS.map(a => <button key={a.id} className={`chip ${p.applicant === a.id ? "on" : ""}`} onClick={() => setP({ ...p, applicant: a.id })}>{a.label}</button>)}
      </div>) },
    { key: "sector", q: "Which sector is your need in?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {SECTORS.map(s => <button key={s.id} className={`chip ${p.sector === s.id ? "on" : ""}`} onClick={() => setP({ ...p, sector: s.id })}>{s.label}</button>)}
      </div>) },
    { key: "income", q: "Annual household income range?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {INCOME_BANDS.map(b => <button key={b.id} className={`chip ${p.income === b.id ? "on" : ""}`} onClick={() => setP({ ...p, income: b.id })}>{b.label}</button>)}
      </div>) },
    { key: "invest", q: "Planned project / investment size?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {INVEST_BANDS.map(b => <button key={b.id} className={`chip ${p.invest === b.id ? "on" : ""}`} onClick={() => setP({ ...p, invest: b.id })}>{b.label}</button>)}
      </div>) },
    { key: "stage", q: "Is this a new or existing activity?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[["new", "New / first-time"], ["existing", "Existing / expansion"]].map(([id, l]) => <button key={id} className={`chip ${p.stage === id ? "on" : ""}`} onClick={() => setP({ ...p, stage: id })}>{l}</button>)}
      </div>) },
    { key: "loan", q: "Will you take a bank loan?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[[true, "Yes, planning a loan"], [false, "No loan"]].map(([v, l]) => <button key={l} className={`chip ${p.loan === v ? "on" : ""}`} onClick={() => setP({ ...p, loan: v })}>{l}</button>)}
      </div>) },
  ];

  const ranked = useMemo(
    () => SCHEMES.map(s => ({ s, m: matchScheme(s, p) })).sort((a, b) => b.m.score - a.m.score),
    [SCHEMES, p]
  );

  if (step >= steps.length || step === 99) {
    const top = ranked[0];
    const grade = top.m.score >= 80 ? "Strong Match" : top.m.score >= 55 ? "Possible Match" : "Weak Match";
    const R = 62, C = 2 * Math.PI * R;
    return (
      <div className="fadein" style={{ padding: "34px 0" }}>
        <div className="eyebrow em" style={{ marginBottom: 10 }}>Your Subsidy Match Profile</div>
        <div className="two-col" style={{ alignItems: "start" }}>
          <div>
            <div className="panel" style={{ padding: 24, display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap" }}>
              <div className="ringwrap">
                <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label={`Top match ${top.m.score}%`}>
                  <circle cx="75" cy="75" r={R} fill="none" stroke="#1D3050" strokeWidth="9" />
                  <circle cx="75" cy="75" r={R} fill="none" stroke={top.m.score >= 70 ? "#17C787" : "#E8B25E"} strokeWidth="9"
                    strokeDasharray={C} strokeDashoffset={C * (1 - top.m.score / 100)} strokeLinecap="round" transform="rotate(-90 75 75)"
                    style={{ transition: "stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="num">
                  <span className="mono" style={{ fontSize: 34, fontWeight: 600, color: "var(--paper)" }}>{top.m.score}%</span>
                  <span style={{ fontSize: 11.5, color: top.m.score >= 70 ? "var(--em)" : "var(--amber)", fontWeight: 600 }}>{grade}</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="tt" style={{ marginBottom: 4 }}>Top-ranked scheme for your profile</div>
                <div style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 20, color: "var(--paper)" }}>{top.s.short}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", margin: "3px 0 12px" }}>{top.s.name}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn pri" onClick={() => go("intel", top.s.id)}>Open scheme intelligence →</button>
                  <button className="btn sec" onClick={() => { setStep(0); setP({ state: "", district: "", applicant: "", sector: "", income: "", invest: null, stage: "", loan: null }); setProfile(null); }}>Redo profile</button>
                </div>
              </div>
            </div>
            <div className="panel" style={{ padding: "10px 20px", marginTop: 14 }}>
              <div className="tt" style={{ padding: "10px 0 4px" }}>Transparent breakdown — {top.s.short}</div>
              {top.m.checks.map(c => <Check key={c.k} c={c} />)}
            </div>
            <div className="badge b-nr" style={{ marginTop: 14, padding: "8px 12px", fontSize: 10.5, lineHeight: 1.5, textTransform: "none", letterSpacing: ".04em" }}>
              Subsidy360 informational match — not an official eligibility decision.
            </div>
          </div>
          <div>
            <div className="tt" style={{ marginBottom: 10 }}>Top {Math.min(40, ranked.length)} of {ranked.length.toLocaleString("en-IN")} schemes ranked against your profile</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {ranked.slice(0, 40).map(({ s, m }) => (
                <button key={s.id} className="panel" onClick={() => go("intel", s.id)}
                  style={{ padding: "12px 14px", textAlign: "left", cursor: "pointer", color: "var(--txt)", display: "block", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.short}</span>
                    <span className="mono" style={{ fontSize: 12.5, color: m.score >= 70 ? "var(--em)" : m.score >= 40 ? "var(--amber)" : "var(--red)" }}>{m.score}%</span>
                  </div>
                  <div className="progress"><i style={{ width: `${m.score}%` }} /></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cur = steps[step];
  const answered = cur.optional || (cur.key === "invest" ? p.invest != null : cur.key === "loan" ? p.loan != null : !!p[cur.key]);
  return (
    <div className="fadein" style={{ padding: "40px 0", maxWidth: 760 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>My Eligibility · Step {step + 1} of {steps.length}</div>
      <div className="progress" style={{ maxWidth: 380, marginBottom: 26 }}><i style={{ width: `${((step) / steps.length) * 100}%` }} /></div>
      <h2 className="sec" style={{ marginBottom: 20 }}>{cur.q}</h2>
      {cur.render()}
      <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
        {step > 0 && <button className="btn sec" onClick={() => setStep(s => s - 1)}>← Back</button>}
        <button className="btn pri" disabled={!answered} onClick={() => {
          const nxt = step + 1;
          if (nxt >= steps.length) { setProfile(p); setStep(99); } else setStep(nxt);
        }}>{step === steps.length - 1 ? "Show my matches" : "Continue →"}</button>
      </div>
    </div>
  );
}
