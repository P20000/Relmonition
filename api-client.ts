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

  async post(path: string, payload: any) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
       const err = await response.json();
       throw new Error(err.details || err.error || `Request failed: ${path}`);
    }
    return response.json();
  },

  async queryRelationshipContext(tenantId: string, query: string, mode: 'retrieval' | 'exploration') {
    return this.post('/rag/query', { tenantId, query, mode });
  },

  async uploadChatHistory(data: { tenantId: string, userId: string, fileName: string, fileContent: string, fileSize: number }) {
    return this.post('/coach/upload', data);
  },

  async signup(payload: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Signup failed');
    }
    return response.json();
  },

  async login(payload: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }
    return response.json();
  },

  async getMe(token: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch user');
    }
    return response.json();
  },

  async updateProfile(userId: string, name: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/update-profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update profile');
    }
    return response.json();
  },

  async getJournalPrompt(): Promise<{ prompt: string, date: string }> {
    const response = await fetch(`${BASE_URL}/journal/prompt`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.details || err.error || 'Failed to fetch prompt');
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
      throw new Error(err.details || err.error || 'Failed to create entry');
    }
    return response.json();
  },

  async getJournalEntries(tenantId: string, userId?: string): Promise<any[]> {
    const url = new URL(`${BASE_URL}/journal/${tenantId}/entries`);
    if (userId) url.searchParams.append('userId', userId);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.details || err.error || 'Failed to fetch entries');
    }
    return response.json();
  }
};
