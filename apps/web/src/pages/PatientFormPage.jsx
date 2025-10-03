import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { unwrapListResponse } from '../utils/api.js';

const genders = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const defaultFormState = {
  name: '',
  phone: '',
  gender: 'OTHER',
};

const PatientFormPage = () => {
  const { registration_number: registrationNumberParam } = useParams();
  const isEdit = Boolean(registrationNumberParam);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(defaultFormState);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await api.get(`/patients/${registrationNumberParam}/`);
        setFormData({
          name: response.data?.name || '',
          phone: response.data?.phone || '',
          gender: response.data?.gender || 'OTHER',
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
    }
  }, [isEdit, registrationNumberParam]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
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
        const messages = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        setError(messages);
      } else {
        setError('Failed to save patient');
      }
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Link to="/patients" className="text-blue-500 hover:underline">&larr; Back to Patients</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">{isEdit ? 'Edit Patient' : 'Add Patient'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {genders.map((gender) => (
              <option key={gender.value} value={gender.value}>{gender.label}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {isEdit ? 'Update' : 'Create'}
        </button>
      </form>
      {isEdit && images.length > 0 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto">
          {images.map((image) => (
            <a
              key={image.id}
              href={image.image_url}
              className="inline-block"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={image.image_url}
                alt="Prescription"
                className="h-20 w-20 object-cover rounded"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientFormPage;
