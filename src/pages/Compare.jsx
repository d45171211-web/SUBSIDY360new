import { useState, useMemo, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCatalogue } from "../context/CatalogueContext.jsx";
import { fmtL, appLabel } from "../engine/format.js";
import { LevelBadge } from "../components/LevelBadge.jsx";
import { SearchableDropdown } from "../components/SearchableDropdown.jsx";
import { SECTORS } from "../data/constants.js";

/**
 * Curated Benchmark Presets for 1-click comparison of major Central/State policies
 */
const PRESET_COMPARISONS = [
  {
    id: "solar",
    title: "Solar Energy: PM Surya Ghar vs PM-KUSUM",
    category: "solar-renewable-energy",
    schemeIds: ["pmsgmb", "pm-kusum"],
    badge: "Solar",
    desc: "Household rooftop solar (up to ₹78,000) vs agricultural solar pumps & grid plants for farmers",
  },
  {
    id: "msme",
    title: "MSME & Business: PMEGP vs Mudra vs PM Vishwakarma",
    category: "msme-business",
    schemeIds: ["pmegp", "pmmy", "pmv"],
    badge: "MSME",
    desc: "Credit-linked subsidy (up to ₹50L) vs micro-enterprise credit vs artisan toolkit loan & grant",
  },
  {
    id: "agri",
    title: "Agriculture: PM-KISAN vs PMFBY vs Paramparagat Krishi",
    category: "agriculture-farmers",
    schemeIds: ["pm-kisan", "pmfby", "pkvy"],
    badge: "Farming",
    desc: "Direct ₹6,000/yr DBT income vs comprehensive crop loss insurance vs organic cluster subsidy",
  },
  {
    id: "housing",
    title: "Affordable Housing: PMAY (Urban) vs PMAY (Gramin)",
    category: "housing",
    schemeIds: ["pmay-u", "pmay-g"],
    badge: "Housing",
    desc: "Urban credit-linked interest subsidy & pucca house vs rural direct grant assistance",
  },
  {
    id: "startups",
    title: "Startups: Credit Guarantee vs Fund of Funds",
    category: "startup-entrepreneurship",
    schemeIds: ["cgss", "ffs"],
    badge: "Startups",
    desc: "Collateral-free debt guarantees for DPIIT startups vs catalytic equity venture capital",
  },
  {
    id: "health",
    title: "Healthcare: Ayushman Bharat (PM-JAY) vs AYUSH Wellness",
    category: "health-medical",
    schemeIds: ["ab-pmjay", "ahwc"],
    badge: "Healthcare",
    desc: "₹5 lakh secondary & tertiary hospital cover vs primary preventive AYUSH care",
  },
];

const ATTRIBUTE_GROUPS = [
  { id: "all", label: "All Attributes (12)" },
  { id: "financial", label: "Financial & Benefits (4)" },
  { id: "eligibility", label: "Eligibility & Scope (3)" },
  { id: "process", label: "Process & Compliance (5)" },
];

export function Compare({ compare = [], toggleCompare, setCompare, go }) {
  const { schemes: SCHEMES } = useCatalogue();

  // Active filters and settings
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState(null); // scheme id for open menu
  const [swappingColIndex, setSwappingColIndex] = useState(null); // column index currently picking new scheme

  const headerMenuRef = useRef(null);

  // Close column header menu when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setActiveHeaderMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Synchronized picked schemes
  const picked = useMemo(() => {
    return (compare || [])
      .map(id => SCHEMES.find(s => s.id === id))
      .filter(Boolean);
  }, [compare, SCHEMES]);

  // Options for scheme selectors filtered by category / level
  const schemeOptions = useMemo(() => {
    let list = SCHEMES;
    if (categoryFilter) {
      list = list.filter(s => s.sectors && s.sectors.includes(categoryFilter));
    }
    if (levelFilter) {
      list = list.filter(s => s.level === levelFilter);
    }
    return list.map(s => ({
      label: s.short || s.name || s.id,
      value: s.id,
      sub: [
        s.level,
        s.maxBenefitL != null ? `Max ₹${s.maxBenefitL}L` : "Scale-based",
        s.dept ? s.dept.split("·")[0].trim() : null,
      ].filter(Boolean).join(" · "),
    }));
  }, [SCHEMES, categoryFilter, levelFilter]);

  // Slot management functions
  const updateSlot = (index, newId) => {
    if (!newId) return;
    const current = [...(compare || [])];
    if (index < current.length) {
      // Replace existing slot
      current[index] = newId;
    } else {
      // Append new slot
      current.push(newId);
    }
    // Deduplicate while preserving slot
    const deduped = Array.from(new Set(current));
    if (setCompare) {
      setCompare(deduped);
    } else if (toggleCompare) {
      toggleCompare(newId);
    }
    setSwappingColIndex(null);
    setActiveHeaderMenu(null);
  };

  const removeSlot = (schemeId) => {
    if (setCompare) {
      setCompare(c => c.filter(id => id !== schemeId));
    } else if (toggleCompare) {
      toggleCompare(schemeId);
    }
    setActiveHeaderMenu(null);
  };

  const swapSlots = (idx1, idx2) => {
    if (!setCompare || !compare[idx1] || !compare[idx2]) return;
    const next = [...compare];
    const tmp = next[idx1];
    next[idx1] = next[idx2];
    next[idx2] = tmp;
    setCompare(next);
  };

  const clearAll = () => {
    if (setCompare) {
      setCompare([]);
    } else if (toggleCompare) {
      compare.forEach(id => toggleCompare(id));
    }
    setSelectedPresetId("");
  };

  const handleApplyPreset = (presetId) => {
    setSelectedPresetId(presetId);
    const p = PRESET_COMPARISONS.find(x => x.id === presetId);
    if (p) {
      // Filter existing valid IDs in this catalogue
      const validIds = p.schemeIds.filter(id => SCHEMES.some(s => s.id === id));
      if (validIds.length && setCompare) {
        setCompare(validIds);
      }
    }
  };

  // Attribute definitions with raw difference detector
  const rowsDef = [
    {
      id: "benefit",
      group: "financial",
      label: "Benefit description",
      getRaw: s => s.benefit || "As per departmental norms",
      render: s => s.benefit || <span className="badge" style={{ background: "rgba(123, 155, 125, 0.15)", color: "var(--paper)" }}>As per departmental norms</span>,
    },
    {
      id: "maxBenefit",
      group: "financial",
      label: "Maximum support",
      getRaw: s => s.maxBenefitL != null ? String(s.maxBenefitL) : "Scale-based",
      render: s => s.maxBenefitL != null ? <span className="mono" style={{ color: "var(--gold)", fontWeight: 600 }}>{fmtL(s.maxBenefitL)}</span> : <span className="badge" style={{ background: "rgba(123, 155, 125, 0.15)", color: "var(--paper)" }}>Scale / Need-based</span>,
    },
    {
      id: "benefitType",
      group: "financial",
      label: "Benefit type",
      getRaw: s => s.benefitType || "Grant / Welfare",
      render: s => s.benefitType || <span className="badge" style={{ background: "rgba(123, 155, 125, 0.15)", color: "var(--paper)" }}>Grant / Welfare support</span>,
    },
    {
      id: "investRange",
      group: "financial",
      label: "Investment range",
      getRaw: s => s.investMaxL > 0 ? `${s.investMinL}-${s.investMaxL}` : "0",
      render: s => s.investMaxL > 0 ? `${fmtL(s.investMinL)} – ${fmtL(s.investMaxL)}` : "No project investment",
    },
    {
      id: "applicants",
      group: "eligibility",
      label: "Target beneficiary",
      getRaw: s => s.applicants.map(appLabel).sort().join(", "),
      render: s => s.applicants.map(appLabel).join(", ") || "General",
    },
    {
      id: "states",
      group: "eligibility",
      label: "State availability",
      getRaw: s => s.states === "all" ? "All India" : (Array.isArray(s.states) ? s.states.slice().sort().join(", ") : String(s.states)),
      render: s => s.states === "all" ? "All India" : (Array.isArray(s.states) ? s.states.join(", ") : s.states),
    },
    {
      id: "loan",
      group: "eligibility",
      label: "Loan requirement",
      getRaw: s => s.loanRequired ? "Required" : "No loan",
      render: s => s.loanRequired ? "Bank loan required" : "No loan needed",
    },
    {
      id: "process",
      group: "process",
      label: "Application route",
      getRaw: s => s.process[0] || "Official portal / CSC",
      render: s => s.process[0] || <span className="badge" style={{ background: "rgba(123, 155, 125, 0.15)", color: "var(--paper)" }}>Official portal / CSC</span>,
    },
    {
      id: "dept",
      group: "process",
      label: "Department",
      getRaw: s => s.dept || "State / Central Nodal Dept",
      render: s => s.dept || <span className="badge" style={{ background: "rgba(123, 155, 125, 0.15)", color: "var(--paper)" }}>State / Central Nodal Dept</span>,
    },
    {
      id: "docs",
      group: "process",
      label: "Required documents",
      getRaw: s => (s.docs || []).slice(0, 3).join("; "),
      render: s => s.docs && s.docs.length ? s.docs.slice(0, 3).join("; ") + (s.docs.length > 3 ? " …" : "") : <span className="badge" style={{ background: "rgba(123, 155, 125, 0.15)", color: "var(--paper)" }}>Aadhaar, Bank details & IDs</span>,
    },
    {
      id: "source",
      group: "process",
      label: "Official source",
      getRaw: s => s.source || "",
      render: s => <span className="mono" style={{ fontSize: 12, color: "var(--cy)" }}>{s.source}</span>,
    },
    {
      id: "verified",
      group: "process",
      label: "Verification status",
      getRaw: s => s.verified || "Ongoing",
      render: s => s.verified ? <span className="badge b-verified">◷ {s.verified}</span> : <span className="badge b-verified">◷ Ongoing Portal Data</span>,
    },
  ];

  // Filter rows based on active attribute group
  const visibleRows = useMemo(() => {
    if (activeGroup === "all") return rowsDef;
    return rowsDef.filter(r => r.group === activeGroup);
  }, [activeGroup]);

  // Check if a row differs across selected schemes
  const checkRowDiff = (row) => {
    if (picked.length < 2) return false;
    const firstVal = row.getRaw(picked[0]);
    return picked.some(s => row.getRaw(s) !== firstVal);
  };

  return (
    <div className="fadein" style={{ padding: "34px 0" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Compare • Menu-Driven</div>
          <h2 className="sec" style={{ marginBottom: 4 }}>Side-by-side comparison</h2>
          <p className="sub" style={{ fontSize: 13.5 }}>
            Compare government schemes side-by-side across benefits, caps, eligibility, and process rules. Select schemes via dropdown menus, load policy presets, or filter across all 34 support categories.
          </p>
        </div>

        {picked.length > 0 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="badge b-official" style={{ fontSize: 11 }}>
              {picked.length} {picked.length === 1 ? "Scheme selected" : "Schemes in comparison"}
            </span>
            <button
              type="button"
              className="btn sec"
              style={{ fontSize: 12, padding: "6px 12px" }}
              onClick={clearAll}
              title="Reset comparison"
            >
              ✕ Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Menu Controls Toolbar */}
      <div
        className="panel"
        style={{
          padding: "16px 18px",
          marginBottom: 20,
          background: "var(--panel)",
          border: "1px solid var(--line2)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
          {/* Menu 1: Curated Presets Menu */}
          <div>
            <label className="tt" style={{ display: "block", marginBottom: 5 }}>
              ⚡ Quick Comparison Presets
            </label>
            <select
              className="sel"
              value={selectedPresetId}
              onChange={(e) => handleApplyPreset(e.target.value)}
              style={{ fontSize: 13, padding: "9px 12px" }}
            >
              <option value="">Choose a benchmark preset…</option>
              {PRESET_COMPARISONS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Menu 2: Support Category Filter Menu */}
          <div>
            <label className="tt" style={{ display: "block", marginBottom: 5 }}>
              Filter Menu by Category ({SECTORS.length} Categories)
            </label>
            <select
              className="sel"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ fontSize: 13, padding: "9px 12px" }}
            >
              <option value="">All Support Categories (4,670+ schemes)</option>
              {SECTORS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.num}. {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Menu 3: Central / State Scope Menu */}
          <div>
            <label className="tt" style={{ display: "block", marginBottom: 5 }}>
              Filter Menu by Level
            </label>
            <select
              className="sel"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              style={{ fontSize: 13, padding: "9px 12px" }}
            >
              <option value="">All Levels (Central & State)</option>
              <option value="Central">Central Schemes Only</option>
              <option value="State">State Schemes Only</option>
            </select>
          </div>
        </div>

        {/* Selected Category / Level Indicator */}
        {(categoryFilter || levelFilter) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", flexWrap: "wrap", paddingTop: 4, borderTop: "1px dashed var(--line)" }}>
            <span>
              Dropdown menus filtered to: <b>{categoryFilter ? (SECTORS.find(s => s.id === categoryFilter)?.label || categoryFilter) : "All categories"}</b> · <b>{levelFilter ? `${levelFilter} schemes` : "Central & State"}</b> ({schemeOptions.length} matching options)
            </span>
            <button
              type="button"
              className="btn ghost"
              style={{ fontSize: 11, padding: "2px 6px" }}
              onClick={() => { setCategoryFilter(""); setLevelFilter(""); }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Menu-Driven Scheme Selector Slots */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div className="tt" style={{ textTransform: "uppercase" }}>
            Scheme Comparison Slots ({picked.length} active)
          </div>
          {picked.length >= 2 && (
            <button
              type="button"
              className="btn ghost"
              style={{ fontSize: 12, padding: "3px 8px" }}
              onClick={() => swapSlots(0, 1)}
              title="Swap Column 1 and Column 2"
            >
              ⇄ Swap Scheme 1 & 2
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 14 }}>
          {/* Slot 1: Scheme A */}
          <div className="panel" style={{ padding: "14px 16px", background: "var(--panel2)", border: "1.5px solid var(--line2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--cy)", letterSpacing: ".08em" }}>
                SLOT 1 (SCHEME A)
              </span>
              {picked[0] && (
                <button
                  type="button"
                  onClick={() => removeSlot(picked[0].id)}
                  style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                  title="Remove scheme from Slot 1"
                >
                  ✕ Remove
                </button>
              )}
            </div>

            <SearchableDropdown
              value={picked[0] ? picked[0].id : ""}
              options={schemeOptions}
              placeholder="Select Scheme 1 from menu..."
              searchPlaceholder="Type scheme name (e.g. PMEGP, Solar, PM-KISAN)..."
              badgeText={picked[0] ? `${picked[0].level} · ${picked[0].maxBenefitL != null ? `Max ${fmtL(picked[0].maxBenefitL)}` : "Scale-based"}` : undefined}
              onChange={(selectedVal) => updateSlot(0, selectedVal)}
              style={{ maxWidth: "100%" }}
            />

            {picked[0] && (
              <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                  {picked[0].dept?.split("·")[0].trim() || "National Programme"}
                </span>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ fontSize: 11, padding: "1px 4px" }}
                  onClick={() => go("intel", picked[0].id)}
                >
                  Intel →
                </button>
              </div>
            )}
          </div>

          {/* Slot 2: Scheme B */}
          <div className="panel" style={{ padding: "14px 16px", background: "var(--panel2)", border: "1.5px solid var(--line2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--cy)", letterSpacing: ".08em" }}>
                SLOT 2 (SCHEME B)
              </span>
              {picked[1] && (
                <button
                  type="button"
                  onClick={() => removeSlot(picked[1].id)}
                  style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                  title="Remove scheme from Slot 2"
                >
                  ✕ Remove
                </button>
              )}
            </div>

            <SearchableDropdown
              value={picked[1] ? picked[1].id : ""}
              options={schemeOptions}
              placeholder="Select Scheme 2 from menu..."
              searchPlaceholder="Type scheme name (e.g. Mudra, KUSUM, PMFBY)..."
              badgeText={picked[1] ? `${picked[1].level} · ${picked[1].maxBenefitL != null ? `Max ${fmtL(picked[1].maxBenefitL)}` : "Scale-based"}` : undefined}
              onChange={(selectedVal) => updateSlot(1, selectedVal)}
              style={{ maxWidth: "100%" }}
            />

            {picked[1] && (
              <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                  {picked[1].dept?.split("·")[0].trim() || "National Programme"}
                </span>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ fontSize: 11, padding: "1px 4px" }}
                  onClick={() => go("intel", picked[1].id)}
                >
                  Intel →
                </button>
              </div>
            )}
          </div>

          {/* Additional Slots (Slot 3+) if compared */}
          {picked.slice(2).map((s, extraIdx) => {
            const slotIndex = 2 + extraIdx;
            return (
              <div key={s.id} className="panel" style={{ padding: "14px 16px", background: "var(--panel2)", border: "1.5px solid var(--line2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--cy)", letterSpacing: ".08em" }}>
                    SLOT {slotIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSlot(s.id)}
                    style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                    title={`Remove ${s.short}`}
                  >
                    ✕ Remove
                  </button>
                </div>

                <SearchableDropdown
                  value={s.id}
                  options={schemeOptions}
                  placeholder={`Select Scheme ${slotIndex + 1}...`}
                  searchPlaceholder="Type scheme name..."
                  badgeText={`${s.level} · ${s.maxBenefitL != null ? `Max ${fmtL(s.maxBenefitL)}` : "Scale-based"}`}
                  onChange={(selectedVal) => updateSlot(slotIndex, selectedVal)}
                  style={{ maxWidth: "100%" }}
                />

                <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                    {s.dept?.split("·")[0].trim() || "National Programme"}
                  </span>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ fontSize: 11, padding: "1px 4px" }}
                    onClick={() => go("intel", s.id)}
                  >
                    Intel →
                  </button>
                </div>
              </div>
            );
          })}

          {/* + Add Another Scheme Menu Slot */}
          {picked.length >= 2 && picked.length < 5 && (
            <div
              className="panel"
              style={{
                padding: "14px 16px",
                background: "rgba(123, 155, 125, 0.08)",
                border: "1.5px dashed var(--line2)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "var(--paper)" }}>
                + Add Scheme to Compare (Slot {picked.length + 1})
              </div>
              <SearchableDropdown
                value=""
                options={schemeOptions.filter(opt => !compare.includes(opt.value))}
                placeholder={`+ Add scheme #${picked.length + 1} from menu...`}
                searchPlaceholder="Search & add scheme column..."
                onChange={(selectedVal) => updateSlot(picked.length, selectedVal)}
                style={{ maxWidth: "100%" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Comparison View or Zero State */}
      {picked.length < 2 ? (
        <div className="panel" style={{ padding: "40px 24px", textAlign: "center", background: "var(--panel)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚖️</div>
          <h3 className="sec" style={{ fontSize: 19, marginBottom: 8 }}>
            Menu-Driven Comparison Ready
          </h3>
          <p style={{ color: "var(--muted)", maxWidth: 540, margin: "0 auto 20px", fontSize: 14 }}>
            Please select at least two schemes using the dropdown menus above, or pick one of our recommended policy comparison presets below:
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, maxWidth: 840, margin: "0 auto" }}>
            {PRESET_COMPARISONS.map(p => (
              <button
                key={p.id}
                type="button"
                className="btn sec"
                onClick={() => handleApplyPreset(p.id)}
                style={{ textAlign: "left", fontSize: 12.5, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}
              >
                <span className="badge b-official" style={{ fontSize: 10 }}>{p.badge}</span>
                <span>{p.title.split(":")[1]?.trim() || p.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Comparison Table Controls: Attribute Group Menu & Highlight Diff Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 12,
              padding: "10px 14px",
              background: "var(--bg2)",
              borderRadius: 6,
              border: "1px solid var(--line)",
            }}
          >
            {/* Attribute Filter Segmented Menu */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="tt" style={{ marginRight: 4 }}>VIEW ATTRIBUTES:</span>
              {ATTRIBUTE_GROUPS.map(g => (
                <button
                  key={g.id}
                  type="button"
                  className={`chip ${activeGroup === g.id ? "on" : ""}`}
                  onClick={() => setActiveGroup(g.id)}
                  style={{ fontSize: 11.5, padding: "4px 10px" }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Toggle Highlight Differences */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 12.5,
                  cursor: "pointer",
                  userSelect: "none",
                  fontWeight: 500,
                  color: "var(--paper)",
                }}
              >
                <input
                  type="checkbox"
                  checked={highlightDiff}
                  onChange={(e) => setHighlightDiff(e.target.checked)}
                  style={{ cursor: "pointer", accentColor: "var(--em)" }}
                />
                <span>Highlight Differences</span>
              </label>
              <span style={{ color: "var(--muted2)", fontSize: 11 }}>↔ Scroll horizontally to compare</span>
            </div>
          </div>

          {/* Comparison Table with Sticky Attribute Header & Column Menus */}
          <div className="cmp-wrap panel" style={{ padding: 0, marginBottom: 20 }}>
            <table className="cmp">
              <thead>
                <tr>
                  <th style={{ width: 180, minWidth: 160 }}>
                    <div>ATTRIBUTE</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "none", marginTop: 3 }}>
                      Showing {visibleRows.length} attributes
                    </div>
                  </th>

                  {picked.map((s, colIdx) => (
                    <th key={s.id} style={{ minWidth: 220, position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            onClick={() => go("intel", s.id)}
                            style={{ cursor: "pointer", color: "var(--paper)", textDecoration: "underline", textUnderlineOffset: 3 }}
                            title="Click to view Scheme Intelligence"
                          >
                            {s.short}
                          </span>
                          <div style={{ marginTop: 4, display: "flex", gap: 5, alignItems: "center" }}>
                            <LevelBadge level={s.level} />
                            <span className="badge b-official" style={{ fontSize: 9 }}>Col {colIdx + 1}</span>
                          </div>
                        </div>

                        {/* Column Header Dropdown Menu Button */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            className="btn sec"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveHeaderMenu(activeHeaderMenu === s.id ? null : s.id);
                            }}
                            style={{
                              padding: "2px 7px",
                              fontSize: 11,
                              borderRadius: 4,
                              background: activeHeaderMenu === s.id ? "var(--em)" : "transparent",
                              color: activeHeaderMenu === s.id ? "#FAF9F5" : "var(--muted)",
                              border: "1px solid var(--line2)",
                            }}
                            title="Column options menu"
                            aria-expanded={activeHeaderMenu === s.id}
                          >
                            Menu ▼
                          </button>

                          {/* Column Dropdown Menu Overlay */}
                          {activeHeaderMenu === s.id && (
                            <div
                              ref={headerMenuRef}
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "calc(100% + 4px)",
                                width: 200,
                                background: "var(--panel)",
                                border: "1px solid var(--line2)",
                                borderRadius: 6,
                                boxShadow: "0 8px 24px rgba(31, 59, 46, 0.16)",
                                zIndex: 120,
                                padding: "4px 0",
                                textAlign: "left",
                              }}
                            >
                              <div style={{ padding: "6px 12px", fontSize: 10, color: "var(--muted)", borderBottom: "1px solid var(--line)", fontFamily: "var(--mono)" }}>
                                COLUMN {colIdx + 1} OPTIONS
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveHeaderMenu(null);
                                  setSwappingColIndex(colIdx);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  width: "100%",
                                  padding: "8px 12px",
                                  background: "none",
                                  border: "none",
                                  fontSize: 12.5,
                                  color: "var(--txt)",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "var(--panel2)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              >
                                <span>🔄</span> Change scheme…
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveHeaderMenu(null);
                                  go("intel", s.id);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  width: "100%",
                                  padding: "8px 12px",
                                  background: "none",
                                  border: "none",
                                  fontSize: 12.5,
                                  color: "var(--txt)",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "var(--panel2)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              >
                                <span>📊</span> View Intelligence
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveHeaderMenu(null);
                                  go("combine");
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  width: "100%",
                                  padding: "8px 12px",
                                  background: "none",
                                  border: "none",
                                  fontSize: 12.5,
                                  color: "var(--txt)",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "var(--panel2)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              >
                                <span>🔗</span> Test Combination
                              </button>

                              <button
                                type="button"
                                onClick={() => removeSlot(s.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  width: "100%",
                                  padding: "8px 12px",
                                  background: "none",
                                  border: "none",
                                  borderTop: "1px solid var(--line)",
                                  fontSize: 12.5,
                                  color: "var(--red)",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(201, 91, 83, 0.08)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              >
                                <span>✕</span> Remove from comparison
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Swapping Dropdown for Column */}
                      {swappingColIndex === colIdx && (
                        <div style={{ marginTop: 8 }}>
                          <SearchableDropdown
                            value={s.id}
                            options={schemeOptions}
                            placeholder="Select replacement scheme..."
                            searchPlaceholder="Type to swap scheme..."
                            onChange={(newSchemeId) => updateSlot(colIdx, newSchemeId)}
                            style={{ maxWidth: "100%" }}
                          />
                        </div>
                      )}
                    </th>
                  ))}

                  {/* Right Header: + Add Column Button */}
                  {picked.length < 5 && (
                    <th style={{ width: 140, minWidth: 120, verticalAlign: "middle", textAlign: "center", background: "rgba(123, 155, 125, 0.05)" }}>
                      <div style={{ padding: "4px 0" }}>
                        <SearchableDropdown
                          value=""
                          options={schemeOptions.filter(opt => !compare.includes(opt.value))}
                          placeholder="+ Add Col"
                          searchPlaceholder="Add column scheme..."
                          onChange={(newId) => updateSlot(picked.length, newId)}
                          style={{ maxWidth: 130 }}
                        />
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row) => {
                  const isDiff = checkRowDiff(row);
                  return (
                    <tr key={row.id} className={highlightDiff && isDiff ? "cmp-row-diff" : ""}>
                      <td className="lbl">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span>{row.label}</span>
                          {highlightDiff && isDiff && (
                            <span className="cmp-diff-tag" title="Values differ across selected schemes">
                              DIFF
                            </span>
                          )}
                        </div>
                      </td>
                      {picked.map(s => (
                        <td key={s.id}>
                          {row.render(s)}
                        </td>
                      ))}
                      {picked.length < 5 && <td style={{ background: "rgba(123, 155, 125, 0.03)" }} />}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bar Chart: Maximum Reported Assistance */}
          <div className="panel" style={{ padding: 20, marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              <h2 className="sec" style={{ fontSize: 17 }}>
                Maximum reported cash support (₹ lakh)
              </h2>
              <span className="badge b-official" style={{ fontSize: 10.5 }}>
                {picked.length} Schemes Plotted
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 12 }}>
              Schemes without a fixed cash ceiling operate on a need-based / scale-of-assistance model — providing direct in-kind or component assistance rather than a capped cash figure.
            </p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={picked.map(s => ({
                    n: s.short,
                    v: s.maxBenefitL ?? 0,
                    nr: s.maxBenefitL == null,
                  }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="n"
                    tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                    axisLine={{ stroke: "var(--line)" }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "var(--muted2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel)",
                      border: "1px solid var(--line2)",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                    formatter={(v, n, pr) =>
                      pr.payload.nr
                        ? ["Scale-based / Component subsidy", "Max support"]
                        : [`₹${v} lakh`, "Max support"]
                    }
                    cursor={{ fill: "rgba(123, 155, 125, 0.1)" }}
                  />
                  <Bar dataKey="v" fill="var(--sage)" radius={[2, 2, 0, 0]} maxBarSize={54} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Next Steps & Action Links */}
          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn pri" onClick={() => go("combine")}>
              Can I combine these schemes? →
            </button>
            {picked[0] && (
              <button className="btn sec" onClick={() => go("intel", picked[0].id)}>
                View Scheme Intelligence for {picked[0].short}
              </button>
            )}
            <button className="btn ghost" onClick={() => go("discover")}>
              ← Back to Scheme Explorer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
