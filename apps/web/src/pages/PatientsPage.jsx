import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { unwrapListResponse } from '../utils/api.js';
import { TimeStamp } from '../components/index.js';
import useRegistrationFormat from '../hooks/useRegistrationFormat.js';
import { buildExampleFromFormat } from '../utils/registrationFormat.js';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { format } = useRegistrationFormat();
  const formatExample = useMemo(() => buildExampleFromFormat(format), [format]);

  const fetchPatients = async (term = '') => {
    setLoading(true);
    setError('');
    try {
      let url = '/patients/';
      if (term.trim()) {
        url = `/patients/search/?q=${encodeURIComponent(term.trim())}`;
      }
      const response = await api.get(url);
      setPatients(unwrapListResponse(response.data));
    } catch (err) {
      console.error('Failed to fetch patients', err);
      setError('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (regNum) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    try {
      await api.delete(`/patients/${regNum}/`);
      setPatients((prev) => prev.filter((patient) => patient.registration_number !== regNum));
    } catch (err) {
      console.error('Delete failed', err);
      setError('Failed to delete patient');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients(searchTerm);
  };

  return (
    <div className="container mx-auto p-6">
      <Link to="/" className="text-blue-500 hover:underline">&larr; Back to Home</Link>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        <h1 className="text-2xl font-bold">Patients</h1>
        <button
          onClick={() => navigate('/patients/new')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Patient
        </button>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder={
            formatExample
              ? `Search by name, phone, or ID (e.g. ${formatExample})`
              : 'Search by name, phone, or ID'
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow border border-gray-300 rounded px-3 py-2"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Search</button>
      </form>

      {loading ? (
        <p className="mt-4">Loading...</p>
      ) : error ? (
        <p className="mt-4 text-red-600" role="alert">{error}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Reg. No.</th>
                <th className="p-2">Name</th>
                <th className="p-2">Gender</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Last Visits</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.registration_number} className="border-t hover:bg-gray-50">
                  <td className="p-2 font-mono text-sm">{patient.registration_number}</td>
                  <td className="p-2 font-medium">{patient.name}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      patient.gender === 'MALE' ? 'bg-blue-100 text-blue-800' :
                      patient.gender === 'FEMALE' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.gender}
                    </span>
                  </td>
                  <td className="p-2 text-sm">{patient.phone || '—'}</td>
                  <td className="p-2 text-xs text-gray-600">
                    {patient.last_5_visit_dates && patient.last_5_visit_dates.length > 0 
                      ? patient.last_5_visit_dates.slice(0, 3).join(', ')
                      : 'None'
                    }
                    {patient.last_5_visit_dates && patient.last_5_visit_dates.length > 3 && '...'}
                  </td>
                  <td className="p-2">
                    <TimeStamp 
                      date={patient.created_at} 
                      format="date" 
                      className="text-xs"
                    />
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => navigate(`/patients/${patient.registration_number}/edit`)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(patient.registration_number)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
