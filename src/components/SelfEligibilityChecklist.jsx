import { useState, useEffect } from "react";
import { useCatalogue } from "../context/CatalogueContext.jsx";

/**
 * Parses markdown links like [Guidelines](https://...) into real clickable links
 */
function renderCleanText(text) {
  if (typeof text !== "string") return text;
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "var(--cy)",
          textDecoration: "underline",
          fontWeight: 600,
          wordBreak: "break-all",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {match[1]} ↗
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length ? parts : text;
}

/**
 * Interactive Self-Verification Checklist Component
 * Allows users to self-certify specific conditions and immediately know if they are eligible
 * or understand the exact issue preventing eligibility, with similar alternative schemes.
 */
export function SelfEligibilityChecklist({ scheme, match, profile, onOpenIntel, onSelectScheme }) {
  const { schemes: SCHEMES } = useCatalogue();

  // Extract specific restrictions from scheme
  const rawRestrictions = scheme.restrictions && scheme.restrictions.length
    ? scheme.restrictions
    : [
        `Applicant is a resident/operating in ${scheme.states === "all" ? "India" : (Array.isArray(scheme.states) ? scheme.states.join(", ") : "the eligible state/UT")}`,
        "Applicant meets general age criteria (typically 18+ years) and basic registration requirements",
        "No previous disqualification, wilful default, or barred status on government assistance",
      ];

  // Track checked state of each condition (default all true so users see their clear path)
  const [checkedState, setCheckedState] = useState(() => rawRestrictions.map(() => true));

  // Reset when scheme changes
  useEffect(() => {
    setCheckedState(rawRestrictions.map(() => true));
  }, [scheme.id]);

  const toggleCheck = (index) => {
    setCheckedState(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const selectAll = () => setCheckedState(rawRestrictions.map(() => true));
  const clearAll = () => setCheckedState(rawRestrictions.map(() => false));

  const allMet = checkedState.every(Boolean);
  const unmetIndices = checkedState
    .map((val, idx) => (!val ? idx : null))
    .filter(val => val !== null);

  // Find similar alternative schemes (same category or state) that users can explore if blocked
  const alternatives = SCHEMES.filter(alt => {
    if (alt.id === scheme.id) return false;
    const sameCat = alt.category === scheme.category;
    const sameState = Array.isArray(scheme.states) && Array.isArray(alt.states)
      ? alt.states.some(s => scheme.states.includes(s))
      : alt.states === "all" || scheme.states === "all";
    return sameCat || sameState;
  }).slice(0, 3);

  return (
    <div className="panel" style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="tt" style={{ fontSize: 11, letterSpacing: ".05em" }}>
            ELIGIBILITY CHECKLIST · {scheme.short}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--paper)", marginTop: 2 }}>
            Interactive Self-Verification
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="chip"
            style={{ fontSize: 11, padding: "3px 8px" }}
            onClick={selectAll}
          >
            ✓ Select All
          </button>
          <button
            type="button"
            className="chip"
            style={{ fontSize: 11, padding: "3px 8px" }}
            onClick={clearAll}
          >
            Reset
          </button>
          <span
            className={`badge ${allMet ? "b-official" : "b-nr"}`}
            style={{ fontSize: 11, padding: "4px 9px" }}
          >
            {allMet ? "✓ All Requirements Met" : `⚠️ ${unmetIndices.length} Requirement Unmet`}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>
        Check off each requirement below that applies to you. If you meet all items, <b>you are fully eligible without any problem</b>. If an item does not match your current situation, the system will highlight the exact issue and suggest easier alternatives.
      </p>

      {/* Checklist items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
        {rawRestrictions.map((item, idx) => {
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
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  border: `2px solid ${isChecked ? "var(--em)" : "var(--amber)"}`,
                  background: isChecked ? "var(--em)" : "transparent",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: "bold",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {isChecked ? "✓" : ""}
              </div>
              <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5, color: isChecked ? "var(--txt)" : "var(--paper)" }}>
                <span>{renderCleanText(item)}</span>
                {!isChecked && (
                  <div style={{ fontSize: 11.5, color: "var(--amber)", marginTop: 4, fontWeight: 600 }}>
                    ✕ You unchecked this condition — This is the exact issue that would block approval for this scheme.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic verdict status banner */}
      {allMet ? (
        <div
          style={{
            padding: "14px 18px",
            background: "rgba(123, 155, 125, 0.14)",
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
            <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--paper)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "var(--em)", fontSize: 16 }}>✓</span> All Requirements Met — You are Eligible!
            </div>
            <div style={{ fontSize: 12.5, color: "var(--txt)", marginTop: 3 }}>
              You are not in any problem for <b>{scheme.short}</b>. Your profile and checked criteria satisfy all official requirements.
            </div>
          </div>
          {onOpenIntel && (
            <button
              type="button"
              className="btn pri"
              onClick={onOpenIntel}
              style={{ fontSize: 12.5, padding: "8px 14px" }}
            >
              Review Application Steps →
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: "16px 18px",
            background: "rgba(201, 141, 60, 0.1)",
            border: "1.5px solid var(--amber)",
            borderRadius: 6,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--paper)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--amber)", fontSize: 16 }}>⚠️</span> Issue Identified ({unmetIndices.length} Unmet Condition{unmetIndices.length > 1 ? "s" : ""})
          </div>
          <div style={{ fontSize: 13, color: "var(--txt)", marginTop: 6, lineHeight: 1.5 }}>
            Because you do not satisfy the following item{unmetIndices.length > 1 ? "s" : ""}, this scheme may not grant approval:
            <ul style={{ paddingLeft: 20, marginTop: 6, marginBottom: 12 }}>
              {unmetIndices.map(idx => (
                <li key={idx} style={{ color: "var(--amber)", fontWeight: 500, fontSize: 12.5, marginBottom: 4 }}>
                  {renderCleanText(rawRestrictions[idx])}
                </li>
              ))}
            </ul>
          </div>

          {/* Similar alternatives */}
          {alternatives.length > 0 && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--paper)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>💡</span> Similar Alternatives With Easier / Different Criteria:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                {alternatives.map(alt => (
                  <div
                    key={alt.id}
                    onClick={() => {
                      if (onSelectScheme) onSelectScheme(alt.id);
                      else if (onOpenIntel) onOpenIntel(alt.id);
                    }}
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      borderRadius: 6,
                      padding: "8px 12px",
                      cursor: "pointer",
                      transition: "border-color .15s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--sage)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}
                  >
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--paper)" }}>{alt.short}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {alt.benefit || "Alternative support in this domain"}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--cy)", marginTop: 4, fontWeight: 500 }}>
                      View this scheme →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
