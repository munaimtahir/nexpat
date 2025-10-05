import PropTypes from 'prop-types';
import { cn } from '../../utils/cn.js';

const KPIChip = ({ label, value, tone }) => (
  <div
    className={cn(
      'min-w-[8rem] rounded-2xl border px-3 py-2 shadow-sm transition hover:shadow-md',
      {
        'border-emerald-300 bg-emerald-50 text-emerald-700': tone === 'positive',
        'border-amber-300 bg-amber-50 text-amber-700': tone === 'caution',
        'border-indigo-300 bg-indigo-50 text-indigo-700': tone === 'info',
        'border-rose-300 bg-rose-50 text-rose-700': tone === 'critical',
      },
    )}
  >
    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

KPIChip.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['positive', 'caution', 'info', 'critical']),
};

KPIChip.defaultProps = {
  tone: 'info',
};

export default KPIChip;
