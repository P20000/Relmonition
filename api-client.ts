/**
 * Frontend API Utility to communicate with the Backend
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-001.relmonition.dpdns.org/api/v1';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.details || err.error || `Request failed (Status ${response.status})`);
    } else {
      // Handle non-JSON errors (HTML 404s, 500s, 413s)
      const text = await response.text().catch(() => 'No response body');
      if (response.status === 413) {
        throw new Error('File too large: The log exceeds the server\'s upload limit.');
      }
      throw new Error(text.length > 200 ? `Server error: ${response.status}` : text);
    }
  }
  return response.json();
};

export const apiClient = {
  async get(path: string) {
    const response = await fetch(`${BASE_URL}${path}`);
    return handleResponse(response);
  },

  async getTenantData(tenantId: string) {
    const response = await fetch(`${BASE_URL}/tenant/${tenantId}`);
    return handleResponse(response);
  },

  async post(path: string, payload: any) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  async put(path: string, payload?: any) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      body: payload ? JSON.stringify(payload) : undefined,
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  async patch(path: string, payload: any) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  async delete(path: string) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
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
    return handleResponse(response);
  },

  async login(payload: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },

  async getMe(token: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async updateProfile(userId: string, name: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/update-profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name })
    });
    return handleResponse(response);
  },

  async getJournalPrompt(tenantId: string, userId: string): Promise<{ userName: string, partnerName: string, date: string }> {
    const response = await fetch(`${BASE_URL}/journal/prompt?tenantId=${tenantId}&userId=${userId}`);
    return handleResponse(response);
  },

  async createJournalEntry(data: { tenantId: string, userId: string, content: string, date: string, category?: string }) {
    const response = await fetch(`${BASE_URL}/journal/entry`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  async getJournalEntries(tenantId: string, userId?: string): Promise<any[]> {
    const url = new URL(`${BASE_URL}/journal/${tenantId}/entries`);
    if (userId) url.searchParams.append('userId', userId);
    const response = await fetch(url.toString());
    return handleResponse(response);
  },

  // ─── AI Configuration (BYOK) ───────────────────────────────────────────────
  async getAIConfigs(tenantId: string) {
    const response = await fetch(`${BASE_URL}/tenant/${tenantId}/ai-configs`);
    return handleResponse(response);
  },

  async createAIConfig(tenantId: string, payload: any) {
    return this.post(`/tenant/${tenantId}/ai-configs`, payload);
  },

  async activateAIConfig(tenantId: string, configId: string) {
    const response = await fetch(`${BASE_URL}/tenant/${tenantId}/ai-configs/${configId}/activate`, {
      method: 'PUT',
    });
    return handleResponse(response);
  },

  async deleteAIConfig(tenantId: string, configId: string) {
    const response = await fetch(`${BASE_URL}/tenant/${tenantId}/ai-configs/${configId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }
};
