import {
  users,
  userSettings,
  platforms,
  reviews,
  replyTemplates,
  type User,
  type UpsertUser,
  type InsertReview,
  type Review,
  type UserSettings,
  type InsertUserSettings,
  type Platform,
  type InsertPlatform,
  type ReplyTemplate,
  type InsertReplyTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // User Settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // Platform operations
  getPlatforms(userId: string): Promise<Platform[]>;
  getPlatform(id: number): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: number, data: Partial<InsertPlatform>): Promise<Platform>;
  deletePlatform(id: number): Promise<boolean>;
  
  // Review operations
  getReviewById(id: number): Promise<Review | undefined>;
  getUserReviews(userId: string): Promise<Review[]>;
  getPendingReviews(userId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReviewResponse(id: number, responseText: string, autoResponded?: boolean): Promise<Review>;
  
  // Reply Template operations
  getReplyTemplates(userId: string): Promise<ReplyTemplate[]>;
  getReplyTemplate(id: number): Promise<ReplyTemplate | undefined>;
  createReplyTemplate(template: InsertReplyTemplate): Promise<ReplyTemplate>;
  updateReplyTemplate(id: number, data: Partial<InsertReplyTemplate>): Promise<ReplyTemplate>;
  deleteReplyTemplate(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
        },
      })
      .returning();
    return user;
  }

  // User Settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db
      .insert(userSettings)
      .values({
        ...settings,
        updatedAt: new Date(),
      })
      .returning();
    return newSettings;
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [updatedSettings] = await db
      .update(userSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();
    
    if (!updatedSettings) {
      // If no settings exist yet, create them
      const newSettings: InsertUserSettings = {
        userId,
        defaultTone: settings.defaultTone || "Professional",
        language: settings.language || "English",
        autoReplyEnabled: settings.autoReplyEnabled !== undefined ? settings.autoReplyEnabled : false,
        lastCheckTime: settings.lastCheckTime || new Date()
      };
      
      return this.createUserSettings(newSettings);
    }
    
    return updatedSettings;
  }

  // Platform operations
  async getPlatforms(userId: string): Promise<Platform[]> {
    return db
      .select()
      .from(platforms)
      .where(eq(platforms.userId, userId));
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    const [platform] = await db
      .select()
      .from(platforms)
      .where(eq(platforms.id, id));
    return platform;
  }

  async createPlatform(platformData: InsertPlatform): Promise<Platform> {
    const [platform] = await db
      .insert(platforms)
      .values({
        ...platformData,
        updatedAt: new Date(),
      })
      .returning();
    return platform;
  }

  async updatePlatform(id: number, data: Partial<InsertPlatform>): Promise<Platform> {
    const [platform] = await db
      .update(platforms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(platforms.id, id))
      .returning();
    return platform;
  }

  async deletePlatform(id: number): Promise<boolean> {
    const result = await db
      .delete(platforms)
      .where(eq(platforms.id, id));
    return true;
  }

  // Review operations
  async getReviewById(id: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id));
    return review;
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getPendingReviews(userId: string): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          sql`${reviews.responseText} IS NULL`
        )
      )
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
    return review;
  }

  async updateReviewResponse(id: number, responseText: string, autoResponded: boolean = false): Promise<Review> {
    const now = new Date();
    const [updatedReview] = await db
      .update(reviews)
      .set({
        responseText,
        respondedAt: now,
        autoResponded,
      })
      .where(eq(reviews.id, id))
      .returning();
    
    if (!updatedReview) {
      throw new Error(`Review with ID ${id} not found`);
    }
    
    return updatedReview;
  }

  // Reply Template operations
  async getReplyTemplates(userId: string): Promise<ReplyTemplate[]> {
    return db
      .select()
      .from(replyTemplates)
      .where(eq(replyTemplates.userId, userId));
  }

  async getReplyTemplate(id: number): Promise<ReplyTemplate | undefined> {
    const [template] = await db
      .select()
      .from(replyTemplates)
      .where(eq(replyTemplates.id, id));
    return template;
  }

  async createReplyTemplate(templateData: InsertReplyTemplate): Promise<ReplyTemplate> {
    const [template] = await db
      .insert(replyTemplates)
      .values({
        ...templateData,
        updatedAt: new Date(),
      })
      .returning();
    return template;
  }

  async updateReplyTemplate(id: number, data: Partial<InsertReplyTemplate>): Promise<ReplyTemplate> {
    const [template] = await db
      .update(replyTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(replyTemplates.id, id))
      .returning();
    return template;
  }

  async deleteReplyTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(replyTemplates)
      .where(eq(replyTemplates.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
