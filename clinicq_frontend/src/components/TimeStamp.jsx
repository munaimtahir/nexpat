import PropTypes from 'prop-types';

const TimeStamp = ({ 
  date, 
  format = 'datetime', 
  relative = false, 
  className = '', 
  prefix = '',
  ...props 
}) => {
  if (!date) {
    return <span className={`text-gray-400 ${className}`} {...props}>—</span>;
  }

  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return <span className={`text-gray-400 ${className}`} {...props}>Invalid date</span>;
  }

  const formatDate = (dateObj, format) => {
    const options = {
      date: { year: 'numeric', month: 'short', day: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      },
      full: { 
        weekday: 'short',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }
    };

    return dateObj.toLocaleDateString('en-US', options[format] || options.datetime);
  };

  const getRelativeTime = (dateObj) => {
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateObj, 'date');
  };

  const displayText = relative ? getRelativeTime(dateObj) : formatDate(dateObj, format);
  const fullDateTime = dateObj.toLocaleString();

  return (
    <time 
      dateTime={dateObj.toISOString()} 
      title={fullDateTime}
      className={`text-gray-600 ${className}`}
      {...props}
    >
      {prefix && <span className="mr-1">{prefix}</span>}
      {displayText}
    </time>
  );
};

TimeStamp.propTypes = {
  date: PropTypes.string,
  format: PropTypes.oneOf(['date', 'time', 'datetime', 'full']),
  relative: PropTypes.bool,
  className: PropTypes.string,
  prefix: PropTypes.string
};

export default TimeStamp;