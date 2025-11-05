import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? ''  // Use relative URLs in production (same domain)
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');

// Use different API path in production to avoid Next.js conflicts
const API_PREFIX = process.env.NODE_ENV === 'production' ? '/backend-api' : '/api';

// Helper function to build API URLs with correct prefix
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_PREFIX}/${cleanEndpoint}`;
};

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and Vercel protection bypass
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('streamtrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Vercel protection bypass for production
    if (process.env.NODE_ENV === 'production') {
      // Check if we have a bypass token in localStorage or environment
      const bypassToken = localStorage.getItem('vercel_protection_bypass') ||
                         process.env.NEXT_PUBLIC_VERCEL_PROTECTION_BYPASS;

      if (bypassToken) {
        config.headers['x-vercel-protection-bypass'] = bypassToken;
        // Add query params for bypass cookie
        config.params = {
          ...config.params,
          'x-vercel-set-bypass-cookie': 'true'
        };
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('streamtrack_token');
      // Redirect to auth page if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// Generic error type
export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

// Helper function to handle API responses
export const handleApiResponse = <T>(response: any): T => {
  if (response.data?.success) {
    return response.data.data;
  }
  throw new Error(response.data?.error || 'API request failed');
};

// Helper function to handle API errors
export const handleApiError = (error: AxiosError): string => {
  // Log full error for debugging
  console.error('API Error:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    url: error.config?.url,
    method: error.config?.method
  });

  // Handle responses with data
  if (error.response?.data) {
    const data = error.response.data as any;
    
    // Check if it's a string (HTML error page or plain text)
    if (typeof data === 'string') {
      if (error.response.status === 405) {
        return 'Method not allowed. Please check the API endpoint.';
      }
      if (error.response.status === 404) {
        return 'API endpoint not found.';
      }
      return `Server error (${error.response.status}): ${data.substring(0, 100)}`;
    }
    
    // Try to extract error message from JSON
    if (typeof data === 'object' && data !== null) {
      return data.error || data.message || `Server error (${error.response.status})`;
    }
  }
  
  // Handle specific status codes
  if (error.response?.status) {
    switch (error.response.status) {
      case 405:
        return 'Method not allowed. The API endpoint does not accept this request type.';
      case 404:
        return 'API endpoint not found. Please check the URL.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
    }
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  
  return `An unexpected error occurred (Status: ${error.response.status || 'unknown'})`;
};

export default apiClient;
