import React from "react";

// ─── Role definitions ──────────────────────────────────────────────────────
const ROLE_GROUPS = [
  {
    group: "Finance",
    roles: [
      { value: "audit",   label: "Audit — Big4 / Internal Audit" },
      { value: "ib",      label: "Investment Banking — Analyst / Associate" },
    ],
  },
  {
    group: "Legal",
    roles: [
      { value: "legal_fresher",  label: "Law Graduate / LLB Fresher" },
      { value: "legal_associate", label: "Associate — Law Firm / Litigation" },
      { value: "legal_corp",     label: "Corporate Counsel — In-House / M&A" },
      { value: "legal_ip",       label: "IP / Patents — Trademarks & Copyrights" },
      { value: "legal_compliance", label: "Compliance & Regulatory — SEBI / RBI / GDPR" },
    ],
  },
  {
    group: "Engineering",
    roles: [
      { value: "swe",     label: "Software Engineer — SDE 1 / SDE 2" },
      { value: "swe_senior", label: "Senior Software Engineer — SDE 3 / Staff" },
      { value: "data_eng",   label: "Data Engineer — ETL / Pipelines / Warehouse" },
      { value: "ml_eng",     label: "ML / AI Engineer — Models & Infra" },
      { value: "devops",     label: "DevOps / Platform Engineer — CI/CD / Cloud" },
      { value: "frontend",   label: "Frontend Engineer — React / Web / UI" },
      { value: "backend",    label: "Backend Engineer — APIs / Systems" },
      { value: "fullstack",  label: "Full-Stack Engineer" },
      { value: "mobile",     label: "Mobile Engineer — iOS / Android / React Native" },
    ],
  },
];

// ─── Role-specific tips ────────────────────────────────────────────────────
const TIPS = {
  audit:      "Include any certification progress (CA, CPA, CIA) and engagement types handled.",
  ib:         "For IB roles, include deal size, valuation methodology, and any live transaction experience.",
  legal_fresher:    "Highlight moot court wins, internships (chambers/firm), publications, and any Bar enrolment status.",
  legal_associate:  "Mention practice areas, courts appeared in, number of matters handled, and drafting experience (contracts, pleadings).",
  legal_corp:       "Include deal value, transaction types (M&A, PE, JV), and any cross-border or regulatory work.",
  legal_ip:         "List filings (patent/trademark applications), jurisdictions covered, and any litigation or opposition work.",
  legal_compliance: "Mention regulatory frameworks handled (SEBI, RBI, GDPR, POSH), audits conducted, and policy drafting.",
  swe:        "Quantify impact — latency improvements, scale (users/RPS), and system scope.",
  swe_senior: "Highlight cross-team scope, technical leadership, and hiring/mentoring.",
  data_eng:   "Mention data volume (TB/PB), tools (Spark, dbt, Airflow), and pipeline SLAs.",
  ml_eng:     "Include model type, accuracy gains, dataset scale, and production deployment details.",
  devops:     "Highlight uptime improvements, deployment frequency, and cloud cost savings.",
  frontend:   "Mention Core Web Vitals wins, accessibility work, and design-system contributions.",
  backend:    "Show API throughput, latency, DB optimisation, and service reliability numbers.",
  fullstack:  "Balance frontend and backend bullets; mention end-to-end ownership of features.",
  mobile:     "Include App Store ratings, crash-rate improvements, and release cadence.",
};

export default function Step3Role({ role, onChange }) {
  const tip = TIPS[role] ?? "";

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 3 — Choose Role</h2>

      <label className="block text-sm font-medium mb-2">Select a role</label>

      <select
        value={role}
        onChange={(e) => onChange(e.target.value)}
        className="p-3 border rounded-md w-full max-w-sm bg-white"
      >
        {ROLE_GROUPS.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {tip && (
        <p className="text-gray-600 text-sm mt-3">
          💡 {tip}
        </p>
      )}
    </div>
  );
}
