import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchPatients = async (term = '') => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/patients/';
      if (term.trim()) {
        url = `/api/patients/search/?q=${encodeURIComponent(term.trim())}`;
      }
      const response = await api.get(url);
      setPatients(response.data);
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
      await api.delete(`/api/patients/${regNum}/`);
      setPatients((prev) => prev.filter((p) => p.registration_number !== regNum));
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
      <div className="flex justify-between items-center mt-4">
        <h1 className="text-2xl font-bold">Patients</h1>
        <button
          onClick={() => navigate('/patients/new')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Patient
        </button>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex space-x-2">
        <input
          type="text"
          placeholder="Search by name, phone, or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow border border-gray-300 rounded px-3 py-2"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Search</button>
      </form>

      {loading ? (
        <p className="mt-4">Loading...</p>
      ) : error ? (
        <p className="mt-4 text-red-600">{error}</p>
      ) : (
        <table className="min-w-full mt-6 bg-white shadow-md rounded">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Reg. No.</th>
              <th className="p-2">Name</th>
              <th className="p-2">Gender</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.registration_number} className="border-t">
                <td className="p-2">{p.registration_number}</td>
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.gender}</td>
                <td className="p-2">{p.phone || '-'}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => navigate(`/patients/${p.registration_number}/edit`)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.registration_number)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PatientsPage;