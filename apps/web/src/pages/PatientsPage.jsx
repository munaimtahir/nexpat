import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { unwrapListResponse } from '../utils/api.js';
import {
  WorkspaceLayout,
  TimeStamp,
  ProgressPulse,
  LoadingSpinner,
  EmptyState,
} from '../components/index.js';
import useRegistrationFormat from '../hooks/useRegistrationFormat.js';
import { buildExampleFromFormat } from '../utils/registrationFormat.js';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
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

  const filteredPatients = useMemo(() => {
    if (genderFilter === 'ALL') return patients;
    return patients.filter((patient) => patient.gender === genderFilter);
  }, [patients, genderFilter]);

  const kpis = [
    { label: 'Records found', value: patients.length, tone: 'info' },
    { label: 'Filter', value: genderFilter === 'ALL' ? 'All genders' : genderFilter, tone: 'caution' },
    {
      label: 'Search term',
      value: searchTerm ? searchTerm : '—',
      tone: searchTerm ? 'positive' : 'info',
    },
    {
      label: 'Recent arrivals',
      value: patients
        .slice(0, 5)
        .filter(
          (patient) => Array.isArray(patient.last_5_visit_dates) && patient.last_5_visit_dates.length > 0,
        ).length,
      tone: 'positive',
    },
  ];

  const genderOptions = [
    { label: 'All', value: 'ALL' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Male', value: 'MALE' },
    { label: 'Other', value: 'OTHER' },
  ];

  return (
    <WorkspaceLayout
      title="Patient Registry"
      subtitle="Search, filter, and maintain longitudinal patient records with confidence."
      breadcrumbs={[
        { label: 'Home', to: '/' },
        { label: 'Patient Registry' },
      ]}
      kpis={kpis}
      actions={
        <button
          type="button"
          onClick={() => navigate('/patients/new')}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-400"
        >
          <span aria-hidden="true">＋</span>
          Add patient
        </button>
      }
    >
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
          className="min-w-[220px] flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {genderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500"
        >
          Search
        </button>
      </form>

      <div className="mt-6 rounded-3xl border border-indigo-100 bg-white shadow-xl">
        <div className="border-b border-indigo-50 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">Patient directory</h2>
            <ProgressPulse active={loading} className="w-40" />
          </div>
          {error && (
            <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="relative max-h-[520px] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner label="Loading patient records…" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No patients match your filters"
                description="Adjust the search criteria or add a new patient record to get started."
                action={
                  <button
                    type="button"
                    onClick={() => navigate('/patients/new')}
                    className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                  >
                    Create patient
                  </button>
                }
              />
            </div>
          ) : (
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead className="sticky top-0 z-10 bg-white/95 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur">
                <tr>
                  <th className="px-6 py-3">Reg. No.</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Recent visits</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr
                    key={patient.registration_number}
                    className={`rounded-3xl ${index % 2 === 0 ? 'bg-slate-50/90' : 'bg-white'} shadow-sm transition hover:bg-indigo-50`}
                  >
                    <td className="rounded-l-3xl px-6 py-4 font-mono text-xs text-slate-500">{patient.registration_number}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{patient.name}</p>
                      <p className="text-xs text-slate-400">{patient.phone ? 'Registered contact' : 'Missing phone number'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          patient.gender === 'MALE'
                            ? 'bg-blue-100 text-blue-700'
                            : patient.gender === 'FEMALE'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {patient.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{patient.phone || '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {patient.last_5_visit_dates && patient.last_5_visit_dates.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {patient.last_5_visit_dates.slice(0, 3).map((date) => (
                            <span key={date} className="inline-flex items-center rounded-full bg-white px-3 py-1 shadow">
                              {date}
                            </span>
                          ))}
                          {patient.last_5_visit_dates.length > 3 && <span className="text-slate-400">…</span>}
                        </div>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-400">No visits</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <TimeStamp date={patient.created_at} format="date" />
                    </td>
                    <td className="rounded-r-3xl px-6 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => navigate(`/patients/${patient.registration_number}/edit`)}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-300"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(patient.registration_number)}
                          className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-400"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
};

export default PatientsPage;
