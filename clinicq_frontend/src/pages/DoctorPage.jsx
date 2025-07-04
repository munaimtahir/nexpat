import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DoctorPage = () => {
  const [waitingVisits, setWaitingVisits] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchWaitingVisits = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/visits/?status=WAITING');
      setWaitingVisits(response.data || []); // Ensure response.data is not undefined
    } catch (err) {
      console.error("Error fetching waiting visits:", err);
      setError('Failed to fetch waiting visits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaitingVisits();
  }, [fetchWaitingVisits]);

  const handleMarkDone = async (visitId) => {
    try {
      await axios.patch(`/api/visits/${visitId}/done/`);
      // Refresh the list after marking done
      fetchWaitingVisits();
    } catch (err) {
      console.error("Error marking visit as done:", err);
      setError(`Failed to mark token as done. ${err.response?.data?.detail || ''}`);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <Link to="/" className="text-blue-500 hover:underline mb-4 block">&larr; Back to Home</Link>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">Doctor Dashboard</h1>

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
                <p className="text-2xl font-bold text-blue-600">Token: {visit.token_number}</p>
                <p className="text-gray-700">Patient: {visit.patient_name}</p>
                <p className="text-sm text-gray-500">Gender: {visit.patient_gender}</p>
              </div>
              <button
                onClick={() => handleMarkDone(visit.id)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Mark as Done
              </button>
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
