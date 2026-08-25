#!/usr/bin/env node
/* Subsidy360 — offline catalogue audit.
 * Validates every pack in the manifest plus the bundled seed, and reports
 * exactly which fields are "Not reported" so nobody is tempted to fill them in.
 *   npm run validate:data
 */
import fs from "node:fs";
import path from "node:path";
import { normalizeScheme, validateScheme, REPORTABLE_FIELDS } from "../src/data/schema.js";
import { SEED_SCHEMES } from "../src/data/seed/verified-seed.js";

const manifest = JSON.parse(fs.readFileSync(path.join("public", "data", "manifest.json"), "utf8"));
const packs = [{ id: "bundled-seed", records: SEED_SCHEMES, kind: "schemes" }];

for (const entry of manifest.packs.filter((p) => p.enabled !== false)) {
  const file = path.join("public", entry.path);
  if (!fs.existsSync(file)) { console.log(`✕ ${entry.id}: file missing (${file})`); process.exitCode = 1; continue; }
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if ((entry.kind || "schemes") === "budget") {
    const rows = json.schemes || [];
    const bad = rows.filter((r) => !r.schemeId);
    console.log(`• ${entry.id.padEnd(28)} budget pack — ${rows.length} scheme rows, ${(json.ministries || []).length} ministry rows${bad.length ? `, ${bad.length} rows without schemeId` : ""}`);
    const interconverted = rows.filter((r) => r.actual != null && r.be == null);
    if (interconverted.length) console.log(`   ⚠ ${interconverted.length} row(s) report Actual without BE — check the source document.`);
    continue;
  }
  packs.push({ id: entry.id, records: json.schemes || json.records || json, kind: "schemes" });
}

let total = 0, rejectedTotal = 0;
const missing = Object.fromEntries(REPORTABLE_FIELDS.map((f) => [f, 0]));
const ids = new Map();

for (const pack of packs) {
  let ok = 0, bad = 0;
  for (const r of pack.records) {
    const rec = normalizeScheme(r, { connector: pack.id, pack: pack.id });
    const errors = validateScheme(rec);
    if (rec && !errors.length) {
      ok++;
      for (const f of rec.notReported) missing[f]++;
      if (ids.has(rec.id)) console.log(`   ⚠ duplicate id "${rec.id}" (also in ${ids.get(rec.id)}) — later pack wins`);
      ids.set(rec.id, pack.id);
    } else { bad++; if (process.argv.includes("--verbose")) console.log(`   ✕ ${r?.id || r?.name}: ${errors.join("; ")}`); }
  }
  total += ok; rejectedTotal += bad;
  console.log(`• ${pack.id.padEnd(28)} ${String(ok).padStart(5)} accepted${bad ? `, ${bad} rejected` : ""}`);
}

console.log(`\nCatalogue total: ${total.toLocaleString("en-IN")} schemes, ${rejectedTotal} rejected, ${ids.size} unique ids`);
console.log(`"Not reported" field counts (left empty by design):`);
for (const [f, n] of Object.entries(missing)) if (n) console.log(`  ${f.padEnd(14)} ${n}`);
