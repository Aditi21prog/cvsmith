import PDFDocument from "pdfkit";

/**
 * Generates a professional, multi-template PDF buffer from a resume object.
 * @param {Object} resume - The resume data object.
 * @param {string} templateType - 'premium', 'modern', or 'creative'.
 * @returns {Promise<Buffer>}
 */
export function generatePDF(resume, templateType = "modern") {
  return new Promise((resolve, reject) => {
    // Standard A4 size with consistent margins
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: true 
    });
    
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // --- CONFIGURATION BY TEMPLATE ---
    const config = {
      premium: {
        fontBold: "Times-Bold",
        fontRegular: "Times-Roman",
        fontItalic: "Times-Italic",
        nameSize: 22,
        sectionSize: 12,
        bodySize: 10,
        accentColor: "#000000",
        dividerColor: "#000000",
        nameAlignment: "center",
        allCapsHeader: true,
        lineGap: 1.5,
      },
      modern: {
        fontBold: "Helvetica-Bold",
        fontRegular: "Helvetica",
        fontItalic: "Helvetica-Oblique",
        nameSize: 26,
        sectionSize: 13,
        bodySize: 10,
        accentColor: "#2C3E50",
        dividerColor: "#BDC3C7",
        nameAlignment: "left",
        allCapsHeader: true,
        lineGap: 2,
      },
      creative: {
        fontBold: "Helvetica-Bold",
        fontRegular: "Helvetica",
        fontItalic: "Helvetica-Oblique",
        nameSize: 30,
        sectionSize: 14,
        bodySize: 10,
        accentColor: "#1A5FB4",
        dividerColor: "#1A5FB4",
        nameAlignment: "left",
        allCapsHeader: false,
        lineGap: 3,
      }
    }[templateType] || config.modern;

    // --- HELPER: DRAW SECTION DIVIDER ---
    const drawDivider = () => {
      doc.moveDown(0.2);
      const y = doc.y;
      doc.moveTo(50, y)
         .lineTo(545, y)
         .lineWidth(templateType === 'premium' ? 0.8 : 0.5)
         .stroke(config.dividerColor);
      doc.moveDown(0.8);
    };

    // --- HEADER: NAME & CONTACT ---
    const name = resume.meta?.name || "Your Name";
    doc.font(config.fontBold)
       .fontSize(config.nameSize)
       .fillColor(config.accentColor)
       .text(name.toUpperCase(), { align: config.nameAlignment });

    // Build structured contact string
    const contactParts = [];
    if (resume.meta?.phone) contactParts.push(resume.meta.phone);
    if (resume.meta?.email) contactParts.push(resume.meta.email);
    if (resume.meta?.linkedin) contactParts.push(resume.meta.linkedin);
    if (resume.meta?.location) contactParts.push(resume.meta.location);
    const contactString = contactParts.length > 0 ? contactParts.join("  |  ") : (resume.meta?.contact || "");

    if (contactString) {
      doc.moveDown(0.2);
      doc.font(config.fontRegular)
         .fontSize(9.5)
         .fillColor("#444444")
         .text(contactString, { align: config.nameAlignment });
    }
    
    doc.moveDown(1.5);

    // --- SECTIONS ---
    if (Array.isArray(resume.sections)) {
      resume.sections.forEach(section => {
        let sectionTitle = (section.title || "").toUpperCase();
        if (!config.allCapsHeader) {
          sectionTitle = section.title || "";
        }
        
        doc.font(config.fontBold)
           .fontSize(config.sectionSize)
           .fillColor(config.accentColor)
           .text(sectionTitle, { align: config.nameAlignment === 'center' ? 'center' : 'left' });

        drawDivider();

        if (section.content) {
          doc.font(config.fontRegular)
             .fontSize(config.bodySize)
             .fillColor("#333333")
             .text(section.content, { 
               align: "justify",
               lineGap: config.lineGap 
             });
          doc.moveDown(0.5);
        }

        if (Array.isArray(section.items) && section.items.length > 0) {
          const isSkillSection = sectionTitle.toUpperCase().includes("SKILL");

          if (isSkillSection) {
            // --- TWO COLUMN SKILLS ---
            const leftX = 70;
            const rightX = 310;
            const itemHeight = 15;

            for (let i = 0; i < section.items.length; i += 2) {
              const currentY = doc.y;
              doc.font(config.fontRegular).fontSize(config.bodySize).fillColor("#333333");
              
              doc.text(`• ${section.items[i]}`, leftX, currentY);
              if (section.items[i + 1]) {
                doc.text(`• ${section.items[i + 1]}`, rightX, currentY);
              }
              
              doc.y = currentY + itemHeight;
              if (doc.y > 750) doc.addPage();
            }
            doc.moveDown(0.5);
          } else {
            // --- EXPERIENCE / EDUCATION / PROJECTS ---
            section.items.forEach(item => {
              if (typeof item === "string") {
                doc.font(config.fontRegular).fontSize(config.bodySize).text(`• ${item}`, { indent: 10 });
                doc.moveDown(0.2);
              } 
              else {
                const rowY = doc.y;
                
                // Primary Title (Role / Degree)
                doc.font(config.fontBold).fontSize(config.bodySize + 1).fillColor(config.accentColor);
                doc.text(item.role || item.degree || item.title || "");
                
                // Right-aligned Date
                if (item.date) {
                  doc.font(config.fontBold).fontSize(config.bodySize);
                  const dateWidth = doc.widthOfString(item.date);
                  doc.text(item.date, 545 - dateWidth, rowY);
                }

                // Sub-headline (Company & Location)
                const subY = doc.y;
                const org = item.company || item.institution || "";
                doc.font(templateType === 'premium' ? config.fontItalic : config.fontBold)
                   .fontSize(config.bodySize)
                   .fillColor(templateType === 'creative' ? config.accentColor : "#444444")
                   .text(org);

                if (item.location) {
                  doc.font(config.fontRegular).fillColor("#666666");
                  const locWidth = doc.widthOfString(item.location);
                  doc.text(item.location, 545 - locWidth, subY);
                }

                // Bullet points
                if (Array.isArray(item.bullets)) {
                  doc.moveDown(0.2);
                  item.bullets.forEach(bullet => {
                    doc.font(config.fontRegular)
                       .fontSize(config.bodySize)
                       .fillColor("#333333")
                       .text("•", 65)
                       .text(bullet, 80, doc.y - 10, { 
                         width: 465,
                         align: "left",
                         lineGap: 1.5
                       });
                  });
                }
                doc.moveDown(0.8);
              }
              
              if (doc.y > 770) doc.addPage();
            });
          }
        }
        doc.moveDown(1);
      });
    }

    // --- FOOTER: PAGE NUMBERS ---
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor("#999999").text(
        `Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 50,
        { align: "center" }
      );
    }

    doc.end();
  });
}