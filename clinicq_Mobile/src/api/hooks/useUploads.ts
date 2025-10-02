import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

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
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: 'image/jpeg'
      } as any);

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
