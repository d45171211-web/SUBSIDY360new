import { APPLICANTS, SECTORS, INVEST_BANDS } from "../data/constants.js";
import { fmtL, appLabel } from "./format.js";

/* Informational match only — never an official eligibility decision. */
export function matchScheme(s, p) {
  // returns { checks:[{k,state:'ok'|'warn'|'na',note}], score, applicable }
  const checks = [];
  let pass = 0, total = 0;
  // Location
  if (p.state) {
    total++;
    const ok = s.states === "all" || s.states.includes(p.state);
    if (ok) pass++;
    checks.push({ k: "Location", state: ok ? "ok" : "warn", note: ok ? (s.states === "all" ? "Available nationally" : p.state) : `Limited to ${Array.isArray(s.states) ? s.states.join(", ") : "specific states"}` });
  } else checks.push({ k: "Location", state: "na", note: "Not reported" });
  // Applicant
  if (p.applicant) {
    total++;
    const ok = s.applicants.includes(p.applicant);
    if (ok) pass++;
    checks.push({ k: "Applicant", state: ok ? "ok" : "warn", note: ok ? appLabel(p.applicant) : `Targets ${s.applicants.map(appLabel).join(", ")}` });
  } else checks.push({ k: "Applicant", state: "na", note: "Not reported" });
  // Sector
  if (p.sector) {
    total++;
    const ok = s.sectors.includes(p.sector);
    if (ok) pass++;
    checks.push({ k: "Sector", state: ok ? "ok" : "warn", note: ok ? SECTORS.find(x => x.id === p.sector)?.label : s.sectorLabel });
  } else checks.push({ k: "Sector", state: "na", note: "Not reported" });
  // Income
  if (p.income && p.income !== "na") {
    if (s.incomeCapL == null) { checks.push({ k: "Income", state: "ok", note: "No income ceiling reported" }); total++; pass++; }
  } else checks.push({ k: "Income", state: "na", note: "Not reported" });
  // Investment
  if (p.invest != null) {
    total++;
    const v = INVEST_BANDS.find(b => b.id === p.invest)?.v ?? 0;
    const ok = (s.investMaxL === 0 && v === 0) || (s.investMaxL > 0 && v >= s.investMinL && v <= s.investMaxL) || (s.investMaxL > 0 && v === 0 && s.investMinL === 0);
    if (ok) pass++;
    checks.push({ k: "Investment", state: ok ? "ok" : "warn", note: ok ? "Within eligible range" : `Scheme range ${fmtL(s.investMinL)} – ${fmtL(s.investMaxL)}` });
  } else checks.push({ k: "Investment", state: "na", note: "Not reported" });
  // Loan
  if (p.loan != null) {
    total++;
    const ok = !s.loanRequired || p.loan === true;
    if (ok) pass++;
    checks.push({ k: "Loan", state: ok ? "ok" : "warn", note: s.loanRequired ? (ok ? "Bank loan planned — required by scheme" : "Scheme requires a bank loan") : "No loan required" });
  } else checks.push({ k: "Loan", state: "na", note: "Not reported" });
  // Business stage
  if (p.stage) {
    total++;
    const ok = !s.newBusinessOnly || p.stage === "new";
    if (ok) pass++;
    checks.push({ k: "Stage", state: ok ? "ok" : "warn", note: s.newBusinessOnly ? (ok ? "New unit — eligible" : "New units only") : "New & existing eligible" });
  } else checks.push({ k: "Stage", state: "na", note: "Not reported" });
  const score = total ? Math.round((pass / total) * 100) : null;
  return { checks, score };
}
