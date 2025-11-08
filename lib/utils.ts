/**
 * Utility functions for FlashFind
 */

/**
 * Validates if an email is a school email (contains .edu)
 * @param email - The email address to validate
 * @returns true if the email contains .edu, false otherwise
 */
export function isValidSchoolEmail(email: string): boolean {
  return email.toLowerCase().includes(".edu");
}

/**
 * Formats a timestamp to a human-readable relative time (e.g., "5 minutes ago")
 * @param timestamp - Firestore timestamp or Date object
 * @returns Formatted string like "5 minutes ago" or "2 hours ago"
 */
export function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return "Unknown";
  
  // Convert Firestore timestamp to Date if needed
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }
}

/**
 * Extracts the username/name prefix from an email address
 * @param email - The email address
 * @returns The part before the @ symbol
 */
export function getEmailPrefix(email: string): string {
  return email.split("@")[0];
}

/**
 * Placeholder function for future AI integration
 * This will use OpenAI API to parse the Flash Request text and extract:
 * - Intent (what the user wants)
 * - Item type (what they're looking for)
 * - Urgency level (how urgent the request is)
 * 
 * @param text - The Flash Request text from the user
 * @returns Parsed data with intent, item, and urgency
 */
export async function parseFlashRequest(text: string): Promise<{
  intent: string;
  item: string;
  urgency: "low" | "medium" | "high";
}> {
  // TODO: Use OpenAI API to parse intent, item, urgency
  // Example implementation:
  // const response = await fetch("https://api.openai.com/v1/chat/completions", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     model: "gpt-4",
  //     messages: [
  //       {
  //         role: "system",
  //         content: "Parse the following Flash Request and extract intent, item, and urgency level."
  //       },
  //       { role: "user", content: text }
  //     ],
  //   }),
  // });
  // const data = await response.json();
  // return parseAIResponse(data);
  
  // For now, return placeholder data
  return {
    intent: "request",
    item: "unknown",
    urgency: "medium",
  };
}

