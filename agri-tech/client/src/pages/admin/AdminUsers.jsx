import { api, errorMessage } from '../../services/api';
import useMeta from '../../hooks/useMeta';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import ResourceManager from '../../components/ResourceManager';
import { StatusBadge } from '../../components/Badges';
import { formatDate } from '../../utils/format';

const PHONE = { pattern: /^[+]?[0-9\s-]{10,15}$/, patternMessage: 'Enter a valid phone number (10–15 digits).' };

export default function AdminUsers() {
  const { t } = useLanguage();
  const meta = useMeta();
  const toast = useToast();
  const { user: me } = useAuth();
  const languages = meta.LANGUAGES.map((l) => ({ value: l.code, label: l.label }));

  const fields = (editing) => [
    { name: 'name', label: t('auth.name'), required: true, minLength: 2, maxLength: 80, span: 6 },
    { name: 'email', label: t('auth.email'), type: 'email', required: true, span: 6, hidden: Boolean(editing) },
    { name: 'phone', label: t('auth.phone'), type: 'tel', required: true, span: 6, ...PHONE },
    { name: 'password', label: t('auth.password'), type: 'password', required: true, minLength: 8, maxLength: 72, span: 6, hidden: Boolean(editing), autoComplete: 'new-password',
      pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, patternMessage: 'Password must contain at least one letter and one number.' },
    { name: 'location', label: t('auth.location'), maxLength: 120, span: 6 },
    { name: 'language', label: t('auth.language'), type: 'select', options: languages, span: 6 },
    { name: 'role', label: 'Role', type: 'select', options: [{ value: 'farmer', label: 'Farmer' }, { value: 'admin', label: 'Administrator' }], required: true, span: 6 },
    { name: 'isActive', label: 'Account status', type: 'checkbox', checkLabel: 'Account is active (can sign in)', defaultChecked: true, span: 6, hidden: !editing },
  ];

  const toggleActive = async (row, reload) => {
    try {
      await api.put(`/admin/users/${row._id}`, { isActive: !row.isActive });
      toast.success(row.isActive ? 'User deactivated. Their sessions were signed out.' : 'User activated successfully.');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <ResourceManager
      title={t('nav.users')}
      subtitle="Create accounts, change roles, and activate or deactivate access. Administrator accounts can only be created here."
      endpoint="/admin/users"
      noun="User"
      searchPlaceholder="Name, email, phone or location"
      canDelete={false}
      emptyIcon="bi-people"
      filters={[
        { name: 'role', label: 'Role', options: [{ value: 'farmer', label: 'Farmers' }, { value: 'admin', label: 'Administrators' }] },
        { name: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
      ]}
      columns={[
        { header: 'User', render: (u) => <><div className="fw-bold">{u.name}</div><div className="small text-muted">{u.email}</div></> },
        { header: 'Phone', render: (u) => u.phone },
        { header: 'Location', render: (u) => u.location || '—' },
        { header: 'Role', render: (u) => <span className={`tone ${u.role === 'admin' ? 'tone-indigo' : 'tone-green'}`}><i className={`bi ${u.role === 'admin' ? 'bi-shield-lock-fill' : 'bi-person-fill'}`} aria-hidden="true" />{u.role === 'admin' ? 'Administrator' : 'Farmer'}</span> },
        { header: 'Status', render: (u) => <StatusBadge status={u.isActive ? 'Active' : 'Inactive'} /> },
        { header: 'Joined', render: (u) => formatDate(u.createdAt) },
      ]}
      fields={fields}
      rowActions={({ row, reload }) => row._id !== me._id && (
        <button type="button" className={`btn btn-sm ${row.isActive ? 'btn-outline-secondary' : 'btn-outline-success'}`} onClick={() => toggleActive(row, reload)}>
          <i className={`bi ${row.isActive ? 'bi-pause-circle' : 'bi-play-circle'}`} aria-hidden="true" />
          <span className="d-none d-md-inline ms-1">{row.isActive ? 'Deactivate' : 'Activate'}</span>
        </button>
      )}
    />
  );
}
