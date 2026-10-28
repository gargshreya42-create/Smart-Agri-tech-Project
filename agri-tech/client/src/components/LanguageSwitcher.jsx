import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function LanguageSwitcher({ variant = 'light', compact = false }) {
  const { language, setLanguage, languages, t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const current = languages.find((l) => l.code === language);

  const choose = (code) => {
    setLanguage(code);
    setOpen(false);
    // Remember the choice on the account when signed in (best effort).
    if (user && user.language !== code) api.put('/users/profile', { language: code }).catch(() => {});
  };

  return (
    <div className="position-relative">
      <button type="button" className={`btn btn-sm ${variant === 'dark' ? 'btn-outline-light' : 'btn-outline-primary'}`}
        aria-haspopup="listbox" aria-expanded={open} aria-label={t('nav.language')} onClick={() => setOpen((v) => !v)} onBlur={() => setTimeout(() => setOpen(false), 150)}>
        <i className="bi bi-translate me-1" aria-hidden="true" />{compact ? current.code.toUpperCase() : current.label}
      </button>
      {open && (
        <ul className="list-group position-absolute end-0 mt-1 shadow" style={{ zIndex: 1050, minWidth: '9rem' }} role="listbox">
          {languages.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === language}
              className={`list-group-item list-group-item-action cursor-pointer ${l.code === language ? 'active' : ''}`}
              onMouseDown={() => choose(l.code)}>{l.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
