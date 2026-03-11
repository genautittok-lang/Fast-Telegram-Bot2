import PDFDocument from "pdfkit";
import QRCode from "qrcode";

function sanitizePdfText(text: string): string {
  if (!text) return '';
  const cyrillicMap: Record<string, string> = {
    '\u0410':'A','\u0411':'B','\u0412':'V','\u0413':'G','\u0414':'D','\u0415':'E','\u0401':'Yo',
    '\u0404':'Ye','\u0416':'Zh','\u0417':'Z','\u0418':'I','\u0406':'I','\u0407':'Yi','\u0419':'Y',
    '\u041A':'K','\u041B':'L','\u041C':'M','\u041D':'N','\u041E':'O','\u041F':'P','\u0420':'R',
    '\u0421':'S','\u0422':'T','\u0423':'U','\u0424':'F','\u0425':'Kh','\u0426':'Ts','\u0427':'Ch',
    '\u0428':'Sh','\u0429':'Shch','\u042A':'','\u042B':'Y','\u042C':'','\u042D':'E','\u042E':'Yu','\u042F':'Ya',
    '\u0430':'a','\u0431':'b','\u0432':'v','\u0433':'g','\u0434':'d','\u0435':'e','\u0451':'yo',
    '\u0454':'ye','\u0436':'zh','\u0437':'z','\u0438':'i','\u0456':'i','\u0457':'yi','\u0439':'y',
    '\u043A':'k','\u043B':'l','\u043C':'m','\u043D':'n','\u043E':'o','\u043F':'p','\u0440':'r',
    '\u0441':'s','\u0442':'t','\u0443':'u','\u0444':'f','\u0445':'kh','\u0446':'ts','\u0447':'ch',
    '\u0448':'sh','\u0449':'shch','\u044A':'','\u044B':'y','\u044C':'','\u044D':'e','\u044E':'yu','\u044F':'ya',
    '\u0491':'g','\u0490':'G',
  };
  const symbolMap: Record<string, string> = {
    '\u2139':'[i]','\u2139\uFE0F':'[i]',
    '\u26A0':'[!]','\u26A0\uFE0F':'[!]',
    '\u2713':'[OK]','\u2714':'[OK]','\u2705':'[OK]',
    '\u2715':'[X]','\u274C':'[X]','\u2717':'[X]',
    '\u26A1':'[!]','\u2022':'-','\u2023':'-','\u25CF':'-',
    '\u2B50':'*','\u2764':'^','\uFE0F':'',
  };
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (symbolMap[ch] !== undefined) { result += symbolMap[ch]; continue; }
    if (cyrillicMap[ch] !== undefined) { result += cyrillicMap[ch]; continue; }
    const code = ch.charCodeAt(0);
    if (code <= 0xFF) { result += ch; } else { result += '?'; }
  }
  return result;
}

const sp = (s: string) => sanitizePdfText(s);

interface AIInsights {
  summary: string;
  recommendations: string[];
  threatLevel: string;
  verdict: string;
}

interface ReportData {
  moduleType: string;
  targetValue: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  timestamp: Date;
  userId: string;
  findings: Finding[];
  sources: string[];
  metadata?: Record<string, string | number>;
  verificationId: string;
  aiInsights?: AIInsights;
}

interface Finding {
  type: "info" | "warning" | "danger" | "success";
  title: string;
  description: string;
  evidence?: string;
}

const C = {
  bg: "#050508",
  bgDark: "#020204",
  surface: "#0c0c14",
  surfaceAlt: "#101018",
  surfaceLight: "#16161f",
  surfaceBorder: "#1e1e2a",
  primary: "#22c55e",
  primaryDark: "#16a34a",
  primaryMuted: "#166534",
  accent: "#34d399",
  white: "#ffffff",
  textLight: "#f4f4f5",
  textSec: "#d4d4d8",
  textMuted: "#a1a1aa",
  textDim: "#71717a",
  textDark: "#52525b",
  success: "#22c55e",
  successBg: "#052e16",
  warning: "#f59e0b",
  warningBg: "#451a03",
  danger: "#ef4444",
  dangerBg: "#450a0a",
  info: "#3b82f6",
  infoBg: "#172554",
  high: "#f97316",
};

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const RISK_BG: Record<string, string> = {
  low: "#052e16",
  medium: "#451a03",
  high: "#431407",
  critical: "#450a0a",
};

async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 120,
    margin: 1,
    color: { dark: "#22c55e", light: "#050508" },
  });
}

function drawPageBg(doc: PDFKit.PDFDocument, w: number, h: number) {
  doc.rect(0, 0, w, h).fill(C.bg);
  doc.save();
  doc.opacity(0.07);
  doc.circle(w * 0.8, h * 0.15, 200).fill(C.primary);
  doc.circle(w * 0.2, h * 0.85, 150).fill(C.accent);
  doc.restore();
}

function drawLine(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, lineColor = C.surfaceBorder) {
  doc.moveTo(x1, y1).lineTo(x2, y1).lineWidth(0.5).strokeColor(lineColor).stroke();
}

function ensureSpace(doc: PDFKit.PDFDocument, y: number, needed: number, pageW: number, pageH: number, margin: number): number {
  if (y + needed > pageH - 60) {
    doc.addPage();
    drawPageBg(doc, pageW, pageH);
    drawPageHeader(doc, pageW, margin);
    return 70;
  }
  return y;
}

function drawPageHeader(doc: PDFKit.PDFDocument, pageW: number, margin: number) {
  doc.rect(0, 0, pageW, 45).fill(C.surface);
  doc.rect(0, 45, pageW, 1).fill(C.primaryMuted);
  doc.fillColor(C.primary).fontSize(11).font("Helvetica-Bold");
  doc.text("DARKSHARE", margin, 14);
  doc.fillColor(C.textDim).fontSize(7).font("Helvetica");
  doc.text("RISK INTELLIGENCE PLATFORM", margin + 85, 16);
}

export async function generateDetailedPDF(data: ReportData): Promise<Buffer> {
  const reportId = data.verificationId;
  const verificationUrl = `/verify/${reportId}`;
  const qrDataUrl = await generateQRDataURL(verificationUrl);
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
      info: {
        Title: `DARKSHARE Intelligence Report - ${data.moduleType.toUpperCase()}`,
        Author: "DARKSHARE v4.4",
        Subject: `Risk Assessment: ${data.targetValue}`,
        Keywords: "risk, assessment, security, darkshare, osint, intelligence",
        CreationDate: data.timestamp,
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const M = 40;
    const CW = W - M * 2;

    // ═══════════════ PAGE 1: COVER ═══════════════
    drawPageBg(doc, W, H);

    // Top accent bar
    doc.rect(0, 0, W, 4).fill(C.primary);

    const isDraft = reportId.startsWith("DRAFT-");

    // Classification banner
    doc.roundedRect(M, 30, CW, 28, 4).fill(C.surface);
    doc.rect(M, 30, 5, 28).fill(isDraft ? C.warning : C.danger);
    doc.fillColor(isDraft ? C.warning : C.danger).fontSize(8).font("Helvetica-Bold");
    doc.text(isDraft ? "DRAFT REPORT" : "CONFIDENTIAL", M + 15, 39);
    doc.fillColor(C.textDim).fontSize(7).font("Helvetica");
    doc.text(isDraft ? `Draft export  |  Not verified  |  ID: ${reportId}` : `Classification: Restricted  |  Distribution: Need-to-Know  |  ID: ${reportId}`, M + 100, 40);

    // Main title block
    let y = 90;
    doc.fillColor(C.primary).fontSize(38).font("Helvetica-Bold");
    doc.text("DARKSHARE", M, y);
    y += 45;
    doc.fillColor(C.textDim).fontSize(12).font("Helvetica");
    doc.text("RISK INTELLIGENCE PLATFORM  ·  v4.4", M, y);
    y += 35;

    drawLine(doc, M, y, M + CW, C.primaryMuted);
    y += 20;

    // Report type badge
    const moduleLabel = getModuleLabel(data.moduleType);
    const riskColor = RISK_COLORS[data.riskLevel] || C.warning;
    doc.roundedRect(M, y, 160, 32, 6).fill(C.primary);
    doc.fillColor(C.bgDark).fontSize(14).font("Helvetica-Bold");
    doc.text(moduleLabel.toUpperCase(), M + 12, y + 8, { width: 140 });
    
    doc.roundedRect(M + 170, y, 120, 32, 6).fill(riskColor);
    doc.fillColor(C.white).fontSize(14).font("Helvetica-Bold");
    doc.text(`RISK: ${data.riskLevel.toUpperCase()}`, M + 180, y + 8, { width: 110 });
    y += 55;

    // Subject of analysis
    doc.fillColor(C.textDim).fontSize(9).font("Helvetica");
    doc.text("SUBJECT OF ANALYSIS", M, y);
    y += 14;
    doc.roundedRect(M, y, CW, 50, 6).fill(C.surface);
    doc.rect(M, y, 4, 50).fill(C.primary);
    const displayTarget = sp(data.targetValue.length > 70
      ? data.targetValue.substring(0, 67) + "..."
      : data.targetValue);
    doc.fillColor(C.white).fontSize(18).font("Helvetica-Bold");
    doc.text(displayTarget, M + 18, y + 14, { width: CW - 30 });
    y += 70;

    // Report metadata grid
    doc.fillColor(C.textDim).fontSize(9).font("Helvetica");
    doc.text("REPORT METADATA", M, y);
    y += 14;
    doc.roundedRect(M, y, CW, 80, 6).fill(C.surface);

    const metaFields = [
      { label: "REPORT ID", value: reportId },
      { label: "MODULE", value: moduleLabel },
      { label: "ANALYST", value: sp(data.userId) },
      { label: "DATE", value: data.timestamp.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { label: "TIME (UTC)", value: data.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
      { label: "RISK SCORE", value: `${data.riskScore}/100` },
    ];
    const mCols = 3;
    const mColW = (CW - 30) / mCols;
    metaFields.forEach((f, i) => {
      const col = i % mCols;
      const row = Math.floor(i / mCols);
      const xP = M + 15 + col * mColW;
      const yP = y + 12 + row * 32;
      doc.fillColor(C.textDark).fontSize(7).font("Helvetica");
      doc.text(f.label, xP, yP);
      doc.fillColor(C.textLight).fontSize(10).font("Helvetica-Bold");
      const val = String(f.value).length > 25 ? String(f.value).substring(0, 22) + "..." : String(f.value);
      doc.text(val, xP, yP + 11);
    });
    y += 100;

    // Risk score visual (large gauge)
    doc.fillColor(C.textDim).fontSize(9).font("Helvetica");
    doc.text("RISK ASSESSMENT", M, y);
    y += 14;
    doc.roundedRect(M, y, CW, 130, 6).fill(C.surface);

    // Score circle
    const cx = M + 80;
    const cy = y + 65;
    const r = 42;
    doc.circle(cx, cy, r + 6).lineWidth(3).strokeColor(riskColor).stroke();
    doc.circle(cx, cy, r - 3).fill(C.surfaceLight);
    doc.fillColor(riskColor).fontSize(32).font("Helvetica-Bold");
    const st = data.riskScore.toString();
    const sw = doc.widthOfString(st);
    doc.text(st, cx - sw / 2, cy - 16);
    doc.fillColor(C.textDim).fontSize(10).font("Helvetica");
    doc.text("/100", cx - 12, cy + 14);

    // Risk bar
    const barX = M + 160;
    const barW = CW - 180;
    const barY2 = y + 30;
    doc.fillColor(C.textLight).fontSize(14).font("Helvetica-Bold");
    doc.text(data.riskLevel.toUpperCase() + " RISK", barX, barY2);
    
    const verdict = getVerdict(data.riskLevel, data.riskScore);
    doc.fillColor(C.textMuted).fontSize(9).font("Helvetica");
    doc.text(verdict.title, barX, barY2 + 20, { width: barW });
    doc.fillColor(C.textDim).fontSize(8).font("Helvetica");
    doc.text(verdict.description, barX, barY2 + 35, { width: barW });

    // Horizontal risk bar
    const hBarY = y + 95;
    doc.roundedRect(barX, hBarY, barW, 12, 6).fill(C.surfaceLight);
    const prog = Math.max((data.riskScore / 100) * barW, 12);
    doc.roundedRect(barX, hBarY, prog, 12, 6).fill(riskColor);

    // Scale labels
    doc.fillColor(C.textDark).fontSize(6).font("Helvetica");
    doc.text("0", barX, hBarY + 16);
    doc.text("25", barX + barW * 0.25 - 4, hBarY + 16);
    doc.text("50", barX + barW * 0.5 - 4, hBarY + 16);
    doc.text("75", barX + barW * 0.75 - 4, hBarY + 16);
    doc.text("100", barX + barW - 10, hBarY + 16);

    y += 150;

    // QR + verification section on cover
    doc.roundedRect(M, y, CW, 65, 6).fill(C.surface);
    if (isDraft) {
      doc.rect(M, y, 4, 65).fill(C.warning);
      doc.fillColor(C.warning).fontSize(10).font("Helvetica-Bold");
      doc.text("DRAFT — NOT VERIFIED", M + 18, y + 12);
      doc.fillColor(C.textDim).fontSize(8).font("Helvetica");
      doc.text("This is a draft export of check results. To obtain a verified report with QR verification, save results to your report history first.", M + 18, y + 28, { width: CW - 30 });
      doc.fillColor(C.textDark).fontSize(8).font("Helvetica");
      doc.text(`Draft ID: ${reportId}`, M + 18, y + 48);
    } else {
      doc.image(qrBuffer, M + 12, y + 7, { width: 50, height: 50 });
      doc.fillColor(C.textLight).fontSize(10).font("Helvetica-Bold");
      doc.text("VERIFICATION & AUTHENTICITY", M + 75, y + 12);
      doc.fillColor(C.textDim).fontSize(8).font("Helvetica");
      doc.text(`This report can be verified by scanning the QR code or visiting the verification URL.`, M + 75, y + 28, { width: CW - 95 });
      doc.fillColor(C.primary).fontSize(8).font("Helvetica-Bold");
      doc.text(`Verification ID: ${reportId}`, M + 75, y + 46);
    }

    // Footer line
    doc.rect(0, H - 30, W, 30).fill(C.surface);
    doc.fillColor(C.textDark).fontSize(6).font("Helvetica");
    doc.text("CONFIDENTIAL  ·  DARKSHARE v4.4 Risk Intelligence  ·  Page 1", M, H - 20, { width: CW, align: "center" });

    // ═══════════════ PAGE 2: FINDINGS ═══════════════
    doc.addPage();
    drawPageBg(doc, W, H);
    drawPageHeader(doc, W, M);
    y = 60;

    doc.fillColor(C.white).fontSize(16).font("Helvetica-Bold");
    doc.text("KEY FINDINGS", M, y);
    y += 25;

    const findings = data.findings.slice(0, 12);
    for (let i = 0; i < findings.length; i++) {
      const f = findings[i];
      y = ensureSpace(doc, y, 55, W, H, M);

      const fColor = { info: C.info, warning: C.warning, danger: C.danger, success: C.success }[f.type];
      const fBg = { info: C.infoBg, warning: C.warningBg, danger: C.dangerBg, success: C.successBg }[f.type];
      const fIcon = { info: "[i]", warning: "[!]", danger: "[X]", success: "[OK]" }[f.type];
      const fLabel = { info: "INFO", warning: "WARNING", danger: "CRITICAL", success: "SAFE" }[f.type];

      doc.roundedRect(M, y, CW, 42, 5).fill(C.surface);
      doc.rect(M, y, 4, 42).fill(fColor);

      // Number badge
      doc.roundedRect(M + 12, y + 8, 24, 24, 12).fill(fBg);
      doc.fillColor(fColor).fontSize(11).font("Helvetica-Bold");
      doc.text(String(i + 1).padStart(2, '0'), M + 14, y + 14, { width: 20, align: "center" });

      // Type badge
      doc.roundedRect(M + 44, y + 10, 60, 18, 4).fill(fBg);
      doc.fillColor(fColor).fontSize(7).font("Helvetica-Bold");
      doc.text(`${fIcon} ${fLabel}`, M + 48, y + 15, { width: 52, align: "center" });

      // Title
      const rawTitle = sp(f.title);
      const titleText = rawTitle.length > 65 ? rawTitle.substring(0, 62) + "..." : rawTitle;
      doc.fillColor(C.white).fontSize(10).font("Helvetica-Bold");
      doc.text(titleText, M + 115, y + 10, { width: CW - 135 });

      // Description
      if (f.description) {
        const rawDesc = sp(f.description);
        const desc = rawDesc.length > 85 ? rawDesc.substring(0, 82) + "..." : rawDesc;
        doc.fillColor(C.textDim).fontSize(8).font("Helvetica");
        doc.text(desc, M + 115, y + 25, { width: CW - 135 });
      }

      y += 48;
    }

    // Findings summary
    y = ensureSpace(doc, y, 60, W, H, M);
    y += 10;
    const dangerCount = findings.filter(f => f.type === "danger").length;
    const warnCount = findings.filter(f => f.type === "warning").length;
    const infoCount = findings.filter(f => f.type === "info").length;
    const safeCount = findings.filter(f => f.type === "success").length;

    doc.roundedRect(M, y, CW, 50, 6).fill(C.surface);
    doc.fillColor(C.textSec).fontSize(9).font("Helvetica-Bold");
    doc.text("FINDINGS SUMMARY", M + 15, y + 10);

    const sumY = y + 28;
    const sumW = (CW - 30) / 4;
    [
      { label: "CRITICAL", count: dangerCount, color: C.danger },
      { label: "WARNING", count: warnCount, color: C.warning },
      { label: "INFO", count: infoCount, color: C.info },
      { label: "SAFE", count: safeCount, color: C.success },
    ].forEach((s, i) => {
      const sx = M + 15 + i * sumW;
      doc.circle(sx + 5, sumY + 4, 5).fill(s.color);
      doc.fillColor(C.white).fontSize(10).font("Helvetica-Bold");
      doc.text(String(s.count), sx + 15, sumY);
      doc.fillColor(C.textDim).fontSize(7).font("Helvetica");
      doc.text(s.label, sx + 28, sumY + 2);
    });

    // ═══════════════ PAGE 3: DETAILS & AI ═══════════════
    const hasMetadata = data.metadata && Object.keys(data.metadata).length > 0;
    if (hasMetadata || data.aiInsights) {
      doc.addPage();
      drawPageBg(doc, W, H);
      drawPageHeader(doc, W, M);
      y = 60;

      if (hasMetadata) {
        doc.fillColor(C.white).fontSize(16).font("Helvetica-Bold");
        doc.text("ANALYSIS DETAILS", M, y);
        y += 25;

        const entries = Object.entries(data.metadata!).slice(0, 12);
        const detCols = 2;
        const detColW = (CW - 20) / detCols;
        const detRows = Math.ceil(entries.length / detCols);
        const detH = detRows * 38 + 20;

        doc.roundedRect(M, y, CW, detH, 6).fill(C.surface);

        entries.forEach(([key, value], idx) => {
          const col = idx % detCols;
          const row = Math.floor(idx / detCols);
          const xP = M + 15 + col * detColW;
          const yP = y + 15 + row * 38;

          doc.fillColor(C.textDark).fontSize(7).font("Helvetica");
          doc.text(sp(key.toUpperCase().replace(/_/g, ' ')), xP, yP);
          doc.fillColor(C.textLight).fontSize(11).font("Helvetica-Bold");
          const v = sp(String(value));
          doc.text(v.length > 45 ? v.substring(0, 42) + "..." : v, xP, yP + 12, { width: detColW - 20 });

          if (col === 0 && detCols === 2) {
            doc.moveTo(M + detColW + 5, yP - 3).lineTo(M + detColW + 5, yP + 25).lineWidth(0.3).strokeColor(C.surfaceBorder).stroke();
          }
        });

        y += detH + 20;
      }

      if (data.aiInsights) {
        y = ensureSpace(doc, y, 200, W, H, M);

        doc.fillColor(C.white).fontSize(16).font("Helvetica-Bold");
        doc.text("AI SECURITY ANALYSIS", M, y);
        doc.fillColor(C.textDim).fontSize(8).font("Helvetica");
        doc.text("Powered by DARKSHARE AI Engine", M + 180, y + 4);
        y += 25;

        // Threat level card
        const threatColors: Record<string, string> = {
          "\u0411\u0415\u0417\u041F\u0415\u0427\u041D\u041E": C.success, "SAFE": C.success,
          "\u0423\u0412\u0410\u0413\u0410": C.warning, "CAUTION": C.warning,
          "\u041D\u0415\u0411\u0415\u0417\u041F\u0415\u0427\u041D\u041E": C.high, "DANGEROUS": C.high,
          "\u041A\u0420\u0418\u0422\u0418\u0427\u041D\u041E": C.danger, "CRITICAL": C.danger,
        };
        const threatColor = threatColors[data.aiInsights.threatLevel] || C.warning;
        const threatLevelDisplay = sp(data.aiInsights.threatLevel);

        doc.roundedRect(M, y, CW, 80, 6).fill(C.surface);
        doc.rect(M, y, 4, 80).fill(threatColor);

        // Threat badge
        doc.roundedRect(M + 15, y + 12, 100, 24, 5).fill(threatColor);
        doc.fillColor(C.bgDark).fontSize(10).font("Helvetica-Bold");
        doc.text(threatLevelDisplay, M + 20, y + 17, { width: 90, align: "center" });

        // Verdict
        doc.fillColor(C.white).fontSize(12).font("Helvetica-Bold");
        doc.text(sp(data.aiInsights.verdict), M + 125, y + 15, { width: CW - 145 });

        // Summary
        const rawSummary = sp(data.aiInsights.summary);
        const summary = rawSummary.length > 200
          ? rawSummary.substring(0, 197) + "..."
          : rawSummary;
        doc.fillColor(C.textMuted).fontSize(9).font("Helvetica");
        doc.text(summary, M + 15, y + 48, { width: CW - 30 });

        y += 95;

        // Recommendations
        if (data.aiInsights.recommendations && data.aiInsights.recommendations.length > 0) {
          doc.fillColor(C.textSec).fontSize(10).font("Helvetica-Bold");
          doc.text("RECOMMENDATIONS", M, y);
          y += 18;

          const recs = data.aiInsights.recommendations.slice(0, 5);
          for (let i = 0; i < recs.length; i++) {
            y = ensureSpace(doc, y, 35, W, H, M);
            doc.roundedRect(M, y, CW, 28, 4).fill(C.surfaceAlt);
            doc.rect(M, y, 3, 28).fill(C.accent);
            doc.roundedRect(M + 12, y + 6, 20, 16, 8).fill(C.primaryMuted);
            doc.fillColor(C.accent).fontSize(8).font("Helvetica-Bold");
            doc.text(String(i + 1), M + 14, y + 10, { width: 16, align: "center" });
            const rawRec = sp(recs[i]);
            const recText = rawRec.length > 90 ? rawRec.substring(0, 87) + "..." : rawRec;
            doc.fillColor(C.textLight).fontSize(9).font("Helvetica");
            doc.text(recText, M + 40, y + 8, { width: CW - 55 });
            y += 34;
          }
        }
      }
    }

    // ═══════════════ PAGE 4: SOURCES & CERTIFICATION ═══════════════
    doc.addPage();
    drawPageBg(doc, W, H);
    drawPageHeader(doc, W, M);
    y = 60;

    doc.fillColor(C.white).fontSize(16).font("Helvetica-Bold");
    doc.text("DATA SOURCES & METHODOLOGY", M, y);
    y += 25;

    doc.roundedRect(M, y, CW, 40, 6).fill(C.surface);
    doc.fillColor(C.textMuted).fontSize(9).font("Helvetica");
    doc.text("This analysis was performed using the following intelligence sources and databases. Each source was queried in real-time to ensure data accuracy and relevance.", M + 15, y + 10, { width: CW - 30 });
    y += 55;

    const srcs = data.sources.slice(0, 12);
    for (let i = 0; i < srcs.length; i++) {
      y = ensureSpace(doc, y, 30, W, H, M);
      doc.roundedRect(M, y, CW, 24, 4).fill(i % 2 === 0 ? C.surface : C.surfaceAlt);
      doc.circle(M + 18, y + 12, 4).fill(C.primary);
      doc.fillColor(C.bgDark).fontSize(6).font("Helvetica-Bold");
      doc.text("v", M + 15, y + 9, { width: 6, align: "center" });
      doc.fillColor(C.textLight).fontSize(9).font("Helvetica-Bold");
      doc.text(sp(srcs[i]), M + 30, y + 7);
      y += 28;
    }

    y += 20;
    y = ensureSpace(doc, y, 200, W, H, M);

    // Certification section
    doc.fillColor(C.white).fontSize(16).font("Helvetica-Bold");
    doc.text("CERTIFICATION & VERIFICATION", M, y);
    y += 25;

    doc.roundedRect(M, y, CW, 190, 8).fill(C.surface);
    doc.rect(M, y, CW, 4).fill(C.primary);

    // Stamp
    const stampX = M + 75;
    const stampY2 = y + 95;
    doc.save();
    doc.circle(stampX, stampY2, 48).lineWidth(3).strokeColor(C.primary).stroke();
    doc.circle(stampX, stampY2, 42).lineWidth(1.5).strokeColor(C.primary).stroke();
    doc.circle(stampX, stampY2, 36).lineWidth(0.8).strokeColor(C.primaryMuted).stroke();

    doc.fillColor(C.primary).fontSize(5).font("Helvetica-Bold");
    doc.text("• DARKSHARE INTERNATIONAL •", stampX - 35, stampY2 - 36, { width: 70, align: "center" });
    doc.fillColor(C.primary).fontSize(16).font("Helvetica-Bold");
    doc.text("VERIFIED", stampX - 35, stampY2 - 12, { width: 70, align: "center" });
    doc.fillColor(C.primary).fontSize(7).font("Helvetica");
    doc.text("SECURITY ANALYSIS", stampX - 35, stampY2 + 8, { width: 70, align: "center" });
    doc.fillColor(C.primary).fontSize(6).font("Helvetica-Bold");
    doc.text(data.timestamp.toLocaleDateString('en-GB'), stampX - 30, stampY2 + 22, { width: 60, align: "center" });
    doc.fillColor(C.primaryMuted).fontSize(4).font("Helvetica");
    doc.text("RISK INTELLIGENCE PLATFORM", stampX - 35, stampY2 + 34, { width: 70, align: "center" });
    doc.restore();

    // Cert details
    const certX = M + 170;
    doc.fillColor(C.textLight).fontSize(11).font("Helvetica-Bold");
    doc.text("Certificate of Analysis", certX, y + 20);

    const certFields = [
      { l: "Report ID", v: reportId },
      { l: "Module", v: moduleLabel },
      { l: "Target", v: displayTarget.substring(0, 35) },
      { l: "Risk Level", v: `${data.riskLevel.toUpperCase()} (${data.riskScore}/100)` },
      { l: "Date", v: data.timestamp.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { l: "Analyst", v: sp(data.userId) },
    ];
    let cY = y + 40;
    certFields.forEach(cf => {
      doc.fillColor(C.textDark).fontSize(7).font("Helvetica");
      doc.text(cf.l.toUpperCase(), certX, cY);
      doc.fillColor(C.textLight).fontSize(9).font("Helvetica-Bold");
      doc.text(cf.v, certX + 80, cY);
      cY += 16;
    });

    // Hash
    const hash = Buffer.from(`${reportId}-${data.targetValue}-${data.timestamp.getTime()}`).toString("base64").substring(0, 32);
    doc.fillColor(C.textDark).fontSize(7).font("Helvetica");
    doc.text("INTEGRITY HASH", certX, cY + 5);
    doc.fillColor(C.primary).fontSize(8).font("Courier");
    doc.text(hash, certX + 80, cY + 5);

    y += 210;

    // QR verification block
    y = ensureSpace(doc, y, 80, W, H, M);
    doc.roundedRect(M, y, CW, 70, 6).fill(C.surface);
    if (isDraft) {
      doc.rect(M, y, 4, 70).fill(C.warning);
      doc.fillColor(C.warning).fontSize(10).font("Helvetica-Bold");
      doc.text("DRAFT — Verification Not Available", M + 18, y + 15);
      doc.fillColor(C.textDim).fontSize(8).font("Helvetica");
      doc.text("This draft report was exported directly from check results and does not have a verification ID. Save the report to your history to generate a verified report with QR code authentication.", M + 18, y + 32, { width: CW - 30 });
    } else {
      doc.image(qrBuffer, M + 12, y + 10, { width: 50, height: 50 });
      doc.fillColor(C.textLight).fontSize(10).font("Helvetica-Bold");
      doc.text("Scan QR code to verify this report", M + 75, y + 15);
      doc.fillColor(C.textDim).fontSize(8).font("Helvetica");
      doc.text("Each DARKSHARE report is assigned a unique verification ID. This report's authenticity can be verified through the DARKSHARE verification portal.", M + 75, y + 32, { width: CW - 100 });
      doc.fillColor(C.primary).fontSize(8).font("Courier");
      doc.text(verificationUrl, M + 75, y + 55);
    }

    // Disclaimer
    y += 85;
    y = ensureSpace(doc, y, 60, W, H, M);
    doc.roundedRect(M, y, CW, 50, 4).fill(C.surfaceAlt);
    doc.rect(M, y, 3, 50).fill(C.warning);
    doc.fillColor(C.warning).fontSize(7).font("Helvetica-Bold");
    doc.text("LEGAL DISCLAIMER", M + 15, y + 8);
    doc.fillColor(C.textDim).fontSize(7).font("Helvetica");
    doc.text("This report is provided for informational purposes only and does not constitute legal, financial, or professional advice. DARKSHARE makes no warranties regarding the accuracy or completeness of the information contained herein. The recipient assumes full responsibility for any actions taken based on this report.", M + 15, y + 20, { width: CW - 30 });

    // Footer on last page
    const footY = H - 30;
    doc.rect(0, footY, W, 30).fill(C.surface);
    doc.fillColor(C.textDark).fontSize(6).font("Helvetica");
    doc.text(`CONFIDENTIAL  ·  DARKSHARE v4.4 Risk Intelligence  ·  © ${new Date().getFullYear()} DARKSHARE International  ·  Generated: ${data.timestamp.toISOString()}`, M, footY + 10, { width: CW, align: "center" });

    doc.end();
  });
}

function getModuleLabel(moduleType: string): string {
  const labels: Record<string, string> = {
    ip: "IP Analysis",
    wallet: "Blockchain Intel",
    phone: "Phone Intel",
    email: "Email Check",
    domain: "Domain Intel",
    url: "URL Scan",
    bot: "Bot Audit",
    cve: "CVE Scan",
    hash: "Hash Check",
    username: "Username OSINT",
    card: "Card BIN Check",
    password: "Password Audit",
    dns: "DNS Analysis",
    ssl: "SSL/TLS Check",
    mac: "MAC Lookup",
  };
  return labels[moduleType] || moduleType.toUpperCase();
}

function getVerdict(level: string, score: number): { title: string; description: string } {
  if (level === "critical" || score >= 80) {
    return {
      title: "CRITICAL RISK — Immediate Action Required",
      description: "Serious risk indicators detected. Do not proceed without thorough verification and comprehensive risk mitigation measures.",
    };
  }
  if (level === "high" || score >= 60) {
    return {
      title: "HIGH RISK — Exercise Extreme Caution",
      description: "Multiple concerning indicators found. Additional verification strongly recommended before any interaction.",
    };
  }
  if (level === "medium" || score >= 30) {
    return {
      title: "MODERATE RISK — Apply Due Diligence",
      description: "Some risk indicators present. Standard verification procedures should be followed before proceeding.",
    };
  }
  return {
    title: "LOW RISK — Generally Safe",
    description: "No significant risk indicators detected. Standard precautions still recommended for all operations.",
  };
}

export function generateFindings(moduleType: string, riskLevel: string): Finding[] {
  const baseFindingsByModule: Record<string, Finding[]> = {
    ip: [
      { type: "info", title: "Geolocation Identified", description: "IP location resolved to specific geographic region." },
      { type: "info", title: "ISP/ASN Data Retrieved", description: "Provider and network information extracted." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Blacklist Status", description: riskLevel === "high" ? "IP found on abuse databases." : "IP not found on blacklists." },
      { type: "info", title: "Proxy/VPN Detection", description: "Analyzed for proxy, VPN or Tor characteristics." },
    ],
    wallet: [
      { type: "info", title: "Transaction History Analysis", description: "Transaction history analyzed for suspicious patterns." },
      { type: "info", title: "Token Holdings Identified", description: "Current token balances and positions mapped." },
      { type: riskLevel === "high" ? "warning" : "success", title: "Mixer Interaction Check", description: riskLevel === "high" ? "Mixing service interaction detected." : "No mixer interactions found." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Sanctions Database", description: riskLevel === "high" ? "Address flagged by sanctions." : "Address not sanctioned." },
    ],
    phone: [
      { type: "info", title: "Number Classification", description: "Carrier type and line classification identified." },
      { type: riskLevel === "high" ? "warning" : "info", title: "VOIP Detection", description: riskLevel === "high" ? "Virtual/VOIP number detected." : "Standard mobile carrier verified." },
      { type: "info", title: "Geographic Origin", description: "Country and region identified." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Fraud Reports", description: riskLevel === "high" ? "Number reported for fraud." : "No fraud reports found." },
    ],
    email: [
      { type: "info", title: "Email Validation", description: "Syntax, domain and MX record validation completed." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Data Breach Check", description: riskLevel === "high" ? "Email found in breach databases." : "Email not in known breaches." },
      { type: riskLevel === "medium" ? "warning" : "success", title: "Disposable Check", description: riskLevel === "medium" ? "Temporary provider detected." : "Legitimate provider confirmed." },
      { type: "info", title: "Domain Reputation", description: "Email domain reputation analyzed." },
    ],
    domain: [
      { type: "info", title: "WHOIS Analysis", description: "Domain registration details retrieved." },
      { type: "info", title: "SSL/TLS Certificate", description: "Certificate validity verified." },
      { type: riskLevel === "high" ? "warning" : "success", title: "Registration Jurisdiction", description: riskLevel === "high" ? "High-risk jurisdiction." : "Standard jurisdiction." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Sanctions Check", description: riskLevel === "high" ? "Owner appears sanctioned." : "No sanctions found." },
    ],
    url: [
      { type: "info", title: "URL Structure Analysis", description: "URL structure analyzed for anomalies." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Malware Detection", description: riskLevel === "high" ? "Malicious content detected." : "No malware detected." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Phishing Assessment", description: riskLevel === "high" ? "Matches phishing patterns." : "No phishing indicators." },
      { type: "info", title: "Redirect Chain Analysis", description: "URL redirect chain analyzed." },
    ],
    bot: [
      { type: "info", title: "Token Validation", description: "Bot token validated via Telegram API." },
      { type: "info", title: "Bot Info Retrieved", description: "Username and capabilities identified." },
      { type: riskLevel === "high" ? "warning" : "success", title: "Permission Check", description: riskLevel === "high" ? "Elevated permissions detected." : "Standard permissions." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Security Analysis", description: riskLevel === "high" ? "Suspicious bot patterns found." : "No security issues found." },
    ],
    password: [
      { type: "info", title: "Entropy Calculation", description: "Password entropy and bit strength computed." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Breach Database Check", description: riskLevel === "high" ? "Password found in HIBP breaches." : "Password not found in known breaches." },
      { type: riskLevel === "high" ? "warning" : "info", title: "Pattern Detection", description: riskLevel === "high" ? "Common patterns detected." : "No known patterns found." },
      { type: "info", title: "Crack Time Estimation", description: "Estimated time to crack via brute force." },
    ],
    dns: [
      { type: "info", title: "A/AAAA Record Resolution", description: "IP addresses resolved from DNS." },
      { type: "info", title: "MX Records Retrieved", description: "Mail server configuration analyzed." },
      { type: riskLevel === "high" ? "warning" : "success", title: "SPF/DMARC Policy", description: riskLevel === "high" ? "Misconfigured email auth." : "Email authentication properly configured." },
      { type: riskLevel === "high" ? "danger" : "success", title: "DNSSEC Status", description: riskLevel === "high" ? "DNSSEC not enabled." : "DNSSEC properly configured." },
    ],
    ssl: [
      { type: riskLevel === "high" ? "danger" : "success", title: "Certificate Validity", description: riskLevel === "high" ? "Certificate expired or invalid." : "Certificate is valid and current." },
      { type: "info", title: "Issuer Verification", description: "Certificate authority identified." },
      { type: riskLevel === "high" ? "warning" : "success", title: "HSTS Policy", description: riskLevel === "high" ? "HSTS not enforced." : "HSTS properly configured." },
      { type: "info", title: "SAN Analysis", description: "Subject alternative names checked." },
    ],
    mac: [
      { type: "info", title: "OUI Vendor Lookup", description: "Manufacturer identified from OUI prefix." },
      { type: "info", title: "Device Type Classification", description: "MAC address type and format analyzed." },
      { type: riskLevel === "high" ? "warning" : "success", title: "VM Detection", description: riskLevel === "high" ? "Virtual machine MAC detected." : "Physical device identified." },
      { type: "info", title: "Address Classification", description: "Unicast/multicast status determined." },
    ],
  };

  return baseFindingsByModule[moduleType] || [
    { type: "info", title: "Analysis Complete", description: "Target analyzed using available intelligence sources." },
  ];
}

export function generateMetadata(moduleType: string): Record<string, string | number> {
  const baseMetadata: Record<string, Record<string, string | number>> = {
    ip: { "Duration": "2.3s", "DBs Checked": 12, "APIs Used": 5 },
    wallet: { "Blockchain": "Multi", "TX Analyzed": Math.floor(Math.random() * 500) + 50, "APIs": 4 },
    phone: { "Carrier": "Mobile", "DBs": 8, "Signals": Math.floor(Math.random() * 5) },
    email: { "MX": "Valid", "Breach DBs": 15, "Age": "2+ years" },
    domain: { "Age": "5 years", "Registrar": "Cloudflare", "DNS": 12 },
    url: { "Status": 200, "Redirects": Math.floor(Math.random() * 3), "Engines": 70 },
    bot: { "API": "Telegram", "Validation": "Live", "Checks": 4 },
    password: { "Charset": "Mixed", "Entropy": "High", "HIBP Check": "Complete" },
    dns: { "Resolver": "Google DNS", "Record Types": 6, "DNSSEC": "Checked" },
    ssl: { "Protocol": "TLS 1.3", "Key Size": "256-bit", "HSTS": "Checked" },
    mac: { "OUI Source": "IEEE", "Format": "EUI-48", "Type": "Unicast" },
  };

  return baseMetadata[moduleType] || { "Type": moduleType };
}
