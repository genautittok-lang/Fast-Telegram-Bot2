import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle, Users, Clock, Image, Video, Smile, X, Hash, Globe } from "lucide-react";
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

function userColor(userId: number) {
  return COLORS[userId % COLORS.length];
}

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "😀": ["😀","😂","🤣","😊","😍","🥰","😎","🤩","😜","🤔","😏","🙄","😴","🥳","😱","🤯","🥺","😤","🔥","❤️","💯","👍","👎","👋","🙌","💪","🤝","✌️","🫡","🤙"],
  "🛡️": ["🛡️","🔒","🔓","🔑","⚠️","🚨","💀","☠️","🐛","🪲","🕵️","👀","🎯","💣","🧨","🔫","🗡️","⛔","🚫","✅","❌","❓","‼️","📛","🆘","🔴","🟢","🟡","🔵","⚡"],
  "💰": ["💰","💵","💎","🪙","💳","📈","📉","🏦","💸","🤑","₿","🔗","⛓️","🌐","🖥️","📱","💻","⌨️","🖱️","📡","📶","🔌","🧲","💾","📀","🗂️","📁","📊","📋","🗃️"],
  "🌍": ["🌍","🌎","🌏","🏴‍☠️","🇺🇦","🇺🇸","🇬🇧","🇩🇪","🇪🇸","🇫🇷","🇯🇵","🇨🇳","🇰🇷","🇮🇳","🇧🇷","🇨🇦","🇦🇺","🇮🇹","🇵🇱","🇳🇱","🇸🇪","🇳🇴","🇫🇮","🇩🇰","🇨🇭","🇦🇹","🇧🇪","🇹🇷","🇮🇱","🇪🇬"],
};

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const [cat, setCat] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full mb-2 left-0 w-72 bg-[#1a1a20] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex gap-1">
          {Object.keys(EMOJI_CATEGORIES).map(k => (
            <button
              key={k}
              onClick={() => setCat(k)}
              className={`px-2 py-1 rounded-md text-sm transition-colors ${cat === k ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
            >
              {k}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-10 gap-0.5 p-2 max-h-36 overflow-y-auto">
        {EMOJI_CATEGORIES[cat].map(e => (
          <button
            key={e}
            onClick={() => onSelect(e)}
            className="w-7 h-7 flex items-center justify-center text-base hover:bg-white/10 rounded transition-colors"
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
          className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity mt-1"
          onClick={() => setExpanded(true)}
          loading="lazy"
        />
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
              onClick={() => setExpanded(false)}
            >
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                src={url}
                alt=""
                className="max-w-full max-h-[90vh] rounded-xl object-contain"
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
        className="max-w-full max-h-48 rounded-lg mt-1"
        preload="metadata"
      />
    );
  }
  return null;
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
    ? (lang === "uk" ? "Приватний чат команди" : lang === "ru" ? "Приватный чат команды" : lang === "es" ? "Chat privado del equipo" : lang === "de" ? "Privater Team-Chat" : "Private team chat")
    : (lang === "uk" ? "Обговорюйте ризики з спільнотою" : lang === "ru" ? "Обсуждайте риски с сообществом" : lang === "es" ? "Discute riesgos con la comunidad" : lang === "de" ? "Diskutieren Sie Risiken mit der Community" : "Discuss risks with the community");

  return (
    <PageLayout>
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        <div className="flex-1 p-3 lg:p-6 overflow-hidden flex flex-col">
          <div className="max-w-5xl mx-auto w-full flex flex-col flex-1 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-3 lg:mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/20">
                  <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-2xl font-display font-bold bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent" data-testid="text-chat-title">
                    {chatTitle}
                  </h1>
                  <p className="text-[11px] lg:text-xs text-muted-foreground">{chatSubtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400" data-testid="text-chat-online">Online</span>
              </div>
            </motion.div>

            {userTeams.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setActiveTeamId(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    !activeTeamId
                      ? "bg-primary/20 border border-primary/40 text-primary"
                      : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
                  }`}
                  data-testid="button-chat-global"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {lang === "uk" ? "Загальний" : lang === "ru" ? "Общий" : lang === "es" ? "General" : lang === "de" ? "Allgemein" : "General"}
                </button>
                {userTeams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setActiveTeamId(team.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeTeamId === team.id
                        ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                        : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:border-white/20"
                    }`}
                    data-testid={`button-chat-team-${team.id}`}
                  >
                    <Hash className="w-3.5 h-3.5" />
                    {team.name}
                  </button>
                ))}
              </div>
            )}

            <Card className="flex-1 flex flex-col overflow-hidden bg-black/40 border-white/10 backdrop-blur-xl">
              <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-1.5" data-testid="chat-messages-list">
                {isLoading && (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
                    {t('common.loading')}
                  </div>
                )}

                {!isLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">{t('chat.empty')}</p>
                    <p className="text-xs mt-1 opacity-50">
                      {lang === "uk" ? "Напишіть перше повідомлення" : lang === "ru" ? "Напишите первое сообщение" : "Write the first message"}
                    </p>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((m) => {
                    const isOwn = m.userId === user?.id;
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] lg:max-w-[65%] rounded-2xl px-3 py-2 ${
                            isOwn
                              ? 'bg-primary/15 border border-primary/25 rounded-br-sm'
                              : 'bg-white/5 border border-white/8 rounded-bl-sm'
                          }`}
                          data-testid={`chat-message-${m.id}`}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[11px] font-mono font-semibold ${isOwn ? 'text-primary' : userColor(m.userId)}`}>
                              @{m.username || 'anon'}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />{timeAgo(m.createdAt)}
                            </span>
                          </div>

                          {m.fileUrl && (m.messageType === "image" || m.messageType === "video") && (
                            <MediaPreview url={m.fileUrl} type={m.messageType} />
                          )}

                          {m.message && !(m.fileUrl && (m.message === "📷 Photo" || m.message === "🎥 Video")) && (
                            <p className="text-sm text-white/90 break-words whitespace-pre-wrap leading-relaxed">{m.message}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {previewFile && previewUrl && (
                <div className="px-3 pt-2 border-t border-white/5">
                  <div className="relative inline-block">
                    {previewFile.type.startsWith("image/") ? (
                      <img src={previewUrl} alt="" className="h-20 rounded-lg object-cover" />
                    ) : (
                      <video src={previewUrl} className="h-20 rounded-lg object-cover" />
                    )}
                    <button
                      onClick={removePreview}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      data-testid="button-remove-preview"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 border-t border-white/10 bg-black/20">
                <div className="flex gap-2 items-end relative">
                  <div className="flex gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/quicktime"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-primary"
                      data-testid="button-attach-file"
                      title={lang === "uk" ? "Фото/Відео" : "Photo/Video"}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                    <div className="relative" ref={emojiRef}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmoji(!showEmoji)}
                        className={`h-9 w-9 p-0 ${showEmoji ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        data-testid="button-emoji"
                        title="Emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                      <AnimatePresence>
                        {showEmoji && (
                          <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

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
                    placeholder={t('chat.placeholder')}
                    maxLength={500}
                    rows={1}
                    className="flex-1 bg-white/5 border border-white/10 focus:border-primary/50 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground resize-none min-h-[36px] max-h-[100px] outline-none transition-colors"
                    style={{ height: 'auto', overflow: 'hidden' }}
                    onInput={(e) => {
                      const el = e.target as HTMLTextAreaElement;
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 100) + 'px';
                    }}
                    data-testid="input-chat-message"
                  />

                  <Button
                    onClick={handleSend}
                    disabled={(!msg.trim() && !previewFile) || sendMutation.isPending}
                    className="bg-primary/20 border border-primary/30 hover:bg-primary/30 h-9 w-9 p-0 flex-shrink-0"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-1 px-1">
                  <span className="text-[10px] text-muted-foreground/50">
                    {lang === "uk" ? "Enter — відправити, Shift+Enter — новий рядок" : lang === "ru" ? "Enter — отправить, Shift+Enter — новая строка" : "Enter to send, Shift+Enter for new line"}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">{msg.length}/500</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
