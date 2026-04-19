/**
 * Frontend API Utility to communicate with the Backend
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = {
  async get(path: string) {
    const response = await fetch(`${BASE_URL}${path}`);
    if (!response.ok) {
       const err = await response.json().catch(() => ({}));
       throw new Error(err.details || err.error || `GET Request failed: ${path}`);
    }
    return response.json();
  },

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

  async getJournalPrompt(tenantId: string, userId: string): Promise<{ userName: string, partnerName: string, date: string }> {
    const response = await fetch(`${BASE_URL}/journal/prompt?tenantId=${tenantId}&userId=${userId}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.details || err.error || 'Failed to fetch prompt');
    }
    return response.json();
  },

  async createJournalEntry(data: { tenantId: string, userId: string, content: string, date: string, category?: string }) {
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
  },

  // ─── AI Configuration (BYOK) ───────────────────────────────────────────────
  async getAIConfigs(tenantId: string) {
    const response = await fetch(`${BASE_URL}/tenant/${tenantId}/ai-configs`);
    if (!response.ok) throw new Error('Failed to fetch AI configurations');
    return response.json();
  },

  async createAIConfig(tenantId: string, payload: any) {
    return this.post(`/tenant/${tenantId}/ai-configs`, payload);
  },

  async activateAIConfig(tenantId: string, configId: string) {
    const response = await fetch(`${BASE_URL}/tenant/${tenantId}/ai-configs/${configId}/activate`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to activate AI configuration');
    return response.json();
  },

  async deleteAIConfig(tenantId: string, configId: string) {
    const response = await fetch(`${BASE_URL}/tenant/${tenantId}/ai-configs/${configId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete AI configuration');
    return response.json();
  }
};
