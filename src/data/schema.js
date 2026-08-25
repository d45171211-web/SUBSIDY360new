/* Subsidy360 — canonical scheme record schema.
 *
 * Every scheme, whatever its origin (bundled seed, myScheme catalogue export,
 * state portal pack, ministry circular), is normalised into this one shape
 * before it reaches the interface. The frontend only ever sees this shape,
 * which is why the catalogue can grow from 12 records to 4,700+ without a
 * single change to a component.
 *
 * DATA RULE — the normaliser never invents a value. A field that the source
 * does not state becomes `null`, is listed in `notReported`, and renders in the
 * interface as "Not reported".
 */

export const NOT_REPORTED = null;

/** Fields the interface treats as "reportable" — absence is recorded, never filled. */
export const REPORTABLE_FIELDS = [
  "benefit", "benefitType", "maxBenefitL", "investMinL", "investMaxL",
  "incomeCapL", "docs", "process", "restrictions", "allocationCr",
  "verified", "source", "status",
];

export const LEVELS = ["Central", "State"];

const asArray = (v) => (Array.isArray(v) ? v.filter(Boolean) : v == null || v === "" ? [] : [v]);
const asNum = (v) => {
  if (v === 0) return 0;
  if (v == null || v === "" || v === "NA" || v === "N/A") return NOT_REPORTED;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : NOT_REPORTED;
};
const asText = (v) => {
  if (v == null) return NOT_REPORTED;
  const t = String(v).trim();
  return t === "" || /^(na|n\/a|null|undefined|-)$/i.test(t) ? NOT_REPORTED : t;
};
const asBool = (v) => (typeof v === "boolean" ? v : v == null || v === "" ? NOT_REPORTED : /^(y|yes|true|1)$/i.test(String(v)));

export const slug = (s) =>
  String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);

/** Derive a ministry key from the stated department string. No invention — pure derivation. */
export function ministryKeyFrom(dept) {
  const head = String(dept || "").split("·")[0].trim();
  return head ? slug(head) : "unattributed";
}

/**
 * Normalise one raw record into the canonical shape.
 * @param {object} raw    source record (any supported shape)
 * @param {object} origin { connector, sourceType, license, fetchedAt, pack }
 */
export function normalizeScheme(raw, origin = {}) {
  if (!raw || typeof raw !== "object") return null;

  const dept = asText(raw.dept ?? raw.department ?? raw.nodalMinistry ?? raw.ministry);
  const level = LEVELS.includes(raw.level) ? raw.level : raw.schemeType === "state" ? "State" : raw.level ? "Central" : NOT_REPORTED;
  const rawStates = raw.states ?? raw.state ?? raw.applicableStates;
  const states = rawStates === "all" || rawStates === "All India" || (level === "Central" && rawStates == null)
    ? "all"
    : asArray(rawStates);

  const rec = {
    id: asText(raw.id ?? raw.schemeId ?? raw.slug) || slug(raw.short || raw.name || raw.schemeName),
    short: asText(raw.short ?? raw.schemeShortTitle ?? raw.acronym ?? raw.name ?? raw.schemeName),
    name: asText(raw.name ?? raw.schemeName ?? raw.title ?? raw.short),
    dept,
    ministryKey: asText(raw.ministryKey) || ministryKeyFrom(dept),
    level,
    states,
    sectorLabel: asText(raw.sectorLabel ?? raw.sector ?? raw.category),
    sectors: asArray(raw.sectors ?? raw.tags).map((s) => slug(s)),
    applicants: asArray(raw.applicants ?? raw.beneficiaryType ?? raw.targetBeneficiaries).map((s) => slug(s)),
    benefit: asText(raw.benefit ?? raw.benefits ?? raw.briefDescription),
    benefitType: asText(raw.benefitType ?? raw.benefitCategory),
    maxBenefitL: asNum(raw.maxBenefitL ?? raw.maxBenefitLakh),
    maxBenefitNote: asText(raw.maxBenefitNote),
    loanRequired: asBool(raw.loanRequired),
    newBusinessOnly: asBool(raw.newBusinessOnly),
    investMinL: asNum(raw.investMinL),
    investMaxL: asNum(raw.investMaxL),
    incomeCapL: asNum(raw.incomeCapL),
    docs: asArray(raw.docs ?? raw.documentsRequired).map(asText).filter(Boolean),
    process: asArray(raw.process ?? raw.applicationProcess).map(asText).filter(Boolean),
    restrictions: asArray(raw.restrictions ?? raw.exclusions).map(asText).filter(Boolean),
    source: asText(raw.source ?? raw.sourceUrl ?? raw.officialUrl),
    sourceUrl: asText(raw.sourceUrl ?? raw.officialUrl ?? (String(raw.source || "").includes(".") ? raw.source : null)),
    verified: asText(raw.verified ?? raw.lastVerified ?? raw.lastUpdated),
    status: asText(raw.status) || "Verify current cycle",
    allocationCr: raw.allocationCr && typeof raw.allocationCr === "object"
      ? {
          fy: asText(raw.allocationCr.fy),
          be: asNum(raw.allocationCr.be),
          re: asNum(raw.allocationCr.re),
          actual: asNum(raw.allocationCr.actual),
        }
      : NOT_REPORTED,
    popularity: asNum(raw.popularity) ?? 0,
    provenance: {
      connector: origin.connector || "bundled-seed",
      sourceType: origin.sourceType || "official-portal-record",
      license: origin.license || "Not reported",
      pack: origin.pack || null,
      fetchedAt: origin.fetchedAt || null,
    },
  };

  // Backwards-compatible defaults that are structural, not factual.
  if (rec.loanRequired === NOT_REPORTED) rec.loanRequired = false;
  if (rec.newBusinessOnly === NOT_REPORTED) rec.newBusinessOnly = false;
  if (rec.investMinL === NOT_REPORTED) rec.investMinL = 0;
  if (rec.investMaxL === NOT_REPORTED) rec.investMaxL = 0;

  rec.notReported = REPORTABLE_FIELDS.filter((f) => {
    const v = rec[f];
    return v === NOT_REPORTED || (Array.isArray(v) && v.length === 0);
  });

  return rec.id && rec.name ? rec : null;
}

/** Reject records that cannot be trusted into the catalogue. */
export function validateScheme(rec) {
  const errors = [];
  if (!rec) return ["record is empty"];
  if (!rec.id) errors.push("missing id");
  if (!rec.name) errors.push("missing name");
  if (!rec.source) errors.push("missing official source — Subsidy360 does not index unsourced schemes");
  if (rec.level && !LEVELS.includes(rec.level)) errors.push(`level must be Central or State (got ${rec.level})`);
  if (rec.level === "State" && rec.states === "all") errors.push("state scheme without a state list");
  return errors;
}

/** Merge packs, last-writer-wins on id, keeping a note of what was superseded. */
export function mergePacks(packs) {
  const byId = new Map();
  const superseded = [];
  for (const pack of packs) {
    for (const rec of pack) {
      if (byId.has(rec.id)) superseded.push(rec.id);
      byId.set(rec.id, rec);
    }
  }
  return { schemes: [...byId.values()], superseded };
}
