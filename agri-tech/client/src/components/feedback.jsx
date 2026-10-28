import { useLanguage } from '../context/LanguageContext';
import SmartImage from './SmartImage';

export function Spinner({ label, className = '' }) {
  const { t } = useLanguage();
  return (
    <div className={`d-flex align-items-center justify-content-center gap-2 py-4 text-muted ${className}`} role="status">
      <span className="spinner-border spinner-border-sm text-primary" aria-hidden="true" />
      <span>{label || t('common.loading')}</span>
    </div>
  );
}

export function SkeletonCards({ count = 3, height = '9rem', cols = 'col-12 col-md-6 col-xl-4' }) {
  return (
    <div className="row g-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cols}>
          <div className="skeleton" style={{ height }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div className="d-grid gap-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton" style={{ height: '2.6rem' }} />)}
    </div>
  );
}

export function EmptyState({ icon = 'bi-flower2', title, text, action, image }) {
  return (
    <div className="empty-state">
      {image ? (
        <SmartImage image={image} ratio="16 / 6" sizes="(min-width: 992px) 40rem, 100vw" zoom={false} className="mx-auto mb-3" style={{ maxWidth: '28rem', borderRadius: '1rem' }} fallbackIcon={icon} fallbackLabel={title} />
      ) : (
        <div className="empty-icon"><i className={`bi ${icon}`} aria-hidden="true" /></div>
      )}
      <h5 className="mb-1">{title}</h5>
      {text && <p className="text-muted mb-3 mx-auto" style={{ maxWidth: '34rem' }}>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="empty-state" role="alert" style={{ borderColor: '#f0b3ad' }}>
      <div className="empty-icon" style={{ background: '#fbdcd8', color: '#991b1b' }}><i className="bi bi-cloud-slash" aria-hidden="true" /></div>
      <h5 className="mb-1">{t('common.errorTitle')}</h5>
      <p className="text-muted mb-3">{message}</p>
      {onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}><i className="bi bi-arrow-clockwise me-2" />{t('common.retry')}</button>}
    </div>
  );
}

// Shows skeleton → error → empty → content for any list-style fetch.
export function DataState({ loading, error, onRetry, isEmpty, empty, skeleton, children }) {
  if (loading) return skeleton || <SkeletonCards />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty) return empty;
  return children;
}
