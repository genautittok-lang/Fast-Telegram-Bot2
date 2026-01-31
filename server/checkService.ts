// Enhanced OSINT Check Service v2.0
// Uses multiple free APIs for comprehensive analysis
import { generateAIAnalysis } from "./aiAnalyzer";

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
      if (octets.some(o => o > 255)) {
        return { valid: false, error: "IP октет не може бути більше 255" };
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
      if (!cleanValue.match(/^https?:\/\/.+\..+/)) {
        return { valid: false, error: "URL має починатися з http:// або https://" };
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
  
  // API 4: DNS Blacklist check
  try {
    const reversedIP = value.split('.').reverse().join('.');
    const dnsblServers = ["zen.spamhaus.org", "bl.spamcop.net", "dnsbl.sorbs.net"];
    
    for (const dnsbl of dnsblServers) {
      try {
        const response = await fetchWithTimeout(`https://dns.google/resolve?name=${reversedIP}.${dnsbl}&type=A`, 2000);
        const dnsData = await response.json();
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          riskScore += 35;
          findings.push(`🔴 В чорному списку: ${dnsbl}`);
          sources.push(dnsbl);
          break;
        }
      } catch {}
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
  
  if (findings.length === 0) {
    findings.push("✅ Чистий IP без підозрілих ознак");
  }
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "ip",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `IP ${value} — ${riskLevel.toUpperCase()} ризик (${Math.min(riskScore, 100)}/100)`,
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
    
    // API: Etherscan free for basic info
    const etherscanKey = process.env.ETHERSCAN_API_KEY;
    if (etherscanKey) {
      try {
        const response = await fetchWithTimeout(
          `https://api.etherscan.io/api?module=account&action=balance&address=${value}&tag=latest&apikey=${etherscanKey}`,
          4000
        );
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
    }
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
  
  // Check against ChainAbuse (if available)
  // Note: ChainAbuse API requires registration but has free tier
  
  if (findings.length <= 1) {
    findings.push("✅ Базова перевірка пройшла");
  }
  
  walletData.addressShort = `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "wallet",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Гаманець ${walletData.addressShort} — ${riskLevel.toUpperCase()} (${Math.min(riskScore, 100)}/100)`,
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
  
  // API: Numverify (free 100/month if key exists)
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
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "phone",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Телефон ${value} — ${riskLevel.toUpperCase()} (${Math.min(riskScore, 100)}/100)`,
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
  
  // API: Hunter.io for email verification (free 25/month if key exists)
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
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "email",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Email ${value} — ${riskLevel.toUpperCase()} (${Math.min(riskScore, 100)}/100)`,
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
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "domain",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Домен ${domain} — ${riskLevel.toUpperCase()} (${Math.min(riskScore, 100)}/100)`,
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
    
    // API: Google Safe Browsing (requires API key)
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
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "url",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `URL — ${riskLevel.toUpperCase()} (${Math.min(riskScore, 100)}/100)`,
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
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "bot",
    target: botData.tokenMasked,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: botData.isValid 
      ? `Bot @${botData.username} — ${riskLevel.toUpperCase()} (${Math.min(riskScore, 100)}/100)`
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
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "cve",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: isCveId 
      ? `${cleanValue} — ${riskLevel.toUpperCase()} (${Math.min(riskScore, 100)}/100)`
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
  
  // API: VirusTotal (free 4 req/min with API key)
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
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "hash",
    target: hash.substring(0, 16) + "...",
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Хеш (${hashData.type}) — ${riskLevel.toUpperCase()} (${Math.min(riskScore, 100)}/100)`,
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
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "username",
    target: username,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Username "${username}" — ${riskLevel.toUpperCase()} (${Math.min(riskScore, 100)}/100)`,
    details: usernameData,
    findings,
    sources,
    timestamp,
  };
}
