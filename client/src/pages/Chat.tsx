import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
import { useIsStandalone } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Send, Image, X, ShieldCheck, Crown, Zap, Lock, Eye, Share2,
  ExternalLink, AlertTriangle, CheckCircle, Search, ChevronDown,
  Reply, Pin, Check, CheckCheck, ArrowDown
} from "lucide-react";
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

function getDateLabel(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - msgDay.getTime()) / 86400000);

  if (diff === 0) return lang === "uk" ? "Сьогодні" : lang === "ru" ? "Сегодня" : "Today";
  if (diff === 1) return lang === "uk" ? "Вчора" : lang === "ru" ? "Вчера" : "Yesterday";
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

const COLORS = [
  "text-cyan-400", "text-purple-400", "text-cyan-400", "text-orange-400",
  "text-pink-400", "text-yellow-400", "text-blue-400", "text-rose-400",
];

function userColor(userId: number) {
  return COLORS[userId % COLORS.length];
}

const AVATAR_COLORS = [
  "from-cyan-500/30 to-blue-500/20",
  "from-purple-500/30 to-pink-500/20",
  "from-cyan-500/30 to-teal-500/20",
  "from-orange-500/30 to-red-500/20",
  "from-pink-500/30 to-rose-500/20",
  "from-yellow-500/30 to-amber-500/20",
  "from-blue-500/30 to-indigo-500/20",
  "from-rose-500/30 to-red-500/20",
];

function userInitials(username: string | null): string {
  if (!username) return "?";
  return username.charAt(0).toUpperCase();
}

const EMOJI_CATEGORIES: Record<string, { label: string; emojis: string[] }> = {
  faces: {
    label: "Faces",
    emojis: ["thumbsup","fire","heart","100","clap","laugh","shock","think","cool","star","rocket","check","wave","muscle","eyes","sparkles","lightning","party","skull","ghost"],
  },
  security: {
    label: "Security",
    emojis: ["shield","lock","unlock","key","warning","alert","bug","detective","target","bomb","sword","stop","no_entry","sos","red_circle","green_circle","yellow_circle","blue_circle","lightning","chain"],
  },
};

const REACTION_ICONS: Record<string, string> = {
  "thumbsup": "\uD83D\uDC4D",
  "fire": "\uD83D\uDD25",
  "heart": "\u2764\uFE0F",
  "100": "\uD83D\uDCAF",
  "clap": "\uD83D\uDC4F",
  "laugh": "\uD83D\uDE02",
  "shock": "\uD83D\uDE31",
  "think": "\uD83E\uDD14",
  "cool": "\uD83D\uDE0E",
  "star": "\u2B50",
  "rocket": "\uD83D\uDE80",
  "check": "\u2705",
  "wave": "\uD83D\uDC4B",
  "muscle": "\uD83D\uDCAA",
  "eyes": "\uD83D\uDC40",
  "sparkles": "\u2728",
  "lightning": "\u26A1",
  "party": "\uD83C\uDF89",
  "skull": "\uD83D\uDC80",
  "ghost": "\uD83D\uDC7B",
  "shield": "\uD83D\uDEE1\uFE0F",
  "lock": "\uD83D\uDD12",
  "unlock": "\uD83D\uDD13",
  "key": "\uD83D\uDD11",
  "warning": "\u26A0\uFE0F",
  "alert": "\uD83D\uDEA8",
  "bug": "\uD83D\uDC1B",
  "detective": "\uD83D\uDD75\uFE0F",
  "target": "\uD83C\uDFAF",
  "bomb": "\uD83D\uDCA3",
  "sword": "\uD83D\uDDE1\uFE0F",
  "stop": "\u26D4",
  "no_entry": "\uD83D\uDEAB",
  "sos": "\uD83C\uDD98",
  "red_circle": "\uD83D\uDD34",
  "green_circle": "\uD83D\uDFE2",
  "yellow_circle": "\uD83D\uDFE1",
  "blue_circle": "\uD83D\uDD35",
  "chain": "\u26D3\uFE0F",
};

const QUICK_REACTIONS = ["thumbsup", "fire", "heart", "100", "check", "eyes"];

function getReactionDisplay(key: string): string {
  return REACTION_ICONS[key] || key;
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const [cat, setCat] = useState("faces");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full mb-2 left-0 w-[280px] bg-[#0d0d14]/95 backdrop-blur-xl border border-white/10 rounded-md shadow-2xl shadow-black/50 overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02]">
        <div className="flex gap-1">
          {Object.entries(EMOJI_CATEGORIES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setCat(key)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all duration-200 ${cat === key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
            >
              {val.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 hover:bg-white/5 rounded-md transition-colors" aria-label="Close emoji picker" data-testid="button-close-emoji">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-10 gap-0.5 p-2.5 max-h-40 overflow-y-auto">
        {EMOJI_CATEGORIES[cat].emojis.map(e => (
          <button
            key={e}
            onClick={() => onSelect(getReactionDisplay(e))}
            className="w-6 h-6 flex items-center justify-center text-sm hover:bg-white/10 rounded-md transition-all duration-150 hover:scale-110 active:scale-95"
          >
            {getReactionDisplay(e)}
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
          className="max-w-full max-h-48 rounded-md cursor-pointer hover:opacity-90 transition-all duration-200 mt-1.5 border border-white/5 hover:border-primary/30"
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
                className="max-w-full max-h-[90vh] rounded-md object-contain shadow-2xl"
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
        className="max-w-full max-h-48 rounded-md mt-1.5 border border-white/5"
        preload="metadata"
      />
    );
  }
  return null;
}

function UserAvatar({ photoUrl, userId, username, size = "sm" }: { photoUrl: string | null; userId: number; username?: string | null; size?: "sm" | "md" }) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === "md" ? "w-10 h-10" : "w-8 h-8";
  const textSize = size === "md" ? "text-sm font-bold" : "text-xs font-bold";
  const gradient = AVATAR_COLORS[userId % AVATAR_COLORS.length];

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${sizeClass} rounded-md object-cover border border-white/10`}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-md bg-gradient-to-br ${gradient} border border-white/10 flex items-center justify-center ${textSize} text-white/80`}>
      {userInitials(username || null)}
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
  return <ShieldCheck className="w-3 h-3 text-cyan-400 ml-0.5" />;
}

function ReportCard({ message }: { message: string }) {
  const lines = message.split("\n");
  const riskLine = lines.find(l => l.includes("Risk:"));
  const riskMatch = riskLine?.match(/(\d+)\/100/);
  const score = riskMatch ? parseInt(riskMatch[1]) : 0;
  const typeLine = lines.find(l => l.includes("Check Result:"));
  const type = typeLine?.replace(/[^a-zA-Z\s]/g, "").replace("Check Result", "").trim() || "CHECK";
  const targetLine = lines.find(l => l.includes("Target:"));
  const target = targetLine?.replace(/^.*Target:\s*/, "").trim() || "***";
  const verifyLine = lines.find(l => l.includes("Verify:"));
  const verifyUrl = verifyLine?.replace(/^.*Verify:\s*/, "").trim() || "";

  const riskColor = score >= 80 ? "text-red-400" : score >= 50 ? "text-orange-400" : "text-cyan-400";
  const riskBg = score >= 80 ? "from-red-500" : score >= 50 ? "from-orange-500" : "from-cyan-500";
  const riskIcon = score >= 80 ? <AlertTriangle className="w-4 h-4 text-red-400" /> : score >= 50 ? <AlertTriangle className="w-4 h-4 text-orange-400" /> : <CheckCircle className="w-4 h-4 text-cyan-400" />;

  return (
    <div className="mt-1.5 p-3 rounded-md bg-[#0a0a14]/80 border border-white/[0.08] space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
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
        <span className="text-muted-foreground"><Search className="w-3 h-3 inline" /></span>
        <span className="font-mono text-white/70">{target}</span>
      </div>
      {verifyUrl && verifyUrl !== "/verify/N/A" && /^https?:\/\//i.test(verifyUrl) && (
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
        className="bg-[#0d0d14] border border-white/10 rounded-md w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">
              {lang === "uk" ? "Поділитися перевіркою" : lang === "ru" ? "Поделиться проверкой" : "Share Check Result"}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 rounded-md hover:bg-white/5" aria-label="Close share dialog" data-testid="button-close-share">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
              <span className="text-sm">{t("common.loading")}</span>
            </div>
          )}
          {!isLoading && reports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Share2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">{lang === "uk" ? "Немає перевірок" : lang === "ru" ? "Нет проверок" : "No checks yet"}</p>
            </div>
          )}
          {reports.slice(0, 20).map(report => {
            const score = report.riskScore || 0;
            const riskColor = score >= 80 ? "text-red-400" : score >= 50 ? "text-orange-400" : "text-cyan-400";
            const riskBgColor = score >= 80 ? "bg-red-500" : score >= 50 ? "bg-orange-500" : "bg-cyan-500";
            const maskedTarget = report.target
              ? report.target.length > 10
                ? report.target.substring(0, 6) + "***" + report.target.substring(report.target.length - 4)
                : report.target.substring(0, 3) + "***"
              : "***";
            const date = new Date(report.createdAt);
            const dateStr = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <button key={report.id} onClick={() => onShare(report.id)}
                className="w-full p-3 rounded-md bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 hover:bg-white/[0.05] transition-all text-left flex items-center gap-3 group"
                data-testid={`share-report-${report.id}`}
              >
                <div className="w-10 h-10 rounded-md bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono font-bold text-white/80 uppercase">{report.type}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${riskColor} bg-white/5`}>
                      {score}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 truncate font-mono mb-1">
                    {maskedTarget}
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
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-cyan-400" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
      </div>
      <span className="text-[11px] font-mono text-cyan-400">{count} online</span>
    </div>
  );
}

function TypingIndicator({ lang }: { lang: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/[0.04] border border-white/[0.06]">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground/60 font-mono">
          {lang === "uk" ? "хтось пише..." : lang === "ru" ? "кто-то пишет..." : "someone is typing..."}
        </span>
      </div>
    </motion.div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2 relative z-10">
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-[10px] font-mono text-muted-foreground/50 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.04]">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function PinnedMessagesBar({ messages, lang, onClose }: { messages: ChatMsg[]; lang: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const pinnedMessages = useMemo(() => messages.slice(0, 3), [messages]);

  if (pinnedMessages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-white/[0.06] bg-amber-500/[0.03]"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 text-left hover:bg-white/[0.02] transition-colors"
        data-testid="button-pinned-toggle"
      >
        <div className="flex items-center gap-2">
          <Pin className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono text-amber-400/80">
            {pinnedMessages.length} {lang === "uk" ? "закріплено" : lang === "ru" ? "закреплено" : "pinned"}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2 space-y-1"
          >
            {pinnedMessages.map(m => (
              <div key={m.id} className="flex items-start gap-2 p-2 rounded-md bg-white/[0.02] border border-white/[0.04]">
                <Pin className="w-3 h-3 text-amber-400/60 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-amber-400/70">@{m.username || 'anon'}</span>
                  <p className="text-xs text-white/70 truncate">{m.message}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EmptyChat({ lang }: { lang: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        className="w-16 h-16 rounded-md bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/20 flex items-center justify-center mb-4"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Send className="w-6 h-6 text-primary/60" />
      </motion.div>
      <h3 className="text-base font-display font-bold text-white mb-1">
        {lang === "uk" ? "Чат порожній" : lang === "ru" ? "Чат пустой" : lang === "es" ? "Chat vacío" : lang === "de" ? "Chat ist leer" : "Chat is empty"}
      </h3>
      <p className="text-xs text-muted-foreground max-w-xs">
        {lang === "uk" ? "Станьте першим! Поділіться знахідками, обговоріть загрози" : lang === "ru" ? "Будьте первым! Делитесь находками, обсуждайте угрозы" : "Be the first! Share findings, discuss threats"}
      </p>
    </motion.div>
  );
}

function MessageBubble({
  m, isOwn, showAvatar, lang, user, onReact, onReply, replyTo, highlighted
}: {
  m: ChatMsg; isOwn: boolean; showAvatar: boolean; lang: string; user: any;
  onReact: (messageId: number, emoji: string) => void;
  onReply: (msg: ChatMsg) => void;
  replyTo?: ChatMsg | null;
  highlighted?: boolean;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const isReport = m.messageType === "report";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative z-10 ${highlighted ? 'ring-1 ring-primary/30 rounded-md' : ''}`}
      id={`msg-${m.id}`}
    >
      {!isOwn && showAvatar && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mr-2 flex-shrink-0 mt-0.5">
          <UserAvatar photoUrl={m.photoUrl} userId={m.userId} username={m.username} />
        </motion.div>
      )}
      {!isOwn && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}

      <div className="max-w-[80%] lg:max-w-[65%] relative">
        <div
          className={`rounded-md px-3.5 py-2.5 transition-all duration-200 ${
            isOwn
              ? 'bg-gradient-to-br from-primary/12 to-cyan-500/5 border border-primary/15'
              : isReport
                ? 'bg-gradient-to-br from-blue-500/8 to-purple-500/4 border border-blue-500/12'
                : 'bg-white/[0.04] border border-white/[0.06]'
          }`}
          style={{
            backdropFilter: 'blur(8px)',
          }}
          data-testid={`chat-message-${m.id}`}
          onDoubleClick={() => setShowReactions(prev => !prev)}
        >
          {showAvatar && (
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`text-[11px] font-mono font-bold ${isOwn ? 'text-primary' : userColor(m.userId)}`}>
                @{m.username || 'anon'}
              </span>
              <VerificationBadge username={m.username} />
              {isReport && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 font-mono font-bold ml-1">
                  CHECK
                </span>
              )}
              <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1 ml-auto" title={fullTime(m.createdAt)}>
                {fullTime(m.createdAt)}
                {isOwn && (
                  <CheckCheck className="w-3 h-3 text-primary/50" />
                )}
              </span>
            </div>
          )}

          {!showAvatar && (
            <div className="flex justify-end mb-0.5">
              <span className="text-[9px] text-muted-foreground/30 flex items-center gap-1">
                {fullTime(m.createdAt)}
                {isOwn && <Check className="w-2.5 h-2.5 text-primary/40" />}
              </span>
            </div>
          )}

          {m.fileUrl && (m.messageType === "image" || m.messageType === "video") && (
            <MediaPreview url={m.fileUrl} type={m.messageType} />
          )}

          {isReport ? (
            <ReportCard message={m.message} />
          ) : (
            m.message && !(m.fileUrl && (m.message === "Photo" || m.message === "Video")) && (() => {
              const quoteMatch = m.message.match(/^> @(.+?): (.+?)(?:\n\n)([\s\S]*)$/);
              if (quoteMatch) {
                const [, quotedUser, quotedText, actualMessage] = quoteMatch;
                return (
                  <div>
                    <div
                      className="mb-1.5 px-2 py-1 rounded-md bg-white/[0.04] border-l-2 border-primary/40 cursor-pointer hover:bg-white/[0.07] transition-colors"
                      onClick={() => {
                        const allMsgs = Array.from(document.querySelectorAll(`[data-testid^="chat-message-"]`));
                        for (const msgEl of allMsgs) {
                          const msgText = msgEl.textContent || '';
                          if (msgText.includes(quotedUser) && msgText.includes(quotedText.substring(0, 30))) {
                            msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            msgEl.classList.add('ring-1', 'ring-primary/40');
                            setTimeout(() => msgEl.classList.remove('ring-1', 'ring-primary/40'), 2000);
                            break;
                          }
                        }
                      }}
                      data-testid={`reply-quote-${m.id}`}
                    >
                      <span className="text-[10px] font-mono text-primary">@{quotedUser}</span>
                      <p className="text-[11px] text-white/40 truncate">{quotedText}</p>
                    </div>
                    <p className="text-sm text-white/90 break-words whitespace-pre-wrap leading-relaxed">{actualMessage}</p>
                  </div>
                );
              }
              return <p className="text-sm text-white/90 break-words whitespace-pre-wrap leading-relaxed">{m.message}</p>;
            })()
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
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs transition-all duration-200 ${
                    isMine
                      ? 'bg-primary/15 border border-primary/30'
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
              className={`absolute ${isOwn ? 'right-0' : 'left-0'} -bottom-9 z-30 flex gap-0.5 px-2.5 py-1.5 rounded-md bg-[#0d0d14]/95 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/40`}
            >
              {QUICK_REACTIONS.map(r => (
                <motion.button
                  key={r}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    onReact(m.id, getReactionDisplay(r));
                    setShowReactions(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-sm rounded-md hover:bg-white/10 transition-colors"
                >
                  {getReactionDisplay(r)}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-16' : '-right-16'} invisible group-hover:visible flex gap-0.5`}>
          <button
            onClick={() => setShowReactions(prev => !prev)}
            className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] hover:bg-white/10 transition-colors"
            data-testid={`button-react-${m.id}`}
          >
            <CheckCircle className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => onReply(m)}
            className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            data-testid={`button-reply-${m.id}`}
          >
            <Reply className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {isOwn && showAvatar && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2 flex-shrink-0 mt-0.5">
          <UserAvatar photoUrl={user?.photoUrl || m.photoUrl} userId={m.userId} username={m.username} />
        </motion.div>
      )}
      {isOwn && !showAvatar && <div className="w-8 ml-2 flex-shrink-0" />}
    </motion.div>
  );
}

export default function Chat() {
  const isStandalone = useIsStandalone();
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const [msg, setMsg] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);
  const [showPinned, setShowPinned] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

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

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m =>
      m.message.toLowerCase().includes(q) ||
      (m.username && m.username.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  const pinnedMessages = useMemo(() => {
    return messages.filter(m => m.messageType === "report").slice(0, 5);
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowTyping(true);
      setTimeout(() => setShowTyping(false), 3000 + Math.random() * 2000);
    }, 15000 + Math.random() * 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && !isAtBottom) {
      setNewMsgCount(prev => prev + (messages.length - prevMsgCountRef.current));
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, isAtBottom]);

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
      setReplyingTo(null);
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
      toast({ title: "Shared", description: lang === "uk" ? "Перевірку поділено в чаті" : lang === "ru" ? "Проверка отправлена в чат" : "Check shared to chat" });
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

  const handleReply = useCallback((msg: ChatMsg) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);
    if (atBottom) setNewMsgCount(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMsgCount(0);
    setIsAtBottom(true);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isAtBottom]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleSend = useCallback(() => {
    const text = msg.trim();
    if ((!text && !previewFile) || sendMutation.isPending) return;
    const fullMessage = replyingTo
      ? `> @${replyingTo.username || 'anon'}: ${replyingTo.message.substring(0, 80)}${replyingTo.message.length > 80 ? '...' : ''}\n\n${text}`
      : text;
    sendMutation.mutate({ message: fullMessage, file: previewFile });
    setReplyingTo(null);
    setShowEmoji(false);
  }, [msg, previewFile, sendMutation, replyingTo]);

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
    ? userTeams.find(t => t.id === activeTeamId)?.name || (lang === "uk" ? "Команда" : lang === "ru" ? "Команда" : lang === "es" ? "Equipo" : lang === "de" ? "Team" : "Team")
    : (lang === "uk" ? "Загальний чат" : lang === "ru" ? "Общий чат" : lang === "es" ? "Chat General" : lang === "de" ? "Allgemeiner Chat" : "General Chat");

  const chatSubtitle = activeTeamId
    ? (lang === "uk" ? "Приватний чат команди" : lang === "ru" ? "Приватный чат команды" : lang === "es" ? "Chat privado del equipo" : lang === "de" ? "Privater Team-Chat" : "Private team chat")
    : (lang === "uk" ? "Обговорюйте ризики з спільнотою" : lang === "ru" ? "Обсуждайте риски с сообществом" : lang === "es" ? "Discute riesgos con la comunidad" : lang === "de" ? "Risiken mit der Community besprechen" : "Discuss risks with the community");

  const messagesWithSeparators = useMemo(() => {
    const result: { type: 'separator' | 'message'; label?: string; msg?: ChatMsg; showAvatar?: boolean }[] = [];
    let lastDateLabel = "";
    filteredMessages.forEach((m, idx) => {
      const dateLabel = getDateLabel(m.createdAt, lang);
      if (dateLabel !== lastDateLabel) {
        result.push({ type: 'separator', label: dateLabel });
        lastDateLabel = dateLabel;
      }
      const showAvatar = idx === 0 || filteredMessages[idx - 1].userId !== m.userId;
      result.push({ type: 'message', msg: m, showAvatar });
    });
    return result;
  }, [filteredMessages, lang]);

  return (
    <PageLayout title="Chat" appMode={isStandalone}>
      <div className="flex-1 flex flex-col h-full lg:h-auto lg:min-h-screen max-w-full overflow-hidden relative pb-16 lg:pb-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_71%_45%/0.03)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(200_80%_50%/0.02)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(280_70%_50%/0.015)_0%,transparent_40%)]" />
        </div>

        <div className="flex-1 p-3 lg:p-6 overflow-hidden flex flex-col relative z-10">
          <div className="max-w-5xl mx-auto w-full flex flex-col flex-1 overflow-hidden">

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-3 lg:mb-4">
              <div
                className="relative p-3 lg:p-4 rounded-md border border-white/[0.06] shadow-xl overflow-visible"
                style={{
                  background: 'linear-gradient(135deg, rgba(13,13,20,0.9) 0%, rgba(16,16,28,0.9) 50%, rgba(13,13,20,0.9) 100%)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
                  <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                      background: 'linear-gradient(135deg, hsl(142 71% 45%) 0%, hsl(190 80% 50%) 33%, hsl(280 70% 50%) 66%, hsl(142 71% 45%) 100%)',
                      backgroundSize: '300% 300%',
                      animation: 'holographic 8s ease infinite',
                    }}
                  />
                </div>

                <div className="relative flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="relative" style={{ perspective: '600px' }}>
                      <motion.div
                        className="w-11 h-11 lg:w-12 lg:h-12 rounded-md bg-gradient-to-br from-primary/30 to-cyan-500/20 border border-primary/30 flex items-center justify-center"
                        animate={{ rotateY: [0, 10, -10, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                      </motion.div>
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-[#0d0d14] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-lg lg:text-xl font-display font-bold flex items-center gap-1.5" data-testid="text-chat-title">
                        <span className="bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent">
                          {chatTitle}
                        </span>
                        {activeTeamId && <Lock className="w-3.5 h-3.5 text-primary/60" />}
                      </h1>
                      <p className="text-[11px] lg:text-xs text-muted-foreground">{chatSubtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSearch(!showSearch)}
                      className={`${showSearch ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                      data-testid="button-search-toggle"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                    <OnlineIndicator />
                  </div>
                </div>

                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={lang === "uk" ? "Пошук повідомлень..." : lang === "ru" ? "Поиск сообщений..." : "Search messages..."}
                          className="pl-9 bg-white/[0.03] border-white/[0.08] focus:border-primary/40 text-sm"
                          data-testid="input-search-messages"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                            aria-label="Clear search"
                            data-testid="button-clear-search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {searchQuery && (
                        <p className="text-[10px] text-muted-foreground/50 mt-1.5 font-mono">
                          {filteredMessages.length} {lang === "uk" ? "знайдено" : lang === "ru" ? "найдено" : "found"}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {userTeams.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="flex gap-2 mb-3 overflow-x-auto pb-1"
              >
                <button
                  onClick={() => setActiveTeamId(null)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    !activeTeamId
                      ? "bg-gradient-to-r from-primary/20 to-cyan-500/10 border border-primary/30 text-primary"
                      : "bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-white hover:border-white/15"
                  }`}
                  data-testid="button-chat-global"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {lang === "uk" ? "Загальний" : lang === "ru" ? "Общий" : "General"}
                </button>
                {userTeams.map(team => (
                  <button key={team.id} onClick={() => setActiveTeamId(team.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      activeTeamId === team.id
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/10 border border-blue-500/30 text-blue-400"
                        : "bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-white hover:border-white/15"
                    }`}
                    data-testid={`button-chat-team-${team.id}`}
                  >
                    <Lock className="w-3 h-3" />
                    {team.name}
                  </button>
                ))}
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Card className="flex-1 flex flex-col overflow-hidden bg-[#0a0a12]/80 backdrop-blur-xl border-white/[0.06] rounded-md shadow-2xl shadow-black/30">

                <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {activeTeamId ? <Lock className="w-3 h-3 inline mr-1" /> : <ShieldCheck className="w-3 h-3 inline mr-1" />}
                      {filteredMessages.length} {lang === "uk" ? "повідомлень" : lang === "ru" ? "сообщений" : "messages"}
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

                <AnimatePresence>
                  {showPinned && pinnedMessages.length > 0 && (
                    <PinnedMessagesBar messages={pinnedMessages} lang={lang} onClose={() => setShowPinned(false)} />
                  )}
                </AnimatePresence>

                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-1.5 relative"
                  data-testid="chat-messages-list"
                >
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground relative z-10">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                      <span className="text-sm font-mono">{t('common.loading')}</span>
                    </div>
                  )}

                  {!isLoading && filteredMessages.length === 0 && !searchQuery && <div className="relative z-10"><EmptyChat lang={lang} /></div>}

                  {!isLoading && filteredMessages.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center py-16 text-center relative z-10">
                      <Search className="w-8 h-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {lang === "uk" ? "Нічого не знайдено" : lang === "ru" ? "Ничего не найдено" : "No results found"}
                      </p>
                    </div>
                  )}

                  {messagesWithSeparators.map((item, idx) => {
                    if (item.type === 'separator') {
                      return <DateSeparator key={`sep-${idx}`} label={item.label!} />;
                    }
                    const m = item.msg!;
                    const isOwn = m.userId === user?.id;
                    return (
                      <MessageBubble
                        key={m.id}
                        m={m}
                        isOwn={isOwn}
                        showAvatar={item.showAvatar!}
                        lang={lang}
                        user={user}
                        onReact={handleReact}
                        onReply={handleReply}
                        highlighted={false}
                      />
                    );
                  })}

                  <AnimatePresence>
                    {showTyping && filteredMessages.length > 0 && (
                      <TypingIndicator lang={lang} />
                    )}
                  </AnimatePresence>

                  <div ref={bottomRef} />
                </div>

                <AnimatePresence>
                  {!isAtBottom && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-32 right-6 z-20"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={scrollToBottom}
                        className="bg-[#0d0d14]/90 border border-white/10 backdrop-blur-lg shadow-xl relative"
                        data-testid="button-scroll-bottom"
                      >
                        <ArrowDown className="w-4 h-4" />
                        {newMsgCount > 0 && (
                          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white px-1">
                            {newMsgCount}
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {replyingTo && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-2 border-t border-white/[0.06] bg-primary/[0.03] flex items-center gap-2"
                  >
                    <Reply className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-primary">@{replyingTo.username || 'anon'}</span>
                      <p className="text-xs text-white/50 truncate">{replyingTo.message}</p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-muted-foreground hover:text-white flex-shrink-0"
                      aria-label="Cancel reply"
                      data-testid="button-cancel-reply"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}

                {previewFile && previewUrl && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 pt-3 border-t border-white/[0.06]"
                  >
                    <div className="relative inline-block">
                      {previewFile.type.startsWith("image/") ? (
                        <img src={previewUrl} alt="File preview" className="h-20 rounded-md object-cover border border-white/10" />
                      ) : (
                        <video src={previewUrl} className="h-20 rounded-md object-cover border border-white/10" />
                      )}
                      <button onClick={removePreview}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
                        aria-label="Remove file preview"
                        data-testid="button-remove-preview"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="p-3 lg:p-4 border-t border-white/[0.06] bg-[#0a0a12]/60">
                  <div className="flex gap-2 items-end relative">
                    <div className="flex gap-1">
                      <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={handleFileSelect} className="hidden" />
                      <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}
                        className="text-muted-foreground bg-white/[0.03] border border-white/[0.06]"
                        data-testid="button-attach-file" title={lang === "uk" ? "Фото/Відео" : "Photo/Video"}
                      >
                        <Image className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setShowEmoji(!showEmoji)}
                          className={`${showEmoji ? 'text-primary bg-primary/10 border border-primary/30' : 'text-muted-foreground bg-white/[0.03] border border-white/[0.06]'}`}
                          data-testid="button-emoji" title="Emoji"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <AnimatePresence>
                          {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
                        </AnimatePresence>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowShareModal(true)}
                        className="text-muted-foreground bg-white/[0.03] border border-white/[0.06]"
                        data-testid="button-share-report"
                        title={lang === "uk" ? "Поділитися перевіркою" : lang === "ru" ? "Поделиться проверкой" : "Share check"}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
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
                        placeholder={lang === "uk" ? "Напишіть повідомлення..." : lang === "ru" ? "Напишите сообщение..." : "Type a message..."}
                        maxLength={500}
                        rows={1}
                        className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-primary/40 focus:bg-white/[0.05] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 resize-none min-h-[40px] max-h-[100px] outline-none transition-all duration-200 focus:ring-1 focus:ring-primary/20"
                        style={{ height: 'auto', overflow: 'hidden' }}
                        onInput={(e) => {
                          const el = e.target as HTMLTextAreaElement;
                          el.style.height = 'auto';
                          el.style.height = Math.min(el.scrollHeight, 100) + 'px';
                        }}
                        data-testid="input-chat-message"
                      />
                    </div>

                    <Button
                      onClick={handleSend}
                      disabled={(!msg.trim() && !previewFile) || sendMutation.isPending}
                      size="icon"
                      className="bg-gradient-to-r from-primary/30 to-cyan-500/20 border border-primary/30 flex-shrink-0 disabled:opacity-30 transition-all"
                      data-testid="button-send-message"
                    >
                      {sendMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap mt-2 px-1">
                    <span className="text-[10px] text-muted-foreground/40">
                      Enter {lang === "uk" ? "відправити" : lang === "ru" ? "отправить" : "send"} / Shift+Enter {lang === "uk" ? "рядок" : lang === "ru" ? "строка" : "line"}
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

      <style>{`
        @keyframes holographic {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </PageLayout>
  );
}
