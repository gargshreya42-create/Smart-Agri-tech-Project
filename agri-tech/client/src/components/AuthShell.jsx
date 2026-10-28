import { Link } from 'react-router-dom';
import Brand from './Brand';
import LanguageSwitcher from './LanguageSwitcher';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <Brand light />
        <div>
          <h2 className="mb-3">Technology designed for farmers.</h2>
          <ul className="list-unstyled d-grid gap-3 fs-5 mb-0">
            {[['bi-cloud-sun', 'Weather you can plan around'], ['bi-layers', 'Soil guidance in plain language'], ['bi-bug', 'Pest alerts before losses happen'], ['bi-person-workspace', 'Experts one request away']].map(([icon, text]) => (
              <li key={text} className="d-flex align-items-center gap-3"><i className={`bi ${icon} fs-3`} style={{ color: 'var(--lime)' }} aria-hidden="true" />{text}</li>
            ))}
          </ul>
        </div>
        <small className="opacity-75">© {new Date().getFullYear()} Smart Agri-Tech</small>
      </aside>
      <main className="auth-form-area">
        <div className="w-100" style={{ maxWidth: '31rem' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Link to="/" className="text-decoration-none fw-bold"><i className="bi bi-arrow-left me-1" aria-hidden="true" />Home</Link>
            <LanguageSwitcher />
          </div>
          <h1 className="h2 mb-1">{title}</h1>
          <p className="text-muted mb-4">{subtitle}</p>
          {children}
          <div className="text-center mt-4">{footer}</div>
        </div>
      </main>
    </div>
  );
}
