import { useState } from "react";

const GAP_PRICE = 29;

// ─── Skill pill ───────────────────────────────────────────────────────────────
function SkillPill({ label, type }) {
  const styles = {
    missing: "bg-red-500/10 border border-red-500/40 text-red-400",
    weak:    "bg-orange-500/10 border border-orange-500/40 text-orange-400",
    strong:  "bg-emerald-500/10 border border-emerald-500/40 text-emerald-400",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
      {label}
    </span>
  );
}

// ─── Expandable gap row ───────────────────────────────────────────────────────
function GapRow({ gap, index }) {
  const [open, setOpen] = useState(false);

  const urgencyColor = {
    High:   "text-red-400 bg-red-500/10 border-red-500/30",
    Medium: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    Low:    "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  }[gap.urgency] || "text-slate-400";

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded border ${urgencyColor}`}>
            {gap.urgency}
          </span>
          <span className="font-medium text-slate-100 truncate">{gap.skill}</span>
        </div>
        <span className="text-slate-500 ml-3 shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
          <p className="text-sm text-slate-300">{gap.why}</p>

          {gap.resources?.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                Learn it fast
              </div>
              <div className="space-y-1.5">
                {gap.resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    <span className="text-xs bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">
                      {r.type}
                    </span>
                    {r.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {gap.tip && (
            <div className="text-xs bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2 text-slate-400">
              💡 {gap.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ strong, weak, missing }) {
  const total = strong + weak + missing;
  if (total === 0) return null;

  const r = 36;
  const circ = 2 * Math.PI * r;
  const slices = [
    { value: strong,  color: "#10b981" },
    { value: weak,    color: "#f97316" },
    { value: missing, color: "#ef4444" },
  ];

  let offset = 0;
  const paths = slices.map((s, i) => {
    const dash = (s.value / total) * circ;
    const el = (
      <circle
        key={i}
        cx="44" cy="44" r={r}
        fill="none"
        stroke={s.color}
        strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        style={{ transform: "rotate(-90deg)", transformOrigin: "44px 44px" }}
      />
    );
    offset += dash;
    return el;
  });

  const matchPct = Math.round((strong / total) * 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        {paths}
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
          fill="#facc15" fontSize="14" fontWeight="700">
          {matchPct}%
        </text>
      </svg>
      <div className="flex gap-3 text-xs text-slate-400">
        <span><span className="text-emerald-400">●</span> Strong</span>
        <span><span className="text-orange-400">●</span> Weak</span>
        <span><span className="text-red-400">●</span> Missing</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SkillsGapCard({ resume, jd, sessionId }) {
  const [status, setStatus]       = useState("idle"); // idle | loading | unlocked | error
  const [analysis, setAnalysis]   = useState(null);
  const [error, setError]         = useState("");
  const [paying, setPaying]       = useState(false);
  const [activeTab, setActiveTab] = useState("missing");

  const canAnalyze = !!(resume && jd?.trim());

  // ── Fetch analysis after payment verified ──────────────────────────────────
  async function fetchAnalysis(gapSessionId) {
    setStatus("loading");
    try {
      const res = await fetch("/api/skills-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: gapSessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data);
      setStatus("unlocked");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  // ── Payment flow ───────────────────────────────────────────────────────────
  async function handleUnlock() {
    if (paying || !canAnalyze) return;

    setPaying(true);
    setError("");

    try {
      // Step 1: Save gap session — note: API returns `gapSessionId` (not sessionId)
      const saveRes = await fetch("/api/save-gap-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, resume, jd }),
      });

      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveData.error || "Session save failed");
      }

      // ✅ Correct field name: gapSessionId (not sessionId)
      const { gapSessionId } = saveData;

      if (!gapSessionId) {
        throw new Error("No session ID returned from server");
      }

      // Step 2: Create order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: gapSessionId, product: "skills-gap" }),
      });

      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Order creation failed");

      // Step 3: Razorpay
      if (!window.Razorpay) {
        throw new Error("Razorpay not loaded. Check _document.js script tag.");
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "Resume Tailor",
        description: "Skills Gap Analysis",
        order_id: order.id,

        handler: async function (response) {
          try {
            // Step 4: Verify payment
            const verify = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                sessionId: gapSessionId,
                type: "skills-gap",
              }),
            });
            const vData = await verify.json();

            if (vData.success) {
              // Step 5: Fetch analysis using gapSessionId
              await fetchAnalysis(gapSessionId);
            } else {
              setError(vData.error || "Payment verification failed");
              setPaying(false);
            }
          } catch {
            setError("Verification failed. Please contact support.");
            setPaying(false);
          }
        },

        modal: {
          ondismiss: () => setPaying(false),
        },

        theme: { color: "#FACC15" },
      });

      rzp.on("payment.failed", (r) => {
        setError(r.error?.description || "Payment failed. Please try again.");
        setPaying(false);
      });

      rzp.open();

    } catch (err) {
      console.error("[SkillsGapCard] Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  // ── Derived counts ─────────────────────────────────────────────────────────
  const counts = analysis
    ? {
        missing: analysis.gaps?.filter((g) => g.type === "missing").length || 0,
        weak:    analysis.gaps?.filter((g) => g.type === "weak").length || 0,
        strong:  analysis.matched?.length || 0,
      }
    : null;

  const tabGaps = analysis?.gaps?.filter((g) =>
    activeTab === "missing" ? g.type === "missing" : g.type === "weak"
  ) || [];

  /* ══════════════════════════ RENDER ════════════════════════════════════════ */

  // IDLE — teaser
  if (status === "idle") {
    return (
      <div className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400" />

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🧠</span>
                <h3 className="text-lg font-semibold text-slate-100">Skills Gap Analysis</h3>
                <span className="text-xs bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                  NEW
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm">
                See exactly which skills you're missing for this role, why they matter, and how to close the gap fast.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-yellow-400">₹{GAP_PRICE}</div>
              <div className="text-xs text-slate-500">one-time</div>
            </div>
          </div>

          {/* Blurred teaser rows */}
          <div className="relative space-y-2 select-none">
            {["Advanced Excel & Power BI", "SQL Query Optimization", "IFRS 16 Lease Accounting"].map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-2.5 blur-[2px] opacity-60"
              >
                <span className="text-xs px-2 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">
                  {i === 2 ? "Medium" : "High"}
                </span>
                <span className="text-sm text-slate-200">{s}</span>
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950/90 rounded-lg flex items-end justify-center pb-3">
              <span className="text-xs text-slate-400">
                🔒 {canAnalyze ? "Unlock to see your full breakdown" : "Generate resume first to unlock"}
              </span>
            </div>
          </div>

          {/* Features list */}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-400">
            {[
              "Missing skills ranked by urgency",
              "Weak areas to strengthen",
              "Curated learning resources",
              "Resume bullet improvement tips",
              "JD keyword match breakdown",
              "Actionable 30-day study plan",
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="text-yellow-400">✓</span> {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleUnlock}
            disabled={paying || !canAnalyze}
            className="w-full py-3 rounded-xl bg-yellow-400 text-black font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
          >
            {paying
              ? "Opening payment..."
              : !canAnalyze
              ? "Generate resume first"
              : `Unlock Skills Gap Analysis — ₹${GAP_PRICE}`}
          </button>

          {error && (
            <p className="text-xs text-red-400 text-center">⚠️ {error}</p>
          )}
        </div>
      </div>
    );
  }

  // LOADING
  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-yellow-400/20 bg-slate-900 p-8 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-yellow-400 font-semibold">Analyzing skills gap...</div>
        <p className="text-xs text-slate-500">Comparing your profile against the job description</p>
      </div>
    );
  }

  // ERROR
  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center space-y-3">
        <p className="text-red-400 text-sm">⚠️ {error}</p>
        <button
          onClick={() => { setStatus("idle"); setError(""); setPaying(false); }}
          className="text-xs text-slate-400 underline hover:text-slate-200"
        >
          Try again
        </button>
      </div>
    );
  }

  // UNLOCKED — full analysis
  return (
    <div className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400" />

      <div className="p-6 space-y-6">
        {/* Header + donut */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🧠</span>
              <h3 className="text-lg font-semibold text-slate-100">Skills Gap Analysis</h3>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">{analysis?.summary}</p>
          </div>
          <DonutChart strong={counts.strong} weak={counts.weak} missing={counts.missing} />
        </div>

        {/* Stat cards */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[100px] rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-red-400">{counts.missing}</div>
            <div className="text-xs text-slate-400 mt-0.5">Missing Skills</div>
          </div>
          <div className="flex-1 min-w-[100px] rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{counts.weak}</div>
            <div className="text-xs text-slate-400 mt-0.5">Weak Areas</div>
          </div>
          <div className="flex-1 min-w-[100px] rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{counts.strong}</div>
            <div className="text-xs text-slate-400 mt-0.5">Strong Matches</div>
          </div>
        </div>

        {/* Matched skills */}
        {analysis?.matched?.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">✅ You already have</div>
            <div className="flex flex-wrap gap-2">
              {analysis.matched.map((s, i) => (
                <SkillPill key={i} label={s} type="strong" />
              ))}
            </div>
          </div>
        )}

        {/* Gap tabs */}
        {analysis?.gaps?.length > 0 && (
          <div>
            <div className="flex gap-1 mb-3 bg-slate-800/60 p-1 rounded-lg w-fit">
              {["missing", "weak"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-yellow-400 text-black"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab === "missing" ? `Missing (${counts.missing})` : `Weak (${counts.weak})`}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {tabGaps.length > 0 ? (
                tabGaps.map((gap, i) => <GapRow key={i} gap={gap} index={i} />)
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">
                  No {activeTab} skills — great shape! 🎉
                </p>
              )}
            </div>
          </div>
        )}

        {/* 30-day study plan */}
        {analysis?.studyPlan?.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">📅 30-Day Study Plan</div>
            <div className="space-y-2">
              {analysis.studyPlan.map((week, i) => (
                <div key={i} className="flex gap-3 rounded-lg bg-slate-800/50 border border-slate-700/40 px-4 py-3">
                  <div className="shrink-0 text-xs font-bold text-yellow-400 w-14">Week {i + 1}</div>
                  <div className="text-sm text-slate-300">{week}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}