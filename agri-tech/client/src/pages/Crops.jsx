import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useMeta from '../hooks/useMeta';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal, { ConfirmModal } from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import CropCard from '../components/CropCard';
import { DataState, EmptyState } from '../components/feedback';

export default function Crops() {
  const { t } = useLanguage();
  const toast = useToast();
  const meta = useMeta();
  const [params, setParams] = useSearchParams();
  const farmFilter = params.get('farm') || '';
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('');
  const [health, setHealth] = useState('');
  const search = useDebounce(q);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const farms = useFetch(() => api.get('/farms'), []);
  const crops = useFetch(() => api.get('/crops', { q: search || undefined, farm: farmFilter || undefined, stage: stage || undefined, health: health || undefined }), [search, farmFilter, stage, health]);

  const farmOptions = (farms.data || []).map((f) => ({ value: f._id, label: f.name }));
  const filtered = Boolean(search || farmFilter || stage || health);

  const fields = [
    { name: 'name', label: 'Crop name', required: true, maxLength: 80, placeholder: 'e.g. Wheat', span: 6 },
    { name: 'variety', label: 'Variety', maxLength: 80, placeholder: 'e.g. Sharbati', span: 6 },
    { name: 'farm', label: 'Farm', type: 'select', required: true, options: farmOptions, help: farmOptions.length ? undefined : 'Add a farm first from the My Farm page.' },
    { name: 'plantingDate', label: 'Planting date', type: 'date', required: true, span: 6 },
    { name: 'expectedHarvestDate', label: 'Expected harvest date', type: 'date', required: true, span: 6 },
    { name: 'growthStage', label: 'Growth stage', type: 'select', options: meta.GROWTH_STAGES, span: 6 },
    { name: 'healthStatus', label: 'Health status', type: 'select', options: meta.CROP_HEALTH, span: 6 },
    { name: 'areaAcres', label: 'Area cultivated (acres)', type: 'number', required: true, min: 0.01, max: 100000, span: 4 },
    { name: 'soilType', label: 'Soil type', type: 'select', options: meta.SOIL_TYPES, span: 4 },
    { name: 'irrigationMethod', label: 'Irrigation method', type: 'select', options: meta.IRRIGATION_TYPES, span: 4 },
    { name: 'notes', label: 'Notes', type: 'textarea', maxLength: 1000 },
  ];

  const save = async (values) => {
    if (values.plantingDate && values.expectedHarvestDate && new Date(values.expectedHarvestDate) <= new Date(values.plantingDate)) {
      const error = new Error('invalid dates');
      error.response = { data: { message: 'Please correct the highlighted fields.', error: { expectedHarvestDate: 'Harvest date must be after the planting date.' } } };
      throw error;
    }
    if (editing._id) {
      await api.put(`/crops/${editing._id}`, values);
      toast.success('Crop updated successfully.');
    } else {
      await api.post('/crops', values);
      toast.success('Crop added successfully.');
    }
    setEditing(null);
    crops.reload();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/crops/${deleting._id}`);
      toast.success('Crop deleted successfully.');
      setDeleting(null);
      crops.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this crop.');
    } finally {
      setBusy(false);
    }
  };

  const openEditor = (crop) => setEditing(crop ? { ...crop, farm: crop.farm && crop.farm._id ? crop.farm._id : crop.farm } : { growthStage: 'Planned', healthStatus: 'Healthy', farm: farmFilter || undefined });
  const addButton = <button type="button" className="btn btn-primary" onClick={() => openEditor()}><i className="bi bi-plus-lg me-1" aria-hidden="true" />{t('crops.add')}</button>;
  const clearFilters = () => { setQ(''); setStage(''); setHealth(''); setParams({}); };

  return (
    <>
      <PageHeader title={t('crops.title')} subtitle={t('crops.subtitle')} actions={addButton} />
      <div className="card section-card mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4"><label className="form-label" htmlFor="crop-q">{t('common.search')}</label><input id="crop-q" type="search" className="form-control" placeholder="Crop or variety" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="col-6 col-md-2"><label className="form-label" htmlFor="crop-farm">Farm</label>
            <select id="crop-farm" className="form-select" value={farmFilter} onChange={(e) => setParams(e.target.value ? { farm: e.target.value } : {})}><option value="">{t('common.all')}</option>{farmOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="col-6 col-md-2"><label className="form-label" htmlFor="crop-stage">Stage</label>
            <select id="crop-stage" className="form-select" value={stage} onChange={(e) => setStage(e.target.value)}><option value="">{t('common.all')}</option>{meta.GROWTH_STAGES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="col-6 col-md-2"><label className="form-label" htmlFor="crop-health">Health</label>
            <select id="crop-health" className="form-select" value={health} onChange={(e) => setHealth(e.target.value)}><option value="">{t('common.all')}</option>{meta.CROP_HEALTH.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="col-6 col-md-2"><button type="button" className="btn btn-outline-secondary w-100" onClick={clearFilters} disabled={!filtered}>{t('common.clear')}</button></div>
        </div>
      </div>

      <DataState loading={crops.loading} error={crops.error} onRetry={crops.reload} isEmpty={crops.data && crops.data.length === 0}
        empty={filtered ? <EmptyState icon="bi-search" title={t('common.noResults')} /> : <EmptyState icon="bi-flower1" title={t('empty.crops.title')} text={t('empty.crops.text')} action={addButton} />}>
        <div className="row g-3">
          {(crops.data || []).map((crop) => <div key={crop._id} className="col-12 col-md-6 col-xl-4"><CropCard crop={crop} onEdit={openEditor} onDelete={setDeleting} /></div>)}
        </div>
      </DataState>

      <Modal show={Boolean(editing)} title={editing && editing._id ? 'Edit crop' : t('crops.add')} onClose={() => setEditing(null)}>
        {editing && <DynamicForm fields={fields} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmModal show={Boolean(deleting)} busy={busy} title="Delete this crop?" confirmLabel={t('common.delete')} onConfirm={remove} onClose={() => setDeleting(null)}
        message={deleting ? `"${deleting.name}" and its tracking record will be removed.` : ''} />
    </>
  );
}
