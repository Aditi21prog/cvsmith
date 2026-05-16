import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  TabStopType,
  TabStopPosition,
} from "docx";

import { renderPremium } from "../../lib/templates/premium";
import { renderModern }  from "../../lib/templates/modern";
import { renderCreative } from "../../lib/templates/creative";

/* ================= SHARED HELPERS ================= */

function buildContact(meta) {
  return [meta.phone, meta.email, meta.linkedin, meta.location]
    .filter(Boolean)
    .join(" | ");
}

function noBorder() {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: none, bottom: none, left: none, right: none };
}

/* ================= PREMIUM RENDERER ================= */
// Formal, two-column role/date rows, underlined section headers, title-cased

function renderPremiumDocx(data) {
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: data.meta.name || "", bold: true, size: 36 }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: buildContact(data.meta), size: 20 })],
    })
  );

  data.sections.forEach((section) => {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 80 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        },
        children: [
          new TextRun({ text: section.title, bold: true, size: 24 }),
        ],
      })
    );

    section.items.forEach((item) => {
      if (!item) return;

      if (item.text) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: `• ${item.text}`, size: 20 })],
          })
        );
        return;
      }

      if (item.role || item.org) {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: item.role, bold: true, size: 22 }),
              new TextRun({ text: `\t${item.date}`, size: 20 }),
            ],
          })
        );

        if (item.org || item.location) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: item.org, italics: true, size: 20 }),
                new TextRun({ text: item.location ? `\t${item.location}` : "", size: 20 }),
              ],
            })
          );
        }

        (item.bullets || []).forEach((b) => {
          children.push(
            new Paragraph({
              spacing: { after: 30 },
              indent: { left: 360 },
              children: [new TextRun({ text: `• ${b}`, size: 20 })],
            })
          );
        });
      }
    });
  });

  return children;
}

/* ================= MODERN RENDERER ================= */
// Two-column table layout:
//   LEFT col (~28%): spaced section label in light grey, letter-spaced
//   RIGHT col (~72%): content — large name header, right-aligned contact, items with role/date tab
//
// Header row: large thin name (left) + stacked contact details (right-aligned, uppercase small)
// Body rows: one row per section — label cell left, content cell right
// Separator: thin light-blue line under header

function renderModernDocx(data) {
  const LABEL_COLOR = "8FA8B8";   // muted blue-grey for section labels
  const DATE_COLOR  = "6688AA";   // muted for dates
  const ORG_COLOR   = "2277AA";   // teal-blue for org names
  const TEXT_COLOR  = "222222";
  const BG          = "FFFFFF";

  const LABEL_W   = 2200;  // ~28% of 9360 (US Letter 1" margins content width)
  const CONTENT_W = 7160;
  const TABLE_W   = LABEL_W + CONTENT_W; // 9360

  const noB = noBorder();

  /* ── thin horizontal rule paragraph ── */
  function rule(color = "D8E4EE") {
    return new Paragraph({
      spacing: { before: 0, after: 0 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 3, color },
      },
      children: [new TextRun({ text: "" })],
    });
  }

  /* ── Section label cell (left) ── */
  function labelCell(title) {
    return new TableCell({
      width: { size: LABEL_W, type: WidthType.DXA },
      borders: noB,
      shading: { fill: BG, type: ShadingType.CLEAR },
      margins: { top: 320, bottom: 200, left: 0, right: 200 },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              size: 17,
              color: LABEL_COLOR,
              bold: true,
              characterSpacing: 80,
            }),
          ],
        }),
      ],
    });
  }

  /* ── Content cell (right) ── */
  function contentCell(items) {
    const paras = [];

    items.forEach((item, idx) => {
      if (!item) return;

      if (item.text) {
        paras.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 0 : 80, after: 60 },
            children: [new TextRun({ text: item.text, size: 20, color: TEXT_COLOR })],
          })
        );
        return;
      }

      // Role + date on same line via right tab
      if (item.role) {
        paras.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 0 : 200, after: 40 },
            tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W - 100 }],
            children: [
              new TextRun({ text: item.role, bold: true, size: 22, color: TEXT_COLOR }),
              item.date
                ? new TextRun({ text: `\t${item.date.toUpperCase()}`, size: 18, color: DATE_COLOR })
                : new TextRun({ text: "" }),
            ],
          })
        );
      }

      // Org
      if (item.org) {
        paras.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: item.org, size: 20, color: ORG_COLOR }),
            ],
          })
        );
      }

      // Bullets as plain body text (no bullet char — clean modern look)
      (item.bullets || []).forEach((b) => {
        paras.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [new TextRun({ text: b, size: 20, color: TEXT_COLOR })],
          })
        );
      });
    });

    return new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      borders: noB,
      shading: { fill: BG, type: ShadingType.CLEAR },
      margins: { top: 300, bottom: 200, left: 0, right: 0 },
      children: paras.length ? paras : [new Paragraph({ children: [] })],
    });
  }

  /* ── HEADER ROW: name (left) + contact stack (right) ── */
  const meta = data.meta || {};
  const contactLines = [
    meta.email,
    meta.phone,
    meta.location,
    meta.linkedin || meta.website,
  ].filter(Boolean);

  const headerRow = new TableRow({
    children: [
      // Left: large thin name + subtitle
      new TableCell({
        width: { size: LABEL_W + CONTENT_W * 0.55 | 0, type: WidthType.DXA },
        borders: noB,
        shading: { fill: BG, type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 120, left: 0, right: 200 },
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: meta.name || "",
                size: 64,          // ~32pt — big, airy
                bold: false,
                font: "Calibri Light",
                color: "111111",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 0 },
            children: [
              new TextRun({
                text: meta.title || meta.headline || meta.jobTitle || "",
                size: 21,
                color: "888888",
                italics: false,
              }),
            ],
          }),
        ],
      }),
      // Right: stacked contact details, right-aligned, uppercase tiny
      new TableCell({
        width: { size: CONTENT_W * 0.45 | 0, type: WidthType.DXA },
        borders: noB,
        shading: { fill: BG, type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 120, left: 0, right: 0 },
        children: contactLines.map(
          (line) =>
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 50 },
              children: [
                new TextRun({
                  text: line.toUpperCase(),
                  size: 16,
                  color: "555555",
                  bold: true,
                  characterSpacing: 20,
                }),
              ],
            })
        ),
      }),
    ],
  });

  /* ── DIVIDER ROW ── */
  const dividerRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        width: { size: TABLE_W, type: WidthType.DXA },
        borders: noB,
        shading: { fill: BG, type: ShadingType.CLEAR },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        children: [rule("C8D8E8")],
      }),
    ],
  });

  /* ── SECTION ROWS ── */
  const sectionRows = data.sections.map(
    (section) =>
      new TableRow({
        children: [labelCell(section.title), contentCell(section.items)],
      })
  );

  const table = new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: [LABEL_W, CONTENT_W],
    rows: [headerRow, dividerRow, ...sectionRows],
  });

  return [table];
}

/* ================= CREATIVE RENDERER ================= */
// Two-column layout: dark navy sidebar (left) + white content area (right)

function renderCreativeDocx(data) {
  const NAVY       = "1A2B3C";
  const TEAL       = "2ABFBF";
  const WHITE      = "FFFFFF";

  const SIDEBAR_W  = 3300;
  const CONTENT_W  = 6060;
  const TABLE_W    = SIDEBAR_W + CONTENT_W;

  const noB = noBorder();

  function initialsBlock(name) {
    const initials = (name || "?")
      .split(" ")
      .map((w) => w[0] || "")
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 40 },
        children: [
          new TextRun({ text: initials, bold: true, size: 52, color: NAVY, highlight: "cyan" }),
        ],
      }),
    ];
  }

  function sidebarLine(icon, text) {
    if (!text) return [];
    return [
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${icon}  ${text}`, size: 18, color: WHITE }),
        ],
      }),
    ];
  }

  function buildSidebar() {
    const paras = [];

    paras.push(...initialsBlock(data.meta.name));

    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({ text: data.meta.name || "", bold: true, size: 30, color: WHITE }),
        ],
      })
    );

    const tagline = data.meta.title || data.meta.headline || data.meta.jobTitle;
    if (tagline) {
      paras.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          children: [
            new TextRun({ text: tagline.toUpperCase(), bold: true, size: 18, color: TEAL }),
          ],
        })
      );
    }

    paras.push(
      new Paragraph({
        spacing: { before: 120, after: 100 },
        children: [new TextRun({ text: "CONTACT", bold: true, size: 18, color: "AAAAAA" })],
      })
    );

    paras.push(...sidebarLine("✉", data.meta.email));
    paras.push(...sidebarLine("✆", data.meta.phone));
    paras.push(...sidebarLine("⊙", data.meta.location));
    paras.push(...sidebarLine("in", data.meta.linkedin));

    const sidebarSections = (data.sections || []).filter((s) =>
      ["SKILLS", "LANGUAGES", "INTERESTS", "CERTIFICATIONS"].includes(s.title)
    );

    sidebarSections.forEach((section) => {
      paras.push(
        new Paragraph({
          spacing: { before: 280, after: 100 },
          children: [new TextRun({ text: section.title, bold: true, size: 18, color: "AAAAAA" })],
        })
      );
      section.items.forEach((item) => {
        const label = item.text || item.role || "";
        if (!label) return;
        paras.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [new TextRun({ text: `• ${label}`, size: 18, color: WHITE })],
          })
        );
      });
    });

    return paras;
  }

  function sectionHeader(title) {
    return [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 240, after: 80 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCDDEE" },
        },
        children: [
          new TextRun({ text: title, bold: true, size: 20, color: "8899AA", characterSpacing: 60 }),
        ],
      }),
    ];
  }

  function contentItem(item) {
    const paras = [];

    if (item.text) {
      paras.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "\u25CF  ", size: 20, color: TEAL }),
            new TextRun({ text: item.text, size: 20 }),
          ],
        })
      );
      return paras;
    }

    if (item.role) {
      paras.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          children: [
            new TextRun({ text: "\u25CF  ", size: 20, color: TEAL }),
            new TextRun({ text: item.role, bold: true, size: 22 }),
          ],
        })
      );
    }

    if (item.org || item.date) {
      const orgDate = [item.org, item.date].filter(Boolean).join(" | ");
      paras.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 280 },
          children: [
            new TextRun({ text: orgDate.toUpperCase(), bold: true, size: 18, color: TEAL }),
          ],
        })
      );
    }

    (item.bullets || []).forEach((b) => {
      paras.push(
        new Paragraph({
          spacing: { after: 40 },
          indent: { left: 280 },
          children: [new TextRun({ text: b, size: 20, color: "333333" })],
        })
      );
    });

    return paras;
  }

  function buildContent() {
    const paras = [];
    const SIDEBAR_TITLES = new Set(["SKILLS", "LANGUAGES", "INTERESTS", "CERTIFICATIONS"]);
    const mainSections = (data.sections || []).filter((s) => !SIDEBAR_TITLES.has(s.title));

    mainSections.forEach((section) => {
      paras.push(...sectionHeader(section.title));
      section.items.forEach((item) => paras.push(...contentItem(item)));
    });

    return paras;
  }

  const table = new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: [SIDEBAR_W, CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: SIDEBAR_W, type: WidthType.DXA },
            borders: noB,
            shading: { fill: NAVY, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 400, left: 200, right: 200 },
            children: buildSidebar(),
          }),
          new TableCell({
            width: { size: CONTENT_W, type: WidthType.DXA },
            borders: noB,
            shading: { fill: WHITE, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 400, left: 280, right: 280 },
            children: buildContent(),
          }),
        ],
      }),
    ],
  });

  return [table];
}

/* ================= GOOGLE DOCX RENDERER ================= */
// Layout: full-width header (name + Google colour bar) → two-column body.
// Sidebar (~33%): light grey bg, contact, skills as shaded chips, education, certs.
// Main (~67%): white bg, experience & other sections with role/date on one line.

// Normalise raw resume sections — handles s.type vs s.title and s.content vs s.items
function normaliseGoogleSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections.map((s) => {
    if (!s) return null;
    let items = s.items;
    if (!items && s.content) {
      // content is a plain string — split into skill tokens
      items = s.content.split(/\n|•|\u2022|,/).map((x) => x.trim()).filter(Boolean);
    }
    return {
      title: s.type || s.title || "",
      items: Array.isArray(items) ? items : [],
    };
  }).filter(Boolean);
}

function renderGoogleDocx(data) {
  const meta     = data.meta     || {};
  const sections = normaliseGoogleSections(data.sections);

  // ── Google brand palette ──
  const G_BLUE   = "4285F4";
  const G_RED    = "EA4335";
  const G_YELLOW = "FBBC05";
  const G_GREEN  = "34A853";
  const G_GREY   = "5F6368";
  const G_LGREY  = "80868B";
  const TEXT     = "202124";
  const BG       = "FFFFFF";
  const SIDEBAR_BG = "F1F3F4";   // Google's light surface grey
  const CHIP_BG    = "E8F0FE";   // soft blue tint for skill chips
  const CHIP_TEXT  = "1967D2";   // darker Google blue for chip text

  const SEC_COLORS = [G_BLUE, G_RED, G_GREEN, G_YELLOW];

  // ── Column widths (US Letter content = 10800 dxa at 0.5" margins) ──
  const FULL_W    = 10800;
  const SIDEBAR_W = 3420;   // ~31.7%
  const MAIN_W    = FULL_W - SIDEBAR_W; // ~68.3%

  const noB = noBorder();

  // ── Section routing ──
  const SIDEBAR_TITLES = new Set([
    "skills","technical skills","key skills","core skills","technologies",
    "education","certifications","languages","interests","awards","achievements",
  ]);
  const normalizeTitle = (t) => (t || "").toLowerCase().trim();
  const sidebarSections = sections.filter((s) =>  SIDEBAR_TITLES.has(normalizeTitle(s.title)));
  const mainSections    = sections.filter((s) => !SIDEBAR_TITLES.has(normalizeTitle(s.title)));

  // ── Helper: coloured section heading with bottom rule ──
  function sectionHeading(title, color, isFirst = false) {
    return new Paragraph({
      spacing: { before: isFirst ? 80 : 280, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
      children: [
        new TextRun({
          text: (title || "").toUpperCase(),
          bold: true,
          size: 18,
          color,
          characterSpacing: 80,
          font: "Arial",
        }),
      ],
    });
  }

  /* ══════════════════════════════════════════════════
     HEADER ROW — spans full width
     Name (left-aligned, large) + Google colour stripe
  ══════════════════════════════════════════════════ */
  function buildHeaderRows() {
    // Row 1: name + title/headline — spans all 4 columns
    const nameRow = new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          width: { size: FULL_W, type: WidthType.DXA },
          borders: noB,
          shading: { fill: BG, type: ShadingType.CLEAR },
          margins: { top: 300, bottom: 160, left: 480, right: 480 },
          children: [
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: meta.name || "",
                  bold: true,
                  size: 56,          // 28pt — prominent but not gigantic
                  color: TEXT,
                  font: "Arial",
                }),
              ],
            }),
            ...(meta.title || meta.headline ? [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: meta.title || meta.headline || "",
                    size: 22,
                    color: G_LGREY,
                    font: "Arial",
                  }),
                ],
              }),
            ] : []),
          ],
        }),
      ],
    });

    // Row 2: Google colour bar (4 equal segments)
    const makeBarCell = (color, width) =>
      new TableCell({
        width: { size: width, type: WidthType.DXA },
        borders: noB,
        shading: { fill: color, type: ShadingType.CLEAR },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "" })] })],
      });

    const seg = Math.floor(FULL_W / 4);
    const barRow = new TableRow({
      height: { value: 80, rule: "exact" },
      children: [
        makeBarCell(G_BLUE,   seg),
        makeBarCell(G_RED,    seg),
        makeBarCell(G_YELLOW, seg),
        makeBarCell(G_GREEN,  FULL_W - seg * 3),
      ],
    });

    return [nameRow, barRow];
  }

  /* ══════════════════════════════════════════════════
     SIDEBAR — contact + skills chips + education etc.
  ══════════════════════════════════════════════════ */
  function buildSidebar() {
    const paras = [];

    // ── Contact section ──
    paras.push(sectionHeading("Contact", G_BLUE, true));

    const contactItems = [
      meta.location && { icon: "📍", val: meta.location },
      meta.email    && { icon: "✉",  val: meta.email    },
      meta.phone    && { icon: "✆",  val: meta.phone    },
      meta.linkedin && { icon: "in", val: meta.linkedin },
      meta.website  && { icon: "🔗", val: meta.website  },
    ].filter(Boolean);

    contactItems.forEach(({ icon, val }) => {
      paras.push(new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${icon}  `, size: 19, color: G_BLUE, font: "Arial" }),
          new TextRun({ text: val, size: 19, color: TEXT, font: "Arial" }),
        ],
      }));
    });

    // ── Sidebar sections (skills, education, certs…) ──
    sidebarSections.forEach((section, si) => {
      const color = SEC_COLORS[(si + 1) % SEC_COLORS.length]; // offset so first isn't same blue as contact

      paras.push(sectionHeading(section.title, color));

      // Detect if section is skill-like (all items are plain text / { text })
      const isSkillSection = section.items.every(
        (item) => typeof item === "string" || (item && item.text && !item.role && !item.degree)
      );

      if (isSkillSection) {
        // Render each skill as a shaded chip paragraph
        section.items.forEach((item) => {
          const label = typeof item === "string" ? item : (item.text || "");
          if (!label) return;
          paras.push(new Paragraph({
            spacing: { after: 60 },
            shading: { fill: CHIP_BG, type: ShadingType.CLEAR },
            indent: { left: 60, right: 60 },
            children: [
              new TextRun({
                text: `  ${label}  `,
                size: 18,
                color: CHIP_TEXT,
                bold: true,
                font: "Arial",
              }),
            ],
          }));
        });
      } else {
        // Structured items — education, certifications, achievements
        section.items.forEach((item) => {
          if (!item) return;

          if (typeof item === "string" || item.text) {
            paras.push(new Paragraph({
              spacing: { after: 50 },
              children: [new TextRun({ text: `• ${item.text || item}`, size: 19, color: "3C4043", font: "Arial" })],
            }));
            return;
          }

          const role = item.role || item.degree || item.title || "";
          const org  = item.org  || item.institution || item.company || "";
          const date = item.date || (item.start && item.end
            ? `${item.start} – ${item.end}`
            : item.start || "");

          if (role) paras.push(new Paragraph({
            spacing: { before: 100, after: 20 },
            children: [new TextRun({ text: role, bold: true, size: 19, color: TEXT, font: "Arial" })],
          }));
          if (org) paras.push(new Paragraph({
            spacing: { after: 20 },
            children: [new TextRun({ text: org, size: 18, color: G_GREY, font: "Arial" })],
          }));
          if (date) paras.push(new Paragraph({
            spacing: { after: 50 },
            children: [new TextRun({ text: date, size: 17, color: G_LGREY, font: "Arial" })],
          }));
        });
      }
    });

    return paras;
  }

  /* ══════════════════════════════════════════════════
     MAIN CONTENT — experience, summary, projects…
  ══════════════════════════════════════════════════ */
  function buildMain() {
    const paras = [];

    mainSections.forEach((section, si) => {
      const color = SEC_COLORS[si % SEC_COLORS.length];

      paras.push(sectionHeading(section.title, color, si === 0));

      section.items.forEach((item, ii) => {
        if (!item) return;

        // Plain text / summary bullet
        if (typeof item === "string" || item.text) {
          paras.push(new Paragraph({
            spacing: { after: 50 },
            indent: { left: 120 },
            children: [
              new TextRun({ text: "›  ", size: 19, color, bold: true, font: "Arial" }),
              new TextRun({ text: item.text || item, size: 19, color: "3C4043", font: "Arial" }),
            ],
          }));
          return;
        }

        const role    = item.role    || item.title  || item.degree || "";
        const org     = item.company || item.institution || item.org || "";
        const date    = item.date    || (item.start && item.end
          ? `${item.start} – ${item.end}`
          : item.start ? `${item.start} – Present` : "");
        const bullets = item.bullets || item.descriptions || item.details || [];

        // Role (bold) + date (right-aligned, grey) on same line
        if (role || date) {
          paras.push(new Paragraph({
            spacing: { before: ii === 0 ? 60 : 220, after: 24 },
            tabStops: [{ type: TabStopType.RIGHT, position: MAIN_W - 360 }],
            children: [
              new TextRun({ text: role, bold: true, size: 22, color: TEXT, font: "Arial" }),
              date ? new TextRun({ text: `\t${date}`, size: 18, color: G_LGREY, font: "Arial" }) : new TextRun({ text: "" }),
            ],
          }));
        }

        // Org in section accent colour with a small coloured bullet
        if (org) {
          paras.push(new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "▸  ", size: 18, color, font: "Arial" }),
              new TextRun({ text: org, size: 19, color, font: "Arial" }),
            ],
          }));
        }

        // Achievement bullets — indented, clean
        bullets.forEach((b) => {
          paras.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 200, hanging: 200 },
            children: [
              new TextRun({ text: "•  ", size: 19, color: G_LGREY, font: "Arial" }),
              new TextRun({ text: b, size: 19, color: "3C4043", font: "Arial" }),
            ],
          }));
        });
      });
    });

    return paras;
  }

  /* ══════════════════════════════════════════════════
     ASSEMBLE: header table (full-width) + body table
  ══════════════════════════════════════════════════ */

  const _seg = Math.floor(FULL_W / 4);

  // Header table — 4 equal columns for the colour bar row
  const headerTable = new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [_seg, _seg, _seg, FULL_W - _seg * 3],
    layout: "fixed",
    rows: buildHeaderRows(),
  });

  // Body table — sidebar | main
  const bodyTable = new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [SIDEBAR_W, MAIN_W],
    layout: "fixed",
    rows: [
      new TableRow({
        children: [
          // Sidebar cell
          new TableCell({
            width: { size: SIDEBAR_W, type: WidthType.DXA },
            borders: noB,
            shading: { fill: SIDEBAR_BG, type: ShadingType.CLEAR },
            margins: { top: 280, bottom: 480, left: 280, right: 240 },
            children: buildSidebar(),
          }),
          // Main cell
          new TableCell({
            width: { size: MAIN_W, type: WidthType.DXA },
            borders: {
              ...noB,
              left: { style: BorderStyle.SINGLE, size: 4, color: "DADCE0" },
            },
            shading: { fill: BG, type: ShadingType.CLEAR },
            margins: { top: 280, bottom: 480, left: 320, right: 280 },
            children: buildMain(),
          }),
        ],
      }),
    ],
  });

  return [headerTable, bodyTable];
}

/* ================= API HANDLER ================= */

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Use GET request");
  }

  const { sessionId, template = "premium" } = req.query;

  const store = global.resumeStore || (global.resumeStore = new Map());
  const session = store.get(sessionId);

  if (!session) {
    return res.status(400).send("Session not found");
  }

  // ── FIX: prefer templateStyle saved in session over query param ──────────
  // save-resume-session.js stores templateStyle alongside resume.
  // The query param is a fallback for direct calls to this endpoint.
  const effectiveTemplate = session.templateStyle || template;

  const { resume } = session;

  try {
    // For Google template we pass resume directly (meta+sections schema).
    // For others, we normalise via the template's own renderX() function.
    const data =
      effectiveTemplate === "modern"   ? renderModern(resume)   :
      effectiveTemplate === "creative" ? renderCreative(resume) :
      effectiveTemplate === "google"   ? resume                 :
                                          renderPremium(resume);

    let children;
    let margin;

    if (effectiveTemplate === "modern") {
      children = renderModernDocx(data);
      margin = { top: 1080, right: 1080, bottom: 1080, left: 1080 };
    } else if (effectiveTemplate === "creative") {
      children = renderCreativeDocx(data);
      margin = { top: 0, right: 0, bottom: 0, left: 0 };
    } else if (effectiveTemplate === "google") {
      children = renderGoogleDocx(data);
      margin = { top: 0, right: 720, bottom: 720, left: 720 };
    } else {
      children = renderPremiumDocx(data);
      margin = { top: 1080, right: 1080, bottom: 1080, left: 1080 };
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin,
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="resume-${effectiveTemplate}.docx"`
    );

    res.send(buffer);
  } catch (err) {
    console.error("DOCX ERROR:", err);
    return res.status(500).send(err.message);
  }
}