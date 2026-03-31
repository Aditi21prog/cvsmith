/* ─── lib/templates/modern.js ────────────────────────────────────────────── */

/* ── DOCX normaliser (used by download-docx.js) ── */
export function renderModern(resume) {
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
    return {
      title: (s.type || s.title || "Section").toUpperCase(),
      items: enriched,
    };
  }).filter(Boolean);
}

/* ═══════════════════════════════════════════════════════════════════════════
   BROWSER PREVIEW — Modern / ATS-friendly
   • Very large thin name  (left ~55%)  +  stacked contact right-aligned
   • Thin blue-grey divider
   • Body: left label column (≈28%) + right content column (≈72%)
   • Section labels: small, muted, letter-spaced
   • Role bold + date right-aligned via flex
   • Org in teal-blue
   ═══════════════════════════════════════════════════════════════════════════ */
export function renderModernPreview(resume) {
  const meta     = resume?.meta     || {};
  const sections = resume?.sections || [];

  const contactLines = [
    meta.email,
    meta.phone,
    meta.location,
    meta.linkedin || meta.website,
  ].filter(Boolean);

  const sectionLabel = (s) => (s.type || s.title || "Section").toUpperCase();

  return (
    <div style={S.page}>

      {/* ══ HEADER ══ */}
      <div style={S.header}>

        {/* Left: large thin name + subtitle */}
        <div style={S.headerLeft}>
          <h1 style={S.name}>{meta.name || "Your Name"}</h1>
          {(meta.title || meta.headline || meta.jobTitle) && (
            <p style={S.subtitle}>{meta.title || meta.headline || meta.jobTitle}</p>
          )}
        </div>

        {/* Right: contact stack, right-aligned, uppercase */}
        <div style={S.headerRight}>
          {contactLines.map((line, i) => (
            <p key={i} style={S.contactLine}>{line.toUpperCase()}</p>
          ))}
        </div>

      </div>

      {/* ── Thin divider ── */}
      <div style={S.divider} />

      {/* ══ BODY — label col + content col per section ══ */}
      <div style={S.body}>
        {sections.map((section, si) => (
          <div key={si} style={S.row}>

            {/* Left: muted letter-spaced label */}
            <div style={S.labelCol}>
              <span style={S.label}>{sectionLabel(section)}</span>
            </div>

            {/* Right: content */}
            <div style={S.contentCol}>
              {(section.items || []).map((item, ii) => {

                /* Plain string (summary bullets, skills) */
                if (typeof item === "string" || item.text) {
                  return (
                    <p key={ii} style={S.bodyText}>{item.text || item}</p>
                  );
                }

                return (
                  <div key={ii} style={S.entry}>

                    {/* Role + date row */}
                    {item.role && (
                      <div style={S.roleRow}>
                        <span style={S.role}>{item.role}</span>
                        {item.date && (
                          <span style={S.date}>{item.date.toUpperCase()}</span>
                        )}
                      </div>
                    )}

                    {/* Org */}
                    {item.org && <p style={S.org}>{item.org}</p>}

                    {/* Bullets */}
                    {(item.bullets || []).map((b, bi) => (
                      <p key={bi} style={S.bodyText}>{b}</p>
                    ))}

                  </div>
                );
              })}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

/* ── Styles ── */
const S = {
  page: {
    fontFamily: "'Helvetica Neue', 'Segoe UI', sans-serif",
    fontSize: "13px",
    lineHeight: "1.6",
    color: "#1a1a1a",
    background: "#fff",
    padding: "52px 56px",
    maxWidth: "860px",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    gap: "24px",
  },
  headerLeft: {
    flex: "0 0 55%",
  },
  name: {
    fontFamily: "'Helvetica Neue', sans-serif",
    fontSize: "44px",
    fontWeight: "200",
    letterSpacing: "-0.01em",
    margin: "0 0 6px",
    color: "#0d0d0d",
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: "14px",
    color: "#777",
    fontWeight: "300",
    margin: 0,
    letterSpacing: "0.01em",
  },
  headerRight: {
    flex: "0 0 40%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
    paddingTop: "6px",
  },
  contactLine: {
    margin: 0,
    fontSize: "10.5px",
    fontWeight: "600",
    letterSpacing: "0.06em",
    color: "#444",
  },
  divider: {
    height: "1px",
    background: "#c5d5e0",
    marginBottom: "28px",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  row: {
    display: "flex",
    gap: "0",
  },
  labelCol: {
    flex: "0 0 28%",
    paddingTop: "2px",
    paddingRight: "20px",
  },
  label: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.14em",
    color: "#8fa8b8",
    display: "block",
    paddingTop: "2px",
  },
  contentCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  entry: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  roleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "12px",
  },
  role: {
    fontWeight: "700",
    fontSize: "14px",
    color: "#111",
  },
  date: {
    fontSize: "10.5px",
    color: "#6688aa",
    fontWeight: "600",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  },
  org: {
    margin: "1px 0 4px",
    fontSize: "13px",
    color: "#2277aa",
    fontWeight: "500",
  },
  bodyText: {
    margin: "2px 0",
    fontSize: "12.5px",
    color: "#333",
    lineHeight: "1.55",
  },
};