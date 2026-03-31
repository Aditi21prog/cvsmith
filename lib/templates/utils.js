export function safe(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string" && !value.trim()) return fallback;
  return value;
}

export function renderIf(condition, html) {
  return condition ? html : "";
}

export function renderList(arr, renderer) {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr.map(renderer).join("");
}

export function groupSkills(skills = []) {
  const groups = {
    "Audit & Risk": [],
    "Finance & Transactions": [],
    "Tools & Technology": [],
    "Data & Analytics": [],
    "Professional Skills": [],
  };

  skills.forEach((skill) => {
    const s = skill.toLowerCase();
    if (s.includes("audit") || s.includes("risk") || s.includes("control"))
      groups["Audit & Risk"].push(skill);
    else if (s.includes("valuation") || s.includes("m&a") || s.includes("finance"))
      groups["Finance & Transactions"].push(skill);
    else if (s.includes("excel") || s.includes("power") || s.includes("sql"))
      groups["Tools & Technology"].push(skill);
    else if (s.includes("data") || s.includes("analytics") || s.includes("tableau"))
      groups["Data & Analytics"].push(skill);
    else groups["Professional Skills"].push(skill);
  });

  return groups;
}
export function cleanList(arr = []) {
  return arr.filter(
    (x) =>
      typeof x === "string"
        ? x.trim().length > 0
        : x && Object.values(x).some(v => v && String(v).trim())
  );
}
