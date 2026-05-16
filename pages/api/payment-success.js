/**
 * pages/api/payment-success.js
 *
 * Called after payment is verified. Streams the resume download to the browser.
 *
 * FIX: previously ignored session.templateStyle, so every download produced
 * a Premium PDF regardless of which template the user selected. Now the
 * templateStyle stored in the session is passed through to both the PDF
 * and DOCX generators.
 */

import { resumeStore }  from "../../lib/resumeStore";
import { generatePDF }  from "../../lib/pdfGenerator";
import { generateDOCX } from "../../lib/docxGenerator";

export default async function handler(req, res) {
  const { sessionId, type } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const session = resumeStore.get(sessionId);

  if (!session) {
    return res.status(404).send("Session expired or not found");
  }

  const { resume, templateStyle = "premium" } = session;

  // Log so you can confirm in server logs that the right template is used
  console.log(`[payment-success] sessionId=${sessionId} type=${type} template=${templateStyle}`);

  let buffer, filename, contentType;

  try {
    if (type === "pdf") {
      buffer      = await generatePDF(resume, templateStyle);  // ← templateStyle now passed
      filename    = `tailored-resume-${templateStyle}.pdf`;
      contentType = "application/pdf";
    } else {
      buffer      = await generateDOCX(resume, templateStyle); // ← templateStyle now passed
      filename    = `tailored-resume-${templateStyle}.docx`;
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  } catch (err) {
    console.error("[payment-success] Generation error:", err);
    return res.status(500).json({ error: "Failed to generate resume. Please contact support." });
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(buffer);
}