import { useCatalogue } from "../context/CatalogueContext.jsx";
import { matchScheme } from "../engine/matching.js";
import { fmtL, fmtCr, appLabel } from "../engine/format.js";
import { LevelBadge } from "../components/LevelBadge.jsx";
import { DemoTag } from "../components/DemoTag.jsx";
import { Check } from "../components/Check.jsx";

export function Intelligence({ schemeId, go, profile, setSchemeId }) {
  const { schemes: SCHEMES, budget } = useCatalogue();
  const s = SCHEMES.find(x => x.id === schemeId) || SCHEMES[0];
  if (!s) return null;
  const alloc = budget.bySchemeId.get(s.id) || s.allocationCr;
  const m = matchScheme(s, profile || {});
  return (
    <div className="fadein" style={{ padding: "34px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <div className="eyebrow">Scheme Intelligence</div>
        <select className="sel" style={{ width: "auto", padding: "7px 10px", fontSize: 12.5 }} value={s.id} onChange={e => setSchemeId(e.target.value)} aria-label="Switch scheme">
          {SCHEMES.slice(0, 200).map(x => <option key={x.id} value={x.id}>{x.short}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <LevelBadge level={s.level} />
        <span className="badge b-official">✓ Official source</span>
        {s.verified ? <span className="badge b-verified">◷ Last verified {s.verified}</span> : <span className="badge b-nr">! Last verified not reported</span>}
        {s.status !== "Active" && <span className="badge b-nr">! {s.status}</span>}
      </div>
      <h2 className="sec" style={{ fontSize: "clamp(22px,3.4vw,32px)" }}>{s.short}</h2>
      <p style={{ color: "var(--muted)", margin: "4px 0 22px", maxWidth: 700 }}>{s.name} · {s.dept}</p>

      <div className="two-col" style={{ alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel" style={{ padding: 20 }}>
            <div className="tt" style={{ marginBottom: 8 }}>Overview & benefit</div>
            <p style={{ fontSize: 14.5 }}>{s.benefit ? `${s.benefit}.` : "Benefit details not reported by the source. Verify on the official portal below."}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginTop: 16 }}>
              {[["Benefit type", s.benefitType || "Not reported"], ["Maximum support", s.maxBenefitL != null ? fmtL(s.maxBenefitL) : "Not reported"],
                ["Who can benefit", s.applicants.length ? s.applicants.map(appLabel).join(", ") : "Not reported"], ["Availability", s.states === "all" ? "All India" : (s.states.join(", ") || "Not reported")]].map(([k, v]) => (
                <div key={k} style={{ borderLeft: "2px solid var(--line2)", paddingLeft: 12 }}>
                  <div className="tt" style={{ marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13.5, color: k === "Maximum support" && s.maxBenefitL != null ? "var(--gold)" : "var(--txt)", fontWeight: k === "Maximum support" ? 600 : 400 }} className={k === "Maximum support" ? "mono" : ""}>{v}</div>
                </div>
              ))}
            </div>
            {s.maxBenefitNote && <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted2)" }}>ℹ {s.maxBenefitNote}</div>}
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <div className="tt" style={{ marginBottom: 10 }}>Benefit calculation illustration <DemoTag style={{ marginLeft: 8 }} /></div>
            {s.maxBenefitL != null ? (
              <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
                On an eligible project at the top subsidy tier, support can reach <b className="mono" style={{ color: "var(--gold)" }}>{fmtL(s.maxBenefitL)}</b>. {s.maxBenefitNote}. The sanctioned figure always follows official appraisal — not this illustration.
              </p>
            ) : (
              <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
                This scheme's benefit is not a single cash ceiling ({(s.benefitType || "benefit type not reported").toLowerCase()}). <span className="badge b-nr">! Not reported</span> — Subsidy360 does not compute a fictional maximum.
              </p>
            )}
          </div>

          <div className="grid-cards">
            <div className="panel" style={{ padding: 20 }}>
              <div className="tt" style={{ marginBottom: 10 }}>Documents typically required</div>
              {s.docs.length === 0 && <span className="badge b-nr">! Not reported</span>}
            {s.docs.map(d => <div key={d} style={{ display: "flex", gap: 9, fontSize: 13.5, padding: "5px 0" }}><span style={{ color: "var(--em)" }}>▸</span>{d}</div>)}
            </div>
            <div className="panel" style={{ padding: 20 }}>
              <div className="tt" style={{ marginBottom: 10 }}>Application process</div>
              {s.process.length === 0 && <span className="badge b-nr">! Not reported</span>}
              {s.process.map((d, i) => <div key={d} style={{ display: "flex", gap: 10, fontSize: 13.5, padding: "5px 0" }}><span className="mono" style={{ color: "var(--cy)", fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</span>{d}</div>)}
            </div>
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <div className="tt" style={{ marginBottom: 10 }}>Important restrictions</div>
            {s.restrictions.length === 0 && <span className="badge b-nr">! Not reported</span>}
            {s.restrictions.map(r => <div key={r} style={{ display: "flex", gap: 9, fontSize: 13.5, padding: "5px 0", color: "var(--muted)" }}><span style={{ color: "var(--amber)" }}>⚠</span>{r}</div>)}
          </div>

          <div className="panel" style={{ padding: 20 }}>
            <div className="tt" style={{ marginBottom: 10 }}>Financial information</div>
            {alloc ? (
              <>
                <div className="kv"><span className="k">Budget Estimate (BE){alloc.fy ? `, ${alloc.fy}` : ""}</span><span className="v mono" style={{ color: "var(--gold)", fontWeight: 600 }}>{fmtCr(alloc.be)}</span></div>
                <div className="kv"><span className="k">Revised Estimate (RE)</span><span className="v">{alloc.re != null ? <span className="mono" style={{ color: "var(--cy)" }}>{fmtCr(alloc.re)}</span> : <span className="badge b-nr">! Not reported</span>}</span></div>
                <div className="kv"><span className="k">Actual expenditure</span><span className="v">{alloc.actual != null ? <span className="mono" style={{ color: "var(--em)" }}>{fmtCr(alloc.actual)}</span> : <span className="badge b-nr">! Not reported</span>}</span></div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <DemoTag /><span style={{ fontSize: 11.5, color: "var(--muted2)" }}>Allocation is a budget estimate — not an amount sanctioned, released or utilised.</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13.5, color: "var(--muted)" }}>
                <span className="badge b-nr" style={{ marginRight: 8 }}>! Not reported</span>
                No headline allocation is tracked for this instrument in the prototype dataset.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel" style={{ padding: 20, borderColor: "var(--line2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="eyebrow em">Match analysis</span>
              {m.score != null && <span className="mono" style={{ fontSize: 20, fontWeight: 600, color: m.score >= 70 ? "var(--em)" : "var(--amber)" }}>{m.score}%</span>}
            </div>
            <p style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 8 }}>
              Why this scheme {profile ? "matches your profile" : "would be evaluated"} — reason-coded eligibility logic.
            </p>
            {m.checks.map(c => <Check key={c.k} c={c} />)}
            {!profile && <button className="btn pri" style={{ marginTop: 14, width: "100%", justifyContent: "center" }} onClick={() => go("eligibility")}>Build my profile →</button>}
            <div style={{ marginTop: 12, fontSize: 10.5, color: "var(--amber)" }}>
              Subsidy360 informational match — not an official eligibility decision.
            </div>
          </div>
          <div className="panel lt" style={{ padding: 20 }}>
            <div className="eyebrow" style={{ color: "var(--emD)", marginBottom: 8 }}>Official source</div>
            <div className="mono" style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600, wordBreak: "break-all" }}>{s.source || "Not reported"}</div>
            <p style={{ fontSize: 12.5, color: "var(--ink2)", marginTop: 8 }}>
              Always confirm current guidelines, rates and cut-offs on the official portal before applying. Record last verified {s.verified || "Not reported"} · source: {s.provenance?.connector || "bundled-seed"}.
            </p>
          </div>
          <button className="btn sec" onClick={() => go("compare")}>Compare with other schemes →</button>
          <button className="btn sec" onClick={() => go("combine")}>Test scheme combinations →</button>
        </div>
      </div>
    </div>
  );
}
