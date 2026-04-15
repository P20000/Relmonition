import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Generates a short, creative, and personalized greeting for the dashboard.
 * @param name The user's name
 */
export async function generateDynamicGreeting(name: string): Promise<string> {
  try {
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Cleanup any quotes the AI might include
    text = text.replace(/^["']|["']$/g, '');
    
    return text || `Welcome back, ${name}`;
  } catch (error) {
    console.error("AI Greeting Error:", error);
    return `Welcome back, ${name}`;
  }
}
