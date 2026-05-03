// pages/index.js
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ZenG from "../components/ZenG";

import Sidebar from "../components/Sidebar";
import Step1Upload from "../components/Step1Upload";
import Step2JD from "../components/Step2JD";
import Step3Role from "../components/Step3Role";
import TailorForm from "../components/TailorForm";

// ─── Step 0: Instructions + Founder Story ─────────────────────────────────────
function InstructionsPage({ onStart }) {
  return (
    <div className="space-y-8">

      {/* ── HERO ── */}
      <div className="text-center space-y-3 pt-2 pb-4">
        <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5 text-xs text-yellow-400 font-semibold tracking-widest uppercase">
          ⚡ Early Access — Low Cost
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-100 leading-tight">
          Your resume is losing you <br />
          <span className="text-yellow-400">interviews you deserve.</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          ATS systems reject 75% of resumes before a human ever sees them.
          This tool fixes that — in under 60 seconds.
        </p>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { step: "01", icon: "📄", title: "Upload Resume", desc: "PDF or Word. We extract everything automatically." },
          { step: "02", icon: "🎯", title: "Paste Job Description", desc: "Presently available for Audit and Investment Banking." },
          { step: "03", icon: "✨", title: "Get ATS-Optimised Resume", desc: "Preview free. Pay only when you're satisfied." },
        ].map((item) => (
          <div key={item.step} className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-bold text-slate-600">{item.step}</span>
            </div>
            <div className="font-semibold text-slate-100 text-sm">{item.title}</div>
            <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* ── FOUNDER STORY ── */}
      <div className="rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden">

        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-600" />

        <div className="p-6 space-y-6">

          {/* Byline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 font-bold text-sm">
              A
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Aditi Sharma</div>
              <div className="text-xs text-slate-500">Deals Advisory and Risk Advisory • Big 4</div>
            </div>
          </div>

          {/* Story headline */}
          <div>
            <div className="text-xs text-yellow-400 uppercase tracking-widest font-semibold mb-2">Why I built this</div>
            <h3 className="text-xl font-bold text-slate-100 leading-snug">
              I was a CA dropout competing against<br className="hidden sm:block" /> CA rankers for the same roles.
            </h3>
          </div>

          {/* Story body */}
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              On paper, I shouldn't have made it. No degree completion, no rank, no "pedigree."
              But I had one thing most candidates didn't —
              <span className="text-slate-100 font-medium"> a resume that made people stop.</span>
            </p>

            {/* Timeline */}
            <div className="space-y-2 border-l-2 border-yellow-400/30 pl-4 ml-1">
              {[
                "Worked with 2 Big 4 firms in client-facing roles",
                "Risk Advisory — Internal Audit",
                "Deal Advisory — Post-Merger Integration",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5 shrink-0">→</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p>What happened next changed how I think about job searching entirely:</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { icon: "📞", text: "Interview calls across consulting & finance" },
                { icon: "🏆", text: "BCG & McKinsey pre-interview round access" },
                { icon: "💬", text: "Managers praising my CV specifically" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-800/50 rounded-xl px-3 py-2.5 text-xs text-slate-300">
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className="relative">
            <div className="absolute -left-1 top-0 text-6xl text-yellow-400/20 font-serif leading-none select-none">"</div>
            <blockquote className="pl-8 pr-4 py-3 border-l-4 border-yellow-400 bg-yellow-400/5 rounded-r-xl">
              <p className="text-lg font-semibold text-yellow-400 italic leading-snug">
                Your CV is very unique.
              </p>
              <footer className="text-xs text-slate-500 mt-1">— A mail from one of the Hiring Managers</footer>
            </blockquote>
          </div>

          {/* Big lesson */}
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 px-5 py-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">The insight</div>
            <div className="text-lg font-bold text-yellow-400">
              Resume positioning &gt; qualifications
            </div>
            <div className="text-xs text-slate-400 mt-1">
              The best candidate rarely gets the job. The best-positioned one does.
            </div>
          </div>

          <p className="text-sm text-slate-300 text-center">
            So I built a system around it —
            <span className="text-yellow-400 font-semibold"> and now it's yours.</span>
          </p>

        </div>
      </div>

      {/* ── TRUST SIGNALS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: "🔒", label: "Data never sold", sub: "Encrypted & secure" },
          { icon: "👁️", label: "Preview free", sub: "Pay only if satisfied" },
          { icon: "📁", label: "PDF + Word", sub: "3 template styles" },
          { icon: "⚡", label: "60 seconds", sub: "Average generation time" },
        ].map((item, i) => (
          <div key={i} className="rounded-xl bg-slate-800/40 border border-slate-700/40 px-3 py-3 text-center space-y-1">
            <div className="text-xl">{item.icon}</div>
            <div className="text-xs font-semibold text-slate-200">{item.label}</div>
            <div className="text-[10px] text-slate-500">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── FEEDBACK ── */}
      <div className="text-center text-xs text-slate-500">
        Feedback or suggestions →{" "}
        <a href="mailto:v98_an@yahoo.com" className="text-yellow-400 hover:underline">
          v98_an@yahoo.com
        </a>
      </div>

      {/* ── CTA ── */}
      <button
        onClick={onStart}
        className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-bold text-base hover:bg-yellow-300 transition-all active:scale-[0.98] shadow-lg shadow-yellow-400/20"
      >
        Start Tailoring My Resume →
      </button>

    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(0);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [role, setRole] = useState("audit");

  const steps = [
    { id: 0, label: "Instructions" },
    { id: 1, label: "Upload Resume" },
    { id: 2, label: "Job Description" },
    { id: 3, label: "Choose Role" },
    { id: 4, label: "Generate" },
  ];

  const nextStep = () => setStep((prev) => Math.min(4, prev + 1));
  const prevStep = () => setStep((prev) => Math.max(0, prev - 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 md:py-10">

        {/* Sidebar */}
        <Sidebar step={step} setStep={setStep} />

        {/* Main */}
        <main className="flex-1">

          {/* Mobile Top Bar */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="mb-4 flex items-center justify-between rounded-2xl bg-slate-950/70 p-3 shadow-lg border border-slate-700/70 md:hidden"
          >
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={30} height={30} className="rounded-xl" />
              <div>
                <div className="text-sm font-semibold">Resume Tailor</div>
                <div className="text-[0.7rem] text-slate-300">AI Resume Engine</div>
              </div>
            </div>
            <select
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              className="rounded-xl border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            >
              {steps.map((s) => (
                <option key={s.id} value={s.id} className="text-slate-900">
                  {s.id}. {s.label}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Card Container */}
          <div className="rounded-3xl bg-slate-950/60 p-6 md:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.8)] border border-slate-700/80">

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.22 }}
                className="space-y-6"
              >
                {/* STEP 0 — Instructions */}
                {step === 0 && <InstructionsPage onStart={nextStep} />}

                {/* STEP 1 */}
                {step === 1 && (
                  <Step1Upload
                    resumeFile={resumeFile}
                    onFileUpload={setResumeFile}
                    onTextChange={setResumeText}
                  />
                )}

                {/* STEP 2 */}
                {step === 2 && <Step2JD jd={jd} onChange={setJd} />}

                {/* STEP 3 */}
                {step === 3 && <Step3Role role={role} onChange={setRole} />}

                {/* STEP 4 */}
                {step === 4 && (
                  <TailorForm
                    resumeFile={resumeFile}
                    resumeText={resumeText}
                    jd={jd}
                    role={role}
                  />
                )}

              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              {step > 0 && (
                <button
                  onClick={prevStep}
                  className="rounded-xl border border-slate-500/80 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800/90 transition"
                >
                  Back
                </button>
              )}
              {step > 0 && step < 4 && (
                <button
                  onClick={nextStep}
                  className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-md hover:bg-yellow-300 transition active:scale-[0.97]"
                >
                  Next
                </button>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* ZenG — fixed bottom-left, only on homepage */}
      <ZenG />
    </div>
  );
}