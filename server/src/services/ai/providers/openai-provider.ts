
import OpenAI from "openai";
import { AIProvider } from "./provider-interface";
import { callWithRetry } from "../ai-utils";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string, baseURL?: string) {
    // Sanitize baseURL: remove trailing slashes and /chat/completions suffix
    let sanitizedBaseURL = baseURL?.trim();
    if (sanitizedBaseURL) {
      sanitizedBaseURL = sanitizedBaseURL.replace(/\/+$/, ''); // Remove trailing slashes
      sanitizedBaseURL = sanitizedBaseURL.replace(/\/chat\/completions$/, ''); // Remove accidental endpoint path
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: sanitizedBaseURL || undefined,
      timeout: 30000, // 30 second timeout
    });
    this.modelName = modelName;
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const messages: any[] = [];
    
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    
    messages.push({ role: "user", content: prompt });

    const response = await callWithRetry(() => this.client.chat.completions.create({
      model: this.modelName,
      messages,
    }));

    return response.choices[0]?.message?.content || "";
  }

  async *generateStream(
    prompt: string, 
    systemInstruction?: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const messages: any[] = [];
    
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    
    messages.push({ role: "user", content: prompt });

    try {
      const stream = await this.client.chat.completions.create({
        model: this.modelName,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        if (signal?.aborted) {
          console.log("[OpenAI] Stream aborted by signal");
          return;
        }
        const chunkText = chunk.choices[0]?.delta?.content || "";
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      console.error("[OpenAI] Streaming Error:", error);
      throw error;
    }
  }
}
