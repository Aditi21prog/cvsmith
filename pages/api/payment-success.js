import { normalizeResume } from "../../lib/normalizeResume";
import { resumeStore } from "../../lib/resumeStore";
import { generatePDF } from "../../lib/pdfGenerator";
import { generateDOCX } from "../../lib/docxGenerator";

export default async function handler(req, res) {

  const { sessionId, type } = req.query;

  if (!sessionId)
    return res.status(400).json({ error: "Missing sessionId" });

  const session = resumeStore.get(sessionId);

  if (!session)
    return res.status(404).send("Session expired");

  // 🔥 THIS IS THE CRITICAL FIX
  const rawResume = session.resume;
  console.log("RAW RESUME:", JSON.stringify(rawResume, null, 2));
  const resume = normalizeResume(rawResume);
  const templateStyle = session.templateStyle;

  let buffer, filename, contentType;

  if (type === "pdf") {

    buffer = await generatePDF(resume, templateStyle);
    filename = "tailored-resume.pdf";
    contentType = "application/pdf";

  } else {

    buffer = await generateDOCX(resume, templateStyle);
    filename = "tailored-resume.docx";
    contentType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");

  res.send(buffer);
}
