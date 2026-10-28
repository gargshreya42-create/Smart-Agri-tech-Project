import { useState } from 'react';
import { api } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import useMeta from '../../hooks/useMeta';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import DynamicForm from '../../components/DynamicForm';
import Pagination from '../../components/Pagination';
import { StatusBadge } from '../../components/Badges';
import { DataState, EmptyState, SkeletonRows } from '../../components/feedback';
import { formatDate } from '../../utils/format';

// Mirrors the server's workflow so the dropdown only offers moves the API will accept.
const NEXT = {
  Requested: ['Accepted', 'Cancelled'],
  Accepted: ['In Progress', 'Completed', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export default function ConsultationsPanel() {
  const meta = useMeta();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const list = useFetch(() => api.get('/consultations', { status: status || undefined, page }), [status, page]);
  const rows = list.data || [];

  const save = async ({ status: nextStatus, expertResponse }) => {
    await api.patch(`/consultations/${selected._id}/status`, { status: nextStatus, expertResponse });
    toast.success('Consultation updated successfully.');
    setSelected(null);
    list.reload();
  };

  const fields = selected ? [
    { name: 'status', label: 'Status', type: 'select', required: true, options: [selected.status, ...NEXT[selected.status]], help: NEXT[selected.status].length ? undefined : 'This consultation is closed and its status can no longer change.' },
    { name: 'expertResponse', label: 'Expert response', type: 'textarea', rows: 5, maxLength: 2000, help: 'Shown to the farmer in their consultation history.' },
  ] : [];

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter consultations by status">
        <button type="button" className={`chip-btn ${!status ? 'active' : ''}`} onClick={() => { setStatus(''); setPage(1); }}>All</button>
        {meta.CONSULTATION_STATUSES.map((s) => <button key={s} type="button" className={`chip-btn ${status === s ? 'active' : ''}`} aria-pressed={status === s} onClick={() => { setStatus(s); setPage(1); }}>{s}</button>)}
      </div>
      <DataState loading={list.loading} error={list.error} onRetry={list.reload} skeleton={<SkeletonRows />} isEmpty={rows.length === 0}
        empty={<EmptyState icon="bi-chat-heart" title={status ? 'No consultations with this status' : 'No consultation requests yet'} text="Requests from farmers appear here for review." />}>
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Farmer</th><th>Topic</th><th>Expert</th><th>Requested</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c._id}>
                    <td>{c.farmer ? <><div className="fw-bold">{c.farmer.name}</div><div className="small text-muted">{c.farmer.phone}</div></> : '—'}</td>
                    <td><div className="fw-bold">{c.topic}</div>{c.crop && <div className="small text-muted">Crop: {c.crop}</div>}</td>
                    <td>{c.expert ? c.expert.name : <span className="text-muted">Removed expert</span>}</td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-end"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSelected(c)}><i className="bi bi-reply me-1" aria-hidden="true" />Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination meta={list.meta} onChange={setPage} />
      </DataState>

      <Modal show={Boolean(selected)} title="Review consultation" onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="p-3 rounded-3 mb-3" style={{ background: 'var(--leaf-50)' }}>
              <div className="fw-bold">{selected.topic}</div>
              <div className="small text-muted mb-2">{selected.farmer ? `${selected.farmer.name} · ${selected.farmer.location || selected.farmer.email}` : 'Farmer'}{selected.preferredDate ? ` · prefers ${formatDate(selected.preferredDate)}` : ''}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{selected.description}</div>
            </div>
            <DynamicForm key={selected._id} fields={fields} initial={selected} onSubmit={save} onCancel={() => setSelected(null)} submitLabel="Update consultation" />
          </>
        )}
      </Modal>
    </>
  );
}
