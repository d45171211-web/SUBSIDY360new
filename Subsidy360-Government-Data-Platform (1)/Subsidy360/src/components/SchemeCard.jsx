import { matchScheme } from "../engine/matching.js";
import { fmtL } from "../engine/format.js";
import { LevelBadge } from "./LevelBadge.jsx";

export function SchemeCard({ s, profile, onOpen, onCompare, inCompare }) {
  const m = profile ? matchScheme(s, profile) : null;
  return (
    <div className="panel fadein" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 11 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <LevelBadge level={s.level} />
        {s.source ? <span className="badge b-official">✓ Official source</span> : <span className="badge b-nr">Source required</span>}
        {s.verified ? <span className="badge b-verified">◷ {s.verified}</span> : <span className="badge b-nr">! Verified date not reported</span>}
        {s.status !== "Active" && <span className="badge b-nr">! {s.status}</span>}
      </div>
      <div>
        <div style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 17.5, color: "var(--paper)", lineHeight: 1.25 }}>{s.short}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>{s.name}</div>
      </div>
      <div style={{ fontSize: 13.5, color: s.benefit ? "var(--txt)" : "var(--muted2)" }}>{s.benefit || "Benefit not reported by the source"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 14px", fontSize: 12 }}>
        <span style={{ color: "var(--muted2)" }}>Department</span><span style={{ color: "var(--muted2)" }}>Max benefit</span>
        <span style={{ color: "var(--txt)" }}>{(s.dept || "Not reported").split("·")[0].trim()}</span>
        <span className="mono" style={{ color: s.maxBenefitL != null ? "var(--gold)" : "var(--amber)", fontWeight: 600 }}>
          {s.maxBenefitL != null ? fmtL(s.maxBenefitL) : "Not reported"}
        </span>
      </div>
      {m && m.score != null && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 5 }}>
            <span className="tt">Profile match</span>
            <span className="mono" style={{ color: m.score >= 70 ? "var(--em)" : m.score >= 40 ? "var(--amber)" : "var(--red)", fontWeight: 600 }}>{m.score}%</span>
          </div>
          <div className="progress"><i style={{ width: `${m.score}%` }} /></div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
        <button className="btn sec" style={{ padding: "8px 14px" }} onClick={() => onOpen(s.id)}>View details →</button>
        <button className={`btn ghost`} style={{ color: inCompare ? "var(--em)" : "var(--cy)" }} onClick={() => onCompare(s.id)}>
          {inCompare ? "✓ In compare" : "+ Compare"}
        </button>
      </div>
    </div>
  );
}
