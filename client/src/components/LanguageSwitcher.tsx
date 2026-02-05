import { Globe, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation, type Language } from "@/lib/i18n";
import { languageNames, languageFlags } from "@/lib/translations";

const languages: Language[] = ["en", "uk", "ru", "es", "de"];

interface LanguageSwitcherProps {
  variant?: "default" | "minimal" | "full";
  align?: "start" | "center" | "end";
  className?: string;
}

export function LanguageSwitcher({ 
  variant = "default", 
  align = "end",
  className = ""
}: LanguageSwitcherProps) {
  const { lang, setLang } = useTranslation();

  if (variant === "minimal") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className={`bg-white/5 border border-white/10 hover:bg-white/10 ${className}`}
            data-testid="button-language-switcher"
          >
            <Globe className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-[160px]">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language}
              onClick={() => setLang(language)}
              className="gap-3 cursor-pointer"
              data-testid={`button-lang-${language}`}
            >
              <span className="text-lg">{languageFlags[language]}</span>
              <span className="font-medium flex-1">{languageNames[language]}</span>
              {lang === language && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "full") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className={`bg-white/5 border border-white/10 hover:bg-white/10 gap-2 ${className}`}
            data-testid="button-language-switcher"
          >
            <Globe className="w-4 h-4" />
            <span className="text-lg">{languageFlags[lang]}</span>
            <span className="hidden sm:inline">{languageNames[lang]}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-[180px]">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language}
              onClick={() => setLang(language)}
              className="gap-3 cursor-pointer"
              data-testid={`button-lang-${language}`}
            >
              <span className="text-lg">{languageFlags[language]}</span>
              <span className="font-medium flex-1">{languageNames[language]}</span>
              {lang === language && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`bg-white/5 border border-white/10 hover:bg-white/10 px-2 sm:px-3 gap-1 ${className}`}
          data-testid="button-language-switcher"
        >
          <span className="text-lg">{languageFlags[lang]}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[160px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language}
            onClick={() => setLang(language)}
            className="gap-3 cursor-pointer"
            data-testid={`button-lang-${language}`}
          >
            <span className="text-lg">{languageFlags[language]}</span>
            <span className="font-medium flex-1">{languageNames[language]}</span>
            {lang === language && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
