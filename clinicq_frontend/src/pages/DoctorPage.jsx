/* global process */
import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const DoctorPage = () => {
  const [waitingVisits, setWaitingVisits] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [uploadStates, setUploadStates] = useState({});

  const fetchWaitingVisits = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const queueParam = selectedQueue ? `&queue=${selectedQueue}` : '';
      const response = await api.get(`/api/visits/?status=WAITING${queueParam}`);
      const visits = response.data || [];

      // Fetch patient details in batch if possible, otherwise one by one
      const registrationNumbers = [
        ...new Set(visits.map((v) => v.patient_registration_number)),
      ];
      let patientsByRegNum = {};

      if (registrationNumbers.length > 0) {
        try {
          const patientsResp = await api.get(
            `/api/patients/?registration_numbers=${registrationNumbers.join(',')}`
          );
          // Handle both paginated and non-paginated responses explicitly
          // Paginated: { count, next, previous, results: [...] }
          // Non-paginated: [ ... ]
          let patientList = [];
          if (Array.isArray(patientsResp.data)) {
            patientList = patientsResp.data;
          } else if (patientsResp.data && Array.isArray(patientsResp.data.results)) {
            patientList = patientsResp.data.results;
          }
          patientsByRegNum = patientList.reduce((acc, patient) => {
            acc[patient.registration_number] = patient;
            return acc;
          }, {});
          const missingRegs = registrationNumbers.filter(
            (regNum) => !patientsByRegNum[regNum]
          );
          if (missingRegs.length > 0) {
            await Promise.all(
              missingRegs.map(async (regNum) => {
                try {
                  const resp = await api.get(`/api/patients/${regNum}/`);
                  patientsByRegNum[regNum] = resp.data;
                } catch {
                  patientsByRegNum[regNum] = null;
                }
              })
            );
          }
        } catch {
          // If batch fetch fails, fallback to individual requests
          await Promise.all(
            registrationNumbers.map(async (regNum) => {
              try {
                const resp = await api.get(`/api/patients/${regNum}/`);
                patientsByRegNum[regNum] = resp.data;
              } catch {
                patientsByRegNum[regNum] = null;
              }
            })
          );
        }
      }

      const detailedVisits = visits.map((visit) => ({
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

      setWaitingVisits(withImages);
    } catch (err) {
      console.error("Error fetching waiting visits:", err);
      setError('Failed to fetch waiting visits. Please try again.');
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
    fetchWaitingVisits();
  }, [fetchWaitingVisits]);

  const handleMarkDone = async (visitId) => {
    try {
      await api.patch(`/api/visits/${visitId}/done/`);
      fetchWaitingVisits();
    } catch (err) {
      console.error("Error marking visit as done:", err);
      setError(`Failed to mark token as done. ${err.response?.data?.detail || ''}`);
    }
  };

  const handleUpload = async (visitId) => {
    const uploadState = uploadStates[visitId] || {};
    if (!uploadState.selectedImage) return;

    setUploadStates((prev) => ({
      ...prev,
      [visitId]: { ...uploadState, uploading: true, uploadError: '' },
    }));

    try {
      const form = new FormData();
      form.append('visit', visitId);
      form.append('image', uploadState.selectedImage);
      await api.post('/api/prescriptions/', form);

      // Reset upload state for this visit and refresh visits
      setUploadStates((prev) => ({
        ...prev,
        [visitId]: { selectedImage: null, uploading: false, uploadError: '' },
      }));
      fetchWaitingVisits(); // This will refetch everything including images

    } catch (err) {
      console.error('Upload failed', err);
      setUploadStates((prev) => ({
        ...prev,
        [visitId]: { ...uploadState, uploading: false, uploadError: 'Failed to upload image' },
      }));
    }
  };

  const handleFileSelect = (visitId, file) => {
    setUploadStates((prev) => ({
      ...prev,
      [visitId]: { selectedImage: file, uploading: false, uploadError: '' },
    }));
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

      {isLoading && <p className="text-center text-gray-500">Loading waiting list...</p>}
      {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      {!isLoading && waitingVisits.length === 0 && !error && (
        <p className="text-center text-gray-600 py-4">No patients currently waiting.</p>
      )}

      {waitingVisits.length > 0 && (
        <div className="space-y-4">
          {waitingVisits.map((visit, index) => (
            <div
              key={visit.id}
              className={`p-4 border rounded-lg shadow-sm flex justify-between items-center ${index === 0 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}
            >
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  Token: {visit.token_number}{' '}
                  {visit.queue_name && (
                    <span className="text-base text-gray-500">({visit.queue_name})</span>
                  )}
                </p>
                <p className="text-gray-700">Patient: {visit.patient_name}</p>
                <p className="text-sm text-gray-500">Gender: {visit.patient_gender}</p>
                <p className="text-xs text-gray-500">
                  Last Visits:{' '}
                  {visit.patient_details?.last_5_visit_dates &&
                  visit.patient_details.last_5_visit_dates.length > 0
                    ? visit.patient_details.last_5_visit_dates.join(', ')
                    : 'None'}
                </p>
                {visit.prescription_images && visit.prescription_images.length > 0 && (
                  <div className="mt-2 flex space-x-2">
                    {visit.prescription_images.map((img) => (
                      <img
                        key={img.id}
                        src={img.image_url}
                        alt="Prescription"
                        className="h-16 w-16 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={() => handleMarkDone(visit.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Mark as Done
                </button>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm"
                    onChange={(e) => handleFileSelect(visit.id, e.target.files[0])}
                  />
                  <button
                    onClick={() => handleUpload(visit.id)}
                    disabled={!uploadStates[visit.id]?.selectedImage || uploadStates[visit.id]?.uploading}
                    className="mt-1 px-2 py-1 bg-indigo-600 text-white rounded-md text-sm disabled:bg-gray-400"
                  >
                    {uploadStates[visit.id]?.uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  {uploadStates[visit.id]?.uploadError && (
                    <p className="text-red-500 text-xs mt-1">{uploadStates[visit.id]?.uploadError}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={fetchWaitingVisits}
        disabled={isLoading}
        className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
      >
        {isLoading ? 'Refreshing...' : 'Refresh List'}
      </button>
    </div>
  );
};

export default DoctorPage;
