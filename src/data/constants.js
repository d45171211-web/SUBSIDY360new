/* Subsidy360 — shared taxonomy used by filters, the wizard and matching. */

export const STATES = ["Andhra Pradesh","Bihar","Delhi","Gujarat","Karnataka","Madhya Pradesh","Maharashtra","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal","Other"];
export const APPLICANTS = [
  { id: "farmer", label: "Farmer" }, { id: "entrepreneur", label: "Entrepreneur / Startup" },
  { id: "msme", label: "MSME" }, { id: "household", label: "Household / Individual" },
  { id: "shg", label: "SHG / FPO" }, { id: "student", label: "Student" },
];
export const SUPPORT_CATEGORIES = [
  { id: "solar-renewable-energy", num: "01", label: "Solar & Renewable Energy", desc: "Solar panels, renewable energy and clean-energy projects" },
  { id: "health-medical", num: "02", label: "Health & Medical", desc: "Healthcare, medical assistance and treatment" },
  { id: "agriculture-farmers", num: "03", label: "Agriculture & Farmers", desc: "Crop support, farming assistance and agricultural schemes" },
  { id: "farm-machinery", num: "04", label: "Farm Machinery", desc: "Agricultural equipment and mechanisation" },
  { id: "water-irrigation", num: "05", label: "Water & Irrigation", desc: "Irrigation, water conservation and water infrastructure" },
  { id: "housing", num: "06", label: "Housing", desc: "Affordable housing and home assistance" },
  { id: "education-scholarships", num: "07", label: "Education & Scholarships", desc: "Education funding, scholarships and student support" },
  { id: "women-girl-child", num: "08", label: "Women & Girl Child", desc: "Women’s empowerment and girl-child support" },
  { id: "child-family-welfare", num: "09", label: "Child & Family Welfare", desc: "Child welfare, family support and related benefits" },
  { id: "employment-skill-development", num: "10", label: "Employment & Skill Development", desc: "Training, employability and workforce development" },
  { id: "msme-business", num: "11", label: "MSME & Business", desc: "Micro, small and medium enterprises" },
  { id: "startup-entrepreneurship", num: "12", label: "Startup & Entrepreneurship", desc: "Startup development and entrepreneurship support" },
  { id: "small-business-self-employment", num: "13", label: "Small Business & Self-Employment", desc: "Self-employment and small-business assistance" },
  { id: "animal-husbandry-dairy", num: "14", label: "Animal Husbandry & Dairy", desc: "Livestock, dairy and animal-care support" },
  { id: "fisheries", num: "15", label: "Fisheries", desc: "Fisherfolk, aquaculture and fisheries development" },
  { id: "textile-handicrafts", num: "16", label: "Textile & Handicrafts", desc: "Textiles, handlooms, crafts and artisans" },
  { id: "infrastructure", num: "17", label: "Infrastructure", desc: "Infrastructure development and related projects" },
  { id: "electricity-energy", num: "18", label: "Electricity & Energy", desc: "Electricity access, energy efficiency and power support" },
  { id: "electric-vehicles", num: "19", label: "Electric Vehicles", desc: "Electric mobility and EV-related incentives" },
  { id: "transport-mobility", num: "20", label: "Transport & Mobility", desc: "Transport services and mobility support" },
  { id: "rural-development", num: "21", label: "Rural Development", desc: "Rural livelihoods and village development" },
  { id: "urban-development", num: "22", label: "Urban Development", desc: "Urban services, infrastructure and city development" },
  { id: "disability-support", num: "23", label: "Disability Support", desc: "Support for persons with disabilities" },
  { id: "senior-citizen-support", num: "24", label: "Senior Citizen Support", desc: "Pensions, care and senior-citizen assistance" },
  { id: "financial-inclusion", num: "25", label: "Financial Inclusion", desc: "Banking access and financial inclusion" },
  { id: "sc-st-social-welfare", num: "26", label: "SC/ST & Social Welfare", desc: "Social welfare and support for eligible communities" },
  { id: "manufacturing-industry", num: "27", label: "Manufacturing & Industry", desc: "Industrial development and manufacturing" },
  { id: "environment-climate", num: "28", label: "Environment & Climate", desc: "Environmental protection and climate action" },
  { id: "horticulture-allied-agriculture", num: "29", label: "Horticulture & Allied Agriculture", desc: "Fruits, vegetables, floriculture and allied activities" },
  { id: "food-consumer-support", num: "30", label: "Food & Consumer Support", desc: "Food security and consumer assistance" },
  { id: "interest-loan-subsidies", num: "31", label: "Interest/Loan Subsidies", desc: "Interest subvention and eligible financing support" },
  { id: "export-trade-support", num: "32", label: "Export & Trade Support", desc: "Export promotion and international trade assistance" },
  { id: "cooperative-sector", num: "33", label: "Cooperative Sector", desc: "Cooperative societies and member support" },
  { id: "digital-technology", num: "34", label: "Digital & Technology", desc: "Digital adoption, technology and innovation" },
];
export const SECTORS = SUPPORT_CATEGORIES;
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
