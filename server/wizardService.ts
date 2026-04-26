export interface WizardAnswers {
  exposureType: "email" | "phone" | "password" | "wallet" | "social" | "unknown";
  affectedServices: string[];
  hasFinancialAccess: boolean;
  hasSensitiveData: boolean;
  is2faEnabled: boolean;
  hasSimAccess: boolean;
  language: "uk" | "ru" | "en";
}

export interface WizardStep {
  priority: 1 | 2 | 3;
  category: string;
  title: string;
  description: string;
  estMinutes: number;
  external?: { label: string; url: string }[];
}

export interface WizardResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  steps: WizardStep[];
  legalNote: string;
}

const t = {
  uk: {
    riskLevels: { LOW: "НИЗЬКИЙ", MEDIUM: "ПОМІРНИЙ", HIGH: "ВИСОКИЙ", CRITICAL: "КРИТИЧНИЙ" },
    sumLow: "Ризик мінімальний. Виконайте профілактичні кроки.",
    sumMed: "Виявлено помірні ризики. Дійте протягом 24-48 годин.",
    sumHigh: "Високий ризик компрометації. Дійте сьогодні.",
    sumCrit: "КРИТИЧНО. Виконайте перші 3 кроки в найближчу годину.",
    legalNote: "Ці рекомендації — загальний OPSEC-чек-лист, не юридична порада. У разі реального інциденту зверніться до офіцера безпеки чи правоохоронців.",
  },
  ru: {
    riskLevels: { LOW: "НИЗКИЙ", MEDIUM: "УМЕРЕННЫЙ", HIGH: "ВЫСОКИЙ", CRITICAL: "КРИТИЧЕСКИЙ" },
    sumLow: "Риск минимальный. Выполните профилактические шаги.",
    sumMed: "Обнаружены умеренные риски. Действуйте в течение 24-48 часов.",
    sumHigh: "Высокий риск компрометации. Действуйте сегодня.",
    sumCrit: "КРИТИЧНО. Выполните первые 3 шага в ближайший час.",
    legalNote: "Эти рекомендации — общий OPSEC-чек-лист, не юридическая консультация. При реальном инциденте обратитесь к офицеру безопасности или правоохранителям.",
  },
  en: {
    riskLevels: { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", CRITICAL: "CRITICAL" },
    sumLow: "Risk is minimal. Run preventive steps below.",
    sumMed: "Moderate risk detected. Act within 24-48 hours.",
    sumHigh: "High compromise risk. Act today.",
    sumCrit: "CRITICAL. Complete the first 3 steps within the next hour.",
    legalNote: "These recommendations are a generic OPSEC checklist, not legal advice. For a real incident contact your security officer or law enforcement.",
  },
};

export function generateCompromiseChecklist(input: WizardAnswers): WizardResult {
  const L = t[input.language];
  let riskScore = 0;
  if (input.exposureType === "password") riskScore += 40;
  if (input.exposureType === "phone") riskScore += 25;
  if (input.exposureType === "email") riskScore += 20;
  if (input.exposureType === "wallet") riskScore += 50;
  if (input.exposureType === "social") riskScore += 15;
  if (input.hasFinancialAccess) riskScore += 25;
  if (input.hasSensitiveData) riskScore += 15;
  if (!input.is2faEnabled) riskScore += 20;
  if (input.hasSimAccess) riskScore += 15;

  const riskLevel: WizardResult["riskLevel"] =
    riskScore < 25 ? "LOW" : riskScore < 50 ? "MEDIUM" : riskScore < 80 ? "HIGH" : "CRITICAL";

  const steps: WizardStep[] = [];

  if (input.exposureType === "password") {
    steps.push({
      priority: 1,
      category: input.language === "en" ? "Authentication" : input.language === "ru" ? "Аутентификация" : "Автентифікація",
      title: input.language === "en"
        ? "Change password on every account using this credential"
        : input.language === "ru"
        ? "Сменить пароль на всех аккаунтах с этим паролем"
        : "Змінити пароль на всіх акаунтах з цим паролем",
      description: input.language === "en"
        ? "Generate unique 20+ char passwords with a manager. Never reuse."
        : input.language === "ru"
        ? "Сгенерируйте уникальные пароли длиной 20+ символов через менеджер. Не используйте повторно."
        : "Згенеруйте унікальні паролі довжиною 20+ символів через менеджер. Не використовуйте повторно.",
      estMinutes: 30,
      external: [
        { label: "Bitwarden", url: "https://bitwarden.com" },
        { label: "1Password", url: "https://1password.com" },
      ],
    });
  }

  if (!input.is2faEnabled) {
    steps.push({
      priority: 1,
      category: input.language === "en" ? "Authentication" : input.language === "ru" ? "Аутентификация" : "Автентифікація",
      title: input.language === "en"
        ? "Enable TOTP 2FA on every critical account"
        : input.language === "ru"
        ? "Включить TOTP-2FA на всех критичных аккаунтах"
        : "Увімкнути TOTP-2FA на всіх критичних акаунтах",
      description: input.language === "en"
        ? "Use an authenticator app, NOT SMS. SIM-swap attacks bypass SMS 2FA."
        : input.language === "ru"
        ? "Используйте authenticator-приложение, НЕ SMS. SIM-swap обходит SMS-2FA."
        : "Використовуйте authenticator-застосунок, НЕ SMS. SIM-swap обходить SMS-2FA.",
      estMinutes: 20,
      external: [
        { label: "Aegis (Android)", url: "https://getaegis.app" },
        { label: "Raivo (iOS)", url: "https://raivo-otp.com" },
      ],
    });
  }

  if (input.exposureType === "phone" || input.hasSimAccess) {
    steps.push({
      priority: 1,
      category: input.language === "en" ? "Phone & SIM" : input.language === "ru" ? "Телефон и SIM" : "Телефон і SIM",
      title: input.language === "en"
        ? "Set up SIM-port lock with your carrier"
        : input.language === "ru"
        ? "Установите SIM-блокировку у оператора связи"
        : "Встановіть SIM-блокування у оператора зв'язку",
      description: input.language === "en"
        ? "Call your carrier and request a port-out PIN. This blocks SIM-swap attacks. Disable call forwarding."
        : input.language === "ru"
        ? "Позвоните оператору и запросите PIN на смену SIM. Это блокирует SIM-swap. Отключите переадресацию вызовов."
        : "Зателефонуйте оператору та запитайте PIN на зміну SIM. Це блокує SIM-swap. Вимкніть переадресацію викликів.",
      estMinutes: 15,
    });
  }

  if (input.exposureType === "wallet") {
    steps.push({
      priority: 1,
      category: input.language === "en" ? "Crypto" : input.language === "ru" ? "Крипто" : "Крипто",
      title: input.language === "en"
        ? "Move assets to a fresh hardware wallet"
        : input.language === "ru"
        ? "Переведите активы на новый аппаратный кошелёк"
        : "Переведіть активи на новий апаратний гаманець",
      description: input.language === "en"
        ? "Generate new seed phrase OFFLINE on a Ledger/Trezor. Never enter the old seed on any device."
        : input.language === "ru"
        ? "Сгенерируйте новый seed OFFLINE на Ledger/Trezor. Никогда не вводите старый seed нигде."
        : "Згенеруйте нову seed-фразу OFFLINE на Ledger/Trezor. Ніколи не вводьте стару seed-фразу ніде.",
      estMinutes: 60,
      external: [
        { label: "Ledger", url: "https://www.ledger.com" },
        { label: "Trezor", url: "https://trezor.io" },
      ],
    });
    steps.push({
      priority: 2,
      category: input.language === "en" ? "Crypto" : input.language === "ru" ? "Крипто" : "Крипто",
      title: input.language === "en"
        ? "Revoke all token approvals"
        : input.language === "ru"
        ? "Отзовите все разрешения токенов"
        : "Відкличте всі дозволи токенів",
      description: input.language === "en"
        ? "Use revoke.cash to find and remove all dApp approvals on Ethereum, Polygon, BSC, etc."
        : input.language === "ru"
        ? "Используйте revoke.cash для отзыва всех разрешений dApp на Ethereum, Polygon, BSC и др."
        : "Використовуйте revoke.cash для відкликання всіх дозволів dApp на Ethereum, Polygon, BSC та інших.",
      estMinutes: 20,
      external: [{ label: "revoke.cash", url: "https://revoke.cash" }],
    });
  }

  if (input.affectedServices.length > 0) {
    steps.push({
      priority: 2,
      category: input.language === "en" ? "Sessions" : input.language === "ru" ? "Сессии" : "Сесії",
      title: input.language === "en"
        ? `Revoke all active sessions on: ${input.affectedServices.join(", ")}`
        : input.language === "ru"
        ? `Завершите все активные сессии на: ${input.affectedServices.join(", ")}`
        : `Завершіть усі активні сесії на: ${input.affectedServices.join(", ")}`,
      description: input.language === "en"
        ? "Each service has a 'sign out everywhere' option in security settings."
        : input.language === "ru"
        ? "У каждого сервиса есть опция «выйти со всех устройств» в настройках безопасности."
        : "У кожного сервісу є опція «вийти з усіх пристроїв» у налаштуваннях безпеки.",
      estMinutes: 15,
    });
  }

  if (input.hasFinancialAccess) {
    steps.push({
      priority: 1,
      category: input.language === "en" ? "Banking" : input.language === "ru" ? "Банкинг" : "Банкінг",
      title: input.language === "en"
        ? "Notify your bank fraud line"
        : input.language === "ru"
        ? "Уведомьте отдел мошенничества банка"
        : "Сповістіть відділ шахрайства банку",
      description: input.language === "en"
        ? "Request transaction monitoring increase, freeze cards if needed, enable per-transaction confirmation."
        : input.language === "ru"
        ? "Запросите усиление мониторинга, заморозьте карты при необходимости, включите подтверждение каждой транзакции."
        : "Запитайте посилення моніторингу, заморозьте картки за потреби, увімкніть підтвердження кожної транзакції.",
      estMinutes: 20,
    });
  }

  steps.push({
    priority: input.hasSensitiveData ? 2 : 3,
    category: input.language === "en" ? "Monitoring" : input.language === "ru" ? "Мониторинг" : "Моніторинг",
    title: input.language === "en"
      ? "Set up DARKSHARE Sentinel monitoring"
      : input.language === "ru"
      ? "Настройте DARKSHARE Sentinel мониторинг"
      : "Налаштуйте DARKSHARE Sentinel моніторинг",
    description: input.language === "en"
      ? "Add your email/phone/wallet to /monitoring — receive instant Telegram alerts on new leaks."
      : input.language === "ru"
      ? "Добавьте email/телефон/кошелёк в /monitoring — получайте мгновенные оповещения в Telegram о новых утечках."
      : "Додайте email/телефон/гаманець у /monitoring — отримуйте миттєві сповіщення в Telegram про нові утечки.",
    estMinutes: 5,
    external: [{ label: "DARKSHARE Monitoring", url: "/monitoring" }],
  });

  steps.push({
    priority: 3,
    category: input.language === "en" ? "Documentation" : input.language === "ru" ? "Документирование" : "Документування",
    title: input.language === "en"
      ? "Document the incident timeline"
      : input.language === "ru"
      ? "Задокументируйте таймлайн инцидента"
      : "Задокументуйте таймлайн інциденту",
    description: input.language === "en"
      ? "Save screenshots, dates, scope. Required if you need to file a complaint or claim insurance."
      : input.language === "ru"
      ? "Сохраните скриншоты, даты, scope. Понадобится для жалобы или страхового возмещения."
      : "Збережіть скріншоти, дати, scope. Знадобиться для скарги чи страхового відшкодування.",
    estMinutes: 30,
  });

  steps.push({
    priority: 3,
    category: input.language === "en" ? "Legal" : input.language === "ru" ? "Юридическое" : "Юридичне",
    title: input.language === "en"
      ? "Submit GDPR takedown requests"
      : input.language === "ru"
      ? "Подайте GDPR-запросы на удаление данных"
      : "Подайте GDPR-запити на видалення даних",
    description: input.language === "en"
      ? "Use DARKSHARE Takedown Generator to send formal data erasure letters to leak hosters and search engines."
      : input.language === "ru"
      ? "Используйте DARKSHARE Takedown Generator чтобы отправить официальные требования об удалении хостерам утечек и поисковикам."
      : "Використовуйте DARKSHARE Takedown Generator щоб надіслати офіційні вимоги про видалення хостерам утечок і пошуковикам.",
    estMinutes: 15,
    external: [{ label: "Takedown Generator", url: "/takedown" }],
  });

  steps.sort((a, b) => a.priority - b.priority);

  const summary =
    riskLevel === "LOW" ? L.sumLow :
    riskLevel === "MEDIUM" ? L.sumMed :
    riskLevel === "HIGH" ? L.sumHigh : L.sumCrit;

  return {
    riskLevel,
    summary,
    steps,
    legalNote: L.legalNote,
  };
}
