#!/usr/bin/env node
/* Subsidy360 — synthetic load-test catalogue generator.
 *
 * PURPOSE: prove the interface handles a 4,700+ record catalogue. The records
 * it writes are SYNTHETIC PLACEHOLDERS, not government data: every factual
 * field is null, every name is prefixed so it can never be mistaken for a real
 * scheme, and the pack is NOT registered in the manifest.
 *
 *   node scripts/generate-loadtest.mjs 4700
 *   VITE_LOADTEST=1 npm run dev      # load it deliberately
 */
import fs from "node:fs";
import path from "node:path";

const n = Number(process.argv[2] || 4700);
const states = JSON.parse(fs.readFileSync(path.join("public", "data", "states", "states.json"), "utf8")).states;
const ministries = JSON.parse(fs.readFileSync(path.join("public", "data", "ministries", "ministries.json"), "utf8")).ministries;
const sectors = ["agriculture", "manufacturing", "services", "food-processing", "energy", "trading", "household"];
const applicants = ["farmer", "entrepreneur", "msme", "household", "shg", "student"];

const schemes = Array.from({ length: n }, (_, i) => {
  const central = i % 3 === 0;
  const m = ministries[i % ministries.length];
  return {
    id: `loadtest-${String(i + 1).padStart(5, "0")}`,
    short: `LOADTEST ${i + 1}`,
    name: `SYNTHETIC LOAD TEST RECORD ${i + 1} — NOT GOVERNMENT DATA`,
    dept: m.name,
    level: central ? "Central" : "State",
    states: central ? "all" : [states[i % states.length]],
    sectorLabel: "Synthetic placeholder",
    sectors: [sectors[i % sectors.length]],
    applicants: [applicants[i % applicants.length]],
    benefit: null, benefitType: null, maxBenefitL: null,
    docs: [], process: [], restrictions: [],
    source: "synthetic://load-test",
    verified: null,
    status: "Synthetic — not a government scheme",
    allocationCr: null,
    popularity: 0,
  };
});

const out = path.join("public", "data", "loadtest", "synthetic-catalogue.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({
  meta: {
    pack: "loadtest",
    notice: "SYNTHETIC LOAD TEST DATA — NOT GOVERNMENT DATA. Generated to measure interface performance at catalogue scale. Never registered in manifest.json and never counted as scheme information.",
    sourceType: "synthetic", license: "n/a", fetchedAt: null,
  },
  schemes,
}, null, 2));
console.log(`✓ ${out} — ${n.toLocaleString("en-IN")} synthetic records (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
console.log(`  Load with: VITE_LOADTEST=1 npm run dev`);
