import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/constants/queryKeys';
import type { PaginatedResponse, Visit, VisitRequest } from '@/api/generated/types';

export const useVisits = (params: { status?: string; page?: number }) =>
  useQuery<PaginatedResponse<Visit>>({
    queryKey: queryKeys.visits(params),
    queryFn: async () => {
      const response = await apiClient.listVisits(params);
      return response.data;
    },
    placeholderData: (previousData) => previousData
  });

export const useVisit = (id: number) =>
  useQuery({
    queryKey: queryKeys.visit(id),
    queryFn: async () => {
      const response = await apiClient.getVisit(id);
      return response.data;
    },
    enabled: !!id
  });

export const useVisitMutation = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (payload: VisitRequest) => {
      const response = await apiClient.createVisit(payload);
      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['visits'] });
      const optimisticVisit = {
        ...variables,
        id: Date.now(),
        status: variables.status ?? 'waiting',
        optimistic: true
      };
      const previous = queryClient.getQueriesData({ queryKey: ['visits'] });
      previous.forEach(([key, data]) => {
        if (data) {
          queryClient.setQueryData(key, {
            ...data,
            results: [optimisticVisit, ...(data as any).results]
          });
        }
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous?.forEach(([key, data]: any) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['visits'] });
    }
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<VisitRequest> & { id: number }) => {
      const response = await apiClient.updateVisit(id, payload);
      return response.data;
    },
    onMutate: async ({ id, ...payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.visit(id) });
      const previousVisit = queryClient.getQueryData(queryKeys.visit(id));
      queryClient.setQueryData(queryKeys.visit(id), (current: any) => ({ ...current, ...payload }));

      const listSnapshots = queryClient.getQueriesData({ queryKey: ['visits'] });
      listSnapshots.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...(data as any),
          results: (data as any).results.map((visit: any) => (visit.id === id ? { ...visit, ...payload } : visit))
        });
      });

      return { previousVisit, listSnapshots };
    },
    onError: (_error, variables, context) => {
      if (context?.previousVisit) {
        queryClient.setQueryData(queryKeys.visit(variables.id), context.previousVisit);
      }
      context?.listSnapshots?.forEach(([key, data]: any) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.visit(variables.id) });
      void queryClient.invalidateQueries({ queryKey: ['visits'] });
    }
  });

  return { create, update };
};
