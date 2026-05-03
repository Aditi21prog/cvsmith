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

export default function Home() {
  // ✅ START FROM INSTRUCTIONS
  const [step, setStep] = useState(0);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [role, setRole] = useState("audit");

  // ✅ UPDATED STEPS
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
              <Image
                src="/logo.png"
                alt="Logo"
                width={30}
                height={30}
                className="rounded-xl"
              />
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

                {step === 0 && (
  <div className="bg-slate-900 border border-yellow-400/20 rounded-xl p-6 space-y-6">
    
    <h2 className="text-xl font-semibold text-yellow-400">
      Before You Start
    </h2>

    <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
      <li>This tool is currently in early phase — available at a low cost.</li>
      <li>Upload your latest resume draft (important).</li>
      <li>Check Your ATS Score for Free. Pay Only When You're Satisfied.</li>
      <li>You can download 3 different types of resume in either pdf format or word format.</li>
      <li>For the best results, you can download in Word Format and edit further.</li>
      <li>We are fully committed to protecting your data — your information is securely encrypted, safeguarded using industry-standard security practices, and is never sold or shared with third parties.</li>
          </ul>

    {/* 🔥 STORY SECTION */}
    <div className="story-card">

      <h2 className="story-title">Why this tool works</h2>

      <div className="story-block">
        <p>I didn’t have a perfect profile.</p>
        <li><p>CA dropout but had strong in depth knowledge and skills</p></li>
        <li><p>Still worked with 2 Big 4 firms (client-facing roles)</p></li>
        <li><p>Risk Advisory (Internal Audit)</p></li>
        <li><p>Deal Advisory (Post-Merger Integration)</p></li>
      </div>

      <div className="story-divider"></div>

      <div className="story-block">
        <p className="subheading">What happened next:</p>
        <li><p>Interview calls across consulting & finance</p></li>
        <li><p>Praise from managers specifically for my CV</p></li>
        <li><p>Access to BCG & McKinsey pre-interview rounds</p></li>
          
        <li className="spaced-line">
    One manager literally sent a mail:
  </li>
      </div>

      <div className="quote-box">
        “Your CV is very unique.”
      </div>

      <div className="big-lesson spaced-top">
  Resume positioning &gt; qualifications
</div>  
      <p className="closing-line">
        So I built a system around it.
      </p>

    </div>

                     <ul>
                      <li>
                        Feedback/Tell us how we can improve:
                        <span className="text-yellow-400"> v98_an@yahoo.com</span>
                      </li>
                    </ul>
    <button
      onClick={nextStep}
      className="mt-4 bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold"
    >
      Start Now
    </button>
<div className="creator-tag">
  ⚡ Built by Aditi Sharma
</div>
  </div>
)}
                            
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
              
              {/* BACK */}
              {step > 0 && (
                <button
                  onClick={prevStep}
                  className="rounded-xl border border-slate-500/80 bg-slate-900/80 
                             px-4 py-2 text-sm text-slate-100 hover:bg-slate-800/90 transition"
                >
                  Back
                </button>
              )}

              {/* NEXT */}
              {step > 0 && step < 4 && (
                <button
                  onClick={nextStep}
                  className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-semibold text-slate-900 
                             shadow-md hover:bg-yellow-300 transition active:scale-[0.97]"
                >
                  Next
                </button>
              )}
<ZenG/>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}