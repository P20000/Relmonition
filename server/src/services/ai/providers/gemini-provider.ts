
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

  async *generateStream(
    prompt: string, 
    systemInstruction?: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      systemInstruction: systemInstruction 
    });

    try {
      // Note: @google/generative-ai doesn't natively support AbortSignal in generateContentStream 
      // yet in the same way fetch does, but we can check it between chunks.
      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        if (signal?.aborted) {
          console.log("[Gemini] Stream aborted by signal");
          return;
        }
        const chunkText = chunk.text();
        yield chunkText;
      }
    } catch (error) {
      console.error("[Gemini] Streaming Error:", error);
      throw error;
    }
  }
}
