import Image from "next/image";

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="bg-slate-900 p-8 rounded-xl w-full max-w-md border border-yellow-400/30">

        <h1 className="text-2xl font-bold text-center mb-2">
          Unlock Premium Resume
        </h1>

        <p className="text-center text-slate-400 mb-6">
          Pay ₹21 via UPI to download your ATS-optimized resume
        </p>

        <div className="flex justify-center mb-4">
          <Image
            src="/upi-qr.png"
            width={220}
            height={220}
            alt="UPI QR"
            className="rounded-lg border border-slate-700"
          />
        </div>

        <div className="text-center text-sm mb-4">
          UPI ID: <span className="font-semibold">yourupi@okaxis</span>
        </div>

        <button
          className="w-full bg-yellow-400 text-slate-900 font-semibold py-2 rounded-lg mb-2"
          onClick={() => alert("Payment received. Download will unlock soon.")}
        >
          I have paid
        </button>

        <p className="text-xs text-slate-500 text-center">
          After payment, your download will unlock instantly.
        </p>

      </div>
    </div>
  );
}
const verifiedUTRs = new Set(); // Replace with DB in production

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { utr } = req.body;

  if (!utr || utr.length < 12) {
    return res.status(400).json({ error: "Invalid UTR" });
  }

  // TODO: In production connect Razorpay / Cashfree API here

  if (verifiedUTRs.has(utr)) {
    return res.status(400).json({ error: "UTR already used" });
  }

  // TEMP: auto approve (replace with real API later)
  verifiedUTRs.add(utr);

  return res.json({ success: true });
}

const validTokens = new Set(); // replace with DB in production

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { utr } = req.body;

  if (!utr || utr.length < )
    return res.status(400).json({ error: "Invalid UTR" });

  const token = "pay_" + Buffer.from(utr + Date.now()).toString("base64");

  validTokens.add(token);

  return res.json({ token });
}

// Export for download API
export function isValidToken(token) {
  return validTokens.has(token);
}

