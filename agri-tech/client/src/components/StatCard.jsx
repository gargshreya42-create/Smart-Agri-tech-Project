import { Link } from 'react-router-dom';

export default function StatCard({ icon, tone = 'green', label, value, hint, to }) {
  const content = (
    <>
      <div className={`icon-wrap icon-${tone}`}><i className={`bi ${icon}`} aria-hidden="true" /></div>
      <div className="min-w-0">
        <div className="stat-value text-truncate">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="small text-muted text-truncate">{hint}</div>}
      </div>
    </>
  );
  return to ? (
    <Link to={to} className="card card-hover stat-card">{content}</Link>
  ) : (
    <div className="card stat-card">{content}</div>
  );
}
