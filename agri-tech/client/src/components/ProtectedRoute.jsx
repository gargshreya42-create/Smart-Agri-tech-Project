import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './feedback';

// role: 'farmer' | 'admin' — a signed-in user with the wrong role is sent to their own home.
export default function ProtectedRoute({ role }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) return <Spinner className="min-vh-100" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <Outlet />;
}

export const homeFor = (user) => (user && user.role === 'admin' ? '/admin' : '/dashboard');
