import { useEffect, useMemo, useState } from 'react';
import api from '../api.js';
import { firstFromListResponse } from '../utils/api.js';
import useRegistrationFormat from '../hooks/useRegistrationFormat.js';
import { buildExampleFromFormat } from '../utils/registrationFormat.js';
import { WorkspaceLayout, TextField, SelectField, ProgressPulse } from '../components/index.js';

const AssistantPage = () => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [patientInfo, setPatientInfo] = useState(null);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [issuedCount, setIssuedCount] = useState(0);
  const { format } = useRegistrationFormat();
  const formatExample = useMemo(() => buildExampleFromFormat(format), [format]);
  const registrationPattern = useMemo(() => {
    if (!format?.pattern) return null;
    try {
      return new RegExp(format.pattern);
    } catch (err) {
      console.error('Invalid registration pattern from server:', err);
      return null;
    }
  }, [format?.pattern]);

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
    let active = true;
    if (!registrationNumber.trim()) {
      setPatientInfo(null);
      setIsSearching(false);
      return () => {};
    }

    setIsSearching(true);

    const handler = setTimeout(async () => {
      try {
        const searchResp = await api.get(
          `/patients/search/?q=${encodeURIComponent(registrationNumber.trim())}`,
        );

        if (!active) return;

        const firstMatch = firstFromListResponse(searchResp.data);
        if (!firstMatch?.registration_number) {
          setPatientInfo(null);
          return;
        }

        const detailResp = await api.get(`/patients/${firstMatch.registration_number}/`);
        if (active) {
          setPatientInfo(detailResp.data);
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
        if (active) {
          setPatientInfo(null);
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [registrationNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGeneratedToken(null);

    const normalizedNumber = registrationNumber.trim();
    if (!normalizedNumber) {
      setError('Registration number cannot be empty.');
      return;
    }
    if (registrationPattern && !registrationPattern.test(normalizedNumber)) {
      setError('Registration number must match the configured format.');
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
      setIssuedCount((prev) => prev + 1);
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

  const queueLoadTone = useMemo(() => {
    if (queues.length === 0) return 'caution';
    if (queues.length > 4) return 'positive';
    if (queues.length > 2) return 'info';
    return 'caution';
  }, [queues.length]);

  const kpis = [
    { label: 'Active queues', value: queues.length || '—', tone: queueLoadTone },
    { label: 'Token issued now', value: generatedToken ?? '—', tone: generatedToken ? 'positive' : 'info' },
    { label: 'Tokens today', value: issuedCount, tone: issuedCount > 5 ? 'positive' : 'info' },
    {
      label: 'Patient lookup',
      value: isSearching ? 'Searching…' : patientInfo?.name ?? 'Awaiting input',
      tone: patientInfo ? 'positive' : 'caution',
    },
  ];

  return (
    <WorkspaceLayout
      title="Assistant Portal"
      subtitle="Generate visit tokens, find patients instantly, and keep queues flowing."
      breadcrumbs={[
        { label: 'Home', to: '/' },
        { label: 'Assistant Portal' },
      ]}
      kpis={kpis}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-3xl bg-gradient-to-br from-white via-white to-indigo-50/50 p-6 shadow-inner"
      >
        <ProgressPulse active={isLoading} />
        <TextField
          label="Registration number"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          autoComplete="off"
          description={
            formatExample
              ? `Expected format similar to ${formatExample}`
              : 'Enter the patient registration number.'
          }
          trailingNode={format?.pattern ? <span className="text-[0.65rem] text-slate-400">{format.pattern}</span> : null}
        />
        <SelectField
          label="Queue destination"
          value={selectedQueue}
          onChange={(e) => setSelectedQueue(e.target.value)}
          description="Only active queues appear in this list."
        >
          <option value="">Select a queue</option>
          {queues.map((queue) => (
            <option key={queue.id} value={queue.id}>
              {queue.name}
            </option>
          ))}
        </SelectField>

        <button
          type="submit"
          disabled={isLoading || !registrationNumber.trim() || !selectedQueue}
          className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isLoading ? 'Generating token…' : 'Generate token'}
        </button>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Patient preview</h2>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                patientInfo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {patientInfo ? 'Matched' : isSearching ? 'Searching…' : 'Awaiting'}
            </span>
          </div>
          {patientInfo ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="text-base font-semibold text-slate-800">{patientInfo.name}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">
                  {patientInfo.gender}
                </span>
                {patientInfo.phone && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                    📞 {patientInfo.phone}
                  </span>
                )}
              </div>
              {Array.isArray(patientInfo.last_5_visit_dates) && patientInfo.last_5_visit_dates.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent visits</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {patientInfo.last_5_visit_dates.slice(0, 3).map((date) => (
                      <span
                        key={date}
                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No historical visits on record.</p>
              )}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">
              Enter a registration number to preview patient context and last visit history.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-500/10 via-white to-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Token status</h2>
          <p className="mt-1 text-xs text-slate-500">
            Tokens animate across the queue when generated. Keep the assistant screen visible for confirmation.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/70 p-6 shadow-inner">
            {generatedToken !== null ? (
              <>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                  Token issued
                </span>
                <p className="text-5xl font-black text-indigo-600">{generatedToken}</p>
              </>
            ) : (
              <>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Waiting</span>
                <p className="text-sm text-center text-slate-500">
                  Generate a token to broadcast it to the live queue display and clinician dashboards.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
};

export default AssistantPage;
