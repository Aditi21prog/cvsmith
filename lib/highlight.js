// utils/highlight.js
export function highlightKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return text;

  const escaped = keywords.map(k =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

  return text.replace(regex, match => {
    return `<span class="px-1 rounded bg-yellow-300 text-black font-semibold">${match}</span>`;
  });
}
