
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider } from "./provider-interface";
import { callWithRetry } from "../ai-utils"; // Use the retry logic I built earlier

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      systemInstruction: systemInstruction 
    });

    const result = await callWithRetry(() => model.generateContent(prompt));
    const response = await result.response;
    return response.text();
  }
}
