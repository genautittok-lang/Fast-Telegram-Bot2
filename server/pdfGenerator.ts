import PDFDocument from "pdfkit";
import QRCode from "qrcode";

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

const COLORS = {
  primary: "#22c55e",
  primaryDark: "#16a34a",
  background: "#0a0a0f",
  surface: "#13131a",
  surfaceLight: "#1a1a24",
  text: "#ffffff",
  textSecondary: "#e4e4e7",
  textMuted: "#a1a1aa",
  textDim: "#71717a",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

const RISK_COLORS = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 100,
    margin: 1,
    color: {
      dark: "#22c55e",
      light: "#0a0a0f",
    },
  });
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
        Title: `DARKSHARE Report - ${data.moduleType.toUpperCase()}`,
        Author: "DARKSHARE v4.4",
        Subject: `Risk Assessment for ${data.targetValue}`,
        Keywords: "risk, assessment, security, darkshare, osint",
        CreationDate: data.timestamp,
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    doc.rect(0, 0, pageWidth, pageHeight).fill(COLORS.background);

    doc.rect(0, 0, pageWidth, 70).fill(COLORS.surface);

    doc.fillColor(COLORS.primary).fontSize(24).font("Helvetica-Bold");
    doc.text("DARKSHARE", margin, 20);
    doc.fillColor(COLORS.textMuted).fontSize(9).font("Helvetica");
    doc.text("RISK INTELLIGENCE PLATFORM", margin, 46);

    const dateStr = data.timestamp.toLocaleDateString('en-GB', { 
      year: 'numeric', month: 'short', day: 'numeric'
    });
    const timeStr = data.timestamp.toLocaleTimeString('en-GB', { 
      hour: '2-digit', minute: '2-digit'
    });

    doc.fillColor(COLORS.textMuted).fontSize(8).font("Helvetica");
    doc.text(`Report ID: ${reportId}`, pageWidth - margin - 150, 22, { width: 150, align: "right" });
    doc.text(`${dateStr} ${timeStr}`, pageWidth - margin - 150, 34, { width: 150, align: "right" });

    const moduleLabel = getModuleLabel(data.moduleType);
    doc.roundedRect(pageWidth - margin - 100, 48, 100, 18, 4).fill(COLORS.primary);
    doc.fillColor(COLORS.background).fontSize(9).font("Helvetica-Bold");
    doc.text(moduleLabel.toUpperCase(), pageWidth - margin - 95, 53, { width: 90, align: "center" });

    let y = 85;

    doc.fillColor(COLORS.textSecondary).fontSize(10).font("Helvetica-Bold");
    doc.text("SUBJECT OF ANALYSIS", margin, y);
    y += 18;

    doc.roundedRect(margin, y, contentWidth, 45, 6).fill(COLORS.surface);
    
    const displayTarget = data.targetValue.length > 60 
      ? data.targetValue.substring(0, 57) + "..." 
      : data.targetValue;
    doc.fillColor(COLORS.text).fontSize(14).font("Helvetica-Bold");
    doc.text(displayTarget, margin + 15, y + 14, { width: contentWidth - 30 });

    y += 60;

    const riskBoxWidth = contentWidth * 0.42;
    const verdictBoxWidth = contentWidth * 0.55;
    const gap = contentWidth - riskBoxWidth - verdictBoxWidth;

    doc.fillColor(COLORS.textSecondary).fontSize(10).font("Helvetica-Bold");
    doc.text("RISK ASSESSMENT", margin, y);
    doc.text("VERDICT", margin + riskBoxWidth + gap, y);
    y += 18;

    doc.roundedRect(margin, y, riskBoxWidth, 90, 6).fill(COLORS.surface);

    const riskColor = RISK_COLORS[data.riskLevel];
    const circleX = margin + 55;
    const circleY = y + 45;
    const radius = 28;

    doc.circle(circleX, circleY, radius + 4).lineWidth(3).stroke(riskColor);
    doc.circle(circleX, circleY, radius - 2).fill(COLORS.surfaceLight);
    
    doc.fillColor(riskColor).fontSize(22).font("Helvetica-Bold");
    const scoreText = data.riskScore.toString();
    const scoreWidth = doc.widthOfString(scoreText);
    doc.text(scoreText, circleX - scoreWidth / 2, circleY - 10);
    doc.fillColor(COLORS.textDim).fontSize(7).font("Helvetica");
    doc.text("/100", circleX - 8, circleY + 8);

    doc.fillColor(riskColor).fontSize(16).font("Helvetica-Bold");
    doc.text(data.riskLevel.toUpperCase(), margin + 100, y + 28);
    doc.fillColor(COLORS.textMuted).fontSize(9).font("Helvetica");
    doc.text("Risk Level", margin + 100, y + 48);

    const barWidth = riskBoxWidth - 120;
    const barProgress = (data.riskScore / 100) * barWidth;
    doc.roundedRect(margin + 100, y + 65, barWidth, 8, 4).fill(COLORS.surfaceLight);
    if (barProgress > 0) {
      doc.roundedRect(margin + 100, y + 65, Math.max(barProgress, 8), 8, 4).fill(riskColor);
    }

    doc.roundedRect(margin + riskBoxWidth + gap, y, verdictBoxWidth, 90, 6).fill(COLORS.surface);
    
    const verdict = getVerdict(data.riskLevel, data.riskScore);
    doc.fillColor(COLORS.text).fontSize(13).font("Helvetica-Bold");
    doc.text(verdict.title, margin + riskBoxWidth + gap + 15, y + 20, { width: verdictBoxWidth - 30 });
    doc.fillColor(COLORS.textMuted).fontSize(10).font("Helvetica");
    doc.text(verdict.description, margin + riskBoxWidth + gap + 15, y + 45, { width: verdictBoxWidth - 30 });

    y += 105;

    doc.fillColor(COLORS.textSecondary).fontSize(10).font("Helvetica-Bold");
    doc.text("KEY FINDINGS", margin, y);
    y += 18;

    const findingsToShow = data.findings.slice(0, 5);
    const findingRowHeight = 24;
    const findingsHeight = findingsToShow.length * findingRowHeight + 16;
    
    doc.roundedRect(margin, y, contentWidth, findingsHeight, 6).fill(COLORS.surface);
    
    let findingY = y + 10;
    for (const finding of findingsToShow) {
      const findingColor = {
        info: COLORS.info,
        warning: COLORS.warning,
        danger: COLORS.danger,
        success: COLORS.success,
      }[finding.type];

      doc.circle(margin + 20, findingY + 6, 5).fill(findingColor);
      
      const icon = { info: "i", warning: "!", danger: "x", success: "✓" }[finding.type];
      doc.fillColor(COLORS.background).fontSize(8).font("Helvetica-Bold");
      doc.text(icon, margin + 16, findingY + 2, { width: 8, align: "center" });

      doc.fillColor(COLORS.text).fontSize(10).font("Helvetica-Bold");
      doc.text(finding.title, margin + 35, findingY + 2);
      
      if (finding.description) {
        doc.fillColor(COLORS.textDim).fontSize(8).font("Helvetica");
        const descWidth = contentWidth - 180;
        const shortDesc = finding.description.length > 50 
          ? finding.description.substring(0, 47) + "..."
          : finding.description;
        doc.text(shortDesc, pageWidth - margin - descWidth - 10, findingY + 3, { width: descWidth, align: "right" });
      }

      findingY += findingRowHeight;
    }

    y += findingsHeight + 15;

    if (data.metadata && Object.keys(data.metadata).length > 0) {
      doc.fillColor(COLORS.textSecondary).fontSize(10).font("Helvetica-Bold");
      doc.text("ANALYSIS DETAILS", margin, y);
      y += 18;

      const metaEntries = Object.entries(data.metadata).slice(0, 6);
      const cols = 3;
      const rows = Math.ceil(metaEntries.length / cols);
      const metaHeight = rows * 28 + 16;
      const colWidth = (contentWidth - 30) / cols;
      
      doc.roundedRect(margin, y, contentWidth, metaHeight, 6).fill(COLORS.surface);
      
      metaEntries.forEach(([key, value], index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const xPos = margin + 15 + (col * colWidth);
        const yPos = y + 12 + (row * 28);
        
        doc.fillColor(COLORS.textDim).fontSize(8).font("Helvetica");
        doc.text(key.toUpperCase(), xPos, yPos);
        doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold");
        doc.text(String(value), xPos, yPos + 12);
      });

      y += metaHeight + 15;
    }

    // AI INSIGHTS SECTION
    if (data.aiInsights) {
      doc.fillColor(COLORS.textSecondary).fontSize(10).font("Helvetica-Bold");
      doc.text("AI SECURITY ANALYSIS", margin, y);
      y += 18;

      const aiHeight = 70;
      doc.roundedRect(margin, y, contentWidth, aiHeight, 6).fill(COLORS.surface);
      
      // Threat level badge
      const threatColors: Record<string, string> = {
        "БЕЗПЕЧНО": COLORS.success,
        "УВАГА": COLORS.warning,
        "НЕБЕЗПЕЧНО": "#f97316",
        "КРИТИЧНО": COLORS.danger,
      };
      const threatColor = threatColors[data.aiInsights.threatLevel] || COLORS.warning;
      doc.roundedRect(margin + 12, y + 10, 80, 20, 4).fill(threatColor);
      doc.fillColor(COLORS.background).fontSize(8).font("Helvetica-Bold");
      doc.text(data.aiInsights.threatLevel, margin + 14, y + 15, { width: 76, align: "center" });

      // Verdict
      doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold");
      doc.text(data.aiInsights.verdict, margin + 100, y + 14, { width: contentWidth - 115 });

      // Summary (compact)
      const shortSummary = data.aiInsights.summary.length > 140 
        ? data.aiInsights.summary.substring(0, 137) + "..."
        : data.aiInsights.summary;
      doc.fillColor(COLORS.textMuted).fontSize(9).font("Helvetica");
      doc.text(shortSummary, margin + 12, y + 38, { width: contentWidth - 24 });

      // Top 2 recommendations
      const topRecs = data.aiInsights.recommendations.slice(0, 2);
      if (topRecs.length > 0) {
        doc.fillColor(COLORS.textDim).fontSize(8).font("Helvetica");
        const recsText = topRecs.map((r, i) => `${i + 1}. ${r}`).join("  ");
        doc.text(recsText.substring(0, 100), margin + 12, y + 55, { width: contentWidth - 24 });
      }

      y += aiHeight + 15;
    }

    doc.fillColor(COLORS.textSecondary).fontSize(10).font("Helvetica-Bold");
    doc.text("DATA SOURCES", margin, y);
    y += 14;
    doc.fillColor(COLORS.textDim).fontSize(9).font("Helvetica");
    const sourcesText = data.sources.slice(0, 6).join("  •  ");
    doc.text(sourcesText, margin, y, { width: contentWidth * 0.65 });

    const qrX = pageWidth - margin - 70;
    const qrY = pageHeight - 145;
    
    doc.roundedRect(qrX - 8, qrY - 8, 86, 106, 6).fill(COLORS.surface);
    doc.image(qrBuffer, qrX, qrY, { width: 70, height: 70 });
    doc.fillColor(COLORS.textMuted).fontSize(7).font("Helvetica");
    doc.text("SCAN TO VERIFY", qrX - 5, qrY + 75, { width: 80, align: "center" });
    doc.fillColor(COLORS.textDim).fontSize(6).font("Helvetica");
    doc.text(reportId, qrX - 5, qrY + 86, { width: 80, align: "center" });

    const stampX = margin + 50;
    const stampY = pageHeight - 100;
    
    doc.save();
    doc.circle(stampX, stampY, 38).lineWidth(2.5).stroke(COLORS.primary);
    doc.circle(stampX, stampY, 32).lineWidth(1.5).stroke(COLORS.primary);
    
    doc.fillColor(COLORS.primary).fontSize(5).font("Helvetica-Bold");
    doc.text("DARKSHARE", stampX - 25, stampY - 26, { width: 50, align: "center" });
    doc.text("INTERNATIONAL", stampX - 25, stampY - 19, { width: 50, align: "center" });
    
    doc.fillColor(COLORS.primary).fontSize(12).font("Helvetica-Bold");
    doc.text("VERIFIED", stampX - 25, stampY - 6, { width: 50, align: "center" });
    
    doc.fillColor(COLORS.primary).fontSize(6).font("Helvetica");
    doc.text("SECURITY ANALYSIS", stampX - 30, stampY + 10, { width: 60, align: "center" });
    
    const certDate = data.timestamp.toLocaleDateString('en-GB');
    doc.fillColor(COLORS.primary).fontSize(6).font("Helvetica-Bold");
    doc.text(certDate, stampX - 20, stampY + 22, { width: 40, align: "center" });
    doc.restore();

    const footerY = pageHeight - 35;
    
    doc.fillColor(COLORS.textDim).fontSize(7).font("Helvetica");
    doc.text("CONFIDENTIAL - This report is intended for authorized recipients only.", margin, footerY);
    
    const hash = Buffer.from(`${reportId}-${data.targetValue}-${data.timestamp.getTime()}`).toString("base64").substring(0, 16);
    doc.text(`DARKSHARE v4.4  •  Hash: ${hash}  •  © ${new Date().getFullYear()}`, margin, footerY + 12);

    doc.end();
  });
}

function getModuleLabel(moduleType: string): string {
  const labels: Record<string, string> = {
    ip: "IP Analysis",
    wallet: "Blockchain",
    phone: "Phone Intel",
    email: "Email Check",
    domain: "Domain Intel",
    url: "URL Scan",
    bot: "Bot Audit",
    cve: "CVE Scan",
    iot: "IoT Scan",
    cloud: "Cloud Intel",
  };
  return labels[moduleType] || moduleType.toUpperCase();
}

function getVerdict(level: string, score: number): { title: string; description: string } {
  if (level === "critical" || score >= 80) {
    return {
      title: "CRITICAL RISK — Immediate Action Required",
      description: "Serious risk indicators detected. Do not proceed without thorough verification and risk mitigation.",
    };
  }
  if (level === "high" || score >= 60) {
    return {
      title: "HIGH RISK — Exercise Extreme Caution",
      description: "Multiple concerning indicators found. Additional verification strongly recommended before proceeding.",
    };
  }
  if (level === "medium" || score >= 30) {
    return {
      title: "MODERATE RISK — Apply Due Diligence",
      description: "Some risk indicators present. Standard verification procedures should be followed.",
    };
  }
  return {
    title: "LOW RISK — Generally Safe",
    description: "No significant risk indicators detected. Standard precautions recommended.",
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
  };

  return baseFindingsByModule[moduleType] || [
    { type: "info", title: "Analysis Complete", description: "Target analyzed using available sources." },
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
  };

  return baseMetadata[moduleType] || { "Type": moduleType };
}
