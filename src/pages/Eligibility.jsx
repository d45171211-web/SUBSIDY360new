import { useState, useMemo } from "react";
import { APPLICANTS, SECTORS, INCOME_BANDS, INVEST_BANDS } from "../data/constants.js";
import { useCatalogue } from "../context/CatalogueContext.jsx";
import { matchScheme } from "../engine/matching.js";
import { Check } from "../components/Check.jsx";
import { SearchableDropdown } from "../components/SearchableDropdown.jsx";
import { ALL_INDIAN_STATES, getDistrictsForState, getAllDistrictsFlattened } from "../data/indiaLocations.js";

const POPULAR_STATES = [
  "Gujarat", "Maharashtra", "Uttar Pradesh", "Karnataka", "Tamil Nadu",
  "Rajasthan", "Delhi", "Madhya Pradesh", "Bihar", "West Bengal", "Telangana"
];

const POPULAR_CATEGORIES = [
  "agriculture-farmers", "msme-business", "solar-renewable-energy",
  "education-scholarships", "health-medical", "women-girl-child",
  "startup-entrepreneurship", "animal-husbandry-dairy", "farm-machinery",
  "employment-skill-development", "housing", "textile-handicrafts",
];

function CategoryStepSelector({ p, setP }) {
  const [showAllChips, setShowAllChips] = useState(false);
  const selectedObj = SECTORS.find(s => s.id === p.sector);

  const categoryOptions = useMemo(() => {
    return SECTORS.map(s => ({
      label: `${s.num}. ${s.label}`,
      value: s.id,
      sub: s.desc,
    }));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
        Choose from <b>34 Support Categories</b> covering Central and State/UT assistance programmes (grants, loans, subsidies, DBT, pensions, and technical support):
      </div>

      <SearchableDropdown
        value={selectedObj ? `${selectedObj.num}. ${selectedObj.label}` : ""}
        options={categoryOptions}
        placeholder="Select or search among 34 support categories..."
        searchPlaceholder="Type category (e.g. Solar, Farm Machinery, Dairy, Education)..."
        badgeText={selectedObj ? `Selected: ${selectedObj.label}` : "34 Support Categories"}
        onChange={(selectedVal, opt) => {
          setP(prev => ({ ...prev, sector: opt?.value || selectedVal }));
        }}
      />

      {selectedObj && (
        <div style={{ padding: "10px 14px", background: "var(--panel2)", borderRadius: 6, border: "1px solid var(--line2)", fontSize: 13 }}>
          <b style={{ color: "var(--paper)" }}>{selectedObj.num}. {selectedObj.label}</b>: <span style={{ color: "var(--muted)" }}>{selectedObj.desc}</span>
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
          <span className="tt">{showAllChips ? "All 34 Support Categories:" : "Quick select popular categories:"}</span>
          <button
            type="button"
            className="btn ghost"
            style={{ fontSize: 11.5, padding: "2px 6px" }}
            onClick={() => setShowAllChips(s => !s)}
          >
            {showAllChips ? "Show popular only" : "View all 34 category chips"}
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: showAllChips ? 280 : "none", overflowY: showAllChips ? "auto" : "visible", padding: "2px 0" }}>
          {(showAllChips ? SECTORS : SECTORS.filter(s => POPULAR_CATEGORIES.includes(s.id))).map(item => (
            <button
              key={item.id}
              type="button"
              className={`chip ${p.sector === item.id ? "on" : ""}`}
              onClick={() => setP(prev => ({ ...prev, sector: item.id }))}
              title={item.desc}
            >
              {item.num}. {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Eligibility({ go, profile, setProfile }) {
  const { schemes: SCHEMES, states: refStates, facets } = useCatalogue();
  const catalogueStates = refStates.length ? refStates : facets.states.map(s => s.value);
  // Merge catalogue states with official states/UTs, filtering out invalid values
  const ALL_STATES = useMemo(() => {
    const set = new Set();
    for (const s of ALL_INDIAN_STATES) set.add(s);
    for (const s of catalogueStates) {
      if (s && s !== "None" && s !== "all" && s !== "All India") {
        set.add(s);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catalogueStates]);

  const [step, setStep] = useState(profile ? 99 : 0);
  const [p, setP] = useState(profile || { state: "", district: "", applicant: "", sector: "", income: "", invest: null, stage: "", loan: null });

  const currentDistricts = useMemo(() => {
    return p.state ? getDistrictsForState(p.state) : [];
  }, [p.state]);

  const allIndiaDistricts = useMemo(() => {
    return getAllDistrictsFlattened().map(d => ({
      label: d.district,
      value: d.district,
      sub: d.state,
    }));
  }, []);

  const steps = [
    {
      key: "state",
      q: "Which state or union territory are you in?",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SearchableDropdown
            value={p.state}
            options={ALL_STATES}
            placeholder="Select or search state / UT..."
            searchPlaceholder="Type state name (e.g. Gujarat, Maharashtra, Delhi)..."
            badgeText={p.state ? `Selected: ${p.state}` : `${ALL_STATES.length} States & UTs`}
            onChange={(selectedState) => {
              const districtsForNewState = getDistrictsForState(selectedState);
              const districtValid = districtsForNewState.includes(p.district);
              setP(prev => ({
                ...prev,
                state: selectedState,
                district: districtValid ? prev.district : "",
              }));
            }}
          />
          <div>
            <div className="tt" style={{ marginBottom: 8 }}>Quick select popular states:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {POPULAR_STATES.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${p.state === s ? "on" : ""}`}
                  onClick={() => {
                    const districtsForNewState = getDistrictsForState(s);
                    const districtValid = districtsForNewState.includes(p.district);
                    setP(prev => ({
                      ...prev,
                      state: s,
                      district: districtValid ? prev.district : "",
                    }));
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "district",
      q: p.state ? `Which district in ${p.state}? (optional)` : "Which district? (optional)",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {p.state && currentDistricts.length > 0 ? (
            <>
              <SearchableDropdown
                value={p.district}
                options={currentDistricts}
                placeholder={`Select or search district in ${p.state}...`}
                searchPlaceholder={`Type district name in ${p.state} (e.g. ${currentDistricts[0] || "District"})...`}
                badgeText={p.district ? `Selected: ${p.district} (${p.state})` : `${currentDistricts.length} Districts in ${p.state}`}
                onChange={(selectedDistrict) => {
                  setP(prev => ({ ...prev, district: selectedDistrict }));
                }}
              />
              {currentDistricts.length > 0 && (
                <div>
                  <div className="tt" style={{ marginBottom: 8 }}>Sample districts in {p.state}:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 110, overflowY: "auto" }}>
                    {currentDistricts.slice(0, 12).map(d => (
                      <button
                        key={d}
                        type="button"
                        className={`chip ${p.district === d ? "on" : ""}`}
                        onClick={() => setP(prev => ({ ...prev, district: d }))}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                {p.state ? `No preloaded district list for ${p.state}, type custom district below:` : "No state selected yet. Search all Indian districts below or choose a state first:"}
              </div>
              <SearchableDropdown
                value={p.district}
                options={allIndiaDistricts}
                placeholder="Search across all Indian districts..."
                searchPlaceholder="Type district name (e.g. Kheda, Pune, Jaipur, Patna)..."
                badgeText="All India Search"
                onChange={(selectedDistrict, opt) => {
                  setP(prev => ({
                    ...prev,
                    district: selectedDistrict,
                    state: opt?.sub || prev.state,
                  }));
                }}
              />
            </>
          )}
        </div>
      ),
      optional: true,
    },
    { key: "applicant", q: "What describes you best?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {APPLICANTS.map(a => <button key={a.id} className={`chip ${p.applicant === a.id ? "on" : ""}`} onClick={() => setP({ ...p, applicant: a.id })}>{a.label}</button>)}
      </div>) },
    {
      key: "sector",
      q: "Which support category is your need in?",
      render: () => <CategoryStepSelector p={p} setP={setP} />,
    },
    { key: "income", q: "Annual household income range?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {INCOME_BANDS.map(b => <button key={b.id} className={`chip ${p.income === b.id ? "on" : ""}`} onClick={() => setP({ ...p, income: b.id })}>{b.label}</button>)}
      </div>) },
    { key: "invest", q: "Planned project / investment size?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {INVEST_BANDS.map(b => <button key={b.id} className={`chip ${p.invest === b.id ? "on" : ""}`} onClick={() => setP({ ...p, invest: b.id })}>{b.label}</button>)}
      </div>) },
    { key: "stage", q: "Is this a new or existing activity?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[["new", "New / first-time"], ["existing", "Existing / expansion"]].map(([id, l]) => <button key={id} className={`chip ${p.stage === id ? "on" : ""}`} onClick={() => setP({ ...p, stage: id })}>{l}</button>)}
      </div>) },
    { key: "loan", q: "Will you take a bank loan?", render: () => (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[[true, "Yes, planning a loan"], [false, "No loan"]].map(([v, l]) => <button key={l} className={`chip ${p.loan === v ? "on" : ""}`} onClick={() => setP({ ...p, loan: v })}>{l}</button>)}
      </div>) },
  ];

  const ranked = useMemo(
    () => SCHEMES.map(s => ({ s, m: matchScheme(s, p) })).sort((a, b) => b.m.score - a.m.score),
    [SCHEMES, p]
  );

  if (step >= steps.length || step === 99) {
    const top = ranked[0];
    const grade = top.m.score >= 80 ? "Strong Match" : top.m.score >= 55 ? "Possible Match" : "Weak Match";
    const R = 62, C = 2 * Math.PI * R;
    return (
      <div className="fadein" style={{ padding: "34px 0" }}>
        <div className="eyebrow em" style={{ marginBottom: 10 }}>Your Subsidy Match Profile</div>
        <div className="two-col" style={{ alignItems: "start" }}>
          <div>
            <div className="panel" style={{ padding: 24, display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap" }}>
              <div className="ringwrap">
                <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label={`Top match ${top.m.score}%`}>
                  <circle cx="75" cy="75" r={R} fill="none" stroke="#1D3050" strokeWidth="9" />
                  <circle cx="75" cy="75" r={R} fill="none" stroke={top.m.score >= 70 ? "#17C787" : "#E8B25E"} strokeWidth="9"
                    strokeDasharray={C} strokeDashoffset={C * (1 - top.m.score / 100)} strokeLinecap="round" transform="rotate(-90 75 75)"
                    style={{ transition: "stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="num">
                  <span className="mono" style={{ fontSize: 34, fontWeight: 600, color: "var(--paper)" }}>{top.m.score}%</span>
                  <span style={{ fontSize: 11.5, color: top.m.score >= 70 ? "var(--em)" : "var(--amber)", fontWeight: 600 }}>{grade}</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="tt" style={{ marginBottom: 4 }}>Top-ranked scheme for your profile</div>
                <div style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 20, color: "var(--paper)" }}>{top.s.short}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", margin: "3px 0 8px" }}>{top.s.name}</div>
                {(p.state || p.district || p.sector) && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {p.state && <span className="badge b-official">📍 {p.state}</span>}
                    {p.district && <span className="badge b-verified">{p.district}</span>}
                    {p.sector && <span className="badge b-central">🏷️ {SECTORS.find(s => s.id === p.sector)?.label || p.sector}</span>}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn pri" onClick={() => go("intel", top.s.id)}>Open scheme intelligence →</button>
                  <button className="btn sec" onClick={() => { setStep(0); setP({ state: "", district: "", applicant: "", sector: "", income: "", invest: null, stage: "", loan: null }); setProfile(null); }}>Redo profile</button>
                </div>
              </div>
            </div>
            <div className="panel" style={{ padding: "10px 20px", marginTop: 14 }}>
              <div className="tt" style={{ padding: "10px 0 4px" }}>Transparent breakdown — {top.s.short}</div>
              {top.m.checks.map(c => <Check key={c.k} c={c} />)}
            </div>
            <div className="badge b-nr" style={{ marginTop: 14, padding: "8px 12px", fontSize: 10.5, lineHeight: 1.5, textTransform: "none", letterSpacing: ".04em" }}>
              Subsidy360 informational match — not an official eligibility decision.
            </div>
          </div>
          <div>
            <div className="tt" style={{ marginBottom: 10 }}>Top {Math.min(40, ranked.length)} of {ranked.length.toLocaleString("en-IN")} schemes ranked against your profile</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {ranked.slice(0, 40).map(({ s, m }) => (
                <button key={s.id} className="panel" onClick={() => go("intel", s.id)}
                  style={{ padding: "12px 14px", textAlign: "left", cursor: "pointer", color: "var(--txt)", display: "block", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.short}</span>
                    <span className="mono" style={{ fontSize: 12.5, color: m.score >= 70 ? "var(--em)" : m.score >= 40 ? "var(--amber)" : "var(--red)" }}>{m.score}%</span>
                  </div>
                  <div className="progress"><i style={{ width: `${m.score}%` }} /></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cur = steps[step];
  const answered = cur.optional || (cur.key === "invest" ? p.invest != null : cur.key === "loan" ? p.loan != null : !!p[cur.key]);
  return (
    <div className="fadein" style={{ padding: "40px 0", maxWidth: 760 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>My Eligibility · Step {step + 1} of {steps.length}</div>
      <div className="progress" style={{ maxWidth: 380, marginBottom: 26 }}><i style={{ width: `${((step) / steps.length) * 100}%` }} /></div>
      <h2 className="sec" style={{ marginBottom: 20 }}>{cur.q}</h2>
      {cur.render()}
      <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
        {step > 0 && <button className="btn sec" onClick={() => setStep(s => s - 1)}>← Back</button>}
        <button className="btn pri" disabled={!answered} onClick={() => {
          const nxt = step + 1;
          if (nxt >= steps.length) { setProfile(p); setStep(99); } else setStep(nxt);
        }}>{step === steps.length - 1 ? "Show my matches" : "Continue →"}</button>
      </div>
    </div>
  );
}
