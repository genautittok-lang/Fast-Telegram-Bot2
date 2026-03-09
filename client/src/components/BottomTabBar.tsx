import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home, Clock, Search, MessageCircle, User } from "lucide-react";

const tabs = [
  { id: "dashboard", icon: Home, href: "/dashboard", label: "Home" },
  { id: "history", icon: Clock, href: "/history", label: "History" },
  { id: "scan", icon: Search, href: "/dashboard", label: "Scan", isCenter: true },
  { id: "chat", icon: MessageCircle, href: "/chat", label: "Chat" },
  { id: "account", icon: User, href: "/account", label: "Profile" },
];

export function BottomTabBar() {
  const [location] = useLocation();

  return (
    <div className="app-bottom-bar lg:hidden" data-testid="app-bottom-tab-bar">
      <div className="flex items-end justify-around px-2 pt-1.5 pb-1.5">
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
                  className="relative -mt-5 flex flex-col items-center"
                  whileTap={{ scale: 0.9 }}
                  data-testid="tab-scan"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-[0_4px_20px_rgba(34,197,94,0.4)] border-4 border-background">
                    <Search className="w-6 h-6 text-black" />
                  </div>
                  <span className="text-[9px] font-medium text-primary mt-0.5">Scan</span>
                </motion.button>
              </Link>
            );
          }

          return (
            <Link key={tab.id} href={tab.href}>
              <motion.button
                className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
                whileTap={{ scale: 0.85 }}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-zinc-500"
                  }`}
                />
                <span
                  className={`text-[9px] font-medium transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-zinc-500"
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute -top-0.5 w-5 h-0.5 rounded-full bg-primary"
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
  );
}
