import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST only" });

  const { resumeText, jd } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    const prompt = `
You are an ATS screening engine — not a career coach. 
Score the resume strictly based on JD match.

Return ONLY JSON in this format:

{
  "overallScore": number,
  "keywordMatch": number,
  "skillsMatch": number,
  "actionVerbs": number,
  "metricsUsage": number,
  "relevance": number,
  "missingKeywords": [array],
  "recommendedKeywords": [array]
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jd}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    console.error("ATS ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
