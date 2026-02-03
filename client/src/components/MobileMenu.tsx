import { Link, useLocation } from "wouter";
import { 
  Shield, 
  Eye, 
  Menu,
  History,
  Users,
  LogOut,
  Home,
  ExternalLink,
  Zap
} from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileMenuProps {
  lang?: "UA" | "RU" | "EN";
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export function MobileMenu({ lang = "UA", isAuthenticated = false, onLogout }: MobileMenuProps) {
  const [location] = useLocation();
  
  const navItems = isAuthenticated ? [
    { href: "/dashboard", icon: Shield, label: "Панель", color: "text-primary" },
    { href: "/history", icon: History, label: "Історія", color: "text-blue-400" },
    { href: "/monitoring", icon: Eye, label: "Моніторинг", color: "text-purple-400" },
    { href: "/referral", icon: Users, label: "Реферали", color: "text-green-400" },
  ] : [
    { href: "/", icon: Home, label: "Головна", color: "text-white" },
    { href: "/login", icon: Shield, label: "Увійти", color: "text-primary" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="sm:hidden bg-white/5 border border-white/10"
          data-testid="button-mobile-menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-background/95 backdrop-blur-xl border-white/10"
      >
        {navItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className={location === item.href ? "text-primary font-medium" : ""}>
                {item.label}
              </span>
              {location === item.href && <Zap className="w-3 h-3 text-primary ml-auto" />}
            </Link>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem asChild>
          <a 
            href="https://t.me/DARKSHAREN1_BOT" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
            data-testid="link-mobile-bot"
          >
            <SiTelegram className="w-4 h-4 text-[#2AABEE]" />
            <span>Telegram Бот</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
          </a>
        </DropdownMenuItem>
        
        {isAuthenticated && onLogout && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={onLogout}
              className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
              data-testid="button-mobile-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Вийти</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
