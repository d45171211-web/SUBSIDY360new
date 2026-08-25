# Subsidy360 — Government Scheme Intelligence Platform

Discover. Qualify. Compare. Understand.
An evidence-first interface for navigating India's government schemes, eligibility and public funding.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build
npm run preview   # serve the build
```

---

## Government data architecture

The interface no longer owns a dataset. It asks a **catalogue**, which is assembled at
runtime from whatever connectors are enabled. Going from 12 records to 4,700+ is a data
operation, not a code change.

```
raw official export            connector layer            catalogue              interface
/data/myscheme/*.json   →   import-pack.mjs   →   public/data/myscheme/*.json  →  useCatalogue()
/data/states/*.json     →   (normaliser +     →   public/data/states/*.json    →  facets + index
/data/budget/*.json     →    validator)       →   public/data/budget/*.json    →  budget store
```

### Layout

```
data/                          raw drop zone (inputs only, never served)
  myscheme/ states/ budget/ ministries/
public/data/                   served packs — this is the catalogue
  manifest.json                which packs to load; add an entry, reload, done
  myscheme/                    myScheme catalogue packs
  states/                      one pack per state + states.json reference list
  budget/                      BE / RE / Actual packs
  ministries/                  ministry & department reference list
  schema/scheme.schema.json    canonical record contract
  loadtest/                    synthetic scale test (not government data)
src/
  connectors/                  config, localPack, myscheme, dataGov, budget, registry
  data/schema.js               canonical schema, normaliser, validator, merge
  data/catalogue.js            builds catalogue + facets + search index
  data/seed/verified-seed.js   12 verified records bundled so the app runs offline
  context/CatalogueContext.jsx one load, shared by every page
  engine/                      matching, search, combination, formatting
  components/ pages/           unchanged interface
```

### Importing schemes

```bash
npm run import:myscheme -- --in data/myscheme/export.json
npm run import:state    -- --in data/states/rajasthan.json --state "Rajasthan"
npm run import:budget   -- --in data/budget/demands-2025-26.json
npm run validate:data                    # audit every pack + list "Not reported" fields
```

The importer normalises, validates, writes the pack and registers it in the manifest.
Records without an id, name or **official source** are rejected, not patched.

### Connectors

| Connector | Mode | State |
|---|---|---|
| Bundled seed | bundled | always on — 12 verified Central/State records |
| myScheme (GoI) | file-import | on — official export → `npm run import:myscheme` |
| State portals | file-import | on — one pack per state |
| Union Budget | file-import | on — BE/RE/Actual packs |
| data.gov.in | remote API | **off** until you supply endpoint + key in `.env` |

**No government API is invented.** No myScheme endpoint is called or assumed anywhere in
this codebase. `fetchRemote()` refuses to run without an officially published URL that you
configure yourself (`.env.example`). With every remote connector off, the platform runs
entirely from local JSON packs — that is the supported default.

### Scale

`npm run loadtest:generate` writes 4,700 synthetic placeholder records (clearly labelled,
never registered in the manifest) so you can verify the interface at full size.
Measured at 4,719 records: catalogue build 229 ms, indexed search 3 ms, eligibility engine
ranking every record 35 ms, Discover page render 467 ms.

---

## Data rules

- **Nothing is invented** — not subsidy amounts, eligibility, allocations, utilisation or
  application rules. A field the source does not state is `null` and renders **"Not reported"**.
- Records **without an official source are not indexed**.
- **BE / RE / Actual** are stored in separate fields and never interconverted. An allocation
  is never restated as sanctioned, released or utilised.
- Match scores are a *Subsidy360 informational match — not an official eligibility decision.*
- Combination results are demonstration rules; unlisted pairs return "Compatibility not established".
- Figures shipped for demonstration carry a **DEMO DATA** badge.

SUBSIDY360 • ECONOMICS PROJECT
