/**
 * Frontend API Utility to communicate with the Backend
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = {
  async getTenantData(coupleId: string) {
    const response = await fetch(`${BASE_URL}/tenant/${coupleId}`);
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  },

  async queryRelationshipContext(coupleId: string, query: string, mode: 'retrieval' | 'exploration') {
    const response = await fetch(`${BASE_URL}/ai/query`, {
      method: 'POST',
      body: JSON.stringify({ coupleId, query, mode }),
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async login(credentials: { email: string, password: string, coupleId: string }) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  async signup(credentials: { email: string, password: string, coupleId: string }) {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Signup failed');
    return response.json();
  }
};
