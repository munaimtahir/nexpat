import axios from 'axios';

// Store the short-lived access token in memory only
let accessToken = null;
let redirectingToLogin = false;

const DEFAULT_API_PATH = '/api';

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

const normalizeApiBase = (value) => {
  const raw = (value ?? '').trim();

  if (!raw) {
    return DEFAULT_API_PATH;
  }

  const withoutTrailingSlash = trimTrailingSlashes(raw);

  if (!withoutTrailingSlash) {
    return DEFAULT_API_PATH;
  }

  if (/\/api(?:\/|$)/.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}${DEFAULT_API_PATH}`;
};

const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

export const setAccessToken = (token) => {
  accessToken = token;
  redirectingToLogin = false;
};

export const clearAccessToken = () => {
  accessToken = null;
  redirectingToLogin = false;
};

export const authNavigation = {
  redirectToLogin: () => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  },
};

// Configure axios instance and send credentials for any cookie-backed endpoints
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // Attach access token from memory when available
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// When we receive a 401, clear any cached auth state and send the user back to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    let response;
    if (error && typeof error === 'object') {
      response = error.response;
    }

    if (response?.status === 401) {
      clearAccessToken();

      if (!redirectingToLogin) {
        redirectingToLogin = true;
        authNavigation.redirectToLogin();
        redirectingToLogin = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
