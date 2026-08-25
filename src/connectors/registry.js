/* Subsidy360 — connector registry.
 *
 * One place that knows every data source, whether it is on, and what it
 * contributed to the catalogue. The interface reads this to show provenance;
 * adding a source means adding an entry here, not touching a component.
 */

import { CONNECTOR_CONFIG } from "./config.js";
import { MYSCHEME } from "./myscheme.js";
import { DATA_GOV, isEnabled as dataGovEnabled } from "./dataGov.js";
import { BUDGET } from "./budget.js";

export const CONNECTORS = [
  {
    id: "bundled-seed",
    label: "Bundled verified seed",
    kind: "schemes",
    enabled: true,
    mode: "bundled",
    note: "12 hand-verified Central and State scheme records shipped with the app so it runs offline.",
  },
  {
    id: "myscheme",
    label: MYSCHEME.label,
    kind: "schemes",
    enabled: CONNECTOR_CONFIG.myscheme.enabled,
    mode: CONNECTOR_CONFIG.myscheme.mode,
    note: "File-import route. No myScheme API is called or assumed. Drop an official export into /data/myscheme and run npm run import:myscheme.",
  },
  {
    id: "state-portals",
    label: "State government portals",
    kind: "schemes",
    enabled: CONNECTOR_CONFIG.statePortals.enabled,
    mode: "file-import",
    note: "One pack per state, converted from the state's own scheme portal export.",
  },
  {
    id: "data-gov-in",
    label: DATA_GOV.label,
    kind: "schemes",
    enabled: dataGovEnabled(),
    mode: "remote-api",
    note: "Disabled until the operator supplies their own endpoint, API key and resource ids in .env.",
  },
  {
    id: "union-budget",
    label: BUDGET.label,
    kind: "budget",
    enabled: CONNECTOR_CONFIG.budget.enabled,
    mode: "file-import",
    note: "BE / RE / Actual packs converted from official budget documents. Never interconverted.",
  },
];

export const connectorById = (id) => CONNECTORS.find((c) => c.id === id) || null;
