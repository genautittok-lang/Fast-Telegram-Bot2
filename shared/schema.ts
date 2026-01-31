import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("ds_users", {
  id: serial("id").primaryKey(),
  tgId: text("tg_id").notNull().unique(),
  username: text("username"),
  lang: text("lang").default("uk"),
  langSet: boolean("lang_set").default(false),
  tier: text("tier").default("FREE"),
  requestsLeft: integer("requests_left").default(15),
  streakDays: integer("streak_days").default(0),
  refCode: text("ref_code").unique(),
  discountPct: integer("discount_pct").default(0),
  blocked: boolean("blocked").default(false),
  theme: text("theme").default("dark"),
  notifsOn: boolean("notifs_on").default(true),
  digestsOn: boolean("digests_on").default(true),
  lastLogin: timestamp("last_login").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("ds_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  objectType: text("object_type").notNull(),
  dataJson: jsonb("data_json"),
  pdfPath: text("pdf_path"),
  verificationId: text("verification_id"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const watches = pgTable("ds_watches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  objectType: text("object_type").notNull(),
  value: text("value").notNull(),
  thresholdsJson: jsonb("thresholds_json"),
  status: text("status").default("low"),
  lastCheck: timestamp("last_check"),
  alertsOn: boolean("alerts_on").default(true),
});

export const payments = pgTable("ds_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  tier: text("tier").notNull(),
  amountUsdt: decimal("amount_usdt").notNull(),
  txHash: text("tx_hash"),
  screenshotUrl: text("screenshot_url"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("ds_referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id),
  referredId: integer("referred_id").references(() => users.id),
  paid: boolean("paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("ds_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // e.g., 'risk_hunter', 'scam_slayer'
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, generatedAt: true });
export const insertWatchSchema = createInsertSchema(watches).omit({ id: true, lastCheck: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, unlockedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Report = typeof reports.$inferSelect;
export type Watch = typeof watches.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;

// Note: Replit Auth tables are in shared/models/auth.ts
// Import them directly where needed to avoid type conflicts

// Re-export chat models for AI integrations
export * from "./models/chat";
