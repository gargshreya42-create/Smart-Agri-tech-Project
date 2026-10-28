import { useState } from 'react';
import { api, errorMessage } from '../services/api';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal, { ConfirmModal } from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import Pagination from '../components/Pagination';
import { StatusBadge } from '../components/Badges';
import Avatar from '../components/Avatar';
import { DataState, EmptyState } from '../components/feedback';
import { formatDate, toInputDate } from '../utils/format';

export function ExpertCard({ expert, onSelect }) {
  return (
    <article className="card card-hover h-100">
      <div className="section-card h-100 d-flex flex-column">
        <div className="d-flex gap-3 align-items-center mb-3">
          <Avatar name={expert.name.replace(/^Dr\.?\s+/i, '')} size="3.6rem" />
          <div className="min-w-0"><h3 className="h5 mb-0">{expert.name}</h3><div className="small text-muted">{expert.title}</div></div>
        </div>
        <div className="d-flex flex-wrap gap-2 mb-2">
          <span className="tone tone-green"><i className="bi bi-mortarboard-fill" aria-hidden="true" />{expert.expertise}</span>
          <span className="tone tone-amber"><i className="bi bi-award-fill" aria-hidden="true" />{expert.experienceYears} yrs</span>
        </div>
        <p className="small mb-2">{expert.bio}</p>
        {expert.specializations && expert.specializations.length > 0 && <div className="d-flex flex-wrap gap-1 mb-2">{expert.specializations.map((s) => <span key={s} className="tone tone-grey">{s}</span>)}</div>}
        <div className="small text-muted mt-auto"><i className="bi bi-clock me-1" aria-hidden="true" />{expert.availability}{expert.languages && expert.languages.length ? ` · ${expert.languages.map((l) => ({ en: 'English', hi: 'हिन्दी', mr: 'मराठी' }[l] || l)).join(', ')}` : ''}</div>
        {onSelect && <button type="button" className="btn btn-primary mt-3" onClick={() => onSelect(expert)}><i className="bi bi-chat-heart me-1" aria-hidden="true" />Request consultation</button>}
      </div>
    </article>
  );
}

export default function Experts() {
  const { t } = useLanguage();
  const toast = useToast();
  const [tab, setTab] = useState('experts');
  const [q, setQ] = useState('');
  const search = useDebounce(q);
  const [selected, setSelected] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);

  const experts = useFetch(() => api.get('/experts', { q: search || undefined }), [search]);
  const consultations = useFetch(() => api.get('/consultations', { page }), [page]);
  const crops = useFetch(() => api.get('/crops'), []);
  const cropOptions = [...new Set((crops.data || []).map((c) => c.name))];

  const fields = [
    { name: 'topic', label: 'Topic', required: true, minLength: 5, maxLength: 140, placeholder: 'e.g. Yellowing leaves on wheat' },
    { name: 'crop', label: 'Crop (optional)', type: 'select', options: cropOptions, span: 6 },
    { name: 'preferredDate', label: 'Preferred date (optional)', type: 'date', min: toInputDate(new Date()), span: 6 },
    { name: 'description', label: 'Describe your problem', type: 'textarea', rows: 5, required: true, minLength: 10, maxLength: 2000, help: 'When did it start? Which part of the field? What have you tried?' },
  ];

  const send = async (values) => {
    await api.post('/consultations', { ...values, expert: selected._id });
    toast.success('Consultation request sent successfully.');
    setSelected(null);
    setTab('mine');
    setPage(1);
    consultations.reload();
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await api.patch(`/consultations/${cancelling._id}/status`, { status: 'Cancelled' });
      toast.success('Consultation cancelled.');
      setCancelling(null);
      consultations.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={t('experts.title')} subtitle={t('experts.subtitle')} />
      <ul className="nav nav-pills nav-pills-agri mb-3" role="tablist">
        <li className="nav-item" role="presentation"><button type="button" role="tab" aria-selected={tab === 'experts'} className={`nav-link ${tab === 'experts' ? 'active' : ''}`} onClick={() => setTab('experts')}><i className="bi bi-people me-1" aria-hidden="true" />Find an expert</button></li>
        <li className="nav-item" role="presentation"><button type="button" role="tab" aria-selected={tab === 'mine'} className={`nav-link ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}><i className="bi bi-clock-history me-1" aria-hidden="true" />My consultations</button></li>
      </ul>

      {tab === 'experts' ? (
        <>
          <div className="mb-3" style={{ maxWidth: '26rem' }}><input type="search" className="form-control" placeholder="Search by name, expertise or specialization" aria-label="Search experts" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <DataState loading={experts.loading} error={experts.error} onRetry={experts.reload} isEmpty={experts.data && experts.data.length === 0} empty={<EmptyState icon="bi-search" title={t('common.noResults')} />}>
            <div className="row g-3">{(experts.data || []).map((e) => <div key={e._id} className="col-12 col-md-6 col-xl-4"><ExpertCard expert={e} onSelect={setSelected} /></div>)}</div>
          </DataState>
        </>
      ) : (
        <DataState loading={consultations.loading} error={consultations.error} onRetry={consultations.reload} isEmpty={consultations.data && consultations.data.length === 0}
          empty={<EmptyState icon="bi-chat-heart" title={t('empty.consultations.title')} text={t('empty.consultations.text')} action={<button type="button" className="btn btn-primary" onClick={() => setTab('experts')}>Find an expert</button>} />}>
          <div className="d-grid gap-3">
            {(consultations.data || []).map((c) => (
              <article key={c._id} className="card section-card">
                <div className="d-flex flex-wrap justify-content-between gap-2 mb-1">
                  <div><h3 className="h5 mb-0">{c.topic}</h3><div className="small text-muted">with {c.expert?.name} · {c.expert?.expertise} · requested {formatDate(c.createdAt)}</div></div>
                  <StatusBadge status={c.status} />
                </div>
                {c.crop && <span className="tone tone-lime align-self-start mb-2"><i className="bi bi-flower2" aria-hidden="true" />{c.crop}</span>}
                <p className="mb-2">{c.description}</p>
                {c.preferredDate && <div className="small text-muted mb-2"><i className="bi bi-calendar-event me-1" aria-hidden="true" />Preferred date: {formatDate(c.preferredDate)}</div>}
                {c.expertResponse && <div className="p-3 rounded-3 mb-2" style={{ background: 'var(--leaf-50)' }}><div className="small fw-bold text-uppercase" style={{ color: 'var(--leaf-700)' }}><i className="bi bi-chat-quote me-1" aria-hidden="true" />Expert’s response</div>{c.expertResponse}</div>}
                {['Requested', 'Accepted'].includes(c.status) && <div><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setCancelling(c)}>Cancel request</button></div>}
              </article>
            ))}
          </div>
          <Pagination meta={consultations.meta} onChange={setPage} />
        </DataState>
      )}

      <Modal show={Boolean(selected)} title={selected ? `Consult ${selected.name}` : ''} onClose={() => setSelected(null)}>
        {selected && <><p className="text-muted">{selected.title} · {selected.expertise}</p><DynamicForm fields={fields} onSubmit={send} onCancel={() => setSelected(null)} submitLabel="Send request" /></>}
      </Modal>
      <ConfirmModal show={Boolean(cancelling)} busy={busy} title="Cancel this request?" confirmLabel="Yes, cancel" onConfirm={cancel} onClose={() => setCancelling(null)} message={cancelling ? `Your request "${cancelling.topic}" will be cancelled.` : ''} />
    </>
  );
}
