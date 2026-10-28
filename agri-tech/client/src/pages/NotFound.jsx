import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../components/ProtectedRoute';
import { EmptyState } from '../components/feedback';

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div className="container py-5">
      <EmptyState icon="bi-signpost-split" title="This page could not be found" text="The link may be old or mistyped."
        action={<Link to={user ? homeFor(user) : '/'} className="btn btn-primary">{user ? 'Go to my dashboard' : 'Back to home'}</Link>} />
    </div>
  );
}
