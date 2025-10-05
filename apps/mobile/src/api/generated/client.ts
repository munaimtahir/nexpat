import type {
  AuthTokenResponse,
  HealthResponse,
  LoginRequest,
  PaginatedResponse,
  Patient,
  PatientRequest,
  UploadRequest,
  UserProfile,
  VersionResponse,
  Visit,
  VisitRequest
} from './types';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

export class GeneratedApiClient {
  constructor(private readonly http: AxiosInstance) {}

  login(body: LoginRequest) {
    return this.http.post<AuthTokenResponse>('/api/auth/login/', body);
  }

  me() {
    return this.http.get<UserProfile>('/api/auth/me/');
  }

  listPatients(params: { search?: string; page?: number } = {}) {
    return this.http.get<PaginatedResponse<Patient>>('/api/patients/', { params });
  }

  createPatient(body: PatientRequest) {
    return this.http.post<Patient>('/api/patients/', body);
  }

  updatePatient(id: number, body: Partial<PatientRequest>) {
    return this.http.patch<Patient>(`/api/patients/${id}/`, body);
  }

  getPatient(id: number) {
    return this.http.get<Patient>(`/api/patients/${id}/`);
  }

  listVisits(params: { status?: string; page?: number } = {}) {
    return this.http.get<PaginatedResponse<Visit>>('/api/visits/', { params });
  }

  getVisit(id: number) {
    return this.http.get<Visit>(`/api/visits/${id}/`);
  }

  createVisit(body: VisitRequest) {
    return this.http.post<Visit>('/api/visits/', body);
  }

  updateVisit(id: number, body: Partial<VisitRequest>) {
    return this.http.patch<Visit>(`/api/visits/${id}/`, body);
  }

  uploadPrescription(data: FormData, config?: AxiosRequestConfig<FormData>) {
    return this.http.post('/api/prescriptions/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...(config ?? {})
    });
  }

  health() {
    return this.http.get<HealthResponse>('/api/health/');
  }

  version() {
    return this.http.get<VersionResponse>('/api/version/');
  }
}

export type { LoginRequest, AuthTokenResponse, UserProfile, Patient, Visit };
export type { PatientRequest, VisitRequest, UploadRequest, PaginatedResponse };
export type { HealthResponse, VersionResponse };
