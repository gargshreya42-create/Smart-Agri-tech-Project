import { Link } from 'react-router-dom';

export default function Brand({ to = '/', light = false }) {
  return (
    <Link to={to} className="d-inline-flex align-items-center gap-2 text-decoration-none">
      <span className="brand-mark"><i className="bi bi-flower2" aria-hidden="true" /></span>
      <span className="display-font fw-bold fs-5" style={{ color: light ? '#fff' : 'var(--leaf-800)' }}>Smart Agri-Tech</span>
    </Link>
  );
}
