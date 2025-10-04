export type OutboxMethod = 'post' | 'put' | 'patch' | 'delete';

export interface SerializedFormData {
  __type: 'FormData';
  parts: [string, any][];
}

export interface FormDataLike {
  _parts: [string, any][];
}

export function isSerializedFormData(body: unknown): body is SerializedFormData {
  return (
    typeof body === 'object' &&
    body !== null &&
    '__type' in body &&
    (body as Record<string, unknown>).__type === 'FormData' &&
    'parts' in body &&
    Array.isArray((body as Record<string, unknown>).parts)
  );
}

export function isFormDataLike(body: unknown): body is FormDataLike {
  return (
    typeof body === 'object' &&
    body !== null &&
    '_parts' in body &&
    Array.isArray((body as Record<string, unknown>)._parts)
  );
}

export interface OutboxEntry {
  id: string;
  method: OutboxMethod;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  createdAt: string;
  attempt?: number;
}
