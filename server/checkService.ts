// Shared check logic for both bot and web API
// Uses real free APIs where possible

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
}

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export function validateInput(type: string, value: string): { valid: boolean; error?: string } {
  // Clean value for validation
  const cleanValue = value.trim();
  
  switch (type) {
    case "ip":
      // Accept IPv4 addresses
      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanValue)) {
        return { valid: false, error: "Невірний формат IP. Приклад: 8.8.8.8" };
      }
      break;
    case "wallet":
      // Accept various crypto wallet/exchange formats:
      // - Ethereum (0x...) 40+ chars
      // - Bitcoin legacy (1...) 26-35 chars
      // - Bitcoin SegWit (3...) 26-35 chars
      // - Bitcoin Bech32 (bc1...) 42+ chars
      // - Tron (T...) 34 chars
      // - Solana (base58) 32-44 chars
      // - Bybit/Binance UID (numbers only) 6-12 chars
      // - Litecoin (L..., M..., ltc1...) 26-43 chars
      // - Ripple (r...) 25-35 chars
      // - Dogecoin (D...) 26-34 chars
      const isEth = cleanValue.startsWith("0x") && cleanValue.length >= 40;
      const isBtcLegacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(cleanValue);
      const isBtcBech32 = cleanValue.startsWith("bc1") && cleanValue.length >= 40;
      const isTron = cleanValue.startsWith("T") && cleanValue.length === 34;
      const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanValue);
      const isExchangeUID = /^\d{6,12}$/.test(cleanValue); // Bybit, Binance UID
      const isLitecoin = /^[LM][a-km-zA-HJ-NP-Z1-9]{25,33}$/.test(cleanValue) || (cleanValue.startsWith("ltc1") && cleanValue.length >= 40);
      const isRipple = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(cleanValue);
      const isDogecoin = /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{24,32}$/.test(cleanValue);
      
      if (!isEth && !isBtcLegacy && !isBtcBech32 && !isTron && !isSolana && !isExchangeUID && !isLitecoin && !isRipple && !isDogecoin) {
        return { valid: false, error: "Невірний формат. Підтримуються: ETH, BTC, TRX, SOL, LTC, XRP, DOGE, Bybit/Binance UID" };
      }
      break;
    case "email":
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
        return { valid: false, error: "Невірний email. Приклад: user@example.com" };
      }
      break;
    case "domain":
      // Domain validation (with or without protocol)
      const domainOnly = cleanValue.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(domainOnly) && domainOnly.length < 4) {
        return { valid: false, error: "Невірний домен. Приклад: example.com" };
      }
      break;
    case "url":
      // More flexible URL validation
      if (!cleanValue.match(/^https?:\/\/.+\..+/)) {
        return { valid: false, error: "URL має починатися з http:// або https://" };
      }
      break;
    case "phone":
      // Accept various phone formats: +380..., 380..., 0..., with/without spaces/dashes
      const phoneClean = cleanValue.replace(/[\s\-\(\)]/g, '');
      if (!/^[\+]?[0-9]{6,15}$/.test(phoneClean)) {
        return { valid: false, error: "Невірний номер. Приклад: +380501234567" };
      }
      break;
    case "bot":
      // Telegram bot token format: number:alphanumeric (e.g., 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
      if (!/^\d{8,12}:[A-Za-z0-9_-]{35}$/.test(cleanValue)) {
        return { valid: false, error: "Невірний формат токену. Приклад: 123456789:ABCdefGHI..." };
      }
      break;
  }
  return { valid: true };
}

export async function performCheck(type: string, value: string): Promise<CheckResult> {
  const timestamp = new Date();
  
  switch (type) {
    case "ip":
      return await checkIP(value, timestamp);
    case "wallet":
      return await checkWallet(value, timestamp);
    case "phone":
      return await checkPhone(value, timestamp);
    case "email":
      return await checkEmail(value, timestamp);
    case "domain":
      return await checkDomain(value, timestamp);
    case "url":
      return await checkURL(value, timestamp);
    case "bot":
      return await checkBot(value, timestamp);
    default:
      throw new Error(`Unknown check type: ${type}`);
  }
}

function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

async function checkIP(value: string, timestamp: Date): Promise<CheckResult> {
  let ipData: any = null;
  let abuseData: any = null;
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = [];
  
  // API 1: ip-api.com (free, no key needed)
  try {
    const response = await fetchWithTimeout(`http://ip-api.com/json/${value}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,mobile,query`);
    ipData = await response.json();
    sources.push("ip-api.com");
    
    if (ipData.status === "success") {
      if (ipData.proxy) {
        riskScore += 35;
        findings.push("🔴 Виявлено VPN/Proxy сервіс");
      }
      if (ipData.hosting) {
        riskScore += 25;
        findings.push("🟠 IP належить до datacenter/хостинг-провайдера");
      }
      if (ipData.mobile) {
        findings.push("📱 Мобільний оператор");
      }
      
      // Check for high-risk countries
      const highRiskCountries = ["RU", "CN", "KP", "IR", "NG", "VN"];
      if (highRiskCountries.includes(ipData.countryCode)) {
        riskScore += 15;
        findings.push(`⚠️ Країна з підвищеним ризиком (${ipData.country})`);
      }
      
      // Check for cloud providers
      const cloudProviders = ["digital ocean", "amazon", "google cloud", "azure", "vultr", "linode", "ovh", "hetzner", "contabo"];
      if (cloudProviders.some(p => ipData.isp?.toLowerCase().includes(p) || ipData.org?.toLowerCase().includes(p))) {
        riskScore += 20;
        findings.push("☁️ Cloud-провайдер (часто використовується ботами)");
      }
      
      // Check for TOR exit nodes pattern
      if (ipData.org?.toLowerCase().includes("tor") || ipData.isp?.toLowerCase().includes("tor")) {
        riskScore += 50;
        findings.push("🔴 Можливий TOR exit node");
      }
    }
  } catch (error) {
    findings.push("⚠️ ip-api.com недоступний");
  }
  
  // API 2: ipinfo.io (free tier, no key for basic info)
  try {
    const response = await fetchWithTimeout(`https://ipinfo.io/${value}/json`);
    const ipInfoData = await response.json();
    sources.push("ipinfo.io");
    
    if (ipInfoData && !ipInfoData.error) {
      if (!ipData) {
        ipData = {};
      }
      ipData.hostname = ipInfoData.hostname || null;
      ipData.asn = ipInfoData.org || ipData?.as;
      
      if (ipInfoData.hostname?.includes("bot") || ipInfoData.hostname?.includes("crawler")) {
        riskScore += 20;
        findings.push("🤖 Hostname вказує на бота/crawler");
      }
    }
  } catch (error) {
    // Silent fail for secondary API
  }
  
  // API 3: Check against open blacklists (dns based)
  try {
    const reversedIP = value.split('.').reverse().join('.');
    const dnsblServers = ["zen.spamhaus.org", "bl.spamcop.net"];
    for (const dnsbl of dnsblServers) {
      try {
        const response = await fetchWithTimeout(`https://dns.google/resolve?name=${reversedIP}.${dnsbl}&type=A`, 2000);
        const dnsData = await response.json();
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          riskScore += 40;
          findings.push(`🔴 IP в чорному списку: ${dnsbl}`);
          sources.push(dnsbl);
          break;
        }
      } catch {
        // Skip if DNS check fails
      }
    }
  } catch (error) {
    // Silent fail
  }
  
  if (findings.length === 0) {
    findings.push("✅ Чиста IP-адреса без підозрілих ознак");
  }
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "ip",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `IP ${value} — ${riskLevel.toUpperCase()} ризик (${riskScore}/100)`,
    details: ipData?.status === "success" || ipData?.country ? {
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
    } : {
      error: "Не вдалось отримати дані",
    },
    findings,
    sources,
    timestamp,
  };
}

async function checkWallet(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  let walletData: any = {};
  
  const address = value.toLowerCase();
  
  // Known dangerous addresses (mixers, sanctioned, scam)
  const dangerousAddresses: Record<string, string> = {
    "0x722122df12d4e14e13ac3b6895a86e84145b6967": "Tornado Cash (OFAC Sanctioned)",
    "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b": "Tornado Cash Router",
    "0x23773e65ed146a459791799d01336db287f25334": "Tornado Cash Deployer",
    "0x8589427373d6d84e98730d7795d8f6f8731fda16": "Ronin Bridge Exploiter",
    "0x098b716b8aaf21512996dc57eb0615e2383e2f96": "Ronin Bridge Exploiter 2",
    "0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b": "Harmony Bridge Exploiter",
    "0x0ee5067b06776a89ccc7dc6b99b2c82c30c50cb3": "Known Phishing",
    "0x3cfcd56cd36c086bf48d4ac1a7acc5631e36a11e": "Known Drainer",
  };
  
  // Check against known dangerous addresses
  for (const [addr, description] of Object.entries(dangerousAddresses)) {
    if (address === addr.toLowerCase()) {
      riskScore += 90;
      findings.push(`🔴 КРИТИЧНО: ${description}`);
      walletData.sanctioned = true;
      walletData.sanctionReason = description;
    }
  }
  
  // Check address format
  if (address.length === 42 && address.startsWith("0x")) {
    findings.push("✅ Валідна Ethereum/EVM адреса");
    walletData.chain = "Ethereum/EVM Compatible";
    walletData.addressFormat = "Valid ERC-20";
    
    // Checksum validation
    const hasChecksum = /[A-F]/.test(value.slice(2));
    walletData.hasChecksum = hasChecksum;
    if (hasChecksum) {
      findings.push("🔒 Адреса з checksum (захист від помилок)");
    }
  } else if (address.startsWith("0x")) {
    riskScore += 20;
    findings.push("⚠️ Нестандартна довжина адреси");
  }
  
  // Pattern analysis
  if (address.endsWith("0000") || address.endsWith("dead") || address.endsWith("0001")) {
    riskScore += 15;
    findings.push("⚠️ Можлива burn/null адреса");
    walletData.possibleBurnAddress = true;
  }
  
  // Check for vanity address (many repeating chars)
  const charCounts: Record<string, number> = {};
  for (const char of address.slice(2)) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }
  const maxRepeat = Math.max(...Object.values(charCounts));
  if (maxRepeat > 15) {
    riskScore += 10;
    findings.push("🎯 Vanity адреса (спеціально згенерована)");
    walletData.isVanity = true;
  }
  
  // Check for contract creation pattern
  if (address.startsWith("0x000000")) {
    riskScore += 25;
    findings.push("⚠️ Схоже на системну/контрактну адресу");
  }
  
  // Try to get balance from free API (blockscout for some chains)
  try {
    const response = await fetchWithTimeout(`https://eth.blockscout.com/api/v2/addresses/${value}`, 3000);
    if (response.ok) {
      const data = await response.json();
      sources.push("blockscout.com");
      if (data.is_contract) {
        riskScore += 10;
        findings.push("📜 Це smart contract адреса");
        walletData.isContract = true;
      }
      if (data.is_verified) {
        findings.push("✅ Контракт верифіковано");
        walletData.isVerified = true;
        riskScore -= 10;
      }
      walletData.txCount = data.transactions_count || 0;
      walletData.tokenTransfers = data.token_transfers_count || 0;
    }
  } catch {
    // Silent fail
  }
  
  if (findings.length === 0) {
    findings.push("✅ Базова перевірка пройшла успішно");
  }
  
  walletData.addressShort = `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "wallet",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Гаманець ${walletData.addressShort} — ${riskLevel.toUpperCase()} ризик (${Math.min(riskScore, 100)}/100)`,
    details: walletData,
    findings,
    sources,
    timestamp,
  };
}

async function checkPhone(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  const phoneData: any = {};
  
  // Clean phone number
  const cleanNumber = value.replace(/[\s\-\(\)\.]/g, '');
  phoneData.original = value;
  phoneData.cleaned = cleanNumber;
  
  // Comprehensive country codes
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
  };
  
  let detectedCountry = null;
  for (const [code, info] of Object.entries(countryCodes).sort((a, b) => b[0].length - a[0].length)) {
    if (cleanNumber.startsWith(code)) {
      detectedCountry = { code, ...info };
      phoneData.country = info.country;
      phoneData.countryFlag = info.flag;
      phoneData.countryCode = code;
      phoneData.expectedFormat = info.format;
      
      // Check if mobile
      if (info.mobilePrefix) {
        const afterCode = cleanNumber.slice(code.length);
        const isMobile = info.mobilePrefix.some(p => afterCode.startsWith(p));
        phoneData.type = isMobile ? "Мобільний" : "Стаціонарний/Інший";
        if (isMobile) {
          findings.push(`📱 Мобільний номер (${info.country})`);
        }
      }
      break;
    }
  }
  
  if (!detectedCountry) {
    phoneData.country = "Невідома";
    phoneData.countryCode = "Unknown";
    findings.push("⚠️ Невідомий код країни");
    riskScore += 15;
  } else {
    findings.push(`${detectedCountry.flag} ${detectedCountry.country}`);
  }
  
  // Length validation
  const numericOnly = cleanNumber.replace(/\D/g, '');
  phoneData.digitsCount = numericOnly.length;
  
  if (numericOnly.length < 7) {
    riskScore += 40;
    findings.push("🔴 Занадто короткий номер — невалідний");
  } else if (numericOnly.length < 10) {
    riskScore += 20;
    findings.push("⚠️ Короткий номер — можливо неповний");
  } else if (numericOnly.length > 15) {
    riskScore += 25;
    findings.push("⚠️ Занадто довгий номер");
  } else {
    findings.push("✅ Валідна довжина номера");
  }
  
  // Suspicious patterns
  if (/^(\+?0{5,})/.test(cleanNumber) || /(\d)\1{6,}/.test(numericOnly)) {
    riskScore += 50;
    findings.push("🔴 Підозрілий паттерн — фейковий номер");
  }
  
  // VOIP detection heuristics
  const voipIndicators = [
    { pattern: /\+1(800|888|877|866|855|844|833|822)/, name: "Toll-free US" },
    { pattern: /\+44(80|84|87)/, name: "UK Non-geographic" },
    { pattern: /\+49(180|700)/, name: "German service numbers" },
  ];
  
  for (const { pattern, name } of voipIndicators) {
    if (pattern.test(cleanNumber)) {
      riskScore += 15;
      findings.push(`📞 ${name} (можливий VOIP)`);
      phoneData.possibleVoip = true;
    }
  }
  
  // Premium rate detection
  if (/\+\d{1,3}(900|901|905|906)/.test(cleanNumber)) {
    riskScore += 30;
    findings.push("💰 Premium-rate номер — може бути шахрайством");
    phoneData.isPremiumRate = true;
  }
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "phone",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Телефон ${value} — ${riskLevel.toUpperCase()} ризик (${Math.min(riskScore, 100)}/100)`,
    details: phoneData,
    findings,
    sources,
    timestamp,
  };
}

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
      summary: `Email ${value} — CRITICAL (невалідний формат)`,
      details: { error: "Invalid email format" },
      findings: ["🔴 Невалідний формат email"],
      sources,
      timestamp,
    };
  }
  
  const [localPart, domain] = parts;
  emailData.localPart = localPart;
  emailData.domain = domain;
  
  // Comprehensive provider lists
  const trustedProviders = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "protonmail.com", "proton.me"];
  const freeProviders = ["mail.ru", "ukr.net", "i.ua", "meta.ua", "yandex.ru", "yandex.ua", "rambler.ru", "hotmail.com", "live.com", "aol.com"];
  const disposableProviders = [
    "tempmail.com", "guerrillamail.com", "10minutemail.com", "throwaway.email", "temp-mail.org",
    "mailinator.com", "yopmail.com", "fakeinbox.com", "trashmail.com", "tempail.com",
    "getnada.com", "dispostable.com", "maildrop.cc", "emailondeck.com", "throwawaymail.com",
    "mohmal.com", "tempmailo.com", "tempr.email", "fakemail.net", "tmpmail.org"
  ];
  const businessDomains = ["company.com", "corp.com", "business.com"];
  
  // Check domain type
  const domainLower = domain.toLowerCase();
  
  if (trustedProviders.includes(domainLower)) {
    emailData.providerType = "Надійний провайдер";
    emailData.providerTrust = "high";
    findings.push(`✅ Надійний email-провайдер (${domain})`);
  } else if (freeProviders.includes(domainLower)) {
    emailData.providerType = "Безкоштовний провайдер";
    emailData.providerTrust = "medium";
    findings.push(`📧 Безкоштовний email-провайдер (${domain})`);
  } else if (disposableProviders.some(d => domainLower.includes(d) || domainLower.endsWith(d.split('.')[0]))) {
    riskScore += 60;
    emailData.providerType = "Одноразовий";
    emailData.providerTrust = "none";
    findings.push("🔴 ОДНОРАЗОВИЙ email — високий ризик шахрайства");
  } else {
    emailData.providerType = "Власний домен";
    emailData.providerTrust = "unknown";
    findings.push(`🏢 Власний/корпоративний домен (${domain})`);
  }
  
  // Local part analysis
  emailData.localPartLength = localPart.length;
  
  if (/^\d+$/.test(localPart)) {
    riskScore += 20;
    findings.push("⚠️ Тільки цифри — можливий автогенерований");
  }
  
  if (localPart.length < 3) {
    riskScore += 15;
    findings.push("⚠️ Дуже коротка адреса");
  }
  
  if (localPart.length > 30) {
    riskScore += 10;
    findings.push("⚠️ Дуже довга адреса");
  }
  
  // Spam/system patterns
  const systemPatterns = ["noreply", "no-reply", "donotreply", "mailer-daemon", "postmaster", "admin", "support", "info", "contact"];
  if (systemPatterns.some(p => localPart.toLowerCase().includes(p))) {
    riskScore += 15;
    findings.push("📋 Системна/службова адреса");
    emailData.isSystemEmail = true;
  }
  
  // Test patterns
  if (["test", "testing", "demo", "example", "sample"].some(p => localPart.toLowerCase().includes(p))) {
    riskScore += 25;
    findings.push("🧪 Тестова адреса");
    emailData.isTestEmail = true;
  }
  
  // Plus addressing
  if (localPart.includes('+')) {
    findings.push("📬 Використовує plus-addressing (легітимна техніка)");
    emailData.hasPlusAddressing = true;
  }
  
  // Dots analysis (Gmail ignores dots)
  if (domainLower === "gmail.com" && localPart.includes('.')) {
    findings.push("ℹ️ Gmail ігнорує крапки в адресі");
  }
  
  // Check domain MX via DNS (free)
  try {
    const response = await fetchWithTimeout(`https://dns.google/resolve?name=${domain}&type=MX`, 3000);
    const dnsData = await response.json();
    sources.push("dns.google");
    
    if (dnsData.Answer && dnsData.Answer.length > 0) {
      findings.push("✅ Домен має MX записи (може отримувати пошту)");
      emailData.hasMX = true;
      emailData.mxRecords = dnsData.Answer.map((a: any) => a.data).slice(0, 3);
    } else {
      riskScore += 30;
      findings.push("🔴 Домен не має MX записів — неможливо отримати пошту");
      emailData.hasMX = false;
    }
  } catch {
    // Silent fail
  }
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "email",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Email ${value} — ${riskLevel.toUpperCase()} ризик (${Math.min(riskScore, 100)}/100)`,
    details: emailData,
    findings,
    sources,
    timestamp,
  };
}

async function checkDomain(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Локальний аналіз"];
  const domainData: any = {};
  
  // Clean domain
  const domain = value.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split('?')[0];
  domainData.cleanDomain = domain;
  
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  domainData.tld = tld;
  domainData.subdomainCount = parts.length - 2;
  
  // TLD risk analysis
  const highRiskTlds = ["tk", "ml", "ga", "cf", "gq", "xyz", "top", "work", "click", "loan", "zip", "mov", "icu", "buzz"];
  const mediumRiskTlds = ["online", "site", "website", "space", "tech", "fun", "life"];
  const trustedTlds = ["com", "org", "net", "edu", "gov", "ua", "uk", "de", "eu", "io", "co", "me"];
  
  if (highRiskTlds.includes(tld)) {
    riskScore += 35;
    findings.push(`🔴 Високоризиковий TLD (.${tld}) — часто використовується для фішингу`);
  } else if (mediumRiskTlds.includes(tld)) {
    riskScore += 15;
    findings.push(`⚠️ TLD середнього ризику (.${tld})`);
  } else if (trustedTlds.includes(tld)) {
    findings.push(`✅ Надійний TLD (.${tld})`);
  }
  
  // Length and character analysis
  if (domain.length > 50) {
    riskScore += 25;
    findings.push("🔴 Надто довгий домен — підозріло");
  } else if (domain.length > 30) {
    riskScore += 10;
    findings.push("⚠️ Довгий домен");
  }
  
  // Number patterns
  if (/\d{5,}/.test(domain)) {
    riskScore += 30;
    findings.push("🔴 Багато цифр — можливий автогенерований домен");
  } else if (/\d{3,}/.test(domain)) {
    riskScore += 10;
    findings.push("⚠️ Містить числову послідовність");
  }
  
  // Typosquatting detection
  const popularBrands = [
    { brand: "google", official: ["google.com", "google.com.ua"] },
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
  ];
  
  for (const { brand, official } of popularBrands) {
    if (domain.includes(brand) && !official.includes(domain)) {
      riskScore += 50;
      findings.push(`🔴 TYPOSQUATTING: Імітує ${brand}`);
      domainData.possibleTyposquat = brand;
      break;
    }
  }
  
  // Suspicious patterns
  const phishingPatterns = ["login-", "signin-", "-login", "-signin", "secure-", "-secure", "verify-", "-verify", "update-", "account-", "-account", "wallet-", "-wallet"];
  if (phishingPatterns.some(p => domain.includes(p))) {
    riskScore += 40;
    findings.push("🔴 Типові фішингові патерни в домені");
    domainData.hasPhishingPattern = true;
  }
  
  // Excessive subdomains
  if (parts.length > 4) {
    riskScore += 25;
    findings.push("🔴 Забагато субдоменів — часта тактика фішингу");
  } else if (parts.length > 3) {
    riskScore += 10;
    findings.push("⚠️ Декілька субдоменів");
  }
  
  // Hyphen check
  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount > 3) {
    riskScore += 20;
    findings.push("⚠️ Забагато дефісів");
  }
  
  // DNS checks
  try {
    // Check A record
    const aResponse = await fetchWithTimeout(`https://dns.google/resolve?name=${domain}&type=A`, 3000);
    const aData = await aResponse.json();
    sources.push("dns.google");
    
    if (aData.Answer && aData.Answer.length > 0) {
      findings.push("✅ Домен має A запис (існує)");
      domainData.hasARecord = true;
      domainData.ipAddresses = aData.Answer.filter((a: any) => a.type === 1).map((a: any) => a.data).slice(0, 3);
    } else {
      riskScore += 20;
      findings.push("⚠️ Домен не має A запису");
      domainData.hasARecord = false;
    }
    
    // Check NS record
    const nsResponse = await fetchWithTimeout(`https://dns.google/resolve?name=${domain}&type=NS`, 3000);
    const nsData = await nsResponse.json();
    
    if (nsData.Answer && nsData.Answer.length > 0) {
      domainData.nameservers = nsData.Answer.map((a: any) => a.data).slice(0, 3);
      
      // Check for privacy/bulletproof hosting
      const suspiciousNS = ["njal.la", "cloudflare", "name-cheap"];
      if (suspiciousNS.some(s => domainData.nameservers.some((ns: string) => ns.toLowerCase().includes(s)))) {
        findings.push("ℹ️ Використовує privacy-focused DNS");
      }
    }
  } catch {
    // Silent fail
  }
  
  if (findings.length === 0) {
    findings.push("✅ Базова перевірка пройшла успішно");
  }
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "domain",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `Домен ${domain} — ${riskLevel.toUpperCase()} ризик (${Math.min(riskScore, 100)}/100)`,
    details: domainData,
    findings,
    sources,
    timestamp,
  };
}

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
    
    // Protocol check
    if (urlObj.protocol === "http:") {
      riskScore += 20;
      findings.push("🔓 Незахищене з'єднання (HTTP)");
      urlData.isSecure = false;
    } else {
      findings.push("🔒 Захищене з'єднання (HTTPS)");
      urlData.isSecure = true;
    }
    
    // URL shorteners
    const shorteners = [
      "bit.ly", "t.co", "goo.gl", "tinyurl.com", "ow.ly", "is.gd", "buff.ly",
      "short.io", "rebrand.ly", "cutt.ly", "t.ly", "rb.gy", "shorturl.at"
    ];
    if (shorteners.some(s => urlObj.hostname.includes(s))) {
      riskScore += 35;
      urlData.isShortener = true;
      findings.push("⚠️ URL-скорочувач — справжня адреса прихована");
    }
    
    // IP instead of domain
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname)) {
      riskScore += 40;
      findings.push("🔴 URL використовує IP замість домену — підозріло");
      urlData.usesIP = true;
    }
    
    // Non-standard port
    if (urlObj.port && !["80", "443", "8080", "8443"].includes(urlObj.port)) {
      riskScore += 15;
      findings.push(`⚠️ Нестандартний порт (${urlObj.port})`);
    }
    
    // Dangerous file extensions
    const dangerousExtensions = [".exe", ".msi", ".bat", ".cmd", ".scr", ".js", ".vbs", ".ps1", ".jar", ".apk", ".dmg"];
    const pathLower = urlObj.pathname.toLowerCase();
    for (const ext of dangerousExtensions) {
      if (pathLower.endsWith(ext)) {
        riskScore += 45;
        findings.push(`🔴 НЕБЕЗПЕЧНО: Виконуваний файл (${ext})`);
        urlData.hasDangerousExtension = true;
        break;
      }
    }
    
    // Archive downloads
    if ([".zip", ".rar", ".7z", ".tar", ".gz"].some(ext => pathLower.endsWith(ext))) {
      riskScore += 20;
      findings.push("📦 Архівний файл — перевірте вміст перед відкриттям");
    }
    
    // Phishing keywords in URL
    const phishingKeywords = ["login", "signin", "sign-in", "account", "verify", "secure", "update", "confirm", "wallet", "password", "credential", "bank", "payment"];
    const urlLower = value.toLowerCase();
    const foundKeywords = phishingKeywords.filter(k => urlLower.includes(k));
    if (foundKeywords.length > 0) {
      riskScore += 15 * Math.min(foundKeywords.length, 3);
      findings.push(`⚠️ Підозрілі ключові слова: ${foundKeywords.join(', ')}`);
      urlData.phishingKeywords = foundKeywords;
    }
    
    // Redirect parameters
    const redirectParams = ["redirect", "url=", "goto", "return", "next", "dest", "target", "link", "out", "ref"];
    if (redirectParams.some(p => urlLower.includes(p))) {
      riskScore += 25;
      findings.push("⚠️ URL містить redirect-параметри");
      urlData.hasRedirect = true;
    }
    
    // Data URI check
    if (value.startsWith("data:")) {
      riskScore += 60;
      findings.push("🔴 Data URI — може містити шкідливий код");
    }
    
    // Base64 in URL
    if (urlObj.search.includes("base64") || /[A-Za-z0-9+/=]{50,}/.test(value)) {
      riskScore += 20;
      findings.push("⚠️ Можливі закодовані дані в URL");
    }
    
    // Check domain part too
    const domainResult = await checkDomain(urlObj.hostname, timestamp);
    if (domainResult.riskScore > 30) {
      riskScore += Math.floor(domainResult.riskScore / 3);
      findings.push(`📍 Домен: ${domainResult.riskLevel.toUpperCase()} ризик`);
    }
    
    // URL length
    if (value.length > 500) {
      riskScore += 20;
      findings.push("⚠️ Дуже довгий URL");
    } else if (value.length > 200) {
      riskScore += 10;
      findings.push("ℹ️ Довгий URL");
    }
    
    urlData.urlLength = value.length;
    
  } catch {
    return {
      type: "url",
      target: value,
      riskScore: 70,
      riskLevel: "high",
      summary: `URL — HIGH ризик (невалідний формат)`,
      details: { error: "Invalid URL format" },
      findings: ["🔴 Невалідний формат URL"],
      sources,
      timestamp,
    };
  }
  
  if (findings.length <= 1) {
    findings.push("✅ Базова перевірка пройшла успішно");
  }
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "url",
    target: value,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: `URL — ${riskLevel.toUpperCase()} ризик (${Math.min(riskScore, 100)}/100)`,
    details: urlData,
    findings,
    sources,
    timestamp,
  };
}

async function checkBot(value: string, timestamp: Date): Promise<CheckResult> {
  let riskScore = 10;
  const findings: string[] = [];
  const sources: string[] = ["Telegram Bot API"];
  const botData: any = {};
  
  const token = value.trim();
  botData.tokenMasked = `${token.slice(0, 8)}...${token.slice(-8)}`;
  
  // Extract bot ID from token
  const botIdMatch = token.match(/^(\d+):/);
  if (botIdMatch) {
    botData.botId = botIdMatch[1];
  }
  
  // Validate token with Telegram API
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
      
      findings.push(`✅ Токен валідний — @${bot.username}`);
      findings.push(`🤖 Ім'я бота: ${bot.first_name}`);
      findings.push(`🆔 Bot ID: ${bot.id}`);
      
      // Risk scoring based on capabilities
      if (bot.can_join_groups) {
        riskScore += 5;
        findings.push("📂 Може приєднуватися до груп");
      }
      
      if (bot.can_read_all_group_messages) {
        riskScore += 15;
        findings.push("👁️ Може читати всі повідомлення в групах");
      }
      
      if (bot.supports_inline_queries) {
        findings.push("🔍 Підтримує inline-запити");
      }
      
      if (bot.can_connect_to_business) {
        riskScore += 5;
        findings.push("💼 Може підключатися до бізнес-акаунтів");
      }
      
      if (bot.has_main_web_app) {
        findings.push("🌐 Має веб-застосунок");
      }
      
      // Check if it's a premium bot (has many capabilities)
      const capabilityCount = [
        bot.can_join_groups,
        bot.can_read_all_group_messages,
        bot.supports_inline_queries,
        bot.can_connect_to_business,
        bot.has_main_web_app
      ].filter(Boolean).length;
      
      if (capabilityCount >= 4) {
        riskScore += 10;
        findings.push("⚡ Бот з розширеними можливостями");
        botData.isPowerful = true;
      }
      
      // Username analysis
      const suspiciousPatterns = ["admin", "support", "official", "helper", "service", "bank", "wallet", "crypto", "trade", "invest"];
      const usernameLower = bot.username.toLowerCase();
      const foundPatterns = suspiciousPatterns.filter(p => usernameLower.includes(p));
      if (foundPatterns.length > 0) {
        riskScore += 20;
        findings.push(`⚠️ Підозріла назва: містить ${foundPatterns.join(", ")}`);
        botData.hasSuspiciousName = true;
      }
      
    } else {
      // Token is invalid or revoked
      botData.isValid = false;
      riskScore = 70;
      
      if (data.error_code === 401) {
        findings.push("🔴 Токен НЕДІЙСНИЙ або відкликаний");
        botData.errorType = "unauthorized";
      } else if (data.error_code === 404) {
        findings.push("🔴 Бот не знайдений");
        botData.errorType = "not_found";
      } else {
        findings.push(`🔴 Помилка API: ${data.description || "Unknown error"}`);
        botData.errorType = "api_error";
        botData.errorDescription = data.description;
      }
      
      findings.push("⚠️ Можливо токен вже скомпрометований");
    }
    
  } catch (error: any) {
    botData.isValid = false;
    riskScore = 50;
    
    if (error.name === "AbortError") {
      findings.push("⚠️ Telegram API не відповідає (таймаут)");
      botData.errorType = "timeout";
    } else {
      findings.push("⚠️ Не вдалось перевірити токен");
      botData.errorType = "network_error";
    }
  }
  
  // Security recommendations
  if (botData.isValid) {
    findings.push("🔐 Рекомендація: Не діліться токеном публічно");
    if (botData.canReadAllGroupMessages) {
      findings.push("🛡️ Увага: Бот має доступ до всіх повідомлень");
    }
  } else {
    findings.push("💡 Якщо це ваш бот — створіть новий токен через @BotFather");
  }
  
  const riskLevel = getRiskLevel(riskScore);
  
  return {
    type: "bot",
    target: botData.tokenMasked,
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    summary: botData.isValid 
      ? `Bot @${botData.username} — ${riskLevel.toUpperCase()} ризик (${Math.min(riskScore, 100)}/100)`
      : `Bot Token — ${riskLevel.toUpperCase()} ризик (НЕДІЙСНИЙ)`,
    details: botData,
    findings,
    sources,
    timestamp,
  };
}
