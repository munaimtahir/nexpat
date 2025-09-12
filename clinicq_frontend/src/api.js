import axios from 'axios';

// Store the short-lived access token in memory only
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

// Use HTTP-only cookies for refresh tokens; send credentials on requests
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
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
          '/api/auth/refresh/',
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
