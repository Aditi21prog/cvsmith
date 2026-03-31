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

  const { resume } = session;

  try {
    const data =
      template === "modern"
        ? renderModern(resume)
        : template === "creative"
        ? renderCreative(resume)
        : renderPremium(resume);

    let children;
    let margin;

    if (template === "modern") {
      children = renderModernDocx(data);
      margin = { top: 1080, right: 1080, bottom: 1080, left: 1080 };
    } else if (template === "creative") {
      children = renderCreativeDocx(data);
      margin = { top: 0, right: 0, bottom: 0, left: 0 };
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
      `attachment; filename="resume-${template}.docx"`
    );

    res.send(buffer);
  } catch (err) {
    console.error("DOCX ERROR:", err);
    return res.status(500).send(err.message);
  }
}