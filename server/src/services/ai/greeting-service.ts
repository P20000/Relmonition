
import { getLLMProvider } from "./providers/factory";

const GREETING_TEMPLATES = [
  "Ready for a breakthrough, ${name}?",
  "Good to see you, ${name}!",
  "What's on your mind, ${name}?",
  "Your journey continues, ${name}.",
  "Welcome back, ${name}!",
  "Another day of growth, ${name}.",
  "How's your heart today, ${name}?",
  "Back to the pulse, ${name}.",
  "Focusing on connection, ${name}?",
  "Let's track your progress, ${name}.",
  "How's it going, ${name}?",
  "Glad you're here, ${name}!",
  "Ready to check in, ${name}?",
  "Let's catch up, ${name}.",
  "Today's a new start, ${name}."
];

/**
 * Generates a short, creative, and personalized greeting for the dashboard.
 * Uses a Hybrid Approach:
 * - 90% chance of using a pre-defined template (Fast, Zero Cost)
 * - 10% chance of using the Adaptable LLM (Creative, Fresh)
 * @param name The user's name
 * @param tenantId The tenant ID (optional) to fetch custom AI config
 */
export async function generateDynamicGreeting(name: string, tenantId?: string): Promise<string> {
  // 1. Roll the dice for Hybrid Mode (90/10 split)
  const useTemplate = Math.random() < 0.9;

  if (useTemplate) {
    const template = GREETING_TEMPLATES[Math.floor(Math.random() * GREETING_TEMPLATES.length)];
    const greeting = template.replace("${name}", name);
    console.log(`[Greeting Service] Using hybrid template: "${greeting}"`);
    return greeting;
  }

  // 2. Fallback to LLM (10% of cases)
  try {
    console.log(`[Greeting Service] Using LLM for fresh greeting (10% chance)`);
    const provider = await getLLMProvider(tenantId);
    
    const systemInstruction = "You are a friendly dashboard assistant.";
    const prompt = `
      Generate a short, friendly, and creative greeting for a user named "${name}".
      The user is opening their relationship wellness dashboard (Relmonition).
      Keep it under 6 words. It can be casual, encouraging, or a simple "What's up".
      Examples: 
      - "Ready for a breakthrough, Pranav?"
      - "Good to see you, Pranav!"
      - "What's on your mind, Pranav?"
      - "Your journey continues, Pranav."
      
      Return ONLY the greeting text.
    `;

    let text = await provider.generateText(prompt, systemInstruction);
    text = text.trim();
    
    // Cleanup any quotes the AI might include
    text = text.replace(/^["']|["']$/g, '');
    
    return text || `Welcome back, ${name}`;
  } catch (error) {
    console.error("AI Greeting Error, falling back to template:", error);
    // Ultimate fallback if LLM fails
    const template = GREETING_TEMPLATES[Math.floor(Math.random() * GREETING_TEMPLATES.length)];
    return template.replace("${name}", name) || `Welcome back, ${name}`;
  }
}
