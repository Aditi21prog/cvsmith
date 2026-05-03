// pages/api/create-order.js

import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,  // ✅ matches your .env
  key_secret: process.env.RAZORPAY_SECRET,  // ✅ matches your .env
});

// ─── Product pricing (amounts in paise = ₹ × 100) ────────────────────────────
const PRODUCTS = {
  "resume-pdf":  { amount: 4900, description: "Tailored Resume PDF"  },
  "resume-docx": { amount: 4900, description: "Tailored Resume DOCX" },
  "skills-gap":  { amount: 2900, description: "Skills Gap Analysis"  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId, product = "resume-pdf" } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const productConfig = PRODUCTS[product];
    if (!productConfig) {
      return res.status(400).json({
        error: `Unknown product "${product}". Valid: ${Object.keys(PRODUCTS).join(", ")}`,
      });
    }

    // receipt max 40 chars — keep it short and safe
    const shortId = sessionId.replace(/-/g, "").slice(0, 20);
    const receipt = `rcpt_${shortId}`;

    const order = await razorpay.orders.create({
      amount:   productConfig.amount,
      currency: "INR",
      receipt,
      notes: { product, sessionId },
    });

    return res.status(200).json({
      id:          order.id,
      amount:      order.amount,
      currency:    order.currency,
      product,
      description: productConfig.description,
    });

  } catch (err) {
    console.error("[create-order] Razorpay error:", err);
    return res.status(500).json({
      error: err?.error?.description || err?.message || "Order creation failed",
    });
  }
}