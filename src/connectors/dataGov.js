/* Subsidy360 — data.gov.in (Open Government Data Platform India) connector.
 *
 * Ships DISABLED. The platform issues API keys per registered user and each
 * dataset has its own resource id, so nothing can be hard-coded here honestly.
 * The operator supplies endpoint + key + resource ids in .env; only then does
 * this connector activate. Responses go through the same normaliser as every
 * other source, so an unmapped field becomes "Not reported" rather than a guess.
 */

import { CONNECTOR_CONFIG } from "./config.js";
import { fetchJson } from "./localPack.js";
import { normalizeScheme, validateScheme } from "../data/schema.js";

export const DATA_GOV = {
  id: "data-gov-in",
  label: "data.gov.in",
  attribution: CONNECTOR_CONFIG.dataGov.attribution,
};

export function isEnabled() {
  return CONNECTOR_CONFIG.dataGov.enabled;
}

export async function loadDataGov() {
  const cfg = CONNECTOR_CONFIG.dataGov;
  if (!cfg.enabled) return { id: "data-gov-in", accepted: [], rejected: [], skipped: "not configured" };

  const origin = {
    connector: "data-gov-in",
    sourceType: "open-government-data-platform",
    license: "As published on data.gov.in (see dataset page)",
    fetchedAt: new Date().toISOString().slice(0, 10),
  };
  const accepted = [];
  const rejected = [];
  for (const rid of cfg.resourceIds) {
    const url = `${cfg.endpoint.replace(/\/$/, "")}/${rid}?api-key=${encodeURIComponent(cfg.apiKey)}&format=json`;
    const json = await fetchJson(url);
    for (const r of json.records || json.data || []) {
      const rec = normalizeScheme(r, { ...origin, pack: rid });
      const errors = validateScheme(rec);
      if (rec && !errors.length) accepted.push(rec);
      else rejected.push({ id: r?.id || "(unnamed)", errors });
    }
  }
  return { id: "data-gov-in", accepted, rejected };
}
