import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, errorMessage, fieldErrors } from '../services/api';
import { formatINR } from '../utils/format';
import { EmptyState } from './feedback';

const EMPTY = { name: '', phone: '', address: '', city: '', pincode: '' };

export default function CartDrawer() {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState('cart');
  const [delivery, setDelivery] = useState({ ...EMPTY, name: user?.name || '', phone: user?.phone || '' });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const close = () => { cart.setOpen(false); setStep('cart'); setErrors({}); };

  const place = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await api.post('/orders', { items: cart.items.map((i) => ({ resource: i.id, quantity: i.quantity })), delivery, notes: notes || undefined });
      cart.clear();
      close();
      toast.success(`Order ${res.data.orderNumber} placed successfully.`);
      navigate(`/orders/${res.data._id}`);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className="mb-2">
      <label className="form-label" htmlFor={`d-${name}`}>{label}</label>
      <input id={`d-${name}`} className={`form-control${errors[`delivery.${name}`] ? ' is-invalid' : ''}`} value={delivery[name]} required {...props}
        onChange={(e) => setDelivery({ ...delivery, [name]: e.target.value })} />
      {errors[`delivery.${name}`] && <div className="invalid-feedback">{errors[`delivery.${name}`]}</div>}
    </div>
  );

  return (
    <>
      <div className={`offcanvas offcanvas-end ${cart.open ? 'show' : ''}`} tabIndex={-1} style={{ visibility: cart.open ? 'visible' : 'hidden', zIndex: 1060 }} aria-labelledby="cart-title" role="dialog">
        <div className="offcanvas-header">
          <h2 id="cart-title" className="h4 mb-0"><i className="bi bi-cart3 me-2" />{step === 'cart' ? t('nav.cart') : 'Delivery details'}</h2>
          <button type="button" className="btn-close" aria-label={t('common.close')} onClick={close} />
        </div>
        <div className="offcanvas-body d-flex flex-column">
          {cart.items.length === 0 ? (
            <EmptyState icon="bi-cart-x" title="Your cart is empty" text="Add seeds, fertilizers or equipment from the marketplace." />
          ) : step === 'cart' ? (
            <>
              <div className="flex-grow-1 d-grid gap-3 align-content-start">
                {cart.items.map((line) => (
                  <div key={line.id} className="d-flex gap-3 align-items-start border-bottom pb-3">
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold">{line.name}</div>
                      <div className="small text-muted">{formatINR(line.price)} / {line.unit}</div>
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <button type="button" className="btn btn-outline-secondary btn-sm" aria-label={`Decrease ${line.name}`} onClick={() => cart.setQuantity(line.id, line.quantity - 1)}><i className="bi bi-dash" /></button>
                        <span className="fw-bold px-1" aria-live="polite">{line.quantity}</span>
                        <button type="button" className="btn btn-outline-secondary btn-sm" aria-label={`Increase ${line.name}`} onClick={() => cart.setQuantity(line.id, line.quantity + 1)}><i className="bi bi-plus" /></button>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">{formatINR(line.price * line.quantity)}</div>
                      <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => cart.remove(line.id)}>{t('common.delete')}</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3">
                <div className="d-flex justify-content-between fs-5 fw-bold mb-3"><span>{t('common.total')}</span><span>{formatINR(cart.total)}</span></div>
                <button type="button" className="btn btn-primary w-100 btn-lg" onClick={() => setStep('delivery')}>Continue to delivery</button>
              </div>
            </>
          ) : (
            <form onSubmit={place} className="d-flex flex-column flex-grow-1">
              <div className="flex-grow-1">
                {field('name', 'Recipient name', { autoComplete: 'name' })}
                {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel' })}
                {field('address', 'Address', { autoComplete: 'street-address' })}
                <div className="row g-2">
                  <div className="col-7">{field('city', 'City')}</div>
                  <div className="col-5">{field('pincode', 'PIN code', { inputMode: 'numeric', maxLength: 6 })}</div>
                </div>
                <label className="form-label" htmlFor="d-notes">Delivery notes (optional)</label>
                <textarea id="d-notes" className="form-control" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
                {errors.items && <div className="text-danger small mt-2">{errors.items}</div>}
                <p className="small text-muted mt-3 mb-0"><i className="bi bi-cash-coin me-1" />Payment: cash on delivery. Prices are confirmed by the server when you place the order.</p>
              </div>
              <div className="pt-3 d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setStep('cart')} disabled={busy}>{t('common.back')}</button>
                <button type="submit" className="btn btn-primary flex-grow-1" disabled={busy}>
                  {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Place order · {formatINR(cart.total)}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      {cart.open && <div className="offcanvas-backdrop fade show" style={{ zIndex: 1055 }} onClick={close} />}
    </>
  );
}
