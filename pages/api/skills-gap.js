// pages/api/skills-gap.js
// Called after payment verification — runs AI skills gap analysis.
// Reads the gap session saved by /api/save-gap-session.
// Uses Google Gemini for analysis.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGapSession } from "./save-gap-session";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  // ── 1. Load gap session ───────────────────────────────────────────────────
  let session;
  try {
    session = getGapSession(sessionId);
  } catch (err) {
    console.error("[skills-gap] getGapSession threw:", err);
    return res.status(500).json({ error: "Failed to retrieve session data." });
  }

  if (!session) {
    console.error("[skills-gap] Session not found for ID:", sessionId);
    return res.status(404).json({
      error: "Session not found or expired. Please restart the analysis.",
    });
  }

  const { resume, jd } = session;

  // ── 2. Validate session contents ──────────────────────────────────────────
  // This is the most common cause of identical results — empty/null data
  // reaches the AI and it hallucinates a generic response.
  if (!resume) {
    console.error("[skills-gap] Session has no resume. Session keys:", Object.keys(session));
    return res.status(400).json({
      error: "Resume data missing from session. Please regenerate your resume and try again.",
    });
  }

  if (!jd || !jd.trim()) {
    console.error("[skills-gap] Session has no JD. Session keys:", Object.keys(session));
    return res.status(400).json({
      error: "Job description missing from session. Please paste a JD and try again.",
    });
  }

  // ── 3. Build resume text ──────────────────────────────────────────────────
  const resumeText = extractResumeText(resume);

  if (!resumeText || resumeText.trim().length < 50) {
    console.error("[skills-gap] Resume text too short after extraction:", resumeText);
    return res.status(400).json({
      error: "Resume content appears empty. Please check your resume data.",
    });
  }

  if (jd.trim().length < 50) {
    console.error("[skills-gap] JD too short:", jd.trim().length, "chars");
    return res.status(400).json({
      error: "Job description is too short to analyze. Please paste the full JD.",
    });
  }

  // Log first 200 chars of each so you can verify in server logs
  console.log("[skills-gap] Resume preview:", resumeText.slice(0, 200));
  console.log("[skills-gap] JD preview:", jd.trim().slice(0, 200));

  // ── 4. Build prompt ───────────────────────────────────────────────────────
  const prompt = `You are an expert career coach and ATS specialist. Analyze the candidate's resume against the job description and produce a detailed, PERSONALIZED skills gap analysis.

IMPORTANT: Your response must be specific to THIS resume and THIS job description. Do not give generic skills — every gap must reference actual requirements from the JD and actual content from the resume.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jd.trim()}

Return ONLY a valid JSON object in this exact format (no markdown, no explanation, no preamble):
{
  "summary": "2-sentence overall assessment specific to this candidate and this role",
  "matched": ["skill1", "skill2", "skill3"],
  "gaps": [
    {
      "skill": "Exact skill name from the JD",
      "type": "missing",
      "urgency": "High",
      "why": "Why this specific skill matters for THIS role based on the JD, and what impact the gap has",
      "tip": "One concrete, actionable tip for how THIS candidate can demonstrate or acquire this skill",
      "resources": [
        { "title": "Resource name", "url": "https://...", "type": "Course" },
        { "title": "Resource name", "url": "https://...", "type": "Doc" }
      ]
    }
  ],
  "studyPlan": [
    "Week 1: Specific focus area targeting the highest-urgency gaps for this role",
    "Week 2: Specific focus area and actionable tasks",
    "Week 3: Specific focus area and actionable tasks",
    "Week 4: Specific focus area and review/practice"
  ]
}

Rules:
- "matched" must list skills explicitly or clearly demonstrated in the resume that the JD requires
- "type" must be "missing" (not in resume at all) or "weak" (mentioned but underdeveloped vs JD requirements)
- "urgency" must be "High", "Medium", or "Low" based on how prominently the JD emphasizes this skill
- Rank gaps by urgency descending
- Include 1-2 real, working resource URLs per gap (Coursera, YouTube, official docs, etc.)
- "resource type" options: Course, Video, Doc, Book, Practice
- Keep "why" to 1-2 sentences that directly reference the JD and the candidate's current level
- Keep "tip" to 1 actionable sentence specific to this candidate
- The studyPlan weeks must reference the actual gap skills identified, not generic advice
- Return ONLY the JSON object, nothing else — no \`\`\`json fences, no explanation`;

  // ── 5. Call Gemini ────────────────────────────────────────────────────────
  let raw;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    raw = result.response.text()?.trim();
  } catch (err) {
    console.error("[skills-gap] Gemini API error:", err);
    return res.status(500).json({
      error: "AI analysis failed. Please try again in a moment.",
    });
  }

  if (!raw) {
    console.error("[skills-gap] Gemini returned empty response");
    return res.status(500).json({ error: "Empty response from AI. Please try again." });
  }

  console.log("[skills-gap] Gemini raw response preview:", raw.slice(0, 300));

  // ── 6. Parse JSON safely ──────────────────────────────────────────────────
  let analysis;
  try {
    // Strip any accidental markdown fences Gemini may add despite instructions
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    analysis = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[skills-gap] JSON parse failed. Raw:", raw.slice(0, 500));
    return res.status(500).json({
      error: "Failed to parse AI response — please try again",
    });
  }

  // ── 7. Validate shape ─────────────────────────────────────────────────────
  if (
    !analysis.summary ||
    !Array.isArray(analysis.gaps) ||
    !Array.isArray(analysis.matched)
  ) {
    console.error("[skills-gap] Invalid analysis structure:", JSON.stringify(analysis).slice(0, 300));
    return res.status(500).json({
      error: "Invalid analysis structure — please try again",
    });
  }

  // Validate each gap has required fields, strip malformed ones
  analysis.gaps = analysis.gaps.filter((g) => {
    const valid = g.skill && g.type && g.urgency;
    if (!valid) console.warn("[skills-gap] Dropping malformed gap:", g);
    return valid;
  });

  console.log(
    `[skills-gap] Success — ${analysis.matched.length} matched, ${analysis.gaps.length} gaps for session ${sessionId}`
  );

  return res.status(200).json(analysis);
}

// ─── Helper: flatten resume object → readable text for the prompt ─────────────
// Handles both plain string resumes and structured resume objects.
function extractResumeText(resume) {
  if (typeof resume === "string") {
    return resume; // already plain text — ideal
  }

  if (!resume || typeof resume !== "object") {
    return "";
  }

  const lines = [];

  if (resume.name)  lines.push(`Name: ${resume.name}`);
  if (resume.email) lines.push(`Email: ${resume.email}`);
  if (resume.phone) lines.push(`Phone: ${resume.phone}`);
  if (resume.title) lines.push(`Title: ${resume.title}`);
  if (resume.location) lines.push(`Location: ${resume.location}`);

  if (resume.summary) {
    lines.push(`\nProfessional Summary:\n${resume.summary}`);
  }

  if (resume.experience?.length) {
    lines.push("\nWork Experience:");
    resume.experience.forEach((exp) => {
      lines.push(
        `- ${exp.role || exp.title || "Role"} at ${exp.company || "Company"} (${exp.duration || exp.dates || ""})`
      );
      if (exp.description) lines.push(`  ${exp.description}`);
      exp.bullets?.forEach((b) => lines.push(`  • ${b}`));
      exp.responsibilities?.forEach((b) => lines.push(`  • ${b}`));
      exp.achievements?.forEach((b) => lines.push(`  • ${b}`));
    });
  }

  if (resume.education?.length) {
    lines.push("\nEducation:");
    resume.education.forEach((ed) => {
      lines.push(
        `- ${ed.degree || ed.qualification || ""} from ${ed.institution || ed.school || ""} (${ed.year || ed.graduationYear || ""})`
      );
      if (ed.gpa) lines.push(`  GPA: ${ed.gpa}`);
    });
  }

  if (resume.skills?.length) {
    const skillsList = Array.isArray(resume.skills)
      ? resume.skills.join(", ")
      : resume.skills;
    lines.push(`\nSkills: ${skillsList}`);
  }

  if (resume.technicalSkills?.length) {
    lines.push(`\nTechnical Skills: ${resume.technicalSkills.join(", ")}`);
  }

  if (resume.softSkills?.length) {
    lines.push(`\nSoft Skills: ${resume.softSkills.join(", ")}`);
  }

  if (resume.certifications?.length) {
    const certs = Array.isArray(resume.certifications)
      ? resume.certifications.join(", ")
      : resume.certifications;
    lines.push(`\nCertifications: ${certs}`);
  }

  if (resume.projects?.length) {
    lines.push("\nProjects:");
    resume.projects.forEach((p) => {
      lines.push(`- ${p.name || p.title || "Project"}: ${p.description || ""}`);
      if (p.technologies) lines.push(`  Technologies: ${p.technologies}`);
      if (p.tech) lines.push(`  Technologies: ${Array.isArray(p.tech) ? p.tech.join(", ") : p.tech}`);
    });
  }

  if (resume.languages?.length) {
    lines.push(`\nLanguages: ${resume.languages.join(", ")}`);
  }

  if (resume.awards?.length) {
    lines.push(`\nAwards/Recognition: ${resume.awards.join(", ")}`);
  }

  const result = lines.join("\n");

  // If we got very little after extraction, fall back to raw JSON
  // so the AI has something to work with rather than an empty prompt
  if (result.trim().length < 100) {
    console.warn("[skills-gap] extractResumeText produced short output, falling back to JSON");
    return JSON.stringify(resume, null, 2);
  }

  return result;
}