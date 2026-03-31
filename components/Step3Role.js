import React from "react";

export default function Step3Role({ role, onChange }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 3 — Choose Role</h2>

      <label className="block text-sm font-medium mb-2">Select a role</label>

      <select
        value={role}
        onChange={(e) => onChange(e.target.value)}
        className="p-3 border rounded-md"
      >
        <option value="audit">Audit — Big4 / Internal Audit</option>
        <option value="ib">Investment Banking — Analyst / Associate</option>
      </select>

      <p className="text-gray-600 text-sm mt-3">
        Pro tip: For IB roles, include deal size / valuation info.
      </p>
    </div>
  );
}
