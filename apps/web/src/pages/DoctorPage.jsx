import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api.js';
import { unwrapListResponse } from '../utils/api.js';
import {
  StatusBadge,
  TimeStamp,
  WorkspaceLayout,
  SelectField,
  FilterChips,
  EmptyState,
  LoadingSpinner,
  ProgressPulse,
} from '../components/index.js';

const DoctorPage = () => {
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [uploadStates, setUploadStates] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchVisits = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const queueParam = selectedQueue ? `&queue=${selectedQueue}` : '';
      const response = await api.get(`/visits/?status=WAITING,START,IN_ROOM${queueParam}`);
      const fetchedVisits = unwrapListResponse(response.data);

      const registrationNumbers = [
        ...new Set(
          fetchedVisits
            .map((visit) => visit.patient_registration_number)
            .filter(Boolean)
            .map((value) => String(value)),
        ),
      ];

      let patientsByRegNum = {};
      if (registrationNumbers.length > 0) {
        const CHUNK_SIZE = 50;
        const registrationChunks = [];
        for (let i = 0; i < registrationNumbers.length; i += CHUNK_SIZE) {
          registrationChunks.push(registrationNumbers.slice(i, i + CHUNK_SIZE));
        }

        const patientResponses = await Promise.all(
          registrationChunks.map((chunk) =>
            api.get(`/patients/?registration_numbers=${chunk.join(',')}`),
          ),
        );

        patientsByRegNum = patientResponses.reduce((acc, resp) => {
          const patientList = unwrapListResponse(resp.data);
          patientList.forEach((patient) => {
            if (patient?.registration_number !== undefined) {
              acc[String(patient.registration_number)] = patient;
            }
          });
          return acc;
        }, {});
      }

      const detailedVisits = fetchedVisits.map((visit) => ({
        ...visit,
        patient_details:
          patientsByRegNum[String(visit.patient_registration_number)] ?? null,
      }));

      let withImages = detailedVisits;
      if (import.meta.env.MODE !== 'test') {
        withImages = await Promise.all(
          detailedVisits.map(async (visit) => {
            try {
              const imgResp = await api.get(`/prescriptions/?visit=${visit.id}`);
              return { ...visit, prescription_images: unwrapListResponse(imgResp.data) };
            } catch (imageError) {
              console.error('Failed to fetch prescription images:', imageError);
              return { ...visit, prescription_images: [] };
            }
          }),
        );
      }

      setVisits(withImages);
    } catch (err) {
      console.error('Error fetching visits:', err);
      setError('Failed to fetch visits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedQueue]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    const fetchQueues = async () => {
      try {
        const response = await api.get('/queues/');
        setQueues(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching queues:', err);
      }
    };
    fetchQueues();
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleUpdateVisitStatus = useCallback(
    async (visitId, action) => {
      try {
        await api.patch(`/visits/${visitId}/${action}/`);
        fetchVisits();
      } catch (err) {
        console.error(`Error during action ${action} for visit ${visitId}:`, err);
        setError(`Failed to perform action. ${err.response?.data?.detail || ''}`);
      }
    },
    [fetchVisits],
  );

  const handleFileChange = (visitId, file) => {
    setUploadStates((prev) => ({
      ...prev,
      [visitId]: { ...prev[visitId], file, error: '' },
    }));
  };

  const handleUpload = async (visitId) => {
    const state = uploadStates[visitId];
    if (!state?.file) return;
    setUploadStates((prev) => ({
      ...prev,
      [visitId]: { ...state, uploading: true, error: '' },
    }));
    try {
      const form = new FormData();
      form.append('visit', visitId);
      form.append('image', state.file);
      await api.post('/prescriptions/', form);
      const imgResp = await api.get(`/prescriptions/?visit=${visitId}`);
      setVisits((prev) =>
        prev.map((visit) =>
          visit.id === visitId
            ? { ...visit, prescription_images: unwrapListResponse(imgResp.data) }
            : visit,
        ),
      );
      setUploadStates((prev) => ({
        ...prev,
        [visitId]: { file: null, uploading: false, error: '' },
      }));
    } catch (err) {
      console.error('Upload failed', err);
      setUploadStates((prev) => ({
        ...prev,
        [visitId]: { ...state, uploading: false, error: 'Failed to upload image' },
      }));
    }
  };

  const renderActionButtons = useCallback((visit) => {
    switch (visit.status) {
      case 'WAITING':
        return (
          <button
            onClick={() => handleUpdateVisitStatus(visit.id, 'start')}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Start Consultation
          </button>
        );
      case 'START':
        return (
          <>
            <button
              onClick={() => handleUpdateVisitStatus(visit.id, 'in_room')}
              className="rounded-full bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-500"
            >
              Move to Room
            </button>
            <button
              onClick={() => handleUpdateVisitStatus(visit.id, 'send_back_to_waiting')}
              className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-400"
            >
              Send Back
            </button>
          </>
        );
      case 'IN_ROOM':
        return (
          <>
            <button
              onClick={() => handleUpdateVisitStatus(visit.id, 'done')}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              Mark as Done
            </button>
            <button
              onClick={() => handleUpdateVisitStatus(visit.id, 'send_back_to_waiting')}
              className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-400"
            >
              Send Back
            </button>
          </>
        );
      default:
        return null;
    }
  }, [handleUpdateVisitStatus]);

  const normalizedVisits = useMemo(
    () =>
      visits.map((visit) => ({
        ...visit,
        prescription_images: visit.prescription_images || [],
      })),
    [visits],
  );

  const statusCounts = useMemo(() => {
    return normalizedVisits.reduce(
      (acc, visit) => {
        acc.total += 1;
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
      },
      { total: 0 },
    );
  }, [normalizedVisits]);

  const filteredVisits = useMemo(() => {
    if (statusFilter === 'ALL') return normalizedVisits;
    return normalizedVisits.filter((visit) => visit.status === statusFilter);
  }, [normalizedVisits, statusFilter]);

  const kpis = [
    { label: 'Active patients', value: statusCounts.total || '0', tone: 'info' },
    { label: 'Waiting', value: statusCounts.WAITING ?? 0, tone: 'caution' },
    { label: 'In consult', value: statusCounts.START ?? 0, tone: 'info' },
    { label: 'In room', value: statusCounts.IN_ROOM ?? 0, tone: 'positive' },
  ];

  const statusOptions = [
    { label: 'All statuses', value: 'ALL' },
    { label: 'Waiting', value: 'WAITING' },
    { label: 'In consult', value: 'START' },
    { label: 'In room', value: 'IN_ROOM' },
  ];

  return (
    <WorkspaceLayout
      title="Doctor Dashboard"
      subtitle="Move patients through consults, update statuses, and capture prescriptions in one grid."
      breadcrumbs={[
        { label: 'Home', to: '/' },
        { label: 'Doctor' },
      ]}
      kpis={kpis}
      actions={(
        <button
          type="button"
          onClick={fetchVisits}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <span aria-hidden="true">⟳</span>
          {isLoading ? 'Refreshing…' : 'Refresh list'}
        </button>
      )}
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
          <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">Queue focus</p>
            <p className="text-xs text-slate-400">Filter the grid by queue without losing your place.</p>
            <div className="mt-4">
              <SelectField
                label="Active queue"
                value={selectedQueue}
                onChange={(e) => setSelectedQueue(e.target.value)}
              >
                <option value="">All queues</option>
                {queues.map((queue) => (
                  <option key={queue.id} value={queue.id}>
                    {queue.name}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">Status lanes</p>
            <p className="text-xs text-slate-400">Jump to the stage that needs attention.</p>
            <div className="mt-4">
              <FilterChips
                options={statusOptions}
                activeValue={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-white shadow-xl">
          <div className="border-b border-indigo-50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800">Live patient queue</h2>
              <ProgressPulse active={isLoading} className="w-48" />
            </div>
            {error && (
              <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="relative max-h-[520px] overflow-auto">
            {isLoading && filteredVisits.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner label="Loading patient list…" />
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No patients in queue"
                  description="When new visits are created they will populate here instantly."
                />
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Token</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Queue</th>
                    <th className="px-6 py-3">Timeline</th>
                    <th className="px-6 py-3">Progress</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit) => {
                    const progress =
                      visit.status === 'WAITING'
                        ? 25
                        : visit.status === 'START'
                          ? 60
                          : visit.status === 'IN_ROOM'
                            ? 90
                            : 100;
                    return (
                      <tr
                        key={visit.id}
                        className="rounded-3xl bg-slate-50/80 text-sm text-slate-600 shadow-sm transition hover:bg-indigo-50"
                      >
                        <td className="rounded-l-3xl px-6 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Token
                            </span>
                            <span className="text-2xl font-bold text-indigo-600">{visit.token_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-800">{visit.patient_full_name}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {visit.patient_details?.gender && (
                                <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">
                                  {visit.patient_details.gender}
                                </span>
                              )}
                              {visit.patient_details?.last_5_visit_dates?.length > 0 && (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                                  Last: {visit.patient_details.last_5_visit_dates[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <StatusBadge status={visit.status} size="md" />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {visit.queue_name || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top text-xs">
                          <div className="space-y-1 text-slate-500">
                            <TimeStamp date={visit.created_at} format="time" prefix="Arrived" />
                            <TimeStamp date={visit.updated_at} format="time" prefix="Updated" />
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="space-y-2">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200">
                              <span
                                className="block h-full rounded-full bg-gradient-to-r from-indigo-300 via-indigo-500 to-emerald-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400">{progress}% complete</p>
                          </div>
                        </td>
                        <td className="rounded-r-3xl px-6 py-4 align-top">
                          <div className="flex flex-col items-end gap-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              {renderActionButtons(visit)}
                            </div>
                            <div className="flex flex-col items-end gap-2 text-xs">
                              <label className="flex cursor-pointer flex-col items-end gap-2 text-indigo-600">
                                <span className="rounded-full border border-dashed border-indigo-300 px-3 py-1">
                                  Attach prescription
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(visit.id, e.target.files?.[0] ?? null)}
                                />
                              </label>
                              <button
                                type="button"
                                disabled={!uploadStates[visit.id]?.file || uploadStates[visit.id]?.uploading}
                                onClick={() => handleUpload(visit.id)}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                <span aria-hidden="true">⬆</span>
                                {uploadStates[visit.id]?.uploading ? 'Uploading…' : 'Upload'}
                              </button>
                              {uploadStates[visit.id]?.error && (
                                <span className="text-xs font-medium text-rose-500">
                                  {uploadStates[visit.id].error}
                                </span>
                              )}
                              {visit.prescription_images.length > 0 && (
                                <div className="flex flex-wrap justify-end gap-2">
                                  {visit.prescription_images.map((img) => (
                                    <a
                                      key={img.id}
                                      href={img.image_url}
                                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      View Rx
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
};

export default DoctorPage;
