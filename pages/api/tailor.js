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
function buildPrompt(resumeText, jd, role) {
  return `
You are an ENTERPRISE RESUME TAILORING ENGINE used by Big4, GRCS, and Fortune 500 ATS systems.

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
- Use audit / risk / GRCS language where relevant
- Quantify wherever possible
- Remove weak bullets

──────────────── EDUCATION RULES ────────────────
- Preserve exactly as in resume
- Do NOT rewrite marks or dates
- Do NOT compress Indian education

──────────────── ATS KEYWORDS ────────────────
- Extract 20–35 keywords from JD
- Store ONLY in ats.keywords[]

ROLE:
${role}

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
