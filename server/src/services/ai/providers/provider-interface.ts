
/**
 * Unified interface for all text generation providers.
 */
export interface AIProvider {
  /**
   * Generates a text response for the given prompt.
   */
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
}
