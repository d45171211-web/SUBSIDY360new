import { useState, useEffect } from "react";

/**
 * Interactive Self-Verification Checklist Component
 * Allows users to self-certify specific conditions and immediately know if they are eligible
 * or understand the exact issue preventing eligibility.
 */
export function SelfEligibilityChecklist({ scheme, match, profile, onOpenIntel }) {
  // Extract specific restrictions from scheme
  const rawRestrictions = scheme.restrictions && scheme.restrictions.length
    ? scheme.restrictions
    : [
        `Applicant is a resident/native of ${scheme.states === "all" ? "India" : (Array.isArray(scheme.states) ? scheme.states.join(", ") : "the eligible state")}`,
        "Applicant meets general age criteria (typically 18+ years)",
        "No previous disqualification or default on government assistance",
      ];

  // Clean restriction strings from raw markdown links e.g. [text](url) -> text
  const cleanRestrictions = rawRestrictions.map(r =>
    String(r)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
  );

  // Track checked state of each condition (default all true so users see their 100% path)
  const [checkedState, setCheckedState] = useState(() => cleanRestrictions.map(() => true));

  // Reset when scheme changes
  useEffect(() => {
    setCheckedState(cleanRestrictions.map(() => true));
  }, [scheme.id]);

  const toggleCheck = (index) => {
    setCheckedState(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const allMet = checkedState.every(Boolean);
  const unmetIndices = checkedState
    .map((val, idx) => (!val ? idx : null))
    .filter(val => val !== null);

  return (
    <div className="panel" style={{ padding: 20, marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="tt" style={{ fontSize: 11, letterSpacing: ".05em" }}>
            ELIGIBILITY CHECKLIST · {scheme.short}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--paper)", marginTop: 2 }}>
            Verify Your Qualifications
          </div>
        </div>
        <span
          className={`badge ${allMet ? "b-official" : "b-nr"}`}
          style={{ fontSize: 11, padding: "4px 9px" }}
        >
          {allMet ? "✓ All Requirements Met" : `⚠ ${unmetIndices.length} Requirement Unmet`}
        </span>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>
        Confirm the specific conditions below for <b>{scheme.short}</b>. If you meet all items, you are clear to apply without issues:
      </p>

      {/* Checklist items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {cleanRestrictions.map((item, idx) => {
          const isChecked = checkedState[idx];
          return (
            <div
              key={idx}
              onClick={() => toggleCheck(idx)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 6,
                background: isChecked ? "var(--bg)" : "rgba(201, 141, 60, 0.08)",
                border: `1.5px solid ${isChecked ? "var(--line)" : "var(--amber)"}`,
                cursor: "pointer",
                transition: "all .15s ease",
              }}
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={0}
              onKeyDown={e => (e.key === " " || e.key === "Enter") && toggleCheck(idx)}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: `2px solid ${isChecked ? "var(--em)" : "var(--amber)"}`,
                  background: isChecked ? "var(--em)" : "transparent",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: "bold",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {isChecked ? "✓" : ""}
              </div>
              <div style={{ flex: 1, fontSize: 13, lineHeight: 1.45, color: isChecked ? "var(--txt)" : "var(--paper)" }}>
                <span>{item}</span>
                {!isChecked && (
                  <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 4, fontWeight: 600 }}>
                    ✕ Condition not met — This may block approval for this scheme
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic verdict banner */}
      {allMet ? (
        <div
          style={{
            padding: "14px 16px",
            background: "rgba(123, 155, 125, 0.12)",
            border: "1.5px solid var(--em)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--paper)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>✓</span> You satisfy all reported criteria for {scheme.short}!
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              No blockers detected. You are ready to prepare your application.
            </div>
          </div>
          <button
            type="button"
            className="btn pri"
            onClick={onOpenIntel}
            style={{ fontSize: 12.5, padding: "8px 14px" }}
          >
            Review Application Steps →
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: "14px 16px",
            background: "rgba(201, 141, 60, 0.1)",
            border: "1.5px solid var(--amber)",
            borderRadius: 6,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--paper)", display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠</span> Potential issue identified
          </div>
          <div style={{ fontSize: 12.5, color: "var(--txt)", marginTop: 4, lineHeight: 1.5 }}>
            You indicated you do not meet <b>{unmetIndices.length} requirement{unmetIndices.length > 1 ? "s" : ""}</b>:
            <ul style={{ paddingLeft: 18, marginTop: 4 }}>
              {unmetIndices.map(idx => (
                <li key={idx} style={{ color: "var(--amber)", fontWeight: 500 }}>
                  {cleanRestrictions[idx]}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            💡 <b>Suggested alternative:</b> Check the other schemes ranked in the right panel that match your state and category without requiring this condition.
          </div>
        </div>
      )}
    </div>
  );
}
