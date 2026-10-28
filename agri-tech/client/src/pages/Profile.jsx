import { useState } from 'react';
import { api, formError } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { tokenStore } from '../services/api';
import PageHeader from '../components/PageHeader';
import DynamicForm from '../components/DynamicForm';
import Avatar from '../components/Avatar';
import { ACTIVITY_ICONS, formatDate, timeAgo } from '../utils/format';

export default function Profile({ adminView = false }) {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const activity = useFetch(() => api.get('/users/activity'), []);
  const [passwordKey, setPasswordKey] = useState(0);

  const profileFields = [
    { name: 'name', label: t('auth.name'), required: true, minLength: 2, maxLength: 80 },
    { name: 'phone', label: t('auth.phone'), type: 'tel', required: true, span: 6, pattern: /^[+]?[0-9\s-]{10,15}$/, patternMessage: 'Enter a valid phone number (10–15 digits).' },
    { name: 'language', label: t('auth.language'), type: 'select', options: [{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }, { value: 'mr', label: 'मराठी' }], span: 6 },
    { name: 'location', label: t('auth.location'), required: true, maxLength: 120 },
  ];
  const passwordFields = [
    { name: 'currentPassword', label: 'Current password', type: 'password', required: true, autoComplete: 'current-password' },
    { name: 'newPassword', label: 'New password', type: 'password', required: true, minLength: 8, maxLength: 72, autoComplete: 'new-password', pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, patternMessage: 'Password must contain at least one letter and one number.', help: t('auth.passwordHint'), span: 6 },
    { name: 'confirm', label: t('auth.confirmPassword'), type: 'password', required: true, autoComplete: 'new-password', span: 6 },
  ];

  const saveProfile = async (values) => {
    const res = await api.put('/users/profile', values);
    setUser(res.data.user);
    toast.success('Profile updated successfully.');
  };

  const changePassword = async ({ currentPassword, newPassword, confirm }) => {
    if (newPassword !== confirm) throw formError('Please correct the highlighted fields.', { confirm: 'Passwords do not match.' });
    const res = await api.put('/users/password', { currentPassword, newPassword });
    tokenStore.set(res.data.token); // other devices are signed out; keep this session alive
    toast.success('Password changed successfully.');
    setPasswordKey((k) => k + 1);
  };

  return (
    <>
      <PageHeader title={adminView ? t('nav.settings') : t('profile.title')} subtitle={adminView ? 'Your administrator account and security.' : t('profile.subtitle')} />
      <div className="row g-4">
        <div className="col-lg-7 d-grid gap-4 align-content-start">
          <section className="card section-card">
            <div className="d-flex align-items-center gap-3 mb-3">
              <Avatar name={user.name} size="4.2rem" />
              <div><h2 className="h5 mb-0">{user.name}</h2><div className="small text-muted">{user.email} · {user.role === 'admin' ? 'Administrator' : t('auth.farmer')} · member since {formatDate(user.createdAt)}</div></div>
            </div>
            <DynamicForm fields={profileFields} initial={user} onSubmit={saveProfile} submitLabel="Save profile" />
          </section>
          <section className="card section-card">
            <h2 className="h5 mb-3"><i className="bi bi-shield-lock me-2 text-primary" aria-hidden="true" />Change password</h2>
            <DynamicForm key={passwordKey} fields={passwordFields} onSubmit={changePassword} submitLabel="Update password" />
          </section>
        </div>
        <div className="col-lg-5">
          <section className="card section-card">
            <h2 className="h5 mb-3">{adminView ? 'Platform info' : 'My activity'}</h2>
            {adminView ? (
              <ul className="list-unstyled small d-grid gap-2 mb-0">
                <li><i className="bi bi-shield-check text-success me-2" aria-hidden="true" />Passwords hashed with bcrypt; sessions use signed JWTs.</li>
                <li><i className="bi bi-person-lock text-success me-2" aria-hidden="true" />Admin accounts can only be created by an administrator (Users page).</li>
                <li><i className="bi bi-box-arrow-right text-success me-2" aria-hidden="true" />Changing your password signs out your other devices.</li>
              </ul>
            ) : activity.loading ? <div className="skeleton" style={{ height: '8rem' }} /> : activity.error ? <p className="text-muted mb-0">{activity.error}</p> : activity.data.length === 0 ? <p className="text-muted mb-0">{t('dashboard.noActivity')}</p> : (
              <ul className="list-unstyled d-grid gap-3 mb-0">
                {activity.data.map((a) => <li key={a._id} className="d-flex gap-2"><i className={`bi ${ACTIVITY_ICONS[a.type] || 'bi-dot'} text-primary`} aria-hidden="true" /><div><div className="small fw-semibold">{a.message}</div><div className="small text-muted">{timeAgo(a.createdAt)}</div></div></li>)}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
