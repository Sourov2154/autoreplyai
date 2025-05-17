import { pgTable, text, serial, timestamp, integer, boolean, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  defaultTone: text("default_tone").default("Professional").notNull(),
  language: text("language").default("English").notNull(),
  autoReplyEnabled: boolean("auto_reply_enabled").default(false).notNull(),
  lastCheckTime: timestamp("last_check_time").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Connected Platforms
export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  platformName: text("platform_name").notNull(), // e.g., "Google Business"
  platformId: text("platform_id").notNull(), // e.g., Google Business ID
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  metadata: json("metadata"), // Store additional platform-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  platformId: integer("platform_id").references(() => platforms.id),
  externalReviewId: text("external_review_id"), // ID from external platform
  customerName: text("customer_name"),
  reviewText: text("review_text").notNull(),
  starRating: integer("star_rating").notNull(),
  responseText: text("response_text"),
  responseTone: text("response_tone").notNull(),
  respondedAt: timestamp("responded_at"),
  autoResponded: boolean("auto_responded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reply Templates
export const replyTemplates = pgTable("reply_templates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  content: text("content").notNull(),
  tone: text("tone").notNull(),
  starRating: integer("star_rating"), // Optional: specific for certain ratings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session table for Replit Auth
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Define relationships between tables
export const usersRelations = relations(users, ({ many }) => ({
  settings: many(userSettings),
  platforms: many(platforms),
  reviews: many(reviews),
  replyTemplates: many(replyTemplates),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id]
  })
}));

export const platformsRelations = relations(platforms, ({ one, many }) => ({
  user: one(users, {
    fields: [platforms.userId],
    references: [users.id]
  }),
  reviews: many(reviews)
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id]
  }),
  platform: one(platforms, {
    fields: [reviews.platformId],
    references: [platforms.id]
  })
}));

export const replyTemplatesRelations = relations(replyTemplates, ({ one }) => ({
  user: one(users, {
    fields: [replyTemplates.userId],
    references: [users.id]
  })
}));

// Create schemas for forms and validation
export const insertUserSchema = createInsertSchema(users);
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlatformSchema = createInsertSchema(platforms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertReplyTemplateSchema = createInsertSchema(replyTemplates).omit({ id: true, createdAt: true, updatedAt: true });

// Form schemas
export const reviewFormSchema = z.object({
  reviewText: z.string().min(1, "Review text is required"),
  starRating: z.number().min(1).max(5),
  responseTone: z.enum(["Friendly", "Professional", "Apologetic", "Enthusiastic"]),
});

export const userSettingsFormSchema = z.object({
  defaultTone: z.enum(["Friendly", "Professional", "Apologetic", "Enthusiastic"]),
  language: z.enum(["English", "Spanish", "French", "German", "Italian"]),
  autoReplyEnabled: z.boolean(),
});

export const platformFormSchema = z.object({
  platformName: z.string().min(1, "Platform name is required"),
  platformId: z.string().min(1, "Platform ID is required"),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const replyTemplateFormSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  content: z.string().min(1, "Template content is required"),
  tone: z.enum(["Friendly", "Professional", "Apologetic", "Enthusiastic"]),
  starRating: z.number().min(1).max(5).optional(),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Platform = typeof platforms.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertReplyTemplate = z.infer<typeof insertReplyTemplateSchema>;
export type ReplyTemplate = typeof replyTemplates.$inferSelect;

export type ReviewFormData = z.infer<typeof reviewFormSchema>;
export type UserSettingsFormData = z.infer<typeof userSettingsFormSchema>;
export type PlatformFormData = z.infer<typeof platformFormSchema>;
export type ReplyTemplateFormData = z.infer<typeof replyTemplateFormSchema>;
