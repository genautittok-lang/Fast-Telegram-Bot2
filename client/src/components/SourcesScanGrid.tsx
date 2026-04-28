import { useMemo, useState } from "react";
import { CATEGORY_LABELS, type OsintCategory } from "@shared/osintSources";

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

const STATUS_STYLE: Record<ScanStatus, { dot: string; label: string }> = {
  hit:            { dot: "bg-rose-400 ring-rose-400/30",       label: "Hit" },
  clean:          { dot: "bg-cyan-400 ring-cyan-400/30",       label: "Clean" },
  scanned:        { dot: "bg-cyan-400/70 ring-cyan-400/20",    label: "Scanned" },
  paid_only:      { dot: "bg-amber-400/70 ring-amber-400/20",  label: "Premium API" },
  rate_limit:     { dot: "bg-amber-400/40 ring-amber-400/10",  label: "Rate-limited" },
  no_data:        { dot: "bg-white/15 ring-white/5",           label: "No public data" },
  not_applicable: { dot: "bg-white/5  ring-white/0",           label: "N/A" },
};

const STATUS_ORDER: ScanStatus[] = ["hit", "clean", "scanned", "paid_only", "rate_limit", "no_data", "not_applicable"];

export function SourcesScanGrid({ items, showNotApplicable = false }: Props) {
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

  return (
    <div className="space-y-3" data-testid="sources-scan-grid">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
        <span data-testid="text-coverage-summary">
          Scanned <span className="text-white font-medium">{completed}</span> / {applicableCount}
        </span>
        {counts.hit > 0 && (
          <span className="text-rose-300" data-testid="text-coverage-hits">● {counts.hit} hits</span>
        )}
        {counts.paid_only > 0 && (
          <span className="text-amber-300/90" data-testid="text-coverage-paid">● {counts.paid_only} premium</span>
        )}
        {counts.no_data > 0 && (
          <span className="text-zinc-500" data-testid="text-coverage-nodata">● {counts.no_data} no data</span>
        )}
        <span className="text-zinc-500 ml-auto">{items.length} total OSINT sources</span>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0E0E12] p-3">
        <div className="flex flex-wrap gap-1.5">
          {visible.map((it, idx) => {
            const s = STATUS_STYLE[it.status];
            return (
              <button
                key={`${it.category}:${it.name}:${idx}`}
                type="button"
                onMouseEnter={() => setHover(it)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(it)}
                onBlur={() => setHover(null)}
                aria-label={`${it.name} — ${s.label}`}
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
                <span className="text-zinc-400">{CATEGORY_LABELS[hover.category]}</span>
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
                  {STATUS_STYLE[hover.status].label}
                </span>
              </span>
            ) : (
              <span>Hover any dot to see source name & status</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Legend dotClass={STATUS_STYLE.hit.dot} label="Hit" />
            <Legend dotClass={STATUS_STYLE.clean.dot} label="Clean" />
            <Legend dotClass={STATUS_STYLE.paid_only.dot} label="Premium" />
            <Legend dotClass={STATUS_STYLE.no_data.dot} label="No data" />
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
