import { useState } from "react";
import ResumePreview from "./ResumePreview";
import SkillsGapCard from "./SkillsGapCard";

const TEMPLATE_OPTIONS = [
  { value: "premium",  label: "Premium (Big4 / Consulting)" },
  { value: "modern",   label: "Modern (ATS Friendly)" },
  { value: "creative", label: "Creative (Design Focused)" },
  { value: "google",   label: "Google (Tech / Engineering)" },   // ← NEW
];

const LOADING_STEPS = [
  "Analyzing your resume...",
  "Understanding job description...",
  "Matching keywords with ATS...",
  "Rewriting bullet points...",
  "Optimizing impact statements...",
  "Final polishing...",
];

const PAY_AMOUNT = 49;

export default function TailorForm({ resumeFile, resumeText, jd, role }) {
  const [templateStyle, setTemplateStyle] = useState("premium");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [resume, setResume] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  /* ================= GENERATE ================= */
  async function handleGenerate() {
    setLoading(true);
    setError("");
    setLoadingStep(0);
    setResume(null);
    setAtsScore(null);
    setSessionId(null);

    let interval;

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

      interval = setInterval(() => {
        setLoadingStep((prev) =>
          prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
        );
      }, 1200);

      const res = await fetch("/api/tailor", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setResume(data);
      setAtsScore(data?.ats?.score ?? null);
      setSessionId(data?.sessionId ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  /* ================= PAYMENT + DOWNLOAD ================= */
  async function handleDownload(type) {
    if (!resume || paying) return;

    setPaying(true);
    setError("");

    try {
      const saveRes = await fetch("/api/save-resume-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, templateStyle }),
      });

      if (!saveRes.ok) {
        const saveErr = await saveRes.json().catch(() => ({}));
        throw new Error(saveErr.error || "Session save failed");
      }

      const { sessionId: downloadSessionId } = await saveRes.json();

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: downloadSessionId }),
      });

      if (!orderRes.ok) {
        const orderErr = await orderRes.json().catch(() => ({}));
        throw new Error(orderErr.error || "Order creation failed");
      }

      const order = await orderRes.json();

      if (!window.Razorpay) {
        throw new Error("Razorpay not loaded. Add the script tag to _document.js.");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "Resume Tailor",
        description: "Download tailored resume",
        order_id: order.id,

        handler: async function (response) {
          try {
            const verify = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                sessionId: downloadSessionId,
                type,
              }),
            });

            const verifyData = await verify.json();

            if (verifyData.success && verifyData.downloadUrl) {
              window.location.href = verifyData.downloadUrl;
            } else {
              setError(verifyData.error || "Payment verification failed");
            }
          } catch {
            setError("Payment verification failed. Please contact support.");
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },

        theme: { color: "#FACC15" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        setError(response.error?.description || "Payment failed. Please try again.");
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed. Try again.");
      setPaying(false);
    }
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-6 text-slate-100">

      {/* ── HEADER ── */}
      <div className="flex justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Generate Tailored Resume</h2>
          <p className="text-sm text-slate-400">
            Enterprise ATS • JD alignment • Premium output
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <select
            value={templateStyle}
            onChange={(e) => {
              const newTemplate = e.target.value;
              if (newTemplate !== templateStyle) {
                setTemplateStyle(newTemplate);
                setResume(null);
                setAtsScore(null);
                setSessionId(null);
                setError("");
              }
            }}
            className="rounded-xl bg-slate-900 border border-yellow-400 px-3 py-2 text-slate-100"
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
            className="rounded-xl bg-yellow-400 px-5 py-2 font-semibold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div className="rounded-xl bg-slate-900 border border-yellow-400/30 p-6 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />

          <div className="text-lg font-semibold text-yellow-400">
            {LOADING_STEPS[loadingStep]}
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
              }}
            />
          </div>

          <p className="text-sm text-slate-400">
            🚀 Boosting your ATS score and recruiter impact...
          </p>
          <p className="text-xs text-slate-500">
            ⏳ Estimated time: ~10–15 seconds
          </p>
        </div>
      )}

      {/* ── ATS SCORE + DOWNLOAD BUTTONS ── */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-yellow-400/30 p-5">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase text-slate-400 tracking-widest mb-1">
              ATS Match
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {atsScore != null ? `${atsScore}%` : "—"}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleDownload("pdf")}
              disabled={!resume || paying}
              className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
            >
              {paying ? "Processing..." : `Download PDF ₹${PAY_AMOUNT}`}
            </button>

            <button
              onClick={() => handleDownload("docx")}
              disabled={!resume || paying}
              className="px-4 py-2 rounded-lg border border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400 transition-colors"
            >
              {paying ? "..." : "DOCX"}
            </button>
          </div>
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="border border-red-500 bg-red-500/10 px-4 py-3 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!resume && !loading && (
        <div className="text-center text-sm text-slate-400 py-6">
          ⚡ Select a template and click{" "}
          <span className="text-yellow-400 font-semibold">Generate</span> to preview
        </div>
      )}

      {/* ── RESUME PREVIEW ── */}
      {resume && !loading && (
        <div className="relative rounded-2xl border border-slate-700 bg-slate-950/70 p-4 overflow-hidden">
          <div className="mb-2 text-sm font-medium text-slate-300">
            Live Resume Preview
          </div>

          <div className="max-h-[500px] overflow-hidden rounded-xl">
            <ResumePreview resume={resume} template={templateStyle} />
          </div>

          {/* Fade blur overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent backdrop-blur-sm pointer-events-none" />

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-6xl font-bold text-white/10 rotate-[-30deg]">
              PREVIEW
            </span>
          </div>

          {/* CTA */}
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
            <p className="text-yellow-400 text-sm">
              🔒 Unlock full resume for ₹{PAY_AMOUNT}
            </p>
            <button
              onClick={() => handleDownload("pdf")}
              disabled={paying}
              className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
            >
              {paying ? "Processing payment..." : "Download Full Resume"}
            </button>
          </div>
        </div>
      )}

      {/* ── SKILLS GAP CARD ── */}
      {resume && !loading && (
        <SkillsGapCard
          resume={resume}
          jd={jd}
          sessionId={sessionId}
        />
      )}

    </div>
  );
}