
/**
 * Unified interface for all text generation providers.
 */
export interface AIProvider {
  /**
   * Generates a text response for the given prompt.
   */
  generateText(prompt: string, systemInstruction?: string): Promise<string>;

  /**
   * Generates a streaming text response for the given prompt.
   */
  generateStream(
    prompt: string, 
    systemInstruction?: string,
    signal?: AbortSignal
  ): AsyncGenerator<string>;
}
