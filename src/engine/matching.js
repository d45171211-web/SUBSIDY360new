import { APPLICANTS, SECTORS, INVEST_BANDS } from "../data/constants.js";
import { fmtL, appLabel } from "./format.js";
import { normalizeStateName } from "../data/indiaLocations.js";

function normKey(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

/* Informational match only — never an official eligibility decision. */
export function matchScheme(s, p) {
  // returns { checks:[{k,state:'ok'|'warn'|'na',note}], score, applicable }
  const checks = [];
  let pass = 0, total = 0;

  // Location (State & District)
  if (p.state) {
    total++;
    const pNorm = normKey(normalizeStateName(p.state));
    const isCentral = s.level === "Central" || s.states === "all";
    const stateMatches = isCentral || (Array.isArray(s.states) && s.states.some(st => normKey(st) === pNorm || st === "all"));

    let districtMatches = true;
    let distNote = "";
    if (p.district) {
      // Check if scheme has specific district mentions
      const schemeText = `${s.name || ""} ${s.short || ""} ${s.description || ""} ${s.eligibility || ""}`.toLowerCase();
      const dNorm = p.district.toLowerCase();
      if (schemeText.includes(dNorm)) {
        distNote = ` · Targeted in ${p.district}`;
      }
    }

    const ok = stateMatches && districtMatches;
    if (ok) pass++;

    const note = ok
      ? (isCentral ? "Available nationally across India" : `${p.state}${p.district ? ` (${p.district})` : ""}${distNote}`)
      : `Limited to ${Array.isArray(s.states) ? s.states.join(", ") : "specific states"}`;

    checks.push({ k: "Location", state: ok ? "ok" : "warn", note });
  } else {
    checks.push({ k: "Location", state: "na", note: "Not reported" });
  }

  // Applicant
  if (p.applicant) {
    total++;
    const ok = Array.isArray(s.applicants) && (
      s.applicants.includes(p.applicant) ||
      (p.applicant === "household" && (s.applicants.includes("individual") || s.applicants.includes("citizen") || s.applicants.includes("household")))
    );
    if (ok) pass++;
    checks.push({
      k: "Applicant",
      state: ok ? "ok" : "warn",
      note: ok ? appLabel(p.applicant) : `Targets ${Array.isArray(s.applicants) ? s.applicants.map(appLabel).join(", ") : "specific applicants"}`
    });
  } else {
    checks.push({ k: "Applicant", state: "na", note: "Not reported" });
  }

  // Support Category
  if (p.sector) {
    total++;
    const catObj = SECTORS.find(x => x.id === p.sector);
    const ok = Array.isArray(s.sectors) && (
      s.sectors.includes(p.sector) ||
      s.sectors.length === 0
    );
    if (ok) pass++;
    checks.push({
      k: "Category",
      state: ok ? "ok" : "warn",
      note: ok ? (catObj?.label || s.sectorLabel || "Eligible") : (s.sectorLabel || "Other category")
    });
  } else {
    checks.push({ k: "Category", state: "na", note: "Not reported" });
  }

  // Income
  if (p.income && p.income !== "na") {
    total++;
    let ok = true;
    let note = "No income ceiling reported";

    if (s.incomeCapL != null && s.incomeCapL > 0) {
      // Map user income band to estimated upper value in Lakhs
      const bandUpper = p.income === "u3" ? 3 : p.income === "u8" ? 8 : p.income === "u18" ? 18 : 999;
      ok = bandUpper <= s.incomeCapL;
      note = ok
        ? `Income within scheme ceiling (₹${s.incomeCapL} lakh)`
        : `Exceeds reported ceiling of ₹${s.incomeCapL} lakh / yr`;
    }
    if (ok) pass++;
    checks.push({ k: "Income", state: ok ? "ok" : "warn", note });
  } else {
    checks.push({ k: "Income", state: "na", note: "Not reported" });
  }

  // Investment
  if (p.invest != null) {
    total++;
    const v = INVEST_BANDS.find(b => b.id === p.invest)?.v ?? 0;
    let ok = false;
    let note = "";

    if (!s.investMaxL && !s.investMinL) {
      // Scheme has no investment limits reported — open to all project sizes
      ok = true;
      note = "No investment limit reported (open)";
    } else if (s.investMaxL > 0) {
      const min = s.investMinL || 0;
      const max = s.investMaxL;
      ok = (v >= min && v <= max) || (v === 0 && min === 0);
      note = ok ? "Within eligible investment range" : `Scheme range ${fmtL(min)} – ${fmtL(max)}`;
    } else {
      ok = true;
      note = "Eligible";
    }

    if (ok) pass++;
    checks.push({ k: "Investment", state: ok ? "ok" : "warn", note });
  } else {
    checks.push({ k: "Investment", state: "na", note: "Not reported" });
  }

  // Loan
  if (p.loan != null) {
    total++;
    const ok = !s.loanRequired || p.loan === true;
    if (ok) pass++;
    checks.push({
      k: "Loan",
      state: ok ? "ok" : "warn",
      note: s.loanRequired
        ? (ok ? "Bank loan planned — required by scheme" : "Scheme requires a bank loan")
        : "No loan required"
    });
  } else {
    checks.push({ k: "Loan", state: "na", note: "Not reported" });
  }

  // Business stage
  if (p.stage) {
    total++;
    const ok = !s.newBusinessOnly || p.stage === "new";
    if (ok) pass++;
    checks.push({
      k: "Stage",
      state: ok ? "ok" : "warn",
      note: s.newBusinessOnly
        ? (ok ? "New unit — eligible" : "New units only")
        : "New & existing eligible"
    });
  } else {
    checks.push({ k: "Stage", state: "na", note: "Not reported" });
  }

  const score = total ? Math.round((pass / total) * 100) : null;
  return { checks, score };
}
