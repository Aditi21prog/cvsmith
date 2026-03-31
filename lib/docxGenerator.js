import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

/**
 * Generates a high-end, multi-template DOCX buffer from a resume object.
 * @param {Object} resume - The resume data object.
 * @param {string} templateType - 'premium', 'modern', or 'creative'.
 * @returns {Promise<Buffer>}
 */
export async function generateDOCX(resume, templateType = "modern") {
  const children = [];

  // --- CONFIGURATION BY TEMPLATE ---
  const config = {
    premium: {
      font: "Times New Roman",
      nameSize: 44, // 22pt
      sectionSize: 24, // 12pt
      bodySize: 20, // 10pt
      accentColor: "000000",
      dividerColor: "000000",
      headerAlign: AlignmentType.CENTER,
      allCapsHeader: true,
      spacingBefore: 240,
    },
    modern: {
      font: "Arial",
      nameSize: 52, // 26pt
      sectionSize: 26, // 13pt
      bodySize: 20, // 10pt
      accentColor: "2C3E50",
      dividerColor: "BDC3C7",
      headerAlign: AlignmentType.LEFT,
      allCapsHeader: true,
      spacingBefore: 300,
    },
    creative: {
      font: "Helvetica",
      nameSize: 60, // 30pt
      sectionSize: 28, // 14pt
      bodySize: 19, // 9.5pt
      accentColor: "1A5FB4",
      dividerColor: "1A5FB4",
      headerAlign: AlignmentType.LEFT,
      allCapsHeader: false,
      spacingBefore: 400,
    }
  }[templateType] || config.modern;

  const font = config.font;

  // --- HEADER: NAME ---
  children.push(new Paragraph({
    alignment: config.headerAlign,
    spacing: { after: 120 },
    children: [
      new TextRun({ 
        text: (resume.meta?.name || "Resume").toUpperCase(), 
        bold: true, 
        size: config.nameSize, 
        font, 
        color: config.accentColor 
      })
    ]
  }));

  // --- HEADER: CONTACT INFO ---
  const contactParts = [];
  if (resume.meta?.phone) contactParts.push(resume.meta.phone);
  if (resume.meta?.email) contactParts.push(resume.meta.email);
  if (resume.meta?.linkedin) contactParts.push(resume.meta.linkedin);
  if (resume.meta?.location) contactParts.push(resume.meta.location);
  
  const contactString = contactParts.length > 0 ? contactParts.join("  |  ") : (resume.meta?.contact || "");

  if (contactString) {
    children.push(new Paragraph({
      alignment: config.headerAlign,
      spacing: { after: 400 },
      children: [
        new TextRun({ 
          text: contactString, 
          size: 19, 
          font, 
          color: "333333" 
        })
      ]
    }));
  }

  // --- SECTIONS ---
  resume.sections.forEach(section => {
    let title = section.title || "";
    if (config.allCapsHeader) title = title.toUpperCase();

    // Section Header
    children.push(new Paragraph({
      spacing: { before: config.spacingBefore, after: 60 },
      alignment: config.headerAlign === AlignmentType.CENTER ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [
        new TextRun({ 
          text: title, 
          bold: true, 
          size: config.sectionSize, 
          font, 
          color: config.accentColor 
        })
      ]
    }));

    // Section Divider
    children.push(new Paragraph({
      border: { 
        bottom: { color: config.dividerColor, space: 1, style: BorderStyle.SINGLE, size: 4 } 
      },
      spacing: { after: 160 }
    }));

    // Section Content/Summary
    if (section.content) {
      children.push(new Paragraph({ 
        spacing: { after: 200 }, 
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({ 
            text: section.content, 
            size: config.bodySize, 
            font 
          })
        ] 
      }));
    }

    if (Array.isArray(section.items)) {
      const isSkillSection = title.toUpperCase().includes("SKILL");

      if (isSkillSection) {
        // --- TABULAR SKILLS ---
        const rows = [];
        const noB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
        
        for (let i = 0; i < section.items.length; i += 2) {
          rows.push(new TableRow({
            children: [
              new TableCell({ 
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: { top: noB, bottom: noB, left: noB, right: noB }, 
                children: [
                  new Paragraph({ 
                    spacing: { after: 80 }, 
                    children: [new TextRun({ text: `• ${section.items[i] || ""}`, size: config.bodySize, font })] 
                  })
                ] 
              }),
              new TableCell({ 
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: { top: noB, bottom: noB, left: noB, right: noB }, 
                children: [
                  new Paragraph({ 
                    spacing: { after: 80 }, 
                    children: [new TextRun({ text: section.items[i + 1] ? `• ${section.items[i + 1]}` : "", size: config.bodySize, font })] 
                  })
                ] 
              })
            ]
          }));
        }
        
        children.push(new Table({ 
          width: { size: 100, type: WidthType.PERCENTAGE }, 
          rows, 
          borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB } 
        }));
      } else {
        // --- EXPERIENCE / EDUCATION ---
        section.items.forEach(item => {
          if (typeof item === "string") {
            children.push(new Paragraph({ 
              bullet: { level: 0 }, 
              children: [new TextRun({ text: item, size: config.bodySize, font })] 
            }));
          } else {
            // Main Line: Role/Degree [Tab] Date
            children.push(new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: 9350 }],
              children: [
                new TextRun({ 
                  text: item.role || item.degree || item.title || "", 
                  bold: true, 
                  size: config.bodySize + 2, 
                  font 
                }),
                new TextRun("\t"),
                new TextRun({ 
                  text: item.date || "", 
                  bold: true, 
                  size: config.bodySize, 
                  font 
                })
              ]
            }));

            // Sub Line: Org [Tab] Location
            const org = item.company || item.institution || "";
            const loc = item.location || "";
            if (org || loc) {
              children.push(new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: 9350 }],
                children: [
                  new TextRun({ 
                    text: org, 
                    italics: templateType === 'premium', 
                    bold: templateType !== 'premium', 
                    size: config.bodySize, 
                    font, 
                    color: templateType === 'creative' ? config.accentColor : "333333" 
                  }),
                  new TextRun("\t"),
                  new TextRun({ 
                    text: loc, 
                    size: config.bodySize, 
                    font, 
                    color: "666666" 
                  })
                ]
              }));
            }

            // Bullets
            if (Array.isArray(item.bullets)) {
              item.bullets.forEach(b => {
                children.push(new Paragraph({ 
                  bullet: { level: 0 }, 
                  indent: { left: 400, hanging: 400 }, 
                  children: [new TextRun({ text: b, size: config.bodySize, font })] 
                }));
              });
            }
            
            // Spacing between major items
            children.push(new Paragraph({ spacing: { after: 120 } }));
          }
        });
      }
    }
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
      },
      children
    }]
  });

  return await Packer.toBuffer(doc);
}