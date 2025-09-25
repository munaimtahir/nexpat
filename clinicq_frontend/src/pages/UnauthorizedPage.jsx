import { Link, useLocation } from 'react-router-dom';

const UnauthorizedPage = () => {
  const location = useLocation();
  const from = location.state?.from?.pathname;

  return (
    <div className="container mx-auto max-w-xl p-8 text-center">
      <h1 className="text-3xl font-bold text-red-600">Access denied</h1>
      <p className="mt-4 text-gray-700">
        You do not have permission to view this page. Please contact an administrator if you believe this is a mistake.
      </p>
      {from && (
        <p className="mt-2 text-sm text-gray-500">Attempted destination: {from}</p>
      )}
      <div className="mt-6 flex justify-center space-x-4">
        <Link to="/" className="text-blue-600 hover:underline">
          Go to home
        </Link>
        <Link to="/login" className="text-blue-600 hover:underline">
          Log in with a different account
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
