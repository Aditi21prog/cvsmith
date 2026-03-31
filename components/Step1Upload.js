// components/Step1Upload.js
import React from "react";

export default function Step1Upload({ onFileUpload, onTextChange }) {

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) {
      console.log("📄 Uploaded File:", file);
      onFileUpload(file);
    }
  }

  return (
    <div className="space-y-4">

      {/* File Upload */}
      <div>
        <label className="block font-semibold mb-2">
          Upload Resume (PDF / DOCX)
        </label>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFile}
          className="border p-2 rounded w-full bg-white"
        />
      </div>

      {/* Text Paste */}
      <div>
        <label className="block font-semibold mb-2">
          OR Paste Resume Text
        </label>

        <textarea
          rows={8}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste your resume text here..."
          className="w-full p-3 border rounded bg-white"
        ></textarea>
      </div>

    </div>
  );
}
