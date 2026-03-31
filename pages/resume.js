import { useState } from "react";
import TailorForm from "../components/TailorForm";

export default function ResumePage() {

  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4">

      <div className="max-w-5xl mx-auto space-y-6">

        {/* STEP 0 — INSTRUCTIONS */}
        {step === 0 && (
          <div className="bg-slate-900 border border-yellow-400/20 rounded-xl p-6 space-y-4">

            <h2 className="text-xl font-semibold text-yellow-400">
              Before You Start
            </h2>

            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
              <li>This tool is currently in early phase — available at a low cost.</li>
              <li>Upload your latest resume draft (important).</li>
              <li>You can download in Word format to edit further.</li>
              <li>
                Feedback:
                <span className="text-yellow-400"> v98_an@yahoo.com</span>
              </li>
            </ul>

            <button
              onClick={() => setStep(1)}
              className="mt-4 bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold"
            >
              Start Now
            </button>

          </div>
        )}

        {/* STEP 1 — TOOL */}
        {step === 1 && (
          <TailorForm />
        )}

      </div>

    </div>
  );
}