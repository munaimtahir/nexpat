import PropTypes from 'prop-types';

const StatusBadge = ({ status, size = 'sm' }) => {
  const getStatusClasses = (status) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide';
    
    switch (status) {
      case 'WAITING':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case 'START':
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
      case 'IN_ROOM':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'DONE':
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'WAITING':
        return '⏳';
      case 'START':
        return '🏁';
      case 'IN_ROOM':
        return '🏥';
      case 'DONE':
        return '✅';
      default:
        return '❓';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'WAITING':
        return 'Waiting';
      case 'START':
        return 'Start';
      case 'IN_ROOM':
        return 'In Room';
      case 'DONE':
        return 'Done';
      default:
        return status;
    }
  };

  const sizeClasses = size === 'lg' 
    ? 'px-3 py-1 text-sm' 
    : size === 'md' 
    ? 'px-2.5 py-0.5 text-xs'
    : 'px-2 py-0.5 text-xs';

  return (
    <span className={`${getStatusClasses(status)} ${sizeClasses}`}>
      <span className="mr-1" aria-hidden="true">{getStatusIcon(status)}</span>
      {getStatusLabel(status)}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default StatusBadge;