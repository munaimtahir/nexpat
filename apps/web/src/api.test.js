import * as apiModule from './api';

const { default: api, setAccessToken, clearAccessToken } = apiModule;

const getRequestInterceptor = () => {
  const handler = api.interceptors.request.handlers.find(Boolean);

  if (!handler || typeof handler.fulfilled !== 'function') {
    throw new Error('Request interceptor not registered');
  }

  return handler.fulfilled;
};

const getResponseErrorInterceptor = () => {
  const handler = api.interceptors.response.handlers.find(Boolean);

  if (!handler || typeof handler.rejected !== 'function') {
    throw new Error('Response interceptor not registered');
  }

  return handler.rejected;
};

describe('api interceptors', () => {
  const originalHref = window.location.href;
  let redirectSpy;

  beforeEach(() => {
    clearAccessToken();
    window.history.replaceState({}, '', '/dashboard');
    redirectSpy = jest.spyOn(apiModule.authNavigation, 'redirectToLogin').mockImplementation(() => {});
  });

  afterEach(() => {
    redirectSpy.mockRestore();
    clearAccessToken();
    window.history.replaceState({}, '', originalHref);
  });

  it('redirects to login and clears the access token when receiving a 401 response', async () => {
    const runRequestInterceptor = getRequestInterceptor();
    const runResponseInterceptor = getResponseErrorInterceptor();

    setAccessToken('test-token');

    const configWithToken = runRequestInterceptor({ headers: {} });
    expect(configWithToken.headers.Authorization).toBe('Token test-token');

    const error = new Error('Unauthorized');
    error.response = { status: 401 };

    await expect(runResponseInterceptor(error)).rejects.toBe(error);

    expect(redirectSpy).toHaveBeenCalledTimes(1);

    const configAfterError = runRequestInterceptor({ headers: {} });
    expect(configAfterError.headers.Authorization).toBeUndefined();
  });

  it.each([
    ['a 400 response', 400],
    ['a 500 response', 500],
  ])('does not redirect or clear the token for %s', async (_, status) => {
    const runRequestInterceptor = getRequestInterceptor();
    const runResponseInterceptor = getResponseErrorInterceptor();

    setAccessToken('still-valid-token');

    const configBefore = runRequestInterceptor({ headers: {} });
    expect(configBefore.headers.Authorization).toBe('Token still-valid-token');

    const error = new Error(`HTTP ${status}`);
    error.response = { status };

    await expect(runResponseInterceptor(error)).rejects.toBe(error);

    expect(redirectSpy).not.toHaveBeenCalled();

    const configAfter = runRequestInterceptor({ headers: {} });
    expect(configAfter.headers.Authorization).toBe('Token still-valid-token');
  });

  it('does not redirect or clear the token for network errors without a response', async () => {
    const runRequestInterceptor = getRequestInterceptor();
    const runResponseInterceptor = getResponseErrorInterceptor();

    setAccessToken('network-token');

    const configBefore = runRequestInterceptor({ headers: {} });
    expect(configBefore.headers.Authorization).toBe('Token network-token');

    const error = new Error('Network Error');

    await expect(runResponseInterceptor(error)).rejects.toBe(error);

    expect(redirectSpy).not.toHaveBeenCalled();

    const configAfter = runRequestInterceptor({ headers: {} });
    expect(configAfter.headers.Authorization).toBe('Token network-token');
  });
});
