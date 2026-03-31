import { resumeStore } from "@/lib/resumeStore";
import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { resume, templateStyle, type } = req.body;

    const sessionId = crypto.randomUUID();

    resumeStore.set(sessionId, {
      resume,
      templateStyle,
      type,
      createdAt: Date.now()
    });

    res.status(200).json({ sessionId });

  } catch (err) {
    console.error("SAVE SESSION ERROR:", err);
    res.status(500).json({ error: "Failed to save resume session" });
  }
}
