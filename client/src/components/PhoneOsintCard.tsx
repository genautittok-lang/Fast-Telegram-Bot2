import { Phone, MapPin, Signal, ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, Hash, Smartphone, Building2, Radio } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type Lang = "en" | "uk" | "ru" | "es" | "de";
const SUPPORTED: Lang[] = ["en", "uk", "ru", "es", "de"];

const labels: Record<Lang, Record<string, string>> = {
  en: {
    title: "Phone Intelligence",
    subtitle: "Carrier · line type · validity · risk indicators",
    country: "Country",
    countryCode: "Code",
    type: "Line type",
    digits: "Digits",
    expectedFormat: "Format",
    international: "International",
    carrier: "Carrier",
    lineType: "Line",
    validity: "Validity",
    valid: "Valid",
    invalid: "Invalid",
    unknown: "Unknown",
    voip: "VoIP",
    mobile: "Mobile",
    landline: "Landline",
    premium: "Premium-rate",
    riskFlags: "Risk indicators",
    noFlags: "No risk indicators detected",
    sources: "Data sources",
    cleanedNumber: "Cleaned",
  },
  uk: {
    title: "Розвідка телефону",
    subtitle: "Оператор · тип лінії · валідність · ризики",
    country: "Країна",
    countryCode: "Код",
    type: "Тип лінії",
    digits: "Цифри",
    expectedFormat: "Формат",
    international: "Міжнародний",
    carrier: "Оператор",
    lineType: "Лінія",
    validity: "Валідність",
    valid: "Валідний",
    invalid: "Невалідний",
    unknown: "Невідомо",
    voip: "VoIP",
    mobile: "Мобільний",
    landline: "Стаціонарний",
    premium: "Premium-rate",
    riskFlags: "Індикатори ризику",
    noFlags: "Індикатори ризику не виявлено",
    sources: "Джерела даних",
    cleanedNumber: "Очищений",
  },
  ru: {
    title: "Разведка телефона",
    subtitle: "Оператор · тип линии · валидность · риски",
    country: "Страна",
    countryCode: "Код",
    type: "Тип линии",
    digits: "Цифры",
    expectedFormat: "Формат",
    international: "Международный",
    carrier: "Оператор",
    lineType: "Линия",
    validity: "Валидность",
    valid: "Валиден",
    invalid: "Невалиден",
    unknown: "Неизвестно",
    voip: "VoIP",
    mobile: "Мобильный",
    landline: "Стационарный",
    premium: "Premium-rate",
    riskFlags: "Индикаторы риска",
    noFlags: "Индикаторы риска не обнаружены",
    sources: "Источники данных",
    cleanedNumber: "Очищенный",
  },
  es: {
    title: "Inteligencia telefónica",
    subtitle: "Operador · tipo de línea · validez · riesgos",
    country: "País",
    countryCode: "Código",
    type: "Tipo de línea",
    digits: "Dígitos",
    expectedFormat: "Formato",
    international: "Internacional",
    carrier: "Operador",
    lineType: "Línea",
    validity: "Validez",
    valid: "Válido",
    invalid: "Inválido",
    unknown: "Desconocido",
    voip: "VoIP",
    mobile: "Móvil",
    landline: "Fijo",
    premium: "Tarifa premium",
    riskFlags: "Indicadores de riesgo",
    noFlags: "No se detectaron riesgos",
    sources: "Fuentes de datos",
    cleanedNumber: "Limpio",
  },
  de: {
    title: "Telefon-Intelligenz",
    subtitle: "Betreiber · Leitungstyp · Gültigkeit · Risiken",
    country: "Land",
    countryCode: "Code",
    type: "Leitungstyp",
    digits: "Ziffern",
    expectedFormat: "Format",
    international: "International",
    carrier: "Betreiber",
    lineType: "Leitung",
    validity: "Gültigkeit",
    valid: "Gültig",
    invalid: "Ungültig",
    unknown: "Unbekannt",
    voip: "VoIP",
    mobile: "Mobil",
    landline: "Festnetz",
    premium: "Premium-Rate",
    riskFlags: "Risikoindikatoren",
    noFlags: "Keine Risikoindikatoren erkannt",
    sources: "Datenquellen",
    cleanedNumber: "Bereinigt",
  },
};

interface PhoneData {
  original?: string;
  cleaned?: string;
  country?: string;
  countryFlag?: string;
  countryCode?: string;
  countryName?: string;
  expectedFormat?: string;
  type?: string;
  digitsCount?: number;
  possibleVoip?: boolean;
  isPremiumRate?: boolean;
  numverifyValid?: boolean;
  carrier?: string | null;
  lineType?: string | null;
  internationalFormat?: string | null;
}

interface Props {
  data: PhoneData;
  findings?: string[];
  sources?: string[];
  lang?: string;
}

export default function PhoneOsintCard({ data, findings = [], sources = [], lang: langProp }: Props) {
  const { lang: ctxLang } = useTranslation();
  const lang = langProp || ctxLang;
  const safeLang: Lang = SUPPORTED.includes(lang as Lang) ? (lang as Lang) : "en";
  const t = labels[safeLang];

  const lineType = (data.lineType || data.type || "").toLowerCase();
  const isMobile = lineType.includes("mobile") || lineType.includes("моб") || data.type === "Мобільний";
  const isVoip = data.possibleVoip || lineType === "voip";
  const isLandline = lineType.includes("land") || lineType.includes("стац") || data.type === "Стаціонарний";

  const validityLabel =
    data.numverifyValid === true ? t.valid :
    data.numverifyValid === false ? t.invalid : t.unknown;
  const validityClass =
    data.numverifyValid === true ? "text-cyan-300 border-cyan-500/40 bg-cyan-500/10" :
    data.numverifyValid === false ? "text-red-300 border-red-500/40 bg-red-500/10" :
    "text-zinc-400 border-zinc-700 bg-zinc-800/40";

  const LineIcon = isMobile ? Smartphone : isVoip ? Radio : isLandline ? Building2 : Phone;
  const lineLabel = isMobile ? t.mobile : isVoip ? t.voip : isLandline ? t.landline : t.unknown;

  return (
    <div
      data-testid="card-phone-osint"
      className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.15)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-cyan-500/[0.02] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      <div className="relative p-4 lg:p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-700/10 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Phone className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm lg:text-base font-display font-bold text-cyan-300 leading-tight">
              {t.title}
            </h3>
            <p className="text-[11px] lg:text-xs text-zinc-400 leading-snug mt-0.5">{t.subtitle}</p>
            {data.cleaned && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900/60 border border-zinc-800">
                <Hash className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-mono text-zinc-300" data-testid="text-phone-cleaned">{data.cleaned}</span>
              </div>
            )}
          </div>
          <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wider ${validityClass}`} data-testid="badge-phone-validity">
            {validityLabel}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <DataCell
            icon={MapPin}
            label={t.country}
            value={
              <span className="flex items-center gap-1.5 truncate">
                {data.countryFlag && <span className="text-base leading-none">{data.countryFlag}</span>}
                <span className="truncate">{data.countryName || data.country || "—"}</span>
              </span>
            }
          />
          <DataCell
            icon={Hash}
            label={t.countryCode}
            value={<span className="font-mono">{data.countryCode || "—"}</span>}
          />
          <DataCell
            icon={LineIcon}
            label={t.type}
            value={lineLabel}
            highlight={isVoip || data.isPremiumRate}
          />
          <DataCell
            icon={Signal}
            label={t.digits}
            value={data.digitsCount != null ? String(data.digitsCount) : "—"}
          />
        </div>

        {(data.carrier || data.internationalFormat || data.expectedFormat) && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-cyan-500/[0.06] to-transparent border border-cyan-500/20 space-y-2">
            {data.carrier && (
              <Row icon={Building2} label={t.carrier} value={data.carrier} />
            )}
            {data.internationalFormat && (
              <Row icon={Phone} label={t.international} value={<span className="font-mono">{data.internationalFormat}</span>} />
            )}
            {data.expectedFormat && (
              <Row icon={Hash} label={t.expectedFormat} value={<span className="font-mono text-[11px]">{data.expectedFormat}</span>} />
            )}
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            {findings.length > 0 ? <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" /> : <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />}
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{t.riskFlags}</h4>
          </div>
          {findings.length > 0 ? (
            <div className="space-y-1.5">
              {findings.slice(0, 8).map((f, i) => (
                <div
                  key={i}
                  data-testid={`finding-phone-${i}`}
                  className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 text-[11px] text-zinc-300"
                >
                  <span className="leading-snug">{f}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-[11px] text-cyan-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>{t.noFlags}</span>
            </div>
          )}
        </div>

        {sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">{t.sources}:</span>
            {sources.map((s, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900/60 border border-zinc-800 text-zinc-400">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DataCell({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg border ${highlight ? "bg-orange-500/10 border-orange-500/30" : "bg-zinc-900/50 border-zinc-800/60"}`}>
      <div className="flex items-center gap-1 mb-1">
        <Icon className={`w-3 h-3 ${highlight ? "text-orange-400" : "text-cyan-400"}`} />
        <span className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <div className={`text-xs ${highlight ? "text-orange-200" : "text-zinc-200"} font-medium truncate`}>{value}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <Icon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
      <span className="text-zinc-500 uppercase text-[9px] tracking-wider">{label}</span>
      <span className="text-zinc-200 truncate flex-1 text-right">{value}</span>
    </div>
  );
}
