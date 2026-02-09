// src/client/lib/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status} ${endpoint}:`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data as T;
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status} ${endpoint}:`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    return response.json() as T;
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status} ${endpoint}:`, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    return response.json() as T;
  },
};