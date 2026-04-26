import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";

interface TimelineReport {
  id: number;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
}

interface ActivityTimelineProps {
  reports: TimelineReport[] | undefined;
  days?: number;
  lang?: string;
}

const RISK_COLORS = {
  critical: { fill: "#ef4444", glow: "rgba(239,68,68,0.5)", bg: "bg-red-500" },
  high: { fill: "#f97316", glow: "rgba(249,115,22,0.5)", bg: "bg-orange-500" },
  medium: { fill: "#eab308", glow: "rgba(234,179,8,0.5)", bg: "bg-yellow-500" },
  low: { fill: "#06b6d4", glow: "rgba(6,182,212,0.5)", bg: "bg-cyan-500" },
};

export function ActivityTimeline({ reports, days = 14, lang = "en" }: ActivityTimelineProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const buckets = useMemo(() => {
    const result: Array<{
      date: Date;
      label: string;
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      avgScore: number;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      result.push({
        date: d,
        label: d.toLocaleDateString(lang === "uk" || lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" }),
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        avgScore: 0,
      });
    }

    if (reports && reports.length > 0) {
      const sums: number[] = new Array(days).fill(0);
      for (const r of reports) {
        const reportDate = new Date(r.createdAt);
        reportDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays >= days) continue;
        const idx = days - 1 - diffDays;
        const bucket = result[idx];
        bucket.total += 1;
        sums[idx] += r.riskScore;
        const lvl = (r.riskLevel || "low").toLowerCase();
        if (lvl === "critical") bucket.critical += 1;
        else if (lvl === "high") bucket.high += 1;
        else if (lvl === "medium") bucket.medium += 1;
        else bucket.low += 1;
      }
      result.forEach((b, i) => {
        b.avgScore = b.total > 0 ? Math.round(sums[i] / b.total) : 0;
      });
    }

    return result;
  }, [reports, days, lang]);

  const maxTotal = Math.max(1, ...buckets.map((b) => b.total));

  const totalChecks = buckets.reduce((sum, b) => sum + b.total, 0);
  const criticalChecks = buckets.reduce((sum, b) => sum + b.critical + b.high, 0);
  const avgPerDay = (totalChecks / days).toFixed(1);

  const labels = {
    title: lang === "uk" ? "Активність за період" : lang === "ru" ? "Активность за период" : lang === "es" ? "Actividad reciente" : lang === "de" ? "Aktivität" : "Activity Timeline",
    subtitle: lang === "uk" ? `Останні ${days} днів` : lang === "ru" ? `Последние ${days} дней` : lang === "es" ? `Últimos ${days} días` : lang === "de" ? `Letzte ${days} Tage` : `Last ${days} days`,
    total: lang === "uk" ? "Перевірок" : lang === "ru" ? "Проверок" : lang === "es" ? "Comprobaciones" : lang === "de" ? "Prüfungen" : "Checks",
    avg: lang === "uk" ? "На день" : lang === "ru" ? "В день" : lang === "es" ? "Por día" : lang === "de" ? "Pro Tag" : "Per day",
    threats: lang === "uk" ? "Загроз виявлено" : lang === "ru" ? "Угроз обнаружено" : lang === "es" ? "Amenazas detectadas" : lang === "de" ? "Bedrohungen" : "Threats found",
    empty: lang === "uk" ? "Поки немає перевірок у цьому періоді" : lang === "ru" ? "Пока нет проверок в этом периоде" : lang === "es" ? "Aún no hay verificaciones" : lang === "de" ? "Noch keine Prüfungen" : "No checks yet in this period",
    avgRisk: lang === "uk" ? "Серед. ризик" : lang === "ru" ? "Сред. риск" : lang === "es" ? "Riesgo med." : lang === "de" ? "Ø Risiko" : "Avg risk",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl border border-cyan-500/15 bg-gradient-to-b from-zinc-900/40 to-zinc-950/40 backdrop-blur-sm p-4 sm:p-5 overflow-hidden"
      data-testid="activity-timeline"
    >
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{labels.title}</h3>
            <p className="text-[11px] text-zinc-500">{labels.subtitle}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-right">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">{labels.total}</div>
            <div className="text-base font-bold text-white tabular-nums" data-testid="text-timeline-total">{totalChecks}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">{labels.avg}</div>
            <div className="text-base font-bold text-cyan-400 tabular-nums" data-testid="text-timeline-avg">{avgPerDay}</div>
          </div>
          {criticalChecks > 0 && (
            <>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">{labels.threats}</div>
                <div className="text-base font-bold text-red-400 tabular-nums" data-testid="text-timeline-threats">{criticalChecks}</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="flex items-end gap-1 sm:gap-1.5 h-28 sm:h-32 relative" onMouseLeave={() => setHoveredDay(null)}>
          {buckets.map((b, i) => {
            const heightRatio = b.total / maxTotal;
            const minHeight = b.total > 0 ? 6 : 2;
            const isHovered = hoveredDay === i;
            const segments = [
              { count: b.low, color: RISK_COLORS.low },
              { count: b.medium, color: RISK_COLORS.medium },
              { count: b.high, color: RISK_COLORS.high },
              { count: b.critical, color: RISK_COLORS.critical },
            ].filter((s) => s.count > 0);

            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredDay(i)}
                className="relative flex-1 flex flex-col justify-end group cursor-pointer"
                data-testid={`bar-day-${i}`}
              >
                {b.total === 0 ? (
                  <div className="w-full h-[3px] rounded-full bg-white/[0.04]" />
                ) : (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightRatio * 100, minHeight)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.02, ease: "easeOut" }}
                    className="w-full rounded-md overflow-hidden flex flex-col-reverse"
                    style={{
                      boxShadow: isHovered
                        ? `0 0 16px ${segments[segments.length - 1]?.color.glow || "rgba(6,182,212,0.4)"}`
                        : "none",
                    }}
                  >
                    {segments.map((s, sIdx) => {
                      const segHeight = (s.count / b.total) * 100;
                      return (
                        <div
                          key={sIdx}
                          className={`w-full ${s.color.bg} transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                          style={{ height: `${segHeight}%`, minHeight: 1 }}
                        />
                      );
                    })}
                  </motion.div>
                )}

                {isHovered && b.total > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none"
                  >
                    <div className="bg-zinc-950/95 border border-cyan-500/40 backdrop-blur-md rounded-lg px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                      <div className="text-[10px] text-zinc-400 mb-0.5">{b.label}</div>
                      <div className="text-sm font-bold text-white">
                        {b.total} {labels.total.toLowerCase()}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        {b.low > 0 && <span className="text-cyan-400">● {b.low}</span>}
                        {b.medium > 0 && <span className="text-yellow-400">● {b.medium}</span>}
                        {b.high > 0 && <span className="text-orange-400">● {b.high}</span>}
                        {b.critical > 0 && <span className="text-red-400">● {b.critical}</span>}
                      </div>
                      {b.avgScore > 0 && (
                        <div className="text-[10px] text-zinc-500 mt-1 pt-1 border-t border-white/[0.06]">
                          {labels.avgRisk}: <span className="text-zinc-300 font-mono">{b.avgScore}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-2 px-0.5">
          <span className="text-[10px] text-zinc-600 font-mono">{buckets[0]?.label}</span>
          <span className="text-[10px] text-zinc-600 font-mono">{buckets[Math.floor(buckets.length / 2)]?.label}</span>
          <span className="text-[10px] text-zinc-600 font-mono">{buckets[buckets.length - 1]?.label}</span>
        </div>
      </div>

      {totalChecks === 0 ? (
        <div className="mt-3 pt-3 border-t border-white/[0.06] text-center">
          <p className="text-xs text-zinc-500">{labels.empty}</p>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-center gap-3 sm:gap-4 flex-wrap text-[10px] sm:text-[11px]">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-sm bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
            {lang === "uk" ? "Низький" : lang === "ru" ? "Низкий" : lang === "es" ? "Bajo" : lang === "de" ? "Niedrig" : "Low"}
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-sm bg-yellow-500" />
            {lang === "uk" ? "Середній" : lang === "ru" ? "Средний" : lang === "es" ? "Medio" : lang === "de" ? "Mittel" : "Medium"}
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-sm bg-orange-500" />
            {lang === "uk" ? "Високий" : lang === "ru" ? "Высокий" : lang === "es" ? "Alto" : lang === "de" ? "Hoch" : "High"}
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-sm bg-red-500" />
            {lang === "uk" ? "Критичний" : lang === "ru" ? "Критический" : lang === "es" ? "Crítico" : lang === "de" ? "Kritisch" : "Critical"}
          </span>
        </div>
      )}
    </motion.div>
  );
}
