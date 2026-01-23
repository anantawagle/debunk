const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

interface User {
  id: number;
  email: string;
  is_active: boolean;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('access_token');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid/expired, logout
        this.logout();
        throw new Error('AUTH_REQUIRED');
      }

      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
        }
      } catch {
        const errorText = await response.text();
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: email,
        password: password,
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.token = data.access_token;
    localStorage.setItem('access_token', this.token);
    return data;
  }

  async signup(email: string, password: string): Promise<User> {
    return this.request('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        username: email, // Use email as username
        email,
        password
      }),
    });
  }

  async uploadContent(
    content: File | string,
    contentType: 'image' | 'text' | 'video'
  ): Promise<any> {
    const formData = new FormData();

    if (contentType === 'text') {
      formData.append('content_type', contentType);
      formData.append('text_content', content as string);
    } else {
      formData.append('file', content as File);
      formData.append('content_type', contentType);
    }

    const response = await fetch(`${this.baseURL}/api/v1/detections/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  async getDetectionStatus(detectionId: number): Promise<any> {
    return this.request(`/api/v1/detections/status/${detectionId}`);
  }

  async getUserDetections(skip = 0, limit = 100): Promise<any> {
    return this.request(`/api/v1/detections/?skip=${skip}&limit=${limit}`);
  }

  async getUserProfile(): Promise<any> {
    return this.request('/api/v1/users/me');
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);