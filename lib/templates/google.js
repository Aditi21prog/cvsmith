/**
 * lib/templates/google.js
 *
 * Google-style resume template — clean, colourful, structured.
 *
 * renderGooglePreview() now accepts BOTH schemas:
 *   1. The meta+sections schema (what /api/tailor returns) ← primary
 *   2. The flat schema (name, experience[], skills{}, contact{}) ← legacy
 *
 * A normalizeForGoogle() adapter converts schema 1 → schema 2 internally.
 */

import React from "react";

/* ─── Brand colours ───────────────────────────────────────────────────────── */
const G = {
  blue:   "#4285F4",
  red:    "#EA4335",
  yellow: "#FBBC05",
  green:  "#34A853",
};

/* ─── Schema adapter ──────────────────────────────────────────────────────── */
function normalizeForGoogle(resume) {
  // If already flat schema (has top-level name or experience array), pass through
  if (resume?.name || Array.isArray(resume?.experience)) return resume;

  // Convert from meta+sections schema
  const meta     = resume?.meta     || {};
  const sections = resume?.sections || [];

  const find = (...types) =>
    sections.find((s) =>
      types.includes((s.type || s.title || "").toLowerCase().trim())
    );

  const expSection   = find("experience", "work experience", "work");
  const eduSection   = find("education");
  const projSection  = find("projects");
  const skillSection = find("skills", "technical skills", "core skills");
  const sumSection   = find("summary", "profile", "objective", "professional summary");

  // Experience
  const experience = (expSection?.items || []).map((item) => ({
    title:     item.role  || item.title  || "",
    company:   item.org   || item.company || "",
    location:  item.location || "",
    date:      item.date  ||
               (item.start && item.end   ? `${item.start} – ${item.end}`   :
                item.start               ? `${item.start} – Present`       : ""),
    bullets:   item.bullets || item.descriptions || item.details || [],
  }));

  // Education
  const education = (eduSection?.items || []).map((item) => ({
    degree:      item.role || item.degree || item.title || "",
    institution: item.org  || item.institution || "",
    year:        item.date ||
                 (item.start && item.end ? `${item.start} – ${item.end}` :
                  item.start             ? item.start                    : ""),
    gpa: item.gpa || "",
  }));

  // Projects
  const projects = (projSection?.items || []).map((item) => ({
    name:        item.role  || item.title || item.name || "",
    description: item.org   || item.description || "",
    bullets:     item.bullets || item.descriptions || item.details || [],
    tech:        item.tech  || "",
  }));

  // Skills — convert flat text items into groups
  const rawSkills = skillSection?.items || [];
  const skills = rawSkills.length
    ? [{ label: "Skills", items: rawSkills.map((s) => s.text || s.role || String(s)).filter(Boolean) }]
    : [];

  // Summary text
  const summary = (sumSection?.items || [])
    .map((s) => s.text || s.role || String(s))
    .filter(Boolean)
    .join(" ");

  return {
    name:         meta.name     || "",
    title:        meta.title    || meta.headline || meta.jobTitle || "",
    tagline:      meta.tagline  || "",
    summary,
    contact: {
      email:    meta.email    || "",
      phone:    meta.phone    || "",
      location: meta.location || "",
      linkedin: meta.linkedin || "",
      website:  meta.website  || "",
      github:   meta.github   || "",
    },
    experience,
    education,
    projects,
    skills,
    achievements: [],
    interests:    [],
    impact:       [],
    quote:        null,
  };
}

/* ─── Tiny helpers ────────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div style={{ display: "flex", height: 3, width: "100%", margin: "10px 0" }}>
      {[G.blue, G.red, G.yellow, G.green].map((c) => (
        <div key={c} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}

function SectionHeading({ children, color = G.blue }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color,
      borderBottom: `2px solid ${color}`,
      paddingBottom: 4,
      marginBottom: 10,
      fontFamily: "'Google Sans', 'Product Sans', 'Roboto', sans-serif",
    }}>
      {children}
    </div>
  );
}

function ContactItem({ icon, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6, fontSize: 11.5 }}>
      <span style={{ color: G.blue, fontSize: 13, marginTop: 1 }}>{icon}</span>
      <span style={{ color: "#3c4043", lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function SkillGroup({ label, skills, dotColor }) {
  if (!skills?.length) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: dotColor, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {skills.map((s, i) => (
          <span key={i} style={{
            fontSize: 10.5,
            color: "#3c4043",
            background: "#f1f3f4",
            borderRadius: 3,
            padding: "2px 6px",
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function EntryBlock({ title, subtitle, location, date, bullets, dotColor = G.blue }) {
  return (
    <div style={{ marginBottom: 14, display: "flex", gap: 10 }}>
      <div style={{ flexShrink: 0, marginTop: 4 }}>
        <div style={{
          width: 9, height: 9, borderRadius: "50%",
          background: dotColor, border: `2px solid ${dotColor}`,
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5, color: "#202124" }}>{title}</div>
          {location && (
            <div style={{
              fontSize: 10, color: "#fff", background: G.blue,
              borderRadius: 3, padding: "2px 7px", fontWeight: 500,
            }}>{location}</div>
          )}
        </div>
        {subtitle && <div style={{ fontSize: 11, color: G.blue, marginBottom: 2 }}>{subtitle}</div>}
        {date     && <div style={{ fontSize: 10.5, color: "#80868b", marginBottom: 4 }}>{date}</div>}
        {bullets?.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 14, listStyleType: "disc" }}>
            {bullets.map((b, i) => (
              <li key={i} style={{ fontSize: 11, color: "#3c4043", lineHeight: 1.55, marginBottom: 2 }}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ImpactBar({ stats }) {
  if (!stats?.length) return null;
  const icons  = ["👥", "📈", "🏆", "</>"];
  const colors = [G.blue, G.red, G.yellow, G.green];
  return (
    <div style={{
      display: "flex", gap: 8, background: "#f8f9fa",
      borderRadius: 8, padding: "10px 14px", marginBottom: 16, flexWrap: "wrap",
    }}>
      {stats.slice(0, 4).map((s, i) => (
        <div key={i} style={{
          flex: 1, minWidth: 80, background: "#fff",
          border: "1px solid #e8eaed", borderRadius: 6,
          padding: "8px 10px", textAlign: "center",
        }}>
          <div style={{ fontSize: 18 }}>{icons[i] || "⭐"}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors[i] }}>{s.value}</div>
          <div style={{ fontSize: 9.5, color: "#80868b", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */
export function renderGooglePreview(rawResume) {
  // Normalise whichever schema was passed in
  const resume = normalizeForGoogle(rawResume);

  const {
    name         = "Your Name",
    title        = "",
    tagline      = "",
    summary      = "",
    contact      = {},
    education    = [],
    skills       = [],
    achievements = [],
    interests    = [],
    experience   = [],
    projects     = [],
    impact       = [],
    quote        = null,
  } = resume;

  const skillEntries = Array.isArray(skills)
    ? skills
    : Object.entries(skills).map(([label, items]) => ({ label, items }));

  const dotColors = [G.blue, G.yellow, G.green, G.red];

  return (
    <div style={{
      fontFamily: "'Google Sans', 'Product Sans', 'Roboto', Arial, sans-serif",
      background: "#fff",
      width: "100%",
      maxWidth: 820,
      margin: "0 auto",
      boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      borderRadius: 4,
      overflow: "hidden",
      color: "#202124",
    }}>

      {/* ── HEADER ── */}
      <div style={{ padding: "28px 32px 18px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1, color: "#202124", margin: 0 }}>{name}</h1>
            <div style={{ fontSize: 14, color: "#80868b", marginTop: 4 }}>{title}</div>
            {tagline && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {tagline.split(/[.,;]+/).filter(Boolean).slice(0, 3).map((t, i) => (
                  <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: dotColors[i] }}>
                    {t.trim()}{i < 2 ? "." : ""}
                  </span>
                ))}
              </div>
            )}
          </div>

          {summary && (
            <div style={{
              flex: "1 1 240px", maxWidth: 300,
              border: "1.5px solid #e8eaed", borderRadius: 8,
              padding: "12px 16px", fontSize: 11.5, lineHeight: 1.65,
              color: "#3c4043", position: "relative", background: "#fafafa",
            }}>
              <div style={{
                position: "absolute", left: 0, top: 10, bottom: 10, width: 3,
                background: `linear-gradient(to bottom, ${G.blue}, ${G.red}, ${G.yellow}, ${G.green})`,
                borderRadius: 2,
              }} />
              <div style={{ paddingLeft: 8 }}>{summary}</div>
            </div>
          )}

          {/* Decorative dot grid */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, opacity: 0.35 }}>
            {[G.blue, G.red, G.yellow, G.green].map((c, ri) => (
              <div key={ri} style={{ display: "flex", gap: 6 }}>
                {[0,1,2,3].map((ci) => (
                  <div key={ci} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: ci === 3 ? c : "#dadce0",
                  }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Divider />

      {/* ── TWO-COLUMN BODY ── */}
      <div style={{ display: "flex", padding: "0 0 20px" }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width: 220, flexShrink: 0, padding: "20px 20px 20px 28px", borderRight: "1px solid #e8eaed" }}>

          <SectionHeading color={G.blue}>Contact</SectionHeading>
          <div style={{ marginBottom: 14 }}>
            <ContactItem icon="📍" value={contact.location} />
            <ContactItem icon="✉️" value={contact.email} />
            <ContactItem icon="📞" value={contact.phone} />
            <ContactItem icon="🔗" value={contact.website} />
            <ContactItem icon="⚙️" value={contact.github} />
            <ContactItem icon="💼" value={contact.linkedin} />
          </div>

          {education?.length > 0 && (
            <>
              <SectionHeading color={G.green}>Education</SectionHeading>
              <div style={{ marginBottom: 14 }}>
                {education.map((ed, i) => (
                  <div key={i} style={{ marginBottom: 10, display: "flex", gap: 7 }}>
                    <div style={{
                      width: 9, height: 9, borderRadius: "50%",
                      background: dotColors[i % 4], flexShrink: 0, marginTop: 3,
                    }} />
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#202124" }}>{ed.degree}</div>
                      <div style={{ fontSize: 10.5, color: "#3c4043" }}>{ed.institution}</div>
                      <div style={{ fontSize: 10, color: "#80868b" }}>{ed.year}</div>
                      {ed.gpa && <div style={{ fontSize: 10, color: "#80868b" }}>CGPA: {ed.gpa}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {skillEntries.length > 0 && (
            <>
              <SectionHeading color={G.yellow}>Skills</SectionHeading>
              <div style={{ marginBottom: 14 }}>
                {skillEntries.map((sg, i) => (
                  <SkillGroup
                    key={i}
                    label={sg.label}
                    skills={sg.items ?? sg.skills}
                    dotColor={dotColors[i % 4]}
                  />
                ))}
              </div>
            </>
          )}

          {achievements?.length > 0 && (
            <>
              <SectionHeading color={G.red}>Achievements</SectionHeading>
              <div style={{ marginBottom: 14 }}>
                {achievements.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, marginBottom: 6 }}>
                    <span style={{ color: dotColors[i % 4], fontSize: 13, flexShrink: 0 }}>●</span>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#202124" }}>{a.title ?? a}</div>
                      {a.detail && <div style={{ fontSize: 10.5, color: "#80868b" }}>{a.detail}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {interests?.length > 0 && (
            <>
              <SectionHeading color={G.blue}>Interests</SectionHeading>
              <div>
                {interests.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5 }}>
                    <span style={{ color: dotColors[i % 4], fontSize: 13 }}>●</span>
                    <span style={{ fontSize: 11, color: "#3c4043" }}>{item}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* RIGHT MAIN */}
        <div style={{ flex: 1, padding: "20px 28px 0 24px" }}>

          {impact?.length > 0 && <ImpactBar stats={impact} />}

          {experience?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SectionHeading color={G.blue}>Experience</SectionHeading>
              {experience.map((exp, i) => (
                <EntryBlock
                  key={i}
                  title={exp.title ?? exp.role}
                  subtitle={exp.company}
                  location={exp.location}
                  date={exp.date}
                  bullets={exp.bullets ?? exp.points}
                  dotColor={dotColors[i % 4]}
                />
              ))}
            </div>
          )}

          {projects?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SectionHeading color={G.green}>Projects</SectionHeading>
              {projects.map((proj, i) => (
                <EntryBlock
                  key={i}
                  title={proj.name ?? proj.title}
                  subtitle={proj.description}
                  location={proj.type ?? proj.tag}
                  date={proj.tech ? `Tech: ${proj.tech}` : null}
                  bullets={proj.bullets ?? proj.points}
                  dotColor={dotColors[(i + 2) % 4]}
                />
              ))}
            </div>
          )}

          {quote && (
            <div style={{
              background: "#f8f9fa",
              borderLeft: `4px solid ${G.blue}`,
              borderRadius: "0 8px 8px 0",
              padding: "10px 16px",
              marginTop: 12,
            }}>
              <div style={{ fontSize: 13, color: G.blue, fontStyle: "italic" }}>❝ {quote.text}</div>
              {quote.source && (
                <div style={{ fontSize: 10.5, color: "#80868b", marginTop: 4 }}>— {quote.source}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <Divider />
    </div>
  );
}