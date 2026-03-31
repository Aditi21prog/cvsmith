/* ─── lib/templates/premium.js ───────────────────────────────────────────── */

/* ── DOCX data normaliser (used by download-docx.js) ── */
export function renderPremium(resume) {
  return { meta: resume?.meta || {}, sections: normaliseSections(resume?.sections) };
}

function normaliseSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections.map((s) => {
    if (!s) return null;
    let items = s.items;
    if (!items && s.content) {
      items = s.content.split(/\n|•|\u2022/).map((x) => x.trim()).filter(Boolean);
    }
    const enriched = Array.isArray(items) ? items.map((item) => {
      if (typeof item === "string") return { text: item };
      return {
        role: item.role || item.title || item.degree || "",
        org: item.company || item.institution || "",
        date: item.date || item.duration || item.period ||
          (item.start && item.end ? `${item.start} – ${item.end}` :
           item.start ? `${item.start} – Present` : ""),
        location: item.location || "",
        bullets: item.bullets || item.descriptions || item.details || [],
      };
    }) : [];
    return { title: toTitleCase(s.type || s.title || "Section"), items: enriched };
  }).filter(Boolean);
}

function toTitleCase(str) {
  const minor = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","in","of"]);
  return str.toLowerCase().split(" ").map((w, i) =>
    i === 0 || !minor.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(" ");
}

/* ═══════════════════════════════════════════════════════════════════════════
   BROWSER PREVIEW  — Big4 / Consulting  —  Formal, black & white, structured
   ═══════════════════════════════════════════════════════════════════════════ */
export function renderPremiumPreview(resume) {
  const meta     = resume?.meta     || {};
  const sections = resume?.sections || [];

  const contact = [meta.email, meta.phone, meta.location, meta.linkedin]
    .filter(Boolean).join("  ·  ");

  /* helper: section type → display label */
  const label = (s) => toTitleCase(s.type || s.title || "Section");

  return (
    <div style={styles.page}>

      {/* ── NAME / CONTACT HEADER ── */}
      <div style={styles.header}>
        <h1 style={styles.name}>{meta.name || "Your Name"}</h1>
        {(meta.title || meta.headline) && (
          <p style={styles.headline}>{meta.title || meta.headline}</p>
        )}
        <p style={styles.contact}>{contact}</p>
      </div>

      {/* ── SECTIONS ── */}
      {sections.map((section, si) => {
        const items = section.items || [];
        const sectionLabel = label(section);

        return (
          <div key={si} style={styles.section}>

            {/* Section title with ruled line */}
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>{sectionLabel.toUpperCase()}</span>
              <div style={styles.rule} />
            </div>

            {items.map((item, ii) => {
              /* plain string / summary bullet */
              if (typeof item === "string" || item.text) {
                const t = item.text || item;
                return (
                  <p key={ii} style={styles.bullet}>• {t}</p>
                );
              }

              return (
                <div key={ii} style={styles.entry}>

                  {/* Role row */}
                  {(item.role || item.title || item.degree) && (
                    <div style={styles.entryRow}>
                      <span style={styles.entryRole}>
                        {item.role || item.title || item.degree}
                      </span>
                      <span style={styles.entryDate}>
                        {item.date ||
                          (item.start && item.end ? `${item.start} – ${item.end}` :
                           item.start ? `${item.start} – Present` : "")}
                      </span>
                    </div>
                  )}

                  {/* Org row */}
                  {(item.company || item.institution || item.org) && (
                    <div style={styles.entryRow}>
                      <span style={styles.entryOrg}>
                        {item.company || item.institution || item.org}
                        {item.location ? `,  ${item.location}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Bullets */}
                  {(item.bullets || item.descriptions || item.details || []).map((b, bi) => (
                    <p key={bi} style={styles.bullet}>• {b}</p>
                  ))}

                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ── Styles ── */
const styles = {
  page: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "13px",
    lineHeight: "1.55",
    color: "#111",
    background: "#fff",
    padding: "48px 52px",
    maxWidth: "820px",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #111",
  },
  name: {
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "0.04em",
    margin: "0 0 4px",
    textTransform: "uppercase",
  },
  headline: {
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#555",
    margin: "0 0 6px",
  },
  contact: {
    fontSize: "11.5px",
    color: "#444",
    margin: 0,
  },
  section: {
    marginBottom: "20px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.14em",
    whiteSpace: "nowrap",
    color: "#111",
  },
  rule: {
    flex: 1,
    height: "1px",
    background: "#111",
  },
  entry: {
    marginBottom: "12px",
  },
  entryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "8px",
  },
  entryRole: {
    fontWeight: "700",
    fontSize: "13px",
  },
  entryDate: {
    fontSize: "11.5px",
    color: "#444",
    whiteSpace: "nowrap",
    fontStyle: "italic",
  },
  entryOrg: {
    fontStyle: "italic",
    fontSize: "12.5px",
    color: "#333",
  },
  bullet: {
    margin: "3px 0 3px 14px",
    fontSize: "12.5px",
    color: "#222",
  },
};