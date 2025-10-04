import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, http } from '@/api/client';
import type { PaginatedResponse, PrescriptionImage } from '@/api/generated/types';

interface ReactNativeFile {
  uri: string;
  name: string;
  type: string;
}

export const useUploadPrescription = () =>
  useMutation({
    mutationFn: async ({
      fileUri,
      fileName,
      patient,
      visit,
      description,
      onUploadProgress
    }: {
      fileUri: string;
      fileName: string;
      patient: number;
      visit: number;
      description?: string;
      onUploadProgress?: (progress: number) => void;
    }) => {
      const formData = new FormData();
      formData.append('patient', String(patient));
      formData.append('visit', String(visit));
      if (description) {
        formData.append('description', description);
      }
      const file: ReactNativeFile = {
        uri: fileUri,
        name: fileName,
        type: 'image/jpeg'
      };
      // FormData.append in React Native accepts ReactNativeFile objects
      formData.append('file', file as unknown as Blob);

      const response = await apiClient.uploadPrescription(formData, {
        onUploadProgress: (event) => {
          if (onUploadProgress && event.total) {
            onUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        }
      });

      return response;
    }
  });

export interface PrescriptionImageFilters {
  visitId?: number;
  patientRegistration?: string;
  page?: number;
}

export const usePrescriptionImages = (filters: PrescriptionImageFilters = {}) =>
  useQuery<PaginatedResponse<PrescriptionImage>>({
    queryKey: ['prescription-images', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.visitId) {
        params.set('visit', String(filters.visitId));
      }
      if (filters.patientRegistration) {
        params.set('patient', filters.patientRegistration);
      }
      if (filters.page) {
        params.set('page', String(filters.page));
      }

      const paramsString = params.toString();
      const url = `/api/prescriptions/${paramsString ? `?${paramsString}` : ''}`;
      const response = await http.get<PaginatedResponse<PrescriptionImage>>(url);
      return response.data;
    },
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 5
  });
