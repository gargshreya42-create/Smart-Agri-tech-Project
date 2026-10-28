import { ALERT_ICONS, STATUS_STYLES } from '../utils/format';

export function StatusBadge({ status, label }) {
  const [tone, icon] = STATUS_STYLES[status] || ['grey', 'bi-circle-fill'];
  return (
    <span className={`tone tone-${tone}`}>
      <i className={`bi ${icon}`} aria-hidden="true" />
      {label || status}
    </span>
  );
}

export function AlertBox({ severity = 'info', title, children, className = '' }) {
  return (
    <div className={`alert-tone ${severity} ${className}`} role={severity === 'danger' ? 'alert' : 'status'}>
      <i className={`bi ${ALERT_ICONS[severity] || ALERT_ICONS.info}`} aria-hidden="true" />
      <div>
        {title && <div className="fw-bold">{title}</div>}
        {children && <div className="small">{children}</div>}
      </div>
    </div>
  );
}

export function Meter({ value, label, className = '' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className={className}>
      <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Progress'}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
