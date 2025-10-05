import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn.js';

const Breadcrumbs = ({ items }) => (
  <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500">
    {items.map((item, index) => {
      const isLast = index === items.length - 1;
      return (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          {item.to && !isLast ? (
            <Link to={item.to} className="font-medium text-indigo-600 hover:text-indigo-500">
              {item.label}
            </Link>
          ) : (
            <span className={cn('font-semibold', isLast ? 'text-slate-800' : '')}>{item.label}</span>
          )}
          {!isLast && <span aria-hidden="true" className="text-slate-400">/</span>}
        </span>
      );
    })}
  </nav>
);

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
    }),
  ),
};

Breadcrumbs.defaultProps = {
  items: [],
};

export default Breadcrumbs;
