/* eslint-disable no-console */
export const logger = {
  info: (message: string, meta?: unknown) => console.log(message, meta ?? ''),
  warn: (message: string, meta?: unknown) => console.warn(message, meta ?? ''),
  error: (message: string, meta?: unknown) => console.error(message, meta ?? '')
};
