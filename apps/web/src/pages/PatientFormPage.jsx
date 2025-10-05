import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { unwrapListResponse } from '../utils/api.js';
import {
  WorkspaceLayout,
  TextField,
  SelectField,
  ProgressPulse,
  EmptyState,
} from '../components/index.js';

const genders = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const categories = [
  { value: '01', label: 'Self-paying' },
  { value: '02', label: 'Insurance' },
  { value: '03', label: 'Cash' },
  { value: '04', label: 'Free' },
  { value: '05', label: 'Poor' },
];

const defaultFormState = {
  name: '',
  phone: '',
  gender: 'OTHER',
  category: '01',
};

const PatientFormPage = () => {
  const { registration_number: registrationNumberParam } = useParams();
  const isEdit = Boolean(registrationNumberParam);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(defaultFormState);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await api.get(`/patients/${registrationNumberParam}/`);
        setFormData({
          name: response.data?.name || '',
          phone: response.data?.phone || '',
          gender: response.data?.gender || 'OTHER',
          category: response.data?.category || '01',
        });
        const imgResp = await api.get(`/prescriptions/?patient=${registrationNumberParam}`);
        setImages(unwrapListResponse(imgResp.data));
      } catch (err) {
        console.error('Failed to load patient', err);
        setError('Failed to load patient');
      }
    };
    if (isEdit) {
      fetchPatient();
    } else {
      setFormData(defaultFormState);
      setImages([]);
      setFieldErrors({});
    }
  }, [isEdit, registrationNumberParam]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSaving(true);
    try {
      if (isEdit) {
        await api.put(`/patients/${registrationNumberParam}/`, formData);
      } else {
        await api.post('/patients/', formData);
      }
      navigate('/patients');
    } catch (err) {
      console.error('Save failed', err);
      if (err.response?.data) {
        setFieldErrors(err.response.data);
        const messages = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        setError(messages);
      } else {
        setError('Failed to save patient');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const kpis = useMemo(
    () => [
      { label: 'Mode', value: isEdit ? 'Editing record' : 'Creating record', tone: isEdit ? 'info' : 'positive' },
      { label: 'Attachments', value: images.length, tone: images.length > 0 ? 'positive' : 'info' },
      { label: 'Validation', value: error ? 'Errors detected' : 'All clear', tone: error ? 'critical' : 'positive' },
    ],
    [error, images.length, isEdit],
  );

  const resolveFieldError = (field) => {
    const value = fieldErrors[field];
    if (!value) return '';
    if (Array.isArray(value)) return value[0];
    return String(value);
  };

  return (
    <WorkspaceLayout
      title={isEdit ? 'Update patient record' : 'Register new patient'}
      subtitle="Maintain clean patient data with inline validation and quick attachment previews."
      breadcrumbs={[
        { label: 'Home', to: '/' },
        { label: 'Patient Registry', to: '/patients' },
        { label: isEdit ? 'Edit patient' : 'New patient' },
      ]}
      kpis={kpis}
      actions={(
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-700"
        >
          ← Back to list
        </button>
      )}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-indigo-100 bg-white p-6 shadow-inner"
        noValidate
      >
        <ProgressPulse active={isSaving} />
        <TextField
          label="Patient name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          error={resolveFieldError('name')}
          description="Use the patient’s full legal name."
        />
        <TextField
          label="Phone number"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          error={resolveFieldError('phone')}
          description="Optional but recommended for SMS updates."
        />
        <SelectField
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          error={resolveFieldError('gender')}
          description="Choose the option recorded during registration."
        >
          {genders.map((gender) => (
            <option key={gender.value} value={gender.value}>
              {gender.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Patient category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          error={resolveFieldError('category')}
          description="Select the payment category for this patient."
          required
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </SelectField>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? 'Saving…' : isEdit ? 'Update patient' : 'Create patient'}
        </button>
      </form>

      {isEdit && (
        <div className="mt-6 rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Prescription attachments</h2>
          <p className="mt-1 text-xs text-slate-500">
            Review past prescriptions linked to this patient record.
          </p>
          {images.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {images.map((image) => (
                <a
                  key={image.id}
                  href={image.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-slate-50 shadow-sm"
                >
                  <img
                    src={image.image_url}
                    alt="Prescription"
                    className="h-32 w-full object-cover transition duration-200 group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No prescriptions yet"
                description="Uploads from the doctor workspace will appear here automatically."
              />
            </div>
          )}
        </div>
      )}
    </WorkspaceLayout>
  );
};

export default PatientFormPage;
