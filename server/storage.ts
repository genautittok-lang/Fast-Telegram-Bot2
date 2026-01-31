import { users, reports, watches, payments, referrals, type User, type InsertUser, type Report, type Watch, type Payment } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByTgId(tgId: string): Promise<User | undefined>;
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
  
  // Stats
  getStats(): Promise<{ totalUsers: number, activeWatches: number, totalReports?: number, checksToday?: number, threatsBlocked?: number, pendingPayments?: number }>;
  
  // Admin methods
  getLatestUsers(limit: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  blockUser(userId: number, blocked: boolean): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextId.user++;
    const user: User = {
      id,
      tgId: insertUser.tgId,
      username: insertUser.username || null,
      lang: insertUser.lang || "uk",
      langSet: insertUser.langSet ?? false,
      tier: insertUser.tier || "FREE",
      requestsLeft: insertUser.requestsLeft ?? 15,
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
}

// Export the appropriate storage based on database availability
export const storage: IStorage = db ? new DatabaseStorage() : new MemStorage();
console.log(`Using ${db ? "PostgreSQL" : "Memory"} storage`);
