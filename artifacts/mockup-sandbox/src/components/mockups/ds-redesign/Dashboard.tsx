import React, { useState } from "react";
import { 
  Search, ShieldAlert, BrainCircuit, History, FileText, Webhook, 
  CreditCard, Settings, LogOut, Bell, ChevronRight, Zap,
  Lock, CheckCircle2, AlertTriangle, Info, Clock, ArrowRight,
  Phone, Mail, Send, Globe, Wallet, ChevronDown, Activity, Shield, User
} from "lucide-react";

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("+380 67 123 4567");

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-300 font-sans selection:bg-[#3DD9FF]/30 flex">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 border-r border-white/5 flex flex-col bg-[#0a0a0b] shrink-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2 text-white font-bold tracking-wide">
            <Shield className="w-5 h-5 text-[#3DD9FF]" />
            DARKSHARE
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Платформа</div>
          
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#3DD9FF]/10 text-[#3DD9FF] font-medium transition-colors">
            <Search className="w-4 h-4" />
            Поиск
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
            <ShieldAlert className="w-4 h-4" />
            Угрозы
          </a>
          <a href="#" className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors group">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-4 h-4" />
              AI-анализатор
            </div>
            <Lock className="w-3 h-3 text-slate-500 group-hover:text-slate-400" />
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
            <History className="w-4 h-4" />
            История
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
            <FileText className="w-4 h-4" />
            Отчёты
          </a>

          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Интеграция</div>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
            <Webhook className="w-4 h-4" />
            API
          </a>

          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Аккаунт</div>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
            <CreditCard className="w-4 h-4" />
            Биллинг
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
            <Settings className="w-4 h-4" />
            Настройки
          </a>
        </nav>

        <div className="p-4 border-t border-white/5 bg-[#0d0d0f]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-white/10">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">Alex K.</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                FREE plan
              </div>
            </div>
          </div>
          <button className="w-full text-left text-xs text-[#3DD9FF] font-medium hover:text-white transition-colors flex items-center gap-1">
            Обновить до PRO <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        <div className="absolute inset-0 bg-[url('/__mockup/images/map-bg.png')] bg-cover bg-center opacity-5 mix-blend-screen pointer-events-none" />
        
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 sticky top-0 bg-[#0a0a0b]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Платформа</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-200 font-medium">Поиск</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-slate-300">3 / 5 поисков</span>
                <span className="text-[10px] text-slate-500">сегодня</span>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center relative">
                <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                  <circle cx="16" cy="16" r="14" fill="none" stroke="#3DD9FF" strokeWidth="2" strokeDasharray="87.9" strokeDashoffset="35.1" className="transition-all duration-500" />
                </svg>
                <span className="text-xs font-medium text-white">3</span>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#3DD9FF] rounded-full ring-2 ring-[#0a0a0b]" />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full flex-1 space-y-8 relative z-0">
          
          {/* Hero search */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3DD9FF]/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative flex items-center bg-[#0d0d0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 focus-within:border-[#3DD9FF]/50 transition-colors">
                <div className="pl-5 pr-3 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введите телефон, email, Telegram-юзернейм, ИИН/ИНН..."
                  className="flex-1 bg-transparent py-4 text-lg text-white placeholder:text-slate-600 focus:outline-none font-mono"
                />
                <div className="pr-2">
                  <button className="bg-[#3DD9FF] hover:bg-[#3DD9FF]/90 text-[#0a0a0b] px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                    Найти
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#3DD9FF]/30 bg-[#3DD9FF]/10 text-[#3DD9FF] text-xs font-medium">
                  <Phone className="w-3.5 h-3.5" /> Телефон
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors">
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors">
                  <Send className="w-3.5 h-3.5" /> Telegram
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Domain
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors">
                  <Wallet className="w-3.5 h-3.5" /> Wallet
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Недавние:</span>
                <span className="px-2 py-1 rounded bg-white/5 text-slate-400 font-mono">darkshare.net</span>
                <span className="px-2 py-1 rounded bg-white/5 text-slate-400 font-mono">@anon_sec</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Search Results */}
            <div className="xl:col-span-2 space-y-4">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#3DD9FF]" />
                Результаты поиска
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/10 text-slate-400 ml-2">Найдено: 4</span>
              </h2>

              <div className="space-y-3">
                {[
                  { title: "Collection #1 — 2019", preview: "e****@gmail.com · pass: *********", source: "Dark Web", date: "Jan 2019", type: "Credentials" },
                  { title: "DARKBEAST_2024.csv", preview: "name: A*** K***** · phone: +38067***", source: "Telegram", date: "Mar 2024", type: "PII" },
                  { title: "Telegram leak — okt 2025", preview: "id: 849302*** · username: @a*****", source: "Forum", date: "Oct 2025", type: "Profile" },
                  { title: "VKontakte DB Breach", preview: "url: vk.com/id**** · phone: +38067***", source: "Dark Web", date: "Aug 2022", type: "Social" },
                ].map((hit, i) => (
                  <div key={i} className="group p-4 bg-[#0d0d0f] border border-white/5 rounded-xl hover:border-white/10 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-200 truncate">{hit.title}</h3>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">{hit.type}</span>
                      </div>
                      <div className="font-mono text-sm text-slate-400 truncate">
                        {hit.preview}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><DatabaseIcon className="w-3 h-3" /> {hit.source}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {hit.date}</span>
                      </div>
                    </div>
                    <button className="shrink-0 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors flex items-center gap-1.5">
                      Полные данные <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Threat Analysis Panel */}
            <div className="xl:col-span-1 space-y-4">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#3DD9FF]" />
                AI Анализ
              </h2>
              
              <div className="relative rounded-xl border border-white/10 overflow-hidden bg-[#0d0d0f] group">
                <div className="absolute inset-0 bg-[url('/__mockup/images/threat-ai-bg.png')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity blur-[2px]" />
                
                {/* Mock content behind glass */}
                <div className="absolute inset-0 p-5 space-y-3 opacity-30 select-none">
                  <div className="h-4 w-1/3 bg-[#3DD9FF]/50 rounded" />
                  <div className="h-3 w-3/4 bg-white/20 rounded" />
                  <div className="h-3 w-2/3 bg-white/20 rounded" />
                  <div className="space-y-2 mt-6">
                    <div className="h-8 w-full bg-white/10 rounded flex items-center px-2 gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500/50" />
                      <div className="h-2 w-24 bg-white/20 rounded" />
                    </div>
                    <div className="h-8 w-full bg-white/10 rounded" />
                  </div>
                </div>

                {/* Glass Overlay & Lock */}
                <div className="relative z-10 inset-0 backdrop-blur-md bg-[#0a0a0b]/80 p-6 flex flex-col items-center justify-center text-center min-h-[320px]">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <Lock className="w-5 h-5 text-slate-300" />
                  </div>
                  <h3 className="text-white font-medium mb-2">Разблокировать AI-анализ</h3>
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    AI определит уровень угрозы, связанные аккаунты, утечки в одном отчёте
                  </p>
                  <button className="w-full py-2.5 rounded-lg bg-white text-black font-medium hover:bg-slate-200 transition-colors mb-3">
                    Получить PRO доступ
                  </button>
                  <p className="text-xs text-slate-500">
                    PRO · от $5 со промокодом <span className="font-mono text-[#3DD9FF]">DARKNEU</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
            <div className="p-5 rounded-xl border border-white/5 bg-[#0d0d0f]/50 hover:bg-[#0d0d0f] transition-colors">
              <div className="flex items-center gap-2 mb-3 text-slate-300">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="font-medium text-sm">Последние угрозы</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">
                Обнаружено 2 новых упоминания ваших запросов в Dark Web за последние 24 часа.
              </p>
              <a href="#" className="text-xs text-[#3DD9FF] hover:underline">Смотреть отчёт →</a>
            </div>

            <div className="p-5 rounded-xl border border-white/5 bg-[#0d0d0f]/50 hover:bg-[#0d0d0f] transition-colors">
              <div className="flex items-center gap-2 mb-3 text-slate-300">
                <DatabaseIcon className="w-4 h-4 text-[#3DD9FF]" />
                <h3 className="font-medium text-sm">Новое в базе</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">
                Добавлено 14.5M записей из утечки Telegram (СНГ регион, октябрь 2025).
              </p>
              <a href="#" className="text-xs text-[#3DD9FF] hover:underline">Искать по новой базе →</a>
            </div>

            <div className="p-5 rounded-xl border border-white/5 bg-[#0d0d0f]/50 hover:bg-[#0d0d0f] transition-colors">
              <div className="flex items-center gap-2 mb-3 text-slate-300">
                <Info className="w-4 h-4 text-slate-400" />
                <h3 className="font-medium text-sm">Советы по OPSEC</h3>
              </div>
              <ul className="text-sm text-slate-500 space-y-2 mb-3 list-disc list-inside pl-4 marker:text-slate-700">
                <li>Используйте burner-телефоны</li>
                <li>Включите 2FA через YubiKey</li>
                <li>Регулярно проверяйте сессии</li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      {/* RIGHT RAIL (Optional / Collapsible feel) */}
      <aside className="hidden lg:flex w-[280px] border-l border-white/5 bg-[#0a0a0b] flex-col shrink-0 p-5 space-y-6">
        
        {/* Plan Card */}
        <div className="p-4 rounded-xl border border-[#3DD9FF]/20 bg-[#3DD9FF]/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
            <Zap className="w-16 h-16 text-[#3DD9FF]" />
          </div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="font-bold text-white tracking-wide">FREE</h3>
            <span className="text-[10px] font-semibold px-2 py-1 rounded bg-[#3DD9FF] text-[#0a0a0b] uppercase">Upgrade</span>
          </div>
          <div className="space-y-1 mb-4 relative z-10">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Лимит поисков</span>
              <span className="text-slate-200">3 / 5</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#3DD9FF] w-[60%] rounded-full" />
            </div>
          </div>
          <ul className="space-y-2 text-xs text-slate-400 relative z-10 mb-4">
            <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#3DD9FF] shrink-0 mt-0.5" /> Базовый поиск</li>
            <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#3DD9FF] shrink-0 mt-0.5" /> Watermark PDF</li>
            <li className="flex items-start gap-1.5 opacity-50"><Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> AI-анализатор</li>
            <li className="flex items-start gap-1.5 opacity-50"><Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Полный отчёт</li>
          </ul>
          <button className="w-full py-2 rounded border border-[#3DD9FF]/30 hover:bg-[#3DD9FF]/10 text-[#3DD9FF] text-xs font-medium transition-colors relative z-10">
            Все тарифы PRO
          </button>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Статистика</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-white/5 bg-[#0d0d0f]">
              <div className="text-2xl font-light text-white mb-1">47</div>
              <div className="text-[10px] text-slate-500 uppercase">Найдено за месяц</div>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-[#0d0d0f]">
              <div className="text-2xl font-light text-white mb-1">12</div>
              <div className="text-[10px] text-slate-500 uppercase">В отчётах</div>
            </div>
          </div>
        </div>

        {/* Changelog */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Что нового</h4>
          <div className="relative pl-3 border-l border-white/10 space-y-4">
            <div className="relative">
              <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#3DD9FF] ring-4 ring-[#0a0a0b]" />
              <div className="text-xs text-white font-medium mb-0.5">Улучшен поиск по TG</div>
              <div className="text-[10px] text-slate-500">Добавлено +2M id к базе сопоставления.</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-slate-700 ring-4 ring-[#0a0a0b]" />
              <div className="text-xs text-slate-300 font-medium mb-0.5">Экспорт в CSV</div>
              <div className="text-[10px] text-slate-500">Доступно для PRO пользователей.</div>
            </div>
          </div>
        </div>

      </aside>
    </div>
  );
}

// Simple helper icon
function DatabaseIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}
