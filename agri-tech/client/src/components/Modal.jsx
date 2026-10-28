import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';

const SIZES = { sm: 'modal-sm', md: '', lg: 'modal-lg', xl: 'modal-xl' };

export default function Modal({ show, title, onClose, children, footer, size = 'lg' }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [show, onClose]);

  if (!show) return null;
  return createPortal(
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${SIZES[size] || ''}`}>
          <div className="modal-content" style={{ borderRadius: '1.1rem', border: 0 }}>
            <div className="modal-header border-0 pb-0">
              <h2 className="modal-title h4 mb-0">{title}</h2>
              <button type="button" className="btn-close" aria-label={t('common.close')} onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer border-0 pt-0">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body
  );
}

export function ConfirmModal({ show, title, message, confirmLabel, danger = true, busy, onConfirm, onClose }) {
  const { t } = useLanguage();
  return (
    <Modal show={show} title={title} onClose={onClose} size="sm"
      footer={(
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>{t('common.cancel')}</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {confirmLabel || t('common.confirm')}
          </button>
        </>
      )}>
      <p className="mb-0">{message}</p>
    </Modal>
  );
}
