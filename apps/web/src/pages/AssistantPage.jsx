import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { firstFromListResponse } from '../utils/api.js';

const AssistantPage = () => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [patientInfo, setPatientInfo] = useState(null);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await api.get('/queues/');
        setQueues(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching queues:', err);
        setError('Failed to load queues.');
      }
    };
    fetchQueues();
  }, []);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!registrationNumber.trim()) {
        setPatientInfo(null);
        return;
      }
      try {
        const searchResp = await api.get(
          `/patients/search/?q=${encodeURIComponent(registrationNumber.trim())}`,
        );

        const firstMatch = firstFromListResponse(searchResp.data);
        if (!firstMatch?.registration_number) {
          setPatientInfo(null);
          return;
        }

        const detailResp = await api.get(`/patients/${firstMatch.registration_number}/`);
        setPatientInfo(detailResp.data);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setPatientInfo(null);
      }
    };
    const handler = setTimeout(() => {
      fetchPatient();
    }, 500);
    return () => clearTimeout(handler);
  }, [registrationNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGeneratedToken(null);

    if (!registrationNumber.trim()) {
      setError('Registration number cannot be empty.');
      return;
    }
    if (!selectedQueue) {
      setError('Please select a queue.');
      return;
    }

    setIsLoading(true);
    if (!patientInfo) {
      setError('Patient not found.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/visits/', {
        patient: patientInfo.registration_number,
        queue: selectedQueue,
      });

      const tokenValue = response?.data?.token_number;
      if (typeof tokenValue === 'number' || (typeof tokenValue === 'string' && tokenValue.trim() !== '')) {
        setGeneratedToken(tokenValue);
      } else {
        console.error('Received invalid token_number:', tokenValue);
        setGeneratedToken('N/A');
        setError('Received invalid token format from server.');
      }

      setRegistrationNumber('');
      setSelectedQueue('');
      setPatientInfo(null);
    } catch (err) {
      console.error('Error creating visit:', err);
      if (err.response?.data) {
        const serverErrors = err.response.data;
        const messages = Object.keys(serverErrors).map((key) => {
          const value = serverErrors[key];
          return `${key}: ${Array.isArray(value) ? value.join(', ') : value}`;
        });
        setError(`Failed to generate token: ${messages.join('; ')}`);
      } else {
        setError('Failed to generate token. Please check the console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md bg-white shadow-md rounded-lg mt-10">
      <Link to="/" className="text-blue-500 hover:underline mb-4 block">
        &larr; Back to Home
      </Link>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">
        Assistant Portal
      </h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="registrationNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Registration Number
          </label>
          <input
            type="text"
            id="registrationNumber"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="queueSelect" className="block text-sm font-medium text-gray-700">
            Queue
          </label>
          <select
            id="queueSelect"
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select a queue</option>
            {queues.map((queue) => (
              <option key={queue.id} value={queue.id}>
                {queue.name}
              </option>
            ))}
          </select>
        </div>

        {patientInfo && (
          <div className="text-sm text-gray-600">
            <div>
              Patient: {patientInfo.name} ({patientInfo.gender})
            </div>
            {Array.isArray(patientInfo.last_5_visit_dates) && patientInfo.last_5_visit_dates.length > 0 && (
              <div>
                Last Visits: {patientInfo.last_5_visit_dates.join(', ')}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {isLoading ? 'Generating...' : 'Generate Token'}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-red-500 text-sm bg-red-100 p-3 rounded-md" role="alert">{error}</p>
      )}

      {generatedToken !== null && (
        <div className="mt-6 p-4 bg-green-100 rounded-md text-center">
          <p className="text-lg font-semibold text-green-700">
            Token Generated Successfully!
          </p>
          <p className="text-4xl font-bold text-green-800 my-2">
            {generatedToken}
          </p>
        </div>
      )}
    </div>
  );
};

export default AssistantPage;
