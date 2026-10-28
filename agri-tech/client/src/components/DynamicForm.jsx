import { useRef, useState } from 'react';
import { errorMessage, fieldErrors } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { toInputDate } from '../utils/format';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Field config: { name, label, type: text|email|password|tel|number|date|select|textarea|checkbox|tags|lines,
 * options, required, min, max, step, minLength, maxLength, placeholder, help, span (1-12, default 12), inputMode }
 * onSubmit receives a clean payload and may throw — server validation errors are shown under the fields.
 */
const initialValue = (field, initial) => {
  const raw = initial[field.name];
  if (field.type === 'tags') return Array.isArray(raw) ? raw.join(', ') : '';
  if (field.type === 'lines') return Array.isArray(raw) ? raw.join('\n') : '';
  if (field.type === 'date') return toInputDate(raw);
  if (field.type === 'checkbox') return raw === undefined ? Boolean(field.defaultChecked) : Boolean(raw);
  return raw === undefined || raw === null ? '' : String(raw);
};

const toPayload = (fields, values) => {
  const payload = {};
  fields.forEach((field) => {
    const value = values[field.name];
    if (field.type === 'checkbox') payload[field.name] = Boolean(value);
    else if (field.type === 'tags') payload[field.name] = String(value).split(',').map((s) => s.trim()).filter(Boolean);
    else if (field.type === 'lines') payload[field.name] = String(value).split('\n').map((s) => s.trim()).filter(Boolean);
    else if (field.type === 'number') payload[field.name] = value === '' ? '' : Number(value);
    else payload[field.name] = typeof value === 'string' ? value.trim() : value;
  });
  return payload;
};

export default function DynamicForm({ fields, initial = {}, onSubmit, onCancel, submitLabel, children }) {
  const { t } = useLanguage();
  const toast = useToast();
  const formRef = useRef(null);
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, initialValue(f, initial)])));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };

  const validate = () => {
    const found = {};
    fields.forEach((f) => {
      if (f.hidden) return;
      const value = values[f.name];
      const label = f.label;
      const empty = value === '' || value === undefined || value === null || ((f.type === 'tags' || f.type === 'lines') && !String(value).trim());
      if (f.required && f.type !== 'checkbox' && empty) { found[f.name] = `${label} is required.`; return; }
      if (empty) return;
      if (f.type === 'email' && !EMAIL.test(value)) found[f.name] = 'Please enter a valid email address.';
      else if (f.type === 'number') {
        const n = Number(value);
        if (!Number.isFinite(n)) found[f.name] = `${label} must be a number.`;
        else if (f.min !== undefined && n < f.min) found[f.name] = `${label} must be at least ${f.min}.`;
        else if (f.max !== undefined && n > f.max) found[f.name] = `${label} must be at most ${f.max}.`;
        else if (f.integer && !Number.isInteger(n)) found[f.name] = `${label} must be a whole number.`;
      } else if (f.type === 'date' && Number.isNaN(new Date(value).getTime())) found[f.name] = `${label} must be a valid date.`;
      else if (f.minLength && String(value).trim().length < f.minLength) found[f.name] = `${label} must be at least ${f.minLength} characters.`;
      else if (f.maxLength && String(value).length > f.maxLength) found[f.name] = `${label} must be at most ${f.maxLength} characters.`;
      else if (f.pattern && !f.pattern.test(String(value))) found[f.name] = f.patternMessage || `${label} is not in the expected format.`;
    });
    return found;
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      const el = formRef.current && formRef.current.querySelector('[aria-invalid="true"], .is-invalid');
      if (el) el.focus();
      return;
    }
    setSaving(true);
    try {
      await onSubmit(toPayload(fields.filter((f) => !f.hidden), values));
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const renderControl = (f) => {
    const id = `field-${f.name}`;
    const invalid = Boolean(errors[f.name]);
    const common = { id, name: f.name, className: `form-control${invalid ? ' is-invalid' : ''}`, 'aria-invalid': invalid, 'aria-describedby': invalid ? `${id}-err` : undefined, disabled: f.disabled };
    const value = values[f.name];

    if (f.type === 'select') {
      return (
        <select {...common} className={`form-select${invalid ? ' is-invalid' : ''}`} value={value} onChange={(e) => setValue(f.name, e.target.value)}>
          <option value="">{f.placeholder || 'Select…'}</option>
          {(f.options || []).map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
      );
    }
    if (f.type === 'textarea' || f.type === 'lines') {
      return <textarea {...common} rows={f.rows || 3} value={value} placeholder={f.placeholder} onChange={(e) => setValue(f.name, e.target.value)} />;
    }
    if (f.type === 'checkbox') {
      return (
        <div className="form-check form-switch">
          <input id={id} name={f.name} type="checkbox" role="switch" className="form-check-input" checked={Boolean(value)} onChange={(e) => setValue(f.name, e.target.checked)} />
          <label htmlFor={id} className="form-check-label">{f.checkLabel || f.label}</label>
        </div>
      );
    }
    return (
      <input {...common} type={f.type === 'tags' ? 'text' : f.type || 'text'} value={value} placeholder={f.placeholder} min={f.min} max={f.max}
        step={f.type === 'number' ? f.step || 'any' : undefined} inputMode={f.inputMode} autoComplete={f.autoComplete} onChange={(e) => setValue(f.name, e.target.value)} />
    );
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <div className="row g-3">
        {fields.filter((f) => !f.hidden).map((f) => (
          <div key={f.name} className={`col-12 ${f.span && f.span < 12 ? `col-md-${f.span}` : ''}`}>
            {f.type !== 'checkbox' && (
              <label htmlFor={`field-${f.name}`} className="form-label">
                {f.label}{f.required && <span className="text-danger" aria-hidden="true"> *</span>}
              </label>
            )}
            {renderControl(f)}
            {errors[f.name] && <div id={`field-${f.name}-err`} className="invalid-feedback d-block">{errors[f.name]}</div>}
            {f.help && !errors[f.name] && <div className="form-text">{f.help}</div>}
          </div>
        ))}
      </div>
      {children}
      <div className="d-flex justify-content-end gap-2 mt-4">
        {onCancel && <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={saving}>{t('common.cancel')}</button>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {saving ? t('common.saving') : submitLabel || t('common.save')}
        </button>
      </div>
    </form>
  );
}
