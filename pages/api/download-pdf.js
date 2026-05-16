import puppeteer from "puppeteer";

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contactLine(meta, sep = " | ") {
  return [meta.phone, meta.email, meta.linkedin, meta.location]
    .filter(Boolean).map(esc).join(sep);
}

function itemDate(item) {
  return esc(
    item.date || item.duration || item.period ||
    (item.start && item.end ? `${item.start} – ${item.end}` :
     item.start ? `${item.start} – Present` : "")
  );
}

function normaliseSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections.map((s) => {
    if (!s) return null;
    let items = s.items;
    if (!items && s.content) {
      items = s.content.split(/\n|•|\u2022|,/).map((x) => x.trim()).filter(Boolean);
    }
    return { title: esc(s.type || s.title || "Section"), items: Array.isArray(items) ? items : [] };
  }).filter(Boolean);
}

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIUM HTML  —  Big4 / Consulting
   ═══════════════════════════════════════════════════════════════════════════ */
function buildPremiumHTML(resume) {
  const meta     = resume?.meta || {};
  const sections = normaliseSections(resume?.sections);

  let body = `
    <div class="header">
      <h1>${esc(meta.name) || "Unnamed Candidate"}</h1>
      ${meta.title || meta.headline ? `<p class="headline">${esc(meta.title || meta.headline)}</p>` : ""}
      <p class="contact">${contactLine(meta, "  ·  ")}</p>
    </div>
  `;

  sections.forEach((s) => {
    body += `
      <div class="section">
        <div class="section-header">
          <span class="section-title">${s.title.toUpperCase()}</span>
          <div class="rule"></div>
        </div>
    `;

    s.items.forEach((item) => {
      if (!item) return;

      if (typeof item === "string" || item.text) {
        body += `<p class="bullet">• ${esc(item.text || item)}</p>`;
        return;
      }

      const role = esc(item.role || item.title || item.degree || "");
      const org  = esc(item.company || item.institution || item.org || "");
      const date = itemDate(item);
      const loc  = esc(item.location || "");
      const bullets = item.bullets || item.descriptions || item.details || [];

      body += `<div class="entry">`;
      if (role) body += `
        <div class="row">
          <strong>${role}</strong>
          <span class="date">${date}</span>
        </div>`;
      if (org) body += `
        <div class="row">
          <em>${org}${loc ? `, ${loc}` : ""}</em>
        </div>`;
      if (bullets.length) {
        body += `<ul>${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`;
      }
      body += `</div>`;
    });

    body += `</div>`;
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 36px 44px; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12px;
      line-height: 1.55;
      color: #111;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 2px solid #111;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .headline {
      font-size: 10.5px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #555;
      margin-bottom: 5px;
    }
    .contact { font-size: 10.5px; color: #444; }
    .section { margin-bottom: 16px; }
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.16em;
      white-space: nowrap;
    }
    .rule { flex: 1; height: 1px; background: #111; }
    .entry { margin-bottom: 10px; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .row strong { font-size: 12px; }
    .row em { font-size: 11.5px; color: #333; }
    .date { font-size: 10.5px; color: #555; font-style: italic; white-space: nowrap; }
    ul { margin: 4px 0 0 16px; }
    li { font-size: 11.5px; margin-bottom: 2px; }
    .bullet { margin: 3px 0 3px 12px; font-size: 11.5px; }
  </style></head><body>${body}</body></html>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODERN HTML  —  ATS Friendly
   ═══════════════════════════════════════════════════════════════════════════ */
function buildModernHTML(resume) {
  const meta     = resume?.meta || {};
  const sections = normaliseSections(resume?.sections);

  const contactLines = [meta.email, meta.phone, meta.location, meta.linkedin || meta.website]
    .filter(Boolean).map(esc);

  let body = `
    <div class="header">
      <div class="header-left">
        <h1>${esc(meta.name) || "Unnamed Candidate"}</h1>
        ${meta.title || meta.headline || meta.jobTitle
          ? `<p class="subtitle">${esc(meta.title || meta.headline || meta.jobTitle)}</p>`
          : ""}
      </div>
      <div class="header-right">
        ${contactLines.map((l) => `<p>${l.toUpperCase()}</p>`).join("")}
      </div>
    </div>
    <div class="divider"></div>
    <div class="body">
  `;

  sections.forEach((s) => {
    body += `
      <div class="row">
        <div class="label-col">
          <span class="label">${s.title}</span>
        </div>
        <div class="content-col">
    `;

    s.items.forEach((item, ii) => {
      if (!item) return;

      if (typeof item === "string" || item.text) {
        body += `<p class="body-text">${esc(item.text || item)}</p>`;
        return;
      }

      const role = esc(item.role || item.title || item.degree || "");
      const org  = esc(item.company || item.institution || item.org || "");
      const date = itemDate(item);
      const bullets = item.bullets || item.descriptions || item.details || [];

      body += `<div class="entry${ii > 0 ? " entry-gap" : ""}">`;
      if (role) body += `
        <div class="role-row">
          <span class="role">${role}</span>
          ${date ? `<span class="date">${date.toUpperCase()}</span>` : ""}
        </div>`;
      if (org) body += `<p class="org">${org}</p>`;
      bullets.forEach((b) => { body += `<p class="body-text">${esc(b)}</p>`; });
      body += `</div>`;
    });

    body += `</div></div>`;
  });

  body += `</div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 44px 48px; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1a1a1a;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
      gap: 20px;
    }
    .header-left { flex: 0 0 55%; }
    h1 {
      font-size: 38px;
      font-weight: 200;
      letter-spacing: -0.01em;
      color: #0d0d0d;
      line-height: 1.1;
      margin-bottom: 5px;
    }
    .subtitle { font-size: 13px; color: #777; font-weight: 300; }
    .header-right {
      flex: 0 0 40%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
      padding-top: 5px;
    }
    .header-right p {
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 0.07em;
      color: #444;
    }
    .divider { height: 1px; background: #c5d5e0; margin-bottom: 24px; }
    .body { display: flex; flex-direction: column; gap: 20px; }
    .row { display: flex; }
    .label-col { flex: 0 0 27%; padding-right: 16px; padding-top: 2px; }
    .label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.16em;
      color: #8fa8b8;
      text-transform: uppercase;
      display: block;
    }
    .content-col { flex: 1; display: flex; flex-direction: column; gap: 12px; }
    .entry { display: flex; flex-direction: column; gap: 2px; }
    .entry-gap { margin-top: 4px; }
    .role-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 10px;
    }
    .role { font-weight: 700; font-size: 13px; color: #111; }
    .date { font-size: 9.5px; color: #6688aa; font-weight: 600; letter-spacing: 0.05em; white-space: nowrap; }
    .org { font-size: 12px; color: #2277aa; font-weight: 500; margin: 1px 0 3px; }
    .body-text { font-size: 11.5px; color: #333; line-height: 1.55; }
  </style></head><body>${body}</body></html>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CREATIVE HTML  —  Design Focused
   ═══════════════════════════════════════════════════════════════════════════ */
function buildCreativeHTML(resume) {
  const meta     = resume?.meta || {};
  const sections = normaliseSections(resume?.sections);

  const SIDEBAR_TITLES = new Set(["skills","languages","interests","certifications","awards"]);
  const sidebarSections = sections.filter((s) => SIDEBAR_TITLES.has(s.title.toLowerCase()));
  const mainSections    = sections.filter((s) => !SIDEBAR_TITLES.has(s.title.toLowerCase()));

  const initials = (meta.name || "?")
    .split(" ").map((w) => w[0] || "").slice(0, 2).join("").toUpperCase();

  let sidebar = `
    <div class="avatar">${initials}</div>
    <h1>${esc(meta.name) || "Unnamed"}</h1>
    ${meta.title || meta.headline || meta.jobTitle
      ? `<p class="tagline">${esc(meta.title || meta.headline || meta.jobTitle).toUpperCase()}</p>`
      : ""}
    <p class="contact-label">CONTACT</p>
    ${meta.email    ? `<p class="contact-item">✉  ${esc(meta.email)}</p>` : ""}
    ${meta.phone    ? `<p class="contact-item">✆  ${esc(meta.phone)}</p>` : ""}
    ${meta.location ? `<p class="contact-item">⊙  ${esc(meta.location)}</p>` : ""}
    ${meta.linkedin ? `<p class="contact-item">in  ${esc(meta.linkedin)}</p>` : ""}
  `;

  sidebarSections.forEach((s) => {
    sidebar += `<p class="contact-label" style="margin-top:18px">${s.title.toUpperCase()}</p>`;
    s.items.forEach((item) => {
      const t = typeof item === "string" ? item : (item.text || item.role || "");
      if (t) sidebar += `<p class="sidebar-item">• ${esc(t)}</p>`;
    });
  });

  let main = "";
  mainSections.forEach((s) => {
    main += `
      <div class="section">
        <div class="section-header">
          <div class="section-rule"></div>
          <span class="section-title">${s.title.toUpperCase()}</span>
        </div>
    `;

    s.items.forEach((item) => {
      if (!item) return;
      if (typeof item === "string" || item.text) {
        main += `
          <div class="item-row">
            <div class="dot-col"><span class="dot">●</span><div class="vline"></div></div>
            <p class="body-text">${esc(item.text || item)}</p>
          </div>`;
        return;
      }
      const role    = esc(item.role || item.title || item.degree || "");
      const org     = esc(item.company || item.institution || item.org || "");
      const date    = itemDate(item);
      const bullets = item.bullets || item.descriptions || item.details || [];
      const orgDate = [org, date].filter(Boolean).join("  |  ").toUpperCase();

      main += `
        <div class="item-row">
          <div class="dot-col"><span class="dot">●</span><div class="vline"></div></div>
          <div class="item-content">
            ${role    ? `<p class="role">${role}</p>` : ""}
            ${orgDate ? `<p class="org-date">${orgDate}</p>` : ""}
            ${bullets.map((b) => `<p class="body-text">${esc(b)}</p>`).join("")}
          </div>
        </div>`;
    });

    main += `</div>`;
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 12px; line-height: 1.55; color: #1a1a1a;
      background: #fff; display: flex; min-height: 100vh;
    }
    .sidebar {
      width: 31%; background: #1b2b3b;
      padding: 32px 18px 40px;
      display: flex; flex-direction: column; align-items: flex-start; flex-shrink: 0;
    }
    .avatar {
      width: 72px; height: 72px; border-radius: 50%;
      background: #1fbfbf; color: #1b2b3b;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 700; margin: 0 auto 14px; align-self: center;
    }
    .sidebar h1 { color: #fff; font-size: 16px; font-weight: 700; margin-bottom: 4px; line-height: 1.2; }
    .tagline { color: #1fbfbf; font-size: 9px; font-weight: 700; letter-spacing: 0.13em; margin-bottom: 18px; }
    .contact-label { color: #8899aa; font-size: 8.5px; font-weight: 700; letter-spacing: 0.16em; margin: 14px 0 7px; }
    .contact-item { color: #fff; font-size: 10.5px; margin-bottom: 4px; word-break: break-all; }
    .sidebar-item { color: #fff; font-size: 11px; margin-bottom: 3px; }
    .main { flex: 1; background: #f7f9fc; padding: 32px 28px 40px 24px; }
    .section { margin-bottom: 22px; }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .section-rule { flex: 1; height: 1px; background: #c8d8e8; }
    .section-title { font-size: 9.5px; font-weight: 700; letter-spacing: 0.18em; color: #8899aa; white-space: nowrap; }
    .item-row { display: flex; gap: 10px; margin-bottom: 12px; }
    .dot-col { display: flex; flex-direction: column; align-items: center; padding-top: 1px; flex-shrink: 0; width: 12px; }
    .dot { color: #1fbfbf; font-size: 9px; line-height: 1; }
    .vline { flex: 1; width: 1px; background: #c8d8e8; margin-top: 3px; min-height: 16px; }
    .item-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .role { font-weight: 700; font-size: 13px; color: #111; }
    .org-date { font-size: 9.5px; font-weight: 700; color: #1fbfbf; letter-spacing: 0.05em; margin: 2px 0 4px; }
    .body-text { font-size: 11px; color: #333; line-height: 1.5; }
  </style></head>
  <body>
    <div class="sidebar">${sidebar}</div>
    <div class="main">${main}</div>
  </body></html>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GOOGLE HTML  —  Tech / Engineering
   Two-column: narrow left sidebar (contact, education, skills, achievements)
   + wide right main (experience, projects). Google brand colour accents.
   Works with the meta+sections schema from /api/tailor — no separate schema needed.
   ═══════════════════════════════════════════════════════════════════════════ */
function buildGoogleHTML(resume) {
  const meta     = resume?.meta || {};
  const sections = normaliseSections(resume?.sections);

  const G = { blue: "#4285F4", red: "#EA4335", yellow: "#FBBC05", green: "#34A853" };

  const SIDEBAR_TITLES = new Set(["skills","technical skills","key skills","core skills","technologies","education","certifications","achievements","languages","interests","awards"]);
  const normalizeTitle = (t) => (t || "").toLowerCase().trim();
  const sidebarSections = sections.filter((s) => SIDEBAR_TITLES.has(normalizeTitle(s.title)));
  const mainSections    = sections.filter((s) => !SIDEBAR_TITLES.has(normalizeTitle(s.title)));

  const sectionColors = [G.blue, G.red, G.yellow, G.green];
  const dotColors     = [G.blue, G.red, G.yellow, G.green];

  /* ── Sidebar HTML ── */
  let sidebar = `
    <div class="g-contact-section">
      <div class="g-section-heading" style="color:${G.blue};border-color:${G.blue}">CONTACT</div>
      ${meta.location ? `<div class="g-contact-item"><span class="g-icon">📍</span>${esc(meta.location)}</div>` : ""}
      ${meta.email    ? `<div class="g-contact-item"><span class="g-icon">✉️</span>${esc(meta.email)}</div>` : ""}
      ${meta.phone    ? `<div class="g-contact-item"><span class="g-icon">📞</span>${esc(meta.phone)}</div>` : ""}
      ${meta.linkedin ? `<div class="g-contact-item"><span class="g-icon">💼</span>${esc(meta.linkedin)}</div>` : ""}
      ${meta.website  ? `<div class="g-contact-item"><span class="g-icon">🔗</span>${esc(meta.website)}</div>` : ""}
      ${meta.github   ? `<div class="g-contact-item"><span class="g-icon">⚙️</span>${esc(meta.github)}</div>` : ""}
    </div>
  `;

  sidebarSections.forEach((s, si) => {
    const color = sectionColors[si % sectionColors.length];
    sidebar += `<div class="g-sidebar-section">
      <div class="g-section-heading" style="color:${color};border-color:${color}">${s.title.toUpperCase()}</div>`;

    s.items.forEach((item, ii) => {
      const dotColor = dotColors[ii % dotColors.length];
      if (typeof item === "string") {
        sidebar += `<span class="g-chip">${esc(item)}</span>`;
        return;
      }
      if (item.text) {
        // Skill chip
        sidebar += `<span class="g-chip">${esc(item.text)}</span>`;
      } else {
        // Education / structured item
        const role = esc(item.role || item.degree || item.title || "");
        const org  = esc(item.org || item.institution || item.company || "");
        const date = itemDate(item);
        sidebar += `
          <div class="g-sidebar-entry">
            <div class="g-dot" style="background:${dotColor}"></div>
            <div>
              ${role ? `<div class="g-entry-title">${role}</div>` : ""}
              ${org  ? `<div class="g-entry-sub">${org}</div>` : ""}
              ${date ? `<div class="g-entry-date">${date}</div>` : ""}
            </div>
          </div>`;
      }
    });

    sidebar += `</div>`;
  });

  /* ── Main content HTML ── */
  let main = "";
  mainSections.forEach((s, si) => {
    const color = sectionColors[si % sectionColors.length];
    main += `<div class="g-main-section">
      <div class="g-section-heading" style="color:${color};border-color:${color}">${s.title.toUpperCase()}</div>`;

    s.items.forEach((item, ii) => {
      const dotColor = dotColors[ii % dotColors.length];
      if (typeof item === "string" || item.text) {
        main += `<p class="g-body-text">• ${esc(item.text || item)}</p>`;
        return;
      }

      const role    = esc(item.role || item.title || item.degree || "");
      const org     = esc(item.company || item.institution || item.org || "");
      const loc     = esc(item.location || "");
      const date    = itemDate(item);
      const bullets = item.bullets || item.descriptions || item.details || [];

      main += `<div class="g-entry">
        <div class="g-entry-dot" style="background:${dotColor};border-color:${dotColor}"></div>
        <div class="g-entry-body">
          <div class="g-entry-header">
            <span class="g-entry-role">${role}</span>
            ${loc ? `<span class="g-location-badge">${loc}</span>` : ""}
          </div>
          ${org  ? `<div class="g-entry-org" style="color:${color}">${org}</div>` : ""}
          ${date ? `<div class="g-entry-date">${date}</div>` : ""}
          ${bullets.map((b) => `<div class="g-bullet">• ${esc(b)}</div>`).join("")}
        </div>
      </div>`;
    });

    main += `</div>`;
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, "Helvetica Neue", sans-serif;
      font-size: 11px; line-height: 1.55; color: #202124;
      background: #fff; display: flex; flex-direction: column; min-height: 100vh;
    }

    /* ── Header ── */
    .g-header { padding: 24px 28px 16px; background: #fff; }
    .g-name { font-size: 32px; font-weight: 700; color: #202124; margin-bottom: 3px; }
    .g-title { font-size: 13px; color: #80868b; margin-bottom: 8px; }

    /* ── Google colour bar ── */
    .g-bar { display: flex; height: 3px; width: 100%; }
    .g-bar div { flex: 1; }

    /* ── Body ── */
    .g-body { display: flex; flex: 1; }

    /* ── Sidebar ── */
    .g-sidebar {
      width: 220px; flex-shrink: 0;
      padding: 18px 16px 24px 24px;
      border-right: 1px solid #e8eaed;
    }
    .g-contact-section { margin-bottom: 14px; }
    .g-sidebar-section { margin-bottom: 14px; }
    .g-section-heading {
      font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; border-bottom: 2px solid;
      padding-bottom: 3px; margin-bottom: 8px;
    }
    .g-contact-item {
      display: flex; align-items: flex-start; gap: 6px;
      font-size: 10.5px; color: #3c4043; margin-bottom: 5px; line-height: 1.4;
    }
    .g-icon { font-size: 11px; flex-shrink: 0; margin-top: 1px; }
    .g-chip {
      display: inline-block; font-size: 9.5px; color: #3c4043;
      background: #f1f3f4; border-radius: 3px; padding: 2px 5px;
      margin: 0 3px 4px 0;
    }
    .g-sidebar-entry {
      display: flex; gap: 6px; margin-bottom: 8px; align-items: flex-start;
    }
    .g-dot {
      width: 8px; height: 8px; border-radius: 50%; border: 2px solid;
      flex-shrink: 0; margin-top: 3px;
    }
    .g-entry-title { font-size: 10.5px; font-weight: 700; color: #202124; }
    .g-entry-sub   { font-size: 9.5px; color: #3c4043; }
    .g-entry-date  { font-size: 9px; color: #80868b; }

    /* ── Main ── */
    .g-main { flex: 1; padding: 18px 24px 24px 20px; }
    .g-main-section { margin-bottom: 16px; }
    .g-entry {
      display: flex; gap: 8px; margin-bottom: 12px; align-items: flex-start;
    }
    .g-entry-dot {
      width: 8px; height: 8px; border-radius: 50%; border: 2px solid;
      flex-shrink: 0; margin-top: 3px;
    }
    .g-entry-body { flex: 1; }
    .g-entry-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; gap: 6px; flex-wrap: wrap;
    }
    .g-entry-role { font-weight: 700; font-size: 11.5px; color: #202124; }
    .g-location-badge {
      font-size: 9px; color: #fff; background: #4285F4;
      border-radius: 3px; padding: 1px 6px; font-weight: 500; white-space: nowrap;
    }
    .g-entry-org  { font-size: 10px; margin-bottom: 1px; }
    .g-entry-date { font-size: 9.5px; color: #80868b; margin-bottom: 3px; }
    .g-bullet { font-size: 10.5px; color: #3c4043; line-height: 1.55; margin-bottom: 2px; }
    .g-body-text { font-size: 10.5px; color: #3c4043; margin-bottom: 3px; }
  </style></head>
  <body>
    <div class="g-header">
      <div class="g-name">${esc(meta.name) || "Your Name"}</div>
      ${meta.title || meta.headline ? `<div class="g-title">${esc(meta.title || meta.headline)}</div>` : ""}
    </div>
    <div class="g-bar">
      <div style="background:#4285F4"></div>
      <div style="background:#EA4335"></div>
      <div style="background:#FBBC05"></div>
      <div style="background:#34A853"></div>
    </div>
    <div class="g-body">
      <div class="g-sidebar">${sidebar}</div>
      <div class="g-main">${main}</div>
    </div>
    <div class="g-bar">
      <div style="background:#4285F4"></div>
      <div style="background:#EA4335"></div>
      <div style="background:#FBBC05"></div>
      <div style="background:#34A853"></div>
    </div>
  </body></html>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   API HANDLER
   ═══════════════════════════════════════════════════════════════════════════ */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Use GET request");
  }

  const { sessionId, template = "premium" } = req.query;

  const store   = global.resumeStore || (global.resumeStore = new Map());
  const session = store.get(sessionId);

  if (!session) {
    return res.status(400).send("Session not found or expired");
  }

  // ── FIX: prefer templateStyle saved in session over query param ──────────
  // save-resume-session.js stores templateStyle alongside resume.
  // The query param is a fallback for direct calls to this endpoint.
  const effectiveTemplate = session.templateStyle || template;

  const { resume } = session;

  let browser;

  try {
    const fullHtml =
      effectiveTemplate === "modern"   ? buildModernHTML(resume)   :
      effectiveTemplate === "creative" ? buildCreativeHTML(resume) :
      effectiveTemplate === "google"   ? buildGoogleHTML(resume)   :
                                         buildPremiumHTML(resume);

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.body.offsetHeight);
    await new Promise((r) => setTimeout(r, 600));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    if (!pdfBuffer || pdfBuffer.length < 2000) {
      throw new Error("Invalid PDF generated");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="resume-${effectiveTemplate}.pdf"`
    );

    res.write(pdfBuffer);
    res.end();

  } catch (err) {
    console.error("PDF ERROR:", err);
    return res.status(500).send(`Error generating PDF: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}