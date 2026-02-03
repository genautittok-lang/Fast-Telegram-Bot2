import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { 
  Check, 
  Zap, 
  Crown, 
  Shield, 
  Rocket, 
  Star,
  CreditCard,
  Smartphone,
  ArrowLeft,
  Loader2
} from "lucide-react";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
  metadata?: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata?: Record<string, string>;
  prices: Price[];
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);

  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/stripe/products"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, tier }: { priceId: string; tier: string }) => {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          tier,
          userTgId: user?.tgId,
          userEmail: user?.username ? `${user.username}@telegram.user` : undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Payment failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        toast({
          title: "Помилка",
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити сесію оплати",
        variant: "destructive",
      });
    },
  });

  const products = productsData?.products || [];
  const proPlan = products.find(p => p.name?.includes("PRO") && !p.name?.includes("ENTERPRISE"));
  const enterprisePlan = products.find(p => p.name?.includes("ENTERPRISE"));

  const getPrice = (product: Product | undefined, yearly: boolean) => {
    if (!product?.prices?.length) return null;
    const interval = yearly ? "year" : "month";
    return product.prices.find(p => p.recurring?.interval === interval);
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const handleSubscribe = (priceId: string, tier: string) => {
    if (!user) {
      setLocation("/login");
      return;
    }
    checkoutMutation.mutate({ priceId, tier });
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
            Обирай план, що підходить саме тобі. Оплата через Google Pay, Apple Pay або картку.
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Картка</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Google Pay</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Apple Pay</span>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm ${!isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Щомісяця
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            data-testid="switch-billing-period"
          />
          <span className={`text-sm ${isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Щорічно
            <Badge variant="secondary" className="ml-2 bg-emerald-500/20 text-emerald-400">
              -17%
            </Badge>
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
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
                    {proPlan ? (
                      <>
                        <span className="text-4xl font-bold">
                          {formatPrice(getPrice(proPlan, isYearly)?.unit_amount || 999, "usd")}
                        </span>
                        <span className="text-muted-foreground">
                          /{isYearly ? "рік" : "місяць"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">$9.99</span>
                        <span className="text-muted-foreground">/місяць</span>
                      </>
                    )}
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
                    onClick={() => {
                      const price = getPrice(proPlan, isYearly);
                      if (price) {
                        handleSubscribe(price.id, "PRO");
                      }
                    }}
                    disabled={checkoutMutation.isPending || !proPlan}
                    data-testid="button-pro-plan"
                  >
                    {checkoutMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Підписатись на PRO
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
                    {enterprisePlan ? (
                      <>
                        <span className="text-4xl font-bold">
                          {formatPrice(getPrice(enterprisePlan, isYearly)?.unit_amount || 2999, "usd")}
                        </span>
                        <span className="text-muted-foreground">
                          /{isYearly ? "рік" : "місяць"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">$29.99</span>
                        <span className="text-muted-foreground">/місяць</span>
                      </>
                    )}
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
                    onClick={() => {
                      const price = getPrice(enterprisePlan, isYearly);
                      if (price) {
                        handleSubscribe(price.id, "ENTERPRISE");
                      }
                    }}
                    disabled={checkoutMutation.isPending || !enterprisePlan}
                    data-testid="button-enterprise-plan"
                  >
                    {checkoutMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Rocket className="mr-2 h-4 w-4" />
                    )}
                    Отримати ENTERPRISE
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm">
            Безпечна оплата через Stripe. Скасування в будь-який час.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 opacity-50">
            <span className="text-xs">256-bit SSL</span>
            <span className="text-xs">PCI DSS Compliant</span>
            <span className="text-xs">GDPR Ready</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h3 className="text-xl font-semibold mb-4">Криптовалюта?</h3>
          <p className="text-muted-foreground mb-4">
            Якщо хочеш оплатити криптою (BTC, ETH, USDT) - напиши нам у Telegram боті
          </p>
          <Button variant="outline" asChild>
            <a href="https://t.me/DARKSHAREN1_BOT" target="_blank" rel="noopener noreferrer">
              Написати в бот
            </a>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
