import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { translations, type Language, type TranslationSchema } from "./translations";

const STORAGE_KEY = "darkshare_language";
const DEFAULT_LANGUAGE: Language = "en";

function getBrowserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith("uk")) return "uk";
  if (browserLang.startsWith("ru")) return "ru";
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("en")) return "en";
  
  return DEFAULT_LANGUAGE;
}

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split(".");
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  translations: TranslationSchema;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return DEFAULT_LANGUAGE;
    
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && translations[stored]) {
      return stored;
    }
    
    return getBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    if (translations[newLang]) {
      setLangState(newLang);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const value = getNestedValue(translations[lang], key);
    
    if (value === undefined) {
      const fallback = getNestedValue(translations[DEFAULT_LANGUAGE], key);
      if (fallback) {
        return interpolate(fallback, params);
      }
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    return interpolate(value, params);
  }, [lang]);

  const value: LanguageContextType = {
    lang,
    setLang,
    t,
    translations: translations[lang],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  
  return context;
}

export { type Language, type TranslationSchema };
