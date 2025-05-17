import { storage } from "./storage";
import { generateResponse, simulateNewReviews } from "./openai";
import { db } from "./db";
import { type InsertReview, userSettings, reviews } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// The time interval for checking new reviews (in milliseconds)
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Queue to track processing users to avoid overlaps
const processingUsers = new Set<string>();

/**
 * Singleton class that manages the review automation process
 */
export class AutomationService {
  private static instance: AutomationService;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  private constructor() {}

  /**
   * Get the AutomationService instance
   */
  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  /**
   * Start the automation service
   */
  public start(): void {
    if (this.isRunning) return;
    
    console.log("Starting AutoReplyAI automation service...");
    this.isRunning = true;
    
    // Run immediately and then on interval
    this.processAllUsers();
    
    this.timer = setInterval(() => {
      this.processAllUsers();
    }, CHECK_INTERVAL);
  }

  /**
   * Stop the automation service
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    console.log("Stopping AutoReplyAI automation service...");
    this.isRunning = false;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Process all users with auto-reply enabled
   */
  private async processAllUsers(): Promise<void> {
    try {
      console.log("AutoReplyAI: Checking for users with auto-reply enabled...");
      
      // Get all user settings with auto-reply enabled
      const userSettingsWithAutoReply = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.autoReplyEnabled, true));
      
      console.log(`AutoReplyAI: Found ${userSettingsWithAutoReply.length} users with auto-reply enabled`);
      
      // Process each user's reviews
      for (const setting of userSettingsWithAutoReply) {
        const userId = setting.userId;
        
        // Skip if already processing this user
        if (processingUsers.has(userId)) {
          continue;
        }
        
        processingUsers.add(userId);
        
        try {
          await this.processUserReviews(userId, setting.defaultTone, setting.language);
        } catch (error) {
          console.error(`AutoReplyAI: Error processing user ${userId}:`, error);
        } finally {
          processingUsers.delete(userId);
        }
      }
    } catch (error) {
      console.error("AutoReplyAI: Error in processAllUsers:", error);
    }
  }

  /**
   * Process reviews for a specific user
   */
  private async processUserReviews(userId: string, defaultTone: string, language: string): Promise<void> {
    console.log(`AutoReplyAI: Processing reviews for user ${userId}`);
    
    try {
      // 1. Get user's connected platforms
      const platforms = await storage.getPlatforms(userId);
      
      if (platforms.length === 0) {
        console.log(`AutoReplyAI: User ${userId} has no connected platforms`);
        return;
      }
      
      // 2. Update the last check time for the user
      const settings = await storage.getUserSettings(userId);
      if (!settings) {
        console.log(`AutoReplyAI: User ${userId} has no settings`);
        return;
      }
      
      const lastCheckTime = settings.lastCheckTime;
      
      // 3. For each platform, check for new reviews
      for (const platform of platforms) {
        try {
          console.log(`AutoReplyAI: Checking for new reviews on ${platform.platformName} for user ${userId}`);
          
          // In a real application, this would call the respective API
          // For now, we simulate this by generating random reviews
          const newReviews = simulateNewReviews(Math.floor(Math.random() * 2)); // 0 or 1 new reviews
          
          for (const review of newReviews) {
            try {
              // Check if this review already exists
              const existingReviews = await db.query.reviews.findMany({
                where: (fields, { eq, and }) => and(
                  eq(fields.userId, userId),
                  eq(fields.externalReviewId, review.externalReviewId)
                )
              });
              
              if (existingReviews.length > 0) {
                console.log(`AutoReplyAI: Review ${review.externalReviewId} already exists for user ${userId}`);
                continue;
              }
              
              // 4. For each new review, generate a response
              const responseText = await generateResponse(
                review.reviewText,
                review.starRating,
                defaultTone,
                language
              );
              
              // 5. Save the review and response
              const newReview: InsertReview = {
                userId,
                platformId: platform.id,
                externalReviewId: review.externalReviewId,
                customerName: review.customerName,
                reviewText: review.reviewText,
                starRating: review.starRating,
                responseText: responseText,
                responseTone: defaultTone,
                respondedAt: new Date(),
                autoResponded: true
              };
              
              const savedReview = await storage.createReview(newReview);
              
              console.log(`AutoReplyAI: Auto-generated response for review ${savedReview.id}`);
              
              // 6. In a real application, post the response to the platform
              // This would involve another API call to the respective platform
              console.log(`AutoReplyAI: Would post response to ${platform.platformName} for review ${review.externalReviewId}`);
            } catch (error) {
              console.error(`AutoReplyAI: Error processing review:`, error);
            }
          }
        } catch (platformError) {
          console.error(`AutoReplyAI: Error checking platform ${platform.id}:`, platformError);
        }
      }
      
      // 7. Update the last check time
      await storage.updateUserSettings(userId, {
        lastCheckTime: new Date()
      });
      
      console.log(`AutoReplyAI: Completed processing for user ${userId}`);
    } catch (error) {
      console.error(`AutoReplyAI: Error in processUserReviews for user ${userId}:`, error);
    }
  }

  /**
   * Check for a single user's reviews immediately
   */
  public async checkUserReviewsNow(userId: string): Promise<void> {
    if (processingUsers.has(userId)) {
      throw new Error("Already processing reviews for this user");
    }
    
    try {
      processingUsers.add(userId);
      
      const settings = await storage.getUserSettings(userId);
      if (!settings) {
        throw new Error("User settings not found");
      }
      
      await this.processUserReviews(userId, settings.defaultTone, settings.language);
      
      return;
    } finally {
      processingUsers.delete(userId);
    }
  }
}

// Export the singleton instance
export const automationService = AutomationService.getInstance();