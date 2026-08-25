# /data/myscheme — raw drop zone

Put raw official exports for **myscheme** here, then convert them into a canonical pack:

```bash
npm run import:myscheme -- --in data/myscheme/<file>.json     # myScheme catalogue export
npm run import:state    -- --in data/states/<file>.json --state "<State>"
npm run import:budget   -- --in data/budget/<file>.json       # BE / RE / Actual rows
```

The importer normalises records to `public/data/schema/scheme.schema.json`, writes the pack
into `public/data/myscheme/` and registers it in `public/data/manifest.json`.
Reload the app — the records are in the catalogue. No frontend change.

**Files in this folder are inputs, not data the app reads.** Nothing here is ever
served, and no field is ever filled in: anything the export does not state stays
null and renders as "Not reported".
