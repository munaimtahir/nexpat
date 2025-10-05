import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/constants/queryKeys';
import type {
  PaginatedResponse,
  Patient,
  PatientCreateRequest,
  PatientUpdateRequest
} from '@/api/generated/types';

export const usePatients = (params: { search?: string; page?: number } = {}) =>
  useQuery<PaginatedResponse<Patient>>({
    queryKey: queryKeys.patients(params),
    queryFn: async () => {
      const trimmedSearch = params.search?.trim();
      if (trimmedSearch) {
        const response = await apiClient.searchPatients({
          query: trimmedSearch,
          page: params.page
        });
        return response.data;
      }

      const response = await apiClient.listPatients({
        page: params.page
      });
      return response.data;
    },
    placeholderData: (previousData) => previousData
  });

export const usePatient = (registrationNumber?: string) =>
  useQuery({
    queryKey: queryKeys.patient(registrationNumber ?? 'new'),
    queryFn: async () => {
      if (!registrationNumber) {
        throw new Error('Registration number is required to fetch a patient');
      }
      const response = await apiClient.getPatient(registrationNumber);
      return response.data;
    },
    enabled: Boolean(registrationNumber)
  });

export const usePatientMutations = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (payload: PatientCreateRequest) => {
      const response = await apiClient.createPatient(payload);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
    }
  });

  const update = useMutation({
    mutationFn: async ({ registrationNumber, ...payload }: PatientUpdateRequest & { registrationNumber: string }) => {
      const response = await apiClient.updatePatient(registrationNumber, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.patient(variables.registrationNumber)
      });
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
    }
  });

  return { create, update };
};
