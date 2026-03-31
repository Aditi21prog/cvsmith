import { useState } from 'react'
import TailorForm from './TailorForm'

export default function StepForm() {
  const [step, setStep] = useState(1)
  const [resumeText, setResumeText] = useState('')
  const [jd, setJd] = useState('')
  const [role, setRole] = useState('audit')

  function next() { if (step < 4) setStep(step + 1) }
  function back() { if (step > 1) setStep(step - 1) }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    function handleFileUpload(e) {
  setFile(e.target.files[0]);
}
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold">Tailor your finance resume</h2>
        <p className="text-sm text-gray-500">
          Follow the steps to generate a tailored resume for Audit or Investment Banking roles.
        </p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h3 className="font-medium mb-2">Step 1 — Upload Resume</h3>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFile}
                className="mb-2"
              />
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={8}
                className="w-full p-3 border rounded-md"
                placeholder="Or paste resume text here"
              />
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h3 className="font-medium mb-2">Step 2 — Paste Job Description</h3>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={10}
                className="w-full p-3 border rounded-md"
                placeholder="Paste job description here"
              />
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h3 className="font-medium mb-2">Step 3 — Choose Role</h3>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-64 p-2 border rounded-md mb-3"
              >
                <option value="audit">Audit — Big4 / Internal</option>
                <option value="ib">Investment Banking — Analyst / Associate</option>
              </select>

              <div className="text-sm text-gray-500">
                Tip: choose the role closest to the job description you pasted.
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h3 className="font-medium mb-2">Step 4 — Generate Tailored Resume</h3>
              <TailorForm resumeText={resumeText} jd={jd} role={role} />
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={back}
              disabled={step === 1}
              className="px-4 py-2 border rounded-md text-sm"
            >
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={next}
                className="px-4 py-2 bg-[#0b3b72] text-white rounded-md"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-yellow-400 text-[#071133] rounded-md"
              >
                Start Over
              </button>
            )}
          </div>
        </div>

        {/* PREVIEW PANEL */}
        <aside className="col-span-4">
          <div className="p-4 border rounded-md bg-gray-50">
            <h4 className="font-medium mb-2">Preview</h4>
            <p className="text-sm text-gray-600">
              This panel shows a quick summary of what will be used to tailor your resume:
            </p>

            <div className="mt-3 text-sm text-gray-700">
              <div>
                <strong>Resume:</strong>{' '}
                {resumeText ? `${Math.min(200, resumeText.length)} chars pasted` : 'None'}
              </div>
              <div className="mt-2">
                <strong>Job Description:</strong>{' '}
                {jd ? `${Math.min(200, jd.length)} chars pasted` : 'None'}
              </div>
              <div className="mt-2">
                <strong>Role:</strong> {role}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Pro tip: For IB roles, include any deal size / valuation info.
          </div>
        </aside>
      </div>
    </div>
  )
}
