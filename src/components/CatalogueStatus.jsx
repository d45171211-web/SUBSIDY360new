/* Source-provenance strip. Uses existing tokens only — no new visual language. */
import { useCatalogue } from "../context/CatalogueContext.jsx";

export function CatalogueStatus() {
  const { sources, problems, stats, status } = useCatalogue();
  if (status !== "ready") return null;
  return (
    <div className="panel" style={{ padding: 18, marginTop: 14 }}>
      <div className="tt" style={{ marginBottom: 10 }}>Catalogue sources</div>
      {sources.map((s) => (
        <div key={s.id} className="kv">
          <span className="k" style={{ fontSize: 12.5 }}>{s.label}</span>
          <span className="v mono" style={{ fontSize: 12 }}>
            {s.status === "loaded"
              ? <><span style={{ color: "var(--em)" }}>{s.count.toLocaleString("en-IN")}</span> <span style={{ color: "var(--muted2)" }}>records</span></>
              : <span style={{ color: "var(--amber)" }}>unavailable</span>}
          </span>
        </div>
      ))}
      <div className="kv">
        <span className="k" style={{ fontSize: 12.5 }}>Fields marked “Not reported”</span>
        <span className="v mono" style={{ fontSize: 12, color: "var(--amber)" }}>{stats.notReportedFields.toLocaleString("en-IN")}</span>
      </div>
      {problems.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--muted2)" }}>
          {problems.slice(0, 3).map((p, i) => <div key={i}>⚠ {p.source}: {p.message}</div>)}
        </div>
      )}
    </div>
  );
}
