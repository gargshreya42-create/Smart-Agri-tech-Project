import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useMeta from '../hooks/useMeta';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal, { ConfirmModal } from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import { DataState, EmptyState } from '../components/feedback';
import SmartImage from '../components/SmartImage';
import { farmImage } from '../utils/images';

export default function Farms() {
  const { t } = useLanguage();
  const toast = useToast();
  const meta = useMeta();
  const [q, setQ] = useState('');
  const search = useDebounce(q);
  const [editing, setEditing] = useState(null); // null | {} (new) | farm
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const farms = useFetch(() => api.get('/farms', { q: search || undefined }), [search]);

  const fields = [
    { name: 'name', label: 'Farm name', required: true, maxLength: 100, placeholder: 'e.g. Narmada Kinara Farm' },
    { name: 'location', label: 'Location', required: true, maxLength: 150, placeholder: 'Village, district, state' },
    { name: 'sizeAcres', label: 'Farm size (acres)', type: 'number', required: true, min: 0.01, max: 100000, span: 6 },
    { name: 'soilType', label: 'Soil type', type: 'select', required: true, options: meta.SOIL_TYPES, span: 6 },
    { name: 'irrigationType', label: 'Irrigation type', type: 'select', required: true, options: meta.IRRIGATION_TYPES, span: 6 },
    { name: 'farmingType', label: 'Farming type', type: 'select', options: meta.FARMING_TYPES, span: 6 },
    { name: 'primaryCrops', label: 'Primary crops', type: 'tags', help: 'Separate crops with commas, e.g. Wheat, Soybean, Gram' },
    { name: 'imageUrl', label: 'Farm photo URL (optional)', maxLength: 500, placeholder: 'https://…', help: 'Leave empty to use a matching photo automatically.', pattern: /^https?:\/\/\S+$/i, patternMessage: 'The photo link must start with http:// or https://' },
    { name: 'notes', label: 'Additional notes', type: 'textarea', maxLength: 1000 },
  ];

  const save = async (values) => {
    if (editing._id) {
      await api.put(`/farms/${editing._id}`, values);
      toast.success('Farm details updated successfully.');
    } else {
      await api.post('/farms', values);
      toast.success('Farm added successfully.');
    }
    setEditing(null);
    farms.reload();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/farms/${deleting._id}`);
      toast.success('Farm deleted successfully.');
      setDeleting(null);
      farms.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this farm.');
    } finally {
      setBusy(false);
    }
  };

  const addButton = <button type="button" className="btn btn-primary" onClick={() => setEditing({})}><i className="bi bi-plus-lg me-1" aria-hidden="true" />{t('farms.add')}</button>;

  return (
    <>
      <PageHeader title={t('farms.title')} subtitle={t('farms.subtitle')} actions={addButton} />
      <div className="mb-3" style={{ maxWidth: '26rem' }}>
        <div className="input-group">
          <span className="input-group-text bg-white"><i className="bi bi-search" aria-hidden="true" /></span>
          <input type="search" className="form-control" placeholder="Search farms by name or location" aria-label="Search farms" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <DataState loading={farms.loading} error={farms.error} onRetry={farms.reload} isEmpty={farms.data && farms.data.length === 0}
        empty={search ? <EmptyState icon="bi-search" title={t('common.noResults')} /> : <EmptyState icon="bi-geo-alt" title={t('empty.farms.title')} text={t('empty.farms.text')} action={addButton} />}>
        <div className="row g-3">
          {(farms.data || []).map((farm) => (
            <div key={farm._id} className="col-12 col-lg-6">
              <article className="card card-hover h-100">
                <SmartImage image={farmImage(farm)} ratio="16 / 7" sizes="(min-width: 992px) 40vw, 100vw" fallbackIcon="bi-geo-alt" fallbackLabel={`${farm.name} photo unavailable`}>
                  <span className="img-tag"><i className="bi bi-aspect-ratio" aria-hidden="true" />{farm.sizeAcres} acres</span>
                </SmartImage>
                <div className="section-card h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h2 className="h5 mb-0 text-truncate">{farm.name}</h2>
                      <div className="text-muted small"><i className="bi bi-geo-alt me-1" aria-hidden="true" />{farm.location}</div>
                    </div>
                    <span className="tone tone-green"><i className="bi bi-flower2" aria-hidden="true" />{farm.cropCount} crop{farm.cropCount === 1 ? '' : 's'}</span>
                  </div>
                  <div className="row g-2 my-2 text-center">
                    {[['bi-aspect-ratio', `${farm.sizeAcres} acres`, 'Size'], ['bi-layers', farm.soilType, 'Soil'], ['bi-droplet-half', farm.irrigationType, 'Irrigation'], ['bi-leaf', farm.farmingType || '—', 'Farming']].map(([icon, value, label]) => (
                      <div key={label} className="col-6 col-sm-3"><div className="rounded-3 p-2 h-100" style={{ background: 'var(--leaf-50)' }}><i className={`bi ${icon} text-primary`} aria-hidden="true" /><div className="fw-bold small">{value}</div><div className="small text-muted">{label}</div></div></div>
                    ))}
                  </div>
                  {farm.primaryCrops && farm.primaryCrops.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-2">{farm.primaryCrops.map((c) => <span key={c} className="tone tone-lime">{c}</span>)}</div>
                  )}
                  {farm.notes && <p className="small text-muted line-clamp-2 mb-2">{farm.notes}</p>}
                  <div className="d-flex flex-wrap gap-2 mt-auto pt-3 border-top">
                    <Link to={`/crops?farm=${farm._id}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-flower2 me-1" aria-hidden="true" />Crops</Link>
                    <Link to={`/soil?farm=${farm._id}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-layers me-1" aria-hidden="true" />Soil</Link>
                    <Link to={`/weather?location=${encodeURIComponent(farm.location)}`} className="btn btn-sm btn-outline-primary"><i className="bi bi-cloud-sun me-1" aria-hidden="true" />Weather</Link>
                    <button type="button" className="btn btn-sm btn-outline-secondary ms-auto" onClick={() => setEditing(farm)}><i className="bi bi-pencil me-1" aria-hidden="true" />{t('common.edit')}</button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleting(farm)} aria-label={`Delete ${farm.name}`}><i className="bi bi-trash" aria-hidden="true" /></button>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </DataState>

      <Modal show={Boolean(editing)} title={editing && editing._id ? 'Edit farm' : t('farms.add')} onClose={() => setEditing(null)}>
        {editing && <DynamicForm fields={fields} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmModal show={Boolean(deleting)} busy={busy} title="Delete this farm?" confirmLabel={t('common.delete')} onConfirm={remove} onClose={() => setDeleting(null)}
        message={deleting ? `"${deleting.name}" will be removed together with all of its crops and soil records. This cannot be undone.` : ''} />
    </>
  );
}
