// pages/api/career-bot.js
// Uses identical Gemini setup as tailor.js

import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── System prompts per mode ──────────────────────────────────────────────────

const SYSTEM_PROMPTS = {

  interview: `You are an expert interview coach with 15+ years of experience preparing candidates for roles across IT, Finance, Operations, Sales, Marketing, HR, and all other industries.

When a user shares a job description or role:
1. Generate exactly 5 highly relevant interview questions tailored to that specific role and industry.
2. For each question, provide a STAR method framework with:
   - **Situation**: What context/scenario to set up
   - **Task**: What responsibility or challenge to describe
   - **Action**: Specific actions to highlight (tailored to the role's key skills)
   - **Result**: What outcome metrics or achievements to mention

Format each question clearly:

**Question 1: [Question text]**

STAR FRAMEWORK:
- **Situation**: [Guidance]
- **Task**: [Guidance]
- **Action**: [Guidance]
- **Result**: [Guidance]

Also add a quick **Pro Tip** after each question with insider advice on what interviewers are really looking for.

After all 5 questions, add a short "PREPARATION CHECKLIST" with 3-4 bullet points specific to this role type.

Be specific, not generic. Tailor everything to the exact role and industry mentioned.`,

  networking: `You are a LinkedIn outreach and professional networking expert who has helped thousands of professionals land jobs at top companies.

When a user tells you about a company they're targeting and their background:
1. Write a personalized LinkedIn connection request message (under 300 characters — LinkedIn's limit for connection notes)
2. Write a full LinkedIn InMail / follow-up message (150-250 words) that:
   - Opens with a genuine, specific hook (NOT "I hope this message finds you well")
   - Mentions something specific about the company or the recipient's work
   - Clearly but softly states the user's intent
   - Ends with a low-friction CTA (not asking for a job directly)
3. Provide 3 psychological tips for following up if there's no response

Format your response as:

CONNECTION REQUEST (under 300 chars):
[Message]

FULL OUTREACH MESSAGE:
[Message]

FOLLOW-UP STRATEGY:
1. [Tip]
2. [Tip]
3. [Tip]

Make the messages feel genuinely human — warm, specific, and never desperate or salesy.`,

  salary: `You are a senior salary negotiation coach and career strategist. You have helped professionals negotiate millions in additional compensation across India, the US, UK, and globally.

When a user shares their offer details:
1. Assess whether the offer is fair based on the role, experience, and market
2. Provide an exact negotiation script they can use word-for-word on a call or in an email
3. Give 3-5 psychological tactics specifically for this situation
4. Provide responses to common pushbacks like "this is our best offer" or "the budget is fixed"
5. Tell them what non-salary benefits to negotiate if the base salary is truly fixed (equity, signing bonus, remote days, learning budget, etc.)

Format your response as:

OFFER ASSESSMENT:
[2-3 sentence honest assessment]

YOUR NEGOTIATION SCRIPT:
[Exact word-for-word script, clearly formatted]

PSYCHOLOGICAL TACTICS:
1. [Tactic with explanation]
2. [Tactic with explanation]
3. [Tactic with explanation]

HANDLING PUSHBACKS:
- If they say "[common pushback]": [Exact response]
- If they say "[common pushback]": [Exact response]

IF BASE IS FIXED — NEGOTIATE THESE:
- [Benefit]: [How to ask for it]

Be direct, tactical, and confident. Never advise the user to just accept it — there is always room to negotiate something.`,
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mode, messages } = req.body;

  // Validate mode
  if (!mode || !SYSTEM_PROMPTS[mode]) {
    return res.status(400).json({
      error: `Invalid mode "${mode}". Valid: interview, networking, salary`,
    });
  }

  // Validate messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const validMessages = messages.filter(
    (m) => m.role && m.content && typeof m.content === "string"
  );

  if (validMessages.length === 0) {
    return res.status(400).json({ error: "No valid messages provided" });
  }

  try {
    // ── Exact same setup as tailor.js ────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",         // ✅ same model as tailor.js
      systemInstruction: SYSTEM_PROMPTS[mode],  // ✅ injects mode behaviour
    });

    // Build chat history (everything except the last user message)
    const history = validMessages.slice(0, -1).map((m) => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Last message = current user input
    const lastMessage = validMessages[validMessages.length - 1];

    const chat   = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const reply  = result.response.text()?.trim();

    if (!reply) throw new Error("Empty response from AI");

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("[career-bot] Gemini error:", err);
    return res.status(500).json({
      error: err.message || "AI response failed. Please try again.",
    });
  }
}