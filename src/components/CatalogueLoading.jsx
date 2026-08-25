/* Loading + empty states, written in the interface's own voice. */
import { useCatalogue } from "../context/CatalogueContext.jsx";

export function CatalogueGate({ children }) {
  const { status, problems } = useCatalogue();
  if (status === "ready") return children;
  return (
    <div className="shell" style={{ padding: "80px 20px", maxWidth: 620 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        {status === "error" ? "Catalogue unavailable" : "Loading catalogue"}
      </div>
      <h2 className="sec" style={{ marginBottom: 10 }}>
        {status === "error" ? "The scheme catalogue could not be built." : "Indexing schemes, sources and budget packs…"}
      </h2>
      <div className="progress" style={{ maxWidth: 320 }}><i style={{ width: status === "error" ? "100%" : "62%" }} /></div>
      {status === "error" && (
        <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 14 }}>
          {problems[0]?.message} — check that /public/data/manifest.json exists and lists valid packs, then reload.
        </p>
      )}
    </div>
  );
}
