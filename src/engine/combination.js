/* Subsidy360 — Subsidy Combination Engine ruleset.
   Pairs not listed resolve to "Compatibility not established". */

export const COMBO_RULES = {
  "pmegp|pmfme": { status: "no", label: "Not compatible", reason: "Both provide capital/margin-money subsidy for the same project cost; PMEGP guidelines exclude units already assisted under another Government subsidy for the same project." },
  "mh-cmegp|pmegp": { status: "no", label: "Not compatible", reason: "CMEGP Maharashtra explicitly excludes projects assisted under PMEGP — both are margin-money schemes for the same new unit." },
  "cgtmse|pmegp": { status: "cond", label: "Conditional", reason: "A PMEGP-linked bank loan may be covered under CGTMSE guarantee subject to lender participation and fee rules — one is a subsidy, the other a guarantee, so they address different needs." },
  "cgtmse|pmfme": { status: "cond", label: "Conditional", reason: "PMFME loans may carry CGTMSE cover where the lending bank obtains it; the subsidy and the guarantee operate on different layers of the same loan." },
  "aif|pmfme": { status: "cond", label: "Conditional", reason: "AIF guidelines allow convergence with other central schemes for eligible infrastructure, subject to overall benefit caps — component-level verification required." },
  "kusum|suryaghar": { status: "no", label: "Not established", reason: "One targets farm pumps, the other residential rooftops — no verified convergence rule for the same installation." },
  "guj-kisan|pmfby": { status: "cond", label: "Conditional", reason: "State relief and crop insurance have historically co-existed, but state participation models change season to season — verify the operative notification." },
};

export function checkCombination(a, b) {
  if (!a || !b || a === b) return null;
  const key = [a, b].sort().join("|");
  return COMBO_RULES[key] || {
    status: "unk",
    label: "Compatibility not established",
    reason: "No verified combination rule exists in the ruleset for this pair. Absence of a rule is not permission — check the operative guidelines of both schemes or the administering departments.",
  };
}
