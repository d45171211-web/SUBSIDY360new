/* Subsidy360 — local JSON pack connector.
 *
 * Reads scheme packs that sit in /public/data (served statically). This is the
 * connector that carries the official catalogue export, state portal exports and
 * ministry packs.
 */

import { normalizeScheme, validateScheme } from "../data/schema.js";
import { REQUEST_TIMEOUT_MS } from "./config.js";

const base = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/";

export async function fetchJson(path, { timeout = REQUEST_TIMEOUT_MS } = {}) {
  const root = base.endsWith("/") ? base : `${base}/`;
  const url = /^https?:/.test(path) ? path : root + path.replace(/^\//, "");
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null;
  try {
    const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Load one pack file and normalise it.
 * A pack is `{ meta: {...}, schemes: [...] }` or a bare array.
 */
export async function loadPack(entry) {
  const json = await fetchJson(entry.path);
  const meta = json.meta || {};
  let raw = Array.isArray(json) ? json : json.schemes || json.records || [];
  if (Array.isArray(raw[0])) raw = raw.flat();
  const origin = {
    connector: entry.connector || "local-pack",
    attribution: meta.attribution || entry.label || "Government Scheme Portal",
    sourceType: meta.sourceType || entry.sourceType || "official-portal-export",
    license: meta.license || entry.license || "Not reported",
    pack: entry.id || entry.path,
    fetchedAt: meta.fetchedAt || entry.fetchedAt || null,
  };
  const accepted = [];
  const rejected = [];
  for (const r of raw) {
    const rec = normalizeScheme(r, origin);
    const errors = validateScheme(rec);
    if (rec && errors.length === 0) accepted.push(rec);
    else rejected.push({ id: r?.id || r?.name || "(unnamed)", errors: errors.length ? errors : ["failed to normalise"] });
  }
  return { id: entry.id || entry.path, meta, accepted, rejected, count: raw.length };
}
