import { useCountUp } from "./useCountUp.js";
import { DemoTag } from "./DemoTag.jsx";

export function StatCard({ label, value, suffix, prefix, decimals = 0, sub }) {
  const v = useCountUp(value);
  return (
    <div className="panel" style={{ padding: "16px 16px 14px" }}>
      <div className="tt" style={{ marginBottom: 8 }}>{label}</div>
      <div className="mono" style={{ fontSize: "clamp(20px,2.4vw,27px)", fontWeight: 600, color: "var(--paper)" }}>
        {prefix}{v.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 9, gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "var(--muted2)" }}>{sub}</span>
        <DemoTag />
      </div>
    </div>
  );
}
