import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("ds_users", {
  id: serial("id").primaryKey(),
  tgId: text("tg_id").notNull().unique(),
  username: text("username"),
  photoUrl: text("photo_url"),
  lang: text("lang").default("uk"),
  langSet: boolean("lang_set").default(false),
  tier: text("tier").default("FREE"),
  requestsLeft: integer("requests_left").default(5),
  streakDays: integer("streak_days").default(0),
  refCode: text("ref_code").unique(),
  discountPct: integer("discount_pct").default(0),
  blocked: boolean("blocked").default(false),
  theme: text("theme").default("dark"),
  notifsOn: boolean("notifs_on").default(true),
  digestsOn: boolean("digests_on").default(true),
  lastLogin: timestamp("last_login").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  cardToken: text("card_token"),
  autoRenew: boolean("auto_renew").default(false),
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").default(false),
  lastReminderSent: timestamp("last_reminder_sent"),
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
  invoiceId: text("invoice_id"),
  period: text("period"),
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

// Coupon system for admin
export const coupons = pgTable("ds_coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // 'checks' or 'tier'
  value: integer("value").notNull(), // number of checks or tier upgrade
  tier: text("tier"), // for tier upgrades: 'PRO' or 'ENTERPRISE'
  maxUses: integer("max_uses").default(1),
  usedCount: integer("used_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Track coupon usage
export const couponUsages = pgTable("ds_coupon_usages", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").references(() => coupons.id),
  userId: integer("user_id").references(() => users.id),
  usedAt: timestamp("used_at").defaultNow(),
});

// Admin settings for payment amounts
export const adminSettings = pgTable("ds_admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportTickets = pgTable("ds_support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  message: text("message").notNull(),
  status: text("status").default("open"),
  adminReply: text("admin_reply"),
  source: text("source").default("web"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teams = pgTable("ds_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  maxMembers: integer("max_members").default(10),
  inviteCode: text("invite_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("ds_team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const favorites = pgTable("ds_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  checkType: text("check_type").notNull(),
  value: text("value").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("ds_chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  username: text("username"),
  photoUrl: text("photo_url"),
  message: text("message").notNull(),
  messageType: text("message_type").default("text"),
  fileUrl: text("file_url"),
  teamId: integer("team_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastReminderSent: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, generatedAt: true });
export const insertWatchSchema = createInsertSchema(watches).omit({ id: true, lastCheck: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, unlockedAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true, usedCount: true });
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ id: true, updatedAt: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, joinedAt: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Report = typeof reports.$inferSelect;
export type Watch = typeof watches.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Note: Replit Auth tables are in shared/models/auth.ts
// Import them directly where needed to avoid type conflicts

// Re-export chat models for AI integrations
export * from "./models/chat";
