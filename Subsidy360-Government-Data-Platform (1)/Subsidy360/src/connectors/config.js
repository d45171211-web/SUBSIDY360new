/* Subsidy360 — connector configuration.
 *
 * IMPORTANT: no government API endpoint is invented or hard-coded here.
 * Remote connectors ship DISABLED with an empty endpoint. To enable one, put a
 * real, officially-published endpoint (and your own API key where the portal
 * issues one) into a .env file — see .env.example — or edit this object.
 *
 * With every remote connector disabled, Subsidy360 still runs entirely from
 * local JSON packs in /public/data. That is the supported default.
 */

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

export const CONNECTOR_CONFIG = {
  /* Local JSON packs — always on. This is how the myScheme catalogue export,
     state portal exports and budget documents are loaded. */
  localPacks: {
    enabled: true,
    manifest: "data/manifest.json",
  },

  /* myScheme (Government of India) — no public bulk API is assumed.
     The supported route is an official catalogue export dropped into
     /data/myscheme and converted with `npm run import:myscheme`. */
  myscheme: {
    enabled: true,
    mode: "file-import",
    endpoint: env.VITE_MYSCHEME_ENDPOINT || "",
    packDir: "data/myscheme/",
    attribution: "myScheme, Government of India",
  },

  /* data.gov.in (Open Government Data Platform India).
     Resource id + endpoint + API key must be supplied by the operator from
     their own registered account. Disabled until then. */
  dataGov: {
    enabled: Boolean(env.VITE_DATAGOV_ENDPOINT && env.VITE_DATAGOV_KEY),
    endpoint: env.VITE_DATAGOV_ENDPOINT || "",
    apiKey: env.VITE_DATAGOV_KEY || "",
    resourceIds: (env.VITE_DATAGOV_RESOURCES || "").split(",").filter(Boolean),
    attribution: "data.gov.in — Open Government Data Platform India",
  },

  /* Union Budget documents (Expenditure Profile / Demands for Grants).
     Loaded from converted JSON packs in /public/data/budget. */
  budget: {
    enabled: true,
    packDir: "data/budget/",
    attribution: "Union Budget documents, Ministry of Finance",
  },

  /* State portals — one pack per state, dropped into /public/data/states. */
  statePortals: {
    enabled: true,
    packDir: "data/states/",
    attribution: "State government scheme portals",
  },

  /* Load-test pack: synthetic placeholder records used ONLY to prove the
     interface scales. Never counted as government data. Off by default. */
  loadTest: {
    enabled: env.VITE_LOADTEST === "1",
    path: "data/loadtest/synthetic-catalogue.json",
  },
};

export const REQUEST_TIMEOUT_MS = 12000;
