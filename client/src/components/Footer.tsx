import { Shield, ExternalLink, Mail, Users, Lock } from "lucide-react";
import { SiTelegram, SiInstagram, SiDiscord, SiGithub } from "react-icons/si";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t, lang } = useTranslation();

  const aupLabel = lang === "uk" ? "Правила використання" : lang === "ru" ? "Правила использования" : lang === "es" ? "Política de uso aceptable" : lang === "de" ? "Nutzungsrichtlinien" : "Acceptable Use Policy";
  const dataDelLabel = lang === "uk" ? "Видалення даних (GDPR)" : lang === "ru" ? "Удаление данных (GDPR)" : lang === "es" ? "Eliminación de datos (GDPR)" : lang === "de" ? "Datenlöschung (DSGVO)" : "GDPR / Data Deletion";
  const cookieSettingsLabel = lang === "uk" ? "Налаштування cookie" : lang === "ru" ? "Настройки cookie" : lang === "es" ? "Configuración de cookies" : lang === "de" ? "Cookie-Einstellungen" : "Cookie settings";

  // Programmatic-SEO hub links (plain <a> → full page load to server-rendered pages).
  // uk has its own /uk/ tree; other UI languages fall back to the EN pages.
  const pref = lang === "uk" ? "/uk" : "";
  const popularLabel = lang === "uk" ? "Популярні перевірки" : lang === "ru" ? "Популярные проверки" : lang === "es" ? "Comprobaciones populares" : lang === "de" ? "Beliebte Checks" : "Popular checks";
  const allChecksLabel = lang === "uk" ? "Усі перевірки" : lang === "ru" ? "Все проверки" : lang === "es" ? "Todas" : lang === "de" ? "Alle Checks" : "All checks";
  const ipRepLabel = lang === "uk" ? "Репутація IP" : lang === "ru" ? "Репутация IP" : lang === "es" ? "Reputación IP" : lang === "de" ? "IP-Reputation" : "IP reputation";
  const emailLabel = lang === "uk" ? "Перевірка email" : lang === "ru" ? "Проверка email" : lang === "es" ? "Verificar email" : lang === "de" ? "E-Mail prüfen" : "Email check";
  const phoneLabel = lang === "uk" ? "Перевірка номера" : lang === "ru" ? "Проверка номера" : lang === "es" ? "Verificar teléfono" : lang === "de" ? "Telefon prüfen" : "Phone check";
  const walletLabel = lang === "uk" ? "Перевірка гаманця" : lang === "ru" ? "Проверка кошелька" : lang === "es" ? "Verificar billetera" : lang === "de" ? "Wallet prüfen" : "Wallet check";
  const domainLabel = lang === "uk" ? "Перевірка домену" : lang === "ru" ? "Проверка домена" : lang === "es" ? "Verificar dominio" : lang === "de" ? "Domain prüfen" : "Domain check";

  const openCookieSettings = () => {
    window.dispatchEvent(new CustomEvent("ds:open-cookie-settings"));
  };

  return (
    <footer className="relative z-10 border-t border-white/[0.06]">
      <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#050508] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/10">
                <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg tracking-tight text-white">DARKSHARE</span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a 
                href="https://t.me/DarkShare1Bot" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/25 text-[#229ED9] text-sm font-medium hover:bg-[#229ED9]/20 hover:border-[#229ED9]/40 transition-all duration-300 shadow-[0_0_15px_rgba(34,158,217,0.1)]"
                data-testid="link-telegram-footer"
              >
                <SiTelegram className="w-4 h-4" />
                @DarkShare1Bot
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://www.instagram.com/darkshare.store" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E4405F]/10 border border-[#E4405F]/25 text-[#E4405F] text-sm font-medium hover:bg-[#E4405F]/20 hover:border-[#E4405F]/40 transition-all duration-300 shadow-[0_0_15px_rgba(228,64,95,0.1)]"
                data-testid="link-instagram-footer"
              >
                <SiInstagram className="w-4 h-4" />
                @darkshare.store
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="pt-3">
              <h4 className="font-semibold text-xs text-zinc-300 mb-2.5 uppercase tracking-wide">{popularLabel}</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-400">
                <a href={`${pref}/tools/check-email`} className="hover:text-cyan-400 transition-colors" data-testid="link-pseo-email">{emailLabel}</a>
                <a href={`${pref}/tools/check-phone`} className="hover:text-cyan-400 transition-colors" data-testid="link-pseo-phone">{phoneLabel}</a>
                <a href={`${pref}/tools/check-wallet`} className="hover:text-cyan-400 transition-colors" data-testid="link-pseo-wallet">{walletLabel}</a>
                <a href={`${pref}/tools/check-domain`} className="hover:text-cyan-400 transition-colors" data-testid="link-pseo-domain">{domainLabel}</a>
                <a href={`${pref}/ip-reputation`} className="hover:text-cyan-400 transition-colors" data-testid="link-pseo-ip">{ipRepLabel}</a>
                <a href={`${pref}/tools`} className="text-cyan-400/90 hover:text-cyan-300 transition-colors" data-testid="link-pseo-all">{allChecksLabel} →</a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-white">
              <Shield className="w-4 h-4 text-cyan-400" />
              {t('footer.legal')}
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li>
                <Link href="/terms">
                  <span className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-terms">
                    {t('footer.termsOfService')}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <span className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-privacy">
                    {t('footer.privacyPolicy')}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/aup">
                  <span className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-aup">
                    {aupLabel}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/data-deletion">
                  <span className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-data-deletion">
                    {dataDelLabel}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/support">
                  <span className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-contact">
                    <Mail className="w-3.5 h-3.5" />
                    {t('footer.contact')}
                  </span>
                </Link>
              </li>
              <li>
                <a href="mailto:darkshare.store@gmail.com" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5" data-testid="link-support-email">
                  darkshare.store@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-white">
              <Users className="w-4 h-4 text-cyan-400" />
              {lang === "uk" ? "Спільнота" : lang === "ru" ? "Сообщество" : lang === "es" ? "Comunidad" : lang === "de" ? "Community" : "Community"}
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li>
                <Link href="/trust">
                  <span className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-trust">
                    <Lock className="w-3.5 h-3.5" />
                    {lang === "uk" ? "Trust Center" : lang === "ru" ? "Trust Center" : lang === "es" ? "Trust Center" : lang === "de" ? "Trust Center" : "Trust Center"}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/community">
                  <span className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-community">
                    <Users className="w-3.5 h-3.5" />
                    {lang === "uk" ? "Спільнота · SDK" : lang === "ru" ? "Сообщество · SDK" : lang === "es" ? "Comunidad · SDK" : lang === "de" ? "Community · SDK" : "Community · SDK"}
                  </span>
                </Link>
              </li>
              <li>
                <a href="https://github.com/darkshare" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5" data-testid="link-github-footer">
                  <SiGithub className="w-3.5 h-3.5" />
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://discord.gg/darkshare" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5" data-testid="link-discord-footer">
                  <SiDiscord className="w-3.5 h-3.5" />
                  Discord
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="/.well-known/security.txt" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5" data-testid="link-security-txt">
                  security.txt
                </a>
              </li>
            </ul>
            <div className="pt-2">
              <h4 className="font-semibold text-xs text-zinc-300 mb-2">{t('footer.disclaimer')}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">{t('footer.disclaimerText')}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-zinc-600 font-mono order-2 sm:order-1">
            © 2026 DARKSHARE · v5.0 · All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 order-1 sm:order-2">
            <Link href="/terms">
              <span className="hover:text-cyan-400 transition-colors cursor-pointer" data-testid="link-terms-bottom">
                {t('footer.terms')}
              </span>
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/privacy">
              <span className="hover:text-cyan-400 transition-colors cursor-pointer" data-testid="link-privacy-bottom">
                {t('footer.privacy')}
              </span>
            </Link>
            <span className="text-white/10">|</span>
            <button
              onClick={openCookieSettings}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
              data-testid="button-cookie-settings"
            >
              {cookieSettingsLabel}
            </button>
            <span className="text-white/10">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse" />
              {t('footer.systemsOnline')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
