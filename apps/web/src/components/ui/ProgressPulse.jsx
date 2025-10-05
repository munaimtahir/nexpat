import PropTypes from 'prop-types';
import { cn } from '../../utils/cn.js';

const ProgressPulse = ({ active, className }) => (
  <div
    className={cn(
      'h-1 overflow-hidden rounded-full bg-slate-200',
      className,
      active ? 'relative' : 'opacity-0',
    )}
    aria-hidden={!active}
  >
    <span
      className={cn(
        'absolute inset-y-0 w-1/3 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-300',
        !active && 'hidden',
      )}
    />
  </div>
);

ProgressPulse.propTypes = {
  active: PropTypes.bool,
  className: PropTypes.string,
};

ProgressPulse.defaultProps = {
  active: false,
  className: '',
};

export default ProgressPulse;
