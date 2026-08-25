/* Subsidy360 — myScheme (Government of India) connector.
 *
 * NO myScheme API IS INVENTED OR CALLED HERE.
 *
 * myScheme does not publish a documented public bulk API for third-party
 * catalogue mirroring, so this connector operates in `file-import` mode:
 *
 *   1. Obtain the catalogue export through an official/permitted route.
 *   2. Drop the raw file into  /data/myscheme/
 *   3. Run  npm run import:myscheme -- --in data/myscheme/<file>.json
 *      which normalises it to the canonical schema and writes a pack into
 *      /public/data/myscheme/ and registers it in the manifest.
 *   4. Reload the app — the catalogue picks it up. No frontend change.
 *
 * If, and only if, an official endpoint is configured in .env
 * (VITE_MYSCHEME_ENDPOINT), the same normaliser is reused for it. Until then
 * `fetchRemote()` refuses to run rather than guessing a URL.
 */

import { CONNECTOR_CONFIG } from "./config.js";
import { loadPack, fetchJson } from "./localPack.js";

export const MYSCHEME = {
  id: "myscheme",
  label: "myScheme (Government of India)",
  attribution: CONNECTOR_CONFIG.myscheme.attribution,
  mode: CONNECTOR_CONFIG.myscheme.mode,
};

/** Load every myScheme pack listed in the manifest. */
export async function loadMySchemePacks(manifestEntries) {
  const mine = manifestEntries.filter((e) => e.connector === "myscheme");
  return Promise.all(mine.map((e) => loadPack({ ...e, connector: "myscheme" })));
}

/** Only usable when an official endpoint has been configured by the operator. */
export async function fetchRemote() {
  const cfg = CONNECTOR_CONFIG.myscheme;
  if (!cfg.endpoint) {
    throw new Error(
      "myScheme remote fetch is not configured. Subsidy360 does not guess government endpoints — " +
      "use the file-import route (npm run import:myscheme) or set VITE_MYSCHEME_ENDPOINT to an officially published URL."
    );
  }
  return fetchJson(cfg.endpoint);
}
