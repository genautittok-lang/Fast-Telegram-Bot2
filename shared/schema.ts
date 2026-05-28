import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, index, uniqueIndex } from "drizzle-orm/pg-core";
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
  requestsLeft: integer("requests_left").default(3),
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
  pendingRefCode: text("pending_ref_code"),
  companyName: text("company_name"),
  companyLogoUrl: text("company_logo_url"),
  brandColor: text("brand_color"),
  slackWebhookUrl: text("slack_webhook_url"),
  teamsWebhookUrl: text("teams_webhook_url"),
  payoutAddress: text("payout_address"),
  payoutCurrency: text("payout_currency"),
  alorVpnToken: text("alor_vpn_token"),
  alorVpnUuid: text("alor_vpn_uuid"),
  alorVpnSubscriptionUrl: text("alor_vpn_subscription_url"),
  alorVpnExpiresAt: timestamp("alor_vpn_expires_at"),
});

export const reports = pgTable("ds_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  objectType: text("object_type").notNull(),
  dataJson: jsonb("data_json"),
  pdfPath: text("pdf_path"),
  verificationId: text("verification_id"),
  generatedAt: timestamp("generated_at").defaultNow(),
}, (table) => [
  index("idx_reports_user_id").on(table.userId),
]);

export const watches = pgTable("ds_watches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  objectType: text("object_type").notNull(),
  value: text("value").notNull(),
  thresholdsJson: jsonb("thresholds_json"),
  status: text("status").default("low"),
  lastCheck: timestamp("last_check"),
  alertsOn: boolean("alerts_on").default(true),
}, (table) => [
  index("idx_watches_user_id").on(table.userId),
]);

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
}, (table) => [
  index("idx_payments_user_id").on(table.userId),
  index("idx_payments_status").on(table.status),
]);

export const vpnDevices = pgTable("ds_vpn_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fingerprint: text("fingerprint").notNull(),
  deviceName: text("device_name"),
  userAgent: text("user_agent"),
  ipPrefix: text("ip_prefix"),
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  revokedAt: timestamp("revoked_at"),
}, (table) => [
  index("idx_vpn_devices_user_id").on(table.userId),
  uniqueIndex("idx_vpn_devices_user_fp").on(table.userId, table.fingerprint),
]);

export const referrals = pgTable("ds_referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id),
  referredId: integer("referred_id").references(() => users.id),
  paid: boolean("paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_referrals_referrer_id").on(table.referrerId),
  uniqueIndex("idx_referrals_referred_id_unique").on(table.referredId),
]);

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
  type: text("type").notNull(),
  value: integer("value").notNull(),
  tier: text("tier"),
  maxUses: integer("max_uses").default(1),
  usedCount: integer("used_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  description: text("description"),
  imageUrl: text("image_url"),
  isPublic: boolean("is_public").default(false),
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
}, (table) => [
  index("idx_team_members_team_id").on(table.teamId),
  index("idx_team_members_user_id").on(table.userId),
]);

export const favorites = pgTable("ds_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  checkType: text("check_type").notNull(),
  value: text("value").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_favorites_user_id").on(table.userId),
]);

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
}, (table) => [
  index("idx_chat_messages_team_id").on(table.teamId),
  index("idx_chat_messages_user_id").on(table.userId),
]);

export const adminMessages = pgTable("ds_admin_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  sender: text("sender").notNull(),
  ticketId: integer("ticket_id").references(() => supportTickets.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLog = pgTable("ds_activity_log", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  userId: integer("user_id").references(() => users.id),
  username: text("username"),
  details: text("details"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_activity_log_user_id").on(table.userId),
  index("idx_activity_log_event_type").on(table.eventType),
]);

export const chatReactions = pgTable("ds_chat_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => chatMessages.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_chat_reactions_message_id").on(table.messageId),
]);

export const pushSubscriptions = pgTable("ds_push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_push_subscriptions_user_id").on(table.userId),
]);

// GDPR data deletion requests (right to be forgotten)
export const dataDeletionRequests = pgTable("ds_data_deletion_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull(),
  identifier: text("identifier"),
  reason: text("reason"),
  status: text("status").default("pending"),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_deletion_requests_status").on(table.status),
]);

// Cached AI Threat Profiles (PRO+ feature)
export const threatProfiles = pgTable("ds_threat_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  query: text("query").notNull(),
  queryType: text("query_type").notNull(),
  profileJson: jsonb("profile_json").notNull(),
  confidenceScore: integer("confidence_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_threat_profiles_user_id").on(table.userId),
]);

// GDPR Takedown letters generated by users
export const takedownLetters = pgTable("ds_takedown_letters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  recipientType: text("recipient_type").notNull(),
  recipientName: text("recipient_name"),
  recipientEmail: text("recipient_email"),
  dataDescription: text("data_description").notNull(),
  jurisdiction: text("jurisdiction").default("EU"),
  language: text("language").default("uk"),
  letterText: text("letter_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_takedown_letters_user_id").on(table.userId),
]);

export const adBanners = pgTable("ds_ad_banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  mediaType: text("media_type").default("image"),
  linkUrl: text("link_url"),
  linkText: text("link_text"),
  bgGradient: text("bg_gradient").default("from-purple-600/20 via-pink-500/10 to-transparent"),
  position: text("position").default("dashboard"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  showForTiers: text("show_for_tiers").array().default(["FREE", "PRO"]),
  createdAt: timestamp("created_at").defaultNow(),
});

// VPN — own WireGuard infrastructure (Phase 6)
export const vpnServers = pgTable("ds_vpn_servers", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  countryCode: text("country_code").notNull(),
  flag: text("flag").notNull(),
  hostname: text("hostname").notNull(),
  publicEndpoint: text("public_endpoint").notNull(),
  port: integer("port").notNull().default(51820),
  serverPublicKey: text("server_public_key").notNull(),
  capacity: integer("capacity").notNull().default(100),
  used: integer("used").notNull().default(0),
  status: text("status").notNull().default("active"),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vpnPeers = pgTable("ds_vpn_peers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serverId: integer("server_id").notNull().references(() => vpnServers.id, { onDelete: "cascade" }),
  peerPublicKey: text("peer_public_key").notNull(),
  peerPrivateKey: text("peer_private_key").notNull(),
  presharedKey: text("preshared_key"),
  allowedIp: text("allowed_ip").notNull(),
  dns: text("dns").default("1.1.1.1, 1.0.0.1"),
  expiresAt: timestamp("expires_at"),
  trafficUsed: integer("traffic_used").default(0),
  status: text("status").notNull().default("active"),
  lastHandshakeAt: timestamp("last_handshake_at"),
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
export const insertAdminMessageSchema = createInsertSchema(adminMessages).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export const insertAdBannerSchema = createInsertSchema(adBanners).omit({ id: true, createdAt: true });
export const insertDataDeletionRequestSchema = createInsertSchema(dataDeletionRequests).omit({ id: true, createdAt: true, resolvedAt: true, status: true, adminNotes: true });
export const insertThreatProfileSchema = createInsertSchema(threatProfiles).omit({ id: true, createdAt: true });
export const insertTakedownLetterSchema = createInsertSchema(takedownLetters).omit({ id: true, createdAt: true });
export const insertVpnServerSchema = createInsertSchema(vpnServers).omit({ id: true, createdAt: true, used: true });
export const insertVpnPeerSchema = createInsertSchema(vpnPeers).omit({ id: true, createdAt: true, lastHandshakeAt: true, trafficUsed: true });

export type VpnServer = typeof vpnServers.$inferSelect;
export type InsertVpnServer = z.infer<typeof insertVpnServerSchema>;
export type VpnPeer = typeof vpnPeers.$inferSelect;
export type InsertVpnPeer = z.infer<typeof insertVpnPeerSchema>;
export type VpnDevice = typeof vpnDevices.$inferSelect;
export const insertVpnDeviceSchema = createInsertSchema(vpnDevices).omit({ id: true, firstSeen: true, lastSeen: true, revokedAt: true });
export type InsertVpnDevice = z.infer<typeof insertVpnDeviceSchema>;

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
export type AdminMessage = typeof adminMessages.$inferSelect;
export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type AdBanner = typeof adBanners.$inferSelect;
export type InsertAdBanner = z.infer<typeof insertAdBannerSchema>;

export type DataDeletionRequest = typeof dataDeletionRequests.$inferSelect;
export type InsertDataDeletionRequest = z.infer<typeof insertDataDeletionRequestSchema>;
export type ThreatProfile = typeof threatProfiles.$inferSelect;
export type InsertThreatProfile = z.infer<typeof insertThreatProfileSchema>;
export type TakedownLetter = typeof takedownLetters.$inferSelect;
export type InsertTakedownLetter = z.infer<typeof insertTakedownLetterSchema>;

// Note: Replit Auth tables are in shared/models/auth.ts
// Import them directly where needed to avoid type conflicts

// Re-export chat models for AI integrations
export * from "./models/chat";
