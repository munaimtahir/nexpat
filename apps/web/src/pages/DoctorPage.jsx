import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { unwrapListResponse } from '../utils/api.js';
import { StatusBadge, TimeStamp } from '../components/index.js';

const DoctorPage = () => {
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [uploadStates, setUploadStates] = useState({});

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
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Start Consultation
          </button>
        );
      case 'START':
        return (
          <>
            <button
              onClick={() => handleUpdateVisitStatus(visit.id, 'in_room')}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            >
              Move to Room
            </button>
            <button
              onClick={() => handleUpdateVisitStatus(visit.id, 'send_back_to_waiting')}
              className="ml-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
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
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Mark as Done
            </button>
            <button
              onClick={() => handleUpdateVisitStatus(visit.id, 'send_back_to_waiting')}
              className="ml-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
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

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <Link to="/" className="text-blue-500 hover:underline mb-4 block">&larr; Back to Home</Link>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">Doctor Dashboard</h1>

      <div className="mb-4">
        <label htmlFor="queue-select" className="block text-sm font-medium text-gray-700">
          Select Queue
        </label>
        <select
          id="queue-select"
          value={selectedQueue}
          onChange={(e) => setSelectedQueue(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Queues</option>
          {queues.map((queue) => (
            <option key={queue.id} value={queue.id}>
              {queue.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-center text-gray-500">Loading patient list...</p>}
      {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md mb-4" role="alert">{error}</p>}

      {!isLoading && normalizedVisits.length === 0 && !error && (
        <p className="text-center text-gray-600 py-4">No active patients.</p>
      )}

      {normalizedVisits.length > 0 && (
        <div className="space-y-4">
          {normalizedVisits.map((visit) => (
            <div
              key={visit.id}
              className={`p-4 border rounded-lg shadow-sm flex justify-between items-center ${
                visit.status === 'IN_ROOM'
                  ? 'bg-purple-50 border-purple-300'
                  : visit.status === 'START'
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-2xl font-bold text-blue-600">
                    Token: {visit.token_number}
                  </p>
                  <StatusBadge status={visit.status} size="md" />
                  {visit.queue_name && (
                    <span className="text-base text-gray-500">- {visit.queue_name}</span>
                  )}
                </div>
                <p className="text-gray-700">Patient: {visit.patient_full_name}</p>
                <p className="text-sm text-gray-500">Gender: {visit.patient_details?.gender}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <TimeStamp 
                    date={visit.created_at} 
                    format="datetime" 
                    prefix="Created:" 
                    className="text-xs"
                  />
                  <TimeStamp 
                    date={visit.updated_at} 
                    format="datetime" 
                    prefix="Updated:" 
                    className="text-xs"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Last Visits:{' '}
                  {visit.patient_details?.last_5_visit_dates?.length > 0
                    ? visit.patient_details.last_5_visit_dates.join(', ')
                    : 'None'}
                </p>
                {visit.prescription_images.length > 0 && (
                  <div className="mt-2 flex space-x-2">
                    {visit.prescription_images.map((img) => (
                      <a
                        key={img.id}
                        href={img.image_url}
                        className="text-xs text-blue-600 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Prescription
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end space-y-2">
                {renderActionButtons(visit)}
                <input
                  type="file"
                  onChange={(e) => handleFileChange(visit.id, e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                <button
                  type="button"
                  disabled={!uploadStates[visit.id]?.file || uploadStates[visit.id]?.uploading}
                  onClick={() => handleUpload(visit.id)}
                  className="px-3 py-1 bg-indigo-600 text-white rounded disabled:bg-gray-400"
                >
                  {uploadStates[visit.id]?.uploading ? 'Uploading...' : 'Upload Prescription'}
                </button>
                {uploadStates[visit.id]?.error && (
                  <span className="text-xs text-red-500">{uploadStates[visit.id].error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={fetchVisits}
        disabled={isLoading}
        className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
      >
        {isLoading ? 'Refreshing...' : 'Refresh List'}
      </button>
    </div>
  );
};

export default DoctorPage;
