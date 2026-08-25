import { useState } from "react";
import { fmtL } from "./engine/format.js";
import { CatalogueProvider, useCatalogue } from "./context/CatalogueContext.jsx";
import { CatalogueGate } from "./components/CatalogueLoading.jsx";
import { MethodologyDrawer } from "./components/MethodologyDrawer.jsx";
import { Overview } from "./pages/Overview.jsx";
import { Discover } from "./pages/Discover.jsx";
import { Eligibility } from "./pages/Eligibility.jsx";
import { Compare } from "./pages/Compare.jsx";
import { Intelligence } from "./pages/Intelligence.jsx";
import { Combine } from "./pages/Combine.jsx";
import { PublicMoney } from "./pages/PublicMoney.jsx";
import { About } from "./pages/About.jsx";

const NAV = [
  ["overview", "Overview"], ["discover", "Discover Schemes"], ["eligibility", "My Eligibility"],
  ["compare", "Compare"], ["intel", "Scheme Intelligence"], ["combine", "Combination Engine"],
  ["money", "Public Money"], ["about", "About / Methodology"],
];

function Shell() {
  const { schemes: SCHEMES, status } = useCatalogue();
  const [tab, setTab] = useState("overview");
  const [schemeId, setSchemeId] = useState("pmegp");
  const [profile, setProfile] = useState(null);
  const [compare, setCompare] = useState([]);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [method, setMethod] = useState(false);

  const go = (t, id) => { if (id) setSchemeId(id); setTab(t); setMenu(false); window.scrollTo({ top: 0 }); };
  const toggleCompare = (id) => setCompare(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);

  const view = {
    overview: <Overview go={go} setQuery={setQuery} />,
    discover: <Discover go={go} profile={profile} compare={compare} toggleCompare={toggleCompare} query={query} setQuery={setQuery} />,
    eligibility: <Eligibility go={go} profile={profile} setProfile={setProfile} />,
    compare: <Compare compare={compare} toggleCompare={toggleCompare} go={go} />,
    intel: <Intelligence schemeId={schemeId} setSchemeId={setSchemeId} go={go} profile={profile} />,
    combine: <Combine compare={compare} />,
    money: <PublicMoney openMethod={() => setMethod(true)} />,
    about: <About openMethod={() => setMethod(true)} />,
  }[tab];

  const tickerTxt = SCHEMES.slice(0, 8).map(s => ` ${(s.short || "UNNAMED").toUpperCase()} · ${(s.level || "NOT REPORTED").toUpperCase()} · MAX ${s.maxBenefitL != null ? fmtL(s.maxBenefitL).toUpperCase() : "NOT REPORTED"} · VERIFIED ${(s.verified || "NOT REPORTED").toUpperCase()}  ▪ `).join("");

  return (
    <div className="s360">
      <div className="gridbg" aria-hidden="true" />
      <div className="wmk-layer" aria-hidden="true" />
      <div className="wmk-fixed" aria-hidden="true">Subsidy360 • Economics Project</div>

      <header className="strip">
        <div className="strip-in">
          <div className="logo" onClick={() => go("overview")} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && go("overview")}>
            <b>SUBSIDY<em>360</em></b><span>Prototype</span>
          </div>
          <nav className="nav-d" aria-label="Primary">
            {NAV.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => go(k)}>{l}</button>)}
          </nav>
          <button className="burger" onClick={() => setMenu(m => !m)} aria-label="Toggle menu" aria-expanded={menu}>{menu ? "✕" : "☰"}</button>
        </div>
      </header>
      {menu && (
        <nav className="nav-m" aria-label="Mobile">
          {NAV.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => go(k)}>{l}</button>)}
        </nav>
      )}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-in"><b>LIVE INDEX (DEMO)</b> ▪ {tickerTxt}<b>LIVE INDEX (DEMO)</b> ▪ {tickerTxt}</div>
      </div>

      <main className="shell"><CatalogueGate>{view}</CatalogueGate></main>

      <footer className="foot">
        <div className="shell" style={{ padding: 0, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="mono" style={{ letterSpacing: ".18em", color: "var(--muted)", fontSize: 11 }}>SUBSIDY360 • ECONOMICS PROJECT</div>
            <div style={{ marginTop: 6 }}>Prototype interface with clearly-labelled demonstration data. Not affiliated with the Government of India. Verify all details on official portals.</div>
          </div>
          <button className="btn ghost" onClick={() => setMethod(true)}>Data methodology</button>
        </div>
      </footer>

      {method && <MethodologyDrawer onClose={() => setMethod(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <CatalogueProvider>
      <Shell />
    </CatalogueProvider>
  );
}
