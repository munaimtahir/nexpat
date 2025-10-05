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
import { KPIChip } from './components/index.js';
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

  const accessibleLinks = roleLinks.filter(({ role }) => linkIsVisible(role));

  const heroMetrics = [
    {
      label: 'Active Workspaces',
      value: accessibleLinks.length,
      tone: 'info',
    },
    {
      label: 'Average Wait',
      value: hasAnyRole ? '12 mins' : '—',
      tone: 'caution',
    },
    {
      label: 'Patients Seen Today',
      value: hasAnyRole ? '48' : 'Sign in to view',
      tone: 'positive',
    },
    {
      label: 'Queue Load',
      value: hasAnyRole ? 'Balanced' : 'Unknown',
      tone: hasAnyRole ? 'info' : 'caution',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="relative overflow-hidden pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-slate-900 to-slate-950" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 pt-16 text-white">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em]">
                ClinicQ
              </span>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Orchestrate every patient journey with cinematic clarity.
              </h1>
              <p className="max-w-2xl text-base text-indigo-100">
                Real-time queue orchestration, cross-team visibility, and patient context in a single, elegant control center.
              </p>
              {!hasAnyRole && (
                <p className="text-sm text-indigo-200">
                  Sign in with your clinic account to reveal queue metrics and clinical workspaces tailored to your role.
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-3 text-right">
              {username ? (
                <>
                  <span className="text-sm text-indigo-200">Signed in as</span>
                  <p className="text-lg font-semibold">{username}</p>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-white/20"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-xl shadow-indigo-500/40 transition hover:bg-indigo-100"
                >
                  Launch Control Center
                </Link>
              )}
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {heroMetrics.map((metric) => (
              <KPIChip key={metric.label} {...metric} />
            ))}
          </div>
        </div>
      </div>

      <section className="-mt-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24 pt-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="grid gap-6 sm:grid-cols-2">
              {accessibleLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl transition hover:-translate-y-1 hover:border-indigo-300/60 hover:bg-white/10"
                >
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl transition group-hover:scale-125" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">Workspace</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">{label}</h2>
                    </div>
                    <span className="mt-6 inline-flex items-center text-sm font-medium text-indigo-200 transition group-hover:text-white">
                      Enter workspace
                      <span aria-hidden="true" className="ml-2">→</span>
                    </span>
                  </div>
                </Link>
              ))}
              {!username && (
                <Link
                  to="/login"
                  className="group relative overflow-hidden rounded-3xl border border-dashed border-indigo-300/60 bg-indigo-500/20 p-6 text-white shadow-xl transition hover:-translate-y-1 hover:bg-indigo-500/30"
                >
                  <div className="relative flex h-full flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-100">Get Started</p>
                      <h2 className="mt-3 text-2xl font-semibold">Sign in to unlock roles</h2>
                      <p className="mt-2 text-sm text-indigo-100">
                        Secure login activates assistant, doctor, and patient dashboards tailored to your permissions.
                      </p>
                    </div>
                    <span className="mt-6 inline-flex items-center text-sm font-medium text-indigo-100 transition group-hover:text-white">
                      Continue to login
                      <span aria-hidden="true" className="ml-2">→</span>
                    </span>
                  </div>
                </Link>
              )}
            </div>
            <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-indigo-100 shadow-xl">
              <h3 className="text-lg font-semibold text-white">Live Operations Snapshot</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Queue Load</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Balanced
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Patients waiting</span>
                  <span className="text-base font-semibold text-white">14</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Urgent cases</span>
                  <span className="inline-flex items-center rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200">
                    3 flagged
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Real-time throughput</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-indigo-200/20">
                    <span className="block h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-300 via-indigo-200 to-emerald-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
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
