import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { ConfirmModal } from '../components/Modal';
import { StatusBadge } from '../components/Badges';
import OrderTimeline from '../components/OrderTimeline';
import { ErrorState, SkeletonCards } from '../components/feedback';
import { formatDate, formatINR } from '../utils/format';

export default function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const order = useFetch(() => api.get(`/orders/${id}`), [id]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (order.loading) return <SkeletonCards count={2} height="14rem" cols="col-12 col-lg-6" />;
  if (order.error) return <ErrorState message={order.error} onRetry={order.reload} />;
  const o = order.data;
  const cancellable = ['Pending', 'Confirmed'].includes(o.status);

  const cancel = async () => {
    setBusy(true);
    try {
      await api.patch(`/orders/${id}/cancel`);
      toast.success('Order cancelled successfully.');
      setConfirm(false);
      order.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/orders" className="fw-bold text-decoration-none d-inline-block mb-2"><i className="bi bi-arrow-left me-1" aria-hidden="true" />All orders</Link>
      <PageHeader title={`Order ${o.orderNumber}`} subtitle={`Placed on ${formatDate(o.createdAt)}`}
        actions={<><StatusBadge status={o.status} />{cancellable && <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setConfirm(true)}>Cancel order</button>}</>} />
      <div className="row g-4">
        <div className="col-lg-5"><section className="card section-card h-100"><h2 className="h5 mb-3">Tracking</h2><OrderTimeline order={o} /></section></div>
        <div className="col-lg-7 d-grid gap-4 align-content-start">
          <section className="card section-card">
            <h2 className="h5 mb-3">Items</h2>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead><tr><th>Product</th><th className="text-end">Price</th><th className="text-end">Qty</th><th className="text-end">Subtotal</th></tr></thead>
                <tbody>{o.items.map((i) => <tr key={i._id || i.resource}><td>{i.name}<div className="small text-muted">per {i.unit}</div></td><td className="text-end">{formatINR(i.price)}</td><td className="text-end">{i.quantity}</td><td className="text-end fw-bold">{formatINR(i.price * i.quantity)}</td></tr>)}</tbody>
                <tfoot><tr><td colSpan={3} className="text-end fw-bold">Total</td><td className="text-end fs-5 fw-bold">{formatINR(o.totalAmount)}</td></tr></tfoot>
              </table>
            </div>
          </section>
          <section className="card section-card">
            <h2 className="h5 mb-3">Delivery</h2>
            <p className="mb-1 fw-bold">{o.delivery.name} · {o.delivery.phone}</p>
            <p className="mb-2">{o.delivery.address}, {o.delivery.city} – {o.delivery.pincode}</p>
            <p className="small text-muted mb-0"><i className="bi bi-cash-coin me-1" aria-hidden="true" />Payment: {o.paymentMethod}{o.notes ? ` · Note: ${o.notes}` : ''}</p>
          </section>
        </div>
      </div>
      <ConfirmModal show={confirm} busy={busy} title="Cancel this order?" confirmLabel="Yes, cancel order" onConfirm={cancel} onClose={() => setConfirm(false)} message="The reserved items go back to stock. This cannot be undone." />
    </>
  );
}
