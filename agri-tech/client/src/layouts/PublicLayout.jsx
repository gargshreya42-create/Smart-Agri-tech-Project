import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Brand from '../components/Brand';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { homeFor } from '../components/ProtectedRoute';

export default function PublicLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="public-nav">
        <nav className="container d-flex align-items-center justify-content-between py-2" aria-label="Main">
          <Brand />
          <button type="button" className="btn btn-outline-primary d-lg-none" aria-expanded={open} aria-label={t('nav.menu')} onClick={() => setOpen((v) => !v)}>
            <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true" />
          </button>
          <div className={`public-menu ${open ? 'open' : ''}`}>
            <a className="nav-link" href="/#top" onClick={() => setOpen(false)}>{t('nav.home')}</a>
            <a className="nav-link" href="/#features" onClick={() => setOpen(false)}>{t('nav.features')}</a>
            <a className="nav-link" href="/#about" onClick={() => setOpen(false)}>{t('nav.about')}</a>
            <LanguageSwitcher />
            {user ? (
              <Link to={homeFor(user)} className="btn btn-primary">{t('nav.dashboard')}</Link>
            ) : (
              <>
                <NavLink to="/login" className="btn btn-outline-primary">{t('nav.login')}</NavLink>
                <NavLink to="/register" className="btn btn-primary">{t('nav.register')}</NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="footer">
        <div className="container d-flex flex-column flex-md-row justify-content-between gap-3">
          <div>
            <Brand light />
            <p className="small mt-2 mb-0" style={{ maxWidth: '24rem' }}>Technology designed for farmers — weather, soil, pests, supplies and expert advice in one place.</p>
          </div>
          <div className="d-flex gap-4 small">
            <div className="d-grid gap-1"><a href="/#features">{t('nav.features')}</a><a href="/#about">{t('nav.about')}</a><Link to="/credits">Photo credits</Link></div>
            <div className="d-grid gap-1"><Link to="/login">{t('nav.login')}</Link><Link to="/register">{t('nav.register')}</Link></div>
          </div>
        </div>
        <div className="container small mt-4 pt-3 border-top border-secondary-subtle">© {new Date().getFullYear()} Smart Agri-Tech. Soil and crop guidance is advisory, not a laboratory diagnosis.</div>
      </footer>
    </>
  );
}
