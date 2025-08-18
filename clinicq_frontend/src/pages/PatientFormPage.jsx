import React, { useState, useCallback } from 'react';

const PatientFormPage = () => {
  const [formData, setFormData] = useState({ name: '', age: '' });

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      // Submit form data to your API
      await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      // Reset form or handle response
    },
    [formData]
  );

  return (
    <div>
      <h1>Add Patient</h1>
      <form onSubmit={handleSubmit}>
        {/* Form fields and submit button */}
      </form>
    </div>
  );
};

export default PatientFormPage;
