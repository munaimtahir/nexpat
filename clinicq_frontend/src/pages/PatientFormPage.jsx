import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';

const genders = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' }
];

const PatientFormPage = () => {
  const { registration_number } = useParams();
  const isEdit = Boolean(registration_number);
  const navigate = useNavigate();

  // Optionally add age field for completeness (from v2.0 branch)
  const [formData, setFormData] = useState({ name: '', phone: '', gender: 'OTHER', age: '' });
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await axios.get(`/api/patients/${registration_number}/`);
        setFormData({
          name: response.data.name || '',
          phone: response.data.phone || '',
          gender: response.data.gender || 'OTHER',
          age: response.data.age || '',
        });
        const imgResp = await axios.get(`/api/prescriptions/?patient=${registration_number}`);
        setImages(imgResp.data || []);
      } catch (err) {
        console.error('Failed to load patient', err);
        setError('Failed to load patient');
      }
    };
    if (isEdit) {
      fetchPatient();
    }
  }, [isEdit, registration_number]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isEdit) {
        await axios.put(`/api/patients/${registration_number}/`, formData);
      } else {
        await axios.post('/api/patients/', formData);
      }
      navigate('/patients');
    } catch (err) {
      console.error('Save failed', err);
      if (err.response && err.response.data) {
        const messages = Object.entries(err.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
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
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
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
            {genders.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {isEdit ? 'Update' : 'Create'}
        </button>
      </form>
      {isEdit && images.length > 0 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto">
          {images.map((img) => (
            <img
              key={img.id}
              src={img.image_url}
              alt="Prescription"
              className="h-20 w-20 object-cover rounded"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientFormPage;