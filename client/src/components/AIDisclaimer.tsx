import { Sparkles, AlertTriangle } from "lucide-react";

interface AIDisclaimerProps {
  variant?: "compact" | "full";
  className?: string;
}

export function AIDisclaimer({ variant = "compact", className = "" }: AIDisclaimerProps) {
  if (variant === "compact") {
    return (
      <div className={`flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 ${className}`} data-testid="ai-disclaimer-compact">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          Згенеровано штучним інтелектом на основі публічних OSINT-даних. Може містити неточності. Не є експертним висновком чи доказом.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 ${className}`} data-testid="ai-disclaimer-full">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h4 className="text-sm font-semibold text-amber-300">AI-аналіз — обмеження</h4>
      </div>
      <p className="text-xs text-amber-200/80 leading-relaxed">
        Цей звіт згенеровано штучним інтелектом на основі публічно доступних OSINT-даних. AI-моделі можуть помилятися, інтерпретувати неоднозначні сигнали та робити статистичні припущення.
      </p>
      <ul className="text-xs text-amber-200/70 space-y-1 ml-4 list-disc">
        <li>Не є офіційним документом, експертним висновком чи доказом у суді</li>
        <li>Не використовуйте як єдину підставу для прийняття правових/фінансових рішень</li>
        <li>Завжди верифікуйте критичні дані з первинних джерел</li>
        <li>DARKSHARE не несе відповідальності за рішення на підставі AI-звіту</li>
      </ul>
    </div>
  );
}
