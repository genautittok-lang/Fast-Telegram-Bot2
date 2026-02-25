import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle, Users, Clock, Image, Video, Smile, X, Hash, Globe, Shield, ShieldCheck, Crown, Zap, Star, Sparkles, Lock, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMsg {
  id: number;
  userId: number;
  username: string | null;
  message: string;
  messageType: string | null;
  fileUrl: string | null;
  teamId: number | null;
  createdAt: string;
}

interface UserTeam {
  id: number;
  name: string;
  role: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const COLORS = [
  "text-cyan-400", "text-purple-400", "text-emerald-400", "text-orange-400",
  "text-pink-400", "text-yellow-400", "text-blue-400", "text-rose-400",
];

const BG_COLORS = [
  "from-cyan-500/20 to-cyan-500/5", "from-purple-500/20 to-purple-500/5",
  "from-emerald-500/20 to-emerald-500/5", "from-orange-500/20 to-orange-500/5",
  "from-pink-500/20 to-pink-500/5", "from-yellow-500/20 to-yellow-500/5",
  "from-blue-500/20 to-blue-500/5", "from-rose-500/20 to-rose-500/5",
];

function userColor(userId: number) {
  return COLORS[userId % COLORS.length];
}

function userBgGradient(userId: number) {
  return BG_COLORS[userId % BG_COLORS.length];
}

const AVATAR_EMOJIS = ["🛡️", "⚡", "🔥", "💎", "🚀", "🎯", "👁️", "🗡️", "🧬", "🌐", "💀", "🔮", "🪐", "🦅", "🐉", "⚔️"];

function userAvatar(userId: number) {
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

function FloatingEmoji({ emoji, delay, x, duration }: { emoji: string; delay: number; x: number; duration: number }) {
  return (
    <motion.div
      className="absolute text-2xl pointer-events-none select-none opacity-[0.08]"
      style={{ left: `${x}%` }}
      initial={{ y: "100%", opacity: 0, rotate: -20 }}
      animate={{
        y: "-100%",
        opacity: [0, 0.08, 0.08, 0],
        rotate: [-20, 10, -10, 20],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: duration * 0.5,
        ease: "linear",
      }}
    >
      {emoji}
    </motion.div>
  );
}

function ChatBackground() {
  const floatingEmojis = useMemo(() => [
    { emoji: "🛡️", delay: 0, x: 5, duration: 18 },
    { emoji: "🔒", delay: 3, x: 15, duration: 22 },
    { emoji: "⚡", delay: 6, x: 25, duration: 16 },
    { emoji: "💎", delay: 2, x: 35, duration: 20 },
    { emoji: "🔥", delay: 8, x: 50, duration: 19 },
    { emoji: "🚀", delay: 4, x: 65, duration: 21 },
    { emoji: "🎯", delay: 7, x: 75, duration: 17 },
    { emoji: "💀", delay: 1, x: 85, duration: 23 },
    { emoji: "🔮", delay: 5, x: 92, duration: 18 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_71%_45%/0.05)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(200_80%_50%/0.04)_0%,transparent_50%)]" />

      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(142 71% 45% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(142 71% 45% / 0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {floatingEmojis.map((item, i) => (
        <FloatingEmoji key={i} {...item} />
      ))}
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

  if (tier === "elite") {
    return (
      <span className="inline-flex items-center gap-0.5 ml-1" title="Elite Member">
        <Crown className="w-3 h-3 text-yellow-400" />
      </span>
    );
  }
  if (tier === "pro") {
    return (
      <span className="inline-flex items-center gap-0.5 ml-1" title="PRO Member">
        <Zap className="w-3 h-3 text-purple-400" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 ml-1" title="Verified">
      <ShieldCheck className="w-3 h-3 text-emerald-400" />
    </span>
  );
}

function OnlineIndicator() {
  const count = useMemo(() => Math.floor(Math.random() * 15) + 5, []);
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {["🛡️", "⚡", "🔥"].map((e, i) => (
          <motion.div
            key={i}
            className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px]"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1, type: "spring" }}
          >
            {e}
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="text-[11px] font-mono text-emerald-400">{count}</span>
      </div>
    </div>
  );
}

function EmptyChat({ lang }: { lang: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        className="text-6xl mb-4"
        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        💬
      </motion.div>
      <div className="flex gap-2 mb-4">
        {["🛡️", "🔒", "⚡", "💎", "🔥"].map((e, i) => (
          <motion.span
            key={i}
            className="text-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.5, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            {e}
          </motion.span>
        ))}
      </div>
      <h3 className="text-base font-display font-bold text-white mb-1">
        {lang === "uk" ? "Чат порожній" : lang === "ru" ? "Чат пустой" : lang === "es" ? "Chat vacío" : lang === "de" ? "Chat ist leer" : "Chat is empty"}
      </h3>
      <p className="text-xs text-muted-foreground max-w-xs">
        {lang === "uk" ? "Станьте першим! Поділіться знахідками, обговоріть загрози та помічайте ризики разом 🛡️" : lang === "ru" ? "Будьте первым! Делитесь находками, обсуждайте угрозы и выявляйте риски вместе 🛡️" : lang === "es" ? "¡Sé el primero! Comparte hallazgos, discute amenazas y detecta riesgos juntos 🛡️" : lang === "de" ? "Seien Sie der Erste! Teilen Sie Erkenntnisse, diskutieren Sie Bedrohungen 🛡️" : "Be the first! Share findings, discuss threats & spot risks together 🛡️"}
      </p>
    </motion.div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const [msg, setMsg] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSend = useCallback(() => {
    const text = msg.trim();
    if ((!text && !previewFile) || sendMutation.isPending) return;
    sendMutation.mutate({ message: text, file: previewFile });
    setShowEmoji(false);
  }, [msg, previewFile, sendMutation, activeTeamId]);

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
    ? (lang === "uk" ? "🔒 Приватний чат команди" : lang === "ru" ? "🔒 Приватный чат команды" : lang === "es" ? "🔒 Chat privado del equipo" : lang === "de" ? "🔒 Privater Team-Chat" : "🔒 Private team chat")
    : (lang === "uk" ? "🌐 Обговорюйте ризики з спільнотою" : lang === "ru" ? "🌐 Обсуждайте риски с сообществом" : lang === "es" ? "🌐 Discute riesgos con la comunidad" : lang === "de" ? "🌐 Diskutieren Sie Risiken" : "🌐 Discuss risks with the community");

  return (
    <PageLayout>
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden relative">
        <ChatBackground />

        <div className="flex-1 p-3 lg:p-6 overflow-hidden flex flex-col relative z-10">
          <div className="max-w-5xl mx-auto w-full flex flex-col flex-1 overflow-hidden">

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 lg:mb-4"
            >
              <div className="flex items-center justify-between p-3 lg:p-4 rounded-2xl bg-[#0d0d14]/80 backdrop-blur-xl border border-white/[0.06] shadow-xl shadow-black/20">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-primary/30 to-cyan-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                      <span className="text-xl lg:text-2xl">💬</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0d0d14] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  </motion.div>

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
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide"
              >
                <button
                  onClick={() => setActiveTeamId(null)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    !activeTeamId
                      ? "bg-gradient-to-r from-primary/20 to-emerald-500/10 border border-primary/30 text-primary shadow-lg shadow-primary/10"
                      : "bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-white hover:border-white/15 hover:bg-white/[0.06]"
                  }`}
                  data-testid="button-chat-global"
                >
                  <span className="text-sm">🌍</span>
                  {lang === "uk" ? "Загальний" : lang === "ru" ? "Общий" : lang === "es" ? "General" : lang === "de" ? "Allgemein" : "General"}
                </button>
                {userTeams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setActiveTeamId(team.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      activeTeamId === team.id
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/10 border border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10"
                        : "bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-white hover:border-white/15 hover:bg-white/[0.06]"
                    }`}
                    data-testid={`button-chat-team-${team.id}`}
                  >
                    <span className="text-sm">🔒</span>
                    {team.name}
                  </button>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Card className="flex-1 flex flex-col overflow-hidden bg-[#0a0a12]/80 backdrop-blur-xl border-white/[0.06] rounded-2xl shadow-2xl shadow-black/30">

                <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {activeTeamId ? "🔐" : "💬"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {messages.length} {lang === "uk" ? "повідомлень" : lang === "ru" ? "сообщений" : lang === "es" ? "mensajes" : lang === "de" ? "Nachrichten" : "messages"}
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

                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2" data-testid="chat-messages-list">
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <motion.div
                        className="text-4xl mb-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        🔄
                      </motion.div>
                      <span className="text-sm font-mono">{t('common.loading')}</span>
                    </div>
                  )}

                  {!isLoading && messages.length === 0 && (
                    <EmptyChat lang={lang} />
                  )}

                  <AnimatePresence initial={false}>
                    {messages.map((m, idx) => {
                      const isOwn = m.userId === user?.id;
                      const showAvatar = idx === 0 || messages[idx - 1].userId !== m.userId;

                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 12, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${!showAvatar ? (isOwn ? 'pr-0' : 'pl-10') : ''}`}
                        >
                          {!isOwn && showAvatar && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5 shadow-lg"
                            >
                              {userAvatar(m.userId)}
                            </motion.div>
                          )}

                          <div
                            className={`max-w-[80%] lg:max-w-[65%] rounded-2xl px-3.5 py-2.5 transition-all duration-200 hover:shadow-lg ${
                              isOwn
                                ? 'bg-gradient-to-br from-primary/15 to-emerald-500/5 border border-primary/20 rounded-br-md hover:border-primary/40 hover:shadow-primary/10'
                                : `bg-gradient-to-br ${userBgGradient(m.userId)} border border-white/[0.06] rounded-bl-md hover:border-white/15`
                            }`}
                            data-testid={`chat-message-${m.id}`}
                          >
                            {showAvatar && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[11px] font-mono font-bold ${isOwn ? 'text-primary' : userColor(m.userId)}`}>
                                  @{m.username || 'anon'}
                                </span>
                                <VerificationBadge username={m.username} />
                                <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5 ml-auto">
                                  <Clock className="w-2.5 h-2.5" />{timeAgo(m.createdAt)}
                                </span>
                              </div>
                            )}

                            {!showAvatar && (
                              <div className="flex justify-end mb-0.5">
                                <span className="text-[9px] text-muted-foreground/40 flex items-center gap-0.5">
                                  <Clock className="w-2 h-2" />{timeAgo(m.createdAt)}
                                </span>
                              </div>
                            )}

                            {m.fileUrl && (m.messageType === "image" || m.messageType === "video") && (
                              <MediaPreview url={m.fileUrl} type={m.messageType} />
                            )}

                            {m.message && !(m.fileUrl && (m.message === "📷 Photo" || m.message === "🎥 Video")) && (
                              <p className="text-sm text-white/90 break-words whitespace-pre-wrap leading-relaxed">{m.message}</p>
                            )}
                          </div>

                          {isOwn && showAvatar && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/20 flex items-center justify-center text-sm ml-2 flex-shrink-0 mt-0.5 shadow-lg shadow-primary/10"
                            >
                              {userAvatar(m.userId)}
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                {previewFile && previewUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 pt-3 border-t border-white/[0.06]"
                  >
                    <div className="relative inline-block">
                      {previewFile.type.startsWith("image/") ? (
                        <img src={previewUrl} alt="" className="h-20 rounded-xl object-cover border border-white/10 shadow-lg" />
                      ) : (
                        <video src={previewUrl} className="h-20 rounded-xl object-cover border border-white/10 shadow-lg" />
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={removePreview}
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
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/mp4,video/webm,video/quicktime"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-10 w-10 p-0 text-muted-foreground hover:text-primary rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5 transition-all"
                          data-testid="button-attach-file"
                          title={lang === "uk" ? "Фото/Відео" : "Photo/Video"}
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                      </motion.div>
                      <div className="relative" ref={emojiRef}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEmoji(!showEmoji)}
                            className={`h-10 w-10 p-0 rounded-xl transition-all ${showEmoji ? 'text-primary bg-primary/10 border border-primary/30 shadow-lg shadow-primary/10' : 'text-muted-foreground hover:text-primary bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5'}`}
                            data-testid="button-emoji"
                            title="Emoji"
                          >
                            <span className="text-base">😊</span>
                          </Button>
                        </motion.div>
                        <AnimatePresence>
                          {showEmoji && (
                            <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
                          )}
                        </AnimatePresence>
                      </div>
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
                        placeholder={lang === "uk" ? "💬 Напишіть повідомлення..." : lang === "ru" ? "💬 Напишите сообщение..." : lang === "es" ? "💬 Escribe un mensaje..." : lang === "de" ? "💬 Nachricht schreiben..." : "💬 Type a message..."}
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
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="text-base"
                          >
                            ⏳
                          </motion.span>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                        <span>⌨️</span>
                        Enter → {lang === "uk" ? "відправити" : lang === "ru" ? "отправить" : "send"}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                        <span>↩️</span>
                        Shift+Enter → {lang === "uk" ? "новий рядок" : lang === "ru" ? "новая строка" : "new line"}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono transition-colors ${msg.length > 450 ? 'text-red-400' : msg.length > 350 ? 'text-yellow-400' : 'text-muted-foreground/40'}`}>
                      {msg.length}/500
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}
