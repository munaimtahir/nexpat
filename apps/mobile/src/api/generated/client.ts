import type {
  AuthTokenResponse,
  HealthResponse,
  LoginRequest,
  PaginatedResponse,
  Patient,
  PatientCreateRequest,
  PatientUpdateRequest,
  TokenPair,
  UploadRequest,
  UserProfile,
  Visit,
  VisitCreateRequest,
  VisitStatus,
  VisitUpdateRequest
} from './types';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

const VISIT_STATUS_ACTION: Record<VisitStatus, string> = {
  WAITING: 'send_back_to_waiting',
  START: 'start',
  IN_ROOM: 'in_room',
  DONE: 'done'
};

export class GeneratedApiClient {
  constructor(private readonly http: AxiosInstance) {}

  login(body: LoginRequest) {
    return this.http.post<AuthTokenResponse>('/api/auth/login/', body);
  }

  me() {
    return this.http.get<UserProfile>('/api/auth/me/');
  }

  listPatients(params: { page?: number; registration_numbers?: string[] } = {}) {
    const query: Record<string, unknown> = {};
    if (params.page !== undefined) {
      query.page = params.page;
    }
    if (params.registration_numbers?.length) {
      query.registration_numbers = params.registration_numbers.join(',');
    }
    return this.http.get<PaginatedResponse<Patient>>('/api/patients/', { params: query });
  }

  searchPatients(params: { query: string; page?: number }) {
    const query: Record<string, unknown> = { q: params.query };
    if (params.page !== undefined) {
      query.page = params.page;
    }
    return this.http.get<PaginatedResponse<Patient>>('/api/patients/search/', {
      params: query
    });
  }

  createPatient(body: PatientCreateRequest) {
    return this.http.post<Patient>('/api/patients/', body);
  }

  updatePatient(registrationNumber: string, body: PatientUpdateRequest) {
    return this.http.patch<Patient>(`/api/patients/${registrationNumber}/`, body);
  }

  getPatient(registrationNumber: string) {
    return this.http.get<Patient>(`/api/patients/${registrationNumber}/`);
  }

  listVisits(
    params: { status?: VisitStatus | VisitStatus[]; page?: number; queue?: number } = {}
  ) {
    const query: Record<string, unknown> = {};
    if (params.page !== undefined) {
      query.page = params.page;
    }
    if (params.queue !== undefined) {
      query.queue = params.queue;
    }
    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      query.status = statuses.map((value) => value.toUpperCase()).join(',');
    }
    return this.http.get<PaginatedResponse<Visit>>('/api/visits/', { params: query });
  }

  getVisit(id: number) {
    return this.http.get<Visit>(`/api/visits/${id}/`);
  }

  createVisit(body: VisitCreateRequest) {
    return this.http.post<Visit>('/api/visits/', body);
  }

  updateVisit(id: number, body: VisitUpdateRequest) {
    return this.http.patch<Visit>(`/api/visits/${id}/`, body);
  }

  updateVisitStatus(id: number, status: VisitStatus) {
    const action = VISIT_STATUS_ACTION[status];
    return this.http.patch<Visit>(`/api/visits/${id}/${action}/`);
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
}

export type {
  LoginRequest,
  TokenPair,
  UserProfile,
  Patient,
  Visit,
  PatientCreateRequest,
  PatientUpdateRequest,
  VisitCreateRequest,
  VisitUpdateRequest,
  VisitStatus,
  UploadRequest,
  PaginatedResponse,
  HealthResponse
};
