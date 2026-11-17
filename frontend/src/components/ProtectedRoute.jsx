import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  if (allowedRoles.length > 0) {
    const role = user?.role || 'CUSTOMER';
    if (!allowedRoles.includes(role)) {
      if (role === 'ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (role === 'EMPLOYEE') {
        return <Navigate to="/employee/dashboard" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
