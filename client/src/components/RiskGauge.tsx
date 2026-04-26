import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface RiskGaugeProps {
  score: number;
  size?: number;
  label?: string;
  showLabel?: boolean;
  thickness?: number;
  lang?: string;
}

const getRiskColor = (score: number) => {
  if (score >= 75) return { stroke: "#ef4444", glow: "rgba(239,68,68,0.5)", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
  if (score >= 50) return { stroke: "#f97316", glow: "rgba(249,115,22,0.5)", text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" };
  if (score >= 25) return { stroke: "#eab308", glow: "rgba(234,179,8,0.5)", text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
  return { stroke: "#06b6d4", glow: "rgba(6,182,212,0.5)", text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" };
};

const getRiskLabel = (score: number, lang: string = "en") => {
  if (score >= 75) {
    return lang === "uk" ? "КРИТИЧНИЙ" : lang === "ru" ? "КРИТИЧЕСКИЙ" : lang === "es" ? "CRÍTICO" : lang === "de" ? "KRITISCH" : "CRITICAL";
  }
  if (score >= 50) {
    return lang === "uk" ? "ВИСОКИЙ" : lang === "ru" ? "ВЫСОКИЙ" : lang === "es" ? "ALTO" : lang === "de" ? "HOCH" : "HIGH";
  }
  if (score >= 25) {
    return lang === "uk" ? "СЕРЕДНІЙ" : lang === "ru" ? "СРЕДНИЙ" : lang === "es" ? "MEDIO" : lang === "de" ? "MITTEL" : "MEDIUM";
  }
  return lang === "uk" ? "НИЗЬКИЙ" : lang === "ru" ? "НИЗКИЙ" : lang === "es" ? "BAJO" : lang === "de" ? "NIEDRIG" : "LOW";
};

export function RiskGauge({ score, size = 180, label, showLabel = true, thickness = 14, lang = "en" }: RiskGaugeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayScore, setDisplayScore] = useState(0);
  const safeScore = Math.max(0, Math.min(100, score));
  const colors = getRiskColor(safeScore);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const offset = arcLength - (arcLength * safeScore) / 100;

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(safeScore * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, safeScore]);

  return (
    <div ref={ref} className="inline-flex flex-col items-center" data-testid="risk-gauge">
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg width={size} height={size} className="-rotate-[135deg] overflow-visible" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={`gauge-grad-${safeScore}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.6" />
            </linearGradient>
            <filter id={`gauge-glow-${safeScore}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={thickness}
            fill="none"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gauge-grad-${safeScore})`}
            strokeWidth={thickness}
            fill="none"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={isInView ? offset : arcLength}
            strokeLinecap="round"
            filter={`url(#gauge-glow-${safeScore})`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: isInView ? offset : arcLength }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingTop: size * 0.1 }}>
          <div className={`text-5xl font-bold tabular-nums ${colors.text}`} style={{ textShadow: `0 0 20px ${colors.glow}` }}>
            {displayScore}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mt-1">
            / 100
          </div>
        </div>
      </div>
      {showLabel && (
        <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${colors.bg} ${colors.border} border`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ background: colors.stroke }} />
          <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
            {label || getRiskLabel(safeScore, lang)}
          </span>
        </div>
      )}
    </div>
  );
}

export { getRiskColor, getRiskLabel };
