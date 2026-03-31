import { generateAIAnalysis } from "./aiAnalyzer";
import exifr from "exifr";

export interface AIInsights {
  summary: string;
  recommendations: string[];
  threatLevel: string;
  verdict: string;
}

export interface CheckResult {
  type: string;
  target: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  details: Record<string, any>;
  findings: string[];
  sources: string[];
  timestamp: Date;
  aiInsights?: AIInsights;
}

async function fetchWithTimeout(url: string, timeout = 5000, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export function validateInput(type: string, value: string): { valid: boolean; error?: string } {
  const cleanValue = value.trim();
  
  switch (type) {
    case "ip":
      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanValue)) {
        return { valid: false, error: "Невірний формат IP. Приклад: 8.8.8.8" };
      }
      const octets = cleanValue.split('.').map(Number);
      if (octets.some(o => o < 0 || o > 255)) {
        return { valid: false, error: "IP октет не може бути більше 255. Кожна частина має бути від 0 до 255." };
      }
      if (octets[0] === 0) {
        return { valid: false, error: "Перший октет IP не може бути 0" };
      }
      if (octets.every(o => o === 0)) {
        return { valid: false, error: "Невалідна IP адреса" };
      }
      break;
    case "wallet":
      const isEth = cleanValue.startsWith("0x") && cleanValue.length >= 40;
      const isBtcLegacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(cleanValue);
      const isBtcBech32 = cleanValue.startsWith("bc1") && cleanValue.length >= 40;
      const isTron = cleanValue.startsWith("T") && cleanValue.length === 34;
      const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanValue);
      const isExchangeUID = /^\d{6,12}$/.test(cleanValue);
      const isLitecoin = /^[LM][a-km-zA-HJ-NP-Z1-9]{25,33}$/.test(cleanValue) || (cleanValue.startsWith("ltc1") && cleanValue.length >= 40);
      const isRipple = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(cleanValue);
      const isDogecoin = /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{24,32}$/.test(cleanValue);
      
      if (!isEth && !isBtcLegacy && !isBtcBech32 && !isTron && !isSolana && !isExchangeUID && !isLitecoin && !isRipple && !isDogecoin) {
        return { valid: false, error: "Невірний формат. Підтримуються: ETH, BTC, TRX, SOL, LTC, XRP, DOGE" };
      }
      break;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
        return { valid: false, error: "Невірний email. Приклад: user@example.com" };
      }
      break;
    case "domain":
      const domainOnly = cleanValue.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(domainOnly) && domainOnly.length < 4) {
        return { valid: false, error: "Невірний домен. Приклад: example.com" };
      }
      break;
    case "url":
      if (!cleanValue.match(/^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)+/)) {
        return { valid: false, error: "URL має починатися з http:// або https:// та містити валідний домен" };
      }
      break;
    case "phone":
      const phoneClean = cleanValue.replace(/[\s\-\(\)]/g, '');
      if (!/^[\+]?[0-9]{6,15}$/.test(phoneClean)) {
        return { valid: false, error: "Невірний номер. Приклад: +380501234567" };
      }
      break;
    case "bot":
      if (!/^\d{8,12}:[A-Za-z0-9_-]{35}$/.test(cleanValue)) {
        return { valid: false, error: "Невірний формат токену. Приклад: 123456789:ABCdef..." };
      }
      break;
    case "cve":
      if (!/^CVE-\d{4}-\d{4,}$/i.test(cleanValue) && !/^[a-zA-Z0-9\s\-\.]+$/.test(cleanValue)) {
        return { valid: false, error: "Невірний формат. Приклад: CVE-2024-1234 або назва продукту" };
      }
      break;
    case "hash":
      if (!/^[a-fA-F0-9]{32}$/.test(cleanValue) && !/^[a-fA-F0-9]{40}$/.test(cleanValue) && !/^[a-fA-F0-9]{64}$/.test(cleanValue)) {
        return { valid: false, error: "Невірний хеш. Підтримуються: MD5 (32), SHA1 (40), SHA256 (64)" };
      }
      break;
    case "username":
      if (!/^[a-zA-Z0-9_\.]{3,30}$/.test(cleanValue)) {
        return { valid: false, error: "Невірний username. 3-30 символів, букви/цифри/_/." };
      }
      break;
    case "card":
      const cardDigits = cleanValue.replace(/[\s\-]/g, '');
      if (!/^\d{6,19}$/.test(cardDigits)) {
        return { valid: false, error: "Введіть номер картки (6-19 цифр) або BIN" };
      }
      break;
    case "password":
      if (cleanValue.length < 1) {
        return { valid: false, error: "Введіть пароль для перевірки" };
      }
      break;
    case "dns":
      const dnsDomain = cleanValue.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(dnsDomain) && dnsDomain.length < 4) {
        return { valid: false, error: "Невірний домен. Приклад: example.com" };
      }
      break;
    case "ssl":
      const sslDomain = cleanValue.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(sslDomain) && sslDomain.length < 4) {
        return { valid: false, error: "Невірний домен. Приклад: example.com" };
      }
      break;
    case "mac":
      const macClean = cleanValue.replace(/[\s\-:\.]/g, '');
      if (!/^[0-9a-fA-F]{6,12}$/.test(macClean)) {
        return { valid: false, error: "Невірний MAC. Приклад: AA:BB:CC:DD:EE:FF" };
      }
      break;
  }
  return { valid: true };
}

export async function performCheck(type: string, value: string): Promise<CheckResult> {
  const timestamp = new Date();
  
  let result: CheckResult;
  
  switch (type) {
    case "ip":
      result = await checkIP(value, timestamp);
      break;
    case "wallet":
      result = await checkWallet(value, timestamp);
      break;
    case "phone":
      result = await checkPhone(value, timestamp);
      break;
    case "email":
      result = await checkEmail(value, timestamp);
      break;
    case "domain":
      result = await checkDomain(value, timestamp);
      break;
    case "url":
      result = await checkURL(value, timestamp);
      break;
    case "bot":
      result = await checkBot(value, timestamp);
      break;
    case "cve":
      result = await checkCVE(value, timestamp);
      break;
    case "hash":
      result = await checkHash(value, timestamp);
      break;
    case "username":
      result = await checkUsername(value, timestamp);
      break;
    case "card":
      result = await checkCard(value, timestamp);
      break;
    case "password":
      result = await checkPassword(value, timestamp);
      break;
    case "dns":
      result = await checkDNS(value, timestamp);
      break;
    case "ssl":
      result = await checkSSL(value, timestamp);
      break;
    case "mac":
      result = await checkMAC(value, timestamp);
      break;
    default:
      throw new Error(`Unknown check type: ${type}`);
  }
  
  // Add AI analysis
  try {
    const aiInsights = await generateAIAnalysis({
      type: result.type,
      target: result.target,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      findings: result.findings,
      details: result.details,
    });
    result.aiInsights = aiInsights;
  } catch (error) {
    console.error("AI analysis failed:", error);
  }
  
  return result;
}

function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

// ==================== IP CHECK ====================
async function checkIP(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = [];
  let ipData: any = {};
  
  // API 1: ip-api.com (free, 45 req/min)
  try {
    const response = await fetchWithTimeout(
      `http://ip-api.com/json/${value}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,mobile,query`,
      5000
    );
    const data = await response.json();
    sources.push("ip-api.com");
    
    if (data.status === "success") {
      ipData = { ...data };
      
      if (data.proxy) {
        riskScore += 35;
        findings.push("🔴 VPN/Proxy виявлено");
      }
      if (data.hosting) {
        riskScore += 25;
        findings.push("🟠 Datacenter/хостинг IP");
      }
      if (data.mobile) {
        findings.push("📱 Мобільний оператор");
      }
      
      const highRiskCountries = ["RU", "CN", "KP", "IR", "NG", "VN", "BY"];
      if (highRiskCountries.includes(data.countryCode)) {
        riskScore += 15;
        findings.push(`⚠️ Країна підвищеного ризику (${data.country})`);
      }
      
      const cloudProviders = ["digital ocean", "amazon", "google cloud", "azure", "vultr", "linode", "ovh", "hetzner", "contabo", "scaleway"];
      if (cloudProviders.some(p => data.isp?.toLowerCase().includes(p) || data.org?.toLowerCase().includes(p))) {
        riskScore += 20;
        findings.push("☁️ Cloud-провайдер (ботнет-ризик)");
      }
      
      if (data.org?.toLowerCase().includes("tor") || data.isp?.toLowerCase().includes("tor")) {
        riskScore += 50;
        findings.push("🔴 TOR exit node");
        ipData.isTor = true;
      }
    }
  } catch (error) {
    findings.push("⚠️ ip-api.com недоступний");
  }
  
  // API 2: ipinfo.io (free tier)
  try {
    const response = await fetchWithTimeout(`https://ipinfo.io/${value}/json`, 4000);
    const data = await response.json();
    sources.push("ipinfo.io");
    
    if (data && !data.error) {
      ipData.hostname = data.hostname || null;
      ipData.asn = data.org || ipData.as;
      
      if (data.hostname?.match(/(bot|crawler|spider|scan)/i)) {
        riskScore += 20;
        findings.push("🤖 Hostname вказує на бота");
      }
      
      if (data.bogon) {
        riskScore += 40;
        findings.push("🔴 Bogon IP (зарезервована адреса)");
      }
    }
  } catch {}
  
  // API 3: Shodan InternetDB (free, no key)
  try {
    const response = await fetchWithTimeout(`https://internetdb.shodan.io/${value}`, 4000);
    if (response.ok) {
      const data = await response.json();
      sources.push("shodan.io");
      
      if (data.ports && data.ports.length > 0) {
        ipData.openPorts = data.ports;
        findings.push(`🔓 Відкриті порти: ${data.ports.slice(0, 10).join(", ")}${data.ports.length > 10 ? "..." : ""}`);
        
        const riskyPorts = [22, 23, 3389, 5900, 6379, 27017, 9200];
        const foundRisky = data.ports.filter((p: number) => riskyPorts.includes(p));
        if (foundRisky.length > 0) {
          riskScore += 15;
          findings.push(`⚠️ Ризикові порти: ${foundRisky.join(", ")}`);
        }
      }
      
      if (data.vulns && data.vulns.length > 0) {
        riskScore += 30;
        ipData.vulnerabilities = data.vulns;
        findings.push(`🔴 Знайдено вразливості: ${data.vulns.slice(0, 5).join(", ")}`);
      }
      
      if (data.hostnames && data.hostnames.length > 0) {
        ipData.hostnames = data.hostnames;
        findings.push(`🌐 Hostnames: ${data.hostnames.slice(0, 3).join(", ")}`);
      }
      
      if (data.tags && data.tags.length > 0) {
        ipData.tags = data.tags;
        if (data.tags.includes("vpn")) {
          riskScore += 20;
          findings.push("🔴 VPN сервіс (Shodan)");
        }
        if (data.tags.includes("proxy")) {
          riskScore += 20;
          findings.push("🔴 Proxy сервіс (Shodan)");
        }
      }
    }
  } catch {}
  
  // API 4: DNS Blacklist check (parallel)
  try {
    const reversedIP = value.split('.').reverse().join('.');
    const dnsblServers = ["zen.spamhaus.org", "bl.spamcop.net", "dnsbl.sorbs.net"];
    
    const dnsblResults = await Promise.allSettled(
      dnsblServers.map(async (dnsbl) => {
        const response = await fetchWithTimeout(`https://dns.google/resolve?name=${reversedIP}.${dnsbl}&type=A`, 2000);
        const dnsData = await response.json();
        return { dnsbl, listed: !!(dnsData.Answer && dnsData.Answer.length > 0) };
      })
    );
    let blacklisted = false;
    for (const r of dnsblResults) {
      if (r.status === "fulfilled" && r.value.listed && !blacklisted) {
        riskScore += 35;
        findings.push(`🔴 В чорному списку: ${r.value.dnsbl}`);
        sources.push(r.value.dnsbl);
        blacklisted = true;
      }
    }
  } catch {}
  
  // API 5: GreyNoise (free community API)
  try {
    const response = await fetchWithTimeout(`https://api.greynoise.io/v3/community/${value}`, 4000, {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      sources.push("greynoise.io");
      
      if (data.noise) {
        riskScore += 25;
        findings.push("🔴 Виявлено фоновий шум (сканування)");
        ipData.greynoiseClassification = data.classification;
      }
      if (data.riot) {
        findings.push("✅ Відомий легітимний сервіс");
        riskScore -= 10;
      }
      if (data.classification === "malicious") {
        riskScore += 40;
        findings.push("🔴 Класифіковано як MALICIOUS");
      }
    }
  } catch {}

  // API 6: ipwhois.app (free, no key, extra geo + ASN details)
  try {
    const response = await fetchWithTimeout(`https://ipwhois.app/json/${value}`, 3000);
    if (response.ok) {
      const data = await response.json();
      if (data.success !== false) {
        sources.push("ipwhois.app");
        if (!ipData.country && data.country) ipData.country = data.country;
        if (!ipData.city && data.city) ipData.city = data.city;
        if (data.connection) {
          if (data.connection.asn && !ipData.asn) ipData.asn = `AS${data.connection.asn}`;
          if (data.connection.isp && !ipData.isp) ipData.isp = data.connection.isp;
          if (data.connection.domain) ipData.ispDomain = data.connection.domain;
        }
        if (data.security) {
          if (data.security.tor && !ipData.isTor) {
            riskScore += 50;
            findings.push("🔴 TOR мережа виявлено (ipwhois)");
            ipData.isTor = true;
          }
          if (data.security.proxy && !ipData.proxy) {
            riskScore += 20;
            findings.push("⚠️ Проксі виявлено (ipwhois)");
          }
        }
        if (data.currency) {
          ipData.currency = data.currency.code;
        }
        if (data.timezone?.utc) {
          ipData.utcOffset = data.timezone.utc;
        }
      }
    }
  } catch {}

  // API 7: AbuseIPDB (requires API key, optional enrichment)
  try {
    const abuseipdbKey = process.env.ABUSEIPDB_API_KEY;
    if (!abuseipdbKey) throw new Error("skip");
    const response = await fetchWithTimeout(`https://api.abuseipdb.com/api/v2/check?ipAddress=${value}&maxAgeInDays=90`, 4000, {
      headers: { 'Key': abuseipdbKey, 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        sources.push("abuseipdb.com");
        ipData.abuseConfidenceScore = data.data.abuseConfidenceScore;
        ipData.totalReportsAbuse = data.data.totalReports;
        if (data.data.abuseConfidenceScore > 50) {
          riskScore += 35;
          findings.push(`🔴 AbuseIPDB: ${data.data.abuseConfidenceScore}% abuse confidence (${data.data.totalReports} скарг)`);
        } else if (data.data.abuseConfidenceScore > 20) {
          riskScore += 15;
          findings.push(`⚠️ AbuseIPDB: ${data.data.abuseConfidenceScore}% abuse confidence`);
        } else if (data.data.totalReports > 0) {
          findings.push(`ℹ️ AbuseIPDB: ${data.data.totalReports} скарг за 90 днів`);
        }
      }
    }
  } catch {}
  
  if (sources.length <= 1) {
    findings.push("⚠️ Низька достовірність: більшість джерел недоступні");
  } else if (findings.length === 0) {
    findings.push("✅ Чистий IP без підозрілих ознак");
  }
  
  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "ip",
    target: value,
    riskScore,
    riskLevel,
    summary: `IP ${value} — ${riskLevel.toUpperCase()} ризик (${riskScore}/100)`,
    details: {
      country: ipData.country || "Unknown",
      countryCode: ipData.countryCode || "??",
      city: ipData.city || "Unknown",
      region: ipData.regionName || ipData.region || "Unknown",
      isp: ipData.isp || "Unknown",
      organization: ipData.org || "Unknown",
      asn: ipData.asn || ipData.as || "Unknown",
      timezone: ipData.timezone || "Unknown",
      coordinates: ipData.lat && ipData.lon ? `${ipData.lat}, ${ipData.lon}` : "Unknown",
      hostname: ipData.hostname || null,
      isProxy: ipData.proxy || false,
      isHosting: ipData.hosting || false,
      isMobile: ipData.mobile || false,
      openPorts: ipData.openPorts || [],
      vulnerabilities: ipData.vulnerabilities || [],
      hostnames: ipData.hostnames || [],
    },
    findings,
    sources,
    timestamp,
  };
}

// ==================== WALLET CHECK ====================
async function checkWallet(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  let walletData: any = {};
  
  const address = value.toLowerCase();
  
  // Known dangerous addresses
  const dangerousAddresses: Record<string, string> = {
    "0x722122df12d4e14e13ac3b6895a86e84145b6967": "Tornado Cash (OFAC)",
    "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b": "Tornado Cash Router",
    "0x23773e65ed146a459791799d01336db287f25334": "Tornado Cash Deployer",
    "0x8589427373d6d84e98730d7795d8f6f8731fda16": "Ronin Bridge Exploiter",
    "0x098b716b8aaf21512996dc57eb0615e2383e2f96": "Ronin Bridge Exploiter 2",
    "0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b": "Harmony Bridge Exploiter",
    "0x0ee5067b06776a89ccc7dc6b99b2c82c30c50cb3": "Known Phishing",
    "0x3cfcd56cd36c086bf48d4ac1a7acc5631e36a11e": "Known Drainer",
    "0xba12222222228d8ba445958a75a0704d566bf2c8": "Balancer Vault",
    "0x00000000219ab540356cbb839cbe05303d7705fa": "ETH2 Deposit Contract",
  };
  
  for (const [addr, description] of Object.entries(dangerousAddresses)) {
    if (address === addr.toLowerCase()) {
      riskScore += 90;
      findings.push(`🔴 КРИТИЧНО: ${description}`);
      walletData.sanctioned = true;
      walletData.sanctionReason = description;
    }
  }
  
  // Detect chain type
  let chain = "Unknown";
  if (address.startsWith("0x") && address.length === 42) {
    chain = "Ethereum/EVM";
    findings.push("✅ Валідна EVM адреса");
    walletData.chain = chain;
    
    // Check checksum
    const hasChecksum = /[A-F]/.test(value.slice(2));
    walletData.hasChecksum = hasChecksum;
    if (hasChecksum) {
      findings.push("🔒 Checksum присутній");
    }
  } else if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(value) || value.startsWith("bc1")) {
    chain = "Bitcoin";
    findings.push("₿ Bitcoin адреса");
    walletData.chain = chain;
  } else if (value.startsWith("T") && value.length === 34) {
    chain = "Tron";
    findings.push("⚡ Tron адреса");
    walletData.chain = chain;
  } else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
    chain = "Solana";
    findings.push("☀️ Solana адреса");
    walletData.chain = chain;
  }
  
  // Pattern analysis
  if (address.endsWith("0000") || address.endsWith("dead") || address.endsWith("0001")) {
    riskScore += 15;
    findings.push("⚠️ Можлива burn/null адреса");
    walletData.possibleBurnAddress = true;
  }
  
  // Vanity address check
  const charCounts: Record<string, number> = {};
  for (const char of address.slice(2)) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }
  const maxRepeat = Math.max(...Object.values(charCounts));
  if (maxRepeat > 15) {
    riskScore += 10;
    findings.push("🎯 Vanity адреса");
    walletData.isVanity = true;
  }
  
  // Check contract address pattern
  if (address.startsWith("0x000000")) {
    riskScore += 25;
    findings.push("⚠️ Системна/контрактна адреса");
  }
  
  // API: Etherscan-like for EVM chains (Blockscout is free)
  if (chain === "Ethereum/EVM") {
    try {
      const response = await fetchWithTimeout(`https://eth.blockscout.com/api/v2/addresses/${value}`, 4000);
      if (response.ok) {
        const data = await response.json();
        sources.push("blockscout.com");
        
        if (data.is_contract) {
          riskScore += 10;
          findings.push("📜 Smart contract");
          walletData.isContract = true;
        }
        if (data.is_verified) {
          findings.push("✅ Контракт верифіковано");
          walletData.isVerified = true;
          riskScore -= 10;
        }
        walletData.txCount = data.transactions_count || 0;
        walletData.tokenTransfers = data.token_transfers_count || 0;
        
        if (data.exchange_rate && data.coin_balance) {
          const balanceEth = parseFloat(data.coin_balance) / 1e18;
          walletData.balanceETH = balanceEth.toFixed(4);
          findings.push(`💰 Баланс: ${walletData.balanceETH} ETH`);
        }
      }
    } catch {}
    
    // API: Etherscan (uses key if available, otherwise free public endpoint)
    try {
      const etherscanKey = process.env.ETHERSCAN_API_KEY || '';
      const ethUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${value}&tag=latest&apikey=${etherscanKey}`;
      const response = await fetchWithTimeout(ethUrl, 4000);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "1") {
          sources.push("etherscan.io");
          const balanceWei = BigInt(data.result);
          const balanceEth = Number(balanceWei) / 1e18;
          walletData.balanceETH = balanceEth.toFixed(6);
        }
      }
    } catch {}

    // API: Ethplorer (free, no key needed)
    try {
      const response = await fetchWithTimeout(
        `https://api.ethplorer.io/getAddressInfo/${value}?apiKey=freekey`,
        4000
      );
      if (response.ok) {
        const data = await response.json();
        if (!sources.includes("ethplorer.io")) sources.push("ethplorer.io");
        if (data.ETH) {
          if (!walletData.balanceETH || walletData.balanceETH === "0.000000") {
            walletData.balanceETH = (data.ETH.balance || 0).toFixed(6);
          }
          walletData.ethTxCount = data.ETH.rawBalance ? data.countTxs || 0 : 0;
          if (data.ETH.totalIn !== undefined) {
            walletData.totalInETH = data.ETH.totalIn?.toFixed?.(4) || null;
          }
        }
        if (data.tokens && data.tokens.length > 0) {
          walletData.tokenCount = data.tokens.length;
          walletData.topTokens = data.tokens.slice(0, 5).map((t: any) => ({
            name: t.tokenInfo?.name || "Unknown",
            symbol: t.tokenInfo?.symbol || "?",
            balance: t.balance ? (Number(t.balance) / Math.pow(10, Number(t.tokenInfo?.decimals || 18))).toFixed(4) : "0"
          }));
          findings.push(`🪙 ${data.tokens.length} токенів на гаманці`);
        }
      }
    } catch {}
  }
  
  // API: Blockchain.com for Bitcoin
  if (chain === "Bitcoin") {
    try {
      const response = await fetchWithTimeout(`https://blockchain.info/rawaddr/${value}?limit=5`, 5000);
      if (response.ok) {
        const data = await response.json();
        sources.push("blockchain.com");
        
        walletData.balanceBTC = (data.final_balance / 100000000).toFixed(8);
        walletData.txCount = data.n_tx;
        walletData.totalReceived = (data.total_received / 100000000).toFixed(8);
        walletData.totalSent = (data.total_sent / 100000000).toFixed(8);
        
        findings.push(`₿ Баланс: ${walletData.balanceBTC} BTC`);
        findings.push(`📊 Транзакцій: ${walletData.txCount}`);
        
        if (data.n_tx > 1000) {
          riskScore += 15;
          findings.push("⚠️ Висока активність (можливий мікс-сервіс)");
        }
      }
    } catch {}
  }
  
  // API: Mempool.space (free, no key - Bitcoin address info)
  if (chain === "Bitcoin") {
    try {
      const response = await fetchWithTimeout(`https://mempool.space/api/address/${value}`, 3000);
      if (response.ok) {
        const data = await response.json();
        if (!sources.includes("blockchain.com")) {
          sources.push("mempool.space");
          const funded = data.chain_stats?.funded_txo_sum || 0;
          const spent = data.chain_stats?.spent_txo_sum || 0;
          const balance = (funded - spent) / 100000000;
          walletData.balanceBTC = balance.toFixed(8);
          walletData.txCount = (data.chain_stats?.tx_count || 0) + (data.mempool_stats?.tx_count || 0);
          findings.push(`₿ Баланс: ${walletData.balanceBTC} BTC (mempool.space)`);
          findings.push(`📊 Транзакцій: ${walletData.txCount}`);
        } else {
          sources.push("mempool.space");
        }
        if (data.mempool_stats?.tx_count > 0) {
          findings.push(`⏳ Непідтверджених tx: ${data.mempool_stats.tx_count}`);
        }
      }
    } catch {}
  }

  // API: ThreatFox IOC lookup for wallet addresses
  try {
    const response = await fetchWithTimeout('https://threatfox-api.abuse.ch/api/v1/', 3000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'search_ioc', search_term: value })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.query_status === 'ok' && data.data && data.data.length > 0) {
        sources.push("threatfox.abuse.ch");
        riskScore += 60;
        const threat = data.data[0];
        findings.push(`🔴 ThreatFox: Пов'язано з ${threat.malware_printable || 'malware'}`);
        walletData.threatfoxMalware = threat.malware_printable;
      }
    }
  } catch {}

  if (findings.length <= 1) {
    findings.push("✅ Базова перевірка пройшла");
  }
  
  walletData.addressShort = `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
  
  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "wallet",
    target: value,
    riskScore,
    riskLevel,
    summary: `Гаманець ${walletData.addressShort} — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: walletData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== PHONE CHECK ====================
async function checkPhone(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  const phoneData: any = {};
  
  const cleanNumber = value.replace(/[\s\-\(\)\.]/g, '');
  phoneData.original = value;
  phoneData.cleaned = cleanNumber;
  
  const countryCodes: Record<string, { country: string; flag: string; format: string; mobilePrefix?: string[] }> = {
    "+380": { country: "Україна", flag: "🇺🇦", format: "+380 XX XXX XX XX", mobilePrefix: ["50", "63", "66", "67", "68", "73", "91", "92", "93", "94", "95", "96", "97", "98", "99"] },
    "+7": { country: "Росія/Казахстан", flag: "🇷🇺", format: "+7 XXX XXX XX XX", mobilePrefix: ["9"] },
    "+1": { country: "США/Канада", flag: "🇺🇸", format: "+1 XXX XXX XXXX" },
    "+44": { country: "Великобританія", flag: "🇬🇧", format: "+44 XXXX XXXXXX", mobilePrefix: ["7"] },
    "+49": { country: "Німеччина", flag: "🇩🇪", format: "+49 XXX XXXXXXX", mobilePrefix: ["15", "16", "17"] },
    "+48": { country: "Польща", flag: "🇵🇱", format: "+48 XXX XXX XXX", mobilePrefix: ["5", "6", "7", "8"] },
    "+33": { country: "Франція", flag: "🇫🇷", format: "+33 X XX XX XX XX", mobilePrefix: ["6", "7"] },
    "+39": { country: "Італія", flag: "🇮🇹", format: "+39 XXX XXX XXXX", mobilePrefix: ["3"] },
    "+34": { country: "Іспанія", flag: "🇪🇸", format: "+34 XXX XXX XXX", mobilePrefix: ["6", "7"] },
    "+90": { country: "Туреччина", flag: "🇹🇷", format: "+90 XXX XXX XX XX", mobilePrefix: ["5"] },
    "+86": { country: "Китай", flag: "🇨🇳", format: "+86 XXX XXXX XXXX" },
    "+81": { country: "Японія", flag: "🇯🇵", format: "+81 XX XXXX XXXX" },
    "+82": { country: "Південна Корея", flag: "🇰🇷", format: "+82 XX XXXX XXXX" },
    "+971": { country: "ОАЕ", flag: "🇦🇪", format: "+971 XX XXX XXXX" },
    "+972": { country: "Ізраїль", flag: "🇮🇱", format: "+972 XX XXX XXXX" },
    "+375": { country: "Білорусь", flag: "🇧🇾", format: "+375 XX XXX XX XX" },
    "+373": { country: "Молдова", flag: "🇲🇩", format: "+373 XX XXX XXX" },
    "+371": { country: "Латвія", flag: "🇱🇻", format: "+371 XX XXX XXX" },
    "+370": { country: "Литва", flag: "🇱🇹", format: "+370 XXX XXXXX" },
    "+372": { country: "Естонія", flag: "🇪🇪", format: "+372 XXXX XXXX" },
  };
  
  let detectedCountry = null;
  for (const [code, info] of Object.entries(countryCodes).sort((a, b) => b[0].length - a[0].length)) {
    if (cleanNumber.startsWith(code)) {
      detectedCountry = { code, ...info };
      phoneData.country = info.country;
      phoneData.countryFlag = info.flag;
      phoneData.countryCode = code;
      phoneData.expectedFormat = info.format;
      
      if (info.mobilePrefix) {
        const afterCode = cleanNumber.slice(code.length);
        const isMobile = info.mobilePrefix.some(p => afterCode.startsWith(p));
        phoneData.type = isMobile ? "Мобільний" : "Стаціонарний";
        if (isMobile) {
          findings.push(`📱 Мобільний (${info.country})`);
        }
      }
      break;
    }
  }
  
  if (!detectedCountry) {
    phoneData.country = "Невідома";
    findings.push("⚠️ Невідомий код країни");
    riskScore += 15;
  } else {
    findings.push(`${detectedCountry.flag} ${detectedCountry.country}`);
  }
  
  const numericOnly = cleanNumber.replace(/\D/g, '');
  phoneData.digitsCount = numericOnly.length;
  
  if (numericOnly.length < 7) {
    riskScore += 40;
    findings.push("🔴 Занадто короткий");
  } else if (numericOnly.length < 10) {
    riskScore += 20;
    findings.push("⚠️ Можливо неповний");
  } else if (numericOnly.length > 15) {
    riskScore += 25;
    findings.push("⚠️ Занадто довгий");
  } else {
    findings.push("✅ Валідна довжина");
  }
  
  if (/^(\+?0{5,})/.test(cleanNumber) || /(\d)\1{6,}/.test(numericOnly)) {
    riskScore += 50;
    findings.push("🔴 Фейковий паттерн");
  }
  
  const voipIndicators = [
    { pattern: /\+1(800|888|877|866|855|844|833|822)/, name: "Toll-free US" },
    { pattern: /\+44(80|84|87)/, name: "UK Non-geographic" },
    { pattern: /\+49(180|700)/, name: "German service" },
  ];
  
  for (const { pattern, name } of voipIndicators) {
    if (pattern.test(cleanNumber)) {
      riskScore += 15;
      findings.push(`📞 ${name} (можливий VOIP)`);
      phoneData.possibleVoip = true;
    }
  }
  
  if (/\+\d{1,3}(900|901|905|906)/.test(cleanNumber)) {
    riskScore += 30;
    findings.push("💰 Premium-rate (шахрайство)");
    phoneData.isPremiumRate = true;
  }
  
  // API: Numverify (uses key if available, otherwise free veriphone fallback)
  const numverifyKey = process.env.NUMVERIFY_API_KEY;
  if (numverifyKey) {
    try {
      const response = await fetchWithTimeout(
        `http://apilayer.net/api/validate?access_key=${numverifyKey}&number=${cleanNumber}`,
        4000
      );
      if (response.ok) {
        const data = await response.json();
        if (data.valid !== undefined) {
          sources.push("numverify.com");
          phoneData.numverifyValid = data.valid;
          phoneData.carrier = data.carrier || null;
          phoneData.lineType = data.line_type || null;
          
          if (data.valid) {
            findings.push("✅ Номер валідний (Numverify)");
            if (data.carrier) findings.push(`📡 Оператор: ${data.carrier}`);
            if (data.line_type === "voip") {
              riskScore += 20;
              findings.push("⚠️ VOIP номер");
            }
          } else {
            riskScore += 30;
            findings.push("🔴 Невалідний номер");
          }
        }
      }
    } catch {}
  }

  // Fallback: Veriphone.io (free, no key needed)
  if (!numverifyKey) {
    try {
      const response = await fetchWithTimeout(
        `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(cleanNumber)}`,
        4000
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          sources.push("veriphone.io");
          phoneData.numverifyValid = data.phone_valid;
          phoneData.carrier = data.carrier || null;
          phoneData.lineType = data.phone_type || null;
          phoneData.internationalFormat = data.international_number || null;
          phoneData.countryName = data.country || null;

          if (data.phone_valid) {
            findings.push("✅ Номер валідний (Veriphone)");
            if (data.carrier) findings.push(`📡 Оператор: ${data.carrier}`);
            if (data.phone_type === "voip") {
              riskScore += 20;
              findings.push("⚠️ VOIP номер");
            }
          } else {
            riskScore += 30;
            findings.push("🔴 Невалідний номер (Veriphone)");
          }
        }
      }
    } catch {}
  }
  
  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "phone",
    target: value,
    riskScore,
    riskLevel,
    summary: `Телефон ${value} — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: phoneData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== EMAIL CHECK ====================
async function checkEmail(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  const emailData: any = {};
  
  const parts = value.split('@');
  if (parts.length !== 2) {
    return {
      type: "email",
      target: value,
      riskScore: 90,
      riskLevel: "critical",
      summary: `Email ${value} — CRITICAL`,
      details: { error: "Invalid format" },
      findings: ["🔴 Невалідний формат"],
      sources,
      timestamp,
    };
  }
  
  const [localPart, domain] = parts;
  emailData.localPart = localPart;
  emailData.domain = domain;
  
  const trustedProviders = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "protonmail.com", "proton.me", "hotmail.com"];
  const freeProviders = ["mail.ru", "ukr.net", "i.ua", "meta.ua", "yandex.ru", "yandex.ua", "rambler.ru", "aol.com", "live.com"];
  const disposableProviders = [
    "tempmail.com", "guerrillamail.com", "10minutemail.com", "throwaway.email", "temp-mail.org",
    "mailinator.com", "yopmail.com", "fakeinbox.com", "trashmail.com", "tempail.com",
    "getnada.com", "dispostable.com", "maildrop.cc", "emailondeck.com", "throwawaymail.com",
    "mohmal.com", "tempmailo.com", "tempr.email", "fakemail.net", "tmpmail.org",
    "sharklasers.com", "guerrillamailblock.com", "grr.la", "minutemail.co"
  ];
  
  const domainLower = domain.toLowerCase();
  
  if (trustedProviders.includes(domainLower)) {
    emailData.providerType = "Надійний";
    emailData.providerTrust = "high";
    findings.push(`✅ Надійний провайдер (${domain})`);
  } else if (freeProviders.includes(domainLower)) {
    emailData.providerType = "Безкоштовний";
    emailData.providerTrust = "medium";
    findings.push(`📧 Безкоштовний провайдер`);
  } else if (disposableProviders.some(d => domainLower.includes(d))) {
    riskScore += 60;
    emailData.providerType = "Одноразовий";
    emailData.providerTrust = "none";
    findings.push("🔴 ОДНОРАЗОВИЙ email!");
  } else {
    emailData.providerType = "Власний домен";
    emailData.providerTrust = "unknown";
    findings.push(`🏢 Власний домен (${domain})`);
  }
  
  emailData.localPartLength = localPart.length;
  
  if (/^\d+$/.test(localPart)) {
    riskScore += 20;
    findings.push("⚠️ Тільки цифри — автогенерований");
  }
  
  if (localPart.length < 3) {
    riskScore += 15;
    findings.push("⚠️ Дуже коротка адреса");
  }
  
  const systemPatterns = ["noreply", "no-reply", "donotreply", "mailer-daemon", "postmaster", "admin", "support", "info", "contact"];
  if (systemPatterns.some(p => localPart.toLowerCase().includes(p))) {
    riskScore += 15;
    findings.push("📋 Системна адреса");
    emailData.isSystemEmail = true;
  }
  
  if (["test", "testing", "demo", "example", "sample", "fake"].some(p => localPart.toLowerCase().includes(p))) {
    riskScore += 25;
    findings.push("🧪 Тестова адреса");
    emailData.isTestEmail = true;
  }
  
  if (localPart.includes('+')) {
    findings.push("📬 Plus-addressing");
    emailData.hasPlusAddressing = true;
  }
  
  if (domainLower === "gmail.com" && localPart.includes('.')) {
    findings.push("ℹ️ Gmail ігнорує крапки");
  }
  
  // Check MX records
  try {
    const response = await fetchWithTimeout(`https://dns.google/resolve?name=${domain}&type=MX`, 3000);
    const dnsData = await response.json();
    sources.push("dns.google");
    
    if (dnsData.Answer && dnsData.Answer.length > 0) {
      findings.push("✅ MX записи знайдено");
      emailData.hasMX = true;
      emailData.mxRecords = dnsData.Answer.map((a: any) => a.data).slice(0, 3);
    } else {
      riskScore += 30;
      findings.push("🔴 Немає MX записів");
      emailData.hasMX = false;
    }
  } catch {}
  
  // API: HaveIBeenPwned (free but requires key for full API)
  // Using k-anonymity endpoint which is free
  try {
    // Check if email domain was in breaches (public info)
    const sha1 = await hashString(value.toLowerCase());
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5).toUpperCase();
    
    // This is the k-anonymity check for passwords, for emails we'd need the API key
    // For demonstration, we'll check common breach databases via DNS-based check
    
  } catch {}
  
  // API: Hunter.io (uses key if available)
  const hunterKey = process.env.HUNTER_API_KEY;
  if (hunterKey) {
    try {
      const response = await fetchWithTimeout(
        `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(value)}&api_key=${hunterKey}`,
        5000
      );
      if (response.ok) {
        const data = await response.json();
        sources.push("hunter.io");
        
        if (data.data) {
          emailData.hunterStatus = data.data.status;
          emailData.hunterScore = data.data.score;
          
          if (data.data.status === "valid") {
            findings.push("✅ Email верифіковано (Hunter)");
          } else if (data.data.status === "invalid") {
            riskScore += 40;
            findings.push("🔴 Невалідний email (Hunter)");
          }
          
          if (data.data.disposable) {
            riskScore += 40;
            findings.push("🔴 Одноразовий (Hunter)");
          }
        }
      }
    } catch {}
  }

  // Fallback: Disify (free, no key needed) — disposable email check
  if (!hunterKey) {
    try {
      const response = await fetchWithTimeout(
        `https://www.disify.com/api/email/${encodeURIComponent(value)}`,
        4000
      );
      if (response.ok) {
        const data = await response.json();
        sources.push("disify.com");
        emailData.hunterStatus = data.format ? "valid" : "invalid";

        if (data.disposable) {
          riskScore += 40;
          findings.push("🔴 Одноразовий email (Disify)");
          emailData.isDisposable = true;
        }
        if (data.dns === false) {
          riskScore += 30;
          findings.push("🔴 Домен без DNS (Disify)");
        }
        if (data.format === false) {
          riskScore += 20;
          findings.push("⚠️ Невірний формат email");
        }
      }
    } catch {}
  }

  // API: EmailRep.io (free, no key needed, 100/day)
  try {
    const response = await fetchWithTimeout(
      `https://emailrep.io/${encodeURIComponent(value)}`,
      4000,
      { headers: { 'User-Agent': 'DarkShare OSINT Platform' } }
    );
    if (response.ok) {
      const data = await response.json();
      sources.push("emailrep.io");
      emailData.emailReputation = data.reputation || null;
      emailData.emailSuspicious = data.suspicious || false;
      emailData.emailReferences = data.references || 0;

      if (data.suspicious) {
        riskScore += 30;
        findings.push("⚠️ Підозрілий email (EmailRep)");
      }
      if (data.details) {
        if (data.details.credentials_leaked) {
          riskScore += 25;
          findings.push("🔴 Витік паролів (EmailRep)");
          emailData.credentialsLeaked = true;
        }
        if (data.details.data_breach) {
          findings.push("⚠️ Був у витоках даних (EmailRep)");
          emailData.dataBreach = true;
        }
        if (data.details.spam) {
          riskScore += 15;
          findings.push("⚠️ Спам-активність (EmailRep)");
        }
        if (data.details.free_provider) {
          findings.push("ℹ️ Безкоштовний провайдер");
        }
        if (data.details.deliverable === false) {
          riskScore += 25;
          findings.push("🔴 Не доставляється (EmailRep)");
        }
      }
      if (data.reputation === "high") {
        findings.push("✅ Висока репутація (EmailRep)");
      } else if (data.reputation === "low" || data.reputation === "none") {
        riskScore += 15;
        findings.push("⚠️ Низька репутація (EmailRep)");
      }
    }
  } catch {}
  
  // ==================== DATA BREACH CHECK ====================
  let breachCheckSuccess = false;
  
  // API 1: XposedOrNot (free, no key required)
  try {
    const xposedResponse = await fetchWithTimeout(
      `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(value)}`,
      6000
    );
    
    if (xposedResponse.ok) {
      const xposedData = await xposedResponse.json();
      sources.push("xposedornot.com");
      breachCheckSuccess = true;
      
      if (xposedData.breaches && xposedData.breaches.length > 0) {
        const breachCount = xposedData.breaches.length;
        emailData.breachCount = breachCount;
        emailData.breaches = xposedData.breaches.slice(0, 10);
        
        // Increase risk based on breach count
        if (breachCount >= 10) {
          riskScore += 50;
          findings.push(`🔴 КРИТИЧНО: ${breachCount} витоків даних!`);
        } else if (breachCount >= 5) {
          riskScore += 35;
          findings.push(`🔴 Знайдено ${breachCount} витоків даних`);
        } else if (breachCount >= 1) {
          riskScore += 20;
          findings.push(`⚠️ Знайдено ${breachCount} витік(ів) даних`);
        }
        
        // Add breach names to findings
        const breachNames = xposedData.breaches.slice(0, 5).map((b: any) => 
          typeof b === 'string' ? b : (b.name || b.Name || b.domain || 'Unknown')
        );
        if (breachNames.length > 0) {
          findings.push(`📋 Сервіси: ${breachNames.join(", ")}${breachCount > 5 ? "..." : ""}`);
        }
        
        emailData.breachDetails = xposedData;
      } else {
        findings.push("✅ Витоків не знайдено (XposedOrNot)");
        emailData.breachCount = 0;
      }
    } else if (xposedResponse.status === 404) {
      // 404 means no breaches found
      sources.push("xposedornot.com");
      breachCheckSuccess = true;
      findings.push("✅ Витоків не знайдено");
      emailData.breachCount = 0;
    }
  } catch (error) {
    // Will try fallback
  }
  
  // API 2: Breachchecker (fallback if XposedOrNot failed)
  if (!breachCheckSuccess) {
    try {
      const breachResponse = await fetchWithTimeout(
        `https://breachcheck.azurewebsites.net/api/checkpwn/${encodeURIComponent(value)}`,
        6000
      );
      
      if (breachResponse.ok) {
        const breachData = await breachResponse.json();
        sources.push("breachcheck.azurewebsites.net");
        breachCheckSuccess = true;
        
        if (breachData && Array.isArray(breachData) && breachData.length > 0) {
          const breachCount = breachData.length;
          emailData.breachCount = breachCount;
          emailData.breaches = breachData.slice(0, 10).map((b: any) => ({
            name: b.Name || b.name || 'Unknown',
            date: b.BreachDate || b.breachDate || null,
            domain: b.Domain || b.domain || null,
          }));
          
          if (breachCount >= 10) {
            riskScore += 50;
            findings.push(`🔴 КРИТИЧНО: ${breachCount} витоків даних!`);
          } else if (breachCount >= 5) {
            riskScore += 35;
            findings.push(`🔴 Знайдено ${breachCount} витоків даних`);
          } else if (breachCount >= 1) {
            riskScore += 20;
            findings.push(`⚠️ Знайдено ${breachCount} витік(ів) даних`);
          }
          
          const breachNames = emailData.breaches.slice(0, 5).map((b: any) => b.name);
          if (breachNames.length > 0) {
            findings.push(`📋 Сервіси: ${breachNames.join(", ")}${breachCount > 5 ? "..." : ""}`);
          }
          
          const breachDates = emailData.breaches
            .filter((b: any) => b.date)
            .slice(0, 3)
            .map((b: any) => `${b.name}: ${b.date}`);
          if (breachDates.length > 0) {
            findings.push(`📅 Дати: ${breachDates.join(", ")}`);
          }
        } else {
          findings.push("✅ Витоків не знайдено");
          emailData.breachCount = 0;
        }
      }
    } catch (error) {
      // Will use local fallback
    }
  }
  
  // Local fallback: check against known major breaches
  if (!breachCheckSuccess) {
    sources.push("Локальна база витоків");
    
    const knownBreachDomains: Record<string, { name: string; date: string; records: string }> = {
      "linkedin.com": { name: "LinkedIn", date: "2021", records: "700M" },
      "facebook.com": { name: "Facebook", date: "2019", records: "533M" },
      "adobe.com": { name: "Adobe", date: "2013", records: "153M" },
      "canva.com": { name: "Canva", date: "2019", records: "137M" },
      "dropbox.com": { name: "Dropbox", date: "2012", records: "68M" },
      "twitter.com": { name: "Twitter", date: "2022", records: "5.4M" },
      "yahoo.com": { name: "Yahoo", date: "2016", records: "3B" },
      "myspace.com": { name: "MySpace", date: "2016", records: "360M" },
    };
    
    // Check if email domain matches known breached services
    const emailDomainLower = domain.toLowerCase();
    if (knownBreachDomains[emailDomainLower]) {
      const breach = knownBreachDomains[emailDomainLower];
      riskScore += 15;
      findings.push(`⚠️ Домен мав витік: ${breach.name} (${breach.date}, ${breach.records} записів)`);
      emailData.domainBreach = breach;
    }
    
    // High-profile domain warning
    const highProfileDomains = ["gmail.com", "outlook.com", "yahoo.com", "hotmail.com"];
    if (highProfileDomains.includes(emailDomainLower)) {
      findings.push("ℹ️ Популярний провайдер — рекомендуємо перевірити на haveibeenpwned.com");
      emailData.recommendManualCheck = true;
    }
  }
  
  if (sources.length <= 1) {
    findings.push("⚠️ Низька достовірність: більшість джерел недоступні");
  }

  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "email",
    target: value,
    riskScore,
    riskLevel,
    summary: `Email ${value} — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: emailData,
    findings,
    sources,
    timestamp,
  };
}

// Helper for hashing
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== SSL CERTIFICATE CHECK ====================
interface SSLCertificateInfo {
  valid: boolean;
  issuedDate?: string;
  expiryDate?: string;
  issuer?: string;
  daysUntilExpiry?: number;
  isExpired?: boolean;
  certificateCount?: number;
  commonName?: string;
  organizationName?: string;
  subjectAltNames?: string[];
  signatureAlgorithm?: string;
}

async function checkSSLCertificate(domain: string, sources: string[]): Promise<{ certificateInfo: SSLCertificateInfo; findings: string[] }> {
  const findings: string[] = [];
  const certificateInfo: SSLCertificateInfo = { valid: false };
  
  // Try SSL Labs API first
  try {
    const ssllabsResponse = await fetchWithTimeout(
      `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(domain)}&publish=off&all=done`,
      10000
    );
    
    if (ssllabsResponse.ok) {
      const ssllabsData = await ssllabsResponse.json();
      sources.push("ssllabs.com");
      
      if (ssllabsData.status === "READY" || ssllabsData.status === "ERROR") {
        if (ssllabsData.certs && ssllabsData.certs.length > 0) {
          const cert = ssllabsData.certs[0];
          certificateInfo.valid = true;
          certificateInfo.certificateCount = ssllabsData.certs.length;
          
          if (cert.notBefore) {
            const issuedDate = new Date(cert.notBefore * 1000);
            certificateInfo.issuedDate = issuedDate.toISOString().split('T')[0];
            findings.push(`📅 Виданий: ${certificateInfo.issuedDate}`);
          }
          
          if (cert.notAfter) {
            const expiryDate = new Date(cert.notAfter * 1000);
            certificateInfo.expiryDate = expiryDate.toISOString().split('T')[0];
            const now = new Date();
            const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            certificateInfo.daysUntilExpiry = daysUntilExpiry;
            certificateInfo.isExpired = daysUntilExpiry < 0;
            
            if (daysUntilExpiry < 0) {
              findings.push(`🔴 Сертифікат ЕКСПАЙРИВ: ${Math.abs(daysUntilExpiry)} днів тому`);
            } else if (daysUntilExpiry < 30) {
              findings.push(`⚠️ Сертифікат експайрує за ${daysUntilExpiry} днів`);
            } else if (daysUntilExpiry < 90) {
              findings.push(`⚠️ Сертифікат буде експайрувати за ${daysUntilExpiry} днів`);
            } else {
              findings.push(`✅ Експайрує через: ${daysUntilExpiry} днів`);
            }
          }
          
          if (cert.issuerLabel) {
            certificateInfo.issuer = cert.issuerLabel;
            findings.push(`🏢 Видавець: ${cert.issuerLabel}`);
          }
          
          if (cert.commonNames && cert.commonNames.length > 0) {
            certificateInfo.commonName = cert.commonNames[0];
          }
          
          if (cert.orgName) {
            certificateInfo.organizationName = cert.orgName;
            findings.push(`🏛️ Організація: ${cert.orgName}`);
          }
          
          if (cert.altNames && cert.altNames.length > 0) {
            certificateInfo.subjectAltNames = cert.altNames.slice(0, 5);
            findings.push(`🔗 SANs: ${cert.altNames.slice(0, 3).join(", ")}${cert.altNames.length > 3 ? "..." : ""}`);
          }
          
          if (cert.sigAlg) {
            certificateInfo.signatureAlgorithm = cert.sigAlg;
          }
          
          return { certificateInfo, findings };
        } else if (ssllabsData.status === "ERROR") {
          findings.push(`⚠️ SSL Labs: ${ssllabsData.statusMessage || "Помилка аналізу"}`);
        }
      }
    }
  } catch (error) {
    // Fall through to crt.sh
  }
  
  // Fallback to crt.sh API (free, no rate limits)
  try {
    const crtshResponse = await fetchWithTimeout(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`, 5000);
    
    if (crtshResponse.ok) {
      const crtshData = await crtshResponse.json();
      sources.push("crt.sh");
      
      if (Array.isArray(crtshData) && crtshData.length > 0) {
        certificateInfo.valid = true;
        certificateInfo.certificateCount = crtshData.length;
        
        // Get the most recent certificate
        const sortedCerts = crtshData.sort((a: any, b: any) => {
          const dateA = new Date(a.not_before || 0).getTime();
          const dateB = new Date(b.not_before || 0).getTime();
          return dateB - dateA;
        });
        
        const mostRecentCert = sortedCerts[0];
        
        if (mostRecentCert.not_before) {
          const issuedDate = new Date(mostRecentCert.not_before);
          certificateInfo.issuedDate = issuedDate.toISOString().split('T')[0];
          findings.push(`📅 Виданий: ${certificateInfo.issuedDate}`);
        }
        
        if (mostRecentCert.not_after) {
          const expiryDate = new Date(mostRecentCert.not_after);
          certificateInfo.expiryDate = expiryDate.toISOString().split('T')[0];
          const now = new Date();
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          certificateInfo.daysUntilExpiry = daysUntilExpiry;
          certificateInfo.isExpired = daysUntilExpiry < 0;
          
          if (daysUntilExpiry < 0) {
            findings.push(`🔴 Сертифікат ЕКСПАЙРИВ: ${Math.abs(daysUntilExpiry)} днів тому`);
          } else if (daysUntilExpiry < 30) {
            findings.push(`⚠️ Сертифікат експайрує за ${daysUntilExpiry} днів`);
          } else if (daysUntilExpiry < 90) {
            findings.push(`⚠️ Сертифікат буде експайрувати за ${daysUntilExpiry} днів`);
          } else {
            findings.push(`✅ Експайрує через: ${daysUntilExpiry} днів`);
          }
        }
        
        if (mostRecentCert.issuer_name) {
          certificateInfo.issuer = mostRecentCert.issuer_name;
          findings.push(`🏢 Видавець: ${mostRecentCert.issuer_name}`);
        } else if (mostRecentCert.issuer_ca_id) {
          findings.push(`🔐 CA ID: ${mostRecentCert.issuer_ca_id}`);
        }
        
        if (mostRecentCert.common_name) {
          certificateInfo.commonName = mostRecentCert.common_name;
        }
        
        if (mostRecentCert.name_value) {
          const names = mostRecentCert.name_value.split('\n').filter((n: string) => n.trim());
          if (names.length > 0) {
            certificateInfo.subjectAltNames = names.slice(0, 5);
            findings.push(`🔗 Домени: ${names.slice(0, 3).join(", ")}${names.length > 3 ? "..." : ""}`);
          }
        }
        
        findings.push(`📊 Сертифікатів знайдено: ${crtshData.length}`);
        
        return { certificateInfo, findings };
      }
    }
  } catch (error) {
    findings.push("⚠️ Не вдалося отримати SSL інформацію");
  }
  
  if (!certificateInfo.valid) {
    findings.push("🔴 Не знайдено дійсних SSL сертифікатів");
  }
  
  return { certificateInfo, findings };
}

// ==================== DOMAIN CHECK ====================
async function checkDomain(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  const domainData: any = {};
  
  const domain = value.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('?')[0];
  domainData.cleanDomain = domain;
  
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  domainData.tld = tld;
  domainData.subdomainCount = parts.length - 2;
  
  const highRiskTlds = ["tk", "ml", "ga", "cf", "gq", "xyz", "top", "work", "click", "loan", "zip", "mov", "icu", "buzz", "cam", "rest"];
  const mediumRiskTlds = ["online", "site", "website", "space", "tech", "fun", "life", "store", "live"];
  const trustedTlds = ["com", "org", "net", "edu", "gov", "ua", "uk", "de", "eu", "io", "co", "me", "dev"];
  
  if (highRiskTlds.includes(tld)) {
    riskScore += 35;
    findings.push(`🔴 Високоризиковий TLD (.${tld})`);
  } else if (mediumRiskTlds.includes(tld)) {
    riskScore += 15;
    findings.push(`⚠️ TLD середнього ризику (.${tld})`);
  } else if (trustedTlds.includes(tld)) {
    findings.push(`✅ Надійний TLD (.${tld})`);
  }
  
  if (domain.length > 50) {
    riskScore += 25;
    findings.push("🔴 Надто довгий домен");
  } else if (domain.length > 30) {
    riskScore += 10;
    findings.push("⚠️ Довгий домен");
  }
  
  if (/\d{5,}/.test(domain)) {
    riskScore += 30;
    findings.push("🔴 Багато цифр — автогенерований");
  }
  
  // Typosquatting detection
  const popularBrands = [
    { brand: "google", official: ["google.com", "google.com.ua", "google.co.uk"] },
    { brand: "facebook", official: ["facebook.com", "fb.com"] },
    { brand: "apple", official: ["apple.com", "icloud.com"] },
    { brand: "microsoft", official: ["microsoft.com", "live.com", "outlook.com"] },
    { brand: "amazon", official: ["amazon.com", "aws.amazon.com"] },
    { brand: "paypal", official: ["paypal.com"] },
    { brand: "netflix", official: ["netflix.com"] },
    { brand: "instagram", official: ["instagram.com"] },
    { brand: "twitter", official: ["twitter.com", "x.com"] },
    { brand: "telegram", official: ["telegram.org", "t.me"] },
    { brand: "binance", official: ["binance.com"] },
    { brand: "coinbase", official: ["coinbase.com"] },
    { brand: "metamask", official: ["metamask.io"] },
  ];
  
  for (const { brand, official } of popularBrands) {
    if (domain.includes(brand) && !official.includes(domain)) {
      riskScore += 50;
      findings.push(`🔴 TYPOSQUATTING: Імітує ${brand}`);
      domainData.possibleTyposquat = brand;
      break;
    }
  }
  
  const phishingPatterns = ["login-", "signin-", "-login", "-signin", "secure-", "-secure", "verify-", "-verify", "update-", "account-", "-account", "wallet-", "-wallet", "confirm-", "unlock-", "suspended-"];
  if (phishingPatterns.some(p => domain.includes(p))) {
    riskScore += 40;
    findings.push("🔴 Фішингові патерни");
    domainData.hasPhishingPattern = true;
  }
  
  if (parts.length > 4) {
    riskScore += 25;
    findings.push("🔴 Забагато субдоменів");
  }
  
  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount > 3) {
    riskScore += 20;
    findings.push("⚠️ Забагато дефісів");
  }
  
  // DNS checks
  try {
    const aResponse = await fetchWithTimeout(`https://dns.google/resolve?name=${domain}&type=A`, 3000);
    const aData = await aResponse.json();
    sources.push("dns.google");
    
    if (aData.Answer && aData.Answer.length > 0) {
      findings.push("✅ A запис знайдено");
      domainData.hasARecord = true;
      domainData.ipAddresses = aData.Answer.filter((a: any) => a.type === 1).map((a: any) => a.data).slice(0, 3);
    } else {
      riskScore += 20;
      findings.push("⚠️ Немає A запису");
      domainData.hasARecord = false;
    }
    
    const nsResponse = await fetchWithTimeout(`https://dns.google/resolve?name=${domain}&type=NS`, 3000);
    const nsData = await nsResponse.json();
    
    if (nsData.Answer && nsData.Answer.length > 0) {
      domainData.nameservers = nsData.Answer.map((a: any) => a.data).slice(0, 3);
      
      const privacyNS = ["njal.la", "cloudflare", "privacy"];
      if (privacyNS.some(s => domainData.nameservers.some((ns: string) => ns.toLowerCase().includes(s)))) {
        findings.push("ℹ️ Privacy DNS");
      }
    }
  } catch {}
  
  // API: WHOIS via rdap.org (free)
  try {
    const response = await fetchWithTimeout(`https://rdap.org/domain/${domain}`, 5000);
    if (response.ok) {
      const data = await response.json();
      sources.push("rdap.org");
      
      if (data.events) {
        const registration = data.events.find((e: any) => e.eventAction === "registration");
        const expiration = data.events.find((e: any) => e.eventAction === "expiration");
        
        if (registration) {
          domainData.registrationDate = registration.eventDate;
          const regDate = new Date(registration.eventDate);
          const daysSinceReg = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceReg < 30) {
            riskScore += 35;
            findings.push(`🔴 Новий домен (${daysSinceReg} днів)`);
          } else if (daysSinceReg < 90) {
            riskScore += 20;
            findings.push(`⚠️ Молодий домен (${daysSinceReg} днів)`);
          } else {
            findings.push(`📅 Вік: ${Math.floor(daysSinceReg / 365)} років`);
          }
        }
        
        if (expiration) {
          domainData.expirationDate = expiration.eventDate;
        }
      }
      
      if (data.entities) {
        const registrar = data.entities.find((e: any) => e.roles?.includes("registrar"));
        if (registrar?.vcardArray) {
          const fn = registrar.vcardArray[1]?.find((v: any) => v[0] === "fn");
          if (fn) {
            domainData.registrar = fn[3];
            findings.push(`🏢 Реєстратор: ${fn[3]}`);
          }
        }
      }
    }
  } catch {}
  
  // API: SSL Certificate check (SSL Labs + crt.sh fallback)
  try {
    const { certificateInfo, findings: sslFindings } = await checkSSLCertificate(domain, sources);
    
    if (certificateInfo.valid) {
      domainData.sslCertificate = certificateInfo;
      
      if (certificateInfo.isExpired) {
        riskScore += 40;
      } else if (certificateInfo.daysUntilExpiry && certificateInfo.daysUntilExpiry < 30) {
        riskScore += 20;
      } else if (certificateInfo.daysUntilExpiry && certificateInfo.daysUntilExpiry < 90) {
        riskScore += 10;
      } else {
        findings.push("✅ SSL сертифікат валідний");
      }
      
      findings.push(...sslFindings);
    } else {
      // Check if domain has A record (not HTTPS)
      if (domainData.hasARecord && !domainData.hasARecord) {
        riskScore += 15;
        findings.push("⚠️ Без HTTPS");
      }
      findings.push(...sslFindings);
    }
  } catch {}
  
  if (findings.length === 0) {
    findings.push("✅ Базова перевірка пройшла");
  }
  
  // API: crt.sh (Certificate Transparency - free, no key)
  if (!sources.includes("crt.sh")) {
  try {
    const response = await fetchWithTimeout(`https://crt.sh/?q=${domain}&output=json`, 4000);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        sources.push("crt.sh");
        const uniqueNames = [...new Set(data.map((c: any) => c.common_name || c.name_value).filter(Boolean))];
        domainData.certificateCount = data.length;
        domainData.uniqueCertNames = uniqueNames.slice(0, 10);
        findings.push(`🔐 Знайдено ${data.length} SSL сертифікатів (${uniqueNames.length} унікальних)`);
        const recentCert = data[0];
        if (recentCert.not_after) {
          const expiry = new Date(recentCert.not_after);
          const daysLeft = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) {
            riskScore += 15;
            findings.push("⚠️ Останній сертифікат прострочений");
          } else if (daysLeft < 30) {
            findings.push(`⚠️ Сертифікат закінчується через ${daysLeft} днів`);
          }
        }
        if (recentCert.issuer_name) {
          domainData.certIssuer = recentCert.issuer_name;
        }
      }
    }
  } catch {}
  }

  // API: HackerTarget (free - reverse DNS / associated hosts)
  try {
    const response = await fetchWithTimeout(`https://api.hackertarget.com/hostsearch/?q=${domain}`, 3000);
    if (response.ok) {
      const text = await response.text();
      if (!text.includes('error') && !text.includes('API count exceeded') && text.trim().length > 0) {
        const hosts = text.trim().split('\n').filter(line => line.includes(','));
        if (hosts.length > 0) {
          sources.push("hackertarget.com");
          domainData.relatedHosts = hosts.slice(0, 10).map(h => h.split(',')[0]);
          domainData.totalSubdomains = hosts.length;
          findings.push(`🔍 Знайдено ${hosts.length} піддоменів/хостів`);
          if (hosts.length > 50) {
            findings.push("ℹ️ Великий домен з розвиненою інфраструктурою");
          }
        }
      }
    }
  } catch {}

  // API: ThreatFox (abuse.ch) - IOC database for domains
  try {
    const response = await fetchWithTimeout('https://threatfox-api.abuse.ch/api/v1/', 3000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'search_ioc', search_term: domain })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.query_status === 'ok' && data.data && data.data.length > 0) {
        sources.push("threatfox.abuse.ch");
        riskScore += 45;
        const threat = data.data[0];
        findings.push(`🔴 ThreatFox IOC: ${threat.malware_printable || 'Malware'} (${threat.threat_type || 'unknown'})`);
        domainData.threatfoxMalware = threat.malware_printable;
        domainData.threatfoxType = threat.threat_type;
      }
    }
  } catch {}

  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "domain",
    target: value,
    riskScore,
    riskLevel,
    summary: `Домен ${domain} — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: domainData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== URL CHECK ====================
async function checkURL(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  const urlData: any = {};
  
  try {
    const urlObj = new URL(value);
    urlData.fullUrl = value;
    urlData.domain = urlObj.hostname;
    urlData.protocol = urlObj.protocol.replace(':', '');
    urlData.path = urlObj.pathname;
    urlData.query = urlObj.search;
    urlData.port = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
    
    if (urlObj.protocol === "http:") {
      riskScore += 20;
      findings.push("🔓 HTTP (незахищено)");
      urlData.isSecure = false;
    } else {
      findings.push("🔒 HTTPS");
      urlData.isSecure = true;
    }
    
    const shorteners = [
      "bit.ly", "t.co", "goo.gl", "tinyurl.com", "ow.ly", "is.gd", "buff.ly",
      "short.io", "rebrand.ly", "cutt.ly", "t.ly", "rb.gy", "shorturl.at",
      "tiny.cc", "lnk.to", "s.id", "clck.ru"
    ];
    if (shorteners.some(s => urlObj.hostname.includes(s))) {
      riskScore += 35;
      urlData.isShortener = true;
      findings.push("⚠️ URL-скорочувач");
    }
    
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname)) {
      riskScore += 40;
      findings.push("🔴 IP замість домену");
      urlData.usesIP = true;
    }
    
    if (urlObj.port && !["80", "443", "8080", "8443"].includes(urlObj.port)) {
      riskScore += 15;
      findings.push(`⚠️ Нестандартний порт (${urlObj.port})`);
    }
    
    const dangerousExtensions = [".exe", ".msi", ".bat", ".cmd", ".scr", ".js", ".vbs", ".ps1", ".jar", ".apk", ".dmg", ".dll"];
    const pathLower = urlObj.pathname.toLowerCase();
    for (const ext of dangerousExtensions) {
      if (pathLower.endsWith(ext)) {
        riskScore += 45;
        findings.push(`🔴 Виконуваний файл (${ext})`);
        urlData.hasDangerousExtension = true;
        break;
      }
    }
    
    if ([".zip", ".rar", ".7z", ".tar", ".gz"].some(ext => pathLower.endsWith(ext))) {
      riskScore += 20;
      findings.push("📦 Архів");
    }
    
    const phishingKeywords = ["login", "signin", "sign-in", "account", "verify", "secure", "update", "confirm", "wallet", "password", "credential", "bank", "payment", "invoice", "document"];
    const urlLower = value.toLowerCase();
    const foundKeywords = phishingKeywords.filter(k => urlLower.includes(k));
    if (foundKeywords.length > 0) {
      riskScore += 10 * Math.min(foundKeywords.length, 3);
      findings.push(`⚠️ Підозрілі слова: ${foundKeywords.slice(0, 3).join(", ")}`);
      urlData.phishingKeywords = foundKeywords;
    }
    
    const redirectParams = ["redirect", "url=", "goto", "return", "next", "dest", "target", "link", "out", "ref", "forward"];
    if (redirectParams.some(p => urlLower.includes(p))) {
      riskScore += 25;
      findings.push("⚠️ Redirect-параметри");
      urlData.hasRedirect = true;
    }
    
    if (value.startsWith("data:")) {
      riskScore += 60;
      findings.push("🔴 Data URI");
    }
    
    if (urlObj.search.includes("base64") || /[A-Za-z0-9+/=]{50,}/.test(value)) {
      riskScore += 20;
      findings.push("⚠️ Закодовані дані");
    }
    
    // Check domain
    const domainResult = await checkDomain(urlObj.hostname, timestamp);
    if (domainResult.riskScore > 30) {
      riskScore += Math.floor(domainResult.riskScore / 3);
      findings.push(`📍 Домен: ${domainResult.riskLevel.toUpperCase()}`);
    }
    
    // SSL/TLS verification for HTTPS URLs
    if (urlObj.protocol === "https:") {
      try {
        const { certificateInfo, findings: sslFindings } = await checkSSLCertificate(urlObj.hostname, sources);
        
        if (certificateInfo.valid) {
          urlData.sslCertificate = certificateInfo;
          
          if (certificateInfo.isExpired) {
            riskScore += 35;
            findings.push("🔴 SSL сертифікат ЕКСПАЙРИВ!");
          } else if (certificateInfo.daysUntilExpiry && certificateInfo.daysUntilExpiry < 30) {
            riskScore += 15;
            findings.push(`⚠️ SSL вважатиме експайреним за ${certificateInfo.daysUntilExpiry} днів`);
          } else if (certificateInfo.daysUntilExpiry && certificateInfo.daysUntilExpiry < 90) {
            findings.push(`ℹ️ SSL експайрує за ${certificateInfo.daysUntilExpiry} днів`);
          } else {
            findings.push("✅ SSL сертифікат валідний");
          }
          
          findings.push(...sslFindings);
        } else {
          riskScore += 25;
          findings.push("🔴 HTTPS заявлено, але сертифікат не знайдено!");
          findings.push(...sslFindings);
        }
      } catch (error) {
        findings.push("⚠️ Не вдалося перевірити SSL сертифікат");
      }
    }
    
    urlData.urlLength = value.length;
    if (value.length > 500) {
      riskScore += 20;
      findings.push("⚠️ Дуже довгий URL");
    }
    
    // API: urlscan.io (free, no key needed for search)
    try {
      const response = await fetchWithTimeout(
        `https://urlscan.io/api/v1/search/?q=domain:${urlObj.hostname}`,
        4000
      );
      if (response.ok) {
        const data = await response.json();
        sources.push("urlscan.io");
        
        if (data.results && data.results.length > 0) {
          urlData.urlscanResults = data.results.length;
          const malicious = data.results.filter((r: any) => r.verdicts?.malicious);
          if (malicious.length > 0) {
            riskScore += 40;
            findings.push(`🔴 Виявлено шкідливість (urlscan)`);
          } else {
            findings.push(`📊 Скановано ${data.results.length} разів`);
          }
        }
      }
    } catch {}
    
    // API: Google Safe Browsing (uses key if available)
    const safeBrowsingKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
    if (safeBrowsingKey) {
      try {
        const response = await fetchWithTimeout(
          `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${safeBrowsingKey}`,
          4000,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client: { clientId: "darkshare", clientVersion: "1.0" },
              threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url: value }]
              }
            })
          }
        );
        if (response.ok) {
          const data = await response.json();
          sources.push("Google Safe Browsing");
          
          if (data.matches && data.matches.length > 0) {
            riskScore += 60;
            findings.push("🔴 НЕБЕЗПЕЧНО (Google Safe Browsing)");
            urlData.safeBrowsingThreats = data.matches.map((m: any) => m.threatType);
          } else {
            findings.push("✅ Безпечно (Google)");
          }
        }
      } catch {}
    }

    // Fallback: PhishTank (free, no key needed)
    if (!safeBrowsingKey) {
      try {
        const response = await fetchWithTimeout(
          `https://checkurl.phishtank.com/checkurl/`,
          4000,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `url=${encodeURIComponent(value)}&format=json&app_key=`
          }
        );
        if (response.ok) {
          const data = await response.json();
          sources.push("PhishTank");
          if (data.results?.in_database && data.results?.valid) {
            riskScore += 60;
            findings.push("🔴 ФІШИНГ (PhishTank)");
            urlData.phishTankMatch = true;
          } else {
            findings.push("✅ Не в PhishTank");
          }
        }
      } catch {}
    }


    // API: URLhaus (abuse.ch) - malicious URL database
    try {
      const response = await fetchWithTimeout('https://urlhaus-api.abuse.ch/v1/url/', 4000, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(value)}`
      });
      if (response.ok) {
        const data = await response.json();
        if (data.query_status === 'ok' && data.id) {
          sources.push("urlhaus.abuse.ch");
          riskScore += 55;
          findings.push(`🔴 URLhaus: Відомий шкідливий URL (${data.threat || 'malware'})`);
          urlData.urlhausThreat = data.threat;
          urlData.urlhausStatus = data.url_status;
          if (data.tags) urlData.urlhausTags = data.tags;
        } else if (data.query_status === 'no_results') {
          sources.push("urlhaus.abuse.ch");
          findings.push("✅ Не знайдено в базі URLhaus");
        }
      }
    } catch {}

    
  } catch {
    return {
      type: "url",
      target: value,
      riskScore: 70,
      riskLevel: "high",
      summary: `URL — HIGH (невалідний)`,
      details: { error: "Invalid URL" },
      findings: ["🔴 Невалідний URL"],
      sources,
      timestamp,
    };
  }
  
  if (findings.length <= 1) {
    findings.push("✅ Базова перевірка пройшла");
  }
  
  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "url",
    target: value,
    riskScore,
    riskLevel,
    summary: `URL — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: urlData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== BOT TOKEN CHECK ====================
async function checkBot(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Telegram Bot API"];
  const botData: any = {};
  
  const token = value.trim();
  botData.tokenMasked = `${token.slice(0, 8)}...${token.slice(-8)}`;
  
  const botIdMatch = token.match(/^(\d+):/);
  if (botIdMatch) {
    botData.botId = botIdMatch[1];
  }
  
  try {
    const response = await fetchWithTimeout(`https://api.telegram.org/bot${token}/getMe`, 10000);
    const data = await response.json();
    
    if (data.ok && data.result) {
      const bot = data.result;
      botData.isValid = true;
      botData.username = bot.username;
      botData.firstName = bot.first_name;
      botData.botId = bot.id.toString();
      botData.canJoinGroups = bot.can_join_groups ?? false;
      botData.canReadAllGroupMessages = bot.can_read_all_group_messages ?? false;
      botData.supportsInlineQueries = bot.supports_inline_queries ?? false;
      botData.canConnectToBusiness = bot.can_connect_to_business ?? false;
      botData.hasMainWebApp = bot.has_main_web_app ?? false;
      
      findings.push(`✅ Валідний — @${bot.username}`);
      findings.push(`🤖 ${bot.first_name}`);
      findings.push(`🆔 ID: ${bot.id}`);
      
      if (bot.can_join_groups) {
        riskScore += 5;
        findings.push("📂 Може в групи");
      }
      
      if (bot.can_read_all_group_messages) {
        riskScore += 15;
        findings.push("👁️ Читає всі повідомлення");
      }
      
      if (bot.supports_inline_queries) {
        findings.push("🔍 Inline-запити");
      }
      
      if (bot.can_connect_to_business) {
        findings.push("💼 Бізнес-акаунти");
      }
      
      if (bot.has_main_web_app) {
        findings.push("🌐 Веб-застосунок");
      }
      
      const suspiciousPatterns = ["admin", "support", "official", "helper", "service", "bank", "wallet", "crypto", "trade", "invest", "casino", "bet"];
      const usernameLower = bot.username.toLowerCase();
      const foundPatterns = suspiciousPatterns.filter(p => usernameLower.includes(p));
      if (foundPatterns.length > 0) {
        riskScore += 20;
        findings.push(`⚠️ Підозріла назва: ${foundPatterns.join(", ")}`);
        botData.hasSuspiciousName = true;
      }
      
    } else {
      botData.isValid = false;
      riskScore = 70;
      
      if (data.error_code === 401) {
        findings.push("🔴 НЕДІЙСНИЙ токен");
        botData.errorType = "unauthorized";
      } else if (data.error_code === 404) {
        findings.push("🔴 Бот не знайдений");
        botData.errorType = "not_found";
      } else {
        findings.push(`🔴 Помилка: ${data.description || "Unknown"}`);
        botData.errorType = "api_error";
      }
      
      findings.push("⚠️ Можливо скомпрометований");
    }
    
  } catch (error: any) {
    botData.isValid = false;
    riskScore = 50;
    findings.push("⚠️ Telegram API недоступний");
    botData.errorType = error.name === "AbortError" ? "timeout" : "network_error";
  }
  
  if (botData.isValid) {
    findings.push("🔐 Не діліться токеном!");
  } else {
    findings.push("💡 Створіть новий через @BotFather");
  }
  
  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "bot",
    target: botData.tokenMasked,
    riskScore,
    riskLevel,
    summary: botData.isValid 
      ? `Bot @${botData.username} — ${riskLevel.toUpperCase()} (${riskScore}/100)`
      : `Bot Token — ${riskLevel.toUpperCase()} (НЕДІЙСНИЙ)`,
    details: botData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== CVE CHECK (NEW) ====================
async function checkCVE(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = [];
  const cveData: any = {};
  
  const cleanValue = value.trim().toUpperCase();
  const isCveId = /^CVE-\d{4}-\d{4,}$/.test(cleanValue);
  
  if (isCveId) {
    // Direct CVE lookup via NVD API (free, no key needed for basic)
    try {
      const response = await fetchWithTimeout(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cleanValue}`,
        10000
      );
      if (response.ok) {
        const data = await response.json();
        sources.push("NVD (NIST)");
        
        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
          const vuln = data.vulnerabilities[0].cve;
          cveData.id = vuln.id;
          cveData.published = vuln.published;
          cveData.lastModified = vuln.lastModified;
          
          // Get description
          const descEn = vuln.descriptions?.find((d: any) => d.lang === "en");
          if (descEn) {
            cveData.description = descEn.value;
            findings.push(`📋 ${descEn.value.substring(0, 200)}...`);
          }
          
          // CVSS metrics
          const metrics = vuln.metrics;
          if (metrics?.cvssMetricV31?.[0]) {
            const cvss = metrics.cvssMetricV31[0].cvssData;
            cveData.cvssScore = cvss.baseScore;
            cveData.cvssVector = cvss.vectorString;
            cveData.severity = cvss.baseSeverity;
            
            findings.push(`🎯 CVSS 3.1: ${cvss.baseScore} (${cvss.baseSeverity})`);
            
            if (cvss.baseScore >= 9.0) {
              riskScore += 80;
              findings.push("🔴 КРИТИЧНА вразливість!");
            } else if (cvss.baseScore >= 7.0) {
              riskScore += 50;
              findings.push("🟠 ВИСОКА небезпека");
            } else if (cvss.baseScore >= 4.0) {
              riskScore += 30;
              findings.push("🟡 СЕРЕДНЯ небезпека");
            } else {
              riskScore += 10;
              findings.push("🟢 Низька небезпека");
            }
          } else if (metrics?.cvssMetricV2?.[0]) {
            const cvss = metrics.cvssMetricV2[0].cvssData;
            cveData.cvssScore = cvss.baseScore;
            findings.push(`🎯 CVSS 2.0: ${cvss.baseScore}`);
            riskScore += cvss.baseScore >= 7.0 ? 50 : 30;
          }
          
          // References
          if (vuln.references) {
            cveData.references = vuln.references.slice(0, 5).map((r: any) => r.url);
            findings.push(`📎 Посилань: ${vuln.references.length}`);
          }
          
          // Affected products (CPE)
          if (vuln.configurations?.[0]?.nodes) {
            const products: string[] = [];
            for (const node of vuln.configurations[0].nodes) {
              if (node.cpeMatch) {
                for (const cpe of node.cpeMatch.slice(0, 5)) {
                  const parts = cpe.criteria.split(':');
                  if (parts.length > 4) {
                    products.push(`${parts[3]} ${parts[4]}`);
                  }
                }
              }
            }
            if (products.length > 0) {
              cveData.affectedProducts = products;
              findings.push(`🎯 Продукти: ${products.slice(0, 3).join(", ")}`);
            }
          }
          
          // Check if exploited
          if (vuln.cisaExploitAdd) {
            riskScore += 30;
            findings.push("🔴 В каталозі CISA KEV!");
            cveData.cisaKnownExploited = true;
          }
          
        } else {
          findings.push("⚠️ CVE не знайдено в NVD");
          riskScore = 30;
        }
      }
    } catch (error) {
      findings.push("⚠️ NVD API недоступний");
    }
    
    // Additional: Check Exploit-DB (via CVEDetails or similar)
    try {
      const response = await fetchWithTimeout(
        `https://www.cvedetails.com/json-feed.php?numrows=1&cveid=${cleanValue}`,
        5000
      );
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim() !== '[]') {
          sources.push("cvedetails.com");
          try {
            const data = JSON.parse(text);
            if (data.length > 0 && data[0].exploit_count > 0) {
              riskScore += 20;
              findings.push(`⚠️ Публічних експлойтів: ${data[0].exploit_count}`);
              cveData.exploitCount = data[0].exploit_count;
            }
          } catch {}
        }
      }
    } catch {}
    
  } else {
    // Search by keyword/product
    try {
      const response = await fetchWithTimeout(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(value)}&resultsPerPage=10`,
        10000
      );
      if (response.ok) {
        const data = await response.json();
        sources.push("NVD (NIST)");
        
        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
          cveData.searchResults = data.vulnerabilities.length;
          cveData.totalResults = data.totalResults;
          findings.push(`🔍 Знайдено: ${data.totalResults} CVE`);
          
          // List top 5
          const topCves = data.vulnerabilities.slice(0, 5).map((v: any) => {
            const score = v.cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 
                         v.cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || "N/A";
            return `${v.cve.id} (${score})`;
          });
          
          cveData.topCves = topCves;
          findings.push(`📋 Топ: ${topCves.join(", ")}`);
          
          // Check for critical ones
          const criticalCount = data.vulnerabilities.filter((v: any) => 
            v.cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore >= 9.0
          ).length;
          
          if (criticalCount > 0) {
            riskScore += 40;
            findings.push(`🔴 Критичних: ${criticalCount}`);
          }
          
          riskScore += Math.min(data.totalResults, 50);
        } else {
          findings.push("✅ CVE не знайдено");
          riskScore = 10;
        }
      }
    } catch {
      findings.push("⚠️ NVD API недоступний");
    }
  }
  
  if (findings.length === 0) {
    findings.push("ℹ️ Дані відсутні");
  }
  
  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "cve",
    target: value,
    riskScore,
    riskLevel,
    summary: isCveId 
      ? `${cleanValue} — ${riskLevel.toUpperCase()} (${riskScore}/100)`
      : `CVE пошук "${value}" — ${riskLevel.toUpperCase()}`,
    details: cveData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== FILE HASH CHECK (NEW) ====================
async function checkHash(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  const hashData: any = {};
  
  const hash = value.toLowerCase();
  hashData.hash = hash;
  
  // Detect hash type
  if (hash.length === 32) {
    hashData.type = "MD5";
    findings.push("🔢 MD5 хеш");
  } else if (hash.length === 40) {
    hashData.type = "SHA-1";
    findings.push("🔢 SHA-1 хеш");
  } else if (hash.length === 64) {
    hashData.type = "SHA-256";
    findings.push("🔢 SHA-256 хеш");
  }
  
  // API: MalwareBazaar (free)
  try {
    const formData = new FormData();
    formData.append('query', 'get_info');
    formData.append('hash', hash);
    
    const response = await fetchWithTimeout(
      'https://mb-api.abuse.ch/api/v1/',
      5000,
      { method: 'POST', body: formData }
    );
    
    if (response.ok) {
      const data = await response.json();
      sources.push("MalwareBazaar");
      
      if (data.query_status === "ok" && data.data) {
        const malware = data.data[0];
        riskScore += 80;
        findings.push("🔴 MALWARE знайдено!");
        
        hashData.malwareName = malware.signature || "Unknown";
        hashData.fileType = malware.file_type || "Unknown";
        hashData.firstSeen = malware.first_seen;
        hashData.tags = malware.tags || [];
        
        findings.push(`🦠 ${malware.signature || "Unknown malware"}`);
        findings.push(`📁 Тип: ${malware.file_type}`);
        findings.push(`📅 Вперше: ${malware.first_seen}`);
        
        if (malware.tags && malware.tags.length > 0) {
          findings.push(`🏷️ Теги: ${malware.tags.join(", ")}`);
        }
      } else if (data.query_status === "hash_not_found") {
        findings.push("✅ В MalwareBazaar не знайдено");
      }
    }
  } catch {}
  
  // API: VirusTotal (uses key if available)
  const vtKey = process.env.VIRUSTOTAL_API_KEY;
  if (vtKey) {
    try {
      const response = await fetchWithTimeout(
        `https://www.virustotal.com/api/v3/files/${hash}`,
        5000,
        { headers: { 'x-apikey': vtKey } }
      );
      
      if (response.ok) {
        const data = await response.json();
        sources.push("VirusTotal");
        
        if (data.data?.attributes) {
          const attrs = data.data.attributes;
          const stats = attrs.last_analysis_stats;
          
          hashData.vtMalicious = stats.malicious || 0;
          hashData.vtSuspicious = stats.suspicious || 0;
          hashData.vtTotal = Object.values(stats).reduce((a: number, b: any) => a + b, 0);
          
          if (stats.malicious > 0) {
            riskScore += Math.min(stats.malicious * 5, 70);
            findings.push(`🔴 VirusTotal: ${stats.malicious}/${hashData.vtTotal} детекцій`);
          } else {
            findings.push(`✅ VirusTotal: 0/${hashData.vtTotal} детекцій`);
          }
          
          if (attrs.meaningful_name) {
            hashData.fileName = attrs.meaningful_name;
            findings.push(`📁 Файл: ${attrs.meaningful_name}`);
          }
          
          if (attrs.type_description) {
            hashData.fileType = attrs.type_description;
          }
        }
      } else if (response.status === 404) {
        findings.push("ℹ️ Хеш не знайдено в VirusTotal");
      }
    } catch {}
  }

  // Fallback: ThreatFox (free, no key needed)
  if (!vtKey) {
    try {
      const response = await fetchWithTimeout(
        'https://threatfox-api.abuse.ch/api/v1/',
        4000,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: "search_hash", hash })
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.query_status === "ok" && data.data && data.data.length > 0) {
          sources.push("ThreatFox");
          const ioc = data.data[0];
          riskScore += 60;
          findings.push(`🔴 IOC знайдено (ThreatFox: ${ioc.malware || "malware"})`);
          hashData.threatFoxMalware = ioc.malware || "Unknown";
          hashData.threatFoxThreatType = ioc.threat_type || "Unknown";
          hashData.threatFoxConfidence = ioc.confidence_level || 0;
          if (ioc.tags && ioc.tags.length > 0) {
            findings.push(`🏷️ Теги: ${ioc.tags.join(", ")}`);
          }
        } else if (data.query_status === "no_result") {
          sources.push("ThreatFox");
          findings.push("✅ В ThreatFox не знайдено");
        }
      }
    } catch {}
  }

  // API: CIRCL hashlookup (free, no key needed)
  try {
    const lookupType = hash.length === 32 ? 'md5' : hash.length === 40 ? 'sha1' : 'sha256';
    const response = await fetchWithTimeout(
      `https://hashlookup.circl.lu/lookup/${lookupType}/${hash}`,
      4000
    );
    if (response.ok) {
      const data = await response.json();
      if (data.FileName || data.KnownMalicious) {
        sources.push("CIRCL hashlookup");
        if (data.KnownMalicious) {
          riskScore += 50;
          findings.push("🔴 Відомий шкідливий (CIRCL)");
        } else {
          findings.push(`✅ Відомий файл: ${data.FileName || "N/A"} (CIRCL)`);
          hashData.circlFileName = data.FileName || null;
          hashData.circlFileSize = data.FileSize || null;
        }
        if (data.source) {
          hashData.circlSource = data.source;
        }
      }
    }
  } catch {}
  
  // API: URLhaus for hash (free)
  try {
    const formData = new FormData();
    formData.append('md5_hash', hash);
    
    const response = await fetchWithTimeout(
      'https://urlhaus-api.abuse.ch/v1/payload/',
      4000,
      { method: 'POST', body: formData }
    );
    
    if (response.ok) {
      const data = await response.json();
      sources.push("URLhaus");
      
      if (data.query_status === "ok") {
        riskScore += 50;
        findings.push("🔴 Знайдено в URLhaus!");
        hashData.urlhausStatus = "found";
        
        if (data.signature) {
          hashData.urlhausSignature = data.signature;
          findings.push(`🦠 Сигнатура: ${data.signature}`);
        }
      }
    }
  } catch {}
  

  if (findings.length <= 1) {
    findings.push("✅ Хеш чистий");
  }
  
  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "hash",
    target: hash.substring(0, 16) + "...",
    riskScore,
    riskLevel,
    summary: `Хеш (${hashData.type}) — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: hashData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== USERNAME CHECK (NEW) ====================
async function checkUsername(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  const usernameData: any = {};
  
  const username = value.trim().toLowerCase();
  usernameData.username = username;
  
  // Pattern analysis
  if (/^\d+$/.test(username)) {
    riskScore += 20;
    findings.push("⚠️ Тільки цифри");
  }
  
  if (username.length < 4) {
    riskScore += 15;
    findings.push("⚠️ Дуже короткий");
  }
  
  if (/[a-z]{10,}/.test(username) && !/[0-9]/.test(username)) {
    findings.push("✅ Читабельний username");
  }
  
  // Suspicious patterns
  const suspiciousPatterns = ["admin", "support", "official", "helper", "service", "moderator", "staff", "team"];
  const foundSuspicious = suspiciousPatterns.filter(p => username.includes(p));
  if (foundSuspicious.length > 0) {
    riskScore += 25;
    findings.push(`⚠️ Підозрілі слова: ${foundSuspicious.join(", ")}`);
    usernameData.suspiciousPatterns = foundSuspicious;
  }
  
  // Check on major platforms (public profile existence)
  const platforms: { name: string; url: string; checkFn: (resp: Response) => boolean }[] = [
    { name: "GitHub", url: `https://api.github.com/users/${username}`, checkFn: (r) => r.ok },
    { name: "Twitter/X", url: `https://api.twitter.com/2/users/by/username/${username}`, checkFn: (r) => r.ok },
  ];
  
  // GitHub check (free)
  try {
    const response = await fetchWithTimeout(`https://api.github.com/users/${username}`, 4000);
    if (response.ok) {
      const data = await response.json();
      sources.push("github.com");
      usernameData.github = {
        exists: true,
        name: data.name,
        bio: data.bio,
        followers: data.followers,
        publicRepos: data.public_repos,
        createdAt: data.created_at
      };
      findings.push(`✅ GitHub: @${username}`);
      findings.push(`👥 Фоловерів: ${data.followers}`);
      findings.push(`📦 Репозиторіїв: ${data.public_repos}`);
      
      if (data.followers < 5 && data.public_repos < 2) {
        riskScore += 10;
        findings.push("⚠️ Неактивний профіль GitHub");
      }
    } else if (response.status === 404) {
      usernameData.github = { exists: false };
      findings.push("❌ GitHub: не знайдено");
    }
  } catch {}
  
  // Instagram check (public page)
  try {
    const response = await fetchWithTimeout(`https://www.instagram.com/${username}/?__a=1&__d=dis`, 4000);
    // Note: Instagram blocks most scraping, this is just for demonstration
    if (response.ok) {
      sources.push("instagram.com");
      usernameData.instagram = { exists: true };
      findings.push(`📸 Instagram: @${username}`);
    }
  } catch {}
  
  // Calculate uniqueness score
  const platformsFound = [usernameData.github?.exists, usernameData.instagram?.exists].filter(Boolean).length;
  if (platformsFound === 0) {
    riskScore += 15;
    findings.push("⚠️ Не знайдено на платформах");
  } else {
    usernameData.platformsFound = platformsFound;
    findings.push(`🔍 Знайдено на ${platformsFound} платформах`);
  }
  
  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "username",
    target: username,
    riskScore,
    riskLevel,
    summary: `Username "${username}" — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: usernameData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== CARD BIN CHECK ====================
async function checkCard(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["binlist.net", "Локальний аналіз"];
  const cardData: any = {};
  
  // Clean input - remove spaces, dashes and extract first 6-8 digits as BIN
  const cleanedValue = value.replace(/[\s\-]/g, '').trim();
  const bin = cleanedValue.substring(0, 8); // Take first 8 digits max for BIN lookup
  cardData.fullInput = cleanedValue.length > 8 ? cleanedValue.substring(0, 4) + " **** **** " + cleanedValue.slice(-4) : cleanedValue;
  cardData.inputLength = cleanedValue.length;
  cardData.bin = bin;
  
  // Known fraud BIN patterns
  const fraudPatterns = ["400000", "411111", "444444"];
  if (fraudPatterns.some(pattern => bin.startsWith(pattern))) {
    riskScore += 25;
    findings.push("🔴 Відомий тестовий/фродовий BIN патерн");
    cardData.isFraudPattern = true;
  }
  
  // High-risk countries
  const highRiskCountries = ["RU", "CN", "NG", "BY", "IR", "KP"];
  
  // Fetch BIN data from binlist.net
  try {
    const response = await fetchWithTimeout(`https://lookup.binlist.net/${bin}`, 5000, {
      headers: {
        'Accept-Version': '3'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Extract brand (Visa/Mastercard/etc)
      if (data.scheme) {
        cardData.brand = data.scheme.charAt(0).toUpperCase() + data.scheme.slice(1);
        findings.push(`💳 Бренд: ${cardData.brand}`);
      }
      
      // Extract card type (debit/credit)
      if (data.type) {
        cardData.type = data.type;
        findings.push(`📋 Тип: ${data.type === 'debit' ? 'Дебетова' : data.type === 'credit' ? 'Кредитна' : data.type}`);
      }
      
      // Check if prepaid
      if (data.prepaid === true) {
        riskScore += 15;
        cardData.isPrepaid = true;
        findings.push("⚠️ Prepaid картка (підвищений ризик)");
      } else if (data.prepaid === false) {
        cardData.isPrepaid = false;
        findings.push("✅ Не prepaid картка");
      }
      
      // Extract bank info
      if (data.bank) {
        cardData.bank = {
          name: data.bank.name || "Невідомий",
          url: data.bank.url || null,
          phone: data.bank.phone || null,
          city: data.bank.city || null
        };
        
        if (data.bank.name) {
          findings.push(`🏦 Банк: ${data.bank.name}`);
        } else {
          riskScore += 10;
          findings.push("⚠️ Інформація про банк недоступна");
        }
      } else {
        riskScore += 10;
        cardData.bank = { name: "Невідомий", url: null, phone: null, city: null };
        findings.push("⚠️ Інформація про банк недоступна");
      }
      
      // Extract country
      if (data.country) {
        const cName = data.country.name || "Невідомо";
        const cCode = data.country.alpha2 || null;
        const cEmoji = data.country.emoji || "🌍";
        cardData.country = {
          name: cName,
          code: cCode,
          emoji: cEmoji,
          currency: data.country.currency || null,
          latitude: data.country.latitude || null,
          longitude: data.country.longitude || null
        };
        
        const countryDisplay = cEmoji !== "🌍" ? `${cEmoji} ${cName}` : cName;
        findings.push(`🌍 Країна: ${countryDisplay}`);
        
        // Check high-risk country
        if (data.country.alpha2 && highRiskCountries.includes(data.country.alpha2)) {
          riskScore += 20;
          findings.push("🔴 Країна підвищеного ризику");
          cardData.isHighRiskCountry = true;
        }
        
        if (data.country.currency) {
          findings.push(`💵 Валюта: ${data.country.currency}`);
        }
      }
      
      // Additional info
      if (data.number) {
        if (data.number.length) {
          cardData.cardNumberLength = data.number.length;
          findings.push(`🔢 Довжина номера: ${data.number.length} цифр`);
        }
        if (data.number.luhn !== undefined) {
          cardData.luhnValidation = data.number.luhn;
        }
      }
      
    } else if (response.status === 404) {
      riskScore += 15;
      findings.push("❌ BIN не знайдено в базі даних");
      cardData.notFound = true;
    } else if (response.status === 429) {
      findings.push("⚠️ Перевищено ліміт запитів до API");
    }
  } catch (error) {
    findings.push("⚠️ binlist.net недоступний");
  }
  
  // BIN range analysis
  const firstDigit = bin.charAt(0);
  const brandByFirstDigit: Record<string, string> = {
    "4": "Visa",
    "5": "Mastercard",
    "3": "Amex/JCB/Diners",
    "6": "Discover/UnionPay",
    "2": "Mastercard (2xxx range)"
  };
  
  if (!cardData.brand && brandByFirstDigit[firstDigit]) {
    cardData.estimatedBrand = brandByFirstDigit[firstDigit];
    findings.push(`📊 Оцінка за першою цифрою: ${brandByFirstDigit[firstDigit]}`);
  }
  
  if (findings.length === 0) {
    findings.push("✅ Базова перевірка пройшла");
  }
  
  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "card",
    target: bin,
    riskScore,
    riskLevel,
    summary: `BIN ${bin} — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: cardData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== PASSWORD STRENGTH CHECK ====================
async function checkPassword(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 0;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз", "HIBP (k-Anonymity)"];
  const passwordData: any = {};

  passwordData.length = value.length;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value);
  const hasUnicode = /[^\x00-\x7F]/.test(value);

  passwordData.hasUppercase = hasUpper;
  passwordData.hasLowercase = hasLower;
  passwordData.hasDigits = hasDigit;
  passwordData.hasSpecial = hasSpecial;
  passwordData.hasUnicode = hasUnicode;

  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasDigit) charsetSize += 10;
  if (hasSpecial) charsetSize += 32;
  if (hasUnicode) charsetSize += 100;

  const entropy = value.length * Math.log2(charsetSize || 1);
  passwordData.entropy = Math.round(entropy * 10) / 10;

  if (entropy < 28) {
    riskScore += 80;
    findings.push("🔴 Дуже слабкий пароль");
    passwordData.strength = "Дуже слабкий";
  } else if (entropy < 36) {
    riskScore += 60;
    findings.push("🟠 Слабкий пароль");
    passwordData.strength = "Слабкий";
  } else if (entropy < 60) {
    riskScore += 35;
    findings.push("🟡 Середній пароль");
    passwordData.strength = "Середній";
  } else if (entropy < 80) {
    riskScore += 15;
    findings.push("🟢 Надійний пароль");
    passwordData.strength = "Надійний";
  } else {
    riskScore += 5;
    findings.push("✅ Дуже надійний пароль");
    passwordData.strength = "Дуже надійний";
  }

  findings.push(`📏 Довжина: ${value.length} символів`);
  findings.push(`🔢 Ентропія: ${passwordData.entropy} біт`);
  findings.push(`📊 Charset: ${charsetSize} символів`);

  if (value.length < 8) {
    riskScore += 20;
    findings.push("🔴 Менше 8 символів");
  } else if (value.length >= 16) {
    findings.push("✅ 16+ символів — відмінна довжина");
  }

  if (!hasUpper) { riskScore += 5; findings.push("⚠️ Немає великих літер"); }
  if (!hasLower) { riskScore += 5; findings.push("⚠️ Немає малих літер"); }
  if (!hasDigit) { riskScore += 5; findings.push("⚠️ Немає цифр"); }
  if (!hasSpecial) { riskScore += 5; findings.push("⚠️ Немає спецсимволів"); }

  const commonPasswords = [
    "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
    "letmein", "trustno1", "dragon", "baseball", "iloveyou", "master", "sunshine",
    "ashley", "bailey", "shadow", "123123", "654321", "superman", "qazwsx",
    "michael", "football", "password1", "password123", "admin", "welcome",
    "hello", "charlie", "donald", "login", "starwars", "solo", "princess"
  ];
  if (commonPasswords.includes(value.toLowerCase())) {
    riskScore += 50;
    findings.push("🔴 Пароль у топ-100 найпоширеніших!");
    passwordData.isCommon = true;
  }

  const patterns = [
    { regex: /^(.)\1+$/, name: "повторення одного символу" },
    { regex: /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|qwe|wer|ert|rty|asd|sdf|dfg|zxc|xcv|cvb)/i, name: "послідовність клавіш" },
    { regex: /^(\d)\1{3,}/, name: "повторення цифр" },
    { regex: /^(19|20)\d{2}(0[1-9]|1[0-2])/, name: "дата (YYYYMM)" },
  ];
  for (const p of patterns) {
    if (p.regex.test(value)) {
      riskScore += 15;
      findings.push(`⚠️ Виявлено: ${p.name}`);
      passwordData.patternDetected = p.name;
    }
  }

  const crackTimes: Record<string, string> = {};
  const attemptsPerSecond = {
    "Online (100/s)": 100,
    "Offline Fast (10B/s)": 10_000_000_000,
    "Offline Slow (1M/s)": 1_000_000,
  };
  const totalCombinations = Math.pow(charsetSize || 1, value.length);
  for (const [name, speed] of Object.entries(attemptsPerSecond)) {
    const seconds = totalCombinations / speed / 2;
    if (seconds < 1) crackTimes[name] = "Миттєво";
    else if (seconds < 60) crackTimes[name] = `${Math.round(seconds)} секунд`;
    else if (seconds < 3600) crackTimes[name] = `${Math.round(seconds / 60)} хвилин`;
    else if (seconds < 86400) crackTimes[name] = `${Math.round(seconds / 3600)} годин`;
    else if (seconds < 31536000) crackTimes[name] = `${Math.round(seconds / 86400)} днів`;
    else if (seconds < 31536000 * 1000) crackTimes[name] = `${Math.round(seconds / 31536000)} років`;
    else crackTimes[name] = "1000+ років";
  }
  passwordData.crackTimes = crackTimes;
  findings.push(`⏱️ Онлайн-злам: ${crackTimes["Online (100/s)"]}`);
  findings.push(`💻 Офлайн-злам: ${crackTimes["Offline Slow (1M/s)"]}`);

  // HIBP k-Anonymity check
  try {
    const sha1 = await hashString(value);
    const prefix = sha1.substring(0, 5).toUpperCase();
    const suffix = sha1.substring(5).toUpperCase();

    const response = await fetchWithTimeout(`https://api.pwnedpasswords.com/range/${prefix}`, 4000);
    if (response.ok) {
      const text = await response.text();
      const lines = text.split('\n');
      const match = lines.find(line => line.startsWith(suffix));
      if (match) {
        const count = parseInt(match.split(':')[1].trim());
        riskScore += 40;
        passwordData.breachCount = count;
        findings.push(`🔴 Знайдено в ${count.toLocaleString()} витоках даних!`);
      } else {
        findings.push("✅ Не знайдено в витоках (HIBP)");
        passwordData.breachCount = 0;
      }
    }
  } catch {}

  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);

  return {
    type: "password",
    target: "●".repeat(Math.min(value.length, 20)),
    riskScore,
    riskLevel,
    summary: `Пароль — ${passwordData.strength} (${riskScore}/100)`,
    details: passwordData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== DNS RECORDS CHECK ====================
async function checkDNS(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = [];
  const dnsData: any = {};

  const domain = value.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('?')[0];
  dnsData.domain = domain;

  const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA'];

  const dnsResults = await Promise.allSettled(
    recordTypes.map(async (type) => {
      const response = await fetchWithTimeout(`https://dns.google/resolve?name=${domain}&type=${type}`, 3000);
      if (!response.ok) return { type, records: null };
      const data = await response.json();
      const records = data.Answer?.map((a: any) => a.data).filter(Boolean) || [];
      return { type, records: records.length > 0 ? records : null };
    })
  );

  for (const result of dnsResults) {
    if (result.status !== "fulfilled") continue;
    const { type, records } = result.value;
    if (!sources.includes("dns.google")) sources.push("dns.google");

    if (records && records.length > 0) {
      dnsData[`${type}_records`] = records;

      switch (type) {
        case 'A':
          findings.push(`📍 A записи: ${records.slice(0, 3).join(", ")}${records.length > 3 ? "..." : ""}`);
          dnsData.ipCount = records.length;
          if (records.length > 5) {
            findings.push("⚡ CDN/Load Balancer (багато A записів)");
          }
          break;
        case 'AAAA':
          findings.push(`🌐 IPv6: ${records.length} записів`);
          dnsData.hasIPv6 = true;
          break;
        case 'MX':
          findings.push(`📧 MX: ${records.slice(0, 2).map((r: string) => r.split(' ').pop()).join(", ")}`);
          dnsData.hasMX = true;
          const mxProviders: Record<string, string> = {
            "google": "Google Workspace",
            "outlook": "Microsoft 365",
            "protonmail": "ProtonMail",
            "zoho": "Zoho Mail",
            "yandex": "Yandex Mail"
          };
          for (const [key, provider] of Object.entries(mxProviders)) {
            if (records.some((r: string) => r.toLowerCase().includes(key))) {
              findings.push(`📬 Пошта: ${provider}`);
              dnsData.mailProvider = provider;
              break;
            }
          }
          break;
        case 'NS':
          findings.push(`🔧 NS: ${records.slice(0, 3).map((r: string) => r.replace(/\.$/, '')).join(", ")}`);
          const nsProviders: Record<string, string> = {
            "cloudflare": "Cloudflare",
            "awsdns": "AWS Route53",
            "azure": "Azure DNS",
            "google": "Google DNS",
            "digitalocean": "DigitalOcean"
          };
          for (const [key, provider] of Object.entries(nsProviders)) {
            if (records.some((r: string) => r.toLowerCase().includes(key))) {
              findings.push(`☁️ DNS-провайдер: ${provider}`);
              dnsData.dnsProvider = provider;
              break;
            }
          }
          break;
        case 'TXT':
          dnsData.txtCount = records.length;
          const spfRecord = records.find((r: string) => r.includes('v=spf'));
          const dmarcCheck = records.find((r: string) => r.includes('v=DMARC'));
          const dkimHint = records.find((r: string) => r.includes('v=DKIM'));
          const googleVerify = records.find((r: string) => r.includes('google-site-verification'));

          if (spfRecord) {
            findings.push("✅ SPF запис знайдено");
            dnsData.hasSPF = true;
            if (spfRecord.includes('-all')) {
              findings.push("🔒 Strict SPF (-all)");
            } else if (spfRecord.includes('~all')) {
              findings.push("⚠️ Soft-fail SPF (~all)");
              riskScore += 5;
            }
          } else {
            riskScore += 15;
            findings.push("🔴 Немає SPF (спам-ризик)");
            dnsData.hasSPF = false;
          }

          if (googleVerify) findings.push("🔍 Google Site Verification");
          findings.push(`📝 TXT записів: ${records.length}`);
          break;
        case 'CNAME':
          findings.push(`🔗 CNAME: ${records[0]}`);
          break;
        case 'SOA':
          const soaParts = records[0]?.split(' ');
          if (soaParts && soaParts.length >= 2) {
            dnsData.primaryNS = soaParts[0];
            dnsData.adminEmail = soaParts[1]?.replace(/\.$/, '').replace('.', '@');
          }
          break;
        case 'CAA':
          findings.push(`🔐 CAA: ${records.slice(0, 2).join(", ")}`);
          dnsData.hasCAA = true;
          break;
      }
    } else if (type === 'A') {
      riskScore += 20;
      findings.push("⚠️ Немає A записів!");
      dnsData.hasARecord = false;
    }
  }

  // DMARC check (separate _dmarc subdomain)
  try {
    const response = await fetchWithTimeout(`https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`, 3000);
    if (response.ok) {
      const data = await response.json();
      if (data.Answer && data.Answer.length > 0) {
        const dmarcRecord = data.Answer.find((a: any) => a.data?.includes('v=DMARC'));
        if (dmarcRecord) {
          findings.push("✅ DMARC знайдено");
          dnsData.hasDMARC = true;
          const policy = dmarcRecord.data.match(/p=(\w+)/);
          if (policy) {
            dnsData.dmarcPolicy = policy[1];
            if (policy[1] === 'reject') findings.push("🔒 DMARC: reject (максимальний захист)");
            else if (policy[1] === 'quarantine') findings.push("🟡 DMARC: quarantine");
            else {
              riskScore += 10;
              findings.push("⚠️ DMARC: none (без дій)");
            }
          }
        }
      } else {
        riskScore += 10;
        findings.push("🔴 Немає DMARC");
        dnsData.hasDMARC = false;
      }
    }
  } catch {}

  // DNSSEC check
  try {
    const response = await fetchWithTimeout(`https://dns.google/resolve?name=${domain}&type=DNSKEY`, 3000);
    if (response.ok) {
      const data = await response.json();
      if (data.Answer && data.Answer.length > 0) {
        findings.push("✅ DNSSEC активний");
        dnsData.hasDNSSEC = true;
      } else {
        riskScore += 5;
        findings.push("⚠️ DNSSEC не налаштований");
        dnsData.hasDNSSEC = false;
      }
    }
  } catch {}

  dnsData.totalRecords = recordTypes.reduce((sum, type) => {
    const records = dnsData[`${type}_records`];
    return sum + (records ? records.length : 0);
  }, 0);

  findings.push(`📊 Всього записів: ${dnsData.totalRecords}`);

  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);

  return {
    type: "dns",
    target: domain,
    riskScore,
    riskLevel,
    summary: `DNS ${domain} — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: dnsData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== SSL CERTIFICATE CHECK (STANDALONE) ====================
async function checkSSL(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = [];
  const sslData: any = {};

  const domain = value.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('?')[0];
  sslData.domain = domain;

  const { certificateInfo, findings: sslFindings } = await checkSSLCertificate(domain, sources);

  if (certificateInfo.valid) {
    sslData.certificate = certificateInfo;

    if (certificateInfo.isExpired) {
      riskScore += 60;
      findings.push("🔴 Сертифікат ПРОСТРОЧЕНИЙ!");
    } else if (certificateInfo.daysUntilExpiry !== undefined) {
      if (certificateInfo.daysUntilExpiry < 7) {
        riskScore += 40;
        findings.push(`🔴 Експайрує за ${certificateInfo.daysUntilExpiry} днів!`);
      } else if (certificateInfo.daysUntilExpiry < 30) {
        riskScore += 25;
        findings.push(`⚠️ Експайрує за ${certificateInfo.daysUntilExpiry} днів`);
      } else if (certificateInfo.daysUntilExpiry < 90) {
        riskScore += 10;
        findings.push(`🟡 Експайрує за ${certificateInfo.daysUntilExpiry} днів`);
      } else {
        findings.push(`✅ Дійсний ще ${certificateInfo.daysUntilExpiry} днів`);
      }
    }

    if (certificateInfo.issuer) {
      findings.push(`🏢 Видавець: ${certificateInfo.issuer}`);
      const trustedIssuers = ["Let's Encrypt", "DigiCert", "Sectigo", "GlobalSign", "Comodo", "GeoTrust", "Thawte"];
      if (trustedIssuers.some(i => certificateInfo.issuer!.includes(i))) {
        findings.push("✅ Довірений CA");
        sslData.trustedIssuer = true;
      }
    }

    if (certificateInfo.commonName) {
      findings.push(`📛 CN: ${certificateInfo.commonName}`);
      sslData.commonName = certificateInfo.commonName;
      if (certificateInfo.commonName !== domain && !certificateInfo.commonName.startsWith('*.')) {
        riskScore += 15;
        findings.push("⚠️ CN не збігається з доменом");
      }
    }

    if (certificateInfo.subjectAltNames) {
      sslData.sanCount = certificateInfo.subjectAltNames.length;
      findings.push(`🔗 SAN доменів: ${certificateInfo.subjectAltNames.length}`);
      if (certificateInfo.subjectAltNames.length > 20) {
        findings.push("⚠️ Багато SAN — можливо shared hosting");
        riskScore += 5;
      }
    }

    if (certificateInfo.signatureAlgorithm) {
      sslData.algorithm = certificateInfo.signatureAlgorithm;
      if (certificateInfo.signatureAlgorithm.includes('sha1') || certificateInfo.signatureAlgorithm.includes('SHA1')) {
        riskScore += 30;
        findings.push("🔴 Застарілий SHA-1 алгоритм!");
      } else if (certificateInfo.signatureAlgorithm.includes('sha256') || certificateInfo.signatureAlgorithm.includes('SHA256')) {
        findings.push("✅ SHA-256 алгоритм");
      } else if (certificateInfo.signatureAlgorithm.includes('sha384') || certificateInfo.signatureAlgorithm.includes('SHA384')) {
        findings.push("✅ SHA-384 алгоритм (високий рівень)");
      }
    }

    if (certificateInfo.issuedDate) findings.push(`📅 Виданий: ${certificateInfo.issuedDate}`);
    if (certificateInfo.expiryDate) findings.push(`📅 Дійсний до: ${certificateInfo.expiryDate}`);
    if (certificateInfo.certificateCount) {
      sslData.totalCerts = certificateInfo.certificateCount;
      findings.push(`📜 Сертифікатів в ланцюжку: ${certificateInfo.certificateCount}`);
    }

    findings.push(...sslFindings.filter(f => !findings.includes(f)));
  } else {
    riskScore += 50;
    findings.push("🔴 SSL сертифікат не знайдено!");
    findings.push(...sslFindings);
  }

  // Additional: Check HTTP headers for security
  try {
    const response = await fetchWithTimeout(`https://${domain}`, 5000);
    if (response.ok || response.status < 500) {
      sources.push(`${domain} (HTTP)`);
      const hsts = response.headers.get('strict-transport-security');
      if (hsts) {
        findings.push("✅ HSTS активний");
        sslData.hasHSTS = true;
        if (hsts.includes('includeSubDomains')) findings.push("🔒 HSTS includeSubDomains");
        if (hsts.includes('preload')) findings.push("🔒 HSTS preload");
      } else {
        riskScore += 10;
        findings.push("⚠️ Немає HSTS");
        sslData.hasHSTS = false;
      }
    }
  } catch {}

  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);

  return {
    type: "ssl",
    target: domain,
    riskScore,
    riskLevel,
    summary: `SSL ${domain} — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: sslData,
    findings,
    sources,
    timestamp,
  };
}

// ==================== MAC ADDRESS CHECK ====================
async function checkMAC(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  const macData: any = {};

  const cleanMac = value.replace(/[\s\-:\.]/g, '').toUpperCase();
  macData.rawInput = value;
  macData.normalized = cleanMac.match(/.{1,2}/g)?.join(':') || cleanMac;
  macData.oui = cleanMac.substring(0, 6);

  const isMulticast = (parseInt(cleanMac.substring(0, 2), 16) & 1) === 1;
  const isLocallyAdmin = (parseInt(cleanMac.substring(0, 2), 16) & 2) === 2;

  macData.isMulticast = isMulticast;
  macData.isLocallyAdministered = isLocallyAdmin;

  if (isMulticast) {
    riskScore += 15;
    findings.push("📡 Multicast адреса");
  } else {
    findings.push("📍 Unicast адреса");
  }

  if (isLocallyAdmin) {
    riskScore += 10;
    findings.push("⚠️ Locally Administered (можливо змінена)");
  } else {
    findings.push("✅ Globally Unique (заводська)");
  }

  const specialMacs: Record<string, string> = {
    "FF:FF:FF:FF:FF:FF": "Broadcast адреса",
    "00:00:00:00:00:00": "Нульова адреса",
    "01:00:5E": "IPv4 Multicast (IANA)",
    "33:33": "IPv6 Multicast",
    "01:80:C2": "IEEE 802.1 Spanning Tree",
  };

  for (const [mac, desc] of Object.entries(specialMacs)) {
    const cleanSpecial = mac.replace(/:/g, '');
    if (cleanMac.startsWith(cleanSpecial)) {
      riskScore += 20;
      findings.push(`⚠️ Спеціальна: ${desc}`);
      macData.specialType = desc;
      break;
    }
  }

  // API: macvendors.co (free)
  try {
    const response = await fetchWithTimeout(`https://api.macvendors.com/${cleanMac.substring(0, 6)}`, 4000);
    if (response.ok) {
      const vendor = await response.text();
      sources.push("macvendors.com");
      macData.vendor = vendor;
      findings.push(`🏭 Виробник: ${vendor}`);

      const knownVendors: Record<string, { type: string; risk: number }> = {
        "apple": { type: "Apple Device", risk: 0 },
        "samsung": { type: "Samsung Device", risk: 0 },
        "intel": { type: "Intel Network", risk: 0 },
        "cisco": { type: "Cisco Networking", risk: 0 },
        "huawei": { type: "Huawei Device", risk: 5 },
        "tp-link": { type: "TP-Link Device", risk: 0 },
        "realtek": { type: "Realtek (часто VM/вбудований)", risk: 5 },
        "vmware": { type: "VMware Virtual", risk: 15 },
        "microsoft": { type: "Microsoft/Hyper-V", risk: 10 },
        "oracle": { type: "Oracle VirtualBox", risk: 15 },
        "xen": { type: "Xen Virtual", risk: 15 },
        "qemu": { type: "QEMU Virtual", risk: 15 },
      };

      const vendorLower = vendor.toLowerCase();
      for (const [key, info] of Object.entries(knownVendors)) {
        if (vendorLower.includes(key)) {
          findings.push(`📱 Тип: ${info.type}`);
          macData.deviceType = info.type;
          riskScore += info.risk;
          if (info.risk > 0) {
            findings.push("⚠️ Можливо віртуальна машина");
            macData.possibleVM = true;
          }
          break;
        }
      }
    } else if (response.status === 404) {
      riskScore += 15;
      findings.push("❌ OUI не знайдено (невідомий виробник)");
      macData.vendorFound = false;
    }
  } catch {
    findings.push("⚠️ API виробника недоступний");
  }

  // EUI type
  if (cleanMac.length === 12) {
    findings.push("📋 EUI-48 (стандартний MAC)");
    macData.type = "EUI-48";
  } else if (cleanMac.length === 16) {
    findings.push("📋 EUI-64 (розширений MAC)");
    macData.type = "EUI-64";
  }

  if (findings.length <= 2) {
    findings.push("✅ Базова перевірка пройшла");
  }

  riskScore = Math.min(riskScore, 100);
  const riskLevel = getRiskLevel(riskScore);

  return {
    type: "mac",
    target: macData.normalized,
    riskScore,
    riskLevel,
    summary: `MAC ${macData.normalized} — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details: macData,
    findings,
    sources,
    timestamp,
  };
}

export async function extractExifFromBuffer(buffer: Buffer, filename: string): Promise<CheckResult> {
  const timestamp = new Date();
  const findings: string[] = [];
  const sources: string[] = ["EXIF metadata"];
  let riskScore = 0;
  const details: Record<string, any> = { filename };

  try {
    const exifData = await exifr.parse(buffer, {
      gps: true,
      ifd0: true,
      exif: true,
      iptc: true,
      xmp: true,
      tiff: true,
    });

    if (!exifData || Object.keys(exifData).length === 0) {
      findings.push("No EXIF metadata found — file may have been stripped");
      return {
        type: "exif",
        target: filename,
        riskScore: 0,
        riskLevel: "low",
        summary: `EXIF analysis for ${filename} — no metadata found`,
        details: { filename, metadata: null },
        findings,
        sources,
        timestamp,
      };
    }

    if (exifData.Make) {
      details.camera = `${exifData.Make} ${exifData.Model || ""}`.trim();
      findings.push(`Camera: ${details.camera}`);
    }
    if (exifData.LensModel) {
      details.lens = exifData.LensModel;
      findings.push(`Lens: ${details.lens}`);
    }
    if (exifData.Software) {
      details.software = exifData.Software;
      findings.push(`Software: ${details.software}`);
    }
    if (exifData.DateTimeOriginal) {
      details.dateOriginal = exifData.DateTimeOriginal;
      findings.push(`Date taken: ${new Date(exifData.DateTimeOriginal).toLocaleString()}`);
    }
    if (exifData.CreateDate) {
      details.createDate = exifData.CreateDate;
    }
    if (exifData.ModifyDate) {
      details.modifyDate = exifData.ModifyDate;
      findings.push(`Last modified: ${new Date(exifData.ModifyDate).toLocaleString()}`);
    }
    if (exifData.ImageWidth && exifData.ImageHeight) {
      details.resolution = `${exifData.ImageWidth}x${exifData.ImageHeight}`;
      findings.push(`Resolution: ${details.resolution}`);
    } else if (exifData.ExifImageWidth && exifData.ExifImageHeight) {
      details.resolution = `${exifData.ExifImageWidth}x${exifData.ExifImageHeight}`;
      findings.push(`Resolution: ${details.resolution}`);
    }
    if (exifData.ISO || exifData.ISOSpeedRatings) {
      details.iso = exifData.ISO || exifData.ISOSpeedRatings;
      findings.push(`ISO: ${details.iso}`);
    }
    if (exifData.FNumber) {
      details.aperture = `f/${exifData.FNumber}`;
      findings.push(`Aperture: ${details.aperture}`);
    }
    if (exifData.ExposureTime) {
      const expTime = exifData.ExposureTime < 1 ? `1/${Math.round(1 / exifData.ExposureTime)}` : `${exifData.ExposureTime}`;
      details.exposureTime = expTime;
      findings.push(`Exposure: ${expTime}s`);
    }
    if (exifData.FocalLength) {
      details.focalLength = `${exifData.FocalLength}mm`;
      findings.push(`Focal length: ${details.focalLength}`);
    }
    if (exifData.Flash !== undefined) {
      details.flash = exifData.Flash;
      findings.push(`Flash: ${typeof exifData.Flash === 'object' ? JSON.stringify(exifData.Flash) : exifData.Flash}`);
    }

    if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
      details.gps = {
        latitude: exifData.latitude,
        longitude: exifData.longitude,
      };
      findings.push(`📍 GPS: ${exifData.latitude.toFixed(6)}, ${exifData.longitude.toFixed(6)}`);
      riskScore += 40;

      try {
        const geoRes = await fetchWithTimeout(`https://nominatim.openstreetmap.org/reverse?lat=${exifData.latitude}&lon=${exifData.longitude}&format=json&accept-language=en`, 5000, {
          headers: { "User-Agent": "DarkShare-OSINT/1.0" }
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.display_name) {
            details.gps.address = geoData.display_name;
            findings.push(`📍 Location: ${geoData.display_name}`);
          }
          if (geoData.address) {
            details.gps.country = geoData.address.country;
            details.gps.city = geoData.address.city || geoData.address.town || geoData.address.village;
          }
        }
      } catch (e) {}
    }

    if (exifData.GPSAltitude) {
      details.altitude = `${exifData.GPSAltitude.toFixed(1)}m`;
      findings.push(`Altitude: ${details.altitude}`);
    }

    if (exifData.Artist || exifData.Copyright) {
      details.author = exifData.Artist || exifData.Copyright;
      findings.push(`Author/Copyright: ${details.author}`);
      riskScore += 10;
    }

    if (exifData.SerialNumber || exifData.BodySerialNumber) {
      details.serialNumber = exifData.SerialNumber || exifData.BodySerialNumber;
      findings.push(`⚠️ Camera serial: ${details.serialNumber}`);
      riskScore += 20;
    }

    if (exifData.OwnerName) {
      details.ownerName = exifData.OwnerName;
      findings.push(`⚠️ Owner name: ${details.ownerName}`);
      riskScore += 15;
    }

    const hasGPS = details.gps !== undefined;
    const hasPersonalInfo = details.serialNumber || details.ownerName || details.author;
    if (hasGPS && hasPersonalInfo) riskScore += 15;

    details.totalFieldsFound = Object.keys(exifData).length;
    findings.push(`Total metadata fields: ${details.totalFieldsFound}`);

  } catch (e: any) {
    findings.push(`Error parsing EXIF: ${e.message}`);
  }

  riskScore = Math.min(riskScore, 100);

  const riskLevel: "low" | "medium" | "high" | "critical" = 
    riskScore >= 70 ? "critical" :
    riskScore >= 50 ? "high" :
    riskScore >= 25 ? "medium" : "low";

  return {
    type: "exif",
    target: filename,
    riskScore,
    riskLevel,
    summary: `EXIF analysis for ${filename} — ${riskLevel.toUpperCase()} (${riskScore}/100)`,
    details,
    findings,
    sources,
    timestamp,
  };
}
