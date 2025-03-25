// Types for API responses
export type dataName = "user" | "reservable" | "reservables" | "reservation" | "reservations" | "constraint" | "constraints" | "children";

export interface ApiResponse<T, E = unknown> {
  success: boolean;
  message?: string;
  data?: Record<dataName, T> & {
    token?: string;  // Move token inside data
  };
  errors?: E;
}

class NetworkService {
  private static instance: NetworkService;
  private baseUrl: string;
  private token: string | null = null;

  private constructor() {
    // Default to an empty string, will be set from environment variables or config
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    if (!this.baseUrl) {
      throw new Error('NEXT_PUBLIC_API_URL is not set');
    }
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  public setToken(token: string): void {
    this.token = token;
    // Optionally store token in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  public getToken(): string | null {
    // Try to get from memory first
    if (this.token) {
      return this.token;
    }
    
    // Otherwise try to get from localStorage if in browser
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        this.token = storedToken;
        return storedToken;
      }
    }
    
    return null;
  }

  public clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  private createHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: this.createHeaders(),
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data: ApiResponse<T> = await response.json();

      // If the response contains a token inside data, store it
      if (data.data?.token) {
        this.setToken(data.data.token);
      }

      // Handle unsuccessful responses
      if (!data.success) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET');
  }

  public async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', data);
  }

  public async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', data);
  }

  public async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PATCH', data);
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE');
  }
}

// Export singleton instance
export const networkService = NetworkService.getInstance();

// Default export
export default networkService; 