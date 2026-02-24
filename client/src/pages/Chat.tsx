import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle, Users, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMsg {
  id: number;
  userId: number;
  username: string | null;
  message: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const COLORS = [
  "text-cyan-400", "text-purple-400", "text-emerald-400", "text-orange-400",
  "text-pink-400", "text-yellow-400", "text-blue-400", "text-rose-400",
];

function userColor(userId: number) {
  return COLORS[userId % COLORS.length];
}

export default function Chat() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [msg, setMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMsg[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat/messages", { message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMsg("");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const text = msg.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  return (
    <PageLayout>
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        <div className="flex-1 p-3 lg:p-8 overflow-hidden flex flex-col">
          <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-4 lg:mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/20">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-display font-bold bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent" data-testid="text-chat-title">
                    {t('chat.title')}
                  </h1>
                  <p className="text-xs text-muted-foreground">{t('chat.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400" data-testid="text-chat-online">Online</span>
              </div>
            </motion.div>

            <Card className="flex-1 flex flex-col overflow-hidden bg-black/40 border-white/10 backdrop-blur-xl">
              <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2" data-testid="chat-messages-list">
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
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((m) => {
                    const isOwn = m.userId === user?.id;
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] lg:max-w-[60%] rounded-xl px-3 py-2 ${isOwn ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/10'}`} data-testid={`chat-message-${m.id}`}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-mono font-medium ${isOwn ? 'text-primary' : userColor(m.userId)}`}>
                              @{m.username || 'anon'}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />{timeAgo(m.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-white/90 break-words">{m.message}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t border-white/10 bg-black/20">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={t('chat.placeholder')}
                    maxLength={500}
                    className="flex-1 bg-white/5 border-white/10 focus:border-primary/50"
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!msg.trim() || sendMutation.isPending}
                    className="bg-primary/20 border border-primary/30 hover:bg-primary/30"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{msg.length}/500</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
