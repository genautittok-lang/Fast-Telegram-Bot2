import fs from "fs";
import path from "path";

export interface EmojiSlot {
  id: string;
  fallback: string;
  description: string;
}

const STORE_PATH = path.resolve(process.cwd(), "server", "data", "premium-emojis.json");

const DEFAULT_SLOTS: Record<string, EmojiSlot> = {
  shield:    { id: "", fallback: "🛡",  description: "Захист, головна іконка бренду" },
  fire:      { id: "", fallback: "🔥",  description: "Гарячі/нові пропозиції, акції" },
  star:      { id: "", fallback: "⭐",  description: "Преміум, оцінка, важливе" },
  warning:   { id: "", fallback: "⚠️",  description: "Попередження середнього ризику" },
  check:     { id: "", fallback: "✅",  description: "Успішна дія, підтвердження" },
  cross:     { id: "", fallback: "❌",  description: "Помилка, відмова, відхилення" },
  rocket:    { id: "", fallback: "🚀",  description: "Старт, апгрейд, оновлення" },
  crown:     { id: "", fallback: "👑",  description: "ENTERPRISE / VIP / адмін" },
  diamond:   { id: "", fallback: "💎",  description: "PRO тариф, ексклюзивне" },
  eye:       { id: "", fallback: "👁",  description: "Моніторинг, спостереження" },
  lock:      { id: "", fallback: "🔒",  description: "Безпека, шифрування, 2FA" },
  key:       { id: "", fallback: "🔑",  description: "API-ключ, доступ" },
  zap:       { id: "", fallback: "⚡",  description: "Швидко, миттєво" },
  globe:     { id: "", fallback: "🌐",  description: "Мова, інтернет, IP" },
  bug:       { id: "", fallback: "🐛",  description: "CVE / вразливості" },
  search:    { id: "", fallback: "🔎",  description: "Перевірка, пошук" },
  bot:       { id: "", fallback: "🤖",  description: "Бот, AI, автоматизація" },
  bell:      { id: "", fallback: "🔔",  description: "Сповіщення, алерт" },
  pin:       { id: "", fallback: "📌",  description: "Закріплене, важливе" },
  scroll:    { id: "", fallback: "📜",  description: "Звіт, документ, PDF" },
  chart:     { id: "", fallback: "📊",  description: "Статистика, дашборд" },
  card:      { id: "", fallback: "💳",  description: "Оплата, картка" },
  money:     { id: "", fallback: "💰",  description: "Тарифи, ціна" },
  envelope:  { id: "", fallback: "✉️",  description: "Email, повідомлення" },
  wave:      { id: "", fallback: "👋",  description: "Привітання" },
  party:     { id: "", fallback: "🎉",  description: "Успіх, святкування" },
  link:      { id: "", fallback: "🔗",  description: "Посилання, реферал" },
  people:    { id: "", fallback: "👥",  description: "Команда, реферали" },
  gift:      { id: "", fallback: "🎁",  description: "Бонус, подарунок" },
  thinking:  { id: "", fallback: "🤔",  description: "Стан невизначеності" },
  rocket_up: { id: "", fallback: "📈",  description: "Зростання, апгрейд" },
  arrow:     { id: "", fallback: "➡️",  description: "Перехід, далі" },
  back:      { id: "", fallback: "⬅️",  description: "Назад" },
  cog:       { id: "", fallback: "⚙️",  description: "Налаштування" },
  ghost:     { id: "", fallback: "👻",  description: "Анонім, прихований" },
  sparkle:   { id: "", fallback: "✨",  description: "Магія, AI-фіча" },
  trophy:    { id: "", fallback: "🏆",  description: "Досягнення, лідер" },
  high_risk: { id: "", fallback: "🔴",  description: "Високий ризик" },
  med_risk:  { id: "", fallback: "🟡",  description: "Середній ризик" },
  low_risk:  { id: "", fallback: "🟢",  description: "Низький ризик / OK" },
};

let cache: Record<string, EmojiSlot> | null = null;

function load(): Record<string, EmojiSlot> {
  if (cache) return cache;
  let saved: Record<string, Partial<EmojiSlot>> = {};
  try {
    if (fs.existsSync(STORE_PATH)) {
      saved = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    }
  } catch (e) {
    console.warn("[premium-emoji] load failed, using defaults:", (e as Error).message);
  }
  const merged: Record<string, EmojiSlot> = {};
  for (const [slot, def] of Object.entries(DEFAULT_SLOTS)) {
    merged[slot] = { ...def, ...(saved[slot] || {}) };
  }
  // Allow custom slots not in defaults too
  for (const [slot, def] of Object.entries(saved)) {
    if (!merged[slot]) {
      merged[slot] = {
        id: def.id || "",
        fallback: def.fallback || "⭐",
        description: def.description || "",
      };
    }
  }
  cache = merged;
  return cache;
}

function persist(): void {
  if (!cache) return;
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(cache, null, 2), "utf8");
  } catch (e) {
    console.warn("[premium-emoji] save failed:", (e as Error).message);
  }
}

/**
 * Render a premium emoji slot.
 * - If `mode='html'` and slot has an id, returns `<tg-emoji emoji-id="…">fallback</tg-emoji>`
 * - Otherwise returns the unicode fallback emoji.
 */
export function pe(slot: string, mode: "html" | "plain" = "html"): string {
  const m = load()[slot];
  if (!m) return "";
  if (mode === "plain" || !m.id) return m.fallback;
  return `<tg-emoji emoji-id="${m.id}">${m.fallback}</tg-emoji>`;
}

/**
 * Bind a slot to a custom_emoji_id. Persisted to disk.
 */
export function setEmoji(slot: string, id: string, fallback?: string, description?: string): EmojiSlot {
  load();
  const existing = cache![slot] || { id: "", fallback: fallback || "⭐", description: description || "" };
  cache![slot] = {
    id,
    fallback: fallback || existing.fallback || "⭐",
    description: description || existing.description || "",
  };
  persist();
  return cache![slot];
}

/**
 * Clear a slot (back to fallback emoji only).
 */
export function clearEmoji(slot: string): boolean {
  load();
  if (!cache![slot]) return false;
  cache![slot] = { ...cache![slot], id: "" };
  persist();
  return true;
}

export function getMappings(): Record<string, EmojiSlot> {
  return { ...load() };
}

export function listSlots(): string[] {
  return Object.keys(load());
}

/**
 * Heuristic: given a fallback emoji, find the slot whose default fallback matches.
 * Used by /emojiid auto-suggest to map captured emojis to semantic slots.
 */
export function suggestSlotForEmoji(emoji: string): string | null {
  const map = load();
  for (const [slot, def] of Object.entries(map)) {
    if (def.fallback === emoji || def.fallback.startsWith(emoji)) return slot;
  }
  return null;
}

/** Telegram entity helper — extract custom emojis from a message text + entities. */
export interface CapturedEmoji {
  fallback: string;
  customEmojiId: string;
  suggestedSlot: string | null;
}

export function extractCustomEmojis(text: string, entities: any[] | undefined): CapturedEmoji[] {
  if (!entities?.length) return [];
  const out: CapturedEmoji[] = [];
  // Telegram offsets/lengths are in UTF-16 code units. Use Array.from for code-points,
  // but slicing by raw indices works because text is already UTF-16 in JS strings.
  for (const e of entities) {
    if (e.type !== "custom_emoji" || !e.custom_emoji_id) continue;
    const fallback = text.substr(e.offset, e.length);
    out.push({
      fallback,
      customEmojiId: e.custom_emoji_id,
      suggestedSlot: suggestSlotForEmoji(fallback),
    });
  }
  return out;
}

/** HTML escape for safe inclusion in HTML-mode messages. */
export function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
