import { users, reports, watches, payments, referrals, coupons, couponUsages, adminSettings, supportTickets, teams, teamMembers, type User, type InsertUser, type Report, type Watch, type Payment, type Coupon, type InsertCoupon, type AdminSetting, type SupportTicket, type InsertSupportTicket, type Team, type InsertTeam, type TeamMember, type InsertTeamMember } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";

export interface ReferralStats {
  count: number;
  pendingCount: number;
  referredUsers: Array<{
    id: number;
    username: string | null;
    tier: string | null;
    createdAt: Date | null;
    paid: boolean;
  }>;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByTgId(tgId: string): Promise<User | undefined>;
  getUserByRefCode(refCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  updateUserLogin(id: number): Promise<void>;
  
  // Reports
  createReport(report: any): Promise<Report>;
  getReports(userId: number): Promise<Report[]>;
  getReportById(id: number): Promise<Report | undefined>;
  getReportByVerificationId(verificationId: string): Promise<Report | undefined>;
  
  // Watches
  createWatch(watch: any): Promise<Watch>;
  getWatches(userId: number): Promise<Watch[]>;
  updateWatch(id: number, updates: Partial<Watch>): Promise<Watch>;
  deleteWatch(id: number): Promise<void>;
  
  // Payments
  createPayment(payment: any): Promise<Payment>;
  getPaymentById(id: number): Promise<Payment | undefined>;
  getPendingPayments(): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string): Promise<Payment>;
  
  // Referrals
  getReferralStats(userId: number): Promise<ReferralStats>;
  createReferral(data: { referrerId: number; referredId: number; bonus?: number }): Promise<void>;
  
  // Stats
  getStats(): Promise<{ totalUsers: number, activeWatches: number, totalReports?: number, checksToday?: number, threatsBlocked?: number, pendingPayments?: number }>;
  getUsersCount(): Promise<number>;
  getReportsCount(): Promise<number>;
  getWatchesCount(): Promise<number>;
  getReportsCountToday(): Promise<number>;
  getHighRiskReportsCount(): Promise<number>;
  getTopUsers(limit: number): Promise<Array<{ id: number; username: string | null; checksCount: number; streakDays: number }>>;
  
  // Admin methods
  getLatestUsers(limit: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  blockUser(userId: number, blocked: boolean): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  // Coupon methods
  getCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  deleteCoupon(id: number): Promise<void>;
  useCoupon(couponId: number, userId: number): Promise<void>;
  
  // Admin settings
  getAdminSetting(key: string): Promise<string | undefined>;
  setAdminSetting(key: string, value: string): Promise<void>;
  getAllAdminSettings(): Promise<AdminSetting[]>;

  // Support tickets
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketsByUser(userId: number): Promise<SupportTicket[]>;
  updateSupportTicketStatus(id: number, status: string, adminReply?: string): Promise<SupportTicket>;

  // All payments (not just pending)
  getAllPayments(): Promise<Payment[]>;

  // Additional admin methods
  getTicketById(id: number): Promise<SupportTicket | undefined>;
  getLatestReportsAll(limit: number): Promise<Report[]>;
  addRequestsToUser(userId: number, amount: number): Promise<User>;

  // Teams
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamById(id: number): Promise<Team | undefined>;
  getTeamsByOwner(ownerId: number): Promise<Team[]>;
  getTeamsByUser(userId: number): Promise<Array<Team & { role: string }>>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<void>;
  getTeamMembers(teamId: number): Promise<Array<TeamMember & { username: string | null; tier: string | null }>>;
  updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember>;
  getTeamByInviteCode(code: string): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTgId(tgId: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq(users.tgId, tgId));
    return user;
  }

  async getUserByRefCode(refCode: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq(users.refCode, refCode));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async updateUserLogin(id: number): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, id));
  }

  async createReport(insertReport: any): Promise<Report> {
    if (!db) throw new Error("Database not available");
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  async getReports(userId: number): Promise<Report[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(reports).where(eq(reports.userId, userId));
  }

  async getReportById(id: number): Promise<Report | undefined> {
    if (!db) throw new Error("Database not available");
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReportByVerificationId(verificationId: string): Promise<Report | undefined> {
    if (!db) throw new Error("Database not available");
    const [report] = await db.select().from(reports).where(eq(reports.verificationId, verificationId));
    return report;
  }

  async createWatch(insertWatch: any): Promise<Watch> {
    if (!db) throw new Error("Database not available");
    const [watch] = await db.insert(watches).values(insertWatch).returning();
    return watch;
  }

  async getWatches(userId: number): Promise<Watch[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(watches).where(eq(watches.userId, userId));
  }

  async updateWatch(id: number, updates: Partial<Watch>): Promise<Watch> {
    if (!db) throw new Error("Database not available");
    const [watch] = await db.update(watches).set(updates).where(eq(watches.id, id)).returning();
    return watch;
  }

  async deleteWatch(id: number): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.delete(watches).where(eq(watches.id, id));
  }

  async getStats(): Promise<{ totalUsers: number, activeWatches: number, totalReports?: number, checksToday?: number, threatsBlocked?: number, pendingPayments?: number }> {
    if (!db) throw new Error("Database not available");
    try {
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [watchCount] = await db.select({ count: sql<number>`count(*)` }).from(watches).where(eq(watches.alertsOn, true));
      const [reportCount] = await db.select({ count: sql<number>`count(*)` }).from(reports);
      const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "pending"));
      
      // Count reports from today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [todayCount] = await db.select({ count: sql<number>`count(*)` }).from(reports).where(
        sql`${reports.generatedAt} >= ${todayStart}`
      );
      
      return {
        totalUsers: Number(userCount?.count || 0),
        activeWatches: Number(watchCount?.count || 0),
        totalReports: Number(reportCount?.count || 0),
        checksToday: Number(todayCount?.count || 0),
        threatsBlocked: Math.floor(Number(reportCount?.count || 0) * 0.1),
        pendingPayments: Number(pendingCount?.count || 0),
      };
    } catch (err) {
      console.warn("Database tables not ready:", (err as Error).message);
      return { totalUsers: 0, activeWatches: 0, totalReports: 0, checksToday: 0, threatsBlocked: 0, pendingPayments: 0 };
    }
  }

  async getLatestUsers(limit: number): Promise<User[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
  }

  async getAllUsers(): Promise<User[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(users);
  }

  async blockUser(userId: number, blocked: boolean): Promise<User> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.update(users).set({ blocked }).where(eq(users.id, userId)).returning();
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!db) throw new Error("Database not available");
    const lowercaseQuery = query.toLowerCase();
    const allUsers = await db.select().from(users);
    return allUsers.filter(u => 
      u.tgId.includes(query) || 
      (u.username && u.username.toLowerCase().includes(lowercaseQuery))
    );
  }

  async createPayment(insertPayment: any): Promise<Payment> {
    if (!db) throw new Error("Database not available");
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async getPaymentById(id: number): Promise<Payment | undefined> {
    if (!db) throw new Error("Database not available");
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPendingPayments(): Promise<Payment[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(payments).where(eq(payments.status, "pending"));
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    if (!db) throw new Error("Database not available");
    const [payment] = await db.update(payments).set({ status }).where(eq(payments.id, id)).returning();
    return payment;
  }

  async getReferralStats(userId: number): Promise<ReferralStats> {
    if (!db) throw new Error("Database not available");
    try {
      const referralRecords = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
      
      const referredUsers: ReferralStats["referredUsers"] = [];
      let pendingCount = 0;
      
      for (const ref of referralRecords) {
        if (ref.referredId) {
          const [refUser] = await db.select().from(users).where(eq(users.id, ref.referredId));
          if (refUser) {
            referredUsers.push({
              id: refUser.id,
              username: refUser.username,
              tier: refUser.tier,
              createdAt: refUser.createdAt,
              paid: ref.paid ?? false,
            });
            if (!ref.paid) {
              pendingCount++;
            }
          }
        }
      }
      
      // Deduplicate by user ID
      const uniqueReferredUsers = referredUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      
      // Recalculate pending count from unique users
      const uniquePendingCount = uniqueReferredUsers.filter(u => !u.paid).length;
      
      return {
        count: uniqueReferredUsers.length,
        pendingCount: uniquePendingCount,
        referredUsers: uniqueReferredUsers,
      };
    } catch (err) {
      console.warn("Error fetching referral stats:", (err as Error).message);
      return { count: 0, pendingCount: 0, referredUsers: [] };
    }
  }

  async createReferral(data: { referrerId: number; referredId: number; bonus?: number }): Promise<void> {
    if (!db) throw new Error("Database not available");
    try {
      await db.insert(referrals).values({
        referrerId: data.referrerId,
        referredId: data.referredId,
        paid: false,
      });
    } catch (err) {
      // Ignore duplicate errors
      console.warn("Referral creation error (likely duplicate):", (err as Error).message);
    }
  }

  // Coupon methods
  async getCoupons(): Promise<Coupon[]> {
    if (!db) throw new Error("Database not available");
    return db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    if (!db) throw new Error("Database not available");
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    if (!db) throw new Error("Database not available");
    const [created] = await db.insert(coupons).values(coupon).returning();
    return created;
  }

  async deleteCoupon(id: number): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async useCoupon(couponId: number, userId: number): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.insert(couponUsages).values({ couponId, userId });
    await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, couponId));
  }

  // Admin settings
  async getAdminSetting(key: string): Promise<string | undefined> {
    if (!db) throw new Error("Database not available");
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return setting?.value;
  }

  async setAdminSetting(key: string, value: string): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.insert(adminSettings).values({ key, value })
      .onConflictDoUpdate({ target: adminSettings.key, set: { value, updatedAt: new Date() } });
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    if (!db) throw new Error("Database not available");
    return db.select().from(adminSettings);
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    if (!db) throw new Error("Database not available");
    const [created] = await db.insert(supportTickets).values(ticket).returning();
    return created;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    if (!db) throw new Error("Database not available");
    return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicketsByUser(userId: number): Promise<SupportTicket[]> {
    if (!db) throw new Error("Database not available");
    return db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicketStatus(id: number, status: string, adminReply?: string): Promise<SupportTicket> {
    if (!db) throw new Error("Database not available");
    const updates: any = { status };
    if (adminReply !== undefined) updates.adminReply = adminReply;
    const [ticket] = await db.update(supportTickets).set(updates).where(eq(supportTickets.id, id)).returning();
    return ticket;
  }

  async getAllPayments(): Promise<Payment[]> {
    if (!db) throw new Error("Database not available");
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getTicketById(id: number): Promise<SupportTicket | undefined> {
    if (!db) throw new Error("Database not available");
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket;
  }

  async getLatestReportsAll(limit: number): Promise<Report[]> {
    if (!db) throw new Error("Database not available");
    return db.select().from(reports).orderBy(desc(reports.generatedAt)).limit(limit);
  }

  async addRequestsToUser(userId: number, amount: number): Promise<User> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.update(users).set({ requestsLeft: sql`${users.requestsLeft} + ${amount}` }).where(eq(users.id, userId)).returning();
    return user;
  }

  async getUsersCount(): Promise<number> {
    if (!db) throw new Error("Database not available");
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0]?.count || 0;
  }

  async getReportsCount(): Promise<number> {
    if (!db) throw new Error("Database not available");
    const result = await db.select({ count: sql<number>`count(*)` }).from(reports);
    return result[0]?.count || 0;
  }

  async getWatchesCount(): Promise<number> {
    if (!db) throw new Error("Database not available");
    const result = await db.select({ count: sql<number>`count(*)` }).from(watches);
    return result[0]?.count || 0;
  }

  async getReportsCountToday(): Promise<number> {
    if (!db) throw new Error("Database not available");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db.select({ count: sql<number>`count(*)` }).from(reports)
      .where(sql`${reports.generatedAt} >= ${today}`);
    return result[0]?.count || 0;
  }

  async getHighRiskReportsCount(): Promise<number> {
    if (!db) throw new Error("Database not available");
    // Count reports where dataJson contains high or critical risk
    const allReports = await db.select().from(reports);
    return allReports.filter(r => {
      const data = r.dataJson as any;
      return data?.riskLevel === 'high' || data?.riskLevel === 'critical';
    }).length;
  }

  async getTopUsers(limit: number): Promise<Array<{ id: number; username: string | null; checksCount: number; streakDays: number }>> {
    if (!db) throw new Error("Database not available");
    // Get users with their report counts
    const allUsers = await db.select().from(users).orderBy(desc(users.streakDays)).limit(limit * 2);
    const result: Array<{ id: number; username: string | null; checksCount: number; streakDays: number }> = [];
    
    for (const u of allUsers) {
      const userReports = await db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.userId, u.id));
      result.push({
        id: u.id,
        username: u.username,
        checksCount: userReports[0]?.count || 0,
        streakDays: u.streakDays || 0,
      });
    }
    
    // Sort by checksCount and return top N
    return result.sort((a, b) => b.checksCount - a.checksCount).slice(0, limit);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    if (!db) throw new Error("Database not available");
    const inviteCode = 'DS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const [created] = await db.insert(teams).values({ ...team, inviteCode }).returning();
    return created;
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    if (!db) throw new Error("Database not available");
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamByInviteCode(code: string): Promise<Team | undefined> {
    if (!db) throw new Error("Database not available");
    const [team] = await db.select().from(teams).where(eq(teams.inviteCode, code));
    return team;
  }

  async getTeamsByOwner(ownerId: number): Promise<Team[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(teams).where(eq(teams.ownerId, ownerId));
  }

  async getTeamsByUser(userId: number): Promise<Array<Team & { role: string }>> {
    if (!db) throw new Error("Database not available");
    const owned = await db.select().from(teams).where(eq(teams.ownerId, userId));
    const memberships = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    const result: Array<Team & { role: string }> = owned.map(t => ({ ...t, role: "owner" }));
    for (const m of memberships) {
      const [team] = await db.select().from(teams).where(eq(teams.id, m.teamId));
      if (team && !result.find(r => r.id === team.id)) {
        result.push({ ...team, role: m.role || "member" });
      }
    }
    return result;
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    if (!db) throw new Error("Database not available");
    const [created] = await db.insert(teamMembers).values(member).returning();
    return created;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.delete(teamMembers).where(sql`${teamMembers.teamId} = ${teamId} AND ${teamMembers.userId} = ${userId}`);
  }

  async getTeamMembers(teamId: number): Promise<Array<TeamMember & { username: string | null; tier: string | null }>> {
    if (!db) throw new Error("Database not available");
    const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
    const result: Array<TeamMember & { username: string | null; tier: string | null }> = [];
    for (const m of members) {
      const [user] = await db.select().from(users).where(eq(users.id, m.userId));
      result.push({ ...m, username: user?.username || null, tier: user?.tier || null });
    }
    return result;
  }

  async updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember> {
    if (!db) throw new Error("Database not available");
    const [updated] = await db.update(teamMembers).set({ role }).where(sql`${teamMembers.teamId} = ${teamId} AND ${teamMembers.userId} = ${userId}`).returning();
    return updated;
  }

  async deleteTeam(id: number): Promise<void> {
    if (!db) throw new Error("Database not available");
    await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
    await db.delete(teams).where(eq(teams.id, id));
  }
}

// Memory storage fallback when database is not available
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private reports: Map<number, Report> = new Map();
  private watches: Map<number, Watch> = new Map();
  private payments: Map<number, Payment> = new Map();
  private nextId = { user: 1, report: 1, watch: 1, payment: 1 };

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTgId(tgId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.tgId === tgId);
  }

  async getUserByRefCode(refCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.refCode === refCode);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextId.user++;
    const user: User = {
      id,
      tgId: insertUser.tgId,
      username: insertUser.username || null,
      lang: insertUser.lang || "uk",
      langSet: insertUser.langSet ?? false,
      tier: insertUser.tier || "FREE",
      requestsLeft: insertUser.requestsLeft ?? 5,
      streakDays: insertUser.streakDays ?? 0,
      refCode: insertUser.refCode || null,
      discountPct: insertUser.discountPct ?? 0,
      blocked: insertUser.blocked ?? false,
      theme: insertUser.theme || "dark",
      notifsOn: insertUser.notifsOn ?? true,
      digestsOn: insertUser.digestsOn ?? true,
      lastLogin: new Date(),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async updateUserLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }

  async createReport(insertReport: any): Promise<Report> {
    const id = this.nextId.report++;
    const report: Report = {
      id,
      userId: insertReport.userId,
      objectType: insertReport.objectType,
      dataJson: insertReport.dataJson || {},
      pdfPath: insertReport.pdfPath || null,
      verificationId: insertReport.verificationId || null,
      generatedAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(userId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(r => r.userId === userId);
  }

  async getReportById(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportByVerificationId(verificationId: string): Promise<Report | undefined> {
    return Array.from(this.reports.values()).find(r => r.verificationId === verificationId);
  }

  async createWatch(insertWatch: any): Promise<Watch> {
    const id = this.nextId.watch++;
    const watch: Watch = {
      id,
      userId: insertWatch.userId,
      objectType: insertWatch.objectType,
      value: insertWatch.value,
      thresholdsJson: insertWatch.thresholdsJson || {},
      status: insertWatch.status || "low",
      lastCheck: null,
      alertsOn: insertWatch.alertsOn ?? true,
    };
    this.watches.set(id, watch);
    return watch;
  }

  async getWatches(userId: number): Promise<Watch[]> {
    return Array.from(this.watches.values()).filter(w => w.userId === userId);
  }

  async updateWatch(id: number, updates: Partial<Watch>): Promise<Watch> {
    const watch = this.watches.get(id);
    if (!watch) throw new Error("Watch not found");
    const updated = { ...watch, ...updates };
    this.watches.set(id, updated);
    return updated;
  }

  async deleteWatch(id: number): Promise<void> {
    this.watches.delete(id);
  }

  async createPayment(insertPayment: any): Promise<Payment> {
    const id = this.nextId.payment++;
    const payment: Payment = {
      id,
      userId: insertPayment.userId,
      tier: insertPayment.tier,
      amountUsdt: insertPayment.amountUsdt,
      txHash: insertPayment.txHash || null,
      screenshotUrl: insertPayment.screenshotUrl || null,
      status: insertPayment.status || "pending",
      createdAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPaymentById(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPendingPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.status === "pending");
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    const payment = this.payments.get(id);
    if (!payment) throw new Error("Payment not found");
    payment.status = status;
    this.payments.set(id, payment);
    return payment;
  }

  async getStats(): Promise<{ totalUsers: number, activeWatches: number, totalReports?: number, checksToday?: number, threatsBlocked?: number, pendingPayments?: number }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const allReports = Array.from(this.reports.values());
    const todayReports = allReports.filter(r => r.generatedAt && r.generatedAt >= todayStart);
    const pendingPayments = Array.from(this.payments.values()).filter(p => p.status === "pending");
    
    return {
      totalUsers: this.users.size,
      activeWatches: Array.from(this.watches.values()).filter(w => w.alertsOn).length,
      totalReports: allReports.length,
      checksToday: todayReports.length,
      threatsBlocked: Math.floor(allReports.length * 0.1),
      pendingPayments: pendingPayments.length,
    };
  }

  async getLatestUsers(limit: number): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    return allUsers.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)).slice(0, limit);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async blockUser(userId: number, blocked: boolean): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    user.blocked = blocked;
    this.users.set(userId, user);
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(u => 
      u.tgId.includes(query) || 
      (u.username && u.username.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getReferralStats(userId: number): Promise<ReferralStats> {
    return { count: 0, pendingCount: 0, referredUsers: [] };
  }

  async createReferral(data: { referrerId: number; referredId: number; bonus?: number }): Promise<void> {
    // No-op for memory storage
  }

  // Coupon methods - no-op for memory storage
  async getCoupons(): Promise<Coupon[]> { return []; }
  async getCouponByCode(code: string): Promise<Coupon | undefined> { return undefined; }
  async createCoupon(coupon: InsertCoupon): Promise<Coupon> { throw new Error("Not available"); }
  async deleteCoupon(id: number): Promise<void> {}
  async useCoupon(couponId: number, userId: number): Promise<void> {}
  
  // Admin settings - no-op for memory storage
  async getAdminSetting(key: string): Promise<string | undefined> { return undefined; }
  async setAdminSetting(key: string, value: string): Promise<void> {}
  async getAllAdminSettings(): Promise<AdminSetting[]> { return []; }

  private supportTicketsMap: Map<number, SupportTicket> = new Map();
  private nextSupportTicketId = 1;

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.nextSupportTicketId++;
    const created: SupportTicket = {
      id,
      userId: ticket.userId || null,
      name: ticket.name,
      contact: ticket.contact,
      message: ticket.message,
      status: ticket.status || "open",
      adminReply: ticket.adminReply || null,
      source: ticket.source || "web",
      createdAt: new Date(),
    };
    this.supportTicketsMap.set(id, created);
    return created;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTicketsMap.values()).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getSupportTicketsByUser(userId: number): Promise<SupportTicket[]> {
    return Array.from(this.supportTicketsMap.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async updateSupportTicketStatus(id: number, status: string, adminReply?: string): Promise<SupportTicket> {
    const ticket = this.supportTicketsMap.get(id);
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = status;
    if (adminReply !== undefined) ticket.adminReply = adminReply;
    this.supportTicketsMap.set(id, ticket);
    return ticket;
  }

  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values()).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getTicketById(id: number): Promise<SupportTicket | undefined> {
    return this.supportTicketsMap.get(id);
  }

  async getLatestReportsAll(limit: number): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => (b.generatedAt?.getTime() || 0) - (a.generatedAt?.getTime() || 0))
      .slice(0, limit);
  }

  async addRequestsToUser(userId: number, amount: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    user.requestsLeft = (user.requestsLeft || 0) + amount;
    this.users.set(userId, user);
    return user;
  }

  // Stats methods for MemStorage
  async getUsersCount(): Promise<number> { return this.users.size; }
  async getReportsCount(): Promise<number> { return this.reports.size; }
  async getWatchesCount(): Promise<number> { return this.watches.size; }
  async getReportsCountToday(): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return Array.from(this.reports.values()).filter(r => r.generatedAt && r.generatedAt >= todayStart).length;
  }
  async getHighRiskReportsCount(): Promise<number> {
    return Array.from(this.reports.values()).filter(r => {
      const data = r.dataJson as any;
      return data?.riskLevel === 'high' || data?.riskLevel === 'critical';
    }).length;
  }
  async getTopUsers(limit: number): Promise<Array<{ id: number; username: string | null; checksCount: number; streakDays: number }>> {
    const userReportCounts: Map<number, number> = new Map();
    const reportsArr = Array.from(this.reports.values());
    for (let i = 0; i < reportsArr.length; i++) {
      const r = reportsArr[i];
      if (r.userId) {
        userReportCounts.set(r.userId, (userReportCounts.get(r.userId) || 0) + 1);
      }
    }
    return Array.from(this.users.values())
      .map(u => ({ id: u.id, username: u.username, checksCount: userReportCounts.get(u.id) || 0, streakDays: u.streakDays || 0 }))
      .sort((a, b) => b.checksCount - a.checksCount)
      .slice(0, limit);
  }

  private memTeams: Map<number, Team> = new Map();
  private memTeamMembers: Map<number, TeamMember> = new Map();
  private nextTeamId = 1;
  private nextTeamMemberId = 1;

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.nextTeamId++;
    const inviteCode = 'DS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const created: Team = { id, name: team.name, ownerId: team.ownerId, maxMembers: team.maxMembers ?? 10, inviteCode, createdAt: new Date() };
    this.memTeams.set(id, created);
    return created;
  }
  async getTeamById(id: number): Promise<Team | undefined> {
    return this.memTeams.get(id);
  }
  async getTeamByInviteCode(code: string): Promise<Team | undefined> {
    return Array.from(this.memTeams.values()).find(t => t.inviteCode === code);
  }
  async getTeamsByOwner(ownerId: number): Promise<Team[]> {
    return Array.from(this.memTeams.values()).filter(t => t.ownerId === ownerId);
  }
  async getTeamsByUser(userId: number): Promise<Array<Team & { role: string }>> {
    const owned = Array.from(this.memTeams.values()).filter(t => t.ownerId === userId).map(t => ({ ...t, role: "owner" }));
    const memberOf = Array.from(this.memTeamMembers.values()).filter(m => m.userId === userId);
    for (const m of memberOf) {
      const team = this.memTeams.get(m.teamId);
      if (team && !owned.find(o => o.id === team.id)) owned.push({ ...team, role: m.role || "member" });
    }
    return owned;
  }
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const id = this.nextTeamMemberId++;
    const created: TeamMember = { id, teamId: member.teamId, userId: member.userId, role: member.role ?? "member", joinedAt: new Date() };
    this.memTeamMembers.set(id, created);
    return created;
  }
  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    Array.from(this.memTeamMembers.entries()).forEach(([key, m]) => {
      if (m.teamId === teamId && m.userId === userId) this.memTeamMembers.delete(key);
    });
  }
  async getTeamMembers(teamId: number): Promise<Array<TeamMember & { username: string | null; tier: string | null }>> {
    return Array.from(this.memTeamMembers.values()).filter(m => m.teamId === teamId).map(m => {
      const user = this.users.get(m.userId);
      return { ...m, username: user?.username || null, tier: user?.tier || null };
    });
  }
  async updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember> {
    const entry = Array.from(this.memTeamMembers.entries()).find(([, m]) => m.teamId === teamId && m.userId === userId);
    if (!entry) throw new Error("Team member not found");
    const updated = { ...entry[1], role };
    this.memTeamMembers.set(entry[0], updated);
    return updated;
  }
  async deleteTeam(id: number): Promise<void> {
    Array.from(this.memTeamMembers.entries()).forEach(([key, m]) => {
      if (m.teamId === id) this.memTeamMembers.delete(key);
    });
    this.memTeams.delete(id);
  }
}

// Export the appropriate storage based on database availability
export const storage: IStorage = db ? new DatabaseStorage() : new MemStorage();
console.log(`Using ${db ? "PostgreSQL" : "Memory"} storage`);
