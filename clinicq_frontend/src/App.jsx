import React from 'react';
import { Routes, Route, Link, useSearchParams } from 'react-router-dom'; // Removed BrowserRouter as Router
import AssistantPage from './pages/AssistantPage';
import DoctorPage from './pages/DoctorPage'; // Placeholder for now
import PublicDisplayPage from './pages/PublicDisplayPage'; // Placeholder for now
import PatientsPage from './pages/PatientsPage';
import PatientFormPage from './pages/PatientFormPage';
import './App.css'; // Keep or modify as needed

// Placeholder components
const HomePage = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-3xl font-bold mb-4">ClinicQ</h1>
    <nav>
      <ul className="space-y-2">
        <li><Link to="/assistant" className="text-blue-500 hover:underline">Assistant Portal</Link></li>
        <li><Link to="/doctor" className="text-blue-500 hover:underline">Doctor Dashboard</Link></li>
        <li><Link to="/display" className="text-blue-500 hover:underline">Public Queue Display</Link></li>
        <li><Link to="/patients" className="text-blue-500 hover:underline">Manage Patients</Link></li>
      </ul>
    </nav>
  </div>
);

const PublicDisplayRoute = () => {
  const [searchParams] = useSearchParams();
  const queue = searchParams.get('queue') || '';
  return <PublicDisplayPage initialQueue={queue} />;
};


function App() {
  return (
    // <Router> component removed
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/doctor" element={<DoctorPage />} />
        <Route path="/display" element={<PublicDisplayRoute />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/new" element={<PatientFormPage />} />
        <Route path="/patients/:registration_number/edit" element={<PatientFormPage />} />
      </Routes>
    </div>
    // </Router> component removed
  );
}

export default App;
