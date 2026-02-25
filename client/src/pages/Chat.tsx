import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Image, X, ShieldCheck, Crown, Zap, Lock, Eye, Share2, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ReactionData {
  emoji: string;
  userIds: number[];
}

interface ChatMsg {
  id: number;
  userId: number;
  username: string | null;
  photoUrl: string | null;
  message: string;
  messageType: string | null;
  fileUrl: string | null;
  teamId: number | null;
  createdAt: string;
  reactions: ReactionData[];
}

interface UserTeam {
  id: number;
  name: string;
  role: string;
}

interface ReportItem {
  id: number;
  type: string;
  target: string;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
}

function fullTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const COLORS = [
  "text-cyan-400", "text-purple-400", "text-emerald-400", "text-orange-400",
  "text-pink-400", "text-yellow-400", "text-blue-400", "text-rose-400",
];

function userColor(userId: number) {
  return COLORS[userId % COLORS.length];
}

const AVATAR_EMOJIS = ["🛡️", "⚡", "🔥", "💎", "🚀", "🎯", "👁️", "🗡️", "🧬", "🌐", "💀", "🔮", "🪐", "🦅", "🐉", "⚔️"];
function userAvatarEmoji(userId: number) {
  return AVATAR_EMOJIS[userId % AVATAR_EMOJIS.length];
}

const EMOJI_CATEGORIES: Record<string, { label: string; emojis: string[] }> = {
  faces: {
    label: "😀",
    emojis: ["😀","😂","🤣","😊","😍","🥰","😎","🤩","😜","🤔","😏","🙄","😴","🥳","😱","🤯","🥺","😤","🔥","❤️","💯","👍","👎","👋","🙌","💪","🤝","✌️","🫡","🤙"],
  },
  security: {
    label: "🛡️",
    emojis: ["🛡️","🔒","🔓","🔑","⚠️","🚨","💀","☠️","🐛","🪲","🕵️","👀","🎯","💣","🧨","🔫","🗡️","⛔","🚫","✅","❌","❓","‼️","📛","🆘","🔴","🟢","🟡","🔵","⚡"],
  },
  finance: {
    label: "💰",
    emojis: ["💰","💵","💎","🪙","💳","📈","📉","🏦","💸","🤑","₿","🔗","⛓️","🌐","🖥️","📱","💻","⌨️","🖱️","📡","📶","🔌","🧲","💾","📀","🗂️","📁","📊","📋","🗃️"],
  },
  flags: {
    label: "🌍",
    emojis: ["🌍","🌎","🌏","🏴‍☠️","🇺🇦","🇺🇸","🇬🇧","🇩🇪","🇪🇸","🇫🇷","🇯🇵","🇨🇳","🇰🇷","🇮🇳","🇧🇷","🇨🇦","🇦🇺","🇮🇹","🇵🇱","🇳🇱","🇸🇪","🇳🇴","🇫🇮","🇩🇰","🇨🇭","🇦🇹","🇧🇪","🇹🇷","🇮🇱","🇪🇬"],
  },
};

const QUICK_REACTIONS = ["👍", "🔥", "🛡️", "💯", "⚠️", "😂"];

const PARTICLE_ICONS = ["🛡️", "🔒", "🔑", "⚡", "💎", "🔥", "🌐", "🗡️", "👁️", "💀", "🔮", "⛓️", "📡", "🧬", "🪐", "🐉"];

function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      icon: PARTICLE_ICONS[i % PARTICLE_ICONS.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 10 + Math.random() * 16,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * 10,
      opacity: 0.03 + Math.random() * 0.05,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute select-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            filter: 'blur(0.5px)',
          }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 20, 0],
            rotate: [0, 10, -10, 5, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          {p.icon}
        </motion.div>
      ))}
    </div>
  );
}

function ChatWallpaper() {
  const icons = useMemo(() => {
    const items = ["🔒", "🛡️", "⚡", "🔑", "💎", "🌐", "📡", "🔮", "⛓️", "🧬", "👁️", "🗡️"];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      icon: items[i % items.length],
      x: 5 + (i % 6) * 16 + (Math.random() * 8 - 4),
      y: 5 + Math.floor(i / 6) * 18 + (Math.random() * 6 - 3),
      rotate: Math.random() * 30 - 15,
      size: 12 + Math.random() * 6,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {icons.map(ic => (
        <div
          key={ic.id}
          className="absolute select-none"
          style={{
            left: `${ic.x}%`,
            top: `${ic.y}%`,
            fontSize: `${ic.size}px`,
            opacity: 0.025,
            transform: `rotate(${ic.rotate}deg)`,
            filter: 'grayscale(0.5)',
          }}
        >
          {ic.icon}
        </div>
      ))}
    </div>
  );
}

function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none z-0"
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
    />
  );
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const [cat, setCat] = useState("faces");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full mb-2 left-0 w-[300px] bg-[#0d0d14]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex gap-1">
          {Object.entries(EMOJI_CATEGORIES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setCat(key)}
              className={`px-2.5 py-1.5 rounded-lg text-sm transition-all duration-200 ${cat === key ? 'bg-primary/20 text-primary scale-110 shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
            >
              {val.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-10 gap-0.5 p-2.5 max-h-40 overflow-y-auto scrollbar-hide">
        {EMOJI_CATEGORIES[cat].emojis.map(e => (
          <button
            key={e}
            onClick={() => onSelect(e)}
            className="w-7 h-7 flex items-center justify-center text-base hover:bg-white/10 rounded-lg transition-all duration-150 hover:scale-125 active:scale-95"
          >
            {e}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function MediaPreview({ url, type }: { url: string; type: string }) {
  const [expanded, setExpanded] = useState(false);
  if (type === "image") {
    return (
      <>
        <img
          src={url}
          alt=""
          className="max-w-full max-h-48 rounded-xl cursor-pointer hover:opacity-90 transition-all duration-200 mt-1.5 border border-white/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
          onClick={() => setExpanded(true)}
          loading="lazy"
        />
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
              onClick={() => setExpanded(false)}
            >
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={url}
                alt=""
                className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
  if (type === "video") {
    return (
      <video
        src={url}
        controls
        className="max-w-full max-h-48 rounded-xl mt-1.5 border border-white/5"
        preload="metadata"
      />
    );
  }
  return null;
}

function UserAvatar({ photoUrl, userId, size = "sm" }: { photoUrl: string | null; userId: number; size?: "sm" | "md" }) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === "md" ? "w-10 h-10" : "w-8 h-8";
  const textSize = size === "md" ? "text-base" : "text-sm";

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${sizeClass} rounded-xl object-cover border border-white/10 shadow-lg`}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center ${textSize} shadow-lg`}>
      {userAvatarEmoji(userId)}
    </div>
  );
}

function VerificationBadge({ username }: { username: string | null }) {
  const tier = useMemo(() => {
    if (!username) return null;
    const hash = username.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const tiers = ["verified", "pro", "elite", null, null, null];
    return tiers[hash % tiers.length];
  }, [username]);

  if (!tier) return null;
  if (tier === "elite") return <Crown className="w-3 h-3 text-yellow-400 ml-0.5" />;
  if (tier === "pro") return <Zap className="w-3 h-3 text-purple-400 ml-0.5" />;
  return <ShieldCheck className="w-3 h-3 text-emerald-400 ml-0.5" />;
}

function ReportCard({ message }: { message: string }) {
  const lines = message.split("\n");
  const riskLine = lines.find(l => l.includes("Risk:"));
  const riskMatch = riskLine?.match(/(\d+)\/100/);
  const score = riskMatch ? parseInt(riskMatch[1]) : 0;
  const typeLine = lines.find(l => l.includes("Check Result:"));
  const type = typeLine?.replace(/[🔴🟡🟢]\s*Check Result:\s*/, "").trim() || "CHECK";
  const targetLine = lines.find(l => l.includes("Target:"));
  const target = targetLine?.replace("🎯 Target: ", "").trim() || "***";
  const verifyLine = lines.find(l => l.includes("Verify:"));
  const verifyUrl = verifyLine?.replace("🔗 Verify: ", "").trim() || "";

  const riskColor = score >= 80 ? "text-red-400" : score >= 50 ? "text-orange-400" : "text-emerald-400";
  const riskBg = score >= 80 ? "from-red-500" : score >= 50 ? "from-orange-500" : "from-emerald-500";
  const riskIcon = score >= 80 ? <AlertTriangle className="w-4 h-4 text-red-400" /> : score >= 50 ? <AlertTriangle className="w-4 h-4 text-orange-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />;

  return (
    <div className="mt-1.5 p-3 rounded-xl bg-[#0a0a14]/80 border border-white/[0.08] space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {riskIcon}
          <span className="text-xs font-mono font-bold text-white/80">{type}</span>
        </div>
        <span className={`text-xs font-mono font-bold ${riskColor}`}>{score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${riskBg} to-transparent`}
        />
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-muted-foreground">🎯</span>
        <span className="font-mono text-white/70">{target}</span>
      </div>
      {verifyUrl && verifyUrl !== "/verify/N/A" && (
        <a href={verifyUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] text-primary/70 hover:text-primary transition-colors">
          <ExternalLink className="w-3 h-3" />
          <span className="font-mono">{verifyUrl}</span>
        </a>
      )}
    </div>
  );
}

function ShareReportModal({ onClose, onShare }: { onClose: () => void; onShare: (reportId: number) => void }) {
  const { t, lang } = useTranslation();
  const { data: reports = [], isLoading } = useQuery<ReportItem[]>({ queryKey: ["/api/reports"] });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-[#0d0d14] border border-white/10 rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="font-display font-bold text-sm">
              {lang === "uk" ? "Поділитися перевіркою" : lang === "ru" ? "Поделиться проверкой" : "Share Check Result"}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <span className="text-2xl mr-2 animate-spin">🔄</span>
              <span className="text-sm">{t("common.loading")}</span>
            </div>
          )}
          {!isLoading && reports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-3xl block mb-2">📭</span>
              <p className="text-xs">{lang === "uk" ? "Немає перевірок" : lang === "ru" ? "Нет проверок" : "No checks yet"}</p>
            </div>
          )}
          {reports.slice(0, 20).map(report => {
            const score = report.riskScore || 0;
            const riskColor = score >= 80 ? "text-red-400" : score >= 50 ? "text-orange-400" : "text-emerald-400";
            const riskBgColor = score >= 80 ? "bg-red-500" : score >= 50 ? "bg-orange-500" : "bg-emerald-500";
            const typeEmoji: Record<string, string> = { ip: "🌐", wallet: "💰", email: "📧", domain: "🔗", phone: "📱", url: "🔗", cve: "🐛", hash: "🔐", username: "👤", bot: "🤖", card: "💳" };
            const maskedTarget = report.target
              ? report.target.length > 10
                ? report.target.substring(0, 6) + "***" + report.target.substring(report.target.length - 4)
                : report.target.substring(0, 3) + "***"
              : "***";
            const date = new Date(report.createdAt);
            const dateStr = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <button key={report.id} onClick={() => onShare(report.id)}
                className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 hover:bg-white/[0.05] transition-all text-left flex items-center gap-3 group"
                data-testid={`share-report-${report.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{typeEmoji[report.type] || "📊"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-white/80 uppercase">{report.type}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${riskColor} bg-white/5`}>
                      {score}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 truncate font-mono mb-1">
                    🎯 {maskedTarget}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${riskBgColor}`} style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground/50 font-mono">{dateStr}</span>
                  </div>
                </div>
                <Share2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function OnlineIndicator() {
  const count = useMemo(() => Math.floor(Math.random() * 15) + 5, []);
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </div>
      <span className="text-[11px] font-mono text-emerald-400">{count} online</span>
    </div>
  );
}

function EmptyChat({ lang }: { lang: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div className="text-6xl mb-4"
        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        💬
      </motion.div>
      <div className="flex gap-2 mb-4">
        {["🛡️", "🔒", "⚡", "💎", "🔥"].map((e, i) => (
          <motion.span key={i} className="text-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 0.5, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
            {e}
          </motion.span>
        ))}
      </div>
      <h3 className="text-base font-display font-bold text-white mb-1">
        {lang === "uk" ? "Чат порожній" : lang === "ru" ? "Чат пустой" : lang === "es" ? "Chat vacío" : lang === "de" ? "Chat ist leer" : "Chat is empty"}
      </h3>
      <p className="text-xs text-muted-foreground max-w-xs">
        {lang === "uk" ? "Станьте першим! Поділіться знахідками, обговоріть загрози 🛡️" : lang === "ru" ? "Будьте первым! Делитесь находками, обсуждайте угрозы 🛡️" : "Be the first! Share findings, discuss threats 🛡️"}
      </p>
    </motion.div>
  );
}

function MessageBubble({ m, isOwn, showAvatar, lang, user, onReact }: { m: ChatMsg; isOwn: boolean; showAvatar: boolean; lang: string; user: any; onReact: (messageId: number, emoji: string) => void }) {
  const [showReactions, setShowReactions] = useState(false);
  const isReport = m.messageType === "report";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative z-10`}
    >
      {!isOwn && showAvatar && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mr-2 flex-shrink-0 mt-0.5">
          <UserAvatar photoUrl={m.photoUrl} userId={m.userId} />
        </motion.div>
      )}
      {!isOwn && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}

      <div className="max-w-[80%] lg:max-w-[65%] relative">
        <div
          className={`rounded-2xl px-3.5 py-2.5 transition-all duration-200 ${
            isOwn
              ? 'bg-gradient-to-br from-primary/15 to-emerald-500/5 border border-primary/20 rounded-br-md'
              : isReport
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/15 rounded-bl-md'
                : 'bg-white/[0.04] border border-white/[0.06] rounded-bl-md'
          }`}
          data-testid={`chat-message-${m.id}`}
          onDoubleClick={() => setShowReactions(prev => !prev)}
        >
          {showAvatar && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-[11px] font-mono font-bold ${isOwn ? 'text-primary' : userColor(m.userId)}`}>
                @{m.username || 'anon'}
              </span>
              <VerificationBadge username={m.username} />
              {isReport && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 font-mono font-bold ml-1">
                  📊 CHECK
                </span>
              )}
              <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5 ml-auto" title={fullTime(m.createdAt)}>
                {fullTime(m.createdAt)}
              </span>
            </div>
          )}

          {!showAvatar && (
            <div className="flex justify-end mb-0.5">
              <span className="text-[9px] text-muted-foreground/30">{fullTime(m.createdAt)}</span>
            </div>
          )}

          {m.fileUrl && (m.messageType === "image" || m.messageType === "video") && (
            <MediaPreview url={m.fileUrl} type={m.messageType} />
          )}

          {isReport ? (
            <ReportCard message={m.message} />
          ) : (
            m.message && !(m.fileUrl && (m.message === "📷 Photo" || m.message === "🎥 Video")) && (
              <p className="text-sm text-white/90 break-words whitespace-pre-wrap leading-relaxed">{m.message}</p>
            )
          )}
        </div>

        {m.reactions && m.reactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex gap-1 mt-1 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            {m.reactions.map((r) => {
              const isMine = user && r.userIds.includes(user.id);
              return (
                <motion.button
                  key={r.emoji}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onReact(m.id, r.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all duration-200 ${
                    isMine
                      ? 'bg-primary/15 border border-primary/30 shadow-sm shadow-primary/10'
                      : 'bg-white/5 border border-white/[0.08] hover:bg-white/10'
                  }`}
                  data-testid={`reaction-${m.id}-${r.emoji}`}
                >
                  <span>{r.emoji}</span>
                  <span className={`text-[10px] font-mono ${isMine ? 'text-primary' : 'text-muted-foreground'}`}>{r.userIds.length}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 5 }}
              className={`absolute ${isOwn ? 'right-0' : 'left-0'} -bottom-9 z-30 flex gap-0.5 px-2.5 py-1.5 rounded-full bg-[#0d0d14]/95 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/40`}
            >
              {QUICK_REACTIONS.map(r => (
                <motion.button
                  key={r}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    onReact(m.id, r);
                    setShowReactions(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-sm rounded-full hover:bg-white/10 transition-colors"
                >
                  {r}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-7' : '-right-7'} opacity-0 group-hover:opacity-100 transition-opacity`}>
          <button
            onClick={() => setShowReactions(prev => !prev)}
            className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] hover:bg-white/10 transition-colors"
          >
            😊
          </button>
        </div>
      </div>

      {isOwn && showAvatar && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2 flex-shrink-0 mt-0.5">
          <UserAvatar photoUrl={user?.photoUrl || m.photoUrl} userId={m.userId} />
        </motion.div>
      )}
      {isOwn && !showAvatar && <div className="w-8 ml-2 flex-shrink-0" />}
    </motion.div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const [msg, setMsg] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: userTeams = [] } = useQuery<UserTeam[]>({
    queryKey: ["/api/teams"],
    enabled: !!user,
  });

  const chatQueryKey = activeTeamId
    ? ["/api/chat/messages", { teamId: activeTeamId }]
    : ["/api/chat/messages"];

  const { data: messages = [], isLoading } = useQuery<ChatMsg[]>({
    queryKey: chatQueryKey,
    queryFn: async () => {
      const url = activeTeamId
        ? `/api/chat/messages?teamId=${activeTeamId}`
        : "/api/chat/messages";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!user,
  });

  const sendMutation = useMutation({
    mutationFn: async ({ message, file }: { message: string; file: File | null }) => {
      const formData = new FormData();
      if (message) formData.append("message", message);
      if (file) formData.append("file", file);
      if (activeTeamId) formData.append("teamId", String(activeTeamId));
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Send failed" }));
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKey });
      setMsg("");
      setPreviewFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    },
  });

  const shareReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const res = await apiRequest("POST", "/api/chat/share-report", { reportId, teamId: activeTeamId });
      if (!res.ok) throw new Error("Failed to share");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKey });
      setShowShareModal(false);
      toast({ title: "📊", description: lang === "uk" ? "Перевірку поділено в чаті" : lang === "ru" ? "Проверка отправлена в чат" : "Check shared to chat" });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: number; emoji: string }) => {
      const res = await apiRequest("POST", "/api/chat/reactions", { messageId, emoji });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKey });
    },
  });

  const handleReact = useCallback((messageId: number, emoji: string) => {
    reactionMutation.mutate({ messageId, emoji });
  }, [reactionMutation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleSend = useCallback(() => {
    const text = msg.trim();
    if ((!text && !previewFile) || sendMutation.isPending) return;
    sendMutation.mutate({ message: text, file: previewFile });
    setShowEmoji(false);
  }, [msg, previewFile, sendMutation]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  }, []);

  const removePreview = useCallback(() => {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  const insertEmoji = useCallback((emoji: string) => {
    setMsg(prev => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const chatTitle = activeTeamId
    ? userTeams.find(t => t.id === activeTeamId)?.name || "Team"
    : (lang === "uk" ? "Загальний чат" : lang === "ru" ? "Общий чат" : lang === "es" ? "Chat General" : lang === "de" ? "Allgemeiner Chat" : "General Chat");

  const chatSubtitle = activeTeamId
    ? (lang === "uk" ? "🔒 Приватний чат команди" : lang === "ru" ? "🔒 Приватный чат команды" : "🔒 Private team chat")
    : (lang === "uk" ? "🌐 Обговорюйте ризики з спільнотою" : lang === "ru" ? "🌐 Обсуждайте риски с сообществом" : "🌐 Discuss risks with the community");

  return (
    <PageLayout>
      <div className="flex-1 flex flex-col h-[100dvh] lg:h-auto lg:min-h-screen max-w-full overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_71%_45%/0.04)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(200_80%_50%/0.03)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(280_70%_50%/0.02)_0%,transparent_40%)]" />
          <div className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `linear-gradient(hsl(142 71% 45% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(142 71% 45% / 0.3) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <FloatingParticles />
        <ScanLine />

        <div className="flex-1 p-3 lg:p-6 overflow-hidden flex flex-col relative z-10">
          <div className="max-w-5xl mx-auto w-full flex flex-col flex-1 overflow-hidden">

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-3 lg:mb-4">
              <div className="flex items-center justify-between p-3 lg:p-4 rounded-2xl bg-[#0d0d14]/80 backdrop-blur-xl border border-white/[0.06] shadow-xl shadow-black/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-primary/30 to-cyan-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                      <span className="text-xl lg:text-2xl">💬</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0d0d14] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-xl font-display font-bold flex items-center gap-1.5" data-testid="text-chat-title">
                      <span className="bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent">
                        {chatTitle}
                      </span>
                      {activeTeamId && <span className="text-base">🔐</span>}
                    </h1>
                    <p className="text-[11px] lg:text-xs text-muted-foreground">{chatSubtitle}</p>
                  </div>
                </div>
                <OnlineIndicator />
              </div>
            </motion.div>

            {userTeams.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide"
              >
                <button
                  onClick={() => setActiveTeamId(null)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    !activeTeamId
                      ? "bg-gradient-to-r from-primary/20 to-emerald-500/10 border border-primary/30 text-primary shadow-lg shadow-primary/10"
                      : "bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-white hover:border-white/15"
                  }`}
                  data-testid="button-chat-global"
                >
                  <span className="text-sm">🌍</span>
                  {lang === "uk" ? "Загальний" : lang === "ru" ? "Общий" : "General"}
                </button>
                {userTeams.map(team => (
                  <button key={team.id} onClick={() => setActiveTeamId(team.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      activeTeamId === team.id
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/10 border border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10"
                        : "bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-white hover:border-white/15"
                    }`}
                    data-testid={`button-chat-team-${team.id}`}
                  >
                    <span className="text-sm">🔒</span>
                    {team.name}
                  </button>
                ))}
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Card className="flex-1 flex flex-col overflow-hidden bg-[#0a0a12]/80 backdrop-blur-xl border-white/[0.06] rounded-2xl shadow-2xl shadow-black/30">

                <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{activeTeamId ? "🔐" : "💬"}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {messages.length} {lang === "uk" ? "повідомлень" : lang === "ru" ? "сообщений" : "messages"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                      <Lock className="w-3 h-3" />
                      <span className="hidden sm:inline">{lang === "uk" ? "Зашифровано" : lang === "ru" ? "Зашифровано" : "Encrypted"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">{lang === "uk" ? "Модерація" : lang === "ru" ? "Модерация" : "Moderated"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-1.5 relative" data-testid="chat-messages-list"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 30%, hsl(142 71% 45% / 0.03) 0%, transparent 40%),
                      radial-gradient(circle at 80% 70%, hsl(200 80% 50% / 0.025) 0%, transparent 35%),
                      radial-gradient(circle at 50% 50%, hsl(280 70% 50% / 0.015) 0%, transparent 50%),
                      linear-gradient(hsl(142 71% 45% / 0.04) 1px, transparent 1px),
                      linear-gradient(90deg, hsl(142 71% 45% / 0.04) 1px, transparent 1px)
                    `,
                    backgroundSize: '100% 100%, 100% 100%, 100% 100%, 28px 28px, 28px 28px',
                  }}
                >
                  <ChatWallpaper />
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground relative z-10">
                      <motion.div className="text-4xl mb-3" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                        🔄
                      </motion.div>
                      <span className="text-sm font-mono">{t('common.loading')}</span>
                    </div>
                  )}

                  {!isLoading && messages.length === 0 && <div className="relative z-10"><EmptyChat lang={lang} /></div>}

                  <AnimatePresence initial={false}>
                    {messages.map((m, idx) => {
                      const isOwn = m.userId === user?.id;
                      const showAvatar = idx === 0 || messages[idx - 1].userId !== m.userId;
                      return (
                        <MessageBubble
                          key={m.id}
                          m={m}
                          isOwn={isOwn}
                          showAvatar={showAvatar}
                          lang={lang}
                          user={user}
                          onReact={handleReact}
                        />
                      );
                    })}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                {previewFile && previewUrl && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 pt-3 border-t border-white/[0.06]"
                  >
                    <div className="relative inline-block">
                      {previewFile.type.startsWith("image/") ? (
                        <img src={previewUrl} alt="" className="h-20 rounded-xl object-cover border border-white/10 shadow-lg" />
                      ) : (
                        <video src={previewUrl} className="h-20 rounded-xl object-cover border border-white/10 shadow-lg" />
                      )}
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={removePreview}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors shadow-lg shadow-red-500/30"
                        data-testid="button-remove-preview"
                      >
                        <X className="w-3 h-3 text-white" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                <div className="p-3 lg:p-4 border-t border-white/[0.06] bg-[#0a0a12]/60">
                  <div className="flex gap-2 items-end relative">
                    <div className="flex gap-1">
                      <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={handleFileSelect} className="hidden" />
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}
                          className="h-10 w-10 p-0 text-muted-foreground hover:text-primary rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5 transition-all"
                          data-testid="button-attach-file" title={lang === "uk" ? "Фото/Відео" : "Photo/Video"}
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                      </motion.div>
                      <div className="relative">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="ghost" size="sm" onClick={() => setShowEmoji(!showEmoji)}
                            className={`h-10 w-10 p-0 rounded-xl transition-all ${showEmoji ? 'text-primary bg-primary/10 border border-primary/30' : 'text-muted-foreground hover:text-primary bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5'}`}
                            data-testid="button-emoji" title="Emoji"
                          >
                            <span className="text-base">😊</span>
                          </Button>
                        </motion.div>
                        <AnimatePresence>
                          {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
                        </AnimatePresence>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="ghost" size="sm" onClick={() => setShowShareModal(true)}
                          className="h-10 w-10 p-0 text-muted-foreground hover:text-blue-400 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                          data-testid="button-share-report"
                          title={lang === "uk" ? "Поділитися перевіркою" : lang === "ru" ? "Поделиться проверкой" : "Share check"}
                        >
                          <span className="text-base">📊</span>
                        </Button>
                      </motion.div>
                    </div>

                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={lang === "uk" ? "💬 Напишіть повідомлення..." : lang === "ru" ? "💬 Напишите сообщение..." : "💬 Type a message..."}
                        maxLength={500}
                        rows={1}
                        className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-primary/40 focus:bg-white/[0.05] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 resize-none min-h-[40px] max-h-[100px] outline-none transition-all duration-200 focus:shadow-lg focus:shadow-primary/5 focus:ring-1 focus:ring-primary/20"
                        style={{ height: 'auto', overflow: 'hidden' }}
                        onInput={(e) => {
                          const el = e.target as HTMLTextAreaElement;
                          el.style.height = 'auto';
                          el.style.height = Math.min(el.scrollHeight, 100) + 'px';
                        }}
                        data-testid="input-chat-message"
                      />
                    </div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={handleSend}
                        disabled={(!msg.trim() && !previewFile) || sendMutation.isPending}
                        className="bg-gradient-to-r from-primary/30 to-emerald-500/20 border border-primary/30 hover:from-primary/40 hover:to-emerald-500/30 h-10 w-10 p-0 flex-shrink-0 rounded-xl shadow-lg shadow-primary/10 disabled:opacity-30 disabled:shadow-none transition-all"
                        data-testid="button-send-message"
                      >
                        {sendMutation.isPending ? (
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-base">⏳</motion.span>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-[10px] text-muted-foreground/40">
                      ⌨️ Enter → {lang === "uk" ? "відправити" : lang === "ru" ? "отправить" : "send"} · Shift+Enter → {lang === "uk" ? "рядок" : lang === "ru" ? "строка" : "line"}
                    </span>
                    <span className={`text-[10px] font-mono transition-colors ${msg.length > 450 ? 'text-red-400' : msg.length > 350 ? 'text-yellow-400' : 'text-muted-foreground/40'}`}>
                      {msg.length}/500
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {showShareModal && (
            <ShareReportModal
              onClose={() => setShowShareModal(false)}
              onShare={(reportId) => shareReportMutation.mutate(reportId)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
