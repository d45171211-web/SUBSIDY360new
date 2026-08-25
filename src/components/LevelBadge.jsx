export const LevelBadge = ({ level }) => <span className={`badge ${level === "Central" ? "b-central" : "b-state"}`}>{level}</span>;
