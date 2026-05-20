import OpenAI from "openai";

interface AnalysisInput {
  type: string;
  target: string;
  riskScore: number;
  riskLevel: string;
  findings: string[];
  details: Record<string, any>;
}

interface AIAnalysis {
  summary: string;
  recommendations: string[];
  threatLevel: string;
  verdict: string;
}

interface AIProvider {
  name: string;
  available: () => boolean;
  call: (prompt: string) => Promise<string>;
}

const PROMPT_TEMPLATE = (input: AnalysisInput) => `You are a cybersecurity expert analyzing security data. Analyze this ${input.type} check result and provide a professional assessment.

Target: ${input.target}
Risk Score: ${input.riskScore}/100
Risk Level: ${input.riskLevel}
Findings: ${input.findings.join("; ")}
Details: ${JSON.stringify(input.details, null, 2).slice(0, 4000)}

Respond ONLY with valid JSON (no markdown, no code fences) with these fields:
- summary: A 2-3 sentence professional security summary in Ukrainian
- recommendations: Array of 3-5 specific actionable recommendations in Ukrainian
- threatLevel: One of "БЕЗПЕЧНО", "УВАГА", "НЕБЕЗПЕЧНО", "КРИТИЧНО"
- verdict: A one-line verdict in Ukrainian (max 15 words)`;

const failedUntil: Record<string, number> = {};
const FAIL_COOLDOWN_MS = 5 * 60 * 1000;

function markFailed(name: string) {
  failedUntil[name] = Date.now() + FAIL_COOLDOWN_MS;
}

function isInCooldown(name: string): boolean {
  const until = failedUntil[name];
  return until ? Date.now() < until : false;
}

const providers: AIProvider[] = [
  {
    name: "openai",
    available: () =>
      !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL),
    call: async (prompt: string) => {
      const client = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
      });
      const r = await client.chat.completions.create({
        model: "gpt-5-nano",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });
      return r.choices[0]?.message?.content || "{}";
    },
  },
  {
    name: "groq",
    available: () => !!process.env.GROQ_API_KEY,
    call: async (prompt: string) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 1024,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || "{}";
    },
  },
  {
    name: "gemini",
    available: () => !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY),
    call: async (prompt: string) => {
      const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 1024,
            temperature: 0.3,
          },
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data: any = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    },
  },
];

function cleanJsonContent(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return s.trim();
}

function parseAIResponse(raw: string, input: AnalysisInput): AIAnalysis | null {
  try {
    const result = JSON.parse(cleanJsonContent(raw));
    if (!result.summary || !Array.isArray(result.recommendations)) return null;
    return {
      summary: String(result.summary),
      recommendations: result.recommendations.map(String).slice(0, 5),
      threatLevel: result.threatLevel || mapRiskLevel(input.riskLevel),
      verdict: result.verdict || getDefaultVerdict(input.riskLevel),
    };
  } catch {
    return null;
  }
}

export async function generateAIAnalysis(input: AnalysisInput): Promise<AIAnalysis> {
  const prompt = PROMPT_TEMPLATE(input);

  for (const provider of providers) {
    if (!provider.available()) continue;
    if (isInCooldown(provider.name)) continue;

    try {
      const raw = await provider.call(prompt);
      const parsed = parseAIResponse(raw, input);
      if (parsed) return parsed;
    } catch (error: any) {
      console.warn(`[AI] ${provider.name} failed: ${error?.message || error}`);
      markFailed(provider.name);
    }
  }

  return {
    summary: getDefaultSummary(input),
    recommendations: getDefaultRecommendations(input.riskLevel),
    threatLevel: mapRiskLevel(input.riskLevel),
    verdict: getDefaultVerdict(input.riskLevel),
  };
}

function getDefaultSummary(input: AnalysisInput): string {
  const typeLabels: Record<string, string> = {
    ip: "IP-адреса",
    wallet: "Крипто-гаманець",
    email: "Email-адреса",
    phone: "Номер телефону",
    domain: "Домен",
    url: "URL-адреса",
    cve: "CVE вразливість",
    hash: "Файловий хеш",
    username: "Юзернейм",
    bottoken: "Telegram бот",
  };
  const typeLabel = typeLabels[input.type] || "Об'єкт";
  return `${typeLabel} ${input.target} проаналізовано. Виявлено ${input.findings.length} знахідок. Рівень ризику: ${input.riskScore}/100.`;
}

function getDefaultRecommendations(riskLevel: string): string[] {
  const recommendations: Record<string, string[]> = {
    low: [
      "Продовжуйте регулярний моніторинг",
      "Додайте до списку довірених",
      "Ведіть журнал взаємодій",
    ],
    medium: [
      "Підвищте рівень моніторингу",
      "Перевірте пов'язані об'єкти",
      "Встановіть сповіщення про зміни",
      "Документуйте всі транзакції",
    ],
    high: [
      "Негайно обмежте взаємодію",
      "Проведіть глибокий аудит",
      "Сповістіть службу безпеки",
      "Заблокуйте підозрілі операції",
      "Збережіть докази",
    ],
    critical: [
      "ТЕРМІНОВО припиніть всі операції",
      "Ізолюйте пов'язані системи",
      "Зверніться до правоохоронців",
      "Активуйте протокол інцидентів",
      "Повідомте всіх постраждалих",
    ],
  };
  return recommendations[riskLevel] || recommendations.medium;
}

function mapRiskLevel(level: string): string {
  const map: Record<string, string> = {
    low: "БЕЗПЕЧНО",
    medium: "УВАГА",
    high: "НЕБЕЗПЕЧНО",
    critical: "КРИТИЧНО",
  };
  return map[level] || "УВАГА";
}

function getDefaultVerdict(riskLevel: string): string {
  const verdicts: Record<string, string> = {
    low: "Безпечно для використання",
    medium: "Рекомендується додатковий моніторинг",
    high: "Висока ймовірність загрози",
    critical: "Критична загроза - негайні дії",
  };
  return verdicts[riskLevel] || "Потребує уваги";
}
