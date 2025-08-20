import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const REFRESH_INTERVAL = 5000; // 5 seconds

const PublicDisplayPage = ({ initialQueue = '' }) => {
  const [waitingVisits, setWaitingVisits] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(initialQueue);

  const fetchWaitingVisits = useCallback(
    async (isInitialLoad = false) => {
      if (!isInitialLoad) setIsLoading(true); // Show loading indicator for manual refresh, not for auto-refresh unless it's the first one
      setError('');
      try {
        const queueParam = selectedQueue ? `&queue=${selectedQueue}` : '';
        const response = await api.get(`/api/visits/?status=WAITING${queueParam}`);
        setWaitingVisits(response.data || []);
      } catch (err) {
        console.error("Error fetching waiting visits:", err);
        setError('Failed to fetch queue. Retrying...');
        // Keep existing data on error during auto-refresh, clear if manual or initial
        if (isInitialLoad) setWaitingVisits([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedQueue]
  );

  useEffect(() => {
    setSelectedQueue(initialQueue);
  }, [initialQueue]);

  useEffect(() => {
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
    fetchWaitingVisits(true); // Initial fetch

    const intervalId = setInterval(() => {
      fetchWaitingVisits(false); // Subsequent auto-refreshes
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [fetchWaitingVisits]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Now Serving</h1>
        <Link to="/" className="text-sm text-blue-500 hover:underline hidden sm:block">Admin Home</Link>
      </div>

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

      {isLoading && waitingVisits.length === 0 && (
        <p className="text-center text-xl text-gray-500 py-10">Loading queue...</p>
      )}
      {error && (
        <p className="text-center text-red-600 bg-red-100 p-4 rounded-md shadow text-lg mb-4">{error}</p>
      )}

      {!isLoading && waitingVisits.length === 0 && !error && (
        <div className="text-center py-10">
          <p className="text-2xl text-gray-600">No patients currently waiting.</p>
          <p className="text-gray-400 mt-2">The queue is empty.</p>
        </div>
      )}

      {waitingVisits.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {waitingVisits.map((visit, index) => (
            <div
              key={visit.id}
              className={`p-4 sm:p-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out
                          ${index === 0
                            ? 'bg-blue-600 text-white transform scale-105'
                            : 'bg-white text-gray-700 hover:shadow-xl'}`}
            >
              <div className="flex justify-between items-baseline">
                <p className={`text-3xl sm:text-4xl font-extrabold ${index === 0 ? 'text-yellow-300' : 'text-blue-500'}`}>
                  {visit.token_number}
                  {visit.queue_name && (
                    <span className={`ml-2 text-sm font-normal ${index === 0 ? 'text-blue-100' : 'text-gray-500'}`}>
                      {visit.queue_name}
                    </span>
                  )}
                </p>
                <p className={`text-sm sm:text-base font-medium ${index === 0 ? 'text-blue-100' : 'text-gray-500'}`}>
                  {visit.patient_name}
                </p>
              </div>
              {index === 0 && (
                <p className="mt-1 text-sm text-center text-blue-200 animate-pulse">
                  Please proceed to the consultation room.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
       {waitingVisits.length > 1 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Next in Queue:</h2>
          <div className="space-y-2">
            {waitingVisits.slice(1, 4).map(visit => ( // Show next 3
                 <p key={visit.id} className="text-lg text-gray-600">
                    Token <span className="font-bold">{visit.token_number}</span> - {visit.patient_name}
                    {visit.queue_name && ` (${visit.queue_name})`}
                 </p>
            ))}
            {waitingVisits.length > 4 && <p className="text-sm text-gray-500">and more...</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicDisplayPage;
