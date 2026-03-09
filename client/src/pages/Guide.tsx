import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Wallet,
  Mail,
  Phone,
  Search,
  AlertTriangle,
  Bot,
  Bug,
  CreditCard,
  Terminal,
  Zap,
  ChevronDown,
  BookOpen,
  Users,
  BarChart3,
  MessageCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  CheckCircle,
  Star,
  FileText,
  Eye,
  Lock,
  Clock,
  HelpCircle,
  Code,
  Hash,
  User,
  Target,
  Link2,
  ShieldCheck,
  MonitorSmartphone,
  Shield,
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { useTranslation } from "@/lib/i18n";

function Section({ title, icon, children, delay = 0 }: { title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-bold" data-testid={`text-guide-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</h2>
      </div>
      <div className="pl-0 sm:pl-12 space-y-3">
        {children}
      </div>
    </motion.section>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-bold text-primary">{step}</span>
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5 break-words">{description}</p>
      </div>
    </div>
  );
}

function InlineExample({ command, description }: { command: string; description: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-2.5 rounded-lg bg-[#141418] border border-white/10">
      <code className="text-xs font-mono text-primary break-all">{command}</code>
      <span className="text-[11px] text-muted-foreground">{description}</span>
    </div>
  );
}

function ApiEndpoint({ method, path, description, params, response, labels }: { method: string; path: string; description: string; params?: string[]; response?: string; labels?: { params: string; response: string } }) {
  const [open, setOpen] = useState(false);
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PATCH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <div className="rounded-lg border border-white/10 bg-[#141418] overflow-hidden" data-testid={`api-endpoint-${method.toLowerCase()}-${path.replace(/[/:]/g, '-')}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left">
        <Badge className={`${methodColors[method] || ""} border text-[10px] px-2 py-0.5 font-mono shrink-0`}>{method}</Badge>
        <code className="text-xs font-mono text-white/80 break-all flex-1">{path}</code>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-3 pt-0 space-y-2 border-t border-white/5">
              <p className="text-xs text-muted-foreground">{description}</p>
              {params && params.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">{labels?.params || "Parameters"}</p>
                  {params.map((p, i) => <p key={i} className="text-[11px] font-mono text-primary/70">{p}</p>)}
                </div>
              )}
              {response && (
                <div>
                  <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1">{labels?.response || "Response"}</p>
                  <pre className="text-[10px] font-mono text-muted-foreground bg-black/30 p-2 rounded overflow-x-auto">{response}</pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-white/10 bg-card/60 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left">
        <HelpCircle className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium flex-1">{question}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Guide() {
  const { t, lang } = useTranslation();

  const L = <T extends string | string[]>(uk: T, ru: T, en: T): T => lang === "uk" ? uk : lang === "ru" ? ru : en;

  const checkTypes = [
    { icon: <Globe className="w-4 h-4" />, name: L("IP Адреса", "IP Адрес", "IP Address"), desc: L("Геолокація, ISP, VPN/proxy detection, blacklist перевірка, ASN, abuse contacts, risk score", "Геолокация, ISP, VPN/proxy detection, blacklist проверка, ASN, abuse contacts, risk score", "Geolocation, ISP, VPN/proxy detection, blacklist check, ASN, abuse contacts, risk score"), example: "8.8.8.8", cmd: "ip" },
    { icon: <Mail className="w-4 h-4" />, name: "Email", desc: L("Витоки даних (breach history), MX записи, SPF/DKIM, disposable detection, пов'язані акаунти, зламані паролі", "Утечки данных (breach history), MX записи, SPF/DKIM, disposable detection, связанные аккаунты", "Data breaches (breach history), MX records, SPF/DKIM, disposable detection, linked accounts, compromised passwords"), example: "user@example.com", cmd: "email" },
    { icon: <Search className="w-4 h-4" />, name: L("Домен", "Домен", "Domain"), desc: L("WHOIS дані, DNS записи (A, MX, NS, TXT), SSL сертифікати, вік домену, реєстратор, історія змін, технології", "WHOIS данные, DNS записи (A, MX, NS, TXT), SSL сертификаты, возраст домена, регистратор, история, технологии", "WHOIS data, DNS records (A, MX, NS, TXT), SSL certificates, domain age, registrar, change history, technologies"), example: "example.com", cmd: "domain" },
    { icon: <Wallet className="w-4 h-4" />, name: L("Крипто гаманець", "Крипто кошелёк", "Crypto Wallet"), desc: L("ETH/BTC/TRX/SOL — баланс, транзакції, mixer detection, scam database, token holdings, risk assessment", "ETH/BTC/TRX/SOL — баланс, транзакции, mixer detection, scam database, token holdings, risk assessment", "ETH/BTC/TRX/SOL — balance, transactions, mixer detection, scam database, token holdings, risk assessment"), example: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18", cmd: "wallet" },
    { icon: <Phone className="w-4 h-4" />, name: L("Телефон", "Телефон", "Phone"), desc: L("Оператор, країна, тип лінії (mobile/landline/VOIP), spam reports, caller ID", "Оператор, страна, тип линии (mobile/landline/VOIP), spam reports, caller ID", "Carrier, country, line type (mobile/landline/VOIP), spam reports, caller ID"), example: "+380501234567", cmd: "phone" },
    { icon: <AlertTriangle className="w-4 h-4" />, name: "URL", desc: L("Фішинг detection, malware scan, redirect chains, SSL status, safety score, Google Safe Browsing", "Фишинг detection, malware scan, redirect chains, SSL status, safety score, Google Safe Browsing", "Phishing detection, malware scan, redirect chains, SSL status, safety score, Google Safe Browsing"), example: "https://suspicious-site.com", cmd: "url" },
    { icon: <Shield className="w-4 h-4" />, name: "CVE", desc: L("Деталі вразливості, CVSS score, affected products, exploits, патчі, severity, CWE classification", "Детали уязвимости, CVSS score, affected products, exploits, патчи, severity, CWE classification", "Vulnerability details, CVSS score, affected products, exploits, patches, severity, CWE classification"), example: "CVE-2021-44228", cmd: "cve" },
    { icon: <Hash className="w-4 h-4" />, name: L("Хеш файлу", "Хеш файла", "File Hash"), desc: L("MD5/SHA1/SHA256 — VirusTotal scan, malware family, detection rate, file metadata, sandbox results", "MD5/SHA1/SHA256 — VirusTotal scan, malware family, detection rate, file metadata, sandbox results", "MD5/SHA1/SHA256 — VirusTotal scan, malware family, detection rate, file metadata, sandbox results"), example: "d41d8cd98f00b204e9800998ecf8427e", cmd: "hash" },
    { icon: <User className="w-4 h-4" />, name: "Username", desc: L("OSINT пошук профілів на 200+ платформах, соціальні мережі, форуми, GitHub, Reddit", "OSINT поиск профилей на 200+ платформах, социальные сети, форумы, GitHub, Reddit", "OSINT profile search across 200+ platforms, social media, forums, GitHub, Reddit"), example: "johndoe", cmd: "username" },
    { icon: <CreditCard className="w-4 h-4" />, name: "BIN Card", desc: L("Банк-емітент, країна, тип картки (credit/debit), бренд (Visa/MC), рівень (Classic/Gold/Platinum)", "Банк-эмитент, страна, тип карты (credit/debit), бренд (Visa/MC), уровень (Classic/Gold/Platinum)", "Issuing bank, country, card type (credit/debit), brand (Visa/MC), level (Classic/Gold/Platinum)"), example: "424242", cmd: "card" },
    { icon: <Bot className="w-4 h-4" />, name: "Bot Token", desc: L("Валідність Telegram bot token, ім'я бота, username, тип, can_join_groups", "Валидность Telegram bot token, имя бота, username, тип, can_join_groups", "Telegram bot token validity, bot name, username, type, can_join_groups"), example: "123456:ABC-DEF...", cmd: "bot" },
  ];

  const botCommands = [
    { cmd: "/start", desc: L("Головне меню та дашборд бота", "Главное меню и дашборд бота", "Main menu and bot dashboard") },
    { cmd: "/menu", desc: L("Панель управління з усіма функціями", "Панель управления со всеми функциями", "Dashboard with all features") },
    { cmd: "/check <тип> <значення>", desc: L("Швидка перевірка без меню: /check ip 8.8.8.8", "Быстрая проверка без меню: /check ip 8.8.8.8", "Quick check without menu: /check ip 8.8.8.8") },
    { cmd: "/stats", desc: L("Ваша особиста статистика, тариф, серія перевірок", "Ваша личная статистика, тариф, серия проверок", "Your personal statistics, plan, check streak") },
    { cmd: "/ref", desc: L("Реферальна програма — запрошуйте друзів, отримуйте бонуси", "Реферальная программа — приглашайте друзей, получайте бонусы", "Referral program — invite friends, earn bonuses") },
    { cmd: "/help", desc: L("Повна довідка з командами та інструкцією", "Полная справка с командами и инструкцией", "Full help with commands and instructions") },
    { cmd: "/support", desc: L("Зв'язатися з підтримкою, створити тікет", "Связаться с поддержкой, создать тикет", "Contact support, create a ticket") },
  ];

  const inlineExamples = [
    { cmd: "@DarkShare1Bot ip 8.8.8.8", desc: L("Перевірка IP адреси", "Проверка IP адреса", "Check IP address") },
    { cmd: "@DarkShare1Bot email test@mail.com", desc: L("Перевірка email на витоки", "Проверка email на утечки", "Check email for breaches") },
    { cmd: "@DarkShare1Bot domain google.com", desc: L("WHOIS та DNS домену", "WHOIS и DNS домена", "Domain WHOIS and DNS") },
    { cmd: "@DarkShare1Bot wallet 0x742d...", desc: L("Аналіз крипто гаманця", "Анализ крипто кошелька", "Crypto wallet analysis") },
    { cmd: "@DarkShare1Bot phone +380501234567", desc: L("Перевірка номеру телефону", "Проверка номера телефона", "Phone number lookup") },
    { cmd: "@DarkShare1Bot cve CVE-2021-44228", desc: L("Пошук вразливості", "Поиск уязвимости", "Vulnerability lookup") },
    { cmd: "@DarkShare1Bot hash d41d8cd98f...", desc: L("Перевірка хешу файлу", "Проверка хеша файла", "File hash check") },
    { cmd: "@DarkShare1Bot username johndoe", desc: L("OSINT пошук юзернейму", "OSINT поиск юзернейма", "Username OSINT search") },
    { cmd: "@DarkShare1Bot card 424242", desc: L("BIN lookup картки", "BIN lookup карты", "Card BIN lookup") },
    { cmd: "@DarkShare1Bot url https://site.com", desc: L("Перевірка URL на фішинг", "Проверка URL на фишинг", "URL phishing check") },
  ];

  const dashFeatures = [
    { icon: <Target className="w-4 h-4 text-primary" />, title: L("Швидка перевірка", "Быстрая проверка", "Quick Check"), desc: L("Миттєвий аналіз будь-якого індикатора з головної сторінки — без реєстрації для базових перевірок", "Мгновенный анализ любого индикатора с главной страницы — без регистрации для базовых проверок", "Instant analysis of any indicator from the homepage — no registration for basic checks") },
    { icon: <BarChart3 className="w-4 h-4 text-primary" />, title: L("Статистика та аналітика", "Статистика и аналитика", "Statistics & Analytics"), desc: L("Графіки перевірок, розподіл по типах, risk distribution, серія днів, лідерборд", "Графики проверок, распределение по типам, risk distribution, серия дней, лидерборд", "Check charts, type distribution, risk distribution, streak days, leaderboard") },
    { icon: <Layers className="w-4 h-4 text-primary" />, title: L("Bulk перевірки", "Массовые проверки", "Bulk Checks"), desc: L("Перевіряйте до 50 об'єктів одночасно — IP, email, домени. Вставте список і отримайте масовий звіт", "Проверяйте до 50 объектов одновременно — IP, email, домены. Вставьте список и получите массовый отчёт", "Check up to 50 targets at once — IP, email, domains. Paste a list and get a bulk report") },
    { icon: <Eye className="w-4 h-4 text-primary" />, title: L("Моніторинг 24/7", "Мониторинг 24/7", "24/7 Monitoring"), desc: L("Автоматичне відстеження змін для доменів, IP, гаманців. Сповіщення при зміні статусу", "Автоматическое отслеживание изменений для доменов, IP, кошельков. Уведомления при изменении статуса", "Automatic change tracking for domains, IPs, wallets. Notifications on status changes") },
    { icon: <FileText className="w-4 h-4 text-primary" />, title: L("PDF звіти", "PDF отчёты", "PDF Reports"), desc: L("Генерація детальних PDF звітів з логотипом, risk score, findings — для документації та клієнтів", "Генерация детальных PDF отчётов с логотипом, risk score, findings — для документации и клиентов", "Generate detailed PDF reports with logo, risk score, findings — for documentation and clients") },
    { icon: <Clock className="w-4 h-4 text-primary" />, title: L("Історія перевірок", "История проверок", "Check History"), desc: L("Повна історія всіх перевірок з фільтрацією, пошуком, порівнянням та CSV експортом", "Полная история всех проверок с фильтрацией, поиском, сравнением и CSV экспортом", "Full check history with filtering, search, comparison and CSV export") },
    { icon: <Star className="w-4 h-4 text-primary" />, title: L("Обрані цілі", "Избранные цели", "Favorites"), desc: L("Зберігайте часто перевірювані цілі для швидкого повторного аналізу одним кліком", "Сохраняйте часто проверяемые цели для быстрого повторного анализа одним кликом", "Save frequently checked targets for quick one-click re-analysis") },
    { icon: <Users className="w-4 h-4 text-primary" />, title: L("Команди (Teams)", "Команды (Teams)", "Teams"), desc: L("Створюйте команди, додавайте учасників, спільний доступ до результатів, командний чат", "Создавайте команды, добавляйте участников, общий доступ к результатам, командный чат", "Create teams, add members, share results, team chat") },
    { icon: <MessageCircle className="w-4 h-4 text-primary" />, title: L("Чат спільноти", "Чат сообщества", "Community Chat"), desc: L("Обговорюйте загрози з іншими дослідниками в реальному часі, прикріплюйте файли та зображення", "Обсуждайте угрозы с другими исследователями в реальном времени, прикрепляйте файлы и изображения", "Discuss threats with other researchers in real-time, attach files and images") },
    { icon: <Link2 className="w-4 h-4 text-primary" />, title: L("Реферальна програма", "Реферальная программа", "Referral Program"), desc: L("Запрошуйте друзів — отримуйте +3 безкоштовних перевірки за кожного. Унікальне посилання та QR код", "Приглашайте друзей — получайте +3 бесплатных проверки за каждого. Уникальная ссылка и QR код", "Invite friends — get +3 free checks per referral. Unique link and QR code") },
    { icon: <Lock className="w-4 h-4 text-primary" />, title: L("2FA захист", "2FA защита", "2FA Protection"), desc: L("Двофакторна аутентифікація через TOTP (Google Authenticator, Authy) для захисту акаунту", "Двухфакторная аутентификация через TOTP (Google Authenticator, Authy) для защиты аккаунта", "Two-factor authentication via TOTP (Google Authenticator, Authy) for account security") },
    { icon: <MonitorSmartphone className="w-4 h-4 text-primary" />, title: L("Security Widget", "Security Widget", "Security Widget"), desc: L("Вбудований HTML віджет для вашого сайту — покажіть статус безпеки відвідувачам", "Встроенный HTML виджет для вашего сайта — покажите статус безопасности посетителям", "Embeddable HTML widget for your website — show security status to visitors") },
  ];

  const apiEndpoints = [
    { method: "POST", path: "/api/check", desc: L("Виконати перевірку будь-якого типу", "Выполнить проверку любого типа", "Perform any type of check"), params: ['type: "ip" | "email" | "domain" | "wallet" | "phone" | "url" | "cve" | "hash" | "username" | "card"', 'target: string'], response: '{ riskScore: 75, findings: [...], metadata: {...} }' },
    { method: "GET", path: "/api/reports", desc: L("Отримати список ваших звітів", "Получить список ваших отчётов", "Get list of your reports"), response: '[{ id, objectType, target, riskScore, generatedAt }]' },
    { method: "GET", path: "/api/reports/:id", desc: L("Отримати деталі конкретного звіту", "Получить детали конкретного отчёта", "Get specific report details"), params: ["id: number"], response: '{ id, objectType, target, riskScore, findings, metadata }' },
    { method: "GET", path: "/api/reports/:id/pdf", desc: L("Завантажити PDF звіт", "Скачать PDF отчёт", "Download PDF report"), params: ["id: number"] },
    { method: "POST", path: "/api/bulk-check", desc: L("Масова перевірка (до 50 цілей)", "Массовая проверка (до 50 целей)", "Bulk check (up to 50 targets)"), params: ['type: string', 'targets: string[]'], response: '{ results: [{ target, riskScore, findings }] }' },
    { method: "GET", path: "/api/watches", desc: L("Список активних моніторингів", "Список активных мониторингов", "List of active monitors"), response: '[{ id, type, target, interval, lastChecked }]' },
    { method: "POST", path: "/api/watches", desc: L("Створити новий моніторинг", "Создать новый мониторинг", "Create new monitor"), params: ['type: string', 'target: string', 'interval: "1h" | "6h" | "24h"'] },
    { method: "DELETE", path: "/api/watches/:id", desc: L("Видалити моніторинг", "Удалить мониторинг", "Delete monitor"), params: ["id: number"] },
    { method: "GET", path: "/api/auth/me", desc: L("Поточний користувач та тариф", "Текущий пользователь и тариф", "Current user and plan"), response: '{ id, username, tier, requestsLeft, subscriptionExpiresAt }' },
    { method: "GET", path: "/api/stats", desc: L("Загальна статистика платформи", "Общая статистика платформы", "Platform-wide statistics"), response: '{ totalUsers, totalReports, checksToday, threatsBlocked }' },
    { method: "GET", path: "/api/activity", desc: L("Стрічка останньої активності", "Лента последней активности", "Recent activity feed"), response: '[{ type, target, riskLevel, timestamp }]' },
    { method: "GET", path: "/api/threat-feed", desc: L("Стрічка загроз в реальному часі", "Лента угроз в реальном времени", "Real-time threat feed"), response: '[{ id, title, severity, type, source, description }]' },
    { method: "POST", path: "/api/breach-check", desc: L("Перевірка email на витоки (Dark Web)", "Проверка email на утечки (Dark Web)", "Email breach check (Dark Web)"), params: ['email: string'], response: '{ breached: true, breaches: [...], exposedData: [...] }' },
    { method: "GET", path: "/api/quick-check", desc: L("Публічна швидка перевірка (без авторизації, 3/день)", "Публичная быстрая проверка (без авторизации, 3/день)", "Public quick check (no auth, 3/day)"), params: ['type: string', 'target: string'] },
  ];

  const useCases = [
    { icon: <Wallet className="w-5 h-5 text-orange-400" />, title: L("Крипто безпека", "Крипто безопасность", "Crypto Security"), desc: L("Перед відправкою криптовалюти перевірте гаманець отримувача. DARKSHARE виявляє відомі scam-адреси, mixer'и та підозрілу активність. Захистіть свої кошти від шахраїв.", "Перед отправкой криптовалюты проверьте кошелёк получателя. DARKSHARE выявляет известные scam-адреса, mixer'ы и подозрительную активность.", "Before sending crypto, check the recipient's wallet. DARKSHARE detects known scam addresses, mixers and suspicious activity. Protect your funds.") },
    { icon: <Mail className="w-5 h-5 text-blue-400" />, title: L("Email безпека", "Email безопасность", "Email Security"), desc: L("Перевіряйте email адреси на участь у витоках даних. Дізнайтесь чи ваш пароль був скомпрометований. Виявляйте disposable та фейкові email адреси.", "Проверяйте email адреса на участие в утечках данных. Узнайте, был ли ваш пароль скомпрометирован. Выявляйте disposable и фейковые email.", "Check email addresses for data breaches. Find out if your password was compromised. Detect disposable and fake emails.") },
    { icon: <Globe className="w-5 h-5 text-cyan-400" />, title: L("Аналіз інфраструктури", "Анализ инфраструктуры", "Infrastructure Analysis"), desc: L("Повний OSINT домену або IP: WHOIS, DNS, SSL, технології, репутація. Ідеально для пентесту, bug bounty та due diligence.", "Полный OSINT домена или IP: WHOIS, DNS, SSL, технологии, репутация. Идеально для пентеста, bug bounty и due diligence.", "Full domain or IP OSINT: WHOIS, DNS, SSL, technologies, reputation. Perfect for pentesting, bug bounty and due diligence.") },
    { icon: <ShieldCheck className="w-5 h-5 text-green-400" />, title: L("Anti-Fraud", "Anti-Fraud", "Anti-Fraud"), desc: L("Для бізнесу: перевіряйте контрагентів, номери телефонів, email'и та домени перед укладанням угод. Зменшіть ризики шахрайства.", "Для бизнеса: проверяйте контрагентов, номера телефонов, email'ы и домены перед заключением сделок.", "For business: verify counterparties, phone numbers, emails and domains before deals. Reduce fraud risks.") },
    { icon: <Bug className="w-5 h-5 text-red-400" />, title: L("Threat Intelligence", "Threat Intelligence", "Threat Intelligence"), desc: L("Відстежуйте CVE вразливості, аналізуйте malware хеші, моніторте підозрілі URL. Інтегруйте з вашою SIEM/SOC через API.", "Отслеживайте CVE уязвимости, анализируйте malware хеши, мониторьте подозрительные URL. Интегрируйте с вашей SIEM/SOC через API.", "Track CVE vulnerabilities, analyze malware hashes, monitor suspicious URLs. Integrate with your SIEM/SOC via API.") },
    { icon: <User className="w-5 h-5 text-purple-400" />, title: L("OSINT розвідка", "OSINT разведка", "OSINT Intelligence"), desc: L("Пошук за username на 200+ платформах, аналіз цифрового сліду, перевірка BIN карток. Для журналістів, слідчих та дослідників.", "Поиск по username на 200+ платформах, анализ цифрового следа, проверка BIN карт. Для журналистов, следователей и исследователей.", "Username search across 200+ platforms, digital footprint analysis, card BIN checks. For journalists, investigators and researchers.") },
  ];

  const faqItems = [
    { q: L("Скільки перевірок я можу робити безкоштовно?", "Сколько проверок я могу делать бесплатно?", "How many free checks can I do?"), a: L("FREE тариф дає 5 перевірок на день. Вони оновлюються щодня о 00:00 UTC. Також можна отримати додаткові перевірки через реферальну програму (+3 за кожного друга).", "FREE тариф даёт 5 проверок в день. Они обновляются ежедневно в 00:00 UTC. Также можно получить дополнительные проверки через реферальную программу (+3 за каждого друга).", "FREE plan gives 5 checks per day. They reset daily at 00:00 UTC. You can also earn extra checks via referral program (+3 per friend).") },
    { q: L("Як працює inline режим бота?", "Как работает inline режим бота?", "How does bot inline mode work?"), a: L("В будь-якому чаті Telegram введіть @DarkShare1Bot, потім тип перевірки та значення. Наприклад: @DarkShare1Bot ip 8.8.8.8. Результат з'явиться як inline повідомлення, яке можна надіслати в чат.", "В любом чате Telegram введите @DarkShare1Bot, затем тип проверки и значение. Например: @DarkShare1Bot ip 8.8.8.8. Результат появится как inline сообщение.", "In any Telegram chat, type @DarkShare1Bot followed by check type and value. Example: @DarkShare1Bot ip 8.8.8.8. Result appears as inline message you can send.") },
    { q: L("Як оплатити підписку?", "Как оплатить подписку?", "How to pay for subscription?"), a: L("Підписку можна оплатити через: криптовалюту (TON, USDT, ETH, BTC), MonoPay (Monobank), або промокод. Оплата доступна як через бота, так і через сайт на сторінці Pricing.", "Подписку можно оплатить через: криптовалюту (TON, USDT, ETH, BTC), MonoPay (Monobank), или промокод. Оплата доступна как через бота, так и через сайт.", "You can pay via: cryptocurrency (TON, USDT, ETH, BTC), MonoPay (Monobank), or promo code. Payment available both via bot and website Pricing page.") },
    { q: L("Мої дані в безпеці?", "Мои данные в безопасности?", "Is my data safe?"), a: L("Так. Ми не зберігаємо raw дані ваших перевірок. Результати зберігаються у зашифрованому вигляді. 2FA доступний для додаткового захисту. Сесії можна переглядати та видаляти на сторінці Account.", "Да. Мы не храним raw данные ваших проверок. Результаты хранятся в зашифрованном виде. 2FA доступен для дополнительной защиты. Сессии можно просматривать и удалять.", "Yes. We don't store raw data of your checks. Results are stored encrypted. 2FA is available for extra protection. Sessions can be viewed and deleted on Account page.") },
    { q: L("Як працює моніторинг?", "Как работает мониторинг?", "How does monitoring work?"), a: L("Додайте домен, IP або гаманець до моніторингу. Система автоматично перевірятиме їх з обраним інтервалом (1, 6 або 24 години) і повідомить вас через Telegram бота при зміні статусу.", "Добавьте домен, IP или кошелёк в мониторинг. Система автоматически проверяет их с выбранным интервалом и уведомит вас через Telegram бота при изменении статуса.", "Add a domain, IP or wallet to monitoring. The system auto-checks them at chosen intervals (1, 6, or 24 hours) and notifies you via Telegram bot on status changes.") },
    { q: L("Чи є API для інтеграції?", "Есть ли API для интеграции?", "Is there an API for integration?"), a: L("Так! REST API доступний для PRO та ENTERPRISE тарифів. Авторизація через сесію. Документація доступна на сторінці API Docs (для ENTERPRISE). Всі ендпоінти описані нижче.", "Да! REST API доступен для PRO и ENTERPRISE тарифов. Авторизация через сессию. Документация на странице API Docs (для ENTERPRISE). Все эндпоинты описаны ниже.", "Yes! REST API is available for PRO and ENTERPRISE plans. Auth via session. Documentation on API Docs page (for ENTERPRISE). All endpoints described below.") },
    { q: L("Що таке Bulk перевірка?", "Что такое Bulk проверка?", "What is Bulk check?"), a: L("Bulk режим дозволяє перевірити до 50 об'єктів одночасно. Вставте список IP, email або доменів (по одному на рядок) та оберіть тип. Результати прийдуть масовим звітом.", "Bulk режим позволяет проверить до 50 объектов одновременно. Вставьте список IP, email или доменов (по одному на строку). Результаты придут массовым отчётом.", "Bulk mode lets you check up to 50 targets at once. Paste a list of IPs, emails or domains (one per line). Results come as a bulk report.") },
    { q: L("Як працює реферальна програма?", "Как работает реферальная программа?", "How does the referral program work?"), a: L("Отримайте своє унікальне посилання через /ref в боті або на сторінці Referral. За кожного друга, який зареєструється, ви отримаєте +3 безкоштовних перевірки. Топ-реферери отримують PRO тариф.", "Получите уникальную ссылку через /ref в боте или на странице Referral. За каждого друга +3 бесплатных проверки. Топ-реферы получают PRO тариф.", "Get your unique link via /ref in bot or Referral page. For each friend who registers, you get +3 free checks. Top referrers get PRO plan.") },
  ];

  const plans = [
    { name: "FREE", price: "$0", features: L(["5 перевірок/день", "Базовий аналіз", "Історія 30 днів", "1 моніторинг", "Чат спільноти"], ["5 проверок/день", "Базовый анализ", "История 30 дней", "1 мониторинг", "Чат сообщества"], ["5 checks/day", "Basic analysis", "30-day history", "1 monitor", "Community chat"]) },
    { name: "PRO", price: "$10/mo", highlight: true, features: L(["50 перевірок/день", "Повний аналіз", "API доступ", "10 моніторингів", "PDF звіти", "Bulk перевірки", "Пріоритетна підтримка", "Inline режим"], ["50 проверок/день", "Полный анализ", "API доступ", "10 мониторингов", "PDF отчёты", "Bulk проверки", "Приоритетная поддержка", "Inline режим"], ["50 checks/day", "Full analysis", "API access", "10 monitors", "PDF reports", "Bulk checks", "Priority support", "Inline mode"]) },
    { name: "ENTERPRISE", price: "$35/mo", features: L(["Необмежені перевірки", "Усі модулі", "Необмежений API", "50 моніторингів", "Команди (Teams)", "API Documentation", "Security Widget", "Персональний менеджер"], ["Безлимитные проверки", "Все модули", "Безлимитный API", "50 мониторингов", "Команды (Teams)", "API Documentation", "Security Widget", "Персональный менеджер"], ["Unlimited checks", "All modules", "Unlimited API", "50 monitors", "Teams", "API Documentation", "Security Widget", "Personal manager"]) },
    { name: "GROUPS", price: "$55/mo", features: L(["Все з Enterprise", "До 10 учасників", "Командна аналітика", "Спільний доступ до звітів", "Командний чат"], ["Все из Enterprise", "До 10 участников", "Командная аналитика", "Общий доступ к отчётам", "Командный чат"], ["Everything from Enterprise", "Up to 10 members", "Team analytics", "Shared reports", "Team chat"]) },
  ];

  const securityTips = L(
    [
      "Завжди перевіряйте крипто гаманець перед переказом — навіть якщо отримали адресу від «друга»",
      "Перевіряйте URL перед введенням паролів — фішингові сайти виглядають ідентично оригіналу",
      "Використовуйте Bulk режим для масової перевірки списку IP/email після підозрілої активності",
      "Налаштуйте моніторинг для ваших доменів та критичної інфраструктури",
      "Увімкніть 2FA для захисту акаунту DARKSHARE",
      "Використовуйте inline режим бота для швидкої перевірки прямо у чаті з клієнтом",
      "Експортуйте PDF звіти для документації та звітності перед клієнтами",
      "Перевіряйте email нових контрагентів на витоки даних",
      "Регулярно перевіряйте свої власні email та домени на компрометацію",
      "Запросіть колег через реферальну програму — отримаєте бонусні перевірки",
    ],
    [
      "Всегда проверяйте крипто кошелёк перед переводом — даже если получили адрес от «друга»",
      "Проверяйте URL перед вводом паролей — фишинговые сайты выглядят идентично оригиналу",
      "Используйте Bulk режим для массовой проверки списка IP/email после подозрительной активности",
      "Настройте мониторинг для ваших доменов и критической инфраструктуры",
      "Включите 2FA для защиты аккаунта DARKSHARE",
      "Используйте inline режим бота для быстрой проверки прямо в чате с клиентом",
      "Экспортируйте PDF отчёты для документации и отчётности",
      "Проверяйте email новых контрагентов на утечки данных",
      "Регулярно проверяйте свои собственные email и домены на компрометацию",
      "Пригласите коллег через реферальную программу — получите бонусные проверки",
    ],
    [
      "Always check crypto wallet before transfers — even if you got the address from a 'friend'",
      "Verify URLs before entering passwords — phishing sites look identical to originals",
      "Use Bulk mode for mass checking IP/email lists after suspicious activity",
      "Set up monitoring for your domains and critical infrastructure",
      "Enable 2FA to protect your DARKSHARE account",
      "Use bot inline mode for quick checks right in client chats",
      "Export PDF reports for documentation and client reporting",
      "Check new counterparty emails for data breaches",
      "Regularly check your own emails and domains for compromise",
      "Invite colleagues via referral program — earn bonus checks",
    ]
  );

  return (
    <PageLayout title="Guide">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10 sm:space-y-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
              <BookOpen className="w-3 h-3 mr-1" />
              {L("Інструкція", "Инструкция", "Guide")}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground border-white/10">v4.4</Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight" data-testid="text-guide-title">
            DARKSHARE — {L("Повна інструкція", "Полная инструкция", "Complete Guide")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed" data-testid="text-guide-subtitle">
            {L(
              "Професійна OSINT платформа для аналізу безпеки. Перевіряйте IP, email, домени, крипто гаманці, телефони, URL, CVE, хеші файлів, юзернейми та BIN карток. Telegram бот, веб-дашборд, REST API.",
              "Профессиональная OSINT платформа для анализа безопасности. Проверяйте IP, email, домены, крипто кошельки, телефоны, URL, CVE, хеши файлов, юзернеймы и BIN карт.",
              "Professional OSINT platform for security analysis. Check IPs, emails, domains, crypto wallets, phones, URLs, CVEs, file hashes, usernames and card BINs. Telegram bot, web dashboard, REST API."
            )}
          </p>
        </motion.div>

        <Section title={L("Початок роботи", "Начало работы", "Getting Started")} icon={<Zap className="w-4 h-4 text-primary" />} delay={0.05}>
          <Card className="p-4 sm:p-5 bg-card/60 border-white/10 space-y-4">
            <StepCard step={1} title={L("Відкрийте бота", "Откройте бота", "Open the bot")} description={L("Знайдіть @DarkShare1Bot у Telegram і натисніть /start. Бот автоматично створить ваш акаунт.", "Найдите @DarkShare1Bot в Telegram и нажмите /start. Бот автоматически создаст ваш аккаунт.", "Find @DarkShare1Bot on Telegram and press /start. Bot auto-creates your account.")} />
            <StepCard step={2} title={L("Увійдіть на сайт", "Войдите на сайт", "Sign in to website")} description={L("Авторизуйтесь через Telegram або Google на darkshare.store для повного доступу до дашборду, історії та налаштувань.", "Авторизуйтесь через Telegram или Google на darkshare.store для полного доступа к дашборду, истории и настройкам.", "Auth via Telegram or Google at darkshare.store for full dashboard, history and settings access.")} />
            <StepCard step={3} title={L("Оберіть тип перевірки", "Выберите тип проверки", "Choose check type")} description={L("Натисніть «Перевірка» в боті або введіть дані на дашборді. Підтримується 11 типів аналізу.", "Нажмите «Проверка» в боте или введите данные на дашборде. Поддерживается 11 типов анализа.", "Press 'Check' in bot or enter data on dashboard. 11 analysis types supported.")} />
            <StepCard step={4} title={L("Отримайте звіт", "Получите отчёт", "Get report")} description={L("Детальний аналіз з risk score, findings, metadata. Збережіть у PDF, додайте до обраних або налаштуйте моніторинг.", "Детальный анализ с risk score, findings, metadata. Сохраните в PDF, добавьте в избранное или настройте мониторинг.", "Detailed analysis with risk score, findings, metadata. Save as PDF, add to favorites or set up monitoring.")} />
          </Card>
          <div className="flex flex-col sm:flex-row gap-2">
            <a href="https://t.me/DarkShare1Bot" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full sm:w-auto" data-testid="button-guide-open-bot">
                <SiTelegram className="w-4 h-4 mr-2" />
                {L("Відкрити бота", "Открыть бота", "Open Bot")}
                <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </Button>
            </a>
            <Link href="/dashboard">
              <Button className="w-full sm:w-auto" data-testid="button-guide-sign-in">
                <Shield className="w-4 h-4 mr-2" />
                {t("auth.signIn")}
              </Button>
            </Link>
          </div>
        </Section>

        <Section title={L("Типи перевірок (11 модулів)", "Типы проверок (11 модулей)", "Check Types (11 modules)")} icon={<Search className="w-4 h-4 text-primary" />} delay={0.08}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {checkTypes.map((ct) => (
              <Card key={ct.cmd} className="p-3.5 bg-card/60 border-white/10" data-testid={`card-guide-check-${ct.cmd}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {ct.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold">{ct.name}</h4>
                      <code className="text-[10px] font-mono text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">{ct.cmd}</code>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{ct.desc}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground/60">{L("Приклад:", "Пример:", "Example:")}</span>
                      <code className="text-[10px] font-mono text-primary/70 break-all">{ct.example}</code>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={L("Команди бота", "Команды бота", "Bot Commands")} icon={<Terminal className="w-4 h-4 text-primary" />} delay={0.1}>
          <Card className="p-4 bg-card/60 border-white/10 space-y-2">
            {botCommands.map((bc, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-2.5 rounded-lg bg-[#141418] border border-white/10">
                <code className="text-xs font-mono text-primary font-semibold whitespace-nowrap">{bc.cmd}</code>
                <span className="text-[11px] text-muted-foreground">{bc.desc}</span>
              </div>
            ))}
          </Card>
        </Section>

        <Section title={L("Інлайн режим бота", "Инлайн режим бота", "Inline Bot Mode")} icon={<SiTelegram className="w-4 h-4 text-[#2AABEE]" />} delay={0.12}>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {L(
              "Використовуйте бота прямо в будь-якому чаті Telegram — навіть у групових! Просто введіть ім'я бота, тип перевірки та значення. Результат з'явиться як inline повідомлення, яке можна надіслати у чат.",
              "Используйте бота прямо в любом чате Telegram — даже в групповых! Просто введите имя бота, тип проверки и значение. Результат появится как inline сообщение.",
              "Use the bot directly in any Telegram chat — even group chats! Just type the bot name, check type and value. Result appears as an inline message you can send."
            )}
          </p>
          <Card className="p-4 bg-card/60 border-white/10 space-y-2">
            {inlineExamples.map((ex, i) => (
              <InlineExample key={i} command={ex.cmd} description={ex.desc} />
            ))}
          </Card>
          <div className="p-3 rounded-lg bg-[#2AABEE]/10 border border-[#2AABEE]/20 space-y-2">
            <p className="text-xs font-semibold text-[#2AABEE]">{L("Як це працює:", "Как это работает:", "How it works:")}</p>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">1. {L("Відкрийте будь-який чат у Telegram", "Откройте любой чат в Telegram", "Open any Telegram chat")}</p>
              <p className="text-xs text-muted-foreground">2. {L("Введіть: @DarkShare1Bot ip 8.8.8.8", "Введите: @DarkShare1Bot ip 8.8.8.8", "Type: @DarkShare1Bot ip 8.8.8.8")}</p>
              <p className="text-xs text-muted-foreground">3. {L("Натисніть на результат для відправки у чат", "Нажмите на результат для отправки в чат", "Click the result to send it to chat")}</p>
              <p className="text-xs text-muted-foreground">4. {L("Всі 11 модулів доступні в inline режимі!", "Все 11 модулей доступны в inline режиме!", "All 11 modules available in inline mode!")}</p>
            </div>
          </div>
        </Section>

        <Section title={L("Сценарії використання", "Сценарии использования", "Use Cases")} icon={<Target className="w-4 h-4 text-primary" />} delay={0.14}>
          <div className="space-y-3">
            {useCases.map((uc, i) => (
              <Card key={i} className="p-4 bg-card/60 border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {uc.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold mb-1">{uc.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{uc.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={L("Можливості веб-дашборду", "Возможности веб-дашборда", "Web Dashboard Features")} icon={<BarChart3 className="w-4 h-4 text-primary" />} delay={0.16}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {dashFeatures.map((feat, i) => (
              <Card key={i} className="p-3.5 bg-card/60 border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {feat.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold">{feat.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={L("REST API документація", "REST API документация", "REST API Documentation")} icon={<Code className="w-4 h-4 text-primary" />} delay={0.18}>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
            <p className="text-xs text-amber-200">
              {L(
                "API доступний для PRO та ENTERPRISE тарифів. Авторизація через cookie session (Telegram/Google login). Base URL: https://www.darkshare.store",
                "API доступен для PRO и ENTERPRISE тарифов. Авторизация через cookie session. Base URL: https://www.darkshare.store",
                "API available for PRO and ENTERPRISE plans. Auth via cookie session (Telegram/Google login). Base URL: https://www.darkshare.store"
              )}
            </p>
          </div>
          <div className="space-y-2">
            {apiEndpoints.map((ep, i) => (
              <ApiEndpoint key={i} method={ep.method} path={ep.path} description={ep.desc} params={ep.params} response={ep.response} labels={{ params: L("Параметри", "Параметры", "Parameters"), response: L("Відповідь", "Ответ", "Response") }} />
            ))}
          </div>
          <Link href="/api-docs">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-guide-api-docs">
              <Code className="w-4 h-4 mr-2" />
              {L("Повна API документація", "Полная API документация", "Full API Documentation")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Section>

        <Section title={L("Тарифні плани", "Тарифные планы", "Subscription Plans")} icon={<CreditCard className="w-4 h-4 text-primary" />} delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`p-4 bg-card/60 border-white/10 space-y-3 ${plan.highlight ? "border-primary/40 ring-1 ring-primary/20" : ""}`}
                data-testid={`card-guide-plan-${plan.name.toLowerCase()}`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-bold">{plan.name}</h4>
                  {plan.highlight && (
                    <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 text-[10px]">
                      <Star className="w-3 h-3 mr-0.5" />
                      {L("Популярний", "Популярный", "Popular")}
                    </Badge>
                  )}
                </div>
                <p className="text-xl font-bold text-primary">{plan.price}</p>
                <ul className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground">
              {L(
                "Оплата: Криптовалюта (TON -5%, USDT, ETH, BTC), MonoPay (Monobank), промокоди. Підписка оновлюється автоматично або вручну.",
                "Оплата: Криптовалюта (TON -5%, USDT, ETH, BTC), MonoPay (Monobank), промокоды. Подписка обновляется автоматически или вручную.",
                "Payment: Crypto (TON -5%, USDT, ETH, BTC), MonoPay (Monobank), promo codes. Subscription renews automatically or manually."
              )}
            </p>
          </div>
          <Link href="/pricing">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-guide-pricing">
              {t("nav.pricing")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Section>

        <Section title={L("Безпека та поради", "Безопасность и советы", "Security Tips")} icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />} delay={0.22}>
          <Card className="p-4 bg-card/60 border-white/10 space-y-2.5">
            {securityTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-400">{i + 1}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </Card>
        </Section>

        <Section title={L("Часті питання (FAQ)", "Частые вопросы (FAQ)", "FAQ")} icon={<HelpCircle className="w-4 h-4 text-primary" />} delay={0.24}>
          <div className="space-y-2">
            {faqItems.map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </Section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-3 pt-4 pb-8"
        >
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto" data-testid="button-guide-dashboard">
              <Shield className="w-4 h-4 mr-2" />
              {t("nav.dashboard")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="https://t.me/DarkShare1Bot" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-guide-telegram">
              <SiTelegram className="w-4 h-4 mr-2" />
              Telegram Bot
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </Button>
          </a>
          <Link href="/api-docs">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-guide-api-docs-bottom">
              <Code className="w-4 h-4 mr-2" />
              API Docs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </PageLayout>
  );
}
