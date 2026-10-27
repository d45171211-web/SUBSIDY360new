import { matchScheme } from "../engine/matching.js";
import { fmtL } from "../engine/format.js";
import { LevelBadge } from "./LevelBadge.jsx";

export function SchemeCard({ s, profile, onOpen, onCompare, inCompare }) {
  const m = profile ? matchScheme(s, profile) : null;
  return (
    <div
      className="panel fadein"
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderRadius: "8px",
        border: inCompare ? "1px solid var(--em)" : "1px solid var(--line)",
        boxShadow: inCompare ? "0 4px 20px rgba(152,220,126,.12)" : "0 2px 10px rgba(0,0,0,.2)",
      }}
    >
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
        <LevelBadge level={s.level} />
        {s.source ? (
          <span className="badge b-official">✓ Official source</span>
        ) : (
          <span className="badge b-nr">Source required</span>
        )}
        {s.verified ? (
          <span className="badge b-verified">◷ {s.verified}</span>
        ) : (
          <span className="badge b-nr">! Unverified date</span>
        )}
        {s.status !== "Active" && <span className="badge b-nr">! {s.status}</span>}
      </div>

      <div>
        <div style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 18, color: "var(--paper)", lineHeight: 1.25 }}>
          {s.short}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
          {s.name}
        </div>
      </div>

      <div
        style={{
          borderLeft: "3px solid var(--sage)",
          background: "var(--panel2)",
          padding: "9px 12px",
          borderRadius: "0 6px 6px 0",
          fontSize: 13,
          color: s.benefit ? "var(--txt)" : "var(--muted2)",
          lineHeight: 1.5,
        }}
      >
        {s.benefit || "Direct assistance / subsidy as per departmental norms"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: "8px 14px",
          fontSize: 12,
          background: "var(--bg2)",
          padding: "10px 12px",
          borderRadius: "6px",
          border: "1px solid var(--line)",
        }}
      >
        <div>
          <span className="tt" style={{ display: "block", marginBottom: 2 }}>Department</span>
          <span style={{ color: "var(--paper)", fontWeight: 500, wordBreak: "break-word" }}>
            {(s.dept || "State / Central Nodal Dept").split("·")[0].trim()}
          </span>
        </div>
        <div>
          <span className="tt" style={{ display: "block", marginBottom: 2 }}>Max Benefit</span>
          <span
            className="mono"
            style={{
              color: s.maxBenefitL != null ? "var(--em)" : "var(--paper)",
              fontWeight: 600,
              fontSize: 13,
              wordBreak: "break-word",
              display: "inline-block",
            }}
          >
            {s.maxBenefitL != null ? fmtL(s.maxBenefitL) : "Scale-based"}
          </span>
        </div>
      </div>

      {m && m.score != null && (
        <div style={{ padding: "4px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 5 }}>
            <span className="tt" style={{ color: "var(--cy)" }}>Eligibility fit</span>
            <span
              className="mono"
              style={{
                color: m.score >= 70 ? "var(--em)" : m.score >= 40 ? "var(--amber)" : "var(--red)",
                fontWeight: 600,
              }}
            >
              {m.score}%
            </span>
          </div>
          <div className="progress">
            <i style={{ width: `${m.score}%` }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 4, flexWrap: "wrap", alignItems: "center" }}>
        <button
          className="btn sec"
          style={{ padding: "8px 15px", fontSize: 12.5 }}
          onClick={() => onOpen(s.id)}
        >
          View details →
        </button>
        <button
          className={inCompare ? "btn pri" : "btn ghost"}
          style={{
            padding: inCompare ? "6px 12px" : "6px 8px",
            fontSize: 12.5,
            color: inCompare ? "var(--em-txt, #FAF9F5)" : "var(--cy)",
            marginLeft: "auto",
          }}
          onClick={() => onCompare(s.id)}
        >
          {inCompare ? "✓ Selected" : "+ Compare"}
        </button>
      </div>
    </div>
  );
}
