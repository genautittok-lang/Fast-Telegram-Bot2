import { type ReactNode, useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Shield, Globe, Lock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface PageLayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
  title?: string;
  appMode?: boolean;
}

function PullToRefresh({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const queryClient = useQueryClient();
  const threshold = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = scrollRef.current;
    if (el && el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [scrollRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, [isRefreshing, scrollRef]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(15);
      queryClient.invalidateQueries().then(() => {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 600);
      });
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, queryClient]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scrollRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <motion.div
      className="flex items-center justify-center pointer-events-none"
      style={{ height: pullDistance }}
      animate={isRefreshing ? { height: 48 } : {}}
      transition={{ duration: 0.3, ease: "easeOut" }}
      data-testid="pull-to-refresh-indicator"
    >
      <motion.div
        className="w-8 h-8 flex items-center justify-center"
        style={{ opacity: progress }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <motion.div
            className="w-5 h-5 rounded-full border-2 border-primary/60"
            style={{
              borderTopColor: progress >= 1 ? "hsl(var(--primary))" : "transparent",
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

function AppSplashLogin() {
  const [showLogin, setShowLogin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [hackerLines, setHackerLines] = useState<string[]>([]);
  const [splashPhase, setSplashPhase] = useState(0);
  const telegramRef = useRef<HTMLDivElement>(null);
  const { login, requiresTwoFactor, verifyTwoFactor } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setShowLogin(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleTwoFactorSubmit = async () => {
    if (twoFactorCode.length !== 6) return;
    setTwoFactorLoading(true);
    setAuthError(null);
    try {
      await verifyTwoFactor(twoFactorCode);
    } catch {
      setAuthError(t("account.twoFactorInvalidCode") || "Invalid code");
      setTwoFactorCode("");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  useEffect(() => {
    if (!showLogin) return;

    window.onTelegramAuth = async (telegramUser: any) => {
      setAuthError(null);
      try {
        await login(telegramUser);
      } catch {
        setAuthError(t("auth.telegramFailed") || "Login failed. Please try again.");
      }
    };

    if (telegramRef.current) {
      telegramRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", "DarkShare1Bot");
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "12");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      script.setAttribute("data-userpic", "false");
      script.async = true;
      telegramRef.current.appendChild(script);
    }

    return () => { delete window.onTelegramAuth; };
  }, [showLogin, login, t]);

  useEffect(() => {
    if (showLogin) return;
    const codeSnippets = [
      "$ nmap -sV --script=vuln 192.168.1.0/24",
      "[*] Scanning 256 hosts...",
      "PORT   STATE SERVICE VERSION",
      "22/tcp open  ssh     OpenSSH 8.9",
      "80/tcp open  http    nginx 1.24.0",
      "443/tcp open ssl     TLS 1.3",
      "$ hashcat -m 0 -a 0 hashes.txt rockyou.txt",
      "[!] Cracking MD5 hashes... 47% complete",
      "$ sqlmap -u 'target.com/id=1' --dbs",
      "[INFO] testing connection to target URL",
      "[*] fetching database names",
      "available databases [3]:",
      "  information_schema",
      "  darkshare_osint",
      "  users_db",
      "$ curl -s https://api.shodan.io/scan",
      '{"ip":"45.33.32.156","vulns":["CVE-2024-1234"]}',
      "$ whois blockchain.info | grep -i registrant",
      "Registrant: REDACTED FOR PRIVACY",
      "[+] Analyzing wallet 0x7a2d3f8...bc91",
      "[+] 47 transactions found, risk: HIGH",
      "$ gobuster dir -u https://target.com -w common.txt",
      "/admin (Status: 403) [Size: 162]",
      "/api (Status: 200) [Size: 4891]",
      "$ john --wordlist=passwords.lst shadow.txt",
      "[*] 2 password hashes cracked",
      "$ nikto -h https://target.com -ssl",
      "[+] Server: nginx/1.24.0",
      "[+] X-Frame-Options header missing",
      "$ python3 osint_scanner.py --deep",
      "[*] Gathering intelligence data...",
      "[+] Email breach detected: 3 databases",
      "[+] Phone linked to 2 social accounts",
      "$ darkshare --scan --all-modules",
      "[✓] OSINT scan complete. Risk: 78/100",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      setHackerLines(prev => {
        const next = [...prev, codeSnippets[idx % codeSnippets.length]];
        return next.length > 12 ? next.slice(-12) : next;
      });
      idx++;
    }, 120);
    const t1 = setTimeout(() => setSplashPhase(1), 600);
    const t2 = setTimeout(() => setSplashPhase(2), 1200);
    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); };
  }, [showLogin]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!showLogin ? (
          <motion.div
            key="splash"
            className="flex flex-col items-center relative z-10 w-full max-w-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute inset-0 -mx-4 overflow-hidden rounded-2xl opacity-30 pointer-events-none">
              <div className="font-mono text-[10px] leading-[14px] text-cyan-500/60 p-3 whitespace-pre select-none">
                {hackerLines.map((line, i) => (
                  <motion.div
                    key={`${i}-${line.slice(0,10)}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: i === hackerLines.length - 1 ? 0.9 : 0.4, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={line.startsWith("[") ? "text-cyan-400/50" : line.startsWith("$") ? "text-cyan-300/60" : ""}
                  >
                    {line}
                  </motion.div>
                ))}
                <motion.span
                  className="inline-block w-[6px] h-[12px] bg-cyan-400 ml-0.5"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </div>
            </div>

            <motion.div
              className="relative mt-16 mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="w-28 h-28 rounded-[2.2rem] bg-gradient-to-br from-primary via-cyan-400 to-cyan-400 flex items-center justify-center relative"
                style={{ boxShadow: "0 0 80px rgba(34,197,94,0.35), 0 0 30px rgba(34,197,94,0.2) inset" }}>
                <Shield className="w-14 h-14 text-black" />
                <motion.div
                  className="absolute inset-0 rounded-[2.2rem] border-2 border-cyan-400/40"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-[2.2rem] border border-cyan-400/30"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                />
              </div>
            </motion.div>

            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h1 className="text-4xl font-black text-white tracking-tight" style={{ textShadow: "0 0 30px rgba(34,197,94,0.3)" }}>
                DARKSHARE
              </h1>
              <p className="text-[11px] text-cyan-400/80 font-mono mt-1.5 tracking-[0.25em] uppercase">
                Security OSINT Platform
              </p>
            </motion.div>

            {splashPhase >= 1 && (
              <motion.div
                className="w-48 mb-4"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                </div>
                <motion.p 
                  className="text-[9px] font-mono text-zinc-500 text-center mt-2"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {splashPhase >= 2 ? (t("auth.initSecure") || "Initializing secure connection...") : (t("common.loading") || "Loading...")}
                </motion.p>
              </motion.div>
            )}

            <motion.div
              className="flex gap-1.5 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            className="flex flex-col items-center gap-8 relative z-10 w-full max-w-sm px-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-cyan-400 to-cyan-400 flex items-center justify-center"
                style={{ boxShadow: "0 0 40px rgba(34,197,94,0.25)" }}
              >
                <Shield className="w-8 h-8 text-black" />
              </motion.div>
              <h2 className="text-xl font-bold text-white">DARKSHARE</h2>
              <p className="text-sm text-zinc-400 text-center">
                {t("auth.loginDescription") || "Sign in to access your security dashboard"}
              </p>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                data-testid="text-app-auth-error"
              >
                {authError}
              </motion.div>
            )}

            {requiresTwoFactor ? (
              <div className="w-full space-y-4">
                <div className="text-center">
                  <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-zinc-300">{t("account.twoFactorTitle") || "Two-Factor Authentication"}</p>
                  <p className="text-xs text-zinc-500 mt-1">{t("account.twoFactorEnterCode") || "Enter your 6-digit code"}</p>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-white/[0.04] border-white/[0.09] rounded-2xl"
                  data-testid="input-app-2fa-code"
                />
                <Button
                  onClick={handleTwoFactorSubmit}
                  disabled={twoFactorCode.length !== 6 || twoFactorLoading}
                  className="w-full h-14 rounded-2xl text-base font-medium"
                  data-testid="button-app-2fa-submit"
                >
                  {twoFactorLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    t("account.twoFactorVerify") || "Verify"
                  )}
                </Button>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <a href="/api/login" className="block w-full" data-testid="app-button-google-login">
                  <Button
                    variant="outline"
                    className="w-full h-14 text-base font-medium border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] gap-3 rounded-2xl"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </Button>
                </a>

                <div className="flex items-center gap-3">
                  <div className="h-px bg-white/[0.06] flex-1" />
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{t("common.or") || "or"}</span>
                  <div className="h-px bg-white/[0.06] flex-1" />
                </div>

                <div
                  ref={telegramRef}
                  className="telegram-login-container flex justify-center"
                  data-testid="app-telegram-login-widget"
                />
              </div>
            )}

            <Link href="/">
              <button className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-2" data-testid="app-link-back-to-site">
                <Globe className="w-3.5 h-3.5" />
                {t("mobile.home") || "Back to website"}
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PageLayout({ children, headerActions, title, appMode = false }: PageLayoutProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const mainScrollRef = useRef<HTMLElement>(null);
  const { data: adminData } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/verify"],
    enabled: isAuthenticated,
  });
  const isAdmin = adminData?.isAdmin || false;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !appMode) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation, appMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-mono text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (appMode && !isAuthenticated) {
    return <AppSplashLogin />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (appMode) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden max-w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-[#0e0e14]/95 backdrop-blur-2xl sticky top-0 z-40 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <Link href="/">
                <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] active:bg-white/[0.08] transition-colors" data-testid="button-back-to-site">
                  <Globe className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] font-medium text-zinc-400">{t("mobile.home") || "Site"}</span>
                </button>
              </Link>
              <div className="w-px h-4 bg-white/[0.06]" />
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.25)]">
                <Shield className="w-3 h-3 text-black" />
              </div>
              {title ? (
                <span className="font-semibold text-sm text-white">{title}</span>
              ) : (
                <span className="font-bold text-sm">DARKSHARE</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {headerActions}
              <LanguageSwitcher variant="minimal" />
            </div>
          </div>
          <main ref={mainScrollRef} className="flex-1 overflow-y-auto pb-28 lg:pb-0 bg-[#0a0a0f]">
            <PullToRefresh scrollRef={mainScrollRef} />
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden max-w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#09090E]/92 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold">DARKSHARE</span>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <LanguageSwitcher variant="minimal" />
            <MobileMenu isAuthenticated={true} username={user?.username} tier={user?.tier} onLogout={logout} isAdmin={isAdmin} />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
