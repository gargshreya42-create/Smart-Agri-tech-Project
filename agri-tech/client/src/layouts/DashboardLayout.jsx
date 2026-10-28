import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import CartDrawer from '../components/CartDrawer';
import Avatar from '../components/Avatar';

const FARMER_NAV = [
  ['/dashboard', 'bi-speedometer2', 'nav.dashboard'],
  ['/farm', 'bi-geo-alt', 'nav.farm'],
  ['/crops', 'bi-flower2', 'nav.crops'],
  ['/soil', 'bi-layers', 'nav.soil'],
  ['/weather', 'bi-cloud-sun', 'nav.weather'],
  ['/pests', 'bi-bug', 'nav.pests'],
  ['/resources', 'bi-shop', 'nav.resources'],
  ['/orders', 'bi-bag-check', 'nav.orders'],
  ['/experts', 'bi-person-workspace', 'nav.experts'],
  ['/community', 'bi-people', 'nav.community'],
  ['/profile', 'bi-person-circle', 'nav.profile'],
];

const ADMIN_NAV = [
  ['/admin', 'bi-speedometer2', 'nav.dashboard'],
  ['/admin/users', 'bi-people', 'nav.users'],
  ['/admin/farms', 'bi-geo-alt', 'nav.farms'],
  ['/admin/crops', 'bi-flower2', 'nav.crops'],
  ['/admin/resources', 'bi-shop', 'nav.resources'],
  ['/admin/orders', 'bi-bag-check', 'nav.orders'],
  ['/admin/weather', 'bi-cloud-sun', 'nav.weather'],
  ['/admin/pests', 'bi-bug', 'nav.pests'],
  ['/admin/experts', 'bi-person-workspace', 'nav.experts'],
  ['/admin/community', 'bi-chat-square-text', 'nav.community'],
  ['/admin/reports', 'bi-bar-chart-line', 'nav.reports'],
  ['/admin/settings', 'bi-gear', 'nav.settings'],
];

export default function DashboardLayout() {
  const { user, isAdmin, logout } = useAuth();
  const cart = useCart();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = isAdmin ? ADMIN_NAV : FARMER_NAV;

  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  const signOut = async () => {
    await logout();
    toast.info('You have been logged out.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <a href="#main" className="visually-hidden-focusable btn btn-sun position-absolute m-2" style={{ zIndex: 3000 }}>{t('nav.skip')}</a>
      <div className={`sidebar-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <aside className={`sidebar ${isAdmin ? 'admin' : ''} ${menuOpen ? 'open' : ''}`} aria-label="Primary">
        <NavLink to={isAdmin ? '/admin' : '/dashboard'} className="brand">
          <span className="brand-mark"><i className="bi bi-flower2" aria-hidden="true" /></span>
          <span>Smart Agri-Tech</span>
        </NavLink>
        <nav className="nav-scroll">
          {items.map(([to, icon, key]) => (
            <NavLink key={to} to={to} end={to === '/admin' || to === '/dashboard'} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${icon}`} aria-hidden="true" /><span>{t(key)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="d-flex align-items-center gap-2 px-2 pb-2 text-white">
            <Avatar name={user.name} size="2.4rem" />
            <div className="min-w-0">
              <div className="fw-bold text-truncate">{user.name}</div>
              <div className="small text-truncate" style={{ color: '#9fbd97' }}>{isAdmin ? 'Administrator' : user.location}</div>
            </div>
          </div>
          <button type="button" className="side-link w-100 border-0 bg-transparent text-start" onClick={signOut}>
            <i className="bi bi-box-arrow-left" aria-hidden="true" /><span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button type="button" className="btn btn-outline-primary d-lg-none" aria-label={t('nav.menu')} aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <i className="bi bi-list fs-5" aria-hidden="true" />
          </button>
          {isAdmin && <span className="admin-ribbon">Admin console</span>}
          <div className="ms-auto d-flex align-items-center gap-2">
            <LanguageSwitcher compact />
            {!isAdmin && (
              <button type="button" className="btn btn-outline-primary btn-sm position-relative" onClick={() => cart.setOpen(true)} aria-label={`${t('nav.cart')} (${cart.count})`}>
                <i className="bi bi-cart3" aria-hidden="true" />
                {cart.count > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{cart.count}</span>}
              </button>
            )}
          </div>
        </header>
        <main id="main" className="page-body" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      {!isAdmin && <CartDrawer />}
    </div>
  );
}
