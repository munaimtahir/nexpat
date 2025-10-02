export interface TokenPair {
  access: string;
  refresh?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserProfile {
  id: number;
  username: string;
  roles: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientRequest {
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  phone?: string | null;
  notes?: string | null;
}

export interface Visit {
  id: number;
  patient: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitRequest {
  patient: number;
  status?: Visit['status'];
  reason?: string | null;
  notes?: string | null;
}

export interface UploadRequest {
  patient: number;
  visit: number;
  description?: string;
  file: any;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
}

export interface VersionResponse {
  version: string;
  commit?: string;
}
