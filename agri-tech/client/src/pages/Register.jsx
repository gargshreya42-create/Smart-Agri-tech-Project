import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { formError } from '../services/api';
import AuthShell from '../components/AuthShell';
import DynamicForm from '../components/DynamicForm';

export default function Register() {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const fields = [
    { name: 'name', label: t('auth.name'), required: true, minLength: 2, maxLength: 80, autoComplete: 'name' },
    { name: 'email', label: t('auth.email'), type: 'email', required: true, autoComplete: 'email', span: 6 },
    { name: 'phone', label: t('auth.phone'), type: 'tel', required: true, autoComplete: 'tel', inputMode: 'tel', span: 6,
      pattern: /^[+]?[0-9\s-]{10,15}$/, patternMessage: 'Enter a valid phone number (10–15 digits).' },
    { name: 'password', label: t('auth.password'), type: 'password', required: true, minLength: 8, maxLength: 72, autoComplete: 'new-password', span: 6,
      pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, patternMessage: 'Password must contain at least one letter and one number.', help: t('auth.passwordHint') },
    { name: 'confirmPassword', label: t('auth.confirmPassword'), type: 'password', required: true, autoComplete: 'new-password', span: 6 },
    { name: 'location', label: t('auth.location'), required: true, maxLength: 120, placeholder: 'e.g. Berasia, Bhopal' },
    { name: 'language', label: t('auth.language'), type: 'select', options: [{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }, { value: 'mr', label: 'मराठी' }], span: 6 },
    { name: 'role', label: t('auth.role'), type: 'select', options: [{ value: 'farmer', label: t('auth.farmer') }], disabled: true, span: 6 },
  ];

  const onSubmit = async (values) => {
    if (values.password !== values.confirmPassword) throw formError('Please correct the highlighted fields.', { confirmPassword: 'Passwords do not match.' });
    const user = await register({ ...values, role: 'farmer', language: values.language || language });
    toast.success(`Welcome to Smart Agri-Tech, ${user.name.split(' ')[0]}!`);
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSub')}
      footer={<span className="text-muted">{t('auth.haveAccount')} <Link to="/login" className="fw-bold">{t('auth.signIn')}</Link></span>}
    >
      <DynamicForm fields={fields} initial={{ language, role: 'farmer' }} onSubmit={onSubmit} submitLabel={t('auth.createAccount')} />
      <p className="small text-muted mt-3 mb-0"><i className="bi bi-shield-lock me-1" aria-hidden="true" />{t('auth.adminNote')}</p>
    </AuthShell>
  );
}
