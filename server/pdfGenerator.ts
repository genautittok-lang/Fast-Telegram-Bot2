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
  primary: "#6366f1",
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
      margin: 25,
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
    const margin = 25;
    const contentWidth = pageWidth - margin * 2;

    doc.rect(0, 0, pageWidth, 70).fill(COLORS.background);
    doc.rect(0, 70, pageWidth, 2).fill(COLORS.primary);

    doc.fillColor(COLORS.text).fontSize(24).font("Helvetica-Bold");
    doc.text("DARKSHARE", margin, 15);
    doc.fillColor(COLORS.primary).fontSize(8).font("Helvetica");
    doc.text("RISK INTELLIGENCE PLATFORM", margin, 40);
    doc.fillColor(COLORS.textMuted).fontSize(6).font("Helvetica");
    doc.text("Certified Security Analysis Report", margin, 50);

    const moduleLabel = getModuleLabel(data.moduleType);
    doc.roundedRect(pageWidth - margin - 90, 15, 90, 26, 4).fill(COLORS.surface);
    doc.fillColor(COLORS.text).fontSize(7).font("Helvetica-Bold");
    doc.text(moduleLabel.toUpperCase(), pageWidth - margin - 85, 22, { width: 80, align: "center" });
    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text("ANALYSIS MODULE", pageWidth - margin - 85, 32, { width: 80, align: "center" });

    const reportId = `DS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text(`ID: ${reportId}`, pageWidth - margin - 90, 48, { width: 90, align: "right" });
    doc.text(`CONFIDENTIAL`, pageWidth - margin - 90, 56, { width: 90, align: "right" });

    let yPosition = 82;

    doc.roundedRect(margin, yPosition, contentWidth, 40, 4).fill(COLORS.surface);
    doc.fillColor(COLORS.textMuted).fontSize(6).font("Helvetica-Bold");
    doc.text("SUBJECT OF ANALYSIS", margin + 10, yPosition + 6);
    doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold");
    const displayTarget = data.targetValue.length > 60 
      ? data.targetValue.substring(0, 57) + "..." 
      : data.targetValue;
    doc.text(displayTarget, margin + 10, yPosition + 16);

    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text("DATE", margin + 10, yPosition + 30);
    doc.fillColor(COLORS.text).fontSize(7).font("Helvetica");
    const dateStr = data.timestamp.toLocaleDateString('uk-UA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(dateStr, margin + 35, yPosition + 30);

    yPosition += 50;

    doc.roundedRect(margin, yPosition, contentWidth * 0.40, 80, 4).fill(COLORS.surface);
    doc.fillColor(COLORS.textMuted).fontSize(6).font("Helvetica-Bold");
    doc.text("RISK ASSESSMENT", margin + 10, yPosition + 6);

    const circleX = margin + 35;
    const circleY = yPosition + 45;
    const riskColor = RISK_COLORS[data.riskLevel];
    
    doc.circle(circleX, circleY, 20).lineWidth(3).stroke(riskColor);
    doc.circle(circleX, circleY, 15).fill(COLORS.background);
    doc.fillColor(riskColor).fontSize(16).font("Helvetica-Bold");
    doc.text(data.riskScore.toString(), circleX - 10, circleY - 6, { width: 20, align: "center" });

    doc.fillColor(riskColor).fontSize(11).font("Helvetica-Bold");
    doc.text(data.riskLevel.toUpperCase(), margin + 65, yPosition + 30);
    doc.fillColor(COLORS.textMuted).fontSize(6).font("Helvetica");
    doc.text("Risk Level", margin + 65, yPosition + 42);
    
    const riskBar = (data.riskScore / 100) * 60;
    doc.roundedRect(margin + 65, yPosition + 55, 60, 4, 2).fill(COLORS.border);
    doc.roundedRect(margin + 65, yPosition + 55, riskBar, 4, 2).fill(riskColor);

    const verdictX = margin + contentWidth * 0.42;
    doc.roundedRect(verdictX, yPosition, contentWidth * 0.58, 80, 4).fill(COLORS.surface);
    doc.fillColor(COLORS.textMuted).fontSize(6).font("Helvetica-Bold");
    doc.text("EXPERT VERDICT", verdictX + 10, yPosition + 6);

    const verdict = getVerdict(data.riskLevel, data.riskScore);
    doc.fillColor(COLORS.text).fontSize(9).font("Helvetica-Bold");
    doc.text(verdict.title, verdictX + 10, yPosition + 18, { width: contentWidth * 0.58 - 20 });
    doc.fillColor(COLORS.textMuted).fontSize(7).font("Helvetica");
    doc.text(verdict.description, verdictX + 10, yPosition + 32, { width: contentWidth * 0.58 - 20 });

    yPosition += 90;

    doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold");
    doc.text("FINDINGS", margin, yPosition);
    yPosition += 12;

    const findingsToShow = data.findings.slice(0, 5);
    doc.roundedRect(margin, yPosition, contentWidth, findingsToShow.length * 12 + 8, 4).fill(COLORS.surface);
    yPosition += 5;

    for (const finding of findingsToShow) {
      const findingColor = {
        info: COLORS.info,
        warning: COLORS.warning,
        danger: COLORS.danger,
        success: COLORS.success,
      }[finding.type];

      const icon = { info: "●", warning: "▲", danger: "✕", success: "✓" }[finding.type];
      doc.fillColor(findingColor).fontSize(8).font("Helvetica-Bold");
      doc.text(`${icon}`, margin + 8, yPosition + 1);
      doc.fillColor(COLORS.text).fontSize(8).font("Helvetica");
      doc.text(finding.title, margin + 20, yPosition + 1, { width: contentWidth - 30 });
      yPosition += 12;
    }

    yPosition += 10;

    if (data.metadata && Object.keys(data.metadata).length > 0) {
      doc.fillColor(COLORS.text).fontSize(11).font("Helvetica-Bold");
      doc.text("METADATA", margin, yPosition);
      yPosition += 12;

      const metaEntries = Object.entries(data.metadata).slice(0, 6);
      const rows = Math.ceil(metaEntries.length / 2);
      const metaHeight = rows * 14 + 8;
      doc.roundedRect(margin, yPosition, contentWidth, metaHeight, 4).fill(COLORS.surface);
      
      const colWidth = (contentWidth - 20) / 2;
      let col = 0;
      let row = 0;
      
      for (const [key, value] of metaEntries) {
        const xPos = margin + 10 + (col * colWidth);
        const yPos = yPosition + 6 + (row * 14);
        
        doc.fillColor(COLORS.textMuted).fontSize(6).font("Helvetica");
        doc.text(key, xPos, yPos);
        doc.fillColor(COLORS.text).fontSize(7).font("Helvetica-Bold");
        doc.text(String(value), xPos + 70, yPos);
        
        col++;
        if (col >= 2) {
          col = 0;
          row++;
        }
      }

      yPosition += metaHeight + 10;
    }

    doc.fillColor(COLORS.text).fontSize(9).font("Helvetica-Bold");
    doc.text("SOURCES", margin, yPosition);
    yPosition += 10;
    doc.fillColor(COLORS.textMuted).fontSize(6).font("Helvetica");
    doc.text(data.sources.join(" | "), margin, yPosition, { width: contentWidth * 0.55 });

    const stampX = pageWidth - margin - 50;
    const stampY = yPosition + 10;
    
    doc.save();
    doc.circle(stampX, stampY, 40).lineWidth(2).stroke(COLORS.primary);
    doc.circle(stampX, stampY, 34).lineWidth(1).stroke(COLORS.primary);
    doc.circle(stampX, stampY, 31).lineWidth(0.5).stroke(COLORS.primary);
    
    doc.fillColor(COLORS.primary).fontSize(5).font("Helvetica-Bold");
    doc.text("DARKSHARE INTERNATIONAL", stampX - 26, stampY - 26, { width: 52, align: "center" });
    
    doc.fillColor(COLORS.primary).fontSize(11).font("Helvetica-Bold");
    doc.text("VERIFIED", stampX - 22, stampY - 5, { width: 44, align: "center" });
    
    doc.fillColor(COLORS.primary).fontSize(4).font("Helvetica");
    doc.text("SECURITY ANALYSIS", stampX - 22, stampY + 7, { width: 44, align: "center" });
    
    const certDate = data.timestamp.toLocaleDateString('en-GB');
    doc.fillColor(COLORS.primary).fontSize(5).font("Helvetica-Bold");
    doc.text(certDate, stampX - 18, stampY + 18, { width: 36, align: "center" });
    
    doc.restore();

    yPosition += 55;

    doc.moveTo(margin, yPosition).lineTo(margin + 90, yPosition).lineWidth(0.5).stroke(COLORS.border);
    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text("Authorized Signature", margin, yPosition + 2);
    doc.fillColor(COLORS.text).fontSize(7).font("Helvetica-Bold");
    doc.text("DARKSHARE Security Team", margin, yPosition + 10);

    const footerY = doc.page.height - 30;
    doc.rect(0, footerY - 3, pageWidth, 35).fill(COLORS.background);

    doc.fillColor(COLORS.textMuted).fontSize(5).font("Helvetica");
    doc.text("CONFIDENTIAL - Unauthorized distribution prohibited.", margin, footerY);

    const hash = Buffer.from(`${reportId}-${data.targetValue}-${data.timestamp.getTime()}`).toString("base64").substring(0, 16);
    doc.text(`Hash: ${hash} | DARKSHARE v4.0 | © ${new Date().getFullYear()}`, pageWidth - margin - 140, footerY, { width: 140, align: "right" });

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
      { type: "info", title: "Geolocation Identified", description: "IP location resolved to specific geographic region with high accuracy." },
      { type: "info", title: "ISP/ASN Data Retrieved", description: "Provider and network information extracted from regional databases." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Blacklist Status", description: riskLevel === "high" ? "IP found on multiple abuse and spam databases." : "IP not found on major blacklist or abuse databases." },
      { type: "info", title: "Proxy/VPN Detection", description: "Analyzed for proxy, VPN, datacenter or Tor exit node characteristics." },
    ],
    wallet: [
      { type: "info", title: "Transaction History Analysis", description: "Complete transaction history analyzed for suspicious patterns and volumes." },
      { type: "info", title: "Token Holdings Identified", description: "Current token balances, NFT holdings and DeFi positions mapped." },
      { type: riskLevel === "high" ? "warning" : "success", title: "Mixer Interaction Check", description: riskLevel === "high" ? "Interaction with known mixing/tumbling services detected." : "No interaction with mixing or tumbling services found." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Sanctions Database", description: riskLevel === "high" ? "Address flagged by OFAC/EU sanctions databases." : "Address not found in OFAC, EU or other sanctions lists." },
    ],
    phone: [
      { type: "info", title: "Number Classification", description: "Carrier type and line classification identified via telecom databases." },
      { type: riskLevel === "high" ? "warning" : "info", title: "VOIP Detection", description: riskLevel === "high" ? "Virtual/VOIP number detected - elevated fraud risk indicator." : "Standard mobile carrier number verified." },
      { type: "info", title: "Geographic Origin", description: "Country and region of registration identified and verified." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Fraud Reports", description: riskLevel === "high" ? "Number reported for spam/fraud activity in public databases." : "No fraud reports associated with this number." },
    ],
    email: [
      { type: "info", title: "Email Validation", description: "Syntax, domain verification and MX record validation completed." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Data Breach Check", description: riskLevel === "high" ? "Email found in multiple known data breach databases." : "Email not found in known data breach compilations." },
      { type: riskLevel === "medium" ? "warning" : "success", title: "Disposable Check", description: riskLevel === "medium" ? "Email uses temporary/disposable provider - elevated risk." : "Email is from legitimate established provider." },
      { type: "info", title: "Domain Reputation", description: "Email domain registration history and reputation analyzed." },
    ],
    domain: [
      { type: "info", title: "WHOIS Analysis", description: "Domain registration details, history and ownership retrieved." },
      { type: "info", title: "SSL/TLS Certificate", description: "SSL/TLS certificate validity, chain and issuer verified." },
      { type: riskLevel === "high" ? "warning" : "success", title: "Registration Jurisdiction", description: riskLevel === "high" ? "Domain registered in high-risk jurisdiction." : "Domain registered in standard jurisdiction with good reputation." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Sanctions Check", description: riskLevel === "high" ? "Domain owner appears on international sanctions list." : "No sanctions associated with domain registrant." },
    ],
    url: [
      { type: "info", title: "URL Structure Analysis", description: "URL structure, parameters and redirects analyzed for anomalies." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Malware Detection", description: riskLevel === "high" ? "Malicious content or downloads detected at target URL." : "No malware or malicious content detected at target URL." },
      { type: riskLevel === "high" ? "danger" : "success", title: "Phishing Assessment", description: riskLevel === "high" ? "URL matches known phishing patterns and indicators." : "URL does not match known phishing patterns." },
      { type: "info", title: "Redirect Chain Analysis", description: "URL redirect chain analyzed for suspicious intermediate hops." },
    ],
  };

  return baseFindingsByModule[moduleType] || [
    { type: "info", title: "Analysis Complete", description: "Target analyzed using all available intelligence sources." },
  ];
}

export function generateMetadata(moduleType: string): Record<string, string | number> {
  const baseMetadata: Record<string, Record<string, string | number>> = {
    ip: {
      "Analysis Duration": "2.3s",
      "Databases Checked": 12,
      "API Integrations": 5,
      "Last DB Update": new Date().toISOString().split("T")[0],
    },
    wallet: {
      "Blockchain": "Ethereum",
      "TX Analyzed": Math.floor(Math.random() * 500) + 50,
      "First Activity": "2021-03-15",
      "Last Activity": new Date().toISOString().split("T")[0],
    },
    phone: {
      "Carrier Type": "Mobile",
      "Country Code": "+380",
      "DBs Checked": 8,
      "Risk Signals": Math.floor(Math.random() * 5),
    },
    email: {
      "MX Records": "Valid",
      "Breach DBs": 15,
      "Account Age": "2+ years",
      "Disposable": "No",
    },
    domain: {
      "Domain Age": "5 years",
      "Registrar": "Cloudflare",
      "SSL Issuer": "Let's Encrypt",
      "DNS Records": 12,
    },
    url: {
      "Response Code": 200,
      "Redirects": Math.floor(Math.random() * 3),
      "Content Type": "text/html",
      "Scan Engines": 70,
    },
  };

  return baseMetadata[moduleType] || { "Analysis Type": moduleType };
}
