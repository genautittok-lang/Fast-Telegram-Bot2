export type OsintCategory =
  | "leaks"
  | "email"
  | "phone"
  | "ip"
  | "domain"
  | "wallet"
  | "username"
  | "threat"
  | "darkweb"
  | "social";

export interface OsintSource {
  name: string;
  url: string;
  category: OsintCategory;
  notes?: string;
}

export const OSINT_SOURCES: OsintSource[] = [
  { name: "HaveIBeenPwned", url: "https://haveibeenpwned.com", category: "leaks" },
  { name: "DeHashed", url: "https://dehashed.com", category: "leaks" },
  { name: "LeakCheck", url: "https://leakcheck.io", category: "leaks" },
  { name: "BreachDirectory", url: "https://breachdirectory.org", category: "leaks" },
  { name: "IntelligenceX", url: "https://intelx.io", category: "leaks" },
  { name: "Hudson Rock", url: "https://hudsonrock.com", category: "leaks" },
  { name: "Cybernews Leak Checker", url: "https://cybernews.com/personal-data-leak-check", category: "leaks" },
  { name: "Have I Been Sold", url: "https://haveibeensold.app", category: "leaks" },
  { name: "Spycloud", url: "https://spycloud.com", category: "leaks" },
  { name: "BreachAware", url: "https://breachaware.com", category: "leaks" },

  { name: "EmailRep", url: "https://emailrep.io", category: "email" },
  { name: "Hunter.io", url: "https://hunter.io", category: "email" },
  { name: "Verifalia", url: "https://verifalia.com", category: "email" },
  { name: "MailboxValidator", url: "https://mailboxvalidator.com", category: "email" },
  { name: "Snov.io", url: "https://snov.io", category: "email" },
  { name: "VoilaNorbert", url: "https://voilanorbert.com", category: "email" },
  { name: "Gravatar", url: "https://gravatar.com", category: "email" },
  { name: "Holehe", url: "https://github.com/megadose/holehe", category: "email" },
  { name: "GHunt", url: "https://github.com/mxrch/GHunt", category: "email" },
  { name: "EpiOS", url: "https://epios.org", category: "email" },
  { name: "Skrapp", url: "https://skrapp.io", category: "email" },
  { name: "ZeroBounce", url: "https://zerobounce.net", category: "email" },
  { name: "MX Toolbox", url: "https://mxtoolbox.com", category: "email" },
  { name: "OSINT.industries", url: "https://osint.industries", category: "email" },
  { name: "Castrick Clues", url: "https://castrickclues.com", category: "email" },

  { name: "NumVerify", url: "https://numverify.com", category: "phone" },
  { name: "Truecaller", url: "https://truecaller.com", category: "phone" },
  { name: "Whitepages", url: "https://whitepages.com", category: "phone" },
  { name: "Sync.me", url: "https://sync.me", category: "phone" },
  { name: "PhoneInfoga", url: "https://github.com/sundowndev/phoneinfoga", category: "phone" },
  { name: "OpenCNAM", url: "https://opencnam.com", category: "phone" },
  { name: "Twilio Lookup", url: "https://twilio.com/docs/lookup", category: "phone" },
  { name: "EveryCaller", url: "https://everycaller.com", category: "phone" },
  { name: "Spokeo", url: "https://spokeo.com", category: "phone" },
  { name: "Pipl", url: "https://pipl.com", category: "phone" },
  { name: "Hiya", url: "https://hiya.com", category: "phone" },
  { name: "Spy Dialer", url: "https://spydialer.com", category: "phone" },

  { name: "AbuseIPDB", url: "https://abuseipdb.com", category: "ip" },
  { name: "VirusTotal", url: "https://virustotal.com", category: "ip" },
  { name: "Shodan", url: "https://shodan.io", category: "ip" },
  { name: "Censys", url: "https://censys.io", category: "ip" },
  { name: "GreyNoise", url: "https://greynoise.io", category: "ip" },
  { name: "IPinfo", url: "https://ipinfo.io", category: "ip" },
  { name: "MaxMind", url: "https://maxmind.com", category: "ip" },
  { name: "IP-API", url: "https://ip-api.com", category: "ip" },
  { name: "FraudGuard", url: "https://fraudguard.io", category: "ip" },
  { name: "IPQualityScore", url: "https://ipqualityscore.com", category: "ip" },
  { name: "Spamhaus", url: "https://spamhaus.org", category: "ip" },
  { name: "Project Honeypot", url: "https://projecthoneypot.org", category: "ip" },
  { name: "Talos Intelligence", url: "https://talosintelligence.com", category: "ip" },
  { name: "ThreatMiner", url: "https://threatminer.org", category: "ip" },
  { name: "BinaryEdge", url: "https://binaryedge.io", category: "ip" },
  { name: "ZoomEye", url: "https://zoomeye.org", category: "ip" },
  { name: "FOFA", url: "https://fofa.info", category: "ip" },
  { name: "Onyphe", url: "https://onyphe.io", category: "ip" },
  { name: "Netlas", url: "https://netlas.io", category: "ip" },
  { name: "DroneBL", url: "https://dronebl.org", category: "ip" },
  { name: "RIPEstat", url: "https://stat.ripe.net", category: "ip", notes: "Free RIPE NCC network info, ASN, abuse contacts" },
  { name: "BGPView", url: "https://bgpview.io", category: "ip", notes: "Free ASN and BGP routing info" },
  { name: "StopForumSpam", url: "https://stopforumspam.com", category: "ip", notes: "Free spam IP/email/username database" },

  { name: "URLScan.io", url: "https://urlscan.io", category: "domain" },
  { name: "WHOIS", url: "https://whois.com", category: "domain" },
  { name: "DNSDumpster", url: "https://dnsdumpster.com", category: "domain" },
  { name: "SecurityTrails", url: "https://securitytrails.com", category: "domain" },
  { name: "ViewDNS", url: "https://viewdns.info", category: "domain" },
  { name: "crt.sh", url: "https://crt.sh", category: "domain" },
  { name: "Sublist3r", url: "https://github.com/aboul3la/Sublist3r", category: "domain" },
  { name: "SubFinder", url: "https://github.com/projectdiscovery/subfinder", category: "domain" },
  { name: "Amass", url: "https://github.com/owasp-amass/amass", category: "domain" },
  { name: "WebArchive", url: "https://web.archive.org", category: "domain" },
  { name: "Wappalyzer", url: "https://wappalyzer.com", category: "domain" },
  { name: "BuiltWith", url: "https://builtwith.com", category: "domain" },
  { name: "SimilarWeb", url: "https://similarweb.com", category: "domain" },
  { name: "SiteCheck (Sucuri)", url: "https://sitecheck.sucuri.net", category: "domain" },
  { name: "Quad9 Threat", url: "https://quad9.net", category: "domain" },
  { name: "Google Safe Browsing", url: "https://transparencyreport.google.com/safe-browsing", category: "domain" },
  { name: "PhishTank", url: "https://phishtank.org", category: "domain" },
  { name: "OpenPhish", url: "https://openphish.com", category: "domain" },
  { name: "URLhaus", url: "https://urlhaus.abuse.ch", category: "domain" },
  { name: "ThreatCrowd", url: "https://threatcrowd.org", category: "domain" },
  { name: "Mozilla Observatory", url: "https://observatory.mozilla.org", category: "domain", notes: "Free security headers grading" },

  { name: "Etherscan", url: "https://etherscan.io", category: "wallet" },
  { name: "Blockchair", url: "https://blockchair.com", category: "wallet" },
  { name: "Blockchain.com", url: "https://blockchain.com/explorer", category: "wallet" },
  { name: "BscScan", url: "https://bscscan.com", category: "wallet" },
  { name: "PolygonScan", url: "https://polygonscan.com", category: "wallet" },
  { name: "TronScan", url: "https://tronscan.org", category: "wallet" },
  { name: "ChainAbuse", url: "https://chainabuse.com", category: "wallet" },
  { name: "Arkham Intelligence", url: "https://arkhamintelligence.com", category: "wallet" },
  { name: "Chainalysis Reactor", url: "https://chainalysis.com", category: "wallet" },
  { name: "Elliptic", url: "https://elliptic.co", category: "wallet" },
  { name: "TRM Labs", url: "https://trmlabs.com", category: "wallet" },
  { name: "OFAC SDN List", url: "https://sanctionssearch.ofac.treas.gov", category: "wallet" },
  { name: "MistTrack", url: "https://misttrack.io", category: "wallet" },
  { name: "Bitquery", url: "https://bitquery.io", category: "wallet" },
  { name: "Solscan", url: "https://solscan.io", category: "wallet" },
  { name: "DeBank", url: "https://debank.com", category: "wallet" },
  { name: "Zerion", url: "https://zerion.io", category: "wallet" },
  { name: "Nansen", url: "https://nansen.ai", category: "wallet" },
  { name: "WalletExplorer", url: "https://walletexplorer.com", category: "wallet" },
  { name: "CryptoScamDB", url: "https://cryptoscamdb.org", category: "wallet" },
  { name: "CoinGecko", url: "https://coingecko.com", category: "wallet", notes: "Free crypto price API for USD conversion" },

  { name: "Sherlock", url: "https://github.com/sherlock-project/sherlock", category: "username" },
  { name: "Maigret", url: "https://github.com/soxoj/maigret", category: "username" },
  { name: "WhatsMyName", url: "https://whatsmyname.app", category: "username" },
  { name: "Namechk", url: "https://namechk.com", category: "username" },
  { name: "Knowem", url: "https://knowem.com", category: "username" },
  { name: "InstantUsername", url: "https://instantusername.com", category: "username" },
  { name: "UserSearch.org", url: "https://usersearch.org", category: "username" },
  { name: "Social-Searcher", url: "https://social-searcher.com", category: "username" },
  { name: "PeekYou", url: "https://peekyou.com", category: "username" },
  { name: "Idcrawl", url: "https://idcrawl.com", category: "username" },
  { name: "Namecheckup", url: "https://namecheckup.com", category: "username" },
  { name: "Username Search", url: "https://username-search.com", category: "username" },

  { name: "AlienVault OTX", url: "https://otx.alienvault.com", category: "threat" },
  { name: "Cloudflare DNS", url: "https://cloudflare-dns.com", category: "domain", notes: "DNS-over-HTTPS independent resolver" },
  { name: "CertSpotter", url: "https://sslmate.com/certspotter", category: "domain", notes: "Certificate Transparency log search by SSLMate" },
  { name: "MISP", url: "https://misp-project.org", category: "threat" },
  { name: "Pulsedive", url: "https://pulsedive.com", category: "threat" },
  { name: "ThreatFox (abuse.ch)", url: "https://threatfox.abuse.ch", category: "threat" },
  { name: "MalwareBazaar", url: "https://bazaar.abuse.ch", category: "threat" },
  { name: "Feodo Tracker", url: "https://feodotracker.abuse.ch", category: "threat" },
  { name: "SSL Blacklist", url: "https://sslbl.abuse.ch", category: "threat" },
  { name: "Hybrid Analysis", url: "https://hybrid-analysis.com", category: "threat" },
  { name: "ANY.RUN", url: "https://any.run", category: "threat" },
  { name: "Joe Sandbox", url: "https://joesandbox.com", category: "threat" },
  { name: "CIRCL", url: "https://circl.lu", category: "threat" },
  { name: "MITRE ATT&CK", url: "https://attack.mitre.org", category: "threat" },
  { name: "NIST NVD", url: "https://nvd.nist.gov", category: "threat" },
  { name: "CVE Details", url: "https://cvedetails.com", category: "threat" },
  { name: "Exploit-DB", url: "https://exploit-db.com", category: "threat" },
  { name: "VulnDB", url: "https://vuldb.com", category: "threat" },
  { name: "Vulners", url: "https://vulners.com", category: "threat" },
  { name: "FIRST.org EPSS", url: "https://www.first.org/epss", category: "threat", notes: "Free exploit prediction scoring" },
  { name: "OSV.dev", url: "https://osv.dev", category: "threat", notes: "Free open-source vulnerability database (Google)" },
  { name: "CISA KEV", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", category: "threat", notes: "Free known exploited vulnerabilities catalog" },
  { name: "GitHub Advisories", url: "https://github.com/advisories", category: "threat", notes: "Free GitHub Security Advisory DB (per-package)" },
  { name: "Blocklist.de", url: "https://www.blocklist.de", category: "threat", notes: "Free per-IP attack counter API" },
  { name: "GreenSnow", url: "https://blocklist.greensnow.co", category: "threat", notes: "Free attacker IP blocklist" },
  { name: "CINS Army", url: "https://cinsscore.com", category: "threat", notes: "Free CI Army badguys IP feed" },
  { name: "IPsum", url: "https://github.com/stamparm/ipsum", category: "threat", notes: "Free aggregated attacker IP blocklist" },
  { name: "OpenPhish", url: "https://openphish.com", category: "threat", notes: "Free phishing URL feed" },
  { name: "ISC SANS", url: "https://isc.sans.edu", category: "threat", notes: "Free Internet Storm Center IP intel" },
  { name: "ScamSniffer", url: "https://scamsniffer.io", category: "wallet", notes: "Free crypto scam address darklist (GitHub-hosted)" },
  { name: "PhishFort", url: "https://www.phishfort.com", category: "domain", notes: "Free phishing domain darklist (GitHub-hosted)" },
  { name: "CoinPaprika", url: "https://coinpaprika.com", category: "wallet", notes: "Free crypto price API (CoinGecko backup)" },
  { name: "Wikipedia", url: "https://wikipedia.org", category: "social", notes: "Free entity disambiguation via REST summary API" },
  { name: "GLEIF", url: "https://www.gleif.org", category: "domain", notes: "Free Legal Entity Identifier lookup" },
  { name: "AdGuard DNS", url: "https://adguard-dns.io", category: "domain", notes: "Free DNS-over-HTTPS resolver (malware/phish filter)" },

  { name: "Ahmia", url: "https://ahmia.fi", category: "darkweb" },
  { name: "DarkSearch", url: "https://darksearch.io", category: "darkweb" },
  { name: "OnionLand", url: "https://onionlandsearchengine.com", category: "darkweb" },
  { name: "Tor Metrics", url: "https://metrics.torproject.org", category: "darkweb" },
  { name: "Recorded Future", url: "https://recordedfuture.com", category: "darkweb" },
  { name: "Flashpoint", url: "https://flashpoint.io", category: "darkweb" },
  { name: "DarkOwl", url: "https://darkowl.com", category: "darkweb" },
  { name: "Webhose Cyber", url: "https://webz.io", category: "darkweb" },
  { name: "Sixgill", url: "https://cybersixgill.com", category: "darkweb" },
  { name: "Bitcoin Abuse DB", url: "https://bitcoinabuse.com", category: "darkweb" },
  { name: "Have I Been Ransomed", url: "https://hibrposted.com", category: "darkweb" },
  { name: "Ransomwhere", url: "https://ransomwhe.re", category: "darkweb" },

  { name: "Twitter / X", url: "https://x.com", category: "social" },
  { name: "Facebook", url: "https://facebook.com", category: "social" },
  { name: "Instagram", url: "https://instagram.com", category: "social" },
  { name: "LinkedIn", url: "https://linkedin.com", category: "social" },
  { name: "Reddit", url: "https://reddit.com", category: "social" },
  { name: "GitHub", url: "https://github.com", category: "social" },
  { name: "HackerNews", url: "https://news.ycombinator.com", category: "social", notes: "Free Firebase API for user profiles" },
  { name: "GitLab", url: "https://gitlab.com", category: "social" },
  { name: "Telegram", url: "https://t.me", category: "social" },
  { name: "Discord", url: "https://discord.com", category: "social" },
  { name: "VKontakte", url: "https://vk.com", category: "social" },
  { name: "TikTok", url: "https://tiktok.com", category: "social" },
  { name: "YouTube", url: "https://youtube.com", category: "social" },
  { name: "Mastodon", url: "https://joinmastodon.org", category: "social" },
  { name: "OK.ru", url: "https://ok.ru", category: "social" },
];

export const SOURCES_COUNT = OSINT_SOURCES.length;

export function sourcesByCategory(category: OsintCategory): OsintSource[] {
  return OSINT_SOURCES.filter((s) => s.category === category);
}

export function pickSourcesForType(
  type: "email" | "phone" | "username" | "wallet" | "domain" | "ip" | "url" | string
): string[] {
  const map: Record<string, OsintCategory[]> = {
    email: ["email", "leaks", "social"],
    phone: ["phone", "leaks", "social"],
    username: ["username", "social", "leaks"],
    wallet: ["wallet", "darkweb", "threat"],
    domain: ["domain", "threat", "darkweb"],
    url: ["domain", "threat"],
    ip: ["ip", "threat", "darkweb"],
  };
  const cats = map[type] || ["threat"];
  const picks = cats.flatMap((c) => sourcesByCategory(c)).map((s) => s.name);
  return Array.from(new Set(picks));
}

export const CATEGORY_LABELS: Record<OsintCategory, { ru: string; en: string; uk: string; es: string; de: string }> = {
  leaks:    { ru: "Базы утечек",        en: "Breach databases",    uk: "Бази витоків",        es: "Bases de filtraciones", de: "Leak-Datenbanken" },
  email:    { ru: "Email-разведка",     en: "Email intelligence",  uk: "Email-розвідка",      es: "Inteligencia de email", de: "E-Mail-Analyse" },
  phone:    { ru: "Телефоны",           en: "Phone lookup",        uk: "Телефони",            es: "Búsqueda telefónica",   de: "Telefonsuche" },
  ip:       { ru: "IP-репутация",       en: "IP reputation",       uk: "IP-репутація",        es: "Reputación IP",         de: "IP-Reputation" },
  domain:   { ru: "Домены и URL",       en: "Domain & URL",        uk: "Домени та URL",       es: "Dominio & URL",         de: "Domain & URL" },
  wallet:   { ru: "Крипто-кошельки",   en: "Crypto wallets",      uk: "Криптогаманці",       es: "Carteras cripto",       de: "Krypto-Wallets" },
  username: { ru: "Юзернеймы",         en: "Username search",     uk: "Юзернейми",           es: "Búsqueda de usuario",   de: "Nutzersuche" },
  threat:   { ru: "Threat intelligence", en: "Threat intelligence", uk: "Аналіз загроз",      es: "Inteligencia de amenazas", de: "Bedrohungsanalyse" },
  darkweb:  { ru: "Dark web",           en: "Dark web",            uk: "Дарквеб",             es: "Dark web",              de: "Dark Web" },
  social:   { ru: "Социальные сети",   en: "Social networks",     uk: "Соціальні мережі",    es: "Redes sociales",        de: "Soziale Netzwerke" },
};
