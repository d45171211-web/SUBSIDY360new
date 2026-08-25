/* Subsidy360 — catalogue service.
 *
 * Builds the in-memory scheme catalogue from every enabled connector, then
 * builds the indices the interface needs to stay fast at 4,700+ records:
 * id lookup, state / level / sector / applicant / ministry facets, and a
 * tokenised search index.
 *
 * The interface never imports a dataset directly any more — it asks the
 * catalogue. That is what makes the record count a data question instead of a
 * code question.
 */

import { SEED_SCHEMES } from "./seed/verified-seed.js";
import { normalizeScheme, mergePacks, ministryKeyFrom } from "./schema.js";
import { CONNECTOR_CONFIG } from "../connectors/config.js";
import { fetchJson, loadPack } from "../connectors/localPack.js";
import { loadDataGov } from "../connectors/dataGov.js";
import { loadBudgetPacks } from "../connectors/budget.js";

const seedOrigin = {
  connector: "bundled-seed",
  sourceType: "official-portal-record",
  license: "Public government scheme information",
  pack: "verified-seed",
};

export const EMPTY_CATALOGUE = {
  schemes: [],
  byId: new Map(),
  facets: { states: [], levels: [], sectors: [], applicants: [], ministries: [], benefitTypes: [], statuses: [] },
  ministries: [],
  states: [],
  budget: { bySchemeId: new Map(), byMinistry: new Map(), trend: [], sectorSplit: [], metas: [] },
  sources: [],
  stats: { total: 0, central: 0, state: 0, withSource: 0, allocationCr: 0, notReportedFields: 0 },
  status: "idle",
  problems: [],
};

function buildFacets(schemes, ministryLabels) {
  const count = (arr) => {
    const m = new Map();
    for (const v of arr) if (v != null && v !== "") m.set(v, (m.get(v) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
      .map(([value, n]) => ({ value, n }));
  };
  const stateVals = [];
  for (const s of schemes) if (Array.isArray(s.states)) stateVals.push(...s.states);
  return {
    states: count(stateVals),
    levels: count(schemes.map((s) => s.level)),
    sectors: count(schemes.flatMap((s) => s.sectors)),
    applicants: count(schemes.flatMap((s) => s.applicants)),
    ministries: count(schemes.map((s) => s.ministryKey)).map((f) => ({
      ...f,
      label: ministryLabels.get(f.value) || schemes.find((s) => s.ministryKey === f.value)?.dept?.split("·")[0].trim() || f.value,
    })),
    benefitTypes: count(schemes.map((s) => s.benefitType)),
    statuses: count(schemes.map((s) => s.status)),
  };
}

function buildStats(schemes) {
  let central = 0, withSource = 0, allocationCr = 0, notReportedFields = 0;
  for (const s of schemes) {
    if (s.level === "Central") central++;
    if (s.source) withSource++;
    if (s.allocationCr && s.allocationCr.be != null) allocationCr += s.allocationCr.be;
    notReportedFields += (s.notReported || []).length;
  }
  return { total: schemes.length, central, state: schemes.length - central, withSource, allocationCr, notReportedFields };
}

/** Load everything. Safe by construction: any failing source is reported, never fatal. */
export async function loadCatalogue() {
  const problems = [];
  const sources = [];
  const packs = [];

  // 1. Bundled seed — always present, so the app works with no network at all.
  const seed = SEED_SCHEMES.map((r) => normalizeScheme(r, seedOrigin)).filter(Boolean);
  packs.push(seed);
  sources.push({ id: "bundled-seed", label: "Bundled verified seed", count: seed.length, status: "loaded" });

  // 2. Manifest-driven local packs (myScheme export, state portals, ministry packs).
  let manifest = { packs: [] };
  if (CONNECTOR_CONFIG.localPacks.enabled) {
    try {
      manifest = await fetchJson(CONNECTOR_CONFIG.localPacks.manifest);
    } catch (e) {
      problems.push({ source: "manifest", message: `No pack manifest loaded (${e.message}). Running on the bundled seed only.` });
    }
  }
  const entries = (manifest.packs || []).filter((p) => p.enabled !== false);
  for (const entry of entries.filter((e) => (e.kind || "schemes") === "schemes")) {
    try {
      const pack = await loadPack(entry);
      packs.push(pack.accepted);
      sources.push({
        id: pack.id, label: entry.label || pack.id, count: pack.accepted.length,
        rejected: pack.rejected.length, connector: entry.connector, status: "loaded",
        attribution: pack.meta.attribution || entry.attribution || null,
        fetchedAt: pack.meta.fetchedAt || null,
      });
      if (pack.rejected.length) {
        problems.push({ source: pack.id, message: `${pack.rejected.length} record(s) rejected (missing id, name or official source).` });
      }
    } catch (e) {
      sources.push({ id: entry.id || entry.path, label: entry.label || entry.path, count: 0, status: "failed" });
      problems.push({ source: entry.id || entry.path, message: e.message });
    }
  }

  // 3. Optional synthetic load-test pack — clearly not government data.
  if (CONNECTOR_CONFIG.loadTest.enabled) {
    try {
      const pack = await loadPack({ id: "loadtest", path: CONNECTOR_CONFIG.loadTest.path, connector: "load-test" });
      packs.push(pack.accepted);
      sources.push({ id: "loadtest", label: "SYNTHETIC LOAD TEST — NOT GOVERNMENT DATA", count: pack.accepted.length, status: "loaded" });
    } catch (e) {
      problems.push({ source: "loadtest", message: e.message });
    }
  }

  // 4. Remote open-data connector (off unless the operator configured it).
  try {
    const dg = await loadDataGov();
    if (dg.accepted.length) {
      packs.push(dg.accepted);
      sources.push({ id: "data-gov-in", label: "data.gov.in", count: dg.accepted.length, status: "loaded" });
    }
  } catch (e) {
    problems.push({ source: "data-gov-in", message: e.message });
  }

  const { schemes, superseded } = mergePacks(packs);
  if (superseded.length) {
    problems.push({ source: "merge", message: `${superseded.length} record(s) superseded by a later pack (last pack wins).` });
  }

  // 5. Reference data.
  let ministries = [], states = [];
  try {
    const m = await fetchJson("data/ministries/ministries.json");
    ministries = m.ministries || [];
  } catch { problems.push({ source: "ministries", message: "Ministry reference list unavailable — department names fall back to the value stated on each record." }); }
  try {
    const s = await fetchJson("data/states/states.json");
    states = s.states || [];
  } catch { problems.push({ source: "states", message: "State reference list unavailable — state filter falls back to values found in the catalogue." }); }

  // 6. Budget packs.
  let budget = EMPTY_CATALOGUE.budget;
  try {
    budget = await loadBudgetPacks(entries);
  } catch (e) {
    problems.push({ source: "union-budget", message: e.message });
  }

  const ministryLabels = new Map(ministries.map((m) => [m.key || ministryKeyFrom(m.name), m.name]));
  const byId = new Map(schemes.map((s) => [s.id, s]));

  // 7. Search index — token -> Set(schemeId). Built once, reused per keystroke.
  const index = new Map();
  for (const s of schemes) {
    const hay = `${s.name} ${s.short} ${s.dept} ${s.sectorLabel} ${s.benefit} ${s.benefitType} ${s.level} ${Array.isArray(s.states) ? s.states.join(" ") : "india national central"}`;
    for (const t of hay.toLowerCase().split(/[^a-z0-9]+/)) {
      if (t.length < 3) continue;
      if (!index.has(t)) index.set(t, new Set());
      index.get(t).add(s.id);
    }
  }

  return {
    schemes, byId, index,
    facets: buildFacets(schemes, ministryLabels),
    ministries, states, budget, sources, problems,
    stats: buildStats(schemes),
    status: "ready",
  };
}
