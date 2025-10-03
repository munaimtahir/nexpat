export const queryKeys = {
  me: ['auth', 'me'] as const,
  patients: (params?: Record<string, unknown>) =>
    ['patients', params] as const,
  patient: (id: number | string) => ['patient', id] as const,
  visits: (params?: Record<string, unknown>) => ['visits', params] as const,
  visit: (id: number | string) => ['visit', id] as const,
  uploads: ['uploads'] as const,
  health: ['diagnostics', 'health'] as const,
  version: ['diagnostics', 'version'] as const,
  publicDisplayQueue: () => ['public-display', 'queue'] as const
};
