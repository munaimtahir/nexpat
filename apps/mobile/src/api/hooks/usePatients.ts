import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/constants/queryKeys';
import type { PaginatedResponse, Patient, PatientRequest } from '@/api/generated/types';

export const usePatients = (params: { search?: string; page?: number }) =>
  useQuery<PaginatedResponse<Patient>>({
    queryKey: queryKeys.patients(params),
    queryFn: async () => {
      const response = await apiClient.listPatients(params);
      return response.data;
    },
    placeholderData: (previousData) => previousData
  });

export const usePatient = (id: number) =>
  useQuery({
    queryKey: queryKeys.patient(id),
    queryFn: async () => {
      const response = await apiClient.getPatient(id);
      return response.data;
    },
    enabled: !!id
  });

export const usePatientMutations = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (payload: PatientRequest) => {
      const response = await apiClient.createPatient(payload);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
    }
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<PatientRequest> & { id: number }) => {
      const response = await apiClient.updatePatient(id, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.patient(variables.id) });
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
    }
  });

  return { create, update };
};
