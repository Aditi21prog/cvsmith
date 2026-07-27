// pages/api/tailor.js

import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: { bodyParser: false },
};

/* =====================================================
   FORM PARSER
===================================================== */
function parseForm(req) {
  const form = formidable({ keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

/* =====================================================
   SAFE JSON PARSER (HARD FAIL IF INVALID)
===================================================== */
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const fixed = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

/* =====================================================
   ATS SCORE (REAL, TRANSPARENT)
===================================================== */
function computeATS(resumeText, keywords = []) {
  if (!keywords.length) return 0;
  const text = resumeText.toLowerCase();
  const hits = keywords.filter(k =>
    text.includes(k.toLowerCase())
  ).length;
  return Math.min(100, Math.round((hits / keywords.length) * 100));
}

/* =====================================================
   PROMPT — THIS IS THE CORE INTELLIGENCE
===================================================== */
/* =====================================================
   ROLE-SPECIFIC INSTRUCTIONS
===================================================== */
function getRoleInstructions(role) {
  const map = {

    /* ── FINANCE ── */
    audit: `
ROLE CONTEXT: Audit — Big4 / Internal Audit
- Lead bullets with audit-specific verbs: Audited, Assessed, Evaluated, Identified, Reported, Remediated
- Highlight: engagement types (statutory, internal, IFC, SOX), industries covered, team size, findings raised
- Skills to surface: Risk Assessment, IFC/ICFR, SOX, COSO, SAP, Data Analytics, Working Papers, Audit Planning
- Flag any CA / CPA / CIA / ACCA certification progress
- Summary must mention: domain (audit/risk), tools, client industries, any Big4 brand if present`,

    ib: `
ROLE CONTEXT: Investment Banking — Analyst / Associate
- Lead bullets with IB verbs: Modelled, Valued, Executed, Structured, Advised, Originated, Closed
- Highlight: deal size (₹ or $), transaction type (M&A, ECM, DCM, LBO, PE), client type, live vs pitch
- Skills to surface: Financial Modelling, DCF, LBO, Comparable Company Analysis, Pitch Books, Bloomberg, Capital IQ
- Include any CFA progress, MBA, or CPA
- Summary must mention: deal experience, sector focus, modelling depth`,

    /* ── ENGINEERING ── */
    swe: `
ROLE CONTEXT: Software Engineer — SDE 1 / SDE 2
- Lead bullets with engineering verbs: Built, Designed, Implemented, Optimised, Shipped, Migrated, Automated
- Quantify: latency reduction (ms/%), throughput (RPS/QPS), scale (users/DAU), uptime (%)
- Skills to surface: languages used, frameworks, databases, cloud (AWS/GCP/Azure), testing, CI/CD
- Highlight: system ownership, PR count or code review culture, on-call or production impact
- Summary: years of experience, primary stack, scale of systems worked on`,

    swe_senior: `
ROLE CONTEXT: Senior Software Engineer — SDE 3 / Staff
- Emphasise: technical leadership, architecture decisions, cross-team influence, mentoring
- Lead with: Architected, Led, Defined, Drove, Mentored, Reviewed, Scaled
- Quantify: team size mentored, services owned, incident reduction, reliability improvements
- Skills: system design, distributed systems, API design, observability (Datadog/Prometheus), leadership
- Summary: scope of impact (org-wide vs team), technical depth, leadership narrative`,

    data_eng: `
ROLE CONTEXT: Data Engineer — ETL / Pipelines / Warehouse
- Lead with: Built, Designed, Orchestrated, Ingested, Optimised, Automated, Migrated
- Quantify: data volume (GB/TB/PB), pipeline SLA (latency, freshness), cost savings
- Skills to surface: Spark, dbt, Airflow, Kafka, Flink, Snowflake, BigQuery, Redshift, Python, SQL
- Highlight: pipeline reliability, data quality frameworks, schema design, orchestration tooling
- Summary: data stack, scale, and business impact of pipelines built`,

    ml_eng: `
ROLE CONTEXT: ML / AI Engineer — Models & Infra
- Lead with: Trained, Fine-tuned, Deployed, Optimised, Evaluated, Served, Integrated
- Quantify: model accuracy (%), latency (ms), dataset size, throughput, A/B test lift
- Skills to surface: PyTorch, TensorFlow, Hugging Face, MLflow, Kubeflow, LLMs, RAG, vector DBs, Python
- Highlight: production deployment (not just notebooks), model monitoring, retraining pipelines
- Summary: ML domain (NLP/CV/RecSys/LLM), production scale, business outcome`,

    devops: `
ROLE CONTEXT: DevOps / Platform Engineer — CI/CD / Cloud
- Lead with: Automated, Reduced, Deployed, Migrated, Secured, Monitored, Provisioned
- Quantify: deployment frequency, MTTR reduction, cost savings ($), uptime (%), infra scale
- Skills to surface: Kubernetes, Docker, Terraform, Helm, GitHub Actions, Jenkins, AWS/GCP/Azure, Prometheus, Grafana
- Highlight: IaC coverage, SLO/SLA ownership, incident reduction, developer productivity gains
- Summary: cloud provider, infra scale, reliability engineering focus`,

    frontend: `
ROLE CONTEXT: Frontend Engineer — React / Web / UI
- Lead with: Built, Designed, Optimised, Migrated, Shipped, Implemented, Refactored
- Quantify: Core Web Vitals (LCP/CLS/FID), bundle size reduction, render time, accessibility score
- Skills to surface: React, Next.js, TypeScript, CSS/Tailwind, Webpack/Vite, Storybook, Jest, Cypress
- Highlight: design system contributions, cross-browser/device testing, performance wins
- Summary: UI complexity handled, component library ownership, collaboration with designers`,

    backend: `
ROLE CONTEXT: Backend Engineer — APIs / Systems
- Lead with: Designed, Built, Optimised, Scaled, Secured, Migrated, Refactored
- Quantify: API throughput (RPS), latency (p99 ms), DB query improvements, uptime (%)
- Skills to surface: Node.js/Go/Java/Python, REST/GraphQL, PostgreSQL/MySQL/MongoDB, Redis, Kafka, gRPC
- Highlight: API versioning, rate limiting, auth/authz, caching strategies, service reliability
- Summary: services owned, traffic scale, backend domain (payments/auth/infra/data)`,

    fullstack: `
ROLE CONTEXT: Full-Stack Engineer
- Balance frontend and backend bullets roughly equally
- Lead with: Built, Shipped, Owned, Integrated, Deployed, Designed
- Quantify: feature adoption, load time, API response time, user count
- Skills: React/Next.js + Node.js/Python, SQL/NoSQL, REST, cloud, CI/CD
- Highlight: end-to-end feature ownership, product thinking, cross-functional collaboration
- Summary: stack breadth, product impact, startup vs enterprise context`,

    mobile: `
ROLE CONTEXT: Mobile Engineer — iOS / Android / React Native
- Lead with: Built, Shipped, Optimised, Integrated, Migrated, Released
- Quantify: App Store rating, crash rate (%), app size reduction, render time, MAU/DAU
- Skills to surface: Swift/Kotlin/React Native/Flutter, Xcode/Android Studio, push notifications, offline support
- Highlight: release cadence, CI/CD for mobile (Fastlane/Bitrise), deep linking, analytics integration
- Summary: platform (iOS/Android/cross-platform), app category, production scale`,

    /* ── LEGAL ── */
    legal_fresher: `
ROLE CONTEXT: Law Graduate / LLB Fresher
- Lead with: Researched, Drafted, Assisted, Represented, Argued, Compiled, Analysed
- Highlight: moot court wins (rank/prize), internships (chamber name, firm name, HC/SC), legal aid, publications
- Skills to surface: Legal Research, Westlaw/SCC Online/Manupatra, Contract Drafting, Case Briefing, OSCOLA/Bluebook
- Mention: Bar enrolment status, any specialisation during LLB (corporate/criminal/IP/constitutional)
- Summary: law school, specialisation interest, internship exposure, advocacy or research strength`,

    legal_associate: `
ROLE CONTEXT: Associate — Law Firm / Litigation
- Lead with: Appeared, Drafted, Argued, Advised, Negotiated, Researched, Filed
- Highlight: courts appeared in (HC, SC, NCLT, NCLAT, SAT, Tribunal), matter count, practice area
- Quantify: number of matters handled, drafting volume (contracts/pleadings), client industry
- Skills: Litigation Strategy, Pleading Drafting, Contract Negotiation, Court Appearances, Legal Research
- Summary: practice area (commercial/criminal/arbitration), court exposure, client type`,

    legal_corp: `
ROLE CONTEXT: Corporate Counsel — In-House / M&A
- Lead with: Advised, Negotiated, Structured, Reviewed, Closed, Drafted, Led
- Highlight: deal value (₹ or $), transaction type (M&A, PE, JV, Share Purchase, Asset Deal), cross-border work
- Quantify: number of transactions closed, contracts reviewed per quarter, regulatory approvals obtained
- Skills: M&A, Due Diligence, SPA/SHA/NDA Drafting, FEMA, Companies Act, SEBI Regulations, Contract Management
- Summary: transaction experience, sectors covered, in-house vs law firm background`,

    legal_ip: `
ROLE CONTEXT: IP / Patents — Trademarks & Copyrights
- Lead with: Filed, Prosecuted, Advised, Drafted, Opposed, Registered, Enforced
- Highlight: filing count (patents/trademarks), jurisdictions (India/USPTO/EPO), opposition/cancellation wins
- Quantify: portfolio size managed, filings per year, enforcement actions taken
- Skills: Patent Prosecution, Trademark Filing, IP Due Diligence, Freedom to Operate, IP Licensing, Copyright Law
- Summary: IP domain (patents/trademarks/copyright/trade secrets), technical background if any (for patents)`,

    legal_compliance: `
ROLE CONTEXT: Compliance & Regulatory — SEBI / RBI / GDPR
- Lead with: Implemented, Monitored, Audited, Drafted, Advised, Reported, Trained
- Highlight: frameworks handled (SEBI LODR, RBI guidelines, GDPR, POSH, PMLA, Companies Act)
- Quantify: audits conducted, policies drafted, training sessions delivered, incidents resolved
- Skills: Regulatory Compliance, Risk Assessment, Policy Drafting, SEBI/RBI/MCA Filings, GDPR, AML/KYC
- Summary: regulatory domain, industry (BFSI/tech/manufacturing), in-house vs consulting background`,
  };

  return map[role] || `
ROLE CONTEXT: General Professional
- Use strong action verbs relevant to the domain
- Quantify impact wherever possible
- Align wording tightly with the job description provided`;
}

/* =====================================================
   PROMPT — THIS IS THE CORE INTELLIGENCE
===================================================== */
function buildPrompt(resumeText, jd, role) {
  const roleInstructions = getRoleInstructions(role);

  return `
You are an ENTERPRISE RESUME TAILORING ENGINE used by Big4, GRCS, law firms, and Fortune 500 ATS systems.

THIS IS A ZERO-TOLERANCE TASK.

──────────────── RULES ────────────────
- Output ONLY valid JSON
- NO markdown, NO explanations, NO filler
- DO NOT fabricate employers, education, dates, marks, ranks
- Preserve ALL factual data from the resume
- Aggressively optimize wording for ATS
- Integrate JD keywords naturally (not stuffing)
- Use strong action verbs
- Reorder content to maximize relevance

──────────────── OUTPUT SCHEMA ────────────────
{
  "meta": {
    "name": "",
    "title": "",
    "location": "",
    "email": "",
    "phone": "",
    "linkedin": "",
    "website": ""
  },
  "sections": [
    {
      "type": "summary",
      "items": []
    },
    {
      "type": "skills",
      "items": []
    },
    {
      "type": "experience",
      "items": [
        {
          "title": "",
          "company": "",
          "location": "",
          "start": "",
          "end": "",
          "bullets": []
        }
      ]
    },
    {
      "type": "education",
      "items": [
        {
          "degree": "",
          "institution": "",
          "start": "",
          "end": "",
          "marks": "",
          "details": []
        }
      ]
    }
  ],
  "ats": {
    "keywords": []
  }
}

──────────────── SUMMARY RULES ────────────────
- 2–4 bullets
- JD-first positioning
- Mention role, domain, tools, impact

──────────────── SKILLS RULES ────────────────
- Extract from BOTH resume and JD
- Prioritize JD keywords
- No soft fluff

──────────────── EXPERIENCE RULES ────────────────
- Rewrite EVERY bullet
- Format: Action Verb + What + How + Impact
- Quantify wherever possible
- Remove weak bullets

──────────────── EDUCATION RULES ────────────────
- Preserve exactly as in resume
- Do NOT rewrite marks or dates
- Do NOT compress Indian education

──────────────── ATS KEYWORDS ────────────────
- Extract 20–35 keywords from JD
- Store ONLY in ats.keywords[]

──────────────── ROLE-SPECIFIC INSTRUCTIONS ────────────────
${roleInstructions}

──────────────── INPUTS ────────────────
ROLE: ${role}

JOB DESCRIPTION:
${jd}

ORIGINAL RESUME:
${resumeText}

FINAL WARNING:
If resume is weak, IMPROVE WORDING — NOT FACTS.
Return ONLY valid JSON.
`;
}

/* =====================================================
   MAIN HANDLER
===================================================== */
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  try {
    const { fields, files } = await parseForm(req);
    const jd = fields.jd || "";
    const role = fields.role || "audit";

    let resumeText = "";

    /* -------- FILE INPUT -------- */
    if (files.resume) {
      const buffer = fs.readFileSync(files.resume.filepath);
      const mime = files.resume.mimetype || "";

      if (mime.includes("pdf")) {
        resumeText = (await pdfParse(buffer)).text || "";
      } else {
        resumeText = (await mammoth.extractRawText({ buffer })).value || "";
      }
    }

    if (!resumeText.trim())
      return res.status(400).json({ error: "Resume text empty" });

    if (!jd.trim())
      return res.status(400).json({ error: "Job description required" });

    /* -------- GEMINI -------- */
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    const prompt = buildPrompt(resumeText, jd, role);
    const result = await model.generateContent(prompt);

    const parsed = safeJsonParse(result.response.text());
    if (!parsed || !parsed.sections || !parsed.ats) {
      throw new Error("AI output invalid or incomplete");
    }

    /* -------- ATS SCORE -------- */
    parsed.ats.score = computeATS(
      resumeText + " " + jd,
      parsed.ats.keywords || []
    );

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("TAILOR ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
