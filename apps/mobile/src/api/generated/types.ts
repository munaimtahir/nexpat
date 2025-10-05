export interface TokenPair {
  access: string;
  refresh?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserProfile {
  username: string;
  roles: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Patient {
  registration_number: string;
  name: string;
  phone: string | null;
  gender: PatientGender;
  created_at: string;
  updated_at: string;
  last_5_visit_dates: string[];
}

export interface PatientCreateRequest {
  name: string;
  phone?: string | null;
  gender?: PatientGender;
}

export interface PatientUpdateRequest {
  name?: string;
  phone?: string | null;
  gender?: PatientGender;
}

export type VisitStatus = 'WAITING' | 'START' | 'IN_ROOM' | 'DONE';

export interface Visit {
  id: number;
  token_number: number;
  visit_date: string;
  status: VisitStatus;
  created_at: string;
  updated_at: string;
  patient: string;
  queue: number;
  patient_registration_number: string;
  patient_full_name: string;
  queue_name: string;
}

export interface VisitCreateRequest {
  patient: string;
  queue: number;
}

export interface VisitUpdateRequest {
  queue?: number;
}

export interface UploadRequest {
  patient: string;
  visit: number;
  description?: string;
  file: any;
}

export interface PrescriptionImage {
  id: number;
  visit: number;
  drive_file_id: string;
  image_url: string;
  created_at: string;
}

export interface Queue {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}
