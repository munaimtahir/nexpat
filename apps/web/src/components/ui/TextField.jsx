import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn.js';

const TextField = forwardRef(function TextField(
  { label, description, error, leadingIcon, trailingNode, className, inputClassName, ...props },
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
        <input
          ref={ref}
          id={fieldId}
          placeholder=" "
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy.join(' ') || undefined}
          className={cn(
            'peer w-full rounded-2xl border border-slate-200 bg-white/90 px-4 pb-2 pt-5 text-sm font-medium text-slate-700 shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
            leadingIcon && 'pl-11',
            error && 'border-red-400 text-red-600 focus:border-red-500 focus:ring-red-100',
            inputClassName,
          )}
          {...props}
        />
        <label
          htmlFor={fieldId}
          className={cn(
            'pointer-events-none absolute left-4 top-3 origin-left text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-[0.83rem] peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-[0.7rem] peer-focus:text-indigo-600',
            leadingIcon && 'left-11',
          )}
        >
          {label}
        </label>
        {trailingNode && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailingNode}</div>
        )}
        <span className="pointer-events-none absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent opacity-0 transition-opacity duration-200 peer-focus:opacity-100" />
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

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  error: PropTypes.string,
  leadingIcon: PropTypes.node,
  trailingNode: PropTypes.node,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
};

TextField.defaultProps = {
  description: '',
  error: '',
  leadingIcon: null,
  trailingNode: null,
  className: '',
  inputClassName: '',
};

export default TextField;
