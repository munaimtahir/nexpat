import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const location = useLocation();
  const { roles, fetchRoles, isLoading, hasRole } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const ensureRoles = async () => {
      try {
        await fetchRoles();
      } catch (error) {
        // The API interceptor handles redirecting on 401s.
      } finally {
        if (!cancelled) {
          setChecked(true);
        }
      }
    };

    if (!checked) {
      if (roles.length > 0) {
        setChecked(true);
      } else {
        ensureRoles();
      }
    }

    return () => {
      cancelled = true;
    };
  }, [checked, fetchRoles, roles.length]);

  if (!checked || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-600">
        Checking permissions...
      </div>
    );
  }

  if (!roles.length) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    requiredRoles.length > 0 &&
    !requiredRoles.some((role) => hasRole(role))
  ) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
