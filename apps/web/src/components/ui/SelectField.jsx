import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn.js';

const SelectField = forwardRef(function SelectField(
  { label, description, error, leadingIcon, children, className, selectClassName, ...props },
  ref,
) {
  const internalId = useId();
  const fieldId = props.id ?? internalId;
  const describedBy = [];
  if (description) describedBy.push(`${fieldId}-description`);
  if (error) describedBy.push(`${fieldId}-error`);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {typeof leadingIcon === 'string' ? (
              <span aria-hidden="true">{leadingIcon}</span>
            ) : (
              leadingIcon
            )}
          </span>
        )}
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy.join(' ') || undefined}
          className={cn(
            'peer w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 px-4 pb-2 pt-5 text-sm font-medium text-slate-700 shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
            leadingIcon && 'pl-11',
            error && 'border-red-400 text-red-600 focus:border-red-500 focus:ring-red-100',
            selectClassName,
          )}
          {...props}
        >
          {children}
        </select>
        <label
          htmlFor={fieldId}
          className={cn(
            'pointer-events-none absolute left-4 top-3 origin-left text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500 transition-all duration-200 peer-focus:top-2 peer-focus:text-[0.7rem] peer-focus:text-indigo-600',
            leadingIcon && 'left-11',
          )}
        >
          {label}
        </label>
        <span className="pointer-events-none absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent opacity-0 transition-opacity duration-200 peer-focus:opacity-100" />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
      </div>
      {description && (
        <p id={`${fieldId}-description`} className="text-xs text-slate-500">
          {description}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  error: PropTypes.string,
  leadingIcon: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  selectClassName: PropTypes.string,
};

SelectField.defaultProps = {
  description: '',
  error: '',
  leadingIcon: null,
  className: '',
  selectClassName: '',
};

export default SelectField;
