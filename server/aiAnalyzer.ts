import OpenAI from "openai";

// Lazy initialization - only create client when needed and credentials exist
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  
  if (!apiKey || !baseURL) {
    return null;
  }
  
  return new OpenAI({ apiKey, baseURL });
}

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

export async function generateAIAnalysis(input: AnalysisInput): Promise<AIAnalysis> {
  const openai = getOpenAIClient();
  
  // If no AI credentials, return default analysis
  if (!openai) {
    return {
      summary: getDefaultSummary(input),
      recommendations: getDefaultRecommendations(input.riskLevel),
      threatLevel: mapRiskLevel(input.riskLevel),
      verdict: getDefaultVerdict(input.riskLevel),
    };
  }
  
  try {
    const prompt = `You are a cybersecurity expert analyzing security data. Analyze this ${input.type} check result and provide a professional assessment.

Target: ${input.target}
Risk Score: ${input.riskScore}/100
Risk Level: ${input.riskLevel}
Findings: ${input.findings.join("; ")}
Details: ${JSON.stringify(input.details, null, 2)}

Respond in JSON format with these fields:
- summary: A 2-3 sentence professional security summary in Ukrainian
- recommendations: Array of 3-5 specific actionable recommendations in Ukrainian  
- threatLevel: One of "БЕЗПЕЧНО", "УВАГА", "НЕБЕЗПЕЧНО", "КРИТИЧНО"
- verdict: A one-line verdict in Ukrainian (max 15 words)`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return {
      summary: result.summary || "Аналіз завершено успішно.",
      recommendations: result.recommendations || ["Продовжуйте моніторинг"],
      threatLevel: result.threatLevel || "УВАГА",
      verdict: result.verdict || "Потребує додаткового аналізу",
    };
  } catch (error) {
    console.error("AI Analysis error:", error);
    return {
      summary: getDefaultSummary(input),
      recommendations: getDefaultRecommendations(input.riskLevel),
      threatLevel: mapRiskLevel(input.riskLevel),
      verdict: getDefaultVerdict(input.riskLevel),
    };
  }
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
