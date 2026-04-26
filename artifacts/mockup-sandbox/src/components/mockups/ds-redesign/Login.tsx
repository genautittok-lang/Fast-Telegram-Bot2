import React, { useState } from "react";
import { ArrowLeft, Shield, CheckCircle2, Lock, Users, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function Login() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A0A0A] text-zinc-300 font-sans selection:bg-[#3DD9FF]/30">
      
      {/* LEFT SIDE - Auth Form */}
      <div className="w-full md:w-1/2 lg:w-[45%] xl:w-[40%] flex flex-col px-6 py-8 md:px-12 lg:px-20 relative z-10 bg-[#0A0A0A] shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
        
        {/* Top bar */}
        <div className="flex justify-between items-center w-full mb-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border border-[#3DD9FF]/30 flex items-center justify-center bg-[#0F1115]">
              <Shield className="w-4 h-4 text-[#3DD9FF]" />
            </div>
            <span className="font-bold text-white tracking-widest text-sm">DARKSHARE</span>
          </div>
          
          <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Назад на сайт
          </a>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          <h1 className="text-2xl font-semibold text-white mb-2">Добро пожаловать</h1>
          <p className="text-sm text-zinc-400 mb-8">
            Войдите или создайте аккаунт для доступа к OSINT-платформе.
          </p>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-8 bg-[#141518] border border-white/5 rounded-lg p-1">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-[#1D1F24] data-[state=active]:text-white">Войти</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-[#1D1F24] data-[state=active]:text-white">Создать аккаунт</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6 mt-0">
              {/* Primary Telegram Login */}
              <div className="space-y-2">
                <Button className="w-full bg-[#2AABEE] hover:bg-[#2298D6] text-white h-12 text-base font-medium flex items-center justify-center gap-2 border-0">
                  <Send className="w-5 h-5 fill-current" />
                  Войти через Telegram
                </Button>
                <p className="text-[11px] text-center text-zinc-500">Самый быстрый способ — без паролей</p>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink-0 mx-4 text-zinc-600 text-xs font-medium uppercase tracking-wider">Или</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {/* Google Login */}
              <Button variant="outline" className="w-full h-11 bg-white hover:bg-zinc-100 text-zinc-900 border-0 flex items-center justify-center gap-2 font-medium">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2568 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                  <path d="M9 3.57955C10.3255 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                </svg>
                Продолжить с Google
              </Button>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400 text-xs">Email для входа (Magic Link)</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#141518] border-white/10 text-white h-11 focus-visible:ring-[#3DD9FF]/50"
                  />
                </div>
                <Button variant="outline" className="w-full h-11 bg-transparent border-white/10 text-white hover:bg-white/5 font-medium">
                  Получить ссылку на email
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="register" className="space-y-6 mt-0">
              <div className="space-y-2">
                <Button className="w-full bg-[#2AABEE] hover:bg-[#2298D6] text-white h-12 text-base font-medium flex items-center justify-center gap-2 border-0">
                  <Send className="w-5 h-5 fill-current" />
                  Создать через Telegram
                </Button>
                <p className="text-[11px] text-center text-zinc-500">Моментальная регистрация</p>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink-0 mx-4 text-zinc-600 text-xs font-medium uppercase tracking-wider">Или email</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="email-reg" className="text-zinc-400 text-xs">Рабочий Email</Label>
                  <Input 
                    id="email-reg" 
                    type="email" 
                    placeholder="name@company.com" 
                    className="bg-[#141518] border-white/10 text-white h-11 focus-visible:ring-[#3DD9FF]/50"
                  />
                </div>
                <Button variant="outline" className="w-full h-11 bg-[#3DD9FF] hover:bg-[#3DD9FF]/90 text-black border-0 font-medium">
                  Создать аккаунт
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Promo code area */}
          <div className="mt-8 p-4 rounded-lg bg-[#141518] border border-[#3DD9FF]/20 flex items-start gap-3">
            <div className="mt-0.5">
              <div className="w-5 h-5 rounded-full bg-[#3DD9FF]/10 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-[#3DD9FF]" />
              </div>
            </div>
            <div>
              <p className="text-sm text-white font-medium mb-1">Скидка 50% на 3 месяца</p>
              <p className="text-xs text-zinc-400">Используйте промокод <span className="font-mono text-[#3DD9FF] bg-[#3DD9FF]/10 px-1 py-0.5 rounded">DARKNEU</span> при оплате PRO тарифа.</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-auto pt-8">
          <p className="text-[11px] text-zinc-600 text-center">
            Регистрируясь, вы принимаете <a href="#" className="underline hover:text-zinc-400">Условия использования</a> и <a href="#" className="underline hover:text-zinc-400">Политику конфиденциальности</a>.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Brand Visual & Trust */}
      <div className="hidden md:block md:w-1/2 lg:w-[55%] xl:w-[60%] relative overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 z-0">
          <img 
            src="/__mockup/images/ds-login-bg.png" 
            alt="Data visualization background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-12 lg:p-20">
          
          <div className="flex justify-end space-x-4">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl">
              <Users className="w-4 h-4 text-[#3DD9FF]" />
              <span className="text-sm font-medium text-white">2 000+ исследователей</span>
            </div>
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl">
              <Lock className="w-4 h-4 text-[#3DD9FF]" />
              <span className="text-sm font-medium text-white">End-to-end encrypted</span>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="backdrop-blur-xl bg-[#0A0A0A]/60 border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3DD9FF] to-blue-600 flex items-center justify-center text-black font-bold text-lg">
                  A
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm">Алексей К.</h4>
                  <p className="text-zinc-400 text-xs">Security Analyst, CyberTeam</p>
                </div>
              </div>
              <p className="text-zinc-300 text-lg leading-relaxed font-light">
                «Скорость агрегации утечек потрясает. Закрыли расследование инцидента за 2 часа вместо обычной недели. Графовый анализ Telegram-каналов — киллер-фича.»
              </p>
            </div>

            <div className="space-y-4 ml-2">
              <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-2">Что вы получите бесплатно</h3>
              <ul className="space-y-3">
                {[
                  "5 поисковых запросов в день по всем базам",
                  "Базовые PDF-отчёты с ключевыми находками",
                  "Доступ к Telegram-боту для быстрых проверок"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-[#3DD9FF]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
