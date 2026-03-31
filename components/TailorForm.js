import { useState } from "react";

const TEMPLATE_OPTIONS = [
  { value: "premium",  label: "Premium (Big4 / Consulting)" },
  { value: "modern",   label: "Modern (ATS Friendly)" },
  { value: "creative", label: "Creative (Design Focused)" },
];

export default function TailorForm({ resumeFile, resumeText, jd, role }) {
  const [templateStyle, setTemplateStyle] = useState("premium");
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [error, setError] = useState("");

  const PAY_AMOUNT = 21;

  /* ================= GENERATE ================= */
  async function handleGenerate() {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("jd", jd || "");
      formData.append("role", role || "audit");
      formData.append("templateStyle", templateStyle);

      if (resumeFile) {
        formData.append("resume", resumeFile);
      } else if (resumeText?.trim()) {
        formData.append("resumeText", resumeText);
      } else {
        throw new Error("Upload resume or paste resume text");
      }

      const res = await fetch("/api/tailor", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Generation failed");

      setResume(data);
      setAtsScore(data?.ats?.score ?? null);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ================= PAYMENT + DOWNLOAD ================= */
  async function handleDownload(type) {
    if (!resume) return;

    try {
      // STEP 1: Save session
      const saveRes = await fetch("/api/save-resume-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          resume,
          templateStyle
        })
      });

      if (!saveRes.ok) throw new Error("Session failed");

      const { sessionId } = await saveRes.json();

      // STEP 2: Create Razorpay order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId })
      });

      const order = await orderRes.json();

      // STEP 3: Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "Resume Tailor",
        description: "Download tailored resume",
        order_id: order.id,

        handler: async function (response) {
          const verify = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ...response,
              sessionId,
              type
            })
          });

          const data = await verify.json();

          if (data.success) {
            window.location.href = data.downloadUrl;
          } else {
            setError("Payment verification failed");
          }
        },

        theme: {
          color: "#FACC15"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      setError("Payment failed. Try again.");
    }
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-6 text-slate-100">

      {/* HEADER */}
      <div className="flex justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            Generate Tailored Resume
          </h2>
          <p className="text-sm text-slate-400">
            Enterprise ATS • JD alignment • Premium output
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <select
            value={templateStyle}
            onChange={(e) => setTemplateStyle(e.target.value)}
            className="rounded-xl bg-slate-900 border border-yellow-400 px-3 py-2"
          >
            {TEMPLATE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-yellow-400 px-5 py-2 font-semibold text-slate-950"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {/* ATS + DOWNLOAD */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-yellow-400/30 p-5">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs uppercase text-slate-400">
              ATS Match
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {atsScore != null ? `${atsScore}%` : "—"}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleDownload("pdf")}
              disabled={!resume}
              className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold disabled:opacity-40"
            >
              Download PDF ₹{PAY_AMOUNT}
            </button>

            <button
              onClick={() => handleDownload("docx")}
              disabled={!resume}
              className="px-4 py-2 rounded-lg border border-slate-600 disabled:opacity-40"
            >
              DOCX
            </button>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="border border-red-500 bg-red-500/10 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {/* ❌ PREVIEW REMOVED COMPLETELY */}

    </div>
  );
}