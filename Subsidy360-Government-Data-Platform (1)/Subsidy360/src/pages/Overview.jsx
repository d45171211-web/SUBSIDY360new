import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCatalogue } from "../context/CatalogueContext.jsx";
import { CatalogueStatus } from "../components/CatalogueStatus.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { DemoTag } from "../components/DemoTag.jsx";
import { SchemeCard } from "../components/SchemeCard.jsx";

export function Overview({ go, setQuery }) {
  const { schemes: SCHEMES, stats } = useCatalogue();
  const [q, setQ] = useState("");
  const submit = () => { if (q.trim()) { setQuery(q.trim()); go("discover"); } };
  const central = stats.central;
  const alloc = stats.allocationCr;
  return (
    <div className="fadein">
      <section style={{ padding: "58px 0 40px" }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>India · Government Scheme Intelligence · Prototype</div>
        <h1 className="hero">SUBSIDY<span style={{ color: "var(--cy)" }}>360</span></h1>
        <div className="mono" style={{ color: "var(--gold)", letterSpacing: ".18em", fontSize: 13, margin: "14px 0 16px", textTransform: "uppercase" }}>
          Discover · Qualify · Compare · Understand
        </div>
        <p className="sub" style={{ fontSize: 16 }}>
          An evidence-first interface for navigating India's government schemes, eligibility and public funding.
        </p>
        <div style={{ maxWidth: 720, marginTop: 28 }}>
          <div className="searchbar">
            <span className="mono" style={{ color: "var(--cy)", fontSize: 14 }}>⌕</span>
            <input
              placeholder="Search schemes, departments, sectors or benefits…"
              value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              aria-label="Search schemes"
            />
            <button className="btn pri" onClick={submit}>Search</button>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
            {["Solar subsidy for my house", "MSME machinery subsidy in Gujarat", "Farmer schemes", "Startup funding", "Food processing subsidy"].map(x => (
              <button key={x} className="chip" onClick={() => { setQuery(x); go("discover"); }}>{x}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
          <button className="btn pri" onClick={() => go("eligibility")}>Find schemes for me →</button>
          <button className="btn sec" onClick={() => go("money")}>View public money</button>
        </div>
      </section>

      <section style={{ marginBottom: 44 }}>
        <div className="grid-stats">
          <StatCard label="SCHEMES INDEXED" value={stats.total} sub="live catalogue" />
          <StatCard label="CENTRAL SCHEMES" value={central} sub="ministry-run" />
          <StatCard label="STATE SCHEMES" value={stats.state} sub="state portal packs" />
          <StatCard label="REPORTED ALLOCATION" value={alloc / 1000} decimals={1} prefix="₹" suffix="k Cr" sub="sum of listed BE, FY 2025-26" />
          <StatCard label="VERIFIED SOURCES" value={stats.withSource} sub="official portal linked" />
        </div>
        <CatalogueStatus />
      </section>

      <section style={{ marginBottom: 50 }}>
        <div className="two-col">
          <div className="panel" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <h2 className="sec">Discovery signals</h2>
              <DemoTag />
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "8px 0 16px" }}>
              Most-explored scheme families in the prototype index, by popularity weighting.
            </p>
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={[...SCHEMES].sort((a, b) => b.popularity - a.popularity).slice(0, 6).map(s => ({ n: s.short, v: s.popularity }))} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#1D3050" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="n" tick={{ fill: "#8496B4", fontSize: 10.5, fontFamily: "IBM Plex Mono" }} interval={0} angle={-14} dy={8} height={44} axisLine={{ stroke: "#1D3050" }} tickLine={false} />
                  <YAxis tick={{ fill: "#5F6F8E", fontSize: 10.5 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0E1B33", border: "1px solid #28406B", borderRadius: 4, fontSize: 12 }} labelStyle={{ color: "#DCE4F2" }} cursor={{ fill: "rgba(59,201,232,.06)" }} />
                  <Bar dataKey="v" name="Interest index" fill="#3BC9E8" radius={[2, 2, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="panel lt" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="eyebrow" style={{ color: "var(--emD)" }}>Guided path</span>
            <h2 className="sec" style={{ color: "var(--ink)" }}>Not sure where to start?</h2>
            <p style={{ color: "var(--ink2)", fontSize: 13.5 }}>
              Answer a short profile — state, applicant type, sector, income band and project size — and Subsidy360 ranks every indexed scheme against your answers with a transparent breakdown.
            </p>
            {["Location & applicant screening", "Investment-range fit", "Loan requirement check", "Reason-coded match analysis"].map((x, i) => (
              <div key={x} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "var(--ink)" }}>
                <span className="mono" style={{ color: "var(--emD)", fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</span>{x}
              </div>
            ))}
            <button className="btn pri" style={{ marginTop: "auto", alignSelf: "flex-start" }} onClick={() => go("eligibility")}>Start eligibility check →</button>
          </div>
        </div>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <h2 className="sec">High-interest schemes</h2>
          <button className="btn ghost" onClick={() => go("discover")}>Open full explorer →</button>
        </div>
        <div className="grid-cards">
          {[...SCHEMES].sort((a, b) => b.popularity - a.popularity).slice(0, 4).map(s => (
            <SchemeCard key={s.id} s={s} onOpen={(id) => go("intel", id)} onCompare={() => go("compare")} />
          ))}
        </div>
      </section>
    </div>
  );
}
