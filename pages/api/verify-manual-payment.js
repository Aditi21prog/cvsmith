import { resumeStore } from "@/lib/resumeStore";

export default function handler(req, res) {

  const { utr, sessionId, type } = req.body;

  if (!utr) {
    return res.status(400).json({
      error: "UTR required"
    });
  }

  const session = resumeStore.get(sessionId);

  if (!session) {
    return res.status(400).json({
      error: "Session expired"
    });
  }

  return res.json({
    success: true,
    downloadUrl:
      `/api/payment-success?sessionId=${sessionId}&type=${type}`
  });
}