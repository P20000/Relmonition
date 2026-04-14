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

  async login(credentials: { email: string; password: string }): Promise<{ token: string; userId: string }> {
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
  }
};
