import React from "react";

export default function Step2JD({ jd, onChange }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 2 — Paste Job Description</h2>

      <label className="block text-sm font-medium mb-2">Job Description</label>

      <textarea
        rows={10}
        value={jd}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here"
        className="w-full p-3 border rounded-md bg-white"
      ></textarea>
    </div>
  );
}
