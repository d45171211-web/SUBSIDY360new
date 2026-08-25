/* Subsidy360 — shared taxonomy used by filters, the wizard and matching. */

export const STATES = ["Andhra Pradesh","Bihar","Delhi","Gujarat","Karnataka","Madhya Pradesh","Maharashtra","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal","Other"];
export const APPLICANTS = [
  { id: "farmer", label: "Farmer" }, { id: "entrepreneur", label: "Entrepreneur / Startup" },
  { id: "msme", label: "MSME" }, { id: "household", label: "Household / Individual" },
  { id: "shg", label: "SHG / FPO" }, { id: "student", label: "Student" },
];
export const SECTORS = [
  { id: "agriculture", label: "Agriculture" }, { id: "manufacturing", label: "Manufacturing" },
  { id: "services", label: "Services" }, { id: "food-processing", label: "Food Processing" },
  { id: "energy", label: "Solar / Energy" }, { id: "trading", label: "Trading" },
  { id: "household", label: "Household" },
];
export const INCOME_BANDS = [
  { id: "u3", label: "Below ₹3 lakh / yr" }, { id: "u8", label: "₹3–8 lakh / yr" },
  { id: "u18", label: "₹8–18 lakh / yr" }, { id: "a18", label: "Above ₹18 lakh / yr" },
  { id: "na", label: "Prefer not to say" },
];
export const INVEST_BANDS = [
  { id: 0, label: "No investment / relief only", v: 0 },
  { id: 1, label: "Under ₹5 lakh", v: 4 },
  { id: 2, label: "₹5–25 lakh", v: 15 },
  { id: 3, label: "₹25 lakh – ₹1 crore", v: 60 },
  { id: 4, label: "Above ₹1 crore", v: 250 },
];
