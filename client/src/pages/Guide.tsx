import { motion } from "framer-motion";
import {
  Shield,
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
  ChevronRight,
  BookOpen,
  Users,
  Activity,
  BarChart3,
  MessageCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  CheckCircle,
  Clock,
  Star,
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

export default function Guide() {
  const { t, lang } = useTranslation();

  const gettingStartedTitle = lang === "uk" ? "Початок роботи" : lang === "ru" ? "Начало работы" : "Getting Started";
  const checkTypesTitle = lang === "uk" ? "Типи перевірок" : lang === "ru" ? "Типы проверок" : "Check Types";
  const inlineModeTitle = lang === "uk" ? "Інлайн режим бота" : lang === "ru" ? "Инлайн режим бота" : "Inline Bot Mode";
  const dashboardTitle = lang === "uk" ? "Можливості дашборду" : lang === "ru" ? "Возможности дашборда" : "Dashboard Features";
  const plansTitle = lang === "uk" ? "Тарифні плани" : lang === "ru" ? "Тарифные планы" : "Subscription Plans";
  const tipsTitle = lang === "uk" ? "Поради та хитрощі" : lang === "ru" ? "Советы и хитрости" : "Tips & Tricks";

  const pageTitle = lang === "uk" ? "Інструкція" : lang === "ru" ? "Инструкция" : "Guide";
  const pageSubtitle = lang === "uk"
    ? "Повний посібник з використання DARKSHARE OSINT Platform"
    : lang === "ru"
    ? "Полное руководство по использованию DARKSHARE OSINT Platform"
    : "Complete guide to using DARKSHARE OSINT Platform";

  const step1Title = lang === "uk" ? "Відкрийте бота" : lang === "ru" ? "Откройте бота" : "Open the bot";
  const step1Desc = lang === "uk"
    ? "Знайдіть @DARKSHAREN1_BOT у Telegram і натисніть /start"
    : lang === "ru"
    ? "Найдите @DARKSHAREN1_BOT в Telegram и нажмите /start"
    : "Find @DARKSHAREN1_BOT on Telegram and press /start";

  const step2Title = lang === "uk" ? "Увійдіть на сайт" : lang === "ru" ? "Войдите на сайт" : "Sign in to website";
  const step2Desc = lang === "uk"
    ? "Авторизуйтесь через Telegram або Google для повного доступу"
    : lang === "ru"
    ? "Авторизуйтесь через Telegram или Google для полного доступа"
    : "Authenticate via Telegram or Google for full access";

  const step3Title = lang === "uk" ? "Почніть перевірку" : lang === "ru" ? "Начните проверку" : "Start checking";
  const step3Desc = lang === "uk"
    ? "Введіть IP, email, домен, гаманець або інші дані для аналізу"
    : lang === "ru"
    ? "Введите IP, email, домен, кошелёк или другие данные для анализа"
    : "Enter IP, email, domain, wallet or other data for analysis";

  const checkTypes = [
    {
      icon: <Globe className="w-4 h-4" />,
      name: lang === "uk" ? "IP Адреса" : lang === "ru" ? "IP Адрес" : "IP Address",
      desc: lang === "uk" ? "Геолокація, ISP, репутація, blacklist" : lang === "ru" ? "Геолокация, ISP, репутация, blacklist" : "Geolocation, ISP, reputation, blacklist",
      example: "8.8.8.8",
      cmd: "ip",
    },
    {
      icon: <Mail className="w-4 h-4" />,
      name: "Email",
      desc: lang === "uk" ? "Витоки даних, breach history, пов'язані акаунти" : lang === "ru" ? "Утечки данных, breach history, связанные аккаунты" : "Data breaches, breach history, linked accounts",
      example: "user@example.com",
      cmd: "email",
    },
    {
      icon: <Search className="w-4 h-4" />,
      name: lang === "uk" ? "Домен" : lang === "ru" ? "Домен" : "Domain",
      desc: lang === "uk" ? "WHOIS, DNS, SSL сертифікати, історія" : lang === "ru" ? "WHOIS, DNS, SSL сертификаты, история" : "WHOIS, DNS, SSL certificates, history",
      example: "example.com",
      cmd: "domain",
    },
    {
      icon: <Wallet className="w-4 h-4" />,
      name: lang === "uk" ? "Крипто гаманець" : lang === "ru" ? "Крипто кошелёк" : "Crypto Wallet",
      desc: lang === "uk" ? "Аналіз транзакцій, ризики, mixer detection" : lang === "ru" ? "Анализ транзакций, риски, mixer detection" : "Transaction analysis, risks, mixer detection",
      example: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
      cmd: "wallet",
    },
    {
      icon: <Phone className="w-4 h-4" />,
      name: lang === "uk" ? "Телефон" : lang === "ru" ? "Телефон" : "Phone",
      desc: lang === "uk" ? "Оператор, країна, тип лінії, spam" : lang === "ru" ? "Оператор, страна, тип линии, spam" : "Carrier, country, line type, spam",
      example: "+380501234567",
      cmd: "phone",
    },
    {
      icon: <AlertTriangle className="w-4 h-4" />,
      name: "URL",
      desc: lang === "uk" ? "Фішинг, малваре, репутація" : lang === "ru" ? "Фишинг, малвар, репутация" : "Phishing, malware, reputation",
      example: "https://suspicious-site.com",
      cmd: "url",
    },
    {
      icon: <Bot className="w-4 h-4" />,
      name: lang === "uk" ? "Telegram Bot Token" : lang === "ru" ? "Telegram Bot Token" : "Telegram Bot Token",
      desc: lang === "uk" ? "Валідність токена, інформація про бота" : lang === "ru" ? "Валидность токена, информация о боте" : "Token validity, bot information",
      example: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      cmd: "bot",
    },
    {
      icon: <Shield className="w-4 h-4" />,
      name: "CVE",
      desc: lang === "uk" ? "Вразливості, exploits, CVSS score" : lang === "ru" ? "Уязвимости, exploits, CVSS score" : "Vulnerabilities, exploits, CVSS score",
      example: "CVE-2021-44228",
      cmd: "cve",
    },
    {
      icon: <Bug className="w-4 h-4" />,
      name: lang === "uk" ? "Хеш файлу" : lang === "ru" ? "Хеш файла" : "File Hash",
      desc: lang === "uk" ? "VirusTotal аналіз, malware detection" : lang === "ru" ? "VirusTotal анализ, malware detection" : "VirusTotal analysis, malware detection",
      example: "d41d8cd98f00b204e9800998ecf8427e",
      cmd: "hash",
    },
    {
      icon: <Search className="w-4 h-4" />,
      name: "Username",
      desc: lang === "uk" ? "Пошук профілів на різних платформах" : lang === "ru" ? "Поиск профилей на разных платформах" : "Profile search across platforms",
      example: "johndoe",
      cmd: "username",
    },
    {
      icon: <CreditCard className="w-4 h-4" />,
      name: "BIN Card",
      desc: lang === "uk" ? "Інформація про банк, країна, тип картки" : lang === "ru" ? "Информация о банке, страна, тип карты" : "Bank info, country, card type",
      example: "424242",
      cmd: "card",
    },
  ];

  const inlineDesc = lang === "uk"
    ? "Використовуйте бота прямо в будь-якому чаті Telegram! Просто введіть ім'я бота та команду:"
    : lang === "ru"
    ? "Используйте бота прямо в любом чате Telegram! Просто введите имя бота и команду:"
    : "Use the bot directly in any Telegram chat! Just type the bot name and command:";

  const inlineExamples = [
    { cmd: "@DARKSHAREN1_BOT ip 8.8.8.8", desc: lang === "uk" ? "Перевірка IP адреси" : lang === "ru" ? "Проверка IP адреса" : "Check IP address" },
    { cmd: "@DARKSHAREN1_BOT email test@mail.com", desc: lang === "uk" ? "Перевірка email" : lang === "ru" ? "Проверка email" : "Check email" },
    { cmd: "@DARKSHAREN1_BOT domain google.com", desc: lang === "uk" ? "Перевірка домену" : lang === "ru" ? "Проверка домена" : "Check domain" },
    { cmd: "@DARKSHAREN1_BOT wallet 0x742d...", desc: lang === "uk" ? "Перевірка гаманця" : lang === "ru" ? "Проверка кошелька" : "Check wallet" },
    { cmd: "@DARKSHAREN1_BOT cve CVE-2021-44228", desc: lang === "uk" ? "Пошук вразливості" : lang === "ru" ? "Поиск уязвимости" : "Search vulnerability" },
  ];

  const dashFeatures = [
    {
      icon: <BarChart3 className="w-4 h-4 text-primary" />,
      title: lang === "uk" ? "Статистика перевірок" : lang === "ru" ? "Статистика проверок" : "Check Statistics",
      desc: lang === "uk" ? "Графіки, лічильники та аналітика всіх ваших перевірок" : lang === "ru" ? "Графики, счётчики и аналитика всех ваших проверок" : "Charts, counters and analytics of all your checks",
    },
    {
      icon: <Layers className="w-4 h-4 text-primary" />,
      title: lang === "uk" ? "Bulk перевірки" : lang === "ru" ? "Bulk проверки" : "Bulk Checks",
      desc: lang === "uk" ? "Перевіряйте до 50 об'єктів одночасно" : lang === "ru" ? "Проверяйте до 50 объектов одновременно" : "Check up to 50 targets at once",
    },
    {
      icon: <Activity className="w-4 h-4 text-primary" />,
      title: lang === "uk" ? "Моніторинг" : lang === "ru" ? "Мониторинг" : "Monitoring",
      desc: lang === "uk" ? "Автоматичне відстеження змін для вибраних цілей" : lang === "ru" ? "Автоматическое отслеживание изменений для выбранных целей" : "Automatic change tracking for selected targets",
    },
    {
      icon: <Users className="w-4 h-4 text-primary" />,
      title: lang === "uk" ? "Команди" : lang === "ru" ? "Команды" : "Teams",
      desc: lang === "uk" ? "Спільна робота з колегами, спільний доступ до результатів" : lang === "ru" ? "Совместная работа с коллегами, общий доступ к результатам" : "Collaborate with colleagues, share results",
    },
    {
      icon: <MessageCircle className="w-4 h-4 text-primary" />,
      title: lang === "uk" ? "Чат спільноти" : lang === "ru" ? "Чат сообщества" : "Community Chat",
      desc: lang === "uk" ? "Обговорюйте загрози з іншими дослідниками" : lang === "ru" ? "Обсуждайте угрозы с другими исследователями" : "Discuss threats with other researchers",
    },
    {
      icon: <Terminal className="w-4 h-4 text-primary" />,
      title: "API",
      desc: lang === "uk" ? "REST API для інтеграції з вашими системами" : lang === "ru" ? "REST API для интеграции с вашими системами" : "REST API for integration with your systems",
    },
  ];

  const plans = [
    {
      name: "FREE",
      price: "$0",
      features: lang === "uk"
        ? ["15 перевірок/день", "Базовий аналіз", "Історія 7 днів"]
        : lang === "ru"
        ? ["15 проверок/день", "Базовый анализ", "История 7 дней"]
        : ["15 checks/day", "Basic analysis", "7-day history"],
    },
    {
      name: "PRO",
      price: "$9.99/mo",
      features: lang === "uk"
        ? ["100 перевірок/день", "Повний аналіз", "API доступ", "Пріоритетна підтримка"]
        : lang === "ru"
        ? ["100 проверок/день", "Полный анализ", "API доступ", "Приоритетная поддержка"]
        : ["100 checks/day", "Full analysis", "API access", "Priority support"],
      highlight: true,
    },
    {
      name: "ENTERPRISE",
      price: "$29.99/mo",
      features: lang === "uk"
        ? ["Необмежені перевірки", "Усі модулі", "Команди", "Персональний менеджер"]
        : lang === "ru"
        ? ["Безлимитные проверки", "Все модули", "Команды", "Персональный менеджер"]
        : ["Unlimited checks", "All modules", "Teams", "Personal manager"],
    },
  ];

  const tips = lang === "uk"
    ? [
        "Використовуйте Bulk режим для масової перевірки — до 50 об'єктів за раз",
        "Налаштуйте моніторинг для критичних доменів та IP",
        "Інлайн режим працює в будь-якому чаті — навіть у групових",
        "Експортуйте звіти у PDF для документації",
        "Запросіть друзів через реферальну програму — отримайте додаткові перевірки",
      ]
    : lang === "ru"
    ? [
        "Используйте Bulk режим для массовой проверки — до 50 объектов за раз",
        "Настройте мониторинг для критических доменов и IP",
        "Инлайн режим работает в любом чате — даже в групповых",
        "Экспортируйте отчёты в PDF для документации",
        "Пригласите друзей через реферальную программу — получите дополнительные проверки",
      ]
    : [
        "Use Bulk mode for mass checking — up to 50 targets at once",
        "Set up monitoring for critical domains and IPs",
        "Inline mode works in any chat — even group chats",
        "Export reports to PDF for documentation",
        "Invite friends via referral program — earn extra checks",
      ];

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
              <BookOpen className="w-3 h-3 mr-1" />
              {pageTitle}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-guide-title">
            DARKSHARE — {pageTitle}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl" data-testid="text-guide-subtitle">
            {pageSubtitle}
          </p>
        </motion.div>

        <Section title={gettingStartedTitle} icon={<Zap className="w-4 h-4 text-primary" />} delay={0.1}>
          <Card className="p-4 sm:p-5 bg-card/60 border-white/10 space-y-4">
            <StepCard step={1} title={step1Title} description={step1Desc} />
            <StepCard step={2} title={step2Title} description={step2Desc} />
            <StepCard step={3} title={step3Title} description={step3Desc} />
          </Card>
          <div className="flex flex-col sm:flex-row gap-2">
            <a href="https://t.me/DARKSHAREN1_BOT" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full sm:w-auto" data-testid="button-guide-open-bot">
                <SiTelegram className="w-4 h-4 mr-2" />
                {lang === "uk" ? "Відкрити бота" : lang === "ru" ? "Открыть бота" : "Open Bot"}
                <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </Button>
            </a>
            <Link href="/login">
              <Button className="w-full sm:w-auto" data-testid="button-guide-sign-in">
                <Shield className="w-4 h-4 mr-2" />
                {t("auth.signIn")}
              </Button>
            </Link>
          </div>
        </Section>

        <Section title={checkTypesTitle} icon={<Search className="w-4 h-4 text-primary" />} delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {checkTypes.map((ct) => (
              <Card key={ct.cmd} className="p-3.5 bg-card/60 border-white/10" data-testid={`card-guide-check-${ct.cmd}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {ct.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold">{ct.name}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{ct.desc}</p>
                    <code className="text-[10px] font-mono text-primary/70 mt-1 block break-all">{ct.example}</code>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={inlineModeTitle} icon={<SiTelegram className="w-4 h-4 text-[#2AABEE]" />} delay={0.2}>
          <p className="text-sm text-muted-foreground">{inlineDesc}</p>
          <Card className="p-4 bg-card/60 border-white/10 space-y-2">
            {inlineExamples.map((ex, i) => (
              <InlineExample key={i} command={ex.cmd} description={ex.desc} />
            ))}
          </Card>
          <div className="p-3 rounded-lg bg-[#2AABEE]/10 border border-[#2AABEE]/20">
            <p className="text-xs text-muted-foreground">
              {lang === "uk"
                ? "Результат з'явиться як інлайн-повідомлення, яке ви можете надіслати у чат."
                : lang === "ru"
                ? "Результат появится как инлайн-сообщение, которое вы можете отправить в чат."
                : "The result will appear as an inline message you can send to the chat."}
            </p>
          </div>
        </Section>

        <Section title={dashboardTitle} icon={<BarChart3 className="w-4 h-4 text-primary" />} delay={0.25}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {dashFeatures.map((feat, i) => (
              <Card key={i} className="p-3.5 bg-card/60 border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {feat.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold">{feat.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={plansTitle} icon={<CreditCard className="w-4 h-4 text-primary" />} delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      Popular
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
          <Link href="/pricing">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-guide-pricing">
              {t("nav.pricing")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Section>

        <Section title={tipsTitle} icon={<Zap className="w-4 h-4 text-yellow-400" />} delay={0.35}>
          <Card className="p-4 bg-card/60 border-white/10 space-y-2.5">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{tip}</p>
              </div>
            ))}
          </Card>
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
          <a href="https://t.me/DARKSHAREN1_BOT" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-guide-telegram">
              <SiTelegram className="w-4 h-4 mr-2" />
              Telegram Bot
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </Button>
          </a>
        </motion.div>
      </div>
    </PageLayout>
  );
}
