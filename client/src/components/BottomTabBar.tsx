import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Clock, Scan, MessageCircle, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

function useIsPwa() {
  const [isPwa, setIsPwa] = useState(false);
  useEffect(() => {
    const check = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches
        || (window.navigator as any).standalone === true;
      setIsPwa(standalone);
    };
    check();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);
  return isPwa;
}

const tabs = [
  { id: "dashboard", icon: LayoutDashboard, href: "/dashboard", label: "Home" },
  { id: "history", icon: Clock, href: "/history", label: "History" },
  { id: "scan", icon: Scan, href: "/dashboard", label: "Scan", isCenter: true },
  { id: "chat", icon: MessageCircle, href: "/chat", label: "Chat" },
  { id: "account", icon: User, href: "/account", label: "Profile" },
];

function NotificationDot({ count, color = "bg-red-500" }: { count: number; color?: string }) {
  if (count <= 0) return null;
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full ${color} flex items-center justify-center px-1 z-10`}
      data-testid="badge-notification-dot"
    >
      <span className="text-[9px] font-bold text-white leading-none">
        {count > 99 ? "99+" : count}
      </span>
    </motion.div>
  );
}

export function BottomTabBar() {
  const [location] = useLocation();
  const isPwa = useIsPwa();

  const { data: recentReports = [] } = useQuery<any[]>({
    queryKey: ["/api/reports"],
  });

  const newReportsCount = (() => {
    const lastSeen = localStorage.getItem("ds-last-seen-history");
    if (!lastSeen) return recentReports.length > 0 ? Math.min(recentReports.length, 9) : 0;
    const lastSeenDate = new Date(lastSeen);
    return recentReports.filter((r: any) => new Date(r.createdAt) > lastSeenDate).length;
  })();

  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  if (!isPwa) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50" data-testid="app-bottom-tab-bar">
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
      <div className="bg-[#0e0e14]/98 backdrop-blur-2xl border-t border-white/[0.04]">
        <div className="flex items-end justify-around px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => {
            const isActive = tab.id === "scan"
              ? false
              : tab.id === "dashboard"
              ? location === "/dashboard"
              : location.startsWith(tab.href);

            if (tab.isCenter) {
              return (
                <Link key={tab.id} href={tab.href}>
                  <motion.button
                    className="relative -mt-7 flex flex-col items-center"
                    whileTap={{ scale: 0.88 }}
                    onTapStart={triggerHaptic}
                    data-testid="tab-scan"
                  >
                    <motion.div
                      className="w-[3.25rem] h-[3.25rem] rounded-[1.1rem] bg-gradient-to-br from-primary via-cyan-400 to-cyan-400 flex items-center justify-center relative"
                      style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}
                      animate={{
                        boxShadow: [
                          "0 4px 20px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                          "0 4px 30px rgba(34,197,94,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                          "0 4px 20px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                        ]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Scan className="w-6 h-6 text-black" />
                    </motion.div>
                    <span className="text-[9px] font-bold text-primary mt-1 tracking-wide">SCAN</span>
                  </motion.button>
                </Link>
              );
            }

            const badgeCount = tab.id === "history" ? newReportsCount : 0;

            return (
              <Link key={tab.id} href={tab.href}>
                <motion.button
                  className="flex flex-col items-center gap-0.5 py-1.5 px-3 relative min-w-[3.5rem]"
                  whileTap={{ scale: 0.85 }}
                  onTapStart={triggerHaptic}
                  data-testid={`tab-${tab.id}`}
                >
                  <div className="relative">
                    <tab.icon
                      className={`w-[1.35rem] h-[1.35rem] transition-all duration-300 ${
                        isActive ? "text-primary" : "text-zinc-600"
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <NotificationDot count={badgeCount} />
                    {isActive && (
                      <motion.div
                        className="absolute -inset-2 rounded-xl bg-primary/8 -z-10"
                        layoutId="tabGlow"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-semibold transition-all duration-300 ${
                      isActive ? "text-primary" : "text-zinc-600"
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      className="absolute top-0 w-5 h-[2px] rounded-full bg-gradient-to-r from-primary to-cyan-400"
                      layoutId="tabIndicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
