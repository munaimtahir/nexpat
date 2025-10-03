import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/constants/queryKeys';
import type { Patient, Visit } from '@/api/generated/types';

export interface PublicDisplayEntry {
  visit: Visit;
  patient?: Patient;
  position: number;
}

const fetchPublicDisplayQueue = async (): Promise<PublicDisplayEntry[]> => {
  const [inProgressResponse, waitingResponse] = await Promise.all([
    apiClient.listVisits({ status: 'in_progress' }),
    apiClient.listVisits({ status: 'waiting' })
  ]);

  const inProgressVisits = [...inProgressResponse.data.results].sort(
    (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  );
  const waitingVisits = [...waitingResponse.data.results].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const visits = [...inProgressVisits, ...waitingVisits].slice(0, 20);

  if (visits.length === 0) {
    return [];
  }

  const uniquePatientIds = Array.from(new Set(visits.map((visit) => visit.patient)));

  const patients = await Promise.all(
    uniquePatientIds.map(async (id) => {
      try {
        const response = await apiClient.getPatient(id);
        return response.data;
      } catch (error) {
        return null;
      }
    })
  );

  const patientMap = new Map<number, Patient>();
  patients.forEach((patient) => {
    if (patient) {
      patientMap.set(patient.id, patient);
    }
  });

  return visits.map((visit, index) => ({
    visit,
    patient: patientMap.get(visit.patient),
    position: index + 1
  }));
};

export const usePublicDisplayQueue = () =>
  useQuery({
    queryKey: queryKeys.publicDisplayQueue(),
    queryFn: fetchPublicDisplayQueue,
    refetchInterval: 10000,
    refetchIntervalInBackground: true
  });
