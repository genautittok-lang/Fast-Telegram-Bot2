import { Shield, ExternalLink, Mail } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslation();

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
                <span className="text-[10px] text-primary font-mono -mt-0.5">v4.4 OSINT Platform</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a 
                href="https://t.me/DarkShare1Bot" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] text-sm font-medium hover:bg-[#229ED9]/20 transition-colors"
                data-testid="link-telegram-footer"
              >
                <SiTelegram className="w-4 h-4" />
                @DarkShare1Bot
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {t('footer.legal')}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/terms">
                  <span className="hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-terms">
                    {t('footer.termsOfService')}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <span className="hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-privacy">
                    {t('footer.privacyPolicy')}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/support">
                  <span className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer" data-testid="link-contact">
                    <Mail className="w-3.5 h-3.5" />
                    {t('footer.contact')}
                  </span>
                </Link>
              </li>
              <li>
                <a href="mailto:darkshare.store@gmail.com" className="hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-support-email">
                  darkshare.store@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">
              {t('footer.disclaimer')}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('footer.disclaimerText')}
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-muted-foreground font-mono order-2 sm:order-1">
            © 2026 DARKSHARE. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground order-1 sm:order-2">
            <Link href="/terms">
              <span className="hover:text-primary transition-colors" data-testid="link-terms-bottom">
                {t('footer.terms')}
              </span>
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/privacy">
              <span className="hover:text-primary transition-colors" data-testid="link-privacy-bottom">
                {t('footer.privacy')}
              </span>
            </Link>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {t('footer.systemsOnline')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
