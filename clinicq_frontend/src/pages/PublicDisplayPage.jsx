import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const REFRESH_INTERVAL = 5000; // 5 seconds

const PublicDisplayPage = ({ initialQueue = '' }) => {
  const [inRoomVisits, setInRoomVisits] = useState([]);
  const [waitingVisits, setWaitingVisits] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(initialQueue);

  const fetchVisits = useCallback(
    async (isInitialLoad = false) => {
      if (isInitialLoad) setIsLoading(true);
      setError('');
      try {
        const queueParam = selectedQueue ? `&queue=${selectedQueue}` : '';
        const response = await api.get(`/api/visits/?status=WAITING,IN_ROOM${queueParam}`);
        const allVisits = response.data || [];

        setInRoomVisits(allVisits.filter(v => v.status === 'IN_ROOM'));
        setWaitingVisits(allVisits.filter(v => v.status === 'WAITING'));

      } catch (err) {
        console.error("Error fetching visits:", err);
        setError('Failed to fetch queue. Retrying...');
        if (isInitialLoad) {
          setInRoomVisits([]);
          setWaitingVisits([]);
        }
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
    fetchVisits(true); // Initial fetch

    const intervalId = setInterval(() => {
      fetchVisits(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchVisits]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Clinic Queue Display</h1>
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

      {isLoading && <p className="text-center text-xl text-gray-500 py-10">Loading queue...</p>}
      {error && <p className="text-center text-red-600 bg-red-100 p-4 rounded-md shadow text-lg mb-4">{error}</p>}

      {/* In Room Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-purple-700 mb-4">In Consultation Room</h2>
        {inRoomVisits.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {inRoomVisits.map((visit) => (
              <div
                key={visit.id}
                className="p-4 sm:p-6 rounded-lg shadow-lg bg-purple-600 text-white transform scale-105"
              >
                <div className="flex justify-between items-baseline">
                  <p className="text-3xl sm:text-4xl font-extrabold text-yellow-300">
                    {visit.token_number}
                  </p>
                  <p className="text-sm sm:text-base font-medium text-purple-100">
                    {visit.patient_full_name}
                  </p>
                </div>
                <p className="mt-1 text-sm text-center text-purple-200 animate-pulse">
                  Please proceed to the consultation room.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No patient is currently in the room.</p>
        )}
      </div>

      {/* Waiting Section */}
      <div>
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Waiting Patients</h2>
        {waitingVisits.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {waitingVisits.map((visit) => (
              <div
                key={visit.id}
                className="p-4 sm:p-6 rounded-lg shadow-lg bg-white text-gray-700 hover:shadow-xl"
              >
                <div className="flex justify-between items-baseline">
                  <p className="text-3xl sm:text-4xl font-extrabold text-blue-500">
                    {visit.token_number}
                  </p>
                  <p className="text-sm sm:text-base font-medium text-gray-500">
                    {visit.patient_full_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">The waiting queue is empty.</p>
        )}
      </div>
    </div>
  );
};

export default PublicDisplayPage;
