/* Subsidy360 — catalogue provider.
 *
 * Loads the catalogue once, then hands the same object to every page. Pages ask
 * for `useSchemes()` exactly where they used to import a hardcoded array, which
 * is why 12 records and 4,700 records look identical to the interface.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { loadCatalogue, EMPTY_CATALOGUE } from "../data/catalogue.js";

const Ctx = createContext(EMPTY_CATALOGUE);

export function CatalogueProvider({ children }) {
  const [cat, setCat] = useState({ ...EMPTY_CATALOGUE, status: "loading" });

  useEffect(() => {
    let alive = true;
    loadCatalogue()
      .then((c) => { if (alive) setCat(c); })
      .catch((e) => {
        if (alive) setCat({ ...EMPTY_CATALOGUE, status: "error", problems: [{ source: "catalogue", message: e.message }] });
      });
    return () => { alive = false; };
  }, []);

  return <Ctx.Provider value={cat}>{children}</Ctx.Provider>;
}

export const CatalogueContext = Ctx;
export const useCatalogue = () => useContext(Ctx);
export const useSchemes = () => useContext(Ctx).schemes;
export const useFacets = () => useContext(Ctx).facets;
export const useBudget = () => useContext(Ctx).budget;
