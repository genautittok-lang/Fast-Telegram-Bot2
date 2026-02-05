import { Shield, ExternalLink, Mail } from "lucide-react";
import { SiTelegram } from "react-icons/si";

interface FooterProps {
  lang?: "UA" | "RU" | "EN";
}

export function Footer({ lang = "EN" }: FooterProps) {
  const getTranslation = (ua: string, ru: string, en: string) => {
    return lang === "UA" ? ua : lang === "RU" ? ru : en;
  };

  return (
    <footer className="border-t border-white/10 bg-background/95 backdrop-blur-sm relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <img src="/logo.png" alt="DARKSHARE" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg tracking-tight">DARKSHARE</span>
                <span className="text-[10px] text-primary font-mono -mt-0.5">v4.1 OSINT Platform</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {getTranslation(
                "Професійна платформа для OSINT розвідки та аналізу кіберзагроз. Безпечний та етичний збір відкритих даних.",
                "Профессиональная платформа для OSINT разведки и анализа киберугроз. Безопасный и этичный сбор открытых данных.",
                "Professional platform for OSINT intelligence and cyber threat analysis. Secure and ethical open-source data collection."
              )}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a 
                href="https://t.me/DARKSHAREN1_BOT" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] text-sm font-medium hover:bg-[#229ED9]/20 transition-colors"
                data-testid="link-telegram-footer"
              >
                <SiTelegram className="w-4 h-4" />
                @DARKSHAREN1_BOT
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {getTranslation("Правова інформація", "Правовая информация", "Legal")}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="#terms" className="hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-terms">
                  {getTranslation("Умови використання", "Условия использования", "Terms of Service")}
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-privacy">
                  {getTranslation("Політика конфіденційності", "Политика конфиденциальности", "Privacy Policy")}
                </a>
              </li>
              <li>
                <a href="https://t.me/DARKSHAREN1_BOT" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-contact">
                  <Mail className="w-3.5 h-3.5" />
                  {getTranslation("Контакт", "Контакт", "Contact")}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">
              {getTranslation("Відмова від відповідальності", "Отказ от ответственности", "Legal Disclaimer")}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {getTranslation(
                "DARKSHARE надає інструменти OSINT виключно для законних цілей кібербезпеки. Користувачі несуть відповідальність за дотримання місцевого законодавства. Ми збираємо лише загальнодоступну інформацію.",
                "DARKSHARE предоставляет инструменты OSINT исключительно для законных целей кибербезопасности. Пользователи несут ответственность за соблюдение местного законодательства. Мы собираем только общедоступную информацию.",
                "DARKSHARE provides OSINT tools solely for legitimate cybersecurity purposes. Users are responsible for compliance with local laws. We collect only publicly available information."
              )}
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-muted-foreground font-mono order-2 sm:order-1">
            © 2025 DARKSHARE. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground order-1 sm:order-2">
            <a href="#terms" className="hover:text-primary transition-colors" data-testid="link-terms-bottom">
              {getTranslation("Умови", "Условия", "Terms")}
            </a>
            <span className="text-white/20">|</span>
            <a href="#privacy" className="hover:text-primary transition-colors" data-testid="link-privacy-bottom">
              {getTranslation("Приватність", "Приватность", "Privacy")}
            </a>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {getTranslation("Системи онлайн", "Системы онлайн", "Systems Online")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
