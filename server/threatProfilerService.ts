import OpenAI from "openai";

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (!apiKey || !baseURL) return null;
  return new OpenAI({ apiKey, baseURL });
}

export interface ThreatProfileInput {
  query: string;
  queryType: "username" | "email" | "phone" | "wallet" | "ip" | "domain";
  context?: {
    findings?: string[];
    relatedAccounts?: string[];
    breaches?: string[];
    riskScore?: number;
  };
}

export interface ThreatProfileResult {
  query: string;
  queryType: string;
  generatedAt: string;
  riskScore: number;
  classification: "MINIMAL" | "LOW" | "ELEVATED" | "HIGH" | "CRITICAL";
  executiveSummary: string;
  identitySignals: Array<{ label: string; value: string; confidence: number }>;
  exposureFootprint: Array<{ category: string; details: string; severity: "info" | "warn" | "danger" }>;
  recommendedActions: Array<{ priority: number; action: string; rationale: string }>;
  legalDisclaimer: string;
  sources: string[];
}

export async function generateThreatProfile(
  input: ThreatProfileInput
): Promise<ThreatProfileResult> {
  const openai = getOpenAIClient();

  if (!openai) {
    return getDefaultProfile(input);
  }

  try {
    const prompt = `You are a senior threat intelligence analyst building a structured profile based on PUBLICLY AVAILABLE OSINT data.

CRITICAL RULES:
- Output strictly factual, defensible language. No speculation about identity.
- Use "указывает на" / "вказує на" / "может свидетельствовать" hedging language.
- Every claim must include a confidence score (0-100).
- Never invent specific names, addresses, or PII not in the input.
- Always include legal disclaimer.

INPUT:
- Target: ${input.query}
- Type: ${input.queryType}
- Findings: ${input.context?.findings?.join("; ") || "none"}
- Related accounts: ${input.context?.relatedAccounts?.join(", ") || "none"}
- Breaches: ${input.context?.breaches?.join(", ") || "none"}
- Risk score: ${input.context?.riskScore ?? 0}/100

OUTPUT JSON SCHEMA:
{
  "executiveSummary": "2-3 sentences in Ukrainian, professional tone",
  "classification": "MINIMAL|LOW|ELEVATED|HIGH|CRITICAL",
  "identitySignals": [
    {"label": "Aliases", "value": "...", "confidence": 0-100},
    {"label": "Geography", "value": "...", "confidence": 0-100},
    {"label": "Activity period", "value": "...", "confidence": 0-100}
  ],
  "exposureFootprint": [
    {"category": "Data leaks", "details": "...", "severity": "info|warn|danger"},
    {"category": "Public profiles", "details": "...", "severity": "info|warn|danger"},
    {"category": "Dark web mentions", "details": "...", "severity": "info|warn|danger"}
  ],
  "recommendedActions": [
    {"priority": 1, "action": "...", "rationale": "..."}
  ]
}

Respond ONLY with valid JSON. All free-text fields in Ukrainian.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return {
      query: input.query,
      queryType: input.queryType,
      generatedAt: new Date().toISOString(),
      riskScore: input.context?.riskScore ?? 0,
      classification: parsed.classification || "LOW",
      executiveSummary: parsed.executiveSummary || "Аналіз завершено.",
      identitySignals: Array.isArray(parsed.identitySignals) ? parsed.identitySignals : [],
      exposureFootprint: Array.isArray(parsed.exposureFootprint) ? parsed.exposureFootprint : [],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      legalDisclaimer:
        "Цей звіт згенеровано штучним інтелектом на основі публічних OSINT-даних та може містити неточності. Не є офіційним документом, висновком експерта чи доказом у суді. Використовується виключно для досліджень безпеки. DARKSHARE не несе відповідальності за рішення, прийняті на підставі цього звіту.",
      sources: deriveSources(input),
    };
  } catch (error) {
    console.error("Threat profile error:", error);
    return getDefaultProfile(input);
  }
}

function deriveSources(input: ThreatProfileInput): string[] {
  const base = ["Public data leaks index", "Telegram public channels", "OSINT aggregators"];
  if (input.queryType === "wallet") base.push("Etherscan", "Mempool.space", "OFAC SDN list");
  if (input.queryType === "ip") base.push("Shodan", "GreyNoise", "AbuseIPDB");
  if (input.queryType === "domain") base.push("crt.sh", "WHOIS", "PhishTank");
  if (input.queryType === "email") base.push("HIBP-style index", "EmailRep.io");
  return base;
}

function getDefaultProfile(input: ThreatProfileInput): ThreatProfileResult {
  const score = input.context?.riskScore ?? 0;
  const cls = score < 20 ? "MINIMAL" : score < 40 ? "LOW" : score < 60 ? "ELEVATED" : score < 80 ? "HIGH" : "CRITICAL";
  return {
    query: input.query,
    queryType: input.queryType,
    generatedAt: new Date().toISOString(),
    riskScore: score,
    classification: cls,
    executiveSummary: `Згенеровано базовий профіль для ${input.query}. Для повного AI-аналізу потрібен AI-інтеграційний ключ.`,
    identitySignals: [
      { label: "Тип цілі", value: input.queryType, confidence: 100 },
      { label: "Знахідки", value: String(input.context?.findings?.length ?? 0), confidence: 100 },
    ],
    exposureFootprint: [
      {
        category: "Загальна оцінка",
        details: `Рівень ризику: ${score}/100`,
        severity: score >= 60 ? "danger" : score >= 30 ? "warn" : "info",
      },
    ],
    recommendedActions: [
      { priority: 1, action: "Регулярний моніторинг", rationale: "Базова OPSEC-практика" },
      { priority: 2, action: "Перевірте пов'язані акаунти", rationale: "OSINT-діагностика" },
    ],
    legalDisclaimer:
      "Цей звіт згенеровано на основі публічних OSINT-даних. Не є офіційним документом. Використовується виключно для досліджень безпеки.",
    sources: deriveSources(input),
  };
}
