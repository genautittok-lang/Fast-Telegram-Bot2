import React from "react";
import { Search, Shield, Zap, Lock, Database, Network, Globe, Activity, CheckCircle2, ChevronRight, Mail, ArrowRight, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-cyan-500/30">
      <Nav />
      <main>
        <Hero />
        <DemoStrip />
        <Features />
        <AIAnalyzer />
        <PricingTeaser />
        <TrustSecurity />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight text-white flex items-center">
            DARKSHARE<span className="w-1.5 h-1.5 bg-cyan-400 rounded-full ml-1 mb-2 inline-block"></span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <a href="#" className="hover:text-white transition-colors">Возможности</a>
          <a href="#" className="hover:text-white transition-colors">Тарифы</a>
          <a href="#" className="hover:text-white transition-colors">API</a>
          <a href="#" className="hover:text-white transition-colors">Блог</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/5 hidden sm:inline-flex">Войти</Button>
          <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">Начать бесплатно</Button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-30 md:opacity-100">
          <img 
            src="/__mockup/images/ds-hero.png" 
            alt="Data visualization background" 
            className="w-full h-full object-cover object-left mask-image-linear-left"
            style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)' }}
          />
        </div>
      </div>
      
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Обновление: Доступен AI-анализатор v2.0
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            OSINT-разведка <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">
              нового поколения
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-xl leading-relaxed">
            Молниеносный поиск по утечкам баз данных, Telegram и dark web. 
            Нейросетевой анализ угроз, построение графов связей и генерация PDF-отчетов для профессионалов безопасности.
          </p>
          
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
            <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 h-12 w-full sm:w-auto">
              Начать бесплатно
            </Button>
            <Button size="lg" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 h-12 px-8 w-full sm:w-auto">
              Смотреть демо <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-500/70" />
              2 000+ исследователей
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-500/70" />
              50M+ записей
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500/70" />
              GDPR-compliant
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoStrip() {
  return (
    <section className="py-12 bg-black border-y border-white/5 relative z-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#121214] border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col md:flex-row gap-2 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent blur-xl -z-10"></div>
            <div className="relative flex-1 flex items-center bg-[#18181b] rounded-lg px-4 border border-white/5">
              <Search className="w-5 h-5 text-zinc-500 mr-3" />
              <Input 
                type="text" 
                placeholder="Введите телефон, email или Telegram-юзернейм..." 
                className="border-0 bg-transparent focus-visible:ring-0 px-0 text-zinc-200 placeholder:text-zinc-600 h-12 text-base shadow-none"
                defaultValue="+380 67 ••• ••**"
                readOnly
              />
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-14 md:px-8">
              Поиск
            </Button>
          </div>
          
          <div className="mt-6 font-mono text-sm">
            <div className="flex items-center text-cyan-400 mb-2 gap-2">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Анализ завершен за 0.8с</span>
            </div>
            <div className="space-y-2 text-zinc-400 bg-[#0c0c0e] p-4 rounded-lg border border-white/5">
              <p><span className="text-zinc-600">&gt;</span> Найдено в 4 утечках</p>
              <p className="flex justify-between items-center">
                <span><span className="text-cyan-500">[*]</span> Collection #1</span>
                <span className="text-zinc-600">email, password_hash</span>
              </p>
              <p className="flex justify-between items-center">
                <span><span className="text-cyan-500">[*]</span> DARKBEAST_2024.csv</span>
                <span className="text-zinc-600">phone, full_name, address</span>
              </p>
              <p className="flex justify-between items-center opacity-50">
                <span className="blur-[2px] select-none">[*] Telegram_Scrape_RU</span>
                <span className="blur-[2px] select-none">user_id, bio</span>
              </p>
              <p className="text-xs text-zinc-500 mt-2">Зарегистрируйтесь, чтобы увидеть полные результаты.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      title: "Утечки по телефону/email",
      description: "Глобальный поиск по сотням тысяч дампов баз данных и публичных утечек.",
      example: "Result: 7 паролей, 3 адреса"
    },
    {
      icon: <Network className="w-5 h-5 text-cyan-400" />,
      title: "Telegram-разведка & соц.графы",
      description: "Деанонимизация ID, история изменений юзернеймов и био, поиск по чатам.",
      example: "ID: 4815162342 → @cyber_ninja"
    },
    {
      icon: <Globe className="w-5 h-5 text-cyan-400" />,
      title: "Dark web мониторинг",
      description: "Отслеживание упоминаний на теневых форумах и торговых площадках.",
      example: "Found in: xss.is, exploit.in"
    },
    {
      icon: <Lock className="w-5 h-5 text-zinc-500" />,
      title: "AI-анализ угроз",
      description: "Автоматическая корреляция данных и выявление паттернов поведения.",
      example: "PRO FEATURE",
      isPro: true
    }
  ];

  return (
    <section className="py-20 md:py-32 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Всё для расследований<br/>в одном интерфейсе</h2>
          <p className="text-zinc-400 max-w-2xl text-lg">Единое окно для сбора цифрового следа. Никаких сложных скриптов и командной строки.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div key={i} className={`bg-[#121214] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors ${feature.isPro ? 'opacity-80' : ''}`}>
              {feature.isPro && (
                <div className="absolute top-4 right-4 text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PRO
                </div>
              )}
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-5 group-hover:bg-cyan-500/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500 mb-6 leading-relaxed">{feature.description}</p>
              
              <div className="mt-auto">
                <div className={`text-xs font-mono px-3 py-2 rounded bg-black border border-white/5 ${feature.isPro ? 'blur-[2px] select-none opacity-50' : 'text-zinc-400'}`}>
                  {feature.example}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIAnalyzer() {
  return (
    <section className="py-16 bg-[#09090b]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-gradient-to-br from-[#121214] to-[#0c0c0e] rounded-2xl border border-white/10 overflow-hidden relative">
          {/* Subtle cyan glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center p-8 md:p-12">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 mb-6 uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Доступно на тарифе PRO</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">AI Threat Analyzer</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Наш алгоритм на базе ИИ автоматически сопоставляет найденные разрозненные данные, 
                выявляет скрытые связи между профилями и составляет сводное досье с оценкой рисков за секунды.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  "Автоматическая склейка профилей из разных утечек",
                  "Оценка достоверности найденных данных",
                  "Суммаризация активности в Telegram",
                  "Экспорт в детализированный PDF-отчет"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 h-12">
                Разблокировать за $5 <span className="opacity-70 ml-1 font-normal">(по промокоду)</span>
              </Button>
            </div>
            
            <div className="relative rounded-lg border border-white/10 bg-[#09090b] shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-[#09090b]/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center opacity-100 transition-opacity">
                <Lock className="w-10 h-10 text-cyan-400 mb-4" />
                <span className="text-white font-medium bg-black/80 px-4 py-2 rounded border border-white/10">Требуется подписка</span>
              </div>
              <img 
                src="/__mockup/images/ds-ai-report.png" 
                alt="AI Threat Report Interface" 
                className="w-full h-auto object-cover opacity-60"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  const tiers = [
    {
      name: "FREE",
      price: "$0",
      description: "Базовые проверки",
      features: ["5 запросов в день", "Базовая информация", "PDF с водяным знаком"],
      action: "Начать бесплатно",
      popular: false
    },
    {
      name: "PRO",
      price: "$10",
      priceUah: "~400 UAH",
      description: "Для профессионалов",
      features: ["Безлимитные запросы", "AI Threat Analyzer", "Полные PDF отчеты", "Приоритетная очередь"],
      action: "Выбрать PRO",
      popular: true
    },
    {
      name: "TEAM",
      price: "$35",
      priceUah: "~1400 UAH",
      description: "Для отделов безопасности",
      features: ["Всё из PRO", "До 5 рабочих мест", "API доступ", "Выделенная поддержка"],
      action: "Связаться с нами",
      popular: false
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Простые тарифы. Без скрытых платежей.</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium text-sm">
            <Zap className="w-4 h-4 fill-cyan-400" />
            Используйте код <strong className="font-mono text-white mx-1 tracking-wider">DARKNEU</strong> — скидка 50% на первые 3 месяца
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier, i) => (
            <div key={i} className={`relative flex flex-col p-6 rounded-2xl border ${tier.popular ? 'bg-[#121214] border-cyan-500/50 shadow-[0_0_30px_-10px_rgba(61,217,255,0.2)]' : 'bg-black border-white/10'}`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider rounded-full">
                  Рекомендуем
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-zinc-400 mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  <span className="text-zinc-500">/мес</span>
                </div>
                {tier.priceUah && <div className="text-xs text-zinc-600 mt-1">{tier.priceUah}</div>}
              </div>
              
              <p className="text-sm text-zinc-400 mb-6">{tier.description}</p>
              
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className={`w-4 h-4 ${tier.popular ? 'text-cyan-400' : 'text-zinc-600'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              
              <Button className={`w-full ${tier.popular ? 'bg-cyan-500 hover:bg-cyan-400 text-black font-semibold' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
                {tier.action}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSecurity() {
  const items = [
    { icon: <Lock className="w-5 h-5" />, title: "End-to-end encrypted" },
    { icon: <Shield className="w-5 h-5" />, title: "Не сохраняем запросы" },
    { icon: <CheckCircle2 className="w-5 h-5" />, title: "GDPR & 152-ФЗ compliant" },
    { icon: <Activity className="w-5 h-5" />, title: "24/7 поддержка" },
  ];

  return (
    <section className="py-12 border-t border-white/5 bg-[#0a0a0c]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-6 opacity-70">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-zinc-400">
              <div className="text-zinc-500">{item.icon}</div>
              <span className="text-sm font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyan-900/10 mix-blend-screen"></div>
      <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Готовы начать?</h2>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
          Присоединяйтесь к тысячам специалистов, использующих DARKSHARE для оперативной разведки и аналитики угроз.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <div className="relative w-full">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input 
              type="email" 
              placeholder="Ваш рабочий email..." 
              className="h-14 pl-10 bg-[#121214] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-cyan-500 w-full"
            />
          </div>
          <Button className="h-14 px-8 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold w-full sm:w-auto shrink-0">
            Создать аккаунт
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2">
            <span className="text-xl font-semibold tracking-tight text-white flex items-center mb-6">
              DARKSHARE<span className="w-1.5 h-1.5 bg-cyan-400 rounded-full ml-1 mb-2 inline-block"></span>
            </span>
            <p className="text-sm text-zinc-500 max-w-xs mb-6 leading-relaxed">
              Продвинутая OSINT-платформа и инструменты threat intelligence для специалистов информационной безопасности.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-zinc-500 hover:text-cyan-400 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-zinc-500 hover:text-cyan-400 transition-colors"><Github className="w-5 h-5" /></a>
              {/* Telegram icon approximation */}
              <a href="#" className="text-zinc-500 hover:text-cyan-400 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 6 3-2.5 13-5-3.5L11 21l-1-5.5L2 12l13-7z"/></svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Продукт</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">Возможности</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Тарифы</a></li>
              <li><a href="#" className="hover:text-white transition-colors">База знаний</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API документация</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Компания</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">О нас</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Блог</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Партнерам</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Юр. инфо</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">Условия сервиса</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Приватность</a></li>
              <li><a href="#" className="hover:text-white transition-colors">DPA</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <p>© 2026 DARKSHARE. OSINT for professionals.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <span>Все системы работают штатно</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
