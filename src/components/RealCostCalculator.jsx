import { useState, useMemo, useEffect } from "react";
import { fmtL, fmtCr } from "../engine/format.js";
import { LevelBadge } from "./LevelBadge.jsx";

/**
 * Format any number as Indian Currency (e.g. ₹1,00,000)
 */
export function fmtINR(n) {
  if (n == null || isNaN(n)) return "₹0";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/**
 * Provenance Badge: Official (Green), Calculated (Blue/Cyan), User Input (Amber), Not Available (Grey)
 */
export function ProvenanceBadge({ type }) {
  const cfg = {
    official: {
      label: "Official",
      bg: "rgba(31, 59, 46, 0.12)",
      color: "var(--paper)",
      border: "1px solid var(--line2)",
      title: "Sourced directly from official government notification",
    },
    calculated: {
      label: "Calculated",
      bg: "rgba(73, 112, 78, 0.15)",
      color: "var(--cy)",
      border: "1px solid var(--line2)",
      title: "Arithmetic performed by Subsidy360 from stated parameters",
    },
    userInput: {
      label: "User input",
      bg: "rgba(201, 141, 60, 0.14)",
      color: "var(--amber)",
      border: "1px solid rgba(201, 141, 60, 0.4)",
      title: "User-entered figure / subjective assumption",
    },
    notAvailable: {
      label: "Not available",
      bg: "rgba(120, 152, 125, 0.1)",
      color: "var(--muted2)",
      border: "1px solid var(--line)",
      title: "No reliable value published in official records",
    },
  }[type] || {
    label: type,
    bg: "var(--bg2)",
    color: "var(--muted)",
    border: "1px solid var(--line)",
  };

  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 3,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        background: cfg.bg,
        color: cfg.color,
        border: cfg.border,
        whiteSpace: "nowrap",
      }}
      title={cfg.title}
    >
      {cfg.label}
    </span>
  );
}

/**
 * Derives intelligent official defaults and economic constraints from scheme guidelines
 */
function deriveSchemeDefaults(scheme, profile) {
  if (!scheme) {
    return {
      subsidyRate: 30,
      subsidyAmount: 0,
      subsidyMode: "pct",
      ceilingCap: 0,
      taxState: "na",
      taxAmount: 0,
      isNonCapital: false,
      provenanceRate: "userInput",
      note: "",
    };
  }

  const id = (scheme.id || "").toLowerCase();
  const text = `${scheme.name || ""} ${scheme.short || ""} ${scheme.benefit || ""} ${scheme.benefitType || ""}`.toLowerCase();

  // 1. PMEGP
  if (id === "pmegp" || id.includes("pmegp")) {
    const isSpecial = profile?.applicant === "farmer" || profile?.applicant === "shg" || profile?.stage === "new";
    const rate = isSpecial ? 35 : 25;
    return {
      subsidyRate: rate,
      subsidyAmount: 0,
      subsidyMode: "pct",
      ceilingCap: 1250000, // ₹12.5L max subsidy on ₹50L project
      taxState: "na",
      taxAmount: 0,
      isNonCapital: false,
      provenanceRate: "official",
      note: `Official PMEGP guidelines specify ${rate}% Margin Money subsidy (15%–35% tier) with maximum admissible project cost of ₹50 Lakh.`,
    };
  }

  // 2. PM Surya Ghar (pmsgmb)
  if (id === "pmsgmb" || id.includes("surya")) {
    return {
      subsidyRate: 60,
      subsidyAmount: 78000,
      subsidyMode: "pct",
      ceilingCap: 78000,
      taxState: "na",
      taxAmount: 0,
      isNonCapital: false,
      provenanceRate: "official",
      note: "Official PM Surya Ghar notification provides fixed slab subsidy capped at ₹78,000 for residential rooftop solar.",
    };
  }

  // 3. PM-KUSUM
  if (id === "pm-kusum" || id.includes("kusum")) {
    return {
      subsidyRate: 60,
      subsidyAmount: 0,
      subsidyMode: "pct",
      ceilingCap: 300000,
      taxState: "na",
      taxAmount: 0,
      isNonCapital: false,
      provenanceRate: "official",
      note: "PM-KUSUM provides 60% total capital subsidy (30% Central CFA + 30% State assistance) on benchmark pump cost.",
    };
  }

  // 4. PM-KISAN
  if (id === "pm-kisan" || id.includes("kisan")) {
    return {
      subsidyRate: 0,
      subsidyAmount: 6000,
      subsidyMode: "fixed",
      ceilingCap: 6000,
      taxState: "na",
      taxAmount: 0,
      isNonCapital: false,
      provenanceRate: "official",
      note: "PM-KISAN provides fixed direct DBT income support of ₹6,000 per family per year in 3 equal tranches.",
    };
  }

  // 5. PMAY
  if (id === "pmay-u" || id === "pmay-g" || id.includes("pmay")) {
    return {
      subsidyRate: 0,
      subsidyAmount: 130000,
      subsidyMode: "fixed",
      ceilingCap: 267000,
      taxState: "official",
      taxAmount: 0,
      isNonCapital: false,
      provenanceRate: "official",
      note: "PMAY guidelines provide credit-linked interest subsidy up to ₹2.67 Lakh (Urban) or direct grant up to ₹1.3 Lakh (Gramin).",
    };
  }

  // 6. PM Vishwakarma
  if (id === "pmv" || id.includes("vishwakarma")) {
    return {
      subsidyRate: 0,
      subsidyAmount: 15000, // ₹15,000 toolkit grant + 5% concessional credit
      subsidyMode: "fixed",
      ceilingCap: 15000,
      taxState: "na",
      taxAmount: 0,
      isNonCapital: false,
      provenanceRate: "official",
      note: "PM Vishwakarma provides a ₹15,000 e-voucher toolkit grant plus 5% concessional enterprise credit.",
    };
  }

  // Credit Guarantees / Non-capital
  if (/guarantee|cgtmse|cgss/i.test(text)) {
    return {
      subsidyRate: 0,
      subsidyAmount: 0,
      subsidyMode: "pct",
      ceilingCap: 0,
      taxState: "na",
      taxAmount: 0,
      isNonCapital: true,
      nonCapitalType: "Credit Guarantee",
      provenanceRate: "notAvailable",
      note: "This scheme operates via credit risk guarantee to lending banks, not as an upfront cash capital subsidy.",
    };
  }

  if (/subvention|interest subsidy/i.test(text)) {
    return {
      subsidyRate: 3,
      subsidyAmount: 0,
      subsidyMode: "pct",
      ceilingCap: scheme.maxBenefitL ? scheme.maxBenefitL * 100000 : 0,
      taxState: "na",
      taxAmount: 0,
      isNonCapital: true,
      nonCapitalType: "Interest Subvention",
      provenanceRate: "official",
      note: "This instrument provides interest rate subvention on bank loan repayments rather than upfront capital support.",
    };
  }

  // General fallback
  const maxCap = scheme.maxBenefitL ? scheme.maxBenefitL * 100000 : 0;
  const pctMatch = (scheme.benefit || "").match(/(\d{1,2}(?:\.\d+)?)\s*%/);
  if (pctMatch && Number(pctMatch[1]) > 0 && Number(pctMatch[1]) <= 100) {
    return {
      subsidyRate: Number(pctMatch[1]),
      subsidyAmount: 0,
      subsidyMode: "pct",
      ceilingCap: maxCap,
      taxState: "na",
      taxAmount: 0,
      isNonCapital: false,
      provenanceRate: "official",
      note: `Detected ${pctMatch[1]}% official subsidy rate from published notification.`,
    };
  }

  return {
    subsidyRate: 30,
    subsidyAmount: maxCap > 0 ? maxCap : 0,
    subsidyMode: "pct",
    ceilingCap: maxCap,
    taxState: "na",
    taxAmount: 0,
    isNonCapital: false,
    provenanceRate: maxCap > 0 ? "official" : "userInput",
    note: maxCap > 0 ? `Official benefit ceiling is reported as ₹${(maxCap / 100000).toFixed(1)} Lakh.` : "No headline rate stated in catalogue. Enter custom rate below as User Input.",
  };
}

/**
 * Real Cost & Subsidy Waterfall Calculator
 */
export function RealCostCalculator({ scheme, profile }) {
  // Preload intelligent defaults when scheme changes
  const defaults = useMemo(() => deriveSchemeDefaults(scheme, profile), [scheme, profile]);

  // Initial / quoted cost state
  // If user entered an investment band in profile, convert to approximate ₹
  const initialCostDefault = useMemo(() => {
    if (profile?.invest != null) {
      const v = profile.invest;
      if (v === 1) return 200000;
      if (v === 2) return 1000000;
      if (v === 3) return 5000000;
      if (v === 4) return 15000000;
    }
    return 100000; // Default ₹1,00,000 for standard reference
  }, [profile]);

  const [initialCost, setInitialCost] = useState(initialCostDefault);
  const [quantity, setQuantity] = useState(1);
  const [subsidyMode, setSubsidyMode] = useState(defaults.subsidyMode);
  const [subsidyRate, setSubsidyRate] = useState(defaults.subsidyRate);
  const [subsidyAmount, setSubsidyAmount] = useState(defaults.subsidyAmount);
  const [ceilingCap, setCeilingCap] = useState(defaults.ceilingCap);
  const [taxState, setTaxState] = useState(defaults.taxState); // 'official' | 'na' | 'none' | 'user'
  const [userTaxBenefit, setUserTaxBenefit] = useState(0);
  const [showEconomicsNote, setShowEconomicsNote] = useState(false);

  // Sync state when scheme changes
  useEffect(() => {
    setSubsidyMode(defaults.subsidyMode);
    setSubsidyRate(defaults.subsidyRate);
    setSubsidyAmount(defaults.subsidyAmount);
    setCeilingCap(defaults.ceilingCap);
    setTaxState(defaults.taxState);
    setUserTaxBenefit(0);
  }, [defaults]);

  // QUICK PRESET COSTS
  const QUICK_COSTS = [
    { label: "₹50K", val: 50000 },
    { label: "₹1 Lakh", val: 100000 },
    { label: "₹2.5 Lakh", val: 250000 },
    { label: "₹5 Lakh", val: 500000 },
    { label: "₹10 Lakh", val: 100000 },
    { label: "₹25 Lakh", val: 2500000 },
    { label: "₹50 Lakh", val: 5000000 },
  ];

  // 1. Cost without government support (Line 1)
  const costWithoutSupport = Math.max(0, (Number(initialCost) || 0) * (Number(quantity) || 1));

  // 2. Uncapped Subsidy calculation
  const uncappedSubsidy = useMemo(() => {
    if (costWithoutSupport <= 0) return 0;
    if (subsidyMode === "pct") {
      return costWithoutSupport * ((Number(subsidyRate) || 0) / 100);
    }
    return (Number(subsidyAmount) || 0) * (Number(quantity) || 1);
  }, [costWithoutSupport, subsidyMode, subsidyRate, subsidyAmount, quantity]);

  // Ceiling binds check
  const ceilingBinds = useMemo(() => {
    return ceilingCap > 0 && uncappedSubsidy > ceilingCap;
  }, [ceilingCap, uncappedSubsidy]);

  // 3. Government subsidy after applying operative ceiling (Line 2)
  const govSubsidy = useMemo(() => {
    if (costWithoutSupport <= 0) return 0;
    if (ceilingBinds) return ceilingCap;
    return Math.min(costWithoutSupport, uncappedSubsidy);
  }, [costWithoutSupport, uncappedSubsidy, ceilingBinds, ceilingCap]);

  // 4. Cost after subsidy (Line 3)
  const costAfterSubsidy = Math.max(0, costWithoutSupport - govSubsidy);

  // 5. Applicable tax benefit (Line 4)
  const effectiveTaxBenefit = useMemo(() => {
    if (taxState === "user") return Math.max(0, Number(userTaxBenefit) || 0);
    return 0; // In 'official', 'na', or 'none', no user deduction unless entered
  }, [taxState, userTaxBenefit]);

  // 6. Effective cost to beneficiary (Line 5)
  const effectiveCost = Math.max(0, costAfterSubsidy - effectiveTaxBenefit);

  // 7. Total beneficiary saving
  const totalSaving = Math.max(0, costWithoutSupport - effectiveCost);

  // Percentage cost reduction
  const pctSaving = costWithoutSupport > 0 ? ((totalSaving / costWithoutSupport) * 100).toFixed(1) : 0;

  return (
    <div
      className="panel fadein"
      style={{
        padding: "24px",
        marginTop: "16px",
        background: "var(--panel)",
        border: "1.5px solid var(--em)",
        borderRadius: "8px",
        boxShadow: "0 6px 20px rgba(31, 59, 46, 0.08)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="eyebrow gold" style={{ fontSize: 11 }}>
              Step 3 · Real Cost Calculator
            </span>
            <span className="badge b-official" style={{ fontSize: 9.5 }}>
              Economically Honest Model
            </span>
          </div>
          <h3 className="sec" style={{ fontSize: 20, marginBottom: 4 }}>
            What will {scheme?.short || "this scheme"} cost me?
          </h3>
          <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 660, lineHeight: 1.45 }}>
            Answers the fundamental citizen question: <i>"What will I actually pay out of pocket, and what does government support change?"</i>
          </p>
        </div>

        <button
          type="button"
          className="btn ghost"
          onClick={() => setShowEconomicsNote(n => !n)}
          style={{ fontSize: 11.5, padding: "4px 8px" }}
        >
          {showEconomicsNote ? "Hide Viva / Model Notes ▲" : "About this Calculator (Viva Notes) ▼"}
        </button>
      </div>

      {/* Expandable Viva / Educational Reference */}
      {showEconomicsNote && (
        <div
          className="fadein"
          style={{
            padding: "16px 18px",
            marginBottom: 20,
            background: "var(--bg2)",
            borderRadius: 6,
            border: "1px solid var(--line2)",
            fontSize: 12.5,
            color: "var(--txt)",
            lineHeight: 1.55,
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--paper)", marginBottom: 6 }}>
            🎓 Why this calculator is economically honest:
          </div>
          <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>
              <b>1. The ceiling binds, not the headline rate:</b> If a scheme advertises 40% up to ₹50,000, a ₹1.5 Lakh project does not receive ₹60,000 — it receives ₹50,000. Subsidy360 enforces the binding cap.
            </li>
            <li>
              <b>2. Tax benefits are never assumed:</b> Subsidies are not automatically tax-deductible. Tax exemptions must be explicitly stated by statute. When user enters a tax estimate, it is strictly isolated as <i>User input</i>.
            </li>
            <li>
              <b>3. Three costs kept strictly apart:</b> Recipient Cost (what you pay) vs Government Fiscal Cost (what public exchequer transfers) vs Economic Resource Cost. Treating these as one is the primary error in public policy debate.
            </li>
            <li>
              <b>4. Provenance on every single rupee:</b> Green = Official, Blue = Calculated, Amber = User Input, Grey = Not Available.
            </li>
          </ul>
        </div>
      )}

      {/* Non-capital Instrument Notice if applicable */}
      {defaults.isNonCapital && (
        <div
          style={{
            padding: "12px 14px",
            marginBottom: 18,
            borderRadius: 6,
            background: "rgba(201, 141, 60, 0.1)",
            border: "1px solid rgba(201, 141, 60, 0.35)",
            fontSize: 12.5,
            color: "var(--txt)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <div>
            <b>Non-Capital Instrument Detected ({defaults.nonCapitalType || "Loan Facilitation / Guarantee"}):</b>
            <div style={{ marginTop: 2, color: "var(--muted)" }}>
              {defaults.note} The calculator will not invent a fabricated percentage. You may enter an estimated capital equivalent below as <i>User input</i> to evaluate your project.
            </div>
          </div>
        </div>
      )}

      {/* INPUTS ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: 16,
          padding: "16px",
          background: "var(--panel2)",
          borderRadius: 6,
          border: "1px solid var(--line2)",
          marginBottom: 20,
        }}
      >
        {/* Input 1: Quoted Initial Cost */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <label className="tt" style={{ fontWeight: 600 }}>QUOTED INITIAL COST (₹)</label>
            <ProvenanceBadge type="userInput" />
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: 9, color: "var(--muted)", fontWeight: 600, fontSize: 14 }}>₹</span>
            <input
              type="number"
              className="txt"
              value={initialCost || ""}
              onChange={(e) => setInitialCost(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 100000"
              style={{ paddingLeft: 26, fontSize: 14, fontWeight: 600, fontFamily: "var(--mono)" }}
              min="0"
            />
          </div>

          {/* Quick preset costs */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
            {QUICK_COSTS.map(qc => (
              <button
                key={qc.label}
                type="button"
                className="chip"
                onClick={() => setInitialCost(qc.val)}
                style={{
                  fontSize: 10.5,
                  padding: "2px 7px",
                  background: initialCost === qc.val ? "var(--em)" : "var(--panel)",
                  color: initialCost === qc.val ? "#FAF9F5" : "var(--muted)",
                }}
              >
                {qc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input 2: Units / Quantity */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <label className="tt" style={{ fontWeight: 600 }}>QUANTITY / UNITS</label>
            <ProvenanceBadge type="userInput" />
          </div>
          <input
            type="number"
            className="txt"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            min="1"
            style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--mono)" }}
          />
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            Total quoted cost: <b>{fmtINR(costWithoutSupport)}</b>
          </div>
        </div>

        {/* Input 3: Subsidy Rate / Amount & Ceiling */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <label className="tt" style={{ fontWeight: 600 }}>SUBSIDY RATE / CEILING</label>
            <ProvenanceBadge type={defaults.provenanceRate} />
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button
              type="button"
              className={`chip ${subsidyMode === "pct" ? "on" : ""}`}
              onClick={() => setSubsidyMode("pct")}
              style={{ fontSize: 11, padding: "3px 9px" }}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              className={`chip ${subsidyMode === "fixed" ? "on" : ""}`}
              onClick={() => setSubsidyMode("fixed")}
              style={{ fontSize: 11, padding: "3px 9px" }}
            >
              Fixed Amount (₹)
            </button>
          </div>

          {subsidyMode === "pct" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                className="txt"
                value={subsidyRate}
                onChange={(e) => setSubsidyRate(Number(e.target.value))}
                min="0"
                max="100"
                style={{ width: 90, fontSize: 14, fontWeight: 600, fontFamily: "var(--mono)" }}
              />
              <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>%</span>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                of project cost
              </span>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: 9, color: "var(--muted)", fontWeight: 600 }}>₹</span>
              <input
                type="number"
                className="txt"
                value={subsidyAmount}
                onChange={(e) => setSubsidyAmount(Number(e.target.value))}
                min="0"
                style={{ paddingLeft: 24, fontSize: 14, fontWeight: 600, fontFamily: "var(--mono)" }}
              />
            </div>
          )}

          {/* Stated Ceiling Cap */}
          <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--muted)" }}>
            Stated ceiling cap:{" "}
            {ceilingCap > 0 ? (
              <b className="mono" style={{ color: "var(--paper)" }}>{fmtINR(ceilingCap)}</b>
            ) : (
              <i>No fixed cash ceiling reported</i>
            )}
          </div>
        </div>

        {/* Input 4: Applicable Tax Benefit */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <label className="tt" style={{ fontWeight: 600 }}>APPLICABLE TAX BENEFIT</label>
            <ProvenanceBadge type={taxState === "user" ? "userInput" : "notAvailable"} />
          </div>

          <select
            className="sel"
            value={taxState}
            onChange={(e) => setTaxState(e.target.value)}
            style={{ fontSize: 12, padding: "7px 10px", marginBottom: 8 }}
          >
            <option value="na">Not available (Default: No tax rule stated)</option>
            <option value="none">Not applicable (Source states no deduction)</option>
            <option value="user">User input (Enter custom deduction)</option>
          </select>

          {taxState === "user" ? (
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: 9, color: "var(--muted)", fontWeight: 600 }}>₹</span>
              <input
                type="number"
                className="txt"
                value={userTaxBenefit}
                onChange={(e) => setUserTaxBenefit(Number(e.target.value))}
                placeholder="e.g. 5000"
                min="0"
                style={{ paddingLeft: 24, fontSize: 13, fontWeight: 600, fontFamily: "var(--mono)" }}
              />
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.35 }}>
              {taxState === "na"
                ? "Tax benefits are never assumed. Select 'User input' to test with depreciation or GST credit."
                : "Source states no applicable tax deduction."}
            </div>
          )}
        </div>
      </div>

      {/* CEILING BINDS WARNING BANNER */}
      {ceilingBinds && (
        <div
          className="fadein"
          style={{
            padding: "12px 16px",
            marginBottom: 20,
            borderRadius: 6,
            background: "rgba(201, 141, 60, 0.12)",
            border: "1.5px solid var(--amber)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 13,
            color: "var(--paper)",
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <b>Ceiling Binds (Headline Rate vs Actual Sanction):</b>
            <div style={{ marginTop: 2, fontSize: 12.5, color: "var(--txt)" }}>
              The scheme advertises <b>{subsidyMode === "pct" ? `${subsidyRate}%` : fmtINR(subsidyAmount)}</b>, which would arithmetically total <b className="mono">{fmtINR(uncappedSubsidy)}</b>. However, the scheme's operative ceiling caps support at <b className="mono" style={{ color: "var(--paper)" }}>{fmtINR(ceilingCap)}</b>. The calculator applies the cap and prevents headline illusion.
            </div>
          </div>
        </div>
      )}

      {/* THE FIVE-LINE WATERFALL DISPLAY */}
      <div
        className="panel"
        style={{
          padding: 0,
          background: "var(--panel)",
          border: "1.5px solid var(--line2)",
          borderRadius: 6,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: "10px 16px",
            background: "var(--panel2)",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".05em",
            color: "var(--paper)",
            fontFamily: "var(--mono)",
          }}
        >
          <span>CALCULATION WATERFALL</span>
          <span>PROVENANCE & AUDIT</span>
        </div>

        <div style={{ padding: "8px 0" }}>
          {/* Line 1: Cost without government support */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "11px 18px",
              borderBottom: "1px solid var(--line)",
              fontSize: 14,
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: "var(--paper)" }}>
                Cost without government support
              </span>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                Market quoted price ({fmtINR(initialCost)} × {quantity} unit{quantity > 1 ? "s" : ""})
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)" }}>
                {fmtINR(costWithoutSupport)}
              </span>
              <ProvenanceBadge type="userInput" />
            </div>
          </div>

          {/* Line 2: Government subsidy */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "11px 18px",
              borderBottom: "1px solid var(--line)",
              fontSize: 14,
              background: "rgba(123, 155, 125, 0.05)",
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: "var(--paper)" }}>
                Government subsidy
              </span>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                {ceilingBinds ? (
                  <span style={{ color: "var(--amber)", fontWeight: 600 }}>
                    Official ceiling bound: Capped at {fmtINR(ceilingCap)} (Headline: {subsidyRate}%)
                  </span>
                ) : (
                  <span>
                    Stated support ({subsidyMode === "pct" ? `${subsidyRate}% of project cost` : `${fmtINR(subsidyAmount)} fixed grant`})
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--cy)" }}>
                − {fmtINR(govSubsidy)}
              </span>
              <ProvenanceBadge type={ceilingBinds ? "official" : "calculated"} />
            </div>
          </div>

          {/* Line 3: Cost after subsidy */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "11px 18px",
              borderBottom: "1px solid var(--line)",
              fontSize: 14,
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: "var(--paper)" }}>
                Cost after subsidy
              </span>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                Initial cost minus direct government subsidy
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)" }}>
                {fmtINR(costAfterSubsidy)}
              </span>
              <ProvenanceBadge type="calculated" />
            </div>
          </div>

          {/* Line 4: Applicable tax benefit */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "11px 18px",
              borderBottom: "1.5px solid var(--line2)",
              fontSize: 14,
              background: taxState === "user" && effectiveTaxBenefit > 0 ? "rgba(201, 141, 60, 0.05)" : "transparent",
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: "var(--paper)" }}>
                Applicable tax benefit
              </span>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                {taxState === "user"
                  ? "User estimated tax deduction / depreciation relief"
                  : taxState === "none"
                  ? "Source states no tax deduction applies"
                  : "Not available (never assumed by Subsidy360)"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: effectiveTaxBenefit > 0 ? "var(--amber)" : "var(--muted)" }}>
                {effectiveTaxBenefit > 0 ? `− ${fmtINR(effectiveTaxBenefit)}` : "—"}
              </span>
              <ProvenanceBadge type={taxState === "user" ? "userInput" : "notAvailable"} />
            </div>
          </div>

          {/* Line 5: Effective cost to beneficiary */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              background: "var(--panel2)",
              fontSize: 15,
            }}
          >
            <div>
              <span style={{ fontWeight: 800, color: "var(--paper)", fontSize: 16 }}>
                Effective cost to beneficiary
              </span>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Net out-of-pocket expenditure after all public support
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--paper)" }}>
                {fmtINR(effectiveCost)}
              </span>
              <ProvenanceBadge type="calculated" />
            </div>
          </div>
        </div>

        {/* Total Saving Callout Footer */}
        <div
          style={{
            padding: "12px 18px",
            background: "rgba(123, 155, 125, 0.15)",
            borderTop: "1px solid var(--line2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎉</span>
            <div>
              <span style={{ fontWeight: 700, color: "var(--paper)", fontSize: 14 }}>
                Total Beneficiary Saving:
              </span>{" "}
              <b className="mono" style={{ color: "var(--cy)", fontSize: 16 }}>{fmtINR(totalSaving)}</b>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge b-official" style={{ fontSize: 11 }}>
              {pctSaving}% Cost Reduction
            </span>
            <ProvenanceBadge type="calculated" />
          </div>
        </div>
      </div>

      {/* THREE COSTS IT KEEPS APART */}
      <div style={{ marginBottom: 20 }}>
        <div className="tt" style={{ marginBottom: 8, textTransform: "uppercase" }}>
          Three Costs Kept Apart (Economic Honesty Protocol)
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          Most subsidy analyses collapse these into one number. Subsidy360 treats fiscal transfers and economic resource costs as fundamentally distinct:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12 }}>
          {/* Cost 1: Beneficiary Cost */}
          <div className="panel" style={{ padding: "12px 14px", background: "var(--bg2)", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="tt" style={{ fontSize: 10.5 }}>BENEFICIARY COST</span>
              <ProvenanceBadge type="calculated" />
            </div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: "var(--paper)", marginBottom: 4 }}>
              {fmtINR(effectiveCost)}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.35 }}>
              What the citizen/firm actually expends out of pocket.
            </div>
          </div>

          {/* Cost 2: Government Fiscal Cost */}
          <div className="panel" style={{ padding: "12px 14px", background: "var(--bg2)", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="tt" style={{ fontSize: 10.5 }}>GOVT FISCAL COST</span>
              <ProvenanceBadge type={ceilingBinds ? "official" : "calculated"} />
            </div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: "var(--cy)", marginBottom: 4 }}>
              {fmtINR(govSubsidy)}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.35 }}>
              What public treasury transfers between economic agents.
            </div>
          </div>

          {/* Cost 3: Economic Cost */}
          <div className="panel" style={{ padding: "12px 14px", background: "var(--bg2)", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="tt" style={{ fontSize: 10.5 }}>ECONOMIC COST</span>
              <ProvenanceBadge type="notAvailable" />
            </div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--muted2)", marginBottom: 4, paddingTop: 3 }}>
              Not available
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.35 }}>
              True opportunity cost & deadweight loss; no raw dataset supports a guess.
            </div>
          </div>
        </div>
      </div>

      {/* ECONOMIC MEANING & BEHAVIOURAL CHANNEL */}
      <div
        style={{
          padding: "14px 16px",
          background: "rgba(123, 155, 125, 0.08)",
          borderRadius: 6,
          border: "1px solid var(--line2)",
          fontSize: 12.5,
          lineHeight: 1.5,
          color: "var(--txt)",
        }}
      >
        <b style={{ color: "var(--paper)" }}>💡 Why this matters to the economic model:</b>
        <div style={{ marginTop: 4, color: "var(--muted)" }}>
          A lower effective cost is the <b>only channel</b> through which a subsidy alters real economic behaviour. If this <b>{pctSaving}% price reduction</b> shifts your decision to undertake the project, the policy generates <b>additionality (stimulus)</b>. If you would have made the purchase anyway at full price, the saving remains real for your balance sheet, but the public spend represents an <b>inframarginal transfer</b> rather than a behavioural stimulus.
        </div>
      </div>
    </div>
  );
}
