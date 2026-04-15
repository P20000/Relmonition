/**
 * Frontend API Utility to communicate with the Backend
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = {
  async getTenantData(tenantId: string) {
    const response = await fetch(`${BASE_URL}/tenant/${tenantId}`);
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  },

  async queryRelationshipContext(tenantId: string, query: string, mode: 'retrieval' | 'exploration') {
    const response = await fetch(`${BASE_URL}/rag/query`, {
      method: 'POST',
      body: JSON.stringify({ tenantId, query, mode }),
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async login(credentials: { email: string; password: string }): Promise<{ token: string; userId: string; email: string; accountType: string }> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }
    return response.json();
  },

  async signup(credentials: { email: string; password: string }): Promise<{ userId: string }> {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Signup failed');
    }
    return response.json();
  },

  async getMe(token: string): Promise<{ userId: string, email: string, accountType: string }> {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch session info');
    }
    return response.json();
  },

  async getJournalPrompt(): Promise<{ prompt: string, date: string }> {
    const response = await fetch(`${BASE_URL}/journal/prompt`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch prompt');
    }
    return response.json();
  },

  async createJournalEntry(data: { tenantId: string, userId: string, content: string, prompt?: string, category?: string }) {
    const response = await fetch(`${BASE_URL}/journal/entry`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create entry');
    }
    return response.json();
  },

  async getJournalEntries(tenantId: string): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/journal/${tenantId}/entries`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch entries');
    }
    return response.json();
  }
};
