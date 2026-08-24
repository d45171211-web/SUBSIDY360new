# Subsidy360

**Discover. Qualify. Compare. Understand.**

An evidence-based interface for discovering Indian government schemes, understanding official eligibility, checking verified subsidy-combination rules, and exploring how public money is allocated — built as an Economics project with a premium GovTech / data-terminal design.

---

## Quick start

```bash
npm install
npm run dev        # local dev server (Vite) → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

Requires Node 18+ (built and verified on Node 22). No environment variables, no API keys.

## Project structure

```
subsidy360/
├── index.html
├── package.json / vite.config.js / tailwind.config.js / postcss.config.js
├── public/
│   └── data/external-schemes.template.json   ← optional external-dataset connection point
└── src/
    ├── main.jsx            entry
    ├── index.css           Tailwind + Subsidy360 design tokens (navy/emerald/cyan/gold, IBM Plex)
    ├── App.jsx             shell: grouped sidebar, routing, footer, watermark
    ├── hooks.js            useCountUp (reduced-motion aware)
    ├── engine/index.js     eligibility match, data-confidence, RE-vs-BE, combination verdict
    ├── data/
    │   ├── financials.js   Union Budget series (BE/RE/Actuals, ₹ Cr) — separate from scheme records
    │   ├── seedSchemes.js  verified official-source research import (seed dataset / fallback)
    │   ├── sources.js      source registry (L1–L5 hierarchy), combination rules, Policy Radar
    │   └── index.js        ingestion layer: validation → normalisation → search index → registry
    ├── components/shared.jsx   design-system components (chips, cards, source popovers, charts)
    └── pages/
        ├── discover.jsx    Dashboard · Find My Subsidy · Copilot · What-If
        ├── analyse.jsx     All Schemes · Scheme Detail · Combination · Public Money · Impact · Compare
        └── verify.jsx      Policy Radar · Data Sources · Methodology · About
```

## Data architecture

```
Official Government Sources (myScheme · data.gov.in · indiabudget.gov.in · ministry portals)
        ↓
Ingestion / import layer  (src/data/index.js — validate → normalise → index)
        ↓
Normalised scheme registry (seed: verified research import, 24/08/2026)
        ↓
Engines (eligibility match · data confidence · combination · budget analysis)
        ↓
Subsidy360 UI
```

**Honesty rules enforced in code** (see `src/data/` and `src/engine/`):

- Every record carries `official_source_url`, `source_org`, `source_type`, `last_verified`, `data_status`. Records missing this metadata fail `validateRecord()` and are never displayed.
- Fields not confirmed from an official source are `null` and render as **"Not reported"** — never estimated.
- Financial figures are labelled **BE / RE / Actuals** from Union Budget documents and are never mixed; sanctioned / released / utilised stages display only if a source reports them (`years: { sanctioned, released, utilised, beneficiaries }` are supported but unpopulated in the seed, because the budget documents don't publish them).
- Scheme counts on screen are computed from `SCHEMES.length` — never hard-coded.
- Combination verdicts require an explicit official rule in `COMBO_RULES`; every other pairing returns *"Compatibility not established"*.
- **Subsidy360 Match** is an informational ranking against machine-checkable official criteria and is labelled as not an official eligibility decision throughout the UI.
- Nothing is labelled "live": the app runs on an **official-source research import** dated 24/08/2026 ("prototype synchronization").

## Scaling to the full scheme universe

myScheme reports a catalogue of 4,700+ Central and State/UT schemes. Subsidy360 is architected for that scale without hard-coding it:

1. Export/ingest official data into the documented JSON format.
2. Copy `public/data/external-schemes.template.json` → `public/data/external-schemes.json` and populate it.
3. On load, `loadExternalSchemes()` fetches it, validates every record (same rules as the seed), merges financial series by scheme ID, and the whole UI — search, filters, pagination, counts, charts — picks the records up automatically.

Records that fail validation are skipped, not repaired or invented. The All Schemes page paginates (24/card page) and searches against a precomputed lowercase index, so thousands of records stay fast.

## Deployment

Static build — deploys anywhere:

- **Vercel / Netlify:** build command `npm run build`, output directory `dist`.
- **GitHub Pages:** set Vite `base` in `vite.config.js` if serving from a subpath.

## Disclaimer

Subsidy360 is an academic prototype for educational and demonstration purposes. Scheme information and financial figures are imported from the official sources cited on each record; verify current information with the relevant government department or official scheme portal before applying. This is not official government advice.

---

SUBSIDY360 • ECONOMICS PROJECT
