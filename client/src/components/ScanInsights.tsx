import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import {
  Activity,
  TrendingUp,
  ShieldAlert,
  Target,
  Phone,
  Wallet,
  Globe,
  Mail,
  Hash,
  Network,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type Lang = "en" | "uk" | "ru" | "es" | "de";
const SUPPORTED: Lang[] = ["en", "uk", "ru", "es", "de"];

interface ReportItem {
  id: number;
  type: string;
  target: string;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
}

const labels: Record<Lang, Record<string, string>> = {
  en: {
    title: "Scan Analytics",
    subtitle: "Live intelligence dashboard · last 14 days",
    totalScans: "Total scans",
    last7d: "Last 7 days",
    avgRisk: "Avg risk",
    criticalHigh: "Critical & high",
    scansOverTime: "Scans over time",
    typeDistribution: "Scan types",
    riskBreakdown: "Risk breakdown",
    noData: "No scans yet — run your first OSINT check to see analytics here",
    runFirst: "Run a check on the Dashboard to populate insights",
    points: "scans",
    riskLow: "Low",
    riskMedium: "Medium",
    riskHigh: "High",
    riskCritical: "Critical",
  },
  uk: {
    title: "Аналітика сканувань",
    subtitle: "Жива OSINT-панель · останні 14 днів",
    totalScans: "Усього сканів",
    last7d: "Останні 7 днів",
    avgRisk: "Середній ризик",
    criticalHigh: "Критичні та високі",
    scansOverTime: "Скани в часі",
    typeDistribution: "Типи сканів",
    riskBreakdown: "Розподіл ризиків",
    noData: "Сканувань ще немає — зроби перший OSINT-чек, щоб побачити аналітику",
    runFirst: "Запусти перевірку на Dashboard, щоб з'явилася статистика",
    points: "сканів",
    riskLow: "Низький",
    riskMedium: "Середній",
    riskHigh: "Високий",
    riskCritical: "Критичний",
  },
  ru: {
    title: "Аналитика сканирований",
    subtitle: "Живая OSINT-панель · последние 14 дней",
    totalScans: "Всего сканов",
    last7d: "Последние 7 дней",
    avgRisk: "Средний риск",
    criticalHigh: "Критические и высокие",
    scansOverTime: "Сканы во времени",
    typeDistribution: "Типы сканов",
    riskBreakdown: "Распределение рисков",
    noData: "Сканирований ещё нет — сделай первую OSINT-проверку, чтобы увидеть аналитику",
    runFirst: "Запусти проверку в Dashboard, чтобы появилась статистика",
    points: "сканов",
    riskLow: "Низкий",
    riskMedium: "Средний",
    riskHigh: "Высокий",
    riskCritical: "Критический",
  },
  es: {
    title: "Análisis de escaneos",
    subtitle: "Panel OSINT en vivo · últimos 14 días",
    totalScans: "Escaneos totales",
    last7d: "Últimos 7 días",
    avgRisk: "Riesgo medio",
    criticalHigh: "Críticos y altos",
    scansOverTime: "Escaneos en el tiempo",
    typeDistribution: "Tipos de escaneo",
    riskBreakdown: "Desglose de riesgo",
    noData: "Aún no hay escaneos — ejecuta tu primera comprobación OSINT para ver estadísticas",
    runFirst: "Ejecuta una comprobación en el Dashboard",
    points: "escaneos",
    riskLow: "Bajo",
    riskMedium: "Medio",
    riskHigh: "Alto",
    riskCritical: "Crítico",
  },
  de: {
    title: "Scan-Analyse",
    subtitle: "Live-OSINT-Dashboard · letzte 14 Tage",
    totalScans: "Scans gesamt",
    last7d: "Letzte 7 Tage",
    avgRisk: "Ø Risiko",
    criticalHigh: "Kritisch & Hoch",
    scansOverTime: "Scans über Zeit",
    typeDistribution: "Scan-Typen",
    riskBreakdown: "Risikoverteilung",
    noData: "Noch keine Scans — führe deinen ersten OSINT-Check aus, um Analysen zu sehen",
    runFirst: "Starte eine Prüfung im Dashboard",
    points: "Scans",
    riskLow: "Niedrig",
    riskMedium: "Mittel",
    riskHigh: "Hoch",
    riskCritical: "Kritisch",
  },
};

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  phone: { icon: Phone, color: "#22d3ee", label: "Phone" },
  crypto: { icon: Wallet, color: "#06b6d4", label: "Crypto" },
  domain: { icon: Globe, color: "#0891b2", label: "Domain" },
  email: { icon: Mail, color: "#67e8f9", label: "Email" },
  ip: { icon: Network, color: "#0e7490", label: "IP" },
  hash: { icon: Hash, color: "#a5f3fc", label: "Hash" },
  username: { icon: Eye, color: "#155e75", label: "User" },
};

function getTypeMeta(type: string) {
  const k = type.toLowerCase();
  for (const key of Object.keys(TYPE_META)) {
    if (k.includes(key)) return { ...TYPE_META[key], label: TYPE_META[key].label };
  }
  return { icon: Target, color: "#67e8f9", label: type || "Other" };
}

const RISK_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export default function ScanInsights({ langProp, compact = false }: { langProp?: string; compact?: boolean }) {
  const { lang: ctxLang } = useTranslation();
  const lang = (langProp || ctxLang) as Lang;
  const safeLang: Lang = SUPPORTED.includes(lang) ? lang : "en";
  const t = labels[safeLang];

  const { data: reports = [] } = useQuery<ReportItem[]>({
    queryKey: ["/api/reports"],
  });

  const stats = useMemo(() => {
    const now = new Date();
    const dayMs = 86400000;
    const days: { date: string; label: string; scans: number; risk: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        scans: 0,
        risk: 0,
      });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));

    let total = 0;
    let last7d = 0;
    let riskSum = 0;
    let riskCount = 0;
    let criticalHigh = 0;
    const typeCounts = new Map<string, number>();
    const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };

    reports.forEach((r) => {
      total += 1;
      const d = r.createdAt ? new Date(r.createdAt) : null;
      const validDate = d && !isNaN(d.getTime());
      if (validDate) {
        const key = d!.toISOString().slice(0, 10);
        const bucket = dayMap.get(key);
        if (bucket) {
          bucket.scans += 1;
          bucket.risk = Math.max(bucket.risk, r.riskScore || 0);
        }
        if (now.getTime() - d!.getTime() < 7 * dayMs) last7d += 1;
      }
      if (typeof r.riskScore === "number") {
        riskSum += r.riskScore;
        riskCount += 1;
      }
      const lvl = (r.riskLevel || "").toLowerCase();
      if (lvl === "critical" || lvl === "high") criticalHigh += 1;
      if (lvl in riskCounts) (riskCounts as any)[lvl] += 1;

      const meta = getTypeMeta(r.type || "");
      typeCounts.set(meta.label, (typeCounts.get(meta.label) || 0) + 1);
    });

    const typeData = Array.from(typeCounts.entries())
      .map(([label, value]) => {
        const meta = Object.values(TYPE_META).find((m) => m.label === label);
        return { name: label, value, color: meta?.color || "#22d3ee" };
      })
      .sort((a, b) => b.value - a.value);

    const riskData = [
      { name: t.riskLow, value: riskCounts.low, color: RISK_COLORS.low },
      { name: t.riskMedium, value: riskCounts.medium, color: RISK_COLORS.medium },
      { name: t.riskHigh, value: riskCounts.high, color: RISK_COLORS.high },
      { name: t.riskCritical, value: riskCounts.critical, color: RISK_COLORS.critical },
    ];

    return {
      total,
      last7d,
      avgRisk: riskCount > 0 ? Math.round(riskSum / riskCount) : 0,
      criticalHigh,
      days,
      typeData,
      riskData,
    };
  }, [reports, t]);

  if (stats.total === 0) {
    return (
      <div
        data-testid="card-scan-insights-empty"
        className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.12)] overflow-hidden p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-cyan-500/[0.02] pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-base font-display font-bold text-cyan-300 mb-1">{t.title}</h3>
          <p className="text-xs text-zinc-400 max-w-sm">{t.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="card-scan-insights"
      className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.15)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-cyan-500/[0.02] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      <div className="relative p-4 lg:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-700/10 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Activity className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base lg:text-lg font-display font-bold text-cyan-300 leading-tight">{t.title}</h3>
            <p className="text-[11px] text-zinc-400 leading-snug">{t.subtitle}</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            LIVE
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <StatCell icon={Target} label={t.totalScans} value={stats.total} testId="stat-total-scans" />
          <StatCell icon={TrendingUp} label={t.last7d} value={stats.last7d} testId="stat-last-7d" />
          <StatCell
            icon={ShieldAlert}
            label={t.avgRisk}
            value={`${stats.avgRisk}/100`}
            testId="stat-avg-risk"
            highlight={stats.avgRisk >= 60}
          />
          <StatCell
            icon={AlertTriangle}
            label={t.criticalHigh}
            value={stats.criticalHigh}
            testId="stat-critical-high"
            highlight={stats.criticalHigh > 0}
          />
        </div>

        <div className={`grid ${compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"} gap-3`}>
          {/* Sparkline area chart */}
          <div className={`${compact ? "" : "lg:col-span-2"} p-3 rounded-xl bg-zinc-900/50 border border-cyan-500/20`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  {t.scansOverTime}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {stats.days.reduce((s, d) => s + d.scans, 0)} {t.points} · 14d
              </span>
            </div>
            <div className="h-32" data-testid="chart-scans-over-time">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.days} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#71717a", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid #22d3ee40",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#e4e4e7",
                    }}
                    cursor={{ stroke: "#22d3ee", strokeWidth: 1, strokeDasharray: "3 3" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="scans"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fill="url(#scanGradient)"
                    activeDot={{ r: 4, fill: "#22d3ee", stroke: "#09090b", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Type donut */}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-cyan-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                {t.typeDistribution}
              </span>
            </div>
            <div className="h-32 relative" data-testid="chart-type-distribution">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.typeData}
                    innerRadius={32}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#09090b"
                    strokeWidth={2}
                  >
                    {stats.typeData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid #22d3ee40",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#e4e4e7",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-display font-bold text-cyan-300 leading-none">{stats.total}</span>
                <span className="text-[8px] uppercase tracking-wider text-zinc-500">{t.points}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {stats.typeData.slice(0, 4).map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950/60 border border-zinc-800 text-[9px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-zinc-300">{d.name}</span>
                  <span className="text-zinc-500 font-mono">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk bar chart */}
        <div className="mt-3 p-3 rounded-xl bg-zinc-900/50 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                {t.riskBreakdown}
              </span>
            </div>
            {stats.criticalHigh === 0 && (
              <div className="flex items-center gap-1 text-[10px] text-cyan-300">
                <CheckCircle2 className="w-3 h-3" />
                <span>0 high-risk</span>
              </div>
            )}
          </div>
          <div className="h-24" data-testid="chart-risk-breakdown">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.riskData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid #22d3ee40",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "#e4e4e7",
                  }}
                  cursor={{ fill: "#22d3ee10" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.riskData.map((entry, idx) => (
                    <Cell key={`risk-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  testId,
  highlight,
}: {
  icon: any;
  label: string;
  value: number | string;
  testId: string;
  highlight?: boolean;
}) {
  return (
    <div
      data-testid={testId}
      className={`p-2.5 rounded-xl border ${
        highlight
          ? "bg-gradient-to-br from-orange-500/15 to-orange-500/5 border-orange-500/40"
          : "bg-gradient-to-br from-cyan-500/[0.08] to-transparent border-cyan-500/25"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${highlight ? "text-orange-400" : "text-cyan-400"}`} />
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 truncate">{label}</span>
      </div>
      <div className={`text-lg lg:text-xl font-display font-bold ${highlight ? "text-orange-200" : "text-cyan-200"} leading-none`}>
        {value}
      </div>
    </div>
  );
}
