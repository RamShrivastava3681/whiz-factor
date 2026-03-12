// API Configuration
// This file centralizes all API-related configuration

// Get the API base URL from environment variables
// In development, Vite exposes env vars that start with VITE_
const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.MODE === 'development';
  
  // Use environment variable if available, otherwise fallback to development default
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Development defaults
  if (isDevelopment) {
    return 'http://localhost:6767';
  }
  
  // Production default (relative URL works with Nginx proxy)
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to create full API URLs
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL;
  
  // If base URL already includes /api, don't add it again
  if (baseUrl === '/api' || baseUrl.endsWith('/api')) {
    // For production with base URL '/api', just append the endpoint
    return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  }
  
  // For development with full localhost URL
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
};

// Default headers for API requests
export const getApiHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function for making authenticated API requests
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = createApiUrl(endpoint);
  const headers = {
    ...getApiHeaders(),
    ...options.headers
  };
  
  return fetch(url, {
    ...options,
    headers
  });
};

export default {
  API_BASE_URL,
  createApiUrl,
  getApiHeaders,
  apiRequest
};