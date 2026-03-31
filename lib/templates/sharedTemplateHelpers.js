// lib/templates/sharedTemplateHelpers.js

/* =====================================================
   VALIDATION
===================================================== */
export function validate(resume) {
  if (!resume || !resume.meta || !Array.isArray(resume.sections)) {
    throw new Error("Invalid resume data");
  }
}

/* =====================================================
   SAFE VALUE
===================================================== */
export function safe(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return "";
  return String(v);
}

/* =====================================================
   HEADER
===================================================== */
export function headerHTML(meta) {
  return `
    <h1>${safe(meta.name)}</h1>
    <div class="sub">
      ${[meta.email, meta.phone, meta.linkedin, meta.website]
        .filter(Boolean)
        .map(safe)
        .join(" | ")}
    </div>
  `;
}

export function headerPreview(meta) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold">{meta.name}</h1>
      <div className="text-sm">
        {[meta.email, meta.phone, meta.linkedin, meta.website]
          .filter(Boolean)
          .join(" | ")}
      </div>
    </div>
  );
}

/* =====================================================
   SECTION HTML RENDERER
===================================================== */
export function renderSectionHTMLCommon(section) {
  switch (section.type) {

    case "experience":
      return `
        <h2>${safe(section.heading)}</h2>
        ${(section.items || []).map(e => `
          <strong>${safe(e.title)}${e.company ? ", " + safe(e.company) : ""}</strong><br/>
          <span class="sub">${safe(e.start)}${e.end ? " – " + safe(e.end) : ""}</span>
          <ul>
            ${(e.bullets || []).map(b => `<li>${safe(b)}</li>`).join("")}
          </ul>
        `).join("")}
      `;

    case "skills":
      return `
        <h2>${safe(section.heading)}</h2>
        <ul>
          ${(section.groups || []).map(g => `
            <li><strong>${safe(g.label)}:</strong> ${(g.items || []).map(safe).join(", ")}</li>
          `).join("")}
        </ul>
      `;

    case "education":
      return `
        <h2>${safe(section.heading)}</h2>
        <ul>
          ${(section.items || []).map(e => `
            <li>
              <strong>${safe(e.degree)}</strong>${e.institution ? ", " + safe(e.institution) : ""}
              <br/>
              <span class="sub">${safe(e.start)}${e.end ? " – " + safe(e.end) : ""}</span>
            </li>
          `).join("")}
        </ul>
      `;

    default:
      return `
        <h2>${safe(section.heading)}</h2>
        <ul>
          ${(section.items || []).map(i => `<li>${safe(i)}</li>`).join("")}
        </ul>
      `;
  }
}

/* =====================================================
   SECTION PREVIEW RENDERER
===================================================== */
export function renderSectionPreviewCommon(section) {

  switch (section.type) {

    case "experience":
      return (section.items || []).map((e, i) => (
        <div key={i} className="mb-3">
          <div className="font-semibold">
            {e.title}{e.company ? `, ${e.company}` : ""}
          </div>
          <div className="text-xs text-gray-600">
            {e.start}{e.end ? ` – ${e.end}` : ""}
          </div>
          <ul className="list-disc ml-5">
            {(e.bullets || []).map((b, j) => (
              <li key={j}>{b}</li>
            ))}
          </ul>
        </div>
      ));

    case "skills":
      return (section.groups || []).map((g, i) => (
        <div key={i}>
          <strong>{g.label}:</strong> {(g.items || []).join(", ")}
        </div>
      ));

    case "education":
      return (section.items || []).map((e, i) => (
        <div key={i}>
          <strong>{e.degree}</strong>{e.institution ? `, ${e.institution}` : ""}
        </div>
      ));

    default:
      return (
        <ul className="list-disc ml-5">
          {(section.items || []).map((i, k) => (
            <li key={k}>{i}</li>
          ))}
        </ul>
      );
  }
}
