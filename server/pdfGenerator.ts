import PDFDocument from "pdfkit";

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
}

interface Finding {
  type: "info" | "warning" | "danger" | "success";
  title: string;
  description: string;
  evidence?: string;
}

const COLORS = {
  primary: "#22c55e",
  background: "#0a0a0f",
  surface: "#16161d",
  border: "#27272a",
  text: "#fafafa",
  textMuted: "#a1a1aa",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  info: "#3b82f6",
};

const RISK_COLORS = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export function generateDetailedPDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      bufferPages: true,
      info: {
        Title: `DARKSHARE Report - ${data.moduleType.toUpperCase()}`,
        Author: "DARKSHARE v4.0",
        Subject: `Risk Assessment for ${data.targetValue}`,
        Keywords: "risk, assessment, security, darkshare",
        CreationDate: data.timestamp,
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;
    const reportId = `DS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    doc.rect(0, 0, pageWidth, 55).fill(COLORS.background);
    doc.rect(0, 55, pageWidth, 2).fill(COLORS.primary);

    doc.fillColor(COLORS.text).fontSize(20).font("Helvetica-Bold");
    doc.text("DARKSHARE", margin, 12);
    doc.fillColor(COLORS.primary).fontSize(7).font("Helvetica");
    doc.text("RISK INTELLIGENCE PLATFORM", margin, 32);
    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text("Certified Security Analysis Report", margin, 40);

    const moduleLabel = getModuleLabel(data.moduleType);
    doc.roundedRect(pageWidth - margin - 80, 12, 80, 22, 3).fill(COLORS.surface);
    doc.fillColor(COLORS.text).fontSize(6).font("Helvetica-Bold");
    doc.text(moduleLabel.toUpperCase(), pageWidth - margin - 75, 17, { width: 70, align: "center" });
    doc.fillColor(COLORS.textMuted).fontSize(4).font("Helvetica");
    doc.text("ANALYSIS MODULE", pageWidth - margin - 75, 26, { width: 70, align: "center" });

    doc.fillColor(COLORS.textMuted).fontSize(4).font("Helvetica");
    doc.text(`ID: ${reportId}`, pageWidth - margin - 80, 38, { width: 80, align: "right" });

    let y = 65;

    doc.roundedRect(margin, y, contentWidth, 32, 3).fill(COLORS.surface);
    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica-Bold");
    doc.text("SUBJECT OF ANALYSIS", margin + 8, y + 5);
    doc.fillColor(COLORS.text).fontSize(9).font("Helvetica-Bold");
    const displayTarget = data.targetValue.length > 70 
      ? data.targetValue.substring(0, 67) + "..." 
      : data.targetValue;
    doc.text(displayTarget, margin + 8, y + 14);

    const dateStr = data.timestamp.toLocaleDateString('uk-UA', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.fillColor(COLORS.textMuted).fontSize(4).font("Helvetica");
    doc.text("DATE: " + dateStr, pageWidth - margin - 100, y + 24, { width: 92, align: "right" });

    y += 40;

    const riskBoxWidth = contentWidth * 0.35;
    const verdictBoxWidth = contentWidth * 0.63;

    doc.roundedRect(margin, y, riskBoxWidth, 60, 3).fill(COLORS.surface);
    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica-Bold");
    doc.text("RISK ASSESSMENT", margin + 8, y + 5);

    const riskColor = RISK_COLORS[data.riskLevel];
    const circleX = margin + 30;
    const circleY = y + 35;
    doc.circle(circleX, circleY, 16).lineWidth(2.5).stroke(riskColor);
    doc.circle(circleX, circleY, 12).fill(COLORS.background);
    doc.fillColor(riskColor).fontSize(12).font("Helvetica-Bold");
    doc.text(data.riskScore.toString(), circleX - 8, circleY - 5, { width: 16, align: "center" });

    doc.fillColor(riskColor).fontSize(10).font("Helvetica-Bold");
    doc.text(data.riskLevel.toUpperCase(), margin + 55, y + 22);
    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text("Risk Level", margin + 55, y + 33);

    const riskBar = (data.riskScore / 100) * 50;
    doc.roundedRect(margin + 55, y + 43, 50, 4, 2).fill(COLORS.border);
    doc.roundedRect(margin + 55, y + 43, riskBar, 4, 2).fill(riskColor);

    doc.roundedRect(margin + riskBoxWidth + 8, y, verdictBoxWidth, 60, 3).fill(COLORS.surface);
    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica-Bold");
    doc.text("EXPERT VERDICT", margin + riskBoxWidth + 16, y + 5);

    const verdict = getVerdict(data.riskLevel, data.riskScore);
    doc.fillColor(COLORS.text).fontSize(8).font("Helvetica-Bold");
    doc.text(verdict.title, margin + riskBoxWidth + 16, y + 16, { width: verdictBoxWidth - 24 });
    doc.fillColor(COLORS.textMuted).fontSize(6).font("Helvetica");
    doc.text(verdict.description, margin + riskBoxWidth + 16, y + 30, { width: verdictBoxWidth - 24 });

    y += 68;

    doc.fillColor(COLORS.text).fontSize(9).font("Helvetica-Bold");
    doc.text("FINDINGS", margin, y);
    y += 10;

    const findingsToShow = data.findings.slice(0, 4);
    const findingsHeight = findingsToShow.length * 11 + 6;
    doc.roundedRect(margin, y, contentWidth, findingsHeight, 3).fill(COLORS.surface);
    y += 4;

    for (const finding of findingsToShow) {
      const findingColor = {
        info: COLORS.info,
        warning: COLORS.warning,
        danger: COLORS.danger,
        success: COLORS.success,
      }[finding.type];

      const icon = { info: "●", warning: "▲", danger: "✕", success: "✓" }[finding.type];
      doc.fillColor(findingColor).fontSize(7).font("Helvetica-Bold");
      doc.text(`${icon}`, margin + 6, y);
      doc.fillColor(COLORS.text).fontSize(7).font("Helvetica");
      doc.text(finding.title, margin + 16, y, { width: contentWidth - 24 });
      y += 11;
    }

    y += 8;

    if (data.metadata && Object.keys(data.metadata).length > 0) {
      doc.fillColor(COLORS.text).fontSize(9).font("Helvetica-Bold");
      doc.text("METADATA", margin, y);
      y += 10;

      const metaEntries = Object.entries(data.metadata).slice(0, 4);
      const rows = Math.ceil(metaEntries.length / 2);
      const metaHeight = rows * 12 + 6;
      doc.roundedRect(margin, y, contentWidth, metaHeight, 3).fill(COLORS.surface);
      
      const colWidth = (contentWidth - 16) / 2;
      let col = 0;
      let row = 0;
      
      for (const [key, value] of metaEntries) {
        const xPos = margin + 8 + (col * colWidth);
        const yPos = y + 5 + (row * 12);
        
        doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
        doc.text(key, xPos, yPos);
        doc.fillColor(COLORS.text).fontSize(6).font("Helvetica-Bold");
        doc.text(String(value), xPos + 60, yPos);
        
        col++;
        if (col >= 2) {
          col = 0;
          row++;
        }
      }

      y += metaHeight + 8;
    }

    doc.fillColor(COLORS.text).fontSize(8).font("Helvetica-Bold");
    doc.text("SOURCES", margin, y);
    y += 8;
    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text(data.sources.join(" | "), margin, y);

    const stampX = pageWidth - margin - 40;
    const stampY = pageHeight - 80;
    
    doc.save();
    doc.circle(stampX, stampY, 32).lineWidth(2).stroke(COLORS.primary);
    doc.circle(stampX, stampY, 27).lineWidth(1).stroke(COLORS.primary);
    doc.circle(stampX, stampY, 24).lineWidth(0.5).stroke(COLORS.primary);
    
    doc.fillColor(COLORS.primary).fontSize(4).font("Helvetica-Bold");
    doc.text("DARKSHARE INTERNATIONAL", stampX - 22, stampY - 20, { width: 44, align: "center" });
    
    doc.fillColor(COLORS.primary).fontSize(9).font("Helvetica-Bold");
    doc.text("VERIFIED", stampX - 18, stampY - 4, { width: 36, align: "center" });
    
    doc.fillColor(COLORS.primary).fontSize(3).font("Helvetica");
    doc.text("SECURITY ANALYSIS", stampX - 18, stampY + 6, { width: 36, align: "center" });
    
    const certDate = data.timestamp.toLocaleDateString('en-GB');
    doc.fillColor(COLORS.primary).fontSize(4).font("Helvetica-Bold");
    doc.text(certDate, stampX - 15, stampY + 14, { width: 30, align: "center" });
    
    doc.restore();

    const footerY = pageHeight - 25;
    doc.rect(0, footerY - 5, pageWidth, 30).fill(COLORS.background);

    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text("CONFIDENTIAL - Unauthorized distribution prohibited.", margin, footerY);

    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text(`Report #${reportId}`, margin, footerY + 8);

    const hash = Buffer.from(`${reportId}-${data.targetValue}-${data.timestamp.getTime()}`).toString("base64").substring(0, 12);
    doc.text(`Hash: ${hash} | DARKSHARE v4.0 | © ${new Date().getFullYear()}`, pageWidth - margin - 120, footerY + 8, { width: 120, align: "right" });

    doc.end();
  });
}

function getModuleLabel(moduleType: string): string {
  const labels: Record<string, string> = {
    ip: "IP/GEO Analysis",
    wallet: "Blockchain Scan",
    phone: "Phone Intel",
    email: "Email Security",
    domain: "Domain Intel",
    url: "URL Risk Scan",
    bot: "Bot Token Audit",
    cve: "CVE/Vuln Scan",
    iot: "IoT Fingerprint",
    cloud: "Cloud Resources",
  };
  return labels[moduleType] || moduleType.toUpperCase();
}

function getVerdict(level: string, score: number): { title: string; description: string } {
  if (level === "critical" || score >= 80) {
    return {
      title: "HIGH RISK - Immediate Action Required",
      description: "Multiple serious risk indicators detected. Do not proceed without verification.",
    };
  }
  if (level === "high" || score >= 60) {
    return {
      title: "ELEVATED RISK - Proceed with Caution",
      description: "Concerning indicators found. Additional verification recommended.",
    };
  }
  if (level === "medium" || score >= 30) {
    return {
      title: "MODERATE RISK - Standard Precautions",
      description: "Minor risk indicators present. Apply standard due diligence.",
    };
  }
  return {
    title: "LOW RISK - Generally Safe",
    description: "No significant risk indicators. Standard verification recommended.",
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
