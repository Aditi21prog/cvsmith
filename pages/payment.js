import { useRouter } from "next/router";
import { useState } from "react";

export default function PaymentPage() {

  const router = useRouter();
  const { sessionId, type } = router.query;

  const [utr, setUtr] = useState("");
  const [error, setError] = useState("");

  async function verify() {

    if (!utr) {
      setError("Please enter UTR");
      return;
    }

    const res = await fetch("/api/verify-manual-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        utr,
        sessionId,
        type
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    window.location.href = data.downloadUrl;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="bg-slate-900 p-6 rounded-xl text-center w-[360px]">

        <h2 className="text-xl font-bold mb-2">
          Pay ₹21 to Download Resume
        </h2>

        <p className="text-sm text-slate-400 mb-4">
          Scan QR using any UPI app
        </p>

        <img
          src="/upi-qr.png"
          className="mx-auto mb-4 w-64 rounded-lg"
        />

        <input
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          placeholder="Enter UTR"
          className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 mb-3"
        />

        <button
          onClick={verify}
          className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold w-full"
        >
          Verify Payment
        </button>

        {error && (
          <p className="text-red-400 mt-3">{error}</p>
        )}

      </div>

    </div>
  );
}