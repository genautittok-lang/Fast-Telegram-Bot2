import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { 
  Check, 
  Crown, 
  Shield, 
  Star,
  ArrowLeft,
  Copy,
  Send
} from "lucide-react";

const TRC20_ADDRESS = "TRYbty4Ew9knf61brdrixeY5M34mQTt3zY";

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState<"PRO" | "ENTERPRISE" | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [txHash, setTxHash] = useState("");

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(TRC20_ADDRESS);
      setCopiedAddress(true);
      toast({
        title: "Скопійовано!",
        description: "Адресу гаманця скопійовано в буфер обміну",
      });
      setTimeout(() => setCopiedAddress(false), 3000);
    } catch {
      toast({
        title: "Помилка",
        description: "Не вдалося скопіювати адресу",
        variant: "destructive",
      });
    }
  };

  const handlePayment = (tier: "PRO" | "ENTERPRISE") => {
    if (!user) {
      setLocation("/login");
      return;
    }
    setShowPaymentModal(tier);
  };

  const submitPayment = async (tier: "PRO" | "ENTERPRISE") => {
    if (!txHash.trim()) {
      toast({
        title: "Помилка",
        description: "Введіть TX Hash транзакції",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          txHash: txHash.trim(),
          amount: tier === "PRO" ? 10 : 50,
        }),
      });

      if (response.ok) {
        toast({
          title: "Заявку подано!",
          description: "Адміністратор перевірить вашу оплату найближчим часом",
        });
        setShowPaymentModal(null);
        setTxHash("");
      } else {
        throw new Error("Failed to submit");
      }
    } catch {
      toast({
        title: "Заявку подано!",
        description: "Надішліть TX Hash адміністратору в Telegram для підтвердження",
      });
      setShowPaymentModal(null);
      setTxHash("");
    }
  };

  const features = {
    free: [
      "15 перевірок на день",
      "Базовий аналіз ризиків",
      "Telegram бот доступ",
      "Історія перевірок",
    ],
    pro: [
      "100 перевірок на день",
      "Розширений аналіз з AI",
      "PDF звіти з QR-кодом",
      "Пріоритетна підтримка",
      "Реальний моніторинг",
      "API доступ (бета)",
    ],
    enterprise: [
      "Необмежені перевірки",
      "Повний API доступ",
      "Виділена підтримка 24/7",
      "Кастомні звіти",
      "White-label інтеграція",
      "SLA гарантії",
      "Командний доступ",
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Тарифні плани
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Обирай план, що підходить саме тобі
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 px-4 py-2">
              Оплата USDT TRC-20 (TRON)
            </Badge>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-6 w-6 text-muted-foreground" />
                  <CardTitle>FREE</CardTitle>
                </div>
                <CardDescription>Для початківців</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/місяць</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.free.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/login")}
                  data-testid="button-free-plan"
                >
                  Почати безкоштовно
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-bl-lg">
                Популярний
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-6 w-6 text-emerald-500" />
                  <CardTitle className="text-emerald-400">PRO</CardTitle>
                </div>
                <CardDescription>Для професіоналів</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-emerald-400">$10</span>
                  <span className="text-muted-foreground">/місяць</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.pro.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handlePayment("PRO")}
                  data-testid="button-pro-plan"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Оплатити $10 USDT
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-6 w-6 text-amber-500" />
                  <CardTitle className="text-amber-400">ENTERPRISE</CardTitle>
                </div>
                <CardDescription>Для команд та бізнесу</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-amber-400">$50</span>
                  <span className="text-muted-foreground">/місяць</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.enterprise.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-amber-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => handlePayment("ENTERPRISE")}
                  data-testid="button-enterprise-plan"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Оплатити $50 USDT
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm">
            Оплата криптовалютою USDT (TRC-20). Заявка буде відправлена адміністратору для підтвердження.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 opacity-50">
            <span className="text-xs">TRON Network</span>
            <span className="text-xs">TRC-20 USDT</span>
            <span className="text-xs">Миттєва обробка</span>
          </div>
        </motion.div>

        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowPaymentModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
                data-testid="modal-payment"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    showPaymentModal === "PRO" 
                      ? "bg-emerald-500/20" 
                      : "bg-amber-500/20"
                  }`}>
                    {showPaymentModal === "PRO" ? (
                      <Star className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Crown className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" data-testid="text-plan-name">
                      {showPaymentModal} План
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Оплата криптовалютою USDT
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30">
                    <div className="text-xs text-muted-foreground mb-2">Адреса оплати (TRC20 USDT)</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-primary bg-black/50 p-2 rounded-lg break-all select-all">
                        {TRC20_ADDRESS}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={copyAddress}
                        className="shrink-0"
                        data-testid="button-copy-address"
                      >
                        {copiedAddress ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-2">TX Hash (опціонально)</div>
                    <Input
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="Введіть TX Hash транзакції..."
                      className="bg-black/50 border-white/10"
                      data-testid="input-tx-hash"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Button
                      className={`w-full ${showPaymentModal === "PRO" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`}
                      onClick={() => submitPayment(showPaymentModal)}
                      data-testid="button-submit-pro"
                    >
                      {showPaymentModal === "PRO" ? (
                        <Star className="w-4 h-4 mr-2" />
                      ) : (
                        <Crown className="w-4 h-4 mr-2" />
                      )}
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold">Подати заявку на {showPaymentModal}</span>
                        <span className="text-sm opacity-80">${showPaymentModal === "PRO" ? 10 : 50}</span>
                      </div>
                    </Button>
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Заявка буде відправлена адміністратору в Telegram для підтвердження
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
