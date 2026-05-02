import { useMemo, useState } from "react";
import { CATEGORY_LABELS, type OsintCategory } from "@shared/osintSources";
import { useTranslation } from "@/lib/i18n";

export type ScanStatus =
  | "hit"
  | "clean"
  | "scanned"
  | "paid_only"
  | "rate_limit"
  | "no_data"
  | "not_applicable";

export interface ScanItem {
  name: string;
  category: OsintCategory;
  status: ScanStatus;
}

interface Props {
  items: ScanItem[];
  showNotApplicable?: boolean;
}

const STATUS_ORDER: ScanStatus[] = ["hit", "clean", "scanned", "paid_only", "rate_limit", "no_data", "not_applicable"];

function getStatusStyle(status: ScanStatus): { dot: string } {
  switch (status) {
    case "hit":            return { dot: "bg-rose-400 ring-rose-400/30" };
    case "clean":          return { dot: "bg-cyan-400 ring-cyan-400/30" };
    case "scanned":        return { dot: "bg-cyan-400/70 ring-cyan-400/20" };
    case "paid_only":      return { dot: "bg-amber-400/70 ring-amber-400/20" };
    case "rate_limit":     return { dot: "bg-amber-400/40 ring-amber-400/10" };
    case "no_data":        return { dot: "bg-white/15 ring-white/5" };
    case "not_applicable": return { dot: "bg-white/5 ring-white/0" };
  }
}

function getStatusLabel(status: ScanStatus, lang: string): string {
  switch (status) {
    case "hit":
      return lang === "uk" ? "Знайдено" : lang === "ru" ? "Найдено" : lang === "es" ? "Encontrado" : lang === "de" ? "Gefunden" : "Hit";
    case "clean":
      return lang === "uk" ? "Чисто" : lang === "ru" ? "Чисто" : lang === "es" ? "Limpio" : lang === "de" ? "Sauber" : "Clean";
    case "scanned":
      return lang === "uk" ? "Перевірено" : lang === "ru" ? "Проверено" : lang === "es" ? "Escaneado" : lang === "de" ? "Geprüft" : "Scanned";
    case "paid_only":
      return lang === "uk" ? "Преміум API" : lang === "ru" ? "Премиум API" : lang === "es" ? "API Premium" : lang === "de" ? "Premium-API" : "Premium API";
    case "rate_limit":
      return lang === "uk" ? "Ліміт запитів" : lang === "ru" ? "Лимит запросов" : lang === "es" ? "Límite de tasa" : lang === "de" ? "Rate-Limit" : "Rate-limited";
    case "no_data":
      return lang === "uk" ? "Немає даних" : lang === "ru" ? "Нет данных" : lang === "es" ? "Sin datos" : lang === "de" ? "Keine Daten" : "No public data";
    case "not_applicable":
      return "N/A";
  }
}

function getCategoryLabel(category: OsintCategory, lang: string): string {
  const labels = CATEGORY_LABELS[category];
  if (!labels) return category;
  if (lang === "uk") return labels.uk;
  if (lang === "ru") return labels.ru;
  if (lang === "es") return labels.es;
  if (lang === "de") return labels.de;
  return labels.en;
}

export function SourcesScanGrid({ items, showNotApplicable = false }: Props) {
  const { lang } = useTranslation();
  const [hover, setHover] = useState<ScanItem | null>(null);

  const counts = useMemo(() => {
    const c: Record<ScanStatus, number> = {
      hit: 0, clean: 0, scanned: 0, paid_only: 0, rate_limit: 0, no_data: 0, not_applicable: 0,
    };
    for (const it of items) c[it.status]++;
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const filtered = showNotApplicable ? items : items.filter((i) => i.status !== "not_applicable");
    return [...filtered].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  }, [items, showNotApplicable]);

  const applicableCount = items.length - counts.not_applicable;
  const completed = counts.hit + counts.clean + counts.scanned;

  const hoverLabel = lang === "uk" ? "Наведіть на точку, щоб побачити джерело"
    : lang === "ru" ? "Наведите на точку, чтобы увидеть источник"
    : lang === "es" ? "Pasa el cursor por un punto para ver la fuente"
    : lang === "de" ? "Punkt hovern für Quellendetails"
    : "Hover any dot to see source name & status";

  const scannedLabel = lang === "uk" ? "Перевірено" : lang === "ru" ? "Проверено" : lang === "es" ? "Escaneado" : lang === "de" ? "Geprüft" : "Scanned";
  const hitsLabel    = lang === "uk" ? "знайдено" : lang === "ru" ? "найдено" : lang === "es" ? "encontrado" : lang === "de" ? "gefunden" : "hits";
  const premiumLabel = lang === "uk" ? "преміум" : lang === "ru" ? "премиум" : lang === "es" ? "premium" : lang === "de" ? "Premium" : "premium";
  const noDataLabel  = lang === "uk" ? "немає даних" : lang === "ru" ? "нет данных" : lang === "es" ? "sin datos" : lang === "de" ? "keine Daten" : "no data";
  const totalLabel   = lang === "uk" ? "джерел OSINT" : lang === "ru" ? "источников OSINT" : lang === "es" ? "fuentes OSINT" : lang === "de" ? "OSINT-Quellen" : "total OSINT sources";

  return (
    <div className="space-y-3" data-testid="sources-scan-grid">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
        <span data-testid="text-coverage-summary">
          {scannedLabel} <span className="text-white font-medium">{completed}</span> / {applicableCount}
        </span>
        {counts.hit > 0 && (
          <span className="text-rose-300" data-testid="text-coverage-hits">● {counts.hit} {hitsLabel}</span>
        )}
        {counts.paid_only > 0 && (
          <span className="text-amber-300/90" data-testid="text-coverage-paid">● {counts.paid_only} {premiumLabel}</span>
        )}
        {counts.no_data > 0 && (
          <span className="text-zinc-500" data-testid="text-coverage-nodata">● {counts.no_data} {noDataLabel}</span>
        )}
        <span className="text-zinc-500 ml-auto">{items.length} {totalLabel}</span>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0E0E12] p-3">
        <div className="flex flex-wrap gap-1.5">
          {visible.map((it, idx) => {
            const s = getStatusStyle(it.status);
            return (
              <button
                key={`${it.category}:${it.name}:${idx}`}
                type="button"
                onMouseEnter={() => setHover(it)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(it)}
                onBlur={() => setHover(null)}
                aria-label={`${it.name} — ${getStatusLabel(it.status, lang)}`}
                data-testid={`dot-source-${it.name.replace(/\s+/g, "-").toLowerCase()}-${idx}`}
                className={`h-2.5 w-2.5 rounded-full ring-2 ${s.dot} transition-transform hover:scale-150 focus:scale-150 outline-none`}
              />
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 min-h-[16px]">
          <div>
            {hover ? (
              <span data-testid="text-source-tooltip">
                <span className="text-zinc-200">{hover.name}</span>
                <span className="mx-1.5 text-zinc-600">·</span>
                <span className="text-zinc-400">{getCategoryLabel(hover.category, lang)}</span>
                <span className="mx-1.5 text-zinc-600">·</span>
                <span
                  className={
                    hover.status === "hit"
                      ? "text-rose-300"
                      : hover.status === "clean" || hover.status === "scanned"
                      ? "text-cyan-300"
                      : hover.status === "paid_only" || hover.status === "rate_limit"
                      ? "text-amber-300"
                      : "text-zinc-500"
                  }
                >
                  {getStatusLabel(hover.status, lang)}
                </span>
              </span>
            ) : (
              <span>{hoverLabel}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Legend dotClass={getStatusStyle("hit").dot} label={getStatusLabel("hit", lang)} />
            <Legend dotClass={getStatusStyle("clean").dot} label={getStatusLabel("clean", lang)} />
            <Legend dotClass={getStatusStyle("paid_only").dot} label={getStatusLabel("paid_only", lang)} />
            <Legend dotClass={getStatusStyle("no_data").dot} label={getStatusLabel("no_data", lang)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="text-zinc-500">{label}</span>
    </span>
  );
}

export default SourcesScanGrid;
