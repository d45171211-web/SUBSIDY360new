export function Drawer({ onClose, children, title }) {
  return (
    <div className="drawer-bg" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span className="eyebrow">{title}</span>
          <button className="btn sec" style={{ padding: "5px 12px" }} onClick={onClose}>Close ✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
