import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AssistantPage = () => {
  const [patientName, setPatientName] = useState('');
  const [patientGender, setPatientGender] = useState('OTHER'); // Default to 'OTHER'
  const [generatedToken, setGeneratedToken] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGeneratedToken(null);
    setIsLoading(true);

    if (!patientName.trim()) {
      setError('Patient name cannot be empty.');
      setIsLoading(false);
      return;
    }

    try {
      // Note: Adjust API_BASE_URL if your Django server runs elsewhere during development
      const response = await axios.post('/api/visits/', {
        patient_name: patientName,
        patient_gender: patientGender,
      });

      const tokenValue = response.data.token_number;
      if (typeof tokenValue === 'number' || (typeof tokenValue === 'string' && tokenValue.trim() !== '')) {
        setGeneratedToken(tokenValue);
      } else {
        console.error("Received invalid token_number type or empty string:", typeof tokenValue, tokenValue);
        setGeneratedToken('N/A'); // Display a placeholder if token is not valid
        setError('Received invalid token format from server.');
      }

      setPatientName(''); // Clear form
      setPatientGender('OTHER');
    } catch (err) {
      console.error("Error creating visit:", err);
      if (err.response && err.response.data) {
        // Attempt to display server-side error messages
        const serverErrors = err.response.data;
        let messages = [];
        for (const key in serverErrors) {
          messages.push(`${key}: ${serverErrors[key].join ? serverErrors[key].join(', ') : serverErrors[key]}`);
        }
        setError(`Failed to generate token: ${messages.join('; ')}`);
      } else {
        setError('Failed to generate token. Please check the console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md bg-white shadow-md rounded-lg mt-10">
      <Link to="/" className="text-blue-500 hover:underline mb-4 block">&larr; Back to Home</Link>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">Assistant Portal</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">
            Patient Name
          </label>
          <input
            type="text"
            id="patientName"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="patientGender" className="block text-sm font-medium text-gray-700">
            Patient Gender
          </label>
          <select
            id="patientGender"
            value={patientGender}
            onChange={(e) => setPatientGender(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {isLoading ? 'Generating...' : 'Generate Token'}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-red-500 text-sm bg-red-100 p-3 rounded-md">{error}</p>
      )}

      {generatedToken !== null && (
        <div className="mt-6 p-4 bg-green-100 rounded-md text-center">
          <p className="text-lg font-semibold text-green-700">Token Generated Successfully!</p>
          <p className="text-4xl font-bold text-green-800 my-2">{generatedToken}</p>
        </div>
      )}
    </div>
  );
};

export default AssistantPage;
