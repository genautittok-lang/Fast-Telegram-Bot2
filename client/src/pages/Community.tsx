import { useState } from "react";
import { motion } from "framer-motion";
import { Github, MessageCircle, BookOpen, Code, Terminal, Copy, Check, Users, Zap, ExternalLink } from "lucide-react";
import { SiTelegram, SiDiscord, SiMedium, SiPython, SiNodedotjs } from "react-icons/si";
import { Link } from "wouter";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

type Snippet = { id: string; lang: string; icon: any; code: string; install: string };

export default function Community() {
  const { lang } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("curl");
  const [copied, setCopied] = useState<string | null>(null);

  const t = (uk: string, ru: string, es: string, de: string, en: string) =>
    lang === "uk" ? uk : lang === "ru" ? ru : lang === "es" ? es : lang === "de" ? de : en;

  const snippets: Snippet[] = [
    {
      id: "curl",
      lang: "curl",
      icon: Terminal,
      install: "# no install needed",
      code: `curl -X POST https://www.darkshare.store/api/v1/check \\
  -H "Authorization: Bearer dk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"wallet","value":"0xAbC...123"}'`,
    },
    {
      id: "python",
      lang: "Python",
      icon: SiPython,
      install: "pip install darkshare",
      code: `from darkshare import Client

client = Client(api_key="dk_YOUR_KEY")
result = client.check(type="wallet", value="0xAbC...123")
print(result.risk_score, result.findings)`,
    },
    {
      id: "node",
      lang: "Node.js",
      icon: SiNodedotjs,
      install: "npm install @darkshare/sdk",
      code: `import { Client } from "@darkshare/sdk";

const client = new Client({ apiKey: "dk_YOUR_KEY" });
const result = await client.check({ type: "wallet", value: "0xAbC...123" });
console.log(result.riskScore, result.findings);`,
    },
    {
      id: "go",
      lang: "Go",
      icon: Code,
      install: "go get github.com/darkshare/go-sdk",
      code: `package main
import "github.com/darkshare/go-sdk"

func main() {
  c := darkshare.New("dk_YOUR_KEY")
  r, _ := c.Check("wallet", "0xAbC...123")
  fmt.Println(r.RiskScore, r.Findings)
}`,
    },
  ];

  const channels = [
    {
      name: "Telegram Bot",
      handle: "@DarkShare1Bot",
      url: "https://t.me/DarkShare1Bot",
      icon: SiTelegram,
      color: "#229ED9",
      desc: t("Усі 17 модулів через бот", "Все 17 модулей через бот", "17 módulos vía bot", "17 Module via Bot", "All 17 modules via bot"),
    },
    {
      name: "Telegram Channel",
      handle: "@darkshare_news",
      url: "https://t.me/darkshare_news",
      icon: SiTelegram,
      color: "#229ED9",
      desc: t("Оновлення, CVE alerts, OSINT-кейси", "Обновления, CVE alerts, OSINT-кейсы", "Actualizaciones, CVE alerts, OSINT", "Updates, CVE-Alerts, OSINT-Fälle", "Updates, CVE alerts, OSINT cases"),
    },
    {
      name: "Discord",
      handle: "discord.gg/darkshare",
      url: "https://discord.gg/darkshare",
      icon: SiDiscord,
      color: "#5865F2",
      desc: t("Спільнота SOC-аналітиків і researchers", "Сообщество SOC и researchers", "Comunidad SOC y researchers", "SOC- und Research-Community", "SOC analysts & researchers community"),
    },
    {
      name: "GitHub",
      handle: "github.com/darkshare",
      url: "https://github.com/darkshare",
      icon: Github,
      color: "#fff",
      desc: t("Open-source CLI/SDK + integrations", "Open-source CLI/SDK + integrations", "CLI/SDK open-source + integraciones", "Open-Source CLI/SDK + Integrationen", "Open-source CLI/SDK + integrations"),
    },
    {
      name: "Medium",
      handle: "@darkshare",
      url: "https://medium.com/@darkshare",
      icon: SiMedium,
      color: "#fff",
      desc: t("Глибокі техно-статті англійською", "Глубокие техно-статьи на английском", "Artículos técnicos en inglés", "Technische Artikel auf Englisch", "Deep technical articles in English"),
    },
    {
      name: "Telegraph",
      handle: "telegra.ph/DARKSHARE",
      url: "https://telegra.ph/DARKSHARE--Security-OSINT-Guide-04-29-24",
      icon: BookOpen,
      color: "#0088cc",
      desc: t("Інструкції на 5 мовах", "Инструкции на 5 языках", "Guías en 5 idiomas", "Anleitungen in 5 Sprachen", "Guides in 5 languages"),
    },
  ];

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    toast({ title: t("Скопійовано", "Скопировано", "Copiado", "Kopiert", "Copied") });
    setTimeout(() => setCopied(null), 1800);
  };

  const active = snippets.find((s) => s.id === activeTab) || snippets[0];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0A]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/">
            <span className="cursor-pointer text-[14px] font-semibold tracking-tight text-white" data-testid="link-home-community">DarkShare</span>
          </Link>
          <nav className="flex items-center gap-4 text-[13px] text-zinc-400">
            <Link href="/pricing"><span className="cursor-pointer hover:text-white">Pricing</span></Link>
            <Link href="/trust"><span className="cursor-pointer hover:text-white">Trust</span></Link>
            <Link href="/api-docs"><span className="cursor-pointer hover:text-white">API</span></Link>
          </nav>
        </div>
      </header>
      <Seo
        title={t("Спільнота та SDK", "Сообщество и SDK", "Comunidad y SDK", "Community & SDK", "Community & SDK")}
        description={t(
          "Підключайтесь до спільноти DARKSHARE: Telegram, Discord, GitHub з відкритим CLI та SDK для Python/Node/Go.",
          "Подключайтесь к сообществу DARKSHARE: Telegram, Discord, GitHub с открытым CLI/SDK.",
          "Únete a la comunidad DARKSHARE: Telegram, Discord, GitHub con CLI/SDK open-source.",
          "Werden Sie Teil der DARKSHARE-Community: Telegram, Discord, GitHub mit Open-Source-CLI/SDK.",
          "Join the DARKSHARE community: Telegram, Discord, GitHub with open-source CLI & SDK."
        )}
        path="/community"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            {t("Open Community", "Open Community", "Open Community", "Open Community", "Open Community")}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight" data-testid="text-community-title">
            {t("Спільнота та інструменти", "Сообщество и инструменты", "Comunidad y herramientas", "Community & Tools", "Community & Tools")}
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {t(
              "Спілкуйся з тими, хто живе OSINT. Інтегруй DARKSHARE у свій stack за 60 секунд.",
              "Общайся с теми, кто живёт OSINT. Интегрируй DARKSHARE в свой stack за 60 секунд.",
              "Conecta con quienes viven OSINT. Integra DARKSHARE en tu stack en 60 segundos.",
              "Tausche dich mit OSINT-Profis aus. Integriere DARKSHARE in 60 Sekunden.",
              "Connect with people who live and breathe OSINT. Integrate DARKSHARE into your stack in 60 seconds."
            )}
          </p>
        </motion.div>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              {t("SDK та CLI", "SDK и CLI", "SDK y CLI", "SDK & CLI", "SDK & CLI")}
            </h2>
            <span className="ml-auto px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              MIT License
            </span>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-black/40 overflow-hidden">
            <div className="flex flex-wrap gap-1 border-b border-white/[0.06] bg-black/40 px-2 py-2">
              {snippets.map((s) => {
                const Icon = s.icon;
                const isActive = s.id === activeTab;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveTab(s.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-cyan-500/15 text-cyan-200 border border-cyan-500/30" : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                    }`}
                    data-testid={`tab-snippet-${s.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.lang}
                  </button>
                );
              })}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <code className="text-xs text-zinc-500 font-mono">$ {active.install}</code>
                <button
                  onClick={() => copyCode(active.id, active.code)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.04] transition-colors"
                  data-testid={`btn-copy-${active.id}`}
                >
                  {copied === active.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === active.id ? t("Готово", "Готово", "Listo", "Fertig", "Copied") : t("Копіювати", "Копировать", "Copiar", "Kopieren", "Copy")}
                </button>
              </div>
              <pre className="text-sm text-cyan-100/90 font-mono overflow-x-auto whitespace-pre leading-relaxed">{active.code}</pre>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: t("Async-first", "Async-first", "Async-first", "Async-first", "Async-first"), v: t("Підтримка async/await і потоків", "Поддержка async/await и потоков", "Soporte async/await y streams", "Async/Await und Streams", "Async/await and streams"), icon: Zap },
              { label: t("Type-safe", "Type-safe", "Type-safe", "Type-safe", "Type-safe"), v: t("TypeScript типи + Pydantic моделі", "TypeScript типы + Pydantic", "Tipos TS + Pydantic", "TypeScript-Typen + Pydantic", "TypeScript types + Pydantic"), icon: Code },
              { label: t("Auto-retry", "Auto-retry", "Auto-retry", "Auto-retry", "Auto-retry"), v: t("Backoff, rate-limit handling, ідемпотентність", "Backoff, rate-limit, идемпотентность", "Backoff, rate-limit, idempotencia", "Backoff, Rate-Limit, Idempotenz", "Backoff, rate-limit, idempotency"), icon: Terminal },
            ].map((f) => {
              const I = f.icon;
              return (
                <div key={f.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-cyan-300 mb-1.5">
                    <I className="w-4 h-4" />
                    <span className="font-semibold text-sm">{f.label}</span>
                  </div>
                  <div className="text-xs text-zinc-400 leading-relaxed">{f.v}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              {t("Канали", "Каналы", "Canales", "Kanäle", "Channels")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.a
                  key={c.name}
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all"
                  data-testid={`link-channel-${c.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15`, border: `1px solid ${c.color}30` }}>
                      <Icon className="w-5 h-5" style={{ color: c.color }} />
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{c.name}</div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">{c.handle}</div>
                  <div className="text-sm text-zinc-400 mt-2 leading-relaxed">{c.desc}</div>
                </motion.a>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.04] to-blue-500/[0.02] p-6 sm:p-8 text-center space-y-3">
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            {t("Запустити свою інтеграцію?", "Запустить свою интеграцию?", "¿Lanzar tu integración?", "Eigene Integration starten?", "Building your own integration?")}
          </h3>
          <p className="text-zinc-400 max-w-xl mx-auto">
            {t(
              "Маємо готові hooks для Slack, Discord, MS Teams, Splunk, IBM QRadar, Microsoft Sentinel.",
              "Готовые hooks для Slack, Discord, MS Teams, Splunk, IBM QRadar, Sentinel.",
              "Hooks listos para Slack, Discord, MS Teams, Splunk, QRadar, Sentinel.",
              "Hooks für Slack, Discord, MS Teams, Splunk, QRadar, Sentinel.",
              "Ready hooks for Slack, Discord, MS Teams, Splunk, IBM QRadar, Microsoft Sentinel."
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="/api-docs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors text-sm"
              data-testid="link-api-docs-cta"
            >
              <Code className="w-4 h-4" />
              {t("API документація", "API документация", "Documentación API", "API-Dokumentation", "API Documentation")}
            </a>
            <a
              href="mailto:integrations@darkshare.store"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 hover:bg-white/[0.08] transition-colors text-sm"
              data-testid="link-integrations-email"
            >
              integrations@darkshare.store
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
