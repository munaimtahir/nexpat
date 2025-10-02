import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/constants/queryKeys';

export const useHealth = () =>
  useQuery({
    queryKey: queryKeys.health,
    queryFn: async () => {
      const response = await apiClient.health();
      return response.data;
    }
  });

export const useVersion = () =>
  useQuery({
    queryKey: queryKeys.version,
    queryFn: async () => {
      const response = await apiClient.version();
      return response.data;
    }
  });
