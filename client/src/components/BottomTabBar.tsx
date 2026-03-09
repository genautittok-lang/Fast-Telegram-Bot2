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
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      <div className="flex items-end justify-around px-2 pt-1.5 pb-2">
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
                  className="relative -mt-6 flex flex-col items-center"
                  whileTap={{ scale: 0.88 }}
                  data-testid="tab-scan"
                >
                  <motion.div
                    className="w-[3.5rem] h-[3.5rem] rounded-full bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 flex items-center justify-center border-[3px] border-[#0a0a0f] relative"
                    animate={{
                      boxShadow: [
                        "0 0 15px rgba(34,197,94,0.3), 0 0 30px rgba(34,197,94,0.1)",
                        "0 0 25px rgba(34,197,94,0.5), 0 0 40px rgba(34,197,94,0.2)",
                        "0 0 15px rgba(34,197,94,0.3), 0 0 30px rgba(34,197,94,0.1)"
                      ]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Search className="w-6 h-6 text-black" />
                  </motion.div>
                  <span className="text-[9px] font-semibold text-primary mt-1">Scan</span>
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
                <div className="relative">
                  <tab.icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? "text-primary" : "text-zinc-500"
                    }`}
                  />
                  {isActive && (
                    <motion.div
                      className="absolute -inset-2 rounded-full bg-primary/10 -z-10"
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
                    className="absolute -top-0.5 w-6 h-[2px] rounded-full bg-gradient-to-r from-primary to-cyan-400"
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
