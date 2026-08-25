export const SYNONYMS = {
  solar: ["energy"], rooftop: ["energy"], house: ["household"], home: ["household"],
  farmer: ["agriculture"], farm: ["agriculture"], crop: ["agriculture"], kisan: ["agriculture"],
  machinery: ["manufacturing"], factory: ["manufacturing"], msme: ["manufacturing", "services"],
  startup: ["manufacturing", "services"], funding: ["manufacturing", "services"],
  food: ["food-processing"], insurance: ["agriculture"], loan: [],
};

export function searchSchemes(q, schemes = [], index = null) {
  const terms = q.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
  if (!terms.length) return [];
  // At 4,700+ records the token index narrows the candidate set before scoring.
  const candidates = index
    ? (() => {
        const ids = new Set();
        for (const t of terms) for (const id of index.get(t) || []) ids.add(id);
        const subset = schemes.filter(s => ids.has(s.id));
        return subset.length ? subset : schemes;
      })()
    : schemes;
  return candidates.map(s => {
    const hay = `${s.name} ${s.short} ${s.dept} ${s.sectorLabel} ${s.benefit} ${s.benefitType} ${s.level} ${Array.isArray(s.states) ? s.states.join(" ") : "india national central"}`.toLowerCase();
    const why = [];
    let score = 0;
    terms.forEach(t => {
      if (hay.includes(t)) { score += 2; why.push(`matches “${t}”`); }
      (SYNONYMS[t] || []).forEach(sec => { if (s.sectors.includes(sec)) { score += 1.5; why.push(`sector: ${sec.replace("-", " ")} (from “${t}”)`); } });
    });
    return { s, score, why: [...new Set(why)] };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
}
