/* ─── lib/templates/creative.js ──────────────────────────────────────────── */

/* ── DOCX normaliser ── */
export function renderCreative(resume) {
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
        bullets: item.bullets || item.descriptions || item.details || [],
      };
    }) : [];
    return { title: labelMap(s.type || s.title || ""), items: enriched };
  }).filter(Boolean);
}

function labelMap(t) {
  const map = {
    experience:"EXPERIENCE", work:"EXPERIENCE", education:"EDUCATION",
    skills:"SKILLS", projects:"PROJECTS", summary:"SUMMARY",
    objective:"SUMMARY", profile:"SUMMARY", certifications:"CERTIFICATIONS",
    awards:"AWARDS", languages:"LANGUAGES", interests:"INTERESTS",
  };
  return map[t.toLowerCase()] || t.toUpperCase();
}

/* ═══════════════════════════════════════════════════════════════════════════
   BROWSER PREVIEW  — Creative / Design-focused
   Layout matches screenshot:
     • Dark navy sidebar (left ~32%):  initials circle, name, title, contact
     • White main area (right ~68%):   right-aligned grey section headers,
                                        teal dot + vertical bar accent,
                                        bold role, teal org+date, body text
   ═══════════════════════════════════════════════════════════════════════════ */

const SIDEBAR_SECTIONS = new Set(["SKILLS","LANGUAGES","INTERESTS","CERTIFICATIONS","AWARDS"]);

export function renderCreativePreview(resume) {
  const meta     = resume?.meta     || {};
  const sections = resume?.sections || [];

  const initials = (meta.name || "?")
    .split(" ").map((w) => w[0] || "").slice(0, 2).join("").toUpperCase();

  const sidebarSections = sections.filter((s) => SIDEBAR_SECTIONS.has(s.title));
  const mainSections    = sections.filter((s) => !SIDEBAR_SECTIONS.has(s.title));

  return (
    <div style={C.page}>

      {/* ══ SIDEBAR ══ */}
      <div style={C.sidebar}>

        {/* Avatar circle */}
        <div style={C.avatarWrap}>
          <div style={C.avatar}>{initials}</div>
        </div>

        {/* Name */}
        <h1 style={C.sidebarName}>{meta.name || "Your Name"}</h1>

        {/* Job title */}
        {(meta.title || meta.headline || meta.jobTitle) && (
          <p style={C.sidebarTitle}>
            {(meta.title || meta.headline || meta.jobTitle).toUpperCase()}
          </p>
        )}

        {/* Contact */}
        <p style={C.sidebarSectionLabel}>CONTACT</p>

        {meta.email    && <p style={C.sidebarContact}>✉&nbsp;&nbsp;{meta.email}</p>}
        {meta.phone    && <p style={C.sidebarContact}>✆&nbsp;&nbsp;{meta.phone}</p>}
        {meta.location && <p style={C.sidebarContact}>⊙&nbsp;&nbsp;{meta.location}</p>}
        {meta.linkedin && <p style={C.sidebarContact}>in&nbsp;&nbsp;{meta.linkedin}</p>}

        {/* Sidebar sections (Skills, Languages, etc.) */}
        {sidebarSections.map((s, si) => (
          <div key={si} style={{ marginTop: "22px" }}>
            <p style={C.sidebarSectionLabel}>{s.title}</p>
            {(s.items || []).map((item, ii) => (
              <p key={ii} style={C.sidebarItem}>
                • {item.text || item.role || ""}
              </p>
            ))}
          </div>
        ))}

      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div style={C.main}>
        {mainSections.map((section, si) => (
          <div key={si} style={C.section}>

            {/* Section header — right-aligned with left rule */}
            <div style={C.sectionHeaderRow}>
              <div style={C.sectionRule} />
              <span style={C.sectionTitle}>{section.title}</span>
            </div>

            {/* Items */}
            {(section.items || []).map((item, ii) => {

              if (typeof item === "string" || item.text) {
                return (
                  <div key={ii} style={C.itemRow}>
                    <div style={C.dotCol}>
                      <span style={C.dot}>●</span>
                      <div style={C.vline} />
                    </div>
                    <p style={C.bodyText}>{item.text || item}</p>
                  </div>
                );
              }

              return (
                <div key={ii} style={C.itemRow}>

                  {/* Dot + vertical line */}
                  <div style={C.dotCol}>
                    <span style={C.dot}>●</span>
                    <div style={C.vline} />
                  </div>

                  {/* Content */}
                  <div style={C.itemContent}>

                    {item.role && (
                      <p style={C.role}>{item.role}</p>
                    )}

                    {(item.org || item.date) && (
                      <p style={C.orgDate}>
                        {[item.org, item.date].filter(Boolean).join("  |  ").toUpperCase()}
                      </p>
                    )}

                    {(item.bullets || []).map((b, bi) => (
                      <p key={bi} style={C.bodyText}>{b}</p>
                    ))}

                  </div>
                </div>
              );
            })}

          </div>
        ))}
      </div>

    </div>
  );
}

/* ── Styles ── */
const NAVY  = "#1b2b3b";
const TEAL  = "#1fbfbf";
const WHITE = "#ffffff";

const C = {
  page: {
    display: "flex",
    fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
    fontSize: "13px",
    lineHeight: "1.55",
    color: "#1a1a1a",
    background: WHITE,
    maxWidth: "860px",
    margin: "0 auto",
    minHeight: "1000px",
    boxSizing: "border-box",
  },

  /* ── Sidebar ── */
  sidebar: {
    flex: "0 0 31%",
    background: NAVY,
    padding: "36px 22px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    boxSizing: "border-box",
  },
  avatarWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: TEAL,
    color: NAVY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "0.02em",
  },
  sidebarName: {
    color: WHITE,
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 4px",
    lineHeight: 1.2,
    textAlign: "left",
    width: "100%",
  },
  sidebarTitle: {
    color: TEAL,
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    margin: "0 0 20px",
  },
  sidebarSectionLabel: {
    color: "#8899aa",
    fontSize: "9.5px",
    fontWeight: "700",
    letterSpacing: "0.14em",
    margin: "16px 0 8px",
    textTransform: "uppercase",
  },
  sidebarContact: {
    color: WHITE,
    fontSize: "11.5px",
    margin: "0 0 5px",
    wordBreak: "break-all",
  },
  sidebarItem: {
    color: WHITE,
    fontSize: "12px",
    margin: "0 0 4px",
  },

  /* ── Main ── */
  main: {
    flex: 1,
    padding: "36px 32px 40px 28px",
    background: "#f7f9fc",
    boxSizing: "border-box",
  },
  section: {
    marginBottom: "26px",
  },
  sectionHeaderRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "14px",
    gap: "10px",
  },
  sectionRule: {
    flex: 1,
    height: "1px",
    background: "#c8d8e8",
  },
  sectionTitle: {
    fontSize: "10.5px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    color: "#8899aa",
    whiteSpace: "nowrap",
  },
  itemRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "14px",
  },
  dotCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "2px",
    flexShrink: 0,
  },
  dot: {
    color: TEAL,
    fontSize: "10px",
    lineHeight: 1,
  },
  vline: {
    flex: 1,
    width: "1px",
    background: "#c8d8e8",
    marginTop: "4px",
    minHeight: "20px",
  },
  itemContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  role: {
    fontWeight: "700",
    fontSize: "14px",
    color: "#111",
    margin: 0,
  },
  orgDate: {
    fontSize: "10.5px",
    fontWeight: "700",
    color: TEAL,
    letterSpacing: "0.04em",
    margin: "2px 0 5px",
  },
  bodyText: {
    fontSize: "12.5px",
    color: "#333",
    margin: "2px 0",
    lineHeight: "1.55",
  },
};