import { useState, useEffect, useMemo } from "react";
import { APPLICANTS, SECTORS, INVEST_BANDS } from "../data/constants.js";
import { useCatalogue } from "../context/CatalogueContext.jsx";
import { searchSchemes } from "../engine/search.js";
import { matchScheme } from "../engine/matching.js";
import { SchemeCard } from "../components/SchemeCard.jsx";

export function Discover({ go, profile, compare, toggleCompare, query, setQuery }) {
  const { schemes: SCHEMES, index, facets, states: refStates, ministries } = useCatalogue();
  const STATES = refStates.length ? refStates : facets.states.map(s => s.value);
  const ministryOptions = facets.ministries;
  const [f, setF] = useState({ state: "", level: "", applicant: "", sector: "", loan: "", benefitType: "", status: "", invest: "", ministry: "" });
  const [sort, setSort] = useState("best");
  const [page, setPage] = useState(1);
  const PER = 6;
  const searched = useMemo(() => (query ? searchSchemes(query, SCHEMES, index) : null), [query, SCHEMES, index]);
  // Match scores are computed once per profile change, not once per comparator call.
  const scoreById = useMemo(() => {
    if (!profile) return null;
    const m = new Map();
    for (const s of SCHEMES) m.set(s.id, matchScheme(s, profile).score ?? 0);
    return m;
  }, [SCHEMES, profile]);

  const rows = useMemo(() => {
    let base = searched ? searched.map(r => ({ ...r })) : SCHEMES.map(s => ({ s, why: [] }));
    base = base.filter(({ s }) =>
      (!f.state || s.states === "all" || s.states.includes(f.state)) &&
      (!f.level || s.level === f.level) &&
      (!f.applicant || s.applicants.includes(f.applicant)) &&
      (!f.sector || s.sectors.includes(f.sector)) &&
      (!f.ministry || s.ministryKey === f.ministry) &&
      (!f.loan || (f.loan === "yes") === s.loanRequired) &&
      (!f.benefitType || (s.benefitType || "").toLowerCase().includes(f.benefitType)) &&
      (!f.status || (f.status === "active") === (s.status === "Active")) &&
      (!f.invest || (() => { const b = INVEST_BANDS.find(x => String(x.id) === f.invest); return b && ((s.investMaxL === 0 && b.v === 0) || (b.v >= s.investMinL && b.v <= s.investMaxL)); })())
    );
    const key = {
      best: (a, b) => (searched ? b.score - a.score : (scoreById ? scoreById.get(b.s.id) - scoreById.get(a.s.id) : b.s.popularity - a.s.popularity)),
      benefit: (a, b) => (b.s.maxBenefitL ?? -1) - (a.s.maxBenefitL ?? -1),
      verified: (a, b) => (Date.parse(`1 ${b.s.verified}`) || 0) - (Date.parse(`1 ${a.s.verified}`) || 0),
      popular: (a, b) => b.s.popularity - a.s.popularity,
      alloc: (a, b) => (b.s.allocationCr?.be ?? -1) - (a.s.allocationCr?.be ?? -1),
    }[sort];
    return [...base].sort(key);
  }, [f, sort, searched, scoreById, SCHEMES]);

  useEffect(() => setPage(1), [f, sort, query]);
  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const view = rows.slice((page - 1) * PER, page * PER);
  const Sel = ({ k, label, children }) => (
    <div>
      <label className="tt" style={{ display: "block", marginBottom: 5 }}>{label}</label>
      <select className="sel" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })}>{children}</select>
    </div>
  );

  return (
    <div className="fadein" style={{ padding: "34px 0 10px" }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Scheme Explorer</div>
      <h2 className="sec" style={{ marginBottom: 6 }}>Discover schemes</h2>
      <p className="sub" style={{ fontSize: 13.5, marginBottom: 18 }}>
        Indexing {SCHEMES.length.toLocaleString("en-IN")} scheme{SCHEMES.length === 1 ? "" : "s"} across {facets.ministries.length} department{facets.ministries.length === 1 ? "" : "s"}. The explorer is built for a 4,700+ record catalogue — add a pack, not a code change.
      </p>
      <div className="searchbar" style={{ maxWidth: 640, marginBottom: 18 }}>
        <span className="mono" style={{ color: "var(--cy)" }}>⌕</span>
        <input placeholder="Try: solar subsidy for my house" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search schemes" />
        {query && <button className="btn sec" style={{ padding: "7px 12px" }} onClick={() => setQuery("")}>Clear</button>}
      </div>

      <div className="panel" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          <Sel k="state" label="State"><option value="">All states</option>{STATES.map(s => <option key={s}>{s}</option>)}</Sel>
          <Sel k="level" label="Central / State"><option value="">Both</option><option>Central</option><option>State</option></Sel>
          <Sel k="applicant" label="Beneficiary"><option value="">Any</option>{APPLICANTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</Sel>
          <Sel k="sector" label="Sector"><option value="">Any</option>{SECTORS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</Sel>
          <Sel k="ministry" label="Department"><option value="">All departments</option>{ministryOptions.map(m => <option key={m.value} value={m.value}>{m.label} ({m.n})</option>)}</Sel>
          <Sel k="invest" label="Investment size"><option value="">Any</option>{INVEST_BANDS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}</Sel>
          <Sel k="loan" label="Loan required"><option value="">Any</option><option value="yes">Yes</option><option value="no">No</option></Sel>
          <Sel k="benefitType" label="Benefit type"><option value="">Any</option><option value="capital">Capital subsidy</option><option value="interest">Interest subvention</option><option value="premium">Premium subsidy</option><option value="guarantee">Credit guarantee</option><option value="assistance">Direct assistance</option><option value="loan">Loan facilitation</option></Sel>
          <Sel k="status" label="Status"><option value="">Any</option><option value="active">Active</option><option value="verify">Verify current cycle</option></Sel>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
          <span className="tt">{rows.length} scheme{rows.length !== 1 ? "s" : ""} match{query ? ` · query: “${query}”` : ""}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="tt">Sort</span>
            <select className="sel" style={{ width: "auto", padding: "7px 10px", fontSize: 12.5 }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="best">Best match</option><option value="benefit">Highest benefit</option>
              <option value="verified">Recently verified</option><option value="popular">Popular</option>
              <option value="alloc">Government allocation</option>
            </select>
          </div>
        </div>
      </div>

      {view.length === 0 && (
        <div className="panel" style={{ padding: 34, textAlign: "center", color: "var(--muted)" }}>
          No schemes match these filters. Remove a filter or clear the search to widen results.
        </div>
      )}
      <div className="grid-cards">
        {view.map(({ s, why }) => (
          <div key={s.id}>
            <SchemeCard s={s} profile={profile} onOpen={(id) => go("intel", id)} onCompare={toggleCompare} inCompare={compare.includes(s.id)} />
            {why && why.length > 0 && (
              <div style={{ border: "1px dashed var(--line2)", borderTop: "none", borderRadius: "0 0 6px 6px", padding: "8px 14px", fontSize: 11.5, color: "var(--muted2)" }}>
                <span className="mono" style={{ color: "var(--cy)" }}>WHY: </span>{why.slice(0, 3).join(" · ")}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "26px 0 6px", alignItems: "center" }}>
        <button className="btn sec" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>Page {page} / {pages}</span>
        <button className="btn sec" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
      {compare.length > 0 && (
        <div style={{ position: "sticky", bottom: 14, display: "flex", justifyContent: "center", zIndex: 30 }}>
          <button className="btn pri" onClick={() => go("compare")}>Compare {compare.length} selected →</button>
        </div>
      )}
    </div>
  );
}
