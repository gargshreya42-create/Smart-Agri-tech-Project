import { useState } from 'react';
import { api } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import useMeta from '../../hooks/useMeta';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import DynamicForm from '../../components/DynamicForm';
import Pagination from '../../components/Pagination';
import OrderTimeline from '../../components/OrderTimeline';
import { AlertBox, StatusBadge } from '../../components/Badges';
import { DataState, EmptyState, SkeletonRows } from '../../components/feedback';
import { formatDate, formatINR } from '../../utils/format';

function OrderPanel({ order, transitions, onUpdate, onClose }) {
  const next = transitions[order.status] || [];
  const fields = [
    { name: 'status', label: 'Move order to', type: 'select', options: next, required: true, placeholder: 'Choose next status' },
    { name: 'note', label: 'Note (optional)', maxLength: 200, placeholder: 'e.g. Courier: Delhivery, tracking #12345' },
  ];

  return (
    <div className="row g-4">
      <div className="col-md-5">
        <h3 className="h6 text-uppercase text-muted">Tracking</h3>
        <OrderTimeline order={order} />
      </div>
      <div className="col-md-7 d-grid gap-3 align-content-start">
        <div>
          <h3 className="h6 text-uppercase text-muted">Farmer</h3>
          <div className="fw-bold">{order.user ? order.user.name : 'Removed user'}</div>
          <div className="small text-muted">{order.delivery.name} · {order.delivery.phone}</div>
          <div className="small">{order.delivery.address}, {order.delivery.city} – {order.delivery.pincode}</div>
        </div>
        <div>
          <h3 className="h6 text-uppercase text-muted">Items</h3>
          <ul className="list-unstyled mb-1">
            {order.items.map((i) => <li key={i._id || i.resource} className="d-flex justify-content-between gap-2"><span>{i.name} × {i.quantity}</span><span className="fw-semibold">{formatINR(i.price * i.quantity)}</span></li>)}
          </ul>
          <div className="d-flex justify-content-between border-top pt-2 fw-bold"><span>Total</span><span>{formatINR(order.totalAmount)}</span></div>
        </div>
        {next.length === 0 ? (
          <AlertBox severity={order.status === 'Delivered' ? 'success' : 'info'} title={`This order is ${order.status.toLowerCase()}.`}>No further status changes are possible.</AlertBox>
        ) : (
          <DynamicForm key={`${order._id}-${order.status}`} fields={fields} onSubmit={onUpdate} onCancel={onClose} submitLabel="Update status" />
        )}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { t } = useLanguage();
  const meta = useMeta();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const search = useDebounce(q);
  const orders = useFetch(() => api.get('/orders', { status: status || undefined, q: search || undefined, page, limit: 15 }), [status, search, page]);
  const rows = orders.data || [];
  const filtered = Boolean(status || search);

  const updateStatus = async ({ status: nextStatus, note }) => {
    const res = await api.patch(`/orders/${selected._id}/status`, { status: nextStatus, note });
    toast.success(`Order marked as ${nextStatus}.`);
    // Keep the dialog open on the refreshed order so the timeline shows the new step.
    setSelected({ ...selected, ...res.data, user: selected.user });
    orders.refresh();
  };

  return (
    <>
      <PageHeader title={t('nav.orders')} subtitle="Review every order and move it through confirmation, packing, shipping and delivery." />
      <div className="card section-card mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4"><label className="form-label" htmlFor="ao-q">{t('common.search')}</label><input id="ao-q" type="search" className="form-control" placeholder="Order number, e.g. AGT-2026-0012" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
          <div className="col-12 col-md-8 d-flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            <button type="button" className={`chip-btn ${!status ? 'active' : ''}`} onClick={() => { setStatus(''); setPage(1); }}>{t('common.all')}</button>
            {meta.ORDER_STATUSES.map((s) => <button key={s} type="button" className={`chip-btn ${status === s ? 'active' : ''}`} aria-pressed={status === s} onClick={() => { setStatus(s); setPage(1); }}>{s}</button>)}
          </div>
        </div>
      </div>

      <DataState loading={orders.loading} error={orders.error} onRetry={orders.reload} skeleton={<SkeletonRows />} isEmpty={rows.length === 0}
        empty={<EmptyState icon={filtered ? 'bi-search' : 'bi-bag'} title={filtered ? t('common.noResults') : 'No orders yet'} text={filtered ? undefined : 'Orders appear here as soon as farmers check out.'} />}>
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Order</th><th>Farmer</th><th>Date</th><th>Items</th><th className="text-end">Total</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o._id}>
                    <td className="fw-bold">{o.orderNumber}</td>
                    <td>{o.user ? <>{o.user.name}<div className="small text-muted">{o.user.phone}</div></> : '—'}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{o.items.length}</td>
                    <td className="text-end fw-bold">{formatINR(o.totalAmount)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="text-end"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSelected(o)}><i className="bi bi-truck me-1" aria-hidden="true" />Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination meta={orders.meta} onChange={setPage} />
      </DataState>

      <Modal show={Boolean(selected)} size="xl" title={selected ? `Order ${selected.orderNumber}` : ''} onClose={() => setSelected(null)}>
        {selected && <OrderPanel order={selected} transitions={meta.ORDER_TRANSITIONS} onUpdate={updateStatus} onClose={() => setSelected(null)} />}
      </Modal>
    </>
  );
}
