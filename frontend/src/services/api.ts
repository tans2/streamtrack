import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? ''  // Use relative URLs in production (same domain)
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('streamtrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  if (error.response?.data) {
    const data = error.response.data as any;
    return data.error || data.message || 'An error occurred';
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  
  return 'An unexpected error occurred';
};

export default apiClient;
