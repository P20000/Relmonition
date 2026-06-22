/**
 * Frontend API Utility to communicate with the Backend
 */
const getBaseUrl = (tenantId?: string) => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const activeTenantId = tenantId || localStorage.getItem('activeTenantId') || 'lobby';
    return `https://api.relmonition.dpdns.org/${activeTenantId}/api/v1`;
  }
  const fallbackTenantId = tenantId || 'lobby';
  return `https://api.relmonition.dpdns.org/${fallbackTenantId}/api/v1`;
};

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
  async get(path: string, tenantId?: string) {
    const response = await fetch(`${getBaseUrl(tenantId)}${path}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getTenantData(tenantId: string) {
    const response = await fetch(`${getBaseUrl(tenantId)}/tenant/${tenantId}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async post(path: string, payload: any, tenantId?: string) {
    const response = await fetch(`${getBaseUrl(tenantId)}${path}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async put(path: string, payload?: any, tenantId?: string) {
    const response = await fetch(`${getBaseUrl(tenantId)}${path}`, {
      method: 'PUT',
      body: payload ? JSON.stringify(payload) : undefined,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async patch(path: string, payload: any, tenantId?: string) {
    const response = await fetch(`${getBaseUrl(tenantId)}${path}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async delete(path: string, tenantId?: string) {
    const response = await fetch(`${getBaseUrl(tenantId)}${path}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async queryRelationshipContext(tenantId: string, query: string, mode: 'retrieval' | 'exploration') {
    return this.post('/rag/query', { tenantId, query, mode }, tenantId);
  },

  async uploadChatHistory(data: { tenantId: string, userId: string, fileName: string, fileContent: string, fileSize: number }) {
    return this.post('/coach/upload', data, data.tenantId);
  },

  async signup(payload: any): Promise<any> {
    const response = await fetch(`${getBaseUrl()}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async login(payload: any): Promise<any> {
    const response = await fetch(`${getBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async logout(): Promise<any> {
    const response = await fetch(`${getBaseUrl()}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getMe(): Promise<any> {
    const response = await fetch(`${getBaseUrl()}/auth/me`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async updateProfile(userId: string, name: string): Promise<any> {
    const response = await fetch(`${getBaseUrl()}/auth/update-profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name }),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async deleteAccount(): Promise<any> {
    const response = await fetch(`${getBaseUrl()}/auth/me`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getJournalPrompt(tenantId: string, userId: string): Promise<{ userName: string, partnerName: string, date: string }> {
    const response = await fetch(`${getBaseUrl(tenantId)}/journal/prompt?tenantId=${tenantId}&userId=${userId}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async createJournalEntry(data: { tenantId: string, userId: string, content: string, date: string, category?: string }) {
    const response = await fetch(`${getBaseUrl(data.tenantId)}/journal/entry`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getJournalEntries(tenantId: string, userId?: string): Promise<any[]> {
    const baseUrlStr = getBaseUrl(tenantId);
    const url = new URL(`${baseUrlStr}/journal/${tenantId}/entries`);
    if (userId) url.searchParams.append('userId', userId);
    const response = await fetch(url.toString(), {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // ─── AI Configuration (BYOK) ───────────────────────────────────────────────
  async getAIConfigs(tenantId: string) {
    const response = await fetch(`${getBaseUrl(tenantId)}/tenant/${tenantId}/ai-configs`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async createAIConfig(tenantId: string, payload: any) {
    return this.post(`/tenant/${tenantId}/ai-configs`, payload, tenantId);
  },

  async activateAIConfig(tenantId: string, configId: string) {
    const response = await fetch(`${getBaseUrl(tenantId)}/tenant/${tenantId}/ai-configs/${configId}/activate`, {
      method: 'PUT',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async deleteAIConfig(tenantId: string, configId: string) {
    const response = await fetch(`${getBaseUrl(tenantId)}/tenant/${tenantId}/ai-configs/${configId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  async getPreferences() {
    return this.get('/auth/preferences');
  },

  async updatePreferences(payload: { darkMode?: boolean, notifications?: boolean, dataSharing?: boolean }) {
    return this.put('/auth/preferences', payload);
  }
};

