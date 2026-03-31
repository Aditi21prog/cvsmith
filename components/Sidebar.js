// components/Sidebar.js
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaFileAlt, FaClipboardList, FaUserTie, FaMagic } from "react-icons/fa";

const stepsConfig = [
  { id: 1, label: "Upload Resume", icon: FaFileAlt },
  { id: 2, label: "Job Description", icon: FaClipboardList },
  { id: 3, label: "Choose Role", icon: FaUserTie },
  { id: 4, label: "Generate", icon: FaMagic },
];

export default function Sidebar({ step, setStep }) {
  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="hidden md:flex h-[90vh] w-72 flex-col rounded-3xl 
                 bg-slate-950/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800
                 text-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-700/70"
    >
      {/* Logo + title */}
      <div className="mb-10 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 p-1.5">
  <Image
    src="/logo.png"
    alt="Logo"
    width={42}
    height={42}
    className="rounded-xl object-contain"
  />
</div>


        <div>
          <h1 className="text-lg font-semibold tracking-wide">Resume Tailor</h1>
          <p className="text-xs text-slate-300">AI Resume Engine</p>
        </div>
      </div>

      {/* Steps */}
      <nav className="space-y-3">
        {stepsConfig.map((s) => {
          const active = step === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition-all ${
                active
                  ? "bg-gradient-to-r from-yellow-400 to-amber-300 text-slate-950 shadow-[0_0_24px_rgba(250,204,21,0.7)] font-semibold"
                  : "bg-slate-900/40 hover:bg-slate-800/70 border border-slate-700/60 text-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/80 text-[0.7rem] font-semibold">
                  {s.id}
                </span>
                <Icon className="text-xs opacity-80" />
                <span>{s.label}</span>
              </span>
              {active && (
                <span className="text-[0.65rem] uppercase tracking-wide">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 text-xs text-slate-400 border-t border-slate-700/60">
        Version: Premium UI
      </div>
    </motion.aside>
  );
}
