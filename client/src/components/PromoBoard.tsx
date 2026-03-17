import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Clock, Copy, Check, Crown, Zap, Gift, Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Promo {
  id: number;
  code: string;
  type: string;
  value: number;
  tier?: string;
  description?: string;
  imageUrl?: string;
  expiresAt?: string;
  usesLeft: number;
}

const PROMO_GRADIENTS = [
  "from-violet-600/20 via-purple-600/10 to-fuchsia-600/5",
  "from-blue-600/20 via-cyan-600/10 to-teal-600/5",
  "from-amber-600/20 via-orange-600/10 to-red-600/5",
  "from-emerald-600/20 via-green-600/10 to-lime-600/5",
  "from-rose-600/20 via-pink-600/10 to-fuchsia-600/5",
];

const PROMO_BORDERS = [
  "border-violet-500/30",
  "border-blue-500/30",
  "border-amber-500/30",
  "border-emerald-500/30",
  "border-rose-500/30",
];

const PROMO_ACCENTS = [
  "text-violet-400",
  "text-blue-400",
  "text-amber-400",
  "text-emerald-400",
  "text-rose-400",
];

export default function PromoBoard() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: promos } = useQuery<Promo[]>({
    queryKey: ["/api/promos"],
    refetchInterval: 60000,
  });

  if (!promos?.length) return null;

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: "Промокод скопійовано!", description: code });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatExpiry = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Сьогодні";
    if (days === 1) return "1 день";
    if (days < 7) return `${days} днів`;
    return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Промо-акції
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h3>
          <p className="text-xs text-muted-foreground">Активні промокоди та спецпропозиції</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {promos.map((promo, idx) => {
            const gradientIdx = idx % PROMO_GRADIENTS.length;
            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                layout
              >
                <Card
                  className={`relative overflow-hidden border ${PROMO_BORDERS[gradientIdx]} bg-gradient-to-br ${PROMO_GRADIENTS[gradientIdx]} hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer`}
                  onClick={() => copyCode(promo.code, promo.id)}
                  data-testid={`promo-card-${promo.id}`}
                >
                  {promo.imageUrl && (
                    <div className="h-32 w-full overflow-hidden">
                      <img
                        src={promo.imageUrl}
                        alt={promo.description || promo.code}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {promo.type === "tier" ? (
                          <Crown className={`w-5 h-5 ${PROMO_ACCENTS[gradientIdx]}`} />
                        ) : (
                          <Zap className={`w-5 h-5 ${PROMO_ACCENTS[gradientIdx]}`} />
                        )}
                        <Badge variant="outline" className={`${PROMO_BORDERS[gradientIdx]} ${PROMO_ACCENTS[gradientIdx]} bg-white/5`}>
                          {promo.type === "tier" ? `${promo.tier} Підписка` : `+${promo.value} перевірок`}
                        </Badge>
                      </div>
                      {promo.usesLeft <= 10 && (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">
                          {promo.usesLeft} лишилось
                        </Badge>
                      )}
                    </div>

                    {promo.description && (
                      <p className="text-sm text-foreground/80 line-clamp-2">{promo.description}</p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <div className={`font-mono text-base font-bold tracking-wider ${PROMO_ACCENTS[gradientIdx]}`}>
                          {promo.code}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); copyCode(promo.code, promo.id); }}
                          data-testid={`button-copy-promo-${promo.id}`}
                        >
                          {copiedId === promo.id ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {promo.expiresAt && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatExpiry(promo.expiresAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/10 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ArrowRight className="w-3 h-3" />
                      Копіювати
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
