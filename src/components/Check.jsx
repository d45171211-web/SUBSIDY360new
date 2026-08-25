export function Check({ c }) {
  const sym = c.state === "ok" ? "✓" : c.state === "warn" ? "⚠" : "—";
  const cls = c.state === "ok" ? "check-ok" : c.state === "warn" ? "check-warn" : "check-na";
  return (
    <div className="kv">
      <span className="k mono" style={{ fontSize: 12 }}>{c.k}</span>
      <span className="v" style={{ fontSize: 12.5 }}>
        <span className={cls} style={{ marginRight: 8 }}>{sym}</span>
        <span style={{ color: c.state === "na" ? "var(--muted2)" : "var(--txt)" }}>{c.note}</span>
      </span>
    </div>
  );
}
