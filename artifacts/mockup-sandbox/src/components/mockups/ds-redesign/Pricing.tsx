import React, { useState, useEffect } from "react";
import { 
  Check, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  Database, 
  Search, 
  Terminal, 
  Lock, 
  Unlock, 
  Bitcoin, 
  CreditCard, 
  Smartphone, 
  ArrowRight,
  Globe,
  FileText,
  MessageCircle,
  HelpCircle,
  Github,
  Twitter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// --- SHARED COMPONENTS ---
const Nav = () => (
  <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-cyan-400" />
        </div>
        <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
          DARKSHARE <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
        </span>
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
        <a href="#" className="hover:text-white transition-colors">Возможности</a>
        <a href="#" className="text-white transition-colors">Тарифы</a>
        <a href="#" className="hover:text-white transition-colors">API</a>
        <a href="#" className="hover:text-white transition-colors">Блог</a>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/5">
          Войти
        </Button>
        <Button className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          Начать бесплатно
        </Button>
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="border-t border-white/5 bg-zinc-950 pt-16 pb-8">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h4 className="text-white font-medium mb-4">Продукт</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Поиск по базам</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Telegram-разведка</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">AI-анализатор угроз</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">API документация</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Компания</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-cyan-400 transition-colors">О нас</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Блог</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Карьера</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Контакты</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Ресурсы</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Руководства OSINT</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Справочник по API</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Служба поддержки</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Статус системы</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Юр. инфо</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Политика конфиденциальности</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Условия использования</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Cookies</a></li>
          </ul>
        </div>
      </div>
      
      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-zinc-500 text-sm">© 2026 DARKSHARE. OSINT for professionals.</p>
        <div className="flex items-center gap-4 text-zinc-500">
          <a href="#" className="hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
          <a href="#" className="hover:text-white transition-colors"><Github className="w-4 h-4" /></a>
          <a href="#" className="hover:text-white transition-colors"><MessageCircle className="w-4 h-4" /></a>
        </div>
      </div>
    </div>
  </footer>
);

// --- PRICING COMPONENTS ---

const PromoBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ d: 4, h: 12, m: 33, s: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { d, h, m, s } = prev;
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
            else {
              h = 23;
              if (d > 0) d--;
            }
          }
        }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-cyan-900/40 via-cyan-600/20 to-cyan-900/40 border-b border-cyan-500/20 text-center py-2.5 px-4 sticky top-0 z-[60]">
      <p className="text-sm font-medium text-cyan-100 flex items-center justify-center gap-2 flex-wrap">
        <span className="animate-pulse">🔥</span> 
        <span>Промокод <strong className="text-cyan-400 font-mono px-1.5 py-0.5 bg-cyan-500/10 rounded">DARKNEU</strong> — скидка 50% на первые 3 месяца. До конца месяца.</span>
        <span className="text-cyan-400/80 font-mono bg-black/20 px-2 py-0.5 rounded text-xs ml-2">
          Осталось: {String(timeLeft.d).padStart(2, '0')}д {String(timeLeft.h).padStart(2, '0')}ч {String(timeLeft.m).padStart(2, '0')}м
        </span>
      </p>
    </div>
  );
};

export function Pricing() {
  const [isUAH, setIsUAH] = useState(false);

  const plans = [
    {
      name: "FREE",
      desc: "Для базовых проверок.",
      priceUSD: 0,
      priceUAH: 0,
      promoUSD: 0,
      promoUAH: 0,
      features: [
        "5 поисковых запросов в день",
        "Базовый поиск по утечкам",
        "Отчёты с водяными знаками",
        "Стандартная очередь",
        "Общедоступные источники"
      ],
      missing: [
        "AI-анализ угроз",
        "Dark web мониторинг"
      ],
      cta: "Начать бесплатно",
      variant: "outline"
    },
    {
      name: "PRO",
      desc: "Для профессионалов.",
      recommended: true,
      priceUSD: 20,
      priceUAH: 800,
      promoUSD: 10,
      promoUAH: 400,
      features: [
        "Безлимитные поисковые запросы",
        "Глубокий поиск (Dark web + TG)",
        "Полные PDF-отчёты без знаков",
        "AI-анализатор связей",
        "Приоритетная очередь",
        "Сохранение истории поисков",
        "Уведомления о новых утечках"
      ],
      cta: "Оформить PRO",
      variant: "primary"
    },
    {
      name: "TEAM",
      desc: "Для отделов безопасности.",
      priceUSD: 70,
      priceUAH: 2800,
      promoUSD: 35,
      promoUAH: 1400,
      features: [
        "Всё из тарифа PRO",
        "До 5 рабочих мест (seats)",
        "Доступ к REST API",
        "Совместные проекты",
        "Экспорт в CSV/JSON",
        "Выделенный менеджер",
        "SLA 99.9%"
      ],
      cta: "Связаться с нами",
      variant: "outline"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-300 selection:bg-cyan-500/30 selection:text-cyan-100">
      <PromoBanner />
      <Nav />

      <main className="pb-24">
        {/* Header */}
        <section className="pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-6 border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/10">
              Тарифные планы
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
              Простые тарифы. <br/><span className="text-zinc-500">Без скрытых платежей.</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
              Инструменты премиум-класса для разведки по открытым источникам. Выберите план, который подходит для ваших задач.
            </p>
            
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!isUAH ? 'text-white' : 'text-zinc-500'}`}>USD ($)</span>
              <Switch 
                checked={isUAH} 
                onCheckedChange={setIsUAH}
                className="data-[state=checked]:bg-cyan-500"
              />
              <span className={`text-sm font-medium ${isUAH ? 'text-white' : 'text-zinc-500'}`}>UAH (₴)</span>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-4 mb-24 relative">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8 items-start relative z-10">
              {plans.map((plan, i) => (
                <div 
                  key={plan.name}
                  className={`relative rounded-2xl bg-zinc-900/50 backdrop-blur-sm border ${plan.recommended ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] scale-105 z-10' : 'border-white/5'} p-8 flex flex-col`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-zinc-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Рекомендуем
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-sm text-zinc-400">{plan.desc}</p>
                  </div>
                  
                  <div className="mb-8">
                    {plan.priceUSD > 0 ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">
                          {isUAH ? '₴' + plan.promoUAH : '$' + plan.promoUSD}
                        </span>
                        <span className="text-zinc-500 text-sm">/мес</span>
                        <span className="text-zinc-500 text-sm line-through ml-2">
                          {isUAH ? '₴' + plan.priceUAH : '$' + plan.priceUSD}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">Бесплатно</span>
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-cyan-400 shrink-0" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                    {plan.missing && plan.missing.map((feature, j) => (
                      <li key={`m-${j}`} className="flex items-start gap-3 text-sm opacity-50">
                        <X className="w-5 h-5 text-zinc-600 shrink-0" />
                        <span className="text-zinc-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.recommended ? 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="px-4 mb-24">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-white mb-10 text-center">Сравнение тарифов</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 px-4 font-medium text-zinc-400 w-1/3">Функция</th>
                    <th className="py-4 px-4 font-medium text-white w-2/9 text-center">FREE</th>
                    <th className="py-4 px-4 font-bold text-cyan-400 w-2/9 text-center">PRO</th>
                    <th className="py-4 px-4 font-medium text-white w-2/9 text-center">TEAM</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {[
                    { name: "Поиск по утечкам", free: "Базовый", pro: "Полный", team: "Полный" },
                    { name: "Лимиты запросов", free: "5 / день", pro: "Безлимит", team: "Безлимит" },
                    { name: "Telegram-разведка", free: false, pro: true, team: true },
                    { name: "Dark web мониторинг", free: false, pro: true, team: true },
                    { name: "AI-анализ угроз", free: false, pro: true, team: true },
                    { name: "PDF-отчёты", free: "С вотермаркой", pro: "Без вотермарки", team: "Без вотермарки" },
                    { name: "Кол-во мест", free: "1", pro: "1", team: "До 5" },
                    { name: "API-доступ", free: false, pro: false, team: true },
                    { name: "Приоритетная поддержка", free: false, pro: false, team: true },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 text-zinc-300">{row.name}</td>
                      <td className="py-4 px-4 text-center">
                        {typeof row.free === 'boolean' ? (row.free ? <Check className="w-4 h-4 mx-auto text-zinc-400" /> : <X className="w-4 h-4 mx-auto text-zinc-700" />) : <span className="text-zinc-500">{row.free}</span>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof row.pro === 'boolean' ? (row.pro ? <Check className="w-4 h-4 mx-auto text-cyan-400" /> : <X className="w-4 h-4 mx-auto text-zinc-700" />) : <span className="text-cyan-100">{row.pro}</span>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof row.team === 'boolean' ? (row.team ? <Check className="w-4 h-4 mx-auto text-zinc-300" /> : <X className="w-4 h-4 mx-auto text-zinc-700" />) : <span className="text-zinc-300">{row.team}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* PRO Unlocks */}
        <section className="px-4 mb-24">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-white mb-10 text-center">Что открывает PRO?</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Скрытые контакты", icon: <Lock className="w-5 h-5 text-cyan-400" />, desc: "Доступ к полным номерам телефонов и email-адресам из утечек." },
                { title: "Связи (Графы)", icon: <Globe className="w-5 h-5 text-cyan-400" />, desc: "Визуализация связей между аккаунтами, IP и доменами." },
                { title: "Источники Dark Web", icon: <Database className="w-5 h-5 text-cyan-400" />, desc: "Поиск по форумам и маркетплейсам теневого интернета." }
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden group">
                  <div className="h-32 bg-zinc-950 relative flex items-center justify-center border-b border-white/5 overflow-hidden">
                    {/* Blurred mock content */}
                    <div className="absolute inset-0 opacity-20 filter blur-[2px] transition-all group-hover:blur-0 group-hover:opacity-40 flex flex-col gap-2 p-4">
                      <div className="h-2 w-3/4 bg-cyan-500/50 rounded"></div>
                      <div className="h-2 w-1/2 bg-zinc-500/50 rounded"></div>
                      <div className="h-2 w-full bg-zinc-500/50 rounded"></div>
                      <div className="h-2 w-5/6 bg-zinc-500/50 rounded"></div>
                    </div>
                    <div className="z-10 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 group-hover:scale-110 transition-transform">
                      {item.icon}
                      <span className="text-sm font-medium text-white">Разблокировано</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guarantee & Payment */}
        <section className="px-4 mb-24">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck className="w-48 h-48 text-cyan-400" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-4">30-дневная гарантия возврата. Без вопросов.</h3>
                <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                  Если DARKSHARE не оправдает ваших ожиданий, мы вернём 100% средств. Мы уверены в качестве наших данных.
                </p>
                <div className="flex flex-wrap justify-center items-center gap-6 opacity-70">
                  <div className="flex items-center gap-2 text-sm font-medium"><Bitcoin className="w-5 h-5" /> Crypto</div>
                  <div className="flex items-center gap-2 text-sm font-medium"><CreditCard className="w-5 h-5" /> Visa / Mastercard</div>
                  <div className="flex items-center gap-2 text-sm font-medium"><Smartphone className="w-5 h-5" /> Apple Pay</div>
                  <span className="text-xs text-zinc-500 ml-4 border-l border-white/10 pl-4">Безопасно через Stripe & Crypto Pay</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-white mb-10 text-center">Частые вопросы</h2>
            
            <Accordion type="single" collapsible className="w-full text-left space-y-4">
              {[
                { q: "Как работает промокод DARKNEU?", a: "Промокод дает 50% скидку на первые 3 месяца использования любого платного тарифа. Скидка применяется автоматически при вводе кода на странице оплаты." },
                { q: "Что входит в тариф FREE?", a: "Бесплатный тариф позволяет делать 5 базовых поисковых запросов в день по открытым источникам. Отчёты генерируются с водяными знаками. Вы не получаете доступ к AI-анализу и мониторингу Dark web." },
                { q: "Можно ли отменить подписку в любой момент?", a: "Да, вы можете отменить подписку в один клик в настройках аккаунта. После отмены вы сохраните доступ к функциям PRO до конца оплаченного периода." },
                { q: "Почему ваши тарифы дешевле конкурентов?", a: "Мы оптимизировали сбор данных и используем собственные AI-модели вместо сторонних API. Это позволяет нам держать цены доступными для независимых исследователей." },
                { q: "Работаете ли вы с юридическими лицами?", a: "Да, для тарифа TEAM мы предоставляем полный пакет закрывающих документов и возможность оплаты по счету (безналичный расчет)." },
                { q: "Безопасно ли искать информацию через вас?", a: "Абсолютно. Мы не сохраняем логи ваших поисковых запросов на бесплатных тарифах. Для PRO-пользователей история шифруется и доступна только владельцу аккаунта." }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-white/5 bg-zinc-900/20 rounded-lg px-6 data-[state=open]:border-cyan-500/30 transition-colors">
                  <AccordionTrigger className="text-base font-medium text-white hover:text-cyan-400 hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
