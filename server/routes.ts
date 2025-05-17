import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateResponse, generateResponseVariations, simulateNewReviews } from "./openai";
import { 
  userSettingsFormSchema,
  platformFormSchema, 
  reviewFormSchema,
  replyTemplateFormSchema,
  type User
} from "@shared/schema";
import { ZodError } from "zod";
import { automationService } from "./automationService";

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
}

// Middleware to extract user ID from authenticated request
const extractUserId = (req: any, res: Response, next: Function) => {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.userId = req.user.claims.sub;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Start the automation service
  automationService.start();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User settings routes
  app.get('/api/settings', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.getUserSettings(req.userId!);
      
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = {
          userId: req.userId!,
          defaultTone: "Professional",
          language: "English",
          autoReplyEnabled: false,
          lastCheckTime: new Date()
        };
        
        const newSettings = await storage.createUserSettings(defaultSettings);
        return res.json(newSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  app.put('/api/settings', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      // Validate the input data
      const validatedData = userSettingsFormSchema.parse(req.body);
      
      // Update the settings
      const updatedSettings = await storage.updateUserSettings(req.userId!, {
        defaultTone: validatedData.defaultTone,
        language: validatedData.language,
        autoReplyEnabled: validatedData.autoReplyEnabled,
      });
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Platform routes
  app.get('/api/platforms', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const platforms = await storage.getPlatforms(req.userId!);
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  app.post('/api/platforms', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      // Validate the input data
      const validatedData = platformFormSchema.parse(req.body);
      
      // Create the platform
      const platform = await storage.createPlatform({
        userId: req.userId!,
        platformName: validatedData.platformName,
        platformId: validatedData.platformId,
        accessToken: validatedData.accessToken,
        refreshToken: validatedData.refreshToken,
      });
      
      res.status(201).json(platform);
    } catch (error) {
      console.error("Error creating platform:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create platform" });
    }
  });

  app.put('/api/platforms/:id', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const platformId = parseInt(req.params.id);
      if (isNaN(platformId)) {
        return res.status(400).json({ message: "Invalid platform ID" });
      }
      
      // Get the platform to verify ownership
      const platform = await storage.getPlatform(platformId);
      
      if (!platform) {
        return res.status(404).json({ message: "Platform not found" });
      }
      
      if (platform.userId !== req.userId) {
        return res.status(403).json({ message: "Not authorized to modify this platform" });
      }
      
      // Validate the input data
      const validatedData = platformFormSchema.parse(req.body);
      
      // Update the platform
      const updatedPlatform = await storage.updatePlatform(platformId, {
        platformName: validatedData.platformName,
        platformId: validatedData.platformId,
        accessToken: validatedData.accessToken,
        refreshToken: validatedData.refreshToken,
      });
      
      res.json(updatedPlatform);
    } catch (error) {
      console.error("Error updating platform:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update platform" });
    }
  });

  app.delete('/api/platforms/:id', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const platformId = parseInt(req.params.id);
      if (isNaN(platformId)) {
        return res.status(400).json({ message: "Invalid platform ID" });
      }
      
      // Get the platform to verify ownership
      const platform = await storage.getPlatform(platformId);
      
      if (!platform) {
        return res.status(404).json({ message: "Platform not found" });
      }
      
      if (platform.userId !== req.userId) {
        return res.status(403).json({ message: "Not authorized to delete this platform" });
      }
      
      // Delete the platform
      await storage.deletePlatform(platformId);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting platform:", error);
      res.status(500).json({ message: "Failed to delete platform" });
    }
  });

  // Review routes
  app.get('/api/reviews', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const reviews = await storage.getUserReviews(req.userId!);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/reviews/:id', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      const review = await storage.getReviewById(reviewId);
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      if (review.userId !== req.userId) {
        return res.status(403).json({ message: "Not authorized to access this review" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  app.post('/api/reviews', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      // Validate the input data
      const validatedData = reviewFormSchema.parse(req.body);
      
      // Get user settings for language
      const settings = await storage.getUserSettings(req.userId!);
      const language = settings?.language || "English";
      
      // Prepare the review data
      const reviewData = {
        userId: req.userId!,
        reviewText: validatedData.reviewText,
        starRating: validatedData.starRating,
        responseTone: validatedData.responseTone,
      };
      
      // Generate AI response based on review
      const response = await generateResponse(
        reviewData.reviewText, 
        reviewData.starRating, 
        reviewData.responseTone,
        language
      );
      
      // Create the review with the generated response
      const review = await storage.createReview({
        ...reviewData,
        responseText: response,
      });
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.post('/api/reviews/variations', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      // Validate the input data
      const validatedData = reviewFormSchema.parse(req.body);
      
      // Get user settings for language
      const settings = await storage.getUserSettings(req.userId!);
      const language = settings?.language || "English";
      
      // Generate response variations
      const variations = await generateResponseVariations(
        validatedData.reviewText,
        validatedData.starRating,
        validatedData.responseTone,
        language,
        3 // Generate 3 variations
      );
      
      res.json({ variations });
    } catch (error) {
      console.error("Error generating response variations:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to generate response variations" });
    }
  });

  // Endpoint to manually check for new reviews
  app.post('/api/check-reviews', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      // This will trigger an immediate check for new reviews
      await automationService.checkUserReviewsNow(req.userId!);
      
      res.json({ message: "Review check initiated" });
    } catch (error) {
      console.error("Error checking for reviews:", error);
      res.status(500).json({ message: "Failed to check for reviews" });
    }
  });

  // Simulate receiving a new review (for testing)
  app.post('/api/simulate-review', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const simReviews = simulateNewReviews(1);
      
      if (simReviews.length === 0) {
        return res.status(500).json({ message: "Failed to simulate review" });
      }
      
      const simReview = simReviews[0];
      
      // Get user settings
      const settings = await storage.getUserSettings(req.userId!);
      const defaultTone = settings?.defaultTone || "Professional";
      const language = settings?.language || "English";
      
      // Generate a response
      const responseText = await generateResponse(
        simReview.reviewText,
        simReview.starRating,
        defaultTone,
        language
      );
      
      // Save the review
      const platforms = await storage.getPlatforms(req.userId!);
      let platformId = null;
      
      if (platforms.length > 0) {
        platformId = platforms[0].id;
      }
      
      const review = await storage.createReview({
        userId: req.userId!,
        platformId,
        externalReviewId: simReview.externalReviewId,
        customerName: simReview.customerName,
        reviewText: simReview.reviewText,
        starRating: simReview.starRating,
        responseText,
        responseTone: defaultTone,
        autoResponded: true
      });
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Error simulating review:", error);
      res.status(500).json({ message: "Failed to simulate review" });
    }
  });

  // Reply Template routes
  app.get('/api/templates', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const templates = await storage.getReplyTemplates(req.userId!);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/templates', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      // Validate the input data
      const validatedData = replyTemplateFormSchema.parse(req.body);
      
      // Create the template
      const template = await storage.createReplyTemplate({
        userId: req.userId!,
        name: validatedData.name,
        content: validatedData.content,
        tone: validatedData.tone,
        starRating: validatedData.starRating,
      });
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put('/api/templates/:id', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the template to verify ownership
      const template = await storage.getReplyTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      if (template.userId !== req.userId) {
        return res.status(403).json({ message: "Not authorized to modify this template" });
      }
      
      // Validate the input data
      const validatedData = replyTemplateFormSchema.parse(req.body);
      
      // Update the template
      const updatedTemplate = await storage.updateReplyTemplate(templateId, {
        name: validatedData.name,
        content: validatedData.content,
        tone: validatedData.tone,
        starRating: validatedData.starRating,
      });
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating template:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/templates/:id', isAuthenticated, extractUserId, async (req: AuthenticatedRequest, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the template to verify ownership
      const template = await storage.getReplyTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      if (template.userId !== req.userId) {
        return res.status(403).json({ message: "Not authorized to delete this template" });
      }
      
      // Delete the template
      await storage.deleteReplyTemplate(templateId);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
