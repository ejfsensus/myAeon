import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import SVGtoPDF from "svg-to-pdfkit";
import type { NatalProfileReport } from "./natalProfile";

const MARGIN = 54;
const WIDTH = 487.28;
const clean = (value: string) => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/[\u2010-\u2015]/g, "-");

export function renderNatalProfilePdf(report: NatalProfileReport, natalSvg?: string | null): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 90, bottom: 60, left: MARGIN, right: MARGIN }, bufferPages: true,
      info: { Title: "myAeon - Birth profile", Author: "myAeon", Subject: "Independent symbolic natal profile" } });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      doc.registerFont("Aeon", fs.readFileSync(path.join(process.cwd(), "public/fonts/DejaVuSans.ttf")));
      doc.registerFont("AeonBold", fs.readFileSync(path.join(process.cwd(), "public/fonts/DejaVuSans-Bold.ttf")));
      function decorate() {
        const { x, y } = doc;
        doc.save();
        doc.rect(0, 0, doc.page.width, 66).fill("#0c1430");
        doc.font("AeonBold").fontSize(18).fillColor("#e3c47d").text("myAeon", MARGIN, 22, { lineBreak: false });
        doc.font("Aeon").fontSize(9).fillColor("#ffffff").text("BIRTH PROFILE", 350, 29, { width: 190, align: "right", lineBreak: false });
        doc.restore(); doc.x = x; doc.y = y;
      }
      // Draw running furniture only after all flowing text is laid out.
      // Changing fonts/colours in pageAdded corrupts continuation text state.
      function space(needed: number) { if (doc.y + needed > doc.page.height - 60) doc.addPage(); }
      function paragraph(value: string, size = 10.5, color = "#28334a") {
        doc.font("Aeon").fontSize(size).fillColor(color).text(clean(value), MARGIN, doc.y, { width: WIDTH, lineGap: 4 });
        doc.moveDown(0.7);
      }
      function heading(value: string) {
        doc.font("AeonBold").fontSize(15);
        space(doc.heightOfString(clean(value), { width: WIDTH }) + 65);
        doc.fillColor("#15788a").text(clean(value), MARGIN, doc.y, { width: WIDTH, lineGap: 3 });
        doc.moveDown(0.5);
      }
      doc.y = 90;
      paragraph(report.depth === "deep" ? "DEEP NATAL ANALYSIS" : "STANDARD NATAL PROFILE", 9, "#84601c");
      doc.font("AeonBold").fontSize(25).fillColor("#182133").text(clean(report.title), MARGIN, doc.y, { width: WIDTH });
      doc.moveDown(0.7);
      paragraph(`${report.birth.date} · ${report.birth.localTime ?? "Unknown time"} ${report.birth.timezone}\n${report.birth.place} · ${report.birth.confidence} birth time\nPrepared ${new Date(report.generatedAt).toISOString().slice(0, 10)} (UTC)`, 9, "#647085");
      paragraph(report.overview);
      heading("How to read this profile");
      report.limitations.forEach(line => paragraph(line, 9, "#647085"));
      for (const section of report.sections) {
        heading(section.title);
        paragraph(section.body);
        space(40);
        paragraph("Supporting chart facts", 9, "#84601c");
        section.evidence.forEach(item => paragraph(item.text, 8.5, "#647085"));
      }
      heading("Bringing the patterns together"); paragraph(report.synthesis);
      heading("Questions for reflection"); report.reflections.forEach((question, i) => paragraph(`${i + 1}. ${question}`));
      if (natalSvg) {
        doc.addPage(); heading("Your natal chart");
        paragraph("Geocentric tropical natal wheel. The calculated chart is distinct from its symbolic interpretation.", 9, "#647085");
        SVGtoPDF(doc, natalSvg, MARGIN, doc.y, { width: WIDTH, height: WIDTH, preserveAspectRatio: "xMidYMid meet", assumePt: true });
        doc.y += WIDTH + 16;
      }
      doc.addPage(); heading("Natal evidence catalogue");
      paragraph("These calculated placements and aspects were supplied for this profile. Supporting references identify the facts used, not scientific proof of personality traits.", 9, "#647085");
      report.evidence.forEach(item => { space(35); paragraph(item.text, 9); });
      const range = doc.bufferedPageRange();
      for (let page = range.start; page < range.start + range.count; page++) {
        doc.switchToPage(page);
        decorate();
        const bottom = doc.page.margins.bottom; doc.page.margins.bottom = 0;
        doc.strokeColor("#d6b36a").lineWidth(0.6).moveTo(MARGIN, doc.page.height - 42).lineTo(doc.page.width - MARGIN, doc.page.height - 42).stroke();
        doc.font("Aeon").fontSize(8).fillColor("#647085").text(`myAeon · Birth profile · ${page + 1} / ${range.count}`, MARGIN, doc.page.height - 31, { width: WIDTH, align: "center", lineBreak: false });
        doc.page.margins.bottom = bottom;
      }
      doc.end();
    } catch (error) { doc.destroy(); reject(error); }
  });
}
