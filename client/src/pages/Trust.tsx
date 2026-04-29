import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, Bug, Database, Globe, AlertTriangle, CheckCircle2, Clock, ExternalLink, Mail } from "lucide-react";
import { Link } from "wouter";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { useTranslation } from "@/lib/i18n";

interface ComplianceItem {
  name: string;
  status: "ready" | "in_progress" | "planned";
  description: string;
  eta?: string;
  icon: any;
}

export default function Trust() {
  const { lang } = useTranslation();

  const t = (uk: string, ru: string, es: string, de: string, en: string) =>
    lang === "uk" ? uk : lang === "ru" ? ru : lang === "es" ? es : lang === "de" ? de : en;

  const compliance: ComplianceItem[] = [
    {
      name: "GDPR",
      status: "ready",
      description: t(
        "Повна відповідність вимогам GDPR. Користувачі можуть експортувати, видалити дані будь-коли через /data-deletion або написавши на email.",
        "Полное соответствие GDPR. Пользователи могут экспортировать, удалить данные в любой момент через /data-deletion или email.",
        "Cumplimiento total con GDPR. Los usuarios pueden exportar o eliminar datos en cualquier momento.",
        "Vollständige DSGVO-Konformität. Nutzer können Daten jederzeit exportieren oder löschen.",
        "Full GDPR compliance. Users can export or delete data anytime via /data-deletion or email."
      ),
      icon: Shield,
    },
    {
      name: "CCPA",
      status: "ready",
      description: t(
        "Підтримка California Consumer Privacy Act — права на доступ, видалення, opt-out для каліфорнійських резидентів.",
        "Поддержка CCPA — права на доступ, удаление, opt-out для резидентов Калифорнии.",
        "Soporte CCPA — derechos de acceso, eliminación, opt-out para residentes de California.",
        "CCPA-Unterstützung — Zugriffs-, Lösch- und Opt-out-Rechte für Einwohner Kaliforniens.",
        "California Consumer Privacy Act compliance — rights to access, delete, opt-out."
      ),
      icon: FileCheck,
    },
    {
      name: "RFC 9116 / security.txt",
      status: "ready",
      description: t(
        "Опубліковано на /.well-known/security.txt — стандартний канал для відповідального розкриття вразливостей.",
        "Опубликовано на /.well-known/security.txt — стандартный канал для ответственного раскрытия уязвимостей.",
        "Publicado en /.well-known/security.txt — canal estándar para divulgación responsable de vulnerabilidades.",
        "Veröffentlicht auf /.well-known/security.txt — Standardkanal für verantwortliche Offenlegung.",
        "Published at /.well-known/security.txt — standard channel for responsible disclosure."
      ),
      icon: Lock,
    },
    {
      name: "SOC 2 Type II",
      status: "in_progress",
      eta: "Q4 2026",
      description: t(
        "Розпочато підготовку до SOC 2 Type II аудиту: контролі безпеки, доступу, моніторингу та реагування на інциденти.",
        "Начата подготовка к SOC 2 Type II аудиту: контроли безопасности, доступа, мониторинга, реагирования на инциденты.",
        "Iniciando preparación para SOC 2 Type II: controles de seguridad, acceso, monitoreo, respuesta a incidentes.",
        "Vorbereitung auf SOC 2 Type II Audit gestartet: Sicherheits-, Zugriffs-, Überwachungskontrollen.",
        "SOC 2 Type II audit preparation in progress: security, access, monitoring, incident response controls."
      ),
      icon: CheckCircle2,
    },
    {
      name: "ISO/IEC 27001",
      status: "in_progress",
      eta: "Q1 2027",
      description: t(
        "Розгортаємо систему управління інформаційною безпекою (ISMS) згідно з ISO/IEC 27001:2022.",
        "Развёртываем СУИБ (ISMS) согласно ISO/IEC 27001:2022.",
        "Implementando un SGSI (ISMS) conforme a ISO/IEC 27001:2022.",
        "Aufbau eines ISMS gemäß ISO/IEC 27001:2022.",
        "Deploying an ISMS aligned with ISO/IEC 27001:2022."
      ),
      icon: Globe,
    },
    {
      name: "PCI DSS SAQ A",
      status: "ready",
      description: t(
        "Оплати обробляє Stripe (PCI DSS Level 1 сертифікований). Ми не зберігаємо номери карт.",
        "Платежи обрабатывает Stripe (PCI DSS Level 1). Мы не храним номера карт.",
        "Pagos procesados por Stripe (PCI DSS Level 1). No almacenamos números de tarjeta.",
        "Zahlungen werden von Stripe verarbeitet (PCI DSS Level 1). Wir speichern keine Kartennummern.",
        "Payments handled by Stripe (PCI DSS Level 1 certified). We never store card numbers."
      ),
      icon: Lock,
    },
  ];

  const statusBadge = (s: ComplianceItem["status"]) => {
    if (s === "ready")
      return { text: t("Готово", "Готово", "Listo", "Bereit", "Ready"), cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };
    if (s === "in_progress")
      return { text: t("В процесі", "В процессе", "En curso", "Laufend", "In Progress"), cls: "bg-amber-500/10 text-amber-300 border-amber-500/30" };
    return { text: t("Заплановано", "Запланировано", "Planificado", "Geplant", "Planned"), cls: "bg-zinc-700/30 text-zinc-300 border-zinc-700" };
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0A]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/">
            <span className="cursor-pointer text-[14px] font-semibold tracking-tight text-white" data-testid="link-home-trust">DarkShare</span>
          </Link>
          <nav className="flex items-center gap-4 text-[13px] text-zinc-400">
            <Link href="/pricing"><span className="cursor-pointer hover:text-white">Pricing</span></Link>
            <Link href="/community"><span className="cursor-pointer hover:text-white">Community</span></Link>
            <Link href="/api-docs"><span className="cursor-pointer hover:text-white">API</span></Link>
          </nav>
        </div>
      </header>
      <Seo
        title={t("Безпека та довіра", "Безопасность и доверие", "Confianza y seguridad", "Vertrauen & Sicherheit", "Trust & Security")}
        description={t(
          "DARKSHARE — політики безпеки, відповідність GDPR/CCPA, SOC 2 та ISO 27001 roadmap, програма bug bounty, retention.",
          "DARKSHARE — политики безопасности, соответствие GDPR/CCPA, SOC 2 и ISO 27001 roadmap, bug bounty.",
          "DARKSHARE — políticas de seguridad, GDPR/CCPA, SOC 2 e ISO 27001, programa bug bounty.",
          "DARKSHARE — Sicherheitsrichtlinien, DSGVO/CCPA, SOC 2 und ISO 27001 Roadmap, Bug-Bounty.",
          "DARKSHARE — security policies, GDPR/CCPA compliance, SOC 2 & ISO 27001 roadmap, bug bounty program."
        )}
        path="/trust"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            {t("Trust Center", "Trust Center", "Trust Center", "Trust Center", "Trust Center")}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight" data-testid="text-trust-title">
            {t("Безпека та відповідність", "Безопасность и соответствие", "Seguridad y cumplimiento", "Sicherheit & Compliance", "Security & Compliance")}
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {t(
              "Прозорість — ключ до довіри. Тут зібрано все про наші політики безпеки, відповідність регуляціям і програму bug bounty.",
              "Прозрачность — ключ к доверию. Здесь собраны политики безопасности, регуляции и bug bounty.",
              "La transparencia es la clave de la confianza. Aquí están nuestras políticas, cumplimiento y bug bounty.",
              "Transparenz schafft Vertrauen. Hier finden Sie unsere Sicherheitsrichtlinien, Compliance und Bug-Bounty.",
              "Transparency builds trust. Here you'll find our security policies, regulatory compliance, and bug bounty program."
            )}
          </p>
        </motion.div>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              {t("Статус відповідності", "Статус соответствия", "Estado de cumplimiento", "Compliance-Status", "Compliance Status")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {compliance.map((c, i) => {
              const Icon = c.icon;
              const b = statusBadge(c.status);
              return (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent p-5 hover:border-cyan-500/20 transition-colors"
                  data-testid={`card-compliance-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-cyan-300" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        {c.eta && (
                          <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            ETA {c.eta}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${b.cls}`}>{b.text}</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{c.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.02] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Bug className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              {t("Програма Bug Bounty", "Программа Bug Bounty", "Programa Bug Bounty", "Bug-Bounty-Programm", "Bug Bounty Program")}
            </h2>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {t(
              "Ми платимо за відповідально розкриті вразливості. Перевага надається атакам на автентифікацію, RCE, SSRF, IDOR.",
              "Платим за ответственно раскрытые уязвимости. Приоритет: атаки на аутентификацию, RCE, SSRF, IDOR.",
              "Pagamos por vulnerabilidades reveladas de forma responsable. Prioridad: auth, RCE, SSRF, IDOR.",
              "Wir zahlen für verantwortungsvoll offengelegte Schwachstellen. Priorität: Auth, RCE, SSRF, IDOR.",
              "We pay for responsibly disclosed vulnerabilities. Priority: auth bypass, RCE, SSRF, IDOR."
            )}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t("Critical", "Critical", "Crítica", "Kritisch", "Critical"), payout: "$500–2000", cls: "border-red-500/30 text-red-300" },
              { label: "High", payout: "$200–500", cls: "border-orange-500/30 text-orange-300" },
              { label: "Medium", payout: "$50–200", cls: "border-amber-500/30 text-amber-300" },
              { label: "Low", payout: "$25–50", cls: "border-zinc-500/30 text-zinc-300" },
            ].map((tier) => (
              <div key={tier.label} className={`rounded-xl border bg-black/20 p-3 text-center ${tier.cls}`}>
                <div className="text-xs uppercase tracking-wider opacity-70 mb-1">{tier.label}</div>
                <div className="font-bold">{tier.payout}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="mailto:security@darkshare.store?subject=[Bug%20Bounty]%20Vulnerability%20Report"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 hover:bg-amber-500/20 transition-colors text-sm font-medium"
              data-testid="link-bug-bounty-email"
            >
              <Mail className="w-4 h-4" />
              security@darkshare.store
            </a>
            <a
              href="/.well-known/security.txt"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 hover:bg-white/[0.08] transition-colors text-sm font-medium"
              data-testid="link-security-txt"
            >
              <Lock className="w-4 h-4" />
              security.txt
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              {t("Зберігання даних", "Хранение данных", "Retención de datos", "Datenaufbewahrung", "Data Retention")}
            </h2>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
            {[
              {
                k: t("Звіти користувача", "Отчёты пользователя", "Informes del usuario", "Nutzerberichte", "User reports"),
                v: t("90 днів (FREE), 1 рік (PRO+), необмежено (ENTERPRISE)", "90 дней (FREE), 1 год (PRO+), без ограничений (ENTERPRISE)", "90 días (FREE), 1 año (PRO+), ilimitado (ENTERPRISE)", "90 Tage (FREE), 1 Jahr (PRO+), unbegrenzt (ENTERPRISE)", "90 days (FREE), 1 year (PRO+), unlimited (ENTERPRISE)"),
              },
              {
                k: t("Логи API", "Логи API", "Logs de API", "API-Logs", "API logs"),
                v: t("30 днів rolling", "30 дней rolling", "30 días rolling", "30 Tage rollierend", "30 days rolling"),
              },
              {
                k: t("Резервні копії БД", "Резервные копии БД", "Backups de BD", "DB-Backups", "DB backups"),
                v: t("Щоденно, 7 днів збереження", "Ежедневно, 7 дней хранения", "Diario, 7 días de retención", "Täglich, 7 Tage Aufbewahrung", "Daily, 7-day retention"),
              },
              {
                k: t("Дані видаленого акаунту", "Данные удалённого аккаунта", "Datos de cuenta eliminada", "Daten gelöschter Konten", "Deleted account data"),
                v: t("Видаляються протягом 30 днів", "Удаляются в течение 30 дней", "Eliminados en 30 días", "Werden innerhalb 30 Tagen gelöscht", "Purged within 30 days"),
              },
              {
                k: t("Платіжні записи", "Платёжные записи", "Registros de pago", "Zahlungsdaten", "Payment records"),
                v: t("7 років (вимога податкового законодавства)", "7 лет (требование налогового законодательства)", "7 años (requisito legal)", "7 Jahre (gesetzlich)", "7 years (legal/tax requirement)"),
              },
            ].map((row) => (
              <div key={row.k} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="text-sm text-zinc-300 font-medium">{row.k}</div>
                <div className="text-sm text-zinc-400 font-mono">{row.v}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.04] to-blue-500/[0.02] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              {t("Reporting Security Issues", "Сообщить о проблеме", "Reportar problemas", "Probleme melden", "Reporting Security Issues")}
            </h2>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {t(
              "Якщо ви знайшли вразливість — будь ласка, не публікуйте її. Зв'яжіться з security@darkshare.store. Ми відповідаємо протягом 48 годин і працюємо над фіксом разом з вами.",
              "Если вы нашли уязвимость — пожалуйста, не публикуйте её. Свяжитесь с security@darkshare.store. Отвечаем в течение 48 часов.",
              "Si encuentras una vulnerabilidad, no la publiques. Contacta security@darkshare.store. Respondemos en 48h.",
              "Wenn Sie eine Schwachstelle finden — bitte nicht veröffentlichen. Kontaktieren Sie security@darkshare.store. Antwort innerhalb 48h.",
              "If you find a vulnerability — please don't publish it. Contact security@darkshare.store. We respond within 48 hours."
            )}
          </p>
          <div className="text-xs text-zinc-500 font-mono">
            PGP fingerprint: <span className="text-cyan-300">8F4A 2B6C 9D1E 3F7A 5C8B · 1D4E 6F2A 9B3C 7E5D 0A8F</span>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
