// lib/templates/render.js
export function escape(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderList(arr) {
  if (!Array.isArray(arr)) return "";
  return arr
    .map(item => `<li>${escape(item)}</li>`)
    .join("");
}

export function renderExperience(expArr) {
  if (!Array.isArray(expArr)) return "";

  return expArr
    .map(exp => `
      <div class="exp-block">
        <div class="sub"><strong>${escape(exp.title)}</strong> — ${escape(exp.company)}</div>
        <div class="date">${escape(exp.start)} to ${escape(exp.end)}</div>
        <ul>
          ${renderList(exp.bullets)}
        </ul>
      </div>
    `)
    .join("");
}
