
import { getLLMProvider } from "./providers/factory";

/**
 * Generates a short, creative, and personalized greeting for the dashboard.
 * Uses the adaptable LLM provider (Hybrid Mode).
 * @param name The user's name
 * @param tenantId The tenant ID (optional) to fetch custom AI config
 */
export async function generateDynamicGreeting(name: string, tenantId?: string): Promise<string> {
  try {
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
    console.error("AI Greeting Error:", error);
    return `Welcome back, ${name}`;
  }
}
