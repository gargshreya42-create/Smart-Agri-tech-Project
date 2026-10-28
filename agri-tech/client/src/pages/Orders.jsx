import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useMeta from '../hooks/useMeta';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import { StatusBadge } from '../components/Badges';
import { DataState, EmptyState, SkeletonRows } from '../components/feedback';
import { formatDate, formatINR } from '../utils/format';

export default function Orders() {
  const { t } = useLanguage();
  const meta = useMeta();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(q);
  const orders = useFetch(() => api.get('/orders', { status: status || undefined, q: search || undefined, page }), [status, search, page]);
  const filtered = Boolean(status || search);

  return (
    <>
      <PageHeader title={t('orders.title')} subtitle={t('orders.subtitle')} actions={<Link to="/resources" className="btn btn-primary"><i className="bi bi-shop me-1" aria-hidden="true" />{t('nav.resources')}</Link>} />
      <div className="card section-card mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5"><label className="form-label" htmlFor="ord-q">{t('common.search')}</label><input id="ord-q" type="search" className="form-control" placeholder="Order number, e.g. AGT-2026-0012" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
          <div className="col-12 col-md-7 d-flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            <button type="button" className={`chip-btn ${!status ? 'active' : ''}`} onClick={() => { setStatus(''); setPage(1); }}>{t('common.all')}</button>
            {meta.ORDER_STATUSES.map((s) => <button key={s} type="button" className={`chip-btn ${status === s ? 'active' : ''}`} aria-pressed={status === s} onClick={() => { setStatus(s); setPage(1); }}>{s}</button>)}
          </div>
        </div>
      </div>
      <DataState loading={orders.loading} error={orders.error} onRetry={orders.reload} skeleton={<SkeletonRows />} isEmpty={orders.data && orders.data.length === 0}
        empty={filtered ? <EmptyState icon="bi-search" title={t('common.noResults')} /> : <EmptyState icon="bi-bag" title={t('empty.orders.title')} text={t('empty.orders.text')} action={<Link to="/resources" className="btn btn-primary">{t('nav.resources')}</Link>} />}>
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Order</th><th>Date</th><th>Items</th><th className="text-end">Total</th><th>Status</th><th><span className="visually-hidden">View</span></th></tr></thead>
              <tbody>
                {(orders.data || []).map((o) => (
                  <tr key={o._id}>
                    <td className="fw-bold">{o.orderNumber}</td><td>{formatDate(o.createdAt)}</td>
                    <td className="text-muted">{o.items.length} item{o.items.length === 1 ? '' : 's'}: {o.items.map((i) => i.name).join(', ').slice(0, 48)}{o.items.map((i) => i.name).join(', ').length > 48 ? '…' : ''}</td>
                    <td className="text-end fw-bold">{formatINR(o.totalAmount)}</td><td><StatusBadge status={o.status} /></td>
                    <td className="text-end"><Link to={`/orders/${o._id}`} className="btn btn-sm btn-outline-primary">{t('common.view')}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination meta={orders.meta} onChange={setPage} />
      </DataState>
    </>
  );
}
