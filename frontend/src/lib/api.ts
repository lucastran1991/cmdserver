// lib/api.ts - API configuration utility
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/auth/jwt/login`,
  LOGOUT: `${API_BASE_URL}/auth/jwt/logout`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  
  // Deployment
  PULL_BE_SOURCE: `${API_BASE_URL}/api/deployment/pull-be-source`,
  PULL_SPECIFIC_BE_SOURCE: `${API_BASE_URL}/api/deployment/pull-specific-be-source`,
  PULL_UI_SOURCE: `${API_BASE_URL}/api/deployment/pull-ui-source`,
  PULL_SPECIFIC_UI_SOURCE: `${API_BASE_URL}/api/deployment/pull-specific-ui-source`,
  RE_SCHEMA: `${API_BASE_URL}/api/deployment/re-schema`,
  CHANGE_ENVIRONMENT: `${API_BASE_URL}/api/deployment/change-environment`,
  RESTART_SERVER: `${API_BASE_URL}/api/deployment/restart-server`,
  CLEAR_CACHE: `${API_BASE_URL}/api/deployment/clear-cache`,
  PULL_VEOLIA_PLUGIN: `${API_BASE_URL}/api/deployment/pull-veolia-plugin`,
  KILL_ENGINES: `${API_BASE_URL}/api/deployment/kill-engines`,
  
  // Logs
  ENGINE_LOGS: `${API_BASE_URL}/api/logs/engine`,
  NOHUP_LOGS: `${API_BASE_URL}/api/logs/nohup`,
  CO_ENGINE_LOGS: `${API_BASE_URL}/api/logs/co-engine`,
  ERROR_LOGS: `${API_BASE_URL}/api/logs/errors`,
  
  // Status
  DEPLOYMENT_STATUS: `${API_BASE_URL}/api/deployment/status`,
  DEPLOYMENT_CONFIG: `${API_BASE_URL}/api/deployment/config`,
  
  // Targets
  TARGETS: `${API_BASE_URL}/targets`,
} as const;

// API client configuration
export const apiClient = {
  baseURL: API_BASE_URL,
  timeout: 88880,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to make authenticated requests
export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const authHeaders = getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...apiClient.headers,
      ...authHeaders,
      ...(options.headers as Record<string, string>),
    } as HeadersInit,
    credentials: 'include',
    mode: 'cors',
  });
};

export default API_BASE_URL;
