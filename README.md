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
  schemes.json                 national and state schemes catalogue (4,670+ records)
  scheme.json                  canonical scheme catalogue
  manifest.json                which packs to load; add an entry, reload, done
  states/                      one pack per state + states.json reference list
  budget/                      BE / RE / Actual packs
  ministries/                  ministry & department reference list
  schema/scheme.schema.json    canonical record contract
src/
  connectors/                  config, localPack, myscheme, dataGov, budget, registry
  data/schema.js               canonical schema, normaliser, validator, merge
  data/catalogue.js            builds catalogue + facets + search index
  context/CatalogueContext.jsx one load, shared by every page
  engine/                      matching, search, combination, formatting
  components/ pages/           interface
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
| Schemes Catalogue | local-pack | on — 4,670+ verified Central/State records |
| myScheme (GoI) | file-import | on — official export → `npm run import:myscheme` |
| State portals | file-import | on — one pack per state |
| Union Budget | file-import | on — BE/RE/Actual packs |
| data.gov.in | remote API | **off** until you supply endpoint + key in `.env` |

**No government API is invented.** No myScheme endpoint is called or assumed anywhere in
this codebase. `fetchRemote()` refuses to run without an officially published URL that you
configure yourself (`.env.example`). With every remote connector off, the platform runs
entirely from local JSON packs — that is the supported default.

---

## Data rules

- **Nothing is invented** — not subsidy amounts, eligibility, allocations, utilisation or
  application rules. A field the source does not state is `null` and renders **"Not reported"**.
- Records **without an official source are not indexed**.
- **BE / RE / Actual** are stored in separate fields and never interconverted. An allocation
  is never restated as sanctioned, released or utilised.
- Match scores are a *Subsidy360 informational match — not an official eligibility decision.*
- Combination results are policy guidelines; unlisted pairs return "Compatibility not established".

SUBSIDY360 • ECONOMICS PROJECT
