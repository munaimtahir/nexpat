import axios from 'axios';

// Store the short-lived access token in memory only
let accessToken = null;
let redirectingToLogin = false;

export const setAccessToken = (token) => {
  accessToken = token;
  redirectingToLogin = false;
};

export const clearAccessToken = () => {
  accessToken = null;
  redirectingToLogin = false;
};

// Configure axios instance and send credentials for any cookie-backed endpoints
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

// When we receive a 401, clear any cached auth state and send the user back to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (response && response.status === 401) {
      const isLoginRequest = config?.url?.includes('/api/auth/login/');

      // Avoid redirect loops if the login endpoint itself bubbles a 401
      if (!isLoginRequest) {
        clearAccessToken();

        if (!redirectingToLogin) {
          redirectingToLogin = true;

          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.assign('/login');
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
