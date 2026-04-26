import { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  Handle,
  NodeProps,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { Network, Mail, Phone, Globe, User, Wallet, Image as ImageIcon, AlertTriangle, Shield, Activity } from "lucide-react";

type Lang = "en" | "uk" | "ru" | "es" | "de";

interface ReportLike {
  id: number;
  target: string;
  type: string;
  riskLevel: string;
  riskScore: number;
  createdAt?: string;
}

interface EntityGraphProps {
  reports: ReportLike[];
  lang?: Lang;
  height?: number;
  onNodeClick?: (reportId: number) => void;
}

const labels: Record<Lang, Record<string, string>> = {
  en: { title: "Entity network", subtitle: "Connections between your checked targets", empty: "Run a few checks to see your entity network", risk: "Risk", critical: "Critical", high: "High", medium: "Medium", low: "Low" },
  uk: { title: "Мережа сутностей", subtitle: "Зв'язки між перевіреними цілями", empty: "Зробіть кілька перевірок, щоб побачити мережу сутностей", risk: "Ризик", critical: "Критичний", high: "Високий", medium: "Середній", low: "Низький" },
  ru: { title: "Сеть сущностей", subtitle: "Связи между проверенными целями", empty: "Сделайте несколько проверок, чтобы увидеть сеть сущностей", risk: "Риск", critical: "Критический", high: "Высокий", medium: "Средний", low: "Низкий" },
  es: { title: "Red de entidades", subtitle: "Conexiones entre tus objetivos verificados", empty: "Ejecuta algunas verificaciones para ver tu red", risk: "Riesgo", critical: "Crítico", high: "Alto", medium: "Medio", low: "Bajo" },
  de: { title: "Entitäten-Netzwerk", subtitle: "Verbindungen zwischen Ihren geprüften Zielen", empty: "Führen Sie einige Prüfungen aus, um Ihr Netzwerk zu sehen", risk: "Risiko", critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" },
};

const TYPE_ICON: Record<string, any> = {
  email: Mail,
  phone: Phone,
  domain: Globe,
  username: User,
  wallet: Wallet,
  image: ImageIcon,
  password: Shield,
};

const TYPE_COLOR: Record<string, string> = {
  email: "from-cyan-500/30 to-cyan-700/10 border-cyan-500/60",
  phone: "from-cyan-400/30 to-cyan-600/10 border-cyan-400/60",
  domain: "from-blue-500/30 to-cyan-700/10 border-blue-400/60",
  username: "from-violet-500/30 to-cyan-700/10 border-violet-400/60",
  wallet: "from-yellow-500/30 to-cyan-700/10 border-yellow-400/60",
  image: "from-pink-500/30 to-cyan-700/10 border-pink-400/60",
  password: "from-orange-500/30 to-cyan-700/10 border-orange-400/60",
};

const RISK_COLOR: Record<string, string> = {
  critical: "text-red-400 border-red-500/60",
  high: "text-orange-400 border-orange-500/60",
  medium: "text-yellow-400 border-yellow-500/60",
  low: "text-cyan-300 border-cyan-500/60",
};

function EntityNode({ data }: NodeProps) {
  const Icon = data.icon || Network;
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      data.onActivate?.();
    }
  };
  return (
    <div
      className={`relative bg-gradient-to-br ${data.gradient} backdrop-blur-sm border-2 rounded-xl px-3 py-2 min-w-[140px] max-w-[180px] shadow-[0_0_18px_rgba(34,211,238,0.15)] transition-all hover:scale-105 hover:shadow-[0_0_24px_rgba(34,211,238,0.4)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-1 focus:ring-offset-zinc-950`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKey}
      aria-label={`${data.type} ${data.target}${data.riskLabel ? ` — ${data.riskLabel} ${data.riskScore}` : ""}`}
      data-testid={`entity-node-${data.id}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-400/60 !border-zinc-950 !w-2 !h-2" />
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" aria-hidden="true" />
        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-display">{data.type}</span>
      </div>
      <div className="text-xs font-medium text-white truncate" title={data.target}>
        {data.target}
      </div>
      {data.riskLabel && (
        <div className={`mt-1 text-[10px] font-medium ${data.riskClass}`}>
          {data.riskLabel} · {data.riskScore}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400/60 !border-zinc-950 !w-2 !h-2" />
    </div>
  );
}

function CenterNode({ data }: NodeProps) {
  return (
    <div
      className="relative bg-gradient-to-br from-cyan-500/40 to-zinc-950 border-2 border-cyan-400 rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-[0_0_36px_rgba(34,211,238,0.5)] animate-pulse"
      data-testid="entity-node-center"
    >
      <Network className="w-6 h-6 text-cyan-300 mb-1" />
      <div className="text-[10px] uppercase tracking-wider text-cyan-200 font-display font-bold">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !border-zinc-950" />
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !border-zinc-950" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !border-zinc-950" />
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !border-zinc-950" />
    </div>
  );
}

const nodeTypes = { entity: EntityNode, center: CenterNode };

export default function EntityGraph({ reports, lang = "en", height = 480, onNodeClick }: EntityGraphProps) {
  const t = labels[lang];
  const [selected, setSelected] = useState<number | null>(null);

  const { nodes, edges } = useMemo(() => {
    if (!reports.length) return { nodes: [] as Node[], edges: [] as Edge[] };

    const sorted = reports.slice().sort((a, b) => {
      const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bT - aT;
    });
    const recent = sorted.slice(0, 12);
    const centerX = 0;
    const centerY = 0;
    const radius = 260;

    const centerNode: Node = {
      id: "center",
      type: "center",
      position: { x: centerX - 48, y: centerY - 48 },
      data: { label: "DARKSHARE" },
      draggable: false,
      selectable: false,
    };

    const entityNodes: Node[] = recent.map((r, i) => {
      const angle = (i / recent.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const Icon = TYPE_ICON[r.type] || Network;
      const gradient = TYPE_COLOR[r.type] || "from-cyan-500/30 to-cyan-700/10 border-cyan-500/60";
      const riskKey = (r.riskLevel || "low").toLowerCase();
      const riskClass = RISK_COLOR[riskKey] || RISK_COLOR.low;
      const riskLabel = t[riskKey as "critical" | "high" | "medium" | "low"] || r.riskLevel;
      return {
        id: `r-${r.id}`,
        type: "entity",
        position: { x: x - 80, y: y - 30 },
        data: {
          id: r.id,
          target: r.target,
          type: r.type,
          icon: Icon,
          gradient,
          riskLabel,
          riskScore: r.riskScore,
          riskClass,
          onActivate: () => {
            setSelected(r.id);
            onNodeClick?.(r.id);
          },
        },
        draggable: true,
      };
    });

    const edgeList: Edge[] = recent.map((r) => {
      const riskKey = (r.riskLevel || "low").toLowerCase();
      const stroke =
        riskKey === "critical" ? "#f87171" :
        riskKey === "high" ? "#fb923c" :
        riskKey === "medium" ? "#facc15" : "#22d3ee";
      const animated = riskKey === "critical" || riskKey === "high";
      return {
        id: `e-center-${r.id}`,
        source: "center",
        target: `r-${r.id}`,
        animated,
        style: { stroke, strokeWidth: animated ? 1.8 : 1, opacity: 0.6 },
      };
    });

    return { nodes: [centerNode, ...entityNodes], edges: edgeList };
  }, [reports, t]);

  if (!reports.length) {
    return (
      <div
        className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-zinc-900/60 to-zinc-950 p-8 flex flex-col items-center justify-center text-center"
        style={{ height }}
        data-testid="entity-graph-empty"
      >
        <Network className="w-10 h-10 text-cyan-500/40 mb-2" />
        <p className="text-sm text-zinc-400">{t.empty}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-zinc-900/60 to-zinc-950 overflow-hidden"
      data-testid="entity-graph-container"
    >
      <div className="px-4 py-3 border-b border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-sm font-display font-semibold text-cyan-300 leading-tight">{t.title}</h3>
            <p className="text-[10px] text-zinc-500">{t.subtitle}</p>
          </div>
        </div>
        <div className="text-[10px] text-zinc-500 tabular-nums">
          {reports.length} <span className="text-cyan-400/70">nodes</span>
        </div>
      </div>
      <div style={{ height }} className="relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_, node) => {
            const id = node.data?.id;
            if (typeof id === "number") {
              setSelected(id);
              onNodeClick?.(id);
            }
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(34,211,238,0.18)" />
          <Controls
            className="!bg-zinc-900/80 !border-cyan-500/20 [&>button]:!bg-zinc-900 [&>button]:!border-cyan-500/20 [&>button]:!text-cyan-300"
            showInteractive={false}
          />
          <MiniMap
            className="!bg-zinc-900/80 !border !border-cyan-500/20"
            nodeColor={(n) => (n.id === "center" ? "#22d3ee" : "#0e7490")}
            maskColor="rgba(9,9,11,0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
