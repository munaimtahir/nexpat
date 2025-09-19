import axios from 'axios';

// Store the short-lived access token in memory only
let accessToken = null;

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

const buildApiUrl = (path = '') => {
  if (!path) {
    return API_BASE_URL;
  }

  const normalizedPath = path.replace(/^\/+/, '');
  return `${API_BASE_URL}/${normalizedPath}`;
};

export const setAccessToken = (token) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

// Use HTTP-only cookies for refresh tokens; send credentials on requests
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

// Attempt to refresh the access token transparently on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (response && response.status === 401 && !config.__isRetryRequest) {
      try {
        const refreshResponse = await axios.post(
          buildApiUrl('/auth/refresh/'),
          {},
          { withCredentials: true }
        );
        const newToken = refreshResponse.data.token;
        if (newToken) {
          setAccessToken(newToken);
          config.__isRetryRequest = true;
          config.headers.Authorization = `Bearer ${newToken}`;
          return api(config);
        }
      } catch {
        clearAccessToken();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
