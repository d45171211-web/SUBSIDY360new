#!/usr/bin/env node
/* Subsidy360 — catalogue import CLI.
 *
 *   npm run import:myscheme -- --in data/myscheme/export.json
 *   npm run import:state    -- --in data/states/rajasthan.json --state Rajasthan
 *   npm run import:budget   -- --in data/budget/de2025-26.json
 *
 * Reads a raw official export from /data, normalises every record to the
 * canonical schema, writes a pack into /public/data/<source>/ and registers it
 * in the manifest. The frontend needs no change — reload and the records are
 * in the catalogue.
 *
 * DATA RULE: fields the export does not state are written as null and reported
 * in the summary as "Not reported". Nothing is filled in, ever.
 */

import fs from "node:fs";
import path from "node:path";
import { normalizeScheme, validateScheme, REPORTABLE_FIELDS } from "../src/data/schema.js";

const args = process.argv.slice(2);
const arg = (k, d = null) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const has = (k) => args.includes(`--${k}`);

const source = arg("source", "myscheme");
const inPath = arg("in");
const stateName = arg("state");
const label = arg("label");

if (!inPath) {
  console.error("Usage: node scripts/import-pack.mjs --source <myscheme|state|budget> --in <file.json> [--state <State>] [--label <text>]");
  process.exit(1);
}
if (!fs.existsSync(inPath)) {
  console.error(`Input not found: ${inPath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inPath, "utf8"));
const packId = arg("id", `${source}-${path.basename(inPath).replace(/\.json$/i, "")}`);
const outDir = path.join("public", "data", source === "state" ? "states" : source);
const outPath = path.join(outDir, `${packId}.json`);
fs.mkdirSync(outDir, { recursive: true });

if (source === "budget") {
  const pack = {
    meta: {
      pack: packId,
      attribution: arg("attribution", "Union Budget documents, Ministry of Finance"),
      sourceType: "budget-document-conversion",
      license: arg("license", "Not reported"),
      fetchedAt: new Date().toISOString().slice(0, 10),
      notice: "BE / RE / Actual are stored separately and never interconverted. Missing figures are null and render as 'Not reported'.",
    },
    schemes: (raw.schemes || raw.records || []).map((r) => ({
      schemeId: r.schemeId ?? r.id,
      fy: r.fy ?? null,
      be: r.be ?? null,
      re: r.re ?? null,
      actual: r.actual ?? null,
    })).filter((r) => r.schemeId),
    ministries: (raw.ministries || []).map((r) => ({
      ministryKey: r.ministryKey ?? r.key, fy: r.fy ?? null, be: r.be ?? null, re: r.re ?? null, actual: r.actual ?? null,
    })).filter((r) => r.ministryKey),
    trend: raw.trend || [],
    sectorSplit: raw.sectorSplit || [],
  };
  fs.writeFileSync(outPath, JSON.stringify(pack, null, 2));
  register(packId, "budget", source, outPath, label || `Budget pack ${packId}`);
  console.log(`✓ budget pack written: ${outPath} (${pack.schemes.length} scheme rows, ${pack.ministries.length} ministry rows)`);
  process.exit(0);
}

const records = Array.isArray(raw) ? raw : raw.schemes || raw.records || raw.data || [];
const accepted = [];
const rejected = [];
const missingCounts = Object.fromEntries(REPORTABLE_FIELDS.map((f) => [f, 0]));

for (const r of records) {
  const seed = stateName && !r.states ? { ...r, level: "State", states: [stateName] } : r;
  const rec = normalizeScheme(seed, {
    connector: source === "state" ? "state-portals" : source,
    sourceType: source === "state" ? "state-portal-export" : "catalogue-export",
    license: arg("license", "Not reported"),
    pack: packId,
    fetchedAt: new Date().toISOString().slice(0, 10),
  });
  const errors = validateScheme(rec);
  if (rec && !errors.length) {
    accepted.push(rec);
    for (const f of rec.notReported) missingCounts[f]++;
  } else {
    rejected.push({ id: r?.id || r?.name || "(unnamed)", errors: errors.length ? errors : ["failed to normalise"] });
  }
}

const pack = {
  meta: {
    pack: packId,
    attribution: arg("attribution", source === "myscheme" ? "myScheme, Government of India" : "State government scheme portal"),
    sourceType: source === "state" ? "state-portal-export" : "catalogue-export",
    license: arg("license", "Not reported"),
    fetchedAt: new Date().toISOString().slice(0, 10),
    sourceFile: inPath,
    notice: "Normalised by scripts/import-pack.mjs. Fields absent from the source are null and render as 'Not reported'.",
  },
  schemes: accepted,
};
fs.writeFileSync(outPath, JSON.stringify(pack, null, 2));
register(packId, "schemes", source === "state" ? "state-portals" : source, outPath, label || `${source} pack ${packId}`);

console.log(`\n✓ ${outPath}`);
console.log(`  accepted : ${accepted.length}`);
console.log(`  rejected : ${rejected.length}${rejected.length ? " (missing id, name or official source)" : ""}`);
console.log(`  "Not reported" fields across the pack:`);
for (const [f, n] of Object.entries(missingCounts)) if (n) console.log(`    ${f.padEnd(14)} ${n}`);
if (rejected.length && has("verbose")) rejected.slice(0, 20).forEach((r) => console.log(`    ✕ ${r.id}: ${r.errors.join("; ")}`));

function register(id, kind, connector, filePath, lbl) {
  const mPath = path.join("public", "data", "manifest.json");
  const m = JSON.parse(fs.readFileSync(mPath, "utf8"));
  const rel = filePath.replace(/^public[\\/]/, "");
  const entry = { id, kind, connector, label: lbl, path: rel.replace(/\\/g, "/"), enabled: true };
  const i = m.packs.findIndex((p) => p.id === id);
  if (i >= 0) m.packs[i] = entry; else m.packs.push(entry);
  fs.writeFileSync(mPath, JSON.stringify(m, null, 2));
  console.log(`  manifest : registered "${id}"`);
}
