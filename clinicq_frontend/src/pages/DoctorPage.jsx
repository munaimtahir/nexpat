import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

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
      const response = await api.get(`/api/visits/?status=WAITING,START,IN_ROOM${queueParam}`);
      const fetchedVisits = response.data || [];

      const registrationNumbers = [
        ...new Set(fetchedVisits.map((v) => v.patient_registration_number)),
      ];
      let patientsByRegNum = {};

      if (registrationNumbers.length > 0) {
        // This logic can be simplified if the backend provides patient details directly
        const patientsResp = await api.get(
          `/api/patients/?registration_numbers=${registrationNumbers.join(',')}`
        );
        patientsByRegNum = (patientsResp.data || []).reduce((acc, patient) => {
          acc[patient.registration_number] = patient;
          return acc;
        }, {});
      }

      const detailedVisits = fetchedVisits.map((visit) => ({
        ...visit,
        patient_details: patientsByRegNum[visit.patient_registration_number] || null,
      }));

      let withImages = detailedVisits;
      if (import.meta.env.MODE !== 'test') {
        withImages = await Promise.all(
          detailedVisits.map(async (v) => {
            try {
              const imgResp = await api.get(`/api/prescriptions/?visit=${v.id}`);
              return { ...v, prescription_images: imgResp.data || [] };
            } catch {
              return { ...v, prescription_images: [] };
            }
          })
        );
      }

      setVisits(withImages);
    } catch (err) {
      console.error("Error fetching visits:", err);
      setError('Failed to fetch visits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedQueue]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    const fetchQueues = async () => {
      try {
        const response = await api.get('/api/queues/');
        setQueues(response.data || []);
      } catch (err) {
        console.error('Error fetching queues:', err);
      }
    };
    fetchQueues();
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleUpdateVisitStatus = async (visitId, action) => {
    try {
      await api.patch(`/api/visits/${visitId}/${action}/`);
      fetchVisits(); // Refetch to get the latest state
    } catch (err) {
      console.error(`Error during action ${action} for visit ${visitId}:`, err);
      setError(`Failed to perform action. ${err.response?.data?.detail || ''}`);
    }
  };

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
      await api.post('/api/prescriptions/', form);
      const imgResp = await api.get(`/api/prescriptions/?visit=${visitId}`);
      setVisits((prev) =>
        prev.map((v) =>
          v.id === visitId
            ? { ...v, prescription_images: imgResp.data || [] }
            : v
        )
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

  const renderActionButtons = (visit) => {
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
  };

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
      {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      {!isLoading && visits.length === 0 && !error && (
        <p className="text-center text-gray-600 py-4">No active patients.</p>
      )}

      {visits.length > 0 && (
        <div className="space-y-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className={`p-4 border rounded-lg shadow-sm flex justify-between items-center ${
                visit.status === 'IN_ROOM' ? 'bg-purple-50 border-purple-300' :
                visit.status === 'START' ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
              }`}
            >
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  Token: {visit.token_number}{' '}
                  <span className="text-lg font-medium text-gray-600">({visit.status})</span>
                  {visit.queue_name && (
                    <span className="text-base text-gray-500"> - {visit.queue_name}</span>
                  )}
                </p>
                <p className="text-gray-700">Patient: {visit.patient_full_name}</p>
                <p className="text-sm text-gray-500">Gender: {visit.patient_details?.gender}</p>
                <p className="text-xs text-gray-500">
                  Last Visits:{' '}
                  {visit.patient_details?.last_5_visit_dates?.length > 0
                    ? visit.patient_details.last_5_visit_dates.join(', ')
                    : 'None'}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {renderActionButtons(visit)}
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
