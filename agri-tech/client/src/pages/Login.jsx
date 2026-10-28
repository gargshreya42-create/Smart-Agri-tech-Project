import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../services/api';
import AuthShell from '../components/AuthShell';
import { AlertBox } from '../components/Badges';
import { homeFor } from '../components/ProtectedRoute';

const DEMO = [
  { label: 'Demo farmer', identifier: 'ramesh.verma@example.com', password: 'Farmer@123' },
  { label: 'Demo admin', identifier: 'admin@smartagritech.in', password: 'Admin@123' },
];

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!form.identifier.trim()) found.identifier = 'Enter your email or phone number.';
    if (!form.password) found.password = 'Enter your password.';
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const user = await login(form.identifier.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const from = location.state && location.state.from;
      const allowed = from && (user.role === 'admin' ? from.startsWith('/admin') : !from.startsWith('/admin'));
      navigate(allowed ? from : homeFor(user), { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSub')}
      footer={<span className="text-muted">{t('auth.noAccount')} <Link to="/register" className="fw-bold">{t('auth.createAccount')}</Link></span>}
    >
      <form onSubmit={submit} noValidate>
        {serverError && <AlertBox severity="danger" className="mb-3" title={serverError} />}
        <div className="mb-3">
          <label htmlFor="identifier" className="form-label">{t('auth.identifier')}</label>
          <input id="identifier" className={`form-control form-control-lg${errors.identifier ? ' is-invalid' : ''}`} autoComplete="username" autoFocus value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })} aria-invalid={Boolean(errors.identifier)} />
          {errors.identifier && <div className="invalid-feedback">{errors.identifier}</div>}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="form-label">{t('auth.password')}</label>
          <div className="input-group input-group-lg has-validation">
            <input id="password" type={showPassword ? 'text' : 'password'} className={`form-control${errors.password ? ' is-invalid' : ''}`} autoComplete="current-password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={Boolean(errors.password)} />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
            </button>
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={busy}>
          {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}{t('auth.signIn')}
        </button>
      </form>
      <div className="mt-4 p-3 rounded-3 bg-white border">
        <div className="small fw-bold text-muted mb-2"><i className="bi bi-lightning-charge-fill text-warning me-1" />{t('auth.demo')} (seed data)</div>
        <div className="d-flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <button key={d.label} type="button" className="btn btn-outline-primary btn-sm" onClick={() => setForm({ identifier: d.identifier, password: d.password })}>{d.label}</button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
