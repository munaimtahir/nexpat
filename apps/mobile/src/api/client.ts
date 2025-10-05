import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosRequestHeaders
} from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { STORAGE_KEYS } from '@/constants';
import { secureStore } from '@/storage/secureStore';
import { env } from '@/utils/environment';
import { logger } from '@/utils/logger';
import { GeneratedApiClient } from './generated/client';
import { outbox } from './outbox/outbox';
import type { OutboxMethod } from './outbox/types';

function isOutboxMethod(method: string): method is OutboxMethod {
  return ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase());
}

let authToken: string | null = null;

const loadToken = async () => {
  authToken = (await secureStore.getString(STORAGE_KEYS.token)) ?? null;
};

void loadToken();

const persistToken = async (token: string) => {
  authToken = token;
  await secureStore.setString(STORAGE_KEYS.token, token);
};

const clearToken = async () => {
  authToken = null;
  await secureStore.remove(STORAGE_KEYS.token);
};

const http: AxiosInstance = axios.create({
  baseURL: env.serverUrl,
  timeout: 15000
});

http.interceptors.request.use(async (config) => {
  if (!authToken) {
    await loadToken();
  }
  if (authToken) {
    const headers = AxiosHeaders.from((config.headers ?? {}) as AxiosRequestHeaders);
    headers.set('Authorization', `Token ${authToken}`);
    config.headers = headers;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig | undefined;
    const method = (originalRequest?.method ?? '').toLowerCase();
    const nonGet = method && method !== 'get';
    const offlineOrNetworkError = !error.response;

    if (nonGet && offlineOrNetworkError && originalRequest?.url) {
      const state = await NetInfo.fetch();
      if (!state.isConnected && isOutboxMethod(method)) {
        const headers = originalRequest.headers 
          ? Object.fromEntries(
              Object.entries(originalRequest.headers).filter(
                ([_, value]) => typeof value === 'string'
              ) as [string, string][]
            )
          : undefined;
        await outbox.enqueue(method, originalRequest.url, originalRequest.data, headers);
        logger.warn('Request queued in outbox', { url: originalRequest.url });
        return Promise.resolve({ data: null, status: 202, statusText: 'queued', headers: {}, config: originalRequest });
      }
    }

    return Promise.reject(error);
  }
);

export const apiClient = new GeneratedApiClient(http);

export const authStorage = {
  persistToken,
  clearToken,
  loadToken: () => loadToken()
};

export { http };
