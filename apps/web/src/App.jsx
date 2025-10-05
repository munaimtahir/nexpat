import { useMemo } from 'react';
import { Routes, Route, Link, useSearchParams } from 'react-router-dom';
import AssistantPage from './pages/AssistantPage.jsx';
import DoctorPage from './pages/DoctorPage.jsx';
import PublicDisplayPage from './pages/PublicDisplayPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import PatientFormPage from './pages/PatientFormPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import RegistrationFormatSettingsPage from './pages/RegistrationFormatSettingsPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './AuthContext.jsx';
import './App.css';

const HomePage = () => {
  const { roles, username, logout } = useAuth();
  const normalizedRoles = useMemo(
    () => roles.map((role) => role.toLowerCase()),
    [roles],
  );

  const hasAnyRole = normalizedRoles.length > 0;

  const roleLinks = [
    { to: '/assistant', label: 'Assistant Portal', role: 'assistant' },
    { to: '/doctor', label: 'Doctor Dashboard', role: 'doctor' },
    { to: '/display', label: 'Public Queue Display', role: 'display' },
    { to: '/patients', label: 'Manage Patients', role: ['assistant', 'doctor'] },
    { to: '/settings/registration-format', label: 'Registration Format Settings', role: 'doctor' },
  ];

  const linkIsVisible = (requiredRole) => {
    if (!requiredRole) {
      return true;
    }

    const targets = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return targets.some((target) => normalizedRoles.includes(target));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ClinicQ</h1>
          <p className="text-gray-600">Outpatient queue management made simple.</p>
        </div>
        <div className="text-right">
          {username ? (
            <>
              <p className="text-sm text-gray-600">Signed in as {username}</p>
              <button
                type="button"
                onClick={logout}
                className="mt-2 rounded-md border border-red-500 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      {!hasAnyRole && (
        <p className="mb-6 rounded-md bg-blue-50 p-4 text-sm text-blue-700">
          Sign in with your clinic account to access the queue management tools.
        </p>
      )}

      <nav>
        <ul className="space-y-3">
          {roleLinks
            .filter(({ role }) => linkIsVisible(role))
            .map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-blue-600 hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          {!username && (
            <li>
              <Link to="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};

const PublicDisplayRoute = () => {
  const [searchParams] = useSearchParams();
  const queue = searchParams.get('queue') || '';
  return <PublicDisplayPage initialQueue={queue} />;
};

const App = () => (
  <div className="min-h-screen bg-gray-100">
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/assistant"
        element={(
          <ProtectedRoute requiredRoles={['assistant']}>
            <AssistantPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/doctor"
        element={(
          <ProtectedRoute requiredRoles={['doctor']}>
            <DoctorPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/display"
        element={(
          <ProtectedRoute requiredRoles={['display', 'doctor']}>
            <PublicDisplayRoute />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/patients"
        element={(
          <ProtectedRoute requiredRoles={['assistant', 'doctor']}>
            <PatientsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/patients/new"
        element={(
          <ProtectedRoute requiredRoles={['assistant', 'doctor']}>
            <PatientFormPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/patients/:registration_number/edit"
        element={(
          <ProtectedRoute requiredRoles={['assistant', 'doctor']}>
            <PatientFormPage />
          </ProtectedRoute>
        )}
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/settings/registration-format"
        element={(
          <ProtectedRoute requiredRoles={['doctor']}>
            <RegistrationFormatSettingsPage />
          </ProtectedRoute>
        )}
      />
    </Routes>
  </div>
);

export default App;
