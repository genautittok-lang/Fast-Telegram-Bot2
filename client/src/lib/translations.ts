export type Language = "en" | "uk" | "ru" | "es" | "de";

export interface TranslationSchema {
  nav: {
    dashboard: string;
    history: string;
    monitoring: string;
    referral: string;
    pricing: string;
    account: string;
  };
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    back: string;
    submit: string;
    save: string;
    delete: string;
    search: string;
    close: string;
    copy: string;
    copied: string;
    viewAll: string;
    learnMore: string;
    comingSoon: string;
  };
  auth: {
    login: string;
    logout: string;
    welcome: string;
    signIn: string;
    signInWith: string;
    signInTelegram: string;
    signInGoogle: string;
    noAccount: string;
    createAccount: string;
    loginTitle: string;
    loginSubtitle: string;
    protectFrom: string;
    cyberThreats: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    plans: string;
    features: string;
    subscribe: string;
    free: string;
    pro: string;
    enterprise: string;
    monthly: string;
    yearly: string;
    popular: string;
    savePercent: string;
    currentPlan: string;
    upgrade: string;
    requestsPerDay: string;
    unlimitedRequests: string;
    allModules: string;
    prioritySupport: string;
    apiAccess: string;
    customIntegrations: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    checkTypes: {
      ip: string;
      wallet: string;
      email: string;
      phone: string;
      domain: string;
      url: string;
      cve: string;
      hash: string;
      username: string;
      bot: string;
    };
    riskLevels: {
      low: string;
      medium: string;
      high: string;
      critical: string;
    };
    recentChecks: string;
    noChecks: string;
    runCheck: string;
    analyzing: string;
    results: string;
    riskScore: string;
    findings: string;
    sources: string;
    downloadPdf: string;
    addToMonitor: string;
    newCheck: string;
    selectModule: string;
  };
  account: {
    title: string;
    profile: string;
    settings: string;
    telegramId: string;
    username: string;
    tier: string;
    requestsLeft: string;
    streak: string;
    streakDays: string;
    language: string;
    notifications: string;
    sessions: string;
    security: string;
    syncInfo: string;
    editProfile: string;
    changePassword: string;
    totalChecks: string;
    activeMonitors: string;
    achievements: string;
  };
  landing: {
    hero: {
      badge: string;
      title: string;
      titleHighlight: string;
      description: string;
    };
    features: {
      title: string;
      protection: string;
      modules: string;
      instant: string;
      realTimeAnalysis: string;
      resultInSeconds: string;
    };
    stats: {
      users: string;
      monitors: string;
      threats: string;
      today: string;
    };
    cta: {
      webDashboard: string;
      telegramBot: string;
      getStarted: string;
      freeStart: string;
      apiIntegration: string;
    };
    activity: string;
    topHunters: string;
    realtime: string;
    trusted: string;
  };
  monitoring: {
    title: string;
    activeMonitors: string;
    addMonitor: string;
    noMonitors: string;
    noMonitorsHint: string;
    lastCheck: string;
    status: {
      active: string;
      paused: string;
    };
    alertsThisWeek: string;
    lastAlert: string;
    delete: string;
    howItWorks: string;
    learnAbout: string;
  };
  history: {
    title: string;
    noHistory: string;
    filter: string;
    all: string;
    today: string;
    thisWeek: string;
    thisMonth: string;
    exportCsv: string;
    exportJson: string;
    viewReport: string;
  };
  referral: {
    title: string;
    yourCode: string;
    yourLink: string;
    referralsCount: string;
    earnings: string;
    invite: string;
    howItWorks: string;
    copyLink: string;
    shareWith: string;
    rewards: string;
    pending: string;
  };
  time: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    waiting: string;
  };
  errors: {
    networkError: string;
    unauthorized: string;
    notFound: string;
    serverError: string;
    invalidInput: string;
    limitReached: string;
  };
}

export const translations: Record<Language, TranslationSchema> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      history: "History",
      monitoring: "Monitoring",
      referral: "Referral",
      pricing: "Pricing",
      account: "Account",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      back: "Back",
      submit: "Submit",
      save: "Save",
      delete: "Delete",
      search: "Search",
      close: "Close",
      copy: "Copy",
      copied: "Copied!",
      viewAll: "View All",
      learnMore: "Learn More",
      comingSoon: "Coming Soon",
    },
    auth: {
      login: "Login",
      logout: "Logout",
      welcome: "Welcome",
      signIn: "Sign In",
      signInWith: "Sign in with",
      signInTelegram: "Sign in with Telegram",
      signInGoogle: "Sign in with Google",
      noAccount: "Don't have an account?",
      createAccount: "Create Account",
      loginTitle: "Account Login",
      loginSubtitle: "Authorize via Telegram to access dashboard",
      protectFrom: "Protect yourself from",
      cyberThreats: "cyber threats",
    },
    pricing: {
      title: "Pricing Plans",
      subtitle: "Choose the plan that fits your needs",
      plans: "Plans",
      features: "Features",
      subscribe: "Subscribe",
      free: "Free",
      pro: "Pro",
      enterprise: "Enterprise",
      monthly: "Monthly",
      yearly: "Yearly",
      popular: "Most Popular",
      savePercent: "Save 20%",
      currentPlan: "Current Plan",
      upgrade: "Upgrade",
      requestsPerDay: "requests/day",
      unlimitedRequests: "Unlimited requests",
      allModules: "All modules",
      prioritySupport: "Priority support",
      apiAccess: "API access",
      customIntegrations: "Custom integrations",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Risk Intelligence Platform",
      checkTypes: {
        ip: "IP/GEO",
        wallet: "Crypto Wallet",
        email: "Email",
        phone: "Phone",
        domain: "Domain",
        url: "URL",
        cve: "CVE",
        hash: "Hash",
        username: "Username",
        bot: "Bot Token",
      },
      riskLevels: {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
      },
      recentChecks: "Recent Checks",
      noChecks: "No checks yet",
      runCheck: "Run Check",
      analyzing: "Analyzing...",
      results: "Results",
      riskScore: "Risk Score",
      findings: "Findings",
      sources: "Sources",
      downloadPdf: "Download PDF",
      addToMonitor: "Add to Monitor",
      newCheck: "New Check",
      selectModule: "Select module",
    },
    account: {
      title: "Account",
      profile: "Profile",
      settings: "Settings",
      telegramId: "Telegram ID",
      username: "Username",
      tier: "Tier",
      requestsLeft: "Requests Left",
      streak: "Streak",
      streakDays: "days streak",
      language: "Language",
      notifications: "Notifications",
      sessions: "Sessions",
      security: "Security",
      syncInfo: "This profile is synced between bot and website",
      editProfile: "Edit Profile",
      changePassword: "Change Password",
      totalChecks: "Total Checks",
      activeMonitors: "Active Monitors",
      achievements: "Achievements",
    },
    landing: {
      hero: {
        badge: "Professional OSINT Platform",
        title: "Cybersecurity &",
        titleHighlight: "Threat Intelligence",
        description: "10+ modules for comprehensive analysis: IPs, domains, wallets, emails, phones, malware, CVE & leak databases. Integration with leading security APIs.",
      },
      features: {
        title: "Features",
        protection: "Full Protection",
        modules: "10 Modules",
        instant: "Instant Check",
        realTimeAnalysis: "Real-time threat analysis",
        resultInSeconds: "Result in seconds",
      },
      stats: {
        users: "Users",
        monitors: "Monitors",
        threats: "Threats",
        today: "Today",
      },
      cta: {
        webDashboard: "Web Dashboard",
        telegramBot: "Telegram Bot",
        getStarted: "Get Started",
        freeStart: "Free to start",
        apiIntegration: "API integration",
      },
      activity: "Live Activity",
      topHunters: "Top Hunters",
      realtime: "Real-time",
      trusted: "Trusted by professionals",
    },
    monitoring: {
      title: "Monitoring",
      activeMonitors: "Active Monitors",
      addMonitor: "Add Monitor",
      noMonitors: "No active monitors",
      noMonitorsHint: "Add an object to track changes",
      lastCheck: "Last Check",
      status: {
        active: "Active",
        paused: "Paused",
      },
      alertsThisWeek: "Alerts this week",
      lastAlert: "Last Alert",
      delete: "Delete",
      howItWorks: "How does monitoring work?",
      learnAbout: "Learn about features",
    },
    history: {
      title: "History",
      noHistory: "No history yet",
      filter: "Filter",
      all: "All",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      exportCsv: "Export CSV",
      exportJson: "Export JSON",
      viewReport: "View Report",
    },
    referral: {
      title: "Referral Program",
      yourCode: "Your Code",
      yourLink: "Your Link",
      referralsCount: "Referrals",
      earnings: "Earnings",
      invite: "Invite friends and earn bonuses!",
      howItWorks: "How it works",
      copyLink: "Copy Link",
      shareWith: "Share with",
      rewards: "Rewards",
      pending: "Pending",
    },
    time: {
      justNow: "just now",
      minutesAgo: "min ago",
      hoursAgo: "h ago",
      daysAgo: "d ago",
      waiting: "Waiting",
    },
    errors: {
      networkError: "Network error. Please try again.",
      unauthorized: "Please log in to continue.",
      notFound: "Not found",
      serverError: "Server error. Please try again later.",
      invalidInput: "Invalid input",
      limitReached: "Request limit reached",
    },
  },
  uk: {
    nav: {
      dashboard: "Панель",
      history: "Історія",
      monitoring: "Моніторинг",
      referral: "Реферали",
      pricing: "Тарифи",
      account: "Акаунт",
    },
    common: {
      loading: "Завантаження...",
      error: "Помилка",
      success: "Успіх",
      cancel: "Скасувати",
      back: "Назад",
      submit: "Надіслати",
      save: "Зберегти",
      delete: "Видалити",
      search: "Пошук",
      close: "Закрити",
      copy: "Копіювати",
      copied: "Скопійовано!",
      viewAll: "Переглянути все",
      learnMore: "Дізнатися більше",
      comingSoon: "Скоро",
    },
    auth: {
      login: "Вхід",
      logout: "Вийти",
      welcome: "Ласкаво просимо",
      signIn: "Увійти",
      signInWith: "Увійти через",
      signInTelegram: "Увійти через Telegram",
      signInGoogle: "Увійти через Google",
      noAccount: "Немає акаунту?",
      createAccount: "Створити акаунт",
      loginTitle: "Вхід в акаунт",
      loginSubtitle: "Авторизуйтесь через Telegram для доступу",
      protectFrom: "Захистіть себе від",
      cyberThreats: "кіберзагроз",
    },
    pricing: {
      title: "Тарифні плани",
      subtitle: "Оберіть план, що підходить вам",
      plans: "Плани",
      features: "Можливості",
      subscribe: "Підписатися",
      free: "Безкоштовно",
      pro: "Pro",
      enterprise: "Enterprise",
      monthly: "Щомісяця",
      yearly: "Щорічно",
      popular: "Найпопулярніший",
      savePercent: "Економія 20%",
      currentPlan: "Поточний план",
      upgrade: "Покращити",
      requestsPerDay: "запитів/день",
      unlimitedRequests: "Безлімітні запити",
      allModules: "Всі модулі",
      prioritySupport: "Пріоритетна підтримка",
      apiAccess: "API доступ",
      customIntegrations: "Кастомні інтеграції",
    },
    dashboard: {
      title: "Панель керування",
      subtitle: "Платформа аналізу ризиків",
      checkTypes: {
        ip: "IP/GEO",
        wallet: "Крипто гаманець",
        email: "Email",
        phone: "Телефон",
        domain: "Домен",
        url: "URL",
        cve: "CVE",
        hash: "Хеш",
        username: "Username",
        bot: "Bot Token",
      },
      riskLevels: {
        low: "Низький",
        medium: "Середній",
        high: "Високий",
        critical: "Критичний",
      },
      recentChecks: "Останні перевірки",
      noChecks: "Ще немає перевірок",
      runCheck: "Запустити перевірку",
      analyzing: "Аналіз...",
      results: "Результати",
      riskScore: "Рівень ризику",
      findings: "Знахідки",
      sources: "Джерела",
      downloadPdf: "Завантажити PDF",
      addToMonitor: "Додати до моніторингу",
      newCheck: "Нова перевірка",
      selectModule: "Обрати модуль",
    },
    account: {
      title: "Акаунт",
      profile: "Профіль",
      settings: "Налаштування",
      telegramId: "Telegram ID",
      username: "Нікнейм",
      tier: "Тариф",
      requestsLeft: "Залишок запитів",
      streak: "Серія",
      streakDays: "днів поспіль",
      language: "Мова",
      notifications: "Сповіщення",
      sessions: "Сесії",
      security: "Безпека",
      syncInfo: "Цей профіль синхронізований між ботом та сайтом",
      editProfile: "Редагувати профіль",
      changePassword: "Змінити пароль",
      totalChecks: "Всього перевірок",
      activeMonitors: "Активних моніторів",
      achievements: "Досягнення",
    },
    landing: {
      hero: {
        badge: "Професійна OSINT платформа",
        title: "Кібербезпека та",
        titleHighlight: "Розвідка загроз",
        description: "10+ модулів для комплексного аналізу: IP, домени, гаманці, email, телефони, malware, CVE та leak databases. Інтеграція з провідними API безпеки.",
      },
      features: {
        title: "Можливості",
        protection: "Повний захист",
        modules: "10 модулів",
        instant: "Миттєва перевірка",
        realTimeAnalysis: "Аналіз загроз в реальному часі",
        resultInSeconds: "Результат за секунди",
      },
      stats: {
        users: "Користувачі",
        monitors: "Моніторинг",
        threats: "Загрози",
        today: "Сьогодні",
      },
      cta: {
        webDashboard: "Панель керування",
        telegramBot: "Telegram бот",
        getStarted: "Почати",
        freeStart: "Безкоштовний старт",
        apiIntegration: "API інтеграція",
      },
      activity: "Активність",
      topHunters: "Топ хантери",
      realtime: "Real-time",
      trusted: "Довіра професіоналів",
    },
    monitoring: {
      title: "Моніторинг",
      activeMonitors: "Активних моніторів",
      addMonitor: "Додати монітор",
      noMonitors: "Немає активних моніторів",
      noMonitorsHint: "Додайте об'єкт для відстеження змін",
      lastCheck: "Остання перевірка",
      status: {
        active: "Активний",
        paused: "Пауза",
      },
      alertsThisWeek: "Сповіщень за тиждень",
      lastAlert: "Останнє сповіщення",
      delete: "Видалити",
      howItWorks: "Як працює моніторинг?",
      learnAbout: "Дізнайтесь про можливості",
    },
    history: {
      title: "Історія",
      noHistory: "Історія порожня",
      filter: "Фільтр",
      all: "Всі",
      today: "Сьогодні",
      thisWeek: "Цей тиждень",
      thisMonth: "Цей місяць",
      exportCsv: "Експорт CSV",
      exportJson: "Експорт JSON",
      viewReport: "Переглянути звіт",
    },
    referral: {
      title: "Реферальна програма",
      yourCode: "Ваш код",
      yourLink: "Ваше посилання",
      referralsCount: "Рефералів",
      earnings: "Заробіток",
      invite: "Запросіть друзів та отримуйте бонуси!",
      howItWorks: "Як це працює",
      copyLink: "Копіювати посилання",
      shareWith: "Поділитися з",
      rewards: "Нагороди",
      pending: "Очікується",
    },
    time: {
      justNow: "щойно",
      minutesAgo: "хв тому",
      hoursAgo: "год тому",
      daysAgo: "д тому",
      waiting: "Очікує",
    },
    errors: {
      networkError: "Помилка мережі. Спробуйте ще раз.",
      unauthorized: "Увійдіть для продовження.",
      notFound: "Не знайдено",
      serverError: "Помилка сервера. Спробуйте пізніше.",
      invalidInput: "Невірні дані",
      limitReached: "Ліміт запитів вичерпано",
    },
  },
  ru: {
    nav: {
      dashboard: "Панель",
      history: "История",
      monitoring: "Мониторинг",
      referral: "Рефералы",
      pricing: "Тарифы",
      account: "Аккаунт",
    },
    common: {
      loading: "Загрузка...",
      error: "Ошибка",
      success: "Успех",
      cancel: "Отмена",
      back: "Назад",
      submit: "Отправить",
      save: "Сохранить",
      delete: "Удалить",
      search: "Поиск",
      close: "Закрыть",
      copy: "Копировать",
      copied: "Скопировано!",
      viewAll: "Смотреть все",
      learnMore: "Узнать больше",
      comingSoon: "Скоро",
    },
    auth: {
      login: "Вход",
      logout: "Выйти",
      welcome: "Добро пожаловать",
      signIn: "Войти",
      signInWith: "Войти через",
      signInTelegram: "Войти через Telegram",
      signInGoogle: "Войти через Google",
      noAccount: "Нет аккаунта?",
      createAccount: "Создать аккаунт",
      loginTitle: "Вход в аккаунт",
      loginSubtitle: "Авторизуйтесь через Telegram для доступа",
      protectFrom: "Защитите себя от",
      cyberThreats: "киберугроз",
    },
    pricing: {
      title: "Тарифные планы",
      subtitle: "Выберите план, который вам подходит",
      plans: "Планы",
      features: "Возможности",
      subscribe: "Подписаться",
      free: "Бесплатно",
      pro: "Pro",
      enterprise: "Enterprise",
      monthly: "Ежемесячно",
      yearly: "Ежегодно",
      popular: "Популярный",
      savePercent: "Экономия 20%",
      currentPlan: "Текущий план",
      upgrade: "Улучшить",
      requestsPerDay: "запросов/день",
      unlimitedRequests: "Безлимитные запросы",
      allModules: "Все модули",
      prioritySupport: "Приоритетная поддержка",
      apiAccess: "API доступ",
      customIntegrations: "Кастомные интеграции",
    },
    dashboard: {
      title: "Панель управления",
      subtitle: "Платформа анализа рисков",
      checkTypes: {
        ip: "IP/GEO",
        wallet: "Крипто кошелек",
        email: "Email",
        phone: "Телефон",
        domain: "Домен",
        url: "URL",
        cve: "CVE",
        hash: "Хеш",
        username: "Username",
        bot: "Bot Token",
      },
      riskLevels: {
        low: "Низкий",
        medium: "Средний",
        high: "Высокий",
        critical: "Критический",
      },
      recentChecks: "Последние проверки",
      noChecks: "Пока нет проверок",
      runCheck: "Запустить проверку",
      analyzing: "Анализ...",
      results: "Результаты",
      riskScore: "Уровень риска",
      findings: "Находки",
      sources: "Источники",
      downloadPdf: "Скачать PDF",
      addToMonitor: "Добавить в мониторинг",
      newCheck: "Новая проверка",
      selectModule: "Выбрать модуль",
    },
    account: {
      title: "Аккаунт",
      profile: "Профиль",
      settings: "Настройки",
      telegramId: "Telegram ID",
      username: "Никнейм",
      tier: "Тариф",
      requestsLeft: "Осталось запросов",
      streak: "Серия",
      streakDays: "дней подряд",
      language: "Язык",
      notifications: "Уведомления",
      sessions: "Сессии",
      security: "Безопасность",
      syncInfo: "Этот профиль синхронизирован между ботом и сайтом",
      editProfile: "Редактировать профиль",
      changePassword: "Изменить пароль",
      totalChecks: "Всего проверок",
      activeMonitors: "Активных мониторов",
      achievements: "Достижения",
    },
    landing: {
      hero: {
        badge: "Профессиональная OSINT платформа",
        title: "Кибербезопасность и",
        titleHighlight: "Разведка угроз",
        description: "10+ модулей для комплексного анализа: IP, домены, кошельки, email, телефоны, malware, CVE и leak databases. Интеграция с ведущими API безопасности.",
      },
      features: {
        title: "Возможности",
        protection: "Полная защита",
        modules: "10 модулей",
        instant: "Мгновенная проверка",
        realTimeAnalysis: "Анализ угроз в реальном времени",
        resultInSeconds: "Результат за секунды",
      },
      stats: {
        users: "Пользователи",
        monitors: "Мониторинг",
        threats: "Угрозы",
        today: "Сегодня",
      },
      cta: {
        webDashboard: "Панель управления",
        telegramBot: "Telegram бот",
        getStarted: "Начать",
        freeStart: "Бесплатный старт",
        apiIntegration: "API интеграция",
      },
      activity: "Активность",
      topHunters: "Топ хантеры",
      realtime: "Real-time",
      trusted: "Доверие профессионалов",
    },
    monitoring: {
      title: "Мониторинг",
      activeMonitors: "Активных мониторов",
      addMonitor: "Добавить монитор",
      noMonitors: "Нет активных мониторов",
      noMonitorsHint: "Добавьте объект для отслеживания изменений",
      lastCheck: "Последняя проверка",
      status: {
        active: "Активный",
        paused: "Пауза",
      },
      alertsThisWeek: "Уведомлений за неделю",
      lastAlert: "Последнее уведомление",
      delete: "Удалить",
      howItWorks: "Как работает мониторинг?",
      learnAbout: "Узнайте о возможностях",
    },
    history: {
      title: "История",
      noHistory: "История пуста",
      filter: "Фильтр",
      all: "Все",
      today: "Сегодня",
      thisWeek: "Эта неделя",
      thisMonth: "Этот месяц",
      exportCsv: "Экспорт CSV",
      exportJson: "Экспорт JSON",
      viewReport: "Посмотреть отчет",
    },
    referral: {
      title: "Реферальная программа",
      yourCode: "Ваш код",
      yourLink: "Ваша ссылка",
      referralsCount: "Рефералов",
      earnings: "Заработок",
      invite: "Пригласите друзей и получайте бонусы!",
      howItWorks: "Как это работает",
      copyLink: "Копировать ссылку",
      shareWith: "Поделиться с",
      rewards: "Награды",
      pending: "Ожидается",
    },
    time: {
      justNow: "только что",
      minutesAgo: "мин назад",
      hoursAgo: "ч назад",
      daysAgo: "д назад",
      waiting: "Ожидает",
    },
    errors: {
      networkError: "Ошибка сети. Попробуйте еще раз.",
      unauthorized: "Войдите для продолжения.",
      notFound: "Не найдено",
      serverError: "Ошибка сервера. Попробуйте позже.",
      invalidInput: "Неверные данные",
      limitReached: "Лимит запросов исчерпан",
    },
  },
  es: {
    nav: {
      dashboard: "Panel",
      history: "Historial",
      monitoring: "Monitoreo",
      referral: "Referidos",
      pricing: "Precios",
      account: "Cuenta",
    },
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      cancel: "Cancelar",
      back: "Atrás",
      submit: "Enviar",
      save: "Guardar",
      delete: "Eliminar",
      search: "Buscar",
      close: "Cerrar",
      copy: "Copiar",
      copied: "¡Copiado!",
      viewAll: "Ver todo",
      learnMore: "Saber más",
      comingSoon: "Próximamente",
    },
    auth: {
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      welcome: "Bienvenido",
      signIn: "Entrar",
      signInWith: "Entrar con",
      signInTelegram: "Entrar con Telegram",
      signInGoogle: "Entrar con Google",
      noAccount: "¿No tienes cuenta?",
      createAccount: "Crear cuenta",
      loginTitle: "Iniciar sesión",
      loginSubtitle: "Autorízate a través de Telegram para acceder",
      protectFrom: "Protégete de las",
      cyberThreats: "ciberamenazas",
    },
    pricing: {
      title: "Planes de precios",
      subtitle: "Elige el plan que mejor se adapte",
      plans: "Planes",
      features: "Características",
      subscribe: "Suscribirse",
      free: "Gratis",
      pro: "Pro",
      enterprise: "Enterprise",
      monthly: "Mensual",
      yearly: "Anual",
      popular: "Más popular",
      savePercent: "Ahorra 20%",
      currentPlan: "Plan actual",
      upgrade: "Mejorar",
      requestsPerDay: "solicitudes/día",
      unlimitedRequests: "Solicitudes ilimitadas",
      allModules: "Todos los módulos",
      prioritySupport: "Soporte prioritario",
      apiAccess: "Acceso API",
      customIntegrations: "Integraciones personalizadas",
    },
    dashboard: {
      title: "Panel de control",
      subtitle: "Plataforma de inteligencia de riesgos",
      checkTypes: {
        ip: "IP/GEO",
        wallet: "Billetera Crypto",
        email: "Email",
        phone: "Teléfono",
        domain: "Dominio",
        url: "URL",
        cve: "CVE",
        hash: "Hash",
        username: "Username",
        bot: "Bot Token",
      },
      riskLevels: {
        low: "Bajo",
        medium: "Medio",
        high: "Alto",
        critical: "Crítico",
      },
      recentChecks: "Verificaciones recientes",
      noChecks: "Sin verificaciones aún",
      runCheck: "Ejecutar verificación",
      analyzing: "Analizando...",
      results: "Resultados",
      riskScore: "Puntuación de riesgo",
      findings: "Hallazgos",
      sources: "Fuentes",
      downloadPdf: "Descargar PDF",
      addToMonitor: "Añadir al monitor",
      newCheck: "Nueva verificación",
      selectModule: "Seleccionar módulo",
    },
    account: {
      title: "Cuenta",
      profile: "Perfil",
      settings: "Configuración",
      telegramId: "Telegram ID",
      username: "Nombre de usuario",
      tier: "Nivel",
      requestsLeft: "Solicitudes restantes",
      streak: "Racha",
      streakDays: "días de racha",
      language: "Idioma",
      notifications: "Notificaciones",
      sessions: "Sesiones",
      security: "Seguridad",
      syncInfo: "Este perfil está sincronizado entre el bot y el sitio web",
      editProfile: "Editar perfil",
      changePassword: "Cambiar contraseña",
      totalChecks: "Total de verificaciones",
      activeMonitors: "Monitores activos",
      achievements: "Logros",
    },
    landing: {
      hero: {
        badge: "Plataforma OSINT profesional",
        title: "Ciberseguridad e",
        titleHighlight: "Inteligencia de amenazas",
        description: "10+ módulos para análisis integral: IPs, dominios, billeteras, emails, teléfonos, malware, CVE y bases de datos de filtraciones. Integración con APIs de seguridad líderes.",
      },
      features: {
        title: "Características",
        protection: "Protección completa",
        modules: "10 módulos",
        instant: "Verificación instantánea",
        realTimeAnalysis: "Análisis de amenazas en tiempo real",
        resultInSeconds: "Resultado en segundos",
      },
      stats: {
        users: "Usuarios",
        monitors: "Monitores",
        threats: "Amenazas",
        today: "Hoy",
      },
      cta: {
        webDashboard: "Panel web",
        telegramBot: "Bot de Telegram",
        getStarted: "Comenzar",
        freeStart: "Comienza gratis",
        apiIntegration: "Integración API",
      },
      activity: "Actividad en vivo",
      topHunters: "Top cazadores",
      realtime: "Tiempo real",
      trusted: "Confianza de profesionales",
    },
    monitoring: {
      title: "Monitoreo",
      activeMonitors: "Monitores activos",
      addMonitor: "Añadir monitor",
      noMonitors: "Sin monitores activos",
      noMonitorsHint: "Añade un objeto para rastrear cambios",
      lastCheck: "Última verificación",
      status: {
        active: "Activo",
        paused: "Pausado",
      },
      alertsThisWeek: "Alertas esta semana",
      lastAlert: "Última alerta",
      delete: "Eliminar",
      howItWorks: "¿Cómo funciona el monitoreo?",
      learnAbout: "Aprende sobre las características",
    },
    history: {
      title: "Historial",
      noHistory: "Sin historial aún",
      filter: "Filtrar",
      all: "Todo",
      today: "Hoy",
      thisWeek: "Esta semana",
      thisMonth: "Este mes",
      exportCsv: "Exportar CSV",
      exportJson: "Exportar JSON",
      viewReport: "Ver informe",
    },
    referral: {
      title: "Programa de referidos",
      yourCode: "Tu código",
      yourLink: "Tu enlace",
      referralsCount: "Referidos",
      earnings: "Ganancias",
      invite: "¡Invita amigos y gana bonos!",
      howItWorks: "Cómo funciona",
      copyLink: "Copiar enlace",
      shareWith: "Compartir con",
      rewards: "Recompensas",
      pending: "Pendiente",
    },
    time: {
      justNow: "ahora mismo",
      minutesAgo: "min atrás",
      hoursAgo: "h atrás",
      daysAgo: "d atrás",
      waiting: "Esperando",
    },
    errors: {
      networkError: "Error de red. Inténtalo de nuevo.",
      unauthorized: "Inicia sesión para continuar.",
      notFound: "No encontrado",
      serverError: "Error del servidor. Inténtalo más tarde.",
      invalidInput: "Entrada inválida",
      limitReached: "Límite de solicitudes alcanzado",
    },
  },
  de: {
    nav: {
      dashboard: "Dashboard",
      history: "Verlauf",
      monitoring: "Überwachung",
      referral: "Empfehlungen",
      pricing: "Preise",
      account: "Konto",
    },
    common: {
      loading: "Laden...",
      error: "Fehler",
      success: "Erfolg",
      cancel: "Abbrechen",
      back: "Zurück",
      submit: "Absenden",
      save: "Speichern",
      delete: "Löschen",
      search: "Suchen",
      close: "Schließen",
      copy: "Kopieren",
      copied: "Kopiert!",
      viewAll: "Alle anzeigen",
      learnMore: "Mehr erfahren",
      comingSoon: "Demnächst",
    },
    auth: {
      login: "Anmelden",
      logout: "Abmelden",
      welcome: "Willkommen",
      signIn: "Einloggen",
      signInWith: "Anmelden mit",
      signInTelegram: "Mit Telegram anmelden",
      signInGoogle: "Mit Google anmelden",
      noAccount: "Kein Konto?",
      createAccount: "Konto erstellen",
      loginTitle: "Konto-Login",
      loginSubtitle: "Autorisieren Sie sich über Telegram für den Zugriff",
      protectFrom: "Schützen Sie sich vor",
      cyberThreats: "Cyber-Bedrohungen",
    },
    pricing: {
      title: "Preispläne",
      subtitle: "Wählen Sie den Plan, der zu Ihnen passt",
      plans: "Pläne",
      features: "Funktionen",
      subscribe: "Abonnieren",
      free: "Kostenlos",
      pro: "Pro",
      enterprise: "Enterprise",
      monthly: "Monatlich",
      yearly: "Jährlich",
      popular: "Beliebteste",
      savePercent: "20% sparen",
      currentPlan: "Aktueller Plan",
      upgrade: "Upgrade",
      requestsPerDay: "Anfragen/Tag",
      unlimitedRequests: "Unbegrenzte Anfragen",
      allModules: "Alle Module",
      prioritySupport: "Prioritäts-Support",
      apiAccess: "API-Zugang",
      customIntegrations: "Individuelle Integrationen",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Risiko-Intelligenz-Plattform",
      checkTypes: {
        ip: "IP/GEO",
        wallet: "Krypto-Wallet",
        email: "E-Mail",
        phone: "Telefon",
        domain: "Domain",
        url: "URL",
        cve: "CVE",
        hash: "Hash",
        username: "Benutzername",
        bot: "Bot Token",
      },
      riskLevels: {
        low: "Niedrig",
        medium: "Mittel",
        high: "Hoch",
        critical: "Kritisch",
      },
      recentChecks: "Letzte Prüfungen",
      noChecks: "Noch keine Prüfungen",
      runCheck: "Prüfung starten",
      analyzing: "Analysiere...",
      results: "Ergebnisse",
      riskScore: "Risikobewertung",
      findings: "Erkenntnisse",
      sources: "Quellen",
      downloadPdf: "PDF herunterladen",
      addToMonitor: "Zur Überwachung hinzufügen",
      newCheck: "Neue Prüfung",
      selectModule: "Modul auswählen",
    },
    account: {
      title: "Konto",
      profile: "Profil",
      settings: "Einstellungen",
      telegramId: "Telegram ID",
      username: "Benutzername",
      tier: "Stufe",
      requestsLeft: "Verbleibende Anfragen",
      streak: "Serie",
      streakDays: "Tage in Folge",
      language: "Sprache",
      notifications: "Benachrichtigungen",
      sessions: "Sitzungen",
      security: "Sicherheit",
      syncInfo: "Dieses Profil ist zwischen Bot und Website synchronisiert",
      editProfile: "Profil bearbeiten",
      changePassword: "Passwort ändern",
      totalChecks: "Gesamte Prüfungen",
      activeMonitors: "Aktive Überwachungen",
      achievements: "Erfolge",
    },
    landing: {
      hero: {
        badge: "Professionelle OSINT-Plattform",
        title: "Cybersicherheit &",
        titleHighlight: "Bedrohungsanalyse",
        description: "10+ Module für umfassende Analyse: IPs, Domains, Wallets, E-Mails, Telefone, Malware, CVE & Leak-Datenbanken. Integration mit führenden Sicherheits-APIs.",
      },
      features: {
        title: "Funktionen",
        protection: "Vollständiger Schutz",
        modules: "10 Module",
        instant: "Sofortige Prüfung",
        realTimeAnalysis: "Echtzeit-Bedrohungsanalyse",
        resultInSeconds: "Ergebnis in Sekunden",
      },
      stats: {
        users: "Benutzer",
        monitors: "Überwachungen",
        threats: "Bedrohungen",
        today: "Heute",
      },
      cta: {
        webDashboard: "Web-Dashboard",
        telegramBot: "Telegram Bot",
        getStarted: "Loslegen",
        freeStart: "Kostenlos starten",
        apiIntegration: "API-Integration",
      },
      activity: "Live-Aktivität",
      topHunters: "Top-Jäger",
      realtime: "Echtzeit",
      trusted: "Vertrauen von Profis",
    },
    monitoring: {
      title: "Überwachung",
      activeMonitors: "Aktive Überwachungen",
      addMonitor: "Monitor hinzufügen",
      noMonitors: "Keine aktiven Überwachungen",
      noMonitorsHint: "Fügen Sie ein Objekt hinzu, um Änderungen zu verfolgen",
      lastCheck: "Letzte Prüfung",
      status: {
        active: "Aktiv",
        paused: "Pausiert",
      },
      alertsThisWeek: "Warnungen diese Woche",
      lastAlert: "Letzte Warnung",
      delete: "Löschen",
      howItWorks: "Wie funktioniert die Überwachung?",
      learnAbout: "Erfahren Sie mehr über die Funktionen",
    },
    history: {
      title: "Verlauf",
      noHistory: "Noch kein Verlauf",
      filter: "Filter",
      all: "Alle",
      today: "Heute",
      thisWeek: "Diese Woche",
      thisMonth: "Dieser Monat",
      exportCsv: "CSV exportieren",
      exportJson: "JSON exportieren",
      viewReport: "Bericht anzeigen",
    },
    referral: {
      title: "Empfehlungsprogramm",
      yourCode: "Ihr Code",
      yourLink: "Ihr Link",
      referralsCount: "Empfehlungen",
      earnings: "Verdienst",
      invite: "Laden Sie Freunde ein und verdienen Sie Boni!",
      howItWorks: "So funktioniert es",
      copyLink: "Link kopieren",
      shareWith: "Teilen mit",
      rewards: "Belohnungen",
      pending: "Ausstehend",
    },
    time: {
      justNow: "gerade eben",
      minutesAgo: "Min. her",
      hoursAgo: "Std. her",
      daysAgo: "T. her",
      waiting: "Wartend",
    },
    errors: {
      networkError: "Netzwerkfehler. Bitte versuchen Sie es erneut.",
      unauthorized: "Bitte melden Sie sich an, um fortzufahren.",
      notFound: "Nicht gefunden",
      serverError: "Serverfehler. Bitte versuchen Sie es später erneut.",
      invalidInput: "Ungültige Eingabe",
      limitReached: "Anfragelimit erreicht",
    },
  },
};

export const languageNames: Record<Language, string> = {
  en: "English",
  uk: "Українська",
  ru: "Русский",
  es: "Español",
  de: "Deutsch",
};

export const languageFlags: Record<Language, string> = {
  en: "🇬🇧",
  uk: "🇺🇦",
  ru: "🇷🇺",
  es: "🇪🇸",
  de: "🇩🇪",
};
