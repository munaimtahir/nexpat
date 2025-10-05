import PropTypes from 'prop-types';
import { cn } from '../../utils/cn.js';

const EmptyIllustration = () => (
  <svg
    viewBox="0 0 200 120"
    role="img"
    aria-hidden="true"
    className="h-24 w-full max-w-[240px] fill-none stroke-2 stroke-indigo-200"
  >
    <path d="M30 90 Q70 30 110 80 T190 70" className="stroke-indigo-300" />
    <circle cx="60" cy="70" r="8" className="fill-indigo-100 stroke-indigo-200" />
    <rect x="120" y="55" width="36" height="26" rx="6" className="fill-white stroke-indigo-200" />
    <path d="M128 64 L144 64" className="stroke-indigo-200" />
    <path d="M128 72 L150 72" className="stroke-indigo-200" />
  </svg>
);

const EmptyState = ({ title, description, action, className }) => (
  <div className={cn('flex flex-col items-center rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/60 p-8 text-center shadow-inner', className)}>
    <EmptyIllustration />
    <h2 className="mt-4 text-lg font-semibold text-indigo-800">{title}</h2>
    <p className="mt-2 max-w-md text-sm text-indigo-600">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  className: PropTypes.string,
};

EmptyState.defaultProps = {
  description: '',
  action: null,
  className: '',
};

export default EmptyState;
