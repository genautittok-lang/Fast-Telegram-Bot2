import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe, Server, Mail, Shield, AlertTriangle, CheckCircle, Clock,
  Loader2, FileText, Calendar, Network, Lock, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Lang = "en" | "uk" | "ru" | "es" | "de";

interface DomainOsintProps {
  domain: string;
  lang?: Lang;
  autoRun?: boolean;
}

interface OsintFinding {
  code: string;
  params?: Record<string, string | number>;
}

interface OsintResult {
  domain: string;
  checkedAt: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  findings: OsintFinding[];
  dns: {
    a: string[];
    aaaa: string[];
    mx: { exchange: string; priority: number }[];
    ns: string[];
    txt: string[];
    cname: string[];
    soa: any;
  };
  whois: null | {
    handle: string | null;
    ldhName: string;
    status: string[];
    registrar: string | null;
    registered: string | null;
    expires: string | null;
    lastChanged: string | null;
    nameservers: string[];
  };
  ssl: null | {
    valid: boolean;
    authorizationError: string | null;
    issuer: string | null;
    subject: string | null;
    validFrom: string | null;
    validTo: string | null;
    altNames: string[];
    fingerprint256: string | null;
    serialNumber: string | null;
  };
}

const labels: Record<Lang, Record<string, string>> = {
  en: {
    title: "Domain OSINT", subtitle: "DNS · WHOIS · SSL — full intelligence sweep",
    run: "Run domain scan", running: "Scanning…",
    risk: "Risk", findings: "Findings", noFindings: "No issues detected",
    dns: "DNS records", whois: "Registration (WHOIS)", ssl: "SSL certificate",
    a: "A (IPv4)", aaaa: "AAAA (IPv6)", mx: "MX (mail)", ns: "Name servers", txt: "TXT", cname: "CNAME",
    registrar: "Registrar", registered: "Registered", expires: "Expires", lastChanged: "Last changed", status: "Status",
    issuer: "Issuer", subject: "Subject", validFrom: "Valid from", validTo: "Valid to", altNames: "Alt names", serial: "Serial",
    valid: "Valid chain", invalid: "Chain not validated",
    sslMissing: "No SSL on port 443", whoisMissing: "WHOIS not available",
    error: "Scan failed", retry: "Retry", copy: "Copy", copied: "Copied",
    days: "days", expired: "expired", expiresIn: "expires in",
    low: "Low", medium: "Medium", high: "High", critical: "Critical",
    f_private_ip: "Domain resolves to private/internal IP — possible internal exposure",
    f_ssl_unreachable: "Cannot probe SSL — no public IP available",
    f_ssl_missing: "No SSL certificate detected on port 443",
    f_ssl_expired: "SSL certificate expired {days} days ago",
    f_ssl_expiring: "SSL certificate expires in {days} days",
    f_ssl_chain_invalid: "SSL chain not validated: {reason}",
    f_domain_expired: "Domain registration expired {days} days ago",
    f_domain_expiring: "Domain expires in {days} days",
    f_no_a_records: "No A/AAAA records — domain may not resolve",
    f_no_mx_records: "No MX records — email delivery may not work",
    f_domain_status_locked: "Domain has restrictive status flags",
  },
  uk: {
    title: "Domain OSINT", subtitle: "DNS · WHOIS · SSL — повне розвідування",
    run: "Запустити сканування", running: "Сканування…",
    risk: "Ризик", findings: "Знахідки", noFindings: "Проблем не виявлено",
    dns: "DNS записи", whois: "Реєстрація (WHOIS)", ssl: "SSL-сертифікат",
    a: "A (IPv4)", aaaa: "AAAA (IPv6)", mx: "MX (пошта)", ns: "Name-сервери", txt: "TXT", cname: "CNAME",
    registrar: "Реєстратор", registered: "Зареєстровано", expires: "Закінчується", lastChanged: "Остання зміна", status: "Статус",
    issuer: "Видавець", subject: "Власник", validFrom: "Дійсний з", validTo: "Дійсний до", altNames: "Альт. імена", serial: "Серійний",
    valid: "Ланцюг валідний", invalid: "Ланцюг не валідовано",
    sslMissing: "Немає SSL на порту 443", whoisMissing: "WHOIS недоступний",
    error: "Помилка сканування", retry: "Повторити", copy: "Копіювати", copied: "Скопійовано",
    days: "днів", expired: "минув", expiresIn: "до закінчення",
    low: "Низький", medium: "Середній", high: "Високий", critical: "Критичний",
    f_private_ip: "Домен резолвиться на приватну/внутрішню IP — можлива внутрішня експозиція",
    f_ssl_unreachable: "Неможливо перевірити SSL — немає публічної IP",
    f_ssl_missing: "SSL-сертифікат на порту 443 не знайдено",
    f_ssl_expired: "SSL-сертифікат прострочений {days} днів тому",
    f_ssl_expiring: "SSL-сертифікат закінчується через {days} днів",
    f_ssl_chain_invalid: "Ланцюг SSL не валідований: {reason}",
    f_domain_expired: "Реєстрація домену прострочена {days} днів тому",
    f_domain_expiring: "Домен закінчується через {days} днів",
    f_no_a_records: "Немає A/AAAA записів — домен може не резолвитися",
    f_no_mx_records: "Немає MX записів — пошта може не працювати",
    f_domain_status_locked: "Домен має обмежувальні статусні прапорці",
  },
  ru: {
    title: "Domain OSINT", subtitle: "DNS · WHOIS · SSL — полная разведка",
    run: "Запустить сканирование", running: "Сканирование…",
    risk: "Риск", findings: "Находки", noFindings: "Проблем не обнаружено",
    dns: "DNS записи", whois: "Регистрация (WHOIS)", ssl: "SSL-сертификат",
    a: "A (IPv4)", aaaa: "AAAA (IPv6)", mx: "MX (почта)", ns: "Name-серверы", txt: "TXT", cname: "CNAME",
    registrar: "Регистратор", registered: "Зарегистрирован", expires: "Истекает", lastChanged: "Последнее изменение", status: "Статус",
    issuer: "Издатель", subject: "Владелец", validFrom: "Действителен с", validTo: "Действителен до", altNames: "Альт. имена", serial: "Серийный",
    valid: "Цепочка валидна", invalid: "Цепочка не валидирована",
    sslMissing: "Нет SSL на порту 443", whoisMissing: "WHOIS недоступен",
    error: "Ошибка сканирования", retry: "Повторить", copy: "Копировать", copied: "Скопировано",
    days: "дней", expired: "истёк", expiresIn: "до истечения",
    low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критический",
    f_private_ip: "Домен резолвится в приватный/внутренний IP — возможна внутренняя экспозиция",
    f_ssl_unreachable: "Невозможно проверить SSL — нет публичного IP",
    f_ssl_missing: "SSL-сертификат на порту 443 не найден",
    f_ssl_expired: "SSL-сертификат истёк {days} дней назад",
    f_ssl_expiring: "SSL-сертификат истекает через {days} дней",
    f_ssl_chain_invalid: "Цепочка SSL не валидирована: {reason}",
    f_domain_expired: "Регистрация домена истекла {days} дней назад",
    f_domain_expiring: "Домен истекает через {days} дней",
    f_no_a_records: "Нет A/AAAA записей — домен может не резолвиться",
    f_no_mx_records: "Нет MX записей — почта может не работать",
    f_domain_status_locked: "Домен имеет ограничительные статусные флаги",
  },
  es: {
    title: "Domain OSINT", subtitle: "DNS · WHOIS · SSL — barrido completo",
    run: "Ejecutar escaneo", running: "Escaneando…",
    risk: "Riesgo", findings: "Hallazgos", noFindings: "Sin problemas",
    dns: "Registros DNS", whois: "Registro (WHOIS)", ssl: "Certificado SSL",
    a: "A (IPv4)", aaaa: "AAAA (IPv6)", mx: "MX (correo)", ns: "Name servers", txt: "TXT", cname: "CNAME",
    registrar: "Registrador", registered: "Registrado", expires: "Expira", lastChanged: "Último cambio", status: "Estado",
    issuer: "Emisor", subject: "Sujeto", validFrom: "Válido desde", validTo: "Válido hasta", altNames: "Nombres alt.", serial: "Serial",
    valid: "Cadena válida", invalid: "Cadena no validada",
    sslMissing: "Sin SSL en el puerto 443", whoisMissing: "WHOIS no disponible",
    error: "Error en escaneo", retry: "Reintentar", copy: "Copiar", copied: "Copiado",
    days: "días", expired: "expirado", expiresIn: "expira en",
    low: "Bajo", medium: "Medio", high: "Alto", critical: "Crítico",
    f_private_ip: "El dominio resuelve a una IP privada/interna — posible exposición interna",
    f_ssl_unreachable: "No se puede comprobar SSL — sin IP pública",
    f_ssl_missing: "Sin certificado SSL en el puerto 443",
    f_ssl_expired: "Certificado SSL expiró hace {days} días",
    f_ssl_expiring: "Certificado SSL expira en {days} días",
    f_ssl_chain_invalid: "Cadena SSL no validada: {reason}",
    f_domain_expired: "Registro del dominio expiró hace {days} días",
    f_domain_expiring: "El dominio expira en {days} días",
    f_no_a_records: "Sin registros A/AAAA — el dominio puede no resolverse",
    f_no_mx_records: "Sin registros MX — el correo puede no funcionar",
    f_domain_status_locked: "El dominio tiene flags de estado restrictivos",
  },
  de: {
    title: "Domain OSINT", subtitle: "DNS · WHOIS · SSL — vollständige Aufklärung",
    run: "Scan starten", running: "Scannen…",
    risk: "Risiko", findings: "Befunde", noFindings: "Keine Probleme",
    dns: "DNS-Einträge", whois: "Registrierung (WHOIS)", ssl: "SSL-Zertifikat",
    a: "A (IPv4)", aaaa: "AAAA (IPv6)", mx: "MX (E-Mail)", ns: "Nameserver", txt: "TXT", cname: "CNAME",
    registrar: "Registrar", registered: "Registriert", expires: "Läuft ab", lastChanged: "Zuletzt geändert", status: "Status",
    issuer: "Aussteller", subject: "Inhaber", validFrom: "Gültig ab", validTo: "Gültig bis", altNames: "Alt. Namen", serial: "Seriennr.",
    valid: "Kette gültig", invalid: "Kette nicht validiert",
    sslMissing: "Kein SSL auf Port 443", whoisMissing: "WHOIS nicht verfügbar",
    error: "Scan fehlgeschlagen", retry: "Wiederholen", copy: "Kopieren", copied: "Kopiert",
    days: "Tage", expired: "abgelaufen", expiresIn: "läuft ab in",
    low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch",
    f_private_ip: "Domain löst zu privater/interner IP auf — mögliche interne Exposition",
    f_ssl_unreachable: "SSL kann nicht geprüft werden — keine öffentliche IP",
    f_ssl_missing: "Kein SSL-Zertifikat auf Port 443",
    f_ssl_expired: "SSL-Zertifikat seit {days} Tagen abgelaufen",
    f_ssl_expiring: "SSL-Zertifikat läuft in {days} Tagen ab",
    f_ssl_chain_invalid: "SSL-Kette nicht validiert: {reason}",
    f_domain_expired: "Domain-Registrierung seit {days} Tagen abgelaufen",
    f_domain_expiring: "Domain läuft in {days} Tagen ab",
    f_no_a_records: "Keine A/AAAA-Einträge — Domain wird möglicherweise nicht aufgelöst",
    f_no_mx_records: "Keine MX-Einträge — E-Mail-Zustellung funktioniert evtl. nicht",
    f_domain_status_locked: "Domain hat restriktive Status-Flags",
  },
};

const SUPPORTED_LANGS: Lang[] = ["en", "uk", "ru", "es", "de"];

function renderFinding(t: Record<string, string>, code: string, params?: Record<string, string | number>): string {
  const tpl = t[`f_${code}`] || code;
  if (!params) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (_m, k) => String(params[k] ?? ""));
}

const RISK_COLOR: Record<string, string> = {
  low: "text-cyan-300 bg-cyan-500/10 border-cyan-500/40",
  medium: "text-yellow-300 bg-yellow-500/10 border-yellow-500/40",
  high: "text-orange-300 bg-orange-500/10 border-orange-500/40",
  critical: "text-red-300 bg-red-500/10 border-red-500/40",
};

function daysFromNow(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86400000);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return iso; }
}

export default function DomainOsintCard({ domain, lang = "en", autoRun = true }: DomainOsintProps) {
  const safeLang: Lang = SUPPORTED_LANGS.includes(lang as Lang) ? (lang as Lang) : "en";
  const t = labels[safeLang];
  const [data, setData] = useState<OsintResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const run = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/osint/domain", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setData(body as OsintResult);
    } catch (e: any) {
      setError(e?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRun && domain) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, autoRun]);

  const copyVal = (key: string, val: string) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  };

  const Section = ({ icon: Icon, title, children, testId }: any) => (
    <div className="rounded-xl border border-cyan-500/20 bg-zinc-900/40 p-3" data-testid={testId}>
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800/60">
        <Icon className="w-4 h-4 text-cyan-400" />
        <h4 className="text-xs font-display font-semibold text-cyan-300 uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );

  const Row = ({ label, value, k }: { label: string; value: string | null | undefined; k: string }) => (
    <div className="flex items-center justify-between gap-2 py-1 text-[11px] sm:text-xs">
      <span className="text-zinc-500 truncate">{label}</span>
      <div className="flex items-center gap-1 max-w-[60%]">
        <span className="text-zinc-200 truncate font-mono" title={value || ""}>{value || "—"}</span>
        {value && (
          <button
            onClick={() => copyVal(k, value)}
            className="text-zinc-500 hover:text-cyan-300 p-0.5 rounded transition-colors"
            aria-label={`${t.copy} ${label}`}
          >
            {copied === k ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );

  const ListBlock = ({ label, items }: { label: string; items: string[] }) => (
    <div className="py-1">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{label}</div>
      {items.length === 0 ? (
        <span className="text-[11px] text-zinc-600">—</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.slice(0, 12).map((it, i) => (
            <Badge key={`${label}-${i}`} variant="outline" className="text-[10px] font-mono border-cyan-500/30 text-cyan-200 bg-zinc-950/60">
              {it}
            </Badge>
          ))}
          {items.length > 12 && <span className="text-[10px] text-zinc-500">+{items.length - 12}</span>}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900/60 to-zinc-950 p-4 sm:p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
      data-testid="domain-osint-card"
    >
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-700/10 border border-cyan-500/40 flex items-center justify-center">
            <Globe className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-display font-bold text-cyan-300 leading-tight">{t.title}</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500">{t.subtitle}</p>
          </div>
        </div>
        {data && (
          <Badge className={`text-[10px] uppercase tracking-wider font-bold border ${RISK_COLOR[data.riskLevel]}`}>
            {t.risk}: {t[data.riskLevel]} · {data.riskScore}
          </Badge>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-2 py-8 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-xs">{t.running}</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <span className="text-xs text-red-300">{error}</span>
          <Button size="sm" variant="outline" onClick={run} className="border-cyan-500/30 text-cyan-300" data-testid="button-osint-retry">
            {t.retry}
          </Button>
        </div>
      )}

      {!loading && !error && !data && (
        <div className="flex justify-center py-4">
          <Button onClick={run} className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium gap-2" data-testid="button-osint-run">
            <Network className="w-4 h-4" />
            {t.run}
          </Button>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-3">
          {data.findings.length > 0 && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3" data-testid="osint-findings">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] uppercase tracking-wider text-orange-300 font-display font-semibold">{t.findings}</span>
              </div>
              <ul className="space-y-1">
                {data.findings.map((f, i) => (
                  <li key={`${f.code}-${i}`} className="text-[11px] sm:text-xs text-orange-200/90 flex items-start gap-1.5">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>{renderFinding(t as any, f.code, f.params)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Section icon={Server} title={t.dns} testId="osint-dns">
              <ListBlock label={t.a} items={data.dns.a} />
              <ListBlock label={t.aaaa} items={data.dns.aaaa} />
              <ListBlock label={t.mx} items={data.dns.mx.map(m => `${m.priority} ${m.exchange}`)} />
              <ListBlock label={t.ns} items={data.dns.ns} />
              <ListBlock label={t.cname} items={data.dns.cname} />
              <ListBlock label={t.txt} items={data.dns.txt} />
            </Section>

            <Section icon={FileText} title={t.whois} testId="osint-whois">
              {data.whois ? (
                <>
                  <Row label={t.registrar} value={data.whois.registrar} k="registrar" />
                  <Row label={t.registered} value={fmtDate(data.whois.registered)} k="registered" />
                  <Row label={t.expires} value={fmtDate(data.whois.expires)} k="expires" />
                  <Row label={t.lastChanged} value={fmtDate(data.whois.lastChanged)} k="lastChanged" />
                  <ListBlock label={t.status} items={data.whois.status} />
                  <ListBlock label={t.ns} items={data.whois.nameservers} />
                  {data.whois.expires && (() => {
                    const d = daysFromNow(data.whois.expires);
                    if (d === null) return null;
                    return (
                      <div className={`mt-2 text-[11px] flex items-center gap-1.5 ${d < 0 ? "text-red-400" : d < 30 ? "text-orange-400" : "text-cyan-300"}`}>
                        <Calendar className="w-3 h-3" />
                        {d < 0 ? `${t.expired} ${-d} ${t.days}` : `${t.expiresIn} ${d} ${t.days}`}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="text-[11px] text-zinc-500 py-2">{t.whoisMissing}</div>
              )}
            </Section>

            <Section icon={Lock} title={t.ssl} testId="osint-ssl">
              {data.ssl ? (
                <>
                  <div className={`flex items-center gap-1.5 mb-2 text-[11px] font-medium ${data.ssl.valid ? "text-cyan-300" : "text-orange-400"}`}>
                    {data.ssl.valid ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {data.ssl.valid ? t.valid : t.invalid}
                  </div>
                  <Row label={t.issuer} value={data.ssl.issuer} k="ssl-issuer" />
                  <Row label={t.subject} value={data.ssl.subject} k="ssl-subject" />
                  <Row label={t.validFrom} value={fmtDate(data.ssl.validFrom ? new Date(data.ssl.validFrom).toISOString() : null)} k="ssl-from" />
                  <Row label={t.validTo} value={fmtDate(data.ssl.validTo ? new Date(data.ssl.validTo).toISOString() : null)} k="ssl-to" />
                  <Row label={t.serial} value={data.ssl.serialNumber} k="ssl-serial" />
                  <ListBlock label={t.altNames} items={data.ssl.altNames} />
                  {data.ssl.validTo && (() => {
                    const d = daysFromNow(new Date(data.ssl.validTo).toISOString());
                    if (d === null) return null;
                    return (
                      <div className={`mt-2 text-[11px] flex items-center gap-1.5 ${d < 0 ? "text-red-400" : d < 14 ? "text-orange-400" : "text-cyan-300"}`}>
                        <Clock className="w-3 h-3" />
                        {d < 0 ? `${t.expired} ${-d} ${t.days}` : `${t.expiresIn} ${d} ${t.days}`}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="text-[11px] text-zinc-500 py-2">{t.sslMissing}</div>
              )}
            </Section>
          </div>
        </div>
      )}
    </motion.div>
  );
}
