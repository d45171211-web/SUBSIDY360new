import { Drawer } from "./Drawer.jsx";

export function MethodologyDrawer({ onClose }) {
  return (
    <Drawer onClose={onClose} title="Data methodology">
      <h2 className="sec" style={{ marginBottom: 14 }}>Subsidy360 does not invent missing information.</h2>
      {[
        ["✓ Official source", "The scheme record points to an official government portal or notification. The badge indicates traceability, not endorsement."],
        ["◷ Last verified", "The month the prototype record was last checked against its source. Older stamps mean higher staleness risk."],
        ["! Not reported", "The underlying source does not state this figure. Subsidy360 shows “Not reported” instead of a guessed number."],
        ["DEMO DATA", "This prototype uses clearly-labelled demonstration values to illustrate the interface. They are not official government statistics."],
      ].map(([k, v]) => (
        <div key={k} style={{ marginBottom: 16 }}>
          <div className="mono" style={{ color: "var(--cy)", fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{k}</div>
          <div style={{ fontSize: 13.5, color: "var(--muted)" }}>{v}</div>
        </div>
      ))}
      <hr className="hr" style={{ margin: "18px 0" }} />
      <div style={{ fontSize: 13, color: "var(--muted)" }}>
        Budget figures distinguish <b style={{ color: "var(--txt)" }}>BE</b> (Budget Estimate), <b style={{ color: "var(--txt)" }}>RE</b> (Revised Estimate) and <b style={{ color: "var(--txt)" }}>Actual</b> expenditure. An allocation is never restated as “sanctioned”, “released” or “utilised” unless the source reports those figures. Match scores are informational only — never an official eligibility decision.
      </div>
    </Drawer>
  );
}
