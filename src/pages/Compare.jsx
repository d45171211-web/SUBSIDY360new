import { useState, useMemo, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCatalogue } from "../context/CatalogueContext.jsx";
import { fmtL, appLabel } from "../engine/format.js";
import { LevelBadge } from "../components/LevelBadge.jsx";
import { SearchableDropdown } from "../components/SearchableDropdown.jsx";
import { SECTORS } from "../data/constants.js";

/**
 * Curated Benchmark Presets for 1-Click Comparison
 */
const PRESET_COMPARISONS = [
  {
    id: "solar",
    icon: "☀️",
    badge: "Solar & Clean Energy",
    title: "PM Surya Ghar vs PM-KUSUM",
    schemeIds: ["pmsgmb", "pm-kusum"],
    desc: "Household rooftop solar (up to ₹78,000 subsidy) vs farmer agricultural solar pumps & feeder solarisation",
    highlights: ["Rooftop vs Agricultural", "Direct DBT vs Component Subsidy", "No loan needed vs Bank-linked"],
  },
  {
    id: "msme",
    icon: "💼",
    badge: "MSME & Business",
    title: "PMEGP vs Mudra vs PM Vishwakarma",
    schemeIds: ["pmegp", "pmmy", "pmv"],
    desc: "Capital subsidy (up to ₹50L project) vs collateral-free micro-credit (up to ₹10L) vs artisan toolkit & skill grant",
    highlights: ["15–35% Margin Money", "Collateral-free debt", "18 Traditional Trades"],
  },
  {
    id: "agri",
    icon: "🌾",
    badge: "Agriculture & Farmers",
    title: "PM-KISAN vs PMFBY vs Paramparagat Krishi",
    schemeIds: ["pm-kisan", "pmfby", "pkvy"],
    desc: "Direct ₹6,000/yr DBT income support vs crop loss insurance coverage vs organic farming cluster assistance",
    highlights: ["Universal farmer DBT", "1.5–5% premium cap", "₹50,000/ha organic grant"],
  },
  {
    id: "housing",
    icon: "🏠",
    badge: "Affordable Housing",
    title: "PMAY (Urban) vs PMAY (Gramin)",
    schemeIds: ["pmay-u", "pmay-g"],
    desc: "Urban interest subsidy & dwelling units vs rural direct grant assistance (up to ₹1.3 lakh) for pucca houses",
    highlights: ["Urban Credit-Linked", "Direct rural grant", "Aadhaar Geo-tagged"],
  },
  {
    id: "startups",
    icon: "🚀",
    badge: "Startups & Innovation",
    title: "Credit Guarantee vs Fund of Funds",
    schemeIds: ["cgss", "ffs"],
    desc: "Collateral-free debt guarantees for DPIIT startups vs catalytic equity venture capital funding",
    highlights: ["Debt guarantee cover", "Equity fund-of-funds", "DPIIT recognised"],
  },
  {
    id: "health",
    icon: "🏥",
    badge: "Healthcare & Insurance",
    title: "Ayushman Bharat vs AYUSH Wellness",
    schemeIds: ["ab-pmjay", "ahwc"],
    desc: "₹5 lakh/family secondary & tertiary hospitalisation cover vs primary preventive AYUSH health facilities",
    highlights: ["₹5 Lakh cashless", "Secondary/Tertiary care", "AYUSH preventive health"],
  },
];

const POPULAR_CATEGORY_SHORTCUTS = [
  { id: "", label: "All Categories" },
  { id: "solar-renewable-energy", label: "☀️ Solar Energy" },
  { id: "msme-business", label: "💼 MSME & Business" },
  { id: "agriculture-farmers", label: "🌾 Agriculture" },
  { id: "housing", label: "🏠 Housing" },
  { id: "health-medical", label: "🏥 Health" },
  { id: "startup-entrepreneurship", label: "🚀 Startups" },
  { id: "education-scholarships", label: "🎓 Education" },
];

const POPULAR_QUICK_SCHEMES_SLOT1 = [
  { id: "pmsgmb", label: "☀️ PM Surya Ghar" },
  { id: "pmegp", label: "💼 PMEGP" },
  { id: "pm-kisan", label: "🌾 PM-KISAN" },
  { id: "ab-pmjay", label: "🏥 Ayushman Bharat" },
];

const POPULAR_QUICK_SCHEMES_SLOT2 = [
  { id: "pm-kusum", label: "☀️ PM-KUSUM" },
  { id: "pmmy", label: "💼 PM Mudra" },
  { id: "pmfby", label: "🌾 PM Fasal Bima" },
  { id: "pmay-u", label: "🏠 PMAY (Urban)" },
];

const ATTRIBUTE_GROUPS = [
  { id: "all", label: "All Attributes", count: 12, icon: "📋" },
  { id: "financial", label: "Financial & Benefits", count: 4, icon: "💰" },
  { id: "eligibility", label: "Eligibility & Scope", count: 3, icon: "👥" },
  { id: "process", label: "Process & Documents", count: 5, icon: "📑" },
];

export function Compare({ compare = [], toggleCompare, setCompare, go }) {
  const { schemes: SCHEMES } = useCatalogue();

  // Active filters and settings
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState(null); // scheme id for open column menu
  const [activeSlotMenu, setActiveSlotMenu] = useState(null); // slot index for replacing
  const [presetNotification, setPresetNotification] = useState("");

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

  // Check if a preset is currently active
  const activePresetId = useMemo(() => {
    if (picked.length === 0) return "";
    for (const p of PRESET_COMPARISONS) {
      if (p.schemeIds.length === picked.length && p.schemeIds.every(id => compare.includes(id))) {
        return p.id;
      }
    }
    return "";
  }, [picked, compare]);

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
      current[index] = newId;
    } else {
      current.push(newId);
    }
    const deduped = Array.from(new Set(current));
    if (setCompare) {
      setCompare(deduped);
    } else if (toggleCompare) {
      toggleCompare(newId);
    }
    setActiveSlotMenu(null);
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
  };

  const applyPreset = (preset) => {
    const validIds = preset.schemeIds.filter(id => SCHEMES.some(s => s.id === id));
    if (validIds.length && setCompare) {
      setCompare(validIds);
      setPresetNotification(`Applied: ${preset.title}`);
      setTimeout(() => setPresetNotification(""), 3500);
      window.scrollTo({ top: 320, behavior: "smooth" });
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

  const diffCount = useMemo(() => {
    if (picked.length < 2) return 0;
    return visibleRows.filter(r => checkRowDiff(r)).length;
  }, [picked, visibleRows]);

  return (
    <div className="fadein" style={{ padding: "28px 0 40px" }}>
      {/* Toast Notification when applying preset */}
      {presetNotification && (
        <div
          className="fadein"
          style={{
            position: "fixed",
            top: 72,
            right: 24,
            zIndex: 999,
            background: "var(--em)",
            color: "#FAF9F5",
            padding: "10px 18px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(31, 59, 46, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>✓</span>
          <span>{presetNotification}</span>
        </div>
      )}

      {/* Main Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Side-by-side comparison • Menu driven
          </div>
          <h2 className="sec" style={{ fontSize: "clamp(22px, 3.2vw, 30px)", marginBottom: 4 }}>
            Compare Schemes
          </h2>
          <p className="sub" style={{ fontSize: 13.5, maxWidth: 660 }}>
            Compare Central and State government schemes side-by-side. Pick schemes using intuitive dropdown menus, apply 1-click policy benchmark presets, or filter across all 34 support categories.
          </p>
        </div>

        {/* Global Quick Action Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {picked.length > 0 && (
            <>
              <span className="badge b-official" style={{ fontSize: 11, padding: "5px 10px" }}>
                {picked.length} {picked.length === 1 ? "Scheme Selected" : "Schemes Compared"}
              </span>
              {picked.length >= 2 && (
                <button
                  type="button"
                  className="btn sec"
                  onClick={() => swapSlots(0, 1)}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                  title="Swap Scheme 1 and Scheme 2"
                >
                  ⇄ Swap 1 & 2
                </button>
              )}
              <button
                type="button"
                className="btn sec"
                onClick={clearAll}
                style={{ fontSize: 12, padding: "6px 12px", color: "var(--red)" }}
                title="Clear all selected schemes"
              >
                ✕ Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* SECTION 1: 1-Click Apply Benchmark Presets Menu Strip */}
      <div
        className="panel"
        style={{
          padding: "18px 20px",
          marginBottom: 20,
          background: "var(--panel)",
          border: "1.5px solid var(--line2)",
          borderRadius: 8,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ font: "700 13px var(--mono)", color: "var(--paper)", letterSpacing: ".06em", textTransform: "uppercase" }}>
              1-Click Benchmark Comparisons
            </span>
            <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>
              — Tap any preset to instantly load and compare:
            </span>
          </div>

          {activePresetId && (
            <span className="badge b-official" style={{ fontSize: 10.5 }}>
              Active Preset: {PRESET_COMPARISONS.find(p => p.id === activePresetId)?.badge}
            </span>
          )}
        </div>

        {/* Preset Cards Grid (Easy 1-Click Application) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
            gap: 10,
          }}
        >
          {PRESET_COMPARISONS.map(preset => {
            const isActive = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => applyPreset(preset)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") applyPreset(preset); }}
                style={{
                  padding: "12px 14px",
                  borderRadius: 6,
                  border: isActive ? "2px solid var(--em)" : "1px solid var(--line2)",
                  background: isActive ? "var(--panel2)" : "var(--bg2)",
                  cursor: "pointer",
                  transition: "all .18s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isActive ? "0 4px 14px rgba(31, 59, 46, 0.12)" : "none",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--em)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--line2)";
                    e.currentTarget.style.transform = "none";
                  }
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--cy)", fontFamily: "var(--mono)" }}>
                      {preset.icon} {preset.badge}
                    </span>
                    {isActive ? (
                      <span className="badge b-official" style={{ fontSize: 9.5, padding: "1px 6px" }}>
                        ✓ ACTIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--mono)" }}>
                        APPLY ↵
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--paper)", lineHeight: 1.3, marginBottom: 4 }}>
                    {preset.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.4 }}>
                    {preset.desc}
                  </div>
                </div>

                <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px dashed var(--line)", display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {preset.highlights.map(h => (
                    <span key={h} style={{ fontSize: 10, color: "var(--muted2)", background: "rgba(123, 155, 125, 0.12)", padding: "1px 5px", borderRadius: 3 }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Search & Filter Menu Toolbar */}
      <div
        className="panel"
        style={{
          padding: "14px 18px",
          marginBottom: 20,
          background: "var(--bg2)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="tt" style={{ textTransform: "uppercase" }}>MENU FILTERS:</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Filter the schemes shown in the selector dropdowns below
            </span>
          </div>

          {/* Level Toggle Menu */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span className="tt" style={{ marginRight: 4 }}>LEVEL:</span>
            {[
              { id: "", label: "All Levels" },
              { id: "Central", label: "Central" },
              { id: "State", label: "State" },
            ].map(lvl => (
              <button
                key={lvl.id}
                type="button"
                className={`chip ${levelFilter === lvl.id ? "on" : ""}`}
                onClick={() => setLevelFilter(lvl.id)}
                style={{ fontSize: 11.5, padding: "3px 9px" }}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Category Chips Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span className="tt" style={{ marginRight: 2 }}>QUICK CATEGORIES:</span>
          {POPULAR_CATEGORY_SHORTCUTS.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`chip ${categoryFilter === cat.id ? "on" : ""}`}
              onClick={() => setCategoryFilter(cat.id)}
              style={{ fontSize: 11.5, padding: "4px 10px" }}
            >
              {cat.label}
            </button>
          ))}

          {/* Complete 34 Categories Select */}
          <select
            className="sel"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: "auto", minWidth: 170, fontSize: 11.5, padding: "4px 8px", height: 30 }}
            aria-label="Filter by all categories"
          >
            <option value="">More Categories ({SECTORS.length})…</option>
            {SECTORS.map(s => (
              <option key={s.id} value={s.id}>
                {s.num}. {s.label}
              </option>
            ))}
          </select>

          {(categoryFilter || levelFilter) && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => { setCategoryFilter(""); setLevelFilter(""); }}
              style={{ fontSize: 11, padding: "2px 6px" }}
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>

      {/* SECTION 3: The Scheme Comparison Slots Dock */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="tt" style={{ fontSize: 12, textTransform: "uppercase" }}>
              COMPARISON SLOTS ({picked.length} ACTIVE)
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {picked.length === 0
                ? "Select schemes for Slot 1 and Slot 2 to compare"
                : picked.length === 1
                ? "Select a 2nd scheme to unlock comparison"
                : "You can compare up to 4 schemes side-by-side"}
            </span>
          </div>
        </div>

        {/* Slot Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 310px), 1fr))", gap: 14 }}>
          {/* SLOT 1 */}
          <div
            className="panel"
            style={{
              padding: "16px 18px",
              background: picked[0] ? "var(--panel)" : "var(--panel2)",
              border: picked[0] ? "2px solid var(--em)" : "1.5px dashed var(--line2)",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 180,
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--cy)", letterSpacing: ".08em" }}>
                  SLOT 1 (SCHEME A)
                </span>
                {picked[0] && (
                  <button
                    type="button"
                    onClick={() => removeSlot(picked[0].id)}
                    style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                    title="Remove Slot 1"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {picked[0] ? (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--paper)", marginBottom: 4, lineHeight: 1.3 }}>
                    {picked[0].short}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {picked[0].name}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                    <LevelBadge level={picked[0].level} />
                    <span className="badge b-official" style={{ fontSize: 10 }}>
                      {picked[0].maxBenefitL != null ? `Max ₹${picked[0].maxBenefitL}L` : "Scale-based support"}
                    </span>
                  </div>

                  {/* Replace Scheme Dropdown toggle */}
                  {activeSlotMenu === 0 ? (
                    <div style={{ marginTop: 8 }}>
                      <SearchableDropdown
                        value={picked[0].id}
                        options={schemeOptions}
                        placeholder="Search replacement scheme..."
                        searchPlaceholder="Type to switch scheme..."
                        onChange={(selectedVal) => updateSlot(0, selectedVal)}
                        style={{ maxWidth: "100%" }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn sec"
                        onClick={() => setActiveSlotMenu(0)}
                        style={{ fontSize: 11.5, padding: "5px 10px" }}
                      >
                        🔄 Change Scheme
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => go("intel", picked[0].id)}
                        style={{ fontSize: 11.5, padding: "5px 10px" }}
                      >
                        View Details →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
                    Select Scheme 1 from dropdown menu:
                  </div>
                  <SearchableDropdown
                    value=""
                    options={schemeOptions}
                    placeholder="Search & select Scheme 1..."
                    searchPlaceholder="Type scheme name (e.g. Solar, PMEGP, KISAN)..."
                    onChange={(selectedVal) => updateSlot(0, selectedVal)}
                    style={{ maxWidth: "100%" }}
                  />

                  {/* Quick Pick Suggestions */}
                  <div style={{ marginTop: 12 }}>
                    <div className="tt" style={{ fontSize: 10.5, marginBottom: 5 }}>OR PICK A POPULAR SCHEME:</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {POPULAR_QUICK_SCHEMES_SLOT1.map(qs => (
                        <button
                          key={qs.id}
                          type="button"
                          className="chip"
                          onClick={() => updateSlot(0, qs.id)}
                          style={{ fontSize: 11, padding: "3px 8px" }}
                        >
                          {qs.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SLOT 2 */}
          <div
            className="panel"
            style={{
              padding: "16px 18px",
              background: picked[1] ? "var(--panel)" : "var(--panel2)",
              border: picked[1] ? "2px solid var(--em)" : "1.5px dashed var(--line2)",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 180,
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--cy)", letterSpacing: ".08em" }}>
                  SLOT 2 (SCHEME B)
                </span>
                {picked[1] && (
                  <button
                    type="button"
                    onClick={() => removeSlot(picked[1].id)}
                    style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                    title="Remove Slot 2"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {picked[1] ? (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--paper)", marginBottom: 4, lineHeight: 1.3 }}>
                    {picked[1].short}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {picked[1].name}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                    <LevelBadge level={picked[1].level} />
                    <span className="badge b-official" style={{ fontSize: 10 }}>
                      {picked[1].maxBenefitL != null ? `Max ₹${picked[1].maxBenefitL}L` : "Scale-based support"}
                    </span>
                  </div>

                  {activeSlotMenu === 1 ? (
                    <div style={{ marginTop: 8 }}>
                      <SearchableDropdown
                        value={picked[1].id}
                        options={schemeOptions}
                        placeholder="Search replacement scheme..."
                        searchPlaceholder="Type to switch scheme..."
                        onChange={(selectedVal) => updateSlot(1, selectedVal)}
                        style={{ maxWidth: "100%" }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn sec"
                        onClick={() => setActiveSlotMenu(1)}
                        style={{ fontSize: 11.5, padding: "5px 10px" }}
                      >
                        🔄 Change Scheme
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => go("intel", picked[1].id)}
                        style={{ fontSize: 11.5, padding: "5px 10px" }}
                      >
                        View Details →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
                    Select Scheme 2 from dropdown menu:
                  </div>
                  <SearchableDropdown
                    value=""
                    options={schemeOptions}
                    placeholder="Search & select Scheme 2..."
                    searchPlaceholder="Type scheme name (e.g. KUSUM, Mudra, PMFBY)..."
                    onChange={(selectedVal) => updateSlot(1, selectedVal)}
                    style={{ maxWidth: "100%" }}
                  />

                  {/* Quick Pick Suggestions */}
                  <div style={{ marginTop: 12 }}>
                    <div className="tt" style={{ fontSize: 10.5, marginBottom: 5 }}>OR PICK A POPULAR SCHEME:</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {POPULAR_QUICK_SCHEMES_SLOT2.map(qs => (
                        <button
                          key={qs.id}
                          type="button"
                          className="chip"
                          onClick={() => updateSlot(1, qs.id)}
                          style={{ fontSize: 11, padding: "3px 8px" }}
                        >
                          {qs.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ADDITIONAL SLOTS (3 & 4) */}
          {picked.slice(2).map((s, extraIdx) => {
            const slotIndex = 2 + extraIdx;
            return (
              <div
                key={s.id}
                className="panel"
                style={{
                  padding: "16px 18px",
                  background: "var(--panel)",
                  border: "2px solid var(--em)",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 180,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--cy)", letterSpacing: ".08em" }}>
                      SLOT {slotIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSlot(s.id)}
                      style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}
                      title={`Remove Slot ${slotIndex + 1}`}
                    >
                      ✕ Remove
                    </button>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--paper)", marginBottom: 4, lineHeight: 1.3 }}>
                    {s.short}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {s.name}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                    <LevelBadge level={s.level} />
                    <span className="badge b-official" style={{ fontSize: 10 }}>
                      {s.maxBenefitL != null ? `Max ₹${s.maxBenefitL}L` : "Scale-based"}
                    </span>
                  </div>

                  {activeSlotMenu === slotIndex ? (
                    <div style={{ marginTop: 8 }}>
                      <SearchableDropdown
                        value={s.id}
                        options={schemeOptions}
                        placeholder="Search replacement..."
                        onChange={(selectedVal) => updateSlot(slotIndex, selectedVal)}
                        style={{ maxWidth: "100%" }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn sec"
                        onClick={() => setActiveSlotMenu(slotIndex)}
                        style={{ fontSize: 11.5, padding: "5px 10px" }}
                      >
                        🔄 Change Scheme
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => go("intel", s.id)}
                        style={{ fontSize: 11.5, padding: "5px 10px" }}
                      >
                        View Details →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* + ADD ANOTHER SCHEME CARD */}
          {picked.length >= 2 && picked.length < 4 && (
            <div
              className="panel"
              style={{
                padding: "16px 18px",
                background: "rgba(123, 155, 125, 0.06)",
                border: "2px dashed var(--line2)",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 180,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--paper)", marginBottom: 4 }}>
                + Add Scheme #{picked.length + 1}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                Expand your side-by-side comparison table with an additional scheme:
              </div>
              <SearchableDropdown
                value=""
                options={schemeOptions.filter(opt => !compare.includes(opt.value))}
                placeholder={`Select Scheme #${picked.length + 1} from menu...`}
                searchPlaceholder="Search & add scheme column..."
                onChange={(selectedVal) => updateSlot(picked.length, selectedVal)}
                style={{ maxWidth: "100%" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Comparison Table or Zero State */}
      {picked.length < 2 ? (
        <div
          className="panel"
          style={{
            padding: "44px 24px",
            textAlign: "center",
            background: "var(--panel)",
            border: "1px solid var(--line2)",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
          <h3 className="sec" style={{ fontSize: 20, marginBottom: 8 }}>
            Comparison Table Ready
          </h3>
          <p style={{ color: "var(--muted)", maxWidth: 520, margin: "0 auto 20px", fontSize: 14, lineHeight: 1.5 }}>
            Pick schemes into <b>Slot 1</b> and <b>Slot 2</b> above, or click any of the <b>1-Click Benchmark Comparisons</b> at the top of the page to generate your side-by-side evaluation table instantly.
          </p>
        </div>
      ) : (
        <>
          {/* Table Controls Bar: Attribute Group Menu + Highlight Differences */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 14,
              padding: "10px 16px",
              background: "var(--bg2)",
              borderRadius: 6,
              border: "1px solid var(--line)",
            }}
          >
            {/* Attribute Groups Segmented Menu */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="tt" style={{ marginRight: 4 }}>ATTRIBUTE VIEW:</span>
              {ATTRIBUTE_GROUPS.map(g => (
                <button
                  key={g.id}
                  type="button"
                  className={`chip ${activeGroup === g.id ? "on" : ""}`}
                  onClick={() => setActiveGroup(g.id)}
                  style={{ fontSize: 12, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span>{g.icon}</span>
                  <span>{g.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.8, fontFamily: "var(--mono)" }}>({g.count})</span>
                </button>
              ))}
            </div>

            {/* Toggle Highlight Differences */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  cursor: "pointer",
                  userSelect: "none",
                  fontWeight: 600,
                  color: "var(--paper)",
                  background: highlightDiff ? "rgba(123, 155, 125, 0.15)" : "transparent",
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid var(--line2)",
                }}
              >
                <input
                  type="checkbox"
                  checked={highlightDiff}
                  onChange={(e) => setHighlightDiff(e.target.checked)}
                  style={{ cursor: "pointer", accentColor: "var(--em)" }}
                />
                <span>⚡ Highlight Differences</span>
                {highlightDiff && diffCount > 0 && (
                  <span className="badge b-official" style={{ fontSize: 9.5 }}>
                    {diffCount} Differ
                  </span>
                )}
              </label>
              <span style={{ color: "var(--muted2)", fontSize: 11.5 }}>↔ Scroll horizontally to view</span>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="cmp-wrap panel" style={{ padding: 0, marginBottom: 20 }}>
            <table className="cmp">
              <thead>
                <tr>
                  <th style={{ width: 190, minWidth: 170 }}>
                    <div>ATTRIBUTE</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "none", marginTop: 3 }}>
                      {visibleRows.length} attributes listed
                    </div>
                  </th>

                  {picked.map((s, colIdx) => (
                    <th key={s.id} style={{ minWidth: 230, position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            onClick={() => go("intel", s.id)}
                            style={{ cursor: "pointer", color: "var(--paper)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 700 }}
                            title="Click to view full Scheme Intelligence"
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
                              padding: "2px 8px",
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
                                width: 210,
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
                                  setActiveSlotMenu(colIdx);
                                  window.scrollTo({ top: 380, behavior: "smooth" });
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
                    </th>
                  ))}

                  {/* Add Column Button inside the table header */}
                  {picked.length < 4 && (
                    <th style={{ width: 140, minWidth: 120, verticalAlign: "middle", textAlign: "center", background: "rgba(123, 155, 125, 0.05)" }}>
                      <SearchableDropdown
                        value=""
                        options={schemeOptions.filter(opt => !compare.includes(opt.value))}
                        placeholder="+ Add Col"
                        searchPlaceholder="Add scheme column..."
                        onChange={(newId) => updateSlot(picked.length, newId)}
                        style={{ maxWidth: 130 }}
                      />
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
                            <span className="cmp-diff-tag" title="Values differ between selected schemes">
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
                      {picked.length < 4 && <td style={{ background: "rgba(123, 155, 125, 0.03)" }} />}
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

          {/* Action Footer */}
          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
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
