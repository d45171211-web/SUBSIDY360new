import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { BUDGET_TREND, SECTOR_SPLIT } from "../data/publicMoney.js";
import { useCatalogue } from "../context/CatalogueContext.jsx";
import { DemoTag } from "../components/DemoTag.jsx";

export function PublicMoney({ openMethod }) {
  const { schemes: SCHEMES, budget, facets } = useCatalogue();
  // Prefer figures from the budget connector; fall back to what each record states.
  const withAlloc = SCHEMES
    .map(s => ({ s, a: budget.bySchemeId.get(s.id) || s.allocationCr }))
    .filter(x => x.a && x.a.be != null)
    .sort((x, y) => y.a.be - x.a.be)
    .slice(0, 25);
  const trend = budget.trend.length ? budget.trend : BUDGET_TREND;
  const split = budget.sectorSplit.length ? budget.sectorSplit : SECTOR_SPLIT;
  const byMinistry = [...facets.ministries].slice(0, 8);
  return (
    <div className="fadein" style={{ padding: "34px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "baseline" }}>
        <div>
          <div className="eyebrow gold" style={{ marginBottom: 10 }}>Public Money</div>
          <h2 className="sec">Where scheme money is budgeted</h2>
        </div>
        <button className="btn ghost" onClick={openMethod}>Data methodology →</button>
      </div>
      <p className="sub" style={{ fontSize: 13.5, margin: "8px 0 8px" }}>
        BE = Budget Estimate · RE = Revised Estimate · Actual = actual expenditure. An allocation is never restated as sanctioned, released or utilised unless the source reports it.
      </p>
      <div style={{ marginBottom: 20 }}><DemoTag /> <span style={{ fontSize: 11.5, color: "var(--muted2)" }}>All figures on this page are demonstration values for the prototype interface.</span></div>

      <div className="grid-cards" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        <div className="panel" style={{ padding: 20 }}>
          <div className="tt" style={{ marginBottom: 4 }}>BE by scheme, FY 2025-26 (₹ crore) — prototype set</div>
          <div style={{ height: 280, marginTop: 10 }}>
            <ResponsiveContainer>
              <BarChart data={withAlloc.map(({ s, a }) => ({ n: s.short, BE: a.be }))} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#1D3050" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#5F6F8E", fontSize: 10.5 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="n" width={110} tick={{ fill: "#8496B4", fontSize: 10.5, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#1D3050" }} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0E1B33", border: "1px solid #28406B", borderRadius: 4, fontSize: 12 }} formatter={v => [`₹${v.toLocaleString("en-IN")} Cr`, "BE 2025-26"]} cursor={{ fill: "rgba(216,169,69,.06)" }} />
                <Bar dataKey="BE" fill="#D8A945" radius={[0, 2, 2, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted2)", marginTop: 8 }}>RE and Actuals for FY 2025-26: <span className="badge b-nr">! Not reported</span></div>
        </div>

        <div className="panel" style={{ padding: 20 }}>
          <div className="tt" style={{ marginBottom: 4 }}>Where the money goes — sector split of listed BE</div>
          <div style={{ height: 240, marginTop: 6 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={split} dataKey="v" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={2} stroke="#0A1428">
                  {split.map(e => <Cell key={e.name} fill={e.c} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0E1B33", border: "1px solid #28406B", borderRadius: 4, fontSize: 12 }} formatter={v => `₹${v.toLocaleString("en-IN")} Cr`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {split.map(e => (
              <div key={e.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--muted)" }}><span style={{ display: "inline-block", width: 9, height: 9, background: e.c, borderRadius: 2, marginRight: 8 }} />{e.name}</span>
                <span className="mono" style={{ color: "var(--txt)" }}>₹{e.v.toLocaleString("en-IN")} Cr</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 20, marginTop: 14 }}>
        <div className="tt" style={{ marginBottom: 10 }}>Where the money goes — schemes indexed per department</div>
        {byMinistry.map(m => (
          <div key={m.value} className="kv">
            <span className="k" style={{ fontSize: 12.5 }}>{m.label}</span>
            <span className="v mono" style={{ fontSize: 12, color: "var(--cy)" }}>{m.n} scheme{m.n === 1 ? "" : "s"}</span>
          </div>
        ))}
        <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--muted2)" }}>
          Department allocations load from budget packs; where a pack does not report a department total it stays <span className="badge b-nr">! Not reported</span> rather than being derived from scheme figures.
        </div>
      </div>

      <div className="panel" style={{ padding: 20, marginTop: 14 }}>
        <div className="tt" style={{ marginBottom: 4 }}>Scheme-basket trend — BE vs RE vs Actual (₹ '000 crore)</div>
        <p style={{ fontSize: 11.5, color: "var(--muted2)", marginBottom: 10 }}>Lines stop where the underlying figure is not yet reported — gaps are honest, not missing data errors.</p>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={trend} margin={{ top: 6, right: 18, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#1D3050" strokeDasharray="3 3" />
              <XAxis dataKey="fy" tick={{ fill: "#8496B4", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#1D3050" }} tickLine={false} />
              <YAxis tick={{ fill: "#5F6F8E", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0E1B33", border: "1px solid #28406B", borderRadius: 4, fontSize: 12 }} formatter={(v, n) => [v == null ? "Not reported" : `₹${v}k Cr`, n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="be" name="BE" stroke="#D8A945" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
              <Line type="monotone" dataKey="re" name="RE" stroke="#3BC9E8" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#17C787" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
          {trend.filter(t => t.actual != null).map(t => (
            <div key={t.fy} style={{ fontSize: 12, color: "var(--muted)" }}>
              FY {t.fy} utilisation vs BE: <span className="mono" style={{ color: "var(--em)", fontWeight: 600 }}>{Math.round((t.actual / t.be) * 100)}%</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: "var(--muted2)" }}>Utilisation shown only where Actuals exist.</div>
        </div>
      </div>
    </div>
  );
}
