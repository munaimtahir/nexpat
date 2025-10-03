import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { STORAGE_KEYS } from '@/constants';
import { secureStore } from '@/storage/secureStore';
import { env } from '@/utils/environment';
import { logger } from '@/utils/logger';
import { GeneratedApiClient } from './generated/client';
import { outbox } from './outbox/outbox';

let accessToken: string | null = null;
let refreshToken: string | null = null;

const loadTokens = async () => {
  accessToken = (await secureStore.getString(STORAGE_KEYS.token)) ?? null;
  refreshToken = (await secureStore.getString(STORAGE_KEYS.refreshToken)) ?? null;
};

void loadTokens();

const persistTokens = async (tokens: { access?: string; refresh?: string }) => {
  if (tokens.access) {
    accessToken = tokens.access;
    await secureStore.setString(STORAGE_KEYS.token, tokens.access);
  }
  if (tokens.refresh) {
    refreshToken = tokens.refresh;
    await secureStore.setString(STORAGE_KEYS.refreshToken, tokens.refresh);
  }
};

const clearTokens = async () => {
  accessToken = null;
  refreshToken = null;
  await secureStore.remove(STORAGE_KEYS.token);
  await secureStore.remove(STORAGE_KEYS.refreshToken);
};

const http: AxiosInstance = axios.create({
  baseURL: env.serverUrl,
  timeout: 15000
});

http.interceptors.request.use(async (config) => {
  if (!accessToken) {
    await loadTokens();
  }
  if (accessToken) {
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${accessToken}`
    };
  }
  return config;
});

const retryRequest = async (config: AxiosRequestConfig, token: string) => {
  const nextConfig = {
    ...config,
    headers: {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`
    }
  };
  return http(nextConfig);
};

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && refreshToken && originalRequest && !originalRequest._retry) {
      try {
        originalRequest._retry = true;
        const refreshResponse = await http.post<{ access: string }>('/api/auth/refresh/', {
          refresh: refreshToken
        });
        await persistTokens({ access: refreshResponse.data.access });
        return retryRequest(originalRequest, refreshResponse.data.access);
      } catch (refreshError) {
        await clearTokens();
      }
    }

    const method = (originalRequest?.method ?? '').toLowerCase();
    const nonGet = method && method !== 'get';
    const offlineOrNetworkError = !error.response;

    if (nonGet && offlineOrNetworkError && originalRequest?.url) {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        await outbox.enqueue(method as any, originalRequest.url, originalRequest.data, originalRequest.headers as any);
        logger.warn('Request queued in outbox', { url: originalRequest.url });
        return Promise.resolve({ data: null, status: 202, statusText: 'queued', headers: {}, config: originalRequest });
      }
    }

    return Promise.reject(error);
  }
);

export const apiClient = new GeneratedApiClient(http);

export const authStorage = {
  persistTokens,
  clearTokens,
  loadTokens: () => loadTokens()
};

export { http };
