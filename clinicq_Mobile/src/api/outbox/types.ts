export type OutboxMethod = 'post' | 'put' | 'patch' | 'delete';

export interface OutboxEntry {
  id: string;
  method: OutboxMethod;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  createdAt: string;
  attempt?: number;
}
