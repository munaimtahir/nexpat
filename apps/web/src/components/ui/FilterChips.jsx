import PropTypes from 'prop-types';
import { cn } from '../../utils/cn.js';

const FilterChips = ({ options, activeValue, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => {
      const isActive = option.value === activeValue;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full border px-3 py-1 text-sm font-medium transition',
            isActive
              ? 'border-indigo-500 bg-indigo-500 text-white shadow'
              : 'border-slate-200 bg-white/90 text-slate-600 hover:border-indigo-300 hover:text-indigo-500',
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

FilterChips.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  activeValue: PropTypes.string,
  onChange: PropTypes.func,
};

FilterChips.defaultProps = {
  activeValue: '',
  onChange: () => {},
};

export default FilterChips;
