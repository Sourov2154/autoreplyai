import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate an appropriate response to a customer review
 * 
 * @param reviewText The text of the customer review
 * @param starRating The star rating (1-5) given by the customer
 * @param tone The tone for the response (Friendly, Professional, Apologetic, Enthusiastic)
 * @param language The language to generate the response in
 * @returns A generated response to the review
 */
export async function generateResponse(
  reviewText: string,
  starRating: number,
  tone: string,
  language: string = "English"
): Promise<string> {
  try {
    // Construct the prompt for the AI
    const prompt = `
      You are an experienced customer service representative for a business.
      You need to craft a response to a customer review with the following details:
      
      Review: "${reviewText}"
      Star Rating: ${starRating} out of 5 stars
      Desired Tone: ${tone}
      Language: ${language}
      
      Please generate an appropriate response that:
      - Acknowledges the customer's feedback
      - Maintains the ${tone.toLowerCase()} tone throughout
      - Thanks the customer for their review
      ${starRating <= 3 ? "- Addresses potential concerns and offers solutions" : "- Expresses gratitude for the positive feedback"}
      - Keeps the response concise (around 3-4 sentences)
      - Does not include any placeholder text like [Business Name] - use 'our business' or 'our team' instead
      - Is written in ${language}
      
      The response should be something a business owner could immediately send to the customer.
    `;

    // Generate response using OpenAI
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that writes professional business responses to customer reviews." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    // Extract and return the response text
    return response.choices[0]?.message?.content?.trim() || 
      "Thank you for your feedback. We appreciate you taking the time to share your experience with us.";
  } catch (error) {
    console.error("Error generating response from OpenAI:", error);
    
    // Provide fallback responses based on star rating and tone
    const fallbackResponses = {
      "Friendly": {
        "positive": "Thank you so much for your wonderful feedback! We're thrilled that you had a great experience with us. Your support means a lot to our team, and we look forward to serving you again soon!",
        "neutral": "Thanks for sharing your thoughts with us! We appreciate your feedback and will use it to improve our service. We hope to see you again and provide you with an even better experience next time!",
        "negative": "We're really sorry to hear about your experience. Thank you for letting us know, as your feedback helps us improve. We'd love a chance to make things right for you. Please reach out to us directly so we can address your concerns."
      },
      "Professional": {
        "positive": "Thank you for your positive review. We appreciate your business and your feedback regarding our services. We strive to maintain high standards and are pleased that your experience reflected this commitment. We look forward to serving you again.",
        "neutral": "Thank you for your feedback. We value your input as it helps us improve our services. We have noted your comments and will consider them as we continuously work to enhance the customer experience. We appreciate your business.",
        "negative": "We sincerely apologize for the inconvenience you experienced. We take all feedback seriously and would like to address your concerns. Please contact our customer service team directly so we can resolve these issues promptly and effectively."
      },
      "Apologetic": {
        "positive": "We're truly grateful for your kind review, though we always strive to do even better. Thank you for taking the time to share your positive experience. We appreciate your support and look forward to serving you again soon.",
        "neutral": "Thank you for your feedback. We apologize if any aspect of your experience didn't meet your expectations. We're constantly working to improve, and your comments will help us do better. We value your business and hope to better serve you next time.",
        "negative": "We deeply apologize for the disappointing experience you had. This falls well short of the standard we aim to provide. Your feedback is invaluable, and we take full responsibility. Please contact us directly so we can address your concerns and make things right."
      },
      "Enthusiastic": {
        "positive": "Wow! Thank you so much for this amazing review! We're absolutely thrilled that you had such a wonderful experience with us! Your feedback makes our day, and we can't wait to welcome you back again soon! You're awesome!",
        "neutral": "Thanks for sharing your feedback with us! We're excited to hear from you and appreciate you taking the time to let us know about your experience! We're always looking to improve, and we hope to wow you even more on your next visit!",
        "negative": "Oh no! We're so sorry to hear about your experience! This definitely isn't what we aim for, and we're eager to make things right! Please reach out to us directly - we're super committed to turning this around and earning back your trust!"
      }
    };
    
    // Determine sentiment category based on star rating
    let sentiment: "positive" | "neutral" | "negative" = "neutral";
    if (starRating >= 4) sentiment = "positive";
    if (starRating <= 2) sentiment = "negative";
    
    // Use the specified tone or default to Professional
    const validTones = ["Friendly", "Professional", "Apologetic", "Enthusiastic"] as const;
    type ToneType = typeof validTones[number];
    
    // Check if tone is valid, otherwise default to Professional
    const toneToUse: ToneType = validTones.includes(tone as ToneType) 
      ? (tone as ToneType) 
      : "Professional";
    
    // Return the appropriate fallback response
    return fallbackResponses[toneToUse][sentiment];
  }
}

/**
 * Generate multiple response variations to a customer review
 * 
 * @param reviewText The text of the customer review
 * @param starRating The star rating (1-5) given by the customer
 * @param tone The tone for the response
 * @param language The language to generate the response in
 * @param count Number of variations to generate
 * @returns An array of generated responses
 */
export async function generateResponseVariations(
  reviewText: string,
  starRating: number,
  tone: string,
  language: string = "English",
  count: number = 3
): Promise<string[]> {
  try {
    // Construct the prompt for the AI
    const prompt = `
      You are an experienced customer service representative for a business.
      You need to craft ${count} different response variations to a customer review.
      
      Review: "${reviewText}"
      Star Rating: ${starRating} out of 5 stars
      Desired Tone: ${tone}
      Language: ${language}
      
      Please generate ${count} appropriate response variations that:
      - Acknowledge the customer's feedback
      - Maintain the ${tone.toLowerCase()} tone throughout
      - Thank the customer for their review
      ${starRating <= 3 ? "- Address potential concerns and offer solutions" : "- Express gratitude for the positive feedback"}
      - Keep each response concise (around 3-4 sentences)
      - Do not include any placeholder text like [Business Name] - use 'our business' or 'our team' instead
      - Are written in ${language}
      
      Format your response as JSON with this structure:
      { "responses": ["response1", "response2", ...] }
      
      The responses should be something a business owner could immediately send to the customer.
    `;

    // Generate responses using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that writes professional business responses to customer reviews." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      return ["Thank you for your feedback. We appreciate you taking the time to share your experience with us."];
    }
    
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.responses) && parsed.responses.length > 0) {
        return parsed.responses;
      }
      return [content]; // Return the raw content if JSON parsing fails or structure is wrong
    } catch (e) {
      console.error("Error parsing OpenAI JSON response:", e);
      return [content]; // Return the raw content if JSON parsing fails
    }
  } catch (error) {
    console.error("Error generating response variations from OpenAI:", error);
    throw new Error("Failed to generate review response variations");
  }
}

/**
 * Simulates fetching new reviews from Google Business API
 * This is a placeholder that generates fake reviews for testing
 * 
 * @returns Array of simulated reviews
 */
export function simulateNewReviews(count: number = 1) {
  const reviewTemplates = [
    {
      customerName: "Alex Johnson",
      reviewText: "The service was excellent and the staff was very friendly. I'll definitely come back again.",
      starRating: 5,
    },
    {
      customerName: "Jamie Smith",
      reviewText: "Good experience overall, but had to wait a bit longer than expected. The quality was great though.",
      starRating: 4,
    },
    {
      customerName: "Taylor Williams",
      reviewText: "Average service. Nothing special but nothing terrible either. Might try again someday.",
      starRating: 3,
    },
    {
      customerName: "Morgan Brown",
      reviewText: "Disappointed with my recent visit. The staff seemed uninterested and the quality wasn't what I expected.",
      starRating: 2,
    },
    {
      customerName: "Casey Davis",
      reviewText: "Terrible experience! Will not be returning. Save your time and money and go elsewhere.",
      starRating: 1,
    },
    {
      customerName: "Jordan Miller",
      reviewText: "Absolutely loved everything about this place! From the service to the quality, everything was perfect.",
      starRating: 5,
    },
    {
      customerName: "Riley Wilson",
      reviewText: "Had a minor issue but the team resolved it quickly and professionally. Would recommend.",
      starRating: 4,
    },
    {
      customerName: "Quinn Thompson",
      reviewText: "Not bad, not great. Probably what you'd expect for the price point.",
      starRating: 3,
    },
  ];

  const reviews = [];
  for (let i = 0; i < count; i++) {
    const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
    
    // Create a unique external ID for the simulated review
    const externalId = `sim-${Date.now()}-${Math.round(Math.random() * 10000)}`;
    
    reviews.push({
      ...template,
      externalReviewId: externalId,
      platformName: "Google Business",
    });
  }
  
  return reviews;
}
