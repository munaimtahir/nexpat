import PropTypes from 'prop-types';
import { cn } from '../../utils/cn.js';

const LoadingSpinner = ({ label, className }) => (
  <div className={cn('flex items-center gap-2 text-sm text-slate-500', className)} role="status">
    <span className="inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    {label && <span>{label}</span>}
  </div>
);

LoadingSpinner.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  label: '',
  className: '',
};

export default LoadingSpinner;
