/* Subsidy360 — Union Budget / expenditure connector.
 *
 * Loads BE / RE / Actual packs converted from official budget documents.
 * DATA RULE: BE, RE and Actual are stored in separate fields and never
 * substituted for one another. A missing RE stays null and renders as
 * "Not reported" — an allocation is never restated as sanctioned, released
 * or utilised.
 */

import { fetchJson } from "./localPack.js";

export const BUDGET = { id: "union-budget", label: "Union Budget documents" };

const num = (v) => (v == null || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);

export async function loadBudgetPacks(manifestEntries) {
  const mine = manifestEntries.filter((e) => e.kind === "budget");
  const packs = await Promise.all(mine.map(async (e) => ({ entry: e, json: await fetchJson(e.path) })));

  const bySchemeId = new Map();
  const byMinistry = new Map();
  let trend = [];
  let sectorSplit = [];
  const metas = [];

  for (const { entry, json } of packs) {
    metas.push({ id: entry.id, ...(json.meta || {}) });
    for (const row of json.schemes || []) {
      if (!row.schemeId) continue;
      bySchemeId.set(row.schemeId, { fy: row.fy ?? null, be: num(row.be), re: num(row.re), actual: num(row.actual) });
    }
    for (const row of json.ministries || []) {
      byMinistry.set(row.ministryKey, { fy: row.fy ?? null, be: num(row.be), re: num(row.re), actual: num(row.actual) });
    }
    if (Array.isArray(json.trend) && json.trend.length) {
      trend = json.trend.map((t) => ({ fy: t.fy, be: num(t.be), re: num(t.re), actual: num(t.actual) }));
    }
    if (Array.isArray(json.sectorSplit) && json.sectorSplit.length) {
      sectorSplit = json.sectorSplit.map((s) => ({ name: s.name, v: num(s.v), c: s.c }));
    }
  }
  return { bySchemeId, byMinistry, trend, sectorSplit, metas };
}
