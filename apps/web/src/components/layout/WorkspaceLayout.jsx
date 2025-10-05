import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import Breadcrumbs from '../ui/Breadcrumbs.jsx';
import KPIChip from '../ui/KPIChip.jsx';
import { cn } from '../../utils/cn.js';

const navItems = [
  {
    label: 'Assistant',
    description: 'Queue intake, token creation',
    to: '/assistant',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M4 7c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v10l-5-3-3 2-3-2-5 3z"
          fill="currentColor"
          opacity="0.8"
        />
      </svg>
    ),
  },
  {
    label: 'Doctor',
    description: 'Consultations & prescriptions',
    to: '/doctor',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M6 4h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2zm6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
          fill="currentColor"
          opacity="0.8"
        />
      </svg>
    ),
  },
  {
    label: 'Patients',
    description: 'Records & follow-ups',
    to: '/patients',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z"
          fill="currentColor"
          opacity="0.8"
        />
      </svg>
    ),
  },
];

const WorkspaceLayout = ({ title, subtitle, breadcrumbs, kpis, actions, children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6 lg:flex-row">
        <aside className="w-full rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg backdrop-blur lg:w-72">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
              ClinicQ Workspaces
            </p>
            <p className="text-lg font-bold text-slate-800">Navigate care teams</p>
          </div>
          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'group flex flex-col gap-1 rounded-2xl border px-4 py-3 transition',
                    isActive
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-700 shadow-lg shadow-indigo-200'
                      : 'border-transparent bg-white/60 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className={cn('text-indigo-500 transition group-hover:scale-110', isActive && 'text-indigo-600')}>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <span className="text-xs text-slate-500">{item.description}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 space-y-6">
          <header className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <Breadcrumbs items={breadcrumbs} />
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                  {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
                </div>
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
            {kpis?.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((item) => (
                  <KPIChip key={item.label} {...item} />
                ))}
              </div>
            )}
          </header>

          <section className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl shadow-indigo-50/40">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
};

WorkspaceLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
    }),
  ),
  kpis: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      tone: PropTypes.oneOf(['positive', 'caution', 'info', 'critical']),
    }),
  ),
  actions: PropTypes.node,
  children: PropTypes.node,
};

WorkspaceLayout.defaultProps = {
  subtitle: '',
  breadcrumbs: [],
  kpis: [],
  actions: null,
  children: null,
};

export default WorkspaceLayout;
