export const ROLES = {
  assistant: 'assistant',
  doctor: 'doctor'
} as const;

export const STORAGE_KEYS = {
  token: 'clinicq/token',
  outbox: 'clinicq/outbox',
  queryCache: 'clinicq/query-cache'
} as const;

export type RoleKey = keyof typeof ROLES;
