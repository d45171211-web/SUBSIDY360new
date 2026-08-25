import { APPLICANTS } from "../data/constants.js";

export const fmtL = (l) => l == null ? "Not reported" : l >= 100 ? `₹${(l / 100).toFixed(l % 100 ? 2 : 0)} Cr` : `₹${l % 1 ? l.toFixed(2) : l} lakh`;
export const fmtCr = (c) => c == null ? "Not reported" : `₹${c.toLocaleString("en-IN")} Cr`;
export const appLabel = (id) => (APPLICANTS.find(a => a.id === id) || { label: id }).label;
