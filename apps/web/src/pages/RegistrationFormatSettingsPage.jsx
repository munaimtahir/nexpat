import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import useRegistrationFormat from '../hooks/useRegistrationFormat.js';
import {
  buildExampleFromFormat,
  buildPatternFromFormat,
  computeDigitTotal,
  computeFormattedLength,
} from '../utils/registrationFormat.js';

const normalizeGroups = (groups) =>
  groups.map((value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  });

const formatErrors = (data) => {
  if (!data || typeof data !== 'object') {
    return 'Failed to save registration format.';
  }
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('; ');
};

const RegistrationFormatSettingsPage = () => {
  const { format, loading, refresh, setFormat } = useRegistrationFormat();
  const [digitGroups, setDigitGroups] = useState([2, 2, 3]);
  const [separators, setSeparators] = useState(['-', '-']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!format && !loading) {
      refresh().catch(() => {});
    } else if (format) {
      setDigitGroups(format.digit_groups || [3, 2, 3]);
      if (Array.isArray(format.separators)) {
        setSeparators(format.separators);
      } else {
        setSeparators(Array(Math.max((format.digit_groups || [3, 2, 3]).length - 1, 0)).fill('-'));
      }
    }
  }, [format, loading, refresh]);

  const normalizedGroups = useMemo(() => normalizeGroups(digitGroups), [digitGroups]);
  const workingFormat = useMemo(
    () => ({ digit_groups: normalizedGroups, separators }),
    [normalizedGroups, separators],
  );
  const totalDigits = useMemo(() => computeDigitTotal(workingFormat), [workingFormat]);
  const formattedLength = useMemo(
    () => computeFormattedLength(workingFormat),
    [workingFormat],
  );

  const validationMessages = useMemo(() => {
    const messages = [];
    if (!digitGroups.length) {
      messages.push('At least one digit group is required.');
    }
    if (normalizedGroups.some((value) => value < 1)) {
      messages.push('Each digit group must contain at least one digit.');
    }
    if (totalDigits > 15) {
      messages.push('Total digits cannot exceed 15.');
    }
    if (formattedLength > 24) {
      messages.push('Formatted length (digits plus separators) cannot exceed 24 characters.');
    }
    if (separators.length !== Math.max(digitGroups.length - 1, 0)) {
      messages.push('Separators count must be one less than the number of digit groups.');
    }
    if (separators.some((separator) => typeof separator !== 'string' || separator.trim() === '')) {
      messages.push('Separators must be non-empty.');
    }
    return messages;
  }, [digitGroups.length, formattedLength, normalizedGroups, separators, totalDigits]);

  const example = useMemo(() => buildExampleFromFormat(workingFormat), [workingFormat]);

  const handleGroupChange = (index, value) => {
    setDigitGroups((prev) => {
      const next = [...prev];
      next[index] = value === '' ? '' : Number(value);
      return next;
    });
  };

  const handleSeparatorChange = (index, value) => {
    setSeparators((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddGroup = () => {
    setDigitGroups((prev) => [...prev, 1]);
    setSeparators((prev) => [...prev, prev.length > 0 ? prev[prev.length - 1] : '-']);
  };

  const handleRemoveGroup = (index) => {
    setDigitGroups((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const next = prev.filter((_, idx) => idx !== index);
      setSeparators((prevSeparators) => {
        const updated = [...prevSeparators];
        if (index < updated.length) {
          updated.splice(index, 1);
        } else if (updated.length) {
          updated.pop();
        }
        return updated;
      });
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        digit_groups: normalizedGroups,
        separators: separators.map((separator) => (separator ?? '').trim()),
      };
      const response = await api.put('/settings/registration-format/', payload);
      setFormat(response.data);
      setSuccess('Registration number format updated successfully.');
    } catch (err) {
      console.error('Failed to update registration format', err);
      if (err.response?.data) {
        setError(formatErrors(err.response.data));
      } else {
        setError('Failed to update registration number format.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Link to="/" className="text-blue-500 hover:underline">&larr; Back to Home</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-800">Registration Number Format</h1>
      <p className="mt-2 text-gray-600">
        Configure how patient registration numbers are generated and validated across the clinic. Changes apply immediately
        and existing records will be reformatted automatically when needed.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-800">Digit Groups</h2>
          <p className="text-sm text-gray-500">
            Specify how digits are grouped. You can add or remove groups and control the separator between them.
          </p>

          <div className="mt-4 space-y-4">
            {digitGroups.map((group, index) => (
              <div key={`group-${index}`} className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor={`group-${index}`}>
                    Digits in group {index + 1}
                  </label>
                  <input
                    id={`group-${index}`}
                    type="number"
                    min="1"
                    max="15"
                    value={group}
                    onChange={(event) => handleGroupChange(index, event.target.value)}
                    className="mt-1 w-28 rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {index < digitGroups.length - 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor={`separator-${index}`}>
                      Separator after group {index + 1}
                    </label>
                    <input
                      id={`separator-${index}`}
                      type="text"
                      value={separators[index] ?? ''}
                      onChange={(event) => handleSeparatorChange(index, event.target.value)}
                      placeholder="Separator"
                      maxLength={5}
                      className="mt-1 w-40 rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
                {digitGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(index)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddGroup}
            className="mt-4 rounded border border-indigo-500 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Add digit group
          </button>
        </section>

        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-800">Preview</h2>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600">Example</p>
              <p className="mt-1 rounded bg-gray-100 px-3 py-2 font-mono text-sm">{example || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Regex pattern</p>
              <p className="mt-1 break-all rounded bg-gray-100 px-3 py-2 font-mono text-xs">
                {buildPatternFromFormat(workingFormat)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total digits</p>
              <p className="mt-1 font-semibold text-gray-800">{totalDigits}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Formatted length</p>
              <p className="mt-1 font-semibold text-gray-800">{formattedLength}</p>
            </div>
          </div>
        </section>

        {validationMessages.length > 0 && (
          <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            <p className="font-semibold">Please address the following:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700" role="status">
            {success}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving || validationMessages.length > 0}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {saving ? 'Saving...' : 'Save format'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationFormatSettingsPage;
