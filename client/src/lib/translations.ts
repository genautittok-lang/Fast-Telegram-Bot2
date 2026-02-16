export type Language = "en" | "uk" | "ru" | "es" | "de";

export interface TranslationSchema {
  nav: {
    dashboard: string;
    history: string;
    monitoring: string;
    referral: string;
    pricing: string;
    account: string;
    support: string;
    apiDocs: string;
    teams: string;
    widget: string;
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
    loginSuccess: string;
    loginError: string;
    telegramFailed: string;
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
    paymentUSDT: string;
    forBeginners: string;
    forProfessionals: string;
    forTeams: string;
    perMonth: string;
    perYear: string;
    startFree: string;
    payAmount: string;
    submitApplication: string;
    applicationSent: string;
    applicationSentDesc: string;
    paymentNote: string;
    tronNetwork: string;
    instantProcessing: string;
    selectNetwork: string;
    tonDiscount: string;
    yearlySubscription: string;
    monthlySubscription: string;
    addressCopied: string;
    addressCopiedDesc: string;
    copyError: string;
    copyErrorDesc: string;
    enterTxHash: string;
    txHashOptional: string;
    txHashPlaceholder: string;
    planLabel: string;
    checksPerDay15: string;
    basicAnalysis: string;
    telegramBotAccess: string;
    checkHistory: string;
    checksPerDay100: string;
    aiAnalysis: string;
    pdfReports: string;
    realTimeMonitoring: string;
    apiBeta: string;
    unlimitedChecks: string;
    fullApiAccess: string;
    support247: string;
    customReports: string;
    whiteLabelIntegration: string;
    slaGuarantees: string;
    teamAccess: string;
    forGroups: string;
    newLabel: string;
    groupsAllEnterprise: string;
    groupsTeamMembers: string;
    groupsSharedReports: string;
    groupsTeamDashboard: string;
    groupsRoleManagement: string;
    groupsCentralBilling: string;
    groupsActivityLog: string;
    promoCode: string;
    promoApplied: string;
    promoInvalid: string;
    promoAppliedLabel: string;
    apply: string;
    uploadScreenshot: string;
    chooseFile: string;
    timerExpired: string;
    timerExpiredDesc: string;
    enterTxOrScreenshot: string;
    expired: string;
    selectPaymentMethod: string;
    cardPaymentDesc: string;
    bankConversionNote: string;
    payWithGooglePay: string;
    payWithApplePay: string;
    continue: string;
    totalAmount: string;
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
      card: string;
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
    checkDescriptions: {
      ip: string;
      wallet: string;
      email: string;
      phone: string;
      domain: string;
      url: string;
      bot: string;
      cve: string;
      hash: string;
      username: string;
      card: string;
    };
    checkShortDescs: {
      ip: string;
      wallet: string;
      email: string;
      phone: string;
      domain: string;
      url: string;
      bot: string;
      cve: string;
      hash: string;
      username: string;
      card: string;
    };
    services: {
      ip: {
        geolocation: string;
        geolocationDesc: string;
        ispInfo: string;
        ispInfoDesc: string;
        proxyVpn: string;
        proxyVpnDesc: string;
        blacklists: string;
        blacklistsDesc: string;
      };
      wallet: {
        patternAnalysis: string;
        patternAnalysisDesc: string;
        mixerDetection: string;
        mixerDetectionDesc: string;
        multiChain: string;
        multiChainDesc: string;
        exchangeUid: string;
        exchangeUidDesc: string;
      };
      email: {
        domainCheck: string;
        domainCheckDesc: string;
        disposable: string;
        disposableDesc: string;
        breachCheck: string;
        breachCheckDesc: string;
        osintScan: string;
        osintScanDesc: string;
      };
      phone: {
        countryCode: string;
        countryCodeDesc: string;
        carrierId: string;
        carrierIdDesc: string;
        formatCheck: string;
        formatCheckDesc: string;
        typeDetection: string;
        typeDetectionDesc: string;
      };
      domain: {
        tldAnalysis: string;
        tldAnalysisDesc: string;
        typosquatting: string;
        typosquattingDesc: string;
        patterns: string;
        patternsDesc: string;
        reputation: string;
        reputationDesc: string;
      };
      url: {
        protocol: string;
        protocolDesc: string;
        shorteners: string;
        shortenersDesc: string;
        phishing: string;
        phishingDesc: string;
        redirectScan: string;
        redirectScanDesc: string;
      };
      bot: {
        tokenVerify: string;
        tokenVerifyDesc: string;
        botInfo: string;
        botInfoDesc: string;
        permissions: string;
        permissionsDesc: string;
        capabilities: string;
        capabilitiesDesc: string;
      };
      cve: {
        nvdLookup: string;
        nvdLookupDesc: string;
        cvssScore: string;
        cvssScoreDesc: string;
        cisaKev: string;
        cisaKevDesc: string;
        recommendations: string;
        recommendationsDesc: string;
      };
      hash: {
        malwareBazaar: string;
        malwareBazaarDesc: string;
        urlhaus: string;
        urlhausDesc: string;
        virusTotal: string;
        virusTotalDesc: string;
        signatureMatch: string;
        signatureMatchDesc: string;
      };
      username: {
        githubProfile: string;
        githubProfileDesc: string;
        socialMedia: string;
        socialMediaDesc: string;
        forums: string;
        forumsDesc: string;
        dataBreaches: string;
        dataBreachesDesc: string;
      };
      card: {
        binLookup: string;
        binLookupDesc: string;
        bankInfo: string;
        bankInfoDesc: string;
        cardType: string;
        cardTypeDesc: string;
        country: string;
        countryDesc: string;
      };
    };
    bulkMode: string;
    singleMode: string;
    bulkPlaceholder: string;
    bulkMax: string;
    bulkComplete: string;
    bulkChecked: string;
    limitReachedTitle: string;
    limitReachedDesc: string;
    enterValueError: string;
    checkError: string;
    resultCopied: string;
    resultCopiedDesc: string;
    copyFailed: string;
    requestSent: string;
    requestSentDesc: string;
    enterTxHash: string;
    paymentAddress: string;
    txHashLabel: string;
    txHashPlaceholder: string;
    submitRequestBtn: string;
    requestWillBeSent: string;
    keyboardShortcuts: string;
    requestsRemaining: string;
    statistics: string;
    checks: string;
    checksToday: string;
    threats: string;
    recentChecksLabel: string;
    systemLoading: string;
    systemActive: string;
    whatIsAnalyzed: string;
    checkProgress: string;
    scanInProgress: string;
    bulkScan: string;
    scan: string;
    profile: string;
    subscription: string;
    quickActions: string;
    repeatLastChecks: string;
    all: string;
    enabled: string;
    disabled: string;
    values: string;
    securityScanner: string;
    selectTypeAndEnter: string;
    online: string;
    botSyncOk: string;
    checkPlaceholders: {
      ip: string;
      wallet: string;
      email: string;
      phone: string;
      domain: string;
      url: string;
      bot: string;
      cve: string;
      hash: string;
      username: string;
      card: string;
    };
    checkLabels: {
      ip: string;
      wallet: string;
      email: string;
      phone: string;
      domain: string;
      url: string;
      bot: string;
      cve: string;
      hash: string;
      username: string;
      card: string;
    };
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
    mostUsedTypes: string;
    emailNotifications: string;
    emailNotificationsDesc: string;
    telegramNotifications: string;
    telegramNotificationsDesc: string;
    threatAlerts: string;
    threatAlertsDesc: string;
    updateNotifications: string;
    updateNotificationsDesc: string;
    activeSessions: string;
    currentSession: string;
    lastActive: string;
    riskHunter: string;
    riskHunterDesc: string;
    scamSlayer: string;
    scamSlayerDesc: string;
    streakMaster: string;
    streakMasterDesc: string;
    referralKing: string;
    referralKingDesc: string;
    completed: string;
    interfaceLanguage: string;
    chooseLanguage: string;
    apiKey: string;
    forIntegration: string;
    upgradeForApi: string;
    apiAvailable: string;
    copyKey: string;
    keyCopied: string;
    regenerateKey: string;
    apiKeyDesc: string;
    subscriptionTitle: string;
    currentPlan: string;
    basicPlan: string;
    professionalPlan: string;
    corporatePlan: string;
    upgradePlan: string;
    requests: string;
    remaining: string;
    lastLogin: string;
    sessionsManage: string;
    manage: string;
    referrals: string;
    top: string;
    ref: string;
    sessionDeleted: string;
    sessionDeleteError: string;
    settingsSaved: string;
    settingsSaveError: string;
    apiKeyRegenerated: string;
    apiKeyRegenerateError: string;
    active: string;
    connected: string;
    deleteAllSessions: string;
    allSessionsDeleted: string;
    allSessionsDeleteError: string;
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
    riskTrendUp: string;
    riskTrendDown: string;
    riskTrendStable: string;
    totalMonitors: string;
    alertsTotal: string;
    lastAlertLabel: string;
    addNewMonitor: string;
    addObjectPlaceholder: string;
    selectType: string;
    addButton: string;
    monitorCreated: string;
    monitorCreatedDesc: string;
    monitorError: string;
    monitorErrorDesc: string;
    deleted: string;
    deletedDesc: string;
    enterValueError: string;
    monitoring247: string;
    monitoring247Desc: string;
    instantAlerts: string;
    instantAlertsDesc: string;
    riskTracking: string;
    riskTrackingDesc: string;
    dataSecurity: string;
    dataSecurityDesc: string;
    typeIp: string;
    typeWallet: string;
    typeEmail: string;
    typePhone: string;
    typeDomain: string;
    typeUrl: string;
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
    totalChecks: string;
    thisWeekChecks: string;
    criticalRisks: string;
    pdfDownloaded: string;
    searchPlaceholder: string;
    allTime: string;
    loadingHistory: string;
    nothingFound: string;
    changeFilters: string;
    clearFilters: string;
    emptyHistory: string;
    emptyHistoryHint: string;
    startChecking: string;
    showingResults: string;
    newCheck: string;
    copied: string;
    copiedDesc: string;
    copyError: string;
    riskAll: string;
    riskLow: string;
    riskMedium: string;
    riskHigh: string;
    riskCritical: string;
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
    shareMessage: string;
    codeCopied: string;
    codeCopiedDesc: string;
    linkCopied: string;
    linkCopiedDesc: string;
    copyErrorTitle: string;
    copyErrorDesc: string;
    totalReferrals: string;
    totalBonus: string;
    pendingBonusLabel: string;
    earnedRequests: string;
    starterBonus: string;
    activeBonus: string;
    ambassadorBonus: string;
    eliteBonus: string;
    noReferrals: string;
    inviteFriendsHint: string;
    yourReferrals: string;
    joined: string;
    referralLink: string;
    referralProgram: string;
    inviteFriendsDesc: string;
    yourRefCode: string;
    rewardLevels: string;
    current: string;
    bonus: string;
    waiting: string;
    referralsLabel: string;
    howItWorksTitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    invitedUsers: string;
    copied: string;
    copyBtn: string;
    reversh: {
      title: string;
      description: string;
      name: string;
      phone: string;
      email: string;
      method: string;
      volume: string;
      submit: string;
      success: string;
      successDesc: string;
    };
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
  footer: {
    description: string;
    legal: string;
    termsOfService: string;
    privacyPolicy: string;
    contact: string;
    disclaimer: string;
    disclaimerText: string;
    allRightsReserved: string;
    terms: string;
    privacy: string;
    systemsOnline: string;
  };
  mobile: {
    home: string;
    checks: string;
    checksToday: string;
    history: string;
    monitoring: string;
    referrals: string;
    profile: string;
    pricing: string;
    signInTelegram: string;
    telegramBot: string;
    logout: string;
  };
  threatFeed: {
    title: string;
    subtitle: string;
    autoRefresh: string;
    threatsCount: string;
    typeCve: string;
    typeMalware: string;
    typePhishing: string;
    typeBotnet: string;
    typeRansomware: string;
    typeApt: string;
  };
  support: {
    title: string;
    subtitle: string;
    contactInfo: string;
    email: string;
    formTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    contactLabel: string;
    contactPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    sent: string;
    sentDesc: string;
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
      support: "Support",
      apiDocs: "API Docs",
      teams: "Teams",
      widget: "Widget",
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
      viewAll: "View all",
      learnMore: "Learn more",
      comingSoon: "Coming soon",
    },
    auth: {
      login: "Login",
      logout: "Logout",
      welcome: "Welcome",
      signIn: "Sign In",
      signInWith: "Sign in with",
      signInTelegram: "Sign in with Telegram",
      signInGoogle: "Sign in with Google",
      noAccount: "No account?",
      createAccount: "Create account",
      loginTitle: "Account Login",
      loginSubtitle: "Authorize via Telegram for access",
      protectFrom: "Protect yourself from",
      cyberThreats: "cyber threats",
      loginSuccess: "Login successful",
      loginError: "Login error",
      telegramFailed: "Telegram authentication failed",
    },
    pricing: {
      title: "Pricing Plans",
      subtitle: "Choose the plan that suits you",
      plans: "Plans",
      features: "Features",
      subscribe: "Subscribe",
      free: "Free",
      pro: "Pro ($10)",
      enterprise: "Enterprise ($35)",
      monthly: "Monthly",
      yearly: "Yearly",
      popular: "Most Popular",
      savePercent: "Save 20%",
      currentPlan: "Current Plan",
      upgrade: "Upgrade",
      requestsPerDay: "Requests/Day",
      unlimitedRequests: "Unlimited Requests",
      allModules: "All Modules",
      prioritySupport: "Priority Support",
      apiAccess: "API Access",
      customIntegrations: "Custom Integrations",
      paymentUSDT: "Crypto Payment",
      forBeginners: "For beginners",
      forProfessionals: "For professionals",
      forTeams: "For teams and business",
      perMonth: "/month",
      perYear: "/year",
      startFree: "Start for free",
      payAmount: "Pay",
      submitApplication: "Submit application for",
      applicationSent: "Application submitted!",
      applicationSentDesc: "The administrator will verify your payment shortly",
      paymentNote: "Payment via cryptocurrency. The application will be sent to the administrator for confirmation.",
      tronNetwork: "TRON Network",
      instantProcessing: "Instant processing",
      selectNetwork: "Select network",
      tonDiscount: "TON discount",
      yearlySubscription: "Yearly subscription",
      monthlySubscription: "Monthly subscription",
      addressCopied: "Copied!",
      addressCopiedDesc: "Wallet address copied to clipboard",
      copyError: "Error",
      copyErrorDesc: "Failed to copy address",
      enterTxHash: "Enter TX Hash of the transaction",
      txHashOptional: "TX Hash (optional)",
      txHashPlaceholder: "Enter TX Hash of the transaction...",
      planLabel: "Plan",
      checksPerDay15: "5 checks per day",
      basicAnalysis: "Basic risk analysis",
      telegramBotAccess: "Telegram bot access",
      checkHistory: "Check history",
      checksPerDay100: "50 checks per day",
      aiAnalysis: "Extended AI analysis",
      pdfReports: "PDF reports with QR code",
      realTimeMonitoring: "Real-time monitoring",
      apiBeta: "API access (beta)",
      unlimitedChecks: "Unlimited checks",
      fullApiAccess: "Full API access",
      support247: "Dedicated 24/7 support",
      customReports: "Custom reports",
      whiteLabelIntegration: "White-label integration",
      slaGuarantees: "SLA guarantees",
      teamAccess: "Team access",
      forGroups: "For collaborative teams",
      newLabel: "New",
      groupsAllEnterprise: "All Enterprise features included",
      groupsTeamMembers: "Up to 10 team members",
      groupsSharedReports: "Shared report library",
      groupsTeamDashboard: "Team analytics dashboard",
      groupsRoleManagement: "Role-based access control",
      groupsCentralBilling: "Centralized billing",
      groupsActivityLog: "Team activity log",
      promoCode: "Promo code",
      promoApplied: "Promo code applied!",
      promoInvalid: "Invalid promo code",
      promoAppliedLabel: "discount applied",
      apply: "Apply",
      uploadScreenshot: "Upload payment screenshot",
      chooseFile: "Choose file...",
      timerExpired: "Session expired",
      timerExpiredDesc: "Please reopen the payment window",
      enterTxOrScreenshot: "Enter TX Hash or upload a screenshot",
      expired: "Expired",
      selectPaymentMethod: "Select payment method",
      cardPaymentDesc: "Pay with any Visa/Mastercard. Amount in UAH, your bank converts automatically.",
      bankConversionNote: "Amount is in Ukrainian hryvnia (UAH). Your bank will automatically convert from your currency at the current exchange rate.",
      payWithGooglePay: "Pay with Google Pay",
      payWithApplePay: "Pay with Apple Pay",
      continue: "Continue",
      totalAmount: "Total",
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
        card: "Card BIN",
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
      addToMonitor: "Add to Monitoring",
      newCheck: "New Check",
      selectModule: "Select Module",
      checkDescriptions: {
        ip: "IP address analysis via ip-api.com for geolocation, ISP provider identification, and VPN/Proxy service detection",
        wallet: "Cryptocurrency wallet analysis: address patterns, mixer service detection, support for ETH/BTC/TRX/SOL/LTC/XRP/DOGE and Bybit/Binance UID",
        email: "Email OSINT analysis: domain validation, disposable address detection, data breach checks",
        phone: "Phone number analysis: country code identification, carrier detection, format validation",
        domain: "Domain intelligence: TLD analysis, typosquatting attack detection, suspicious pattern identification",
        url: "URL scanning: protocol analysis, shortener service detection, phishing pattern detection",
        bot: "Telegram Bot Token verification: API validation, bot information, token security analysis",
        cve: "CVE vulnerability check via NVD NIST API: CVSS scoring, description, recommendations, CISA KEV catalog",
        hash: "MD5/SHA1/SHA256 file hash check for malware via MalwareBazaar, URLhaus, VirusTotal",
        username: "OSINT username search across platforms: GitHub, social media, forums",
        card: "Bank card BIN number validation: issuing bank, card type, country, and risk identification",
      },
      checkShortDescs: {
        ip: "Geolocation, provider, blacklists",
        wallet: "Transactions, mixers, sanctions",
        email: "Data breaches, linked accounts",
        phone: "Carrier, region, spam rating",
        domain: "WHOIS, DNS, reputation",
        url: "Malware, phishing, redirects",
        bot: "Validity, permissions, security",
        cve: "Vulnerabilities, CVSS, recommendations",
        hash: "Malware, signatures, reputation",
        username: "Profiles, social media, leaks",
        card: "Bank, card type, country",
      },
      services: {
        ip: {
          geolocation: "Geolocation",
          geolocationDesc: "Country, city, coordinates",
          ispInfo: "ISP Info",
          ispInfoDesc: "Provider, ASN, organization",
          proxyVpn: "Proxy/VPN",
          proxyVpnDesc: "Proxy and VPN detection",
          blacklists: "Blacklists",
          blacklistsDesc: "Spam list check",
        },
        wallet: {
          patternAnalysis: "Pattern Analysis",
          patternAnalysisDesc: "Address format analysis",
          mixerDetection: "Mixer Detection",
          mixerDetectionDesc: "Tornado Cash detection & more",
          multiChain: "Multi-Chain",
          multiChainDesc: "ETH, BTC, TRX, SOL, LTC, XRP, DOGE",
          exchangeUid: "Exchange UID",
          exchangeUidDesc: "Bybit, Binance UID check",
        },
        email: {
          domainCheck: "Domain Check",
          domainCheckDesc: "MX and domain validation",
          disposable: "Disposable",
          disposableDesc: "Temporary email detection",
          breachCheck: "Breach Check",
          breachCheckDesc: "Data breach verification",
          osintScan: "OSINT Scan",
          osintScanDesc: "Linked account search",
        },
        phone: {
          countryCode: "Country Code",
          countryCodeDesc: "Country identification by code",
          carrierId: "Carrier ID",
          carrierIdDesc: "Carrier identification",
          formatCheck: "Format Check",
          formatCheckDesc: "Number format validation",
          typeDetection: "Type Detection",
          typeDetectionDesc: "Mobile / landline",
        },
        domain: {
          tldAnalysis: "TLD Analysis",
          tldAnalysisDesc: "Domain zone analysis",
          typosquatting: "Typosquatting",
          typosquattingDesc: "Similar domain detection",
          patterns: "Patterns",
          patternsDesc: "Suspicious name patterns",
          reputation: "Reputation",
          reputationDesc: "Reputation check",
        },
        url: {
          protocol: "Protocol",
          protocolDesc: "HTTP/HTTPS protocol analysis",
          shorteners: "Shorteners",
          shortenersDesc: "bit.ly, t.co detection & more",
          phishing: "Phishing",
          phishingDesc: "Phishing URL detection",
          redirectScan: "Redirect Scan",
          redirectScanDesc: "Redirect analysis",
        },
        bot: {
          tokenVerify: "Token Verify",
          tokenVerifyDesc: "Token validity check",
          botInfo: "Bot Info",
          botInfoDesc: "Username, name, bot ID",
          permissions: "Permissions",
          permissionsDesc: "Group access rights",
          capabilities: "Capabilities",
          capabilitiesDesc: "Inline, WebApp, business",
        },
        cve: {
          nvdLookup: "NVD Lookup",
          nvdLookupDesc: "NVD NIST database search",
          cvssScore: "CVSS Score",
          cvssScoreDesc: "Criticality assessment",
          cisaKev: "CISA KEV",
          cisaKevDesc: "Active vulnerability catalog",
          recommendations: "Recommendations",
          recommendationsDesc: "Fix recommendations",
        },
        hash: {
          malwareBazaar: "MalwareBazaar",
          malwareBazaarDesc: "Malicious file database",
          urlhaus: "URLhaus",
          urlhausDesc: "URL association check",
          virusTotal: "VirusTotal",
          virusTotalDesc: "Multi-scanner antivirus",
          signatureMatch: "Signature Match",
          signatureMatchDesc: "Known signature search",
        },
        username: {
          githubProfile: "GitHub Profile",
          githubProfileDesc: "Profile and repositories",
          socialMedia: "Social Media",
          socialMediaDesc: "Social networks",
          forums: "Forums",
          forumsDesc: "Forums and communities",
          dataBreaches: "Data Breaches",
          dataBreachesDesc: "Data breach check",
        },
        card: {
          binLookup: "BIN Lookup",
          binLookupDesc: "BIN number information",
          bankInfo: "Bank Info",
          bankInfoDesc: "Card issuing bank",
          cardType: "Card Type",
          cardTypeDesc: "Debit/credit",
          country: "Country",
          countryDesc: "Issuing country",
        },
      },
      bulkMode: "Bulk Mode",
      singleMode: "Single Mode",
      bulkPlaceholder: "Enter values (one per line, max 20)",
      bulkMax: "Maximum 20 values at once",
      bulkComplete: "Bulk check completed",
      bulkChecked: "Checked {count} objects",
      limitReachedTitle: "Limit reached",
      limitReachedDesc: "Your free requests have expired. Choose a plan to continue.",
      enterValueError: "Enter a value to check",
      checkError: "Failed to perform the check",
      resultCopied: "Copied!",
      resultCopiedDesc: "Check result copied to clipboard",
      copyFailed: "Failed to copy",
      requestSent: "Request sent!",
      requestSentDesc: "Request #{id} created. Await administrator confirmation.",
      enterTxHash: "Enter transaction TX Hash",
      paymentAddress: "Payment address (TRC20 USDT)",
      txHashLabel: "TX Hash",
      txHashPlaceholder: "Enter transaction TX Hash...",
      submitRequestBtn: "Submit request",
      requestWillBeSent: "The request will be sent to the administrator in Telegram for confirmation",
      keyboardShortcuts: "Keyboard Shortcuts",
      requestsRemaining: "Requests remaining",
      statistics: "Statistics",
      checks: "Checks",
      checksToday: "Today",
      threats: "Threats",
      recentChecksLabel: "Recent checks",
      systemLoading: "Loading system...",
      systemActive: "System active",
      whatIsAnalyzed: "What is analyzed",
      checkProgress: "Check progress...",
      scanInProgress: "Scanning in progress...",
      bulkScan: "Bulk Scan",
      scan: "Scan",
      profile: "Profile",
      subscription: "Subscription",
      quickActions: "Quick Actions",
      repeatLastChecks: "Repeat last checks with one click",
      all: "All",
      enabled: "Enabled",
      disabled: "Disabled",
      values: "values",
      securityScanner: "Security Scanner",
      selectTypeAndEnter: "Select check type and enter data for analysis",
      online: "Online",
      botSyncOk: "Bot sync OK",
      checkPlaceholders: {
        ip: "8.8.8.8",
        wallet: "0x1234...abcd",
        email: "user@example.com",
        phone: "+380501234567",
        domain: "example.com",
        url: "https://example.com/path",
        bot: "123456789:ABC-DEF...",
        cve: "CVE-2024-1234",
        hash: "d41d8cd98f00b204e9800998ecf8427e",
        username: "johndoe",
        card: "411111",
      },
      checkLabels: {
        ip: "IP/GEO",
        wallet: "Crypto Wallet",
        email: "Email OSINT",
        phone: "Phone Lookup",
        domain: "Domain Intel",
        url: "URL Scanner",
        bot: "Bot Token",
        cve: "CVE Scan",
        hash: "Hash Check",
        username: "Username OSINT",
        card: "Card BIN",
      },
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
      streakDays: "Days in a row",
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
      mostUsedTypes: "Most Used Types",
      emailNotifications: "Email notifications",
      emailNotificationsDesc: "To email",
      telegramNotifications: "Telegram",
      telegramNotificationsDesc: "Messages",
      threatAlerts: "Threats",
      threatAlertsDesc: "Instant alerts",
      updateNotifications: "Updates",
      updateNotificationsDesc: "New features",
      activeSessions: "Active Sessions",
      currentSession: "Current Session",
      lastActive: "Last Active",
      riskHunter: "Risk Hunter",
      riskHunterDesc: "10 checks",
      scamSlayer: "Scam Slayer",
      scamSlayerDesc: "50 checks",
      streakMaster: "Streak Master",
      streakMasterDesc: "7 days in a row",
      referralKing: "Referral King",
      referralKingDesc: "5 referrals",
      completed: "Done",
      interfaceLanguage: "Interface language",
      chooseLanguage: "Choose a convenient language",
      apiKey: "API key",
      forIntegration: "For integration",
      upgradeForApi: "Upgrade for API",
      apiAvailable: "API available",
      copyKey: "Copy",
      keyCopied: "Copied!",
      regenerateKey: "Regenerate",
      apiKeyDesc: "Use this key to access the DARKSHARE API",
      subscriptionTitle: "Subscription",
      currentPlan: "Current plan",
      basicPlan: "Basic plan",
      professionalPlan: "Professional plan",
      corporatePlan: "Corporate plan",
      upgradePlan: "Upgrade plan",
      requests: "Requests",
      remaining: "Remaining",
      lastLogin: "Last login",
      sessionsManage: "Sessions",
      manage: "Manage",
      referrals: "Referrals",
      top: "Top",
      ref: "Ref",
      sessionDeleted: "Session terminated",
      sessionDeleteError: "Failed to terminate session",
      settingsSaved: "Settings saved",
      settingsSaveError: "Error saving settings",
      apiKeyRegenerated: "API key regenerated",
      apiKeyRegenerateError: "Error regenerating key",
      active: "Active",
      connected: "Connected",
      deleteAllSessions: "Delete all other sessions",
      allSessionsDeleted: "All other sessions deleted",
      allSessionsDeleteError: "Error deleting sessions",
    },
    landing: {
      hero: {
        badge: "Professional OSINT Platform",
        title: "Cybersecurity &",
        titleHighlight: "Threat Analysis",
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
        freeStart: "Start Free",
        apiIntegration: "API Integration",
      },
      activity: "Live Activity",
      topHunters: "Top Hunters",
      realtime: "Realtime",
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
      learnAbout: "Learn about the features",
      riskTrendUp: "Increased",
      riskTrendDown: "Decreased",
      riskTrendStable: "Stable",
      totalMonitors: "Active monitors",
      alertsTotal: "Alerts this week",
      lastAlertLabel: "Last alert",
      addNewMonitor: "Add new monitor",
      addObjectPlaceholder: "Enter value...",
      selectType: "Select type",
      addButton: "Add",
      monitorCreated: "Monitor created",
      monitorCreatedDesc: "Object added to monitoring",
      monitorError: "Error",
      monitorErrorDesc: "Failed to create monitor",
      deleted: "Deleted",
      deletedDesc: "Monitor deleted",
      enterValueError: "Enter a value for monitoring",
      monitoring247: "Automatic checks",
      monitoring247Desc: "The system automatically checks added objects every 5 minutes for risk level changes.",
      instantAlerts: "Instant notifications",
      instantAlertsDesc: "When the risk level changes, you will receive a notification in Telegram and by email.",
      riskTracking: "Trend tracking",
      riskTrackingDesc: "Track how the risk level of objects changes over time for decision making.",
      dataSecurity: "Data security",
      dataSecurityDesc: "All monitoring data is stored encrypted and inaccessible to third parties.",
      typeIp: "IP Address",
      typeWallet: "Wallet",
      typeEmail: "Email",
      typePhone: "Phone",
      typeDomain: "Domain",
      typeUrl: "URL",
    },
    history: {
      title: "History",
      noHistory: "No history yet",
      filter: "Filter",
      all: "All",
      today: "Today",
      thisWeek: "This week",
      thisMonth: "This month",
      exportCsv: "Export CSV",
      exportJson: "Export JSON",
      viewReport: "View Report",
      totalChecks: "Total checks",
      thisWeekChecks: "This week",
      criticalRisks: "Critical risks",
      pdfDownloaded: "PDF downloaded",
      searchPlaceholder: "Search by target...",
      allTime: "All time",
      loadingHistory: "Loading history...",
      nothingFound: "Nothing found",
      changeFilters: "Try changing filters or search query",
      clearFilters: "Clear filters",
      emptyHistory: "History is empty",
      emptyHistoryHint: "Run your first check to see results here",
      startChecking: "Start checking",
      showingResults: "Showing {filtered} of {total} records",
      newCheck: "New check",
      copied: "Copied",
      copiedDesc: "Target copied to clipboard",
      copyError: "Failed to copy",
      riskAll: "All",
      riskLow: "Low",
      riskMedium: "Medium",
      riskHigh: "High",
      riskCritical: "Critical",
    },
    referral: {
      title: "Referral Program",
      yourCode: "Your Code",
      yourLink: "Your Link",
      referralsCount: "Referrals",
      earnings: "Earnings",
      invite: "Invite friends and earn bonuses!",
      howItWorks: "How it works",
      copyLink: "Copy link",
      shareWith: "Share with",
      rewards: "Rewards",
      pending: "Pending",
      shareMessage: "Join DARKSHARE - the best OSINT service! Use my code {code} for bonuses!",
      codeCopied: "Copied!",
      codeCopiedDesc: "Referral code copied to clipboard",
      linkCopied: "Copied!",
      linkCopiedDesc: "Referral link copied to clipboard",
      copyErrorTitle: "Copy error",
      copyErrorDesc: "Failed to copy. Try again.",
      totalReferrals: "Invited",
      totalBonus: "Earned",
      pendingBonusLabel: "Pending",
      earnedRequests: "requests",
      starterBonus: "+5 requests",
      activeBonus: "+10 requests + 5% discount",
      ambassadorBonus: "+30 requests + 10% discount",
      eliteBonus: "Unlimited requests + 20% discount",
      noReferrals: "No referrals yet",
      inviteFriendsHint: "Share your referral code with friends and get bonuses for each invited user",
      yourReferrals: "Invited users",
      joined: "Joined",
      referralLink: "Referral link",
      referralProgram: "Referral program",
      inviteFriendsDesc: "Invite friends and get bonuses",
      yourRefCode: "Your referral code",
      rewardLevels: "Reward levels",
      current: "Current",
      bonus: "Bonus",
      waiting: "Waiting",
      referralsLabel: "referrals",
      howItWorksTitle: "How does it work?",
      step1: "Share your referral code or link with friends",
      step2: "When a friend registers with your code, they get +5 free requests",
      step3: "You get +3 requests for each invited user",
      step4: "Reach new levels for bigger bonuses and discounts",
      invitedUsers: "Invited users",
      copied: "Copied",
      copyBtn: "Copy",
      reversh: {
        title: "Reversh Partnership Program",
        description: "Earn up to 70% from attracted clients",
        name: "Your name",
        phone: "Phone number",
        email: "Email",
        method: "How do you plan to attract clients?",
        volume: "Expected monthly volume",
        submit: "Submit Application",
        success: "Application submitted!",
        successDesc: "Our team will contact you soon",
      },
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
      unauthorized: "Please sign in to continue.",
      notFound: "Not found",
      serverError: "Server error. Please try again later.",
      invalidInput: "Invalid input",
      limitReached: "Request limit reached",
    },
    footer: {
      description: "Professional platform for OSINT intelligence and cyber threat analysis. Secure and ethical open-source data collection.",
      legal: "Legal",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy",
      contact: "Contact",
      disclaimer: "Legal Disclaimer",
      disclaimerText: "DARKSHARE provides OSINT tools solely for legitimate cybersecurity purposes. Users are responsible for compliance with local laws. We collect only publicly available information.",
      allRightsReserved: "All rights reserved.",
      terms: "Terms",
      privacy: "Privacy",
      systemsOnline: "Systems Online",
    },
    mobile: {
      home: "Home",
      checks: "Checks",
      checksToday: "Today",
      history: "History",
      monitoring: "Monitoring",
      referrals: "Referrals",
      profile: "Profile",
      pricing: "Pricing",
      signInTelegram: "Sign In with Telegram",
      telegramBot: "Telegram Bot",
      logout: "Logout",
    },
    threatFeed: {
      title: "Live Threat Feed",
      subtitle: "Real-time CVEs and cyber threats",
      autoRefresh: "Auto-refresh every 5 min",
      threatsCount: "threats",
      typeCve: "CVE",
      typeMalware: "Malware",
      typePhishing: "Phishing",
      typeBotnet: "Botnet",
      typeRansomware: "Ransomware",
      typeApt: "APT",
    },
    support: {
      title: "Contact Support",
      subtitle: "Have a question or need help? Send us a message and we'll get back to you.",
      contactInfo: "Contact Information",
      email: "Support Email",
      formTitle: "Send a Request",
      nameLabel: "Your Name",
      namePlaceholder: "Enter your name",
      contactLabel: "Phone / Telegram / Email",
      contactPlaceholder: "How can we reach you?",
      messageLabel: "Message",
      messagePlaceholder: "Describe your issue or question...",
      sent: "Request Sent",
      sentDesc: "Our team will review your request and get back to you shortly.",
    },
  },
  uk: {
    nav: {
      dashboard: "Дашборд",
      history: "Історія",
      monitoring: "Моніторинг",
      referral: "Реферали",
      pricing: "Тарифи",
      account: "Акаунт",
      support: "Підтримка",
      apiDocs: "API Документація",
      teams: "Команди",
      widget: "Віджет",
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
      comingSoon: "Незабаром",
    },
    auth: {
      login: "Увійти",
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
      loginSuccess: "Вхід успішний",
      loginError: "Помилка входу",
      telegramFailed: "Помилка авторизації Telegram",
    },
    pricing: {
      title: "Тарифні плани",
      subtitle: "Обирай план, що підходить саме тобі",
      plans: "Плани",
      features: "Функції",
      subscribe: "Підписатися",
      free: "Безкоштовний",
      pro: "Pro ($10)",
      enterprise: "Enterprise ($35)",
      monthly: "Щомісяця",
      yearly: "Щорічно",
      popular: "Найпопулярніший",
      savePercent: "Економія 20%",
      currentPlan: "Поточний план",
      upgrade: "Оновити",
      requestsPerDay: "Запитів/день",
      unlimitedRequests: "Необмежені запити",
      allModules: "Всі модулі",
      prioritySupport: "Пріоритетна підтримка",
      apiAccess: "Доступ до API",
      customIntegrations: "Індивідуальні інтеграції",
      paymentUSDT: "Оплата криптовалютою",
      forBeginners: "Для початківців",
      forProfessionals: "Для професіоналів",
      forTeams: "Для команд та бізнесу",
      perMonth: "/місяць",
      perYear: "/рік",
      startFree: "Почати безкоштовно",
      payAmount: "Оплатити",
      submitApplication: "Подати заявку на",
      applicationSent: "Заявку подано!",
      applicationSentDesc: "Адміністратор перевірить вашу оплату найближчим часом",
      paymentNote: "Оплата криптовалютою. Заявка буде відправлена адміністратору для підтвердження.",
      tronNetwork: "TRON Network",
      instantProcessing: "Миттєва обробка",
      selectNetwork: "Оберіть мережу",
      tonDiscount: "Знижка TON",
      yearlySubscription: "Річна підписка",
      monthlySubscription: "Місячна підписка",
      addressCopied: "Скопійовано!",
      addressCopiedDesc: "Адресу гаманця скопійовано в буфер обміну",
      copyError: "Помилка",
      copyErrorDesc: "Не вдалося скопіювати адресу",
      enterTxHash: "Введіть TX Hash транзакції",
      txHashOptional: "TX Hash (опціонально)",
      txHashPlaceholder: "Введіть TX Hash транзакції...",
      planLabel: "План",
      checksPerDay15: "5 перевірок на день",
      basicAnalysis: "Базовий аналіз ризиків",
      telegramBotAccess: "Telegram бот доступ",
      checkHistory: "Історія перевірок",
      checksPerDay100: "50 перевірок на день",
      aiAnalysis: "Розширений аналіз з AI",
      pdfReports: "PDF звіти з QR-кодом",
      realTimeMonitoring: "Реальний моніторинг",
      apiBeta: "API доступ (бета)",
      unlimitedChecks: "Необмежені перевірки",
      fullApiAccess: "Повний API доступ",
      support247: "Виділена підтримка 24/7",
      customReports: "Кастомні звіти",
      whiteLabelIntegration: "White-label інтеграція",
      slaGuarantees: "SLA гарантії",
      teamAccess: "Командний доступ",
      forGroups: "Для спільних команд",
      newLabel: "Нове",
      groupsAllEnterprise: "Всі функції Enterprise включено",
      groupsTeamMembers: "До 10 учасників команди",
      groupsSharedReports: "Спільна бібліотека звітів",
      groupsTeamDashboard: "Командна аналітика",
      groupsRoleManagement: "Контроль доступу за ролями",
      groupsCentralBilling: "Централізована оплата",
      groupsActivityLog: "Журнал активності команди",
      promoCode: "Промокод",
      promoApplied: "Промокод застосовано!",
      promoInvalid: "Недійсний промокод",
      promoAppliedLabel: "знижку застосовано",
      apply: "Застосувати",
      uploadScreenshot: "Завантажити скріншот оплати",
      chooseFile: "Обрати файл...",
      timerExpired: "Сесія завершилась",
      timerExpiredDesc: "Будь ласка, відкрийте вікно оплати знову",
      enterTxOrScreenshot: "Введіть TX Hash або завантажте скріншот",
      expired: "Закінчився",
      selectPaymentMethod: "Оберіть спосіб оплати",
      cardPaymentDesc: "Оплата будь-якою картою Visa/Mastercard. Сума в гривнях, ваш банк конвертує автоматично.",
      bankConversionNote: "Сума вказана в українських гривнях (UAH). Ваш банк автоматично конвертує з вашої валюти за поточним курсом.",
      payWithGooglePay: "Оплатити через Google Pay",
      payWithApplePay: "Оплатити через Apple Pay",
      continue: "Продовжити",
      totalAmount: "Разом",
    },
    dashboard: {
      title: "Дашборд",
      subtitle: "Платформа аналізу ризиків",
      checkTypes: {
        ip: "IP/GEO",
        wallet: "Крипто-гаманець",
        email: "Email",
        phone: "Телефон",
        domain: "Домен",
        url: "URL",
        cve: "CVE",
        hash: "Hash",
        username: "Username",
        bot: "Bot Token",
        card: "Card BIN",
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
      checkDescriptions: {
        ip: "Аналіз IP-адреси через ip-api.com для визначення геолокації, ISP провайдера та виявлення VPN/Proxy сервісів",
        wallet: "Аналіз криптовалютних гаманців: патерни адрес, виявлення mixer-сервісів, підтримка ETH/BTC/TRX/SOL/LTC/XRP/DOGE та Bybit/Binance UID",
        email: "OSINT-аналіз email: валідація домену, виявлення disposable-адрес, перевірка на витоки даних (breaches)",
        phone: "Аналіз телефонних номерів: визначення коду країни, ідентифікація оператора зв'язку, валідація формату",
        domain: "Інтелект по домену: аналіз TLD, виявлення typosquatting-атак, пошук підозрілих патернів у назві",
        url: "Сканування URL: аналіз протоколу, виявлення shortener-сервісів, детекція фішингових патернів",
        bot: "Перевірка Telegram Bot Token: валідація через API, інформація про бота, аналіз можливостей та безпеки токену",
        cve: "Перевірка CVE вразливостей через NVD NIST API: CVSS скоринг, опис, рекомендації, CISA KEV каталог",
        hash: "Перевірка MD5/SHA1/SHA256 хешів файлів на malware через MalwareBazaar, URLhaus, VirusTotal",
        username: "OSINT пошук по username на різних платформах: GitHub, соціальні мережі, форуми",
        card: "Валідація BIN номера банківської картки: виявлення банку-емітента, типу картки, країни та можливих ризиків",
      },
      checkShortDescs: {
        ip: "Геолокація, провайдер, чорні списки",
        wallet: "Транзакції, mixers, санкції",
        email: "Витоки даних, пов'язані акаунти",
        phone: "Оператор, регіон, спам-рейтинг",
        domain: "WHOIS, DNS, репутація",
        url: "Malware, фішинг, редиректи",
        bot: "Валідність, права, безпека",
        cve: "Вразливості, CVSS, рекомендації",
        hash: "Malware, сигнатури, репутація",
        username: "Профілі, соцмережі, витоки",
        card: "Банк, тип картки, країна",
      },
      services: {
        ip: {
          geolocation: "Геолокація",
          geolocationDesc: "Країна, місто, координати",
          ispInfo: "ISP Info",
          ispInfoDesc: "Провайдер, ASN, організація",
          proxyVpn: "Proxy/VPN",
          proxyVpnDesc: "Виявлення проксі та VPN",
          blacklists: "Blacklists",
          blacklistsDesc: "Перевірка спам-листів",
        },
        wallet: {
          patternAnalysis: "Pattern Analysis",
          patternAnalysisDesc: "Аналіз формату адреси",
          mixerDetection: "Mixer Detection",
          mixerDetectionDesc: "Виявлення Tornado Cash та ін.",
          multiChain: "Multi-Chain",
          multiChainDesc: "ETH, BTC, TRX, SOL, LTC, XRP, DOGE",
          exchangeUid: "Exchange UID",
          exchangeUidDesc: "Bybit, Binance UID перевірка",
        },
        email: {
          domainCheck: "Domain Check",
          domainCheckDesc: "Валідація MX та домену",
          disposable: "Disposable",
          disposableDesc: "Виявлення тимчасових email",
          breachCheck: "Breach Check",
          breachCheckDesc: "Перевірка на витоки даних",
          osintScan: "OSINT Scan",
          osintScanDesc: "Пошук пов'язаних акаунтів",
        },
        phone: {
          countryCode: "Country Code",
          countryCodeDesc: "Визначення країни за кодом",
          carrierId: "Carrier ID",
          carrierIdDesc: "Ідентифікація оператора",
          formatCheck: "Format Check",
          formatCheckDesc: "Валідація формату номера",
          typeDetection: "Type Detection",
          typeDetectionDesc: "Мобільний / стаціонарний",
        },
        domain: {
          tldAnalysis: "TLD Analysis",
          tldAnalysisDesc: "Аналіз доменної зони",
          typosquatting: "Typosquatting",
          typosquattingDesc: "Виявлення схожих доменів",
          patterns: "Patterns",
          patternsDesc: "Підозрілі патерни в назві",
          reputation: "Reputation",
          reputationDesc: "Перевірка репутації",
        },
        url: {
          protocol: "Protocol",
          protocolDesc: "Аналіз HTTP/HTTPS протоколу",
          shorteners: "Shorteners",
          shortenersDesc: "Виявлення bit.ly, t.co та ін.",
          phishing: "Phishing",
          phishingDesc: "Детекція фішингових URL",
          redirectScan: "Redirect Scan",
          redirectScanDesc: "Аналіз редиректів",
        },
        bot: {
          tokenVerify: "Token Verify",
          tokenVerifyDesc: "Перевірка валідності токену",
          botInfo: "Bot Info",
          botInfoDesc: "Username, ім'я, ID бота",
          permissions: "Permissions",
          permissionsDesc: "Права доступу до груп",
          capabilities: "Capabilities",
          capabilitiesDesc: "Inline, WebApp, бізнес",
        },
        cve: {
          nvdLookup: "NVD Lookup",
          nvdLookupDesc: "Пошук в базі NVD NIST",
          cvssScore: "CVSS Score",
          cvssScoreDesc: "Оцінка критичності",
          cisaKev: "CISA KEV",
          cisaKevDesc: "Каталог активних вразливостей",
          recommendations: "Recommendations",
          recommendationsDesc: "Рекомендації щодо виправлення",
        },
        hash: {
          malwareBazaar: "MalwareBazaar",
          malwareBazaarDesc: "База шкідливих файлів",
          urlhaus: "URLhaus",
          urlhausDesc: "Перевірка URL-асоціацій",
          virusTotal: "VirusTotal",
          virusTotalDesc: "Мультисканер антивірусів",
          signatureMatch: "Signature Match",
          signatureMatchDesc: "Пошук відомих сигнатур",
        },
        username: {
          githubProfile: "GitHub Profile",
          githubProfileDesc: "Профіль та репозиторії",
          socialMedia: "Social Media",
          socialMediaDesc: "Соціальні мережі",
          forums: "Forums",
          forumsDesc: "Форуми та спільноти",
          dataBreaches: "Data Breaches",
          dataBreachesDesc: "Перевірка витоків даних",
        },
        card: {
          binLookup: "BIN Lookup",
          binLookupDesc: "Інформація про BIN номер",
          bankInfo: "Bank Info",
          bankInfoDesc: "Банк-емітент картки",
          cardType: "Card Type",
          cardTypeDesc: "Дебетова/кредитна",
          country: "Country",
          countryDesc: "Країна випуску",
        },
      },
      bulkMode: "Bulk Mode",
      singleMode: "Одиночний режим",
      bulkPlaceholder: "Введіть значення (по одному на рядок, макс. 20)",
      bulkMax: "Максимум 20 значень за один раз",
      bulkComplete: "Bulk перевірка завершена",
      bulkChecked: "Перевірено {count} об'єктів",
      limitReachedTitle: "Ліміт вичерпано",
      limitReachedDesc: "Ваші безкоштовні запити закінчились. Оберіть тарифний план для продовження.",
      enterValueError: "Введіть значення для перевірки",
      checkError: "Не вдалося виконати перевірку",
      resultCopied: "Скопійовано!",
      resultCopiedDesc: "Результат перевірки скопійовано до буфера обміну",
      copyFailed: "Не вдалося скопіювати",
      requestSent: "Заявку відправлено!",
      requestSentDesc: "Заявка #{id} створена. Очікуйте підтвердження від адміністратора.",
      enterTxHash: "Введіть TX Hash транзакції",
      paymentAddress: "Адреса оплати (TRC20 USDT)",
      txHashLabel: "TX Hash",
      txHashPlaceholder: "Введіть TX Hash транзакції...",
      submitRequestBtn: "Подати заявку",
      requestWillBeSent: "Заявка буде відправлена адміністратору в Telegram для підтвердження",
      keyboardShortcuts: "Гарячі клавіші",
      requestsRemaining: "Залишилось запитів",
      statistics: "Статистика",
      checks: "Перевірок",
      checksToday: "Сьогодні",
      threats: "Загроз",
      recentChecksLabel: "Останні перевірки",
      systemLoading: "Завантаження системи...",
      systemActive: "Система активна",
      whatIsAnalyzed: "Що аналізується",
      checkProgress: "Прогрес перевірки...",
      scanInProgress: "Сканування в процесі...",
      bulkScan: "Bulk Сканування",
      scan: "Сканувати",
      profile: "Профіль",
      subscription: "Підписка",
      quickActions: "Швидкі дії",
      repeatLastChecks: "Повторіть останні перевірки одним кліком",
      all: "Усі",
      enabled: "Увімкнено",
      disabled: "Вимкнено",
      values: "значень",
      securityScanner: "Security Scanner",
      selectTypeAndEnter: "Виберіть тип перевірки та введіть дані для аналізу",
      online: "Онлайн",
      botSyncOk: "Bot sync OK",
      checkPlaceholders: {
        ip: "8.8.8.8",
        wallet: "0x1234...abcd",
        email: "user@example.com",
        phone: "+380501234567",
        domain: "example.com",
        url: "https://example.com/path",
        bot: "123456789:ABC-DEF...",
        cve: "CVE-2024-1234",
        hash: "d41d8cd98f00b204e9800998ecf8427e",
        username: "johndoe",
        card: "411111",
      },
      checkLabels: {
        ip: "IP/GEO",
        wallet: "Крипто Гаманець",
        email: "Email OSINT",
        phone: "Пошук Телефону",
        domain: "Аналіз Домену",
        url: "Сканер URL",
        bot: "Токен Бота",
        cve: "CVE Скан",
        hash: "Перевірка Хешу",
        username: "OSINT Юзернейм",
        card: "BIN Картки",
      },
    },
    account: {
      title: "Акаунт",
      profile: "Профіль",
      settings: "Налаштування",
      telegramId: "Telegram ID",
      username: "Ім'я користувача",
      tier: "Рівень",
      requestsLeft: "Залишилось запитів",
      streak: "Серія",
      streakDays: "Днів поспіль",
      language: "Мова",
      notifications: "Сповіщення",
      sessions: "Сесії",
      security: "Безпека",
      syncInfo: "Цей профіль синхронізований між ботом та веб-сайтом",
      editProfile: "Редагувати профіль",
      changePassword: "Змінити пароль",
      totalChecks: "Всього перевірок",
      activeMonitors: "Активні монітори",
      achievements: "Досягнення",
      mostUsedTypes: "Найчастіші типи",
      emailNotifications: "Email сповіщення",
      emailNotificationsDesc: "На пошту",
      telegramNotifications: "Telegram",
      telegramNotificationsDesc: "Повідомлення",
      threatAlerts: "Загрози",
      threatAlertsDesc: "Миттєві алерти",
      updateNotifications: "Оновлення",
      updateNotificationsDesc: "Нові функції",
      activeSessions: "Активні сесії",
      currentSession: "Поточна сесія",
      lastActive: "Останній вхід",
      riskHunter: "Risk Hunter",
      riskHunterDesc: "10 перевірок",
      scamSlayer: "Scam Slayer",
      scamSlayerDesc: "50 перевірок",
      streakMaster: "Streak Master",
      streakMasterDesc: "7 днів підряд",
      referralKing: "Referral King",
      referralKingDesc: "5 рефералів",
      completed: "Готово",
      interfaceLanguage: "Мова інтерфейсу",
      chooseLanguage: "Оберіть зручну мову",
      apiKey: "API ключ",
      forIntegration: "Для інтеграції",
      upgradeForApi: "Оновіться для API",
      apiAvailable: "API доступний",
      copyKey: "Копіювати",
      keyCopied: "Скопійовано!",
      regenerateKey: "Перегенерувати",
      apiKeyDesc: "Використовуйте цей ключ для доступу до DARKSHARE API",
      subscriptionTitle: "Підписка",
      currentPlan: "Поточний план",
      basicPlan: "Базовий план",
      professionalPlan: "Професійний план",
      corporatePlan: "Корпоративний план",
      upgradePlan: "Оновити план",
      requests: "Запити",
      remaining: "Залишилось",
      lastLogin: "Останній вхід",
      sessionsManage: "Сесії",
      manage: "Керувати",
      referrals: "Рефералів",
      top: "Топ",
      ref: "Реф",
      sessionDeleted: "Сесію завершено",
      sessionDeleteError: "Не вдалося завершити сесію",
      settingsSaved: "Налаштування збережено",
      settingsSaveError: "Помилка збереження налаштувань",
      apiKeyRegenerated: "API ключ перегенеровано",
      apiKeyRegenerateError: "Помилка перегенерації ключа",
      active: "Активна",
      connected: "Підключено",
      deleteAllSessions: "Видалити всі інші сесії",
      allSessionsDeleted: "Всі інші сесії видалено",
      allSessionsDeleteError: "Помилка видалення сесій",
    },
    landing: {
      hero: {
        badge: "Професійна OSINT платформа",
        title: "Кібербезпека &",
        titleHighlight: "Аналіз загроз",
        description: "10+ модулів для комплексного аналізу: IP, домени, гаманці, email, телефони, malware, CVE та бази витоків. Інтеграція з провідними API безпеки.",
      },
      features: {
        title: "Можливості",
        protection: "Повний захист",
        modules: "10 модулів",
        instant: "Миттєва перевірка",
        realTimeAnalysis: "Аналіз загроз у реальному часі",
        resultInSeconds: "Результат за секунди",
      },
      stats: {
        users: "Користувачі",
        monitors: "Монітори",
        threats: "Загрози",
        today: "Сьогодні",
      },
      cta: {
        webDashboard: "Веб-дашборд",
        telegramBot: "Telegram бот",
        getStarted: "Почати",
        freeStart: "Спробувати безкоштовно",
        apiIntegration: "API інтеграція",
      },
      activity: "Активність",
      topHunters: "Топ хантери",
      realtime: "Реальний час",
      trusted: "Довіра професіоналів",
    },
    monitoring: {
      title: "Моніторинг",
      activeMonitors: "Активні монітори",
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
      learnAbout: "Дізнайтесь більше про можливості",
      riskTrendUp: "Зріс",
      riskTrendDown: "Знизився",
      riskTrendStable: "Стабільний",
      totalMonitors: "Активних моніторів",
      alertsTotal: "Сповіщень за тиждень",
      lastAlertLabel: "Останнє сповіщення",
      addNewMonitor: "Додати новий монітор",
      addObjectPlaceholder: "Введіть значення...",
      selectType: "Виберіть тип",
      addButton: "Додати",
      monitorCreated: "Монітор створено",
      monitorCreatedDesc: "Об'єкт додано до моніторингу",
      monitorError: "Помилка",
      monitorErrorDesc: "Не вдалося створити монітор",
      deleted: "Видалено",
      deletedDesc: "Монітор видалено",
      enterValueError: "Введіть значення для моніторингу",
      monitoring247: "Автоматичні перевірки",
      monitoring247Desc: "Система автоматично перевіряє додані об'єкти кожні 5 хвилин на зміни рівня ризику.",
      instantAlerts: "Миттєві сповіщення",
      instantAlertsDesc: "При зміні рівня ризику ви отримаєте сповіщення в Telegram та на email.",
      riskTracking: "Трекінг трендів",
      riskTrackingDesc: "Відстежуйте як змінюється рівень ризику об'єктів з часом для прийняття рішень.",
      dataSecurity: "Безпека даних",
      dataSecurityDesc: "Всі дані моніторингу зберігаються в зашифрованому вигляді та недоступні третім особам.",
      typeIp: "IP Адреса",
      typeWallet: "Гаманець",
      typeEmail: "Email",
      typePhone: "Телефон",
      typeDomain: "Домен",
      typeUrl: "URL",
    },
    history: {
      title: "Історія",
      noHistory: "Ще немає історії",
      filter: "Фільтр",
      all: "Всі",
      today: "Сьогодні",
      thisWeek: "Цей тиждень",
      thisMonth: "Цей місяць",
      exportCsv: "Експорт CSV",
      exportJson: "Експорт JSON",
      viewReport: "Переглянути звіт",
      totalChecks: "Всього перевірок",
      thisWeekChecks: "Цього тижня",
      criticalRisks: "Критичних ризиків",
      pdfDownloaded: "Завантажено PDF",
      searchPlaceholder: "Пошук по цілі...",
      allTime: "Весь час",
      loadingHistory: "Завантаження історії...",
      nothingFound: "Нічого не знайдено",
      changeFilters: "Спробуйте змінити фільтри або пошуковий запит",
      clearFilters: "Очистити фільтри",
      emptyHistory: "Історія порожня",
      emptyHistoryHint: "Виконайте вашу першу перевірку щоб побачити результати тут",
      startChecking: "Почати перевірку",
      showingResults: "Показано {filtered} з {total} записів",
      newCheck: "Нова перевірка",
      copied: "Скопійовано",
      copiedDesc: "Ціль скопійовано до буферу обміну",
      copyError: "Не вдалося скопіювати",
      riskAll: "Всі",
      riskLow: "Низький",
      riskMedium: "Середній",
      riskHigh: "Високий",
      riskCritical: "Критичний",
    },
    referral: {
      title: "Реферальна програма",
      yourCode: "Ваш код",
      yourLink: "Ваше посилання",
      referralsCount: "Реферали",
      earnings: "Заробіток",
      invite: "Запрошуйте друзів та отримуйте бонуси!",
      howItWorks: "Як це працює",
      copyLink: "Копіювати посилання",
      shareWith: "Поділитися з",
      rewards: "Нагороди",
      pending: "Очікує",
      shareMessage: "Приєднуйся до DARKSHARE - найкращого OSINT сервісу! Використай мій код {code} для отримання бонусів!",
      codeCopied: "Скопійовано!",
      codeCopiedDesc: "Реферальний код скопійовано в буфер обміну",
      linkCopied: "Скопійовано!",
      linkCopiedDesc: "Реферальне посилання скопійовано в буфер обміну",
      copyErrorTitle: "Помилка копіювання",
      copyErrorDesc: "Не вдалося скопіювати код. Спробуйте ще раз.",
      totalReferrals: "Запрошено",
      totalBonus: "Зароблено",
      pendingBonusLabel: "Очікує",
      earnedRequests: "запитів",
      starterBonus: "+5 запитів",
      activeBonus: "+10 запитів + 5% знижка",
      ambassadorBonus: "+30 запитів + 10% знижка",
      eliteBonus: "Безлім запитів + 20% знижка",
      noReferrals: "Поки що немає рефералів",
      inviteFriendsHint: "Поділіться своїм реферальним кодом з друзями та отримуйте бонуси за кожного запрошеного користувача",
      yourReferrals: "Запрошені користувачі",
      joined: "Приєднався",
      referralLink: "Реферальне посилання",
      referralProgram: "Реферальна програма",
      inviteFriendsDesc: "Запрошуй друзів та отримуй бонуси",
      yourRefCode: "Твій реферальний код",
      rewardLevels: "Рівні винагород",
      current: "Поточний",
      bonus: "Бонус",
      waiting: "Очікує",
      referralsLabel: "рефералів",
      howItWorksTitle: "Як це працює?",
      step1: "Поділіться своїм реферальним кодом або посиланням з друзями",
      step2: "Коли друг реєструється за вашим кодом, він отримує +5 безкоштовних запитів",
      step3: "Ви отримуєте +3 запити за кожного запрошеного користувача",
      step4: "Досягайте нових рівнів для отримання більших бонусів та знижок",
      invitedUsers: "Запрошені користувачі",
      copied: "Скопійовано",
      copyBtn: "Копіювати",
      reversh: {
        title: "Партнерська програма Reversh",
        description: "Заробляйте до 70% від залучених клієнтів",
        name: "Ваше ім'я",
        phone: "Номер телефону",
        email: "Email",
        method: "Як плануєте залучати клієнтів?",
        volume: "Очікуваний обсяг на місяць",
        submit: "Надіслати заявку",
        success: "Заявку надіслано!",
        successDesc: "Наша команда зв'яжеться з вами найближчим часом",
      },
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
      invalidInput: "Невірний ввід",
      limitReached: "Ліміт запитів вичерпано",
    },
    footer: {
      description: "Професійна платформа для OSINT розвідки та аналізу кіберзагроз. Безпечний та етичний збір відкритих даних.",
      legal: "Правова інформація",
      termsOfService: "Умови використання",
      privacyPolicy: "Політика конфіденційності",
      contact: "Контакт",
      disclaimer: "Відмова від відповідальності",
      disclaimerText: "DARKSHARE надає інструменти OSINT виключно для законних цілей кібербезпеки. Користувачі несуть відповідальність за дотримання місцевого законодавства. Ми збираємо лише загальнодоступну інформацію.",
      allRightsReserved: "Всі права захищені.",
      terms: "Умови",
      privacy: "Приватність",
      systemsOnline: "Системи онлайн",
    },
    mobile: {
      home: "Головна",
      checks: "Перевірки",
      checksToday: "Сьогодні",
      history: "Історія",
      monitoring: "Моніторинг",
      referrals: "Реферали",
      profile: "Профіль",
      pricing: "Тарифи",
      signInTelegram: "Увійти через Telegram",
      telegramBot: "Telegram Bot",
      logout: "Вийти",
    },
    threatFeed: {
      title: "Стрічка Загроз",
      subtitle: "Останні CVE та кіберзагрози в реальному часі",
      autoRefresh: "Оновлення кожні 5 хв",
      threatsCount: "загроз",
      typeCve: "CVE",
      typeMalware: "Шкідливе ПЗ",
      typePhishing: "Фішинг",
      typeBotnet: "Ботнет",
      typeRansomware: "Здирник",
      typeApt: "APT",
    },
    support: {
      title: "Зв'язатися з підтримкою",
      subtitle: "Маєте питання чи потребуєте допомоги? Надішліть нам повідомлення.",
      contactInfo: "Контактна інформація",
      email: "Email підтримки",
      formTitle: "Надіслати звернення",
      nameLabel: "Ваше ім'я",
      namePlaceholder: "Введіть ваше ім'я",
      contactLabel: "Телефон / Telegram / Email",
      contactPlaceholder: "Як з вами зв'язатися?",
      messageLabel: "Повідомлення",
      messagePlaceholder: "Опишіть вашу проблему або питання...",
      sent: "Звернення надіслано",
      sentDesc: "Наша команда розгляне ваше звернення та зв'яжеться з вами.",
    },
  },
  ru: {
    nav: {
      dashboard: "Дашборд",
      history: "История",
      monitoring: "Мониторинг",
      referral: "Рефералы",
      pricing: "Тарифы",
      account: "Аккаунт",
      support: "Поддержка",
      apiDocs: "API Документация",
      teams: "Команды",
      widget: "Виджет",
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
      viewAll: "Показать все",
      learnMore: "Узнать больше",
      comingSoon: "Скоро",
    },
    auth: {
      login: "Войти",
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
      loginSuccess: "Вход выполнен",
      loginError: "Ошибка входа",
      telegramFailed: "Ошибка авторизации Telegram",
    },
    pricing: {
      title: "Тарифные планы",
      subtitle: "Выберите план, который подходит вам",
      plans: "Планы",
      features: "Функции",
      subscribe: "Подписаться",
      free: "Бесплатный",
      pro: "Pro ($10)",
      enterprise: "Enterprise ($35)",
      monthly: "Ежемесячно",
      yearly: "Ежегодно",
      popular: "Самый популярный",
      savePercent: "Экономия 20%",
      currentPlan: "Текущий план",
      upgrade: "Обновить",
      requestsPerDay: "Запросов/день",
      unlimitedRequests: "Безлимитные запросы",
      allModules: "Все модули",
      prioritySupport: "Приоритетная поддержка",
      apiAccess: "Доступ к API",
      customIntegrations: "Индивидуальные интеграции",
      paymentUSDT: "Оплата криптовалютой",
      forBeginners: "Для начинающих",
      forProfessionals: "Для профессионалов",
      forTeams: "Для команд и бизнеса",
      perMonth: "/месяц",
      perYear: "/год",
      startFree: "Начать бесплатно",
      payAmount: "Оплатить",
      submitApplication: "Подать заявку на",
      applicationSent: "Заявка подана!",
      applicationSentDesc: "Администратор проверит вашу оплату в ближайшее время",
      paymentNote: "Оплата криптовалютой. Заявка будет отправлена администратору для подтверждения.",
      tronNetwork: "TRON Network",
      instantProcessing: "Мгновенная обработка",
      selectNetwork: "Выберите сеть",
      tonDiscount: "Скидка TON",
      yearlySubscription: "Годовая подписка",
      monthlySubscription: "Месячная подписка",
      addressCopied: "Скопировано!",
      addressCopiedDesc: "Адрес кошелька скопирован в буфер обмена",
      copyError: "Ошибка",
      copyErrorDesc: "Не удалось скопировать адрес",
      enterTxHash: "Введите TX Hash транзакции",
      txHashOptional: "TX Hash (опционально)",
      txHashPlaceholder: "Введите TX Hash транзакции...",
      planLabel: "План",
      checksPerDay15: "5 проверок в день",
      basicAnalysis: "Базовый анализ рисков",
      telegramBotAccess: "Доступ к Telegram боту",
      checkHistory: "История проверок",
      checksPerDay100: "50 проверок в день",
      aiAnalysis: "Расширенный анализ с AI",
      pdfReports: "PDF отчёты с QR-кодом",
      realTimeMonitoring: "Мониторинг в реальном времени",
      apiBeta: "API доступ (бета)",
      unlimitedChecks: "Неограниченные проверки",
      fullApiAccess: "Полный API доступ",
      support247: "Выделенная поддержка 24/7",
      customReports: "Пользовательские отчёты",
      whiteLabelIntegration: "White-label интеграция",
      slaGuarantees: "SLA гарантии",
      teamAccess: "Командный доступ",
      forGroups: "Для совместных команд",
      newLabel: "Новое",
      groupsAllEnterprise: "Все функции Enterprise включены",
      groupsTeamMembers: "До 10 участников команды",
      groupsSharedReports: "Общая библиотека отчётов",
      groupsTeamDashboard: "Командная аналитика",
      groupsRoleManagement: "Управление доступом по ролям",
      groupsCentralBilling: "Централизованная оплата",
      groupsActivityLog: "Журнал активности команды",
      promoCode: "Промокод",
      promoApplied: "Промокод применён!",
      promoInvalid: "Недействительный промокод",
      promoAppliedLabel: "скидка применена",
      apply: "Применить",
      uploadScreenshot: "Загрузить скриншот оплаты",
      chooseFile: "Выбрать файл...",
      timerExpired: "Сессия истекла",
      timerExpiredDesc: "Пожалуйста, откройте окно оплаты снова",
      enterTxOrScreenshot: "Введите TX Hash или загрузите скриншот",
      expired: "Истёк",
      selectPaymentMethod: "Выберите способ оплаты",
      cardPaymentDesc: "Оплата любой картой Visa/Mastercard. Сумма в гривнах, ваш банк конвертирует автоматически.",
      bankConversionNote: "Сумма указана в украинских гривнах (UAH). Ваш банк автоматически конвертирует из вашей валюты по текущему курсу.",
      payWithGooglePay: "Оплатить через Google Pay",
      payWithApplePay: "Оплатить через Apple Pay",
      continue: "Продолжить",
      totalAmount: "Итого",
    },
    dashboard: {
      title: "Дашборд",
      subtitle: "Платформа анализа рисков",
      checkTypes: {
        ip: "IP/GEO",
        wallet: "Крипто-кошелёк",
        email: "Email",
        phone: "Телефон",
        domain: "Домен",
        url: "URL",
        cve: "CVE",
        hash: "Hash",
        username: "Username",
        bot: "Bot Token",
        card: "Card BIN",
      },
      riskLevels: {
        low: "Низкий",
        medium: "Средний",
        high: "Высокий",
        critical: "Критический",
      },
      recentChecks: "Последние проверки",
      noChecks: "Проверок ещё нет",
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
      checkDescriptions: {
        ip: "Анализ IP-адреса через ip-api.com для определения геолокации, ISP провайдера и обнаружения VPN/Proxy сервисов",
        wallet: "Анализ криптовалютных кошельков: паттерны адресов, обнаружение mixer-сервисов, поддержка ETH/BTC/TRX/SOL/LTC/XRP/DOGE и Bybit/Binance UID",
        email: "OSINT-анализ email: валидация домена, обнаружение disposable-адресов, проверка на утечки данных",
        phone: "Анализ телефонных номеров: определение кода страны, идентификация оператора связи, валидация формата",
        domain: "Разведка по домену: анализ TLD, обнаружение typosquatting-атак, поиск подозрительных паттернов",
        url: "Сканирование URL: анализ протокола, обнаружение shortener-сервисов, детекция фишинговых паттернов",
        bot: "Проверка Telegram Bot Token: валидация через API, информация о боте, анализ возможностей и безопасности токена",
        cve: "Проверка CVE уязвимостей через NVD NIST API: CVSS скоринг, описание, рекомендации, CISA KEV каталог",
        hash: "Проверка MD5/SHA1/SHA256 хешей файлов на malware через MalwareBazaar, URLhaus, VirusTotal",
        username: "OSINT поиск по username на различных платформах: GitHub, социальные сети, форумы",
        card: "Валидация BIN номера банковской карты: определение банка-эмитента, типа карты, страны и возможных рисков",
      },
      checkShortDescs: {
        ip: "Геолокация, провайдер, чёрные списки",
        wallet: "Транзакции, миксеры, санкции",
        email: "Утечки данных, связанные аккаунты",
        phone: "Оператор, регион, спам-рейтинг",
        domain: "WHOIS, DNS, репутация",
        url: "Malware, фишинг, редиректы",
        bot: "Валидность, права, безопасность",
        cve: "Уязвимости, CVSS, рекомендации",
        hash: "Malware, сигнатуры, репутация",
        username: "Профили, соцсети, утечки",
        card: "Банк, тип карты, страна",
      },
      services: {
        ip: {
          geolocation: "Геолокация",
          geolocationDesc: "Страна, город, координаты",
          ispInfo: "ISP Info",
          ispInfoDesc: "Провайдер, ASN, организация",
          proxyVpn: "Proxy/VPN",
          proxyVpnDesc: "Обнаружение прокси и VPN",
          blacklists: "Blacklists",
          blacklistsDesc: "Проверка спам-листов",
        },
        wallet: {
          patternAnalysis: "Pattern Analysis",
          patternAnalysisDesc: "Анализ формата адреса",
          mixerDetection: "Mixer Detection",
          mixerDetectionDesc: "Обнаружение Tornado Cash и др.",
          multiChain: "Multi-Chain",
          multiChainDesc: "ETH, BTC, TRX, SOL, LTC, XRP, DOGE",
          exchangeUid: "Exchange UID",
          exchangeUidDesc: "Bybit, Binance UID проверка",
        },
        email: {
          domainCheck: "Domain Check",
          domainCheckDesc: "Валидация MX и домена",
          disposable: "Disposable",
          disposableDesc: "Обнаружение временных email",
          breachCheck: "Breach Check",
          breachCheckDesc: "Проверка на утечки данных",
          osintScan: "OSINT Scan",
          osintScanDesc: "Поиск связанных аккаунтов",
        },
        phone: {
          countryCode: "Country Code",
          countryCodeDesc: "Определение страны по коду",
          carrierId: "Carrier ID",
          carrierIdDesc: "Идентификация оператора",
          formatCheck: "Format Check",
          formatCheckDesc: "Валидация формата номера",
          typeDetection: "Type Detection",
          typeDetectionDesc: "Мобильный / стационарный",
        },
        domain: {
          tldAnalysis: "TLD Analysis",
          tldAnalysisDesc: "Анализ доменной зоны",
          typosquatting: "Typosquatting",
          typosquattingDesc: "Обнаружение похожих доменов",
          patterns: "Patterns",
          patternsDesc: "Подозрительные паттерны в имени",
          reputation: "Reputation",
          reputationDesc: "Проверка репутации",
        },
        url: {
          protocol: "Protocol",
          protocolDesc: "Анализ HTTP/HTTPS протокола",
          shorteners: "Shorteners",
          shortenersDesc: "Обнаружение bit.ly, t.co и др.",
          phishing: "Phishing",
          phishingDesc: "Детекция фишинговых URL",
          redirectScan: "Redirect Scan",
          redirectScanDesc: "Анализ редиректов",
        },
        bot: {
          tokenVerify: "Token Verify",
          tokenVerifyDesc: "Проверка валидности токена",
          botInfo: "Bot Info",
          botInfoDesc: "Username, имя, ID бота",
          permissions: "Permissions",
          permissionsDesc: "Права доступа к группам",
          capabilities: "Capabilities",
          capabilitiesDesc: "Inline, WebApp, бизнес",
        },
        cve: {
          nvdLookup: "NVD Lookup",
          nvdLookupDesc: "Поиск в базе NVD NIST",
          cvssScore: "CVSS Score",
          cvssScoreDesc: "Оценка критичности",
          cisaKev: "CISA KEV",
          cisaKevDesc: "Каталог активных уязвимостей",
          recommendations: "Recommendations",
          recommendationsDesc: "Рекомендации по исправлению",
        },
        hash: {
          malwareBazaar: "MalwareBazaar",
          malwareBazaarDesc: "База вредоносных файлов",
          urlhaus: "URLhaus",
          urlhausDesc: "Проверка URL-ассоциаций",
          virusTotal: "VirusTotal",
          virusTotalDesc: "Мультисканер антивирусов",
          signatureMatch: "Signature Match",
          signatureMatchDesc: "Поиск известных сигнатур",
        },
        username: {
          githubProfile: "GitHub Profile",
          githubProfileDesc: "Профиль и репозитории",
          socialMedia: "Social Media",
          socialMediaDesc: "Социальные сети",
          forums: "Forums",
          forumsDesc: "Форумы и сообщества",
          dataBreaches: "Data Breaches",
          dataBreachesDesc: "Проверка утечек данных",
        },
        card: {
          binLookup: "BIN Lookup",
          binLookupDesc: "Информация о BIN номере",
          bankInfo: "Bank Info",
          bankInfoDesc: "Банк-эмитент карты",
          cardType: "Card Type",
          cardTypeDesc: "Дебетовая/кредитная",
          country: "Country",
          countryDesc: "Страна выпуска",
        },
      },
      bulkMode: "Bulk Mode",
      singleMode: "Одиночный режим",
      bulkPlaceholder: "Введите значения (по одному на строку, макс. 20)",
      bulkMax: "Максимум 20 значений за раз",
      bulkComplete: "Bulk проверка завершена",
      bulkChecked: "Проверено {count} объектов",
      limitReachedTitle: "Лимит исчерпан",
      limitReachedDesc: "Ваши бесплатные запросы закончились. Выберите тарифный план для продолжения.",
      enterValueError: "Введите значение для проверки",
      checkError: "Не удалось выполнить проверку",
      resultCopied: "Скопировано!",
      resultCopiedDesc: "Результат проверки скопирован в буфер обмена",
      copyFailed: "Не удалось скопировать",
      requestSent: "Заявка отправлена!",
      requestSentDesc: "Заявка #{id} создана. Ожидайте подтверждения от администратора.",
      enterTxHash: "Введите TX Hash транзакции",
      paymentAddress: "Адрес оплаты (TRC20 USDT)",
      txHashLabel: "TX Hash",
      txHashPlaceholder: "Введите TX Hash транзакции...",
      submitRequestBtn: "Подать заявку",
      requestWillBeSent: "Заявка будет отправлена администратору в Telegram для подтверждения",
      keyboardShortcuts: "Горячие клавиши",
      requestsRemaining: "Осталось запросов",
      statistics: "Статистика",
      checks: "Проверок",
      checksToday: "Сегодня",
      threats: "Угроз",
      recentChecksLabel: "Последние проверки",
      systemLoading: "Загрузка системы...",
      systemActive: "Система активна",
      whatIsAnalyzed: "Что анализируется",
      checkProgress: "Прогресс проверки...",
      scanInProgress: "Сканирование в процессе...",
      bulkScan: "Bulk Сканирование",
      scan: "Сканировать",
      profile: "Профиль",
      subscription: "Подписка",
      quickActions: "Быстрые действия",
      repeatLastChecks: "Повторите последние проверки одним кликом",
      all: "Все",
      enabled: "Включено",
      disabled: "Выключено",
      values: "значений",
      securityScanner: "Security Scanner",
      selectTypeAndEnter: "Выберите тип проверки и введите данные для анализа",
      online: "Онлайн",
      botSyncOk: "Bot sync OK",
      checkPlaceholders: {
        ip: "8.8.8.8",
        wallet: "0x1234...abcd",
        email: "user@example.com",
        phone: "+380501234567",
        domain: "example.com",
        url: "https://example.com/path",
        bot: "123456789:ABC-DEF...",
        cve: "CVE-2024-1234",
        hash: "d41d8cd98f00b204e9800998ecf8427e",
        username: "johndoe",
        card: "411111",
      },
      checkLabels: {
        ip: "IP/GEO",
        wallet: "Крипто Кошелёк",
        email: "Email OSINT",
        phone: "Поиск Телефона",
        domain: "Анализ Домена",
        url: "Сканер URL",
        bot: "Токен Бота",
        cve: "CVE Скан",
        hash: "Проверка Хеша",
        username: "OSINT Юзернейм",
        card: "BIN Карты",
      },
    },
    account: {
      title: "Аккаунт",
      profile: "Профиль",
      settings: "Настройки",
      telegramId: "Telegram ID",
      username: "Имя пользователя",
      tier: "Уровень",
      requestsLeft: "Осталось запросов",
      streak: "Серия",
      streakDays: "Дней подряд",
      language: "Язык",
      notifications: "Уведомления",
      sessions: "Сессии",
      security: "Безопасность",
      syncInfo: "Этот профиль синхронизирован между ботом и веб-сайтом",
      editProfile: "Редактировать профиль",
      changePassword: "Изменить пароль",
      totalChecks: "Всего проверок",
      activeMonitors: "Активные мониторы",
      achievements: "Достижения",
      mostUsedTypes: "Часто используемые типы",
      emailNotifications: "Email уведомления",
      emailNotificationsDesc: "На почту",
      telegramNotifications: "Telegram",
      telegramNotificationsDesc: "Сообщения",
      threatAlerts: "Угрозы",
      threatAlertsDesc: "Мгновенные алерты",
      updateNotifications: "Обновления",
      updateNotificationsDesc: "Новые функции",
      activeSessions: "Активные сессии",
      currentSession: "Текущая сессия",
      lastActive: "Последний вход",
      riskHunter: "Risk Hunter",
      riskHunterDesc: "10 проверок",
      scamSlayer: "Scam Slayer",
      scamSlayerDesc: "50 проверок",
      streakMaster: "Streak Master",
      streakMasterDesc: "7 дней подряд",
      referralKing: "Referral King",
      referralKingDesc: "5 рефералов",
      completed: "Готово",
      interfaceLanguage: "Язык интерфейса",
      chooseLanguage: "Выберите удобный язык",
      apiKey: "API ключ",
      forIntegration: "Для интеграции",
      upgradeForApi: "Обновитесь для API",
      apiAvailable: "API доступен",
      copyKey: "Копировать",
      keyCopied: "Скопировано!",
      regenerateKey: "Перегенерировать",
      apiKeyDesc: "Используйте этот ключ для доступа к DARKSHARE API",
      subscriptionTitle: "Подписка",
      currentPlan: "Текущий план",
      basicPlan: "Базовый план",
      professionalPlan: "Профессиональный план",
      corporatePlan: "Корпоративный план",
      upgradePlan: "Обновить план",
      requests: "Запросы",
      remaining: "Осталось",
      lastLogin: "Последний вход",
      sessionsManage: "Сессии",
      manage: "Управление",
      referrals: "Рефералов",
      top: "Топ",
      ref: "Реф",
      sessionDeleted: "Сессия завершена",
      sessionDeleteError: "Не удалось завершить сессию",
      settingsSaved: "Настройки сохранены",
      settingsSaveError: "Ошибка сохранения настроек",
      apiKeyRegenerated: "API ключ перегенерирован",
      apiKeyRegenerateError: "Ошибка перегенерации ключа",
      active: "Активна",
      connected: "Подключено",
      deleteAllSessions: "Удалить все другие сессии",
      allSessionsDeleted: "Все другие сессии удалены",
      allSessionsDeleteError: "Ошибка удаления сессий",
    },
    landing: {
      hero: {
        badge: "Профессиональная OSINT платформа",
        title: "Кибербезопасность &",
        titleHighlight: "Анализ угроз",
        description: "10+ модулей для комплексного анализа: IP, домены, кошельки, email, телефоны, malware, CVE и базы утечек. Интеграция с ведущими API безопасности.",
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
        monitors: "Мониторы",
        threats: "Угрозы",
        today: "Сегодня",
      },
      cta: {
        webDashboard: "Веб-дашборд",
        telegramBot: "Telegram бот",
        getStarted: "Начать",
        freeStart: "Попробовать бесплатно",
        apiIntegration: "API интеграция",
      },
      activity: "Активность",
      topHunters: "Топ хантеры",
      realtime: "Реальное время",
      trusted: "Доверие профессионалов",
    },
    monitoring: {
      title: "Мониторинг",
      activeMonitors: "Активные мониторы",
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
      riskTrendUp: "Вырос",
      riskTrendDown: "Снизился",
      riskTrendStable: "Стабильный",
      totalMonitors: "Активных мониторов",
      alertsTotal: "Уведомлений за неделю",
      lastAlertLabel: "Последнее уведомление",
      addNewMonitor: "Добавить новый монитор",
      addObjectPlaceholder: "Введите значение...",
      selectType: "Выберите тип",
      addButton: "Добавить",
      monitorCreated: "Монитор создан",
      monitorCreatedDesc: "Объект добавлен в мониторинг",
      monitorError: "Ошибка",
      monitorErrorDesc: "Не удалось создать монитор",
      deleted: "Удалено",
      deletedDesc: "Монитор удалён",
      enterValueError: "Введите значение для мониторинга",
      monitoring247: "Автоматические проверки",
      monitoring247Desc: "Система автоматически проверяет добавленные объекты каждые 5 минут на изменения уровня риска.",
      instantAlerts: "Мгновенные уведомления",
      instantAlertsDesc: "При изменении уровня риска вы получите уведомление в Telegram и на email.",
      riskTracking: "Трекинг трендов",
      riskTrackingDesc: "Отслеживайте как меняется уровень риска объектов со временем для принятия решений.",
      dataSecurity: "Безопасность данных",
      dataSecurityDesc: "Все данные мониторинга хранятся в зашифрованном виде и недоступны третьим лицам.",
      typeIp: "IP Адрес",
      typeWallet: "Кошелёк",
      typeEmail: "Email",
      typePhone: "Телефон",
      typeDomain: "Домен",
      typeUrl: "URL",
    },
    history: {
      title: "История",
      noHistory: "Истории ещё нет",
      filter: "Фильтр",
      all: "Все",
      today: "Сегодня",
      thisWeek: "Эта неделя",
      thisMonth: "Этот месяц",
      exportCsv: "Экспорт CSV",
      exportJson: "Экспорт JSON",
      viewReport: "Посмотреть отчёт",
      totalChecks: "Всего проверок",
      thisWeekChecks: "На этой неделе",
      criticalRisks: "Критических рисков",
      pdfDownloaded: "Скачано PDF",
      searchPlaceholder: "Поиск по цели...",
      allTime: "Всё время",
      loadingHistory: "Загрузка истории...",
      nothingFound: "Ничего не найдено",
      changeFilters: "Попробуйте изменить фильтры или поисковый запрос",
      clearFilters: "Очистить фильтры",
      emptyHistory: "История пуста",
      emptyHistoryHint: "Выполните вашу первую проверку чтобы увидеть результаты здесь",
      startChecking: "Начать проверку",
      showingResults: "Показано {filtered} из {total} записей",
      newCheck: "Новая проверка",
      copied: "Скопировано",
      copiedDesc: "Цель скопирована в буфер обмена",
      copyError: "Не удалось скопировать",
      riskAll: "Все",
      riskLow: "Низкий",
      riskMedium: "Средний",
      riskHigh: "Высокий",
      riskCritical: "Критический",
    },
    referral: {
      title: "Реферальная программа",
      yourCode: "Ваш код",
      yourLink: "Ваша ссылка",
      referralsCount: "Рефералы",
      earnings: "Заработок",
      invite: "Приглашайте друзей и получайте бонусы!",
      howItWorks: "Как это работает",
      copyLink: "Копировать ссылку",
      shareWith: "Поделиться с",
      rewards: "Награды",
      pending: "Ожидает",
      shareMessage: "Присоединяйся к DARKSHARE - лучшему OSINT сервису! Используй мой код {code} для получения бонусов!",
      codeCopied: "Скопировано!",
      codeCopiedDesc: "Реферальный код скопирован в буфер обмена",
      linkCopied: "Скопировано!",
      linkCopiedDesc: "Реферальная ссылка скопирована в буфер обмена",
      copyErrorTitle: "Ошибка копирования",
      copyErrorDesc: "Не удалось скопировать код. Попробуйте ещё раз.",
      totalReferrals: "Приглашено",
      totalBonus: "Заработано",
      pendingBonusLabel: "Ожидает",
      earnedRequests: "запросов",
      starterBonus: "+5 запросов",
      activeBonus: "+10 запросов + 5% скидка",
      ambassadorBonus: "+30 запросов + 10% скидка",
      eliteBonus: "Безлим запросов + 20% скидка",
      noReferrals: "Пока нет рефералов",
      inviteFriendsHint: "Поделитесь своим реферальным кодом с друзьями и получайте бонусы за каждого приглашённого пользователя",
      yourReferrals: "Приглашённые пользователи",
      joined: "Присоединился",
      referralLink: "Реферальная ссылка",
      referralProgram: "Реферальная программа",
      inviteFriendsDesc: "Приглашайте друзей и получайте бонусы",
      yourRefCode: "Ваш реферальный код",
      rewardLevels: "Уровни наград",
      current: "Текущий",
      bonus: "Бонус",
      waiting: "Ожидает",
      referralsLabel: "рефералов",
      howItWorksTitle: "Как это работает?",
      step1: "Поделитесь своим реферальным кодом или ссылкой с друзьями",
      step2: "Когда друг регистрируется по вашему коду, он получает +5 бесплатных запросов",
      step3: "Вы получаете +3 запроса за каждого приглашённого пользователя",
      step4: "Достигайте новых уровней для получения больших бонусов и скидок",
      invitedUsers: "Приглашённые пользователи",
      copied: "Скопировано",
      copyBtn: "Копировать",
      reversh: {
        title: "Партнёрская программа Reversh",
        description: "Зарабатывайте до 70% от привлечённых клиентов",
        name: "Ваше имя",
        phone: "Номер телефона",
        email: "Email",
        method: "Как планируете привлекать клиентов?",
        volume: "Ожидаемый объём в месяц",
        submit: "Отправить заявку",
        success: "Заявка отправлена!",
        successDesc: "Наша команда свяжется с вами в ближайшее время",
      },
    },
    time: {
      justNow: "только что",
      minutesAgo: "мин назад",
      hoursAgo: "ч назад",
      daysAgo: "д назад",
      waiting: "Ожидание",
    },
    errors: {
      networkError: "Ошибка сети. Попробуйте ещё раз.",
      unauthorized: "Войдите для продолжения.",
      notFound: "Не найдено",
      serverError: "Ошибка сервера. Попробуйте позже.",
      invalidInput: "Неверный ввод",
      limitReached: "Лимит запросов исчерпан",
    },
    footer: {
      description: "Профессиональная платформа для OSINT разведки и анализа киберугроз. Безопасный и этичный сбор открытых данных.",
      legal: "Правовая информация",
      termsOfService: "Условия использования",
      privacyPolicy: "Политика конфиденциальности",
      contact: "Контакт",
      disclaimer: "Отказ от ответственности",
      disclaimerText: "DARKSHARE предоставляет инструменты OSINT исключительно для законных целей кибербезопасности. Пользователи несут ответственность за соблюдение местного законодательства. Мы собираем только общедоступную информацию.",
      allRightsReserved: "Все права защищены.",
      terms: "Условия",
      privacy: "Приватность",
      systemsOnline: "Системы онлайн",
    },
    mobile: {
      home: "Главная",
      checks: "Проверки",
      checksToday: "Сегодня",
      history: "История",
      monitoring: "Мониторинг",
      referrals: "Рефералы",
      profile: "Профиль",
      pricing: "Тарифы",
      signInTelegram: "Войти через Telegram",
      telegramBot: "Telegram Bot",
      logout: "Выйти",
    },
    threatFeed: {
      title: "Лента Угроз",
      subtitle: "Последние CVE и киберугрозы в реальном времени",
      autoRefresh: "Обновление каждые 5 мин",
      threatsCount: "угроз",
      typeCve: "CVE",
      typeMalware: "Вредоносное ПО",
      typePhishing: "Фишинг",
      typeBotnet: "Ботнет",
      typeRansomware: "Вымогатель",
      typeApt: "APT",
    },
    support: {
      title: "Связаться с поддержкой",
      subtitle: "Есть вопрос или нужна помощь? Отправьте нам сообщение.",
      contactInfo: "Контактная информация",
      email: "Email поддержки",
      formTitle: "Отправить обращение",
      nameLabel: "Ваше имя",
      namePlaceholder: "Введите ваше имя",
      contactLabel: "Телефон / Telegram / Email",
      contactPlaceholder: "Как с вами связаться?",
      messageLabel: "Сообщение",
      messagePlaceholder: "Опишите вашу проблему или вопрос...",
      sent: "Обращение отправлено",
      sentDesc: "Наша команда рассмотрит ваше обращение и свяжется с вами.",
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
      support: "Soporte",
      apiDocs: "API Docs",
      teams: "Equipos",
      widget: "Widget",
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
      learnMore: "Más información",
      comingSoon: "Próximamente",
    },
    auth: {
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      welcome: "Bienvenido",
      signIn: "Iniciar sesión",
      signInWith: "Iniciar sesión con",
      signInTelegram: "Iniciar sesión con Telegram",
      signInGoogle: "Iniciar sesión con Google",
      noAccount: "¿Sin cuenta?",
      createAccount: "Crear cuenta",
      loginTitle: "Inicio de sesión",
      loginSubtitle: "Autoriza a través de Telegram para acceder",
      protectFrom: "Protégete de",
      cyberThreats: "amenazas cibernéticas",
      loginSuccess: "Inicio de sesión exitoso",
      loginError: "Error de inicio de sesión",
      telegramFailed: "Error de autenticación de Telegram",
    },
    pricing: {
      title: "Planes de precios",
      subtitle: "Elige el plan que se adapte a ti",
      plans: "Planes",
      features: "Características",
      subscribe: "Suscribirse",
      free: "Gratis",
      pro: "Pro ($10)",
      enterprise: "Enterprise ($35)",
      monthly: "Mensual",
      yearly: "Anual",
      popular: "Más popular",
      savePercent: "Ahorra 20%",
      currentPlan: "Plan actual",
      upgrade: "Mejorar",
      requestsPerDay: "Solicitudes/día",
      unlimitedRequests: "Solicitudes ilimitadas",
      allModules: "Todos los módulos",
      prioritySupport: "Soporte prioritario",
      apiAccess: "Acceso API",
      customIntegrations: "Integraciones personalizadas",
      paymentUSDT: "Pago con criptomoneda",
      forBeginners: "Para principiantes",
      forProfessionals: "Para profesionales",
      forTeams: "Para equipos y negocios",
      perMonth: "/mes",
      perYear: "/año",
      startFree: "Comenzar gratis",
      payAmount: "Pagar",
      submitApplication: "Enviar solicitud para",
      applicationSent: "¡Solicitud enviada!",
      applicationSentDesc: "El administrador verificará su pago en breve",
      paymentNote: "Pago con criptomoneda. La solicitud será enviada al administrador para confirmación.",
      tronNetwork: "TRON Network",
      instantProcessing: "Procesamiento instantáneo",
      selectNetwork: "Seleccionar red",
      tonDiscount: "Descuento TON",
      yearlySubscription: "Suscripción anual",
      monthlySubscription: "Suscripción mensual",
      addressCopied: "¡Copiado!",
      addressCopiedDesc: "Dirección de billetera copiada al portapapeles",
      copyError: "Error",
      copyErrorDesc: "No se pudo copiar la dirección",
      enterTxHash: "Ingrese el TX Hash de la transacción",
      txHashOptional: "TX Hash (opcional)",
      txHashPlaceholder: "Ingrese el TX Hash de la transacción...",
      planLabel: "Plan",
      checksPerDay15: "5 verificaciones por día",
      basicAnalysis: "Análisis básico de riesgos",
      telegramBotAccess: "Acceso al bot de Telegram",
      checkHistory: "Historial de verificaciones",
      checksPerDay100: "50 verificaciones por día",
      aiAnalysis: "Análisis extendido con IA",
      pdfReports: "Informes PDF con código QR",
      realTimeMonitoring: "Monitoreo en tiempo real",
      apiBeta: "Acceso API (beta)",
      unlimitedChecks: "Verificaciones ilimitadas",
      fullApiAccess: "Acceso completo a API",
      support247: "Soporte dedicado 24/7",
      customReports: "Informes personalizados",
      whiteLabelIntegration: "Integración white-label",
      slaGuarantees: "Garantías SLA",
      teamAccess: "Acceso de equipo",
      forGroups: "Para equipos colaborativos",
      newLabel: "Nuevo",
      groupsAllEnterprise: "Todas las funciones Enterprise incluidas",
      groupsTeamMembers: "Hasta 10 miembros del equipo",
      groupsSharedReports: "Biblioteca de informes compartida",
      groupsTeamDashboard: "Panel de análisis del equipo",
      groupsRoleManagement: "Control de acceso basado en roles",
      groupsCentralBilling: "Facturación centralizada",
      groupsActivityLog: "Registro de actividad del equipo",
      promoCode: "Código promocional",
      promoApplied: "Código promocional aplicado!",
      promoInvalid: "Código promocional inválido",
      promoAppliedLabel: "descuento aplicado",
      apply: "Aplicar",
      uploadScreenshot: "Subir captura de pantalla del pago",
      chooseFile: "Elegir archivo...",
      timerExpired: "Sesión expirada",
      timerExpiredDesc: "Por favor, vuelva a abrir la ventana de pago",
      enterTxOrScreenshot: "Ingrese TX Hash o suba una captura de pantalla",
      expired: "Expirado",
      selectPaymentMethod: "Seleccione método de pago",
      cardPaymentDesc: "Pague con cualquier tarjeta Visa/Mastercard. Importe en UAH, su banco convierte automáticamente.",
      bankConversionNote: "El importe está en grivnas ucranianas (UAH). Su banco convertirá automáticamente desde su moneda al tipo de cambio actual.",
      payWithGooglePay: "Pagar con Google Pay",
      payWithApplePay: "Pagar con Apple Pay",
      continue: "Continuar",
      totalAmount: "Total",
    },
    dashboard: {
      title: "Panel",
      subtitle: "Plataforma de inteligencia de riesgos",
      checkTypes: {
        ip: "IP/GEO",
        wallet: "Crypto Wallet",
        email: "Email",
        phone: "Teléfono",
        domain: "Dominio",
        url: "URL",
        cve: "CVE",
        hash: "Hash",
        username: "Usuario",
        bot: "Bot Token",
        card: "Card BIN",
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
      addToMonitor: "Añadir al monitoreo",
      newCheck: "Nueva verificación",
      selectModule: "Seleccionar módulo",
      checkDescriptions: {
        ip: "Análisis de dirección IP vía ip-api.com para geolocalización, proveedor ISP y detección de VPN/Proxy",
        wallet: "Análisis de billeteras cripto: patrones de direcciones, detección de mixers, soporte ETH/BTC/TRX/SOL/LTC/XRP/DOGE y Bybit/Binance UID",
        email: "Análisis OSINT de email: validación de dominio, detección de direcciones desechables, verificación de filtraciones",
        phone: "Análisis de números telefónicos: identificación de código de país, detección de operador, validación de formato",
        domain: "Inteligencia de dominio: análisis TLD, detección de typosquatting, búsqueda de patrones sospechosos",
        url: "Escaneo de URL: análisis de protocolo, detección de acortadores, detección de phishing",
        bot: "Verificación de Telegram Bot Token: validación API, información del bot, análisis de seguridad del token",
        cve: "Verificación de vulnerabilidades CVE vía NVD NIST API: puntuación CVSS, descripción, recomendaciones, catálogo CISA KEV",
        hash: "Verificación de hashes MD5/SHA1/SHA256 para malware vía MalwareBazaar, URLhaus, VirusTotal",
        username: "Búsqueda OSINT de usuario en plataformas: GitHub, redes sociales, foros",
        card: "Validación de BIN de tarjeta bancaria: banco emisor, tipo de tarjeta, país e identificación de riesgos",
      },
      checkShortDescs: {
        ip: "Geolocalización, proveedor, listas negras",
        wallet: "Transacciones, mixers, sanciones",
        email: "Filtraciones, cuentas vinculadas",
        phone: "Operador, región, calificación de spam",
        domain: "WHOIS, DNS, reputación",
        url: "Malware, phishing, redirecciones",
        bot: "Validez, permisos, seguridad",
        cve: "Vulnerabilidades, CVSS, recomendaciones",
        hash: "Malware, firmas, reputación",
        username: "Perfiles, redes sociales, filtraciones",
        card: "Banco, tipo de tarjeta, país",
      },
      services: {
        ip: {
          geolocation: "Geolocalización",
          geolocationDesc: "País, ciudad, coordenadas",
          ispInfo: "ISP Info",
          ispInfoDesc: "Proveedor, ASN, organización",
          proxyVpn: "Proxy/VPN",
          proxyVpnDesc: "Detección de proxy y VPN",
          blacklists: "Listas negras",
          blacklistsDesc: "Verificación de listas de spam",
        },
        wallet: {
          patternAnalysis: "Análisis de patrones",
          patternAnalysisDesc: "Análisis de formato de dirección",
          mixerDetection: "Detección de mixers",
          mixerDetectionDesc: "Detección de Tornado Cash y más",
          multiChain: "Multi-Chain",
          multiChainDesc: "ETH, BTC, TRX, SOL, LTC, XRP, DOGE",
          exchangeUid: "Exchange UID",
          exchangeUidDesc: "Verificación Bybit, Binance UID",
        },
        email: {
          domainCheck: "Verificación de dominio",
          domainCheckDesc: "Validación MX y dominio",
          disposable: "Desechable",
          disposableDesc: "Detección de email temporal",
          breachCheck: "Verificación de filtración",
          breachCheckDesc: "Verificación de filtraciones de datos",
          osintScan: "Escaneo OSINT",
          osintScanDesc: "Búsqueda de cuentas vinculadas",
        },
        phone: {
          countryCode: "Código de país",
          countryCodeDesc: "Identificación de país por código",
          carrierId: "ID de operador",
          carrierIdDesc: "Identificación de operador",
          formatCheck: "Verificación de formato",
          formatCheckDesc: "Validación de formato de número",
          typeDetection: "Detección de tipo",
          typeDetectionDesc: "Móvil / fijo",
        },
        domain: {
          tldAnalysis: "Análisis TLD",
          tldAnalysisDesc: "Análisis de zona de dominio",
          typosquatting: "Typosquatting",
          typosquattingDesc: "Detección de dominios similares",
          patterns: "Patrones",
          patternsDesc: "Patrones sospechosos en el nombre",
          reputation: "Reputación",
          reputationDesc: "Verificación de reputación",
        },
        url: {
          protocol: "Protocolo",
          protocolDesc: "Análisis de protocolo HTTP/HTTPS",
          shorteners: "Acortadores",
          shortenersDesc: "Detección de bit.ly, t.co y más",
          phishing: "Phishing",
          phishingDesc: "Detección de URL de phishing",
          redirectScan: "Escaneo de redirección",
          redirectScanDesc: "Análisis de redirecciones",
        },
        bot: {
          tokenVerify: "Verificar token",
          tokenVerifyDesc: "Verificación de validez del token",
          botInfo: "Info del bot",
          botInfoDesc: "Username, nombre, ID del bot",
          permissions: "Permisos",
          permissionsDesc: "Derechos de acceso a grupos",
          capabilities: "Capacidades",
          capabilitiesDesc: "Inline, WebApp, negocios",
        },
        cve: {
          nvdLookup: "Búsqueda NVD",
          nvdLookupDesc: "Búsqueda en base NVD NIST",
          cvssScore: "Puntuación CVSS",
          cvssScoreDesc: "Evaluación de criticidad",
          cisaKev: "CISA KEV",
          cisaKevDesc: "Catálogo de vulnerabilidades activas",
          recommendations: "Recomendaciones",
          recommendationsDesc: "Recomendaciones de corrección",
        },
        hash: {
          malwareBazaar: "MalwareBazaar",
          malwareBazaarDesc: "Base de archivos maliciosos",
          urlhaus: "URLhaus",
          urlhausDesc: "Verificación de asociaciones URL",
          virusTotal: "VirusTotal",
          virusTotalDesc: "Multi-escáner antivirus",
          signatureMatch: "Coincidencia de firma",
          signatureMatchDesc: "Búsqueda de firmas conocidas",
        },
        username: {
          githubProfile: "Perfil de GitHub",
          githubProfileDesc: "Perfil y repositorios",
          socialMedia: "Redes sociales",
          socialMediaDesc: "Redes sociales",
          forums: "Foros",
          forumsDesc: "Foros y comunidades",
          dataBreaches: "Filtraciones de datos",
          dataBreachesDesc: "Verificación de filtraciones",
        },
        card: {
          binLookup: "Búsqueda BIN",
          binLookupDesc: "Información del número BIN",
          bankInfo: "Info del banco",
          bankInfoDesc: "Banco emisor de la tarjeta",
          cardType: "Tipo de tarjeta",
          cardTypeDesc: "Débito/crédito",
          country: "País",
          countryDesc: "País de emisión",
        },
      },
      bulkMode: "Modo masivo",
      singleMode: "Modo individual",
      bulkPlaceholder: "Ingrese valores (uno por línea, máx. 20)",
      bulkMax: "Máximo 20 valores a la vez",
      bulkComplete: "Verificación masiva completada",
      bulkChecked: "Verificados {count} objetos",
      limitReachedTitle: "Límite alcanzado",
      limitReachedDesc: "Sus solicitudes gratuitas se han agotado. Elija un plan para continuar.",
      enterValueError: "Ingrese un valor para verificar",
      checkError: "No se pudo realizar la verificación",
      resultCopied: "¡Copiado!",
      resultCopiedDesc: "Resultado de verificación copiado al portapapeles",
      copyFailed: "No se pudo copiar",
      requestSent: "¡Solicitud enviada!",
      requestSentDesc: "Solicitud #{id} creada. Espere confirmación del administrador.",
      enterTxHash: "Ingrese el TX Hash de la transacción",
      paymentAddress: "Dirección de pago (TRC20 USDT)",
      txHashLabel: "TX Hash",
      txHashPlaceholder: "Ingrese el TX Hash de la transacción...",
      submitRequestBtn: "Enviar solicitud",
      requestWillBeSent: "La solicitud será enviada al administrador en Telegram para confirmación",
      keyboardShortcuts: "Atajos de teclado",
      requestsRemaining: "Solicitudes restantes",
      statistics: "Estadísticas",
      checks: "Verificaciones",
      checksToday: "Hoy",
      threats: "Amenazas",
      recentChecksLabel: "Verificaciones recientes",
      systemLoading: "Cargando sistema...",
      systemActive: "Sistema activo",
      whatIsAnalyzed: "Qué se analiza",
      checkProgress: "Progreso de verificación...",
      scanInProgress: "Escaneo en progreso...",
      bulkScan: "Escaneo masivo",
      scan: "Escanear",
      profile: "Perfil",
      subscription: "Suscripción",
      quickActions: "Acciones rápidas",
      repeatLastChecks: "Repita las últimas verificaciones con un clic",
      all: "Todos",
      enabled: "Activado",
      disabled: "Desactivado",
      values: "valores",
      securityScanner: "Security Scanner",
      selectTypeAndEnter: "Seleccione el tipo de verificación e ingrese los datos para el análisis",
      online: "En línea",
      botSyncOk: "Bot sync OK",
      checkPlaceholders: {
        ip: "8.8.8.8",
        wallet: "0x1234...abcd",
        email: "user@example.com",
        phone: "+380501234567",
        domain: "example.com",
        url: "https://example.com/path",
        bot: "123456789:ABC-DEF...",
        cve: "CVE-2024-1234",
        hash: "d41d8cd98f00b204e9800998ecf8427e",
        username: "johndoe",
        card: "411111",
      },
      checkLabels: {
        ip: "IP/GEO",
        wallet: "Crypto Wallet",
        email: "Email OSINT",
        phone: "Buscar Teléfono",
        domain: "Intel de Dominio",
        url: "Escáner URL",
        bot: "Token de Bot",
        cve: "Escaneo CVE",
        hash: "Verificar Hash",
        username: "OSINT Usuario",
        card: "BIN Tarjeta",
      },
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
      streakDays: "Días consecutivos",
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
      mostUsedTypes: "Tipos más usados",
      emailNotifications: "Notificaciones por email",
      emailNotificationsDesc: "Por correo",
      telegramNotifications: "Telegram",
      telegramNotificationsDesc: "Mensajes",
      threatAlerts: "Amenazas",
      threatAlertsDesc: "Alertas instantáneas",
      updateNotifications: "Actualizaciones",
      updateNotificationsDesc: "Nuevas funciones",
      activeSessions: "Sesiones activas",
      currentSession: "Sesión actual",
      lastActive: "Último acceso",
      riskHunter: "Risk Hunter",
      riskHunterDesc: "10 verificaciones",
      scamSlayer: "Scam Slayer",
      scamSlayerDesc: "50 verificaciones",
      streakMaster: "Streak Master",
      streakMasterDesc: "7 días consecutivos",
      referralKing: "Referral King",
      referralKingDesc: "5 referidos",
      completed: "Listo",
      interfaceLanguage: "Idioma de interfaz",
      chooseLanguage: "Elija un idioma conveniente",
      apiKey: "Clave API",
      forIntegration: "Para integración",
      upgradeForApi: "Actualice para API",
      apiAvailable: "API disponible",
      copyKey: "Copiar",
      keyCopied: "¡Copiado!",
      regenerateKey: "Regenerar",
      apiKeyDesc: "Use esta clave para acceder a la API de DARKSHARE",
      subscriptionTitle: "Suscripción",
      currentPlan: "Plan actual",
      basicPlan: "Plan básico",
      professionalPlan: "Plan profesional",
      corporatePlan: "Plan corporativo",
      upgradePlan: "Mejorar plan",
      requests: "Solicitudes",
      remaining: "Restantes",
      lastLogin: "Último acceso",
      sessionsManage: "Sesiones",
      manage: "Gestionar",
      referrals: "Referidos",
      top: "Top",
      ref: "Ref",
      sessionDeleted: "Sesión terminada",
      sessionDeleteError: "Error al terminar sesión",
      settingsSaved: "Configuración guardada",
      settingsSaveError: "Error al guardar configuración",
      apiKeyRegenerated: "Clave API regenerada",
      apiKeyRegenerateError: "Error al regenerar clave",
      active: "Activa",
      connected: "Conectado",
      deleteAllSessions: "Eliminar todas las demás sesiones",
      allSessionsDeleted: "Todas las demás sesiones eliminadas",
      allSessionsDeleteError: "Error al eliminar sesiones",
    },
    landing: {
      hero: {
        badge: "Plataforma OSINT profesional",
        title: "Ciberseguridad &",
        titleHighlight: "Análisis de amenazas",
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
        freeStart: "Comenzar gratis",
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
      riskTrendUp: "Aumentó",
      riskTrendDown: "Disminuyó",
      riskTrendStable: "Estable",
      totalMonitors: "Monitores activos",
      alertsTotal: "Alertas esta semana",
      lastAlertLabel: "Última alerta",
      addNewMonitor: "Añadir nuevo monitor",
      addObjectPlaceholder: "Ingrese valor...",
      selectType: "Seleccionar tipo",
      addButton: "Añadir",
      monitorCreated: "Monitor creado",
      monitorCreatedDesc: "Objeto añadido al monitoreo",
      monitorError: "Error",
      monitorErrorDesc: "No se pudo crear el monitor",
      deleted: "Eliminado",
      deletedDesc: "Monitor eliminado",
      enterValueError: "Ingrese un valor para monitorear",
      monitoring247: "Verificaciones automáticas",
      monitoring247Desc: "El sistema verifica automáticamente los objetos añadidos cada 5 minutos para cambios en el nivel de riesgo.",
      instantAlerts: "Notificaciones instantáneas",
      instantAlertsDesc: "Cuando cambie el nivel de riesgo, recibirá una notificación en Telegram y por email.",
      riskTracking: "Seguimiento de tendencias",
      riskTrackingDesc: "Rastree cómo cambia el nivel de riesgo de los objetos con el tiempo para tomar decisiones.",
      dataSecurity: "Seguridad de datos",
      dataSecurityDesc: "Todos los datos de monitoreo se almacenan cifrados e inaccesibles para terceros.",
      typeIp: "Dirección IP",
      typeWallet: "Billetera",
      typeEmail: "Email",
      typePhone: "Teléfono",
      typeDomain: "Dominio",
      typeUrl: "URL",
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
      totalChecks: "Total de verificaciones",
      thisWeekChecks: "Esta semana",
      criticalRisks: "Riesgos críticos",
      pdfDownloaded: "PDF descargados",
      searchPlaceholder: "Buscar por objetivo...",
      allTime: "Todo el tiempo",
      loadingHistory: "Cargando historial...",
      nothingFound: "Nada encontrado",
      changeFilters: "Intente cambiar los filtros o la búsqueda",
      clearFilters: "Limpiar filtros",
      emptyHistory: "Historial vacío",
      emptyHistoryHint: "Realice su primera verificación para ver resultados aquí",
      startChecking: "Comenzar verificación",
      showingResults: "Mostrando {filtered} de {total} registros",
      newCheck: "Nueva verificación",
      copied: "Copiado",
      copiedDesc: "Objetivo copiado al portapapeles",
      copyError: "No se pudo copiar",
      riskAll: "Todos",
      riskLow: "Bajo",
      riskMedium: "Medio",
      riskHigh: "Alto",
      riskCritical: "Crítico",
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
      shareMessage: "¡Únete a DARKSHARE - el mejor servicio OSINT! Usa mi código {code} para obtener bonos!",
      codeCopied: "¡Copiado!",
      codeCopiedDesc: "Código de referido copiado al portapapeles",
      linkCopied: "¡Copiado!",
      linkCopiedDesc: "Enlace de referido copiado al portapapeles",
      copyErrorTitle: "Error al copiar",
      copyErrorDesc: "No se pudo copiar el código. Inténtelo de nuevo.",
      totalReferrals: "Invitados",
      totalBonus: "Ganado",
      pendingBonusLabel: "Pendiente",
      earnedRequests: "solicitudes",
      starterBonus: "+5 solicitudes",
      activeBonus: "+10 solicitudes + 5% descuento",
      ambassadorBonus: "+30 solicitudes + 10% descuento",
      eliteBonus: "Solicitudes ilimitadas + 20% descuento",
      noReferrals: "Aún no hay referidos",
      inviteFriendsHint: "Comparta su código de referido con amigos y obtenga bonos por cada usuario invitado",
      yourReferrals: "Usuarios invitados",
      joined: "Se unió",
      referralLink: "Enlace de referido",
      referralProgram: "Programa de referidos",
      inviteFriendsDesc: "Invita amigos y obtén bonos",
      yourRefCode: "Tu código de referido",
      rewardLevels: "Niveles de recompensa",
      current: "Actual",
      bonus: "Bono",
      waiting: "Esperando",
      referralsLabel: "referidos",
      howItWorksTitle: "¿Cómo funciona?",
      step1: "Comparte tu código o enlace de referido con amigos",
      step2: "Cuando un amigo se registra con tu código, obtiene +5 solicitudes gratis",
      step3: "Obtienes +3 solicitudes por cada usuario invitado",
      step4: "Alcanza nuevos niveles para obtener mayores bonos y descuentos",
      invitedUsers: "Usuarios invitados",
      copied: "Copiado",
      copyBtn: "Copiar",
      reversh: {
        title: "Programa de socios Reversh",
        description: "Gana hasta el 70% de los clientes atraídos",
        name: "Tu nombre",
        phone: "Número de teléfono",
        email: "Email",
        method: "¿Cómo planeas atraer clientes?",
        volume: "Volumen mensual esperado",
        submit: "Enviar solicitud",
        success: "¡Solicitud enviada!",
        successDesc: "Nuestro equipo se pondrá en contacto contigo pronto",
      },
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
    footer: {
      description: "Plataforma profesional para inteligencia OSINT y análisis de amenazas cibernéticas. Recopilación segura y ética de datos públicos.",
      legal: "Legal",
      termsOfService: "Términos de servicio",
      privacyPolicy: "Política de privacidad",
      contact: "Contacto",
      disclaimer: "Aviso legal",
      disclaimerText: "DARKSHARE proporciona herramientas OSINT exclusivamente para fines legítimos de ciberseguridad. Los usuarios son responsables del cumplimiento de las leyes locales. Solo recopilamos información disponible públicamente.",
      allRightsReserved: "Todos los derechos reservados.",
      terms: "Términos",
      privacy: "Privacidad",
      systemsOnline: "Sistemas en línea",
    },
    mobile: {
      home: "Inicio",
      checks: "Verificaciones",
      checksToday: "Hoy",
      history: "Historial",
      monitoring: "Monitoreo",
      referrals: "Referidos",
      profile: "Perfil",
      pricing: "Precios",
      signInTelegram: "Iniciar sesión con Telegram",
      telegramBot: "Telegram Bot",
      logout: "Cerrar sesión",
    },
    threatFeed: {
      title: "Feed de Amenazas",
      subtitle: "CVEs y amenazas cibernéticas en tiempo real",
      autoRefresh: "Actualización cada 5 min",
      threatsCount: "amenazas",
      typeCve: "CVE",
      typeMalware: "Malware",
      typePhishing: "Phishing",
      typeBotnet: "Botnet",
      typeRansomware: "Ransomware",
      typeApt: "APT",
    },
    support: {
      title: "Contactar Soporte",
      subtitle: "Tiene una pregunta o necesita ayuda? Envie un mensaje.",
      contactInfo: "Informacion de Contacto",
      email: "Email de Soporte",
      formTitle: "Enviar Solicitud",
      nameLabel: "Su Nombre",
      namePlaceholder: "Ingrese su nombre",
      contactLabel: "Telefono / Telegram / Email",
      contactPlaceholder: "Como podemos contactarlo?",
      messageLabel: "Mensaje",
      messagePlaceholder: "Describa su problema o pregunta...",
      sent: "Solicitud Enviada",
      sentDesc: "Nuestro equipo revisara su solicitud y le contactara pronto.",
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
      support: "Support",
      apiDocs: "API Doku",
      teams: "Teams",
      widget: "Widget",
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
      loginSuccess: "Anmeldung erfolgreich",
      loginError: "Anmeldefehler",
      telegramFailed: "Telegram-Authentifizierung fehlgeschlagen",
    },
    pricing: {
      title: "Preispläne",
      subtitle: "Wählen Sie den Plan, der zu Ihnen passt",
      plans: "Pläne",
      features: "Funktionen",
      subscribe: "Abonnieren",
      free: "Kostenlos",
      pro: "Pro ($10)",
      enterprise: "Enterprise ($35)",
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
      paymentUSDT: "Krypto-Zahlung",
      forBeginners: "Für Anfänger",
      forProfessionals: "Für Profis",
      forTeams: "Für Teams und Unternehmen",
      perMonth: "/Monat",
      perYear: "/Jahr",
      startFree: "Kostenlos starten",
      payAmount: "Bezahlen",
      submitApplication: "Antrag einreichen für",
      applicationSent: "Antrag eingereicht!",
      applicationSentDesc: "Der Administrator wird Ihre Zahlung in Kürze überprüfen",
      paymentNote: "Zahlung mit Kryptowährung. Der Antrag wird zur Bestätigung an den Administrator gesendet.",
      tronNetwork: "TRON Network",
      instantProcessing: "Sofortige Verarbeitung",
      selectNetwork: "Netzwerk auswählen",
      tonDiscount: "TON-Rabatt",
      yearlySubscription: "Jahresabonnement",
      monthlySubscription: "Monatsabonnement",
      addressCopied: "Kopiert!",
      addressCopiedDesc: "Wallet-Adresse in die Zwischenablage kopiert",
      copyError: "Fehler",
      copyErrorDesc: "Adresse konnte nicht kopiert werden",
      enterTxHash: "TX Hash der Transaktion eingeben",
      txHashOptional: "TX Hash (optional)",
      txHashPlaceholder: "TX Hash der Transaktion eingeben...",
      planLabel: "Plan",
      checksPerDay15: "5 Prüfungen pro Tag",
      basicAnalysis: "Grundlegende Risikoanalyse",
      telegramBotAccess: "Telegram-Bot-Zugang",
      checkHistory: "Prüfungsverlauf",
      checksPerDay100: "50 Prüfungen pro Tag",
      aiAnalysis: "Erweiterte KI-Analyse",
      pdfReports: "PDF-Berichte mit QR-Code",
      realTimeMonitoring: "Echtzeit-Überwachung",
      apiBeta: "API-Zugang (Beta)",
      unlimitedChecks: "Unbegrenzte Prüfungen",
      fullApiAccess: "Voller API-Zugang",
      support247: "Dedizierter 24/7-Support",
      customReports: "Benutzerdefinierte Berichte",
      whiteLabelIntegration: "White-Label-Integration",
      slaGuarantees: "SLA-Garantien",
      teamAccess: "Team-Zugang",
      forGroups: "Für kollaborative Teams",
      newLabel: "Neu",
      groupsAllEnterprise: "Alle Enterprise-Funktionen inklusive",
      groupsTeamMembers: "Bis zu 10 Teammitglieder",
      groupsSharedReports: "Gemeinsame Berichtsbibliothek",
      groupsTeamDashboard: "Team-Analyse-Dashboard",
      groupsRoleManagement: "Rollenbasierte Zugriffskontrolle",
      groupsCentralBilling: "Zentralisierte Abrechnung",
      groupsActivityLog: "Team-Aktivitätsprotokoll",
      promoCode: "Promo-Code",
      promoApplied: "Promo-Code angewendet!",
      promoInvalid: "Ungültiger Promo-Code",
      promoAppliedLabel: "Rabatt angewendet",
      apply: "Anwenden",
      uploadScreenshot: "Zahlungsbeleg hochladen",
      chooseFile: "Datei auswählen...",
      timerExpired: "Sitzung abgelaufen",
      timerExpiredDesc: "Bitte öffnen Sie das Zahlungsfenster erneut",
      enterTxOrScreenshot: "TX Hash eingeben oder Screenshot hochladen",
      expired: "Abgelaufen",
      selectPaymentMethod: "Zahlungsmethode wählen",
      cardPaymentDesc: "Zahlen Sie mit jeder Visa/Mastercard. Betrag in UAH, Ihre Bank konvertiert automatisch.",
      bankConversionNote: "Der Betrag ist in ukrainischen Hrywnja (UAH). Ihre Bank konvertiert automatisch von Ihrer Währung zum aktuellen Wechselkurs.",
      payWithGooglePay: "Mit Google Pay bezahlen",
      payWithApplePay: "Mit Apple Pay bezahlen",
      continue: "Weiter",
      totalAmount: "Gesamt",
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
        card: "Card BIN",
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
      checkDescriptions: {
        ip: "IP-Adressanalyse über ip-api.com zur Geolokalisierung, ISP-Anbieter-Identifikation und VPN/Proxy-Erkennung",
        wallet: "Krypto-Wallet-Analyse: Adressmuster, Mixer-Erkennung, Unterstützung für ETH/BTC/TRX/SOL/LTC/XRP/DOGE und Bybit/Binance UID",
        email: "E-Mail-OSINT-Analyse: Domain-Validierung, Einweg-Adressen-Erkennung, Datenleck-Prüfung",
        phone: "Telefonnummern-Analyse: Ländercode-Identifikation, Anbieter-Erkennung, Format-Validierung",
        domain: "Domain-Intelligence: TLD-Analyse, Typosquatting-Erkennung, verdächtige Mustererkennung",
        url: "URL-Scanning: Protokollanalyse, Shortener-Erkennung, Phishing-Mustererkennung",
        bot: "Telegram Bot Token-Verifizierung: API-Validierung, Bot-Informationen, Token-Sicherheitsanalyse",
        cve: "CVE-Schwachstellenprüfung über NVD NIST API: CVSS-Scoring, Beschreibung, Empfehlungen, CISA KEV-Katalog",
        hash: "MD5/SHA1/SHA256-Datei-Hash-Prüfung auf Malware über MalwareBazaar, URLhaus, VirusTotal",
        username: "OSINT-Benutzernamen-Suche auf Plattformen: GitHub, soziale Medien, Foren",
        card: "BIN-Validierung der Bankkarte: Ausstellerbank, Kartentyp, Land und Risikoidentifikation",
      },
      checkShortDescs: {
        ip: "Geolokalisierung, Anbieter, Blacklists",
        wallet: "Transaktionen, Mixer, Sanktionen",
        email: "Datenlecks, verknüpfte Konten",
        phone: "Anbieter, Region, Spam-Bewertung",
        domain: "WHOIS, DNS, Reputation",
        url: "Malware, Phishing, Weiterleitungen",
        bot: "Gültigkeit, Berechtigungen, Sicherheit",
        cve: "Schwachstellen, CVSS, Empfehlungen",
        hash: "Malware, Signaturen, Reputation",
        username: "Profile, soziale Medien, Lecks",
        card: "Bank, Kartentyp, Land",
      },
      services: {
        ip: {
          geolocation: "Geolokalisierung",
          geolocationDesc: "Land, Stadt, Koordinaten",
          ispInfo: "ISP Info",
          ispInfoDesc: "Anbieter, ASN, Organisation",
          proxyVpn: "Proxy/VPN",
          proxyVpnDesc: "Proxy- und VPN-Erkennung",
          blacklists: "Blacklists",
          blacklistsDesc: "Spam-Listen-Prüfung",
        },
        wallet: {
          patternAnalysis: "Musteranalyse",
          patternAnalysisDesc: "Adressformat-Analyse",
          mixerDetection: "Mixer-Erkennung",
          mixerDetectionDesc: "Tornado Cash-Erkennung u.a.",
          multiChain: "Multi-Chain",
          multiChainDesc: "ETH, BTC, TRX, SOL, LTC, XRP, DOGE",
          exchangeUid: "Exchange UID",
          exchangeUidDesc: "Bybit, Binance UID-Prüfung",
        },
        email: {
          domainCheck: "Domain-Prüfung",
          domainCheckDesc: "MX- und Domain-Validierung",
          disposable: "Einweg",
          disposableDesc: "Temporäre E-Mail-Erkennung",
          breachCheck: "Leck-Prüfung",
          breachCheckDesc: "Datenleck-Überprüfung",
          osintScan: "OSINT-Scan",
          osintScanDesc: "Verknüpfte Konten-Suche",
        },
        phone: {
          countryCode: "Ländercode",
          countryCodeDesc: "Land-Identifikation nach Code",
          carrierId: "Anbieter-ID",
          carrierIdDesc: "Anbieter-Identifikation",
          formatCheck: "Format-Prüfung",
          formatCheckDesc: "Nummernformat-Validierung",
          typeDetection: "Typ-Erkennung",
          typeDetectionDesc: "Mobil / Festnetz",
        },
        domain: {
          tldAnalysis: "TLD-Analyse",
          tldAnalysisDesc: "Domain-Zonen-Analyse",
          typosquatting: "Typosquatting",
          typosquattingDesc: "Ähnliche Domain-Erkennung",
          patterns: "Muster",
          patternsDesc: "Verdächtige Namensmuster",
          reputation: "Reputation",
          reputationDesc: "Reputations-Prüfung",
        },
        url: {
          protocol: "Protokoll",
          protocolDesc: "HTTP/HTTPS-Protokollanalyse",
          shorteners: "Verkürzer",
          shortenersDesc: "bit.ly, t.co-Erkennung u.a.",
          phishing: "Phishing",
          phishingDesc: "Phishing-URL-Erkennung",
          redirectScan: "Weiterleitungs-Scan",
          redirectScanDesc: "Weiterleitungsanalyse",
        },
        bot: {
          tokenVerify: "Token-Verifizierung",
          tokenVerifyDesc: "Token-Gültigkeitsprüfung",
          botInfo: "Bot-Info",
          botInfoDesc: "Benutzername, Name, Bot-ID",
          permissions: "Berechtigungen",
          permissionsDesc: "Gruppenzugriffsrechte",
          capabilities: "Fähigkeiten",
          capabilitiesDesc: "Inline, WebApp, Business",
        },
        cve: {
          nvdLookup: "NVD-Suche",
          nvdLookupDesc: "NVD NIST-Datenbanksuche",
          cvssScore: "CVSS-Score",
          cvssScoreDesc: "Kritikalitätsbewertung",
          cisaKev: "CISA KEV",
          cisaKevDesc: "Katalog aktiver Schwachstellen",
          recommendations: "Empfehlungen",
          recommendationsDesc: "Behebungsempfehlungen",
        },
        hash: {
          malwareBazaar: "MalwareBazaar",
          malwareBazaarDesc: "Schädliche Datei-Datenbank",
          urlhaus: "URLhaus",
          urlhausDesc: "URL-Assoziations-Prüfung",
          virusTotal: "VirusTotal",
          virusTotalDesc: "Multi-Scanner-Antivirus",
          signatureMatch: "Signatur-Abgleich",
          signatureMatchDesc: "Bekannte Signatur-Suche",
        },
        username: {
          githubProfile: "GitHub-Profil",
          githubProfileDesc: "Profil und Repositories",
          socialMedia: "Soziale Medien",
          socialMediaDesc: "Soziale Netzwerke",
          forums: "Foren",
          forumsDesc: "Foren und Communities",
          dataBreaches: "Datenlecks",
          dataBreachesDesc: "Datenleck-Prüfung",
        },
        card: {
          binLookup: "BIN-Suche",
          binLookupDesc: "BIN-Nummern-Informationen",
          bankInfo: "Bank-Info",
          bankInfoDesc: "Kartenausstellende Bank",
          cardType: "Kartentyp",
          cardTypeDesc: "Debit-/Kreditkarte",
          country: "Land",
          countryDesc: "Ausstellungsland",
        },
      },
      bulkMode: "Massenmodus",
      singleMode: "Einzelmodus",
      bulkPlaceholder: "Werte eingeben (einer pro Zeile, max. 20)",
      bulkMax: "Maximal 20 Werte auf einmal",
      bulkComplete: "Massenprüfung abgeschlossen",
      bulkChecked: "{count} Objekte geprüft",
      limitReachedTitle: "Limit erreicht",
      limitReachedDesc: "Ihre kostenlosen Anfragen sind aufgebraucht. Wählen Sie einen Plan zum Fortfahren.",
      enterValueError: "Geben Sie einen Wert zur Prüfung ein",
      checkError: "Prüfung konnte nicht durchgeführt werden",
      resultCopied: "Kopiert!",
      resultCopiedDesc: "Prüfungsergebnis in die Zwischenablage kopiert",
      copyFailed: "Kopieren fehlgeschlagen",
      requestSent: "Antrag gesendet!",
      requestSentDesc: "Antrag #{id} erstellt. Warten Sie auf die Bestätigung des Administrators.",
      enterTxHash: "TX Hash der Transaktion eingeben",
      paymentAddress: "Zahlungsadresse (TRC20 USDT)",
      txHashLabel: "TX Hash",
      txHashPlaceholder: "TX Hash der Transaktion eingeben...",
      submitRequestBtn: "Antrag einreichen",
      requestWillBeSent: "Der Antrag wird zur Bestätigung an den Administrator in Telegram gesendet",
      keyboardShortcuts: "Tastenkürzel",
      requestsRemaining: "Verbleibende Anfragen",
      statistics: "Statistiken",
      checks: "Prüfungen",
      checksToday: "Heute",
      threats: "Bedrohungen",
      recentChecksLabel: "Letzte Prüfungen",
      systemLoading: "System wird geladen...",
      systemActive: "System aktiv",
      whatIsAnalyzed: "Was wird analysiert",
      checkProgress: "Prüfungsfortschritt...",
      scanInProgress: "Scan läuft...",
      bulkScan: "Massen-Scan",
      scan: "Scannen",
      profile: "Profil",
      subscription: "Abonnement",
      quickActions: "Schnellaktionen",
      repeatLastChecks: "Wiederholen Sie die letzten Prüfungen mit einem Klick",
      all: "Alle",
      enabled: "Aktiviert",
      disabled: "Deaktiviert",
      values: "Werte",
      securityScanner: "Security Scanner",
      selectTypeAndEnter: "Wählen Sie den Prüfungstyp und geben Sie Daten zur Analyse ein",
      online: "Online",
      botSyncOk: "Bot sync OK",
      checkPlaceholders: {
        ip: "8.8.8.8",
        wallet: "0x1234...abcd",
        email: "user@example.com",
        phone: "+380501234567",
        domain: "example.com",
        url: "https://example.com/path",
        bot: "123456789:ABC-DEF...",
        cve: "CVE-2024-1234",
        hash: "d41d8cd98f00b204e9800998ecf8427e",
        username: "johndoe",
        card: "411111",
      },
      checkLabels: {
        ip: "IP/GEO",
        wallet: "Krypto-Wallet",
        email: "E-Mail OSINT",
        phone: "Telefonsuche",
        domain: "Domain-Analyse",
        url: "URL-Scanner",
        bot: "Bot-Token",
        cve: "CVE-Scan",
        hash: "Hash-Prüfung",
        username: "OSINT Benutzername",
        card: "Karten-BIN",
      },
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
      mostUsedTypes: "Häufigste Typen",
      emailNotifications: "E-Mail-Benachrichtigungen",
      emailNotificationsDesc: "Per E-Mail",
      telegramNotifications: "Telegram",
      telegramNotificationsDesc: "Nachrichten",
      threatAlerts: "Bedrohungen",
      threatAlertsDesc: "Sofortige Alarme",
      updateNotifications: "Aktualisierungen",
      updateNotificationsDesc: "Neue Funktionen",
      activeSessions: "Aktive Sitzungen",
      currentSession: "Aktuelle Sitzung",
      lastActive: "Letzter Zugriff",
      riskHunter: "Risk Hunter",
      riskHunterDesc: "10 Prüfungen",
      scamSlayer: "Scam Slayer",
      scamSlayerDesc: "50 Prüfungen",
      streakMaster: "Streak Master",
      streakMasterDesc: "7 Tage in Folge",
      referralKing: "Referral King",
      referralKingDesc: "5 Empfehlungen",
      completed: "Fertig",
      interfaceLanguage: "Sprache der Oberfläche",
      chooseLanguage: "Wählen Sie eine passende Sprache",
      apiKey: "API-Schlüssel",
      forIntegration: "Zur Integration",
      upgradeForApi: "Upgraden für API",
      apiAvailable: "API verfügbar",
      copyKey: "Kopieren",
      keyCopied: "Kopiert!",
      regenerateKey: "Regenerieren",
      apiKeyDesc: "Verwenden Sie diesen Schlüssel für den Zugriff auf die DARKSHARE API",
      subscriptionTitle: "Abonnement",
      currentPlan: "Aktueller Plan",
      basicPlan: "Basisplan",
      professionalPlan: "Professioneller Plan",
      corporatePlan: "Unternehmensplan",
      upgradePlan: "Plan upgraden",
      requests: "Anfragen",
      remaining: "Verbleibend",
      lastLogin: "Letzter Login",
      sessionsManage: "Sitzungen",
      manage: "Verwalten",
      referrals: "Empfehlungen",
      top: "Top",
      ref: "Ref",
      sessionDeleted: "Sitzung beendet",
      sessionDeleteError: "Fehler beim Beenden der Sitzung",
      settingsSaved: "Einstellungen gespeichert",
      settingsSaveError: "Fehler beim Speichern der Einstellungen",
      apiKeyRegenerated: "API-Schlüssel regeneriert",
      apiKeyRegenerateError: "Fehler beim Regenerieren des Schlüssels",
      active: "Aktiv",
      connected: "Verbunden",
      deleteAllSessions: "Alle anderen Sitzungen löschen",
      allSessionsDeleted: "Alle anderen Sitzungen gelöscht",
      allSessionsDeleteError: "Fehler beim Löschen der Sitzungen",
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
      riskTrendUp: "Gestiegen",
      riskTrendDown: "Gesunken",
      riskTrendStable: "Stabil",
      totalMonitors: "Aktive Überwachungen",
      alertsTotal: "Warnungen diese Woche",
      lastAlertLabel: "Letzte Warnung",
      addNewMonitor: "Neuen Monitor hinzufügen",
      addObjectPlaceholder: "Wert eingeben...",
      selectType: "Typ auswählen",
      addButton: "Hinzufügen",
      monitorCreated: "Monitor erstellt",
      monitorCreatedDesc: "Objekt zur Überwachung hinzugefügt",
      monitorError: "Fehler",
      monitorErrorDesc: "Monitor konnte nicht erstellt werden",
      deleted: "Gelöscht",
      deletedDesc: "Monitor gelöscht",
      enterValueError: "Geben Sie einen Wert zur Überwachung ein",
      monitoring247: "Automatische Prüfungen",
      monitoring247Desc: "Das System überprüft automatisch hinzugefügte Objekte alle 5 Minuten auf Änderungen des Risikoniveaus.",
      instantAlerts: "Sofortige Benachrichtigungen",
      instantAlertsDesc: "Bei Änderung des Risikoniveaus erhalten Sie eine Benachrichtigung in Telegram und per E-Mail.",
      riskTracking: "Trend-Tracking",
      riskTrackingDesc: "Verfolgen Sie, wie sich das Risikoniveau von Objekten im Laufe der Zeit ändert, um Entscheidungen zu treffen.",
      dataSecurity: "Datensicherheit",
      dataSecurityDesc: "Alle Überwachungsdaten werden verschlüsselt gespeichert und sind für Dritte nicht zugänglich.",
      typeIp: "IP-Adresse",
      typeWallet: "Wallet",
      typeEmail: "E-Mail",
      typePhone: "Telefon",
      typeDomain: "Domain",
      typeUrl: "URL",
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
      totalChecks: "Gesamte Prüfungen",
      thisWeekChecks: "Diese Woche",
      criticalRisks: "Kritische Risiken",
      pdfDownloaded: "PDF heruntergeladen",
      searchPlaceholder: "Nach Ziel suchen...",
      allTime: "Gesamte Zeit",
      loadingHistory: "Verlauf wird geladen...",
      nothingFound: "Nichts gefunden",
      changeFilters: "Versuchen Sie, Filter oder Suchbegriff zu ändern",
      clearFilters: "Filter löschen",
      emptyHistory: "Verlauf ist leer",
      emptyHistoryHint: "Führen Sie Ihre erste Prüfung durch, um Ergebnisse hier zu sehen",
      startChecking: "Prüfung starten",
      showingResults: "Zeige {filtered} von {total} Einträgen",
      newCheck: "Neue Prüfung",
      copied: "Kopiert",
      copiedDesc: "Ziel in die Zwischenablage kopiert",
      copyError: "Kopieren fehlgeschlagen",
      riskAll: "Alle",
      riskLow: "Niedrig",
      riskMedium: "Mittel",
      riskHigh: "Hoch",
      riskCritical: "Kritisch",
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
      shareMessage: "Tritt DARKSHARE bei - dem besten OSINT-Service! Nutze meinen Code {code} für Boni!",
      codeCopied: "Kopiert!",
      codeCopiedDesc: "Empfehlungscode in die Zwischenablage kopiert",
      linkCopied: "Kopiert!",
      linkCopiedDesc: "Empfehlungslink in die Zwischenablage kopiert",
      copyErrorTitle: "Kopierfehler",
      copyErrorDesc: "Code konnte nicht kopiert werden. Versuchen Sie es erneut.",
      totalReferrals: "Eingeladen",
      totalBonus: "Verdient",
      pendingBonusLabel: "Ausstehend",
      earnedRequests: "Anfragen",
      starterBonus: "+5 Anfragen",
      activeBonus: "+10 Anfragen + 5% Rabatt",
      ambassadorBonus: "+30 Anfragen + 10% Rabatt",
      eliteBonus: "Unbegrenzte Anfragen + 20% Rabatt",
      noReferrals: "Noch keine Empfehlungen",
      inviteFriendsHint: "Teilen Sie Ihren Empfehlungscode mit Freunden und erhalten Sie Boni für jeden eingeladenen Benutzer",
      yourReferrals: "Eingeladene Benutzer",
      joined: "Beigetreten",
      referralLink: "Empfehlungslink",
      referralProgram: "Empfehlungsprogramm",
      inviteFriendsDesc: "Laden Sie Freunde ein und erhalten Sie Boni",
      yourRefCode: "Ihr Empfehlungscode",
      rewardLevels: "Belohnungsstufen",
      current: "Aktuell",
      bonus: "Bonus",
      waiting: "Wartend",
      referralsLabel: "Empfehlungen",
      howItWorksTitle: "Wie funktioniert es?",
      step1: "Teilen Sie Ihren Empfehlungscode oder Link mit Freunden",
      step2: "Wenn sich ein Freund mit Ihrem Code registriert, erhält er +5 kostenlose Anfragen",
      step3: "Sie erhalten +3 Anfragen für jeden eingeladenen Benutzer",
      step4: "Erreichen Sie neue Stufen für größere Boni und Rabatte",
      invitedUsers: "Eingeladene Benutzer",
      copied: "Kopiert",
      copyBtn: "Kopieren",
      reversh: {
        title: "Reversh Partnerprogramm",
        description: "Verdienen Sie bis zu 70% von geworbenen Kunden",
        name: "Ihr Name",
        phone: "Telefonnummer",
        email: "Email",
        method: "Wie planen Sie Kunden zu gewinnen?",
        volume: "Erwartetes monatliches Volumen",
        submit: "Bewerbung einreichen",
        success: "Bewerbung eingereicht!",
        successDesc: "Unser Team wird sich bald bei Ihnen melden",
      },
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
    footer: {
      description: "Professionelle Plattform für OSINT-Aufklärung und Cyber-Bedrohungsanalyse. Sichere und ethische Erfassung öffentlicher Daten.",
      legal: "Rechtliches",
      termsOfService: "Nutzungsbedingungen",
      privacyPolicy: "Datenschutzrichtlinie",
      contact: "Kontakt",
      disclaimer: "Haftungsausschluss",
      disclaimerText: "DARKSHARE stellt OSINT-Tools ausschließlich für legitime Cybersicherheitszwecke bereit. Benutzer sind für die Einhaltung lokaler Gesetze verantwortlich. Wir sammeln nur öffentlich verfügbare Informationen.",
      allRightsReserved: "Alle Rechte vorbehalten.",
      terms: "Bedingungen",
      privacy: "Datenschutz",
      systemsOnline: "Systeme online",
    },
    mobile: {
      home: "Startseite",
      checks: "Prüfungen",
      checksToday: "Heute",
      history: "Verlauf",
      monitoring: "Überwachung",
      referrals: "Empfehlungen",
      profile: "Profil",
      pricing: "Preise",
      signInTelegram: "Mit Telegram anmelden",
      telegramBot: "Telegram Bot",
      logout: "Abmelden",
    },
    threatFeed: {
      title: "Bedrohungs-Feed",
      subtitle: "Echtzeit-CVEs und Cyber-Bedrohungen",
      autoRefresh: "Auto-Aktualisierung alle 5 Min.",
      threatsCount: "Bedrohungen",
      typeCve: "CVE",
      typeMalware: "Malware",
      typePhishing: "Phishing",
      typeBotnet: "Botnet",
      typeRansomware: "Ransomware",
      typeApt: "APT",
    },
    support: {
      title: "Support kontaktieren",
      subtitle: "Haben Sie eine Frage oder brauchen Hilfe? Senden Sie uns eine Nachricht.",
      contactInfo: "Kontaktinformationen",
      email: "Support-E-Mail",
      formTitle: "Anfrage senden",
      nameLabel: "Ihr Name",
      namePlaceholder: "Geben Sie Ihren Namen ein",
      contactLabel: "Telefon / Telegram / E-Mail",
      contactPlaceholder: "Wie konnen wir Sie erreichen?",
      messageLabel: "Nachricht",
      messagePlaceholder: "Beschreiben Sie Ihr Problem oder Ihre Frage...",
      sent: "Anfrage gesendet",
      sentDesc: "Unser Team wird Ihre Anfrage prufen und sich bei Ihnen melden.",
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
